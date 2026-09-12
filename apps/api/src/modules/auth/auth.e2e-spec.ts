import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { generate } from 'otplib';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configuration } from '../../config/configuration.js';
import { validate } from '../../config/validation.schema.js';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter.js';
import { PrismaModule } from '../../database/prisma.module.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthModule } from './auth.module.js';
import { TestDbUtils } from '../../../test/test-db-utils.js';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const state: {
    email: string;
    userId: string;
    familyId: string;
    accessToken: string;
    refreshToken: string;
  } = {
    email: '',
    userId: '',
    familyId: '',
    accessToken: '',
    refreshToken: '',
  };

  beforeAll(async () => {
    state.email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          load: [configuration],
          validate,
          envFilePath: ['.env'],
        }),
        PrismaModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
        forbidNonWhitelisted: false,
        validationError: { target: false, value: false },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    // Deterministic first-user role: purge any leftover users/families
    // from earlier (interrupted) runs so the advisory-lock path fires.
    const dbUtils = new TestDbUtils(prisma);
    await dbUtils.resetDb();
  });

  afterAll(async () => {
    if (prisma) {
      const dbUtils = new TestDbUtils(prisma);
      await dbUtils.resetDb();
    }
    if (app) {
      await app.close();
    }
  });

  const password = 'Str0ng!Pa55word';
  const bearer = () => `Bearer ${state.accessToken}`;

  it('registers a user and family (first user super_admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: state.email,
        password,
        firstName: 'E2E',
        lastName: 'Tester',
      })
      .expect(201);

    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe(state.email);
    expect(res.body.user.role).toBe('super_admin');
    expect(res.body.user.otpRequired).toBe(false);
    state.userId = res.body.user.id;
    state.familyId = res.body.user.familyId;
    state.accessToken = res.body.accessToken;
    state.refreshToken = res.body.refreshToken;
  });

  it('rejects a duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: state.email, password, firstName: 'Copy' })
      .expect(409);
  });

  it('returns the profile for the bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', bearer())
      .expect(200);
    expect(res.body.id).toBe(state.userId);
    expect(res.body.role).toBe('super_admin');
  });

  it('rejects /auth/me without a token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('logs in with wrong credentials (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: state.email, password: 'Wrong-Pass!' })
      .expect(401);
  });

  it('logs in, rotates the refresh token, and revokes it on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: state.email, password })
      .expect(200);
    expect(login.body.accessToken).toBeTruthy();

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
  });

  it('enables MFA, requires it at login, then disables it', async () => {
    const setup = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/setup')
      .set('Authorization', bearer())
      .expect(200);
    expect(setup.body.secret).toBeTruthy();
    expect(setup.body.uri).toContain('otpauth://totp/');

    const code = await generate({ secret: setup.body.secret });
    const enabled = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/enable')
      .set('Authorization', bearer())
      .send({ code })
      .expect(200);
    expect(enabled.body.backupCodes).toHaveLength(8);
    const backupCode = enabled.body.backupCodes[0];

    const mfaRequired = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: state.email, password })
      .expect(401);
    expect(mfaRequired.body.error.code).toBe('MFA_REQUIRED');

    const code2 = await generate({ secret: setup.body.secret });
    const withMfa = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: state.email, password, otpCode: code2 })
      .expect(200);
    expect(withMfa.body.accessToken).toBeTruthy();

    const recoveryLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: state.email,
        password,
        otpCode: backupCode.toLowerCase(),
        usage: 'recovery_code',
      })
      .expect(200);
    expect(recoveryLogin.body.accessToken).toBeTruthy();

    const code3 = await generate({ secret: setup.body.secret });
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/disable')
      .set('Authorization', bearer())
      .send({ code: code3 })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: state.email, password })
      .expect(200);
  });

  it('generates passkey registration options for the authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/webauthn/registration/options')
      .set('Authorization', bearer())
      .expect(200);
    expect(res.body.challenge).toBeTruthy();
    expect(res.body.rp.id).toBeTruthy();
  });

  it('returns usernameless passkey login options', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/passkey/options')
      .send({})
      .expect(200);
    expect(res.body.challenge).toBeTruthy();
  });

  it('rejects email-scoped passkey login when the account has no passkeys', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/passkey/options')
      .send({ email: state.email })
      .expect(401);
  });
});

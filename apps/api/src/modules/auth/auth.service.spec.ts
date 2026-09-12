import { createHash } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import { generate, generateSecret } from 'otplib';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { User } from '../../database/generated/prisma/client.js';
import { AuthService } from './auth.service.js';
import { CHALLENGE_STORE } from './challenge-store.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const PASSWORD = 'Str0ng!Password1';

const configValues: Record<string, unknown> = {
  'auth.jwt.accessTokenTtlSeconds': 900,
  'auth.jwt.refreshTokenTtlSeconds': 2_592_000,
  'auth.onboardingState': 'open',
  'app.productName': 'Spend Book',
};

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    family: { create: vi.fn() },
    session: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };
  const jwt = { signAsync: vi.fn() };
  const config = {
    get: vi.fn((key: string) => configValues[key]),
    getOrThrow: vi.fn((key: string) => configValues[key]),
  };
  const challenges = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

  const makeUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'member',
    familyId: 'family-1',
    active: true,
    otpRequired: false,
    otpSecret: null,
    otpBackupCodes: [],
    passwordDigest: hashSync(PASSWORD),
    webauthnId: 'abc',
    onboardedAt: null,
    lastLoginAt: null,
    ...overrides,
  });

  const makeSession = (overrides: Record<string, unknown> = {}) => ({
    id: 'session-1',
    userId: 'user-1',
    refreshTokenDigest: 'digest',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    data: {},
    ...overrides,
  });

  const mockTransaction = (txOverrides: Record<string, unknown> = {}) => {
    const tx = {
      $executeRaw: vi.fn(),
      user: {
        count: vi.fn().mockResolvedValue(0),
        create: vi
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve(makeUser({ role: data.role })),
          ),
      },
      family: { create: vi.fn().mockResolvedValue({ id: 'family-1' }) },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: unknown) => unknown) =>
        callback({ ...tx, ...txOverrides }),
    );
    return tx;
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: CHALLENGE_STORE, useValue: challenges },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    jwt.signAsync.mockResolvedValue('access-token');
    prisma.session.create.mockResolvedValue(makeSession());
    prisma.user.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(makeUser(data)),
    );
  });

  describe('register', () => {
    it('makes the first user the super_admin and creates a family', async () => {
      const tx = mockTransaction();
      prisma.user.findUnique.mockResolvedValue(null);
      tx.user.count.mockResolvedValue(0);

      const response = await service.register({
        email: 'ada@example.com',
        password: PASSWORD,
        firstName: 'Ada',
        timezone: 'America/New_York',
      } as RegisterDto);

      const created = tx.user.create.mock.calls[0][0].data;
      expect(created.role).toBe('super_admin');
      expect(tx.family.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timezone: 'America/New_York' }),
        }),
      );
      expect(created.webauthnId).toBeTruthy();
      expect(response.accessToken).toBe('access-token');
      expect(response.user.role).toBe('super_admin');
    });

    it('assigns member to subsequent users', async () => {
      const tx = mockTransaction();
      tx.user.count.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValue(null);
      await service.register({
        email: 'grace@example.com',
        password: PASSWORD,
      } as RegisterDto);
      expect(tx.user.create.mock.calls[0][0].data.role).toBe('member');
    });

    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      await expect(
        service.register({
          email: 'Ada@Example.com',
          password: PASSWORD,
        } as RegisterDto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown user with a generic message', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({
          email: 'ghost@example.com',
          password: PASSWORD,
        } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      await expect(
        service.login({
          email: 'ada@example.com',
          password: 'Wrong-Pass!',
        } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('asks for an MFA code when the account requires it', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ otpRequired: true }));
      await expect(
        service.login({
          email: 'ada@example.com',
          password: PASSWORD,
        } as LoginDto),
      ).rejects.toMatchObject({ response: { code: 'MFA_REQUIRED' } });
      expect(prisma.session.create).not.toHaveBeenCalled();
    });

    it('accepts a valid TOTP code to complete login', async () => {
      const secret = generateSecret();
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ otpRequired: true, otpSecret: secret }),
      );
      const code = await generate({ secret });
      const response = await service.login({
        email: 'ada@example.com',
        password: PASSWORD,
        otpCode: code,
      } as LoginDto);
      expect(response.refreshToken).toBeTruthy();
      expect(prisma.session.create).toHaveBeenCalledTimes(1);
    });

    it('consumes a recovery code (case insensitively)', async () => {
      const digest = hashSync('ABCD1234EF56');
      const user = makeUser({ otpRequired: true, otpBackupCodes: [digest] });
      prisma.user.findUnique.mockResolvedValue(user);
      const response = await service.login({
        email: 'ada@example.com',
        password: PASSWORD,
        otpCode: 'abcd1234ef56',
        usage: 'recovery_code',
      } as LoginDto);
      expect(response.refreshToken).toBeTruthy();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ otpBackupCodes: [] }),
        }),
      );
    });
  });

  describe('refresh', () => {
    it('rotates the session and issues a new token pair', async () => {
      prisma.session.findUnique.mockResolvedValue(makeSession());
      prisma.user.findUnique.mockResolvedValue(makeUser());
      const response = await service.refresh({
        refreshToken: 'rotating-token',
      });

      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      expect(prisma.session.create).toHaveBeenCalledTimes(1);
      const digest = createHash('sha256')
        .update(response.refreshToken)
        .digest('hex');
      expect(
        prisma.session.create.mock.calls[0][0].data.refreshTokenDigest,
      ).toBe(digest);
    });

    it('rejects a revoked or expired session', async () => {
      prisma.session.findUnique.mockResolvedValue(
        makeSession({ revokedAt: new Date() }),
      );
      await expect(
        service.refresh({ refreshToken: 'dead' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      prisma.session.findUnique.mockResolvedValue(
        makeSession({ expiresAt: new Date(0) }),
      );
      await expect(
        service.refresh({ refreshToken: 'expired' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the matching session', async () => {
      prisma.session.findUnique.mockResolvedValue(makeSession());
      await service.logout({ refreshToken: 'bye' });
      expect(prisma.session.update).toHaveBeenCalled();
    });

    it('is a no-op for an unknown refresh token', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      await expect(
        service.logout({ refreshToken: 'ghost' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('MFA setup/enable/disable', () => {
    const principal = {
      id: 'user-1',
      email: 'ada@example.com',
      role: 'member',
      familyId: 'family-1',
    };

    it('returns a TOTP secret and URI, persisted only on enable', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      const setup = await service.setupMfa(principal);
      expect(setup.secret).toBeTruthy();
      expect(setup.uri).toContain('otpauth://totp/');
      expect(challenges.set).toHaveBeenCalledWith(
        'auth:mfa-setup:user-1',
        setup.secret,
        600,
      );
    });

    it('starts enabling MFA and returns 8 backup codes', async () => {
      const secret = generateSecret();
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue(secret);
      const code = await generate({ secret });
      const result = await service.enableMfa(principal, { code });
      expect(result.backupCodes).toHaveLength(8);
      const update = prisma.user.update.mock.calls[0][0].data;
      expect(update.otpRequired).toBe(true);
      expect(update.otpSecret).toBe(secret);
      expect(update.otpBackupCodes).toHaveLength(8);
      expect(challenges.delete).toHaveBeenCalledWith('auth:mfa-setup:user-1');
    });

    it('rejects enable without a pending setup', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue(null);
      await expect(
        service.enableMfa(principal, { code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('disables MFA with a valid TOTP code', async () => {
      const secret = generateSecret();
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ otpRequired: true, otpSecret: secret }),
      );
      const code = await generate({ secret });
      await service.disableMfa(principal, { code });
      const update = prisma.user.update.mock.calls[0][0].data;
      expect(update.otpRequired).toBe(false);
      expect(update.otpSecret).toBeNull();
      expect(update.otpBackupCodes).toEqual([]);
    });
  });

  describe('createAuthResponse', () => {
    it('signs an access token and stores the refresh token digest', async () => {
      const user = makeUser() as unknown as User;
      const response = await service.createAuthResponse(user, {
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
      });
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'access', sub: user.id }),
        expect.objectContaining({ expiresIn: 900 }),
      );
      const sessionData = prisma.session.create.mock.calls[0][0].data;
      expect(sessionData.ipAddress).toBe('127.0.0.1');
      expect(sessionData.userAgent).toBe('vitest');
      const expectedDigest = createHash('sha256')
        .update(response.refreshToken)
        .digest('hex');
      expect(sessionData.refreshTokenDigest).toBe(expectedDigest);
    });
  });
});

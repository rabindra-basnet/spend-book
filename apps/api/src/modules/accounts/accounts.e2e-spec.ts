import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'node:http';
import { AppModule } from '../../app.module.js';
import { PrismaService } from '../../database/prisma.service.js';
import { TestDbUtils } from '../../../test/test-db-utils.js';

describe('Accounts API & Family Scoping (e2e)', () => {
  let app: INestApplication<Server>;
  let prisma: PrismaService;

  let familyAToken: string;
  let familyBToken: string;
  let accountAId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const dbUtils = new TestDbUtils(prisma);
    await dbUtils.resetDb();

    // Register User A
    const userA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'acc_user_a@example.com',
        password: 'Str0ng!PasswordA',
        familyName: 'Accounts Family A',
      })
      .expect(201);
    familyAToken = userA.body.accessToken;

    // Register User B
    const userB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'acc_user_b@example.com',
        password: 'Str0ng!PasswordB',
        familyName: 'Accounts Family B',
      })
      .expect(201);
    familyBToken = userB.body.accessToken;
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

  it('Family A creates an account', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${familyAToken}`)
      .send({
        name: 'Checking Account A',
        accountType: 'depository',
        balance: 1500.5,
        currency: 'USD',
      })
      .expect(201);

    expect(res.body.name).toBe('Checking Account A');
    accountAId = res.body.id;
  });

  it('Family A can retrieve its accounts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${familyAToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(accountAId);
  });

  it('Family B cannot view Family A account (family-scoped 404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/accounts/${accountAId}`)
      .set('Authorization', `Bearer ${familyBToken}`)
      .expect(404);
  });
});

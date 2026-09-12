import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'node:http';
import { AppModule } from '../../app.module.js';
import { PrismaService } from '../../database/prisma.service.js';
import { TestDbUtils } from '../../../test/test-db-utils.js';

describe('Transactions API & Family Isolation (e2e)', () => {
  let app: INestApplication<Server>;
  let prisma: PrismaService;

  let familyAToken: string;
  let familyBToken: string;
  let accountAId: string;
  let accountBId: string;
  let transactionAId: string;

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

    // Setup Family A
    const userA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'tx_user_a@example.com',
        password: 'Str0ng!PasswordA',
        familyName: 'Tx Family A',
      })
      .expect(201);
    familyAToken = userA.body.accessToken;

    const accA = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${familyAToken}`)
      .send({ name: 'Acc A1', accountType: 'depository', balance: 1000 })
      .expect(201);
    accountAId = accA.body.id;

    // Setup Family B
    const userB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'tx_user_b@example.com',
        password: 'Str0ng!PasswordB',
        familyName: 'Tx Family B',
      })
      .expect(201);
    familyBToken = userB.body.accessToken;

    const accB = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${familyBToken}`)
      .send({ name: 'Acc B1', accountType: 'depository', balance: 500 })
      .expect(201);
    accountBId = accB.body.id;
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

  it('Family A creates a transaction', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${familyAToken}`)
      .send({
        accountId: accountAId,
        name: 'Grocery Shopping',
        amount: -85.5,
      })
      .expect(201);

    expect(res.body.name).toBe('Grocery Shopping');
    expect(res.body.accountId).toBe(accountAId);
    transactionAId = res.body.id;
  });

  it('Family A lists its transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${familyAToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('Family B cannot access Family A transaction (404 isolation)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/transactions/${transactionAId}`)
      .set('Authorization', `Bearer ${familyBToken}`)
      .expect(404);
  });

  it('Family A splits transaction', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/transactions/${transactionAId}/split`)
      .set('Authorization', `Bearer ${familyAToken}`)
      .send({
        splits: [
          { name: 'Food', amount: -50 },
          { name: 'Household', amount: -35.5 },
        ],
      })
      .expect(201);

    expect(res.body).toHaveLength(2);
  });
});

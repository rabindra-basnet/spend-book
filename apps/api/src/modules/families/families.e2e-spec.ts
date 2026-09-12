import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'node:http';
import { AppModule } from '../../app.module.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('Cross-Family Data Isolation (e2e)', () => {
  let app: INestApplication<Server>;
  let prisma: PrismaService;

  let familyAToken: string;
  let familyBToken: string;
  let familyAId: string;
  let familyBId: string;

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

    // Register User A (Family A)
    const userA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'usera@example.com',
        password: 'Str0ng!PasswordA',
        familyName: 'Family A',
      })
      .expect(201);
    familyAToken = userA.body.accessToken;
    familyAId = userA.body.user.familyId;

    // Register User B (Family B)
    const userB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'userb@example.com',
        password: 'Str0ng!PasswordB',
        familyName: 'Family B',
      })
      .expect(201);
    familyBToken = userB.body.accessToken;
    familyBId = userB.body.user.familyId;
  });

  afterAll(async () => {
    if (prisma) {
      const e2eUsers = await prisma.user.findMany({
        where: { email: { in: ['usera@example.com', 'userb@example.com'] } },
        select: { id: true, familyId: true },
      });
      if (e2eUsers.length > 0) {
        const ids = e2eUsers.map((u) => u.id);
        const familyIds = e2eUsers.map((u) => u.familyId);
        await prisma.accountShare.deleteMany({
          where: { userId: { in: ids } },
        });
        await prisma.balance.deleteMany({
          where: { account: { familyId: { in: familyIds } } },
        });
        await prisma.account.deleteMany({
          where: { familyId: { in: familyIds } },
        });
        await prisma.session.deleteMany({ where: { userId: { in: ids } } });
        await prisma.webauthnCredential.deleteMany({
          where: { userId: { in: ids } },
        });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
        await prisma.family.deleteMany({ where: { id: { in: familyIds } } });
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('User A only gets details for Family A, not Family B', async () => {
    const resA = await request(app.getHttpServer())
      .get('/api/v1/families/current')
      .set('Authorization', `Bearer ${familyAToken}`)
      .expect(200);

    expect(resA.body.id).toBe(familyAId);
    expect(resA.body.id).not.toBe(familyBId);
  });

  it('User B only gets details for Family B, not Family A', async () => {
    const resB = await request(app.getHttpServer())
      .get('/api/v1/families/current')
      .set('Authorization', `Bearer ${familyBToken}`)
      .expect(200);

    expect(resB.body.id).toBe(familyBId);
    expect(resB.body.id).not.toBe(familyAId);
  });
});

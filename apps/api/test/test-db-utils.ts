import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src/database/prisma.service.js';

@Injectable()
export class TestDbUtils {
  constructor(private readonly prisma: PrismaService) {}

  async resetDb() {
    await this.prisma.goalPledge.deleteMany({});
    await this.prisma.balance.deleteMany({});
    await this.prisma.entry.deleteMany({});
    await this.prisma.transaction.deleteMany({});
    await this.prisma.category.deleteMany({});
    await this.prisma.merchant.deleteMany({});
    await this.prisma.tag.deleteMany({});
    await this.prisma.rule.deleteMany({});
    await this.prisma.budget.deleteMany({});
    await this.prisma.goal.deleteMany({});
    await this.prisma.accountShare.deleteMany({});
    await this.prisma.account.deleteMany({});
    await this.prisma.invitation.deleteMany({});
    await this.prisma.session.deleteMany({});
    await this.prisma.webauthnCredential.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.family.deleteMany({});
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(familyId: string) {
    return this.prisma.account.findMany({
      where: { familyId },
      orderBy: { name: 'asc' },
    });
  }

  async getAccount(account: { id: string; familyId: string }) {
    const record = await this.prisma.account.findFirst({
      where: { id: account.id, familyId: account.familyId },
      include: {
        balances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        holdings: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Account with ID ${account.id} not found`);
    }

    return record;
  }

  async createAccount(familyId: string, userId: string, dto: CreateAccountDto) {
    const currency = dto.currency ?? 'USD';

    return this.prisma.account.create({
      data: {
        familyId,
        name: dto.name,
        currency,
        accountableType: dto.accountType,
        balances: {
          create: {
            date: new Date(),
            balance: dto.balance,
            currency,
          },
        },
      },
    });
  }

  async updateAccount(
    account: { id: string; familyId: string },
    dto: UpdateAccountDto,
  ) {
    const record = await this.prisma.account.findFirst({
      where: { id: account.id, familyId: account.familyId },
    });

    if (!record) {
      throw new NotFoundException(`Account with ID ${account.id} not found`);
    }

    return this.prisma.account.update({
      where: { id: account.id },
      data: {
        name: dto.name,
        currency: dto.currency,
      },
    });
  }

  async getBalanceHistory(account: { id: string; familyId: string }) {
    await this.getAccount(account);
    return this.prisma.balance.findMany({
      where: { accountId: account.id },
      orderBy: { date: 'asc' },
    });
  }

  async getHoldings(account: { id: string; familyId: string }) {
    await this.getAccount(account);
    return this.prisma.holding.findMany({
      where: { accountId: account.id },
      include: {
        security: true,
      },
    });
  }
}

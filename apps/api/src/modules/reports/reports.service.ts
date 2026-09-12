import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { ReportQueryDto, PeriodType } from './dto/report-query.dto.js';
import type {
  BalanceSheetEntity,
  IncomeStatementEntity,
  CategoryBreakdownEntity,
  TrendPointEntity,
  MoneyEntity,
} from './entities/report.entity.js';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getBalanceSheet(familyId: string): Promise<BalanceSheetEntity> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { currency: true },
    });

    if (!family) {
      throw new Error('Family not found');
    }

    const accounts = await this.prisma.account.findMany({
      where: {
        familyId,
        status: 'active',
        excludeFromReports: false,
      },
      include: {
        balances: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    const assetGroups: CategoryBreakdownEntity[] = [];
    const liabilityGroups: CategoryBreakdownEntity[] = [];

    for (const account of accounts) {
      const latestBalance = account.balances[0];
      if (!latestBalance) continue;

      const balance = Number(latestBalance.balance);
      const classification = this.getAccountClassification(account.accountableType);

      if (classification === 'asset') {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    return {
      currency: family.currency,
      netWorth: {
        netWorth: { amount: netWorth, currency: family.currency },
        assets: { amount: totalAssets, currency: family.currency },
        liabilities: { amount: totalLiabilities, currency: family.currency },
      },
      assetGroups,
      liabilityGroups,
    };
  }

  async getIncomeStatement(
    familyId: string,
    query: ReportQueryDto,
  ): Promise<IncomeStatementEntity> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { currency: true },
    });

    if (!family) {
      throw new Error('Family not found');
    }

    const { startDate, endDate } = this.resolveDateRange(query);

    const entries = await this.prisma.entry.findMany({
      where: {
        account: { familyId, status: 'active', excludeFromReports: false },
        entryableType: 'Transaction',
        excluded: false,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        account: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();

    for (const entry of entries) {
      const amount = Number(entry.amount);

      if (amount < 0) {
        totalIncome += Math.abs(amount);
      } else {
        totalExpense += amount;
      }
    }

    const netSavings = totalIncome - totalExpense;

    const trends = await this.getTrends(familyId, startDate, endDate);

    return {
      currency: family.currency,
      totals: {
        income: { amount: totalIncome, currency: family.currency },
        expense: { amount: totalExpense, currency: family.currency },
        netSavings: { amount: netSavings, currency: family.currency },
      },
      incomeByCategory: Array.from(incomeByCategory.entries()).map(([id, total]) => ({
        categoryId: id,
        categoryName: '',
        categoryColor: '',
        total,
        weight: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
      })),
      expenseByCategory: Array.from(expenseByCategory.entries()).map(([id, total]) => ({
        categoryId: id,
        categoryName: '',
        categoryColor: '',
        total,
        weight: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      })),
      trends,
    };
  }

  async getNetWorth(familyId: string): Promise<MoneyEntity> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { currency: true },
    });

    if (!family) {
      throw new Error('Family not found');
    }

    const accounts = await this.prisma.account.findMany({
      where: {
        familyId,
        status: 'active',
        excludeFromReports: false,
      },
      include: {
        balances: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    let netWorth = 0;

    for (const account of accounts) {
      const latestBalance = account.balances[0];
      if (!latestBalance) continue;

      const balance = Number(latestBalance.balance);
      const classification = this.getAccountClassification(account.accountableType);

      if (classification === 'asset') {
        netWorth += balance;
      } else {
        netWorth -= Math.abs(balance);
      }
    }

    return { amount: netWorth, currency: family.currency };
  }

  async getSpendingByCategory(
    familyId: string,
    query: ReportQueryDto,
  ): Promise<CategoryBreakdownEntity[]> {
    const { startDate, endDate } = this.resolveDateRange(query);

    const entries = await this.prisma.entry.findMany({
      where: {
        account: { familyId, status: 'active', excludeFromReports: false },
        entryableType: 'Transaction',
        excluded: false,
        date: { gte: startDate, lte: endDate },
        amount: { gt: 0 },
      },
      include: {
        account: true,
      },
    });

    const categoryTotals = new Map<string, { total: number; name: string; color: string }>();
    let grandTotal = 0;

    for (const entry of entries) {
      const amount = Number(entry.amount);
      grandTotal += amount;
    }

    return Array.from(categoryTotals.entries())
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        categoryColor: data.color,
        total: data.total,
        weight: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  private async getTrends(
    familyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TrendPointEntity[]> {
    const trends: TrendPointEntity[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const entries = await this.prisma.entry.findMany({
        where: {
          account: { familyId, status: 'active', excludeFromReports: false },
          entryableType: 'Transaction',
          excluded: false,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true },
      });

      let income = 0;
      let expenses = 0;

      for (const entry of entries) {
        const amount = Number(entry.amount);
        if (amount < 0) {
          income += Math.abs(amount);
        } else {
          expenses += amount;
        }
      }

      trends.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        income,
        expenses,
        net: income - expenses,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }

  private resolveDateRange(query: ReportQueryDto): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      const periodType = query.periodType || PeriodType.MONTHLY;

      switch (periodType) {
        case PeriodType.MONTHLY:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case PeriodType.QUARTERLY:
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
          break;
        case PeriodType.YTD:
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        case PeriodType.LAST_6_MONTHS:
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    return { startDate, endDate };
  }

  private getAccountClassification(accountableType: string | null): 'asset' | 'liability' {
    const liabilityTypes = ['credit_card', 'loan', 'other_liability'];
    return liabilityTypes.includes(accountableType || '') ? 'liability' : 'asset';
  }
}

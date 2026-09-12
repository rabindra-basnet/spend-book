import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { PeriodType } from './dto/report-query.dto.js';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    family: {
      findUnique: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
    },
    entry: {
      findMany: vi.fn(),
    },
  };

  const mockConfig = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getBalanceSheet', () => {
    it('should return balance sheet with net worth', async () => {
      mockPrisma.family.findUnique.mockResolvedValue({ currency: 'USD' });
      mockPrisma.account.findMany.mockResolvedValue([
        {
          id: 'acc1',
          accountableType: 'depository',
          status: 'active',
          excludeFromReports: false,
          balances: [{ balance: 1000 }],
        },
        {
          id: 'acc2',
          accountableType: 'loan',
          status: 'active',
          excludeFromReports: false,
          balances: [{ balance: -500 }],
        },
      ]);

      const result = await service.getBalanceSheet('family1');

      expect(result.netWorth.netWorth.amount).toBe(500);
      expect(result.netWorth.assets.amount).toBe(1000);
      expect(result.netWorth.liabilities.amount).toBe(500);
      expect(result.currency).toBe('USD');
    });

    it('should handle empty accounts', async () => {
      mockPrisma.family.findUnique.mockResolvedValue({ currency: 'USD' });
      mockPrisma.account.findMany.mockResolvedValue([]);

      const result = await service.getBalanceSheet('family1');

      expect(result.netWorth.netWorth.amount).toBe(0);
      expect(result.netWorth.assets.amount).toBe(0);
      expect(result.netWorth.liabilities.amount).toBe(0);
    });

    it('should throw if family not found', async () => {
      mockPrisma.family.findUnique.mockResolvedValue(null);

      await expect(service.getBalanceSheet('family1')).rejects.toThrow('Family not found');
    });
  });

  describe('getNetWorth', () => {
    it('should calculate net worth correctly', async () => {
      mockPrisma.family.findUnique.mockResolvedValue({ currency: 'USD' });
      mockPrisma.account.findMany.mockResolvedValue([
        {
          accountableType: 'depository',
          balances: [{ balance: 2000 }],
        },
        {
          accountableType: 'credit_card',
          balances: [{ balance: -500 }],
        },
      ]);

      const result = await service.getNetWorth('family1');

      expect(result.amount).toBe(1500);
      expect(result.currency).toBe('USD');
    });
  });

  describe('getIncomeStatement', () => {
    it('should calculate income and expenses', async () => {
      mockPrisma.family.findUnique.mockResolvedValue({ currency: 'USD' });
      mockPrisma.entry.findMany.mockResolvedValue([
        { amount: -1000 },
        { amount: -500 },
        { amount: 300 },
        { amount: 200 },
      ]);

      const result = await service.getIncomeStatement('family1', {
        periodType: PeriodType.MONTHLY,
      });

      expect(result.totals.income.amount).toBe(1500);
      expect(result.totals.expense.amount).toBe(500);
      expect(result.totals.netSavings.amount).toBe(1000);
    });
  });
});

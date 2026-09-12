import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('GoalsService - Rollover Math & Progress Calculations', () => {
  let service: GoalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('calculates 0% progress for a goal with no pledges', () => {
    const goal = {
      targetAmount: 5000,
      createdAt: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      goalPledges: [],
    };

    const res = service.calculateGoalProgress(goal);
    expect(res.percentage).toBe(0);
    expect(res.completedAmount).toBe(0);
    expect(res.remainingAmount).toBe(5000);
  });

  it('calculates progress accurately with accumulated pledges', () => {
    const goal = {
      targetAmount: 1000,
      createdAt: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      goalPledges: [
        { amount: 250, status: 'open' },
        { amount: 250, status: 'matched' },
      ],
    };

    const res = service.calculateGoalProgress(goal);
    expect(res.percentage).toBe(50);
    expect(res.completedAmount).toBe(500);
    expect(res.remainingAmount).toBe(500);
  });

  it('caps percentage at 100% when goal is overfunded', () => {
    const goal = {
      targetAmount: 500,
      createdAt: new Date('2026-01-01'),
      targetDate: new Date('2026-06-01'),
      goalPledges: [{ amount: 750, status: 'open' }],
    };

    const res = service.calculateGoalProgress(goal);
    expect(res.percentage).toBe(100);
    expect(res.completedAmount).toBe(750);
    expect(res.remainingAmount).toBe(0);
  });
});

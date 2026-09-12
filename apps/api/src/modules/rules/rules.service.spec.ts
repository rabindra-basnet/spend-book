import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from './rules.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('RulesService', () => {
  let service: RulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
  });

  it('evaluates equals condition', () => {
    const condition = {
      operator: 'equals',
      property: 'name',
      value: 'Starbucks',
    };
    expect(
      service.evaluateCondition(condition, { name: 'Starbucks', amount: -5 }),
    ).toBe(true);
    expect(
      service.evaluateCondition(condition, { name: 'Dunkin', amount: -5 }),
    ).toBe(false);
  });

  it('evaluates contains condition case insensitively', () => {
    const condition = {
      operator: 'contains',
      property: 'name',
      value: 'coffee',
    };
    expect(
      service.evaluateCondition(condition, {
        name: 'Artisan Coffee Shop',
        amount: -6,
      }),
    ).toBe(true);
  });

  it('evaluates greater_than amount condition', () => {
    const condition = {
      operator: 'greater_than',
      property: 'amount',
      value: '100',
    };
    expect(
      service.evaluateCondition(condition, { name: 'Tech Store', amount: 250 }),
    ).toBe(true);
    expect(
      service.evaluateCondition(condition, { name: 'Snack', amount: 5 }),
    ).toBe(false);
  });
});

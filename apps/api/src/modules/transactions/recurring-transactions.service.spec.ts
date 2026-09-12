import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecurringTransactionsService } from './recurring-transactions.service.js';

describe('RecurringTransactionsService', () => {
  let service: RecurringTransactionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      recurringTransaction: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      recurringOccurrence: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new RecurringTransactionsService(mockPrisma);
  });

  it('lists recurring transactions for a family', async () => {
    const mockList = [{ id: 'rt-1', familyId: 'fam-1', name: 'Rent' }];
    mockPrisma.recurringTransaction.findMany.mockResolvedValue(mockList);

    const result = await service.listRecurringTransactions('fam-1');

    expect(mockPrisma.recurringTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'fam-1' },
      }),
    );
    expect(result).toEqual(mockList);
  });

  it('creates recurring transaction schedule and initial occurrence', async () => {
    const createdTx = {
      id: 'rt-100',
      familyId: 'fam-1',
      currency: 'USD',
      amount: 100,
    };
    mockPrisma.recurringTransaction.create.mockResolvedValue(createdTx);
    mockPrisma.recurringTransaction.findFirst.mockResolvedValue(createdTx);
    mockPrisma.recurringOccurrence.create.mockResolvedValue({ id: 'occ-100' });

    const result = await service.createRecurringTransaction('fam-1', {
      name: 'Gym',
      amount: 100,
      currency: 'USD',
      expectedDayOfMonth: 1,
    });

    expect(mockPrisma.recurringOccurrence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recurringTransactionId: 'rt-100',
        familyId: 'fam-1',
        status: 'scheduled',
      }),
    });
    expect(result).toEqual(createdTx);
  });

  it('updates occurrence status to paid', async () => {
    const existingOcc = { id: 'occ-1', familyId: 'fam-1', status: 'scheduled' };
    mockPrisma.recurringOccurrence.findFirst.mockResolvedValue(existingOcc);
    mockPrisma.recurringOccurrence.update.mockResolvedValue({
      ...existingOcc,
      status: 'paid',
    });

    const result = await service.updateOccurrenceStatus('occ-1', 'fam-1', {
      status: 'paid',
    });

    expect(mockPrisma.recurringOccurrence.update).toHaveBeenCalledWith({
      where: { id: 'occ-1' },
      data: {
        status: 'paid',
        snoozedUntil: null,
      },
    });
    expect(result.status).toBe('paid');
  });
});

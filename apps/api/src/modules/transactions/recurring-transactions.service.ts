import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateRecurringTransactionDto,
  UpdateOccurrenceStatusDto,
} from './dto/recurring-transactions.dto.js';
import { RecurrenceFrequency, RecurringOccurrenceStatus } from '../../database/generated/prisma/client.js';

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRecurringTransactions(familyId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { familyId },
      include: {
        category: true,
        merchant: true,
        account: true,
        recurrenceRules: true,
        occurrences: {
          orderBy: { dueOn: 'desc' },
          take: 5,
        },
      },
      orderBy: { nextExpectedDate: 'asc' },
    });
  }

  async getRecurringTransaction(id: string, familyId: string) {
    const item = await this.prisma.recurringTransaction.findFirst({
      where: { id, familyId },
      include: {
        category: true,
        merchant: true,
        account: true,
        recurrenceRules: true,
        occurrences: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Recurring transaction not found');
    }

    return item;
  }

  async createRecurringTransaction(
    familyId: string,
    dto: CreateRecurringTransactionDto,
  ) {
    const nextDate = dto.nextExpectedDate
      ? new Date(dto.nextExpectedDate)
      : new Date();

    const created = await this.prisma.recurringTransaction.create({
      data: {
        familyId,
        name: dto.name,
        amount: dto.amount,
        currency: dto.currency,
        expectedDayOfMonth: dto.expectedDayOfMonth ?? nextDate.getDate(),
        nextExpectedDate: nextDate,
        lastOccurrenceDate: nextDate,
        categoryId: dto.categoryId ?? null,
        accountId: dto.accountId ?? null,
        merchantId: dto.merchantId ?? null,
        recurrenceRules: {
          create: {
            frequency: (dto.frequency as RecurrenceFrequency) || RecurrenceFrequency.monthly,
            interval: 1,
          },
        },
      },
      include: {
        recurrenceRules: true,
      },
    });

    // Auto-generate initial occurrence
    await this.prisma.recurringOccurrence.create({
      data: {
        recurringTransactionId: created.id,
        familyId,
        currency: created.currency,
        dueOn: nextDate,
        originalDueOn: nextDate,
        expectedAmount: created.amount,
        status: RecurringOccurrenceStatus.scheduled,
      },
    });

    return this.getRecurringTransaction(created.id, familyId);
  }

  async listOccurrences(familyId: string) {
    return this.prisma.recurringOccurrence.findMany({
      where: { familyId },
      include: {
        recurringTransaction: true,
      },
      orderBy: { dueOn: 'asc' },
    });
  }

  async updateOccurrenceStatus(
    occurrenceId: string,
    familyId: string,
    dto: UpdateOccurrenceStatusDto,
  ) {
    const occurrence = await this.prisma.recurringOccurrence.findFirst({
      where: { id: occurrenceId, familyId },
    });

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    return this.prisma.recurringOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: dto.status as RecurringOccurrenceStatus,
        snoozedUntil: dto.snoozedUntil ? new Date(dto.snoozedUntil) : null,
      },
    });
  }

  async deleteRecurringTransaction(id: string, familyId: string) {
    await this.getRecurringTransaction(id, familyId);
    return this.prisma.recurringTransaction.delete({
      where: { id },
    });
  }
}

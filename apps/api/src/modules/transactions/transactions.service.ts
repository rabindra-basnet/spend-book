import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateTransactionDto,
  FilterTransactionsDto,
  SplitTransactionDto,
  CreateTransferDto,
  BulkCategorizeDto,
  BulkDeleteDto,
} from './dto/transactions.dto.js';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listTransactions(familyId: string, filter: FilterTransactionsDto = {}) {
    const where: any = {
      account: { familyId },
    };

    if (filter.accountId) where.accountId = filter.accountId;
    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }

    return this.prisma.entry.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async getTransaction(id: string, familyId: string) {
    const entry = await this.prisma.entry.findFirst({
      where: { id, account: { familyId } },
      include: {
        account: true,
        childrenEntries: true,
      },
    });

    if (!entry) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return entry;
  }

  async createTransaction(familyId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, familyId },
    });

    if (!account) {
      throw new NotFoundException(
        `Account with ID ${dto.accountId} not found in active family`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transactionRecord = await tx.transaction.create({
        data: {
          categoryId: dto.categoryId ?? null,
          merchantId: dto.merchantId ?? null,
        },
      });

      return tx.entry.create({
        data: {
          accountId: dto.accountId,
          name: dto.name,
          amount: dto.amount,
          currency: dto.currency ?? account.currency,
          date: dto.date ? new Date(dto.date) : new Date(),
          notes: dto.notes ?? null,
          entryableType: 'Transaction',
          entryableId: transactionRecord.id,
        },
      });
    });
  }

  async createSplit(id: string, familyId: string, dto: SplitTransactionDto) {
    const parentEntry = await this.getTransaction(id, familyId);

    const totalSplitAmount = dto.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplitAmount - Number(parentEntry.amount)) > 0.01) {
      throw new BadRequestException(
        'Split total must equal parent transaction amount',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const splits = [];
      for (const split of dto.splits) {
        const transactionRecord = await tx.transaction.create({
          data: { categoryId: split.categoryId ?? null },
        });

        const child = await tx.entry.create({
          data: {
            accountId: parentEntry.accountId,
            parentEntryId: parentEntry.id,
            name: split.name,
            amount: split.amount,
            currency: parentEntry.currency,
            date: parentEntry.date,
            notes: split.notes ?? null,
            entryableType: 'Transaction',
            entryableId: transactionRecord.id,
          },
        });
        splits.push(child);
      }
      return splits;
    });
  }

  async createTransfer(familyId: string, dto: CreateTransferDto) {
    const fromAccount = await this.prisma.account.findFirst({
      where: { id: dto.fromAccountId, familyId },
    });
    const toAccount = await this.prisma.account.findFirst({
      where: { id: dto.toAccountId, familyId },
    });

    if (!fromAccount || !toAccount) {
      throw new NotFoundException(
        'One or both transfer accounts were not found',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const outflowTransaction = await tx.transaction.create({
        data: {},
      });
      const inflowTransaction = await tx.transaction.create({
        data: {},
      });

      const transferRecord = await tx.transfer.create({
        data: {
          amount: dto.amount,
          outflowTransactionId: outflowTransaction.id,
          inflowTransactionId: inflowTransaction.id,
        },
      });

      await tx.transaction.update({
        where: { id: outflowTransaction.id },
        data: { transferId: transferRecord.id },
      });
      await tx.transaction.update({
        where: { id: inflowTransaction.id },
        data: { transferId: transferRecord.id },
      });

      const date = dto.date ? new Date(dto.date) : new Date();

      const outflowEntry = await tx.entry.create({
        data: {
          accountId: dto.fromAccountId,
          name: `Transfer to ${toAccount.name}`,
          amount: -Math.abs(dto.amount),
          currency: fromAccount.currency,
          date,
          notes: dto.notes ?? null,
          entryableType: 'Transaction',
          entryableId: outflowTransaction.id,
        },
      });

      const inflowEntry = await tx.entry.create({
        data: {
          accountId: dto.toAccountId,
          name: `Transfer from ${fromAccount.name}`,
          amount: Math.abs(dto.amount),
          currency: toAccount.currency,
          date,
          notes: dto.notes ?? null,
          entryableType: 'Transaction',
          entryableId: inflowTransaction.id,
        },
      });

      return { transfer: transferRecord, outflowEntry, inflowEntry };
    });
  }

  async bulkCategorize(familyId: string, dto: BulkCategorizeDto) {
    const validEntries = await this.prisma.entry.findMany({
      where: {
        id: { in: dto.transactionIds },
        account: { familyId },
      },
      select: { entryableId: true },
    });

    const transactionIds = validEntries
      .map((e) => e.entryableId)
      .filter((id): id is string => Boolean(id));

    if (transactionIds.length > 0) {
      await this.prisma.transaction.updateMany({
        where: { id: { in: transactionIds } },
        data: { categoryId: dto.categoryId },
      });
    }

    return { updatedCount: transactionIds.length };
  }

  async bulkDelete(familyId: string, dto: BulkDeleteDto) {
    const result = await this.prisma.entry.deleteMany({
      where: {
        id: { in: dto.transactionIds },
        account: { familyId },
      },
    });

    return { deletedCount: result.count };
  }
}

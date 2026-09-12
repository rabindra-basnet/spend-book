import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { RecurringTransactionsController } from './recurring-transactions.controller.js';
import { RecurringTransactionsService } from './recurring-transactions.service.js';

@Module({
  controllers: [TransactionsController, RecurringTransactionsController],
  providers: [TransactionsService, RecurringTransactionsService],
  exports: [TransactionsService, RecurringTransactionsService],
})
export class TransactionsModule {}

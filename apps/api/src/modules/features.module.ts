import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AccountsModule } from './accounts/accounts.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { MerchantsModule } from './merchants/merchants.module.js';
import { RulesModule } from './rules/rules.module.js';
import { BudgetsModule } from './budgets/budgets.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { ImportsModule } from './imports/imports.module.js';
import { ExportsModule } from './exports/exports.module.js';
import { BankSyncModule } from './bank-sync/bank-sync.module.js';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { BillingModule } from './billing/billing.module.js';
import { StorageModule } from './storage/storage.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { PingModule } from '../queues/ping.module.js';
import { QueuesModule } from '../queues/queues.module.js';
import { FamiliesModule } from './families/families.module.js';

@Module({
  imports: [
    QueuesModule,
    PingModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    MerchantsModule,
    RulesModule,
    BudgetsModule,
    GoalsModule,
    ReportsModule,
    ImportsModule,
    ExportsModule,
    BankSyncModule,
    AiAssistantModule,
    NotificationsModule,
    BillingModule,
    StorageModule,
    RealtimeModule,
    FamiliesModule,
  ],
})
export class FeaturesModule {}

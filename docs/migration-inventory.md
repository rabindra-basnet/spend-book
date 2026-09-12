# Backend Migration Inventory — Sure (Rails) → Spend Book (NestJS)

Mapping source → target for everything in Milestone 0's discovery. Prisma model names are CamelCase of the Rails table; Nest routes are the planned `apps/api` surface. Family-scoping is assumed on **every** non-auth endpoint unless noted.

## 1. Model → Prisma schema mapping

Prisma `schema.prisma` will transcribe `db/schema.rb` model-by-model (Milestone 3). Grouping:

| Rails table(s) | Prisma model(s) | Notes |
|---|---|---|
| `users` | `User` | encrypted `email`,`otp_*` stay opaque strings; `role` enum owner/admin/member; `theme`,`ui_layout`,`default_period`,`preferences jsonb` `goals text[]` |
| `families` | `Family` | currency+country+locale+timezone+date_format+month_start_day+`enabled_currencies String[]`+`vector_store_id`+`assistant_type`+`ai_prompt_overrides Json` |
| `invitations`, `invite_codes` | `Invitation`, `InviteCode` | family_id+inviter_id+email+role+token/token_digest; pending unique `[email,family_id]` |
| `sessions`, `mobile_devices`, `webauthn_credentials`, `api_keys`, `push_subscriptions`, `oidc_identities`, `impersonation_sessions`, `impersonation_session_logs` | `Session`, `MobileDevice`, `WebauthnCredential`, `ApiKey`, `PushSubscription`, `OidcIdentity`, `ImpersonationSession`, `ImpersonationSessionLog` | cookie/session + API key + passkey + OIDC + push (APNs) |
| `settings` (bigint), `sso_providers`, `sso_audit_logs`, `sso_identity_blocks` | `Setting`, `SsoProvider`, `SsoAuditLog`, `SsoIdentityBlock` | runtime toggles + SSO admin |
| oauth_* (Doorkeeper, bigint) | — de-scope MVP or `OAuthApplication*` | see §6 decision D1 |
| `accounts` + `accountable` leaves | `Account` + `Depository`,`Investment`,`Crypto`,`Property`,`Vehicle`,`OtherAsset`,`CreditCard`,`Loan`,`OtherLiability` | polymorphic `accountable_id/type`; `classification` virtual column (see D6); `status`,`subtype`,`locked_attributes Json`,`owner_id`,`import_id` |
| `account_shares`, `account_providers`, `account_statements`, `addresses`, `balances` | `AccountShare`,`AccountProvider`,`AccountStatement`,`Address`,`Balance` | share permission enum full_control/read_write/read_only; statement file metadata; balance virtual columns (D6) |
| `entries`, `transactions`, `transfers`, `rejected_transfers` | `Entry` + `Transaction`,`Trade`,`Valuation` (entryable), `Transfer`,`RejectedTransfer` | splits via `parent_entry_id`; transfers pair transactions; `locked_attributes`,`extra Json` |
| `valuations`, `trades`, `securities`, `security_prices`, `holdings` | `Valuation`,`Trade`,`Security`,`SecurityPrice`,`Holding` | holdings qty `(34,18)`; provider_security_id; securities kind standard/cash |
| `categories` | `Category` | one-level-max subcategory enforced server-side |
| `tags`, `taggings` | `Tag`,`Tagging` | polymorphic taggable |
| `merchants`, `family_merchant_associations` | `Merchant` (type enum FamilyMerchant/ProviderMerchant), `FamilyMerchantAssociation` | dedup via merge flows (controllers) |
| `rules`, `rule_conditions`, `rule_actions`, `rule_runs`, `notification_deliveries` | `Rule`,`RuleCondition` (self-FK tree),`RuleAction`,`RuleRun`,`NotificationDelivery` | condition/action payload enums; resource_type=transaction |
| `budgets`, `budget_categories`, `budget_shares` | `Budget`,`BudgetCategory`,`BudgetShare` | shared vs personal via two partial unique indexes on `user_id` null-ness |
| `goals`, `goal_accounts`, `goal_pledges` | `Goal`,`GoalAccount`,`GoalPledge` | native enums `goal_pledge_kind`,`goal_pledge_status`; `consumed_amount`,`completed_amount` |
| `recurring_transactions`, `recurrence_rules`, `recurring_occurrences`, `recurring_allocations`, `recurring_match_rejections`, `recurring_price_changes` | `RecurringTransaction`,`RecurrenceRule`,`RecurringOccurrence`,`RecurringAllocation`,`RecurringMatchRejection`,`RecurringPriceChange` | occurrence composite FK `[id,currency]`; matcher fields keep; allocation source/state enums |
| `imports` (STI 12), `import_rows`, `import_mappings`, `import_sessions`, `import_source_mappings` | `Import` (type enum), `ImportRow`,`ImportMapping`,`ImportSession`,`ImportSourceMapping` | session composite `[id,family_id]`; CSV config cols; checksum/raw CSV strings |
| `family_exports`, `archived_exports`, `family_documents` | `FamilyExport`,`ArchivedExport`,`FamilyDocument` | file metadata + `ArchivedExport.token` |
| `exchange_rates`, `exchange_rate_pairs` | `ExchangeRate`,`ExchangeRatePair` | unique `[from,to,date]` / `[from,to]` |
| `insights` | `Insight` | AI-generated; priority/status enums; dedup_key |
| `syncs` | `Sync` | polymorphic syncable; status + parent fan-out + sync_stats |
| `llm_usages`, `data_enrichments`, `debug_log_entries`, `provider_request_counts` | `LlmUsage`,`DataEnrichment`,`DebugLogEntry`,`ProviderRequestCount` | observability + enrichment cache |
| provider items/accounts (24 providers × `_items` + `_accounts`) | per provider `PlaidItem`/`PlaidAccount`, … `UpItem`/`UpAccount`, `OnchainWalletItem`/`OnchainWalletAccount`, etc. | uniform credentials + `raw_* Json` payload pattern; unique external IDs. Consolidation behind Prisma models stays faithful (D7) |
| `chats`, `messages`, `tool_calls`, `vector_store_chunks` | `Chat`,`Message` (type enum), `ToolCall` (type enum), `VectorStoreChunk` | chunks table runtime-DDL in Rails → explicit model; `embedding Vector(1024)` |
| `eval_*` (datasets/runs/samples/results) | `EvalDataset`,`EvalRun`,`EvalSample`,`EvalResult` | AI eval harness |
| ActiveStorage tables | — replaced by S3 SDK (see §5) | file metadata hoisted into owning models (AccountStatement, FamilyDocument already in-row) |

## 2. Controller → Nest module + route mapping

### 2.1 Public API v1 (`apps/api/api` first-class; module = `modules/*`)

| Method | Path | Rails | Nest module / controller | Notes |
|---|---|---|---|---|
| POST | `/api/v1/auth/signup` | `Api::V1::AuthController#signup` | auth/AuthController | |
| POST | `/api/v1/auth/login` | `#login` | auth | |
| POST | `/api/v1/auth/refresh` | `#refresh` | auth | refresh token rotation |
| POST | `/api/v1/auth/sso_exchange` | `#sso_exchange` | auth | |
| POST | `/api/v1/auth/sso_link` | `#sso_link` | auth | |
| POST | `/api/v1/auth/sso_create_account` | `#sso_create_account` | auth | |
| PATCH | `/api/v1/auth/enable_ai` | `#enable_ai` | auth | |
| GET | `/api/v1/accounts` | `Api::V1::AccountsController#index` | accounts/AccountsController | |
| GET | `/api/v1/accounts/:id` | `#show` | accounts | |
| GET | `/api/v1/balances` | `Api::V1::BalancesController#index` | accounts/BalancesController | |
| GET | `/api/v1/balances/:id` | `#show` | accounts | |
| GET | `/api/v1/balance_sheet` | `Api::V1::BalanceSheetController#show` | reports/BalanceSheetController | net worth |
| GET/POST | `/api/v1/budgets` | `Api::V1::BudgetsController#index/#show` | budgets | API is read-only for budgets |
| GET | `/api/v1/budget_categories` + `/api/v1/budget_categories/:id` | `Api::V1::BudgetCategoriesController#index/#show` | budgets | |
| GET | `/api/v1/categories` + `:id`, POST `/categories` | `Api::V1::CategoriesController#index/#show/#create` | categories | |
| GET | `/api/v1/merchants` + `:id`, POST `/merchants` | `Api::V1::MerchantsController` | merchants | |
| GET | `/api/v1/rules` + `:id` | `Api::V1::RulesController` | rules | |
| GET | `/api/v1/rule_runs` + `:id` | `Api::V1::RuleRunsController` | rules | |
| GET | `/api/v1/securities` + `:id` | `Api::V1::SecuritiesController` | securities (under reports or dedicated) | |
| GET | `/api/v1/security_prices` + `:id` | `Api::V1::SecurityPricesController` | | |
| GET/POST/PATCH/DELETE | `/api/v1/tags` (+`:id`) | `Api::V1::TagsController` | categories/TagsController | full CRUD in API |
| GET/POST/PATCH/DELETE | `/api/v1/transactions` (+`:id`) | `Api::V1::TransactionsController` | transactions | |
| GET/POST/PATCH/DELETE | `/api/v1/trades` (+`:id`) | `Api::V1::TradesController` | transactions (trade endpoints) | |
| GET | `/api/v1/holdings` + `:id` | `Api::V1::HoldingsController` | accounts (holdings) | |
| GET | `/api/v1/transfers` + `:id` | `Api::V1::TransfersController` | transactions | read-only |
| GET | `/api/v1/rejected_transfers` + `:id` | `Api::V1::RejectedTransfersController` | transactions | |
| GET/POST/PATCH | `/api/v1/valuations` (+`:id`) | `Api::V1::ValuationsController` | accounts (valuations) | |
| GET/POST/PATCH/DELETE | `/api/v1/recurring_transactions` (+`:id`) | `Api::V1::RecurringTransactionsController` | transactions (recurring) | |
| GET/POST | `/api/v1/family_exports` (+`:id`) | `Api::V1::FamilyExportsController` (+`#download`) | exports (notifications/storage) | |
| GET/POST | `/api/v1/imports` (+`:id`), POST `/api/v1/imports/preflight`, GET `/api/v1/imports/:id/rows` | `Api::V1::ImportsController` | imports | |
| POST/GET | `/api/v1/import_sessions` (+`:id`), POST `:id/chunks`, POST `:id/publish` | `Api::V1::ImportSessionsController` (`create_chunk`,`publish`) | imports | chunked client upload |
| GET | `/api/v1/usage` | `Api::V1::UsageController#show` | billing | |
| GET | `/api/v1/insights` | `Api::V1::InsightsController#index` | reports | |
| POST/DELETE | `/api/v1/push_subscriptions` | `Api::V1::PushSubscriptionsController` | notifications | APNs |
| GET | `/api/v1/family_settings` | `Api::V1::FamilySettingsController#show` | families | |
| POST | `/api/v1/sync` | `Api::V1::SyncController#create` | bank-sync | |
| GET | `/api/v1/syncs` , `:id`, `/api/v1/syncs/latest` | `Api::V1::SyncsController#index/#show/#latest` | bank-sync | |
| GET | `/api/v1/provider_connections` | `Api::V1::ProviderConnectionsController#index` | bank-sync | |
| GET/POST/PATCH/DELETE | `/api/v1/chats` (+`:id`) | `Api::V1::ChatsController` | ai-assistant | |
| POST | `/api/v1/chats/:id/messages` , POST `…/messages/:id/retry` | `Api::V1::MessagesController#create/#retry` | ai-assistant | |
| GET | `/api/v1/users/reset/status` | `Api::V1::UsersController#reset_status` | users | |
| DELETE | `/api/v1/users/reset` | `#reset` | users | |
| DELETE | `/api/v1/users/me` | `#destroy` | users | |
| GET | `/api/v1/test*` | `Api::V1::TestController` | test | test env only |

### 2.2 Web surface (server-rendered Rails → Nest REST for Prompt 2's SPA)

| Rails controller | Nest module | Planned endpoints (from Rails actions) |
|---|---|---|
| `registrations`, `sessions`, `passkey_sessions`, `password_resets`, `password`, `email_confirmations`, `mfa`, `webauthn_credentials`, `current_session`, `cookie_sessions` | auth | register, login, logout, refresh, passkey options/create, password reset request + set, MFA verify/disable, WebAuthn register/login |
| `invitations`, `invite_codes`, `users`, `oidc_accounts` | users / families | user profile, family invitations (create/accept/destroy), invite codes, user delete/reset |
| `accounts`, `accountable` leaf controllers (`depositories`…`other_liabilities`), `account_sharings`, `accountable_sparklines` | accounts | account CRUD by type, sync, sparkline, notifications-toggle, share management, set/remove default |
| `transactions`, `transactions/bulk_deletions`, `bulk_updates`, `categorizes`, `splits`, `transfer_match`, `pending_duplicate_merges`, `transaction_categories`, `transaction_attachments` | transactions | transaction CRUD, filters, bulk delete/update/categorize, splits CRUD, transfer matching, duplicate merge, attachments, mark-as-recurring, convert-to-trade |
| `categories`, `category/dropdown`, `category/deletions` | categories | category CRUD, merge, bootstrap, destroy_all, dropdown |
| `family_merchants`, `pending_duplicate_merges` | merchants | merchant CRUD, enhance, merge flows |
| `tags`, `tag/deletions` | categories | tag CRUD + bulk delete |
| `rules` | rules | rule CRUD, apply (one), apply_all, confirm, clear_ai_cache, destroy_all |
| `budgets`, `budget_categories` | budgets | budget show/update, copy_previous, category allocations + move, picker |
| `goals`, `goal_pledges` | goals | goal CRUD + pause/resume/complete/archive/reopen/consume, pledges create/renew/destroy |
| `reports` | reports | report index, print, export_transactions, picker |
| `recurring_transactions`, `recurring_transactions/smart_fills`, `recurring_occurrences`, `recurring_allocations` | transactions (recurring) | RT CRUD + identify/cleanup/settings/status, occurrences mark_paid/skip/snooze/override, allocations confirm/reject |
| `bills`, `bills/ai_reviews`, `bills/smart_configurations`, `bills_feeds` | transactions (recurring) | bills index/detect/ai_review, ICS feed |
| `holdings`, `trades`, `valuations` | accounts / transactions | holdings update/unlock/remap, trades CRUD+unlock, valuations confirm flows |
| `securities`, `currencies`, `exchange_rates` | reports | lists + rate lookup |
| `imports` + `import/*` namespaces | imports | full import wizard: upload, configuration, clean, confirm, rows, mappings, publish, revert, cancel, summary, apply_template |
| `transfers`, `transfer_matches` | transactions | transfer CRUD + match + mark-as-recurring |
| `family_exports`, `archived_exports` | exports (notifications/storage) | export create/download/cancel, archived token download |
| `insights` | reports | index, acknowledge/unacknowledge, refresh |
| `chats`, `messages` | ai-assistant | chat CRUD, message create (stream), report_timeout, retry |
| `syncs` | bank-sync | cancel |
| `account_statements` | accounts (statements) | CRUD, link/unlink/reject |
| `mcp` | ai-assistant | JSON-RPC 2.0: initialize, tools/list, tools/call |
| `onboarding`, `pages` (dashboard/preferences) | users (onboarding) | onboarding status, preferences |
| `plans`, `subscriptions` | billing | plans, checkout, success, show |

### 2.3 Providers → `modules/bank-sync`

| Rails controllers | Nest surface | Notes |
|---|---|---|
| `plaid_items` + webhooks plaid/plaid_eu | PlaidController | Link SDK flow: link-token, item exchange, webhook signature verify, sync → BullMQ |
| `simplefin_items` | SimplefinController | connect + runtime toggle, balances, replacement suggestions |
| `akahu_items`, `up_items`, `wise_items`, `brex_items`, `mercury_items`, `monobank_items`, `coinbase_items`, `binance_items`, `kraken_items`, `trading212_items`, `questrade_items`, `indexa_capital_items`, `lunchflow_items`, `redbark_items` | Provider connectors (per provider) | shared shape: index/new/create/link_flows/sync/setup_accounts/complete_account_setup |
| `snaptrade_items` | SnapTradeController | OAuth device flows + callback + connections |
| `sophtron_items`, `enable_banking_items` | Sophtron/EnableBanking | connect_institution/MFA, bank selection/authorize flows |
| `trade_republic_items` | TradeRepublicController | two-phase login (initiate/complete/poll, QR), repair |
| `onchain_wallet_items`, `coinstats_items` | Onchain wallets + CoinStats | wallet link/preview/tokens, price enable |

### 2.4 Settings / admin / misc

| Rails controller | Nest module | Notes |
|---|---|---|
| `settings/*` (16 controllers) | users (settings/service) | profile, preferences, appearance, security, api_keys, webauthn_credentials, sso_identities, budget_shares, providers, mcp tokens, ai_prompts, llm_usage, hosting, background_jobs, debug, guides |
| `admin/*` (6) | admin (later milestone) | super-admin only; not in MVP |
| `webhooks` (stripe) | billing | signature verification + idempotent processing (BullMQ) |
| `impersonation_sessions` | admin | not in MVP |
| `oauth/*` + `oauth_metadata` + `oauth_registration` | auth (OAuth server) | decision D1 |
| `pwa`, `lookbooks`, `pages` | — frontend (Prompt 2) | service-worker/manifest on the SPA |

## 3. Sidekiq jobs → BullMQ processors

Queue priorities ported as-is: `scheduled(10) > high_priority(4) > medium_priority(2) > low_priority(1) > default(1)` — Nest queue names: `scheduled`, `high-priority`, `medium-priority`, `low-priority`, `default`.

| Rails job(s) | BullMQ processor (module) | Queue |
|---|---|---|
| `SyncJob`, `SyncAllJob`, `SyncAllProvidersJob`, `SyncHourlyJob` | `SyncProcessor`, `SyncAllProcessor`, `SyncAllProvidersProcessor`, `SyncHourlyProcessor` (bank-sync) | high / scheduled(HPHP grouping per original: SyncAll scheduled via cron) |
| `ImportJob`, `ImportSessionJob`, `RevertImportJob` | `ImportProcessor`, `ImportSessionProcessor`, `RevertImportProcessor` (imports) | high / medium |
| `ProcessPdfJob` | `PdfProcessor` (imports + storage) | medium |
| plaid pump jobs (Refresh/RefreshAll/Poll/FollowUp/SnapTrade/Sophtron family) | `PlaidRefresh*`, `Poll*`, `FollowUpSync*` (bank-sync) | high |
| `SimplefinConnectionUpdateJob`, `SimplefinHoldingsApplyJob`, `SimplefinItem::BalancesOnlyJob` | simplefin processors (bank-sync) | high / default |
| snaptrade/sophtron/questrade/indexa/redbark/TR activity jobs | provider activity processors (bank-sync) | default |
| `RuleJob`, `ApplyAllRulesJob`, `AutoCategorizeJob`, `AutoDetectMerchantsJob`, `RuleEmailNotificationJob`, `EnhanceProviderMerchantsJob` | rules processors (rules) | medium |
| `IdentifyRecurringTransactionsJob`, `GenerateRecurringOccurrencesJob` | recurring processors (transactions/recurring) | default / scheduled |
| `AssistantResponseJob`, `ClearAiCacheJob`, `WorkerAiHealthCheckJob` | ai-assistant processors | high / low |
| `GenerateInsightsJob`, `DeliverInsightNotificationJob` | insights processors (reports + notifications) | scheduled |
| maintenance/cron: `SyncCleanerJob`, `DataCleanerJob`, `DebugLogCleanupJob`, `DataCacheClearJob`, `InactiveFamilyCleanerJob`, `RefreshMaintainedGoalTargetsJob`, `SweepExpiredGoalPledgesJob`, `DemoFamilyRefreshJob`, `ImportMarketDataJob`, `SecurityHealthCheckJob`, `SyncPropertyValuationsJob` | BullMQ repeatable jobs (`@nestjs/schedule` + BullMQ repeat) | scheduled |
| `StripeEventHandlerJob` | `StripeWebhookProcessor` (billing) | default |
| `FamilyDataExportJob`, `FamilyResetJob`, `UserPurgeJob`, `DestroyJob` | exports/maintenance processors | low |
| `ApplyAllRulesJob`, `FamilyResetJob`, `DemoFamilyRefreshJob` | — same as above | |

## 4. Realtime & file-upload replacements (no direct Nest equivalent)

| Rails mechanism | Planned Nest replacement | Migrated in milestone |
|---|---|---|
| ActionCable + Turbo Streams (11 partials, 83 broadcasts, 100+ frames) | Nest WebSocket gateway (`modules/realtime`) for sync-status + AI chat streaming; SSE for chat tokens | Realtime (18) / AI (15) |
| Turbo Frames lazy-loading / modal drawer / background-job console / vault | REST + TanStack Query (frontend concern, Prompt 2) | n/a |
| ActiveStorage (S3/R2/GCS/local) | `@aws-sdk/client-s3` (or provider SDK) in `modules/storage`; presigned PUT/GET; attachments stay in `modules/transactions` | Storage (17) |
| Sidekiq Web + cron UI | BullMQ + `@nestjs/bullmq` admin (Bull Board) gated by admin | Ops (20) |
| Rails Action Mailer | `@nestjs-modules/mailer` (Nodemailer) with rebranded templates | Notifications (17) |
| Rails cache + ActionCable Redis | ioredis cache + BullMQ Redis (shared `REDIS_URL`) | Config (2) |

## 5. Env var → Nest config mapping (Milestone 2)

| Rails env group | Nest `config/configuration.ts` keys |
|---|---|
| `DATABASE_URL` (DB_HOST/PORT/USER/PASSWORD), `SECRET_KEY_BASE`, AR-E keys | `database.url`, `secrets.sessionJwt` (replaces secret_key_base) |
| `REDIS_URL` / Sentinel vars | `redis.url` |
| Plaid (see PlaidAdapter; mostly Settings) | `plaid.*` (client id, secret, env, webhook secret) |
| OpenAI/Anthropic/LLM/embedding/vector store | `ai.*`, `embedding.*`, `vectorStore.provider` |
| Stripe | `stripe.secretKey`, `stripe.webhookSecret`, `stripe.priceIds` |
| SMTP/EMAIL_SENDER | `smtp.*`, `email.sender` |
| S3/R2/GCS(`ACTIVE_STORAGE_SERVICE`, `S3_*`, `CLOUDFLARE_*`, `GENERIC_S3_*`, `GCS_*`) | `storage.*` |
| Auth (`SELF_HOSTED`, `WEBAUTHN_*`, `OIDC_*`, Google/GitHub OAuth, `APP_URL/DOMAIN`) | `auth.*` |
| Providers (24 × `*_INCLUDE_PENDING` etc.), market data, APNs, observability | `providers.*`, `marketData.*`, `apns.*`, `observability.*` |

## 6. Porting decisions & flags (carried into Prisma schema work)

- **D1 OAuth2 (Doorkeeper)**: the API's bearer-token layer. Decision needed in Milestone 6 — port as `@nestjs/passport` JWT (recommended for MVP) vs. full OAuth2 server (API keys + MCP tokens can reuse the same token table). Defer full Doorkeeper parity; document residual gap.
- **D2 Virtual stored columns**: `accounts.classification` and `balances.start_balance/end_balance/…` — re-implement as Prisma `generated` columns (Postgres `STORED`) rather than service logic.
- **D3 pgvector**: enable `postgresqlExtensions` preview feature in Prisma; keep `VectorStoreChunk.embedding Vector(1024)`; keep store-provider abstraction (pgvector default; openai/qdrant gate behind config).
- **D4 Runtime-DDL table**: `vector_store_chunks` must be added to the baseline migration (not runtime DDL).
- **D5 Native PG enums + CHECK strings** → Prisma enums with exact spellings (see source notes §2).
- **D6 Hybrid PKs**: keep UUID PKs everywhere except `oauth_*`/`sso_*`/`settings` (bigint) — port `settings` as bigint, keep whatever OAuth survival decision D1 makes.
- **D7 Provider consolidation**: preserve per-provider tables faithfully in the schema (24×2), but Nest `modules/bank-sync` exposes a single provider-connection abstraction; raw payload `Json` columns stay.
- **D8 Encryption**: `users.email`, OTP fields, provider API keys are AR-encrypted ciphertext — port as opaque/normal columns with Nest-side encryption at the service boundary (no DB-level migration of ciphertext values).
- **D9 Inserts idempotency**: transaction `external_id`+`idempotency_key` uniques + Stripe webhook idempotency are invariants to keep in Prisma uniques.
- **D10 Family-scoping invariant**: every module query carries `family_id`; `@CurrentFamily` decorator (Milestone 7) is the enforcement point; the cross-family isolation test is the guard.
- **D11 Personal finance rollover math**: goals/budget rollover + recurring occurrence windows are subtle — ported 1:1 first, tested (Milestones 11/10).

## 7. Backend scope cut (Parity checklist drives completion)

Prompt-2-dependent surfaces (Lookbook design system, PWA shell, marketing pages, Sidekiq Web) are flagged "frontend/ops, no Nest controller". Admin, impersonation, SSO provider CRUD, and Doorkeeper OAuth registration are flagged "post-MVP" in the parity checklist once it becomes a row-by-row artifact in `docs/parity-checklist.md`.
## 8. Milestone progress

| Milestone | Status | Notes |
|---|---|---|
| M0 Discovery & Inventory | Done (PR #79) | Docs above; board + milestones/issues wired |
| M1 Bootstrap with Nest CLI | Done (PR #80) | `apps/api` via `nest new` (Nest 12, strict TS template); package manager nub; lint=oxlint + Prettier, test=Vitest (template defaults); production folder layout created; `GET /health` live; `nub run dev` runs it |
| M2 Config module | Done (this PR) | Typed `configuration()` factory + class-validator `validation.schema.ts` covering the env contract of Sure's `.env.example`; `ConfigModule.forRoot({ isGlobal, load, validate })`; `SECRET_KEY_BASE` required outside tests; fail-fast with readable errors; `apps/api/.env.example` as runnable baseline; `main.ts` reads typed port via `ConfigService` |

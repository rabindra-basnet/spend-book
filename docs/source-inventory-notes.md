# Rails Source Inventory Notes — Sure (we-promise/sure)

Reference clone used: `D:\sure` (upstream `https://github.com/we-promise/sure`, HEAD `d723efb9d`). Read-only; nothing here is imported or shelled out to by the NestJS codebase. This document is the raw "what exists" survey from Milestone 0. The mappings are in `docs/migration-inventory.md`.

## 1. Shape of the app

- Rails 8.1 / Hotwire monolith, fork of Maybe Finance. ~160 tables, all UUID PKs (`gen_random_uuid()`) except Doorkeeper OAuth + `settings` (bigint). Extensions: `plpgsql`, `pgcrypto`, `vector` (runtime).
- App code surfaces: ~135 models, ~107 controllers, 57 Jobs (ActiveJob→Sidekiq), ~42 initializers, 24 bank/account providers.
- Everything is scoped to a **Family** tenant; `Current` holds the session/user/family. Role model on `users.role`: `owner | admin | member` (default member). Families allow account sharing (`account_shares`) and budget sharing (`budget_shares`).

## 2. Domain model highlights

### STI / polymorphic spine
- **Accountable** (polymorphic on `accounts`): `Depository`, `Investment`, `Crypto`, `Property`, `Vehicle`, `OtherAsset`, `CreditCard`, `Loan`, `OtherLiability` — each own table, `accounts.accountable_id` + `accountable_type`. `accounts.classification` is a **virtual stored column**: Liability for Loan/CreditCard/OtherLiability, else asset.
- **Entryable** (delegated_type, polymorphic on `entries`): `Valuation`, `Transaction`, `Trade`. Splits via `entries.parent_entry_id`.
- **Merchant STI**: `merchants.type` → `FamilyMerchant` / `ProviderMerchant`.
- **Message STI**: `messages.type` → `UserMessage` / `AssistantMessage`.
- **Import STI**: `imports.type` → 12 subclasses (Account/Category/Merchant/Rule/Sure/YNAB/Actual/Mint/QIF/PDF/Trade import).
- **Import mapping / source-mapping STI** and polymorphic `mappable_*/target_*`.

### Money
- Every monetary column is `decimal(19,4)` + companion `currency` (ISO char). `Money` objects via `Monetizable` concern; transaction FX rate lives in `transactions.extra` jsonb. `families.currency` (+`enabled_currencies[]`, `country`, `locale`, `timezone`, `month_start_day`).
- Exchange rates: `exchange_rates` (from/to/date/rate, unique `[from,to,date]`), `exchange_rate_pairs`.
- High-precision: trades/holdings qty `decimal(34,18)`, price `(19,10)`; crypto `(34,18)`.

### Accounts
- Account type discriminators are per-table `subtype` columns (checking/savings/hsa…; brokerage/401k/roth_ira…; mortgage/student/auto/line_of_credit… etc.), plus `locked_attributes jsonb`.
- `balances` (daily row per account/date/currency) with virtual stored `start_balance`/`end_balance`/cash decomposition columns.
- `account_providers` polymorphic → Plaid/SIMPLEFIN/etc. account classes; `account_statements` (bank PDFs), `account_shares`, `addresses` (polymorphic).

### Transactions & rules
- `entries` ledger rows (account, entryable, date, amount, currency, external_id unique `[account,source,external_id]`, idempotency_key, import_locked, reconciled_at, `locked_attributes`).
- `transfers` (inflow/outflow transaction pair, status, notes) + `rejected_transfers`.
- `rules` (resource_type=transaction), `rule_conditions` (self-parented tree: condition_type/operator/value), `rule_actions` (action_type/value), `rule_runs`, `notification_deliveries`.
- `categories` (one sub-level max), `merchants` + `family_merchant_associations`, `tags`/`taggings` (polymorphic).

### Budgets & goals
- `budgets` (family, optional personal `user_id`, currency, period, expected income, budgeted spending; two partial unique indexes for shared vs personal), `budget_categories` (allocation + rollover fields), `budget_shares`.
- `goals` (kind one_off|maintained; state active|paused|completed|archived; progress_basis balance|contributions; target_mode fixed|months_of_expenses; consumed/completed amounts), `goal_accounts`, `goal_pledges` (native enums `goal_pledge_kind`/`goal_pledge_status`, gold/gold-like: `extra.goal.pledge_id` linkage on transactions).

### Recurring / bills
- `recurring_transactions` (large matcher surface: dedup_scope, match_days_early/late, matcher_hints jsonb, expected_amount_*, overdue_grace_days, payment_url, notify_days_before, end_mode, weekend_adjust, holiday_calendar), `recurrence_rules` (frequency weekly|monthly|yearly), `recurring_occurrences` (status scheduled|paid|skipped|missed; composite FK `[id,currency]`), `recurring_allocations` (source auto_matched|user_confirmed|user_created), `recurring_match_rejections`, `recurring_price_changes`.

### Quant finance
- `securities` (ticker + exchange, kind standard|cash, price_provider, offline…), `security_prices`, `trades`, `holdings` (qty/price/cost_basis/cost_basis_source), `valuations`, `investment_*_statement`, `loan`/`property` specifics.

### Imports
- `imports` (STI, CSV config, raw/normalized CSV strings, checksums, column_mappings/extracted_data/summary jsonb), `import_rows`, `import_mappings`, `import_sessions` (chunked client upload, composite unique `[id,family_id]`), `import_source_mappings`, `archived_exports`, `family_exports`, `family_documents`.

### Providers (24)
- Each provider: `<provider>_items` (family-scoped credentials + institution) + `<provider>_accounts` family-scoped table? (mostly `<provider>_accounts` is a real mirrored-account table: plaid_accounts, simplefin_accounts, akahu_accounts, up_accounts, wise_accounts, brex_accounts, mercury_accounts, monobank_accounts, coinbase_accounts, coinstats_accounts, enable_banking_accounts, lunchflow_accounts, ibkr_accounts, indexa_capital_accounts, kraken_accounts, questrade_accounts, redbark_accounts, snaptrade_accounts, sophtron_accounts, trade_republic_accounts, trading212_accounts, binance_accounts, onchain_wallet_accounts) + raw `*_entry`/`*_transactions` import tables where relevant. Uniform pattern: raw payload jsonb, external ids, companion import/activity tables.
- `syncs` polymorphic state machine (pending/syncing/completed/failed/cancelled, parent_id fan-out, sync_stats).

### AI assistant
- `chats`/`messages`/`tool_calls` (STI), `llm_usages`, `vector_store` adapters (openai | pgvector | qdrant), runtime `vector_store_chunks` table (`embedding vector(<1024>)`), `insights`, `ai_health`/`worker_ai_health`/`background_job_health`/`sidekiq_health`, `eval_*` suite, MCP JSON-RPC endpoint (`POST /mcp`, tools = 36 `Assistant::Function` classes).

### Billing/notifications
- `subscriptions` (unique family, Stripe statuses), `notifications`? — `notification_deliveries`, `push_subscriptions` (APNs), `NotificationDelivery`. Mailers: password reset, invitation, email confirmation, rule digest, PDF-import next steps, demo refresh.

## 3. HTTP surface at a glance

- **Web UI** (Hotwire, server-rendered): full domain CRUD + flows. ~107 controllers.
- **Public API** (`/api/v1`): 35 controllers, dual auth (Doorkeeper OAuth bearer **or** `X-Api-Key`), OAuth scopes `read` / `read_write`, wildcard CORS, per-key rate limiting, resource family-scoping via `ensure_current_family_access`.
- **Webhooks**: `POST /webhooks/plaid`, `/webhooks/plaid_eu`, `/webhooks/stripe`.
- **MCP**: `POST /mcp` JSON-RPC 2.0 for external AI assistants.
- **PWA/health/pages**: `/up` (rails health), `/service-worker`, `/manifest`, Marketing/pages, Sidekiq Web at `/sidekiq` (admin-gated), `/design-system` (Lookbook, dev only).
- **OAuth2 server** via Doorkeeper (authorize/token flows, PKCE-required clients, refresh tokens).

## 4. Background jobs & infra

- ActiveJob→Sidekiq; queues `scheduled(10) > high_priority(4) > medium_priority(2) > low_priority(1) > default(1)`.
- 57 jobs grouped: sync/providers, plaid refresh-pumps, simplefin, snaptrade/sophtron/questrade/indexa/redbark/TR, rules (apply/auto-categorize/auto-detect-merchants/enhance), recurring identification, AI chat, insights/push, maintenance/cron, billing (Stripe webhook), data export/import/pdf.
- 13 sidekiq-cron entries (`config/schedule.yml`) + dynamic `sync_all_accounts` cron from `Setting.auto_sync_*`.
- Redis: `REDIS_URL` or Sentinel; used for Sidekiq, Rails cache, ActionCable (channel_prefix `sure_production`).

## 5. Realtime

- ActionCable: no custom channels (scaffold only); transport for **Turbo Streams**: 11 `.turbo_stream.erb` partials, 83 `broadcast_*` calls mostly via per-provider `SyncCompleteEvent` classes and `Syncable#broadcast_sync_complete`; 100+ `turbo_frame_tag`s, lazy sparklines, modals/drawers, background-job console, vault panes.

## 6. Storage

- ActiveStorage: services local | amazon(S3) | cloudflare(R2) | generic_s3 | google(GCS); `ACTIVE_STORAGE_SERVICE` selects; attachment models: Account logo, User profile_image, Transaction attachments (≤10 files, ≤10MB, images+PDF), AccountStatement original_file, PdfImport pdf_file, SureImport ndjson_file, FamilyExport/ArchivedExport export_file, FamilyDocument file, provider item logos.

## 7. Key env-integration surface (from `.env.example` + initializers)

Database (`DB_HOST`,`DB_PORT`,`POSTGRES_USER`,`POSTGRES_PASSWORD`,`SECRET_KEY_BASE`,AR-E keys), Redis (`REDIS_URL`/Sentinel), Auth (`SELF_HOSTED`,`REQUIRE_INVITE_CODE`,`REQUIRE_EMAIL_CONFIRMATION`,`WEBAUTHN_*`,`OIDC_*`,Google/GitHub OAuth,`APP_URL`,`APP_DOMAIN`), AI (`OPENAI_*`,`ANTHROPIC_*`,`LLM_*`,`VECTOR_STORE_PROVIDER`,`EMBEDDING_*`,`QDRANT_*`,`EXTERNAL_ASSISTANT_*`,`MCP_API_TOKEN`,`MCP_USER_EMAIL`), Stripe (`STRIPE_SECRET_KEY`,`STRIPE_WEBHOOK_SECRET`,`STRIPE_*_PRICE_ID`), SMTP (`SMTP_*`,`EMAIL_SENDER`), storage (`ACTIVE_STORAGE_SERVICE`, S3/R2/GCS vars), market data (`TWELVE_DATA_API_KEY`,`SECURITIES_PROVIDER(S)`,`TIINGO_API_KEY`,`EODHD_API_KEY`,`ALPHA_VANTAGE_API_KEY`,`FRANKFURTER_URL`,`RENTCAST_API_KEY`,`REALIE_API_KEY`), per-provider flags (`*_INCLUDE_PENDING`,`*_DEBUG_RAW`,`INDEXA_API_TOKEN`,`SNAPTRADE_OAUTH_*`), APNs (`APNS_*`), observability (SENTRY, POSTHOG, LANGFUSE, LOGTAIL, SKYLIGHT).

## 8. Hard-to-port items (see migration-inventory for planned replacements)

1. ActionCable + Turbo Streams/Frame/Hotwire (no direct Nest equivalent).
2. ActiveStorage (no direct Nest equivalent).
3. Rails Active Record encryption (encrypted string columns) + `has_secure_password`.
4. Native PG enums + string-with-CHECK columns → Prisma enums.
5. Virtual stored columns (`accounts.classification`, `balances.start_balance/end_balance/…`).
6. `vector(1024)` + runtime `vector_store_chunks` DDL (Pgvector adapter).
7. Doorkeeper OAuth2 server (bigint PKs, auth flows) — out of scope for MVP API until determined.
8. Sidekiq Web + cron + dashboard → BullMQ repeatable jobs + QueueOps/admin surface.
9. Pundit policies (only 5 policy classes) + per-account permission model (`AccountAuthorizable`).
10. Hotwire-instant UI flows (polled frames, background-job console, vault panes) → frontend concern (Prompt 2).
# Spend Book Migration Plan
Source: https://github.com/we-promise/sure (Rails 7 + Hotwire monolith, fork of Maybe Finance)
Target: **NestJS + Prisma + PostgreSQL + Redis/BullMQ** backend, then a **TanStack Router + shadcn/ui** frontend.

This is written as a GitHub-Project-style, milestone-by-milestone build — each milestone is one GitHub Milestone, each numbered step is one Issue/commit. The backend is Prompt 1 and is built **first, completely, and independently**. The frontend (Prompt 2) only starts once the backend's OpenAPI contract is stable. Feed an agent one milestone at a time, not the whole prompt at once — that's what keeps this a *learning* exercise in idiomatic NestJS rather than a black-box code dump.

---

## How to run this (repo + GitHub project conventions)

Set these up before Milestone 0 and hold to them for the whole migration:

- **Repo**: one new repo, `spenc-book`, with two top-level dirs once both prompts are underway: `apps/api` (NestJS) and `apps/web` (TanStack Router). Backend-first means `apps/web` doesn't exist until Prompt 2 starts — don't scaffold it early.
- **Branching**: `main` is always deployable. One branch per milestone: `feat/00-discovery`, `feat/01-bootstrap`, `feat/02-prisma-schema`, etc. Merge via PR even solo — write a real PR description (what/why, screenshots for frontend later) so the PR history *is* your migration log.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`. One logical change per commit; a milestone is typically 4–10 commits, not one giant commit. Every step below ends with an explicit `Commit:` line — treat that as the commit message to write, not a suggestion to squash away.
- **GitHub Project board**: columns `Backlog / In Progress / In Review / Done`. Create one Milestone per section below (`M0 Discovery`, `M1 Bootstrap`, …), one Issue per numbered step, and check issues off as their commit lands. This gives you a visible, resumable trail — useful given how long this migration is.
- **Issue labels**: `backend`, `frontend`, `learning-note` (use this label on any issue where you want the agent to explain *why* NestJS does something a certain way, not just do it).
- **Definition of done for every milestone**: builds, lints, tests pass, and the relevant checklist doc (`docs/migration-inventory.md`, `docs/parity-checklist.md`) is updated in the same PR — not after.

---

# PROMPT 1 — Backend: Rails → NestJS (Prisma + PostgreSQL + Redis)

You are migrating the backend of **Sure** (https://github.com/we-promise/sure) into a standalone **NestJS** API called **Spend Book**. Non-negotiable technical constraints for this entire migration:

- **NestJS CLI is mandatory.** Every module, controller, service, and resource is generated with `nest g <schematic>` — never hand-rolled from scratch, so the project structure and naming stay exactly what the Nest CLI and community convention expect. If you ever write a module/controller/service file without having run the corresponding `nest g` command first, stop and redo it with the CLI.
- **Prisma is the only ORM.** No TypeORM, no raw query builders outside Prisma's own `$queryRaw` escape hatch for the rare case Prisma can't express something (e.g. certain `pgvector` operators) — and even then, isolate it behind a repository method with a comment explaining why raw SQL was necessary.
- **PostgreSQL** for the primary datastore, **Redis** for BullMQ queues and caching — matching Sure's own infra choices, so you're translating idioms, not swapping architecture.
- **Strict, idiomatic, production NestJS folder structure** (below) — do not deviate from it, and do not let any module's internals leak into another module except through its exported providers.
- This is a rewrite, not a proxy. Rails is read-only reference material; nothing in the new repo imports or shells out to it.

### The folder structure (lock this in at Milestone 1 and never break it)

```
spn-book/
  apps/
    api/
      src/
        main.ts
        app.module.ts
        common/
          decorators/        # e.g. @CurrentUser(), @CurrentFamily()
          filters/            # global exception filters
          guards/             # AuthGuard, PoliciesGuard, etc.
          interceptors/       # logging, response-shaping
          pipes/              # shared validation/transform pipes
        config/
          configuration.ts    # typed config factory
          validation.schema.ts # class-validator/Joi schema for env vars
        database/
          prisma.module.ts
          prisma.service.ts   # extends PrismaClient, handles lifecycle hooks
        queues/
          queue.module.ts     # BullMQ registration shared across feature modules
        modules/
          auth/
          users/
          families/
          accounts/
          transactions/
          categories/
          merchants/
          rules/
          budgets/
          goals/
          reports/
          imports/
          bank-sync/
          ai-assistant/
          billing/
          notifications/
          storage/
          realtime/
          health/
        # each modules/<name>/ contains, generated via `nest g resource modules/<name>`:
        #   <name>.module.ts
        #   <name>.controller.ts
        #   <name>.service.ts
        #   dto/
        #   entities/            # Prisma-derived response types, not DB models
      test/                      # e2e (supertest)
      prisma/
        schema.prisma
        migrations/
        seed.ts
      nest-cli.json
      package.json
  docs/
    migration-inventory.md
    parity-checklist.md
```

Every feature module is self-contained: it exports only what other modules genuinely need (usually one service), and cross-module data access goes through that exported service — never by importing another module's Prisma model directly from outside `database/`.

---

### Milestone 0 — Discovery & Inventory
*Goal: know exactly what you're porting before writing a line of Nest code.*

1. Clone `we-promise/sure` locally as read-only reference (a sibling folder, not part of the new repo). Read `app/models/**`, `app/controllers/**`, `db/schema.rb`, `db/migrate/**`, `config/routes.rb`, `app/jobs/**`, and the Sidekiq queue config. Note in particular: the account-type STI hierarchy (depository/credit_card/investment/loan/property/crypto/other), the `Family`-as-tenant model, the rules engine tables, the Goals/budget rollover tables, Plaid/SimpleFIN integration models, and any `pgvector` columns for the AI assistant.
   `Commit: docs: add Rails source inventory notes`
2. Write `docs/migration-inventory.md`: a table mapping every Rails model → planned Prisma model, every controller#action → planned Nest module + route + verb, every Sidekiq job → planned BullMQ processor. Flag anything with no direct Nest equivalent (ActionCable/Turbo Streams, ActiveStorage) and write one sentence on its planned replacement (WebSocket gateway, S3 SDK).
   `Commit: docs: complete backend migration inventory`
3. Do not proceed until this doc exists and you understand *why* each mapping was chosen, not just what it is — this is the map you'll be building from for the next fifteen milestones.

---

### Milestone 1 — Bootstrap with Nest CLI
*Goal: a running, empty, correctly-structured Nest app. Learning note: this is where you get comfortable with the CLI instead of a boilerplate template — every `nest g` here is one you'll be typing again and again for the rest of the project.*

1. `npm i -g @nestjs/cli` (if not already global), then `nest new apps/api --package-manager npm` (or pnpm, your call — state it and stay consistent). Choose the strict TypeScript template.
   `Commit: chore: bootstrap NestJS app via Nest CLI`
2. Enforce `strict: true` in `tsconfig.json`, add ESLint + Prettier config matching Nest's own recommended rules, add a root `.editorconfig`.
   `Commit: chore: enforce strict TypeScript and lint rules`
3. Restructure the CLI-generated `src/` into the `modules/`, `common/`, `config/`, `database/`, `queues/` layout above. This is manual folder creation only — no code in them yet, just `.gitkeep`s.
   `Commit: chore: establish production folder structure`
4. `nest g module common` is *not* a thing you generate — `common/` is plain folders/files, not a Nest module. But do generate a `health` module now (`nest g resource modules/health --no-spec` if you want CRUD scaffolding stripped, or `nest g module modules/health` + `nest g controller modules/health` for a lean health check) exposing `GET /health` — your first end-to-end proof the CLI-generated structure runs.
   `Commit: feat: add health check module`
5. `npm run start:dev`, confirm `/health` responds. Add a `README.md` section documenting "how to run this locally" — you'll thank yourself later.
   `Commit: docs: add local development instructions`

---

### Milestone 2 — Config module
*Learning note: this is the idiomatic Nest pattern for env vars — typed, validated at boot, injected via DI instead of scattered `process.env` calls.*

1. `nest g module config` (or keep `config/` as a plain folder if you prefer no DI wrapper for it — the common community pattern is a `ConfigModule.forRoot()` from `@nestjs/config` plus your own `configuration.ts` factory; use that).
2. Write `config/validation.schema.ts` with `class-validator` or `Joi`, covering every env var Sure's `.env.example` defines: `DATABASE_URL`, `REDIS_URL`, Plaid keys, OpenAI key, SMTP, S3, session/JWT secret.
   `Commit: feat: add validated environment configuration`
3. Wire `ConfigModule.forRoot({ validate, isGlobal: true })` in `app.module.ts`.
   `Commit: feat: register global config module`

---

### Milestone 3 — Prisma + PostgreSQL schema
*Goal: the real Sure schema, faithfully ported, as the single source of truth for the rest of the backend. Learning note: Prisma's schema file becomes your ORM's "models," but the migration workflow (`migrate dev`) is very different from Rails migrations — worth sitting with the diff each time.*

1. `npm i -D prisma && npm i @prisma/client`, `npx prisma init --datasource-provider postgresql`.
   `Commit: chore: install and initialize Prisma`
2. `nest g module database` then hand-write `database/prisma.service.ts` (extends `PrismaClient`, implements `OnModuleInit`/`OnModuleDestroy` for connect/disconnect — this is the standard community pattern, not CLI-generated) and `database/prisma.module.ts` (`@Global()` so every feature module can inject `PrismaService` without re-importing).
   `Commit: feat: add global PrismaService and PrismaModule`
3. Transcribe `db/schema.rb` into `prisma/schema.prisma` model-by-model — do not invent or "clean up" columns; match Sure's real schema, including the account-type discriminator, multi-currency fields, and any `pgvector` column (Prisma supports this via the `postgresqlExtensions` preview feature — enable it).
   `Commit: feat: port core schema (users, families, accounts) to Prisma`
   *(split this into as many commits as makes sense per domain — one per major table group is reasonable: users/families, accounts, transactions, categories/merchants/rules, budgets/goals, bank-sync, ai-assistant/embeddings.)*
4. `npx prisma migrate dev --name init` to generate the first migration; verify it against a local Postgres.
   `Commit: chore: generate initial Prisma migration`
5. Write `prisma/seed.ts` reproducing Sure's `demo_data:default` rake task closely enough for manual QA parity (same demo login shape, not necessarily identical fixture data). Wire it via `"prisma": { "seed": "ts-node prisma/seed.ts" }` in `package.json`.
   `Commit: feat: add Prisma seed script for demo data`

---

### Milestone 4 — Redis + BullMQ
*Learning note: this replaces Sidekiq. The Nest idiom is `@nestjs/bullmq` — `BullModule.registerQueue()` per queue, `@Processor()` classes generated like any other provider, not a separate "worker app" unless you want one for production isolation (recommended, but you can start in-process and split later).*

1. `npm i @nestjs/bullmq bullmq ioredis`, `nest g module queues`.
   `Commit: chore: install BullMQ and Redis client`
2. Register each queue Sure actually has in Sidekiq (account-sync, imports, ai-chat-streaming, exports, etc. — from your Milestone 0 inventory), preserving the priority ordering Sure's own PR history establishes (account syncs prioritized).
   `Commit: feat: register BullMQ queues with inherited priority ordering`
3. Add one trivial `@Processor()` (e.g. a no-op "ping" job) end-to-end to prove Redis connectivity before building real jobs against it in later milestones.
   `Commit: test: verify BullMQ processor connectivity`

---

### Milestone 5 — Cross-cutting concerns
*Learning note: this is the "why does every Nest tutorial have a global filter/interceptor/pipe" milestone — these run for every request regardless of module, which is the whole point.*

1. `nest g filter common/filters/http-exception` → a global `HttpExceptionFilter` producing one consistent error envelope shape.
   `Commit: feat: add global exception filter`
2. Global `ValidationPipe` (`whitelist: true, transform: true`) registered in `main.ts`.
   `Commit: feat: enable global validation pipe`
3. `nest g interceptor common/interceptors/logging` + structured logging (`nestjs-pino` recommended — community-standard for Nest) instead of the default console logger.
   `Commit: feat: add structured request logging`
4. `@nestjs/swagger` wired in `main.ts`, decorating DTOs as you build them from here on — this becomes the contract Prompt 2 consumes, so treat every DTO's Swagger annotations as part of "done," not an afterthought.
   `Commit: feat: add OpenAPI/Swagger documentation`

---

### Milestone 6 — Auth module
*This is the first real domain module — everything after this repeats the same `nest g resource` → DTOs → Prisma calls → tests rhythm, so go slowly here and it'll speed up later.*

1. `nest g resource modules/auth --no-spec` (choose REST when prompted), then strip the CRUD scaffolding you don't need — auth isn't a CRUD resource, but starting from the generator keeps file naming/module wiring consistent with the rest of the app.
   `Commit: chore: scaffold auth module via Nest CLI`
2. `npm i @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt` (+ a WebAuthn library, e.g. `@simplewebauthn/server`, for passkeys). Implement email/password register+login, JWT access+refresh tokens, and password hashing — port Sure's actual password/session rules, don't assume defaults.
   `Commit: feat: implement email/password auth with JWT`
3. Add TOTP-based MFA (`otplib` or similar), matching Sure's MFA flow.
   `Commit: feat: add TOTP-based MFA`
4. Add WebAuthn/passkey registration + login endpoints, matching Sure's passkey support.
   `Commit: feat: add passkey (WebAuthn) authentication`
5. `nest g guard common/guards/auth` and a `RolesGuard`/`PoliciesGuard` pair mirroring the Pundit policies inventoried in Milestone 0.
   `Commit: feat: add auth and policy guards`
6. Unit tests for the auth service (Jest + Nest's `Test.createTestingModule`) — password hashing, token issuance/refresh, MFA verification.
   `Commit: test: cover auth service`

---

### Milestone 7 — Families & Users (tenancy)
*The single most important invariant in this whole backend: every later module's queries must be scoped by family. Get this right here or you'll be retrofitting it into ten modules later.*

1. `nest g resource modules/families`, `nest g resource modules/users`.
   `Commit: chore: scaffold families and users modules via Nest CLI`
2. Implement family CRUD, member roles (admin/member), invitations.
   `Commit: feat: implement family membership and roles`
3. `nest g decorator common/decorators/current-family` — a param decorator pulling the authenticated user's active family out of the request, for every controller from here on to use instead of trusting a client-supplied family ID.
   `Commit: feat: add @CurrentFamily decorator for tenant scoping`
4. Write an explicit test proving a user from Family A cannot read Family B's data through any exposed endpoint so far — this test gets extended in every future milestone, not just written once.
   `Commit: test: verify cross-family data isolation`

---

### Milestone 8 — Accounts
1. `nest g resource modules/accounts`.
   `Commit: chore: scaffold accounts module via Nest CLI`
2. Model the account-type discriminator (depository/credit_card/investment/loan/property/crypto/other) faithfully from the Prisma schema; implement a shared multi-currency `Money` value-object util used everywhere money is handled (not reimplemented per module).
   `Commit: feat: implement account CRUD with multi-currency support`
3. Balance history / holdings endpoints for investment accounts.
   `Commit: feat: add balance history and holdings endpoints`
4. Tests, family-scoped.
   `Commit: test: cover accounts service and family scoping`

---

### Milestone 9 — Transactions
1. `nest g resource modules/transactions`.
   `Commit: chore: scaffold transactions module via Nest CLI`
2. CRUD, filtering/search, split transactions, transfer pairing.
   `Commit: feat: implement transaction CRUD, splits, and transfers`
3. Bulk operations endpoint (bulk categorize/delete, matching Sure's UI needs).
   `Commit: feat: add bulk transaction operations`
4. Tests.
   `Commit: test: cover transaction service including splits and transfers`

---

### Milestone 10 — Categories, Merchants, Rules
1. `nest g resource modules/categories`, `nest g resource modules/merchants`, `nest g resource modules/rules`.
   `Commit: chore: scaffold categories, merchants, and rules modules via Nest CLI`
2. Category hierarchy with the one-level-max subcategory constraint enforced server-side (matching Sure's real constraint, not a stricter/looser one you invent).
   `Commit: feat: implement category hierarchy with depth constraint`
3. Merchant de-duplication logic.
   `Commit: feat: implement merchant management with deduplication`
4. Rules engine: condition/action model, evaluated on transaction create/import — port the evaluation logic faithfully from Rails, don't "improve" it yet.
   `Commit: feat: implement rules engine for auto-categorization`
5. Unit tests against representative rule sets — this module is a high-risk-of-silent-bug area, invest real test time here.
   `Commit: test: cover rules engine evaluation`

---

### Milestone 11 — Budgets & Goals
1. `nest g resource modules/budgets`, `nest g resource modules/goals`.
   `Commit: chore: scaffold budgets and goals modules via Nest CLI`
2. Monthly budgets + category allocations, family-wide vs. personal budget distinction.
   `Commit: feat: implement budget allocation with family/personal scope`
3. Envelope-style Goals with rollover math — port faithfully, then write tests before touching anything you're tempted to "fix."
   `Commit: feat: implement goals with rollover logic`
4. Tests for rollover math specifically — this is the other high-risk area (silent off-by-one-month bugs are easy here).
   `Commit: test: cover budget rollover and goal calculations`

---

### Milestone 12 — Reports & Net Worth
1. `nest g resource modules/reports`.
   `Commit: chore: scaffold reports module via Nest CLI`
2. Net worth trend, spending-by-category donut, income vs. expense aggregation endpoints. Check Prisma query plans against the N+1 bugs Sure's own history mentions fixing (categories/budget aggregation) — don't reintroduce the equivalent N+1 in Prisma (`include`/`select` shape matters here).
   `Commit: feat: implement reporting and net worth aggregation`
3. Tests, including at least one asserting query count doesn't blow up with N accounts/transactions (a simple "assert Prisma called once, not N times" style check).
   `Commit: test: cover reports and guard against N+1 queries`

---

### Milestone 13 — Imports
1. `nest g resource modules/imports`.
   `Commit: chore: scaffold imports module via Nest CLI`
2. CSV upload → column mapping → preview/dedup → commit pipeline as REST endpoints; large-file processing offloaded to a BullMQ processor (`queues/` module from Milestone 4).
   `Commit: feat: implement CSV import pipeline with async processing`
3. Tests covering dedup logic specifically.
   `Commit: test: cover import deduplication`

---

### Milestone 14 — Bank sync (Plaid / SimpleFIN)
1. `nest g resource modules/bank-sync`.
   `Commit: chore: scaffold bank-sync module via Nest CLI`
2. Plaid link-token creation, item exchange, webhook controller with signature verification, sync-as-BullMQ-job preserving the account-sync queue priority from Milestone 4.
   `Commit: feat: implement Plaid integration and webhook handling`
3. SimpleFIN client module, matching Sure's runtime-toggle config pattern (`config/initializers/simplefin.rb` in the Rails repo — port the "is this integration enabled" toggle idea into your `config/` module).
   `Commit: feat: implement SimpleFIN integration with runtime toggle`
4. Tests, including webhook signature verification failure cases.
   `Commit: test: cover bank-sync webhook verification`

---

### Milestone 15 — AI Assistant
1. `nest g resource modules/ai-assistant`.
   `Commit: chore: scaffold ai-assistant module via Nest CLI`
2. Chat endpoint backed by OpenAI, replicating Sure's MCP/tool-calling harness — expose read-only, family-scoped financial-query "tools" the model can call. This module must call into `accounts`/`transactions`/`reports` services (never the Prisma client directly) so family-scoping is inherited, not reimplemented.
   `Commit: feat: implement AI assistant with family-scoped tool calling`
3. Streaming response (SSE or WebSocket — decide now, Prompt 2 will match whichever you pick).
   `Commit: feat: add streaming responses for AI chat`
4. Tests asserting the assistant's tools can never return another family's data (extend the Milestone 7 isolation test here specifically).
   `Commit: test: verify AI assistant tool calls respect family scoping`

---

### Milestone 16 — Billing (if present in the source repo)
1. `nest g resource modules/billing`.
   `Commit: chore: scaffold billing module via Nest CLI`
2. Stripe customer/subscription webhooks, entitlement checks guarding premium features.
   `Commit: feat: implement Stripe billing and entitlements`
3. Tests around webhook idempotency (Stripe retries deliveries — your handler must be safe to run twice).
   `Commit: test: cover billing webhook idempotency`

---

### Milestone 17 — Notifications & Storage
1. `nest g module modules/notifications`, pick a mailer lib (`@nestjs-modules/mailer`), port Sure's transactional email templates, rebranded to SPN Book.
   `Commit: feat: implement transactional email notifications`
2. `nest g module modules/storage`, S3-compatible SDK for avatars/import files/exports, replacing ActiveStorage.
   `Commit: feat: implement S3-compatible file storage`

---

### Milestone 18 — Realtime
1. `nest g gateway modules/realtime/realtime` (Nest's WebSocket gateway schematic) or an SSE controller — whichever you chose in Milestone 15 for AI streaming, reuse the same mechanism for account-sync-status updates and any other place Sure used Turbo Streams/ActionCable.
   `Commit: feat: implement realtime updates for sync status`

---

### Milestone 19 — Full test pass & parity checklist
1. Fill in any remaining unit test gaps per module.
   `Commit: test: close remaining unit test gaps`
2. e2e tests (`supertest`) for the full auth → account → transaction → rule → budget happy path, plus the cross-family isolation test extended to cover every module.
   `Commit: test: add end-to-end happy-path and isolation coverage`
3. Update `docs/parity-checklist.md`: one row per original Rails controller action, the Nest endpoint replacing it, and its test status. This is your Definition of Done for the backend — don't call the backend "finished" until every row is checked.
   `Commit: docs: complete backend parity checklist`

---

### Milestone 20 — Production hardening
1. `Dockerfile` (multi-stage, matching Nest's own recommended production build) + `docker-compose.yml` for local Postgres/Redis.
   `Commit: chore: add production Dockerfile and local compose setup`
2. `/health` expanded with `@nestjs/terminus` (DB + Redis checks), rate limiting on auth/AI endpoints (`@nestjs/throttler`).
   `Commit: feat: add production health checks and rate limiting`
3. CI (GitHub Actions): lint → test → `prisma migrate deploy --dry-run`-style check → build, on every PR.
   `Commit: chore: add CI pipeline`

**Backend is done when:** every milestone above is merged to `main`, `docs/parity-checklist.md` is fully checked, and `npm run test:e2e` passes against a fresh `docker-compose up` Postgres+Redis. Only then start Prompt 2.

---

# PROMPT 2 — Frontend: Rails/Hotwire views → TanStack Router SPA (shadcn/ui)

Do not start this until Prompt 1's backend is complete and its OpenAPI spec is stable. You are building `apps/web` inside the same `spn-book` repo, consuming the NestJS API from Prompt 1. Same conventions as the backend: Conventional Commits, one branch/PR per milestone, GitHub Project board with a `frontend` label, learning-note issues wherever you want the "why" explained rather than just the "what."

### Stack constraints
- Vite + React + TypeScript, **TanStack Router** (file-based routing), **TanStack Query** (all server data — driven by a typed client generated from Prompt 1's OpenAPI spec via `openapi-typescript` or `orval`, never hand-written duplicate types), **TanStack Table** for list-heavy screens, **TanStack Form** or React Hook Form + zod (pick one, state it, stay consistent).
- **shadcn/ui**, themed from Sure's actual design tokens (`design/tokens/**` in the source repo) — not shadcn's defaults.
- App name **SPN Book** everywhere user-facing; do not reuse Sure/Maybe logo assets — placeholder wordmark only.

### Milestone 0 — Discovery
1. Read `app/views/**`, `app/components/**` (ViewComponents), `design/tokens/**`, and `app/javascript/**` (Stimulus controllers) in the source repo. Inventory every screen, its shadcn-primitive mapping, and every Stimulus behavior that needs a React equivalent (privacy-mode blur toggle, drag-and-drop goals, live filtering, chart rendering).
   `Commit: docs: add frontend source inventory notes`
2. Write `docs/frontend-inventory.md` (route → screen → shadcn primitives → notes on anything with no direct equivalent, e.g. chart library choice — pick one, e.g. Recharts wrapped in shadcn `Chart`, and use it everywhere).
   `Commit: docs: complete frontend migration inventory`

### Milestone 1 — Bootstrap
1. `npx @tanstack/cli create --router-only`.
   `Commit: chore: bootstrap Vite + React + TypeScript app`
2. Install and configure TanStack Router (file-based) + TanStack Query; generate the typed API client from Prompt 1's OpenAPI spec and commit the generation script (`package.json` script, not a one-off manual run).
   `Commit: chore: configure TanStack Router and generate typed API client`
3. Install shadcn/ui, port design tokens into `tailwind.config` / CSS variables.
   `Commit: chore: initialize shadcn/ui with ported design tokens`
4. Rebrand shell (title, favicon, manifest) to SPN Book.
   `Commit: chore: rebrand app shell to SPN Book`

### Milestone 2 — Auth screens & route guards
1. Login, signup, MFA challenge, passkey registration/login screens wired to Prompt 1's auth endpoints.
   `Commit: feat: implement auth screens`
2. Route-level guards via TanStack Router's `beforeLoad`.
   `Commit: feat: add authenticated route guards`

### Milestone 3 — App shell
1. Sidebar nav, top bar, family switcher, global privacy-mode blur toggle (state management: Zustand or router context — pick one).
   `Commit: feat: implement app shell and privacy mode`

### Milestones 4–13 — One per domain, mirroring the backend's order
For each of: Dashboard, Accounts, Transactions (+ CSV import wizard as deep-linkable nested routes via search params), Categories/Merchants, Rules builder, Budgets/Goals, Reports, AI Chat (streaming, matching whatever transport Prompt 1 chose), Family/Settings/Billing, Onboarding:
1. Scaffold the route file(s) under TanStack Router's file-based convention.
   `Commit: chore: scaffold <domain> routes`
2. Build the screen with shadcn primitives, TanStack Query loaders prefetching in `loader`, matching the original's layout/spacing/copy.
   `Commit: feat: implement <domain> screen(s)`
3. Loading/empty/error states.
   `Commit: feat: add loading and empty states for <domain>`
4. Component tests (Vitest + Testing Library) for anything stateful (rules builder, split-transaction UI, import wizard get the most attention).
   `Commit: test: cover <domain> components`

### Milestone 14 — Fidelity pass
1. Side-by-side visual comparison against the original app; fix spacing/color/copy drift.
   `Commit: fix: visual fidelity pass against source app`

### Milestone 15 — E2E & parity checklist
1. Playwright smoke test: login → dashboard → add account → add transaction → create rule → see it auto-apply.
   `Commit: test: add end-to-end smoke test`
2. Complete `docs/frontend-parity-checklist.md`, one row per screen from Milestone 0's inventory, noting any intentional deviation.
   `Commit: docs: complete frontend parity checklist`

**Frontend is done when:** every milestone is merged, the Playwright smoke test passes against the real (not mocked) Prompt-1 API, and the parity checklist is fully checked.
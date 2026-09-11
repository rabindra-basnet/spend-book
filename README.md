# Spend Book

A migration of [Sure](https://github.com/we-promise/sure) (a Rails 7 + Hotwire monolith, fork of Maybe Finance) into a Turborepo monorepo:

- **apps/api** — NestJS + Prisma + PostgreSQL + Redis/BullMQ backend (Prompt 1)
- **apps/web** — TanStack Router + shadcn/ui frontend (Prompt 2; not scaffolded until the backend API is stable)

The full migration plan lives in `prompt.md` (kept locally, not tracked).

## Monorepo

| Tool | Choice |
| --- | --- |
| Monorepo | [Turborepo](https://turborepo.dev) |
| Package manager | [nub](https://nub.dev) (`nub@0.9.0`) |
| Test runner | Jest (workspace-level) |
| Git | Conventional Commits, one branch/PR per milestone |

## Prerequisites

- Node.js 22+ (developed against Node 26)
- `nub` installed via `npm i -g @nubjs/nub`

## Getting started

```bash
nub install        # install workspace dependencies
nub run build      # build all packages
nub run dev        # run all dev servers
```

## Repository layout

```
apps/        application workspaces (api, later web)
packages/    shared packages
docs/        migration inventories and parity checklists
prompt.md    2-prompt migration plan (local only)
```

## Conventions

- **Committers**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- **Branches**: one `feat/XX-*` branch per milestone, merged via PR with a real description
- **Board**: GitHub Project columns `Backlog / In Progress / In Review / Done`; one Milestone + one Issue per numbered step in `prompt.md`
- **Backend-first**: `apps/web` is not started until Prompt 1's OpenAPI contract is stable
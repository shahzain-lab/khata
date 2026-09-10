# Khata — Accounting-only Ever Gauzy fork

This project is based on [Ever Gauzy](https://github.com/ever-co/ever-gauzy), trimmed to **accounting + financial reports**.

## Kept

- Accounting: invoices, estimates, income, expenses, recurring expenses, payments
- Clients & vendors (needed for invoicing / expenses)
- Financial reports: expense, payments, amounts owed, client budgets
- Dashboard (accounting), users, organizations, settings, auth

## Workspaces

Default seed creates tenant **Khata** with two organizations:

- **PipBattle** (default)
- **SAAZ**

Login after seed: `admin@ever.co` / `admin`

## Database (real Postgres, no demo)

Demo mode is off. Data persists in PostgreSQL.

```bash
docker compose -f docker-compose.khata.yml up -d
# .env.local: DEMO=false, DB_TYPE=postgres, DB_NAME=khata, ...
```

Seed (destroys existing DB data):

```bash
yarn ts-node -r tsconfig-paths/register --project apps/api/tsconfig.app.json ./apps/api/src/seed.ts
```

## Run (local)

Requires **Node.js >= 24** and Yarn 1.22.x.

```bash
yarn start:api
# UI (large heap on Windows):
$env:NODE_OPTIONS="--max-old-space-size=12288"; yarn start:gauzy
```

- UI: http://localhost:4200
- API: http://localhost:3000/api

## Deploy (Railway)

**Primary target:** Railway — Postgres + API + Web.

Full steps, env vars, seed, and OOM notes: **[RAILWAY.md](./RAILWAY.md)**

Quick shape:

| Service | Dockerfile |
|--------|------------|
| Postgres | Railway plugin |
| api | `.deploy/api/Dockerfile` |
| web | `.deploy/webapp/Dockerfile` |

Env template: `.env.railway.example`

## Note

Backend NestJS modules for employees/projects/etc. remain in `packages/core` (ORM coupling). They are hidden from the Khata UI.

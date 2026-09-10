# Deploy Khata on Railway

Khata needs **three Railway services** in one project:

| Service | Role | Dockerfile |
|--------|------|------------|
| **Postgres** | Database | Railway Postgres plugin |
| **api** | NestJS API | `.deploy/api/Dockerfile` |
| **web** | Angular UI (nginx) | `.deploy/webapp/Dockerfile` |

Workspaces after seed: **PipBattle** (default) and **SAAZ**. Login: `admin@ever.co` / `admin`.

---

## 1. Create the project

1. Open [Railway](https://railway.app) → **New Project**.
2. Add **PostgreSQL** (plugin).
3. From the same project, **Deploy from GitHub** (this Khata repo) twice — once for **api**, once for **web** (or add empty services and connect the repo).

---

## 2. Configure the API service

**Settings → Build**

- Builder: **Dockerfile**
- Dockerfile path: `.deploy/api/Dockerfile`
- (Optional) copy `.deploy/railway/railway.api.toml` → service root as `railway.toml`

**Settings → Networking**

- Generate a public domain (e.g. `khata-api-production.up.railway.app`)

**Variables** (Variables tab) — see `.env.railway.example`

```text
DEMO=false
NODE_ENV=production
DB_TYPE=postgres
DB_SSL_MODE=true
DB_SYNCHRONIZE=false

# Link Postgres (variable references):
DATABASE_URL=${{Postgres.DATABASE_URL}}

API_BASE_URL=https://<your-api-domain>
CLIENT_BASE_URL=https://<your-web-domain>
ALLOWED_ORIGINS=https://<your-web-domain>

JWT_SECRET=<openssl rand -hex 64>
JWT_REFRESH_TOKEN_SECRET=<openssl rand -hex 64>
JWT_VERIFICATION_TOKEN_SECRET=<openssl rand -hex 64>
EXPRESS_SESSION_SECRET=<openssl rand -hex 64>
```

Notes:

- Do **not** set `PORT` yourself — Railway injects it; `.deploy/api/entrypoint.prod.sh` maps `PORT` → `API_PORT` and binds `0.0.0.0`.
- `DATABASE_URL` is parsed into `DB_HOST` / `DB_USER` / `DB_PASS` / `DB_NAME` / `DB_PORT` automatically when those are unset.

**Healthcheck:** `/api` (already in `railway.api.toml`)

---

## 3. Configure the Web (UI) service

**Settings → Build**

- Dockerfile path: `.deploy/webapp/Dockerfile`
- Optional: `.deploy/railway/railway.web.toml` → `railway.toml`

**Networking:** public domain for the UI

**Variables:**

```text
DEMO=false
API_BASE_URL=https://<your-api-domain>
CLIENT_BASE_URL=https://<your-web-domain>
API_HOST=<your-api-domain>
API_PORT=443
COMPANY_SITE_NAME=Khata
COMPANY_NAME=Khata
```

The UI image substitutes these into the Angular bundle at container start (`entrypoint.prod.sh` + `replacements.sed`). Nginx listens on Railway’s `PORT`.

---

## 4. Deploy order

1. Postgres (ready)
2. Deploy **api** (migrations run on boot when `DB_SYNCHRONIZE=false`)
3. **Seed** the database (next section)
4. Deploy **web**
5. Confirm login and that PipBattle / SAAZ appear in the org switcher

---

## 5. Seed PipBattle + SAAZ (one-time)

The production API image does not include the full monorepo seed tooling. Seed once from your laptop against Railway Postgres:

1. In Railway → Postgres → **Connect** → enable **Public Networking** (temporarily) and copy `DATABASE_PUBLIC_URL` (or host/user/pass/db).
2. On your machine, in the Khata repo, point env at Railway (example):

```powershell
$env:DEMO="false"
$env:DB_TYPE="postgres"
$env:DB_SSL_MODE="true"
$env:DB_HOST="<railway-host>"
$env:DB_PORT="5432"
$env:DB_NAME="<db>"
$env:DB_USER="<user>"
$env:DB_PASS="<password>"
# JWT secrets can match production or any strong local values for the seed run
yarn ts-node -r tsconfig-paths/register --project apps/api/tsconfig.app.json ./apps/api/src/seed.ts
```

(Or copy values into `.env.local` and run the same seed command — seed now loads `.env` / `.env.local`.)

3. Turn **Public Networking** off again when done.
4. Restart the API service if it was already running against an empty DB.

This creates tenant **Khata**, orgs **PipBattle** + **SAAZ**, admin user, reports, expense categories, and vendors — **without** fake invoices/income/expenses.

---

## 6. Verify

- `https://<api>/api` → 200  
- `https://<web>/` → UI  
- Login `admin@ever.co` / `admin`  
- Create an expense or income → row remains after API restart (Postgres)

---

## Build memory (important)

Both Dockerfiles run large Node builds (`NODE_OPTIONS` ~12GB). Railway hobby builders often **OOM**.

Options:

1. Use a **higher-memory** Railway build plan / metal builder, or  
2. Build images in CI and deploy from a registry:

```bash
docker build -f .deploy/api/Dockerfile -t ghcr.io/<you>/khata-api:latest .
docker build -f .deploy/webapp/Dockerfile -t ghcr.io/<you>/khata-web:latest .
# push, then in Railway: Deploy from Docker Image
```

Local builds need Docker BuildKit (`DOCKER_BUILDKIT=1`).

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| API healthcheck fails | Ensure entrypoint is used; check logs for DB SSL / connection errors; set `DB_SSL_MODE=true` |
| UI calls wrong API | Set `API_BASE_URL` on **web** to the public API HTTPS URL and redeploy web |
| CORS errors | Set `ALLOWED_ORIGINS` on **api** to the exact web origin (https, no trailing slash) |
| Empty orgs / login fails | Run seed (section 5) |
| Build killed / OOM | Use a larger Railway builder, or build images in CI and deploy from a registry |
| `Cache mounts MUST...` / bind mount errors | Fixed in Dockerfiles (Railway does not support `RUN --mount=type=bind`). Redeploy latest `main`. |
| Insecure secrets refuse start | Set strong unique JWT / session secrets (`DEMO=false` + production) |

---

## Local parity

```bash
docker compose -f docker-compose.khata.yml up -d   # Postgres
# .env.local: DEMO=false, DB_TYPE=postgres, ...
yarn start:api
# UI with large heap on Windows:
# $env:NODE_OPTIONS="--max-old-space-size=12288"; yarn start:gauzy
```

---

## Next: push to GitHub, then Railway

Do **not** push to `ever-co/ever-gauzy`. Use your own GitHub repo.

### A. Create GitHub repo + push

```powershell
# 1) Create an empty private repo on GitHub named e.g. Khata (no README)

# 2) Point origin at YOUR repo (replace USER)
git remote rename origin upstream
git remote add origin https://github.com/USER/Khata.git

# 3) Push this branch
git push -u origin HEAD
```

Or keep `develop` and push:

```powershell
git push -u origin develop
```

Never commit `.env.local` (secrets). Use `.env.railway.example` / Railway Variables instead.

### B. Connect Railway

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select **your** Khata repo.
2. Add **PostgreSQL**.
3. Add two services from the same repo:
   - **api** — Dockerfile `.deploy/api/Dockerfile`
   - **web** — Dockerfile `.deploy/webapp/Dockerfile`
4. Generate public domains for api + web.
5. Set variables from `.env.railway.example` (section 2–3 above), including:
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}` on **api**
   - Matching `API_BASE_URL` / `CLIENT_BASE_URL` / `ALLOWED_ORIGINS`
   - Strong JWT / session secrets
6. Deploy **api** first → seed once (section 5) → deploy **web**.
7. Login: `admin@ever.co` / `admin` → workspaces **PipBattle** + **SAAZ**.

If Docker builds OOM on Railway, build/push images yourself (section “Build memory”) and deploy from the registry.

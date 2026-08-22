# CyberShield

CyberShield is a cybersecurity risk-assessment tool for small and medium enterprises. Users register, complete a structured questionnaire across five security domains, receive a scored risk profile with recommendations, and can download a PDF report.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18 (Vite) |
| Backend | Node.js 20 + Express + TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt (bcryptjs) + rate limiting |
| Containers | Docker Compose for local development |
| Tests | Jest (unit), Newman and Cypress later |

## Repository layout

```
/client   React 18 + Vite UI (port 5173)
/server   Express API (port 4000)
```

## Local development with Docker

1. Copy the environment template and edit secrets if you want:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL, the API, and the Vite client:

   ```bash
   docker-compose up --build
   ```

   `docker compose up --build` is equivalent on newer Docker Desktop installs.

3. Open the app:

   - Client: [http://localhost:5173](http://localhost:5173)
   - API health check: [http://localhost:4000/health](http://localhost:4000/health)
   - Postgres: `localhost:5432`, database `cybershield`

The database uses a named Docker volume (`postgres_data`) so data survives container restarts. The API applies SQL migrations on startup.

Load the sample questionnaire (20 questions across five domains):

```bash
docker compose exec server npm run seed
```

Or from `/server` against a local Postgres: `npm run migrate && npm run seed`.

Stop the stack with `Ctrl+C`, or run `docker compose down`. Add `-v` only if you also want to delete the database volume.

## Running without Docker

You still need a local PostgreSQL 16 instance named `cybershield`, then:

```bash
cp .env.example .env

cd server
npm install
npm run dev

cd ../client
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:4000`.

## Questionnaire and Cypress

After the database is migrated and seeded, register or log in at [http://localhost:5173](http://localhost:5173). The questionnaire walks through one domain at a time and saves each answer immediately.

After a completed assessment, the results page can download a PDF report. Newman checks that the report route requires auth, returns 404 for an unknown assessment, and returns `application/pdf` for a completed one (API + seed must be running):

```bash
cd server
npm run test:api
```

End-to-end test (client, server, and seed data must already be running):

```bash
cd client
npm run test:e2e
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs (Phase 2) |
| `JWT_EXPIRY` | Token lifetime, e.g. `1h` |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Express listen port (default `4000`) |
| `REPORT_ENCRYPTION_KEY` | 64 hex chars; AES-256-GCM key for stored PDFs |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional; seed creates an admin who can manage questions |

See [SECURITY.md](SECURITY.md) for what is implemented vs known gaps, and [docs/TEST-LOG.md](docs/TEST-LOG.md) for the Section 5 test appendix.

Never commit a real `.env` file. `.env.example` is the checked-in template only.

## Assessment phases

This repo is built in phases:

0. Monorepo and Docker environment
1. Database schema and question seed data
2. JWT authentication
3. Questionnaire flow
4. Scoring engine and recommendations
5. PDF risk report
6. Security and accessibility hardening

The implementation brief ends at Phase 6. The Assessment 2 test log (Jest results plus Newman/Cypress placeholders) is in [docs/TEST-LOG.md](docs/TEST-LOG.md).

# CyberShield client

React 18 + Vite UI for CyberShield.

```bash
npm install
npm run dev
```

The Vite dev server runs on port 5173 and proxies `/api` and `/health` to the Express server.

## Cypress

The questionnaire spec logs in (via register), answers every domain, and checks the assessment is marked `completed`.

```bash
npm run test:e2e
```

The API, database, and question seed must already be running.

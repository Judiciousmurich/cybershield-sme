# CyberShield server

Node.js 20 + Express + TypeScript API.

```bash
npm install
npm run dev
```

The API listens on port 4000. `GET /health` is the readiness check used by local development.

## Database

SQL migrations live in `/server/migrations`. The server applies pending files on startup. You can also run them (and the question seed) by hand:

```bash
npm run migrate
npm run seed
```

`seed` upserts 20 questionnaire items across the five assessment domains so later phases have real content to test against.

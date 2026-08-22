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

## Auth

- `POST /api/auth/register` — email + password, bcrypt hash, 409 on duplicate email
- `POST /api/auth/login` — issues a JWT (default 1h)
- `GET /api/auth/me` — current user; requires `Authorization: Bearer <token>`
- Auth routes are rate-limited to slow brute-force attempts

## Questionnaire

Authenticated routes:

- `GET /api/questions` — active questions grouped by domain
- `POST /api/assessments` — start an `in_progress` assessment
- `GET /api/assessments/current` — resume the latest open assessment
- `GET /api/assessments/:id` — one assessment you own, plus responses
- `POST /api/assessments/:id/responses` — save or update an answer
- `POST /api/assessments/:id/complete` — mark complete once every question is answered

```bash
npm test
```

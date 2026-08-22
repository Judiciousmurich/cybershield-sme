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
- `GET /api/assessments/:id/results` — per-domain scores, overall score, risk band, recommendations
- `GET /api/assessments/:id/report` — downloadable PDF (requires a completed assessment you own)
- `PATCH /api/auth/me` — optional `business_context` printed on the report

```bash
npm run test:api
```

Admin (JWT + `role=admin` only):

- `GET /api/admin/questions` — all questions, including inactive
- `POST /api/admin/questions` — create
- `PUT /api/admin/questions/:id` — update text, weight, options, or `active`

Seed an admin when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.

See `/SECURITY.md` for headers, AES-256 at rest, and known gaps.

Newman collection: `/postman/CyberShield-report.postman_collection.json`.

Scoring is a weighted percentage per NIST CSF-aligned domain. Thresholds: High risk below 40%, Medium from 40 up to 70%, Low at 70% and above. See the comment block in `src/scoring/engine.ts`.

```bash
npm test
```

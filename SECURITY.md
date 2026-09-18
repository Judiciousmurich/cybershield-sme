# CyberShield security and accessibility notes

This file is the honest audit log for Assessment 2: what is implemented, what we checked, and what is still a gap.

## Implemented

| Control | Where | Notes |
| --- | --- | --- |
| TLS 1.2+ | Deploy / PaaS | Not terminated in this repo. Local Docker is HTTP on localhost. Production must sit behind HTTPS (for example Nginx, Caddy, or a PaaS edge). |
| AES-256-GCM | `server/src/crypto/aes.ts` | Generated PDFs are encrypted before they are stored in PostgreSQL. `REPORT_ENCRYPTION_KEY` must be 32 bytes (64 hex characters or base64). The API still returns the plaintext PDF over the authenticated download. |
| Password hashing | `server/src/auth/service.ts` | bcrypt via bcryptjs, 10 rounds. `password_hash` is never included in `toPublicUser` or any JSON body. |
| JWT | `server/src/auth/tokens.ts` | HS256, short expiry (`JWT_EXPIRY`, default 1h). `requireAuth` returns 401 for missing or invalid tokens. |
| RBAC | `server/src/middleware/requireRole.ts` | `user` vs `admin`. Question catalogue writes are `GET/POST /api/admin/questions` and `PUT /api/admin/questions/:id` (admin only). Ordinary users cannot change questions. |
| Rate limiting | auth routes + global | Auth: 10 / 15 minutes. All API routes: 100 / 15 minutes (in-memory, per process). |
| Input validation | Zod | Every POST/PUT/PATCH body is schema-checked (`server/src/validation/http.ts`) plus answer-type checks. |
| HTTP headers | Helmet | `helmet()` on the Express app. `X-Powered-By` disabled. |
| Ownership | assessments | Users only read or complete their own assessments (`404` otherwise). |

An optional admin account is created by `npm run seed` only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Registration always creates `role=user`; clients cannot self-promote.

## Accessibility (WCAG 2.1 AA)

Static review plus Cypress-axe on the questionnaire and results pages (`cypress-axe`, critical and serious impacts).

**Fixed in this pass**

- Unique document titles per page (2.4.2).
- Error text tied to auth fields with `aria-invalid` and `aria-describedby` (3.3.1 / 3.3.2).
- Removed a redundant `role="radiogroup"` inside a `fieldset` (nested grouping).
- Keyboard focus moves to the domain status when the user goes to the next/previous domain (2.4.3).
- Disabled buttons no longer use low-opacity blue-on-blue (1.4.3). Hint text darkened to `#1f2937`.

**Still open (do not hide these)**

- Cypress-axe is not wired into CI. The spec lives in `client/cypress/e2e/questionnaire.cy.ts` and needs the live stack + seed. This session did not treat a live axe HTML report as a substitute for that run.
- Native `<meter>` styling differs by browser; the numeric percentage is always in the cell so colour or meter chrome is not the only cue.
- There is no separate high-contrast theme beyond OS/browser settings.
- There is no admin UI, so we did not axe-test question-management screens.
- Target size of some compact controls may fail WCAG 2.2 AAA (2.1 AA does not require 24px targets).

## Known security gaps

Declare these in the viva rather than implying the product is “fully hardened”:

- **No TLS in docker-compose.** Local traffic is plaintext HTTP.
- **Development CORS is open** (`cors()` with default origin `*`). The production build serves the SPA from Express on the same origin and does not enable CORS.
- **JWT is stored in `sessionStorage`.** An XSS bug could steal it. HttpOnly cookies were not implemented.
- **No token denylist / refresh rotation.** Logout only clears the browser; the JWT stays valid until expiry.
- **In-memory rate limits** reset on process restart and do not share across containers.
- **Compose Postgres uses a default password.** Change it before any shared host.
- **`REPORT_ENCRYPTION_KEY` is an env var, not a KMS.** Key rotation and envelope encryption are out of scope.
- **No admin UI and no audit log** of who changed questions.
- **Business context is stored in plaintext** in `users.business_context` (only the PDF file on disk is AES-wrapped).

## How to re-run checks

```bash
cd server && npm test
# live API + seed:
cd client && npm run test:e2e
```

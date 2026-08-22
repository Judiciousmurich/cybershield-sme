# Assessment 2 — Test log

**Product:** CyberShield  
**Run date:** 23 August 2026  
**Environment:** Node.js + Jest 29 on the local `/server` tree (`npm test`)  
**Tester:** local development run (this appendix)

How to read status:

- **Pass** — executed in this run; expected and actual match
- **Not executed** — spec exists; needs a live API / UI stack (Postgres + seed + both processes)
- **Defect ID** — only if a run failed; none in this Jest run

---

## 1. Unit / API (Jest)

Command: `cd server && npm test`

Result: **7 suites, 22 tests, 0 failures** (9.6 s)

| Test ID | Linked requirement | Test case | Expected | Actual | Status | Defect ID |
| --- | --- | --- | --- | --- | --- | --- |
| UT-01 | FR-01 | Registers a new user and never returns the password hash | 201; email stored lower-case; bcrypt hash stored; `password_hash` absent from JSON | 201; hash compared with bcrypt; no `password_hash` in body | Pass | — |
| UT-02 | FR-01 | Rejects a duplicate email | 409; create not called | 409; `already registered` | Pass | — |
| UT-03 | FR-01 | Logs in with valid credentials | 200; JWT string; `expiresIn` 1h; no password hash | 200; token present; expiry `1h` | Pass | — |
| UT-04 | FR-01 | Rejects a wrong password | 401; no token | 401; `Invalid email or password` | Pass | — |
| UT-05 | NFR-01 | `requireAuth` rejects an unauthenticated `/api/auth/me` | 401 | 401; `Authentication required` | Pass | — |
| UT-06 | FR-03 | Accepts a valid yes/no answer | Validation returns null | null | Pass | — |
| UT-07 | FR-03 | Rejects an answer not in the allowed options | Clear “must be one of” message | Message matches | Pass | — |
| UT-08 | FR-03 | Accepts a scale value on the min/max boundary | 1 and 5 valid for 1–5 | Both null (valid) | Pass | — |
| UT-09 | FR-03 | Rejects a scale value outside the range | Error mentioning 1 and 5 | `6` rejected | Pass | — |
| UT-10 | FR-03 | API rejects a mismatched response body | 400; upsert not called | 400; `must be one of: yes, no` | Pass | — |
| UT-11 | FR-03 | API saves a valid answer | 200; stored value `yes` | 200; `yes` | Pass | — |
| UT-12 | FR-04 | Domain weighted yes/no with known inputs | Earned 3 / max 4 → **75%**, band Low | 75 / Low | Pass | — |
| UT-13 | FR-04 | Overall is the mean of five domain percentages | Domains 100,100,0,0,100 → overall **60%**, Medium | 60 / Medium | Pass | — |
| UT-14 | FR-04 | Risk band exactly at Low threshold (70) | Low | Low | Pass | — |
| UT-15 | FR-04 | Risk band just below Low (69.9) | Medium | Medium | Pass | — |
| UT-16 | FR-04 | Risk band exactly at High/Medium threshold (40) | Medium | Medium | Pass | — |
| UT-17 | FR-04 | Risk band just below 40 (39.9) | High | High | Pass | — |
| UT-18 | FR-04 | Recommendations prioritise the weakest domain under 70% | First item is `data_backup`; access_control omitted | First domain `data_backup`; no access_control | Pass | — |
| UT-19 | FR-06 | PDF buffer starts with `%PDF` | Magic bytes `%PDF`; size > 200 bytes | `%PDF`; length check passed | Pass | — |
| UT-20 | NFR-01 / RBAC | Standard user cannot list admin questions | 403 | 403 | Pass | — |
| UT-21 | NFR-01 / RBAC | Admin can list questions | 200; `questions: []` (mocked empty) | 200 | Pass | — |
| UT-22 | NFR (AES-256) | AES-256-GCM round-trips report bytes | Ciphertext ≠ plaintext; decrypt equals original | Pass | Pass | — |

---

## 2. API / integration (Newman)

Collection: `postman/CyberShield-report.postman_collection.json`  
Command: `cd server && npm run test:api` (API + seed must be running)

| Test ID | Linked requirement | Test case | Expected | Actual | Status | Defect ID |
| --- | --- | --- | --- | --- | --- | --- |
| API-01 | FR-06 / NFR-01 | GET report without a token | 401 | Not run in this session | Not executed | — |
| API-02 | FR-06 / NFR-01 | GET report for unknown / non-owned UUID | 404 | Not run in this session | Not executed | — |
| API-03 | FR-06 | GET report for a completed owned assessment | 200; `Content-Type` includes `application/pdf`; body starts `%PDF` | Not run in this session | Not executed | — |

**How to execute:** start Postgres, migrate, seed, `npm run dev` in `/server`, then `npm run test:api`. Paste the Newman summary into Actual / Status.

---

## 3. System / usability / accessibility (Cypress)

Spec: `client/cypress/e2e/questionnaire.cy.ts`  
Command: `cd client && npm run test:e2e` (Vite + API + seed must be running)

| Test ID | Linked requirement | Test case | Expected | Actual | Status | Defect ID |
| --- | --- | --- | --- | --- | --- | --- |
| SYS-01 | FR-03 | Register, complete all five domains, assessment marked complete | Path `/complete`; status `completed`; GET assessment `completed_at` set | Not run in this session | Not executed | — |
| SYS-02 | NFR (WCAG 2.1 AA) | axe-core on questionnaire (critical / serious) | No critical or serious violations | Not run in this session | Not executed | — |
| SYS-03 | NFR (WCAG 2.1 AA) | axe-core on results page (critical / serious) | No critical or serious violations | Not run in this session | Not executed | — |

Static review and code fixes from Phase 6 are listed in [SECURITY.md](../SECURITY.md). Unresolved limitations stay there; do not mark SYS-02/03 Pass until Cypress-axe has been run.

---

## 4. Traceability (Section 5)

| Requirement | Evidence in this log | Repo location |
| --- | --- | --- |
| FR-01 Register / login | UT-01–UT-04 | `server/tests/auth.test.ts` |
| NFR-01 No unauthorised API access | UT-05, UT-20, API-01 | `requireAuth`, `requireRole` |
| FR-03 Questionnaire + valid answers | UT-06–UT-11, SYS-01 | `server/tests/answers.test.ts`, Cypress |
| FR-04 Score accuracy | UT-12–UT-18 | `server/tests/scoring.test.ts` |
| FR-06 PDF report | UT-19, API-01–API-03 | `server/tests/pdf.test.ts`, Newman |

---

## 5. Defects

None raised from the 23 August 2026 Jest run.

When Newman or Cypress fails, add a row here (`DEF-nn`), link the Test ID, and keep Status = Fail until re-test.

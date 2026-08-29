# MoneyFlow Architecture & Repository Rules

> This document describes the architecture implemented in this repository and
> is the source of truth for future changes. It reflects the code as reviewed
> on 2026-08-29; the **Review findings** section records known gaps rather than
> silently treating them as design decisions.

## 1. System overview

MoneyFlow is a personal-finance application for LINE users. A React LIFF client
authenticates the user with LINE, exchanges the LIFF ID token for an application
JWT, and calls a NestJS REST API. The API persists financial data in MongoDB,
stores slip files in Firebase Storage, obtains OCR/financial-assistant output
from Gemini, and uses the LINE Messaging API for notifications and webhook
interactions.

```text
LINE Rich Menu / LIFF WebView             LINE Messaging API
            |                                      ^
            v                                      |
 React 18 + Vite (apps/web) ---- JWT ----> NestJS API (apps/api)
       TanStack Query / Zustand                 |        |
                                               v        v
                                            MongoDB   Firebase Storage
                                               |
                                               v
                                            Gemini API
```

Deployment is configured for Vercel: the static web build is served from
`apps/web/dist`; `api/index.ts` forwards serverless requests to the Nest/Express
adapter. Root `vercel.json` rewrites API paths to that function and all other
paths to the SPA.

## 2. Repository layout and ownership

| Path | Responsibility | Rules |
| --- | --- | --- |
| `apps/web` | LIFF-facing React SPA | Pages compose UI; server data goes through TanStack Query and `services/api.ts`; local auth state stays in Zustand. |
| `apps/api` | NestJS REST API and integrations | Controllers are transport-only, services contain use cases, modules declare dependencies, schemas own persistence mapping. |
| `apps/api/src/schemas` | Mongoose models and database indexes | Change schema and shared contract together where the public model changes. Preserve ownership/index constraints. |
| `packages/shared` | Cross-app enums and TypeScript interfaces | The only shared domain-contract package. Add/alter public domain shapes here first; do not import API internals from web. |
| `api/index.ts` | Vercel serverless entry point | Keep as a thin forwarding adapter; startup configuration belongs in `apps/api/src/main.ts`. |
| `prompt` | Historical project prompts | Reference material only; it is excluded by `.gitignore` and must not override this document or implementation. |

The root uses npm workspaces. Build `@moneyflow/shared` before `web` and `api`:
`npm run build`. Use workspace commands for focused work, for example
`npm run test --workspace=api`.

## 3. Backend boundaries

### Request lifecycle

1. `main.ts` creates Nest on an Express adapter, captures the unmodified body
   needed to validate LINE webhook signatures, enables DTO validation, and
   configures CORS.
2. The LIFF client calls `POST /auth/line` with an ID token. `AuthService`
   verifies it with LINE, upserts the user, seeds initial categories, and signs
   a JWT with `{ sub: user._id, lineUserId }`.
3. All user-data controllers use `JwtAuthGuard`. The authenticated principal's
   `req.user.userId` is the authoritative tenant boundary; never accept a
   `userId` supplied by a client.
4. A controller passes validated parameters to one service. The service enforces
   ownership in every read/write query and coordinates related state changes.

### Modules

| Module | Owns | Key dependency/behaviour |
| --- | --- | --- |
| `auth` | LINE token exchange, users, initial categories, JWT issuance | Only `POST /auth/line` is public. |
| `categories` | Per-user category CRUD | Deletion is soft (`isActive: false`). |
| `transactions` | Transaction CRUD, summaries, signed slip URLs | Expense mutations update the associated budget. |
| `budgets` | Monthly category limits, calculated spend, alert state | Unique key: `userId + categoryId + month + year`. |
| `slips` | Upload tracking, storage, OCR and confirmation | Confirmation delegates transaction creation; do not create duplicate transactions directly. |
| `dashboard` | Read-only aggregates and chart data | Query MongoDB aggregates; do not duplicate dashboard totals in storage. |
| `notifications` | LINE push messages and budget alert thresholds | Called after changes that affect expense spend. |
| `webhook` | Verified LINE inbound events | Must verify the exact raw request body before processing events. |
| `advisor` / `gemini` | AI financial context and Gemini calls | AI output is advisory/untrusted; never use it as an authorization or accounting decision. |
| `firebase` | Firebase Admin and signed object URLs | Global infrastructure provider; keep credentials outside source control. |

### Financial-data invariants

- Every User-owned query must include the authenticated `userId`.
- A category belongs to one user. Categories are deactivated rather than removed.
- A transaction stores its accounting `month` and `year`; calculate them from
  `date` and the optional next-cycle fields in one place, not in controllers or
  the client.
- `Budget.spentAmount` is a derived cache of expense transactions. Creating,
  editing, deleting, or confirming an expense must apply the exact compensating
  delta and then re-check alerts. For high-integrity multi-document changes,
  prefer a MongoDB transaction or a reconciliation-safe design.
- Store storage object paths in MongoDB. Generate short-lived signed URLs only
  when returning data to a client.
- Category names are unique per user and category type, so the same name can
  be used once for income and once for expense. Keep the monthly budget unique
  index. New user-scoped query patterns require a matching index review.

## 4. Frontend boundaries

- `App.tsx` owns providers, routes, and LIFF readiness; pages must not create a
  second QueryClient or initialize LIFF themselves.
- `services/api.ts` is the sole Axios instance. It adds the Bearer token and
  clears authentication on `401`; do not scatter raw API base URLs or auth
  headers throughout components.
- Use TanStack Query for API data, caching, mutations, invalidation, loading,
  and error states. Use Zustand only for client state such as authentication.
- UI components are reusable presentation/interaction units under
  `components`; routes and page-specific data composition stay under `pages`.
- Import shared enums/interfaces from `@moneyflow/shared`; do not duplicate
  API-facing domain types in the web app unless they are intentionally a
  view-only shape.
- The LIFF client must send an ID token only to `POST /auth/line`; API calls
  after login use the application JWT.

## 5. API, validation, and security rules

- New externally supplied fields need a DTO with `class-validator` decorators.
  Keep `ValidationPipe` whitelist behaviour effective; do not use `any` for
  public request contracts.
- Protect all new user-data endpoints with `JwtAuthGuard`. Explicitly document
  any exception (such as webhook or health endpoint) and apply its alternative
  verification.
- Webhook signatures must use timing-safe comparison (`crypto.timingSafeEqual`)
  and reject missing/invalid signatures. Never process a webhook merely because
  its event list is empty.
- Validate configuration at API bootstrap. Production must fail closed when
  required credentials, MongoDB URI, JWT secret, or allowed frontend origins
  are absent. Production CORS must never fall back to `true`.
- Do not log tokens, webhook bodies containing personal data, service-account
  contents, or raw OCR results.
- File upload checks must include size, allowlisted MIME type, and content
  verification where feasible. Treat OCR results as drafts requiring user
  confirmation.
- Do not commit `.env`, Firebase service accounts, private keys, or generated
  credentials. Rotate a credential immediately if it was ever committed or
  exposed; `.gitignore` cannot remove a secret from Git history.

## 6. Configuration

Required environment variables are documented in `.env.example` and the app
examples. The canonical names currently consumed by the code are:

`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `LINE_CHANNEL_ID`,
`LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `GOOGLE_GEMINI_API_KEY`,
`FIREBASE_STORAGE_BUCKET`, `FIREBASE_SERVICE_ACCOUNT`, `FRONTEND_URL`,
`VITE_API_URL`, and `VITE_LIFF_ID`.

`VITE_*` values are public build-time values; no secret may use that prefix.
Keep `.env.example`, `apps/api/.env.example`, and `apps/web/.env.example`
consistent whenever configuration changes.

## 7. Credit-card extension

Credit cards are a payment instrument, not a second expense stream. `CreditCard`
stores only user-owned display/billing settings and the last four digits;
PAN, CVV, track data, and processor tokens are never accepted or stored.

`Transaction.paymentMethod` and `creditCardId` identify a card purchase, while
server-calculated `statementMonth`/`statementYear` identify its statement.
The purchase remains an expense in the month it occurred, so budgets do not
shift to the billing cycle. `CreditCardPayment` records payments against a
statement separately; it must not create another expense transaction.

The secured API is `GET/POST /credit-cards`, `PATCH /credit-cards/:id`,
`GET /credit-cards/:id/statements?month=&year=`, and
`POST /credit-cards/:id/payments`. Every query is scoped to the JWT user and a
payment cannot exceed the outstanding statement balance. Statement totals are
derived from linked transactions less payments, so they cannot drift as a
second mutable ledger.

## 8. Change checklist

1. Identify the owning module and update its DTO/service/controller/schema as
   required—do not bypass a service from an unrelated module.
2. Update `@moneyflow/shared` for changed shared domain contracts, then build
   it before its consumers.
3. Preserve tenant filters, validation, and compensation of budget totals.
4. Add or update focused service tests for transactions, budgets, auth, and
   other financial invariants.
5. Run `npm run build` and the affected workspace tests/lint before merging.
6. Recheck Vercel rewrites whenever adding a public API path or cron endpoint.

## 9. Review findings to resolve

These are implementation gaps discovered during the review, ordered by risk.

1. **Critical — local Firebase credential file:** a service-account JSON exists
   under `apps/api/src/modules/firebase/`. It is ignored and not currently
   tracked, but should be removed from developer working copies after rotation
   and replaced exclusively with `FIREBASE_SERVICE_ACCOUNT` environment config.
2. **High — production security defaults:** CORS currently permits all origins
   if `FRONTEND_URL` is absent, and webhook verification has permissive paths
   (including success when `LINE_CHANNEL_SECRET` is missing). Fail closed in
   production and use a timing-safe signature comparison.
3. **High — controller DTO coverage:** budget and slip confirmation bodies use
   individual `@Body` fields or inline types, so their nested data lacks
   consistent runtime validation. Introduce request DTOs with nested validation.
4. **Medium — contract/deployment drift:** the original prompts specify some
   routes and technologies that differ from the implementation (for example
   Gemini/Firebase versus Claude/blob storage). Treat current code plus this
   document as the operative architecture until a deliberate migration updates
   all documentation and environment templates.
5. **Medium — source hygiene:** `packages/shared/src` contains generated
   `.js`, `.d.ts`, and source-map files alongside TypeScript source. Generate
   build output only to `dist` and remove tracked/generated duplicates in a
   dedicated cleanup change.
6. **Medium — Vercel configuration drift:** configured cron paths and several
   rewritten API groups do not have corresponding controllers in the reviewed
   code. Add the endpoints with authorization or remove the configuration.
7. **Medium — budget consistency:** transaction and budget updates span multiple
   writes. Add transactions/reconciliation protection before relying on exact
   budget totals under concurrent requests.

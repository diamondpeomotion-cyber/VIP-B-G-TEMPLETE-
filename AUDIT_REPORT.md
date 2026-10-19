# End-to-End Wiring & Gap Audit — Nexora White-Label Salon Studio

**Date:** 2026-10-19 · **Branch:** `arena/1866972d-vip-b-g-templete` · **Auditor:** Arena Agent Mode (senior full-stack sweep)

## 0. Stack clarification (read first)

The audit brief mentioned Next.js/SSR, Supabase/RLS, and ESM fetch semantics. The repository is actually a **Vite + React 19 SPA + Express + SQLite (better-sqlite3)** application — no Next.js, no SSR, no Supabase. The audit was carried out against the real stack:

- Routing/subdomain layer → hardened in the **client SPA router** (`src/Root.tsx`) plus `vercel.json` rewrites, which is the correct equivalent of "subdomain fallback without SSR crash" for a static SPA.
- RLS/schema integration → the equivalent concern is **tenant scoping** (`salon_id`/`user_id` on every query) plus self-migrating SQLite schema; both verified by the smoke suite's cross-tenant isolation assertions.
- All gaps below were found by static tracing of every route, endpoint, modal, and component — then fixed, rebuilt, and verified end-to-end.

## 1. Findings & fixes by layer

### Layer 1 — Routing, subdomains, template rendering on Vercel

| ID | Finding | Fix |
|---|---|---|
| R1 | No `vercel.json`: deep links (`/s/:slug`, `/dashboard`) would 404 on refresh after a static deploy | Created `vercel.json` — SPA rewrites, security headers, immutable asset caching |
| R2 | Subdomain router had no reserved-word list: `admin.domain`, `api.domain`, Vercel preview hosts (`branch--project.vercel.app`) could be misread as salon slugs | `RESERVED_SUBDOMAINS` set + preview-suffix guard in `src/Root.tsx`; `isTenantHost`/`platformPath` helpers keep platform routes unreachable from tenant hosts |
| R3 | Bare `/s/` (no slug) rendered a blank/error state with no recovery | Platform-path guard renders the marketing sites page instead |
| R4 | Unknown subdomain crashed into the site loader with no graceful fallback | `SiteError` "This site isn't published" card with **Try again** (retry key refetch) and a **Claim this address** CTA for logged-in users |

### Layer 2 — Booking / appointment modal flow

| ID | Finding | Fix |
|---|---|---|
| B1 | No availability API: modal offered static slots, double-bookings possible | `GET /api/site/:slug/availability` (`server/availability.ts`) — booked-window-aware grid built from the same `TIME_SLOTS`/duration rules as booking validation |
| B2 | Booking POST had no conflict guard | Server-side 409 `SLOT_TAKEN` with alternate `suggestions`, computed by the shared slot engine (`server/builder.ts`) |
| B3 | Past-date / closed / paused-specialist bookings accepted | Date-not-in-past check, open-hours + published checks shared by availability and booking POST; paused specialists rejected with 400 on both endpoints |
| B4 | Modal had no loading/error/retry states; conflicts showed `alert()` | Live availability fetch with skeleton → error → **retry** states; 409 auto-refreshes the grid and preserves user input |
| B5 | No validation messaging for missing name/email/service | Inline field-level errors + error summary box; email regex; submit disabled while invalid |
| B6 | Customers couldn't view/cancel their bookings (dead "Manage booking" surface) | `GET …/bookings/lookup?email` + `POST …/bookings/:id/cancel` (email ownership proof) with matching modal wiring in `PublicSite.tsx`; owner-side status flow (`new → confirmed → completed/cancelled`) verified |
| B7 | Legacy `/demo` SalonOS booking used `alert()` errors, no slot-conflict logic | Inline `bookingError` banner in quick-booking modal + simulator; server-side overlap guard + tenant-membership + date/time validation (`server/legacy.ts`) |

### Layer 3 — Core modules, UI state, schema/client integration

| ID | Finding | Fix |
|---|---|---|
| U1 | `primary-action` / `secondary-action` button classes referenced but never defined — buttons rendered unstyled | Full action-button system in `src/index.css` (primary/secondary/danger/ghost + `:disabled`, focus-visible), consumed via `fields.tsx` primitives |
| U2 | No toggle-switch component; staff online-booking state untoggleable | Accessible `Toggle` primitive (`fields.tsx`) + **Online booking** switch per team member in Dashboard → Team, persisted via `accepting_bookings` |
| U3 | `acceptingBookings`/`duration` missing from TS types, SQLite schema, and public mappings — staff payloads silently dropped the flags | `server/db.ts` migrations + `DbStaff`/`DbBooking` fields + `toPublic*` mappings; `types.ts` contracts; `sanitizeStaff` camelCase-wins precedence (fixed real toggle-ON bug caught by smoke) |
| U4 | `src/components/ClientDashboard.tsx` was an empty file while referenced | Implemented customer lookup/cancel dashboard |
| U5 | AI fallback responses indistinguishable from live AI | `fallback: true` flag surfaced as "offline suggestions" notices in `OnboardingWizard` and `MarketingPanel` |
| U6 | Dead fragments: `app/` (Next-route stubs), `components/` (demo flow), `src/auth.ts` (NextAuth stub), orphan booking/navigation/tenant components, stale `.d.ts` | Deleted; zero dangling imports (tsc clean) |
| U7 | Fetch wrapper had no network-failure handling | `api.ts` wraps network errors into typed `{ error }` results; modals show retry |

### Layer 4 — API/server hardening & types

| ID | Finding | Fix |
|---|---|---|
| S1 | No request logging, unknown `/api/*` returned HTML 404, unhandled errors leaked stack traces | `server/http.ts`: JSON logger, JSON 404, global `errorHandler`; `GET /api/health` readiness probe with DB check |
| S2 | AI endpoints could 500 (no key / malformed Gemini output / network fail) | `server/ai.ts` rewrite: input clamping, output-shape validation, curated salon-aware fallbacks with logging — always 200 |
| S3 | Legacy demo endpoints accepted invalid enums, cross-branch service/stylist combos, overlapping appointments | Enum allowlists, tenant-membership checks, overlap guard (`server/legacy.ts`) |
| S4 | TypeScript clean-build requirement | `tsc --noEmit` exit 0; `npm run build` (Vite + esbuild) clean; `npm run smoke` script added |

## 2. Verification evidence

- **Smoke suite** (`scripts/smoke.mjs`, 45 assertions) against the production bundle on a scratch SQLite DB — **45/45 passed**, covering: health → signup → salon → services/staff → publish → availability → booking → 409 conflict → lookup → cancel → owner inbox → AI (live + fallback + validation) → admin RBAC + `ADMIN_EMAILS` bootstrap → cross-tenant isolation → legacy demo endpoints → bulk staff-toggle persistence → paused-specialist rejection.
- **Dev boot check** (`tsx server.ts`): health/SPA-deep-link/JSON-404 verified.
- **Full `git diff` review** of every touched file to confirm no edit was silently dropped.

## 3. Residual risks / follow-ups (out of scope)

1. SQLite is single-file — multi-instance deployments need an external DB (e.g. Postgres) before horizontal scaling.
2. Rate limiting is in-memory — same caveat for multi-instance.
3. Gemini integration is keyed off `GEMINI_API_KEY`; without it the app correctly serves curated fallbacks (flagged in UI).
4. No automated browser (Playwright/Cypress) tests — smoke suite covers API + availability contracts; UI states (retry/skeletons/toggles) were verified by code review only.

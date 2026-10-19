# Nexora White-Label Salon Studio

A production-ready **white-label salon website builder**. Every salon owner signs up, walks through a guided onboarding wizard, customizes **everything** — salon/website name, logo, hero image, services & prices, staff, address, contact details, brand colors and all website copy — then **previews, saves and publishes** their own isolated website at a **unique live URL**.

Built on the original *Nexora SalonOS* design system (dark luxury + gold, Playfair serif, JetBrains mono), with the original SalonOS experience preserved as an opt-in demo at **`/demo`**.

---

## ✨ What you get

| Area | Capabilities |
|---|---|
| **Landing page** `/` | Marketing site for the builder itself |
| **Auth** `/auth` | Email + password (scrypt-hashed) **and Google one-tap sign-in**, HTTP-only session cookies, rate-limited |
| **Onboarding** `/onboarding` | 6-step guided wizard: basics → brand & content → colors → services → team → contact → publish, with live slug-availability checks, curated image galleries, color presets and an instant full-site preview |
| **Owner dashboard** `/dashboard` | Overview & stats with plan usage meters, website/content editor, services & prices, team, bookings inbox, AI marketing generator, publish/unpublish & domain management |
| **Super-admin console** `/admin` | Platform overview, user management (roles, disable, delete), salon management (subscriptions, publish moderation, delete) and platform settings |
| **Public salon site** `/s/:slug` | Fully themed, responsive website per salon: hero, services & prices, team, about, contact/map/WhatsApp, online booking, AI style consultant |
| **Subdomain hosting** | `yourname.yourdomain.com` auto-detected when wildcard DNS exists (path URL always works) |
| **Subscription plans** | `free` (10 services / 5 staff) · `pro` (50/20) · `premium` (100/50) — enforced server-side with HTTP 402 |
| **Data layer** | SQLite (`better-sqlite3`, WAL) with foreign-key tenant isolation — zero demo data for real users |
| **Legacy demo** `/demo` | The original SalonOS app (Royal Tresses demo data, Razorpay simulator, wallets) — clearly opt-in |

---

## 👑 Roles & access control (RBAC)

Three roles, enforced for **every** request on the server (never just in the UI):

| Role | Access |
|---|---|
| **Public visitor** | Published salon sites (`/s/:slug`), booking intake, AI consultant — no account required |
| **Salon owner** | Own salon only: onboarding, editing, publishing, bookings. Any attempt to read/write another tenant's data returns 403/404 |
| **Super admin** | Everything owners can do **plus** `/api/admin/*`: full user directory (promote/revoke admins, disable accounts, delete), all salons (view, change subscriptions, force publish/unpublish, delete), platform settings (name, open/close registrations, maintenance banner, default plan) |

**Bootstrapping the first admin** — set `ADMIN_EMAILS` (comma-separated) before starting the server. Any account whose email matches is automatically (and permanently, while listed) treated as super-admin at sign-in; no DB seeding required:

```bash
ADMIN_EMAILS="you@yourco.com,ops@yourco.com" npm run dev
```

Then sign up (or log in) with that email and open **`/admin`**. Additional admins can be promoted from **Admin → Users → Make admin** (env-designated emails cannot be demoted or disabled until removed from `ADMIN_EMAILS`).

### Subscription plans

Owners start on the plan configured in **Admin → Settings → Default plan** (`free` unless changed). Admins upgrade/downgrade any salon from **Admin → Salons → plan select**. Limits are enforced by the API on create/list-replace (`HTTP 402`), never just hidden in the UI, so abuse via crafted requests is impossible.

### Google sign-in

Set `GOOGLE_CLIENT_ID` (OAuth 2.0 *Web* client ID from Google Cloud Console; add your domain to *Authorized JavaScript origins*). The "Continue with Google" button appears automatically on `/auth`; the ID token is verified server-side (`google-auth-library`, audience-checked). Accounts are auto-linked when Google's verified email matches an existing email/password account, keeping a single user record. Without the variable the button is hidden and the endpoint returns `503`.

---

## 🚀 Quick start

```bash
npm install
npm run dev        # dev server on http://localhost:3000
```

Production:

```bash
npm run build      # vite build + bundled server (dist/server.cjs)
npm start          # NODE_ENV=production node dist/server.cjs
```

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables the server-side Gemini AI consultant & campaign writer (local fallbacks otherwise) |
| `PUBLIC_BASE_URL` / `APP_URL` | Canonical deployment URL — used to render each salon's live address (e.g. `https://yourdomain.com`) |
| `DATABASE_PATH` | SQLite file location (default `./data/salonos.db`) — point at a persistent volume in production |
| `PORT` | Server port (default `3000`) |
| `ADMIN_EMAILS` | Comma-separated emails that are permanently super-admin (bootstrap; see RBAC section) |
| `GOOGLE_CLIENT_ID` | Enables "Continue with Google" (ID token verified server-side) |

---

## 🌐 Salon live URLs

Each salon picks a unique **slug** during onboarding (checked live for conflicts and reserved words).

- **Path URL (universal):** `https://yourdomain.com/s/yourname`
- **Subdomain URL (automatic):** `https://yourname.yourdomain.com` — works when the host is served with wildcard DNS (`*.yourdomain.com`); the client detects the subdomain and renders that salon's site. Localhost, IPs and reserved labels (`www`, `app`, `api`, `demo`…) are ignored.

Owners can change the slug any time from **Dashboard → Publish & Domain**, preview drafts at `/s/:slug?preview=1` (owner-only), and unpublish instantly.

---

## 🗄️ Data model (SQLite, isolated per tenant)

```
users      ─┐ (scrypt password hashes)
sessions   ─┘ (opaque 256-bit tokens, 30-day expiry)
salons     ─ owner (user_id UNIQUE), slug UNIQUE, all branding/content/colors
salon_services  → salon_id FK (name, category, price ₹, duration, description)
salon_staff     → salon_id FK (name, role, specialties, bio, photo)
salon_bookings  → salon_id FK (customer, service, staff, date/time, status)
```

Every query is scoped by `salon_id` / `user_id`; cross-tenant reads are impossible at the API layer. New users start with an **empty, clean salon** — suggestions in the wizard are opt-in only.

## 🔌 API overview

| Route | Description |
|---|---|
| `POST /api/auth/signup` `POST /api/auth/login` `POST /api/auth/logout` `GET /api/auth/me` | Session auth (rate-limited; 403 when registrations closed / account disabled) |
| `POST /api/auth/google` | Google ID-token sign-in (`503` unless `GOOGLE_CLIENT_ID` set) |
| `GET /api/slug-availability?slug=` | Normalized availability + reserved-word checks |
| `POST /api/salon` · `GET/PUT /api/salon/mine` | Create / read / update own salon |
| `POST|PUT|DELETE /api/salon/mine/services[/:id]` · `PUT /api/salon/mine/services` | Service CRUD + atomic bulk replace |
| `POST|PUT|DELETE /api/salon/mine/staff[/:id]` · `PUT /api/salon/mine/staff` | Team CRUD + atomic bulk replace |
| `GET /api/salon/mine/bookings` · `PATCH …/bookings/:id` | Booking inbox & status flow (`new → confirmed → completed / cancelled`) |
| `POST /api/salon/mine/publish` `…/unpublish` `GET …/checklist` | Publish workflow with readiness checklist |
| `GET /api/site/:slug` | Public site payload (owner-only `?preview=1` for drafts) |
| `POST /api/site/:slug/bookings` | Public booking intake (validated + rate-limited) |
| `POST /api/ai/consult` `POST /api/ai/marketing` | Gemini AI — salon-context aware, graceful local fallbacks |
| `GET /api/admin/overview` · `GET /api/admin/users` · `PATCH/DELETE /api/admin/users/:id` | Super-admin: platform stats, user search, role/disable/delete management |
| `GET /api/admin/salons` · `GET/PATCH/DELETE /api/admin/salons/:id` | Super-admin: every salon with counts, subscriptions, publish moderation |
| `GET/PUT /api/admin/settings` | Super-admin: platform name, registration toggle, maintenance banner, default plan |
| legacy `/api/tenants`, `/api/services`, … | Unchanged endpoints powering the `/demo` SalonOS app |

## 🔒 Security notes

- scrypt (`node:crypto`) password hashing with per-user salts + constant-time comparison
- sessions: random non-JWT tokens, expiry enforced server-side, hourly purge
- cookies: `HttpOnly; SameSite=Lax` (+ `Secure` automatically behind HTTPS — `trust proxy` enabled)
- parameterized SQL everywhere (prepared statements), input length clamping, hex-color validation
- fixed-window rate limiting on auth (20/10 min/IP) and public booking endpoints (30/h/IP)
- basic hardening headers (`nosniff`, `SAMEORIGIN` framing, strict referrer policy)

## 📦 Deployment notes

1. Mount a persistent volume and set `DATABASE_PATH` (e.g. `/var/lib/salonos/salonos.db`).
2. Set `PUBLIC_BASE_URL=https://yourdomain.com`.
3. Terminate TLS at the proxy (`x-forwarded-proto` is honored for secure cookies).
4. *(Optional)* Add wildcard DNS `*.yourdomain.com → your server` for subdomain sites.
5. Optionally set `GEMINI_API_KEY` for live AI responses.

The database schema self-migrates on boot; no manual migration step is required.

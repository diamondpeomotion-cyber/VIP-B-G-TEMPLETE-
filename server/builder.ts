/**
 * White-Label Salon Website Builder — production API.
 *
 * Auth (email/password + sessions), per-owner salon management with strict
 * tenant isolation (SQLite, foreign-key scoped queries), content/services/
 * staff CRUD, publish workflow, and the public website/booking endpoints.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import {
  db, uid, getSalonBySlug, getSalonByUserId, getServicesForSalon, getStaffForSalon,
  getBookingsForSalon, toPublicSalon, toPublicService, toPublicStaff, toPublicBooking,
  DbSalon, PLAN_LIMITS, normalizePlan, getSettings,
} from './db';
import {
  createUser, createGoogleUser, findUserRecordByEmail, findUserByGoogleSub, linkGoogleAccount,
  createSession, destroySession, parseCookies, setSessionCookie, clearSessionCookie,
  requireOwner, rateLimit, verifyPassword, toOwnerUser, SESSION_COOKIE,
} from './auth';
import { getAvailability, suggestAlternatives, validateBookingDate } from './availability';

export const builderRouter = Router();

// ---------------------------------------------------------------------------
// Google Identity Services
// ---------------------------------------------------------------------------
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
export const GOOGLE_ENABLED = !!GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('MY_');
const googleClient = GOOGLE_ENABLED ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const RESERVED_SLUGS = new Set([
  'www', 'app', 'api', 'demo', 'dashboard', 'auth', 'onboarding', 'admin',
  's', 'signup', 'login', 'logout', 'assets', 'static', 'media', 'mail',
  'support', 'help', 'blog', 'status', 'cdn', 'ftp', 'nexora', 'root',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 32);
}

function validateSlug(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'Subdomain must be 3–32 characters: lowercase letters, numbers and hyphens only, and cannot start or end with a hyphen.';
  }
  if (RESERVED_SLUGS.has(slug)) {
    return 'This address is reserved. Please choose a different one.';
  }
  return null;
}

function asString(v: unknown, max = 2000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function asColor(v: unknown, fallback: string): string {
  if (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())) return v.trim().toLowerCase();
  return fallback;
}

function bad(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function getOwnerSalon(req: Request, res: Response): DbSalon | null {
  const salon = getSalonByUserId(req.owner!.id);
  if (!salon) {
    res.status(404).json({ error: 'No salon found for this account. Complete onboarding first.', code: 'NO_SALON' });
    return null;
  }
  return salon;
}

function siteUrls(req: Request, slug: string) {
  // Base deployment URL — prefer the configured public URL so links stay
  // correct behind reverse proxies; fall back to the incoming request host.
  const configured = (process.env.PUBLIC_BASE_URL || process.env.APP_URL || '').replace(/\/+$/, '');
  const base = configured && !configured.includes('MY_APP_URL') ? configured : `${req.protocol}://${req.get('host')}`;
  let host = '';
  try {
    host = new URL(base).host; // includes port when non-standard
  } catch { /* noop */ }
  const subdomainUrl = host && !host.includes(':') ? `${new URL(base).protocol}//${slug}.${host}` : null;
  return { pathUrl: `${base}/s/${slug}`, subdomainUrl, base };
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------
const authLimiter = rateLimit(20, 10 * 60 * 1000); // 20 attempts / 10 min / IP

builderRouter.post('/api/auth/signup', authLimiter, (req, res) => {
  if (!getSettings().allowRegistrations) {
    return bad(res, 403, 'New registrations are currently closed by the platform administrator.');
  }

  const name = asString(req.body?.name, 100);
  const email = asString(req.body?.email, 200);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name) return bad(res, 400, 'Please tell us your name.');
  if (!EMAIL_RE.test(email)) return bad(res, 400, 'Please enter a valid email address.');
  if (password.length < 8) return bad(res, 400, 'Password must be at least 8 characters long.');

  if (findUserRecordByEmail(email)) {
    return bad(res, 409, 'An account with this email already exists. Try signing in instead.');
  }

  const user = createUser(name, email, password);
  const token = createSession(user.id);
  setSessionCookie(req, res, token);
  const salon = getSalonByUserId(user.id);
  res.status(201).json({ user, salon: salon ? toPublicSalon(salon) : null });
});

builderRouter.post('/api/auth/login', authLimiter, (req, res) => {
  const email = asString(req.body?.email, 200);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const row = findUserRecordByEmail(email);
  if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    if (row && !row.password_hash && row.google_sub) {
      return bad(res, 401, 'This account uses Google sign-in. Please continue with Google below.');
    }
    return bad(res, 401, 'Incorrect email or password.');
  }
  if (row.disabled) {
    return bad(res, 403, 'This account has been disabled by the platform administrator.');
  }

  const token = createSession(row.id);
  setSessionCookie(req, res, token);
  const salon = getSalonByUserId(row.id);
  res.json({ user: toOwnerUser(row), salon: salon ? toPublicSalon(salon) : null });
});

// Google One-Tap / GSI button sign-in. The client obtains a Google ID token
// and we verify it server-side against Google's public keys via the
// verifier library — same security as redirect OAuth, simpler SPA flow.
builderRouter.post('/api/auth/google', authLimiter, async (req, res) => {
  if (!googleClient) {
    return bad(res, 503, 'Google sign-in is not configured on this deployment.');
  }
  const idToken = asString(req.body?.idToken, 4096);
  if (!idToken) return bad(res, 400, 'Missing Google identity token.');

  let payload: { sub?: string; email?: string; email_verified?: boolean; name?: string } | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    return bad(res, 401, 'Google token verification failed. Please try again.');
  }

  if (!payload?.sub || !payload.email) {
    return bad(res, 401, 'Google account did not provide a verified identity.');
  }
  if (!payload.email_verified) {
    return bad(res, 401, 'Your Google account email is not verified.');
  }

  // Find by Google subject first, then by verified email (account linking).
  let record = findUserByGoogleSub(payload.sub);
  if (!record) {
    const byEmail = findUserRecordByEmail(payload.email);
    if (byEmail) {
      // Email parity with a verified Google identity — link the accounts.
      linkGoogleAccount(byEmail.id, payload.sub);
      record = { ...byEmail, google_sub: payload.sub };
    }
  }
  if (!record) {
    if (!getSettings().allowRegistrations) {
      return bad(res, 403, 'New registrations are currently closed by the platform administrator.');
    }
    const created = createGoogleUser(payload.name || payload.email.split('@')[0], payload.email, payload.sub);
    record = {
      id: created.id, name: created.name, email: created.email,
      password_hash: '', role: created.role, disabled: 0, google_sub: payload.sub,
    };
  }
  if (record.disabled) {
    return bad(res, 403, 'This account has been disabled by the platform administrator.');
  }

  const token = createSession(record.id);
  setSessionCookie(req, res, token);
  const salon = getSalonByUserId(record.id);
  res.json({ user: toOwnerUser(record), salon: salon ? toPublicSalon(salon) : null });
});

builderRouter.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) destroySession(token);
  clearSessionCookie(req, res);
  res.json({ success: true });
});

builderRouter.get('/api/auth/me', (req, res) => {
  if (!req.owner) return res.json({ user: null, salon: null });
  const salon = getSalonByUserId(req.owner.id);
  res.json({ user: req.owner, salon: salon ? toPublicSalon(salon) : null });
});

// ---------------------------------------------------------------------------
// Slug availability
// ---------------------------------------------------------------------------
builderRouter.get('/api/slug-availability', (req, res) => {
  const slug = normalizeSlug(String(req.query.slug || ''));
  const validationError = validateSlug(slug);
  if (validationError) {
    return res.json({ slug, available: false, error: validationError });
  }
  const existing = getSalonBySlug(slug);
  // A slug stays "available" to its current owner (e.g. re-saving unchanged).
  const ownedByMe = !!(existing && req.owner && existing.user_id === req.owner.id);
  res.json({ slug, available: !existing || ownedByMe, taken: !!existing && !ownedByMe });
});

// ---------------------------------------------------------------------------
// Salon management (owner-only)
// ---------------------------------------------------------------------------
builderRouter.post('/api/salon', requireOwner, (req, res) => {
  const existing = getSalonByUserId(req.owner!.id);
  if (existing) {
    return res.status(409).json({ error: 'Your account already has a salon website.', salon: toPublicSalon(existing) });
  }

  const name = asString(req.body?.name, 120);
  if (!name) return bad(res, 400, 'Please enter your salon / website name.');

  const slug = normalizeSlug(String(req.body?.slug || name));
  const slugError = validateSlug(slug);
  if (slugError) return bad(res, 400, slugError);
  if (getSalonBySlug(slug)) return bad(res, 409, 'This address is already taken. Please pick another one.');

  const id = uid('sal');
  const defaultPlan = getSettings().defaultPlan;
  db.prepare(`
    INSERT INTO salons (id, user_id, slug, name, tagline, category, onboarding_step, subscription_plan)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, req.owner!.id, slug, name, asString(req.body?.tagline, 200), asString(req.body?.category, 30) || 'BEAUTY', defaultPlan);

  const salon = getSalonBySlug(slug)!;
  res.status(201).json({ salon: toPublicSalon(salon), urls: siteUrls(req, slug) });
});

builderRouter.get('/api/salon/mine', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;

  const bookings = getBookingsForSalon(salon.id);
  const plan = normalizePlan(salon.subscription_plan);
  const settings = getSettings();
  res.json({
    salon: toPublicSalon(salon),
    services: getServicesForSalon(salon.id).map(toPublicService),
    staff: getStaffForSalon(salon.id).map(toPublicStaff),
    urls: siteUrls(req, salon.slug),
    plan: { id: plan, label: PLAN_LIMITS[plan].label, status: salon.subscription_status, limits: PLAN_LIMITS[plan] },
    stats: {
      totalBookings: bookings.length,
      newBookings: bookings.filter((b) => b.status === 'new').length,
      upcomingBookings: bookings.filter(
        (b) => b.status !== 'cancelled' && b.date >= new Date().toISOString().slice(0, 10)
      ).length,
    },
    settings: { platformName: settings.platformName },
  });
});

const SALON_EDITABLE_FIELDS: Record<string, { column: string; max?: number; color?: string }> = {
  name: { column: 'name', max: 120 },
  tagline: { column: 'tagline', max: 200 },
  category: { column: 'category', max: 30 },
  logoUrl: { column: 'logo_url', max: 2083 },
  heroImageUrl: { column: 'hero_image_url', max: 2083 },
  about: { column: 'about', max: 10000 },
  welcomeOffer: { column: 'welcome_offer', max: 400 },
  address: { column: 'address', max: 400 },
  city: { column: 'city', max: 120 },
  phone: { column: 'phone', max: 40 },
  email: { column: 'email', max: 200 },
  whatsapp: { column: 'whatsapp', max: 40 },
  instagram: { column: 'instagram', max: 200 },
  openingHours: { column: 'opening_hours', max: 300 },
  primaryColor: { column: 'primary_color', color: '#c5a059' },
  bgColor: { column: 'bg_color', color: '#0a0a0b' },
  surfaceColor: { column: 'surface_color', color: '#121214' },
  textColor: { column: 'text_color', color: '#e5e5e5' },
  onboardingStep: { column: 'onboarding_step' },
};

builderRouter.put('/api/salon/mine', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;

  const body = req.body || {};
  const sets: string[] = [];
  const values: unknown[] = [];

  // Address changes go through strict validation + uniqueness checks.
  if (body.slug !== undefined) {
    const slug = normalizeSlug(String(body.slug));
    const slugError = validateSlug(slug);
    if (slugError) return bad(res, 400, slugError);
    const other = getSalonBySlug(slug);
    if (other && other.id !== salon.id) {
      return bad(res, 409, 'This address is already taken by another salon.');
    }
    sets.push('slug = ?');
    values.push(slug);
  }

  for (const [key, meta] of Object.entries(SALON_EDITABLE_FIELDS)) {
    if (body[key] === undefined) continue;
    if (key === 'onboardingStep') {
      sets.push('onboarding_step = ?');
      values.push(Math.max(0, Math.min(8, Number(body[key]) || 0)));
    } else if (meta.color) {
      sets.push(`${meta.column} = ?`);
      values.push(asColor(body[key], meta.color));
    } else if (key === 'email') {
      const v = asString(body[key], meta.max);
      if (v && !EMAIL_RE.test(v)) return bad(res, 400, 'Please enter a valid contact email address.');
      sets.push(`${meta.column} = ?`);
      values.push(v);
    } else if (key === 'name') {
      const v = asString(body[key], meta.max);
      if (!v) return bad(res, 400, 'Salon name cannot be empty.');
      sets.push(`${meta.column} = ?`);
      values.push(v);
    } else {
      sets.push(`${meta.column} = ?`);
      values.push(asString(body[key], meta.max));
    }
  }

  if (sets.length === 0) return bad(res, 400, 'Nothing to update.');

  sets.push("updated_at = datetime('now')");
  db.prepare(`UPDATE salons SET ${sets.join(', ')} WHERE id = ?`).run(...values, salon.id);

  const updated = db.prepare('SELECT * FROM salons WHERE id = ?').get(salon.id) as DbSalon;
  res.json({ salon: toPublicSalon(updated), urls: siteUrls(req, updated.slug) });
});

// ---------------------------------------------------------------------------
// Services CRUD + bulk replace
// ---------------------------------------------------------------------------
function sanitizeService(input: any, index: number) {
  const name = asString(input?.name, 150);
  if (!name) return null;
  const price = Math.max(0, Math.min(10_000_000, Number(input?.price) || 0));
  const duration = Math.max(5, Math.min(8 * 60, Math.round(Number(input?.duration) || 30)));
  return {
    name,
    category: asString(input?.category, 60) || 'Hair & Styling',
    price,
    duration,
    description: asString(input?.description, 1000),
    sort_order: index,
  };
}

builderRouter.post('/api/salon/mine/services', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const plan = normalizePlan(salon.subscription_plan);
  const cap = PLAN_LIMITS[plan].services;
  const count = getServicesForSalon(salon.id).length;
  if (count >= cap) {
    return bad(
      res,
      402,
      `Your ${PLAN_LIMITS[plan].label} plan allows up to ${cap} services. Remove some or ask the platform admin to upgrade your plan.`
    );
  }
  const clean = sanitizeService(req.body, count);
  if (!clean) return bad(res, 400, 'Service name is required.');
  const id = uid('svc');
  db.prepare(
    `INSERT INTO salon_services (id, salon_id, name, category, price, duration, description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, salon.id, clean.name, clean.category, clean.price, clean.duration, clean.description, clean.sort_order);
  const row = db.prepare('SELECT * FROM salon_services WHERE id = ?').get(id) as any;
  res.status(201).json({ service: toPublicService(row) });
});

builderRouter.put('/api/salon/mine/services/:id', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const existing = db
    .prepare('SELECT * FROM salon_services WHERE id = ? AND salon_id = ?')
    .get(req.params.id, salon.id) as any;
  if (!existing) return bad(res, 404, 'Service not found.');
  const clean = sanitizeService({ ...existing, ...req.body }, existing.sort_order);
  if (!clean) return bad(res, 400, 'Service name is required.');
  db.prepare(
    `UPDATE salon_services SET name = ?, category = ?, price = ?, duration = ?, description = ? WHERE id = ?`
  ).run(clean.name, clean.category, clean.price, clean.duration, clean.description, req.params.id);
  const row = db.prepare('SELECT * FROM salon_services WHERE id = ?').get(req.params.id) as any;
  res.json({ service: toPublicService(row) });
});

builderRouter.delete('/api/salon/mine/services/:id', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const result = db
    .prepare('DELETE FROM salon_services WHERE id = ? AND salon_id = ?')
    .run(req.params.id, salon.id);
  if (result.changes === 0) return bad(res, 404, 'Service not found.');
  res.json({ success: true });
});

/** Replace the entire service list in one transaction (used by the wizard). */
builderRouter.put('/api/salon/mine/services', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const plan = normalizePlan(salon.subscription_plan);
  const cap = PLAN_LIMITS[plan].services;
  const items = Array.isArray(req.body?.services) ? req.body.services : [];
  if (items.length > cap) {
    return bad(
      res,
      402,
      `Your ${PLAN_LIMITS[plan].label} plan allows up to ${cap} services (you sent ${items.length}). Upgrade to add more.`
    );
  }
  const cleaned = items.map((it: any, i: number) => ({ raw: it, clean: sanitizeService(it, i) }));
  if (cleaned.some((c: any) => !c.clean)) return bad(res, 400, 'Every service needs a name.');

  const keepIds: string[] = [];
  const tx = db.transaction(() => {
    for (const { raw, clean } of cleaned) {
      if (raw.id && db.prepare('SELECT 1 FROM salon_services WHERE id = ? AND salon_id = ?').get(raw.id, salon.id)) {
        db.prepare(
          `UPDATE salon_services SET name = ?, category = ?, price = ?, duration = ?, description = ?, sort_order = ? WHERE id = ?`
        ).run(clean!.name, clean!.category, clean!.price, clean!.duration, clean!.description, clean!.sort_order, raw.id);
        keepIds.push(raw.id);
      } else {
        const id = uid('svc');
        db.prepare(
          `INSERT INTO salon_services (id, salon_id, name, category, price, duration, description, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id, salon.id, clean!.name, clean!.category, clean!.price, clean!.duration, clean!.description, clean!.sort_order);
        keepIds.push(id);
      }
    }
    if (keepIds.length) {
      db.prepare(
        `DELETE FROM salon_services WHERE salon_id = ? AND id NOT IN (${keepIds.map(() => '?').join(',')})`
      ).run(salon.id, ...keepIds);
    } else {
      db.prepare('DELETE FROM salon_services WHERE salon_id = ?').run(salon.id);
    }
  });
  tx();
  res.json({ services: getServicesForSalon(salon.id).map(toPublicService) });
});

// ---------------------------------------------------------------------------
// Staff CRUD + bulk replace
// ---------------------------------------------------------------------------
function sanitizeStaff(input: any, index: number) {
  const name = asString(input?.name, 120);
  if (!name) return null;
  const specialties = Array.isArray(input?.specialties)
    ? input.specialties.map((s: unknown) => asString(s, 60)).filter(Boolean).slice(0, 8).join(', ')
    : asString(input?.specialties, 400);
  return {
    name,
    role: asString(input?.role, 80) || 'Stylist',
    specialties,
    bio: asString(input?.bio, 1000),
    photo_url: asString(input?.photoUrl ?? input?.photo_url, 2083),
    // Online-booking toggle — an explicit camelCase value always wins (the
    // single-update route merges the DB row, which carries snake_case).
    // Defaults to ON when omitted (back-compat).
    accepting_bookings: input?.acceptingBookings === false || (input?.acceptingBookings === undefined && input?.accepting_bookings === 0) ? 0 : 1,
    sort_order: index,
  };
}

builderRouter.post('/api/salon/mine/staff', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const plan = normalizePlan(salon.subscription_plan);
  const cap = PLAN_LIMITS[plan].staff;
  const count = getStaffForSalon(salon.id).length;
  if (count >= cap) {
    return bad(
      res,
      402,
      `Your ${PLAN_LIMITS[plan].label} plan allows up to ${cap} team members. Ask the platform admin to upgrade your plan.`
    );
  }
  const clean = sanitizeStaff(req.body, count);
  if (!clean) return bad(res, 400, 'Team member name is required.');
  const id = uid('stf');
  db.prepare(
    `INSERT INTO salon_staff (id, salon_id, name, role, specialties, bio, photo_url, accepting_bookings, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, salon.id, clean.name, clean.role, clean.specialties, clean.bio, clean.photo_url, clean.accepting_bookings, clean.sort_order);
  const row = db.prepare('SELECT * FROM salon_staff WHERE id = ?').get(id) as any;
  res.status(201).json({ staff: toPublicStaff(row) });
});

builderRouter.put('/api/salon/mine/staff/:id', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const existing = db
    .prepare('SELECT * FROM salon_staff WHERE id = ? AND salon_id = ?')
    .get(req.params.id, salon.id) as any;
  if (!existing) return bad(res, 404, 'Team member not found.');
  const clean = sanitizeStaff(
    { ...existing, ...req.body, photoUrl: req.body?.photoUrl ?? existing.photo_url, specialties: req.body?.specialties ?? existing.specialties },
    existing.sort_order
  );
  if (!clean) return bad(res, 400, 'Team member name is required.');
  db.prepare(
    `UPDATE salon_staff SET name = ?, role = ?, specialties = ?, bio = ?, photo_url = ?, accepting_bookings = ? WHERE id = ?`
  ).run(clean.name, clean.role, clean.specialties, clean.bio, clean.photo_url, clean.accepting_bookings, req.params.id);
  const row = db.prepare('SELECT * FROM salon_staff WHERE id = ?').get(req.params.id) as any;
  res.json({ staff: toPublicStaff(row) });
});

builderRouter.delete('/api/salon/mine/staff/:id', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const result = db
    .prepare('DELETE FROM salon_staff WHERE id = ? AND salon_id = ?')
    .run(req.params.id, salon.id);
  if (result.changes === 0) return bad(res, 404, 'Team member not found.');
  res.json({ success: true });
});

builderRouter.put('/api/salon/mine/staff', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const plan = normalizePlan(salon.subscription_plan);
  const cap = PLAN_LIMITS[plan].staff;
  const items = Array.isArray(req.body?.staff) ? req.body.staff : [];
  if (items.length > cap) {
    return bad(
      res,
      402,
      `Your ${PLAN_LIMITS[plan].label} plan allows up to ${cap} team members (you sent ${items.length}). Upgrade to add more.`
    );
  }
  const cleaned = items.map((it: any, i: number) => ({ raw: it, clean: sanitizeStaff(it, i) }));
  if (cleaned.some((c: any) => !c.clean)) return bad(res, 400, 'Every team member needs a name.');

  const keepIds: string[] = [];
  const tx = db.transaction(() => {
    for (const { raw, clean } of cleaned) {
      if (raw.id && db.prepare('SELECT 1 FROM salon_staff WHERE id = ? AND salon_id = ?').get(raw.id, salon.id)) {
        db.prepare(
          `UPDATE salon_staff SET name = ?, role = ?, specialties = ?, bio = ?, photo_url = ?, accepting_bookings = ?, sort_order = ? WHERE id = ?`
        ).run(clean!.name, clean!.role, clean!.specialties, clean!.bio, clean!.photo_url, clean!.accepting_bookings, clean!.sort_order, raw.id);
        keepIds.push(raw.id);
      } else {
        const id = uid('stf');
        db.prepare(
          `INSERT INTO salon_staff (id, salon_id, name, role, specialties, bio, photo_url, accepting_bookings, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id, salon.id, clean!.name, clean!.role, clean!.specialties, clean!.bio, clean!.photo_url, clean!.accepting_bookings, clean!.sort_order);
        keepIds.push(id);
      }
    }
    if (keepIds.length) {
      db.prepare(
        `DELETE FROM salon_staff WHERE salon_id = ? AND id NOT IN (${keepIds.map(() => '?').join(',')})`
      ).run(salon.id, ...keepIds);
    } else {
      db.prepare('DELETE FROM salon_staff WHERE salon_id = ?').run(salon.id);
    }
  });
  tx();
  res.json({ staff: getStaffForSalon(salon.id).map(toPublicStaff) });
});

// ---------------------------------------------------------------------------
// Bookings (owner view) + status management
// ---------------------------------------------------------------------------
const BOOKING_STATUSES = new Set(['new', 'confirmed', 'completed', 'cancelled']);

builderRouter.get('/api/salon/mine/bookings', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  res.json({ bookings: getBookingsForSalon(salon.id).map(toPublicBooking) });
});

builderRouter.patch('/api/salon/mine/bookings/:id', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const status = asString(req.body?.status, 20);
  if (!BOOKING_STATUSES.has(status)) return bad(res, 400, 'Invalid booking status.');
  const result = db
    .prepare('UPDATE salon_bookings SET status = ? WHERE id = ? AND salon_id = ?')
    .run(status, req.params.id, salon.id);
  if (result.changes === 0) return bad(res, 404, 'Booking not found.');
  const row = db.prepare('SELECT * FROM salon_bookings WHERE id = ?').get(req.params.id) as any;
  res.json({ booking: toPublicBooking(row) });
});

// ---------------------------------------------------------------------------
// Publish workflow
// ---------------------------------------------------------------------------
function publishChecklist(salon: DbSalon) {
  const services = getServicesForSalon(salon.id);
  const checks = [
    { key: 'name', label: 'Salon name & address set', ok: !!salon.name.trim() },
    { key: 'services', label: 'At least one service with a price', ok: services.length > 0 },
    { key: 'contact', label: 'Phone or email for customer contact', ok: !!salon.phone.trim() || !!salon.email.trim() },
    { key: 'brand', label: 'Hero image or logo chosen', ok: !!salon.hero_image_url.trim() || !!salon.logo_url.trim() },
  ];
  return checks;
}

builderRouter.post('/api/salon/mine/publish', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  const checks = publishChecklist(salon);
  const failed = checks.filter((c) => !c.ok);
  // Hard requirements: name, one service, contact info. Branding is a soft nudge.
  const hardFailed = failed.filter((c) => c.key !== 'brand');
  if (hardFailed.length > 0) {
    return res.status(400).json({
      error: `Before publishing: ${hardFailed.map((c) => c.label.toLowerCase()).join('; ')}.`,
      checklist: checks,
    });
  }
  db.prepare("UPDATE salons SET published = 1, updated_at = datetime('now') WHERE id = ?").run(salon.id);
  const updated = db.prepare('SELECT * FROM salons WHERE id = ?').get(salon.id) as DbSalon;
  res.json({ salon: toPublicSalon(updated), urls: siteUrls(req, salon.slug), checklist: checks });
});

builderRouter.post('/api/salon/mine/unpublish', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  db.prepare("UPDATE salons SET published = 0, updated_at = datetime('now') WHERE id = ?").run(salon.id);
  const updated = db.prepare('SELECT * FROM salons WHERE id = ?').get(salon.id) as DbSalon;
  res.json({ salon: toPublicSalon(updated), urls: siteUrls(req, salon.slug) });
});

builderRouter.get('/api/salon/mine/checklist', requireOwner, (req, res) => {
  const salon = getOwnerSalon(req, res);
  if (!salon) return;
  res.json({ checklist: publishChecklist(salon), urls: siteUrls(req, salon.slug) });
});

// ---------------------------------------------------------------------------
// Public (unauthenticated) website endpoints
// ---------------------------------------------------------------------------
builderRouter.get('/api/site/:slug', (req, res) => {
  const slug = normalizeSlug(String(req.params.slug || ''));
  const salon = slug ? getSalonBySlug(slug) : undefined;
  if (!salon) return res.status(404).json({ error: 'This salon website does not exist.', code: 'NOT_FOUND' });

  const isOwnerPreview = req.query.preview === '1' && !!req.owner && req.owner.id === salon.user_id;
  if (!salon.published && !isOwnerPreview) {
    return res.status(404).json({ error: 'This website is not published yet.', code: 'NOT_PUBLISHED' });
  }

  res.json({
    salon: toPublicSalon(salon),
    services: getServicesForSalon(salon.id).map(toPublicService),
    staff: getStaffForSalon(salon.id).map(toPublicStaff),
    preview: isOwnerPreview && !salon.published,
    urls: siteUrls(req, slug),
  });
});

const bookingLimiter = rateLimit(30, 60 * 60 * 1000); // 30 bookings / hour / IP
const availabilityLimiter = rateLimit(120, 60 * 60 * 1000); // 120 availability checks / hour / IP
const lookupLimiter = rateLimit(60, 60 * 60 * 1000); // 60 self-service lookups / hour / IP

/**
 * Live slot availability for a salon + day — powers the booking modal's
 * per-slot states and the 409-conflict recovery suggestions.
 */
builderRouter.get('/api/site/:slug/availability', availabilityLimiter, (req, res) => {
  const slug = normalizeSlug(String(req.params.slug || ''));
  const salon = slug ? getSalonBySlug(slug) : undefined;
  if (!salon || !salon.published) return res.status(404).json({ error: 'This salon website does not exist or is not published yet.', code: 'NOT_FOUND' });

  const date = asString(req.query.date, 10);
  const dateError = validateBookingDate(date);
  if (dateError) return bad(res, 400, dateError);

  const serviceId = asString(req.query.serviceId, 80);
  const staffId = asString(req.query.staffId, 80) || 'any';

  let serviceDuration = 30;
  if (serviceId) {
    const svc = db
      .prepare('SELECT duration FROM salon_services WHERE id = ? AND salon_id = ?')
      .get(serviceId, salon.id) as { duration?: number } | undefined;
    if (!svc) return bad(res, 400, 'Selected service is no longer offered.');
    serviceDuration = svc.duration || 30;
  }
  if (staffId !== 'any') {
    const stf = db
      .prepare('SELECT accepting_bookings FROM salon_staff WHERE id = ? AND salon_id = ?')
      .get(staffId, salon.id) as { accepting_bookings?: number } | undefined;
    if (!stf) return bad(res, 400, 'Selected stylist was not found.');
    if (stf.accepting_bookings === 0) {
      return bad(res, 400, 'This specialist is not taking online bookings right now. Please choose another professional.');
    }
  }

  const slots = getAvailability(salon.id, date, { serviceDuration, staffId });
  res.json({ date, serviceDuration, slots });
});

builderRouter.post('/api/site/:slug/bookings', bookingLimiter, (req, res) => {
  const slug = normalizeSlug(String(req.params.slug || ''));
  const salon = slug ? getSalonBySlug(slug) : undefined;
  if (!salon || !salon.published) return res.status(404).json({ error: 'This salon website does not exist or is not published yet.' });

  const customerName = asString(req.body?.customerName, 120);
  const customerEmail = asString(req.body?.customerEmail, 200);
  const customerPhone = asString(req.body?.customerPhone, 40);
  const serviceId = asString(req.body?.serviceId, 80);
  const staffId = asString(req.body?.staffId, 80);
  const date = asString(req.body?.date, 10);
  const time = asString(req.body?.time, 8);
  const notes = asString(req.body?.notes, 500);

  if (!customerName) return bad(res, 400, 'Please tell us your name.');
  if (!customerEmail && !customerPhone) return bad(res, 400, 'Please share either your email or phone so the salon can reach you.');
  if (customerEmail && !EMAIL_RE.test(customerEmail)) return bad(res, 400, 'Please enter a valid email address.');
  const dateError = validateBookingDate(date);
  if (dateError) return bad(res, 400, dateError);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return bad(res, 400, 'Please choose a time slot.');

  const service = db
    .prepare('SELECT * FROM salon_services WHERE id = ? AND salon_id = ?')
    .get(serviceId, salon.id) as any;
  if (!service) return bad(res, 400, 'Please choose a service.');

  let staffRow: any = null;
  if (staffId && staffId !== 'any') {
    staffRow = db.prepare('SELECT * FROM salon_staff WHERE id = ? AND salon_id = ?').get(staffId, salon.id);
    if (!staffRow) return bad(res, 400, 'Selected stylist was not found.');
    if (staffRow.accepting_bookings === 0) {
      return bad(res, 400, `${staffRow.name} is not taking online bookings right now. Please choose another professional.`);
    }
  }

  // Double-booking guard: re-check the slot at write time (two customers can
  // race the same availability snapshot). On conflict, suggest open slots so
  // the client can recover without a blind retry.
  const slots = getAvailability(salon.id, date, {
    serviceDuration: service.duration || 30,
    staffId: staffRow?.id || 'any',
  });
  const wanted = slots.find((s) => s.time === time);
  if (!wanted || !wanted.available) {
    return res.status(409).json({
      error: wanted?.reason === 'past'
        ? 'That time has just passed. Please pick a later slot.'
        : 'Sorry — that slot was just taken. Please pick another time.',
      code: 'SLOT_TAKEN',
      suggestions: suggestAlternatives(slots, time),
    });
  }

  const id = uid('bkg');
  db.prepare(
    `INSERT INTO salon_bookings
     (id, salon_id, customer_name, customer_email, customer_phone, service_id, service_name, staff_id, staff_name, date, time, price, duration, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
  ).run(
    id, salon.id, customerName, customerEmail, customerPhone,
    service.id, service.name,
    staffRow?.id || '', staffRow?.name || 'First available',
    date, time, service.price, service.duration || 30, notes
  );

  const row = db.prepare('SELECT * FROM salon_bookings WHERE id = ?').get(id) as any;
  res.status(201).json({ booking: toPublicBooking(row) });
});

/**
 * Customer self-service: look up your own bookings by email (powers the
 * "Manage my booking" panel). Only bookings whose email matches — normalized
 * case-insensitively — are returned; nothing else leaks.
 */
builderRouter.get('/api/site/:slug/bookings/lookup', lookupLimiter, (req, res) => {
  const slug = normalizeSlug(String(req.params.slug || ''));
  const salon = slug ? getSalonBySlug(slug) : undefined;
  if (!salon || !salon.published) return res.status(404).json({ error: 'This salon website does not exist or is not published yet.', code: 'NOT_FOUND' });

  const email = asString(req.query.email, 200).toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return bad(res, 400, 'Please enter the email address you booked with.');

  const rows = db
    .prepare(
      `SELECT * FROM salon_bookings
       WHERE salon_id = ? AND lower(customer_email) = ?
       ORDER BY date DESC, time DESC LIMIT 50`
    )
    .all(salon.id, email) as any[];
  res.json({ bookings: rows.map(toPublicBooking) });
});

/**
 * Customer self-service: cancel your own booking. Requires the booking email
 * to match; only new/confirmed bookings can be cancelled this way.
 */
builderRouter.post('/api/site/:slug/bookings/:id/cancel', lookupLimiter, (req, res) => {
  const slug = normalizeSlug(String(req.params.slug || ''));
  const salon = slug ? getSalonBySlug(slug) : undefined;
  if (!salon || !salon.published) return res.status(404).json({ error: 'This salon website does not exist or is not published yet.', code: 'NOT_FOUND' });

  const email = asString(req.body?.email, 200).toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return bad(res, 400, 'Please enter the email address you booked with.');

  const row = db
    .prepare('SELECT * FROM salon_bookings WHERE id = ? AND salon_id = ?')
    .get(req.params.id, salon.id) as any;
  if (!row || (row.customer_email || '').toLowerCase() !== email) {
    return res.status(404).json({ error: 'Booking not found for that email address.', code: 'NOT_FOUND' });
  }
  if (row.status === 'cancelled') return bad(res, 409, 'This booking is already cancelled.');
  if (row.status !== 'new' && row.status !== 'confirmed') {
    return bad(res, 409, 'This booking can no longer be cancelled online. Please contact the salon directly.');
  }
  db.prepare(`UPDATE salon_bookings SET status = 'cancelled' WHERE id = ?`).run(row.id);
  const updated = db.prepare('SELECT * FROM salon_bookings WHERE id = ?').get(row.id) as any;
  res.json({ booking: toPublicBooking(updated) });
});

// Runtime config for the client (base URL so dashboards can display the
// correct live addresses for each deployment, plus public platform settings).
builderRouter.get('/api/config', (req, res) => {
  const settings = getSettings();
  res.json({
    baseUrl: siteUrls(req, 'placeholder').base,
    platformName: settings.platformName,
    allowRegistrations: settings.allowRegistrations,
    maintenanceMessage: settings.maintenanceMessage,
    googleAuthEnabled: GOOGLE_ENABLED,
    googleClientId: GOOGLE_ENABLED ? GOOGLE_CLIENT_ID : '',
  });
});

/**
 * Super Admin API — platform-wide management.
 *
 * Every route is protected by `requireAdmin` (session role === 'super_admin').
 * Admins can manage users, salons, subscriptions, published websites and
 * platform settings. Owners still cannot reach any of these endpoints.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  db, toPublicSalon, getServicesForSalon, getStaffForSalon, getBookingsForSalon,
  DbSalon, PLANS, normalizePlan, getSettings, updateSettings,
} from './db';
import { requireAdmin, isAdminEmail } from './auth';

export const adminRouter = Router();
adminRouter.use('/api/admin', requireAdmin);

function bad(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function asString(v: unknown, max = 2000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: number;
  google_sub: string;
  created_at: string;
  salon_id: string | null;
  salon_slug: string | null;
  salon_name: string | null;
  salon_plan: string | null;
  salon_published: number | null;
}

function rowToAdminUser(r: AdminUserRow) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: isAdminEmail(r.email) ? 'super_admin' : r.role,
    disabled: !!r.disabled,
    authProvider: r.google_sub ? 'google' : 'password',
    createdAt: r.created_at,
    salon: r.salon_id
      ? { id: r.salon_id, slug: r.salon_slug, name: r.salon_name, plan: r.salon_plan, published: !!r.salon_published }
      : null,
  };
}

const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.disabled, u.google_sub, u.created_at,
         s.id AS salon_id, s.slug AS salon_slug, s.name AS salon_name,
         s.subscription_plan AS salon_plan, s.published AS salon_published
  FROM users u LEFT JOIN salons s ON s.user_id = u.id`;

// ---------------------------------------------------------------------------
// Overview metrics
// ---------------------------------------------------------------------------
adminRouter.get('/api/admin/overview', (_req, res) => {
  const one = (sql: string) => (db.prepare(sql).get() as any)?.n ?? 0;
  const users = one('SELECT COUNT(*) n FROM users');
  const admins = one("SELECT COUNT(*) n FROM users WHERE role = 'super_admin'");
  const salons = one('SELECT COUNT(*) n FROM salons');
  const published = one('SELECT COUNT(*) n FROM salons WHERE published = 1');
  const services = one('SELECT COUNT(*) n FROM salon_services');
  const staff = one('SELECT COUNT(*) n FROM salon_staff');
  const bookings = one('SELECT COUNT(*) n FROM salon_bookings');
  const newBookings = one("SELECT COUNT(*) n FROM salon_bookings WHERE status = 'new'");
  const byPlan = Object.fromEntries(
    (db.prepare('SELECT subscription_plan AS p, COUNT(*) AS n FROM salons GROUP BY subscription_plan').all() as Array<{ p: string; n: number }>)
      .map((r) => [normalizePlan(r.p), r.n])
  );
  const recentUsers = (db.prepare(`${USER_SELECT} ORDER BY u.created_at DESC LIMIT 8`).all() as AdminUserRow[]).map(rowToAdminUser);
  const recentBookings = db
    .prepare(
      `SELECT b.id, b.customer_name, b.service_name, b.price, b.date, b.time, b.status, b.created_at, s.name AS salon_name, s.slug AS salon_slug
       FROM salon_bookings b JOIN salons s ON s.id = b.salon_id
       ORDER BY b.created_at DESC LIMIT 8`
    )
    .all() as Array<any>;

  res.json({
    totals: { users, admins, salons, published, services, staff, bookings, newBookings },
    byPlan,
    recentUsers,
    recentBookings: recentBookings.map((b) => ({
      id: b.id, customerName: b.customer_name, serviceName: b.service_name, price: b.price,
      date: b.date, time: b.time, status: b.status, createdAt: b.created_at,
      salonName: b.salon_name, salonSlug: b.salon_slug,
    })),
    settings: getSettings(),
  });
});

// ---------------------------------------------------------------------------
// Users management
// ---------------------------------------------------------------------------
adminRouter.get('/api/admin/users', (req, res) => {
  const q = asString(req.query.q, 120).toLowerCase();
  let rows: AdminUserRow[];
  if (q) {
    const like = `%${q}%`;
    rows = db
      .prepare(`${USER_SELECT} WHERE lower(u.name) LIKE ? OR lower(u.email) LIKE ? ORDER BY u.created_at DESC LIMIT 200`)
      .all(like, like) as AdminUserRow[];
  } else {
    rows = db.prepare(`${USER_SELECT} ORDER BY u.created_at DESC LIMIT 200`).all() as AdminUserRow[];
  }
  res.json({ users: rows.map(rowToAdminUser) });
});

adminRouter.patch('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!target) return bad(res, 404, 'User not found.');

  const isSelf = target.id === req.owner!.id;
  const sets: string[] = [];
  const values: unknown[] = [];

  if (req.body?.disabled !== undefined) {
    if (isSelf) return bad(res, 400, 'You cannot disable your own account.');
    sets.push('disabled = ?');
    values.push(req.body.disabled ? 1 : 0);
    if (req.body.disabled) {
      // Kill all live sessions immediately.
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
    }
  }

  if (req.body?.role !== undefined) {
    if (isSelf) return bad(res, 400, 'You cannot change your own role.');
    if (isAdminEmail(target.email)) {
      return bad(res, 400, 'This account is an env-designated super admin (ADMIN_EMAILS); its role cannot be revoked here.');
    }
    const role = req.body.role === 'super_admin' ? 'super_admin' : 'owner';
    sets.push('role = ?');
    values.push(role);
  }

  if (sets.length === 0) return bad(res, 400, 'Nothing to update.');
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values, target.id);

  const updated = db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(target.id) as AdminUserRow;
  res.json({ user: rowToAdminUser(updated) });
});

adminRouter.delete('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id) as any;
  if (!target) return bad(res, 404, 'User not found.');
  if (target.id === req.owner!.id) return bad(res, 400, 'You cannot delete your own account.');
  if (isAdminEmail(target.email)) return bad(res, 400, 'Env-designated admins cannot be deleted.');
  // FK cascades remove the user's salon, services, staff, bookings and sessions.
  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Salons management
// ---------------------------------------------------------------------------
function salonListQuery(where: string, params: unknown[], limit = 300) {
  const rows = db
    .prepare(
      `SELECT s.*, u.email AS owner_email, u.name AS owner_name,
        (SELECT COUNT(*) FROM salon_services sv WHERE sv.salon_id = s.id) AS service_count,
        (SELECT COUNT(*) FROM salon_staff st WHERE st.salon_id = s.id) AS staff_count,
        (SELECT COUNT(*) FROM salon_bookings bk WHERE bk.salon_id = s.id) AS booking_count
       FROM salons s JOIN users u ON u.id = s.user_id
       ${where ? `WHERE ${where}` : ''}
       ORDER BY s.created_at DESC LIMIT ?`
    )
    .all(...params, limit) as Array<DbSalon & { owner_email: string; owner_name: string; service_count: number; staff_count: number; booking_count: number }>;
  return rows.map((r) => ({
    salon: toPublicSalon(r),
    owner: { email: r.owner_email, name: r.owner_name },
    counts: { services: r.service_count, staff: r.staff_count, bookings: r.booking_count },
  }));
}

adminRouter.get('/api/admin/salons', (req, res) => {
  const q = asString(req.query.q, 120).toLowerCase();
  const onlyPublished = req.query.published === '1';
  const where: string[] = [];
  const params: unknown[] = [];
  if (q) {
    where.push('(lower(s.name) LIKE ? OR lower(s.slug) LIKE ? OR lower(u.email) LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (onlyPublished) where.push('s.published = 1');
  res.json({ salons: salonListQuery(where.join(' AND '), params) });
});

adminRouter.get('/api/admin/salons/:id', requireAdmin, (req: Request, res: Response) => {
  const salon = db.prepare('SELECT * FROM salons WHERE id = ?').get(req.params.id) as DbSalon | undefined;
  if (!salon) return bad(res, 404, 'Salon not found.');
  const owner = db.prepare('SELECT id, name, email, role, disabled FROM users WHERE id = ?').get(salon.user_id) as any;
  res.json({
    salon: toPublicSalon(salon),
    owner: { id: owner.id, name: owner.name, email: owner.email, role: owner.role, disabled: !!owner.disabled },
    services: getServicesForSalon(salon.id).map((s) => ({ id: s.id, name: s.name, category: s.category, price: s.price, duration: s.duration })),
    staff: getStaffForSalon(salon.id).map((s) => ({ id: s.id, name: s.name, role: s.role })),
    bookings: getBookingsForSalon(salon.id).slice(0, 25).map((b) => ({
      id: b.id, customerName: b.customer_name, serviceName: b.service_name, price: b.price,
      date: b.date, time: b.time, status: b.status, createdAt: b.created_at,
    })),
  });
});

adminRouter.patch('/api/admin/salons/:id', requireAdmin, (req: Request, res: Response) => {
  const salon = db.prepare('SELECT * FROM salons WHERE id = ?').get(req.params.id) as DbSalon | undefined;
  if (!salon) return bad(res, 404, 'Salon not found.');

  const sets: string[] = [];
  const values: unknown[] = [];

  if (req.body?.subscriptionPlan !== undefined) {
    const plan = asString(req.body.subscriptionPlan, 20);
    if (!(PLANS as readonly string[]).includes(plan)) {
      return bad(res, 400, `Invalid plan. Choose one of: ${PLANS.join(', ')}.`);
    }
    sets.push('subscription_plan = ?');
    values.push(plan);
  }
  if (req.body?.subscriptionStatus !== undefined) {
    const status = asString(req.body.subscriptionStatus, 20);
    if (!['active', 'trialing', 'past_due', 'cancelled'].includes(status)) {
      return bad(res, 400, 'Invalid subscription status.');
    }
    sets.push('subscription_status = ?');
    values.push(status);
  }
  if (req.body?.published !== undefined) {
    sets.push('published = ?');
    values.push(req.body.published ? 1 : 0);
  }

  if (sets.length === 0) return bad(res, 400, 'Nothing to update.');
  sets.push("updated_at = datetime('now')");
  db.prepare(`UPDATE salons SET ${sets.join(', ')} WHERE id = ?`).run(...values, salon.id);

  const updated = db.prepare('SELECT * FROM salons WHERE id = ?').get(salon.id) as DbSalon;
  res.json({ salon: toPublicSalon(updated) });
});

adminRouter.delete('/api/admin/salons/:id', requireAdmin, (req: Request, res: Response) => {
  const salon = db.prepare('SELECT id, user_id FROM salons WHERE id = ?').get(req.params.id) as any;
  if (!salon) return bad(res, 404, 'Salon not found.');
  if (salon.user_id === req.owner!.id) {
    return bad(res, 400, 'You cannot delete your own salon from the admin panel.');
  }
  // Services, staff and bookings cascade with the salon row.
  db.prepare('DELETE FROM salons WHERE id = ?').run(salon.id);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------
adminRouter.get('/api/admin/settings', (_req, res) => {
  res.json({ settings: getSettings() });
});

adminRouter.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const body = req.body || {};
  const patch: Record<string, string> = {};

  if (body.platformName !== undefined) {
    const v = asString(body.platformName, 80);
    if (!v) return bad(res, 400, 'Platform name cannot be empty.');
    patch.platform_name = v;
  }
  if (body.allowRegistrations !== undefined) {
    patch.allow_registrations = body.allowRegistrations ? '1' : '0';
  }
  if (body.maintenanceMessage !== undefined) {
    patch.maintenance_message = asString(body.maintenanceMessage, 400);
  }
  if (body.defaultPlan !== undefined) {
    const plan = asString(body.defaultPlan, 20);
    if (!(PLANS as readonly string[]).includes(plan)) {
      return bad(res, 400, `Invalid plan. Choose one of: ${PLANS.join(', ')}.`);
    }
    patch.default_plan = plan;
  }

  if (Object.keys(patch).length === 0) return bad(res, 400, 'Nothing to update.');
  updateSettings(patch as any);
  res.json({ settings: getSettings() });
});

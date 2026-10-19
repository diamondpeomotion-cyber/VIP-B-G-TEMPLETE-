/**
 * SQLite persistence layer for the Nexora White-Label Salon Builder.
 *
 * Every salon (tenant) owns its own rows — data isolation is enforced at the
 * query layer by always scoping on `salon_id` / `user_id` foreign keys.
 *
 * The database file lives at DATABASE_PATH (defaults to ./data/salonos.db)
 * so it can be pointed at a persistent volume in production.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'salonos.db');

if (DB_PATH !== ':memory:') {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

/** Idempotent column migration (SQLite lacks ADD COLUMN IF NOT EXISTS). */
function ensureColumn(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// ---------------------------------------------------------------------------
// Schema (idempotent)
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS salons (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT NOT NULL,
  tagline         TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'BEAUTY',
  logo_url        TEXT NOT NULL DEFAULT '',
  hero_image_url  TEXT NOT NULL DEFAULT '',
  about           TEXT NOT NULL DEFAULT '',
  welcome_offer   TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  whatsapp        TEXT NOT NULL DEFAULT '',
  instagram       TEXT NOT NULL DEFAULT '',
  opening_hours   TEXT NOT NULL DEFAULT '',
  primary_color   TEXT NOT NULL DEFAULT '#c5a059',
  bg_color        TEXT NOT NULL DEFAULT '#0a0a0b',
  surface_color   TEXT NOT NULL DEFAULT '#121214',
  text_color      TEXT NOT NULL DEFAULT '#e5e5e5',
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  published       INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);

CREATE TABLE IF NOT EXISTS salon_services (
  id          TEXT PRIMARY KEY,
  salon_id    TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Hair & Styling',
  price       REAL NOT NULL DEFAULT 0,
  duration    INTEGER NOT NULL DEFAULT 30,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_services_salon ON salon_services(salon_id);

CREATE TABLE IF NOT EXISTS salon_staff (
  id          TEXT PRIMARY KEY,
  salon_id    TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'Stylist',
  specialties TEXT NOT NULL DEFAULT '',
  bio         TEXT NOT NULL DEFAULT '',
  photo_url   TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_staff_salon ON salon_staff(salon_id);

CREATE TABLE IF NOT EXISTS salon_bookings (
  id             TEXT PRIMARY KEY,
  salon_id       TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_name  TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  service_id     TEXT NOT NULL DEFAULT '',
  service_name   TEXT NOT NULL DEFAULT '',
  staff_id       TEXT NOT NULL DEFAULT '',
  staff_name     TEXT NOT NULL DEFAULT '',
  date           TEXT NOT NULL,
  time           TEXT NOT NULL,
  price          REAL NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'new',
  notes          TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_salon ON salon_bookings(salon_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
`);

// ---------------------------------------------------------------------------
// RBAC + subscription migrations (idempotent)
// ---------------------------------------------------------------------------
ensureColumn('users', 'role', "TEXT NOT NULL DEFAULT 'owner'");        // 'owner' | 'super_admin'
ensureColumn('users', 'disabled', 'INTEGER NOT NULL DEFAULT 0');        // admin kill-switch
ensureColumn('users', 'google_sub', "TEXT NOT NULL DEFAULT ''");        // linked Google subject id
ensureColumn('salons', 'subscription_plan', "TEXT NOT NULL DEFAULT 'free'");     // free | pro | premium
ensureColumn('salons', 'subscription_status', "TEXT NOT NULL DEFAULT 'active'"); // active | trialing | past_due | cancelled
ensureColumn('salon_staff', 'accepting_bookings', 'INTEGER NOT NULL DEFAULT 1'); // specialist online-booking toggle
ensureColumn('salon_bookings', 'duration', 'INTEGER NOT NULL DEFAULT 0');        // service minutes (slot-conflict engine)

/** Per-plan content caps enforced on the backend (and surfaced in the UI). */
export const PLANS = ['free', 'pro', 'premium'] as const;
export type SubscriptionPlan = (typeof PLANS)[number];

export const PLAN_LIMITS: Record<SubscriptionPlan, { services: number; staff: number; label: string }> = {
  free: { services: 10, staff: 5, label: 'Free' },
  pro: { services: 50, staff: 20, label: 'Pro' },
  premium: { services: 100, staff: 50, label: 'Premium' },
};

export function normalizePlan(value: string): SubscriptionPlan {
  return (PLANS as readonly string[]).includes(value) ? (value as SubscriptionPlan) : 'free';
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------
export interface PlatformSettings {
  platformName: string;
  allowRegistrations: boolean;
  maintenanceMessage: string;
  defaultPlan: SubscriptionPlan;
}

const SETTING_DEFAULTS: Record<string, string> = {
  platform_name: 'Nexora White-Label Studio',
  allow_registrations: '1',
  maintenance_message: '',
  default_plan: 'free',
};

export function getSettings(): PlatformSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const get = (k: string) => map.get(k) ?? SETTING_DEFAULTS[k] ?? '';
  return {
    platformName: get('platform_name'),
    allowRegistrations: get('allow_registrations') !== '0',
    maintenanceMessage: get('maintenance_message'),
    defaultPlan: normalizePlan(get('default_plan')),
  };
}

export function updateSettings(patch: Partial<Record<'platform_name' | 'allow_registrations' | 'maintenance_message' | 'default_plan', string>>) {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const tx = db.transaction((entries: Array<[string, string]>) => {
    for (const [k, v] of entries) upsert.run(k, v);
  });
  tx(Object.entries(patch));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export interface DbSalon {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  logo_url: string;
  hero_image_url: string;
  about: string;
  welcome_offer: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  opening_hours: string;
  primary_color: string;
  bg_color: string;
  surface_color: string;
  text_color: string;
  onboarding_step: number;
  published: number;
  created_at: string;
  updated_at: string;
  subscription_plan: string;
  subscription_status: string;
}

/** Shape returned to the client — camelCase, no internal columns. */
export function toPublicSalon(row: DbSalon) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    category: row.category,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    about: row.about,
    welcomeOffer: row.welcome_offer,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    openingHours: row.opening_hours,
    primaryColor: row.primary_color,
    bgColor: row.bg_color,
    surfaceColor: row.surface_color,
    textColor: row.text_color,
    onboardingStep: row.onboarding_step,
    published: !!row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subscriptionPlan: normalizePlan(row.subscription_plan || 'free'),
    subscriptionStatus: row.subscription_status || 'active',
  };
}

export interface DbService {
  id: string;
  salon_id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  sort_order: number;
}

export function toPublicService(row: DbService) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    duration: row.duration,
    description: row.description,
  };
}

export interface DbStaff {
  id: string;
  salon_id: string;
  name: string;
  role: string;
  specialties: string;
  bio: string;
  photo_url: string;
  sort_order: number;
  accepting_bookings: number;
}

export function toPublicStaff(row: DbStaff) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    specialties: row.specialties
      ? row.specialties.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    bio: row.bio,
    photoUrl: row.photo_url,
    acceptingBookings: row.accepting_bookings !== 0,
  };
}

export interface DbBooking {
  id: string;
  salon_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: string;
  service_name: string;
  staff_id: string;
  staff_name: string;
  date: string;
  time: string;
  price: number;
  duration: number;
  status: string;
  notes: string;
  created_at: string;
}

export function toPublicBooking(row: DbBooking) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    serviceId: row.service_id,
    serviceName: row.service_name,
    staffId: row.staff_id,
    staffName: row.staff_name,
    date: row.date,
    time: row.time,
    price: row.price,
    duration: row.duration || 0,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function getSalonBySlug(slug: string): DbSalon | undefined {
  return db.prepare('SELECT * FROM salons WHERE slug = ?').get(slug) as DbSalon | undefined;
}

export function getSalonByUserId(userId: string): DbSalon | undefined {
  return db.prepare('SELECT * FROM salons WHERE user_id = ?').get(userId) as DbSalon | undefined;
}

export function getServicesForSalon(salonId: string): DbService[] {
  return db
    .prepare('SELECT * FROM salon_services WHERE salon_id = ? ORDER BY sort_order ASC, rowid ASC')
    .all(salonId) as DbService[];
}

export function getStaffForSalon(salonId: string): DbStaff[] {
  return db
    .prepare('SELECT * FROM salon_staff WHERE salon_id = ? ORDER BY sort_order ASC, rowid ASC')
    .all(salonId) as DbStaff[];
}

export function getBookingsForSalon(salonId: string): DbBooking[] {
  return db
    .prepare('SELECT * FROM salon_bookings WHERE salon_id = ? ORDER BY date DESC, time DESC, created_at DESC')
    .all(salonId) as DbBooking[];
}

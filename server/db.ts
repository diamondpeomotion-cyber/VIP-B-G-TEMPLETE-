/**
 * Persistence layer for the Nexora White-Label Salon Builder.
 * Pure JS file-backed storage engine with synchronous database interface.
 *
 * Data isolation is enforced at the query layer by scoping on `salon_id` / `user_id`.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE = process.env.DATABASE_PATH || path.join(DATA_DIR, 'salonos.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StorageData {
  users: Array<Record<string, any>>;
  sessions: Array<Record<string, any>>;
  salons: Array<Record<string, any>>;
  salon_services: Array<Record<string, any>>;
  salon_staff: Array<Record<string, any>>;
  salon_bookings: Array<Record<string, any>>;
  settings: Array<Record<string, any>>;
  [key: string]: Array<Record<string, any>>;
}

let store: StorageData = {
  users: [],
  sessions: [],
  salons: [],
  salon_services: [],
  salon_staff: [],
  salon_bookings: [],
  settings: [],
};

if (fs.existsSync(JSON_FILE)) {
  try {
    const raw = fs.readFileSync(JSON_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    store = { ...store, ...parsed };
  } catch (err) {
    console.error('Error reading DB JSON file', err);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB JSON file', err);
  }
}

function getTable(name: string): Array<Record<string, any>> {
  if (!store[name]) {
    store[name] = [];
  }
  return store[name];
}

class PreparedStatement {
  private sql: string;

  constructor(sql: string) {
    this.sql = sql.trim();
  }

  get(...args: any[]): any {
    const rows = this.all(...args);
    return rows.length > 0 ? rows[0] : undefined;
  }

  all(...args: any[]): any[] {
    const sqlLower = this.sql.toLowerCase();

    // Health check
    if (sqlLower.includes('select 1 as ok')) {
      return [{ ok: 1 }];
    }

    // PRAGMA table_info
    if (sqlLower.includes('pragma table_info')) {
      const match = this.sql.match(/pragma\s+table_info\((\w+)\)/i);
      if (match) {
        const table = match[1];
        const rows = getTable(table);
        if (rows.length > 0) {
          return Object.keys(rows[0]).map((k) => ({ name: k }));
        }
        if (table === 'users') {
          return [{ name: 'id' }, { name: 'name' }, { name: 'email' }, { name: 'password_hash' }, { name: 'created_at' }, { name: 'role' }, { name: 'disabled' }, { name: 'google_sub' }];
        }
        if (table === 'salons') {
          return [{ name: 'id' }, { name: 'user_id' }, { name: 'slug' }, { name: 'name' }, { name: 'subscription_plan' }, { name: 'subscription_status' }, { name: 'published' }];
        }
        if (table === 'salon_staff') {
          return [{ name: 'id' }, { name: 'salon_id' }, { name: 'name' }, { name: 'accepting_bookings' }];
        }
        if (table === 'salon_bookings') {
          return [{ name: 'id' }, { name: 'salon_id' }, { name: 'customer_name' }, { name: 'duration' }];
        }
      }
      return [];
    }

    // SELECT COUNT
    if (sqlLower.includes('select count(*)')) {
      if (sqlLower.includes('role = \'super_admin\'') || sqlLower.includes('role = "super_admin"')) {
        return [{ n: getTable('users').filter((u) => u.role === 'super_admin').length }];
      }
      if (sqlLower.includes('from users')) {
        return [{ n: getTable('users').length }];
      }
      if (sqlLower.includes('published = 1')) {
        return [{ n: getTable('salons').filter((s) => s.published === 1 || s.published === true).length }];
      }
      if (sqlLower.includes('from salons')) {
        return [{ n: getTable('salons').length }];
      }
      if (sqlLower.includes('from salon_services')) {
        return [{ n: getTable('salon_services').length }];
      }
      if (sqlLower.includes('from salon_staff')) {
        return [{ n: getTable('salon_staff').length }];
      }
      if (sqlLower.includes('status = \'new\'') || sqlLower.includes('status = "new"')) {
        return [{ n: getTable('salon_bookings').filter((b) => b.status === 'new').length }];
      }
      if (sqlLower.includes('from salon_bookings')) {
        return [{ n: getTable('salon_bookings').length }];
      }
    }

    // GROUP BY subscription_plan
    if (sqlLower.includes('group by subscription_plan')) {
      const map: Record<string, number> = {};
      for (const s of getTable('salons')) {
        const p = s.subscription_plan || 'free';
        map[p] = (map[p] || 0) + 1;
      }
      return Object.entries(map).map(([p, n]) => ({ p, n }));
    }

    // SELECT key, value FROM settings
    if (sqlLower.includes('from settings')) {
      return getTable('settings').map((r) => ({ key: r.key, value: r.value }));
    }

    // SELECT sessions JOIN users
    if (sqlLower.includes('from sessions s') && sqlLower.includes('join users u')) {
      const token = args[0];
      const session = getTable('sessions').find((s) => s.token === token);
      if (!session) return [];
      const user = getTable('users').find((u) => u.id === session.user_id);
      if (!user) return [];
      return [{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'owner',
        disabled: user.disabled || 0,
        google_sub: user.google_sub || '',
        password_hash: user.password_hash || '',
        expires_at: session.expires_at,
      }];
    }

    // SELECT recent bookings JOIN salons
    if (sqlLower.includes('from salon_bookings b join salons s')) {
      const limit = typeof args[0] === 'number' ? args[0] : 8;
      const bookings = [...getTable('salon_bookings')].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return bookings.slice(0, limit).map((b) => {
        const s = getTable('salons').find((sal) => sal.id === b.salon_id) || {};
        return {
          id: b.id,
          customer_name: b.customer_name,
          service_name: b.service_name,
          price: b.price,
          date: b.date,
          time: b.time,
          status: b.status,
          created_at: b.created_at,
          salon_name: s.name || '',
          salon_slug: s.slug || '',
        };
      });
    }

    // Admin USER_SELECT query (LEFT JOIN)
    if (sqlLower.includes('from users u left join salons s')) {
      let usersList = [...getTable('users')];
      if (sqlLower.includes('where lower(u.name) like ?') || sqlLower.includes('u.id = ?') || sqlLower.includes('where u.id = ?')) {
        if (args.length === 1 && typeof args[0] === 'string' && !args[0].includes('%')) {
          const targetId = args[0];
          usersList = usersList.filter((u) => u.id === targetId);
        } else if (args.length >= 2) {
          const q = (args[0] || '').replace(/%/g, '').toLowerCase();
          usersList = usersList.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
        }
      }
      usersList.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      const limitMatch = this.sql.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        usersList = usersList.slice(0, parseInt(limitMatch[1], 10));
      }
      return usersList.map((u) => {
        const salon = getTable('salons').find((s) => s.user_id === u.id) || null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'owner',
          disabled: u.disabled || 0,
          google_sub: u.google_sub || '',
          created_at: u.created_at || '',
          salon_id: salon ? salon.id : null,
          salon_slug: salon ? salon.slug : null,
          salon_name: salon ? salon.name : null,
          salon_plan: salon ? salon.subscription_plan : null,
          salon_published: salon ? (salon.published ? 1 : 0) : null,
        };
      });
    }

    // Standard single table SELECTs
    if (sqlLower.includes('from users')) {
      let list = getTable('users');
      if (sqlLower.includes('where email = ?')) {
        const val = (args[0] || '').toString().toLowerCase();
        list = list.filter((u) => (u.email || '').toLowerCase() === val);
      } else if (sqlLower.includes('where google_sub = ?')) {
        list = list.filter((u) => u.google_sub === args[0]);
      } else if (sqlLower.includes('where id = ?')) {
        list = list.filter((u) => u.id === args[0]);
      }
      if (sqlLower.includes('order by created_at desc')) {
        list = [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      }
      return list;
    }

    if (sqlLower.includes('from salons')) {
      let list = getTable('salons');
      if (sqlLower.includes('where slug = ?')) {
        const val = (args[0] || '').toString().toLowerCase();
        list = list.filter((s) => (s.slug || '').toLowerCase() === val);
      } else if (sqlLower.includes('where user_id = ?')) {
        list = list.filter((s) => s.user_id === args[0]);
      } else if (sqlLower.includes('where id = ?')) {
        list = list.filter((s) => s.id === args[0]);
      }
      if (sqlLower.includes('order by created_at desc')) {
        list = [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      }
      return list;
    }

    if (sqlLower.includes('from salon_services')) {
      let list = getTable('salon_services');
      if (sqlLower.includes('where id = ? and salon_id = ?')) {
        list = list.filter((s) => s.id === args[0] && s.salon_id === args[1]);
      } else if (sqlLower.includes('where salon_id = ?')) {
        list = list.filter((s) => s.salon_id === args[0]);
      }
      if (sqlLower.includes('order by sort_order asc')) {
        list = [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
      return list;
    }

    if (sqlLower.includes('from salon_staff')) {
      let list = getTable('salon_staff');
      if (sqlLower.includes('where id = ? and salon_id = ?')) {
        list = list.filter((s) => s.id === args[0] && s.salon_id === args[1]);
      } else if (sqlLower.includes('where salon_id = ?')) {
        list = list.filter((s) => s.salon_id === args[0]);
      }
      if (sqlLower.includes('order by sort_order asc')) {
        list = [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
      return list;
    }

    if (sqlLower.includes('from salon_bookings')) {
      let list = getTable('salon_bookings');
      if (sqlLower.includes('where id = ? and salon_id = ?')) {
        list = list.filter((b) => b.id === args[0] && b.salon_id === args[1]);
      } else if (sqlLower.includes('where salon_id = ?')) {
        list = list.filter((b) => b.salon_id === args[0]);
      }
      if (sqlLower.includes('order by date desc')) {
        list = [...list].sort((a, b) => {
          const compDate = (b.date || '').localeCompare(a.date || '');
          if (compDate !== 0) return compDate;
          return (b.time || '').localeCompare(a.time || '');
        });
      }
      return list;
    }

    return [];
  }

  run(...args: any[]): { changes: number } {
    const sqlLower = this.sql.toLowerCase();
    let changes = 0;

    // INSERT INTO users
    if (sqlLower.startsWith('insert into users')) {
      const matchCols = this.sql.match(/\(([^)]+)\)\s+values\s*\(([^)]+)\)/i);
      if (matchCols) {
        const cols = matchCols[1].split(',').map((c) => c.trim().toLowerCase());
        const row: Record<string, any> = { created_at: new Date().toISOString() };
        cols.forEach((col, idx) => {
          row[col] = args[idx];
        });
        getTable('users').push(row);
        changes = 1;
      }
    }
    // UPDATE users
    else if (sqlLower.startsWith('update users')) {
      if (sqlLower.includes('set google_sub = ? where id = ?')) {
        const [sub, targetId] = args;
        const u = getTable('users').find((user) => user.id === targetId);
        if (u) {
          u.google_sub = sub;
          changes = 1;
        }
      } else if (sqlLower.includes('disabled = ?') || sqlLower.includes('role = ?')) {
        const targetId = args[args.length - 1];
        const u = getTable('users').find((user) => user.id === targetId);
        if (u) {
          let argIdx = 0;
          if (sqlLower.includes('disabled = ?')) {
            u.disabled = args[argIdx++];
          }
          if (sqlLower.includes('role = ?')) {
            u.role = args[argIdx++];
          }
          changes = 1;
        }
      }
    }
    // INSERT INTO sessions
    else if (sqlLower.startsWith('insert into sessions')) {
      const [token, userId, expiresAt] = args;
      getTable('sessions').push({
        token,
        user_id: userId,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });
      changes = 1;
    }
    // DELETE FROM sessions
    else if (sqlLower.startsWith('delete from sessions')) {
      if (sqlLower.includes('where token = ?')) {
        const token = args[0];
        const initial = getTable('sessions').length;
        store.sessions = getTable('sessions').filter((s) => s.token !== token);
        changes = initial - store.sessions.length;
      } else if (sqlLower.includes('where expires_at < ?')) {
        const now = args[0];
        const initial = getTable('sessions').length;
        store.sessions = getTable('sessions').filter((s) => s.expires_at >= now);
        changes = initial - store.sessions.length;
      } else if (sqlLower.includes('where user_id = ?')) {
        const uid = args[0];
        const initial = getTable('sessions').length;
        store.sessions = getTable('sessions').filter((s) => s.user_id !== uid);
        changes = initial - store.sessions.length;
      }
    }
    // INSERT INTO salons
    else if (sqlLower.startsWith('insert into salons')) {
      const matchCols = this.sql.match(/\(([^)]+)\)\s+values/i);
      if (matchCols) {
        const cols = matchCols[1].split(',').map((c) => c.trim().toLowerCase());
        const row: Record<string, any> = {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        cols.forEach((col, idx) => {
          row[col] = args[idx];
        });
        getTable('salons').push(row);
        changes = 1;
      }
    }
    // UPDATE salons
    else if (sqlLower.startsWith('update salons')) {
      const targetId = args[args.length - 1];
      const salon = getTable('salons').find((s) => s.id === targetId || s.user_id === targetId);
      if (salon) {
        const setPart = this.sql.match(/set\s+(.*?)\s+where/i);
        if (setPart) {
          const clauses = setPart[1].split(',').map((c) => c.trim().split('=')[0].trim().toLowerCase());
          clauses.forEach((col, idx) => {
            salon[col] = args[idx];
          });
          salon.updated_at = new Date().toISOString();
          changes = 1;
        }
      }
    }
    // DELETE FROM salons
    else if (sqlLower.startsWith('delete from salons')) {
      const targetId = args[0];
      const initial = getTable('salons').length;
      store.salons = getTable('salons').filter((s) => s.id !== targetId);
      changes = initial - store.salons.length;
    }
    // INSERT INTO salon_services
    else if (sqlLower.startsWith('insert into salon_services')) {
      const matchCols = this.sql.match(/\(([^)]+)\)\s+values/i);
      if (matchCols) {
        const cols = matchCols[1].split(',').map((c) => c.trim().toLowerCase());
        const row: Record<string, any> = {};
        cols.forEach((col, idx) => {
          row[col] = args[idx];
        });
        getTable('salon_services').push(row);
        changes = 1;
      }
    }
    // UPDATE salon_services
    else if (sqlLower.startsWith('update salon_services')) {
      const id = args[args.length - 2];
      const salonId = args[args.length - 1];
      const service = getTable('salon_services').find((s) => s.id === id && s.salon_id === salonId);
      if (service) {
        const setPart = this.sql.match(/set\s+(.*?)\s+where/i);
        if (setPart) {
          const clauses = setPart[1].split(',').map((c) => c.trim().split('=')[0].trim().toLowerCase());
          clauses.forEach((col, idx) => {
            service[col] = args[idx];
          });
          changes = 1;
        }
      }
    }
    // DELETE FROM salon_services
    else if (sqlLower.startsWith('delete from salon_services')) {
      const id = args[0];
      const salonId = args[1];
      const initial = getTable('salon_services').length;
      store.salon_services = getTable('salon_services').filter((s) => !(s.id === id && s.salon_id === salonId));
      changes = initial - store.salon_services.length;
    }
    // INSERT INTO salon_staff
    else if (sqlLower.startsWith('insert into salon_staff')) {
      const matchCols = this.sql.match(/\(([^)]+)\)\s+values/i);
      if (matchCols) {
        const cols = matchCols[1].split(',').map((c) => c.trim().toLowerCase());
        const row: Record<string, any> = {};
        cols.forEach((col, idx) => {
          row[col] = args[idx];
        });
        getTable('salon_staff').push(row);
        changes = 1;
      }
    }
    // UPDATE salon_staff
    else if (sqlLower.startsWith('update salon_staff')) {
      const id = args[args.length - 2];
      const salonId = args[args.length - 1];
      const staff = getTable('salon_staff').find((s) => s.id === id && s.salon_id === salonId);
      if (staff) {
        const setPart = this.sql.match(/set\s+(.*?)\s+where/i);
        if (setPart) {
          const clauses = setPart[1].split(',').map((c) => c.trim().split('=')[0].trim().toLowerCase());
          clauses.forEach((col, idx) => {
            staff[col] = args[idx];
          });
          changes = 1;
        }
      }
    }
    // DELETE FROM salon_staff
    else if (sqlLower.startsWith('delete from salon_staff')) {
      const id = args[0];
      const salonId = args[1];
      const initial = getTable('salon_staff').length;
      store.salon_staff = getTable('salon_staff').filter((s) => !(s.id === id && s.salon_id === salonId));
      changes = initial - store.salon_staff.length;
    }
    // INSERT INTO salon_bookings
    else if (sqlLower.startsWith('insert into salon_bookings')) {
      const matchCols = this.sql.match(/\(([^)]+)\)\s+values/i);
      if (matchCols) {
        const cols = matchCols[1].split(',').map((c) => c.trim().toLowerCase());
        const row: Record<string, any> = { created_at: new Date().toISOString() };
        cols.forEach((col, idx) => {
          row[col] = args[idx];
        });
        getTable('salon_bookings').push(row);
        changes = 1;
      }
    }
    // UPDATE salon_bookings
    else if (sqlLower.startsWith('update salon_bookings')) {
      const status = args[0];
      const id = args[1];
      const salonId = args[2];
      const booking = getTable('salon_bookings').find((b) => b.id === id && b.salon_id === salonId);
      if (booking) {
        booking.status = status;
        changes = 1;
      }
    }
    // DELETE FROM salon_bookings
    else if (sqlLower.startsWith('delete from salon_bookings')) {
      const id = args[0];
      const salonId = args[1];
      const initial = getTable('salon_bookings').length;
      store.salon_bookings = getTable('salon_bookings').filter((b) => !(b.id === id && b.salon_id === salonId));
      changes = initial - store.salon_bookings.length;
    }
    // UPSERT settings
    else if (sqlLower.startsWith('insert into settings')) {
      const key = args[0];
      const val = args[1];
      const existing = getTable('settings').find((s) => s.key === key);
      if (existing) {
        existing.value = val;
      } else {
        getTable('settings').push({ key, value: val });
      }
      changes = 1;
    }

    saveStore();
    return { changes };
  }
}

class DatabaseShim {
  pragma(_str: string) {
    /* noop */
  }

  exec(sql: string) {
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (stmt.toUpperCase().startsWith('ALTER TABLE')) {
        const match = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
        if (match) {
          const [, table, col] = match;
          for (const row of getTable(table)) {
            if (!(col in row)) {
              row[col] = '';
            }
          }
        }
      }
    }
    saveStore();
  }

  prepare(sql: string) {
    return new PreparedStatement(sql);
  }

  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const res = fn(...args);
      saveStore();
      return res;
    }) as T;
  }
}

export const db: any = new DatabaseShim();

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
  const map = new Map(rows.map((r: any) => [r.key, r.value]));
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

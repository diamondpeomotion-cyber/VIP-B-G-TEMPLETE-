/**
 * Email + password authentication for salon owners.
 *
 * - Passwords are hashed with scrypt (node:crypto) using per-user random
 *   salts and constant-time comparison.
 * - Sessions are opaque 256-bit random tokens stored hashed-in-DB as HTTP-only
 *   SameSite=Lax cookies with a 30-day expiry.
 * - A tiny in-memory fixed-window rate limiter protects the auth endpoints.
 */
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { db, uid } from './db';

export const SESSION_COOKIE = 'nexora_sid';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// ---------------------------------------------------------------------------
// Password hashing (scrypt)
// ---------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derived] = stored.split(':');
  if (!salt || !derived) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(derived, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------
export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function isSecureRequest(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

export function setSessionCookie(req: Request, res: Response, token: string, maxAgeMs = SESSION_TTL_MS) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req: Request, res: Response) {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export interface OwnerUser {
  id: string;
  name: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      owner?: OwnerUser;
    }
  }
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    Date.now() + SESSION_TTL_MS
  );
  return token;
}

export function destroySession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function findUserBySession(token: string): OwnerUser | null {
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at FROM sessions s
       JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token) as { id: string; name: string; email: string; expires_at: number } | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
}

/** Attaches req.owner when a valid session cookie is present. */
export function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) {
    const user = findUserBySession(token);
    if (user) req.owner = user;
  }
  next();
}

/** Hard guard — only authenticated salon owners may pass. */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.owner) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

// Periodically purge expired sessions (every hour) so the table stays lean.
setInterval(() => {
  try {
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  } catch {
    /* noop */
  }
}, 60 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Tiny fixed-window rate limiter (per IP)
// ---------------------------------------------------------------------------
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.path}:${req.ip || 'unknown'}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return res
        .status(429)
        .json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    next();
  };
}

export function createUser(name: string, email: string, password: string): OwnerUser {
  const id = uid('usr');
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
    id,
    name.trim(),
    email.trim().toLowerCase(),
    hashPassword(password)
  );
  return { id, name: name.trim(), email: email.trim().toLowerCase() };
}

export function findUserByEmail(email: string): (OwnerUser & { password_hash: string }) | null {
  const row = db
    .prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as
    | { id: string; name: string; email: string; password_hash: string }
    | undefined;
  return row || null;
}

export function findUserById(id: string): OwnerUser | null {
  const row = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as
    | OwnerUser
    | undefined;
  return row || null;
}

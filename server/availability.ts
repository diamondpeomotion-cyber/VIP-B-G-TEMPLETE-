/**
 * Booking availability engine (single source of truth for slot conflicts).
 *
 * Used by:
 *  - GET /api/site/:slug/availability  (lets customers see live open slots)
 *  - POST /api/site/:slug/bookings     (server-side double-booking guard)
 *
 * Rules:
 *  - Slots come from TIME_SLOTS (shared with the client via curated.ts).
 *  - A candidate slot [t, t+serviceDuration) conflicts with any active
 *    (new/confirmed) booking whose window overlaps it.
 *  - Bookings made with "First available" (empty staff_id) conflict with
 *    every specialist; bookings tied to a specialist only conflict with
 *    that specialist's other bookings.
 *  - Same-day slots that have already passed are unavailable.
 *  - Bookings are accepted from today up to MAX_BOOKING_DAYS_AHEAD.
 */
import { TIME_SLOTS } from '../src/builder/curated';
import { db } from './db';

export const MAX_BOOKING_DAYS_AHEAD = 90;
export const MIN_SLOT_LEAD_MINUTES = 0; // same-day slots blocked once passed

export interface SlotState {
  time: string;
  available: boolean;
  /** Machine-readable reason when unavailable: 'booked' | 'past'. */
  reason?: 'booked' | 'past';
}

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Validate a YYYY-MM-DD booking date. Returns an error message or null. */
export function validateBookingDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Please choose an appointment date.';
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return 'Please choose a valid appointment date.';
  const today = todayStr();
  if (date < today) return 'Appointment date cannot be in the past.';
  const max = todayStr(new Date(Date.now() + MAX_BOOKING_DAYS_AHEAD * 86400000));
  if (date > max) return `Bookings are open up to ${MAX_BOOKING_DAYS_AHEAD} days ahead. Please pick an earlier date.`;
  return null;
}

function lookupServiceDuration(salonId: string, serviceId: string): number {
  try {
    const row = db
      .prepare('SELECT duration FROM salon_services WHERE id = ? AND salon_id = ?')
      .get(serviceId, salonId) as { duration?: number } | undefined;
    const d = Number(row?.duration) || 0;
    return d > 0 ? d : 30;
  } catch {
    return 30;
  }
}

interface ActiveBookingRow {
  time: string;
  service_id: string;
  staff_id: string;
  duration: number;
}

function activeBookingsForDay(salonId: string, date: string): ActiveBookingRow[] {
  return db
    .prepare(
      `SELECT time, service_id, staff_id, COALESCE(duration, 0) AS duration
       FROM salon_bookings
       WHERE salon_id = ? AND date = ? AND status IN ('new', 'confirmed')`
    )
    .all(salonId, date) as ActiveBookingRow[];
}

/**
 * Compute per-slot availability for a salon + day, optionally scoped to a
 * service duration and/or a specialist.
 */
export function getAvailability(
  salonId: string,
  date: string,
  opts: { serviceDuration?: number; staffId?: string } = {}
): SlotState[] {
  const duration = Math.max(5, Math.min(8 * 60, Math.round(opts.serviceDuration || 30)));
  const staffId = opts.staffId || 'any';
  const rows = activeBookingsForDay(salonId, date);

  const now = new Date();
  const isToday = date === todayStr(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + MIN_SLOT_LEAD_MINUTES;

  return TIME_SLOTS.map((time) => {
    const start = toMinutes(time);
    const end = start + duration;

    if (isToday && start <= nowMinutes) {
      return { time, available: false, reason: 'past' as const };
    }

    for (const b of rows) {
      // A booking tied to another specialist never blocks this one.
      if (staffId !== 'any' && b.staff_id && b.staff_id !== staffId) continue;
      const bDuration = b.duration > 0 ? b.duration : lookupServiceDuration(salonId, b.service_id);
      const bStart = toMinutes(b.time);
      const bEnd = bStart + bDuration;
      if (start < bEnd && bStart < end) {
        return { time, available: false, reason: 'booked' as const };
      }
    }
    return { time, available: true };
  });
}

/** Suggest up to `limit` open slots at/after `afterTime` (for 409 recovery). */
export function suggestAlternatives(
  slots: SlotState[],
  afterTime?: string,
  limit = 4
): string[] {
  const after = afterTime ? toMinutes(afterTime) : -1;
  return slots
    .filter((s) => s.available && toMinutes(s.time) >= after)
    .slice(0, limit)
    .map((s) => s.time);
}

/**
 * End-to-end smoke suite for Nexora White-Label Salon Studio.
 *
 * Boots against a running server (default http://127.0.0.1:3100) and walks the
 * full lifecycle: signup → salon → services/staff → publish → public site →
 * availability → booking → double-book conflict → lookup → cancel → owner
 * inbox → AI fallbacks → admin RBAC → tenant isolation → legacy demo guards.
 *
 * Usage:  node scripts/smoke.mjs [baseUrl]
 * Exit code is 0 on success, 1 on the first failed assertion.
 */
const BASE = (process.argv[2] || 'http://127.0.0.1:3100').replace(/\/+$/, '');
const stamp = Date.now().toString(36);
const SLUG = `smoke-${stamp}`.slice(0, 24);
const EMAIL = `owner-${stamp}@example.com`;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || `admin-${stamp}@example.com`;
const CUSTOMER_EMAIL = `guest-${stamp}@example.com`;

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}
function fail(name, detail) {
  console.error(`  ✗ ${name}`);
  if (detail !== undefined) console.error(`    → ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  process.exitCode = 1;
  throw new Error(`smoke failed: ${name}`);
}
function assert(cond, name, detail) {
  if (cond) ok(name);
  else fail(name, detail);
}

// Minimal cookie jar (session cookie).
function jar() {
  const store = new Map();
  return {
    async fetch(path, opts = {}) {
      const headers = { ...(opts.headers || {}) };
      if (store.size) headers.cookie = [...store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      if (opts.body !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
      const res = await fetch(`${BASE}${path}`, { ...opts, headers });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const [pair] = setCookie.split(';');
        const idx = pair.indexOf('=');
        if (idx > 0) store.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      return { status: res.status, json };
    },
  };
}

const anon = jar();
const owner = jar();
const ownerB = jar();
const admin = jar();
const fmt = (d) => d.toISOString().slice(0, 10);
const tomorrow = fmt(new Date(Date.now() + 86400000));

try {
  console.log(`\n▸ Smoke suite → ${BASE} (slug: ${SLUG})`);

  // 0. Health + unknown API route shape.
  {
    const r = await anon.fetch('/api/health');
    assert(r.status === 200 && r.json?.ok === true, 'GET /api/health reports ok', r);
    const n = await anon.fetch('/api/does-not-exist');
    assert(n.status === 404 && n.json?.code === 'NOT_FOUND', 'unknown /api/* returns JSON 404', n);
  }

  // 1. Owner signup + salon creation.
  let serviceId = '';
  let staffId = '';
  {
    const s = await owner.fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Smoke Owner', email: EMAIL, password: 'smoke-pass-123' }),
    });
    assert(s.status === 201 && s.json?.user?.email === EMAIL.toLowerCase(), 'owner signup 201 + session', s);
    const mine = await owner.fetch('/api/salon/mine');
    assert(mine.status === 404 && mine.json?.code === 'NO_SALON', 'fresh owner has NO_SALON', mine);
    const c = await owner.fetch('/api/salon', {
      method: 'POST',
      body: JSON.stringify({ name: 'Smoke Salon', slug: SLUG, tagline: 'Smoke test studio', category: 'BEAUTY' }),
    });
    assert(c.status === 201 && c.json?.salon?.slug === SLUG, 'salon created with slug', c);
  }

  // 2. Services + staff (incl. acceptingBookings toggle round-trip).
  {
    const svc = await owner.fetch('/api/salon/mine/services', {
      method: 'PUT',
      body: JSON.stringify({
        services: [
          { name: 'Smoke Cut', category: 'Hair & Styling', price: 999, duration: 60, description: 'Test cut' },
          { name: 'Smoke Facial', category: 'Skin & Facials', price: 1499, duration: 45, description: 'Test facial' },
        ],
      }),
    });
    assert(svc.status === 200 && svc.json?.services?.length === 2, 'bulk service replace (2)', svc);
    serviceId = svc.json.services[0].id;
    const stf = await owner.fetch('/api/salon/mine/staff', {
      method: 'PUT',
      body: JSON.stringify({
        staff: [{ name: 'Smoke Stylist', role: 'Senior Stylist', specialties: ['Cuts'], bio: '', photoUrl: '', acceptingBookings: true }],
      }),
    });
    assert(stf.status === 200 && stf.json?.staff?.[0]?.acceptingBookings === true, 'staff saved with acceptingBookings=true', stf);
    staffId = stf.json.staff[0].id;
    const off = await owner.fetch(`/api/salon/mine/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Smoke Stylist', acceptingBookings: false }),
    });
    assert(off.status === 200 && off.json?.staff?.acceptingBookings === false, 'staff toggle OFF persists', off);
    const on = await owner.fetch(`/api/salon/mine/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Smoke Stylist', acceptingBookings: true }),
    });
    assert(on.status === 200 && on.json?.staff?.acceptingBookings === true, 'staff toggle ON persists', on);
    const bulkOff = await owner.fetch('/api/salon/mine/staff', {
      method: 'PUT',
      body: JSON.stringify({
        staff: [{ id: staffId, name: 'Smoke Stylist', role: 'Senior Stylist', acceptingBookings: false }],
      }),
    });
    assert(bulkOff.status === 200 && bulkOff.json?.staff?.[0]?.acceptingBookings === false, 'bulk replace persists toggle OFF', bulkOff);
    const bulkOn = await owner.fetch('/api/salon/mine/staff', {
      method: 'PUT',
      body: JSON.stringify({
        staff: [{ id: staffId, name: 'Smoke Stylist', role: 'Senior Stylist', acceptingBookings: true }],
      }),
    });
    assert(bulkOn.status === 200 && bulkOn.json?.staff?.[0]?.acceptingBookings === true, 'bulk replace persists toggle ON', bulkOn);
    // A paused specialist is rejected by availability + booking intake.
    const pausedOff = await owner.fetch('/api/salon/mine/staff', {
      method: 'PUT',
      body: JSON.stringify({
        staff: [{ id: staffId, name: 'Smoke Stylist', role: 'Senior Stylist', acceptingBookings: false }],
      }),
    });
    assert(pausedOff.status === 200, 'specialist paused for intake test', pausedOff.status);
  }

  // 3. Contact + publish workflow.
  {
    const u = await owner.fetch('/api/salon/mine', {
      method: 'PUT',
      body: JSON.stringify({ phone: '+91 9000000000', city: 'Jaipur', heroImageUrl: 'https://example.com/hero.jpg' }),
    });
    assert(u.status === 200 && u.json?.salon?.phone === '+91 9000000000', 'contact details saved', u);
    const unpub = await anon.fetch(`/api/site/${SLUG}`);
    assert(unpub.status === 404 && unpub.json?.code === 'NOT_PUBLISHED', 'draft site is NOT_PUBLISHED publicly', unpub);
    const p = await owner.fetch('/api/salon/mine/publish', { method: 'POST' });
    assert(p.status === 200 && p.json?.salon?.published === true, 'publish succeeds', p);
    const pausedAvail = await anon.fetch(`/api/site/${SLUG}/availability?date=${tomorrow}&serviceId=${serviceId}&staffId=${staffId}`);
    assert(pausedAvail.status === 400, 'availability rejects paused specialist', pausedAvail);
    const pausedBook = await anon.fetch(`/api/site/${SLUG}/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Paused Guest', customerEmail: 'paused@example.com',
        serviceId, staffId, date: tomorrow, time: '10:00',
      }),
    });
    assert(pausedBook.status === 400, 'booking intake rejects paused specialist', pausedBook);
    const reenable = await owner.fetch('/api/salon/mine/staff', {
      method: 'PUT',
      body: JSON.stringify({
        staff: [{ id: staffId, name: 'Smoke Stylist', role: 'Senior Stylist', acceptingBookings: true }],
      }),
    });
    assert(reenable.status === 200 && reenable.json?.staff?.[0]?.acceptingBookings === true, 'specialist re-enabled', reenable);
    const pub = await anon.fetch(`/api/site/${SLUG}`);
    assert(pub.status === 200 && pub.json?.services?.length === 2 && pub.json?.staff?.length === 1, 'public site payload serves menu + team', pub);
  }

  // 4. Availability → book → conflict (409 + suggestions) → availability reflects it.
  let bookingId = '';
  const SLOT = '11:00';
  {
    const a = await anon.fetch(`/api/site/${SLUG}/availability?date=${tomorrow}&serviceId=${serviceId}&staffId=${staffId}`);
    assert(a.status === 200 && Array.isArray(a.json?.slots) && a.json.slots.length > 10, 'availability returns slot grid', a);
    assert(a.json.slots.every((s) => s.available), 'fresh day is fully open', a.json.slots.filter((s) => !s.available));
    const b = await anon.fetch(`/api/site/${SLUG}/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Smoke Guest', customerEmail: CUSTOMER_EMAIL, customerPhone: '+91 9111111111',
        serviceId, staffId, date: tomorrow, time: SLOT, notes: 'smoke test',
      }),
    });
    assert(b.status === 201 && b.json?.booking?.status === 'new', 'booking created (201, status=new)', b);
    bookingId = b.json.booking.id;
    const dup = await anon.fetch(`/api/site/${SLUG}/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Second Guest', customerEmail: 'second@example.com',
        serviceId, staffId, date: tomorrow, time: SLOT,
      }),
    });
    assert(
      dup.status === 409 && dup.json?.code === 'SLOT_TAKEN' && Array.isArray(dup.json?.suggestions),
      'double-booking rejected with SLOT_TAKEN + suggestions', dup
    );
    const a2 = await anon.fetch(`/api/site/${SLUG}/availability?date=${tomorrow}&serviceId=${serviceId}&staffId=${staffId}`);
    const slot = a2.json.slots.find((s) => s.time === SLOT);
    assert(slot && slot.available === false && slot.reason === 'booked', 'booked slot shows unavailable', slot);
    // Duration overlap: 60-min service at 11:00 blocks 11:30 too.
    const overlap = a2.json.slots.find((s) => s.time === '11:30');
    assert(overlap && overlap.available === false, 'overlapping 11:30 blocked by 60-min service', overlap);
  }

  // 5. Customer self-service: lookup + cancel (wrong email rejected).
  {
    const l = await anon.fetch(`/api/site/${SLUG}/bookings/lookup?email=${encodeURIComponent(CUSTOMER_EMAIL)}`);
    assert(l.status === 200 && l.json?.bookings?.length === 1 && l.json.bookings[0].id === bookingId, 'lookup returns own booking', l);
    const wrong = await anon.fetch(`/api/site/${SLUG}/bookings/${bookingId}/cancel`, {
      method: 'POST', body: JSON.stringify({ email: 'intruder@example.com' }),
    });
    assert(wrong.status === 404, 'cancel with wrong email is rejected', wrong);
    const c = await anon.fetch(`/api/site/${SLUG}/bookings/${bookingId}/cancel`, {
      method: 'POST', body: JSON.stringify({ email: CUSTOMER_EMAIL }),
    });
    assert(c.status === 200 && c.json?.booking?.status === 'cancelled', 'customer cancels own booking', c);
    const again = await anon.fetch(`/api/site/${SLUG}/bookings/${bookingId}/cancel`, {
      method: 'POST', body: JSON.stringify({ email: CUSTOMER_EMAIL }),
    });
    assert(again.status === 409, 'double-cancel rejected', again);
  }

  // 6. Owner inbox sees the booking; invalid status rejected.
  {
    const inbox = await owner.fetch('/api/salon/mine/bookings');
    assert(inbox.status === 200 && inbox.json?.bookings?.some((b) => b.id === bookingId), 'owner inbox contains booking', inbox.status);
    const bad = await owner.fetch(`/api/salon/mine/bookings/${bookingId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'teleported' }),
    });
    assert(bad.status === 400, 'invalid booking status rejected', bad);
    const confirm = await owner.fetch(`/api/salon/mine/bookings/${bookingId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'confirmed' }),
    });
    assert(confirm.status === 200 && confirm.json?.booking?.status === 'confirmed', 'owner updates status', confirm);
  }

  // 7. Tenant isolation: second owner cannot see/touch the first salon.
  {
    const s = await ownerB.fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Owner B', email: `b-${stamp}@example.com`, password: 'smoke-pass-123' }),
    });
    assert(s.status === 201, 'second owner signup', s.status);
    const mine = await ownerB.fetch('/api/salon/mine');
    assert(mine.status === 404 && mine.json?.code === 'NO_SALON', 'owner B has no access to owner A salon', mine);
    const inbox = await ownerB.fetch('/api/salon/mine/bookings');
    assert(inbox.status === 404, 'owner B cannot read owner A bookings', inbox.status);
  }

  // 8. AI endpoints: graceful fallback without a key (never 500).
  {
    const c = await anon.fetch('/api/ai/consult', {
      method: 'POST',
      body: JSON.stringify({
        hairTexture: 'Wavy', facialShape: 'Oval', styleGoals: 'Fresh look',
        salonName: 'Smoke Salon', servicesCtx: [{ id: serviceId, name: 'Smoke Cut', price: 999 }],
      }),
    });
    assert(c.status === 200 && c.json?.styles?.length > 0 && typeof c.json?.overallAdvice === 'string', 'AI consult returns advice (fallback ok)', c.status);
    const m = await anon.fetch('/api/ai/marketing', {
      method: 'POST',
      body: JSON.stringify({ salonName: 'Smoke Salon', city: 'Jaipur', activePromotion: 'Smoke Cut' }),
    });
    assert(m.status === 200 && m.json?.promoCode && m.json?.copy, 'AI marketing returns campaign (fallback ok)', m.status);
    const bad = await anon.fetch('/api/ai/consult', { method: 'POST', body: JSON.stringify({}) });
    assert(bad.status === 400, 'AI consult validates required fields', bad.status);
  }

  // 9. Admin RBAC: owner blocked, env-admin allowed.
  {
    const blocked = await owner.fetch('/api/admin/overview');
    assert(blocked.status === 403, 'non-admin blocked from /api/admin/*', blocked.status);
    const s = await admin.fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Smoke Admin', email: ADMIN_EMAIL, password: 'smoke-pass-123' }),
    });
    assert(s.status === 201 && s.json?.user?.role === 'super_admin', 'ADMIN_EMAILS bootstrap grants super_admin', s);
    const ov = await admin.fetch('/api/admin/overview');
    assert(ov.status === 200 && typeof ov.json?.totals?.salons === 'number', 'admin overview loads', ov.status);
  }

  // 10. Legacy demo guards: conflict 409 + status enum validation.
  {
    const t = await anon.fetch('/api/tenants');
    assert(t.status === 200 && t.json?.length === 3, 'demo tenants served', t.status);
    const a = await anon.fetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'downtown-executive', clientName: 'Smoke Demo', serviceId: 's-1',
        stylistId: 'sty-1', date: tomorrow, time: '10:00',
      }),
    });
    assert(a.status === 201, 'demo booking created', a);
    const dup = await anon.fetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'downtown-executive', clientName: 'Smoke Demo 2', serviceId: 's-1',
        stylistId: 'sty-1', date: tomorrow, time: '10:00',
      }),
    });
    assert(dup.status === 409 && dup.json?.code === 'SLOT_TAKEN', 'demo double-booking rejected', dup);
    const bad = await anon.fetch(`/api/appointments/${a.json.id}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'teleported' }),
    });
    assert(bad.status === 400, 'demo PATCH validates status enum', bad.status);
  }

  console.log(`\n✅ All ${passed} smoke assertions passed.\n`);
} catch (e) {
  console.error(`\n❌ Smoke suite aborted after ${passed} passing assertions.\n`);
  process.exit(1);
}

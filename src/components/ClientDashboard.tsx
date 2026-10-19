import React, { useState } from 'react';
import { X, RefreshCw, CalendarDays, Search, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '../builder/api';
import type { SiteBooking } from '../builder/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-[#c5a059]/10 border-[#c5a059]/30 text-[#c5a059]',
  confirmed: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
  completed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  cancelled: 'bg-red-500/10 border-red-500/30 text-red-400',
};

/**
 * Customer self-service panel ("Manage my booking") for public salon sites.
 *
 * Customers enter the email they booked with, see their upcoming/past
 * reservations, and can cancel new/confirmed ones online. All verification
 * happens server-side (email must match the booking).
 */
export function ClientDashboard({
  slug,
  salonName,
  onClose,
}: {
  slug: string;
  salonName: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<SiteBooking[] | null>(null);
  const [cancellingId, setCancellingId] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [cancelError, setCancelError] = useState('');

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('Enter the email address you booked with.');
      return;
    }
    setFieldError('');
    setError('');
    setLoading(true);
    try {
      const res = await api.get<{ bookings: SiteBooking[] }>(
        `/api/site/${encodeURIComponent(slug)}/bookings/lookup?email=${encodeURIComponent(trimmed)}`
      );
      setBookings(res.bookings);
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.message || 'Could not load your bookings. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string) => {
    setCancelError('');
    setCancellingId(id);
    try {
      const res = await api.post<{ booking: SiteBooking }>(
        `/api/site/${encodeURIComponent(slug)}/bookings/${encodeURIComponent(id)}/cancel`,
        { email: email.trim().toLowerCase() }
      );
      setBookings((list) => (list ? list.map((b) => (b.id === id ? res.booking : b)) : list));
      setConfirmId('');
    } catch (err) {
      setCancelError((err as Error).message || 'Cancellation failed. Please try again.');
    } finally {
      setCancellingId('');
    }
  };

  const modalInput =
    'w-full bg-black/30 text-sm border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition placeholder:text-stone-600';
  const modalLabel = 'text-[10px] uppercase tracking-wider text-stone-500 font-mono font-bold block mb-1.5';

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-[#121214] border border-[#2a2a2d] w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2d] sticky top-0 bg-[#121214] z-10">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-[#c5a059]">{salonName}</p>
            <h3 className="font-serif italic text-white text-xl">Manage my bookings</h3>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={lookup} className="space-y-3">
            <div>
              <label className={modalLabel}>Booking email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError('');
                  }}
                  placeholder="you@example.com"
                  className={`${modalInput}${fieldError ? ' input-error' : ''}`}
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="primary-action shrink-0 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm transition inline-flex items-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  {bookings ? 'Refresh' : 'Find'}
                </button>
              </div>
              {fieldError && <p className="text-[11px] text-red-400 mt-1.5">{fieldError}</p>}
            </div>
          </form>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={() => lookup()}
                disabled={loading}
                className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:text-white transition cursor-pointer"
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Retry
              </button>
            </div>
          )}

          {cancelError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5">{cancelError}</p>
          )}

          {bookings === null && !error && (
            <div className="border border-dashed border-[#2a2a2d] rounded-lg py-8 px-6 text-center">
              <CalendarDays size={24} className="text-[#c5a059] mx-auto mb-2 opacity-70" />
              <p className="text-xs text-stone-500 leading-relaxed">
                Enter your booking email above to see your reservations and cancel online when plans change.
              </p>
            </div>
          )}

          {bookings !== null && bookings.length === 0 && (
            <div className="border border-dashed border-[#2a2a2d] rounded-lg py-8 px-6 text-center">
              <CheckCircle2 size={24} className="text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-serif italic text-white">No bookings found</p>
              <p className="text-xs text-stone-500 mt-1">Nothing under this email yet — double-check the spelling or book a visit.</p>
            </div>
          )}

          {bookings !== null && bookings.length > 0 && (
            <div className="space-y-3">
              {bookings.map((b) => {
                const cancellable = b.status === 'new' || b.status === 'confirmed';
                return (
                  <article key={b.id} className="bg-black/30 border border-[#2a2a2d] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{b.serviceName}</h4>
                        <p className="text-[11px] font-mono text-stone-400 mt-1">
                          {b.date} at {b.time}
                          {b.staffName && b.staffName !== 'First available' ? ` · with ${b.staffName}` : ''}
                        </p>
                        <p className="text-[11px] font-mono text-[#c5a059] mt-0.5">₹{Number(b.price || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center border rounded px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono font-bold ${STATUS_STYLES[b.status] || STATUS_STYLES.new}`}>
                        {b.status}
                      </span>
                    </div>
                    {cancellable && confirmId !== b.id && (
                      <button
                        onClick={() => setConfirmId(b.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Ban size={11} /> Cancel reservation
                      </button>
                    )}
                    {cancellable && confirmId === b.id && (
                      <div className="mt-3 flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded px-3 py-2.5">
                        <AlertTriangle size={13} className="text-red-400 shrink-0" />
                        <p className="text-[11px] text-stone-300 flex-1">Cancel this reservation?</p>
                        <button
                          onClick={() => cancel(b.id)}
                          disabled={cancellingId === b.id}
                          className="danger-action text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {cancellingId === b.id && <RefreshCw size={11} className="animate-spin" />}
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmId('')}
                          disabled={cancellingId === b.id}
                          className="ghost-action text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition cursor-pointer"
                        >
                          Keep
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;

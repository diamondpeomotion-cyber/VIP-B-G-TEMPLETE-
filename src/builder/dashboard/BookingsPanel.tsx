import React, { useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, Phone, Mail, StickyNote } from 'lucide-react';
import { api } from '../api';
import type { SiteBooking } from '../types';
import { Card, Badge, EmptyState } from '../fields';

const STATUS_TONES: Record<string, 'gold' | 'green' | 'stone' | 'red' | 'blue'> = {
  new: 'gold',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const NEXT_ACTIONS: Record<string, Array<{ to: string; label: string }>> = {
  new: [
    { to: 'confirmed', label: 'Confirm' },
    { to: 'cancelled', label: 'Decline' },
  ],
  confirmed: [
    { to: 'completed', label: 'Mark completed' },
    { to: 'cancelled', label: 'Cancel' },
  ],
  completed: [],
  cancelled: [{ to: 'confirmed', label: 'Restore' }],
};

export default function BookingsPanel({
  bookings,
  onChanged,
}: {
  bookings: SiteBooking[];
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'new' | 'upcoming' | 'cancelled'>('all');
  const [busyId, setBusyId] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'new':
        return bookings.filter((b) => b.status === 'new');
      case 'upcoming':
        return bookings.filter((b) => b.status !== 'cancelled' && b.date >= today);
      case 'cancelled':
        return bookings.filter((b) => b.status === 'cancelled');
      default:
        return bookings;
    }
  }, [bookings, filter, today]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api.patch(`/api/salon/mine/bookings/${encodeURIComponent(id)}`, { status });
      onChanged();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card
      title="Booking requests"
      subtitle="Every reservation made on your website lands here in real time."
      badge={
        <div className="flex gap-1.5">
          {(['all', 'new', 'upcoming', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                filter === f ? 'bg-[#c5a059] text-black' : 'text-stone-400 hover:text-white border border-[#2a2a2d]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title="Nothing here yet"
          message="When visitors book from your website, their requests appear here instantly for confirmation."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <article key={b.id} className="bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">{b.customerName}</h4>
                    <Badge tone={STATUS_TONES[b.status] || 'stone'}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {b.serviceName} · <span className="text-[#c5a059] font-mono">₹{b.price.toLocaleString('en-IN')}</span>
                    {b.staffName && b.staffName !== 'First available' && <span className="text-stone-500"> with {b.staffName}</span>}
                  </p>
                  <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                    {b.date} at {b.time} · requested {new Date(b.createdAt?.replace(' ', 'T') + 'Z').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {b.customerPhone && (
                      <a href={`tel:${b.customerPhone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-stone-400 hover:text-[#c5a059] transition">
                        <Phone size={11} /> {b.customerPhone}
                      </a>
                    )}
                    {b.customerEmail && (
                      <a href={`mailto:${b.customerEmail}`} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-stone-400 hover:text-[#c5a059] transition">
                        <Mail size={11} /> {b.customerEmail}
                      </a>
                    )}
                  </div>
                  {b.notes && (
                    <p className="inline-flex items-start gap-1.5 text-[11px] text-stone-500 mt-2 bg-[#121214] border border-[#2a2a2d] rounded px-2.5 py-1.5">
                      <StickyNote size={11} className="mt-0.5 shrink-0 text-[#c5a059]" /> {b.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {(NEXT_ACTIONS[b.status] || []).map((a) => (
                    <button
                      key={a.to}
                      onClick={() => updateStatus(b.id, a.to)}
                      disabled={busyId === b.id}
                      className={`text-[10px] font-bold uppercase tracking-widest font-mono rounded px-3 py-1.5 transition cursor-pointer disabled:opacity-50 ${
                        a.to === 'cancelled'
                          ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                          : 'border border-[#c5a059]/30 text-[#c5a059] hover:bg-[#c5a059]/10'
                      }`}
                    >
                      {busyId === b.id ? <RefreshCw size={11} className="animate-spin inline" /> : a.label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

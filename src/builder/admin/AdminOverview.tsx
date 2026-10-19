import React, { useEffect, useState } from 'react';
import { Users, Store, Globe, Sparkles, CalendarDays, RefreshCw, UserPlus } from 'lucide-react';
import { api } from '../api';
import { Card, Badge } from '../fields';
import type { AdminUser, PlatformSettings } from '../types';

interface OverviewData {
  totals: { users: number; admins: number; salons: number; published: number; services: number; staff: number; bookings: number; newBookings: number };
  byPlan: Record<string, number>;
  recentUsers: AdminUser[];
  recentBookings: Array<{
    id: string; customerName: string; serviceName: string; price: number;
    date: string; time: string; status: string; salonName: string; salonSlug: string;
  }>;
  settings: PlatformSettings;
}

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setData(await api.get<OverviewData>('/api/admin/overview'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-4 py-3">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw size={24} className="text-[#c5a059] animate-spin" />
      </div>
    );
  }

  const t = data.totals;
  const cards = [
    { label: 'Total owners', value: t.users, icon: <Users size={15} className="text-stone-500" /> },
    { label: 'Super admins', value: t.admins, icon: <UserPlus size={15} className="text-[#c5a059]" /> },
    { label: 'Salon websites', value: t.salons, icon: <Store size={15} className="text-stone-500" /> },
    { label: 'Published sites', value: t.published, icon: <Globe size={15} className="text-emerald-400" /> },
    { label: 'Services listed', value: t.services, icon: <Sparkles size={15} className="text-stone-500" /> },
    { label: 'Total bookings', value: t.bookings, icon: <CalendarDays size={15} className="text-stone-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#121214] border border-[#2a2a2d] rounded-lg p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-stone-500">{c.label}</p>
              {c.icon}
            </div>
            <p className="text-3xl font-serif mt-3 text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Subscriptions by plan" subtitle="Distribution of salons across plans.">
          <div className="space-y-3">
            {(['free', 'pro', 'premium'] as const).map((p) => {
              const count = Number(data.byPlan[p]) || 0;
              const total = Math.max(1, (Object.values(data.byPlan) as number[]).reduce((a, b) => a + b, 0));
              const pct = Math.round((count / total) * 100);
              return (
                <div key={p}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-mono uppercase tracking-wider text-stone-300">{p}</span>
                    <span className="text-stone-500 font-mono">{count} salons · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
                    <div className="bg-[#c5a059] h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Latest signups" subtitle="Newest owner accounts on the platform.">
          {data.recentUsers.length === 0 ? (
            <p className="text-sm text-stone-500 italic font-serif">No owners yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{u.name} <span className="text-stone-500 font-normal">· {u.email}</span></p>
                    <p className="text-[10px] font-mono text-stone-600">
                      {u.salon ? `/s/${u.salon.slug}` : 'no salon yet'} · via {u.authProvider} · {u.createdAt}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {u.role === 'super_admin' && <Badge tone="gold">admin</Badge>}
                    {u.disabled && <Badge tone="red">disabled</Badge>}
                    {u.salon?.published && <Badge tone="green">live</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Latest bookings platform-wide" subtitle="Real-time pulse of reservations across every salon.">
        {data.recentBookings.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">No bookings yet across the platform.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest font-mono text-stone-500 border-b border-[#1c1c1f]">
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">Salon</th>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141416]">
                {data.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 pr-3 text-white font-medium">{b.customerName}</td>
                    <td className="py-2.5 pr-3 text-stone-400">{b.serviceName}</td>
                    <td className="py-2.5 pr-3 text-stone-500 font-mono">/s/{b.salonSlug}</td>
                    <td className="py-2.5 pr-3 text-stone-400 font-mono whitespace-nowrap">{b.date} {b.time}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-[#c5a059]">₹{b.price.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 pl-3 text-right"><Badge tone={b.status === 'new' ? 'gold' : b.status === 'confirmed' ? 'blue' : b.status === 'cancelled' ? 'red' : 'green'}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

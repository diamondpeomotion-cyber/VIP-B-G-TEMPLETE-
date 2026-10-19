import React from 'react';
import { CalendarDays, Globe, Sparkles, Users, Rocket, Copy, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Salon, SiteUrls, SiteBooking } from '../types';
import { Card, GhostButton, Badge, PrimaryButton } from '../fields';
import type { SectionKey } from './Dashboard';

export default function OverviewPanel({
  data,
  bookings,
  onNavigate,
}: {
  data: { salon: Salon; urls: SiteUrls; stats: { totalBookings: number; newBookings: number; upcomingBookings: number } };
  bookings: SiteBooking[];
  onNavigate: (s: SectionKey) => void;
}) {
  const { salon, urls, stats } = data;
  const [copied, setCopied] = React.useState(false);
  const liveUrl = urls.subdomainUrl || urls.pathUrl;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard may be unavailable; ignore */ }
  };

  const statCards = [
    { label: 'Total bookings', value: stats.totalBookings, icon: <CalendarDays size={16} className="text-stone-500" /> },
    { label: 'New requests', value: stats.newBookings, icon: <TrendingUp size={16} className="text-[#c5a059]" />, highlight: stats.newBookings > 0 },
    { label: 'Upcoming visits', value: stats.upcomingBookings, icon: <Users size={16} className="text-stone-500" /> },
    { label: 'Services live', value: undefined, icon: <Sparkles size={16} className="text-stone-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Status hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c5a059, transparent 70%)' }} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-serif italic text-white">{salon.name}</h2>
              {salon.published ? <Badge tone="green">● Live on the web</Badge> : <Badge tone="amber">Draft — not published</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="font-mono text-xs text-stone-500 break-all">{liveUrl}</span>
              <button onClick={copyUrl} className="p-1 text-stone-500 hover:text-[#c5a059] transition cursor-pointer" title="Copy link">
                {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!salon.published && (
              <PrimaryButton onClick={() => onNavigate('publish')}>
                <Rocket size={13} /> Publish now
              </PrimaryButton>
            )}
            <GhostButton onClick={() => onNavigate('website')}>
              <Globe size={13} /> Edit website
            </GhostButton>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="bg-[#121214] border border-[#2a2a2d] rounded-lg p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-stone-500">{c.label}</p>
              {c.icon}
            </div>
            <p className={`text-3xl font-serif mt-3 ${'highlight' in c && c.highlight ? 'text-[#c5a059]' : 'text-white'}`}>
              {c.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Getting started / quick actions */}
      <Card title="Grow your presence" subtitle="The essentials of running your salon online.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Polish brand & hero', desc: 'Logo, hero image, colors and your story.', section: 'website' as SectionKey },
            { label: 'Refine your menu', desc: 'Keep services and prices irresistible.', section: 'services' as SectionKey },
            { label: 'Launch a campaign', desc: 'Let AI draft your next slow-hour promo.', section: 'marketing' as SectionKey },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.section)}
              className="text-left bg-[#0a0a0b] border border-[#2a2a2d] hover:border-[#c5a059]/40 rounded-lg p-4 transition group cursor-pointer"
            >
              <p className="text-sm font-bold text-white group-hover:text-[#c5a059] transition">{a.label}</p>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{a.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Recent bookings */}
      <Card
        title="Latest booking requests"
        subtitle="The five most recent reservations from your website."
        badge={stats.newBookings > 0 ? <Badge tone="gold">{stats.newBookings} new</Badge> : undefined}
      >
        {bookings.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">
            No bookings yet — once your site is live, requests will appear here in real time.
          </p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded px-4 py-3">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm text-white font-medium">{b.customerName}</p>
                  <p className="text-[11px] text-stone-500">{b.serviceName} · ₹{b.price.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-mono text-stone-400">{b.date} · {b.time}</p>
                  <Badge tone={b.status === 'new' ? 'gold' : b.status === 'confirmed' ? 'green' : b.status === 'cancelled' ? 'red' : 'stone'}>
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
            {bookings.length > 5 && (
              <GhostButton onClick={() => onNavigate('bookings')} className="w-full mt-2">
                View all {bookings.length} bookings
              </GhostButton>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

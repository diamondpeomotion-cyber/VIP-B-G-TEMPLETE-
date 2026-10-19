import React, { useCallback, useEffect, useState } from 'react';
import {
  Scissors, LayoutDashboard, Globe, Sparkles, Users, CalendarDays, Megaphone,
  Rocket, RefreshCw, LogOut, ExternalLink, Eye, Menu, X, ShieldCheck,
} from 'lucide-react';
import { Link, navigate } from '../../Root';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import type { Salon, SalonServiceItem, StaffMember, SiteBooking, SiteUrls, PlanInfo } from '../types';
import OverviewPanel from './OverviewPanel';
import WebsiteEditor from './WebsiteEditor';
import ServicesEditor from './ServicesEditor';
import StaffEditor from './StaffEditor';
import BookingsPanel from './BookingsPanel';
import MarketingPanel from './MarketingPanel';
import PublishPanel from './PublishPanel';

export interface DashboardData {
  salon: Salon;
  services: SalonServiceItem[];
  staff: StaffMember[];
  urls: SiteUrls;
  plan: PlanInfo;
  stats: { totalBookings: number; newBookings: number; upcomingBookings: number };
}

export type SectionKey =
  | 'overview'
  | 'website'
  | 'services'
  | 'staff'
  | 'bookings'
  | 'marketing'
  | 'publish';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { key: 'website', label: 'Website & Content', icon: <Globe size={15} /> },
  { key: 'services', label: 'Services & Prices', icon: <Sparkles size={15} /> },
  { key: 'staff', label: 'Team', icon: <Users size={15} /> },
  { key: 'bookings', label: 'Bookings', icon: <CalendarDays size={15} /> },
  { key: 'marketing', label: 'Marketing AI', icon: <Megaphone size={15} /> },
  { key: 'publish', label: 'Publish & Domain', icon: <Rocket size={15} /> },
];

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<SiteBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionKey>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.get<{ bookings: SiteBooking[] }>('/api/salon/mine/bookings');
      setBookings(res.bookings);
    } catch { /* owner guard will catch real problems on main load */ }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get<DashboardData>('/api/salon/mine');
      setData(res);
      await loadBookings();
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 401) {
        navigate('/auth');
      } else if (e.code === 'NO_SALON') {
        navigate('/onboarding');
      } else {
        showToast(e.message || 'Could not load your studio.');
      }
    } finally {
      setLoading(false);
    }
  }, [loadBookings, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    load();
  }, [authLoading, user, load]);

  const patchSalon = useCallback(
    (salon: Salon, urls?: SiteUrls) => {
      setData((d) => (d ? { ...d, salon, urls: urls || d.urls } : d));
    },
    []
  );

  const patchServices = useCallback((services: SalonServiceItem[]) => {
    setData((d) => (d ? { ...d, services } : d));
  }, []);

  const patchStaff = useCallback((staff: StaffMember[]) => {
    setData((d) => (d ? { ...d, staff } : d));
  }, []);

  if (authLoading || loading || !user || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4 text-[#e5e5e5]">
        <RefreshCw size={30} className="text-[#c5a059] animate-spin" />
        <p className="font-serif italic text-stone-500 text-sm">Preparing your studio…</p>
      </div>
    );
  }

  const { salon, services, staff, urls, stats } = data;
  const liveUrl = salon.published ? urls.subdomainUrl || urls.pathUrl : null;
  const previewUrl = `/s/${encodeURIComponent(salon.slug)}?preview=1`;

  const sectionActive = SECTIONS.find((s) => s.key === section)!;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans flex flex-col lg:flex-row">
      {/* ============================ SIDEBAR ============================ */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#121214] border-r border-[#2a2a2d] flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-[#2a2a2d]">
          <Link href="/" className="flex items-center gap-2">
            <span className="p-1.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
              <Scissors size={15} />
            </span>
            <span className="font-serif italic text-lg text-[#c5a059] tracking-tight">Nexora Studio</span>
          </Link>
          <p className="mt-3 text-[10px] uppercase tracking-widest font-mono text-stone-500 truncate">{salon.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-left text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                section === s.key
                  ? 'bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {s.icon}
              {s.label}
              {s.key === 'bookings' && stats.newBookings > 0 && (
                <span className="ml-auto bg-[#c5a059] text-black text-[9px] font-bold rounded-full px-1.5 py-0.5">
                  {stats.newBookings}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#2a2a2d] space-y-1">
          {user.role === 'super_admin' && (
            <Link
              href="/admin"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono uppercase tracking-wider text-[#c5a059] hover:bg-[#c5a059]/10 border border-[#c5a059]/20 transition"
            >
              <ShieldCheck size={15} /> Super Admin
            </Link>
          )}
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-[#c5a059] hover:bg-white/5 transition"
          >
            <Eye size={15} /> Preview draft
          </a>
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono uppercase tracking-wider text-emerald-400 hover:bg-white/5 transition"
            >
              <ExternalLink size={15} /> View live site
            </a>
          )}
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ============================ MAIN ============================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-[#2a2a2d] bg-[#0a0a0b]/85 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNav(true)}
              className="lg:hidden p-2 text-stone-400 hover:text-white transition cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif italic text-white text-lg truncate">{sectionActive.label}</h1>
                <span
                  className={`text-[9px] uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded border ${
                    salon.published
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {salon.published ? '● Live' : '○ Draft'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-stone-600 truncate">/s/{salon.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono font-bold text-stone-300 hover:text-white border border-[#2a2a2d] hover:border-stone-500 rounded px-3 py-2 transition"
            >
              <Eye size={13} /> <span className="hidden sm:inline">Preview</span>
            </a>
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono font-bold bg-[#c5a059] hover:bg-[#b08c49] text-black rounded px-3 py-2 transition"
              >
                <ExternalLink size={13} /> <span className="hidden sm:inline">Live site</span>
              </a>
            )}
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6 pb-24">
          {section === 'overview' && (
            <OverviewPanel
              data={{ salon, urls, stats, plan: data.plan, servicesCount: services.length, staffCount: staff.length }}
              bookings={bookings}
              onNavigate={(s) => setSection(s)}
            />
          )}
          {section === 'website' && (
            <WebsiteEditor salon={salon} onSaved={(s) => { patchSalon(s); showToast('Website content saved.'); }} onError={showToast} />
          )}
          {section === 'services' && (
            <ServicesEditor services={services} plan={data.plan} onSaved={(list) => { patchServices(list); showToast('Service menu saved.'); }} onError={showToast} />
          )}
          {section === 'staff' && (
            <StaffEditor staff={staff} plan={data.plan} onSaved={(list) => { patchStaff(list); showToast('Team saved.'); }} onError={showToast} />
          )}
          {section === 'bookings' && (
            <BookingsPanel bookings={bookings} onChanged={() => { loadBookings(); load(); }} />
          )}
          {section === 'marketing' && <MarketingPanel salon={salon} />}
          {section === 'publish' && (
            <PublishPanel
              salon={salon}
              urls={urls}
              onChanged={(s, u) => { patchSalon(s, u); showToast(s.published ? 'Your website is live!' : 'Website unpublished.'); }}
              onNavigate={(s) => setSection(s)}
            />
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] bg-[#1c1c1f] border border-[#c5a059]/40 text-stone-200 text-xs font-mono px-5 py-3 rounded-full shadow-2xl animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Mobile nav drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)}>
          <div className="w-72 max-w-[85vw] h-full bg-[#121214] border-r border-[#2a2a2d] flex flex-col animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#2a2a2d] flex items-center justify-between">
              <span className="font-serif italic text-lg text-[#c5a059]">Nexora Studio</span>
              <button onClick={() => setMobileNav(false)} className="p-1.5 text-stone-500 hover:text-white cursor-pointer" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {user.role === 'super_admin' && (
                <Link
                  href="/admin"
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-mono uppercase tracking-wider text-[#c5a059] border border-[#c5a059]/20 mb-2"
                >
                  <ShieldCheck size={15} /> Super Admin
                </Link>
              )}
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSection(s.key);
                    setMobileNav(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-left text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                    section === s.key
                      ? 'bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]'
                      : 'text-stone-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {s.icon}
                  {s.label}
                  {s.key === 'bookings' && stats.newBookings > 0 && (
                    <span className="ml-auto bg-[#c5a059] text-black text-[9px] font-bold rounded-full px-1.5 py-0.5">
                      {stats.newBookings}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-[#2a2a2d]">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-red-400 cursor-pointer"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

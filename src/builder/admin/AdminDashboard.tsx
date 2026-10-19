import React, { useEffect, useState } from 'react';
import { ShieldCheck, LayoutDashboard, Users, Store, Settings, RefreshCw, LogOut, ArrowLeft, Menu, X } from 'lucide-react';
import { Link, navigate } from '../../Root';
import { useAuth } from '../auth';
import { usePlatformConfig } from '../config';
import AdminOverview from './AdminOverview';
import UsersPanel from './UsersPanel';
import SalonsPanel from './SalonsPanel';
import SettingsPanel from './SettingsPanel';

type AdminSection = 'overview' | 'users' | 'salons' | 'settings';

const SECTIONS: Array<{ key: AdminSection; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { key: 'users', label: 'Users & Roles', icon: <Users size={15} /> },
  { key: 'salons', label: 'Salons & Sites', icon: <Store size={15} /> },
  { key: 'settings', label: 'Platform Settings', icon: <Settings size={15} /> },
];

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const { platformName } = usePlatformConfig();
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/auth');
    else if (user.role !== 'super_admin') navigate('/dashboard');
  }, [loading, user]);

  if (loading || !user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4 text-[#e5e5e5]">
        <ShieldCheck size={28} className="text-[#c5a059]" />
        <p className="font-serif italic text-stone-500 text-sm">Verifying admin clearance…</p>
      </div>
    );
  }

  const navItems = (
    <>
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => {
            setSection(s.key);
            setMobileNav(false);
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-left text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
            section === s.key
              ? 'bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]'
              : 'text-stone-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          {s.icon}
          {s.label}
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#121214] border-r border-[#2a2a2d] flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-[#2a2a2d]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
              <ShieldCheck size={15} />
            </span>
            <span className="font-serif italic text-lg text-[#c5a059] tracking-tight">Super Admin</span>
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-widest font-mono text-stone-500 truncate">{platformName}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">{navItems}</nav>
        <div className="p-3 border-t border-[#2a2a2d] space-y-1">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft size={15} /> My salon dashboard
          </Link>
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-[#2a2a2d] bg-[#0a0a0b]/85 backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileNav(true)} className="lg:hidden p-2 text-stone-400 hover:text-white transition cursor-pointer" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-serif italic text-white text-lg truncate">
                {SECTIONS.find((s) => s.key === section)?.label}
              </h1>
              <p className="text-[10px] font-mono text-stone-600 truncate">signed in as {user.email} · super admin</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 bg-[#121214] border border-[#2a2a2d] px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold">Platform live</span>
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6 pb-24">
          {section === 'overview' && <AdminOverview />}
          {section === 'users' && <UsersPanel me={user} onToast={showToast} />}
          {section === 'salons' && <SalonsPanel me={user} onToast={showToast} />}
          {section === 'settings' && <SettingsPanel onToast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] bg-[#1c1c1f] border border-[#c5a059]/40 text-stone-200 text-xs font-mono px-5 py-3 rounded-full shadow-2xl animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Mobile nav */}
      {mobileNav && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNav(false)}>
          <div className="w-72 max-w-[85vw] h-full bg-[#121214] border-r border-[#2a2a2d] flex flex-col animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#2a2a2d] flex items-center justify-between">
              <span className="font-serif italic text-lg text-[#c5a059] flex items-center gap-2">
                <ShieldCheck size={16} /> Super Admin
              </span>
              <button onClick={() => setMobileNav(false)} className="p-1.5 text-stone-500 hover:text-white cursor-pointer" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">{navItems}</nav>
            <div className="p-3 border-t border-[#2a2a2d] space-y-1">
              <Link
                href="/dashboard"
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-white transition"
              >
                <ArrowLeft size={15} /> My salon dashboard
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-red-400 transition cursor-pointer"
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

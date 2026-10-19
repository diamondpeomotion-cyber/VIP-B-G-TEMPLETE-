import React from 'react';
import {
  Scissors, Palette, Globe, CalendarDays, Sparkles, Users, ChevronRight,
  ArrowRight, MonitorSmartphone, Database, ShieldCheck, Eye,
} from 'lucide-react';
import { Link } from '../Root';
import { useAuth } from './auth';
import { HERO_IMAGES } from './curated';

const FEATURES = [
  {
    icon: <Palette size={20} />,
    title: 'Your brand, everywhere',
    desc: 'Salon name, logo, hero imagery, brand colors and every line of website copy — all yours, applied consistently across your site.',
  },
  {
    icon: <Globe size={20} />,
    title: 'A unique live address',
    desc: 'Publish to yourname.yourdomain.com or yourdomain.com/yourname. Your data stays fully isolated from every other salon.',
  },
  {
    icon: <Scissors size={20} />,
    title: 'Services & prices',
    desc: 'Build your own menu — categories, descriptions, durations and pricing — editable any time, live in seconds.',
  },
  {
    icon: <Users size={20} />,
    title: 'Showcase your team',
    desc: 'Add stylists and artists with photos, roles, specialties and bios so clients book their favorite professional.',
  },
  {
    icon: <CalendarDays size={20} />,
    title: 'Built-in online booking',
    desc: 'Visitors reserve appointments right on your site; requests land instantly in your owner dashboard.',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'AI style consultant',
    desc: 'Server-side Gemini AI recommends services from your actual menu and drafts your marketing campaigns.',
  },
  {
    icon: <MonitorSmartphone size={20} />,
    title: 'Flawless on every device',
    desc: 'Your website and dashboard are fully responsive — gorgeous on phones, tablets and desktop alike.',
  },
  {
    icon: <Database size={20} />,
    title: 'Real database, real isolation',
    desc: 'SQLite-backed persistence with tenant-scoped queries. No demo data — your content is the only content.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create your studio',
    desc: 'Sign up, name your salon and claim your unique web address in under a minute.',
  },
  {
    n: '02',
    title: 'Make it yours',
    desc: 'Upload your logo and hero, pick brand colors, add services, prices, staff and your story — with live preview.',
  },
  {
    n: '03',
    title: 'Publish & grow',
    desc: 'Flip the switch to go live. Share your link, receive bookings, and manage everything from your dashboard.',
  },
];

export default function LandingPage() {
  const { user, salon, loading } = useAuth();
  const dashHref = salon ? '/dashboard' : '/onboarding';

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans antialiased selection:bg-[#c5a059] selection:text-black">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/85 backdrop-blur-md border-b border-[#1c1c1f]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
              <Scissors size={16} />
            </span>
            <span className="font-serif italic text-xl text-[#c5a059] tracking-tight">Nexora Studio</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-5">
            <Link href="/demo" className="hidden sm:inline text-[11px] uppercase tracking-widest font-mono text-stone-400 hover:text-[#c5a059] transition">
              Product demo
            </Link>
            {!loading && user ? (
              <Link
                href={dashHref}
                className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-[11px] font-bold uppercase tracking-widest px-4 sm:px-5 py-2.5 rounded-sm transition inline-flex items-center gap-1.5"
              >
                My dashboard <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link href="/auth" className="text-[11px] uppercase tracking-widest font-mono text-stone-400 hover:text-white transition">
                  Sign in
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-[11px] font-bold uppercase tracking-widest px-4 sm:px-5 py-2.5 rounded-sm transition"
                >
                  Start free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGES[1].url} alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-[#0a0a0b]/80 to-[#0a0a0b]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-2 bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10px] uppercase tracking-[0.25em] font-mono font-bold px-4 py-2 rounded-full animate-fadeIn">
            <Sparkles size={12} />
            White-Label Salon Website Builder
          </span>

          <h1 className="mt-8 text-4xl sm:text-6xl md:text-7xl font-serif italic leading-[1.05] tracking-tight text-white">
            Your salon deserves<br />
            <span className="text-[#c5a059]">its own address on the web</span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Launch a luxurious, fully branded website for your salon — your name, your colors, your services,
            your team, your bookings. Publish it live on your own subdomain in minutes. No code, no demo data,
            just your salon.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={user ? dashHref : '/auth?mode=signup'}
              className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold uppercase tracking-widest px-9 py-4 rounded-sm transition shadow-2xl shadow-[#c5a059]/10 inline-flex items-center gap-2"
            >
              Build my website <ArrowRight size={15} />
            </Link>
            <Link
              href="/demo"
              className="border border-[#2a2a2d] hover:border-[#c5a059]/60 text-stone-300 hover:text-[#c5a059] text-xs font-bold uppercase tracking-widest px-9 py-4 rounded-sm transition inline-flex items-center gap-2"
            >
              <Eye size={15} /> Watch the live demo
            </Link>
          </div>

          <p className="mt-6 text-[11px] font-mono text-stone-600 tracking-wide">
            yourname.yourdomain.com · or · yourdomain.com/yourname
          </p>
        </div>
      </section>

      {/* ---------------- URL SHOWCASE ---------------- */}
      <section className="border-y border-[#1c1c1f] bg-[#0d0d0f]">
        <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="font-serif italic text-4xl text-[#c5a059]/40 shrink-0">{s.n}</span>
              <div>
                <h3 className="font-serif text-lg text-white mb-1.5">{s.title}</h3>
                <p className="text-[13px] text-stone-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[#c5a059]">Everything included</span>
          <h2 className="text-3xl sm:text-5xl font-serif italic text-white mt-4">
            One dashboard.<br className="sm:hidden" /> Your entire salon, online.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-[#121214] border border-[#2a2a2d] hover:border-[#c5a059]/40 rounded-lg p-6 transition-all duration-300"
            >
              <span className="inline-flex p-2.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/25 text-[#c5a059] mb-4 group-hover:scale-110 transition">
                {f.icon}
              </span>
              <h3 className="font-serif text-base text-white mb-2">{f.title}</h3>
              <p className="text-[13px] text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- ISOLATION / TRUST ---------------- */}
      <section className="border-y border-[#1c1c1f] bg-[#0d0d0f]">
        <div className="max-w-6xl mx-auto px-5 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[#c5a059]">Production-ready foundation</span>
            <h2 className="text-2xl sm:text-4xl font-serif italic text-white mt-3 mb-5">
              Every salon is an island —<br />by design, not by luck
            </h2>
            <ul className="space-y-3.5">
              {[
                'SQLite database with foreign-key tenant isolation — one salon can never read another’s data',
                'Scrypt-hashed owner passwords and HTTP-only session cookies',
                'Validated, sanitized inputs and rate-limited auth endpoints',
                'Preview before you publish; unpublish any time with one click',
                'Instant booking intake with owner dashboard for confirmations',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[13px] text-stone-400 leading-relaxed">
                  <ShieldCheck size={15} className="text-[#c5a059] shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#121214] border border-[#2a2a2d] rounded-lg p-6 sm:p-8 font-mono text-xs space-y-3 shadow-2xl">
            <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-4">// how a salon goes live</p>
            {[
              ['$ nexora signup', '› account created — session secured'],
              ['$ nexora name "Aria Glam Studio"', '› address reserved: /s/aria-glam-studio'],
              ['$ nexora customize --logo --colors --services --staff', '› 12 fields personalized · saved to DB'],
              ['$ nexora publish', '› ✔ live at aria-glam-studio.yourdomain.com'],
            ].map(([cmd, out]) => (
              <div key={cmd}>
                <p className="text-stone-300">{cmd}</p>
                <p className="text-[#c5a059] pl-3">{out}</p>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-[#1c1c1f] flex items-center gap-2 text-stone-600">
              <Database size={13} />
              <span>isolated tenant rows · zero demo data</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="max-w-4xl mx-auto px-5 py-24 text-center">
        <h2 className="text-3xl sm:text-5xl font-serif italic text-white leading-tight">
          The chair is yours.<br />The website should be too.
        </h2>
        <p className="mt-5 text-sm text-stone-500 max-w-lg mx-auto">
          Join the studios who greet their clients online with the same luxury they deliver in person.
        </p>
        <Link
          href={user ? dashHref : '/auth?mode=signup'}
          className="mt-9 inline-flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold uppercase tracking-widest px-10 py-4 rounded-sm transition shadow-2xl shadow-[#c5a059]/10"
        >
          Claim my address <ChevronRight size={15} />
        </Link>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-[#1c1c1f]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scissors size={14} className="text-[#c5a059]" />
            <span className="font-serif italic text-sm text-[#c5a059]">Nexora White-Label Studio</span>
          </div>
          <p className="text-[11px] font-mono text-stone-600">
            © {new Date().getFullYear()} Nexora Studio · Crafted for salon owners
          </p>
          <Link href="/demo" className="text-[11px] font-mono text-stone-500 hover:text-[#c5a059] transition">
            SalonOS product demo →
          </Link>
        </div>
      </footer>
    </div>
  );
}

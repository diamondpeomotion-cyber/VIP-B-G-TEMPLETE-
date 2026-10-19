import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Phone, Mail, Clock, Instagram, MessageCircle, Scissors, Sparkles,
  RefreshCw, Calendar, User as UserIcon, ChevronRight, CheckCircle2, X, Star,
} from 'lucide-react';
import { api, ApiError } from './api';
import type { SitePayload, SalonServiceItem, StaffMember, ConsultResult } from './types';
import { TIME_SLOTS, withAlpha } from './curated';
import { Link } from '../Root';

interface PublicSiteProps {
  slug?: string;
  previewToken?: boolean;
  draft?: SitePayload;
}

const rupiah = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function PublicSite({ slug, previewToken, draft }: PublicSiteProps) {
  const [data, setData] = useState<SitePayload | null>(draft || null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(!draft);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string>('');
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (draft) {
      setData(draft);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const payload = await api.get<SitePayload>(
          `/api/site/${encodeURIComponent(slug!)}${previewToken ? '?preview=1' : ''}`
        );
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) {
          const err = e as ApiError;
          setError({ message: err.message, code: err.code });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, previewToken, draft]);

  useEffect(() => {
    if (data?.salon?.name) {
      document.title = `${data.salon.name}${data.salon.city ? ` | ${data.salon.city}` : ''}`;
    }
    return () => {
      document.title = 'Nexora White-Label Salon Studio';
    };
  }, [data?.salon?.name, data?.salon?.city]);

  const openBooking = (serviceId?: string) => {
    setPreselectedService(serviceId || '');
    setBookingOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4 text-[#e5e5e5]">
        <RefreshCw size={36} className="text-[#c5a059] animate-spin" />
        <p className="font-serif italic text-stone-500 text-sm">Unrolling the red carpet…</p>
      </div>
    );
  }

  if (error || !data) {
    return <SiteError code={error?.code} message={error?.message} />;
  }

  return (
    <ThemedSite
      data={data}
      showPreviewBadge={!!data.preview || (!!draft && !!slug)}
      onBook={openBooking}
      onOpenAI={() => setAiOpen(true)}
    >
      {bookingOpen && (
        <BookingModal
          data={data}
          slug={data.salon.slug}
          serviceId={preselectedService}
          inline={!!draft}
          onClose={() => setBookingOpen(false)}
        />
      )}
      {aiOpen && <AIConsultModal data={data} onClose={() => setAiOpen(false)} onBook={openBooking} />}
    </ThemedSite>
  );
}

/* ------------------------------------------------------------------ */
/* Error / unpublished states                                          */
/* ------------------------------------------------------------------ */
function SiteError({ code, message }: { code?: string; message?: string }) {
  const unpublished = code === 'NOT_PUBLISHED';
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span className="p-3 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] mb-6">
          <Scissors size={28} />
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif italic text-white mb-3">
          {unpublished ? 'Something beautiful is being polished' : 'This address has no salon yet'}
        </h1>
        <p className="text-sm text-stone-500 max-w-md leading-relaxed">
          {unpublished
            ? 'The owner is putting the finishing touches on this website. Please check back soon.'
            : message || 'The salon website you are looking for does not exist at this address.'}
        </p>
        <Link
          href="/"
          className="mt-8 bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-sm transition"
        >
          Build your own salon website
        </Link>
      </div>
      <PoweredByFooter />
    </div>
  );
}

function PoweredByFooter() {
  return (
    <div className="py-5 text-center border-t border-[#1c1c1f]">
      <Link href="/" className="text-[10px] uppercase tracking-widest font-mono text-stone-600 hover:text-[#c5a059] transition">
        Powered by Nexora White-Label Studio
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The themed salon website                                            */
/* ------------------------------------------------------------------ */
function ThemedSite({
  data,
  showPreviewBadge,
  onBook,
  onOpenAI,
  children,
}: {
  data: SitePayload;
  showPreviewBadge: boolean;
  onBook: (serviceId?: string) => void;
  onOpenAI: () => void;
  children?: React.ReactNode;
}) {
  const { salon, services, staff } = data;
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const vars = useMemo(() => {
    const p = salon.primaryColor;
    const t = salon.textColor;
    return {
      '--wl-primary': p,
      '--wl-primary-soft': withAlpha(p, 0.12),
      '--wl-primary-border': withAlpha(p, 0.35),
      '--wl-bg': salon.bgColor,
      '--wl-surface': salon.surfaceColor,
      '--wl-text': t,
      '--wl-muted': withAlpha(t, 0.62),
      '--wl-faint': withAlpha(t, 0.4),
      '--wl-border': withAlpha(t, 0.12),
      '--wl-overlay': withAlpha(salon.bgColor, 0.78),
    } as React.CSSProperties;
  }, [salon.primaryColor, salon.bgColor, salon.surfaceColor, salon.textColor]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, SalonServiceItem[]>();
    for (const s of services) {
      const key = s.category || 'Our Services';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [services]);

  const initials = salon.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navLinks = [
    { href: '#services', label: 'Services' },
    ...(staff.length ? [{ href: '#team', label: 'Team' }] : []),
    ...(salon.about ? [{ href: '#about', label: 'About' }] : []),
    { href: '#visit', label: 'Visit Us' },
  ];

  return (
    <div style={vars} className="min-h-screen bg-[var(--wl-bg)] text-[var(--wl-text)] font-sans antialiased">
      {showPreviewBadge && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-[#c5a059] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl">
          Preview mode — draft changes
        </div>
      )}

      {/* ------------------------------ NAV ------------------------------ */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          navScrolled ? 'backdrop-blur-md border-b border-[var(--wl-border)]' : ''
        }`}
        style={navScrolled ? { background: 'var(--wl-overlay)' } : {}}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            {salon.logoUrl ? (
              <img src={salon.logoUrl} alt={salon.name} className="w-9 h-9 rounded-full object-cover border border-[var(--wl-border)]" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-[var(--wl-primary)] text-[var(--wl-bg)] font-serif italic font-bold flex items-center justify-center text-sm">
                {initials}
              </span>
            )}
            <span className="font-serif italic text-lg tracking-tight" style={{ color: 'var(--wl-text)' }}>
              {salon.name}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-[11px] uppercase tracking-widest font-mono text-[var(--wl-muted)] hover:text-[var(--wl-primary)] transition">
                {l.label}
              </a>
            ))}
            <button
              onClick={() => onBook()}
              className="bg-[var(--wl-primary)] text-[var(--wl-bg)] text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm hover:opacity-90 transition cursor-pointer"
            >
              Book Now
            </button>
          </nav>

          <button
            className="md:hidden p-2 text-[var(--wl-text)] cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : (
              <span className="space-y-1.5 block">
                <span className="block w-5 h-0.5 bg-current" />
                <span className="block w-5 h-0.5 bg-current" />
                <span className="block w-3.5 h-0.5 bg-current" />
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-[var(--wl-border)] px-5 py-4 space-y-1 backdrop-blur-md" style={{ background: 'var(--wl-overlay)' }}>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block text-xs uppercase tracking-widest font-mono text-[var(--wl-muted)] hover:text-[var(--wl-primary)] py-2.5 transition"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                onBook();
              }}
              className="w-full mt-2 bg-[var(--wl-primary)] text-[var(--wl-bg)] text-[11px] font-bold uppercase tracking-widest px-5 py-3 rounded-sm cursor-pointer"
            >
              Book Appointment
            </button>
          </nav>
        )}
      </header>

      {/* ------------------------------ HERO ------------------------------ */}
      <section id="top" className="relative min-h-[86vh] flex items-center overflow-hidden">
        {salon.heroImageUrl ? (
          <>
            <img
              src={salon.heroImageUrl}
              alt={salon.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(105deg, ${salon.bgColor} 8%, ${withAlpha(salon.bgColor, 0.72)} 45%, ${withAlpha(salon.bgColor, 0.35)} 100%)` }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse at 70% 20%, ${withAlpha(salon.primaryColor, 0.22)}, transparent 55%), var(--wl-bg)` }}
          />
        )}

        <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-16 w-full">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 bg-[var(--wl-primary-soft)] border border-[var(--wl-primary-border)] text-[var(--wl-primary)] text-[10px] uppercase tracking-[0.2em] font-mono font-bold px-3 py-1.5 rounded-full">
              <Star size={11} className="fill-current" />
              {salon.city ? `${salon.city}'s signature studio` : 'Signature studio'}
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif italic leading-[1.08] tracking-tight text-[var(--wl-text)]">
              {salon.tagline || `Welcome to ${salon.name}`}
            </h1>

            <p className="text-sm sm:text-base text-[var(--wl-muted)] leading-relaxed max-w-xl">
              {salon.about
                ? salon.about.split('\n')[0]
                : `Reserve bespoke grooming, styling and wellness rituals crafted by the team at ${salon.name}.`}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onBook()}
                className="bg-[var(--wl-primary)] text-[var(--wl-bg)] text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-sm hover:opacity-90 transition shadow-xl cursor-pointer"
              >
                Book Appointment
              </button>
              <a
                href="#services"
                className="border border-[var(--wl-border)] hover:border-[var(--wl-primary)] text-[var(--wl-text)] hover:text-[var(--wl-primary)] text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-sm transition backdrop-blur-sm"
              >
                Explore Services
              </a>
              <button
                onClick={onOpenAI}
                className="inline-flex items-center gap-2 text-[var(--wl-primary)] text-xs font-bold uppercase tracking-widest px-4 py-4 hover:opacity-80 transition cursor-pointer"
              >
                <Sparkles size={14} />
                Ask Style AI
              </button>
            </div>

            {(salon.openingHours || salon.phone) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-[11px] font-mono text-[var(--wl-muted)]">
                {salon.openingHours && (
                  <span className="inline-flex items-center gap-2">
                    <Clock size={13} className="text-[var(--wl-primary)]" />
                    {salon.openingHours}
                  </span>
                )}
                {salon.phone && (
                  <a href={`tel:${salon.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-2 hover:text-[var(--wl-primary)] transition">
                    <Phone size={13} className="text-[var(--wl-primary)]" />
                    {salon.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------- WELCOME OFFER ------------------------- */}
      {salon.welcomeOffer && (
        <section className="border-y border-[var(--wl-primary-border)] bg-[var(--wl-primary-soft)]">
          <div className="max-w-6xl mx-auto px-5 py-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
            <Sparkles size={15} className="text-[var(--wl-primary)]" />
            <p className="text-xs sm:text-sm font-mono font-bold tracking-wide" style={{ color: 'var(--wl-primary)' }}>
              {salon.welcomeOffer}
            </p>
          </div>
        </section>
      )}

      {/* ---------------------------- SERVICES ---------------------------- */}
      <section id="services" className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[var(--wl-primary)]">The Menu</span>
          <h2 className="text-3xl sm:text-4xl font-serif italic mt-3">Services & Pricing</h2>
          <p className="text-sm text-[var(--wl-muted)] mt-3 max-w-xl mx-auto">
            Transparent pricing, masterful hands. Choose your ritual and reserve a chair in seconds.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="text-center text-sm text-[var(--wl-faint)] italic font-serif">
            Our service menu is being curated — please check back soon.
          </p>
        ) : (
          <div className="space-y-12">
            {categories.map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-4 mb-5">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-mono font-bold text-[var(--wl-primary)] whitespace-nowrap">
                    {category}
                  </h3>
                  <span className="h-px flex-1 bg-[var(--wl-border)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((s) => (
                    <article
                      key={s.id}
                      className="group bg-[var(--wl-surface)] border border-[var(--wl-border)] hover:border-[var(--wl-primary-border)] rounded-lg p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-serif text-lg leading-snug" style={{ color: 'var(--wl-text)' }}>{s.name}</h4>
                          <div className="text-right shrink-0">
                            <p className="font-serif text-xl text-[var(--wl-primary)]">{rupiah(s.price)}</p>
                            <p className="text-[10px] font-mono text-[var(--wl-faint)]">{s.duration} min</p>
                          </div>
                        </div>
                        {s.description && (
                          <p className="text-[13px] text-[var(--wl-muted)] leading-relaxed mt-2">{s.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onBook(s.id)}
                        className="mt-4 self-start inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--wl-primary)] group-hover:gap-3 transition-all cursor-pointer"
                      >
                        Reserve <ChevronRight size={13} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------ TEAM ------------------------------ */}
      {staff.length > 0 && (
        <section id="team" className="border-y border-[var(--wl-border)]" style={{ background: withAlpha(salon.surfaceColor, 0.5) }}>
          <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[var(--wl-primary)]">The Artisans</span>
              <h2 className="text-3xl sm:text-4xl font-serif italic mt-3">Meet Our Team</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {staff.map((m) => (
                <TeamCard key={m.id} member={m} bgColor={salon.bgColor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------ ABOUT ------------------------------ */}
      {salon.about && (
        <section id="about" className="max-w-4xl mx-auto px-5 py-16 sm:py-24 text-center">
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[var(--wl-primary)]">Our Story</span>
          <h2 className="text-3xl sm:text-4xl font-serif italic mt-3 mb-8">About {salon.name}</h2>
          <div className="space-y-4">
            {salon.about.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm sm:text-base text-[var(--wl-muted)] leading-relaxed">{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------ VISIT ------------------------------ */}
      <section id="visit" className="border-t border-[var(--wl-border)]" style={{ background: withAlpha(salon.surfaceColor, 0.5) }}>
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[var(--wl-primary)]">Visit Us</span>
            <h2 className="text-3xl font-serif italic mt-3 mb-6">Find Your Chair</h2>
            <div className="space-y-4 text-sm">
              {salon.address && (
                <p className="flex items-start gap-3 text-[var(--wl-muted)]">
                  <MapPin size={16} className="text-[var(--wl-primary)] shrink-0 mt-0.5" />
                  <span>{salon.address}{salon.city ? `, ${salon.city}` : ''}</span>
                </p>
              )}
              {salon.openingHours && (
                <p className="flex items-start gap-3 text-[var(--wl-muted)]">
                  <Clock size={16} className="text-[var(--wl-primary)] shrink-0 mt-0.5" />
                  <span>{salon.openingHours}</span>
                </p>
              )}
              {salon.phone && (
                <a href={`tel:${salon.phone.replace(/[^+\d]/g, '')}`} className="flex items-start gap-3 text-[var(--wl-muted)] hover:text-[var(--wl-primary)] transition">
                  <Phone size={16} className="text-[var(--wl-primary)] shrink-0 mt-0.5" />
                  <span>{salon.phone}</span>
                </a>
              )}
              {salon.email && (
                <a href={`mailto:${salon.email}`} className="flex items-start gap-3 text-[var(--wl-muted)] hover:text-[var(--wl-primary)] transition">
                  <Mail size={16} className="text-[var(--wl-primary)] shrink-0 mt-0.5" />
                  <span>{salon.email}</span>
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-7">
              {salon.whatsapp && (
                <a
                  href={`https://wa.me/${salon.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--wl-border)] hover:border-[var(--wl-primary)] text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm text-[var(--wl-text)] hover:text-[var(--wl-primary)] transition"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {salon.instagram && (
                <a
                  href={salon.instagram.startsWith('http') ? salon.instagram : `https://instagram.com/${salon.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--wl-border)] hover:border-[var(--wl-primary)] text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm text-[var(--wl-text)] hover:text-[var(--wl-primary)] transition"
                >
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {salon.address && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(`${salon.address}${salon.city ? `, ${salon.city}` : ''}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--wl-border)] hover:border-[var(--wl-primary)] text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm text-[var(--wl-text)] hover:text-[var(--wl-primary)] transition"
                >
                  <MapPin size={14} /> Directions
                </a>
              )}
            </div>
          </div>

          <div className="bg-[var(--wl-surface)] border border-[var(--wl-border)] rounded-lg p-6 sm:p-8 flex flex-col justify-center items-start gap-4">
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[var(--wl-primary)]">Reserve in 30 seconds</span>
            <h3 className="text-2xl font-serif italic">Your chair is waiting</h3>
            <p className="text-sm text-[var(--wl-muted)] leading-relaxed">
              Pick a service, choose your time, and we will confirm your appointment. Pay at the salon — no advance needed.
            </p>
            <button
              onClick={() => onBook()}
              className="bg-[var(--wl-primary)] text-[var(--wl-bg)] text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-sm hover:opacity-90 transition cursor-pointer"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------ FOOTER ------------------------------ */}
      <footer className="border-t border-[var(--wl-border)]">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {salon.logoUrl ? (
              <img src={salon.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--wl-border)]" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-[var(--wl-primary)] text-[var(--wl-bg)] font-serif italic font-bold flex items-center justify-center text-xs">
                {initials}
              </span>
            )}
            <div>
              <p className="font-serif italic text-sm">{salon.name}</p>
              {salon.city && <p className="text-[10px] font-mono text-[var(--wl-faint)] uppercase tracking-widest">{salon.city}</p>}
            </div>
          </div>
          <p className="text-[11px] font-mono text-[var(--wl-faint)]">
            © {new Date().getFullYear()} {salon.name}. All rights reserved.
          </p>
        </div>
        <PoweredByFooter />
      </footer>

      {children}
    </div>
  );
}

function TeamCard({ member, bgColor }: { member: StaffMember; bgColor: string; key?: string }) {
  const initials = member.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <article className="group bg-[var(--wl-surface)] border border-[var(--wl-border)] hover:border-[var(--wl-primary-border)] rounded-lg overflow-hidden transition-all duration-300">
      <div className="aspect-square relative overflow-hidden">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-serif italic text-4xl text-[var(--wl-primary)]"
            style={{ background: `linear-gradient(135deg, ${withAlpha(bgColor, 1)}, var(--wl-surface))` }}
          >
            {initials}
          </div>
        )}
        <span className="absolute top-3 left-3 bg-[var(--wl-overlay)] backdrop-blur text-[var(--wl-primary)] text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded">
          {member.role}
        </span>
      </div>
      <div className="p-4">
        <h4 className="font-serif text-base">{member.name}</h4>
        {member.specialties.length > 0 && (
          <p className="text-[10px] font-mono text-[var(--wl-primary)] mt-1 uppercase tracking-wide">
            {member.specialties.slice(0, 3).join(' • ')}
          </p>
        )}
        {member.bio && (
          <p className="text-xs text-[var(--wl-muted)] leading-relaxed mt-2 line-clamp-3">{member.bio}</p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Booking modal                                                       */
/* ------------------------------------------------------------------ */
function BookingModal({
  data,
  slug,
  serviceId,
  inline,
  onClose,
}: {
  data: SitePayload;
  slug: string;
  serviceId: string;
  inline: boolean;
  onClose: () => void;
}) {
  const { salon, services, staff } = data;
  const [selService, setSelService] = useState(serviceId || services[0]?.id || '');
  const [selStaff, setSelStaff] = useState('any');
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState('11:00');
  const [name, setName] = useState('');
  const [email, setEmailField] = useState('');
  const [phone, setPhoneField] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);

  const service = services.find((s) => s.id === selService);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (inline) {
      // Draft preview (wizard) — simulate, never write to the database.
      setConfirmation({ id: 'preview' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ booking: { id: string } }>(`/api/site/${encodeURIComponent(slug)}/bookings`, {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        serviceId: selService,
        staffId: selStaff,
        date,
        time,
        notes,
      });
      setConfirmation({ id: res.booking.id });
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const modalInput =
    'w-full bg-black/30 text-sm border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[var(--wl-primary,#c5a059)] transition placeholder:text-stone-600';
  const modalLabel = 'text-[10px] uppercase tracking-wider text-stone-500 font-mono font-bold block mb-1.5';

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-[#121214] border border-[#2a2a2d] w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2d] sticky top-0 bg-[#121214] z-10">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-[#c5a059]">{salon.name}</p>
            <h3 className="font-serif italic text-white text-xl">
              {confirmation ? 'Reservation received' : 'Book your appointment'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {confirmation ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 size={52} className="text-emerald-400 mx-auto" />
            <h4 className="font-serif italic text-white text-lg">
              {inline ? 'This is how booking feels' : 'See you soon!'}
            </h4>
            <p className="text-sm text-stone-400 leading-relaxed">
              {inline
                ? 'In the live version, your customers complete their reservation right here and it lands instantly in your dashboard.'
                : `${salon.name} has received your request${service ? ` for “${service.name}”` : ''} on ${date} at ${time}. They will confirm shortly via ${email ? 'email' : 'phone'}.`}
            </p>
            {!inline && confirmation.id !== 'preview' && (
              <p className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">
                Reference: {confirmation.id}
              </p>
            )}
            <button
              onClick={onClose}
              className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-sm transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className={modalLabel}>Service</label>
              <select value={selService} onChange={(e) => setSelService(e.target.value)} className={modalInput} required>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {rupiah(s.price)} · {s.duration} min
                  </option>
                ))}
              </select>
            </div>

            {staff.length > 0 && (
              <div>
                <label className={modalLabel}>Preferred professional</label>
                <select value={selStaff} onChange={(e) => setSelStaff(e.target.value)} className={modalInput}>
                  <option value="any">First available</option>
                  {staff.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={modalLabel}>Date</label>
                <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className={modalInput} />
              </div>
              <div>
                <label className={modalLabel}>Time</label>
                <select value={time} onChange={(e) => setTime(e.target.value)} className={modalInput} required>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={modalLabel}>Your name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={modalInput} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={modalLabel}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmailField(e.target.value)} placeholder="you@example.com" className={modalInput} />
              </div>
              <div>
                <label className={modalLabel}>Phone / WhatsApp</label>
                <input type="tel" value={phone} onChange={(e) => setPhoneField(e.target.value)} placeholder="+91 …" className={modalInput} />
              </div>
            </div>

            <div>
              <label className={modalLabel}>Notes for the stylist (optional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, preferences, occasion…" className={`${modalInput} resize-none`} />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{errorMsg}</p>
            )}

            {service && (
              <div className="flex items-center justify-between bg-black/30 border border-[#2a2a2d] rounded px-4 py-3">
                <span className="text-xs font-mono text-stone-400 uppercase tracking-wide">{service.name}</span>
                <span className="font-serif text-lg text-[#c5a059]">{rupiah(service.price)}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-widest py-4 rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
              {submitting ? 'Reserving your chair…' : 'Confirm reservation'}
            </button>
            <p className="text-center text-[10px] font-mono text-stone-600">Pay at the salon · Free cancellation on request</p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI consultant modal                                                 */
/* ------------------------------------------------------------------ */
function AIConsultModal({
  data,
  onClose,
  onBook,
}: {
  data: SitePayload;
  onClose: () => void;
  onBook: (serviceId?: string) => void;
}) {
  const { salon, services } = data;
  const [hairTexture, setHairTexture] = useState('Wavy / Textured');
  const [facialShape, setFacialShape] = useState('Oval');
  const [styleGoals, setStyleGoals] = useState('');
  const [lengthPreference, setLengthPreference] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsultResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const modalInput =
    'w-full bg-black/30 text-sm border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition placeholder:text-stone-600';
  const modalLabel = 'text-[10px] uppercase tracking-wider text-stone-500 font-mono font-bold block mb-1.5';

  const consult = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post<ConsultResult>('/api/ai/consult', {
        hairTexture,
        facialShape,
        styleGoals: styleGoals || 'A fresh, confident new look',
        lengthPreference,
        salonName: salon.name,
        servicesCtx: services.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category })),
      });
      setResult(res);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-[#121214] border border-[#2a2a2d] w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2d] sticky top-0 bg-[#121214] z-10">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-[#c5a059] flex items-center gap-1.5">
              <Sparkles size={11} /> Style AI · {salon.name}
            </p>
            <h3 className="font-serif italic text-white text-xl">Personal style diagnostics</h3>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={modalLabel}>Hair texture</label>
              <select value={hairTexture} onChange={(e) => setHairTexture(e.target.value)} className={modalInput}>
                <option>Straight / Fine</option>
                <option>Wavy / Textured</option>
                <option>Curly / Thick</option>
                <option>Coily / Voluptuous</option>
              </select>
            </div>
            <div>
              <label className={modalLabel}>Face shape</label>
              <select value={facialShape} onChange={(e) => setFacialShape(e.target.value)} className={modalInput}>
                <option>Oval</option>
                <option>Round</option>
                <option>Square</option>
                <option>Heart</option>
                <option>Long</option>
              </select>
            </div>
            <div>
              <label className={modalLabel}>Length preference</label>
              <select value={lengthPreference} onChange={(e) => setLengthPreference(e.target.value)} className={modalInput}>
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
                <option>No preference</option>
              </select>
            </div>
            <div>
              <label className={modalLabel}>Your style goal</label>
              <input
                value={styleGoals}
                onChange={(e) => setStyleGoals(e.target.value)}
                placeholder="e.g. Low-maintenance glam for a wedding"
                className={modalInput}
              />
            </div>
          </div>

          <button
            onClick={consult}
            disabled={loading}
            className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Analysing your features…' : 'Get my style blueprint'}
          </button>

          {errorMsg && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{errorMsg}</p>}

          {result && (
            <div className="space-y-4 pt-2 border-t border-[#2a2a2d]">
              <p className="text-xs text-stone-400 leading-relaxed italic">{result.overallAdvice}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.styles.map((st, i) => {
                  const matched = services.find((s) => s.id === st.matchedServiceId);
                  return (
                    <div key={i} className="bg-black/30 border border-[#2a2a2d] rounded-lg p-4 space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#c5a059]">Suggestion {i + 1}</span>
                      <h5 className="font-serif text-white text-base leading-snug">{st.name}</h5>
                      <p className="text-xs text-stone-400 leading-relaxed">{st.description}</p>
                      <p className="text-[11px] text-stone-500 italic leading-relaxed">{st.reasoning}</p>
                      {matched && (
                        <button
                          onClick={() => {
                            onClose();
                            onBook(matched.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#c5a059] hover:gap-3 transition-all cursor-pointer"
                        >
                          <UserIcon size={12} /> Book “{matched.name}” — {rupiah(matched.price)} <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

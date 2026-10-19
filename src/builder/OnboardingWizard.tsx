import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Scissors, Check, X, RefreshCw, ChevronLeft, ChevronRight, Eye, Rocket,
  Palette, Type, Users, MapPin, Sparkles, Globe, Plus, Trash2, PartyPopper,
  Image as ImageIcon, ArrowLeft, Store,
} from 'lucide-react';
import { Link, navigate } from '../Root';
import { api, ApiError } from './api';
import { useAuth } from './auth';
import { Field, TextField, TextArea, SelectField, ColorField, PrimaryButton, GhostButton, Badge, Toggle } from './fields';
import ImageUrlField from './ImageUrlField';
import PublicSite from './PublicSite';
import {
  HERO_IMAGES, STAFF_PHOTOS, COLOR_PRESETS, SALON_CATEGORIES, SERVICE_CATEGORIES,
  SERVICE_IDEAS, slugifySuggestion,
} from './curated';
import type { Salon, SalonServiceItem, StaffMember, SitePayload, SiteUrls, ChecklistItem } from './types';

/* ------------------------------------------------------------------------ */
/* Types                                                                     */
/* ------------------------------------------------------------------------ */
interface DraftSalon {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  logoUrl: string;
  heroImageUrl: string;
  about: string;
  welcomeOffer: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  openingHours: string;
  primaryColor: string;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
}

type DraftService = SalonServiceItem;
type DraftStaff = StaffMember;

const STEPS = [
  { id: 1, label: 'Basics', icon: <Store size={13} /> },
  { id: 2, label: 'Brand & Content', icon: <Type size={13} /> },
  { id: 3, label: 'Colors', icon: <Palette size={13} /> },
  { id: 4, label: 'Services', icon: <Sparkles size={13} /> },
  { id: 5, label: 'Team', icon: <Users size={13} /> },
  { id: 6, label: 'Contact', icon: <MapPin size={13} /> },
  { id: 7, label: 'Publish', icon: <Rocket size={13} /> },
];

const getDraftFromSalon = (s: Salon): DraftSalon => ({
  slug: s.slug,
  name: s.name,
  tagline: s.tagline,
  category: s.category,
  logoUrl: s.logoUrl,
  heroImageUrl: s.heroImageUrl,
  about: s.about,
  welcomeOffer: s.welcomeOffer,
  address: s.address,
  city: s.city,
  phone: s.phone,
  email: s.email,
  whatsapp: s.whatsapp,
  instagram: s.instagram,
  openingHours: s.openingHours,
  primaryColor: s.primaryColor,
  bgColor: s.bgColor,
  surfaceColor: s.surfaceColor,
  textColor: s.textColor,
});

const blankDraft: DraftSalon = {
  slug: '',
  name: '',
  tagline: '',
  category: 'BEAUTY',
  logoUrl: '',
  heroImageUrl: '',
  about: '',
  welcomeOffer: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  whatsapp: '',
  instagram: '',
  openingHours: 'Mon – Sun · 10:00 AM – 8:00 PM',
  primaryColor: '#c5a059',
  bgColor: '#0a0a0b',
  surfaceColor: '#121214',
  textColor: '#e5e5e5',
};

/* ------------------------------------------------------------------------ */
/* Wizard                                                                    */
/* ------------------------------------------------------------------------ */
export default function OnboardingWizard() {
  const { user, salon: authSalon, loading: authLoading, refresh } = useAuth();
  const [step, setStep] = useState(0); // 0 = welcome
  const [draft, setDraft] = useState<DraftSalon>(blankDraft);
  const [services, setServices] = useState<DraftService[]>([]);
  const [staff, setStaff] = useState<DraftStaff[]>([]);
  const [createdSalon, setCreatedSalon] = useState<Salon | null>(null);
  const [urls, setUrls] = useState<SiteUrls | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Slug availability state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugEditedManually = useRef(false);

  /* ---- guards & resume ---- */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    if (initialized) return;
    setInitialized(true);

    if (authSalon) {
      // Resume an existing salon draft.
      (async () => {
        try {
          const data = await api.get<{
            salon: Salon;
            services: SalonServiceItem[];
            staff: StaffMember[];
            urls: SiteUrls;
          }>('/api/salon/mine');
          setDraft(getDraftFromSalon(data.salon));
          setServices(data.services);
          setStaff(data.staff);
          setCreatedSalon(data.salon);
          setUrls(data.urls);
          setPublished(data.salon.published);
          slugEditedManually.current = true;
          const resumeStep = Math.min(Math.max(data.salon.onboardingStep || 2, 2), 7);
          setStep(data.salon.published ? 7 : resumeStep);
        } catch {
          /* fall through to fresh wizard */
        }
      })();
    }
  }, [authLoading, user, authSalon, initialized]);

  /* ---- slug suggestion & availability ---- */
  useEffect(() => {
    if (!slugEditedManually.current && !createdSalon) {
      setDraft((d) => ({ ...d, slug: slugifySuggestion(d.name) }));
    }
  }, [draft.name, createdSalon]);

  useEffect(() => {
    const slug = draft.slug;
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      setSlugMessage(slug && slug.length > 0 ? 'At least 3 characters.' : '');
      return;
    }
    if (slugTimer.current) clearTimeout(slugTimer.current);
    setSlugStatus('checking');
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; error?: string }>(
          `/api/slug-availability?slug=${encodeURIComponent(slug)}`
        );
        if (res.error) {
          setSlugStatus('invalid');
          setSlugMessage(res.error);
        } else if (res.available) {
          setSlugStatus('available');
          setSlugMessage('');
        } else {
          setSlugStatus('taken');
          setSlugMessage('This address is already taken.');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.slug]);

  const previewPayload: SitePayload = useMemo(
    () => ({
      salon: {
        ...(createdSalon || {}),
        ...draft,
        id: createdSalon?.id || 'draft',
        onboardingStep: step,
        published: false,
        createdAt: '',
        updatedAt: '',
      } as Salon,
      services,
      staff,
      preview: true,
    }),
    [createdSalon, draft, services, staff, step]
  );

  /* ---- step persistence ---- */
  const ensureSalonCreated = async (): Promise<Salon> => {
    if (createdSalon) return createdSalon;
    const res = await api.post<{ salon: Salon; urls: SiteUrls; error?: string }>('/api/salon', {
      name: draft.name,
      slug: draft.slug,
      tagline: draft.tagline,
      category: draft.category,
    });
    setCreatedSalon(res.salon);
    setUrls(res.urls);
    return res.salon;
  };

  const saveStep = async (currentStep: number): Promise<boolean> => {
    setError('');
    setBusy(true);
    try {
      if (currentStep === 1) {
        await ensureSalonCreated();
      } else if (createdSalon) {
        if (currentStep === 4) {
          await api.put('/api/salon/mine/services', { services });
        } else if (currentStep === 5) {
          await api.put('/api/salon/mine/staff', { staff });
        }
        const patch: Record<string, unknown> = { onboardingStep: Math.min(currentStep + 1, 7) };
        if (currentStep === 2) {
          Object.assign(patch, {
            logoUrl: draft.logoUrl,
            heroImageUrl: draft.heroImageUrl,
            about: draft.about,
            welcomeOffer: draft.welcomeOffer,
            tagline: draft.tagline,
          });
        }
        if (currentStep === 3) {
          Object.assign(patch, {
            primaryColor: draft.primaryColor,
            bgColor: draft.bgColor,
            surfaceColor: draft.surfaceColor,
            textColor: draft.textColor,
          });
        }
        if (currentStep === 6) {
          Object.assign(patch, {
            address: draft.address,
            city: draft.city,
            phone: draft.phone,
            email: draft.email,
            whatsapp: draft.whatsapp,
            instagram: draft.instagram,
            openingHours: draft.openingHours,
          });
        }
        const res = await api.put<{ salon: Salon; urls: SiteUrls }>('/api/salon/mine', patch);
        setCreatedSalon(res.salon);
        setUrls(res.urls);
      }
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const canNext = (): { ok: boolean; message: string } => {
    if (step === 1) {
      if (draft.name.trim().length < 2) return { ok: false, message: 'Please enter your salon name.' };
      if (slugStatus === 'checking') return { ok: false, message: 'Checking address availability…' };
      if (slugStatus !== 'available') return { ok: false, message: slugMessage || 'Please choose an available address.' };
    }
    if (step === 3) {
      const hexOk = [draft.primaryColor, draft.bgColor, draft.surfaceColor, draft.textColor].every((c) =>
        /^#[0-9a-fA-F]{6}$/.test(c)
      );
      if (!hexOk) return { ok: false, message: 'Colors must be 6-digit hex values (e.g. #c5a059).' };
    }
    if (step === 4 && services.length === 0) {
      return { ok: false, message: 'Add at least one service — your visitors need a menu to book from.' };
    }
    if (step === 4 && services.some((s) => !s.name.trim())) {
      return { ok: false, message: 'Every service needs a name.' };
    }
    if (step === 5 && staff.some((s) => !s.name.trim())) {
      return { ok: false, message: 'Every team member needs a name.' };
    }
    if (step === 6 && !draft.phone.trim() && !draft.email.trim()) {
      return { ok: false, message: 'Add a phone number or email so customers can reach you.' };
    }
    return { ok: true, message: '' };
  };

  const goNext = async () => {
    const gate = canNext();
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    const saved = await saveStep(step);
    if (!saved) return;
    setError('');
    if (step === 2 || step === 4 || step === 5 || step === 6) {
      api.get<{ checklist: ChecklistItem[] }>('/api/salon/mine/checklist').then((r) => setChecklist(r.checklist)).catch(() => {});
    }
    setStep((s) => Math.min(s + 1, 7));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const doPublish = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post<{ salon: Salon; urls: SiteUrls; checklist: ChecklistItem[] }>('/api/salon/mine/publish');
      setCreatedSalon(res.salon);
      setUrls(res.urls);
      setChecklist(res.checklist);
      setPublished(true);
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      if (e.payload?.checklist) setChecklist(e.payload.checklist);
    } finally {
      setBusy(false);
    }
  };

  /* ---- loading / redirect states ---- */
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <RefreshCw size={30} className="text-[#c5a059] animate-spin" />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Welcome screen                                                      */
  /* ------------------------------------------------------------------ */
  if (step === 0) {
    return (
      <WizardShell showPreview={false}>
        <div className="text-center max-w-lg mx-auto py-10">
          <PartyPopper size={44} className="text-[#c5a059] mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-serif italic text-white leading-tight">
            Welcome aboard, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-stone-400 mt-4 leading-relaxed">
            In the next few minutes, we'll craft your salon's website together — its name, address, branding,
            services, team and story. You can preview everything before the world sees it.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-8 text-left">
            {[
              ['6 guided steps', 'Each saved automatically'],
              ['Live preview', 'See changes instantly'],
              ['One-click publish', 'Your own unique URL'],
            ].map(([t, d]) => (
              <div key={t} className="bg-[#0a0a0b] border border-[#2a2a2d] rounded p-3">
                <p className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wide">{t}</p>
                <p className="text-[10px] text-stone-500 mt-1 font-mono">{d}</p>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => setStep(1)} className="mt-10 px-10 py-4">
            Begin setup <ChevronRight size={14} />
          </PrimaryButton>
        </div>
      </WizardShell>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Success screen after publish                                        */
  /* ------------------------------------------------------------------ */
  if (step === 7 && published) {
    const liveUrl = urls?.subdomainUrl || urls?.pathUrl || `/s/${draft.slug}`;
    return (
      <WizardShell showPreview={false}>
        <div className="text-center max-w-lg mx-auto py-10">
          <span className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-6">
            <Globe size={36} />
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif italic text-white">You're live!</h1>
          <p className="text-sm text-stone-400 mt-3 leading-relaxed">
            <strong className="text-white">{draft.name}</strong> is now broadcasting to the world.
            Share your address and start taking bookings.
          </p>

          <div className="mt-7 bg-[#0a0a0b] border border-[#c5a059]/30 rounded-lg p-5 space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-mono text-stone-500">Your live address</p>
            <a href={liveUrl} target="_blank" rel="noreferrer" className="block font-mono text-sm text-[#c5a059] hover:underline break-all">
              {liveUrl}
            </a>
            {urls?.subdomainUrl && (
              <a href={urls.pathUrl} target="_blank" rel="noreferrer" className="block font-mono text-xs text-stone-500 hover:text-stone-300 break-all">
                {urls.pathUrl}
              </a>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold uppercase tracking-widest px-7 py-3.5 rounded-sm transition inline-flex items-center gap-2"
            >
              <Eye size={14} /> Visit my website
            </a>
            <PrimaryButton onClick={() => navigate('/dashboard')}>
              Go to dashboard <ChevronRight size={14} />
            </PrimaryButton>
          </div>
        </div>
      </WizardShell>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Wizard steps                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <WizardShell
      showPreview
      onPreview={() => setPreviewOpen(true)}
      footer={
        <>
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <GhostButton onClick={goBack} disabled={busy}>
                <ChevronLeft size={14} /> Back
              </GhostButton>
            ) : (
              <GhostButton onClick={() => setStep(0)} disabled={busy}>
                <ArrowLeft size={14} /> Intro
              </GhostButton>
            )}
            {createdSalon && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-[10px] uppercase tracking-widest font-mono text-stone-500 hover:text-white transition cursor-pointer"
              >
                Save & exit
              </button>
            )}
          </div>

          {step < 7 ? (
            <PrimaryButton onClick={goNext} disabled={busy}>
              {busy ? <RefreshCw size={14} className="animate-spin" /> : null}
              {step === 1 ? 'Create my studio' : 'Save & continue'} <ChevronRight size={14} />
            </PrimaryButton>
          ) : (
            <div />
          )}
        </>
      }
    >
      {/* Step indicator */}
      <ol className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 -mx-1 px-1">
        {STEPS.map((s) => (
          <li key={s.id} className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                if (createdSalon && s.id < step) setStep(s.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                s.id === step
                  ? 'bg-[#c5a059] text-black'
                  : s.id < step
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-stone-600 border border-transparent'
              } ${!createdSalon && s.id > 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {s.id < step ? <Check size={12} /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {s.id < STEPS.length && <span className="w-3 h-px bg-[#2a2a2d] mx-0.5" />}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-4 py-3 animate-fadeIn">
          {error}
        </p>
      )}

      {/* ---------------- STEP 1 — Basics ---------------- */}
      {step === 1 && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Let's name your studio" subtitle="This becomes your salon's identity — on the website and in its unique web address." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Salon / website name" hint="Shown across your entire website">
              <TextField
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Aria Glam Studio"
                autoFocus
              />
            </Field>
            <Field label="Salon type">
              <SelectField value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
                {SALON_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </SelectField>
            </Field>
          </div>

          <Field label="Tagline" hint="One elegant line under your name on the hero">
            <TextField
              value={draft.tagline}
              onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
              placeholder="e.g. Where every visit feels like a ritual"
            />
          </Field>

          <div>
            <Field label="Your unique web address" hint="Visitors reach you here — choose carefully, it's yours">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 font-mono text-xs select-none">
                  /s/
                </span>
                <TextField
                  value={draft.slug}
                  onChange={(e) => {
                    slugEditedManually.current = true;
                    setDraft((d) => ({ ...d, slug: slugifySuggestion(e.target.value) }));
                  }}
                  placeholder="aria-glam-studio"
                  className="pl-9 pr-10 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === 'checking' && <RefreshCw size={14} className="text-stone-500 animate-spin" />}
                  {slugStatus === 'available' && <Check size={16} className="text-emerald-400" />}
                  {(slugStatus === 'taken' || slugStatus === 'invalid') && <X size={16} className="text-red-400" />}
                </span>
              </div>
            </Field>
            {slugStatus === 'available' && draft.slug && (
              <p className="text-[11px] font-mono text-emerald-400 mt-2 flex items-center gap-1.5">
                <Globe size={12} /> {draft.slug}.yourdomain.com is available
              </p>
            )}
            {(slugStatus === 'taken' || slugStatus === 'invalid') && (
              <p className="text-[11px] text-red-400 mt-2">{slugMessage}</p>
            )}
          </div>
        </section>
      )}

      {/* ---------------- STEP 2 — Brand & content ---------------- */}
      {step === 2 && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Make it unmistakably yours" subtitle="Your logo, hero image and story. All optional — but they make visitors fall in love." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <ImageUrlField
              label="Logo"
              hint="Square works best — or leave empty for an elegant monogram"
              value={draft.logoUrl}
              onChange={(v) => setDraft((d) => ({ ...d, logoUrl: v }))}
              aspect="square"
              placeholder="https://…/logo.png"
              clearLabel="Use monogram instead"
            />
            <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded p-4 flex items-center gap-4">
              <span className="w-14 h-14 rounded-full bg-[#c5a059] text-black font-serif italic font-bold text-xl flex items-center justify-center shrink-0">
                {(draft.name || 'A').trim()[0]?.toUpperCase() || 'A'}
              </span>
              <div>
                <p className="text-xs font-bold text-white">Monogram fallback</p>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  No logo yet? We'll render a beautiful monogram from your salon's initials automatically.
                </p>
              </div>
            </div>
          </div>

          <ImageUrlField
            label="Hero image"
            hint="The big, cinematic photo at the top of your website"
            value={draft.heroImageUrl}
            onChange={(v) => setDraft((d) => ({ ...d, heroImageUrl: v }))}
            gallery={HERO_IMAGES}
            galleryTitle="Pick a cinematic hero for your salon"
          />

          <Field label="Welcome offer banner (optional)" hint="A slim gold banner above your services — great for promos">
            <TextField
              value={draft.welcomeOffer}
              onChange={(e) => setDraft((d) => ({ ...d, welcomeOffer: e.target.value }))}
              placeholder="e.g. Grand opening — 20% off all hair spas this month"
            />
          </Field>

          <Field label="About your salon" hint="Your story, your vibe — one paragraph per line">
            <TextArea
              value={draft.about}
              onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
              placeholder={'We believe a salon visit should feel like a ritual…\nFounded in 2019, our artists have styled over 4,000 guests.'}
            />
          </Field>
        </section>
      )}

      {/* ---------------- STEP 3 — Colors ---------------- */}
      {step === 3 && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Dress your website in your colors" subtitle="Start from a curated palette, then fine-tune every shade. Preview updates live." />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_PRESETS.map((p) => {
              const active = draft.primaryColor === p.primary && draft.bgColor === p.bg;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, primaryColor: p.primary, bgColor: p.bg, surfaceColor: p.surface, textColor: p.text }))
                  }
                  className={`text-left border rounded-lg p-3 transition cursor-pointer ${
                    active ? 'border-[#c5a059] bg-[#c5a059]/5' : 'border-[#2a2a2d] hover:border-stone-600 bg-[#0a0a0b]'
                  }`}
                >
                  <span className="flex gap-1 mb-2">
                    {[p.primary, p.bg, p.surface, p.text].map((c) => (
                      <span key={c} className="w-5 h-5 rounded-sm border border-white/10" style={{ background: c }} />
                    ))}
                  </span>
                  <p className="text-[11px] font-bold text-stone-200">{p.name}</p>
                  {active && <p className="text-[9px] font-mono text-[#c5a059] uppercase tracking-widest mt-0.5">Selected</p>}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ColorField label="Brand accent" hint="Buttons, highlights, prices" value={draft.primaryColor} onChange={(v) => setDraft((d) => ({ ...d, primaryColor: v }))} />
            <ColorField label="Page background" value={draft.bgColor} onChange={(v) => setDraft((d) => ({ ...d, bgColor: v }))} />
            <ColorField label="Card surfaces" value={draft.surfaceColor} onChange={(v) => setDraft((d) => ({ ...d, surfaceColor: v }))} />
            <ColorField label="Text color" value={draft.textColor} onChange={(v) => setDraft((d) => ({ ...d, textColor: v }))} />
          </div>

          <p className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
            <Eye size={13} className="text-[#c5a059]" /> Hit “Preview” in the top bar to see your site in these colors.
          </p>
        </section>
      )}

      {/* ---------------- STEP 4 — Services ---------------- */}
      {step === 4 && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Build your service menu" subtitle="These appear on your website with prices and power the booking form." />
          <ServiceListEditor services={services} onChange={setServices} showIdeas />
        </section>
      )}

      {/* ---------------- STEP 5 — Staff ---------------- */}
      {step === 5 && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Introduce your team" subtitle="Optional, but clients love choosing their artist. Skip empty rows." />
          <StaffListEditor staff={staff} onChange={setStaff} />
        </section>
      )}

      {/* ---------------- STEP 6 — Contact ---------------- */}
      {step === 6 && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Where can clients find you?" subtitle="This powers the Visit Us section, map directions and call buttons." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Street address" className="sm:col-span-2">
              <TextField value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} placeholder="Shop 4, Pearl Plaza, Main Road" />
            </Field>
            <Field label="City">
              <TextField value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} placeholder="Jaipur" />
            </Field>
            <Field label="Opening hours">
              <TextField value={draft.openingHours} onChange={(e) => setDraft((d) => ({ ...d, openingHours: e.target.value }))} placeholder="Mon – Sun · 10:00 AM – 8:00 PM" />
            </Field>
            <Field label="Phone" hint="At least one of phone/email is required">
              <TextField value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} placeholder="+91 98XXX XXXXX" />
            </Field>
            <Field label="Email">
              <TextField type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} placeholder="hello@yoursalon.com" />
            </Field>
            <Field label="WhatsApp number (optional)">
              <TextField value={draft.whatsapp} onChange={(e) => setDraft((d) => ({ ...d, whatsapp: e.target.value }))} placeholder="9198XXXXXXXX" />
            </Field>
            <Field label="Instagram handle (optional)">
              <TextField value={draft.instagram} onChange={(e) => setDraft((d) => ({ ...d, instagram: e.target.value }))} placeholder="@yoursalon" />
            </Field>
          </div>
        </section>
      )}

      {/* ---------------- STEP 7 — Publish ---------------- */}
      {step === 7 && !published && (
        <section className="space-y-6 animate-fadeIn">
          <StepIntro title="Ready for the spotlight?" subtitle="Review the checklist, preview one last time, then publish your website to the world." />

          <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg divide-y divide-[#1c1c1f]">
            {(checklist.length ? checklist : []).map((c) => (
              <div key={c.key} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-stone-300">{c.label}</span>
                {c.ok ? <Check size={16} className="text-emerald-400" /> : <X size={16} className="text-red-400" />}
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-stone-300">Website address</span>
              <span className="font-mono text-xs text-[#c5a059]">/s/{draft.slug}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-stone-300">Services on menu</span>
              <Badge tone={services.length ? 'green' : 'amber'}>{services.length}</Badge>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-stone-300">Team members shown</span>
              <Badge tone="stone">{staff.length}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <GhostButton onClick={() => setPreviewOpen(true)}>
              <Eye size={14} /> Preview website
            </GhostButton>
            <PrimaryButton onClick={doPublish} disabled={busy} className="px-8">
              {busy ? <RefreshCw size={14} className="animate-spin" /> : <Rocket size={14} />}
              Publish my website
            </PrimaryButton>
          </div>
        </section>
      )}

      {/* Full-screen live preview overlay */}
      {previewOpen && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 h-12 bg-[#0a0a0b] border-b border-[#2a2a2d] shrink-0">
            <p className="text-[10px] uppercase tracking-widest font-mono text-stone-400 flex items-center gap-2">
              <Eye size={13} className="text-[#c5a059]" /> Live draft preview — {draft.name || 'Untitled salon'}
            </p>
            <button onClick={() => setPreviewOpen(false)} className="p-2 text-stone-400 hover:text-white transition cursor-pointer" aria-label="Close preview">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PublicSite draft={previewPayload} slug={draft.slug || 'preview'} />
          </div>
        </div>
      )}
    </WizardShell>
  );
}

/* ------------------------------------------------------------------------ */
/* Shared service/staff list editors (also reused by the dashboard)          */
/* ------------------------------------------------------------------------ */
export function ServiceListEditor({
  services,
  onChange,
  showIdeas = false,
}: {
  services: DraftService[];
  onChange: (list: DraftService[]) => void;
  showIdeas?: boolean;
}) {
  const update = (i: number, patch: Partial<DraftService>) => {
    onChange(services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const addService = (preset?: Partial<DraftService>) => {
    onChange([
      ...services,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: preset?.name || '',
        category: preset?.category || 'Hair & Styling',
        price: preset?.price ?? 500,
        duration: preset?.duration ?? 45,
        description: preset?.description || '',
      },
    ]);
  };

  const unusedIdeas = SERVICE_IDEAS.filter(
    (idea) => !services.some((s) => s.name.toLowerCase() === idea.name.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {services.length === 0 && (
        <div className="border border-dashed border-[#2a2a2d] rounded-lg p-6 text-center">
          <ImageIcon size={22} className="text-[#c5a059] mx-auto mb-2 opacity-70" />
          <p className="text-sm font-serif italic text-white">Your menu is empty</p>
          <p className="text-xs text-stone-500 mt-1">Add your first service below — or tap an idea to customize it.</p>
        </div>
      )}

      {services.map((s, i) => (
        <div key={s.id} className="bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500">Service #{i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(services.filter((_, idx) => idx !== i))}
              className="p-1.5 text-stone-600 hover:text-red-400 transition cursor-pointer"
              aria-label="Remove service"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField value={s.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Service name *" />
            <SelectField value={s.category} onChange={(e) => update(i, { category: e.target.value })}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectField>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[9px] uppercase tracking-wider text-stone-600 font-mono block mb-1">Price (₹)</label>
                <TextField type="number" min={0} value={String(s.price)} onChange={(e) => update(i, { price: Number(e.target.value) || 0 })} />
              </div>
              <div className="w-28">
                <label className="text-[9px] uppercase tracking-wider text-stone-600 font-mono block mb-1">Minutes</label>
                <TextField type="number" min={5} step={5} value={String(s.duration)} onChange={(e) => update(i, { duration: Number(e.target.value) || 30 })} />
              </div>
            </div>
            <TextField value={s.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Short description (optional)" />
          </div>
        </div>
      ))}

      <GhostButton onClick={() => addService()} className="w-full">
        <Plus size={14} /> Add a service
      </GhostButton>

      {showIdeas && unusedIdeas.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-mono text-stone-500 mb-2">Tap to add a popular service:</p>
          <div className="flex flex-wrap gap-2">
            {unusedIdeas.slice(0, 6).map((idea) => (
              <button
                key={idea.name}
                type="button"
                onClick={() => addService(idea)}
                className="text-[11px] bg-[#121214] border border-[#2a2a2d] hover:border-[#c5a059]/50 text-stone-300 hover:text-[#c5a059] rounded-full px-3.5 py-1.5 transition cursor-pointer"
              >
                + {idea.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffListEditor({
  staff,
  onChange,
}: {
  staff: DraftStaff[];
  onChange: (list: DraftStaff[]) => void;
}) {
  const update = (i: number, patch: Partial<DraftStaff>) => {
    onChange(staff.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const addMember = () => {
    onChange([
      ...staff,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        role: 'Stylist',
        specialties: [],
        bio: '',
        photoUrl: '',
        acceptingBookings: true,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {staff.length === 0 && (
        <div className="border border-dashed border-[#2a2a2d] rounded-lg p-6 text-center">
          <Users size={22} className="text-[#c5a059] mx-auto mb-2 opacity-70" />
          <p className="text-sm font-serif italic text-white">No team members yet</p>
          <p className="text-xs text-stone-500 mt-1">Totally optional — solo artists can skip this step entirely.</p>
        </div>
      )}

      {staff.map((m, i) => (
        <div key={m.id} className="bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500">Artist #{i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(staff.filter((_, idx) => idx !== i))}
              className="p-1.5 text-stone-600 hover:text-red-400 transition cursor-pointer"
              aria-label="Remove team member"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField value={m.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Full name *" />
            <TextField value={m.role} onChange={(e) => update(i, { role: e.target.value })} placeholder="Role — e.g. Senior Stylist" />
            <TextField
              value={m.specialties.join(', ')}
              onChange={(e) => update(i, { specialties: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
              placeholder="Specialties — e.g. Balayage, Keratin"
              className="sm:col-span-2"
            />
            <TextArea
              rows={2}
              value={m.bio}
              onChange={(e) => update(i, { bio: e.target.value })}
              placeholder="One-line bio (optional)"
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <ImageUrlField
                label="Photo"
                value={m.photoUrl}
                onChange={(v) => update(i, { photoUrl: v })}
                gallery={STAFF_PHOTOS}
                galleryTitle="Choose a portrait"
                aspect="square"
                placeholder="https://…/portrait.jpg"
              />
            </div>
            <div className="sm:col-span-2 bg-[#121214] border border-[#2a2a2d] rounded px-3.5 py-3">
              <Toggle
                label="Accepting online bookings"
                hint={m.acceptingBookings !== false ? 'Customers can pick this specialist when booking' : 'Hidden from the booking form until re-enabled'}
                checked={m.acceptingBookings !== false}
                onChange={(v) => update(i, { acceptingBookings: v })}
              />
            </div>
          </div>
        </div>
      ))}

      <GhostButton onClick={addMember} className="w-full">
        <Plus size={14} /> Add a team member
      </GhostButton>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Wizard shell + step intro                                                 */
/* ------------------------------------------------------------------------ */
function WizardShell({
  children,
  showPreview,
  onPreview,
  footer,
}: {
  children: React.ReactNode;
  showPreview: boolean;
  onPreview?: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans flex flex-col">
      <header className="h-16 px-5 flex items-center justify-between border-b border-[#1c1c1f] shrink-0 sticky top-0 bg-[#0a0a0b] z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
            <Scissors size={16} />
          </span>
          <span className="font-serif italic text-lg text-[#c5a059] tracking-tight hidden sm:inline">Nexora Studio</span>
          <span className="text-stone-700 mx-1 hidden sm:inline">/</span>
          <span className="text-[10px] uppercase tracking-widest font-mono text-stone-500">Studio setup</span>
        </Link>
        {showPreview && onPreview && (
          <GhostButton onClick={onPreview} className="py-2">
            <Eye size={13} /> <span className="hidden sm:inline">Preview</span>
          </GhostButton>
        )}
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8">{children}</main>

      {footer && (
        <footer className="sticky bottom-0 bg-[#0a0a0b]/95 backdrop-blur border-t border-[#1c1c1f] px-5 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">{footer}</div>
        </footer>
      )}
    </div>
  );
}

function StepIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif italic text-white">{title}</h2>
      <p className="text-sm text-stone-500 mt-2 leading-relaxed">{subtitle}</p>
    </div>
  );
}

import React, { useState } from 'react';
import { RefreshCw, Save, Eye } from 'lucide-react';
import { api } from '../api';
import type { Salon } from '../types';
import { Card, Field, TextField, TextArea, SelectField, ColorField, PrimaryButton, GhostButton } from '../fields';
import ImageUrlField from '../ImageUrlField';
import { HERO_IMAGES, COLOR_PRESETS, SALON_CATEGORIES } from '../curated';

/** Website & Content editor — brand, copy, contact details, theme colors. */
export default function WebsiteEditor({
  salon,
  onSaved,
  onError,
}: {
  salon: Salon;
  onSaved: (salon: Salon) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState(() => ({ ...salon }));
  const [saving, setSaving] = useState<string>('');

  const set = (patch: Partial<Salon>) => setDraft((d) => ({ ...d, ...patch }));

  const save = async (fields: (keyof Salon)[], key: string) => {
    setSaving(key);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) payload[f] = draft[f];
      const res = await api.put<{ salon: Salon }>('/api/salon/mine', payload);
      onSaved(res.salon);
      setDraft((d) => ({ ...d, ...res.salon }));
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving('');
    }
  };

  const SaveBtn = ({ fields, k }: { fields: (keyof Salon)[]; k: string }) => (
    <PrimaryButton onClick={() => save(fields, k)} disabled={saving === k} className="ml-auto">
      {saving === k ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
      {saving === k ? 'Saving…' : 'Save'}
    </PrimaryButton>
  );

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card
        title="Identity"
        subtitle="Your salon's name and voice on the web."
        badge={<SaveBtn k="identity" fields={['name', 'tagline', 'category']} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Salon / website name">
            <TextField value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Salon type">
            <SelectField value={draft.category} onChange={(e) => set({ category: e.target.value })}>
              {SALON_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </SelectField>
          </Field>
          <Field label="Tagline" className="sm:col-span-2">
            <TextField value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="The line visitors see first" />
          </Field>
        </div>
      </Card>

      {/* Media */}
      <Card
        title="Logo & hero image"
        subtitle="The visual first impression of your brand."
        badge={<SaveBtn k="media" fields={['logoUrl', 'heroImageUrl']} />}
      >
        <div className="space-y-5">
          <ImageUrlField
            label="Logo"
            hint="Leave empty to use your monogram"
            value={draft.logoUrl}
            onChange={(v) => set({ logoUrl: v })}
            aspect="square"
            placeholder="https://…/logo.png"
          />
          <ImageUrlField
            label="Hero image"
            value={draft.heroImageUrl}
            onChange={(v) => set({ heroImageUrl: v })}
            gallery={HERO_IMAGES}
          />
        </div>
      </Card>

      {/* Copy */}
      <Card
        title="Story & promotions"
        subtitle="Your About section and the promotional banner."
        badge={<SaveBtn k="copy" fields={['about', 'welcomeOffer']} />}
      >
        <div className="space-y-5">
          <Field label="Welcome offer banner (optional)">
            <TextField value={draft.welcomeOffer} onChange={(e) => set({ welcomeOffer: e.target.value })} placeholder="Leave empty to hide the banner" />
          </Field>
          <Field label="About your salon" hint="One paragraph per line">
            <TextArea rows={5} value={draft.about} onChange={(e) => set({ about: e.target.value })} />
          </Field>
        </div>
      </Card>

      {/* Theme */}
      <Card
        title="Colors & theme"
        subtitle="Applied instantly across the entire website."
        badge={<SaveBtn k="theme" fields={['primaryColor', 'bgColor', 'surfaceColor', 'textColor']} />}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {COLOR_PRESETS.map((p) => {
            const active = draft.primaryColor === p.primary && draft.bgColor === p.bg;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => set({ primaryColor: p.primary, bgColor: p.bg, surfaceColor: p.surface, textColor: p.text })}
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
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ColorField label="Brand accent" value={draft.primaryColor} onChange={(v) => set({ primaryColor: v })} />
          <ColorField label="Page background" value={draft.bgColor} onChange={(v) => set({ bgColor: v })} />
          <ColorField label="Card surfaces" value={draft.surfaceColor} onChange={(v) => set({ surfaceColor: v })} />
          <ColorField label="Text color" value={draft.textColor} onChange={(v) => set({ textColor: v })} />
        </div>
        <div className="flex items-center gap-2 mt-5 text-[11px] font-mono text-stone-500">
          <Eye size={13} className="text-[#c5a059]" />
          Save, then open Preview to see the theme live.
          <a href={`/s/${encodeURIComponent(draft.slug)}?preview=1`} target="_blank" rel="noreferrer" className="text-[#c5a059] hover:underline ml-1">Open preview →</a>
        </div>
      </Card>

      {/* Contact */}
      <Card
        title="Contact & location"
        subtitle="Shown in your Visit Us section; powers call, WhatsApp and map buttons."
        badge={<SaveBtn k="contact" fields={['address', 'city', 'phone', 'email', 'whatsapp', 'instagram', 'openingHours']} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Street address" className="sm:col-span-2">
            <TextField value={draft.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="City">
            <TextField value={draft.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label="Opening hours">
            <TextField value={draft.openingHours} onChange={(e) => set({ openingHours: e.target.value })} />
          </Field>
          <Field label="Phone">
            <TextField value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <TextField type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="WhatsApp number">
            <TextField value={draft.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="91XXXXXXXXXX" />
          </Field>
          <Field label="Instagram handle">
            <TextField value={draft.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="@yoursalon" />
          </Field>
        </div>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../api';
import type { Salon } from '../types';
import { Card, Field, TextField, PrimaryButton } from '../fields';

interface Campaign {
  title: string;
  channel: string;
  subject?: string;
  copy: string;
  promoCode: string;
  discountValue: string;
  targetAudience: string;
  fallback?: boolean;
}

/** AI marketing campaign generator — scoped to the owner's salon. */
export default function MarketingPanel({ salon }: { salon: Salon }) {
  const [slowHour, setSlowHour] = useState('Weekday afternoons (2 PM – 5 PM)');
  const [promo, setPromo] = useState('');
  const [audience, setAudience] = useState('Regulars and celebration/wedding guests');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<Campaign>('/api/ai/marketing', {
        slowHour,
        activePromotion: promo || 'Signature services',
        targetAudience: audience,
        salonName: salon.name,
        city: salon.city,
      });
      setCampaign(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Slow-hour campaign generator"
        subtitle="Server-side Gemini AI drafts persuasive promos in your salon's voice, using your city and audience."
        badge={
          <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] px-2 py-1 rounded">
            Gemini AI
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Slow hours to fill">
            <TextField value={slowHour} onChange={(e) => setSlowHour(e.target.value)} />
          </Field>
          <Field label="Service / promo focus">
            <TextField value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="e.g. Hair spa combo" />
          </Field>
          <Field label="Target audience">
            <TextField value={audience} onChange={(e) => setAudience(e.target.value)} />
          </Field>
        </div>
        <PrimaryButton onClick={generate} disabled={loading} className="mt-5 w-full sm:w-auto">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? 'Drafting your campaign…' : 'Generate campaign'}
        </PrimaryButton>

        {error && (
          <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5">{error}</p>
        )}

        {campaign && (
          <div className="mt-6 bg-[#0a0a0b] border border-[#c5a059]/30 border-dashed rounded-lg p-5 space-y-3 animate-fadeIn">
            {campaign.fallback && (
              <p className="text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded px-3 py-2">
                Gemini AI is unreachable right now — showing a curated draft. Your inputs are kept; regenerate anytime.
              </p>
            )}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1c1c1f]">
              <h4 className="font-serif italic text-[#c5a059]">{campaign.title}</h4>
              <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-[#c5a059]/15 text-[#c5a059] px-2 py-0.5 rounded">
                {campaign.channel}
              </span>
            </div>
            {campaign.subject && (
              <p className="text-xs text-stone-300">
                <span className="text-stone-600 font-mono mr-2">Subject:</span>
                {campaign.subject}
              </p>
            )}
            <p className="text-xs text-stone-300 leading-relaxed font-mono bg-[#121214] border border-[#2a2a2d] rounded p-3 select-all whitespace-pre-wrap">
              {campaign.copy}
            </p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
              <div className="bg-[#121214] border border-[#2a2a2d] rounded p-2.5">
                <span className="text-stone-600 block">Promo code</span>
                <strong className="text-white text-xs">{campaign.promoCode}</strong>
              </div>
              <div className="bg-[#121214] border border-[#2a2a2d] rounded p-2.5">
                <span className="text-stone-600 block">Incentive</span>
                <strong className="text-white text-xs">{campaign.discountValue}</strong>
              </div>
            </div>
            <p className="text-[10px] text-stone-600 font-mono">Audience: {campaign.targetAudience}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

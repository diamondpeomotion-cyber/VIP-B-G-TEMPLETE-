import React, { useState } from 'react';
import { RefreshCw, Save, Eye } from 'lucide-react';
import { api } from '../api';
import type { SalonServiceItem, PlanInfo } from '../types';
import { Card, PrimaryButton, Badge } from '../fields';
import { ServiceListEditor } from '../OnboardingWizard';

/** Services & Prices editor — bulk list with one save. */
export default function ServicesEditor({
  services,
  plan,
  onSaved,
  onError,
}: {
  services: SalonServiceItem[];
  plan: PlanInfo;
  onSaved: (list: SalonServiceItem[]) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<SalonServiceItem[]>(services);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (draft.some((s) => !s.name.trim())) {
      onError('Every service needs a name.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<{ services: SalonServiceItem[] }>('/api/salon/mine/services', { services: draft });
      onSaved(res.services);
      setDraft(res.services);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const atCap = draft.length >= plan.limits.services;

  return (
    <Card
      title="Service menu & pricing"
      subtitle="Shown on your website and used by the booking form with live prices. Changes go live the moment you save."
      badge={
        <div className="flex items-center gap-2 ml-auto">
          <Badge tone={atCap ? 'red' : 'stone'}>{draft.length}/{plan.limits.services} · {plan.label}</Badge>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving…' : 'Save menu'}
          </PrimaryButton>
        </div>
      }
    >
      {atCap && (
        <p className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-4 py-3">
          You've reached the {plan.label} plan limit of {plan.limits.services} services. Remove one to add another, or ask the platform admin to upgrade your plan.
        </p>
      )}
      <ServiceListEditor services={draft} onChange={setDraft} showIdeas />
      <p className="text-[11px] font-mono text-stone-600 mt-5 flex items-center gap-2">
        <Eye size={12} className="text-[#c5a059]" />
        Prices display in ₹ (INR) exactly as entered here.
      </p>
    </Card>
  );
}

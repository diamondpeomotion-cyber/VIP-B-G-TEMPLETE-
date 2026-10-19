import React, { useState } from 'react';
import { RefreshCw, Save, Eye } from 'lucide-react';
import { api } from '../api';
import type { SalonServiceItem } from '../types';
import { Card, PrimaryButton } from '../fields';
import { ServiceListEditor } from '../OnboardingWizard';

/** Services & Prices editor — bulk list with one save. */
export default function ServicesEditor({
  services,
  onSaved,
  onError,
}: {
  services: SalonServiceItem[];
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

  return (
    <Card
      title="Service menu & pricing"
      subtitle="Shown on your website and used by the booking form with live prices. Changes go live the moment you save."
      badge={
        <PrimaryButton onClick={save} disabled={saving} className="ml-auto">
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving…' : 'Save menu'}
        </PrimaryButton>
      }
    >
      <ServiceListEditor services={draft} onChange={setDraft} showIdeas />
      <p className="text-[11px] font-mono text-stone-600 mt-5 flex items-center gap-2">
        <Eye size={12} className="text-[#c5a059]" />
        Prices display in ₹ (INR) exactly as entered here.
      </p>
    </Card>
  );
}

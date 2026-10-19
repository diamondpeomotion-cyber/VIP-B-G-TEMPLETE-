import React, { useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { api } from '../api';
import type { StaffMember, PlanInfo } from '../types';
import { Card, PrimaryButton, Badge } from '../fields';
import { StaffListEditor } from '../OnboardingWizard';

/** Team editor. */
export default function StaffEditor({
  staff,
  plan,
  onSaved,
  onError,
}: {
  staff: StaffMember[];
  plan: PlanInfo;
  onSaved: (list: StaffMember[]) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<StaffMember[]>(staff);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (draft.some((s) => !s.name.trim())) {
      onError('Every team member needs a name.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<{ staff: StaffMember[] }>('/api/salon/mine/staff', { staff: draft });
      onSaved(res.staff);
      setDraft(res.staff);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const atCap = draft.length >= plan.limits.staff;

  return (
    <Card
      title="Your team"
      subtitle="Artists, stylists and specialists featured on your website — clients can pick their favorite when booking."
      badge={
        <div className="flex items-center gap-2 ml-auto">
          <Badge tone={atCap ? 'red' : 'stone'}>{draft.length}/{plan.limits.staff} · {plan.label}</Badge>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving…' : 'Save team'}
          </PrimaryButton>
        </div>
      }
    >
      {atCap && (
        <p className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-4 py-3">
          You've reached the {plan.label} plan limit of {plan.limits.staff} team members. Ask the platform admin to upgrade for more.
        </p>
      )}
      <StaffListEditor staff={draft} onChange={setDraft} />
    </Card>
  );
}

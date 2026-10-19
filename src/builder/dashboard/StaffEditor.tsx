import React, { useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { api } from '../api';
import type { StaffMember } from '../types';
import { Card, PrimaryButton } from '../fields';
import { StaffListEditor } from '../OnboardingWizard';

/** Team editor. */
export default function StaffEditor({
  staff,
  onSaved,
  onError,
}: {
  staff: StaffMember[];
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

  return (
    <Card
      title="Your team"
      subtitle="Artists, stylists and specialists featured on your website — clients can pick their favorite when booking."
      badge={
        <PrimaryButton onClick={save} disabled={saving} className="ml-auto">
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving…' : 'Save team'}
        </PrimaryButton>
      }
    >
      <StaffListEditor staff={draft} onChange={setDraft} />
    </Card>
  );
}

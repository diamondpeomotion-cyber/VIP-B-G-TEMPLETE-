import React, { useEffect, useState } from 'react';
import { RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { Card, Field, TextField, SelectField, PrimaryButton, Badge } from '../fields';
import type { PlatformSettings } from '../types';

/** Platform-wide settings — super admin only. */
export default function SettingsPanel({ onToast }: { onToast: (m: string) => void }) {
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: '',
    allowRegistrations: true,
    maintenanceMessage: '',
    defaultPlan: 'free',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ settings: PlatformSettings }>('/api/admin/settings')
      .then((r) => setSettings(r.settings))
      .catch((err) => onToast((err as Error).message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put<{ settings: PlatformSettings }>('/api/admin/settings', settings);
      setSettings(res.settings);
      onToast('Platform settings saved.');
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw size={24} className="text-[#c5a059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card title="Branding" subtitle="Shown across the landing page, dashboards and email footers.">
        <Field label="Platform name">
          <TextField
            value={settings.platformName}
            onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
            placeholder="Nexora White-Label Studio"
          />
        </Field>
      </Card>

      <Card
        title="Registrations & plans"
        subtitle="Control who can join and which plan new salons start on."
        badge={!settings.allowRegistrations ? <Badge tone="red">Registrations closed</Badge> : <Badge tone="green">Open</Badge>}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white font-medium">Allow new owner sign-ups</p>
              <p className="text-[11px] text-stone-500 mt-0.5">When off, /api/auth/signup and Google first-time sign-in are refused.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.allowRegistrations}
              onClick={() => setSettings((s) => ({ ...s, allowRegistrations: !s.allowRegistrations }))}
              className={`relative w-11 h-6 rounded-full transition cursor-pointer shrink-0 ${
                settings.allowRegistrations ? 'bg-[#c5a059]' : 'bg-stone-800'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                  settings.allowRegistrations ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <Field label="Default plan for new salons" hint="Admins can change individual salon plans anytime">
            <SelectField
              value={settings.defaultPlan}
              onChange={(e) => setSettings((s) => ({ ...s, defaultPlan: e.target.value as PlatformSettings['defaultPlan'] }))}
            >
              <option value="free">Free — 10 services / 5 staff</option>
              <option value="pro">Pro — 50 services / 20 staff</option>
              <option value="premium">Premium — 100 services / 50 staff</option>
            </SelectField>
          </Field>
        </div>
      </Card>

      <Card title="Maintenance banner" subtitle="Displayed on the landing page while set. Leave empty to hide.">
        <Field label="Banner message">
          <TextField
            value={settings.maintenanceMessage}
            onChange={(e) => setSettings((s) => ({ ...s, maintenanceMessage: e.target.value }))}
            placeholder="e.g. Scheduled maintenance Sunday 2–4 AM IST"
          />
        </Field>
        {settings.maintenanceMessage && (
          <p className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 flex items-start gap-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" /> Currently visible to all visitors.
          </p>
        )}
      </Card>

      <PrimaryButton onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Saving…' : 'Save platform settings'}
      </PrimaryButton>

      <Card title="Admin access" subtitle="How super-admins are designated.">
        <p className="text-xs text-stone-400 leading-relaxed">
          Accounts whose email appears in the <span className="font-mono text-[#c5a059]">ADMIN_EMAILS</span> environment
          variable (comma-separated) are automatically granted super-admin at sign-in. Admins can also promote or
          revoke roles in <span className="font-mono text-stone-300">Users &amp; Roles</span> — env-designated admins
          cannot be revoked from the UI for safety.
        </p>
      </Card>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Rocket, RefreshCw, Check, X, Copy, Globe, Eye, PowerOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '../api';
import type { Salon, SiteUrls, ChecklistItem } from '../types';
import { Card, PrimaryButton, GhostButton, DangerButton, Badge, TextField } from '../fields';
import { slugifySuggestion } from '../curated';
import type { SectionKey } from './Dashboard';

/** Publish & domain management. */
export default function PublishPanel({
  salon,
  urls,
  onChanged,
  onNavigate,
}: {
  salon: Salon;
  urls: SiteUrls;
  onChanged: (salon: Salon, urls: SiteUrls) => void;
  onNavigate: (s: SectionKey) => void;
}) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [slugDraft, setSlugDraft] = useState(salon.slug);
  const [slugBusy, setSlugBusy] = useState(false);
  const [slugMsg, setSlugMsg] = useState('');

  useEffect(() => {
    api
      .get<{ checklist: ChecklistItem[] }>('/api/salon/mine/checklist')
      .then((r) => setChecklist(r.checklist))
      .catch(() => {});
  }, [salon.updatedAt]);

  const publish = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post<{ salon: Salon; urls: SiteUrls; checklist: ChecklistItem[] }>(
        '/api/salon/mine/publish'
      );
      setChecklist(res.checklist);
      onChanged(res.salon, res.urls);
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      if (e.payload?.checklist) setChecklist(e.payload.checklist);
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!confirm('Unpublish your website? Visitors will see a "coming soon" page until you publish again.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post<{ salon: Salon; urls: SiteUrls }>('/api/salon/mine/unpublish');
      onChanged(res.salon, res.urls);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const changeSlug = async () => {
    const normalized = slugifySuggestion(slugDraft);
    setSlugDraft(normalized);
    if (!normalized || normalized === salon.slug) return;
    setSlugBusy(true);
    setSlugMsg('');
    try {
      const res = await api.put<{ salon: Salon; urls: SiteUrls }>('/api/salon/mine', { slug: normalized });
      onChanged(res.salon, res.urls);
      setSlugMsg('Address updated — your new URL is live.');
    } catch (err) {
      setSlugMsg((err as Error).message);
    } finally {
      setSlugBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const primaryUrl = urls.subdomainUrl || urls.pathUrl;
  const hardOk = checklist.filter((c) => c.key !== 'brand').every((c) => c.ok);

  return (
    <div className="space-y-6">
      {/* Status + actions */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif italic text-white flex items-center gap-2">
              {salon.published ? (
                <>
                  <Globe size={18} className="text-emerald-400" /> Your website is live
                </>
              ) : (
                <>
                  <PowerOff size={18} className="text-amber-400" /> Currently unpublished
                </>
              )}
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-md">
              {salon.published
                ? 'Anyone with your link can browse your site and book appointments.'
                : 'Only you can see the preview. Publish when you are ready for visitors.'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <a
              href={`/s/${encodeURIComponent(salon.slug)}?preview=1`}
              target="_blank"
              rel="noreferrer"
              className="bg-transparent hover:bg-white/5 border border-[#2a2a2d] hover:border-stone-500 text-stone-300 hover:text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm transition inline-flex items-center justify-center gap-2"
            >
              <Eye size={13} /> Preview
            </a>
            {salon.published ? (
              <DangerButton onClick={unpublish} disabled={busy}>
                {busy ? <RefreshCw size={13} className="animate-spin" /> : <PowerOff size={13} />}
                Unpublish
              </DangerButton>
            ) : (
              <PrimaryButton onClick={publish} disabled={busy}>
                {busy ? <RefreshCw size={13} className="animate-spin" /> : <Rocket size={13} />}
                Publish website
              </PrimaryButton>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
          </p>
        )}
      </Card>

      {/* URLs */}
      <Card title="Your unique address" subtitle="Both URL styles route to your website automatically.">
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-[#0a0a0b] border border-[#2a2a2d] rounded px-4 py-3">
            <Globe size={14} className="text-[#c5a059] shrink-0" />
            <span className="font-mono text-xs text-stone-200 truncate flex-1">{primaryUrl}</span>
            <button onClick={() => copy(primaryUrl)} className="p-1.5 text-stone-500 hover:text-[#c5a059] transition cursor-pointer" title="Copy">
              {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
          {urls.subdomainUrl && (
            <p className="text-[11px] font-mono text-stone-600">
              Path fallback: <span className="text-stone-400">{urls.pathUrl}</span>
            </p>
          )}
          {!urls.subdomainUrl && (
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Tip: on deployments with wildcard DNS (e.g. <span className="font-mono text-stone-400">*.yourdomain.com</span>) your site is automatically reachable at{' '}
              <span className="font-mono text-[#c5a059]">{salon.slug}.yourdomain.com</span> too.
            </p>
          )}
        </div>

        {/* Change address */}
        <div className="mt-6 pt-5 border-t border-[#1c1c1f]">
          <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-stone-400 mb-2">Change address</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 font-mono text-xs">/s/</span>
              <TextField value={slugDraft} onChange={(e) => setSlugDraft(e.target.value)} className="pl-9 font-mono" />
            </div>
            <GhostButton onClick={changeSlug} disabled={slugBusy || slugifySuggestion(slugDraft) === salon.slug}>
              {slugBusy ? <RefreshCw size={13} className="animate-spin" /> : null}
              Update address
            </GhostButton>
          </div>
          {slugMsg && <p className="text-[11px] mt-2 text-stone-400">{slugMsg}</p>}
          {salon.published && (
            <p className="text-[10px] text-amber-500/80 mt-2 font-mono">
              ⚠ Changing the address of a live site makes the old link stop working.
            </p>
          )}
        </div>
      </Card>

      {/* Checklist */}
      <Card title="Publish readiness" subtitle="What we verify before your site goes live.">
        <div className="divide-y divide-[#1c1c1f]">
          {checklist.map((c) => (
            <div key={c.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <span className="text-sm text-stone-300 flex items-center gap-2">
                {c.ok ? <Check size={15} className="text-emerald-400" /> : <X size={15} className="text-red-400" />}
                {c.label}
                {c.key === 'brand' && !c.ok && <Badge tone="stone">optional</Badge>}
              </span>
              {!c.ok && (
                <button
                  onClick={() => onNavigate(c.key === 'services' ? 'services' : 'website')}
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c5a059] hover:underline cursor-pointer"
                >
                  Fix →
                </button>
              )}
            </div>
          ))}
        </div>
        {!hardOk && (
          <p className="text-[11px] text-amber-400/90 font-mono mt-4 bg-amber-500/5 border border-amber-500/20 rounded px-3 py-2.5">
            Complete the required items above to enable publishing.
          </p>
        )}
      </Card>
    </div>
  );
}

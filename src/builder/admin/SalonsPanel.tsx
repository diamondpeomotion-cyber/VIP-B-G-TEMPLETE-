import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ExternalLink, Trash2, Power, PowerOff, X, Globe, CreditCard } from 'lucide-react';
import { api } from '../api';
import { Card, Badge, GhostButton, SelectField, Field } from '../fields';
import type { AdminSalonRow, OwnerUser, Salon } from '../types';

const inputCls =
  'w-full bg-[#0a0a0b] text-sm border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition placeholder:text-stone-600';

const STATUS_OPTIONS = ['active', 'trialing', 'past_due', 'cancelled'];

export default function SalonsPanel({ me, onToast }: { me: OwnerUser; onToast: (m: string) => void }) {
  const [rows, setRows] = useState<AdminSalonRow[]>([]);
  const [q, setQ] = useState('');
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (onlyPublished) params.set('published', '1');
      const res = await api.get<{ salons: AdminSalonRow[] }>(`/api/admin/salons?${params}`);
      setRows(res.salons);
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, onlyPublished, onToast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await api.patch<{ salon: Salon }>(`/api/admin/salons/${encodeURIComponent(id)}`, body);
      setRows((list) => list.map((r) => (r.salon.id === id ? { ...r, salon: res.salon } : r)));
      if (detail?.salon?.id === id) setDetail((d: any) => ({ ...d, salon: res.salon }));
      if (body.subscriptionPlan) onToast(`Subscription changed to ${body.subscriptionPlan}.`);
      else if (body.published === false) onToast('Website force-unpublished.');
      else if (body.published === true) onToast('Website published.');
      else onToast('Salon updated.');
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (row: AdminSalonRow) => {
    if (!confirm(`Permanently DELETE "${row.salon.name}" (/s/${row.salon.slug})?\n\nAll services, staff and bookings for this salon will be deleted. The owner account remains.`)) return;
    setBusyId(row.salon.id);
    try {
      await api.del(`/api/admin/salons/${encodeURIComponent(row.salon.id)}`);
      setRows((list) => list.filter((r) => r.salon.id !== row.salon.id));
      setDetail(null);
      onToast('Salon website deleted.');
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setBusyId('');
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await api.get(`/api/admin/salons/${encodeURIComponent(id)}`));
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <Card
        title="Salons & published websites"
        subtitle="Every salon on the platform — manage subscriptions, publishing state and content limits."
        badge={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search salon, slug, owner…" className={`${inputCls} pl-8 w-40 sm:w-60`} />
            </div>
            <button
              onClick={() => setOnlyPublished(!onlyPublished)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border transition cursor-pointer ${
                onlyPublished ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'border-[#2a2a2d] text-stone-400 hover:text-white'
              }`}
            >
              Live only
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw size={22} className="text-[#c5a059] animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-stone-500 italic font-serif">No salons match.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-xs min-w-[760px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest font-mono text-stone-500 border-b border-[#1c1c1f]">
                  <th className="py-2 pr-3">Salon</th>
                  <th className="py-2 pr-3">Owner</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-center">Menu/Team</th>
                  <th className="py-2 pr-3 text-center">Bookings</th>
                  <th className="py-2 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141416]">
                {rows.map(({ salon, owner, counts }) => {
                  const busy = busyId === salon.id;
                  return (
                    <tr key={salon.id} className="align-middle">
                      <td className="py-3 pr-3">
                        <button onClick={() => openDetail(salon.id)} className="text-left group cursor-pointer">
                          <p className="font-bold text-white group-hover:text-[#c5a059] transition">{salon.name}</p>
                          <p className="text-[10px] font-mono text-stone-500">/s/{salon.slug}</p>
                        </button>
                      </td>
                      <td className="py-3 pr-3 text-stone-400">
                        <p>{owner.name}</p>
                        <p className="text-[10px] font-mono text-stone-600">{owner.email}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={salon.subscriptionPlan}
                          disabled={busy}
                          onChange={(e) => patch(salon.id, { subscriptionPlan: e.target.value })}
                          className="bg-[#121214] border border-[#2a2a2d] rounded px-2 py-1.5 text-[11px] text-stone-200 outline-none focus:border-[#c5a059] cursor-pointer"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                        <p className="text-[9px] font-mono text-stone-600 mt-1">{salon.subscriptionStatus}</p>
                      </td>
                      <td className="py-3 pr-3">
                        {salon.published ? <Badge tone="green">● live</Badge> : <Badge tone="amber">draft</Badge>}
                      </td>
                      <td className="py-3 pr-3 text-center font-mono text-stone-400">{counts.services}/{counts.staff}</td>
                      <td className="py-3 pr-3 text-center font-mono text-stone-400">{counts.bookings}</td>
                      <td className="py-3 pl-3">
                        <div className="flex justify-end gap-1.5">
                          {salon.published && (
                            <a
                              href={`/s/${salon.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2.5 py-1.5 border border-[#2a2a2d] text-stone-300 hover:border-stone-500 hover:text-white transition"
                              title="Open live site"
                            >
                              <ExternalLink size={11} />
                            </a>
                          )}
                          <button
                            onClick={() => patch(salon.id, { published: !salon.published })}
                            disabled={busy}
                            title={salon.published ? 'Force unpublish' : 'Force publish'}
                            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2.5 py-1.5 border transition cursor-pointer disabled:opacity-50 ${
                              salon.published
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {busy ? <RefreshCw size={11} className="animate-spin" /> : salon.published ? <PowerOff size={11} /> : <Power size={11} />}
                          </button>
                          <button
                            onClick={() => remove({ salon, owner, counts })}
                            disabled={busy}
                            title="Delete salon"
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2.5 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail drawer */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="bg-[#121214] border border-[#2a2a2d] w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <div className="flex justify-center py-16"><RefreshCw size={22} className="text-[#c5a059] animate-spin" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-[#2a2a2d] sticky top-0 bg-[#121214] z-10">
                  <div>
                    <h3 className="font-serif italic text-white text-xl">{detail.salon.name}</h3>
                    <p className="text-[10px] font-mono text-stone-500 mt-0.5">/s/{detail.salon.slug} · owner {detail.owner.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {detail.salon.published && (
                      <a href={`/s/${detail.salon.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 rounded px-2.5 py-1.5 hover:bg-emerald-500/10 transition">
                        <Globe size={11} /> Live
                      </a>
                    )}
                    <button onClick={() => setDetail(null)} className="p-2 text-stone-500 hover:text-white transition cursor-pointer" aria-label="Close">
                      <X size={17} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Subscription">
                      <SelectField
                        value={detail.salon.subscriptionPlan}
                        onChange={(e) => patch(detail.salon.id, { subscriptionPlan: e.target.value })}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </SelectField>
                    </Field>
                    <Field label="Billing status">
                      <SelectField
                        value={detail.salon.subscriptionStatus}
                        onChange={(e) => patch(detail.salon.id, { subscriptionStatus: e.target.value })}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </SelectField>
                    </Field>
                    <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded p-3">
                      <p className="text-[9px] uppercase tracking-widest font-mono text-stone-600">Publishing</p>
                      <p className="mt-1">{detail.salon.published ? <Badge tone="green">live</Badge> : <Badge tone="amber">draft</Badge>}</p>
                    </div>
                    <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded p-3">
                      <p className="text-[9px] uppercase tracking-widest font-mono text-stone-600">Created</p>
                      <p className="text-stone-300 font-mono mt-1.5">{String(detail.salon.createdAt).slice(0, 10)}</p>
                    </div>
                  </div>

                  {(detail.salon.city || detail.salon.phone || detail.salon.email) && (
                    <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded p-4 space-y-1">
                      {detail.salon.city && <p className="text-stone-400">📍 {detail.salon.address}{detail.salon.address && detail.salon.city ? ', ' : ''}{detail.salon.city}</p>}
                      {detail.salon.phone && <p className="text-stone-400">📞 {detail.salon.phone}</p>}
                      {detail.salon.email && <p className="text-stone-400">✉️ {detail.salon.email}</p>}
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-stone-500 mb-2">Services ({detail.services.length})</p>
                    {detail.services.length === 0 ? (
                      <p className="text-stone-600 italic">None yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {detail.services.map((s: any) => (
                          <div key={s.id} className="flex justify-between gap-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded px-3 py-2">
                            <span className="text-stone-300 truncate">{s.name} <span className="text-stone-600">· {s.category}</span></span>
                            <span className="font-mono text-[#c5a059] shrink-0">₹{Number(s.price).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-stone-500 mb-2">Recent bookings ({detail.bookings.length})</p>
                    {detail.bookings.length === 0 ? (
                      <p className="text-stone-600 italic">None yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {detail.bookings.map((b: any) => (
                          <div key={b.id} className="flex justify-between gap-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded px-3 py-2">
                            <span className="text-stone-300 truncate">{b.customerName} · {b.serviceName}</span>
                            <span className="font-mono text-stone-500 shrink-0">{b.date} {b.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

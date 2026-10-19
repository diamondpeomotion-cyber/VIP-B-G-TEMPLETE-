import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldCheck, ShieldOff, Ban, Trash2, RotateCcw, User as UserIcon } from 'lucide-react';
import { api } from '../api';
import { Card, Badge, GhostButton } from '../fields';
import type { AdminUser, OwnerUser } from '../types';

const inputCls =
  'w-full bg-[#0a0a0b] text-sm border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition placeholder:text-stone-600';

export default function UsersPanel({ me, onToast }: { me: OwnerUser; onToast: (m: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async (query = q) => {
    try {
      const res = await api.get<{ users: AdminUser[] }>(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      setUsers(res.users);
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, onToast]);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await api.patch<{ user: AdminUser }>(`/api/admin/users/${encodeURIComponent(id)}`, body);
      setUsers((list) => list.map((u) => (u.id === id ? res.user : u)));
      onToast(body.disabled ? 'Account disabled & sessions revoked.' : body.role ? 'Role updated.' : 'Account re-enabled.');
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setBusyId('');
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`Permanently DELETE ${u.name} (${u.email})?\n\nThis also deletes their salon website, services, staff and bookings. This cannot be undone.`)) return;
    setBusyId(u.id);
    try {
      await api.del(`/api/admin/users/${encodeURIComponent(u.id)}`);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      onToast('User and all their data deleted.');
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card
      title="Users & roles"
      subtitle="Manage every owner account — grant or revoke admin access, disable abusive accounts."
      badge={
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className={`${inputCls} pl-8 w-44 sm:w-56`} />
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw size={22} className="text-[#c5a059] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-stone-500 italic font-serif">No users match this search.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isMe = u.id === me.id;
            const busy = busyId === u.id;
            return (
              <div key={u.id} className={`bg-[#0a0a0b] border rounded-lg p-4 ${u.disabled ? 'border-red-500/25' : 'border-[#2a2a2d]'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-[#1c1c1f] border border-[#2a2a2d] flex items-center justify-center text-[#c5a059] shrink-0">
                      <UserIcon size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white">{u.name}</p>
                        {isMe && <Badge tone="stone">you</Badge>}
                        {u.role === 'super_admin' && <Badge tone="gold">super admin</Badge>}
                        {u.disabled && <Badge tone="red">disabled</Badge>}
                        <Badge tone={u.authProvider === 'google' ? 'blue' : 'stone'}>
                          {u.authProvider === 'google' ? 'Google' : 'password'}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-stone-500 mt-0.5 truncate">{u.email} · joined {u.createdAt}</p>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        {u.salon ? (
                          <>Salon: <a href={`/s/${u.salon.slug}`} target="_blank" rel="noreferrer" className="text-[#c5a059] hover:underline">/s/{u.salon.slug}</a>
                            <span className="text-stone-500"> · {u.salon.plan} plan</span>
                            {u.salon.published ? <span className="text-emerald-500"> · live</span> : <span className="text-amber-500"> · draft</span>}
                          </>
                        ) : (
                          'No salon created yet'
                        )}
                      </p>
                    </div>
                  </div>

                  {!isMe && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <ActionBtn
                        busy={busy}
                        onClick={() => patch(u.id, { role: u.role === 'super_admin' ? 'owner' : 'super_admin' })}
                        title={u.role === 'super_admin' ? 'Revoke admin' : 'Make admin'}
                      >
                        {u.role === 'super_admin' ? <><ShieldOff size={12} /> Revoke admin</> : <><ShieldCheck size={12} /> Make admin</>}
                      </ActionBtn>
                      {u.disabled ? (
                        <ActionBtn busy={busy} onClick={() => patch(u.id, { disabled: false })} title="Re-enable account">
                          <RotateCcw size={12} /> Re-enable
                        </ActionBtn>
                      ) : (
                        <ActionBtn busy={busy} danger onClick={() => patch(u.id, { disabled: true })} title="Disable account">
                          <Ban size={12} /> Disable
                        </ActionBtn>
                      )}
                      <GhostButton onClick={() => remove(u)} disabled={busy} className="px-3 py-1.5 text-[10px] text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50" title="Delete user">
                        <Trash2 size={12} />
                      </GhostButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ActionBtn({
  children,
  onClick,
  busy,
  danger,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={title}
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2.5 py-1.5 border transition cursor-pointer disabled:opacity-50 ${
        danger
          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          : 'border-[#2a2a2d] text-stone-300 hover:border-stone-500 hover:text-white'
      }`}
    >
      {busy ? <RefreshCw size={11} className="animate-spin" /> : children}
    </button>
  );
}

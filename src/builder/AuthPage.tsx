import React, { useState } from 'react';
import { Scissors, RefreshCw, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, navigate } from '../Root';
import { api } from './api';
import { useAuth } from './auth';
import type { OwnerUser, Salon } from './types';

export default function AuthPage() {
  const { setSession } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post<{ user: OwnerUser; salon: Salon | null }>(
        mode === 'signup' ? '/api/auth/signup' : '/api/auth/login',
        mode === 'signup' ? { name, email, password } : { email, password }
      );
      setSession(data.user, data.salon);
      navigate(data.salon ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full bg-[#0a0a0b] text-sm border border-[#2a2a2d] rounded px-3.5 py-3 text-stone-200 outline-none focus:border-[#c5a059] transition placeholder:text-stone-600';

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans flex flex-col">
      <header className="px-5 h-16 flex items-center justify-between border-b border-[#1c1c1f]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
            <Scissors size={16} />
          </span>
          <span className="font-serif italic text-xl text-[#c5a059] tracking-tight">Nexora Studio</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-mono text-stone-500 hover:text-white transition">
          <ArrowLeft size={13} /> Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif italic text-white">
              {mode === 'signup' ? 'Open your studio online' : 'Welcome back'}
            </h1>
            <p className="text-xs text-stone-500 mt-2 font-mono uppercase tracking-widest">
              {mode === 'signup' ? 'Your website is one minute away' : 'Sign in to your salon dashboard'}
            </p>
          </div>

          <div className="bg-[#121214] border border-[#2a2a2d] rounded-lg p-6 sm:p-8">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 bg-[#0a0a0b] border border-[#2a2a2d] rounded p-1 mb-7">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={`py-2 rounded text-[11px] uppercase font-bold tracking-widest font-mono transition cursor-pointer ${
                    mode === m ? 'bg-[#c5a059] text-black' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Kapoor"
                    className={inputCls}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yoursalon.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold block mb-1.5">
                  Password {mode === 'signup' && <span className="text-stone-600 normal-case tracking-normal">(min. 8 characters)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={mode === 'signup' ? 8 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition cursor-pointer"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy && <RefreshCw size={14} className="animate-spin" />}
                {mode === 'signup' ? 'Create my account' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-stone-600 font-mono mt-6 leading-relaxed">
            Secured with scrypt password hashing<br />and HTTP-only session cookies.
          </p>
        </div>
      </div>
    </div>
  );
}

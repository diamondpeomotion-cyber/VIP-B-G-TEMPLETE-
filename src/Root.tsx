import React, { Suspense, lazy, useEffect, useState } from 'react';
import LandingPage from './builder/LandingPage';
import AuthPage from './builder/AuthPage';
import OnboardingWizard from './builder/OnboardingWizard';
import Dashboard from './builder/dashboard/Dashboard';
import PublicSite from './builder/PublicSite';
import { AuthProvider } from './builder/auth';

// Legacy SalonOS demo is heavy (charts, motion) — load it only when visited.
const LegacySalonOSApp = lazy(() => import('./App'));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4 text-[#e5e5e5]">
      <div className="w-9 h-9 rounded-full border-2 border-[#2a2a2d] border-t-[#c5a059] animate-spin" />
      <p className="font-serif italic text-stone-500 text-sm">Loading experience…</p>
    </div>
  );
}

/** Client-side navigation without extra deps. */
export function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new Event('app:navigate'));
  window.scrollTo(0, 0);
}

export function Link(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
) {
  const { href, children, ...rest } = props;
  const external = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        if (external || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target === '_blank') return;
        e.preventDefault();
        navigate(href);
        props.onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}

/**
 * Detects subdomain-based salon addresses: aria-glam.yourdomain.com → "aria-glam".
 * Never triggers on localhost, IPs, sandbox preview hosts, or reserved labels.
 */
export function slugFromHost(): string | null {
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (host.endsWith('.e2b.app')) return null; // sandbox preview host ({port}-{id}.e2b.app)
  const parts = host.split('.');
  if (parts.length < 3) return null;
  const sub = parts[0].toLowerCase();
  if (/^\d+$/.test(sub) || /^\d+-/.test(sub)) return null; // port-like prefixes
  if (['www', 'app', 'api', 'demo', 'dashboard', 'auth'].includes(sub)) return null;
  return sub;
}

function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onNav = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onNav);
    window.addEventListener('app:navigate', onNav);
    return () => {
      window.removeEventListener('popstate', onNav);
      window.removeEventListener('app:navigate', onNav);
    };
  }, []);
  return path;
}

function Router() {
  const path = usePath();

  // 1) Subdomain-hosted salon website.
  const subSlug = slugFromHost();
  if (subSlug) {
    return <PublicSite slug={subSlug} />;
  }

  // 2) Path-based salon website: /s/:slug
  if (path.startsWith('/s/')) {
    const slug = decodeURIComponent(path.slice(3).split('/')[0] || '');
    const preview = new URLSearchParams(window.location.search).get('preview') === '1';
    return <PublicSite slug={slug} previewToken={preview} />;
  }

  // 3) Legacy SalonOS demo.
  if (path === '/demo' || path.startsWith('/demo/')) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <LegacySalonOSApp />
      </Suspense>
    );
  }

  // 4) Builder product routes.
  if (path === '/auth' || path === '/login' || path === '/signup') {
    return <AuthPage />;
  }
  if (path === '/onboarding') {
    return <OnboardingWizard />;
  }
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    return <Dashboard />;
  }

  // 5) Marketing landing page (also catches unknown routes).
  return <LandingPage />;
}

export default function Root() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

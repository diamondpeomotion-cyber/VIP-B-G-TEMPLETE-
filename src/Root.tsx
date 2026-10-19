import React, { Suspense, lazy, useEffect, useState } from 'react';
import LandingPage from './builder/LandingPage';
import AuthPage from './builder/AuthPage';
import OnboardingWizard from './builder/OnboardingWizard';
import Dashboard from './builder/dashboard/Dashboard';
import PublicSite from './builder/PublicSite';
import { AuthProvider } from './builder/auth';
import { PlatformConfigProvider } from './builder/config';
import AdminDashboard from './builder/admin/AdminDashboard';

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
 * Labels that can never be salon subdomains. MUST stay in sync with
 * RESERVED_SLUGS in server/builder.ts (duplicated here because the client
 * cannot import server modules without bundling Express).
 */
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'demo', 'dashboard', 'auth', 'onboarding', 'admin',
  's', 'signup', 'login', 'logout', 'assets', 'static', 'media', 'mail',
  'support', 'help', 'blog', 'status', 'cdn', 'ftp', 'nexora', 'root',
]);

/** Hosting suffixes where the first label is infrastructure, not a tenant. */
const PREVIEW_HOST_SUFFIXES = [
  '.e2b.app', // sandbox preview host ({port}-{id}.e2b.app)
  '.vercel.app',
  '.pages.dev',
  '.netlify.app',
  '.onrender.com',
  '.railway.app',
  '.fly.dev',
];

/**
 * Detects subdomain-based salon addresses: aria-glam.yourdomain.com → "aria-glam".
 * Never triggers on localhost, IPs, preview/PaaS hosts, or reserved labels —
 * those fall through to the normal path-based router instead of crashing
 * into a tenant lookup for a nonsense slug.
 */
export function slugFromHost(): string | null {
  const host = (window.location.hostname || '').toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (PREVIEW_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return null;
  const parts = host.split('.');
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (!sub || /^\d+$/.test(sub) || /^\d+-/.test(sub)) return null; // port-like prefixes
  if (RESERVED_SUBDOMAINS.has(sub)) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(sub)) return null;
  return sub;
}

/** True when the current page is served from a tenant subdomain host. */
export function isTenantHost(): boolean {
  return slugFromHost() !== null;
}

/**
 * Builds a link to a platform route (/, /auth, /dashboard, …) that keeps
 * working on tenant subdomain hosts. On `aria.yourdomain.com`, `/auth`
 * would re-render the tenant site (the router always prefers the subdomain),
 * so platform links are absolutized to the apex domain instead.
 */
export function platformPath(path: string): string {
  if (!path.startsWith('/')) return path;
  if (!isTenantHost()) return path;
  const apex = window.location.hostname.toLowerCase().split('.').slice(1).join('.');
  if (!apex) return path;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `//${apex}${port}${path}`;
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
  if (path === '/s' || path === '/s/' || path.startsWith('/s/')) {
    const slug = decodeURIComponent(path.slice(3).split('/')[0] || '').trim();
    if (!slug) {
      // Bare /s/ with no address — show the marketing site, not a broken lookup.
      return <LandingPage />;
    }
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

  // Super-admin platform console (role-guarded both client & server side).
  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminDashboard />;
  }

  // 5) Marketing landing page (also catches unknown routes).
  return <LandingPage />;
}

export default function Root() {
  return (
    <PlatformConfigProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </PlatformConfigProvider>
  );
}

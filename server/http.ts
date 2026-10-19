/**
 * Shared HTTP hardening utilities: request logging, JSON 404s for unknown
 * API routes, structured error logging, and a global error handler.
 *
 * Mount order in server.ts matters:
 *   1. requestLogger (first, so every request is timed)
 *   2. ... all API routers ...
 *   3. /api/health + apiNotFound for /api/* (before the SPA fallback)
 *   4. errorHandler (last — Express calls it for thrown errors)
 */
import type { NextFunction, Request, Response } from 'express';

/** One-line request log: method, path, status, duration. Zero dependencies. */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    // Keep health checks quiet to avoid log spam from uptime monitors.
    if (req.path === '/api/health') return;
    const ms = Date.now() - start;
    console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
}

/** JSON 404 for unknown /api/* routes (mounted after all API routers). */
export function apiNotFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'API endpoint not found.', code: 'NOT_FOUND' });
}

/**
 * Structured server-side error log. Never logs request bodies (they may
 * contain PII like customer emails/phones) — only scope + safe context.
 */
export function logError(scope: string, err: unknown, extra?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({ level: 'error', scope, message, ...extra, at: new Date().toISOString(), stack })
  );
}

/**
 * Global error middleware — always responds with JSON. Stack traces and
 * internal messages are hidden in production; full detail in development.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // Malformed JSON bodies (express.json throws a SyntaxError with .body set).
  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return res.status(400).json({ error: 'Malformed JSON body.', code: 'BAD_JSON' });
  }
  logError('http', err, { path: req?.originalUrl, method: req?.method });
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err?.message || 'Internal server error';
  if (!res.headersSent) {
    res.status(status).json({ error: message, code: status === 500 ? 'INTERNAL' : err?.code || 'ERROR' });
  }
}

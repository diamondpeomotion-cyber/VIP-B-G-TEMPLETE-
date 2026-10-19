import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import { sessionMiddleware } from './server/auth';
import { builderRouter } from './server/builder';
import { adminRouter } from './server/admin';
import { legacyRouter, startLegacyRefundDaemon } from './server/legacy';
import { aiRouter } from './server/ai';
import { requestLogger, apiNotFound, errorHandler } from './server/http';
import { db } from './server/db';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust the first reverse-proxy hop (so req.protocol / secure cookies work
// correctly behind platform TLS terminators).
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));

// Basic production-grade security headers.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Time and log every request (health checks stay quiet).
app.use(requestLogger);

// Attach the salon-owner session (when present) before any API route runs.
app.use(sessionMiddleware);

// ---------------------------------------------------------------------------
// API routers
// ---------------------------------------------------------------------------
app.use(builderRouter);   // White-label builder: auth, salons, publish, public sites
app.use(adminRouter);     // Super-admin platform management (RBAC-guarded)
app.use(aiRouter);        // Gemini AI consultant & marketing (demo + white-label)
app.use(legacyRouter);    // Original SalonOS demo experience served at /demo

// Liveness probe for uptime monitors / orchestrators (also verifies SQLite).
app.get('/api/health', (_req, res) => {
  try {
    (db.prepare('SELECT 1 AS ok').get() as { ok: number }).ok;
    res.json({ ok: true, service: 'nexora-studio', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, error: 'Database unreachable.' });
  }
});

// Unknown /api/* routes → JSON 404 (never the SPA shell — clients parse JSON).
app.use('/api', apiNotFound);

// ---------------------------------------------------------------------------
// Frontend (Vite dev middleware in development, static build in production)
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback — only for non-API navigations (API 404s handled above).
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found.', code: 'NOT_FOUND' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler (must be registered after all routes/middleware).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora White-Label Salon Studio listening on port ${PORT}`);
    // Demo-only background daemon (powers the SalonOS demo at /demo).
    startLegacyRefundDaemon();
  });
}

startServer();

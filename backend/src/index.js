import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import shareRoutes from './routes/share.routes.js';
import insightsRoutes from './routes/insights.routes.js';

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ─────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/shared', shareRoutes);
app.use('/api/insights', insightsRoutes);

// ─── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── 404 handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start server ────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`\n🚀 PEBLO Notes API running on http://localhost:${env.PORT}`);
  console.log(`📊 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`🤖 AI: ${env.GEMINI_API_KEY ? 'Configured ✓' : 'Not configured (set GEMINI_API_KEY)'}\n`);
});

export default app;

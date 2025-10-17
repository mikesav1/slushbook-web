import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import adminRoutes from './routes/admin.routes';
import goRoutes from './routes/go.routes';
import db from './db';

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true
}));

// Rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many requests from this IP'
});

// Health endpoint
app.get('/health', (req, res) => {
  try {
    // Test DB connection
    db.prepare('SELECT 1').get();
    res.json({ ok: true, db: true });
  } catch (error) {
    res.status(500).json({ ok: false, db: false });
  }
});

// Routes
app.use('/admin', adminLimiter, adminRoutes);
app.use('/go', goRoutes);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Redirect service running on port ${PORT}`);
  });
}

export default app;
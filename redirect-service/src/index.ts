import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.routes';
import goRoutes from './routes/go.routes';
import { initDb, getDb } from './db';

// Load environment variables
dotenv.config();

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
app.get('/health', async (req, res) => {
  try {
    // Test DB connection
    const db = getDb();
    await db.admin().ping();
    res.json({ ok: true, db: true });
  } catch (error) {
    res.status(500).json({ ok: false, db: false, error: (error as Error).message });
  }
});

// Routes
app.use('/admin', adminLimiter, adminRoutes);
app.use('/go', goRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    await initDb();
    console.log('MongoDB connected successfully');
    
    // Only start server if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Redirect service running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();

export default app;
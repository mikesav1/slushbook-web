import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-token';

console.log('Auth middleware initialized with token:', ADMIN_TOKEN); // Debug

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
};
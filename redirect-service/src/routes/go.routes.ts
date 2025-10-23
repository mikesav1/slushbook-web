import { Router, Request, Response } from 'express';
import * as dbService from '../services/db.service';

const router = Router();

const FALLBACK_URL = 'https://www.power.dk/c/7806/koekken-og-madlavning/vand-og-juice/smagsekstrakter/';
const AFFIL_MODE = process.env.AFFIL_MODE || 'off';
const AFFIL_ID = process.env.AFFIL_ID || '';

const wrapAffiliate = (url: string): string => {
  if (AFFIL_MODE === 'skimlinks' && AFFIL_ID) {
    return `https://go.skimresources.com/?id=${AFFIL_ID}&url=${encodeURIComponent(url)}`;
  }
  return url;
};

const addUTM = (url: string): string => {
  const urlObj = new URL(url);
  urlObj.searchParams.set('utm_source', 'slushbook');
  urlObj.searchParams.set('utm_medium', 'app');
  urlObj.searchParams.set('utm_campaign', 'buy');
  return urlObj.toString();
};

// GET /go/:mappingId
router.get('/:mappingId', async (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;
    
    // Log click
    dbService.logClick({
      mappingId,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer']
    });
    
    // Find active option
    const option = dbService.getActiveOption(mappingId);
    
    let targetUrl: string;
    
    if (option) {
      targetUrl = addUTM(wrapAffiliate(option.url));
    } else {
      // Fallback to category
      targetUrl = addUTM(wrapAffiliate(FALLBACK_URL));
    }
    
    res.redirect(302, targetUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
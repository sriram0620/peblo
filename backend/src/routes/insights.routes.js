import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as insightsService from '../services/insights.service.js';

const router = Router();

/**
 * GET /api/insights
 * Get productivity insights for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const insights = await insightsService.getInsights(req.user.id);
    res.json(insights);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;

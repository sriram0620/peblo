import { Router } from 'express';
import * as shareService from '../services/share.service.js';

const router = Router();

/**
 * GET /api/shared/:shareId
 * Get a publicly shared note (no authentication required)
 */
router.get('/:shareId', async (req, res) => {
  try {
    const note = await shareService.getSharedNote(req.params.shareId);
    res.json(note);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;

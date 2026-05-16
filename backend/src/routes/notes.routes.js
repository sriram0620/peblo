import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as notesService from '../services/notes.service.js';
import * as aiService from '../services/ai.service.js';
import * as shareService from '../services/share.service.js';

const router = Router();

/**
 * GET /api/notes
 * List all notes for the authenticated user
 * Query params: search, tags, sort, archived
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, tags, sort, archived } = req.query;
    const notes = await notesService.getNotes(req.user.id, { search, tags, sort, archived });
    res.json(notes);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * GET /api/notes/tags
 * Get all tags for the current user
 */
router.get('/tags', authenticate, async (req, res) => {
  try {
    const tags = await notesService.getUserTags(req.user.id);
    res.json(tags);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const note = await notesService.createNote(req.user.id, { title, content, tags });
    res.status(201).json(note);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * GET /api/notes/:id
 * Get a single note
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await notesService.getNoteById(req.params.id, req.user.id);
    res.json(note);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * PATCH /api/notes/:id
 * Update a note (supports auto-save)
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const note = await notesService.updateNote(req.params.id, req.user.id, req.body);
    res.json(note);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await notesService.deleteNote(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * PATCH /api/notes/:id/archive
 * Toggle archive status
 */
router.patch('/:id/archive', authenticate, async (req, res) => {
  try {
    const note = await notesService.toggleArchive(req.params.id, req.user.id);
    res.json(note);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/notes/:id/generate-summary
 * Generate AI summary for a note
 */
router.post('/:id/generate-summary', authenticate, async (req, res) => {
  try {
    const result = await aiService.generateNoteSummary(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/notes/:id/share
 * Toggle public sharing for a note
 */
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const result = await shareService.toggleShare(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;

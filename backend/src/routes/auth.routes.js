import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as authService from '../services/auth.service.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user account
 */
router.post(
  '/signup',
  validate({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
  }),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const result = await authService.signup({ name, email, password });
      res.status(201).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
router.post(
  '/login',
  validate({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  }),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;

import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', validateBody(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.getCurrentUser(req, res, next));

export default router;

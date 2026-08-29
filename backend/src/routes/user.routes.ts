import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Protect user management with Admin check
router.use(authenticateToken);

router.get('/', (req, res, next) => userController.getAllUsers(req, res, next));
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));
router.put('/:id/role', requireRole('ADMIN'), (req, res, next) => userController.updateUserRole(req, res, next));
router.delete('/:id', requireRole('ADMIN'), (req, res, next) => userController.deleteUser(req, res, next));

export default router;

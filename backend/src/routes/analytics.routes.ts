import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/overview', (req, res, next) => analyticsController.getDashboardOverview(req, res, next));
router.get('/pipeline', (req, res, next) => analyticsController.getPipelineAnalytics(req, res, next));

export default router;

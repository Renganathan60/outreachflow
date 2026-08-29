import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import leadRoutes from './lead.routes.js';
import campaignRoutes from './campaign.routes.js';
import analyticsRoutes from './analytics.routes.js';
import webhookRoutes from './webhook.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/leads', leadRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'OutreachFlow Backend API'
  });
});

export default router;

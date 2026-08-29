import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { activityController } from '../controllers/activity.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { createLeadSchema, updateLeadSchema, leadQuerySchema } from '../validators/lead.validator.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validateQuery(leadQuerySchema), (req, res, next) => leadController.getLeads(req, res, next));
router.get('/:id', (req, res, next) => leadController.getLeadById(req, res, next));
router.post('/', validateBody(createLeadSchema), (req, res, next) => leadController.createLead(req, res, next));
router.put('/:id', validateBody(updateLeadSchema), (req, res, next) => leadController.updateLead(req, res, next));
router.delete('/:id', (req, res, next) => leadController.deleteLead(req, res, next));

// Unique Feature #1: Smart Lead Prioritization Explainability
router.get('/:id/priority', (req, res, next) => leadController.getScoreExplanation(req, res, next));

// Verification Trigger
router.post('/:id/verify', (req, res, next) => leadController.verifyLeadEmail(req, res, next));

// Send Cadence Email (Day 0 / Outreach)
router.post('/:id/send-email', (req, res, next) => leadController.sendCadenceEmail(req, res, next));

// Lead Activities & Simulator
router.get('/:id/activities', (req, res, next) => activityController.getLeadActivities(req, res, next));
router.post('/:id/activities', (req, res, next) => activityController.logActivity(req, res, next));

export default router;

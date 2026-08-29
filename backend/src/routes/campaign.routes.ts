import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller.js';
import { sequenceController } from '../controllers/sequence.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createCampaignSchema, updateCampaignSchema, enrollLeadsSchema } from '../validators/campaign.validator.js';
import { addStepSchema, updateStepSchema } from '../validators/sequence.validator.js';

const router = Router();

router.use(authenticateToken);

// Campaign CRUD
router.get('/', (req, res, next) => campaignController.getCampaigns(req, res, next));
router.get('/:id', (req, res, next) => campaignController.getCampaignById(req, res, next));
router.post('/', validateBody(createCampaignSchema), (req, res, next) => campaignController.createCampaign(req, res, next));
router.put('/:id', validateBody(updateCampaignSchema), (req, res, next) => campaignController.updateCampaign(req, res, next));
router.delete('/:id', (req, res, next) => campaignController.deleteCampaign(req, res, next));

// Campaign Analytics
router.get('/:id/analytics', (req, res, next) => campaignController.getCampaignAnalytics(req, res, next));

// Campaign Leads & Unique Feature #3: Campaign Guard
router.get('/:id/leads', (req, res, next) => campaignController.getCampaignLeads(req, res, next));
router.post('/:id/leads/preview-guard', validateBody(enrollLeadsSchema), (req, res, next) => campaignController.previewGuard(req, res, next));
router.post('/:id/leads', validateBody(enrollLeadsSchema), (req, res, next) => campaignController.enrollLeads(req, res, next));
router.post('/:id/leads/:leadId/send-email', (req, res, next) => campaignController.sendLeadEmail(req, res, next));
router.delete('/:id/leads/:leadId', (req, res, next) => campaignController.removeLead(req, res, next));

// Campaign Sequences & Cadence Steps
router.get('/:campaignId/sequences', (req, res, next) => sequenceController.getSequence(req, res, next));
router.post('/:campaignId/sequences/steps', validateBody(addStepSchema), (req, res, next) => sequenceController.addStep(req, res, next));
router.put('/:campaignId/sequences/steps/:stepId', validateBody(updateStepSchema), (req, res, next) => sequenceController.updateStep(req, res, next));
router.delete('/:campaignId/sequences/steps/:stepId', (req, res, next) => sequenceController.deleteStep(req, res, next));

export default router;

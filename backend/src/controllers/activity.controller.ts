import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class ActivityController {
  async getLeadActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const activities = await activityService.getLeadActivities(id);
      return ResponseFormatter.success(res, activities, 'Lead activities retrieved');
    } catch (error) {
      next(error);
    }
  }

  async logActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const activity = await activityService.logActivity({
        leadId: id,
        campaignId: req.body.campaignId || null,
        userId: req.user?.id || null,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description || null,
        metadata: req.body.metadata || null,
        autoUpdateLeadStatus: req.body.autoUpdateLeadStatus
      });
      return ResponseFormatter.created(res, activity, 'Activity logged and lead status/score refreshed');
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();

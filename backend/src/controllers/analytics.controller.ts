import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class AnalyticsController {
  async getDashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await analyticsService.getDashboardOverview();
      return ResponseFormatter.success(res, overview, 'Dashboard analytics overview retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPipelineAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = await analyticsService.getPipelineAnalytics();
      return ResponseFormatter.success(res, pipeline, 'Pipeline analytics retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();

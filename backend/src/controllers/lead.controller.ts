import { Request, Response, NextFunction } from 'express';
import { leadService } from '../services/lead.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class LeadController {
  async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leadService.getLeads(req.query as any);
      return ResponseFormatter.success(res, result.items, 'Leads retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.getLeadById(req.params.id as string);
      return ResponseFormatter.success(res, lead, 'Lead retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user?.id || 'system';
      const lead = await leadService.createLead({
        ...req.body,
        createdBy
      });
      return ResponseFormatter.created(res, lead, 'Lead created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateLead(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.updateLead(req.params.id as string, req.body, req.user?.id);
      return ResponseFormatter.success(res, lead, 'Lead updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteLead(req: Request, res: Response, next: NextFunction) {
    try {
      await leadService.deleteLead(req.params.id as string);
      return ResponseFormatter.success(res, null, 'Lead deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getScoreExplanation(req: Request, res: Response, next: NextFunction) {
    try {
      const explanation = await leadService.getLeadScoreExplanation(req.params.id as string);
      return ResponseFormatter.success(res, explanation, 'Lead score explanation calculated');
    } catch (error) {
      next(error);
    }
  }

  async verifyLeadEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.verifyLeadEmail(req.params.id as string);
      return ResponseFormatter.success(res, lead, 'Lead email verification completed');
    } catch (error) {
      next(error);
    }
  }

  async sendCadenceEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leadService.sendCadenceEmail(
        req.params.id as string,
        req.body?.campaignId,
        req.user?.id
      );
      return ResponseFormatter.success(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();

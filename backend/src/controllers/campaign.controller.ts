import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaign.service.js';
import { leadService } from '../services/lead.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class CampaignController {
  async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const campaigns = await campaignService.getCampaigns();
      return ResponseFormatter.success(res, campaigns, 'Campaigns retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id as string);
      return ResponseFormatter.success(res, campaign, 'Campaign retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user?.id || 'system';
      const campaign = await campaignService.createCampaign({
        ...req.body,
        createdBy
      });
      return ResponseFormatter.created(res, campaign, 'Campaign created');
    } catch (error) {
      next(error);
    }
  }

  async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.updateCampaign(req.params.id as string, req.body);
      return ResponseFormatter.success(res, campaign, 'Campaign updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      await campaignService.deleteCampaign(req.params.id as string);
      return ResponseFormatter.success(res, null, 'Campaign deleted');
    } catch (error) {
      next(error);
    }
  }

  async getCampaignLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const leads = await campaignService.getCampaignLeads(req.params.id as string);
      return ResponseFormatter.success(res, leads, 'Campaign leads retrieved');
    } catch (error) {
      next(error);
    }
  }

  async enrollLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await campaignService.enrollLeadsWithGuard(
        req.params.id as string,
        req.body.leadIds,
        req.user?.id
      );
      return ResponseFormatter.success(res, result, 'Campaign Guard evaluation and enrollment finished');
    } catch (error) {
      next(error);
    }
  }

  async previewGuard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await campaignService.previewCampaignGuard(req.params.id as string, req.body.leadIds);
      return ResponseFormatter.success(res, result, 'Campaign Guard dry-run preview complete');
    } catch (error) {
      next(error);
    }
  }

  async removeLead(req: Request, res: Response, next: NextFunction) {
    try {
      await campaignService.removeLeadFromCampaign(req.params.id as string, req.params.leadId as string, req.user?.id);
      return ResponseFormatter.success(res, null, 'Lead removed from campaign');
    } catch (error) {
      next(error);
    }
  }

  async getCampaignAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await campaignService.getCampaignAnalytics(req.params.id as string);
      return ResponseFormatter.success(res, stats, 'Campaign analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async sendLeadEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leadService.sendCadenceEmail(
        req.params.leadId as string,
        req.params.id as string,
        req.user?.id
      );
      return ResponseFormatter.success(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const campaignController = new CampaignController();

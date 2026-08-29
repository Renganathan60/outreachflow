import { Request, Response, NextFunction } from 'express';
import { sequenceService } from '../services/sequence.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class SequenceController {
  async getSequence(req: Request, res: Response, next: NextFunction) {
    try {
      const sequence = await sequenceService.getSequenceByCampaignId(req.params.campaignId as string);
      return ResponseFormatter.success(res, sequence, 'Sequence retrieved');
    } catch (error) {
      next(error);
    }
  }

  async addStep(req: Request, res: Response, next: NextFunction) {
    try {
      const sequence = await sequenceService.addStep(req.params.campaignId as string, req.body);
      return ResponseFormatter.created(res, sequence, 'Sequence step added');
    } catch (error) {
      next(error);
    }
  }

  async updateStep(req: Request, res: Response, next: NextFunction) {
    try {
      const sequence = await sequenceService.updateStep(
        req.params.stepId as string,
        req.params.campaignId as string,
        req.body
      );
      return ResponseFormatter.success(res, sequence, 'Sequence step updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteStep(req: Request, res: Response, next: NextFunction) {
    try {
      const sequence = await sequenceService.deleteStep(
        req.params.stepId as string,
        req.params.campaignId as string
      );
      return ResponseFormatter.success(res, sequence, 'Sequence step deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const sequenceController = new SequenceController();

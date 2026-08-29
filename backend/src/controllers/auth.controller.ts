import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return ResponseFormatter.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return ResponseFormatter.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      return ResponseFormatter.success(res, req.user, 'Current user retrieved');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      return ResponseFormatter.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

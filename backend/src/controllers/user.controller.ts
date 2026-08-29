import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { ResponseFormatter } from '../utils/api-response.js';

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      return ResponseFormatter.success(res, users, 'Users retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id as string);
      return ResponseFormatter.success(res, user, 'User retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUserRole(req.params.id as string, req.body.role);
      return ResponseFormatter.success(res, user, 'User role updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.params.id as string);
      return ResponseFormatter.success(res, null, 'User deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

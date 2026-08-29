import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: any;
}

export class ResponseFormatter {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200, meta?: any): Response {
    const response: ApiResponse<T> = {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
      ...(meta && { meta })
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message: string = 'Resource created successfully'): Response {
    return ResponseFormatter.success(res, data, message, 201);
  }

  static error(res: Response, message: string = 'An error occurred', statusCode: number = 500, errors?: any[]): Response {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && errors.length > 0 && { errors })
    };
    return res.status(statusCode).json(response);
  }
}

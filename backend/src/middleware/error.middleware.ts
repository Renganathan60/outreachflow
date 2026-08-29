import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ResponseFormatter } from '../utils/api-response.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return ResponseFormatter.error(res, err.message, err.statusCode, err.errors);
  }

  // Handle MySQL errors gracefully
  if (err.code === 'ER_DUP_ENTRY') {
    return ResponseFormatter.error(res, 'A record with this unique value already exists.', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return ResponseFormatter.error(res, 'Referenced record does not exist.', 400);
  }

  console.error('💥 Unhandled Internal Server Error:', err);

  return ResponseFormatter.error(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message || 'An internal server error occurred.',
    500
  );
}

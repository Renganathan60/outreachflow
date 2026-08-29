import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { NotFoundError } from './utils/errors.js';

export function createApp() {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: true, // Allow frontend dev server and local origin
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use((req, res, next) => {
    next(new NotFoundError(`API Route ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();

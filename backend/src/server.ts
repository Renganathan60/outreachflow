import app from './app.js';
import { config } from './config/env.js';
import { testDbConnection } from './config/db.js';

const PORT = config.port;

async function startServer() {
  console.log('⚡ Starting OutreachFlow API Server...');

  const dbConnected = await testDbConnection();
  if (dbConnected) {
    console.log(`✅ Connected to MySQL database '${config.db.database}' on port ${config.db.port}.`);
  } else {
    console.warn(`⚠️ Warning: Could not connect to MySQL at ${config.db.host}:${config.db.port}. Please ensure MySQL service is running and credentials in .env are correct.`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OutreachFlow Backend Server is running at http://localhost:${PORT}`);
    console.log(`📋 Health check available at http://localhost:${PORT}/api/health`);
  });

  return server;
}

startServer();

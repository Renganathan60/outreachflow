import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('🚀 Running MySQL Database Migrations for OutreachFlow...');
  console.log(`📡 Connecting to MySQL at ${config.db.host}:${config.db.port} as user '${config.db.user}'...`);

  // First connect without database selected to ensure DB exists
  const rootConn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  try {
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database '${config.db.database}' ensured.`);
  } finally {
    await rootConn.end();
  }

  // Connect to the specific database
  const dbConn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await dbConn.query(schemaSql);
    console.log('✅ Schema migration executed successfully.');

    const [tables] = await dbConn.query('SHOW TABLES;');
    console.log('📊 Active tables in database:', tables);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await dbConn.end();
  }
}

// If run directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migrations completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error during migration:', err);
      process.exit(1);
    });
}

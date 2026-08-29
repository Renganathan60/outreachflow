import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from './env.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: config.db.waitForConnections,
      connectionLimit: config.db.connectionLimit,
      queueLimit: config.db.queueLimit,
      enableKeepAlive: config.db.enableKeepAlive,
      keepAliveInitialDelay: config.db.keepAliveInitialDelay
    });
  }
  return pool;
}

/**
 * Execute a parameterized SQL query against the connection pool.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const p = getPool();
  const [results] = await p.execute(sql, params);
  return results as T;
}

/**
 * Execute multiple operations inside an ACID MySQL transaction.
 * Automatically commits on success and rolls back on failure.
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getPool();
  const connection = await p.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Check connectivity to MySQL server
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const p = getPool();
    const [rows] = await p.query('SELECT 1 as isAlive');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error: any) {
    console.error('⚠️ Database Connection Error:', error.message);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

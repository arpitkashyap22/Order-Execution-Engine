import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

/**
 * Get PostgreSQL connection pool
 */
export const getDatabasePool = (): Pool => {
  if (!pool) {
    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      database: process.env.DB_NAME || 'order_execution_engine',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'mysecretpassword',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    pool = new Pool(config);

    pool.on('connect', () => {
      logger.info('PostgreSQL client connected');
    });

    pool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error:', err);
    });
  }

  return pool;
};

/**
 * Close database connection pool
 */
export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL connection pool closed');
  }
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const pool = getDatabasePool();
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};


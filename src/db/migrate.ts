import { getDatabasePool } from '../config/database';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger';

async function runMigration() {
  const pool = getDatabasePool();

  try {
    // Read schema file (works for both compiled JS and TS)
    const currentDir = __dirname || dirname(fileURLToPath(import.meta.url));
    const schemaPath = join(currentDir, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await pool.query(schema);
    logger.info('Database migration completed successfully');

    // Test connection
    const result = await pool.query('SELECT COUNT(*) FROM orders');
    logger.info(`Orders table exists. Current row count: ${result.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();


import dotenv from 'dotenv';
import postgres from 'postgres';
import logger from '../lib/logger.js';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
logger.info('DATABASE_URL loaded:', dbUrl ? 'Yes' : 'No');
if (dbUrl) {
  // Mask password for display
  const masked = dbUrl.replace(/:([^:@]+)@/, ':****@');
  logger.info('Connection string:', masked);
  
  try {
    const sql = postgres(dbUrl, { connect_timeout: 5 });
    logger.info('Attempting connection...');
    const result = await sql`SELECT 1 as result`;
    logger.info('Connection successful!', result);
    await sql.end();
  } catch (err) {
    logger.error('Connection failed:', err.message);
    if (err.code) logger.error('Error code:', err.code);
    if (err.cause) logger.error('Error cause:', err.cause);
  }
} else {
  logger.error('DATABASE_URL is missing from .env');
}

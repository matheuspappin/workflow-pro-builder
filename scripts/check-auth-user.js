import postgres from 'postgres';
import dotenv from 'dotenv';
import logger from '@/lib/logger';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkAuthUser(email) {
  try {
    logger.info(`Checking auth user: ${email}`);
    const results = await sql`
      SELECT id, email, email_confirmed_at, last_sign_in_at, created_at, confirmed_at, banned_until
      FROM auth.users
      WHERE email = ${email}
    `;
    
    if (results.length === 0) {
      logger.info('User not found in auth.users');
    } else {
      logger.debug('User found:', results[0]);
      if (!results[0].email_confirmed_at) {
        logger.warn('⚠️ EMAIL NOT CONFIRMED!');
      }
      if (results[0].banned_until) {
        logger.warn('⚠️ USER IS BANNED until:', results[0].banned_until);
      }
    }
  } catch (error) {
    logger.error('Error querying database:', error);
  } finally {
    await sql.end();
  }
}

const email = process.argv[2] || process.env.CHECK_AUTH_EMAIL || 'checkuser@example.com';
checkAuthUser(email);

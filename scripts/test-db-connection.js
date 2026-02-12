import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL loaded:', dbUrl ? 'Yes' : 'No');
if (dbUrl) {
  // Mask password for display
  const masked = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('Connection string:', masked);
  
  try {
    const sql = postgres(dbUrl, { connect_timeout: 5 });
    console.log('Attempting connection...');
    const result = await sql`SELECT 1 as result`;
    console.log('Connection successful!', result);
    await sql.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.code) console.error('Error code:', err.code);
    if (err.cause) console.error('Error cause:', err.cause);
  }
} else {
  console.error('DATABASE_URL is missing from .env');
}

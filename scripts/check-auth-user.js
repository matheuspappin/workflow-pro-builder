import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkAuthUser(email) {
  try {
    console.log(`Checking auth user: ${email}`);
    const results = await sql`
      SELECT id, email, email_confirmed_at, last_sign_in_at, created_at, confirmed_at, banned_until
      FROM auth.users
      WHERE email = ${email}
    `;
    
    if (results.length === 0) {
      console.log('User not found in auth.users');
    } else {
      console.log('User found:', results[0]);
      if (!results[0].email_confirmed_at) {
        console.warn('⚠️ EMAIL NOT CONFIRMED!');
      }
      if (results[0].banned_until) {
        console.warn('⚠️ USER IS BANNED until:', results[0].banned_until);
      }
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await sql.end();
  }
}

const email = process.argv[2] || 'vendaslachef@gmail.com';
checkAuthUser(email);

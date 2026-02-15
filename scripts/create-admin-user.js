import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '@/lib/logger';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'default_admin_password_CHANGE_ME'; // Default password

  logger.info(`Creating user ${email}...`);

  // 1. Create user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    logger.error('Error creating auth user:', authError.message);
    // If user already exists, try to get their ID
    if (authError.message.includes('already has been registered')) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users.find(u => u.email === email);
        if (existing) {
            logger.info('User already exists, using existing ID:', existing.id);
            await ensureProfile(existing.id, email);
        }
    }
    // Do not return here, so ensureProfile is called
  }

  if (authUser?.user) {
    logger.info('Auth user created:', authUser.user.id);
    await ensureProfile(authUser.user.id, email);
  }
}

async function ensureProfile(userId, email) {
  // 2. Create profile in users_internal
  // First check if studio exists
  let studioId;
  const { data: studios } = await supabase.from('studios').select('id').limit(1);
  
  if (studios && studios.length > 0) {
    studioId = studios[0].id;
  } else {
    // Create a default studio
    logger.info('Creating default studio...');
    const { data: newStudio, error: studioError } = await supabase.from('studios').insert({
        name: 'Master Studio',
        slug: 'master-studio',
        plan: 'enterprise' // Assuming enterprise plan for super admin
    }).select().single();
    
    if (studioError) {
        logger.error('Error creating studio:', studioError.message);
        return;
    }
    studioId = newStudio.id;
  }

  logger.info('Creating/Updating profile in users_internal...');
  const { error: profileError } = await supabase.from('users_internal').upsert({
    id: userId,
    email: email,
    name: 'Super Admin',
    role: 'super_admin',
    studio_id: studioId,
    status: 'active'
  });

  if (profileError) {
    logger.error('Error creating profile:', profileError.message);
  } else {
    logger.info('✅ Admin user and profile configured successfully!');
    logger.info(`Login with: ${email} / (use ADMIN_PASSWORD env var)`);
  }
}

createAdminUser();

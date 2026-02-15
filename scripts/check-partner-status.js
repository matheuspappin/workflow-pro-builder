import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import logger from '@/lib/logger';
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const targetEmail = process.argv[2] || process.env.CHECK_PARTNER_EMAIL || 'teste@afiliado.com.br';

async function checkPartner() {
  logger.info(`🔍 Verificando usuário e parceiro para: ${targetEmail}...`);

  // 1. Buscar usuário por email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    logger.error('❌ Erro ao listar usuários:', listError);
    return;
  }

  const user = users.find(u => u.email === targetEmail);

  if (!user) {
    logger.warn(`❌ Usuário ${targetEmail} NÃO encontrado em auth.users.`);
  } else {
    logger.info(`✅ Usuário encontrado: ${user.id} (${user.email})`);
    
    // 2. Buscar parceiro pelo user_id
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError) {
      logger.error('❌ Erro ao buscar parceiro:', partnerError);
    } else if (!partner) {
      logger.warn('❌ Registro na tabela PARTNERS não encontrado para este usuário.');
    } else {
      logger.info('✅ Registro encontrado em partners:', partner);
    }
  }

  // 3. Listar todos os parceiros para debug
  logger.info('\n📋 Listando todos os parceiros (limit 10):');
  const { data: allPartners } = await supabase.from('partners').select('*').limit(10);
  if (allPartners) {
    allPartners.forEach(p => logger.debug('Partner:', p));
  }
}

checkPartner();

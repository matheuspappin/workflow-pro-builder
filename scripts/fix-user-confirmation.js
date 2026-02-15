const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const logger = require('../lib/logger').default;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUser(email) {
  logger.info(`🔍 Buscando usuário: ${email}`);
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    logger.error('❌ Erro ao listar usuários:', error);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    logger.warn(`❌ Usuário ${email} não encontrado.`);
    return;
  }
  
  logger.info(`✅ Usuário encontrado: ${user.id}`);
  logger.info(`📊 Status: ${user.email_confirmed_at ? 'Confirmado' : 'NÃO confirmado'}`);
  
  if (!user.email_confirmed_at) {
    logger.info(`⏳ Confirmando e-mail...`);
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      logger.error('❌ Erro ao confirmar usuário:', updateError);
    } else {
      logger.info('✅ Usuário confirmado com sucesso!');
    }
  } else {
    logger.info('✨ Usuário já está confirmado.');
  }

  // Verificar se tem perfil
  const { data: partner } = await supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle();
  logger.info(`👤 Perfil Partner:`, partner ? 'Presente' : 'AUSENTE');
}

const targetEmail = process.env.FIX_USER_CONFIRMATION_EMAIL || 'teste@afiliado.com.br';
confirmUser(targetEmail);

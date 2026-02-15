const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const logger = require('../lib/logger').default;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Erro: Credenciais do Supabase não encontradas no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSystemPlans() {
  logger.info('🚀 Workflow AI - Configurando system_plans...');

  try {
    // Como não podemos rodar SQL bruto facilmente via client do Supabase (sem extensões/RPC),
    // vamos tentar inserir os dados. Se a tabela não existir, o erro confirmará.
    
    const plans = [
      {
        id: 'gratuito',
        name: 'Gratuito',
        price: 0,
        description: 'Ideal para começar sua jornada',
        features: ['Até 10 alunos', '1 Professor', 'Gestão básica'],
        max_students: 10,
        max_teachers: 1,
        modules: {
          dashboard: true,
          students: true,
          classes: true,
          financial: true,
          whatsapp: false,
          ai_chat: false,
          pos: false,
          inventory: false,
          gamification: false,
          leads: false,
          scanner: false,
          marketplace: false,
          erp: false,
          multi_unit: false
        },
        is_popular: false,
        status: 'active'
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 297.00,
        description: 'Tudo o que você precisa para crescer',
        features: ['Até 100 alunos', '5 Professores', 'WhatsApp Business', 'Gestão Financeira'],
        max_students: 100,
        max_teachers: 5,
        modules: {
          dashboard: true,
          students: true,
          classes: true,
          financial: true,
          whatsapp: true,
          ai_chat: false,
          pos: true,
          inventory: true,
          gamification: false,
          leads: true,
          scanner: true,
          marketplace: false,
          erp: false,
          multi_unit: false
        },
        is_popular: true,
        status: 'active'
      },
      {
        id: 'pro-plus',
        name: 'Pro+',
        price: 197.00,
        description: 'O melhor custo-benefício para estúdios médios',
        features: ['Alunos ilimitados', 'Professores ilimitados', 'WhatsApp + IA', 'Financeiro Avançado'],
        max_students: 1000,
        max_teachers: 1000,
        modules: {
          dashboard: true,
          students: true,
          classes: true,
          financial: true,
          whatsapp: true,
          ai_chat: true,
          pos: true,
          inventory: true,
          gamification: true,
          leads: true,
          scanner: true,
          marketplace: true,
          erp: false,
          multi_unit: false
        },
        is_popular: false,
        status: 'active'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 0,
        description: 'Escalabilidade e suporte total',
        features: ['Tudo ilimitado', 'Multi-unidades', 'Suporte VIP', 'IA Customizada'],
        max_students: 10000,
        max_teachers: 10000,
        modules: {
          dashboard: true,
          students: true,
          classes: true,
          financial: true,
          whatsapp: true,
          ai_chat: true,
          pos: true,
          inventory: true,
          gamification: true,
          leads: true,
          scanner: true,
          marketplace: true,
          erp: true,
          multi_unit: true
        },
        is_popular: false,
        status: 'active'
      }
    ];

    logger.info('📦 Tentando inserir planos...');
    const { error } = await supabase.from('system_plans').upsert(plans);

    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message.includes('not find the table')) {
        logger.error('❌ Tabela "system_plans" não existe no banco de dados.');
        logger.info('📝 DICA: Execute o arquivo database/system_plans.sql no SQL Editor do Supabase.');
      } else {
        logger.error('❌ Erro inesperado:', error);
      }
    } else {
      logger.info('✅ Planos inseridos/atualizados com sucesso!');
    }

  } catch (err) {
    logger.error('💥 Erro fatal:', err);
  }
}

setupSystemPlans();

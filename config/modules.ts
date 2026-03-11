export const MODULE_DEFINITIONS = {
  dashboard: { 
    label: 'Dashboard', 
    default: true,
    features: [
      'Visão geral e métricas',
      'Acompanhamento de performance'
    ]
  },
  students: { 
    label: 'Gestão de Alunos/Clientes', 
    default: false,
    features: [
      'Cadastro e perfil de alunos',
      'Histórico de aulas e pagamentos',
      'Comunicação direta com alunos'
    ]
  },
  classes: { 
    label: 'Gestão de Aulas/Serviços', 
    default: false,
    features: [
      'Criação e agendamento de aulas',
      'Controle de frequência',
      'Gestão de instrutores'
    ]
  },
  financial: { 
    label: 'Financeiro', 
    default: false,
    features: [
      'Controle de mensalidades e pagamentos',
      'Relatórios financeiros',
      'Gestão de despesas'
    ]
  },
  whatsapp: { 
    label: 'Integração WhatsApp', 
    default: false,
    features: [
      'Envio de mensagens automáticas',
      'Atendimento via Chatbot',
      'Notificações personalizadas'
    ]
  },
  ai_chat: { 
    label: 'Chat IA', 
    default: false,
    features: [
      'Assistente virtual inteligente',
      'Respostas automatizadas',
      'Personalização de atendimento'
    ]
  },
  pos: { 
    label: 'Ponto de Venda (POS)', 
    default: false,
    features: [
      'Venda de produtos e serviços',
      'Controle de caixa',
      'Integração com estoque'
    ]
  },
  inventory: { 
    label: 'Controle de Estoque', 
    default: false,
    features: [
      'Gestão de produtos e suprimentos',
      'Alertas de estoque mínimo',
      'Relatórios de movimentação'
    ]
  },
  gamification: { 
    label: 'Gamificação', 
    default: false,
    features: [
      'Pontuação e ranking de alunos',
      'Conquistas e recompensas',
      'Engajamento e motivação'
    ]
  },
  leads: { 
    label: 'Funil de Vendas (CRM)', 
    default: false,
    features: [
      'Captura e gestão de leads',
      'Acompanhamento de vendas',
      'Automação de marketing'
    ]
  },
  scanner: { 
    label: 'Scanner de Entrada', 
    default: false,
    features: [
      'Controle de acesso',
      'Registro de presença',
      'Integração com catracas'
    ]
  },
  marketplace: { 
    label: 'Marketplace/Loja Virtual', 
    default: false,
    features: [
      'Venda de produtos online',
      'Gestão de pedidos',
      'Vitrine personalizada'
    ]
  },
  erp: { 
    label: 'ERP Enterprise', 
    default: false,
    features: [
      'Gestão completa da empresa',
      'Módulos personalizados',
      'Suporte premium'
    ]
  },
  multi_unit: { 
    label: 'Gestão Multi-unidade', 
    default: false,
    features: [
      'Gerenciamento de múltiplas filiais',
      'Centralização de dados',
      'Relatórios consolidados'
    ]
  },
  service_orders: {
    label: 'Ordens de Serviço (OS)',
    default: false,
    features: [
      'Controle de consertos e manutenções',
      'Assinatura digital do cliente',
      'Histórico de estados da OS'
    ]
  },
  fiscal: {
    label: 'Emissor Fiscal (NF-e)',
    default: false,
    features: [
      'Emissão de Notas Fiscais Eletrônicas',
      'Integração direta com SEFAZ',
      'Certificado digital A1 por tenant'
    ]
  }
} as const;

export type ModuleKey = keyof typeof MODULE_DEFINITIONS;

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  enabled: boolean;
}

// Helper para garantir que o objeto de módulos tenha todas as chaves
export function normalizeModules(modules: any): Record<ModuleKey, boolean> {
  const normalized: any = {};
  Object.keys(MODULE_DEFINITIONS).forEach((k) => {
    const key = k as ModuleKey;
    // Se existir no banco, usa; senão usa o default
    normalized[key] = modules?.[key] ?? MODULE_DEFINITIONS[key].default;
  });
  return normalized;
}

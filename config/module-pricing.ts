
import { ModuleKey } from './modules';

export interface ModulePricing {
  price: number;
  benefits: string[];
  description: string;
  icon?: string;
}

export const MODULE_PRICING: Record<ModuleKey, ModulePricing> = {
  dashboard: {
    price: 0,
    benefits: ['Visão geral do negócio', 'Indicadores principais', 'Atalhos rápidos'],
    description: 'Painel principal de controle.',
  },
  students: {
    price: 50,
    benefits: ['Cadastro ilimitado de clientes', 'Histórico completo', 'Ficha de anamnese'],
    description: 'Gestão completa da sua base de clientes.',
  },
  classes: {
    price: 50,
    benefits: ['Agendamento de aulas/serviços', 'Controle de presença', 'Grade horária'],
    description: 'Organize sua agenda e serviços.',
  },
  financial: {
    price: 100,
    benefits: [
      'Controle de fluxo de caixa',
      'Gestão de mensalidades/pacotes',
      'Relatórios financeiros detalhados',
      'Emissão de boletos/cobranças (integrado)'
    ],
    description: 'Tenha o controle total das finanças do seu negócio.',
  },
  whatsapp: {
    price: 150,
    benefits: [
      'Envio automático de lembretes',
      'Campanhas de marketing em massa',
      'Atendimento automatizado (Chatbot)',
      'Confirmação de agendamentos'
    ],
    description: 'Automatize sua comunicação e venda mais pelo WhatsApp.',
  },
  ai_chat: {
    price: 200,
    benefits: [
      'Assistente virtual 24/7',
      'Análise de dados avançada',
      'Respostas automáticas inteligentes',
      'Insights de negócio'
    ],
    description: 'Inteligência Artificial para impulsionar seu negócio.',
  },
  pos: {
    price: 80,
    benefits: [
      'Frente de caixa rápido',
      'Emissão de cupom não fiscal',
      'Controle de caixa diário',
      'Venda de produtos/serviços'
    ],
    description: 'Ponto de venda ágil para o balcão.',
  },
  inventory: {
    price: 60,
    benefits: [
      'Controle de estoque de produtos',
      'Alerta de estoque baixo',
      'Fornecedores e compras',
      'Movimentação de entrada/saída'
    ],
    description: 'Nunca mais perca vendas por falta de produto.',
  },
  gamification: {
    price: 50,
    benefits: [
      'Sistema de pontos e recompensas',
      'Ranking de clientes',
      'Engajamento e retenção',
      'Desafios e conquistas'
    ],
    description: 'Fidelize seus clientes tornando a experiência divertida.',
  },
  leads: {
    price: 90,
    benefits: [
      'Funil de vendas (Kanban)',
      'Gestão de oportunidades',
      'Origem e conversão de leads',
      'Follow-up automático'
    ],
    description: 'Transforme interessados em clientes pagantes.',
  },
  scanner: {
    price: 40,
    benefits: [
      'Check-in via QR Code',
      'Controle de acesso na portaria',
      'Registro automático de presença',
      'Segurança e agilidade'
    ],
    description: 'Agilize a entrada e saída do seu estabelecimento.',
  },
  marketplace: {
    price: 120,
    benefits: [
      'Loja virtual integrada',
      'Venda online de produtos/serviços',
      'Pagamento online seguro',
      'Vitrine digital'
    ],
    description: 'Sua loja online aberta 24 horas por dia.',
  },
  erp: {
    price: 300,
    benefits: [
      'Gestão multi-unidades/franquias',
      'Relatórios consolidados',
      'Controle fiscal e contábil',
      'Permissões avançadas'
    ],
    description: 'Solução completa para grandes operações.',
  },
  multi_unit: {
    price: 150,
    benefits: [
      'Gerenciamento de múltiplas filiais',
      'Centralização de dados',
      'Relatórios por unidade'
    ],
    description: 'Gestão Multi-unidade.',
  },
  service_orders: {
    price: 80,
    benefits: [
      'Controle de consertos e manutenções',
      'Assinatura digital do cliente',
      'Rastreabilidade completa'
    ],
    description: 'Ordens de Serviço (OS).',
  },
  fiscal: {
    price: 49.90,
    benefits: [
      'Emissão de Notas Fiscais Eletrônicas',
      'Integração direta com SEFAZ',
      'Certificado digital A1 por tenant'
    ],
    description: 'Emissor Fiscal (NF-e) via SEFAZ.',
  },
};

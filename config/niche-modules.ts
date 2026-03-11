import { NicheType } from './niche-dictionary';

export type ModuleConfig = {
  dashboard: boolean;
  students: boolean;
  classes: boolean;
  financial: boolean;
  pos: boolean;
  inventory: boolean;
  whatsapp: boolean;
  ai_chat: boolean;
  scanner: boolean;
  marketplace: boolean;
  leads: boolean;
  gamification: boolean;
  service_orders: boolean;
  erp: boolean;
  multi_unit: boolean;
  fiscal: boolean;
  satellite_monitor?: boolean;
};

const defaultModules: ModuleConfig = {
  dashboard: true,
  students: true,
  classes: false,
  financial: true,
  pos: false,
  inventory: false,
  whatsapp: false, 
  ai_chat: false,  
  scanner: false,
  marketplace: false,
  leads: false,    
  gamification: false,
  service_orders: false,
  erp: false,
  multi_unit: false,
  fiscal: false,
  satellite_monitor: false,
};

// Grupo A: Aulas/Turmas
const classBasedNiches: NicheType[] = [
  'dance', 'gym', 'pilates', 'yoga', 'crossfit', 'swim_school', 'personal', 
  'beach_tennis', 'music_school', 'language_school', 'art_studio', 
  'cooking_school', 'photography', 'tutoring', 'driving_school', 
  'sports_center', 'martial_arts'
];

// Grupo B: Consultas/Agendamentos Individuais (Usam Classes como Agenda ou Service Orders)
// Vamos priorizar Service Orders para fluxos mais complexos de serviço, e Classes para agendamento simples
const appointmentBasedNiches: NicheType[] = [
  'dentist', 'clinic', 'beauty', 'aesthetics', 'barber', 'spa', 'physio', 
  'nutrition', 'podiatry', 'tanning', 'vet', 'clinic_vet', 'psychology', 
  'law', 'consulting', 'marketing_agency', 'dev_studio', 'interior_design', 
  'real_estate', 'insurance', 'travel_agency', 'coworking', 'tattoo',
  'pet_shop', 'dog_daycare', 'pet_hotel', 'daycare', 'elderly_care',
  'photographer', 'event_planning'
];

// Grupo C: Serviços Técnicos/Manutenção/Ordens de Serviço (Forte uso de OS)
const serviceOrderBasedNiches: NicheType[] = [
  'auto_detail', 'mechanic', 'tech_repair', 'plumbing', 'electrician', 
  'construction', 'landscaping', 'tailoring', 'cleaning', 'car_wash', 
  'party_venue', 'logistics', 'fire_protection', 'environmental_compliance'
];

export const monetaryBasedNiches: NicheType[] = [
  'dance',
  'auto_detail', 'mechanic', 'tech_repair', 'car_wash', 'dentist', 'clinic', 
  'vet', 'clinic_vet', 'law', 'marketing_agency', 'dev_studio', 'real_estate', 
  'insurance', 'consulting', 'plumbing', 'electrician', 'construction', 
  'logistics', 'cleaning', 'interior_design', 'photographer', 'event_planning',
  'travel_agency', 'tailoring', 'tattoo', 'barista', 'confectionery', 'brewery',
  'wine_club', 'barber', 'beauty', 'aesthetics', 'spa', 'tanning', 'physio',
  'nutrition', 'podiatry', 'pet_shop', 'psychology', 'pet_hotel', 'personal',
  'art_studio', 'cooking_school', 'tutoring', 'daycare', 'elderly_care',
  'driving_school', 'party_venue', 'coworking', 'fire_protection', 'environmental_compliance'
];

export type BusinessConcept = {
  hiddenModules: string[];
  priorityModules: string[];
  sidebarOverrides?: Record<string, string>;
};

export const NICHE_CONCEPTS: Record<string, BusinessConcept> = {
  // Padroes para nichos baseados em Educação/Fitness (CREDIT)
  DEFAULT_CREDIT: {
    hiddenModules: [],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
  },
  // Padroes para nichos baseados em Serviços/Ordens (MONETARY)
  DEFAULT_MONETARY: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'service-orders', 'students', 'financial'],
    sidebarOverrides: {
      'scanner': 'Scanner de Entrada',
    }
  },
  DEFAULT_GENERIC: {
    hiddenModules: [],
    priorityModules: ['dashboard', 'classes', 'students', 'financial', 'service-orders'],
    sidebarOverrides: {
      'scanner': 'Scanner',
      'classes': 'Agenda',
      'teachers': 'Profissionais',
      'students': 'Clientes',
      'service-orders': 'Ordens de Serviço',
    }
  },
  // Ajustes específicos por nicho
  dance: {
    hiddenModules: [],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Turmas e Aulas',
      'teachers': 'Professores',
    }
  },
  pilates: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Horários',
      'teachers': 'Instrutores',
      'students': 'Alunos/Clientes',
    }
  },
  yoga: {
    hiddenModules: ['gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Práticas/Aulas',
      'teachers': 'Instrutores',
      'students': 'Praticantes',
    }
  },
  beauty: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Procedimentos',
      'teachers': 'Profissionais/Esteticistas',
      'service-orders': 'Ordens de Serviço',
    }
  },
  barber: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Cortes',
      'teachers': 'Barbeiros',
    }
  },
  auto_detail: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'service-orders', 'pos', 'inventory'],
    sidebarOverrides: {
      'scanner': 'Check-in de Veículos',
      'service-orders': 'Serviços/OS',
      'students': 'Clientes (Proprietários)',
    }
  },
  mechanic: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'service-orders', 'inventory', 'financial'],
    sidebarOverrides: {
      'scanner': 'Entrada de Veículos',
      'service-orders': 'Ordens de Serviço',
    }
  },
  event_planning: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'service-orders', 'financial', 'students'],
    sidebarOverrides: {
      'service-orders': 'Eventos/Cronogramas',
      'students': 'Contratantes',
      'classes': 'Agenda de Visitas'
    }
  },
  interior_design: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'service-orders', 'students', 'financial'],
    sidebarOverrides: {
      'service-orders': 'Projetos',
      'students': 'Meus Clientes',
      'teachers': 'Designers/Equipe',
      'classes': 'Agenda de Projetos'
    }
  },
  gym: {
    hiddenModules: [],
    priorityModules: ['dashboard', 'scanner', 'classes', 'students'],
    sidebarOverrides: {
      'scanner': 'Catraca/Acesso',
      'classes': 'Grade de Horários',
    }
  },
  aesthetics: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Sessões',
      'teachers': 'Esteticistas',
      'service-orders': 'Procedimentos/OS',
    }
  },
  pet_shop: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Banhos/Tosa',
      'teachers': 'Tosadores/Equipe',
      'students': 'Tutores/Pets',
    }
  },
  vet: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Consultas',
      'teachers': 'Veterinários',
    }
  },
  clinic_vet: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda Médica',
      'teachers': 'Corpo Clínico',
      'students': 'Pacientes (Pets)',
    }
  },
  law: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'service-orders', 'students', 'financial'],
    sidebarOverrides: {
      'service-orders': 'Processos/Casos',
      'students': 'Meus Clientes',
      'classes': 'Agenda de Reuniões',
    }
  },
  dentist: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Consultas',
      'teachers': 'Dentistas/Doutores',
    }
  },
  clinic: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Exames/Consultas',
      'teachers': 'Corpo Médico',
    }
  },
  physio: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Fisioterapia',
      'teachers': 'Fisioterapeutas',
    }
  },
  nutrition: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Consultas',
      'teachers': 'Nutricionistas',
    }
  },
  psychology: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Sessões',
      'teachers': 'Psicólogos',
    }
  },
  car_wash: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'service-orders', 'pos', 'inventory'],
    sidebarOverrides: {
      'scanner': 'Check-in de Veículos',
      'classes': 'Agenda de Lavagens',
      'students': 'Assinantes/Clientes',
    }
  },
  photographer: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'service-orders', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Ensaios',
      'service-orders': 'Ensaios/Sessões',
    }
  },
  art_studio: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Workshops/Aulas',
      'teachers': 'Artistas/Instrutores',
    }
  },
  cooking_school: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Aulas',
      'teachers': 'Chefs/Instrutores',
    }
  },
  tattoo: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Agenda de Sessões',
      'teachers': 'Tatuadores',
    }
  },
  coworking: {
    hiddenModules: ['ao-vivo', 'gamification', 'scanner'],
    priorityModules: ['dashboard', 'classes', 'students', 'financial'],
    sidebarOverrides: {
      'classes': 'Reserva de Espaços',
      'students': 'Membros/Coworkers',
    }
  },
  fire_protection: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'service-orders', 'scanner', 'students'],
    sidebarOverrides: {
      'students': 'Clientes (Condomínios)',
      'service-orders': 'Vistorias / OS',
      'scanner': 'Gate Scanner / Validador',
      'classes': 'Lista de Coletas/Entregas',
      'teachers': 'Técnicos/Engenheiros'
    }
  },
  environmental_compliance: {
    hiddenModules: ['ao-vivo', 'gamification'],
    priorityModules: ['dashboard', 'service-orders', 'scanner', 'students', 'satellite-monitor'],
    sidebarOverrides: {
      'students': 'Clientes (Proprietários Rurais)',
      'service-orders': 'Laudos / Vistorias / OS',
      'scanner': 'Documentos / CAR',
      'classes': 'Agenda de Vistorias',
      'teachers': 'Engenheiros / Técnicos',
      'satellite-monitor': 'Monitor Satélite'
    }
  }
};

export function getBusinessConcept(niche: NicheType): BusinessConcept {
  if (NICHE_CONCEPTS[niche]) return NICHE_CONCEPTS[niche];
  
  if (monetaryBasedNiches.includes(niche)) {
    return NICHE_CONCEPTS.DEFAULT_MONETARY;
  }
  
  // Fallback para um conceito genérico se o nicho não for encontrado
  return NICHE_CONCEPTS.DEFAULT_GENERIC || NICHE_CONCEPTS.DEFAULT_CREDIT;
}

// Grupo D: Varejo/Estoque
const retailBasedNiches: NicheType[] = [
  'pet_shop', 'confectionery', 'brewery', 'wine_club', 'barista', 
  'auto_detail', 'mechanic', 'tech_repair', 'beauty', 'barber', 'spa' // Muitas vezes vendem produtos
];

export function getDefaultModulesForNiche(niche: NicheType): ModuleConfig {
  const modules = { ...defaultModules };

  // 1. Lógica baseada em Grupo Principal
  if (classBasedNiches.includes(niche)) {
    modules.classes = true;
    // Ativar gamification APENAS se o modelo de negócio não for monetário
    if (!monetaryBasedNiches.includes(niche)) {
      modules.gamification = true; 
    }
  }

  if (appointmentBasedNiches.includes(niche)) {
    // Para estética/barbearia/saúde, classes funciona bem como agenda de horários
    modules.classes = true; 
    // Mas também podem querer OS para procedimentos complexos
    if (['dentist', 'clinic', 'mechanic', 'tech_repair'].includes(niche)) {
       modules.service_orders = true;
    }
  }

  if (serviceOrderBasedNiches.includes(niche)) {
    modules.service_orders = true;
    modules.inventory = true; // Geralmente usam peças/produtos
    // Para esses, 'classes' (agenda de turmas) faz menos sentido, 
    // mas se usarmos a lógica de "Agenda de Recursos", poderíamos manter true.
    // Vamos manter true pois o "Agendamento" é vital, mesmo que via OS.
    // Se o sistema usar 'classes' para agendar a entrada, precisa estar true.
    modules.classes = true; 
  }

  // 2. Adicionais de Varejo/Estoque
  if (retailBasedNiches.includes(niche)) {
    modules.pos = true;
    modules.inventory = true;
    modules.marketplace = true;
    modules.fiscal = true;
  }

  // 3. Ajustes Específicos por Nicho
  switch (niche) {
    case 'auto_detail':
    case 'mechanic':
    case 'car_wash':
      modules.service_orders = true;
      modules.scanner = true; // Para entrada/saída de veículos
      modules.inventory = true;
      break;

    case 'dance':
      modules.scanner = true; // QR Code portaria
      modules.gamification = true;
      break;

    case 'gym':
    case 'crossfit':
    case 'martial_arts':
      modules.scanner = true; // Controle de acesso de alunos
      modules.gamification = true;
      break;
      
    case 'confectionery':
    case 'brewery':
      modules.pos = true;
      modules.inventory = true;
      modules.service_orders = true; // Para encomendas
      break;

    case 'coworking':
    case 'party_venue':
      modules.classes = true; // Reserva de salas/espaços
      break;

    case 'aesthetics':
    case 'physio':
    case 'nutrition':
    case 'podiatry':
    case 'tanning':
    case 'psychology':
    case 'vet':
    case 'clinic_vet':
    case 'law':
    case 'travel_agency':
    case 'insurance':
      modules.service_orders = true; // Para procedimentos/processos longos
      modules.marketplace = true;
      modules.pos = true;
      modules.inventory = true;
      break;

    case 'dog_daycare':
    case 'daycare':
    case 'pet_hotel':
      modules.scanner = true; // Entrada/Saída
      modules.marketplace = true;
      modules.pos = true;
      modules.inventory = true;
      modules.gamification = true;
      break;

    case 'elderly_care':
      modules.scanner = true;
      modules.marketplace = true;
      modules.pos = true;
      modules.inventory = true;
      break;

    case 'interior_design':
    case 'real_estate':
    case 'consulting':
    case 'marketing_agency':
    case 'dev_studio':
    case 'event_planning':
    case 'photographer':
    case 'tattoo':
      modules.service_orders = true; // Gerenciamento de projetos/ensaios/sessões
      break;

    case 'logistics':
      modules.service_orders = true;
      modules.inventory = true;
      modules.scanner = true;
      break;

    case 'fire_protection':
      modules.service_orders = true;
      modules.scanner = true;
      modules.inventory = true;
      modules.classes = true; // Lista de Coletas
      modules.fiscal = true;
      break;

    case 'environmental_compliance':
      modules.service_orders = true;
      modules.scanner = true;
      modules.classes = true;
      modules.leads = true;
      modules.whatsapp = true;
      modules.multi_unit = true;
      modules.satellite_monitor = true;
      modules.fiscal = true;
      break;
  }

  return modules;
}

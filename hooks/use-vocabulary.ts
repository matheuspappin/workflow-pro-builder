"use client"

import { useOrganization } from '@/components/providers/organization-provider'
import { pluralize } from '@/lib/pluralize'
import { usePathname } from 'next/navigation'

import { translations, TranslationType } from '@/config/translations'

/**
 * Hook legado refatorado para usar o OrganizationProvider central.
 * Mantém compatibilidade com o código que já usa useVocabulary.
 */
export function useVocabulary() {
  const pathname = usePathname()
  const { 
    vocabulary: orgVocabulary, 
    niche, 
    enabledModules, 
    isLoading,
    language
  } = useOrganization()

  // Verifica se está em área de portal (aluno/profissional/afiliado)
  const isPortal = pathname?.startsWith('/portal') || 
                   pathname?.startsWith('/s/') || 
                   pathname?.startsWith('/student') || 
                   pathname?.startsWith('/teacher')

  // Vocabulário padrão para portais
  const standardVocabulary = {
    name: 'Geral',
    client: 'Cliente',
    provider: 'Profissional',
    service: 'Serviço',
    establishment: 'Empresa',
    category: 'Categoria'
  }

  // Usa vocabulário padrão nos portais, EXCETO se for nicho fire_protection que tem vocabulário próprio nos portais
  const shouldForceStandard = isPortal && niche !== 'fire_protection'
  
  const vocabulary = shouldForceStandard ? standardVocabulary : orgVocabulary

  // Traduções para Inglês se o idioma for 'en'
  const translatedVocab = language === 'en' ? {
    ...vocabulary,
    client: translateToEnglish(vocabulary.client),
    provider: translateToEnglish(vocabulary.provider),
    service: translateToEnglish(vocabulary.service),
    establishment: translateToEnglish(vocabulary.establishment),
    category: translateToEnglish(vocabulary.category)
  } : vocabulary

  // Correção para evitar pluralização incorreta de termos como "Tutor"
  const pluralClients = language === 'pt' && vocabulary.client === 'Tutor' 
    ? 'Tutores' 
    : pluralize(translatedVocab.client)

  const pluralProviders = language === 'pt' && vocabulary.provider === 'Tutor'
    ? 'Tutores'
    : pluralize(translatedVocab.provider)

  // Adiciona versões plurais automaticamente
  const pluralVocabulary = {
    ...translatedVocab,
    clients: pluralClients,
    providers: pluralProviders,
    services: pluralize(translatedVocab.service),
    establishments: pluralize(translatedVocab.establishment)
  }
  
  const t = translations[language as 'pt' | 'en'] || translations.pt

  return { 
    vocabulary: pluralVocabulary, 
    niche, 
    schemas: {}, 
    enabledModules, 
    loading: isLoading,
    language,
    t
  }
}

// Helper simples para tradução de termos de vocabulário
function translateToEnglish(term: string): string {
  const dictionary: Record<string, string> = {
    'Aluno': 'Client',
    'Professor': 'Professional',
    'Aula': 'Class',
    'Estúdio': 'Studio',
    'Modalidade': 'Category',
    'Paciente': 'Patient',
    'Doutor': 'Doctor',
    'Consulta': 'Appointment',
    'Consultório': 'Office',
    'Especialidade': 'Specialty',
    'Membro': 'Member',
    'Instrutor': 'Professional',
    'Treino': 'Workout',
    'Academia': 'Gym',
    'Médico': 'Doctor',
    'Exame': 'Exam',
    'Clínica': 'Clinic',
    'Cliente': 'Client',
    'Profissional': 'Professional',
    'Procedimento': 'Procedure',
    'Salão': 'Salon',
    'Serviço': 'Service',
    'Esteticista': 'Aesthetician',
    'Sessão': 'Session',
    'Nível': 'Level',
    'Prática': 'Practice',
    'Barbeiro': 'Barber',
    'Barbearia': 'Barbershop',
    'Corte': 'Cut',
    'Terapeuta': 'Therapist',
    'Massagem': 'Massage',
    'Fisioterapeuta': 'Physiotherapist',
    'Nutricionista': 'Nutritionist',
    'Plano': 'Plan',
    'Podólogo': 'Podiatrist',
    'Atendimento': 'Service',
    'Atendente': 'Attendant',
    'Tutor': 'Professional',
    'Tosador': 'Groomer',
    'Banho/Tosa': 'Grooming',
    'Pet Shop': 'Pet Shop',
    'Veterinário': 'Vet',
    'Creche Canina': 'Dog Daycare',
    'Monitor': 'Monitor',
    'Diária': 'Day use',
    'Creche': 'Daycare',
    'Atividade': 'Activity',
    'Adestrador': 'Professional',
    'Centro': 'Center',
    'Hóspede': 'Guest',
    'Cuidador': 'Caretaker',
    'Hospedagem': 'Lodging',
    'Hotel': 'Hotel',
    'Acomodação': 'Accommodation',
    'Artes Marciais': 'Martial Arts',
    'Sensei': 'Professional',
    'Dojo': 'Dojo',
    'Atleta': 'Athlete',
    'Coach': 'Coach',
    'WOD': 'WOD',
    'Box': 'Box',
    'Natação': 'Swimming',
    'Escola': 'School',
    'Personal Trainer': 'Professional',
    'Personal': 'Professional',
    'Consultoria': 'Consultancy',
    'Foco': 'Focus',
    'Beach Tennis': 'Beach Tennis',
    'Arena': 'Arena',
    'Escola de Música': 'Music School',
    'Instrumento': 'Instrument',
    'Escola de Idiomas': 'Language School',
    'Teacher': 'Professional',
    'Idioma': 'Language',
    'Ateliê de Arte': 'Art Studio',
    'Workshop': 'Workshop',
    'Ateliê': 'Studio',
    'Técnica': 'Technique',
    'Gastronomia': 'Gastronomy',
    'Chef': 'Professional',
    'Culinária': 'Cooking',
    'Fotografia (Escola)': 'Photography (School)',
    'Fotógrafo': 'Professional',
    'Curso': 'Course',
    'Estética Automotiva': 'Auto Detailing',
    'Oficina Mecânica': 'Auto Repair',
    'Mecânico': 'Professional',
    'Reparo': 'Repair',
    'Oficina': 'Shop',
    'Lava-jato': 'Car Wash',
    'Lavador': 'Professional',
    'Lavagem': 'Wash',
    'Serviços de Limpeza': 'Cleaning Services',
    'Limpeza': 'Cleaning',
    'Empresa': 'Company',
    'Design de Interiores': 'Interior Design',
    'Designer': 'Professional',
    'Projeto': 'Project',
    'Escritório': 'Office',
    'Espaço de Eventos': 'Event Space',
    'Contratante': 'Contractor',
    'Organizador': 'Professional',
    'Evento': 'Event',
    'Espaço': 'Space',
    'Fotógrafo (Studio)': 'Photographer (Studio)',
    'Ensaio': 'Shoot',
    'Coworking': 'Coworking',
    'Coworker': 'Coworker',
    'Gestor': 'Professional',
    'Reserva': 'Booking',
    'Tattoo & Piercing': 'Tattoo & Piercing',
    'Tatuador': 'Professional',
    'Assistência Técnica': 'Tech Support',
    'Técnico': 'Professional',
    'Assistência': 'Support',
    'Aparelho': 'Device',
    'Advocacia': 'Law',
    'Advogado': 'Professional',
    'Processo': 'Process',
    'Área': 'Area',
    'Psicologia': 'Psychology',
    'Psicólogo': 'Professional',
    'Abordagem': 'Approach',
    'Clube do Vinho': 'Wine Club',
    'Sócio': 'Member',
    'Sommelier': 'Professional',
    'Degustação': 'Tasting',
    'Clube': 'Club',
    'Cervejaria': 'Brewery',
    'Mestre': 'Professional',
    'Cafeteria/Barista': 'Coffee Shop/Barista',
    'Barista': 'Professional',
    'Grão': 'Bean',
    'Confeitaria': 'Bakery',
    'Confeiteiro': 'Professional',
    'Encomenda': 'Order',
    'Produto': 'Product',
    'Imobiliária': 'Real Estate',
    'Corretor': 'Professional',
    'Visita': 'Visit',
    'Imóvel': 'Property',
    'Consultor': 'Professional',
    'Reunião': 'Meeting',
    'Agência de Marketing': 'Marketing Agency',
    'Analista': 'Professional',
    'Campanha': 'Campaign',
    'Agência': 'Agency',
    'Canal': 'Channel',
    'Desenvolvimento': 'Development',
    'Dev': 'Professional',
    'Sprint': 'Sprint',
    'Tech': 'Tech',
    'Organização de Eventos': 'Event Planning',
    'Agência de Viagens': 'Travel Agency',
    'Agente': 'Professional',
    'Roteiro': 'Itinerary',
    'Destino': 'Destination',
    'Corretora de Seguros': 'Insurance Broker',
    'Segurado': 'Insured',
    'Apólice': 'Policy',
    'Corretora': 'Brokerage',
    'Ramo': 'Branch',
    'Paisagismo': 'Landscaping',
    'Paisagista': 'Professional',
    'Manutenção': 'Maintenance',
    'Encanador': 'Professional',
    'Eletricista': 'Professional',
    'Instalação': 'Installation',
    'Construção Civil': 'Construction',
    'Engenheiro': 'Professional',
    'Obra': 'Construction Site',
    'Etapa': 'Stage',
    'Logística': 'Logistics',
    'Entregador': 'Professional',
    'Entrega': 'Delivery',
    'Transportadora': 'Carrier',
    'Rota': 'Route',
    'Alfaiataria/Costura': 'Tailoring/Sewing',
    'Costureiro(a)': 'Professional',
    'Ajuste': 'Adjustment',
    'Peça': 'Garment',
    'Aulas Particulares': 'Tutoring',
    'Local': 'Location',
    'Matéria': 'Subject',
    'Creche Infantil': 'Daycare',
    'Responsável': 'Parent/Guardian',
    'Casa de Repouso': 'Nursing Home',
    'Residente': 'Resident',
    'Casa': 'Home',
    'Cuidados': 'Care',
    'Auto Escola': 'Driving School',
    'CFC': 'Driving School',
    'Categoria': 'Category',
    'Aula Prática': 'Driving Class',
    'Centro Esportivo': 'Sports Center',
    'Esporte': 'Sport',
    'Clínica Veterinária': 'Veterinary Clinic'
  }
  return dictionary[term] || term
}

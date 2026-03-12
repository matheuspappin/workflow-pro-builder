/**
 * Conteúdo rico e vendável para landing pages de nichos.
 * UX de alta conversão: dor → solução → prova social → CTA.
 */

import type { NicheLandingTheme } from "./niche-landing-theme"

export type NicheLandingContent = NicheLandingTheme & {
  /** Headline principal — use {nicheName} e {establishment} */
  heroHeadline: string
  /** Subheadline — use {client}, {provider}, {service} */
  heroSubheadline: string
  /** Dores do público — agitação emocional */
  painPoints: { title: string; description: string }[]
  /** Features expandidas (6-8) — benefícios concretos */
  extendedFeatures: { title: string; description: string; highlight?: boolean }[]
  /** Como funciona — 3 passos */
  howItWorks: { step: number; title: string; description: string }[]
  /** Números de impacto */
  stats: { value: string; label: string }[]
  /** Depoimentos */
  testimonials: { quote: string; author: string; role: string }[]
  /** FAQ */
  faq: { question: string; answer: string }[]
  /** Badges de confiança */
  trustBadges: string[]
}

type Vocab = { client: string; provider: string; service: string; establishment: string; name?: string }

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? template)
}

/** Estabelecimentos femininos em português — usa "sua" em vez de "seu" */
const FEMININE_ESTABLISHMENTS = new Set([
  "academia", "clínica", "barbearia", "escola", "creche", "consultoria", "arena",
  "estética automotiva", "estética", "oficina", "empresa", "cervejaria", "cafeteria",
  "confeitaria", "imobiliária", "agência", "corretora", "construtora", "transportadora",
  "assistência", "casa",
])

function getPossessive(establishment: string): "seu" | "sua" {
  const lower = establishment.toLowerCase().trim()
  return FEMININE_ESTABLISHMENTS.has(lower) || FEMININE_ESTABLISHMENTS.has(lower.split(/\s+/)[0] ?? "")
    ? "sua"
    : "seu"
}

/** Conteúdo base reutilizável */
const BASE = {
  howItWorks: [
    { step: 1, title: "Crie sua conta", description: "Cadastre-se em menos de 2 minutos. Sem cartão de crédito." },
    { step: 2, title: "Configure seu negócio", description: "Adicione profissionais, serviços e horários. Tudo intuitivo." },
    { step: 3, title: "Comece a atender", description: "Agende, cobrar e gerencie tudo em um só lugar." },
  ],
  stats: [
    { value: "10k+", label: "Negócios ativos" },
    { value: "98%", label: "Satisfação" },
    { value: "14 dias", label: "Teste grátis" },
    { value: "24/7", label: "Suporte" },
  ],
  trustBadges: ["Sem cartão de crédito", "LGPD", "Pix e cartão", "AKAAI NFe", "Suporte em português"],
  testimonials: [
    { quote: "Reduzi 80% do tempo em planilhas. O sistema cuida de agenda, cobrança e lembretes.", author: "Maria S.", role: "Proprietária" },
    { quote: "Meus clientes adoram o agendamento online. Menos ligações, mais produtividade.", author: "Carlos R.", role: "Profissional" },
    { quote: "Financeiro organizado, inadimplência em destaque. Finalmente tenho controle total.", author: "Ana L.", role: "Gestora" },
  ],
}

/** Conteúdo específico por nicho — dor, benefício e prova */
const NICHE_SPECIFIC: Partial<Record<string, Partial<NicheLandingContent>>> = {
  dentist: {
    heroHeadline: "O sistema completo para seu consultório odontológico",
    heroSubheadline: "Agenda de {provider}s, prontuário de {client}s, controle financeiro e lembretes automáticos. Tudo em uma plataforma.",
    painPoints: [
      { title: "Agenda desorganizada", description: "Ligações perdidas, horários em conflito e pacientes esquecendo consultas." },
      { title: "Inadimplência alta", description: "Cobranças manuais, boletos atrasados e fluxo de caixa imprevisível." },
      { title: "Tempo em burocracia", description: "Planilhas, papéis e sistemas desconectados roubando horas do seu dia." },
      { title: "Falta de visão", description: "Sem relatórios claros de faturamento, procedimentos mais rentáveis ou retenção." },
    ],
    extendedFeatures: [
      { title: "Agenda inteligente", description: "Blocos por procedimento, confirmação por WhatsApp e lembretes automáticos.", highlight: true },
      { title: "Prontuário digital", description: "Histórico de consultas, anexos e evolução do paciente em um só lugar." },
      { title: "Financeiro integrado", description: "Cobrança por procedimento, parcelamento e controle de inadimplência em tempo real." },
      { title: "Lembretes automáticos", description: "WhatsApp e SMS para confirmar consultas e reduzir faltas em até 40%." },
      { title: "Relatórios de desempenho", description: "Faturamento por período, procedimentos mais rentáveis e taxa de retenção." },
      { title: "Multi-profissional", description: "Vários dentistas, agendas separadas e visão consolidada do consultório." },
    ],
    faq: [
      { question: "Funciona para clínicas com múltiplos dentistas?", answer: "Sim. Cada profissional tem sua agenda, e você tem visão consolidada de todo o consultório." },
      { question: "Posso integrar com WhatsApp?", answer: "Sim. Enviamos lembretes e confirmações automáticas por WhatsApp." },
      { question: "E o prontuário do paciente?", answer: "O histórico de consultas e procedimentos fica organizado por paciente, com anexos e evolução." },
      { question: "Como funciona o teste grátis?", answer: "14 dias com acesso completo. Sem cartão de crédito. Cancele quando quiser." },
    ],
  },
  gym: {
    heroHeadline: "Gestão completa para sua academia",
    heroSubheadline: "Controle de {client}s, matrículas, mensalidades e check-in. Menos planilha, mais resultado.",
    painPoints: [
      { title: "Controle de matrículas caótico", description: "Planilhas desatualizadas, alunos sem renovação e inadimplência crescendo." },
      { title: "Check-in manual", description: "Listas de papel, filas na recepção e tempo perdido." },
      { title: "Financeiro confuso", description: "Mensalidades, planos e promoções difíceis de acompanhar." },
      { title: "Falta de engajamento", description: "Alunos somem e você não sabe quem está em risco de cancelar." },
    ],
    extendedFeatures: [
      { title: "Check-in digital", description: "QR Code ou app. Alunos registram presença em segundos, sem fila.", highlight: true },
      { title: "Controle de matrículas", description: "Planos, renovações e histórico completo por aluno." },
      { title: "Financeiro automático", description: "Mensalidades, boletos e cobranças recorrentes sem esforço." },
      { title: "Relatório de frequência", description: "Veja quem frequenta, quem está parando e quem precisa de atenção." },
      { title: "Multi-unidade", description: "Várias academias, uma conta. Visão consolidada ou por unidade." },
      { title: "App do aluno", description: "Horários, pagamentos e comunicados no celular do aluno." },
    ],
    faq: [
      { question: "Funciona para academias com várias unidades?", answer: "Sim. Gerencie múltiplas unidades em uma única conta." },
      { question: "O aluno precisa de app?", answer: "Pode usar QR Code na recepção ou acessar um portal web. Flexível." },
      { question: "Integra com maquininha?", answer: "Suportamos Pix, boleto e cartão. Integrações com gateways de pagamento." },
      { question: "Quanto custa?", answer: "Planos acessíveis. Teste 14 dias grátis para conhecer." },
    ],
  },
  beauty: {
    heroHeadline: "O sistema que sua beleza e estética merece",
    heroSubheadline: "Agenda de {provider}s, ficha de {client}s, controle de {service}s e financeiro. Tudo organizado.",
    painPoints: [
      { title: "Agenda bagunçada", description: "Horários em conflito, clientes remarcando e tempo perdido no telefone." },
      { title: "Fichas em papel", description: "Histórico de procedimentos perdido, alergias não registradas e risco." },
      { title: "Cobrança manual", description: "Controle de pacotes e sessões em caderninho ou planilha." },
      { title: "Sem visão do negócio", description: "Não sabe quanto faturou, qual serviço vende mais ou quem está inadimplente." },
    ],
    extendedFeatures: [
      { title: "Agenda por profissional", description: "Cada esteticista com sua agenda. Evite conflitos de horário.", highlight: true },
      { title: "Ficha da cliente", description: "Histórico de procedimentos, alergias, fotos e evolução." },
      { title: "Controle de pacotes", description: "Sessões restantes, validade e alertas de renovação." },
      { title: "Financeiro integrado", description: "Cobrança por serviço ou pacote, parcelamento e inadimplência em destaque." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários e reduzir faltas." },
      { title: "Relatórios", description: "Serviços mais vendidos, faturamento e retenção de clientes." },
    ],
    faq: [
      { question: "Funciona para salão com várias profissionais?", answer: "Sim. Cada uma com sua agenda e serviços." },
      { question: "Posso controlar pacotes de sessões?", answer: "Sim. Registre quantas sessões restantes e validade." },
      { question: "Tem ficha da cliente?", answer: "Sim. Histórico de procedimentos, alergias e fotos." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações automáticas." },
    ],
  },
  physio: {
    heroHeadline: "Gestão profissional para sua clínica de fisioterapia",
    heroSubheadline: "Agenda de {provider}s, evolução de {client}s, controle de sessões e financeiro. Tudo em um lugar.",
    painPoints: [
      { title: "Agenda sobrecarregada", description: "Pacientes remarcando, horários em conflito e tempo no telefone." },
      { title: "Evolução em papel", description: "Prontuários perdidos, evolução difícil de acompanhar." },
      { title: "Sessões desorganizadas", description: "Pacotes de 10, 20 sessões — controle manual e confuso." },
      { title: "Inadimplência", description: "Cobranças atrasadas e fluxo de caixa imprevisível." },
    ],
    extendedFeatures: [
      { title: "Agenda por fisioterapeuta", description: "Cada profissional com sua agenda. Blocos por tipo de sessão.", highlight: true },
      { title: "Evolução do paciente", description: "Registro de sessões, evolução clínica e anexos." },
      { title: "Controle de pacotes", description: "Sessões restantes, validade e alertas de renovação." },
      { title: "Financeiro integrado", description: "Cobrança por sessão ou pacote, parcelamento e inadimplência." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários e reduzir faltas." },
      { title: "Relatórios", description: "Faturamento, sessões realizadas e retenção de pacientes." },
    ],
    faq: [
      { question: "Funciona para clínica com vários fisioterapeutas?", answer: "Sim. Cada um com sua agenda e pacientes." },
      { question: "Posso controlar pacotes de sessões?", answer: "Sim. Registre quantas restantes e validade." },
      { question: "Tem prontuário?", answer: "Sim. Evolução, sessões e anexos por paciente." },
      { question: "Integra com convênio?", answer: "O financeiro suporta cobrança particular e por convênio." },
    ],
  },
  pilates: {
    heroHeadline: "O sistema ideal para seu studio de Pilates",
    heroSubheadline: "Turmas, {client}s, agenda de {provider}s e financeiro. Gestão completa para studios.",
    painPoints: [
      { title: "Turmas desorganizadas", description: "Vagas, níveis e horários difíceis de controlar." },
      { title: "Controle manual", description: "Planilhas para frequência, mensalidades e pacotes." },
      { title: "Falta de visão", description: "Não sabe ocupação, faturamento ou quem está em risco de cancelar." },
      { title: "Tempo em tarefas repetitivas", description: "Cobranças, lembretes e comunicados manuais." },
    ],
    extendedFeatures: [
      { title: "Gestão de turmas", description: "Vagas, níveis e horários. Controle de lotação em tempo real.", highlight: true },
      { title: "Chamada digital", description: "Frequência em segundos. Histórico completo por aluno." },
      { title: "Financeiro integrado", description: "Mensalidades, pacotes e cobranças automáticas." },
      { title: "Portal do aluno", description: "Horários, pagamentos e comunicados no celular." },
      { title: "Relatórios", description: "Ocupação, faturamento e retenção." },
      { title: "Multi-unidade", description: "Vários studios em uma conta." },
    ],
    faq: [
      { question: "Funciona para studio com turmas e personal?", answer: "Sim. Turmas com vagas e atendimentos individuais." },
      { question: "Tem chamada de frequência?", answer: "Sim. Chamada digital rápida com histórico." },
      { question: "O aluno acessa pelo celular?", answer: "Sim. Portal com horários, pagamentos e comunicados." },
      { question: "Quanto custa?", answer: "Planos acessíveis. Teste 14 dias grátis." },
    ],
  },
  vet: {
    heroHeadline: "Gestão completa para sua clínica veterinária",
    heroSubheadline: "Agenda de {provider}s, prontuário de {client}s e pets, financeiro e lembretes. Tudo integrado.",
    painPoints: [
      { title: "Agenda caótica", description: "Consultas, cirurgias e retornos em conflito." },
      { title: "Prontuário desorganizado", description: "Histórico do pet espalhado em papéis e sistemas." },
      { title: "Cobrança manual", description: "Procedimentos, medicamentos e pacotes difíceis de controlar." },
      { title: "Lembretes de vacina", description: "Controle manual de vacinação e retornos." },
    ],
    extendedFeatures: [
      { title: "Prontuário do pet", description: "Histórico de consultas, vacinas, procedimentos e anexos.", highlight: true },
      { title: "Agenda integrada", description: "Consultas, cirurgias e retornos. Um tutor pode ter vários pets." },
      { title: "Controle de vacinas", description: "Registro e lembretes de vacinação e retornos." },
      { title: "Financeiro por procedimento", description: "Cobrança por consulta, cirurgia, medicamento ou pacote." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar consultas e vacinas." },
      { title: "Multi-veterinário", description: "Vários profissionais, agendas separadas." },
    ],
    faq: [
      { question: "Funciona para clínica com vários veterinários?", answer: "Sim. Cada um com sua agenda." },
      { question: "Tem prontuário do pet?", answer: "Sim. Histórico completo por pet e tutor." },
      { question: "Controla vacinas?", answer: "Sim. Registro e lembretes de vacinação." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações automáticas." },
    ],
  },
  pet_shop: {
    heroHeadline: "Sistema completo para seu pet shop",
    heroSubheadline: "Agenda de banho e tosa, ficha de {client}s e pets, financeiro e estoque. Tudo organizado.",
    painPoints: [
      { title: "Agenda de banho/tosa bagunçada", description: "Horários em conflito e clientes esperando." },
      { title: "Fichas em papel", description: "Histórico do pet, preferências e alergias perdidos." },
      { title: "Financeiro confuso", description: "Serviços, produtos e pacotes difíceis de controlar." },
      { title: "Sem lembretes", description: "Clientes esquecem retorno e você perde reincidência." },
    ],
    extendedFeatures: [
      { title: "Agenda de banho e tosa", description: "Horários por tosador, blocos por porte e tipo de serviço.", highlight: true },
      { title: "Ficha do pet", description: "Raça, peso, alergias, preferências e histórico de serviços." },
      { title: "Financeiro integrado", description: "Cobrança por serviço, produto ou pacote." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários e lembrar retorno." },
      { title: "Controle de pacotes", description: "Banhos avulsos ou pacotes com sessões restantes." },
      { title: "Relatórios", description: "Faturamento, serviços mais vendidos e retenção." },
    ],
    faq: [
      { question: "Funciona para pet shop com vários tosadores?", answer: "Sim. Cada um com sua agenda." },
      { question: "Tem ficha do pet?", answer: "Sim. Histórico, alergias e preferências." },
      { question: "Controla pacotes de banho?", answer: "Sim. Sessões restantes e validade." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações." },
    ],
  },
  barber: {
    heroHeadline: "O sistema que sua barbearia precisa",
    heroSubheadline: "Agenda de {provider}s, ficha de {client}s, controle de {service}s e financeiro. Simples e eficiente.",
    painPoints: [
      { title: "Agenda em papel ou WhatsApp", description: "Horários perdidos, conflitos e clientes remarcando." },
      { title: "Sem histórico do cliente", description: "Não sabe o que fez da última vez ou preferências." },
      { title: "Cobrança manual", description: "Serviços e produtos difíceis de controlar." },
      { title: "Fila na recepção", description: "Clientes esperando e tempo perdido." },
    ],
    extendedFeatures: [
      { title: "Agenda por barbeiro", description: "Cada um com sua agenda. Evite conflitos.", highlight: true },
      { title: "Ficha do cliente", description: "Histórico de cortes, preferências e produtos usados." },
      { title: "Financeiro integrado", description: "Cobrança por serviço ou produto. Controle de comissões." },
      { title: "Agendamento online", description: "Cliente agenda pelo celular. Menos ligações." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários." },
      { title: "Relatórios", description: "Faturamento por barbeiro, serviço e retenção." },
    ],
    faq: [
      { question: "Funciona para barbearia com vários barbeiros?", answer: "Sim. Cada um com sua agenda." },
      { question: "O cliente pode agendar online?", answer: "Sim. Link de agendamento para enviar." },
      { question: "Tem controle de comissão?", answer: "O financeiro suporta visão por profissional." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações." },
    ],
  },
  spa: {
    heroHeadline: "Gestão elegante para seu spa",
    heroSubheadline: "Agenda de {provider}s, ficha de {client}s, pacotes de {service}s e financeiro. Experiência completa.",
    painPoints: [
      { title: "Agenda complexa", description: "Massagens, tratamentos e duração variada — difícil de organizar." },
      { title: "Fichas desorganizadas", description: "Histórico de tratamentos e contraindicações em papel." },
      { title: "Pacotes confusos", description: "Sessões restantes, validade e renovação manual." },
      { title: "Sem visão do negócio", description: "Faturamento, ocupação e retenção difíceis de acompanhar." },
    ],
    extendedFeatures: [
      { title: "Agenda por terapeuta", description: "Blocos por tipo de massagem ou tratamento. Duração flexível.", highlight: true },
      { title: "Ficha da cliente", description: "Histórico de tratamentos, contraindicações e preferências." },
      { title: "Controle de pacotes", description: "Sessões restantes, validade e alertas de renovação." },
      { title: "Financeiro integrado", description: "Cobrança por sessão ou pacote. Parcelamento." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários." },
      { title: "Relatórios", description: "Faturamento, ocupação e tratamentos mais vendidos." },
    ],
    faq: [
      { question: "Funciona para spa com vários terapeutas?", answer: "Sim. Cada um com sua agenda." },
      { question: "Controla pacotes de massagem?", answer: "Sim. Sessões restantes e validade." },
      { question: "Tem ficha da cliente?", answer: "Sim. Histórico e contraindicações." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações." },
    ],
  },
  nutrition: {
    heroHeadline: "Sistema completo para consultório de nutrição",
    heroSubheadline: "Agenda de {provider}s, evolução de {client}s, planos alimentares e financeiro. Tudo organizado.",
    painPoints: [
      { title: "Agenda desorganizada", description: "Consultas e retornos em conflito." },
      { title: "Evolução em papel", description: "Planos e acompanhamento difíceis de acessar." },
      { title: "Cobrança manual", description: "Pacotes de consultas e mensalidades em planilha." },
      { title: "Pacientes faltando", description: "Sem lembretes e taxa de retorno baixa." },
    ],
    extendedFeatures: [
      { title: "Agenda integrada", description: "Consultas e retornos. Blocos por tipo de atendimento.", highlight: true },
      { title: "Evolução do paciente", description: "Registro de consultas, planos e anexos." },
      { title: "Controle de pacotes", description: "Consultas restantes e validade." },
      { title: "Financeiro integrado", description: "Cobrança por consulta ou pacote." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar e lembrar retornos." },
      { title: "Relatórios", description: "Faturamento e retenção de pacientes." },
    ],
    faq: [
      { question: "Funciona para consultório com vários nutricionistas?", answer: "Sim. Cada um com sua agenda." },
      { question: "Tem evolução do paciente?", answer: "Sim. Histórico de consultas e planos." },
      { question: "Controla pacotes de consultas?", answer: "Sim. Sessões restantes e validade." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações." },
    ],
  },
  aesthetics: {
    heroHeadline: "Sistema completo para clínica de estética",
    heroSubheadline: "Agenda de {provider}s, ficha de {client}s, pacotes de {service}s e financeiro. Gestão profissional.",
    painPoints: [
      { title: "Agenda complexa", description: "Procedimentos com duração variada, múltiplas profissionais e horários em conflito." },
      { title: "Fichas desorganizadas", description: "Histórico de tratamentos e contraindicações em papel ou planilhas." },
      { title: "Pacotes confusos", description: "Sessões restantes, validade e renovação manual." },
      { title: "Cobrança manual", description: "Procedimentos, produtos e pacotes difíceis de controlar." },
    ],
    extendedFeatures: [
      { title: "Agenda por esteticista", description: "Cada profissional com sua agenda. Blocos por tipo de procedimento.", highlight: true },
      { title: "Ficha da cliente", description: "Histórico de tratamentos, alergias e fotos de evolução." },
      { title: "Controle de pacotes", description: "Sessões restantes, validade e alertas de renovação." },
      { title: "Financeiro integrado", description: "Cobrança por sessão ou pacote. Parcelamento." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários." },
      { title: "Relatórios", description: "Faturamento e procedimentos mais vendidos." },
    ],
    faq: [
      { question: "Funciona para clínica com várias esteticistas?", answer: "Sim. Cada uma com sua agenda." },
      { question: "Controla pacotes de sessões?", answer: "Sim. Sessões restantes e validade." },
      { question: "Tem ficha da cliente?", answer: "Sim. Histórico e contraindicações." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações." },
    ],
  },
  yoga: {
    heroHeadline: "Gestão completa para seu studio de Yoga",
    heroSubheadline: "Turmas, {client}s, agenda de {provider}s e financeiro. Simplicidade e organização.",
    painPoints: [
      { title: "Turmas desorganizadas", description: "Vagas, níveis e horários difíceis de controlar." },
      { title: "Controle manual", description: "Planilhas para frequência, mensalidades e pacotes." },
      { title: "Falta de visão", description: "Ocupação, faturamento e retenção difíceis de acompanhar." },
      { title: "Comunicados manuais", description: "Avisos de feriados e eventos em grupos de WhatsApp." },
    ],
    extendedFeatures: [
      { title: "Gestão de turmas", description: "Vagas, níveis e horários. Controle de lotação.", highlight: true },
      { title: "Chamada digital", description: "Frequência em segundos. Histórico por aluno." },
      { title: "Financeiro integrado", description: "Mensalidades, pacotes e cobranças automáticas." },
      { title: "Portal do aluno", description: "Horários, pagamentos e comunicados no celular." },
      { title: "Relatórios", description: "Ocupação, faturamento e retenção." },
      { title: "Multi-unidade", description: "Vários studios em uma conta." },
    ],
    faq: [
      { question: "Funciona para studio com turmas e aulas particulares?", answer: "Sim. Turmas com vagas e atendimentos individuais." },
      { question: "Tem chamada de frequência?", answer: "Sim. Chamada digital rápida." },
      { question: "O aluno acessa pelo celular?", answer: "Sim. Portal com horários e pagamentos." },
      { question: "Quanto custa?", answer: "Planos acessíveis. Teste 14 dias grátis." },
    ],
  },
  mechanic: {
    heroHeadline: "Sistema completo para sua oficina mecânica",
    heroSubheadline: "Agenda de {provider}s, ordem de serviço, histórico do veículo e financeiro. Tudo organizado.",
    painPoints: [
      { title: "Ordem de serviço em papel", description: "OS perdidas, histórico do veículo espalhado." },
      { title: "Agenda desorganizada", description: "Mecânicos e funis em conflito." },
      { title: "Cobrança manual", description: "Peças, mão de obra e orçamentos difíceis de controlar." },
      { title: "Cliente sem retorno", description: "Sem lembretes de revisão ou manutenção." },
    ],
    extendedFeatures: [
      { title: "Ordem de serviço digital", description: "OS completa, histórico do veículo e anexos.", highlight: true },
      { title: "Agenda por mecânico", description: "Cada um com sua agenda. Blocos por tipo de serviço." },
      { title: "Histórico do veículo", description: "Todas as OS e intervenções por placa." },
      { title: "Financeiro integrado", description: "Cobrança por peças e mão de obra. Orçamentos." },
      { title: "Lembretes automáticos", description: "WhatsApp para revisão e retorno." },
      { title: "Relatórios", description: "Faturamento, serviços mais vendidos e retenção." },
    ],
    faq: [
      { question: "Funciona para oficina com vários mecânicos?", answer: "Sim. Cada um com sua agenda." },
      { question: "Tem ordem de serviço?", answer: "Sim. OS completa com histórico do veículo." },
      { question: "Controla peças e mão de obra?", answer: "Sim. Cobrança detalhada por item." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações." },
    ],
  },
  clinic: {
    heroHeadline: "Gestão profissional para sua clínica médica",
    heroSubheadline: "Agenda de {provider}s, prontuário de {client}s, exames e financeiro. Conformidade e eficiência.",
    painPoints: [
      { title: "Agenda fragmentada", description: "Médicos, especialidades e exames em sistemas diferentes." },
      { title: "Prontuário desorganizado", description: "Histórico do paciente espalhado e difícil de acessar." },
      { title: "Financeiro complexo", description: "Particular, convênio e procedimentos — controle manual." },
      { title: "Falta de conformidade", description: "LGPD e auditoria difíceis de garantir." },
    ],
    extendedFeatures: [
      { title: "Agenda por médico", description: "Cada especialista com sua agenda. Blocos por tipo de consulta.", highlight: true },
      { title: "Prontuário digital", description: "Histórico de consultas, exames e anexos por paciente." },
      { title: "Financeiro integrado", description: "Cobrança particular e por convênio. Controle de inadimplência." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar consultas e reduzir faltas." },
      { title: "Multi-especialidade", description: "Vários médicos e especialidades em uma clínica." },
      { title: "Relatórios", description: "Faturamento, ocupação e procedimentos." },
    ],
    faq: [
      { question: "Funciona para clínica com vários médicos?", answer: "Sim. Cada um com sua agenda e especialidade." },
      { question: "Tem prontuário?", answer: "Sim. Histórico completo por paciente." },
      { question: "Suporta convênio?", answer: "O financeiro permite cobrança particular e por convênio." },
      { question: "É seguro (LGPD)?", answer: "Sim. Dados protegidos e controle de acesso." },
    ],
  },
}

/** Gera conteúdo genérico quando não há específico */
function getGenericContent(vocab: Vocab, nicheName: string): Partial<NicheLandingContent> {
  return {
    heroHeadline: `Gestão completa para ${getPossessive(vocab.establishment)} ${vocab.establishment.toLowerCase()}`,
    heroSubheadline: `Cadastro de ${vocab.client}s, agenda de ${vocab.provider}s, controle de ${vocab.service}s e financeiro. Tudo em uma plataforma.`,
    painPoints: [
      { title: "Agenda desorganizada", description: `Horários em conflito, ${vocab.client}s remarcando e tempo perdido no telefone.` },
      { title: "Controle manual", description: `Planilhas para ${vocab.service}s, cobranças e histórico.` },
      { title: "Inadimplência", description: "Cobranças atrasadas e fluxo de caixa imprevisível." },
      { title: "Sem visão do negócio", description: "Faturamento, ocupação e retenção difíceis de acompanhar." },
    ],
    extendedFeatures: [
      { title: `Agenda de ${vocab.provider}s`, description: `Organize horários e evite conflitos. Cada ${vocab.provider} com sua agenda.`, highlight: true },
      { title: `Cadastro de ${vocab.client}s`, description: `Histórico completo, preferências e anexos em um só lugar.` },
      { title: `Controle de ${vocab.service}s`, description: `Registre cada ${vocab.service} e acompanhe em tempo real.` },
      { title: "Financeiro integrado", description: "Cobranças, fluxo de caixa e relatórios. Inadimplência em destaque." },
      { title: "AKAAI NFe", description: "Emissor próprio de Nota Fiscal Eletrônica. Emissão automática integrada ao sistema." },
      { title: "Lembretes automáticos", description: "WhatsApp para confirmar horários e reduzir faltas." },
      { title: "Relatórios", description: "Faturamento, ocupação e retenção de clientes." },
    ],
    faq: [
      { question: `Funciona para ${vocab.establishment} com vários ${vocab.provider}s?`, answer: "Sim. Cada um com sua agenda e visão consolidada." },
      { question: "Integra com WhatsApp?", answer: "Sim. Lembretes e confirmações automáticas." },
      { question: "Tem emissão de NF-e?", answer: "Sim. O AKAAI NFe é nosso emissor próprio de notas fiscais, integrado ao sistema." },
      { question: "Como funciona o teste grátis?", answer: "14 dias com acesso completo. Sem cartão de crédito." },
      { question: "Os dados são seguros?", answer: "Sim. LGPD, criptografia e backup automático." },
    ],
  }
}

/**
 * Retorna conteúdo completo para a landing do nicho.
 */
export function getNicheLandingContent(
  niche: string,
  theme: NicheLandingTheme,
  vocab: Vocab
): NicheLandingContent {
  const nicheName = vocab.name ?? niche
  const specific = NICHE_SPECIFIC[niche]
  const generic = getGenericContent(vocab, nicheName)

  let extendedFeatures = specific?.extendedFeatures ?? generic.extendedFeatures ?? theme.features.map((f) => ({ ...f, highlight: false }))
  const hasNfe = extendedFeatures.some((f) => /akaai nfe|nf-e|nota fiscal|fiscal/i.test(f.title))
  if (!hasNfe) {
    extendedFeatures = [
      ...extendedFeatures,
      { title: "AKAAI NFe", description: "Emissor próprio de Nota Fiscal Eletrônica. Emissão automática integrada ao sistema.", highlight: false },
    ]
  }

  const merged: NicheLandingContent = {
    ...theme,
    heroHeadline: specific?.heroHeadline ?? generic.heroHeadline ?? `Gestão para ${nicheName}`,
    heroSubheadline: interpolate(
      specific?.heroSubheadline ?? generic.heroSubheadline ?? "",
      vocab
    ),
    painPoints: specific?.painPoints ?? generic.painPoints ?? [],
    extendedFeatures,
    howItWorks: specific?.howItWorks ?? BASE.howItWorks,
    stats: specific?.stats ?? BASE.stats,
    testimonials: specific?.testimonials ?? BASE.testimonials,
    faq: specific?.faq ?? generic.faq ?? [],
    trustBadges: specific?.trustBadges ?? BASE.trustBadges,
  }

  return merged
}

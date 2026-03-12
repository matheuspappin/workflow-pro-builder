import { 
  Users, 
  GraduationCap, 
  Calendar, 
  PawPrint, 
  Car, 
  Home, 
  Utensils, 
  Briefcase, 
  Activity, 
  User, 
  Wrench, 
  ShoppingBag,
  Scissors,
  Dumbbell,
  Music,
  Palette,
  Camera,
  Coffee,
  Beer,
  Stethoscope,
  BookOpen,
  Hammer,
  Truck,
  Shirt,
  Baby,
  HeartHandshake,
  LandPlot,
  FireExtinguisher,
  Sparkles,
  LucideIcon
} from "lucide-react"
import { NicheType } from "@/config/niche-dictionary"

export type NicheBranding = {
  icon: LucideIcon;
  primaryColor: string;
  secondaryColor: string;
  name: string;
  accentName?: string;
  gradient: string;
  /** Classes for accent (logo part, active states, buttons) - dance: violet, fire: red */
  accentText?: string;
  accentBg?: string;
  accentBgMuted?: string;
  accentShadow?: string;
}

const nicheBranding: Partial<Record<NicheType, NicheBranding>> = {
  fire_protection: {
    icon: FireExtinguisher,
    primaryColor: 'text-white',
    secondaryColor: 'text-red-500',
    name: 'Fire',
    accentName: 'Control',
    gradient: 'from-red-600 to-orange-600',
    accentText: 'text-red-600',
    accentBg: 'bg-red-600',
    accentBgMuted: 'bg-red-600/10',
    accentShadow: 'shadow-red-600/20',
  },
  dance: {
    icon: Music,
    primaryColor: 'text-foreground',
    secondaryColor: 'text-violet-400',
    name: 'Dance',
    accentName: 'Flow',
    gradient: 'from-violet-600 to-violet-500',
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-600',
    accentBgMuted: 'bg-violet-600/10',
    accentShadow: 'shadow-violet-600/20',
  }
};

export const getNicheBranding = (niche: NicheType | string): NicheBranding => {
  const b = nicheBranding[niche as NicheType] || nicheBranding.dance!;
  // Fallback accent classes for niches without explicit accent
  return {
    ...b,
    accentText: b.accentText ?? 'text-red-600',
    accentBg: b.accentBg ?? 'bg-red-600',
    accentBgMuted: b.accentBgMuted ?? 'bg-red-600/10',
    accentShadow: b.accentShadow ?? 'shadow-red-600/20',
  };
}

// Mapeamento de ícones para clientes
const clientIcons: Record<NicheType, LucideIcon> = {
  pet_shop: PawPrint,
  vet: PawPrint,
  dog_daycare: PawPrint,
  dog_trainer: PawPrint,
  pet_hotel: PawPrint,
  clinic_vet: PawPrint,
  mechanic: Car,
  auto_detail: Car,
  car_wash: Car,
  real_estate: Home,
  construction: Home,
  gym: User,
  crossfit: User,
  personal: User,
  pilates: User,
  yoga: User,
  martial_arts: User,
  sports_center: User,
  dance: Users,
  dentist: Users,
  clinic: Users,
  beauty: Users,
  aesthetics: Users,
  barber: Users,
  spa: Users,
  physio: Users,
  nutrition: Users,
  podiatry: Users,
  tanning: Users,
  music_school: Users,
  language_school: Users,
  art_studio: Users,
  cooking_school: Users,
  photography: Users,
  cleaning: Users,
  interior_design: Users,
  party_venue: Users,
  photographer: Users,
  coworking: Users,
  tattoo: Users,
  tech_repair: Users,
  law: Users,
  psychology: Users,
  wine_club: Users,
  brewery: Users,
  barista: Users,
  confectionery: Users,
  consulting: Users,
  marketing_agency: Users,
  dev_studio: Users,
  event_planning: Users,
  travel_agency: Users,
  insurance: Users,
  landscaping: Users,
  plumbing: Users,
  electrician: Users,
  logistics: Users,
  tailoring: Users,
  tutoring: Users,
  daycare: Users,
  elderly_care: Users,
  driving_school: Users,
  swim_school: Users,
  beach_tennis: Users,
  fire_protection: FireExtinguisher,
  environmental_compliance: LandPlot,
  default_generic: Users,
};

// Mapeamento de ícones para provedores/profissionais (parcial - nichos sem ícone usam User)
const providerIcons: Record<string, LucideIcon> = {
  language_school: GraduationCap,
  tutoring: GraduationCap,
  music_school: GraduationCap,
  gym: Dumbbell,
  crossfit: Dumbbell,
  personal: Dumbbell,
  sports_center: Dumbbell,
  health: Stethoscope,
  clinic: Stethoscope,
  physio: Stethoscope,
  psychology: Stethoscope,
  dentist: Stethoscope,
  nutrition: Stethoscope,
  podiatry: Stethoscope,
  vet: Stethoscope,
  clinic_vet: Stethoscope,
  mechanic: Wrench,
  electrician: Wrench,
  plumbing: Wrench,
  construction: Wrench,
  tech_repair: Wrench,
  auto_detail: Wrench,
  car_wash: Wrench,
  beauty: Scissors,
  aesthetics: Scissors,
  barber: Scissors,
  tattoo: Scissors,
  spa: Scissors,
  pet_shop: Scissors, // Tosador
  cooking_school: Utensils,
  confectionery: Utensils,
  restaurant: Utensils,
  barista: Coffee,
  brewery: Beer,
  wine_club: Beer,
  art_studio: Palette,
  interior_design: Palette,
  tailoring: Palette,
  landscaping: Palette,
  photography: Camera,
  photographer: Camera,
  law: Briefcase,
  consulting: Briefcase,
  accounting: Briefcase,
  marketing_agency: Briefcase,
  insurance: Briefcase,
  real_estate: Briefcase,
  dance: User, // Professor
  pilates: User, // Profissional
  yoga: User, // Profissional
  martial_arts: User, // Profissional
  dog_daycare: User, // Monitor
  dog_trainer: User, // Profissional
  pet_hotel: User, // Cuidador
  party_venue: User, // Organizador
  coworking: User, // Gestor
  event_planning: User, // Organizador
  travel_agency: User, // Agente
  logistics: User, // Entregador
  cleaning: User, // Profissional
  daycare: User, // Cuidador
  elderly_care: User, // Cuidador
  driving_school: User, // Profissional
};

// Mapeamento de ícones para serviços
const serviceIcons: Record<string, LucideIcon> = {
  music_school: Music,
  barista: Coffee,
  brewery: Beer,
  wine_club: Beer,
  language_school: Calendar,
  tutoring: Calendar,
  dance: Calendar,
  yoga: Calendar,
  pilates: Calendar,
  martial_arts: Calendar,
  sports_center: Calendar,
  gym: Dumbbell,
  crossfit: Dumbbell,
  personal: Dumbbell,
  mechanic: Wrench,
  auto_detail: Wrench,
  car_wash: Wrench,
  tech_repair: Wrench,
  plumbing: Wrench,
  electrician: Wrench,
  cleaning: Wrench,
  landscaping: Wrench,
  consulting: Activity,
  law: Activity,
  psychology: Activity,
  nutrition: Activity,
  physio: Activity,
  vet: Activity,
  clinic_vet: Activity,
  interior_design: Activity,
  dev_studio: Activity,
  marketing_agency: Activity,
  pet_shop: Scissors,
  beauty: Scissors,
  aesthetics: Scissors,
  barber: Scissors,
  spa: Scissors,
  logistics: Truck,
  retail: ShoppingBag,
  supermarket: ShoppingBag,
  photography: Camera, // Curso/Aula
  photographer: Camera, // Ensaio
  art_studio: Palette, // Workshop
  cooking_school: Utensils, // Aula
  confectionery: Utensils, // Encomenda
  real_estate: Home, // Visita
  construction: Hammer, // Obra
  event_planning: Calendar, // Evento
  travel_agency: BookOpen, // Roteiro
  insurance: HeartHandshake, // Apólice
  tailoring: Shirt, // Ajuste
  daycare: Baby, // Diária
  elderly_care: Home, // Estadia
  driving_school: Car, // Aula Prática
  party_venue: Home, // Evento
  coworking: Briefcase, // Reserva
  tattoo: Scissors, // Sessão
};

// Mapeamento de ícones para estabelecimentos
const establishmentIcons: Record<string, LucideIcon> = {
  dance: Home,
  dentist: Home,
  gym: Home,
  clinic: Home,
  beauty: Home,
  aesthetics: Home,
  pilates: Home,
  yoga: Home,
  barber: Home,
  spa: Home,
  physio: Home,
  nutrition: Home,
  podiatry: Home,
  tanning: Home,
  pet_shop: Home,
  vet: Home,
  dog_daycare: Home,
  dog_trainer: Home,
  pet_hotel: Home,
  martial_arts: Home,
  crossfit: Home,
  swim_school: Home,
  personal: Home,
  beach_tennis: Home,
  music_school: Home,
  language_school: Home,
  art_studio: Home,
  cooking_school: Home,
  photography: Home,
  auto_detail: Home,
  mechanic: Home,
  car_wash: Home,
  cleaning: Home,
  interior_design: Home,
  party_venue: Home,
  photographer: Home,
  coworking: Home,
  tattoo: Home,
  tech_repair: Home,
  law: Home,
  psychology: Home,
  wine_club: Home,
  brewery: Home,
  barista: Home,
  confectionery: Home,
  real_estate: Home,
  consulting: Home,
  marketing_agency: Home,
  dev_studio: Home,
  event_planning: Home,
  travel_agency: Home,
  insurance: Home,
  landscaping: Home,
  plumbing: Home,
  electrician: Home,
  construction: Home,
  logistics: Home,
  tailoring: Home,
  tutoring: Home,
  daycare: Home,
  elderly_care: Home,
  driving_school: Home,
  sports_center: Home,
  clinic_vet: Home,
  fire_protection: FireExtinguisher,
  environmental_compliance: LandPlot,
  default_generic: Home,
};

export const getNicheIcon = (niche: NicheType | string, type: 'client' | 'provider' | 'service' | 'establishment') => {
  const n = niche as NicheType;

  switch (type) {
    case 'client':
      return clientIcons[n] || Users; 
    case 'provider':
      return providerIcons[n] || User;
    case 'service':
      return serviceIcons[n] || Calendar;
    case 'establishment':
      return establishmentIcons[n] || Home;
    default:
      return Activity;
  }
}

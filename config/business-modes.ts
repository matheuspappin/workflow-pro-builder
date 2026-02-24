export const BUSINESS_MODES = {
  SCHEDULE_BASED: 'SCHEDULE_BASED',
  SERVICE_ORDER_BASED: 'SERVICE_ORDER_BASED'
} as const;

export type BusinessMode = keyof typeof BUSINESS_MODES;

export const NICHE_MODES: Record<string, BusinessMode> = {
  // SCHEDULE_BASED
  dance: 'SCHEDULE_BASED',
  dentist: 'SCHEDULE_BASED',
  gym: 'SCHEDULE_BASED',
  clinic: 'SCHEDULE_BASED',
  beauty: 'SCHEDULE_BASED',
  aesthetics: 'SCHEDULE_BASED',
  pilates: 'SCHEDULE_BASED',
  yoga: 'SCHEDULE_BASED',
  barber: 'SCHEDULE_BASED',
  spa: 'SCHEDULE_BASED',
  physio: 'SCHEDULE_BASED',
  nutrition: 'SCHEDULE_BASED',
  podiatry: 'SCHEDULE_BASED',
  tanning: 'SCHEDULE_BASED',
  pet_shop: 'SCHEDULE_BASED',
  vet: 'SCHEDULE_BASED',
  dog_trainer: 'SCHEDULE_BASED',
  martial_arts: 'SCHEDULE_BASED',
  crossfit: 'SCHEDULE_BASED',
  swim_school: 'SCHEDULE_BASED',
  personal: 'SCHEDULE_BASED',
  beach_tennis: 'SCHEDULE_BASED',
  music_school: 'SCHEDULE_BASED',
  language_school: 'SCHEDULE_BASED',
  cooking_school: 'SCHEDULE_BASED',
  tutoring: 'SCHEDULE_BASED',
  driving_school: 'SCHEDULE_BASED',
  sports_center: 'SCHEDULE_BASED',
  clinic_vet: 'SCHEDULE_BASED',

  // SERVICE_ORDER_BASED
  auto_detail: 'SERVICE_ORDER_BASED',
  mechanic: 'SERVICE_ORDER_BASED',
  car_wash: 'SERVICE_ORDER_BASED',
  tech_repair: 'SERVICE_ORDER_BASED',
  interior_design: 'SERVICE_ORDER_BASED',
  party_venue: 'SERVICE_ORDER_BASED',
  photographer: 'SERVICE_ORDER_BASED',
  coworking: 'SERVICE_ORDER_BASED',
  tattoo: 'SERVICE_ORDER_BASED',
  law: 'SERVICE_ORDER_BASED',
  confectionery: 'SERVICE_ORDER_BASED',
  real_estate: 'SERVICE_ORDER_BASED',
  consulting: 'SERVICE_ORDER_BASED',
  marketing_agency: 'SERVICE_ORDER_BASED',
  dev_studio: 'SERVICE_ORDER_BASED',
  event_planning: 'SERVICE_ORDER_BASED',
  travel_agency: 'SERVICE_ORDER_BASED',
  insurance: 'SERVICE_ORDER_BASED',
  landscaping: 'SERVICE_ORDER_BASED',
  plumbing: 'SERVICE_ORDER_BASED',
  electrician: 'SERVICE_ORDER_BASED',
  construction: 'SERVICE_ORDER_BASED',
  logistics: 'SERVICE_ORDER_BASED',
  tailoring: 'SERVICE_ORDER_BASED',
  daycare: 'SERVICE_ORDER_BASED',
  elderly_care: 'SERVICE_ORDER_BASED',
  pet_hotel: 'SERVICE_ORDER_BASED',
  dog_daycare: 'SERVICE_ORDER_BASED'
};

export function getBusinessMode(niche: string): BusinessMode {
  return NICHE_MODES[niche] || 'SCHEDULE_BASED';
}

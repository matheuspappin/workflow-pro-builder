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
  LandPlot
} from "lucide-react"
import { NicheType } from "@/config/niche-dictionary"

export const getNicheIcon = (niche: NicheType | string, type: 'client' | 'provider' | 'service' | 'establishment') => {
  const n = niche as NicheType;

  // Mapeamento por tipo de entidade e nicho
  if (type === 'client') {
    if (['pet_shop', 'vet', 'dog_daycare', 'dog_trainer', 'pet_hotel'].includes(n)) return PawPrint;
    if (['mechanic', 'auto_detail', 'car_wash'].includes(n)) return Car;
    if (['real_estate', 'construction'].includes(n)) return Home;
    if (['gym', 'crossfit', 'personal', 'pilates', 'yoga', 'martial_arts'].includes(n)) return User; // Membro/Atleta
    return Users; // Default generic
  }

  if (type === 'provider') {
    if (['school', 'language_school', 'tutoring', 'music_school'].includes(n)) return GraduationCap; // Professor
    if (['gym', 'crossfit', 'personal'].includes(n)) return Dumbbell; // Coach/Instrutor
    if (['health', 'clinic', 'physio', 'psychology', 'dentist', 'nutrition', 'podiatry', 'vet'].includes(n)) return Stethoscope; // Médico/Doutor
    if (['mechanic', 'electrician', 'plumbing', 'construction', 'tech_repair'].includes(n)) return Wrench; // Técnico/Mecânico
    if (['beauty', 'aesthetics', 'barber', 'tattoo', 'spa', 'auto_detail'].includes(n)) return Scissors; // Profissional manual
    if (['cooking_school', 'confectionery', 'restaurant', 'barista', 'brewery'].includes(n)) return Utensils; // Chef
    if (['art_studio', 'interior_design', 'tailoring', 'landscaping'].includes(n)) return Palette; // Criativo
    if (['photography', 'photographer'].includes(n)) return Camera;
    if (['law', 'consulting', 'accounting', 'marketing_agency', 'insurance', 'real_estate'].includes(n)) return Briefcase;
    return User;
  }

  if (type === 'service') {
    if (['school', 'language_school', 'tutoring', 'music_school', 'dance', 'yoga', 'pilates', 'martial_arts'].includes(n)) return Calendar; // Aula/Agenda
    if (['gym', 'crossfit', 'personal'].includes(n)) return Dumbbell; // Treino
    if (['mechanic', 'tech_repair', 'plumbing', 'electrician', 'cleaning', 'landscaping'].includes(n)) return Wrench; // Serviço/Reparo
    if (['consulting', 'law', 'psychology', 'nutrition', 'physio'].includes(n)) return Activity; // Sessão/Consulta
    if (['pet_shop', 'beauty', 'barber', 'spa'].includes(n)) return Scissors; // Procedimento
    if (['logistics'].includes(n)) return Truck;
    if (['retail', 'supermarket'].includes(n)) return ShoppingBag;
    return Calendar; // Default
  }

  return Activity;
}

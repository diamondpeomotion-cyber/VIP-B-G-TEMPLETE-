export interface OwnerUser {
  id: string;
  name: string;
  email: string;
}

export interface Salon {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  logoUrl: string;
  heroImageUrl: string;
  about: string;
  welcomeOffer: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  openingHours: string;
  primaryColor: string;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
  onboardingStep: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalonServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  bio: string;
  photoUrl: string;
}

export interface SiteBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  price: number;
  status: 'new' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
}

export interface SitePayload {
  salon: Salon;
  services: SalonServiceItem[];
  staff: StaffMember[];
  preview?: boolean;
  urls?: { pathUrl: string; subdomainUrl: string | null };
}

export interface SiteUrls {
  pathUrl: string;
  subdomainUrl: string | null;
  base: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
}

export interface AISuggestion {
  name: string;
  description: string;
  matchedServiceId: string;
  reasoning: string;
}

export interface ConsultResult {
  styles: AISuggestion[];
  overallAdvice: string;
  recommendedStylistId: string;
}

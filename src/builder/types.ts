export type UserRole = 'owner' | 'super_admin';

export interface OwnerUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: 'password' | 'google';
}

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface PlanInfo {
  id: SubscriptionPlan;
  label: string;
  status: string;
  limits: { services: number; staff: number; label: string };
}

export interface PlatformConfig {
  baseUrl: string;
  platformName: string;
  allowRegistrations: boolean;
  maintenanceMessage: string;
  googleAuthEnabled: boolean;
  googleClientId: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
  authProvider: string;
  createdAt: string;
  salon: { id: string; slug: string; name: string; plan: string; published: boolean } | null;
}

export interface AdminSalonRow {
  salon: Salon;
  owner: { email: string; name: string };
  counts: { services: number; staff: number; bookings: number };
}

export interface PlatformSettings {
  platformName: string;
  allowRegistrations: boolean;
  maintenanceMessage: string;
  defaultPlan: SubscriptionPlan;
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
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: string;
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
  /** Owner-controlled switch: can customers book this specialist online? */
  acceptingBookings: boolean;
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
  duration: number;
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
  /** True when the server served a curated local fallback (AI unreachable). */
  fallback?: boolean;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  reason?: 'booked' | 'past';
}

export interface AvailabilityResponse {
  date: string;
  serviceDuration: number;
  slots: AvailabilitySlot[];
}

export type Role = 'owner' | 'receptionist' | 'stylist' | 'client';

export interface Tenant {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  rating: number;
}

export interface SalonService {
  id: string;
  name: string;
  category: 'Hair & Styling' | 'Bridal & Makeup' | 'Skin & Facials' | 'Groom Shave & Beard Styling' | string;
  price: number;
  duration: number; // in minutes
  description: string;
  tenantId?: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  imageUrl: string;
  rating: number;
  bio: string;
  availableDays: number[]; // 0 for Sunday, 1 for Monday, etc.
}

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  paymentAmount: number;
  stylistId: string;
  stylistName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'booked' | 'checked_in' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'upi' | 'cash';
  notes?: string;
}

export interface ClientReview {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  serviceName: string;
  date: string;
}

export interface AISolution {
  styles: Array<{
    name: string;
    description: string;
    matchedServiceId: string;
    reasoning: string;
  }>;
  overallAdvice: string;
  recommendedStylistId: string;
}

export interface CampaignTemplate {
  title: string;
  channel: 'sms' | 'email' | 'instagram';
  subject?: string;
  copy: string;
  promoCode: string;
  discountValue: string;
  targetAudience: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredBranch: string;
  preferredStylist: string;
  hairTexture: string;
  facialShape: string;
  beveragePreference: string;
  notificationPreference: 'sms' | 'email' | 'both';
  allergiesOrSensitivities: string;
  specialInstructions: string;
}

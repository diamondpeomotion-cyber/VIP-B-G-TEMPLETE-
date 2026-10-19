/** Curated, license-friendly (Unsplash) imagery + starter palettes offered to
 *  salon owners while they personalize their website. Everything is optional —
 *  owners can paste their own URLs and pick any color. */

export interface CuratedImage {
  url: string;
  label: string;
}

export const HERO_IMAGES: CuratedImage[] = [
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600', label: 'Luxury salon interior' },
  { url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1600', label: 'Spa & wellness ritual' },
  { url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=1600', label: 'Hair styling atelier' },
  { url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=1600', label: 'Massage & spa therapy' },
  { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1600', label: 'Barbershop craft' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=1600', label: 'Bridal makeup artistry' },
  { url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=1600', label: 'Golden hour portrait' },
  { url: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&q=80&w=1600', label: 'Modern salon chairs' },
];

export const STAFF_PHOTOS: CuratedImage[] = [
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', label: 'Senior stylist (M)' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', label: 'Makeup artist (F)' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', label: 'Color specialist (M)' },
  { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', label: 'Aesthetician (F)' },
  { url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=400', label: 'Barber (M)' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', label: 'Hair expert (F)' },
  { url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400', label: 'Nail artist (F)' },
  { url: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=400', label: 'Studio lead (M)' },
];

export interface ColorPreset {
  name: string;
  primary: string;
  bg: string;
  surface: string;
  text: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Royal Heritage Gold', primary: '#c5a059', bg: '#0a0a0b', surface: '#121214', text: '#e5e5e5' },
  { name: 'Midnight Rose', primary: '#e59aa8', bg: '#12090d', surface: '#1c1016', text: '#f3e6ea' },
  { name: 'Emerald Luxe', primary: '#4cc38a', bg: '#081210', surface: '#0e1c17', text: '#ddf0e7' },
  { name: 'Noir & Crimson', primary: '#ef4444', bg: '#0d0a0a', surface: '#161112', text: '#ece3e3' },
  { name: 'Sapphire Spa', primary: '#6fa8ff', bg: '#090d14', surface: '#101826', text: '#e0e9f7' },
  { name: 'Ivory Daylight', primary: '#ad7e38', bg: '#faf7f2', surface: '#ffffff', text: '#26211a' },
];

export const SALON_CATEGORIES = [
  { value: 'BEAUTY', label: 'Beauty Salon & Spa' },
  { value: 'BARBER', label: 'Barbershop' },
  { value: 'TATTOO', label: 'Tattoo & Piercing Studio' },
  { value: 'NAILS', label: 'Nail Studio' },
  { value: 'BRIDAL', label: 'Bridal & Makeup Studio' },
];

export const SERVICE_CATEGORIES = [
  'Hair & Styling',
  'Skin & Facials',
  'Bridal & Makeup',
  'Groom Shave & Beard Styling',
  'Nails & Hand Care',
  'Spa & Massage',
  'Tattoo Art',
  'Other Services',
];

/** Optional one-click suggestions — explicitly chosen by the salon owner,
 *  never prefilled into their live website. */
export const SERVICE_IDEAS: Array<{ name: string; category: string; price: number; duration: number; description: string }> = [
  { name: 'Signature Haircut & Blow Dry', category: 'Hair & Styling', price: 800, duration: 45, description: 'Consultation, wash, precision cut and a professional blow-dry finish.' },
  { name: 'Global Hair Colour / Balayage', category: 'Hair & Styling', price: 4500, duration: 150, description: 'Ammonia-free global colour or hand-painted balayage with gloss seal.' },
  { name: 'Keratin Hair Spa', category: 'Hair & Styling', price: 2200, duration: 75, description: 'Deep-repair keratin spa with steam therapy for smooth, glossy hair.' },
  { name: 'Classic Facial & Clean-Up', category: 'Skin & Facials', price: 1500, duration: 60, description: 'Deep cleansing, exfoliation, extraction and a hydrating glow mask.' },
  { name: 'Manicure & Pedicure Combo', category: 'Nails & Hand Care', price: 1200, duration: 75, description: 'Cuticle care, shaping, massage and long-lasting polish.' },
  { name: 'Bridal HD Makeup', category: 'Bridal & Makeup', price: 15000, duration: 180, description: 'Long-wear HD bridal makeup with hairstyling, draping and lashes.' },
  { name: 'Beard Trim & Hot Towel Shave', category: 'Groom Shave & Beard Styling', price: 500, duration: 30, description: 'Hot towel prep, razor detailing and a soothing aftershave balm.' },
  { name: 'Full Body Relaxation Massage', category: 'Spa & Massage', price: 3000, duration: 90, description: 'Aromatherapy full-body massage to release stress and tension.' },
];

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

export function slugifySuggestion(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 32);
}

/** Appends an alpha channel to a 6-digit hex color. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${h}${a}`;
}

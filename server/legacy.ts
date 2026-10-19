/**
 * Legacy Nexora SalonOS demo backend (in-memory).
 *
 * This is the original demo experience ("Royal Tresses Jaipur") moved intact
 * behind the same /api/* routes that the demo frontend at /demo consumes.
 * It is completely in-memory and isolated from the production white-label
 * data stored in SQLite — real salons never see or share this demo data.
 */
import { Router } from 'express';

export const legacyRouter = Router();

// In-Memory Multi-Tenant Database (demo only)
const TENANTS = [
  {
    id: 'downtown-executive',
    name: 'Royal Tresses Atelier (C-Scheme)',
    address: 'Plot 14, Near Statue Circle, C-Scheme, Jaipur',
    phone: '+91 98290 12345',
    city: 'Jaipur',
    rating: 4.9,
  },
  {
    id: 'uptown-chic',
    name: 'Royal Tresses Studio (Malviya Nagar)',
    address: '3rd Floor, Near World Trade Park, Malviya Nagar, Jaipur',
    phone: '+91 94140 54321',
    city: 'Jaipur',
    rating: 4.8,
  },
  {
    id: 'coastal-breeze',
    name: 'Royal Tresses Luxury Spa (Vaishali Nagar)',
    address: 'Near Amrapali Circle, Vaishali Nagar, Jaipur',
    phone: '+91 97840 98765',
    city: 'Jaipur',
    rating: 4.7,
  }
];

const SERVICES = [
  // C-Scheme (Executive)
  { id: 's-1', name: 'Signature Precision Cut & Blow Dry', category: 'Hair & Styling', price: 850, duration: 45, description: 'Executive hair wash, customized precision cut, blow-dry molding and luxury botanical argan serum.', tenantId: 'downtown-executive' },
  { id: 's-2', name: 'Moroccan Argan Hair Spa & Scalp Detox', category: 'Hair & Styling', price: 1800, duration: 60, description: 'Deep nourishing hair spa with lukewarm essential oil infusion mask, steam acupressure, and ultrasonic head wash.', tenantId: 'downtown-executive' },
  { id: 's-3', name: 'Gold Radiance Kesar-Chandan Facial', category: 'Skin & Facials', price: 2400, duration: 75, description: 'Pure 24k gold leaf and sandalwood herbal face therapy, deep vacuum extractions, and saffron radiance glow pack.', tenantId: 'downtown-executive' },
  { id: 's-4', name: 'Royal Rajputana Bridal Makeup & Draping', category: 'Bridal & Makeup', price: 15000, duration: 180, description: 'HD bridal makeup, heritage jewelry & borla placement, luxury dupatta draping, and setting mist.', tenantId: 'downtown-executive' },
  { id: 's-5', name: 'Royal Maharaja Shave & Beard Sculpting', category: 'Groom Shave & Beard Styling', price: 650, duration: 40, description: 'Hot towel herbal prep, straight razor precision edging, organic sandalwood balm, and relaxing neck massage.', tenantId: 'downtown-executive' },

  // Malviya Nagar (WTP)
  { id: 's-6', name: 'Balayage & Global Silk Hair Coloring', category: 'Hair & Styling', price: 4500, duration: 150, description: 'Hand-painted color highlights curated for Indian hair movement with ammonia-free tone corrector and bonding glaze.', tenantId: 'uptown-chic' },
  { id: 's-7', name: 'Charcoal Detox & Hydra-Glow Facial', category: 'Skin & Facials', price: 2800, duration: 80, description: 'Hydro-dermabrasion deep pore cleansing, active oxygen glow serum, and cooling peptide antioxidant pack.', tenantId: 'uptown-chic' },
  { id: 's-8', name: 'Diamond Glow Polishing & Manicure', category: 'Skin & Facials', price: 1200, duration: 50, description: 'Exfoliating diamond crystal scrub, hand massage, cuticles nourishment, and high-shine gel finish.', tenantId: 'uptown-chic' },
  { id: 's-9', name: 'Pre-Bridal Ubtan & Haldi Glow Ritual', category: 'Bridal & Makeup', price: 6500, duration: 120, description: 'Traditional Rajasthani ubtan body polishing, saffron skin lightening massage, and rosewater hydrating pack.', tenantId: 'uptown-chic' },

  // Vaishali Nagar (Spa Retreat)
  { id: 's-10', name: 'Keratin Smoothing & Hair Botox Therapy', category: 'Hair & Styling', price: 5500, duration: 120, description: 'Formaldehyde-free keratin protein smoothing formula optimizing frizz control for up to 5 months.', tenantId: 'coastal-breeze' },
  { id: 's-11', name: 'Ayurvedic Herbal Foot Spa & Pedicure', category: 'Skin & Facials', price: 950, duration: 45, description: 'Warm neem-camphor botanical foot soak, sea salt pumice exfoliation, foot acupressure, and lasting polish.', tenantId: 'coastal-breeze' },
  { id: 's-12', name: 'Luxury Ayurvedic Head & Shoulder Massage', category: 'Hair & Styling', price: 1200, duration: 60, description: 'Traditional Indian Champi using warm Brahmi & Bhringraj oils targeting scalp pressure points.', tenantId: 'coastal-breeze' },
  { id: 's-13', name: 'Kumkumadi Tailam Rejuvenating Facial', category: 'Skin & Facials', price: 2200, duration: 60, description: 'Authentic saffron oil face therapy to heal sun damage, reduce pigmentation, and revive youthful glow.', tenantId: 'coastal-breeze' },
];

const STYLISTS = [
  {
    id: 'sty-1',
    name: 'Aarav Sharma',
    specialties: ['Signature Precision Cuts', 'Moroccan Hair Spa', 'Beard Sculpting'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 4.9,
    bio: 'Educated at Toni&Guy, Aarav has styled Jaipur high-society and bridal parties with clean, architectural precision cuts.',
    availableDays: [1, 2, 3, 4, 5], // Mon to Fri
    tenantIds: ['downtown-executive', 'uptown-chic']
  },
  {
    id: 'sty-2',
    name: 'Priya Sen',
    specialties: ['Royal Rajputana Bridal Makeup', 'Saree & Dupatta Draping', 'Airbrush Artistry'],
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 4.9,
    bio: 'Award-winning bridal makeup artist renowned for exquisite royal Rajasthani bridal looks and modern red-carpet glam.',
    availableDays: [2, 3, 4, 5, 6], // Tue to Sat
    tenantIds: ['downtown-executive', 'uptown-chic']
  },
  {
    id: 'sty-3',
    name: 'Rohan Verma',
    specialties: ['Balayage & Hair Coloring', 'Keratin & Botox', 'Hair Spa Treatments'],
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
    bio: 'Color maestro with 8+ years expertise in ammonia-free hair toning, honey balayage, and restorative hair wellness.',
    availableDays: [0, 1, 3, 4, 6], // Sun, Mon, Wed, Thu, Sat
    tenantIds: ['uptown-chic', 'coastal-breeze']
  },
  {
    id: 'sty-4',
    name: 'Sneha Kapoor',
    specialties: ['Gold Kesar-Chandan Facials', 'Hydra-Glow Therapy', 'Ayurvedic Skin Care'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    rating: 4.9,
    bio: 'Certified Ayurvedic aesthetician combining ancient Indian herbal formulations with modern hydro-dermabrasion.',
    availableDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
    tenantIds: ['downtown-executive', 'coastal-breeze', 'uptown-chic']
  },
];

// Initial Bookings Database in INR
let APPOINTMENTS = [
  {
    id: 'apt-101',
    tenantId: 'downtown-executive',
    clientId: 'usr-201',
    clientName: 'Ananya Singhania',
    clientEmail: 'ananya.s@example.com',
    serviceId: 's-2',
    serviceName: 'Moroccan Argan Hair Spa & Scalp Detox',
    paymentAmount: 1800,
    stylistId: 'sty-1',
    stylistName: 'Aarav Sharma',
    date: '2026-06-03',
    time: '10:00',
    status: 'booked' as const,
    paymentStatus: 'paid' as const,
    paymentMethod: 'upi' as const,
    notes: 'Thick wavy hair, prefers lukewarm organic oil massage and gentle blow-dry'
  },
  {
    id: 'apt-102',
    tenantId: 'downtown-executive',
    clientId: 'usr-202',
    clientName: 'Vikramaditya Rathore',
    clientEmail: 'vikram.rathore@example.com',
    serviceId: 's-5',
    serviceName: 'Royal Maharaja Shave & Beard Sculpting',
    paymentAmount: 650,
    stylistId: 'sty-1',
    stylistName: 'Aarav Sharma',
    date: '2026-06-03',
    time: '11:15',
    status: 'checked_in' as const,
    paymentStatus: 'paid' as const,
    paymentMethod: 'cash' as const,
    notes: 'Hot towel prep and sandalwood aftershave requested'
  },
  {
    id: 'apt-103',
    tenantId: 'uptown-chic',
    clientId: 'usr-203',
    clientName: 'Meera Chordia',
    clientEmail: 'meera.chordia@example.com',
    serviceId: 's-4',
    serviceName: 'Royal Rajputana Bridal Makeup & Draping',
    paymentAmount: 15000,
    stylistId: 'sty-2',
    stylistName: 'Priya Sen',
    date: '2026-06-03',
    time: '14:30',
    status: 'completed' as const,
    paymentStatus: 'paid' as const,
    paymentMethod: 'card' as const,
    notes: 'Heritage bridal look with traditional Rajasthani borla placement'
  },
  {
    id: 'apt-104',
    tenantId: 'coastal-breeze',
    clientId: 'usr-204',
    clientName: 'Rajeshwari Shekhawat',
    clientEmail: 'rajeshwari.s@example.com',
    serviceId: 's-13',
    serviceName: 'Kumkumadi Tailam Rejuvenating Facial',
    paymentAmount: 2200,
    stylistId: 'sty-4',
    stylistName: 'Sneha Kapoor',
    date: '2026-06-04',
    time: '09:00',
    status: 'booked' as const,
    paymentStatus: 'pending' as const,
    notes: 'Sensitive skin; prefers mild saffron-turmeric pack'
  }
];

// Transaction logs for showing webhook events
let WEBHOOK_EVENTS: Array<{ id: string; timestamp: string; event: string; payload: any }> = [];

// In-Memory Ledger structures in Indian Rupees (₹)
let SHOP_WALLETS: Record<string, { balance: number; reservedBalance: number; totalEarned: number }> = {
  'downtown-executive': { balance: 48500, reservedBalance: 8200, totalEarned: 185000 },
  'uptown-chic': { balance: 34200, reservedBalance: 15000, totalEarned: 142000 },
  'coastal-breeze': { balance: 26800, reservedBalance: 6500, totalEarned: 98000 }
};

interface WalletTx {
  id: string;
  tenantId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_HOLD' | 'ESCROW_RELEASE';
  amount: number;
  description: string;
  createdAt: string;
}

let WALLET_TRANSACTIONS: Array<WalletTx> = [
  { id: 'tx-1', tenantId: 'downtown-executive', type: 'DEPOSIT', amount: 1800, description: 'UPI Checkout Captured for Moroccan Hair Spa (Ananya Singhania)', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'tx-2', tenantId: 'downtown-executive', type: 'DEPOSIT', amount: 650, description: 'Cash Counter Settlement for Royal Shave (Vikramaditya Rathore)', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx-3', tenantId: 'uptown-chic', type: 'DEPOSIT', amount: 15000, description: 'Razorpay Payment Captured for Royal Bridal Makeup (Meera Chordia)', createdAt: new Date(Date.now() - 5400000).toISOString() }
];

interface WithdrawalReq {
  id: string;
  tenantId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  bankDetails: string;
  createdAt: string;
  processedAt?: string;
}

let WITHDRAWAL_REQUESTS: Array<WithdrawalReq> = [
  { id: 'w-1', tenantId: 'downtown-executive', amount: 25000, status: 'PROCESSED', bankDetails: 'HDFC Bank, C-Scheme Branch (A/C: 50100492834092, IFSC: HDFC0000054)', createdAt: new Date(Date.now() - 86400000).toISOString(), processedAt: new Date(Date.now() - 72000000).toISOString() },
  { id: 'w-2', tenantId: 'uptown-chic', amount: 15000, status: 'PENDING', bankDetails: 'ICICI Bank, Malviya Nagar WTP Branch (A/C: 001205018812, IFSC: ICIC0000104)', createdAt: new Date().toISOString() }
];

let CUSTOMER_WALLET = {
  balance: 750 // Client simulation starting wallet balance in ₹
};

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

let CUSTOMER_PROFILE: CustomerProfile = {
  id: 'usr-client-sim',
  name: 'Ananya Singhania',
  email: 'client@royaltresses.in',
  phone: '+91 98290 87654',
  preferredBranch: 'downtown-executive',
  preferredStylist: 'Priya Sen',
  hairTexture: 'Wavy / Thick Indian Silk',
  facialShape: 'Oval Contour',
  beveragePreference: 'Saffron Masala Chai or Chilled Badam Milk',
  notificationPreference: 'both',
  allergiesOrSensitivities: 'Sulfate-sensitive scalp; prefers organic herbal oils & ammonia-free botanical colors',
  specialInstructions: 'Loves traditional almond oil head champi, warm herbal towel, and natural volume blow-dry.'
};

interface ReferralObj {
  id: string;
  referrerEmail: string;
  refereeEmail: string;
  status: 'PENDING' | 'REWARDED';
  rewardValue: number;
  createdAt: string;
}

let REFERRALS: Array<ReferralObj> = [
  { id: 'ref-1', referrerEmail: 'client@royaltresses.in', refereeEmail: 'ishita.jaipur@example.com', status: 'REWARDED', rewardValue: 500, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }
];

interface ThemeConfigObj {
  id: string;
  shopCategory: 'BARBER' | 'BEAUTY' | 'TATTOO';
  primaryColor: string;
  secondaryColor: string;
  customCss: string;
  selectedPreset: string;
}

let THEME_CONFIGS: Record<string, ThemeConfigObj> = {
  'downtown-executive': { id: 'cfg-1', shopCategory: 'BEAUTY', primaryColor: '#c5a059', secondaryColor: '#121214', customCss: '', selectedPreset: 'Royal Heritage Gold' },
  'uptown-chic': { id: 'cfg-2', shopCategory: 'BEAUTY', primaryColor: '#c5a059', secondaryColor: '#121214', customCss: '', selectedPreset: 'Royal Heritage Gold' },
  'coastal-breeze': { id: 'cfg-3', shopCategory: 'BEAUTY', primaryColor: '#c5a059', secondaryColor: '#121214', customCss: '', selectedPreset: 'Royal Heritage Gold' },
};

// REST Backend API Routes
legacyRouter.get('/api/tenants', (req, res) => {
  res.json(TENANTS);
});

legacyRouter.get('/api/services', (req, res) => {
  const { tenantId } = req.query;
  if (tenantId) {
    const filtered = SERVICES.filter(s => s.tenantId === tenantId);
    return res.json(filtered);
  }
  res.json(SERVICES);
});

legacyRouter.get('/api/stylists', (req, res) => {
  const { tenantId } = req.query;
  if (tenantId) {
    const filtered = STYLISTS.filter(s => s.tenantIds.includes(tenantId as string));
    return res.json(filtered);
  }
  res.json(STYLISTS);
});

legacyRouter.get('/api/appointments', (req, res) => {
  const { tenantId, stylistId, clientId } = req.query;
  let filtered = [...APPOINTMENTS];

  if (tenantId) {
    filtered = filtered.filter(a => a.tenantId === tenantId);
  }
  if (stylistId) {
    filtered = filtered.filter(a => a.stylistId === stylistId);
  }
  if (clientId) {
    filtered = filtered.filter(a => a.clientId === clientId);
  }

  res.json(filtered);
});

const LEGACY_STATUSES = new Set(['booked', 'checked_in', 'completed', 'cancelled']);
const LEGACY_PAY_STATUSES = new Set(['pending', 'paid', 'failed', 'refunded']);

legacyRouter.post('/api/appointments', (req, res) => {
  const { tenantId, clientName, clientEmail, serviceId, stylistId, date, time, notes, paymentStatus } = req.body;

  if (!tenantId || !clientName || !serviceId || !stylistId || !date || !time) {
    return res.status(400).json({ error: 'Missing required appointment parameters' });
  }
  if (!TENANTS.some(t => t.id === tenantId)) {
    return res.status(404).json({ error: 'Salon branch not found' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Please choose a valid appointment date (YYYY-MM-DD).' });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return res.status(400).json({ error: 'Please choose a valid time slot (HH:MM).' });
  }

  const service = SERVICES.find(s => s.id === serviceId);
  const stylist = STYLISTS.find(st => st.id === stylistId);

  if (!service || !stylist) {
    return res.status(404).json({ error: 'Service or Stylist not found' });
  }
  if ((service as any).tenantId !== tenantId) {
    return res.status(400).json({ error: 'That service is not offered at this branch.' });
  }
  if (!(stylist as any).tenantIds?.includes(tenantId)) {
    return res.status(400).json({ error: 'That specialist does not work at this branch.' });
  }

  // Demo double-booking guard: same specialist, same day, overlapping window.
  const startMin = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const endMin = startMin + (service.duration || 30);
  const clash = APPOINTMENTS.find(a => {
    if (a.tenantId !== tenantId || a.stylistId !== stylistId || a.date !== date) return false;
    const aStatus = a.status as string;
    if (aStatus === 'cancelled' || aStatus === 'completed') return false;
    const svc = SERVICES.find(s => s.id === a.serviceId);
    const aStart = Number(a.time.slice(0, 2)) * 60 + Number(a.time.slice(3, 5));
    const aEnd = aStart + (svc?.duration || 30);
    return startMin < aEnd && aStart < endMin;
  });
  if (clash) {
    return res.status(409).json({
      error: `Sorry — ${stylist.name} is already booked around ${clash.time} on ${date}. Please pick another time.`,
      code: 'SLOT_TAKEN',
    });
  }

  const payStatObj = LEGACY_PAY_STATUSES.has(paymentStatus) ? paymentStatus : 'pending';

  const newApt = {
    id: `apt-${Date.now()}`,
    tenantId,
    clientId: 'usr-client-simulated', // Logged in simulated user client
    clientName,
    clientEmail: clientEmail || 'client@royaltresses.in',
    serviceId,
    serviceName: service.name,
    paymentAmount: service.price,
    stylistId,
    stylistName: stylist.name,
    date,
    time,
    status: 'booked' as const,
    paymentStatus: payStatObj as any,
    notes: notes || '',
  };

  APPOINTMENTS.push(newApt);

  // Manage in-memory PRISMA escrow ledger
  if (!SHOP_WALLETS[tenantId]) {
    SHOP_WALLETS[tenantId] = { balance: 0, reservedBalance: 0, totalEarned: 0 };
  }

  if (payStatObj === 'pending') {
    SHOP_WALLETS[tenantId].reservedBalance += service.price;
    WALLET_TRANSACTIONS.unshift({
      id: `tx-${Date.now()}`,
      tenantId,
      type: 'ESCROW_HOLD',
      amount: service.price,
      description: `Pending Appointment ${newApt.id} Escrow Secure (${clientName})`,
      createdAt: new Date().toISOString()
    });
  } else if (payStatObj === 'paid') {
    SHOP_WALLETS[tenantId].balance += service.price;
    SHOP_WALLETS[tenantId].totalEarned += service.price;
    WALLET_TRANSACTIONS.unshift({
      id: `tx-${Date.now()}`,
      tenantId,
      type: 'DEPOSIT',
      amount: service.price,
      description: `Immediate Checkout for ${newApt.id} (${clientName})`,
      createdAt: new Date().toISOString()
    });
  }

  res.status(201).json(newApt);
});

legacyRouter.patch('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentMethod, notes } = req.body;

  const aptIndex = APPOINTMENTS.findIndex(a => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  if (status !== undefined && !LEGACY_STATUSES.has(status)) {
    return res.status(400).json({ error: `Invalid status. Choose one of: ${Array.from(LEGACY_STATUSES).join(', ')}.` });
  }
  if (paymentStatus !== undefined && !LEGACY_PAY_STATUSES.has(paymentStatus)) {
    return res.status(400).json({ error: `Invalid payment status. Choose one of: ${Array.from(LEGACY_PAY_STATUSES).join(', ')}.` });
  }

  const prevApt = APPOINTMENTS[aptIndex];
  const updated = {
    ...prevApt,
    ...(status && { status }),
    ...(paymentStatus && { paymentStatus }),
    ...(paymentMethod && { paymentMethod }),
    ...(notes !== undefined && { notes }),
  };

  APPOINTMENTS[aptIndex] = updated;

  // Run the automated refund scanner asynchronously so the workflow verifies and processes the cancel in the background!
  setTimeout(() => {
    verifyAndProcessAutomatedRefunds();
  }, 50);

  res.json(updated);
});

// Simulated Razorpay API Refund Engine & Background Scanner
export const AUTOMATED_REFUND_CONFIG: Record<string, boolean> = {
  'downtown-executive': true,
  'uptown-chic': true,
  'coastal-breeze': true,
};

export async function triggerRazorpayApiRefund(paymentId: string, amount: number) {
  console.log(`[Razorpay API] POST /v1/payments/${paymentId}/refunds - Requesting simulated Razorpay API refund of amount: ₹${amount}`);
  return {
    id: `rfnd_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
    payment_id: paymentId,
    amount: amount * 100, // Razorpay uses paise
    currency: 'INR',
    status: 'refunded',
    created_at: Math.floor(Date.now() / 1000)
  };
}

export function verifyAndProcessAutomatedRefunds() {
  let processedCount = 0;

  for (let i = 0; i < APPOINTMENTS.length; i++) {
    const apt = APPOINTMENTS[i] as any;

    // Scan for cancelled appointments with successful processed payments (status = paid)
    if (apt.status === 'cancelled' && apt.paymentStatus === 'paid') {
      // Check if automated refund is enabled for this specific branch
      const isEnabled = AUTOMATED_REFUND_CONFIG[apt.tenantId] !== false;
      if (!isEnabled) {
        console.log(`[Automated Refund Scanner] Automated refund is disabled for branch ${apt.tenantId}. Skipping booking ${apt.id}.`);
        continue;
      }

      const refundAmount = apt.paymentAmount;
      const paymentId = `pay_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      console.log(`[Automated Refund Scanner] Found CANCELLED paid booking (ID: ${apt.id}) for client: ${apt.clientName}. Triggering refund workflow...`);

      // 1. Trigger simulated Razorpay API Refund
      triggerRazorpayApiRefund(paymentId, refundAmount);

      // 2. Simultaneously credit customer's CustomerWallet
      CUSTOMER_WALLET.balance += refundAmount;

      // 3. Deduct from the tenant salon's ledger wallet balance to reflect the refund
      if (SHOP_WALLETS[apt.tenantId]) {
        SHOP_WALLETS[apt.tenantId].balance = Math.max(0, SHOP_WALLETS[apt.tenantId].balance - refundAmount);
      }

      // 4. Log the transaction in the WalletTransaction table (WALLET_TRANSACTIONS list)
      WALLET_TRANSACTIONS.unshift({
        id: `tx-ref-${Date.now()}-${apt.id}`,
        tenantId: apt.tenantId,
        type: 'WITHDRAWAL', // Matches the defined WalletTx type definition
        amount: refundAmount,
        description: `Automated Razorpay Refund for Cancelled Appointment ${apt.id} (${apt.clientName})`,
        createdAt: new Date().toISOString()
      });

      // 5. Transition booking paymentStatus to 'refunded' so it is not processed again
      apt.paymentStatus = 'refunded';

      // 6. Push a 'payment.refunded' simulation webhook event to the Razorpay event log
      const refundWebhook = {
        id: `event_ref_${Date.now()}_${apt.id}`,
        timestamp: new Date().toISOString(),
        event: 'payment.refunded',
        payload: {
          entity: 'event',
          account_id: 'acc_ROYAL_TRESSES_JAIPUR_001',
          payment: {
            entity: {
              id: paymentId,
              entity: 'payment',
              amount: refundAmount * 100,
              currency: 'INR',
              status: 'refunded',
              method: apt.paymentMethod || 'upi',
              email: apt.clientEmail || 'client@royaltresses.in',
              notes: {
                appointment_id: apt.id,
                tenant_id: apt.tenantId,
                platform: 'Royal Tresses Jaipur',
                refund_reason: 'Automated Booking Cancellation Refund'
              }
            }
          }
        }
      };
      WEBHOOK_EVENTS.unshift(refundWebhook);
      processedCount++;
    }
  }

  return processedCount;
}

// REST Endpoint to trigger manual scanner sweeping immediately
legacyRouter.post('/api/payments/refund-scan', (req, res) => {
  const count = verifyAndProcessAutomatedRefunds();
  res.json({ success: true, processedCount: count, balance: CUSTOMER_WALLET.balance, transactionsCount: WALLET_TRANSACTIONS.length });
});

// GET and POST endpoints for automated refund config
legacyRouter.get('/api/payments/refund-config', (req, res) => {
  res.json(AUTOMATED_REFUND_CONFIG);
});

legacyRouter.post('/api/payments/refund-config', (req, res) => {
  const { tenantId, enabled } = req.body;
  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenantId' });
  }
  AUTOMATED_REFUND_CONFIG[tenantId] = !!enabled;
  res.json({ success: true, config: AUTOMATED_REFUND_CONFIG });
});

// Simulated payment gateway & background Razorpay webhooks
legacyRouter.post('/api/payments/pay', (req, res) => {
  const { appointmentId, paymentMethod, currency = 'INR' } = req.body;

  const aptIndex = APPOINTMENTS.findIndex(a => a.id === appointmentId);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const appointment = APPOINTMENTS[aptIndex];
  const originalPaymentStatus = appointment.paymentStatus;

  // Simulate transactional Razorpay Payment processing
  const transactionId = `pay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const rzpOrderId = `order_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const rzpSignature = `sig_${Math.random().toString(36).substr(2, 24).toLowerCase()}`;

  // Update payment records
  APPOINTMENTS[aptIndex] = {
    ...appointment,
    paymentStatus: 'paid',
    paymentMethod: paymentMethod || 'upi',
  };

  const tenantId = appointment.tenantId;
  const price = appointment.paymentAmount;

  // Realize wallet updates
  if (!SHOP_WALLETS[tenantId]) {
    SHOP_WALLETS[tenantId] = { balance: 0, reservedBalance: 0, totalEarned: 0 };
  }

  if (originalPaymentStatus === 'pending') {
    // Release from Escrow and deposit to main balance
    SHOP_WALLETS[tenantId].reservedBalance = Math.max(0, SHOP_WALLETS[tenantId].reservedBalance - price);
    SHOP_WALLETS[tenantId].balance += price;
    SHOP_WALLETS[tenantId].totalEarned += price;

    WALLET_TRANSACTIONS.unshift({
      id: `tx-rel-${Date.now()}`,
      tenantId,
      type: 'ESCROW_RELEASE',
      amount: price,
      description: `Escrow Released for Completed Checkout (Apt: ${appointmentId})`,
      createdAt: new Date().toISOString()
    });
  } else if (originalPaymentStatus !== 'paid') {
    // Simple direct deposit if it somehow didn't hold escrow
    SHOP_WALLETS[tenantId].balance += price;
    SHOP_WALLETS[tenantId].totalEarned += price;

    WALLET_TRANSACTIONS.unshift({
      id: `tx-dep-${Date.now()}`,
      tenantId,
      type: 'DEPOSIT',
      amount: price,
      description: `Direct Payment Received (Apt: ${appointmentId})`,
      createdAt: new Date().toISOString()
    });
  }

  // Generate webhooks event logs
  const webhookEvent = {
    id: `event_${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'payment.captured',
    payload: {
      entity: 'event',
      account_id: 'acc_ROYAL_TRESSES_JAIPUR_001',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: transactionId,
            entity: 'payment',
            amount: appointment.paymentAmount * 100, // Razorpay uses paise
            currency: currency,
            status: 'captured',
            order_id: rzpOrderId,
            method: paymentMethod || 'upi',
            email: appointment.clientEmail,
            notes: {
              appointment_id: appointmentId,
              tenant_id: appointment.tenantId,
              platform: 'Royal Tresses Jaipur'
            }
          }
        }
      }
    }
  };

  WEBHOOK_EVENTS.unshift(webhookEvent);

  res.json({
    success: true,
    transactionId,
    orderId: rzpOrderId,
    signature: rzpSignature,
    appointment: APPOINTMENTS[aptIndex]
  });
});

legacyRouter.get('/api/payments/webhooks', (req, res) => {
  res.json(WEBHOOK_EVENTS);
});

// Prisma Billing & White-Label Customization API endpoints
legacyRouter.get('/api/wallet-info', (req, res) => {
  const { tenantId } = req.query;
  const tId = (tenantId as string) || 'downtown-executive';

  if (!SHOP_WALLETS[tId]) {
    SHOP_WALLETS[tId] = { balance: 0, reservedBalance: 0, totalEarned: 0 };
  }

  res.json({
    wallet: SHOP_WALLETS[tId],
    transactions: WALLET_TRANSACTIONS.filter(t => t.tenantId === tId),
    withdrawals: WITHDRAWAL_REQUESTS.filter(w => w.tenantId === tId)
  });
});

legacyRouter.post('/api/wallet/withdraw', (req, res) => {
  const { tenantId, amount, bankDetails } = req.body;
  if (!tenantId || !amount || !bankDetails) {
    return res.status(400).json({ error: 'Missing withdrawal params' });
  }

  const wAmount = Number(amount);
  const wallet = SHOP_WALLETS[tenantId];
  if (!wallet || wallet.balance < wAmount) {
    return res.status(400).json({ error: 'Insufficient wallet balance for transfer request' });
  }

  // Deduct main balance of wallet
  wallet.balance -= wAmount;

  const newWithdrawal: WithdrawalReq = {
    id: `w-${Date.now()}`,
    tenantId,
    amount: wAmount,
    status: 'PENDING',
    bankDetails,
    createdAt: new Date().toISOString()
  };

  WITHDRAWAL_REQUESTS.unshift(newWithdrawal);

  WALLET_TRANSACTIONS.unshift({
    id: `tx-${Date.now()}`,
    tenantId,
    type: 'WITHDRAWAL',
    amount: wAmount,
    description: `Withdrawal request submitted (${bankDetails})`,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, withdrawal: newWithdrawal, wallet });
});

legacyRouter.post('/api/wallet/settle-withdrawal', (req, res) => {
  const { id } = req.body;
  const wIndex = WITHDRAWAL_REQUESTS.findIndex(w => w.id === id);
  if (wIndex === -1) {
    return res.status(404).json({ error: 'Withdrawal record not found' });
  }

  WITHDRAWAL_REQUESTS[wIndex].status = 'PROCESSED';
  WITHDRAWAL_REQUESTS[wIndex].processedAt = new Date().toISOString();

  res.json({ success: true, withdrawal: WITHDRAWAL_REQUESTS[wIndex] });
});

legacyRouter.get('/api/theme-config', (req, res) => {
  const { tenantId } = req.query;
  const tId = (tenantId as string) || 'downtown-executive';

  if (!THEME_CONFIGS[tId]) {
    THEME_CONFIGS[tId] = {
      id: `cfg-${Date.now()}`,
      shopCategory: 'BEAUTY',
      primaryColor: '#c5a059',
      secondaryColor: '#121214',
      customCss: '',
      selectedPreset: 'Sophisticated Dark'
    };
  }
  res.json(THEME_CONFIGS[tId]);
});

legacyRouter.post('/api/theme-config', (req, res) => {
  const { tenantId, shopCategory, primaryColor, secondaryColor, customCss, selectedPreset } = req.body;
  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenantId parameter' });
  }

  THEME_CONFIGS[tenantId] = {
    id: THEME_CONFIGS[tenantId]?.id || `cfg-${Date.now()}`,
    shopCategory: shopCategory || 'BEAUTY',
    primaryColor: primaryColor || '#c5a059',
    secondaryColor: secondaryColor || '#121214',
    customCss: customCss || '',
    selectedPreset: selectedPreset || 'Sophisticated Dark'
  };

  res.json({ success: true, config: THEME_CONFIGS[tenantId] });
});

legacyRouter.get('/api/customer-info', (req, res) => {
  res.json({
    balance: CUSTOMER_WALLET.balance,
    referrals: REFERRALS
  });
});

legacyRouter.get('/api/customer/profile', (req, res) => {
  res.json(CUSTOMER_PROFILE);
});

legacyRouter.put('/api/customer/profile', (req, res) => {
  const {
    name, email, phone, preferredBranch, preferredStylist,
    hairTexture, facialShape, beveragePreference,
    notificationPreference, allergiesOrSensitivities, specialInstructions
  } = req.body;

  if (name !== undefined && typeof name === 'string') CUSTOMER_PROFILE.name = name.trim();
  if (email !== undefined && typeof email === 'string') CUSTOMER_PROFILE.email = email.trim();
  if (phone !== undefined && typeof phone === 'string') CUSTOMER_PROFILE.phone = phone.trim();
  if (preferredBranch !== undefined) CUSTOMER_PROFILE.preferredBranch = preferredBranch;
  if (preferredStylist !== undefined) CUSTOMER_PROFILE.preferredStylist = preferredStylist;
  if (hairTexture !== undefined) CUSTOMER_PROFILE.hairTexture = hairTexture;
  if (facialShape !== undefined) CUSTOMER_PROFILE.facialShape = facialShape;
  if (beveragePreference !== undefined) CUSTOMER_PROFILE.beveragePreference = beveragePreference;
  if (notificationPreference !== undefined) CUSTOMER_PROFILE.notificationPreference = notificationPreference;
  if (allergiesOrSensitivities !== undefined) CUSTOMER_PROFILE.allergiesOrSensitivities = allergiesOrSensitivities;
  if (specialInstructions !== undefined) CUSTOMER_PROFILE.specialInstructions = specialInstructions;

  // Also reflect name and email updates into appointments of this client
  APPOINTMENTS.forEach(apt => {
    if (apt.clientId === CUSTOMER_PROFILE.id || apt.clientEmail === CUSTOMER_PROFILE.email || apt.clientName === 'Ananya Singhania') {
      if (CUSTOMER_PROFILE.name) apt.clientName = CUSTOMER_PROFILE.name;
      if (CUSTOMER_PROFILE.email) apt.clientEmail = CUSTOMER_PROFILE.email;
    }
  });

  res.json({ success: true, profile: CUSTOMER_PROFILE, message: 'Profile updated successfully' });
});

legacyRouter.post('/api/customer/refer', (req, res) => {
  const { refereeEmail } = req.body;
  if (!refereeEmail) {
    return res.status(400).json({ error: 'Please supply a friend\'s valid email address' });
  }

  const alreadyReferred = REFERRALS.some(r => r.refereeEmail === refereeEmail);
  if (alreadyReferred) {
    return res.status(400).json({ error: 'This friend and email context is already registered in database' });
  }

  // Credit client wallet with ₹500 referral bounty
  CUSTOMER_WALLET.balance += 500;

  const newRef: ReferralObj = {
    id: `ref-${Date.now()}`,
    referrerEmail: 'client@royaltresses.in',
    refereeEmail: refereeEmail,
    status: 'REWARDED',
    rewardValue: 500,
    createdAt: new Date().toISOString()
  };

  REFERRALS.unshift(newRef);
  res.json({ success: true, balance: CUSTOMER_WALLET.balance, referral: newRef });
});

legacyRouter.post('/api/customer/apply-credit', (req, res) => {
  const { amount } = req.body;
  const numAmt = Number(amount);
  if (isNaN(numAmt) || numAmt <= 0) {
    return res.status(400).json({ error: 'Invalid credit amount' });
  }

  if (CUSTOMER_WALLET.balance < numAmt) {
    return res.status(400).json({ error: 'Insufficient credits in custom client wallet' });
  }

  CUSTOMER_WALLET.balance -= numAmt;
  res.json({ success: true, balance: CUSTOMER_WALLET.balance });
});

/** Starts the demo background refund daemon used by the SalonOS demo app. */
export function startLegacyRefundDaemon() {
  setInterval(() => {
    verifyAndProcessAutomatedRefunds();
  }, 6000).unref();
}

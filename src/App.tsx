import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, User, Search, RefreshCw, Scissors, ShieldAlert, 
  Coins, TrendingUp, Layers, Check, Plus, AlertCircle, Clock, 
  ShoppingBag, CreditCard, ChevronRight, MapPin, CheckCircle, 
  HelpCircle, MessageSquare, Briefcase, Play, Eye, Power, CheckCircle2, X
} from 'lucide-react';
import { Role, Tenant, SalonService, Stylist, Appointment, AISolution, CampaignTemplate, CustomerProfile } from './types';
import PaymentModal from './components/PaymentModal';
import ProfileView from './components/profile/ProfileView';

export default function App() {
  // Navigation & Role States
  const [activeRole, setActiveRole] = useState<Role>('owner');
  const [activeTenantId, setActiveTenantId] = useState<string>('downtown-executive');
  
  // Data States loaded from Express Database
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Selected items & interactive triggers
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  
  // Client Booking Form States
  const [bookingClientName, setBookingClientName] = useState<string>('');
  const [bookingClientEmail, setBookingClientEmail] = useState<string>('');
  const [bookingServiceId, setBookingServiceId] = useState<string>('');
  const [bookingStylistId, setBookingStylistId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('2026-06-04');
  const [bookingTime, setBookingTime] = useState<string>('10:00');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingStatusSuccess, setBookingStatusSuccess] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Receptionist Quick Booking (Manual)
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState<boolean>(false);

  // AI Style Consulting States
  const [hairTexture, setHairTexture] = useState<string>('Wavy');
  const [facialShape, setFacialShape] = useState<string>('Oval');
  const [styleGoals, setStyleGoals] = useState<string>('Sophisticated low-maintenance layering with rich gloss highlights');
  const [lengthPreference, setLengthPreference] = useState<string>('Medium');
  const [aiConsultSolution, setAiConsultSolution] = useState<AISolution | null>(null);
  const [loadingConsult, setLoadingConsult] = useState<boolean>(false);

  // AI Marketing Campaign States
  const [slowHour, setSlowHour] = useState<string>('Tuesday Afternoons (2:00 PM - 5:00 PM)');
  const [activePromotion, setActivePromotion] = useState<string>('Moroccan Hair Spa & Gold Radiance Facial Combo');
  const [marketingTarget, setMarketingTarget] = useState<string>('Jaipur VIP wedding guests & hair spa seekers');
  const [campaignOutput, setCampaignOutput] = useState<CampaignTemplate | null>(null);
  const [loadingMarketing, setLoadingMarketing] = useState<boolean>(false);

  // Backdoor database triggers / refresh counts
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Prisma Schema Derived States
  const [walletInfo, setWalletInfo] = useState<{ balance: number; reservedBalance: number; totalEarned: number } | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [customerWalletBalance, setCustomerWalletBalance] = useState<number>(750);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [themeConfig, setThemeConfig] = useState<any>(null);
  
  // Client Profile State
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
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
  });
  const [clientSection, setClientSection] = useState<'portal' | 'profile'>('portal');

  // Withdrawal form inputs
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawBankDetails, setWithdrawBankDetails] = useState<string>('');
  const [withdrawingLoading, setWithdrawingLoading] = useState<boolean>(false);

  // Referral form input
  const [referRefereeEmail, setReferRefereeEmail] = useState<string>('');
  const [referringLoading, setReferringLoading] = useState<boolean>(false);

  // Dynamic Theme white labeling configurations preset inputs
  const [categorySetting, setCategorySetting] = useState<'BARBER' | 'BEAUTY' | 'TATTOO'>('BEAUTY');
  const [primaryColorSetting, setPrimaryColorSetting] = useState<string>('#c5a059');
  const [selectedPresetSetting, setSelectedPresetSetting] = useState<string>('Royal Heritage Gold');
  const [customCssSetting, setCustomCssSetting] = useState<string>('');
  const [savingThemeLoading, setSavingThemeLoading] = useState<boolean>(false);
  const [isThemeAppliedNotice, setIsThemeAppliedNotice] = useState<boolean>(false);

  // Booking Wallet Deduction
  const [isUsingWalletCredit, setIsUsingWalletCredit] = useState<boolean>(false);

  // User Client Viewport Toggle & Mobile Subdomain Simulation
  const [clientViewportMode, setClientViewportMode] = useState<'desktop' | 'mobile-subdomain'>('desktop');
  const [mobileActiveTab, setMobileActiveTab] = useState<'home' | 'book' | 'wallet' | 'style-ai' | 'auth-sim' | 'profile'>('home');

  // NextAuth v5 Simulation States
  const [authEmail, setAuthEmail] = useState<string>('client@royaltresses.in');
  const [authPassword, setAuthPassword] = useState<string>('client123');
  const [authLoggedInUser, setAuthLoggedInUser] = useState<any>({
    id: 'usr-client-sim',
    name: 'Ananya Singhania',
    email: 'client@royaltresses.in',
    role: 'client'
  });
  const [authCallbackLog, setAuthCallbackLog] = useState<string>('');

  // Automated Refund States
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepResult, setSweepResult] = useState<string>('');
  const [selectedRefund, setSelectedRefund] = useState<Appointment | null>(null);
  const [refundConfigs, setRefundConfigs] = useState<Record<string, boolean>>({});

  // Background daemon tracking states
  const [lastSweepTimes, setLastSweepTimes] = useState<Record<string, Date>>({
    'downtown-executive': new Date(Date.now() - 84 * 1000),      // 1m 24s ago
    'uptown-chic': new Date(Date.now() - 192 * 1000),      // 3m 12s ago
    'coastal-breeze': new Date(Date.now() - 345 * 1000)     // 5m 45s ago
  });
  const [activeSweeps, setActiveSweeps] = useState<Record<string, boolean>>({});
  const [sweepTicker, setSweepTicker] = useState<number>(0);

  // Dynamic relative time calculator
  const getElapsedString = (date: Date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      const remainingSecs = seconds % 60;
      return `${minutes}m ${remainingSecs}s ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  useEffect(() => {
    const tid = setInterval(() => {
      setSweepTicker(t => t + 1);
    }, 1000);
    return () => clearInterval(tid);
  }, []);

  const fetchRefundConfig = async () => {
    try {
      const res = await fetch('/api/payments/refund-config');
      const data = await res.json();
      setRefundConfigs(data);
    } catch (e) {
      console.error('Refund config fetch err', e);
    }
  };

  const handleToggleRefundConfig = async (tenantId: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/payments/refund-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setRefundConfigs(data.config);
      }
    } catch (e) {
      console.error('Refund config toggle err', e);
    }
  };

  // Fetching procedures
  const fetchWalletInfo = async (tenantIdToFetch = activeTenantId) => {
    try {
      const res = await fetch(`/api/wallet-info?tenantId=${tenantIdToFetch}`);
      const data = await res.json();
      setWalletInfo(data.wallet);
      setWalletTransactions(data.transactions);
      setWithdrawalRequests(data.withdrawals);
    } catch (e) {
      console.error('Wallet fetch err', e);
    }
  };

  const fetchThemeConfig = async (tenantIdToFetch = activeTenantId) => {
    try {
      const res = await fetch(`/api/theme-config?tenantId=${tenantIdToFetch}`);
      const data = await res.json();
      setThemeConfig(data);
      setCategorySetting(data.shopCategory);
      setPrimaryColorSetting(data.primaryColor);
      setSelectedPresetSetting(data.selectedPreset);
      setCustomCssSetting(data.customCss);
    } catch (e) {
      console.error('Theme config fetch err', e);
    }
  };

  const fetchCustomerInfo = async () => {
    try {
      const res = await fetch('/api/customer-info');
      const data = await res.json();
      setCustomerWalletBalance(data.balance);
      setReferrals(data.referrals);

      const profileRes = await fetch('/api/customer/profile');
      if (profileRes.ok) {
        const profData = await profileRes.json();
        setCustomerProfile(profData);
        if (profData.name) {
          setBookingClientName(profData.name);
          setBookingClientEmail(profData.email || 'client@royaltresses.in');
          setAuthLoggedInUser((prev: any) => ({
            ...prev,
            name: profData.name,
            email: profData.email
          }));
        }
      }
    } catch (e) {
      console.error('Customer fetch err', e);
    }
  };

  // Real-time Polling for webhooks & logs
  useEffect(() => {
    let internalId = setInterval(() => {
      fetchWebhooks();
      fetchWalletInfo();
    }, 3000);
    return () => clearInterval(internalId);
  }, [activeTenantId]);

  // Sync state initialization
  useEffect(() => {
    const initData = async () => {
      setLoadingData(true);
      try {
        const tenantsRes = await fetch('/api/tenants');
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);

        const servRes = await fetch(`/api/services`);
        const servData = await servRes.json();
        setServices(servData);

        const styRes = await fetch(`/api/stylists`);
        const styData = await styRes.json();
        setStylists(styData);

        fetchAppointments();
        fetchWebhooks();
        await fetchRefundConfig();
        await fetchWalletInfo(activeTenantId);
        await fetchThemeConfig(activeTenantId);
        await fetchCustomerInfo();
      } catch (e) {
        console.error('Error fetching core data', e);
      } finally {
        setLoadingData(false);
      }
    };
    initData();
  }, [refreshTrigger, activeTenantId]);

  const fetchAppointments = async () => {
    try {
      const aptRes = await fetch('/api/appointments');
      const aptData = await aptRes.json();
      setAppointments(aptData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const whRes = await fetch('/api/payments/webhooks');
      const whData = await whRes.json();
      setWebhooks(whData);
    } catch (e) {
      console.error(e);
    }
  };

  const currentTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];

  // Filters services & stylists specific to the active tenant branch context
  const filteredServices = services.filter(s => {
    // If we're looking at all, or filtering by tenantId
    // Standard multi-tenant system maps services to specific branch
    return s.id ? services.some(serv => serv.id === s.id && (serv as any).tenantId === activeTenantId) : true;
  });

  const filteredStylists = stylists.filter(st => {
    return (st as any).tenantIds?.includes(activeTenantId);
  });

  // Handle appointment status change (Receptionist / Stylist action)
  const handleUpdateStatus = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchAppointments();
        fetchWebhooks();
        fetchCustomerInfo();
        fetchWalletInfo();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Launch simulated payment modal
  const triggerPaymentFlow = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsPaymentOpen(true);
  };

  // Handle client booking submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!bookingServiceId || !bookingStylistId || !bookingClientName) {
      setBookingError('Please choose a service, a specialist, and tell us your name before authorizing.');
      return;
    }
    if (!bookingDate || !bookingTime) {
      setBookingError('Please pick a session date and hour.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const selectedService = services.find(s => s.id === bookingServiceId);
      let calculatedPrice = selectedService ? selectedService.price : 0;
      let creditDeducted = 0;

      if (isUsingWalletCredit && customerWalletBalance > 0 && calculatedPrice > 0) {
        creditDeducted = Math.min(calculatedPrice, customerWalletBalance);
        calculatedPrice = Math.max(0, calculatedPrice - creditDeducted);
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          clientName: bookingClientName,
          clientEmail: bookingClientEmail,
          serviceId: bookingServiceId,
          stylistId: bookingStylistId,
          date: bookingDate,
          time: bookingTime,
          notes: bookingNotes + (creditDeducted > 0 ? ` [Applied ₹${creditDeducted} wallet credit discount]` : '')
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({} as any));
        setBookingError(errData?.error || `Booking failed (${res.status}). Please try another slot.`);
        return;
      }

      if (creditDeducted > 0) {
        await fetch('/api/customer/apply-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: creditDeducted })
        });
      }

      setBookingError(null);
      setBookingStatusSuccess(true);
      setBookingClientName('');
      setBookingClientEmail('');
      setBookingNotes('');
      fetchAppointments();
      fetchCustomerInfo();
      fetchWalletInfo();
      setIsQuickBookingOpen(false);
      setIsUsingWalletCredit(false);
      // Clear message after short delay
      setTimeout(() => setBookingStatusSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      setBookingError('Connection lost before your booking went through. Check your internet and retry.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Submit withdrawal payout request
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawBankDetails) {
      alert('Please fill all financial payout attributes');
      return;
    }
    setWithdrawingLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          amount: withdrawAmount,
          bankDetails: withdrawBankDetails
        })
      });
      if (res.ok) {
        setWithdrawAmount('');
        setWithdrawBankDetails('');
        fetchWalletInfo();
        alert('Your treasury payout is registered in escrow! Status set to PENDING verification.');
      } else {
        const err = await res.json();
        alert(err.error || 'Error completing payout request');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWithdrawingLoading(false);
    }
  };

  // Instantly approve payout simulated on corporate server
  const handleSettleWithdrawal = async (id: string) => {
    try {
      const res = await fetch('/api/wallet/settle-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchWalletInfo();
        alert('Treasury withdrawal request PROCESSED successfully! ACH payload dispatched.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update White-Label brand config presets
  const handleSaveThemeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThemeLoading(true);
    try {
      const res = await fetch('/api/theme-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          shopCategory: categorySetting,
          primaryColor: primaryColorSetting,
          selectedPreset: selectedPresetSetting,
          customCss: customCssSetting
        })
      });
      if (res.ok) {
        const data = await res.json();
        setThemeConfig(data.config);
        setIsThemeAppliedNotice(true);
        setTimeout(() => setIsThemeAppliedNotice(false), 6000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingThemeLoading(false);
    }
  };

  // Register modern customer referral bounty
  const handleReferFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referRefereeEmail) {
      alert('Please fill email addressing correctly');
      return;
    }
    setReferringLoading(true);
    try {
      const res = await fetch('/api/customer/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refereeEmail: referRefereeEmail })
      });
      if (res.ok) {
        setReferRefereeEmail('');
        fetchCustomerInfo();
        alert('Referral successful! ₹500 bonus deposited into your Royal Glow Wallet.');
      } else {
        const err = await res.json();
        alert(err.error || 'Referral is already registered in the database.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReferringLoading(false);
    }
  };

  // Call Gemini Style consultation endpoint
  const handleAISkinHairConsult = async () => {
    setLoadingConsult(true);
    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hairTexture, facialShape, styleGoals, lengthPreference })
      });
      const data = await res.json();
      setAiConsultSolution(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConsult(false);
    }
  };

  // Call Gemini Marketing endpoint
  const handleGenerateMarketing = async () => {
    setLoadingMarketing(true);
    try {
      const res = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slowHour, activePromotion, targetAudience: marketingTarget })
      });
      const data = await res.json();
      setCampaignOutput(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMarketing(false);
    }
  };

  // Quickly load suggested state from AI into client reservation form
  const adoptAISuggestion = (matchedServiceId: string, recommendedStylistId: string) => {
    setBookingServiceId(matchedServiceId);
    setBookingStylistId(recommendedStylistId);
    setBookingNotes(`AI recommended style contour mapping: "${aiConsultSolution?.styles[0]?.name || ''}" optimized for ${hairTexture} hair texture.`);
    // Scroll down to booking block automatically or anchor
    const el = document.getElementById('booking-portal-engine');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculations for financial stats (specific to activeTenantId)
  const tenantReservations = appointments.filter(a => a.tenantId === activeTenantId);
  const paidReservations = tenantReservations.filter(a => a.paymentStatus === 'paid');
  const revenueTotal = paidReservations.reduce((sum, current) => sum + current.paymentAmount, 0);
  const refundedReservations = tenantReservations.filter(a => a.paymentStatus === 'refunded');
  const refundedTotal = refundedReservations.reduce((sum, current) => sum + current.paymentAmount, 0);
  const occupancyPercentage = tenantReservations.length > 0 
    ? Math.round((tenantReservations.filter(a => a.status === 'completed' || a.status === 'checked_in' || a.status === 'booked').length / 12) * 100) 
    : 15;

  return (
    <div id="app-root-container" className="flex min-h-screen bg-[#0a0a0b] text-[#e5e5e5] font-sans antialiased overflow-x-hidden selection:bg-[#c5a059] selection:text-black">
      {themeConfig?.primaryColor && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --brand-gold: ${themeConfig.primaryColor};
            --primary: ${themeConfig.primaryColor};
          }
          .text-\\[\\#c5a059\\] {
            color: ${themeConfig.primaryColor} !important;
          }
          .border-\\[\\#c5a059\\] {
            border-color: ${themeConfig.primaryColor} !important;
          }
          .border-\\[\\#c5a059\\]\\/40 {
            border-color: ${themeConfig.primaryColor}66 !important;
          }
          .border-\\[\\#c5a059\\]\\/30 {
            border-color: ${themeConfig.primaryColor}4d !important;
          }
          .border-\\[\\#c5a059\\]\\/25 {
            border-color: ${themeConfig.primaryColor}40 !important;
          }
          .border-\\[\\#c5a059\\]\\/20 {
            border-color: ${themeConfig.primaryColor}33 !important;
          }
          .bg-\\[\\#c5a059\\] {
            background-color: ${themeConfig.primaryColor} !important;
          }
          .bg-\\[\\#c5a059\\]\\/10 {
            background-color: ${themeConfig.primaryColor}1a !important;
          }
          .bg-\\[\\#c5a059\\]\\/20 {
            background-color: ${themeConfig.primaryColor}33 !important;
          }
          .hover\\:bg-\\[\\#b08c49\\]:hover {
            opacity: 0.9 !important;
          }
          .selection\\:bg-\\[\\#c5a059\\]::selection {
            background-color: ${themeConfig.primaryColor} !important;
          }
        ` }} />
      )}
      
      {/* Sidebar Navigation */}
      <aside id="sidebar-layout-panel" className="w-68 bg-[#121214] border-r border-[#2a2a2d] flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2a2a2d]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
              <Scissors size={20} />
            </span>
            <div>
              <h1 className="text-[#c5a059] font-serif italic text-2xl tracking-tight leading-none">Royal Tresses</h1>
              <p className="text-[9px] uppercase tracking-widest mt-1 text-[#c5a059]/80 font-semibold font-mono">Jaipur Luxury Salon & Spa</p>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Context Branch Selector */}
        <div className="p-4 border-b border-[#2a2a2d]">
          <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono block mb-2">
            Jaipur Active Branch
          </label>
          <div className="relative">
            <select
              id="branch-selector-dropdown"
              value={activeTenantId}
              onChange={(e) => {
                setActiveTenantId(e.target.value);
                setBookingServiceId('');
                setBookingStylistId('');
              }}
              className="w-full bg-[#1c1c1f] text-xs font-semibold text-stone-200 border border-[#2a2a2d] rounded-md px-3 py-2.5 outline-none focus:border-[#c5a059] transition cursor-pointer appearance-none"
            >
              <option value="downtown-executive">📍 C-Scheme (Near Statue Circle)</option>
              <option value="uptown-chic">🏬 Malviya Nagar (Near WTP)</option>
              <option value="coastal-breeze">🌿 Vaishali Nagar (Amrapali Circle)</option>
            </select>
            <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-stone-400 text-[10px]">▼</div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
            <span>Rating: <strong className="text-[#c5a059]">{currentTenant?.rating} ★</strong></span>
            <span>Jaipur • Rajasthan</span>
          </div>
        </div>

        {/* Role-Based Access Controller */}
        <div className="p-4 border-b border-[#2a2a2d]">
          <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono block mb-2">
            Role Access Protocol
          </label>
          <div className="space-y-1">
            {[
              { id: 'owner', label: 'Owner Enterprise', badge: 'Admin', desc: 'Financial margins & AI strategy' },
              { id: 'receptionist', label: 'Reception Coordinator', badge: 'Desk', desc: 'Operational flow & Terminal' },
              { id: 'stylist', label: 'Stylist Atelier', badge: 'Atelier', desc: 'Reservations & Biology notes' },
              { id: 'client', label: 'Client Booking Corner', badge: 'Guest', desc: 'AI style advice, Booking' }
            ].map(role => (
              <button
                key={role.id}
                id={`role-btn-${role.id}`}
                onClick={() => {
                  setActiveRole(role.id as Role);
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition ${
                  activeRole === role.id 
                    ? 'bg-[#1c1c1f] border-[#c5a059]/40 text-white' 
                    : 'bg-transparent border-transparent text-stone-400 hover:bg-[#121214] hover:text-stone-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold leading-none">{role.label}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    activeRole === role.id ? 'bg-[#c5a059]/20 text-[#c5a059]' : 'bg-stone-800 text-stone-500'
                  }`}>{role.badge}</span>
                </div>
                <p className="text-[9px] text-stone-500 mt-1">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Details / Diagnostics Info */}
        <div className="p-4 mt-auto border-t border-[#2a2a2d] bg-[#0a0a0b]/40">
          <div className="flex items-center gap-2 text-stone-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] uppercase font-mono tracking-widest font-bold">Node Security: Enforced</span>
          </div>
          <p className="text-[9px] text-stone-500 leading-normal">
            Isolation policies bound to database context. System isolated live to: <span className="text-stone-400 font-mono italic">{activeTenantId}</span>
          </p>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main id="main-content-layout-pane" className="flex-1 flex flex-col min-w-0">
        
        {/* Main Content TOP Bar */}
        <header id="top-control-bar" className="h-20 border-b border-[#2a2a2d] px-8 flex items-center justify-between bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif italic text-white flex items-center gap-1">
                {currentTenant?.name || 'Royal Tresses Jaipur'}
              </h2>
              <span className="text-stone-600 mx-1">/</span>
              <span className="text-xs bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded-sm font-mono mt-0.5">
                {currentTenant?.city}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">
              {currentTenant?.address} • Phone: {currentTenant?.phone}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              id="refresh-database-btn"
              onClick={() => setRefreshTrigger(p => p + 1)}
              className="p-2 rounded bg-[#121214] border border-[#2a2a2d] text-stone-400 hover:text-white hover:border-stone-500 transition tooltip"
              title="Sync Database"
            >
              <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
            </button>

            <div className="hidden md:flex items-center gap-2 bg-[#121214] border border-[#2a2a2d] px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold">Razorpay Live</span>
            </div>

            <button 
              id="role-indicator-badge"
              className="bg-[#c5a059] hover:bg-[#b08c49] text-black px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition"
              onClick={() => {
                // If clicked, quickly toggle or focus booking if Client, or open action
                if (activeRole === 'client') {
                  const el = document.getElementById('booking-portal-engine');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (activeRole === 'receptionist') {
                  setIsQuickBookingOpen(true);
                } else {
                  alert(`Role ${activeRole.toUpperCase()} workspace is active. Use sidebar to swap interfaces.`);
                }
              }}
            >
              {activeRole === 'client' ? 'Book Session' : activeRole === 'receptionist' ? '+ Walk-In Reserve' : `${activeRole} Menu`}
            </button>
          </div>
        </header>

        {/* Core Content Body depending on Role */}
        <div id="role-main-interface-wrapper" className="flex-1 p-8 overflow-y-auto">
          
          {loadingData && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw size={44} className="text-[#c5a059] animate-spin mb-4" />
              <p className="font-serif italic text-stone-400 text-sm">Translating client profiles & isolation schema...</p>
            </div>
          )}

          {!loadingData && (
            <>
              {/* ==================== OWNER ENTERPRISE VIEW ==================== */}
              {activeRole === 'owner' && (
                <div id="owner-workspace-panel" className="space-y-6">
                  
                  {/* Performance Indicators Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between relative group">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold">Branch Revenue (Paid Only)</p>
                        <span className="text-xs text-emerald-500 font-bold font-mono">+16.8%</span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-4xl font-serif mt-2 text-white">₹{revenueTotal.toLocaleString('en-IN')}</h3>
                        <p className="text-[10px] text-stone-500 mt-2 font-medium">Derived from {paidReservations.length} completed & captured transactions.</p>
                      </div>
                    </div>

                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between relative group">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono font-bold">Total Reservations</p>
                        <Layers size={16} className="text-stone-500" />
                      </div>
                      <div className="mt-4">
                        <h3 className="text-4xl font-serif mt-2 text-white">{tenantReservations.length}</h3>
                        <p className="text-[10px] text-stone-500 mt-2 font-medium">All states tracked under strict row context verification.</p>
                      </div>
                    </div>

                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between relative group">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono font-bold">Atelier Load Factor</p>
                        <TrendingUp size={16} className="text-emerald-400" />
                      </div>
                      <div className="mt-4">
                        <h3 className="text-4xl font-serif mt-2 text-white">{occupancyPercentage}%</h3>
                        <p className="text-[10px] text-stone-500 mt-2 font-medium">Utilization of expert stylist rosters today.</p>
                      </div>
                    </div>

                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between relative group">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold">Unpaid Terminals</p>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-mono font-bold">PENDING</span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-4xl font-serif mt-2 text-white">
                          {tenantReservations.filter(a => a.paymentStatus === 'pending').length}
                        </h3>
                        <p className="text-[10px] text-stone-500 mt-2 font-medium">Awaiting checkout. Switch to Receptionist to process.</p>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Layout: AI marketing & Webhook Debugger */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Gemini AI Strategic Marketing Planner */}
                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="p-1 px-2 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[9px] tracking-widest uppercase font-mono font-bold">
                            Server-Side Gemini AI
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">Royal Tresses Jaipur AI Advisor</span>
                        </div>
                        <h3 className="text-xl font-serif italic text-white mb-4">Slow-Hour Luxury Campaign Generator</h3>
                        
                        <p className="text-xs text-stone-400 leading-normal mb-4">
                          Address sluggish booking times with targeted campaigns. Let our server-side Gemini AI generate persuasive copy, unique coupons, and segment-targeted strategies.
                        </p>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Target Sluggish Hours</label>
                            <input 
                              type="text" 
                              value={slowHour}
                              onChange={e => setSlowHour(e.target.value)}
                              placeholder="e.g. Tuesday Afternoon"
                              className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059] font-sans"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Active Promo / Experience focus</label>
                            <input 
                              type="text" 
                              value={activePromotion}
                              onChange={e => setActivePromotion(e.target.value)}
                              placeholder="e.g. Gold Hydrafacial Combo"
                              className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Target Audience Profile</label>
                            <input 
                              type="text" 
                              value={marketingTarget}
                              onChange={e => setMarketingTarget(e.target.value)}
                              placeholder="e.g. Clients who booked hair color but haven't had scalp treatments"
                              className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                            />
                          </div>
                        </div>

                        <button
                          id="generate-campaign-btn"
                          onClick={handleGenerateMarketing}
                          disabled={loadingMarketing}
                          className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-[#1c1c1f] text-black text-xs font-bold uppercase tracking-widest py-3 rounded-sm mt-5 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loadingMarketing ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Dreaming Up Campaign Assets...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>Generate Strategic Campaign</span>
                            </>
                          )}
                        </button>
                      </div>

                      {campaignOutput && (
                        <div className="mt-6 p-5 rounded bg-[#0a0a0b] border border-[#c5a059]/30 border-dashed text-left space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-[#2a2a2d]">
                            <h4 className="text-sm font-serif italic text-[#c5a059]">{campaignOutput.title}</h4>
                            <span className="text-[9px] uppercase tracking-wider font-mono bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded">
                              {campaignOutput.channel}
                            </span>
                          </div>

                          {campaignOutput.subject && (
                            <p className="text-xs text-stone-300 font-semibold">
                              <span className="text-stone-500 mr-1.5 font-mono">Subject:</span>
                              {campaignOutput.subject}
                            </p>
                          )}

                          <div className="p-3 bg-[#121214] border border-stone-800 rounded text-xs select-all text-stone-300 leading-relaxed font-mono">
                            {campaignOutput.copy}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                            <div className="bg-[#121214] p-2 border border-stone-800 rounded">
                              <span className="text-stone-500 block">Promo Code:</span>
                              <strong className="text-white text-xs">{campaignOutput.promoCode}</strong>
                            </div>
                            <div className="bg-[#121214] p-2 border border-stone-800 rounded">
                              <span className="text-stone-500 block">Value Incentive:</span>
                              <strong className="text-white text-xs">{campaignOutput.discountValue}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Razorpay Webhook Debug Terminal */}
                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold">Operational Logs</p>
                            <h3 className="text-xl font-serif italic text-white mt-1">Razorpay Live Webhook Terminal</h3>
                          </div>
                          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider animate-pulse">
                            Active Stream
                          </span>
                        </div>

                        <p className="text-xs text-stone-400 leading-normal mb-4">
                          View simulated background webhook payloads received on the server in real-time. Whenever a client completes a checkout in the payment modal, a `payment.captured` event gets emitted to our webhook listener!
                        </p>

                        <div className="bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg p-4 font-mono text-[11px] h-[320px] overflow-y-auto space-y-4">
                          {webhooks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-stone-600 gap-2">
                              <Power size={32} className="opacity-40" />
                              <p className="text-xs italic">Awaiting payment triggers...</p>
                              <p className="text-[9px] text-stone-700">Simulate a service checkout in Client view to pipe live transaction webhooks.</p>
                            </div>
                          ) : (
                            webhooks.map((wh, idx) => (
                              <div key={wh.id || idx} className="pb-3 border-b border-stone-900 last:border-0 last:pb-0">
                                <div className="flex justify-between items-center text-[10px] mb-1">
                                  <span className="text-emerald-400 font-bold">⚡ {wh.event}</span>
                                  <span className="text-stone-500">{new Date(wh.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-stone-400 font-semibold mb-1">
                                  Amount: ₹{((wh.payload?.payload?.payment?.entity?.amount || 0) / 100).toLocaleString('en-IN')} INR | Order ID: <span className="text-stone-300 font-bold">{wh.payload?.payload?.payment?.entity?.order_id}</span>
                                </p>
                                <div className="text-[9px] bg-[#121214]/60 p-2 rounded max-h-[80px] overflow-y-auto text-stone-500 whitespace-pre scrollbar-thin">
                                  {JSON.stringify(wh.payload, null, 2)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#2a2a2d] flex justify-between items-center text-[10px] text-stone-500">
                        <span>Terminal node ID: <strong className="text-stone-300 font-mono font-bold">rez_93b_run</strong></span>
                        <button 
                          onClick={async () => {
                            if (confirm('Clear simulated webhook stream history on server?')) {
                              // Standard clear (refresh trigger database works as a backup)
                              setRefreshTrigger(p => p + 1);
                            }
                          }}
                          className="hover:text-white transition uppercase font-semibold text-[8px] tracking-wider"
                        >
                          Clear Terminal
                        </button>
                      </div>
                    </div>

                    {/* Automated Razorpay Refund Engine */}
                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>Gateway Workflow</p>
                            <h3 className="text-xl font-serif italic text-white mt-1">Automated Refund Engine</h3>
                          </div>
                          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                            ACTIVE POLLING
                          </span>
                        </div>

                        <p className="text-xs text-stone-300 leading-normal mb-4">
                          The backend daemon automatically monitors the database for <strong>'CANCELLED'</strong> bookings that were previously <strong>'PAID'</strong>. Once detected, the automated workflow:
                        </p>

                        <div className="grid grid-cols-1 gap-2.5 text-stone-300 text-xs font-mono mb-4">
                          <div className="bg-[#0a0a0b] border border-stone-900 p-2.5 rounded flex items-start gap-2.5">
                            <span className="text-[#c5a059] font-bold text-[11px]" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>✔ 01</span>
                            <div>
                              <p className="font-bold text-[11px] text-white">Razorpay API Execution</p>
                              <p className="text-[10.5.5px] text-stone-500 font-sans leading-relaxed">Triggers the refund request via the simulated Razorpay API credentials.</p>
                            </div>
                          </div>
                          <div className="bg-[#0a0a0b] border border-stone-900 p-2.5 rounded flex items-start gap-2.5">
                            <span className="text-[#c5a059] font-bold text-[11px]" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>✔ 02</span>
                            <div>
                              <p className="font-bold text-[11px] text-white">Customer Wallet Credit</p>
                              <p className="text-[10.5px] text-stone-500 font-sans leading-relaxed">Credits the corresponding amount back to the customer's CustomerWallet balance.</p>
                            </div>
                          </div>
                          <div className="bg-[#0a0a0b] border border-stone-900 p-2.5 rounded flex items-start gap-2.5">
                            <span className="text-[#c5a059] font-bold text-[11px]" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>✔ 03</span>
                            <div>
                              <p className="font-bold text-[11px] text-white">Ledger audit entry</p>
                              <p className="text-[10.5px] text-stone-500 font-sans leading-relaxed">Logs the transaction in the WalletTransaction table and emits a webhook event.</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            setIsSweeping(true);
                            // Set sweeping animations for all active refund sweep configs
                            const sweeps: Record<string, boolean> = {};
                            tenants.forEach(t => {
                              if (refundConfigs[t.id] !== false) {
                                sweeps[t.id] = true;
                              }
                            });
                            setActiveSweeps(sweeps);
                            
                            try {
                              const checkres = await fetch('/api/payments/refund-scan', { method: 'POST' });
                              const payd = await checkres.json();
                              setSweepResult(`Sweep complete! Successfully refunded ${payd.processedCount} booking(s).`);
                              
                              // Reset active sweeps times to now
                              const now = new Date();
                              const updatedTimes = { ...lastSweepTimes };
                              tenants.forEach(t => {
                                if (refundConfigs[t.id] !== false) {
                                  updatedTimes[t.id] = now;
                                }
                              });
                              setLastSweepTimes(updatedTimes);

                              // Trigger rapid layout updates
                              fetchAppointments();
                              fetchWebhooks();
                              fetchCustomerInfo();
                              fetchWalletInfo();
                            } catch (err) {
                              console.error('Sweep err', err);
                            } finally {
                              setTimeout(() => {
                                setIsSweeping(false);
                                setActiveSweeps({});
                              }, 1500);
                            }
                          }}
                          disabled={isSweeping}
                          className="w-full text-center py-2.5 bg-transparent border border-[#c5a059] text-[#c5a059] font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-[#c5a059] hover:text-black hover:drop-shadow-[0_0_8px_rgba(197,160,89,0.3)] select-none disabled:opacity-40 transition cursor-pointer"
                          style={{ borderColor: themeConfig?.primaryColor || '#c5a059', color: isSweeping ? '#999' : themeConfig?.primaryColor || '#c5a059' }}
                        >
                          {isSweeping ? 'Sweeping Database Operations...' : 'Force Manual Database Sweep Check'}
                        </button>

                        {sweepResult && (
                          <p className="text-[10px] text-emerald-400 font-mono mt-2.5 text-center bg-emerald-950/10 border border-emerald-500/10 p-2 rounded">
                            {sweepResult}
                          </p>
                        )}
                      </div>

                      <p className="text-[9px] text-stone-500 font-mono mt-4 leading-relaxed">
                        * Continuous background daemon polling operates on the backend container scheduler thread.
                      </p>
                    </div>

                  </div>

                  {/* Staff Utilization & Demographics breakdown */}
                  <div className="bg-[#121214] border border-[#2a2a2d] p-6">
                    <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold mb-4">Global Salon Staff Deployment</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-serif italic text-white mb-4">Elite Stylist Performance & active branches</h4>
                        <div className="space-y-4">
                          {filteredStylists.map((sty, i) => {
                            const bookingsCount = tenantReservations.filter(a => a.stylistId === sty.id).length;
                            const levelPercent = Math.min(100, Math.max(10, bookingsCount * 25));
                            return (
                              <div key={sty.id} className="flex items-center gap-4">
                                <img 
                                  src={sty.imageUrl} 
                                  alt={sty.name} 
                                  className="w-10 h-10 rounded-full object-cover border border-[#2a2a2d]"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="font-semibold text-stone-200">{sty.name}</span>
                                    <span className="text-[#c5a059] font-mono">{bookingsCount} Active ({levelPercent}% capacity)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-[#c5a059] h-full transition-all duration-500" 
                                      style={{ width: `${levelPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold">RBAC POLICY</span>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono">Row-Level Security Active</span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Enterprise multi-tenant filters restrict any cross-leakage. Data queries for SF Downtown (`downtown-executive`), NYC Uptown (`uptown-chic`), or Miami Beach (`coastal-breeze`) execute within hard compartmental isolation matrices. 
                        </p>
                        <div className="mt-4 pt-3 border-t border-[#2a2a2d] flex items-center gap-4 text-[10px] text-stone-500">
                          <div>
                            <span className="block text-stone-600 uppercase font-mono">Active Tenant ID:</span>
                            <strong className="text-stone-300 font-mono">{activeTenantId}</strong>
                          </div>
                          <div>
                            <span className="block text-stone-600 uppercase font-mono">Administrator Role:</span>
                            <strong className="text-[#c5a059]">diamondpeomotion@gmail.com</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ==================== PRISMA SAAS WHITE-LABEL THEME CONFIGURATION ==================== */}
                  <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold">PRISMA THEME_CONFIG MODEL</span>
                        <h3 className="text-xl font-serif italic text-white mt-1">Tenant White-Label & Custom Branding</h3>
                        <p className="text-xs text-stone-400">Configure white-label client-facing portals for {currentTenant?.name || 'this salon branch'} dynamically.</p>
                      </div>
                      {isThemeAppliedNotice && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded font-mono">
                          ✓ Brand Config update dispatched to db client!
                        </div>
                      )}
                    </div>
                    
                    <form onSubmit={handleSaveThemeConfig} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block">Shop Category Type</label>
                        <select
                          value={categorySetting}
                          onChange={e => setCategorySetting(e.target.value as any)}
                          className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059] h-9"
                        >
                          <option value="BARBER">BARBER (Shave & Clipper Cuts)</option>
                          <option value="BEAUTY">BEAUTY (Aesthetic & Makeup)</option>
                          <option value="TATTOO">TATTOO (Body & Ink Artistry)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block">Primary Brand Accent Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={primaryColorSetting}
                            onChange={e => setPrimaryColorSetting(e.target.value)}
                            className="bg-transparent border border-[#2a2a2d] rounded p-0.5 w-10 h-9 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={primaryColorSetting}
                            onChange={e => setPrimaryColorSetting(e.target.value)}
                            placeholder="#c5a059"
                            className="flex-1 bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059] font-mono h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block">Brand Styling Preset</label>
                        <select
                          value={selectedPresetSetting}
                          onChange={e => setSelectedPresetSetting(e.target.value)}
                          className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059] h-9"
                        >
                          <option value="Sophisticated Dark">Sophisticated Dark (Gold & Noir)</option>
                          <option value="Royal Emerald">Royal Emerald (Emerald & Gold)</option>
                          <option value="Rose Luxe">Rose Luxe (Blush & Charcoal)</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={savingThemeLoading}
                          className="w-full bg-white hover:bg-stone-200 text-black text-xs font-bold uppercase tracking-widest py-3 rounded transition h-9 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-stone-800"
                        >
                          {savingThemeLoading ? 'Applying...' : 'Apply Theme'}
                        </button>
                      </div>
                    </form>

                    <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-4 rounded-lg">
                      <p className="text-[9px] text-[#c5a059] font-mono uppercase font-bold mb-1">Dynamic Branding Injector Output</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-stone-400 leading-relaxed">
                        <div>
                          <p>✓ Category Layout Mode: <span className="text-white">{themeConfig?.shopCategory || 'BEAUTY'}</span></p>
                          <p>✓ Applied Color Dye: <span className="text-white font-mono" style={{ color: themeConfig?.primaryColor }}>{themeConfig?.primaryColor || '#c5a059'}</span></p>
                        </div>
                        <div>
                          <p>✓ Core CSS Custom Injection Preset: <span className="text-stone-300 font-semibold">{themeConfig?.selectedPreset || 'Sophisticated Dark'}</span></p>
                          <p>✓ Dynamic White Label Mode Status: <span className="text-emerald-500 font-bold uppercase tracking-widest">ACTIVATED</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ==================== ENTERPRISE ESCROW & TREASURY WALLET ==================== */}
                  <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg space-y-6">
                    <div>
                      <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold">PRISMA SHOPWALLET LEDGER</span>
                      <h3 className="text-xl font-serif italic text-white mt-1">Enterprise Treasury & Escrow Ledger</h3>
                      <p className="text-xs text-stone-400">Track and withdraw processed revenue from captured appointments and release reserved booking escrow reserves.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono font-bold">Treasury Balance (Liquid)</p>
                          <h4 className="text-2xl font-serif text-white mt-2 font-mono">₹{(walletInfo?.balance ?? 0).toLocaleString('en-IN')}</h4>
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-2 font-medium">✨ Ready for bank account payouts and NEFT/RTGS clearance.</p>
                      </div>

                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono font-bold">Locked Escrow Reserves</p>
                          <h4 className="text-2xl font-serif text-[#c5a059] mt-2 font-mono">₹{(walletInfo?.reservedBalance ?? 0).toLocaleString('en-IN')}</h4>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2 font-medium">🔐 Automatically releases upon check-out validation.</p>
                      </div>

                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono font-bold">Cumulative Net Revenue</p>
                          <h4 className="text-2xl font-serif text-white mt-2 font-mono">₹{(walletInfo?.totalEarned ?? 0).toLocaleString('en-IN')}</h4>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-2 font-medium">📈 Overall throughput tracked in Jaipur regional branch database.</p>
                      </div>

                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-red-400 uppercase tracking-widest font-mono font-bold">Total Refunded Volume</p>
                          <h4 className="text-2xl font-serif text-red-500 mt-2 font-mono">₹{refundedTotal.toLocaleString('en-IN')}</h4>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2 font-medium">↺ {refundedReservations.length} Cancelled bookings automatically reimbursed.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Submit Payout Withdrawal */}
                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded col-span-1 space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold">Request Treasury Payout</p>
                        
                        <form onSubmit={handleWithdraw} className="space-y-3">
                          <div>
                            <label className="text-[10px] text-stone-400 font-mono block mb-1">Transfer Amount (₹ INR)</label>
                            <input
                              type="number"
                              required
                              min={100}
                              max={walletInfo?.balance ?? 100000}
                              value={withdrawAmount}
                              onChange={e => setWithdrawAmount(e.target.value)}
                              placeholder="e.g. 5000"
                              className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-400 font-mono block mb-1">Bank Account & IFSC Details</label>
                            <input
                              type="text"
                              required
                              value={withdrawBankDetails}
                              onChange={e => setWithdrawBankDetails(e.target.value)}
                              placeholder="e.g. HDFC Bank, C-Scheme (A/C: 50100492834092, IFSC: HDFC0000054)"
                              className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={withdrawingLoading}
                            className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-stone-800 text-black text-xs font-bold uppercase tracking-widest py-2.5 rounded transition cursor-pointer font-mono"
                          >
                            {withdrawingLoading ? 'Submitting Transfer...' : 'Init Transfer Dispatch'}
                          </button>
                        </form>
                      </div>

                      {/* Withdrawal Requests Log */}
                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded col-span-1 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono font-bold">Recent Cash-Out Requests</p>
                        <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                          {withdrawalRequests.length === 0 ? (
                            <p className="text-xs text-stone-600 italic">No payout history registered yet.</p>
                          ) : (
                            withdrawalRequests.map(wn => (
                              <div key={wn.id} className="p-2.5 rounded bg-[#121214] border border-[#2a2a2d] flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-semibold text-stone-200">₹{wn.amount.toLocaleString('en-IN')} Payout</p>
                                  <p className="text-[10px] text-stone-500 font-mono">{wn.bankDetails}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                    wn.status === 'PROCESSED' 
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {wn.status}
                                  </span>
                                  {wn.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleSettleWithdrawal(wn.id)}
                                      className="text-[8px] uppercase font-bold text-[#c5a059] hover:underline cursor-pointer"
                                    >
                                      Simulate Bank Settlement
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Ledger History */}
                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-5 rounded col-span-1 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono font-bold">Double-Entry Ledger (WalletTransaction)</p>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {walletTransactions.map(tx => (
                            <div key={tx.id} className="p-2 border-b border-stone-900 last:border-0 last:pb-0 flex justify-between items-start text-xs font-mono">
                              <div className="max-w-[70%]">
                                <span className={`text-[8px] font-bold px-1.5 rounded mr-1.5 ${
                                  tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {tx.type}
                                </span>
                                <p className="text-[10px] text-stone-400 mt-1">{tx.description}</p>
                              </div>
                              <span className={`font-semibold ${
                                tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      </div>

                    </div>

                    {/* Recent Refunds Section */}
                    <div className="border-t border-[#2a2a2d] pt-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-red-400 font-mono font-bold">Billing Impact & Reversals</p>
                          <h4 className="text-base font-serif italic text-white mt-1">Recent Refunds Audit Log</h4>
                          <p className="text-xs text-stone-400">Review real-time automated Razorpay refunds, verified logs, and check details of cancelled operations.</p>
                        </div>
                      </div>

                      {/* Active branch config toggles */}
                      <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-4 rounded mb-6">
                        <h5 className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold mb-2">
                          Automated Refund Sweep Controls (By Salon Branch)
                        </h5>
                        <p className="text-[11px] text-stone-400 mb-4 font-sans leading-relaxed">
                          Toggle whether the backend automated daemon checks for and triggers instant Razorpay/credit-refunds for cancelled bookings in each of your active branches.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {tenants.map(t => {
                            const isEnabled = refundConfigs[t.id] !== false;
                            const isCurrentlySweeping = activeSweeps[t.id];
                            return (
                              <div key={t.id} className="bg-[#121214] border border-[#2a2a2d] p-3 rounded flex flex-col justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-serif italic text-white leading-tight">{t.name.replace('Royal Tresses ', '')}</p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-[9px] text-stone-500 font-mono uppercase">{t.city}</p>
                                    <span className="text-[8px] text-stone-700 font-mono">•</span>
                                    <div className="flex items-center gap-1 text-[9px] font-mono">
                                      {isEnabled ? (
                                        isCurrentlySweeping ? (
                                          <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            <span className="text-emerald-400 font-bold uppercase text-[8px]">Sweeping</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                                            <span className="text-emerald-500/80 text-[8px]">ACTIVE</span>
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                                          <span className="text-amber-500/60 text-[8px]">MUTED</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="pt-1 border-t border-[#1d1d20] mt-1 flex items-center justify-between">
                                    <span className="text-[8.5px] text-stone-500 font-mono">Last Sweep:</span>
                                    <span className="text-[9px] font-mono text-stone-300 font-bold">
                                      {isEnabled ? getElapsedString(lastSweepTimes[t.id]) : 'Suspended'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  id={`toggle-refund-${t.id}`}
                                  onClick={() => handleToggleRefundConfig(t.id, !isEnabled)}
                                  className={`w-full py-1.5 rounded text-[10px] font-mono tracking-wider font-bold transition select-none flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isEnabled
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                                  {isEnabled ? 'SWEEP ACTIVE' : 'SWEEP MUTED'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-stone-300 font-mono border-collapse">
                          <thead>
                            <tr className="border-b border-[#2a2a2d] text-stone-500 uppercase text-[9px] tracking-wider font-bold">
                              <th className="py-2.5 px-3">Date / Time</th>
                              <th className="py-2.5 px-3">Booking ID</th>
                              <th className="py-2.5 px-3 font-sans">Customer</th>
                              <th className="py-2.5 px-3 font-sans">Assigned Specialist & Service</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3 text-right font-sans">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {refundedReservations.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-stone-600 italic font-mono text-[11px]">No refunded transactions captured for this branch.</td>
                              </tr>
                            ) : (
                              refundedReservations.map(apt => (
                                <tr key={apt.id} className="border-b border-[#2a2a2d]/40 last:border-0 hover:bg-[#1a1a1c]/60 transition">
                                  <td className="py-3 px-3">
                                    <p className="text-stone-300 font-medium font-mono text-[11px]">{apt.date}</p>
                                    <p className="text-[9px] text-stone-500 font-mono">{apt.time}</p>
                                  </td>
                                  <td className="py-3 px-3 text-[#c5a059]" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>
                                    #{apt.id}
                                  </td>
                                  <td className="py-3 px-3">
                                    <p className="text-stone-200 font-sans font-medium">{apt.clientName}</p>
                                    {apt.clientEmail && <p className="text-[10px] text-stone-500 font-serif italic">{apt.clientEmail}</p>}
                                  </td>
                                  <td className="py-3 px-3 font-sans">
                                    <span className="text-stone-300 text-xs">{apt.serviceName}</span>
                                    <span className="text-stone-500 text-[10.5px] block font-mono">with {apt.stylistName}</span>
                                  </td>
                                  <td className="py-3 px-3 text-right text-red-400 font-mono font-bold text-sm">
                                    -₹{apt.paymentAmount.toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-3 px-3 text-right font-sans">
                                    <button
                                      id={`btn-drilldown-${apt.id}`}
                                      onClick={() => setSelectedRefund(apt)}
                                      className="text-[9px] uppercase font-mono tracking-wider font-bold text-[#c5a059] hover:text-white border border-[#c5a059]/30 hover:border-[#c5a059] px-2.5 py-1 rounded transition bg-transparent cursor-pointer"
                                      style={{ borderColor: `${themeConfig?.primaryColor}40` || '#c5a05940', color: themeConfig?.primaryColor || '#c5a059' }}
                                    >
                                      Drill-Down
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

              {/* ==================== RECEPTIONIST WORKSPACE ==================== */}
              {activeRole === 'receptionist' && (
                <div id="receptionist-workspace-panel" className="space-y-6">
                  
                  {/* Title Bar & Quick Reserve Option */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#121214] border border-[#2a2a2d] p-6 rounded">
                    <div>
                      <h3 className="text-xl font-serif italic text-white flex items-center gap-2">
                        Operational Desk Coordinator
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        Register manual walk-in reservations, track client check-ins, cancel or settle payments directly from the desk dashboard.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => setIsQuickBookingOpen(!isQuickBookingOpen)}
                        className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm transition cursor-pointer flex items-center gap-2"
                      >
                        <Plus size={14} />
                        <span>Walk-In Reservation</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Quick Reservation Drawer / Block */}
                  {isQuickBookingOpen && (
                    <div className="bg-[#121214] border-2 border-[#c5a059]/40 p-6 rounded-lg space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-[#2a2a2d]">
                        <h4 className="text-sm font-serif italic text-[#c5a059]">New Walk-in Scheduler Desk</h4>
                        <button onClick={() => setIsQuickBookingOpen(false)} className="text-stone-400 hover:text-white">
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Guest Client Name</label>
                          <input 
                            type="text" 
                            required
                            value={bookingClientName} 
                            onChange={e => setBookingClientName(e.target.value)}
                            placeholder="e.g. Ananya Singhania"
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Client Email (Optional)</label>
                          <input 
                            type="email" 
                            value={bookingClientEmail} 
                            onChange={e => setBookingClientEmail(e.target.value)}
                            placeholder="ananya@example.com"
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Select Service</label>
                          <select
                            required
                            value={bookingServiceId}
                            onChange={e => setBookingServiceId(e.target.value)}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          >
                            <option value="">-- Choose Branch Service --</option>
                            {filteredServices.map(s => (
                              <option key={s.id} value={s.id}>{s.name} (₹{s.price.toLocaleString('en-IN')})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Assign Stylist</label>
                          <select
                            required
                            value={bookingStylistId}
                            onChange={e => setBookingStylistId(e.target.value)}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          >
                            <option value="">-- Select Expert Stylist --</option>
                            {filteredStylists.map(st => (
                              <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Target Date</label>
                          <input 
                            type="date" 
                            required
                            value={bookingDate} 
                            onChange={e => setBookingDate(e.target.value)}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Target Time</label>
                          <select
                            required
                            value={bookingTime}
                            onChange={e => setBookingTime(e.target.value)}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          >
                            {['09:00', '10:00', '11:15', '13:00', '14:30', '15:45', '17:00'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Coordination / Botanical Notes</label>
                          <textarea 
                            value={bookingNotes}
                            onChange={e => setBookingNotes(e.target.value)}
                            placeholder="Specify hair texturing needs, chemical allergies, or style priorities..."
                            rows={2}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        {bookingError && (
                          <div className="md:col-span-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5 flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{bookingError}</span>
                          </div>
                        )}

                        <div className="md:col-span-3 flex justify-end gap-3 text-xs font-bold pt-2">
                          <button
                            type="button"
                            onClick={() => setIsQuickBookingOpen(false)}
                            className="bg-transparent hover:bg-stone-800 text-stone-400 border border-stone-800 px-4 py-2 rounded-sm"
                          >
                            Discard
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingBooking}
                            className="bg-[#c5a059] text-black px-6 py-2 rounded-sm hover:bg-[#b08c49] disabled:bg-[#1c1c1f]"
                          >
                            {isSubmittingBooking ? 'Booking...' : 'Authorize Schedule'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Active Reservations Management Table */}
                  <div className="bg-[#121214] border border-[#2a2a2d] rounded overflow-hidden">
                    <div className="p-6 border-b border-[#2a2a2d] flex justify-between items-center">
                      <div>
                        <h4 className="font-serif italic text-white">Live Daily Appointment Grid</h4>
                        <p className="text-[10px] text-stone-500 uppercase mt-0.5">Transactional records for: <span className="text-[#c5a059]">{currentTenant.name}</span></p>
                      </div>
                      <span className="text-[10px] bg-stone-800 border border-stone-700 px-2 py-1 text-stone-300 rounded font-mono font-bold">
                        {tenantReservations.length} total active slots
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#0a0a0b] text-stone-500 uppercase tracking-widest text-[9px] font-mono border-b border-[#2a2a2d]">
                            <th className="p-4 font-semibold">Time / Date</th>
                            <th className="p-4 font-semibold">Client Profile</th>
                            <th className="p-4 font-semibold">Luxury Treatment</th>
                            <th className="p-4 font-semibold">Assigned Stylist</th>
                            <th className="p-4 font-semibold">Booking state</th>
                            <th className="p-4 font-semibold">Payment state</th>
                            <th className="p-4 font-semibold text-right">Actions / Settle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1c1c1f]">
                          {tenantReservations.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-stone-500 italic">
                                No reservations registered at this branch today. Click 'Walk-In Reservation' above or switch to Client role to book first!
                              </td>
                            </tr>
                          ) : (
                            [...tenantReservations]
                              .sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                              .map(apt => (
                                <tr key={apt.id} className="hover:bg-[#1c1c1f]/40 transition">
                                  <td className="p-4">
                                    <span className="block font-semibold text-stone-200 font-mono">{apt.time}</span>
                                    <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{apt.date}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className="block font-semibold text-white">{apt.clientName}</span>
                                    {apt.clientEmail && <span className="text-[10px] text-stone-500 font-mono block">{apt.clientEmail}</span>}
                                  </td>
                                  <td className="p-4">
                                    <span className="block font-semibold text-stone-200 leading-snug">{apt.serviceName}</span>
                                    <span className="text-[10px] text-[#c5a059] font-mono block mt-0.5">₹{apt.paymentAmount.toLocaleString('en-IN')}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-semibold text-stone-300">{apt.stylistName}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-[10px] border px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                      apt.status === 'booked' ? 'border-sky-500/20 bg-sky-500/10 text-sky-400' :
                                      apt.status === 'checked_in' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                                      apt.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                                      'border-stone-700 bg-stone-800 text-stone-500' // cancelled
                                    }`}>
                                      {apt.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-[10px] border px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                      apt.paymentStatus === 'paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                                      apt.paymentStatus === 'failed' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                                      apt.paymentStatus === 'refunded' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' :
                                      'border-stone-700 bg-stone-850 text-stone-500' // pending
                                    }`}>
                                      {apt.paymentStatus} {apt.paymentMethod ? `via ${apt.paymentMethod}` : ''}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                    
                                    {/* Action Triggers */}
                                    {apt.status === 'booked' && (
                                      <button
                                        id={`btn-checkin-${apt.id}`}
                                        onClick={() => handleUpdateStatus(apt.id, { status: 'checked_in' })}
                                        className="bg-transparent hover:bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                                      >
                                        Check In
                                      </button>
                                    )}

                                    {apt.status === 'checked_in' && (
                                      <button
                                        id={`btn-complete-${apt.id}`}
                                        onClick={() => handleUpdateStatus(apt.id, { status: 'completed' })}
                                        className="bg-transparent hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                                      >
                                        Mark Done
                                      </button>
                                    )}

                                    {apt.paymentStatus === 'pending' && apt.status !== 'cancelled' && (
                                      <button
                                        id={`btn-pay-${apt.id}`}
                                        onClick={() => triggerPaymentFlow(apt)}
                                        className="bg-[#c5a059] hover:bg-[#b08c49] text-black font-extrabold px-2 py-1 rounded text-[10px] uppercase tracking-wider transition cursor-pointer"
                                      >
                                        Settle (₹ / UPI)
                                      </button>
                                    )}

                                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                      <button
                                        id={`btn-cancel-${apt.id}`}
                                        onClick={() => {
                                          if (confirm(`Cancel reservation for ${apt.clientName}?`)) {
                                            handleUpdateStatus(apt.id, { status: 'cancelled' });
                                          }
                                        }}
                                        className="hover:bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/20 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}

                                    {apt.status === 'cancelled' && (
                                      <span className="text-[10px] text-stone-600 italic">No actions</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ==================== STYLIST PANEL ==================== */}
              {activeRole === 'stylist' && (
                <div id="stylist-workspace-panel" className="space-y-6">
                  
                  {/* Select active stylist */}
                  <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-serif italic text-white flex items-center gap-1">Atelier Creative Workboard</h3>
                      <p className="text-xs text-stone-400 mt-1">Specify which elite stylist profile you are logging into to view client custom goals and biological health logs.</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      {filteredStylists.map(sty => {
                        const totalApt = tenantReservations.filter(a => a.stylistId === sty.id && (a.status === 'booked' || a.status === 'checked_in')).length;
                        return (
                          <button
                            key={sty.id}
                            id={`stylist-login-tab-${sty.id}`}
                            onClick={() => {
                              // Force active reservation client view filters for this stylist
                              setBookingStylistId(sty.id);
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-sm border transition flex items-center gap-2 cursor-pointer ${
                              bookingStylistId === sty.id 
                                ? 'bg-[#c5a059] border-[#c5a059] text-black' 
                                : 'bg-[#1c1c1f] border-stone-800 text-stone-400 hover:text-white'
                            }`}
                          >
                            <span>{sty.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                              bookingStylistId === sty.id ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-400'
                            }`}>{totalApt} Left</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bookingStylistId ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                      
                      {/* Stylist Profile mini box */}
                      <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded space-y-4 h-fit">
                        {(() => {
                          const activeStylistObj = stylists.find(s => s.id === bookingStylistId);
                          if (!activeStylistObj) return null;
                          return (
                            <>
                              <img 
                                src={activeStylistObj.imageUrl} 
                                alt={activeStylistObj.name} 
                                className="w-full h-48 object-cover rounded border border-[#2a2a2d]"
                              />
                              <div>
                                <div className="flex justify-between items-baseline">
                                  <h4 className="text-lg font-serif italic text-[#c5a059]">{activeStylistObj.name}</h4>
                                  <span className="text-xs text-stone-400">{activeStylistObj.rating} ★ Rating</span>
                                </div>
                                <p className="text-xs text-stone-500 font-semibold uppercase font-mono tracking-widest mt-1">
                                  {activeStylistObj.specialties.join(' • ')}
                                </p>
                              </div>

                              <p className="text-xs text-stone-400 leading-relaxed italic pt-2 border-t border-[#2a2a2d]">
                                "{activeStylistObj.bio}"
                              </p>

                              <div className="p-3 bg-[#0a0a0b] text-[10px] text-stone-500 font-semibold font-mono rounded">
                                SCHEDULE ACTIVE: Monday - Friday (09:00 - 18:00)
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Schedule details & notes panel */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded">
                          <h4 className="font-serif italic text-white mb-4 text-base">Allocated Client Sessions Today</h4>
                          
                          <div className="space-y-3">
                            {(() => {
                              const scheduled = appointments.filter(a => a.tenantId === activeTenantId && a.stylistId === bookingStylistId);
                              if (scheduled.length === 0) {
                                return (
                                  <p className="text-xs text-stone-500 italic py-8 text-center bg-[#0a0a0b] rounded border border-[#2a2a2d]">
                                    No direct client allocations booked for you under this Jaipur branch isolation today.
                                  </p>
                                );
                              }
                              return scheduled.map(apt => (
                                <div key={apt.id} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] hover:border-stone-700 rounded transition flex flex-col sm:flex-row justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs font-mono font-bold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/20 px-2 py-0.5 rounded">
                                        Time: {apt.time} ({apt.date})
                                      </span>
                                      <span className={`text-[9px] px-1.5 py-0.1 space-x-1.5 uppercase font-mono font-bold rounded ${
                                        apt.status === 'booked' ? 'bg-sky-500/10 text-sky-400' :
                                        apt.status === 'checked_in' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                                        apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800 text-stone-400'
                                      }`}>
                                        {apt.status}
                                      </span>
                                    </div>
                                    <h5 className="text-sm font-serif italic text-white">{apt.clientName}</h5>
                                    
                                    <p className="text-xs text-stone-300 font-semibold mt-1">
                                      Treatment Scheduled: <strong className="text-stone-100">{apt.serviceName}</strong>
                                    </p>

                                    {apt.notes ? (
                                      <div className="mt-3 p-2 bg-[#121214] rounded text-stone-400 text-xs text-left border border-stone-800/80 leading-relaxed max-w-lg">
                                        <span className="font-mono text-[9px] block text-stone-600 font-bold uppercase">Client/AI Context Note:</span>
                                        {apt.notes}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-stone-600 italic mt-2">No special notes provided.</p>
                                    )}

                                    {/* Action to append Stylist notes dynamically */}
                                    <div className="mt-4 flex gap-2">
                                      <input 
                                        id={`stylist-note-input-${apt.id}`}
                                        type="text" 
                                        placeholder="Add diagnostic notes (ex: Coarse hair, applied salicylic acid)..." 
                                        className="bg-[#121214] border border-[#2a2a2d] rounded px-2.5 py-1 text-xs text-stone-300 outline-none w-full max-w-sm focus:border-stone-500"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value;
                                            if (val) {
                                              const newNotes = apt.notes ? `${apt.notes} | Stylist note: ${val}` : `Stylist note: ${val}`;
                                              handleUpdateStatus(apt.id, { notes: newNotes });
                                              (e.target as HTMLInputElement).value = '';
                                              alert('Atelier clinical notes updated!');
                                            }
                                          }
                                        }}
                                      />
                                      <button 
                                        onClick={() => {
                                          const el = document.getElementById(`stylist-note-input-${apt.id}`) as HTMLInputElement;
                                          if (el && el.value) {
                                            const newNotes = apt.notes ? `${apt.notes} | Stylist note: ${el.value}` : `Stylist note: ${el.value}`;
                                            handleUpdateStatus(apt.id, { notes: newNotes });
                                            el.value = '';
                                            alert('Atelier clinical notes updated!');
                                          }
                                        }}
                                        className="bg-[#c5a059]/10 border border-[#c5a059]/20 hover:bg-[#c5a059]/20 text-[#c5a059] text-[10px] uppercase font-bold px-3 rounded-sm cursor-pointer"
                                      >
                                        Append Note
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-row sm:flex-col justify-end items-end gap-2 shrink-0">
                                    <span className="text-xs font-mono font-bold text-stone-400">Fee Ref: ₹{apt.paymentAmount.toLocaleString('en-IN')}</span>
                                    
                                    {apt.status === 'checked_in' && (
                                      <button
                                        onClick={() => handleUpdateStatus(apt.id, { status: 'completed' })}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-sm shadow-md transition cursor-pointer"
                                      >
                                        Mark Session Complete
                                      </button>
                                    )}

                                    {apt.status === 'booked' && (
                                      <button
                                        onClick={() => handleUpdateStatus(apt.id, { status: 'checked_in' })}
                                        className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-sm transition cursor-pointer"
                                      >
                                        Record Client Arrival
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-[#121214] border border-[#2a2a2d] p-12 rounded text-center text-stone-500 italic">
                      Please select an expert stylist tab above to login and view custom target client allocations.
                    </div>
                  )}

                </div>
              )}

              {/* ==================== CLIENT PORTAL ==================== */}
              {activeRole === 'client' && (
                <div id="client-workspace-panel" className="space-y-6">

                  {/* Dynamic White-Label Viewport & Client Navigation Controller */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-[#121214] border border-[#2a2a2d] p-4 rounded-lg gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <div>
                          <p className="text-xs text-stone-200 font-semibold flex items-center gap-1.5 font-mono">
                            CLIENT PORTAL
                            <span className="p-0.5 px-1 bg-[#c5a059]/10 text-[#c5a059] rounded text-[8px] font-bold">VIP CORNER</span>
                          </p>
                          <p className="text-[10px] text-stone-500">Logged in as {customerProfile?.name || 'Ananya Singhania'} • {customerWalletBalance > 0 ? `₹${customerWalletBalance.toLocaleString('en-IN')} Glow Credit` : 'Jaipur VIP Client'}</p>
                        </div>
                      </div>

                      {/* Client Workspace Section Switcher */}
                      <div className="flex items-center gap-1 bg-[#0a0a0b] p-1 rounded-md border border-[#2a2a2d] self-start sm:self-auto">
                        <button
                          type="button"
                          id="nav-client-booking-hub"
                          onClick={() => setClientSection('portal')}
                          className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                            clientSection === 'portal'
                              ? 'bg-[#c5a059] text-black shadow'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Calendar size={11} />
                          <span>Booking & Services</span>
                        </button>

                        <button
                          type="button"
                          id="nav-client-my-profile"
                          onClick={() => setClientSection('profile')}
                          className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                            clientSection === 'profile'
                              ? 'bg-[#c5a059] text-black shadow'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <User size={11} />
                          <span>My Profile & Rewards</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 bg-[#0a0a0b] p-1 rounded border border-[#2a2a2d] self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        id="client-view-desktop-tab"
                        onClick={() => setClientViewportMode('desktop')}
                        className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono transition flex items-center gap-1.5 select-none cursor-pointer ${
                          clientViewportMode === 'desktop'
                            ? 'bg-[#c5a059] text-black shadow'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        <Layers size={11} />
                        <span>🌐 Full Desktop Portal</span>
                      </button>

                      <button
                        type="button"
                        id="client-view-mobile-tab"
                        onClick={() => {
                          setClientViewportMode('mobile-subdomain');
                          setMobileActiveTab('home');
                        }}
                        className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono transition flex items-center gap-1.5 select-none cursor-pointer ${
                          clientViewportMode === 'mobile-subdomain'
                            ? 'bg-[#c5a059] text-black shadow'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        <ShoppingBag size={11} />
                        <span>📱 Next.js Subdomain Simulator</span>
                      </button>
                    </div>
                  </div>

                  {clientViewportMode === 'desktop' ? (
                    clientSection === 'profile' ? (
                      <ProfileView
                        profile={customerProfile}
                        appointments={tenantReservations.filter(a => 
                          a.clientId === customerProfile.id || 
                          a.clientEmail === customerProfile.email || 
                          a.clientName === customerProfile.name ||
                          a.clientName === 'Ananya Singhania'
                        )}
                        tenants={tenants}
                        stylists={stylists}
                        customerWalletBalance={customerWalletBalance}
                        referrals={referrals}
                        onProfileUpdated={(updated) => {
                          setCustomerProfile(updated);
                          setBookingClientName(updated.name);
                          setBookingClientEmail(updated.email);
                          setAuthLoggedInUser((prev: any) => ({ ...prev, name: updated.name, email: updated.email }));
                        }}
                        onPayAppointment={(apt) => triggerPaymentFlow(apt)}
                        onNavigateToBooking={(serviceId, stylistId) => {
                          setClientSection('portal');
                          if (serviceId) setBookingServiceId(serviceId);
                          if (stylistId) setBookingStylistId(stylistId);
                          setTimeout(() => {
                            const el = document.getElementById('booking-portal-engine');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        onRefreshData={() => {
                          fetchAppointments();
                          fetchCustomerInfo();
                        }}
                      />
                    ) : (
                      <>
                        {/* Title Welcome Header */}
                        <div className="bg-linear-to-r from-[#121214] to-[#1c1c1f] border border-[#2a2a2d] p-8 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="space-y-2">
                            <span className="p-1 px-2.5 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[9px] uppercase font-mono font-bold block w-fit">
                              Online Reservation Hub
                            </span>
                            <h3 className="text-3xl font-serif italic text-white">Experience Salon Excellence</h3>
                            <p className="text-xs text-stone-400 max-w-xl">
                              Schedule a signature diagnostic haircut, hair spa, scalp champi, or clarifying Gold Facial. Consult **Royal Tresses Style AI** to analyze biological hair structures before booking.
                            </p>
                          </div>

                          <div className="flex gap-4 flex-wrap">
                            <button
                              type="button"
                              id="btn-switch-to-profile-hero"
                              onClick={() => setClientSection('profile')}
                              className="bg-[#121214] border border-[#2a2a2d] hover:border-[#c5a059]/50 text-stone-200 hover:text-white text-[10px] uppercase font-mono font-bold py-3.5 px-5 rounded-sm transition text-center flex items-center gap-1.5 cursor-pointer"
                            >
                              <User size={13} className="text-[#c5a059]" />
                              <span>My Profile & Preferences</span>
                            </button>
                            <a 
                              href="#style-ai-consulting-suite"
                              className="bg-[#c5a059]/10 border border-[#c5a059]/25 hover:bg-[#c5a059]/20 text-[#c5a059] text-[10px] uppercase font-mono font-bold py-3.5 px-5 rounded-sm transition text-center"
                            >
                              ✦ AI Style Analysis
                            </a>
                            <a 
                              href="#booking-portal-engine"
                              className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-[10px] uppercase font-mono font-bold py-3.5 px-5 rounded-sm transition shadow-lg text-center"
                            >
                              Book Appointment
                            </a>
                          </div>
                        </div>

                        {/* ==================== JAIPUR FESTIVE & WEDDING SPECIALS ==================== */}
                        <div className="bg-gradient-to-br from-[#121214] via-[#1a1612] to-[#121214] border border-[#c5a059]/30 p-6 rounded-lg relative overflow-hidden space-y-4">
                          <div className="absolute top-0 right-0 bg-[#c5a059] text-black font-mono text-[9px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">
                            JAIPUR FESTIVE EXCLUSIVE
                          </div>
                          <div className="space-y-1">
                            <span className="p-1 px-2 rounded-sm bg-[#c5a059]/10 text-[#c5a059] text-[9px] uppercase font-mono font-bold">
                              Wedding & Seasonal Celebration Packages
                            </span>
                            <h4 className="text-2xl font-serif italic text-white">Jaipur Royal Festive & Wedding Specials</h4>
                            <p className="text-xs text-stone-400 max-w-2xl">
                              Celebrate Teej, Diwali, and royal wedding seasons across our C-Scheme, Malviya Nagar, and Vaishali Nagar branches with curated luxurious packages at special INR pricing.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="bg-[#0a0a0b]/80 border border-stone-800 p-4 rounded-lg flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[9px] font-mono text-[#c5a059] font-bold uppercase">Bridal Heritage</span>
                                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Save ₹7,000</span>
                                </div>
                                <h5 className="text-sm font-serif font-bold text-white">Royal Rajputana Wedding Package</h5>
                                <p className="text-[11px] text-stone-400 mt-1">HD bridal makeup, heritage borla & jewelry setting, dupatta draping, and pre-bridal ubtan polishing.</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-stone-900">
                                <div>
                                  <span className="text-[10px] text-stone-500 line-through font-mono">₹25,000</span>
                                  <p className="text-lg font-serif text-[#c5a059] font-bold">₹18,000</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingServiceId('s-4');
                                    const el = document.getElementById('booking-portal-engine');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-[9px] uppercase font-mono font-bold px-3 py-2 rounded transition cursor-pointer"
                                >
                                  Reserve Package
                                </button>
                              </div>
                            </div>

                            <div className="bg-[#0a0a0b]/80 border border-stone-800 p-4 rounded-lg flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[9px] font-mono text-[#c5a059] font-bold uppercase">Festive Glow</span>
                                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Save ₹1,500</span>
                                </div>
                                <h5 className="text-sm font-serif font-bold text-white">Diwali & Teej Radiance Ritual</h5>
                                <p className="text-[11px] text-stone-400 mt-1">24k Gold Kesar-Chandan facial, Moroccan Argan hair spa, and Diamond crystal hand polishing.</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-stone-900">
                                <div>
                                  <span className="text-[10px] text-stone-500 line-through font-mono">₹5,000</span>
                                  <p className="text-lg font-serif text-[#c5a059] font-bold">₹3,500</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingServiceId('s-3');
                                    const el = document.getElementById('booking-portal-engine');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-[9px] uppercase font-mono font-bold px-3 py-2 rounded transition cursor-pointer"
                                >
                                  Reserve Package
                                </button>
                              </div>
                            </div>

                            <div className="bg-[#0a0a0b]/80 border border-stone-800 p-4 rounded-lg flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[9px] font-mono text-[#c5a059] font-bold uppercase">Groom Sculpting</span>
                                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Save ₹600</span>
                                </div>
                                <h5 className="text-sm font-serif font-bold text-white">Maharaja Beard & Shave Ritual</h5>
                                <p className="text-[11px] text-stone-400 mt-1">Hot towel herbal prep, straight razor edging, sandalwood balm, and 30-min Brahmi champi.</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-stone-900">
                                <div>
                                  <span className="text-[10px] text-stone-500 line-through font-mono">₹1,800</span>
                                  <p className="text-lg font-serif text-[#c5a059] font-bold">₹1,200</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingServiceId('s-5');
                                    const el = document.getElementById('booking-portal-engine');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-[9px] uppercase font-mono font-bold px-3 py-2 rounded transition cursor-pointer"
                                >
                                  Reserve Package
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                  {/* ==================== PRISMA CLIENT REFERRAL & REWARDS DIGITAL WALLET ==================== */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg col-span-1 space-y-4 flex flex-col justify-between">
                      <div>
                        <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold">CLIENT GLOW WALLET</span>
                        <h4 className="text-xl font-serif text-white mt-1">My Personal Credits</h4>
                        <p className="text-xs text-stone-400 mt-1">CustomerWallet Balance from promotional giveaways & active friend invites.</p>
                      </div>
                      <div className="bg-[#0a0a0b] border border-stone-800 p-4 rounded text-center">
                        <span className="text-stone-500 font-mono text-[9px] uppercase font-bold tracking-widest block">Available discount balance</span>
                        <h3 className="text-4xl font-serif text-[#c5a059] mt-1 font-mono">₹{customerWalletBalance.toLocaleString('en-IN')}</h3>
                      </div>
                      <p className="text-[10px] text-stone-500 font-mono text-center">Toggle "Apply Credits" during treatment reservation to apply.</p>
                    </div>

                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg col-span-2 space-y-4">
                      <div>
                        <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold">PRISMA REFERRAL SYSTEM</span>
                        <h4 className="text-xl font-serif text-white mt-1">Spread the Glow & Earn ₹500</h4>
                        <p className="text-xs text-stone-400">Invite friends to Royal Tresses Jaipur! Once they are registered in the database, a ₹500 credit is added to your digital wallet immediately.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form onSubmit={handleReferFriend} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded space-y-3">
                          <p className="text-[10px] text-stone-400 font-mono uppercase font-bold">Refer a Friend</p>
                          <div>
                            <input
                              type="email"
                              required
                              value={referRefereeEmail}
                              onChange={e => setReferRefereeEmail(e.target.value)}
                              placeholder="friend.email@example.com"
                              className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={referringLoading}
                            className="w-full bg-white hover:bg-stone-200 disabled:bg-stone-800 text-black text-xs font-bold uppercase tracking-widest py-2 rounded transition cursor-pointer font-sans"
                          >
                            {referringLoading ? 'Dispatched Invitation...' : 'Dispatch ₹500 Referral'}
                          </button>
                        </form>

                        <div className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded space-y-2">
                          <p className="text-[10px] text-stone-400 font-mono uppercase font-bold">Successful Referrals Ledger</p>
                          <div className="space-y-2 max-h-[105px] overflow-y-auto pr-1">
                            {referrals.length === 0 ? (
                              <p className="text-[10px] text-stone-600 italic">No direct referrals recorded yet.</p>
                            ) : (
                              referrals.map(ref => (
                                <div key={ref.id} className="p-2 rounded bg-[#121214] border border-stone-800/80 flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-stone-300 truncate max-w-[65%]">{ref.refereeEmail}</span>
                                  <span className="text-emerald-400 font-bold font-mono">+₹{(ref.rewardValue || 500).toLocaleString('en-IN')}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking confirmation notice if created */}
                  {bookingStatusSuccess && (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg flex items-center gap-3">
                       <CheckCircle size={20} className="shrink-0 animate-bounce" />
                       <div>
                         <strong className="text-sm block">Reservation Created Successfully!</strong>
                         <span className="text-xs text-stone-400">We have locked your schedule slot. Settle invoice on your active terminal log down below!</span>
                       </div>
                     </div>
                   )}

                  {/* Booking failure notice with recovery guidance */}
                  {bookingError && (
                     <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-lg flex items-start gap-3">
                       <AlertCircle size={20} className="shrink-0 mt-0.5" />
                       <div>
                         <strong className="text-sm block">Reservation could not be created</strong>
                         <span className="text-xs text-stone-400">{bookingError}</span>
                       </div>
                     </div>
                   )}

                  {/* AI Style Consultation Section (Dressed beautifully) */}
                  <div id="style-ai-consulting-suite" className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1 px-2 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[9px] tracking-widest uppercase font-mono font-bold">
                        Style Consultation Core
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">Gemini AI Model Alignment</span>
                    </div>
                    
                    <h3 className="text-xl font-serif italic text-white mb-2">Royal Tresses Style AI Diagnostics</h3>
                    <p className="text-xs text-stone-400 leading-normal max-w-2xl mb-6">
                      Input your texture parameters and style expectations. Our integrated assistant translates biological dimensions into customized architectural structures, recommends specific catalog services, and maps elite styling talent automatically.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1.5">Hair Texture</label>
                        <select
                          value={hairTexture}
                          onChange={e => setHairTexture(e.target.value)}
                          className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059]"
                        >
                          <option value="Straight / Fine">Straight / Fine</option>
                          <option value="Wavy / Textured">Wavy / Textured</option>
                          <option value="Coarse / Curly">Coarse / Curly</option>
                          <option value="Kinky / Coiled">Kinky / Coiled</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1.5">Facial Structural Shape</label>
                        <select
                          value={facialShape}
                          onChange={e => setFacialShape(e.target.value)}
                          className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059]"
                        >
                          <option value="Oval">Oval Contour</option>
                          <option value="Square">Square Contour</option>
                          <option value="Round">Round Contour</option>
                          <option value="Heart">Heart Contour</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1.5">Target Length Preference</label>
                        <select
                          value={lengthPreference}
                          onChange={e => setLengthPreference(e.target.value)}
                          className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059]"
                        >
                          <option value="Short bob/pixie">Short bob / pixie</option>
                          <option value="Medium layered contour">Medium layered contour</option>
                          <option value="Long luxurious movement">Long luxurious movement</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1.5">Personal Style Goals</label>
                        <input
                          type="text"
                          value={styleGoals}
                          onChange={e => setStyleGoals(e.target.value)}
                          placeholder="e.g. Elegant layered bob style, low warmth finish"
                          className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059]"
                        />
                      </div>
                    </div>

                    <button
                      id="consult-ai-btn"
                      onClick={handleAISkinHairConsult}
                      disabled={loadingConsult}
                      className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-[#1c1c1f] text-black text-xs font-bold uppercase tracking-widest py-3 rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingConsult ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Mapping Contours and Rending Suggested Looks...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Obtain AI Style Consultation Blueprint</span>
                        </>
                      )}
                    </button>

                    {aiConsultSolution && (
                      <div className="mt-6 p-6 rounded bg-[#0a0a0b] border border-[#c5a059]/30 space-y-4 animate-scaleUp">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#2a2a2d]">
                          <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] text-[9px] font-mono font-bold rounded">AI ANALYSIS READY</span>
                          <h4 className="text-sm font-serif italic text-white">Suggested Architectural Stylings</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiConsultSolution.styles.map((style, idx) => (
                            <div key={idx} className="p-4 bg-[#121214] border border-[#2a2a2d] rounded space-y-2">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] font-mono uppercase font-bold block w-fit">
                                Suggestion #{idx + 1}
                              </span>
                              <h5 className="text-sm font-serif text-white font-bold">{style.name}</h5>
                              <p className="text-xs text-stone-400 leading-normal">{style.description}</p>
                              
                              <div className="text-[10px] bg-[#0a0a0b] p-2.5 rounded text-stone-500 italic mt-2 border border-stone-850">
                                <span className="font-mono uppercase text-[#c5a059] font-bold block not-italic text-[8px] mb-1">Anatomy Recommendation Reason:</span>
                                {style.reasoning}
                              </div>

                              <button
                                type="button"
                                onClick={() => adoptAISuggestion(style.matchedServiceId, aiConsultSolution.recommendedStylistId)}
                                className="w-full text-center bg-[#c5a059]/10 border border-[#c5a059]/35 hover:bg-[#c5a059] hover:text-black py-1.5 mt-2 rounded text-[10px] uppercase font-bold text-[#c5a059] transition cursor-pointer"
                              >
                                Adopt and Sched Reservation
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-[#121214] rounded border border-[#2a2a2d]">
                          <span className="text-[9px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Master Esthetician Advice Summary</span>
                          <p className="text-xs text-stone-300 leading-relaxed italic">
                            "{aiConsultSolution.overallAdvice}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step-by-Step Selection Booking Container */}
                  <div id="booking-portal-engine" className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg">
                    <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold mb-1">Interactive Scheduler Desk</p>
                    <h3 className="text-xl font-serif italic text-white mb-4">Secure Your Reservation</h3>
                    
                    <form onSubmit={handleCreateBooking} className="space-y-6">
                      
                      {/* Step 1: Select Treatment Service */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-3 font-semibold">
                          Step 2: Decide Catalog Treatment (Filtered to this location context)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredServices.map(ser => (
                            <button
                              id={`client-service-btn-${ser.id}`}
                              key={ser.id}
                              type="button"
                              onClick={() => setBookingServiceId(ser.id)}
                              className={`p-4 rounded-lg text-left border transition relative block ${
                                bookingServiceId === ser.id 
                                  ? 'bg-[#1c1c1f] border-[#c5a059] shadow-md' 
                                  : 'bg-[#a0a0b]/10 border-[#2a2a2d] hover:border-stone-500'
                              }`}
                            >
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-stone-100 text-xs">{ser.name}</span>
                                <span className="text-[#c5a059] font-mono text-sm font-bold">₹{ser.price.toLocaleString('en-IN')}</span>
                              </div>
                              <p className="text-[11px] text-stone-400 leading-relaxed">{ser.description}</p>
                              <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-500 font-semibold font-mono">
                                <span>Duration: {ser.duration} Mins</span>
                                <span className="uppercase text-[#c5a059]/70">{ser.category} Suite</span>
                              </div>
                              {bookingServiceId === ser.id && (
                                <span className="absolute top-2 right-2 p-0.5 rounded-full bg-[#c5a059]/20 border border-[#c5a059] text-[#c5a059]">
                                  <Check size={10} />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 2: Assign Stylist */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-3 font-semibold">
                          Step 3: Appoint Certified Specialist Stylist
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {filteredStylists.map(sty => (
                            <button
                              id={`client-stylist-btn-${sty.id}`}
                              key={sty.id}
                              type="button"
                              onClick={() => setBookingStylistId(sty.id)}
                              className={`p-3 rounded-lg text-left border transition relative flex items-start gap-3 ${
                                bookingStylistId === sty.id 
                                  ? 'bg-[#1c1c1f] border-[#c5a059] shadow-md' 
                                  : 'bg-[#a0a0b]/10 border-[#2a2a2d] hover:border-stone-500'
                              }`}
                            >
                              <img 
                                src={sty.imageUrl} 
                                alt={sty.name} 
                                className="w-10 h-10 rounded-full object-cover border border-[#2a2a2d] shrink-0" 
                              />
                              <div>
                                <h5 className="text-xs font-semibold text-white leading-tight">{sty.name}</h5>
                                <p className="text-[9px] text-[#c5a059] font-serif italic mt-0.5">{sty.rating} ★ Rating</p>
                                <p className="text-[10px] text-stone-500 mt-1 pb-1 line-clamp-2 leading-snug">{sty.bio}</p>
                              </div>
                              {bookingStylistId === sty.id && (
                                <span className="absolute top-2 right-2 p-0.5 rounded-full bg-[#c5a059]/20 border border-[#c5a059] text-[#c5a059]">
                                  <Check size={10} />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date & Time parameters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1.5 font-semibold">Step 4: Pick Session Date</label>
                          <input 
                            type="date" 
                            required
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-3 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1.5 font-semibold">Step 5: Pick Session Hour</label>
                          <select
                            required
                            value={bookingTime}
                            onChange={e => setBookingTime(e.target.value)}
                            className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-3 text-stone-200 outline-none focus:border-[#c5a059]"
                          >
                            {['09:00', '10:00', '11:15', '13:00', '14:30', '15:45', '17:00'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Use Digital Wallet Credits block */}
                      <div className="p-4 bg-[#0a0a0b]/80 border border-amber-500/30 rounded-lg space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[8px] font-bold">DIGITAL DISCOUNT WALLET</span>
                            <p className="text-xs text-stone-200 mt-1 font-semibold">Apply Wallet Balance to Offset Fee</p>
                            <p className="text-[10px] text-stone-400">Apply your available promotion codes and referral bonus pool cash immediately.</p>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-stone-300 font-mono text-xs">Available balance: <strong className="text-[#c5a059]">₹{customerWalletBalance.toLocaleString('en-IN')}</strong></span>
                            <button
                              id="toggle-apply-wallet-credit"
                              type="button"
                              onClick={() => {
                                if (customerWalletBalance <= 0) {
                                  alert("Earn credits by referring your friends first in the Referral System!");
                                  return;
                                }
                                setIsUsingWalletCredit(!isUsingWalletCredit);
                              }}
                              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition font-mono ${
                                isUsingWalletCredit 
                                  ? 'bg-emerald-500 text-black' 
                                  : 'bg-[#121214] border border-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              {isUsingWalletCredit ? 'Credit Applied' : 'Apply Balance'}
                            </button>
                          </div>
                        </div>

                        {isUsingWalletCredit && bookingServiceId && (
                          <div className="pt-2 border-t border-[#2a2a2d] text-xs font-mono text-emerald-400 flex justify-between">
                            <span>Adjusted Booking Value:</span>
                            <strong>
                              ₹{Math.max(0, (services.find(s => s.id === bookingServiceId)?.price ?? 0) - customerWalletBalance).toLocaleString('en-IN')} (Saved ₹{Math.min(customerWalletBalance, (services.find(s => s.id === bookingServiceId)?.price ?? 0)).toLocaleString('en-IN')})
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Client details & custom goals */}
                      <div className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <p className="text-[10px] text-[#c5a059] uppercase tracking-wider font-mono font-bold mb-3">Step 6: Confirm Client Identity Data</p>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Your Full Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Ananya Singhania"
                            value={bookingClientName}
                            onChange={e => setBookingClientName(e.target.value)}
                            className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Your Contact Email</label>
                          <input 
                            type="email" 
                            required
                            placeholder="ananya.s@example.com"
                            value={bookingClientEmail}
                            onChange={e => setBookingClientEmail(e.target.value)}
                            className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block mb-1">Special instructions or constraints</label>
                          <textarea 
                            rows={2}
                            placeholder="Specify style goals, organic oil preferences, or skin focus directions..."
                            value={bookingNotes}
                            onChange={e => setBookingNotes(e.target.value)}
                            className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                          />
                        </div>
                      </div>

                      {/* Submit reservation trigger */}
                      <button
                        id="submit-booking-button"
                        type="submit"
                        disabled={isSubmittingBooking}
                        className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-[#1c1c1f] text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingBooking ? 'Securing Schedule Allocations...' : 'Authorize and Lock Session reservation'}
                      </button>

                    </form>
                  </div>

                  {/* Personal Invoice log with instant payment sandbox checkout */}
                  <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-serif italic text-white">Your Personal Reservation History</h4>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">Client dashboard for: <span className="font-bold text-stone-400">{customerProfile?.email || 'client@royaltresses.in'}</span></p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Filter to mock user clientId or user name matches */}
                      {appointments.length === 0 ? (
                        <p className="text-xs text-stone-500 italic py-6 text-center">No historic reservations created in database yet. Reserve using form above!</p>
                      ) : (
                        appointments.map(apt => (
                          <div key={apt.id} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] hover:border-[#c5a059]/40 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-stone-300 bg-stone-850 border border-stone-800 px-2 py-0.5 rounded">
                                  {apt.date} • {apt.time}
                                </span>
                                <span className={`text-[9px] px-2 py-0.1 font-mono font-bold rounded uppercase ${
                                  apt.status === 'booked' ? 'bg-sky-500/10 text-sky-450' : 
                                  apt.status === 'checked_in' ? 'bg-amber-500/10 text-amber-400' :
                                  apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800 text-stone-400'
                                }`}>
                                  {apt.status}
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono">ID: {apt.id}</span>
                              </div>
                              
                              <h5 className="text-sm font-serif italic text-white mt-1.5">{apt.serviceName}</h5>
                              <p className="text-xs text-stone-400 mt-1">Assigned stylist: <strong className="text-stone-300">{apt.stylistName}</strong></p>
                              
                              {apt.notes && (
                                <p className="text-[10px] text-stone-500 leading-normal max-w-lg mt-2 font-mono">
                                  Notes: {apt.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between w-full md:w-auto gap-3">
                              <span className="text-lg font-serif italic text-[#c5a059] font-mono">₹{apt.paymentAmount.toLocaleString('en-IN')}</span>
                              
                              {apt.paymentStatus === 'pending' && apt.status !== 'cancelled' ? (
                                <button
                                  id={`guest-pay-now-${apt.id}`}
                                  onClick={() => triggerPaymentFlow(apt)}
                                  className="bg-emerald-500 hover:bg-emerald-600 font-extrabold text-[#0a0a0b] text-[10px] uppercase font-mono px-4 py-2 rounded-sm transition shadow-md cursor-pointer"
                                >
                                  💳 Pay with Razorpay
                                </button>
                              ) : (
                                <span className={`text-[10px] px-2 py-1 font-mono font-bold rounded ${
                                  apt.paymentStatus === 'paid' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' :
                                  apt.paymentStatus === 'refunded' ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' :
                                  'bg-stone-800 text-stone-500'
                                }`}>
                                  {apt.paymentStatus === 'paid' ? '✓ PAID' : apt.paymentStatus === 'refunded' ? '↺ REFUNDED' : 'PENDING'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )
            ) : (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-scaleUp">
                {/* Left info column: Explain TenantLayout.tsx design values */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold">NEXT.JS DESIGN COMPASS</span>
                        <span className="p-1 px-1.5 bg-sky-500/10 text-sky-400 rounded font-mono text-[9px] font-bold">ACTIVE SANDBOX</span>
                      </div>
                      
                      <h4 className="text-xl font-serif italic text-white leading-snug">Visualizing app/tenant/[subdomain]/layout.tsx</h4>
                      <p className="text-xs text-stone-300 leading-normal">
                        Your Next.js code implements a multi-tenant client-facing web application. The request maps subdomains dynamically (e.g. <code className="text-[#c5a059] font-mono text-[10.5px]">https://[subdomain].royaltresses.in</code>) to isolate regional salon branches and inject theme specifications dynamically:
                      </p>

                      <div className="p-3.5 bg-[#0a0a0b] rounded border border-stone-850 space-y-2.5 text-xs font-mono text-stone-400">
                        <div className="flex justify-between items-baseline border-b border-stone-900 pb-2">
                          <span>Active Subdomain:</span>
                          <strong className="text-white">"{activeTenantId}"</strong>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-stone-900 pb-2">
                          <span>Database Shop Bind:</span>
                          <span className="text-white text-right">{currentTenant?.name || 'C-Scheme Executive Branch'}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-stone-900 pb-2">
                          <span>Dynamic CSS Variable:</span>
                          <span className="text-white text-emerald-450 font-bold">var(--surface)</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span>Branch Styling Preset:</span>
                          <span className="font-bold uppercase tracking-wider text-[#c5a059]" style={{ color: themeConfig?.primaryColor }}>{themeConfig?.selectedPreset || 'Sophisticated Dark'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        ✓ In-memory database context synchronization: active. Actions dispatched page-side propagate instantly into our core Ledger database clients!
                      </p>
                    </div>

                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg space-y-3">
                      <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-mono font-bold flex items-center gap-1.5" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Auth.js v5 Identity Blueprint
                      </p>
                      <p className="text-xs text-stone-300 leading-normal">
                        Your compiled <code className="text-[#c5a059] font-mono text-[11px]" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>auth.ts</code> handles dynamic session roles via Credentials & Google provider flows under NextAuth v5.
                      </p>
                      <div className="p-3 bg-[#0a0a0b] rounded border border-[#2a2a2d] space-y-1.5 text-[11px] leading-relaxed text-stone-400">
                        <p className="text-stone-300 font-mono font-bold">✓ PrismaAdapter Security</p>
                        <p className="text-[10.5px]">Looks up users by email/phone first, runs a dynamic Bcrypt verification comparison, then binds custom roles to the JWT and session context.</p>
                        <p className="pt-1.5 border-t border-stone-900 font-mono text-[10px] text-stone-500">
                          Try signing in using the <strong className="text-stone-300">Auth Pro</strong> tab inside the mobile preview! It will auto-switch your current user context live.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg space-y-3">
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono font-bold">Real-time Customizer Simulator</p>
                      <p className="text-xs text-stone-400 leading-normal">
                        Toggle the sidebar to <strong className="text-white font-serif italic">Owner Enterprise</strong> and modify colors or presets under the Theme customizer panel to inspect dynamic Next.js White-Label live rendering updates on our smartphone frame preview!
                      </p>
                    </div>
                  </div>

                  {/* Right Column: High-Fidelity iPhone mockup displaying dynamic state-bound white-labeled client pages */}
                  <div className="lg:col-span-7 flex justify-center">
                    <div className="relative mx-auto w-[335px] h-[680px] rounded-[44px] border-[12px] border-stone-800 bg-[#0a0a0b] shadow-2xl overflow-hidden ring-1 ring-stone-700/40 flex flex-col">
                      
                      {/* iPhone Camera/Dynamic Island slot */}
                      <div className="absolute top-2 inset-x-0 flex justify-center z-30">
                        <div className="w-24 h-4 bg-stone-900 rounded-full flex items-center justify-around px-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1c1c1f]" />
                          <span className="w-1 h-1 rounded-full bg-blue-500/20" />
                        </div>
                      </div>

                      {/* Phone top-bar & browser Chrome block */}
                      <div className="bg-stone-900 pt-7 pb-2.5 px-4 border-b border-stone-800 text-stone-300 relative z-25">
                        <div className="flex justify-between items-center text-[10px] mb-2 px-1 font-mono text-stone-400">
                          <span>09:41 AM</span>
                          <div className="flex items-center gap-1.5">
                            <span>LTE</span>
                            <div className="w-4 h-2.5 border border-stone-600 rounded-2xs flex p-0.5 animate-pulse">
                              <div className="bg-emerald-500 w-full h-full rounded-3xs" />
                            </div>
                          </div>
                        </div>

                        {/* Subdomain address browser chrome input */}
                        <div className="bg-[#0c0c0d] rounded-lg border border-stone-850 p-2 flex items-center justify-between gap-1.5">
                          <span className="text-[9px] pointer-events-none text-emerald-400">🔒</span>
                          <span className="text-[10px] font-mono text-stone-350 truncate flex-1 tracking-tight text-center">
                            https://{activeTenantId}.royaltresses.in/tenant
                          </span>
                          <button
                            type="button"
                            onClick={() => setRefreshTrigger(p => p + 1)}
                            className="text-[9px] text-stone-500 hover:text-white"
                          >
                            <RefreshCw size={9} className={loadingData ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Content Frame using variables: bg-[var(--surface)] text-[var(--text)] */}
                      <div 
                        className="flex-1 overflow-y-auto pb-18 text-stone-200 relative scrollbar-none"
                        style={{ 
                          backgroundColor: themeConfig?.selectedPreset === 'Royal Emerald' ? '#042217' : themeConfig?.selectedPreset === 'Rose Luxe' ? '#181414' : '#0c0c0e',
                          '--surface': themeConfig?.selectedPreset === 'Royal Emerald' ? '#042217' : themeConfig?.selectedPreset === 'Rose Luxe' ? '#181414' : '#0c0c0e',
                          '--text': '#f3f4f6', 
                          '--brand-accent': themeConfig?.primaryColor || '#c5a059' 
                        } as React.CSSProperties}
                      >
                        
                        {/* Tab 1: Home Viewport */}
                        {mobileActiveTab === 'home' && (
                          <div className="p-4 space-y-4 animate-fadeIn">
                            
                            {/* Dynamic visual launcher banner */}
                            <div className="bg-gradient-to-r from-stone-900/90 to-stone-950/80 p-5 rounded-xl border border-stone-800/80 text-center space-y-1.5 relative overflow-hidden">
                              <span className="text-[8px] tracking-widest uppercase font-semibold font-mono" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>
                                {categorySetting === 'BARBER' ? 'CLASSIC BARBERSHOP' : categorySetting === 'TATTOO' ? 'ART INK STUDIO' : 'HAIR & BEAUTY CARE'}
                              </span>
                              <h5 className="text-base font-serif italic text-white">{currentTenant?.name}</h5>
                              <p className="text-[9.5px] text-stone-400">white-labeled digital experience. ISO-1992</p>
                            </div>

                            {/* Detailed Physical Location block */}
                            <div className="p-3 bg-stone-950/60 rounded-lg border border-stone-900 space-y-1.5 text-[11px] leading-relaxed">
                              <p className="text-[10px] uppercase font-mono tracking-wider font-semibold" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>📍 BRANCH METRICS</p>
                              <p className="text-stone-300 font-medium">{currentTenant?.address}</p>
                              <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono mt-1">
                                <span>{currentTenant?.phone}</span>
                                <span>Rating: <strong className="text-amber-400">{currentTenant?.rating} ★</strong></span>
                              </div>
                            </div>

                            {/* Jaipur Festive Specials Banner (Mobile) */}
                            <div className="bg-gradient-to-br from-stone-900 to-[#1a1612] p-3.5 rounded-xl border border-[#c5a059]/40 space-y-2.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] uppercase tracking-wider font-mono font-bold bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded">
                                  Jaipur Festive Specials
                                </span>
                                <span className="text-[8px] font-mono text-amber-400 font-bold">✨ Wedding & Season</span>
                              </div>
                              <h6 className="text-xs font-serif italic text-white">Exclusive Royal Packages in INR</h6>
                              <div className="space-y-2">
                                <div className="p-2 bg-stone-950/80 border border-stone-850 rounded-lg flex justify-between items-center">
                                  <div>
                                    <p className="text-[10px] font-bold text-stone-200">Royal Rajputana Bridal</p>
                                    <p className="text-[8.5px] text-stone-400">HD Makeup & Ubtan Ritual</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-mono font-bold text-[#c5a059]">₹18,000</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBookingServiceId('s-4');
                                        setMobileActiveTab('book');
                                      }}
                                      className="block text-[7.5px] uppercase font-bold text-black px-2 py-0.5 rounded mt-0.5"
                                      style={{ backgroundColor: themeConfig?.primaryColor || '#c5a059' }}
                                    >
                                      Book
                                    </button>
                                  </div>
                                </div>
                                <div className="p-2 bg-stone-950/80 border border-stone-850 rounded-lg flex justify-between items-center">
                                  <div>
                                    <p className="text-[10px] font-bold text-stone-200">Diwali & Teej Glow</p>
                                    <p className="text-[8.5px] text-stone-400">24k Gold Facial & Spa</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-mono font-bold text-[#c5a059]">₹3,500</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBookingServiceId('s-3');
                                        setMobileActiveTab('book');
                                      }}
                                      className="block text-[7.5px] uppercase font-bold text-black px-2 py-0.5 rounded mt-0.5"
                                      style={{ backgroundColor: themeConfig?.primaryColor || '#c5a059' }}
                                    >
                                      Book
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Specialist Team List carousel */}
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-widest font-mono text-stone-500 font-bold">Featured Stylists</p>
                              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {filteredStylists.map(st => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                      setBookingStylistId(st.id);
                                      setMobileActiveTab('book');
                                    }}
                                    className="shrink-0 p-2.5 rounded-lg bg-stone-950/50 border border-stone-800 hover:border-stone-600 flex flex-col items-center w-20 text-center gap-1.5 transition"
                                  >
                                    <img src={st.imageUrl} alt={st.name} className="w-8 h-8 rounded-full border border-stone-800 object-cover" />
                                    <span className="text-[9px] font-bold text-white truncate w-full">{st.name.split(' ')[0]}</span>
                                    <span className="text-[8px] font-serif text-amber-500 font-bold">{st.rating}★</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Service catalog snippet */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <p className="text-[10px] uppercase tracking-widest font-mono text-stone-500 font-bold">Signature Services</p>
                                <button onClick={() => setMobileActiveTab('book')} className="text-[8px] uppercase tracking-wide font-bold underline" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>All Service</button>
                              </div>

                              <div className="space-y-1.5">
                                {filteredServices.slice(0, 3).map(ser => (
                                  <div key={ser.id} className="p-2.5 bg-stone-950/70 border border-stone-900 rounded-lg flex justify-between items-center">
                                    <div>
                                      <h6 className="text-[11px] font-bold text-stone-200">{ser.name}</h6>
                                      <p className="text-[9px] text-stone-500 font-mono">{ser.duration} Mins • {ser.category}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-mono font-bold" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>${ser.price}</span>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setBookingServiceId(ser.id);
                                          setMobileActiveTab('book');
                                        }}
                                        className="block text-[8px] uppercase tracking-wider font-extrabold text-black px-2 py-0.5 rounded mt-1 shadow-xs"
                                        style={{ backgroundColor: themeConfig?.primaryColor || '#c5a059' }}
                                      >
                                        Book
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tab 2: Treatment Booking Simulator */}
                        {mobileActiveTab === 'book' && (
                          <div className="p-4 space-y-4 animate-fadeIn">
                            <h5 className="text-[12px] uppercase tracking-wider text-white font-mono font-bold pb-1.5 border-b border-stone-850">
                              Book Treatment Reservation
                            </h5>

                            {/* Service select drop list */}
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase text-stone-400 font-bold font-mono block">1. Select Catalog Service</label>
                              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                {filteredServices.map(ser => (
                                  <button
                                    key={ser.id}
                                    type="button"
                                    onClick={() => setBookingServiceId(ser.id)}
                                    className={`w-full p-2.5 text-left rounded-lg border transition flex justify-between items-center ${
                                      bookingServiceId === ser.id 
                                        ? 'bg-stone-900 text-white' 
                                        : 'bg-stone-950/45 border-stone-900 hover:border-stone-800 text-stone-300'
                                    }`}
                                    style={{ borderColor: bookingServiceId === ser.id ? (themeConfig?.primaryColor || '#c5a059') : undefined }}
                                  >
                                    <div>
                                      <p className="text-[11.5px] font-bold">{ser.name}</p>
                                      <p className="text-[9px] text-stone-550 font-mono">{ser.duration}Mins • {ser.category}</p>
                                    </div>
                                    <span className="text-xs font-mono font-bold" style={{ color: bookingServiceId === ser.id ? (themeConfig?.primaryColor || '#c5a059') : undefined }}>
                                      ${ser.price}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Select stylist drop list */}
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] uppercase text-stone-400 font-bold font-mono block">2. Select Expert Stylist</label>
                              <div className="grid grid-cols-2 gap-2">
                                {filteredStylists.map(sty => (
                                  <button
                                    key={sty.id}
                                    type="button"
                                    onClick={() => setBookingStylistId(sty.id)}
                                    className="p-2 rounded-lg text-left border transition flex items-center gap-2 bg-stone-950/40 border-stone-850"
                                    style={{ 
                                      borderColor: bookingStylistId === sty.id ? (themeConfig?.primaryColor || '#c5a059') : 'rgb(42,42,45)'
                                    }}
                                  >
                                    <img src={sty.imageUrl} alt={sty.name} className="w-6 h-6 rounded-full object-cover" />
                                    <span className="text-[9.5px] font-bold truncate text-stone-300">{sty.name.split(' ')[0]}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Wallet application checkbox card */}
                            <div className="p-2.5 bg-stone-950/70 rounded border border-stone-800 flex justify-between items-center text-[11px]">
                              <div>
                                <p className="font-semibold text-stone-300">Offset with Reward Credits?</p>
                                <p className="text-[9px] text-stone-500 font-mono">My credit: <strong style={{ color: themeConfig?.primaryColor || '#c5a059' }}>${customerWalletBalance}.00</strong></p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (customerWalletBalance <= 0) {
                                    alert("Spread invites under Credits menu to earn discount passes!");
                                    return;
                                  }
                                  setIsUsingWalletCredit(!isUsingWalletCredit);
                                }}
                                className={`px-2.5 py-1 rounded text-[8px] uppercase font-bold font-mono transition ${
                                  isUsingWalletCredit 
                                    ? 'bg-emerald-500 text-black' 
                                    : 'bg-stone-900 text-stone-400 border border-stone-850'
                                }`}
                              >
                                {isUsingWalletCredit ? 'Applied' : 'Apply'}
                              </button>
                            </div>

                            {/* Net calculation invoice preview */}
                            <div className="space-y-1 bg-stone-950/75 p-3 rounded text-[11px] font-mono text-stone-400">
                              <div className="flex justify-between">
                                <span>Treatment Price:</span>
                                <span>${bookingServiceId ? (services.find(s => s.id === bookingServiceId)?.price ?? 0) : 0}.00</span>
                              </div>
                              {isUsingWalletCredit && (
                                <div className="flex justify-between text-emerald-400 pb-1 border-b border-stone-900 border-dashed">
                                  <span>Wallet Discount:</span>
                                  <span>-${Math.min(customerWalletBalance, bookingServiceId ? (services.find(s => s.id === bookingServiceId)?.price ?? 0) : 0)}.00</span>
                                </div>
                              )}
                              <div className="flex justify-between text-[11.5px] font-extrabold text-white pt-1">
                                <span>Net Escrow Due:</span>
                                <span style={{ color: themeConfig?.primaryColor || '#c5a059' }}>
                                  ${Math.max(0, (bookingServiceId ? (services.find(s => s.id === bookingServiceId)?.price ?? 0) : 0) - (isUsingWalletCredit ? customerWalletBalance : 0))}.00
                                </span>
                              </div>
                            </div>

                            {/* Customer confirmation inputs inside simulated screen */}
                            <div className="space-y-1.5 pt-1">
                              <input 
                                type="text"
                                placeholder="Your Name"
                                required
                                value={bookingClientName}
                                onChange={e => setBookingClientName(e.target.value)}
                                className="w-full bg-stone-950 text-[10.5px] border border-stone-855 rounded px-2.5 py-2 text-stone-200 outline-none focus:border-stone-600"
                              />
                              <input
                                type="email"
                                placeholder="Your Email Address"
                                required
                                value={bookingClientEmail}
                                onChange={e => setBookingClientEmail(e.target.value)}
                                className="w-full bg-stone-950 text-[10.5px] border border-stone-855 rounded px-2.5 py-2 text-stone-200 outline-none focus:border-stone-600"
                              />
                              {bookingError && (
                                <p className="text-[9.5px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5 leading-snug">{bookingError}</p>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!bookingServiceId || !bookingStylistId || !bookingClientName || !bookingClientEmail) {
                                    setBookingError("Complete Step 1 (catalog service), Step 2 (expert stylist), and fill in Name/Email parameters before authorization.");
                                    return;
                                  }
                                  handleCreateBooking(e);
                                }}
                                className="w-full py-2.5 rounded font-bold uppercase tracking-wider text-black text-[9.5px] mt-1 hover:brightness-110 active:scale-98 transition shadow-lg shrink-0 select-none block text-center animate-pulse"
                                style={{ backgroundColor: themeConfig?.primaryColor || '#c5a059' }}
                              >
                                Authorize Reservation
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Tab 3: Digital Wallet / Referrals */}
                        {mobileActiveTab === 'wallet' && (
                          <div className="p-4 space-y-4 animate-fadeIn">
                            <h5 className="text-[12px] uppercase tracking-wider text-white font-mono font-bold pb-1.5 border-b border-stone-850">
                              Client Membership Pass
                            </h5>

                            {/* Gold pass member card */}
                            <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-850 p-4 rounded-xl relative shadow-lg">
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <span className="text-[7.5px] uppercase font-mono bg-stone-800 text-[#c5a059] px-2 py-0.5 rounded font-extrabold" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>
                                    Royal Tresses Glow Club Pass
                                  </span>
                                  <h6 className="text-[10px] font-mono text-stone-400 mt-2 font-bold tracking-widest uppercase">Member pass #7781</h6>
                                </div>
                                <span className="text-xl">🌟</span>
                              </div>
                              <div className="flex justify-between items-baseline mt-4">
                                <span className="text-[8.5px] font-mono text-stone-500 uppercase tracking-widest">Rewards Cash:</span>
                                <h4 className="text-2xl font-serif text-[#c5a059] font-bold" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>
                                  ₹{customerWalletBalance.toLocaleString('en-IN')}
                                </h4>
                              </div>
                            </div>

                            {/* Referrals form inside viewport */}
                            <div className="bg-stone-950/65 rounded-lg border border-stone-900 p-3.5 space-y-3">
                              <p className="text-[9.5px] uppercase font-mono tracking-widest font-extrabold text-stone-300">Invite Colleagues & Earn $20</p>
                              <p className="text-[10px] text-stone-400 leading-relaxed">
                                Share the love. Once your referred friend creates a profile, a $20.00 credit is instantly added to your digital wallet balance.
                              </p>

                              <div className="space-y-2">
                                <input
                                  type="email"
                                  placeholder="friend@email.com"
                                  value={referRefereeEmail}
                                  onChange={e => setReferRefereeEmail(e.target.value)}
                                  className="w-full bg-stone-900 text-[10.5px] border border-stone-850 rounded px-2 py-1.5 text-stone-200 outline-none focus:border-stone-600"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (!referRefereeEmail) return;
                                    handleReferFriend(e);
                                  }}
                                  className="w-full py-2 bg-white hover:bg-stone-150 text-black text-[9.5px] font-mono font-bold uppercase tracking-wider rounded select-none shadow-sm"
                                >
                                  Dispatch $20 Referral
                                </button>
                              </div>
                            </div>

                            {/* Invite list summary */}
                            <div className="space-y-1.5">
                              <p className="text-[9.5px] uppercase tracking-wider font-mono text-stone-500 font-bold">Successful Referrals Ledger</p>
                              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                                {referrals.length === 0 ? (
                                  <p className="text-[9px] text-stone-600 italic">No invite history registered yet.</p>
                                ) : (
                                  referrals.map(rt => (
                                    <div key={rt.id} className="p-2 rounded bg-stone-950/80 border border-stone-900 flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-stone-300 truncate max-w-[65%]">{rt.refereeEmail}</span>
                                      <span className="text-emerald-400 font-bold">+$20.00</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tab 4: AI Spec consultation diagnostics */}
                        {mobileActiveTab === 'style-ai' && (
                          <div className="p-4 space-y-4 animate-fadeIn">
                            <h5 className="text-[12px] uppercase tracking-wider text-white font-mono font-bold pb-1.5 border-b border-stone-850">
                              Royal Tresses Style-AI Suite
                            </h5>
                            <p className="text-[10px] text-stone-400 leading-relaxed">
                              Consult our Gemini-supported scanner to analyze biological structural details and auto-categorize catalog services.
                            </p>

                            <div className="bg-stone-950/50 p-3 rounded-lg border border-stone-900 space-y-3 font-mono text-[10px]">
                              <div>
                                <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold block mb-1">Biological Texture:</label>
                                <select
                                  value={hairTexture}
                                  onChange={e => setHairTexture(e.target.value)}
                                  className="w-full bg-stone-900 border border-stone-850 text-[10px] p-1.5 rounded text-stone-200"
                                >
                                  <option value="Straight / Fine">Straight / Fine</option>
                                  <option value="Wavy / Textured">Wavy / Textured</option>
                                  <option value="Coarse / Curly">Coarse / Curly</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold block mb-1">Face Structure Shape:</label>
                                <select
                                  value={facialShape}
                                  onChange={e => setFacialShape(e.target.value)}
                                  className="w-full bg-stone-900 border border-stone-855 text-[10px] p-1.5 rounded text-stone-200"
                                >
                                  <option value="Oval">Oval Contour</option>
                                  <option value="Square">Square Contour</option>
                                  <option value="Round">Round Contour</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold block mb-1">Personal Styling Goals:</label>
                                <input
                                  type="text"
                                  value={styleGoals}
                                  onChange={e => setStyleGoals(e.target.value)}
                                  placeholder="layered bob etc."
                                  className="w-full bg-stone-900 border border-stone-855 text-[10px] p-1.5 rounded text-stone-200 outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleAISkinHairConsult}
                                disabled={loadingConsult}
                                className="w-full py-2 rounded text-black text-[9px] uppercase font-bold tracking-widest transition"
                                style={{ backgroundColor: themeConfig?.primaryColor || '#c5a059' }}
                              >
                                {loadingConsult ? 'Analyzing Bio contours...' : 'Compute AI Consultation'}
                              </button>
                            </div>

                            {aiConsultSolution && (
                              <div className="p-3 bg-stone-950 border border-stone-900 rounded-lg space-y-2 text-[10px] leading-relaxed">
                                <span className="p-0.5 px-1 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-mono font-bold">✓ DYNAMIC PLAN LOADED</span>
                                <p className="text-stone-350 italic">"{aiConsultSolution.overallAdvice.slice(0, 110)}..."</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (aiConsultSolution.styles.length > 0) {
                                      adoptAISuggestion(aiConsultSolution.styles[0].matchedServiceId, aiConsultSolution.recommendedStylistId);
                                      setMobileActiveTab('book');
                                    }
                                  }}
                                  className="w-full text-center py-1 bg-stone-900 border border-stone-855 text-[8.5px] uppercase font-bold text-stone-300 hover:text-white"
                                >
                                  Adopt suggested service
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab 5: Auth.js v5 Simulation Platform */}
                        {mobileActiveTab === 'auth-sim' && (
                          <div className="p-4 space-y-4 animate-fadeIn text-left text-stone-200">
                            <div className="pb-1.5 border-b border-stone-850 flex justify-between items-center">
                              <h5 className="text-[12px] uppercase tracking-wider text-white font-mono font-bold">
                                Auth.js v5 Security
                              </h5>
                              <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">JWT SSL STATUS</span>
                            </div>

                            <p className="text-[10px] text-stone-400 leading-relaxed">
                              This widget runs live in-memory emulation of your <code className="text-[#c5a059] font-serif">auth.ts</code> configuration. Change attributes below to trigger credentials authorization:
                            </p>

                            {/* Simulated Session Status Badge */}
                            {authLoggedInUser ? (
                              <div className="bg-emerald-500/5 border border-emerald-500/25 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    ACTIVE SESSION
                                  </span>
                                  <button
                                    onClick={() => {
                                      setAuthLoggedInUser(null);
                                      setAuthCallbackLog('SignOut procedure triggered. Session keys expunged.');
                                    }}
                                    className="text-[8.5px] uppercase font-mono px-1.5 py-0.5 bg-stone-900 border border-stone-800 text-stone-400 hover:text-white"
                                  >
                                    Sign Out
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-white leading-none">{authLoggedInUser.name}</p>
                                  <p className="text-[9px] text-stone-400 font-mono italic">{authLoggedInUser.email}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[7.5px] bg-[#c5a059]/10 border border-[#c5a059]/35 text-[#c5a059] px-2 py-0.5 rounded-xs font-mono font-bold uppercase" style={{ color: themeConfig?.primaryColor || '#c5a059', borderColor: themeConfig?.primaryColor || '#c5a059' }}>
                                      Role: {authLoggedInUser.role}
                                    </span>
                                    <span className="text-[7.5px] bg-[#000] text-stone-500 px-1.5 py-0.5 rounded-xs font-mono">
                                      ID: {authLoggedInUser.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-stone-900/60 border border-stone-850 p-3 rounded-lg text-center py-5">
                                <span className="text-xs text-stone-500 italic block">Session inactive. Authenticate below.</span>
                              </div>
                            )}

                            {/* Providers Container */}
                            <div className="space-y-3 pt-1">
                              {/* Credentials sign in */}
                              <div className="bg-stone-950/70 p-3.5 border border-stone-900 rounded-lg space-y-3.5">
                                <p className="text-[9px] uppercase font-mono tracking-widest text-stone-400 font-bold border-b border-stone-900 pb-1 flex justify-between">
                                  <span>Credential Authorization</span>
                                  <span className="text-stone-500">Bcrypt v2.4</span>
                                </p>

                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[8px] uppercase tracking-wider text-stone-400 block mb-1">Email / Phone</label>
                                    <select
                                      value={authEmail}
                                      onChange={(e) => {
                                        setAuthEmail(e.target.value);
                                        // Auto update mock password for presets
                                        if (e.target.value === 'owner@nexora.com') {
                                          setAuthPassword('owner123');
                                        } else if (e.target.value === 'receptionist@nexora.com') {
                                          setAuthPassword('receptionist123');
                                        } else {
                                          setAuthPassword('client123');
                                        }
                                      }}
                                      className="w-full bg-stone-900 border border-stone-850 text-[10px] p-1.5 rounded text-stone-200 outline-none"
                                    >
                                      <option value="client@nexora.com">👤 Client: Julianne Moore (client@nexora.com)</option>
                                      <option value="owner@nexora.com">👔 Owner: Administrator (owner@nexora.com)</option>
                                      <option value="receptionist@nexora.com">💁 Receptionist: Coordination (receptionist@nexora.com)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[8px] uppercase tracking-wider text-stone-400 block mb-1">Interactive Password</label>
                                    <input
                                      type="password"
                                      value={authPassword}
                                      onChange={e => setAuthPassword(e.target.value)}
                                      className="w-full bg-stone-900 border border-stone-850 text-[10px] p-1.5 rounded text-stone-200 outline-none font-mono"
                                    />
                                  </div>

                                  <button
                                    onClick={async () => {
                                      setAuthCallbackLog('NextAuth: Credentials authorization requested...');
                                      // Simulate bcrypt delay
                                      const logParts: string[] = ['Executing: prisma.user.findFirst(...)'];
                                      setAuthCallbackLog(logParts.join('\n'));
                                      
                                      setTimeout(() => {
                                        logParts.push('User found. Comparing Bcrypt hash...');
                                        setAuthCallbackLog([...logParts].join('\n'));
                                      }, 400);

                                      setTimeout(() => {
                                        logParts.push('Bcrypt comparison correct. Valid match!');
                                        logParts.push('JWT callback triggered: merging roles');
                                        
                                        let matchedRole = 'client';
                                        let nameValue = 'Julianne Moore';
                                        let finalId = 'usr-client-sim';
                                        
                                        if (authEmail === 'owner@nexora.com') {
                                          matchedRole = 'owner';
                                          nameValue = 'Administrator Suite';
                                          finalId = 'usr-owner-sim';
                                        } else if (authEmail === 'receptionist@nexora.com') {
                                          matchedRole = 'receptionist';
                                          nameValue = 'Coordination Desk';
                                          finalId = 'usr-reception-sim';
                                        }

                                        const newUser = {
                                          id: finalId,
                                          name: nameValue,
                                          email: authEmail,
                                          role: matchedRole
                                        };
                                        
                                        setAuthLoggedInUser(newUser);
                                        // Auto propagate to global app roles
                                        setActiveRole(matchedRole as any);

                                        logParts.push(`Session authorized. Role mapped: ${matchedRole.toUpperCase()}`);
                                        setAuthCallbackLog([...logParts].join('\n'));
                                      }, 900);
                                    }}
                                    className="w-full text-center py-2 text-black text-[9px] uppercase tracking-wider font-extrabold select-none hover:brightness-110 active:scale-98 transition rounded shadow cursor-pointer font-mono"
                                    style={{ backgroundColor: themeConfig?.primaryColor || '#c5a059' }}
                                  >
                                    Sign In with Credentials
                                  </button>
                                </div>
                              </div>

                              {/* Google Sign In button */}
                              <button
                                onClick={() => {
                                  setAuthCallbackLog('NextAuth: Resolving Google OAuth handler...');
                                  
                                  setTimeout(() => {
                                    const googleUser = {
                                      id: 'usr-google-sim',
                                      name: 'Google User',
                                      email: 'diamondpeomotion@gmail.com',
                                      role: 'client'
                                    };
                                    setAuthLoggedInUser(googleUser);
                                    setActiveRole('client');
                                    setAuthCallbackLog([
                                      'Obtained ID Token from google',
                                      'Adapter check: matching client in db',
                                      'JWT mapping Complete.',
                                      'Session populated. Welcome back client!'
                                    ].join('\n'));
                                  }, 600);
                                }}
                                className="w-full text-center py-2 bg-stone-900 border border-stone-800 hover:bg-stone-850 text-white text-[9px] font-mono uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition cursor-pointer"
                              >
                                <span className="text-xs">🔴</span>
                                <span>Sign In with Google Account</span>
                              </button>
                            </div>

                            {/* Callback Session Console */}
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[8px] uppercase tracking-wider font-mono text-stone-500 font-bold block">Live Auth.js Token Callback Console</span>
                              <div className="bg-black/95 p-2 rounded-lg border border-stone-900 text-[8.5px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[140px] text-left">
                                {authCallbackLog ? (
                                  <pre className="whitespace-pre-wrap">{authCallbackLog}</pre>
                                ) : (
                                  <pre className="text-stone-600">// No logs emitted yet. Trigger Credentials or Google authorization above.</pre>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tab: Client Profile in Mobile Simulator */}
                        {mobileActiveTab === 'profile' && (
                          <div className="p-3 space-y-3 animate-fadeIn text-left">
                            <ProfileView
                              profile={customerProfile}
                              appointments={tenantReservations.filter(a => 
                                a.clientId === customerProfile.id || 
                                a.clientEmail === customerProfile.email || 
                                a.clientName === customerProfile.name ||
                                a.clientName === 'Julianne Moore'
                              )}
                              tenants={tenants}
                              stylists={stylists}
                              customerWalletBalance={customerWalletBalance}
                              referrals={referrals}
                              onProfileUpdated={(updated) => {
                                setCustomerProfile(updated);
                                setBookingClientName(updated.name);
                                setBookingClientEmail(updated.email);
                                setAuthLoggedInUser((prev: any) => ({ ...prev, name: updated.name, email: updated.email }));
                              }}
                              onPayAppointment={(apt) => triggerPaymentFlow(apt)}
                              onNavigateToBooking={(serviceId, stylistId) => {
                                setMobileActiveTab('book');
                                if (serviceId) setBookingServiceId(serviceId);
                                if (stylistId) setBookingStylistId(stylistId);
                              }}
                              onRefreshData={() => {
                                fetchAppointments();
                                fetchCustomerInfo();
                              }}
                            />
                          </div>
                        )}

                      </div>

                      {/* Simulated Sticky MobileBottomNav component */}
                      <div className="absolute bottom-0 inset-x-0 h-16 bg-stone-950 border-t border-stone-850 flex items-center justify-around z-25">
                        {[
                          { id: 'home', label: 'Home', icon: <ShoppingBag size={16} /> },
                          { id: 'book', label: 'Book', icon: <Calendar size={16} /> },
                          { id: 'profile', label: 'Profile', icon: <User size={16} /> },
                          { id: 'wallet', label: 'Credits', icon: <Coins size={16} /> },
                          { id: 'style-ai', label: 'AI Spec', icon: <Sparkles size={16} /> },
                          { id: 'auth-sim', label: 'Auth Pro', icon: <Scissors size={16} /> },
                        ].map(mTab => (
                          <button
                            key={mTab.id}
                            type="button"
                            id={`mobile-bottom-nav-${mTab.id}`}
                            onClick={() => setMobileActiveTab(mTab.id as any)}
                            className={`flex flex-col items-center justify-center flex-1 h-full font-mono text-[9px] tracking-tight font-medium py-1 transition-all ${
                              mobileActiveTab === mTab.id
                                ? 'font-bold scale-102'
                                : 'text-stone-500 hover:text-stone-300'
                            }`}
                            style={{ color: mobileActiveTab === mTab.id ? (themeConfig?.primaryColor || '#c5a059') : undefined }}
                          >
                            <span className="mb-0.5">{mTab.icon}</span>
                            <span>{mTab.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Phone virtual slide bar */}
                      <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none z-30">
                        <div className="w-28 h-1 bg-stone-700 rounded-full" />
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}

      </div>
    </main>

      {/* Razorpay Gateway Portal Integration */}
      {isPaymentOpen && selectedAppointment && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={() => {
            fetchAppointments();
            fetchWebhooks();
            setRefreshTrigger(p => p + 1);
          }}
        />
      )}

      {/* Refund Drill-Down Modal showing original transaction details & audit trail */}
      {selectedRefund && (
        <div id="refund-drilldown-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-sans">
          <div className="bg-[#121214] border border-[#2a2a2d] w-full max-w-xl rounded-lg overflow-hidden relative shadow-2xl">
            <div className="p-6 border-b border-[#2a2a2d] flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold" style={{ color: themeConfig?.primaryColor || '#c5a059' }}>Financial Ledger Drill-Down</p>
                <h3 className="text-lg font-serif italic text-white mt-0.5">Audit Trail: Booking #{selectedRefund.id}</h3>
              </div>
              <button
                id="btn-close-drilldown-top"
                onClick={() => setSelectedRefund(null)}
                className="text-stone-400 hover:text-white bg-[#1a1a1c] border border-stone-800 p-1.5 rounded transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Core Reversal Status Banner */}
              <div className="bg-red-950/10 border border-red-900/20 p-4 rounded flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider font-bold">Transaction Reversal amount</p>
                  <p className="text-xl font-bold text-stone-200 mt-1 font-mono">-${selectedRefund.paymentAmount}.00 USD</p>
                </div>
                <span className="px-3 py-1 font-mono font-bold text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 rounded uppercase tracking-wider">
                  ↺ Automated Refund Cleared
                </span>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#0a0a0b] p-3 rounded border border-stone-900">
                  <p className="text-stone-500 text-[10px] uppercase">Service Provided</p>
                  <p className="text-stone-200 font-bold font-sans mt-0.5">{selectedRefund.serviceName}</p>
                </div>
                <div className="bg-[#0a0a0b] p-3 rounded border border-stone-900">
                  <p className="text-stone-500 text-[10px] uppercase">Assigned Stylist</p>
                  <p className="text-stone-200 font-bold font-sans mt-0.5">{selectedRefund.stylistName}</p>
                </div>
                <div className="bg-[#0a0a0b] p-3 rounded border border-stone-900">
                  <p className="text-stone-500 text-[10px] uppercase">Customer Account</p>
                  <p className="text-stone-200 font-bold font-sans mt-0.5">{selectedRefund.clientName}</p>
                </div>
                <div className="bg-[#0a0a0b] p-3 rounded border border-stone-900">
                  <p className="text-stone-500 text-[10px] uppercase">Contact Address</p>
                  <p className="text-stone-300 font-semibold mt-0.5 break-all">{selectedRefund.clientEmail || 'receptionst@nexora.example.com'}</p>
                </div>
                <div className="bg-[#0a0a0b] p-3 rounded border border-stone-900 col-span-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-stone-500 text-[10px] uppercase">Original Booking Coordinates</p>
                      <p className="text-stone-200 font-semibold mt-0.5 font-sans">{selectedRefund.date} @ {selectedRefund.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-stone-500 text-[10px] uppercase">Payment Origin</p>
                      <p className="text-stone-200 font-semibold font-sans mt-0.5 uppercase">💳 razorpay ({selectedRefund.paymentMethod || 'card'})</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction lifecycle milestones */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold">Billing Reversal Lifecycle Logs</p>
                
                <div className="relative pl-6 space-y-4 text-xs">
                  {/* Vertical bar line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#2a2a2d]"></div>

                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute left-[-23px] top-0.5 w-[14px] h-[14px] bg-stone-900 border-2 border-stone-600 rounded-full flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-stone-500 rounded-full"></span>
                    </span>
                    <div>
                      <p className="font-bold text-stone-300">Appointment Booked & Funds Reserved</p>
                      <p className="text-[11px] text-stone-500 leading-normal font-sans mt-0.5">
                        Client reserved service. ${selectedRefund.paymentAmount}.00 is authorized and placed into escrow.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute left-[-23px] top-0.5 w-[14px] h-[14px] bg-stone-900 border-2 border-emerald-600 rounded-full flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    </span>
                    <div>
                      <p className="font-bold text-stone-300">Razorpay Transaction Captured</p>
                      <p className="text-[11px] text-stone-500 leading-normal font-sans mt-0.5">
                        Authorized checkout completes successfully. Escrow funds captured, payment status: <code>paid</code>. Token: <code>pay_RZR_CAPTURED_001</code>
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute left-[-23px] top-0.5 w-[14px] h-[14px] bg-stone-900 border-2 border-amber-600 rounded-full flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    </span>
                    <div>
                      <p className="font-bold text-stone-300">Operational Cancellation Recorded</p>
                      <p className="text-[11px] text-stone-500 leading-normal font-sans mt-0.5">
                        Booking marked as <code>cancelled</code> in backend database. Triggered the background automated refund engine.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <span className="absolute left-[-23px] top-0.5 w-[14px] h-[14px] bg-stone-900 border-2 border-red-500 rounded-full flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></span>
                    </span>
                    <div>
                      <p className="font-bold text-red-400">Automated Refund Processed</p>
                      <p className="text-[11px] text-stone-400 leading-normal font-sans mt-0.5">
                        Simulated Razorpay client refund API call dispatched. Simultaneosly credited $ {selectedRefund.paymentAmount}.00 back into client's <strong>CustomerWallet</strong> model, debited salon branch ledger, and logged inside the <code>WalletTransaction</code> history log.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-[#2a2a2d] bg-[#0c0c0e] flex justify-end">
              <button
                id="btn-close-drilldown-bottom"
                onClick={() => setSelectedRefund(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-mono uppercase tracking-wider font-bold rounded transition cursor-pointer"
              >
                Close Audit File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

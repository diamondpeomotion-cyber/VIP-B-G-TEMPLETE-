import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Clock, CreditCard, Award, Phone, Mail, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, 
  Scissors, Heart, ShieldCheck, Gift, ArrowUpRight, Save, RotateCcw,
  Coffee, Bell, Sliders
} from 'lucide-react';
import { Appointment, CustomerProfile, Tenant, Stylist } from '../../types';

interface ProfileViewProps {
  profile: CustomerProfile;
  appointments: Appointment[];
  tenants: Tenant[];
  stylists: Stylist[];
  customerWalletBalance: number;
  referrals: any[];
  onProfileUpdated: (updatedProfile: CustomerProfile) => void;
  onPayAppointment?: (apt: Appointment) => void;
  onNavigateToBooking?: (serviceId?: string, stylistId?: string) => void;
  onRefreshData?: () => void;
}

export function ProfileView({
  profile,
  appointments,
  tenants,
  stylists,
  customerWalletBalance,
  referrals,
  onProfileUpdated,
  onPayAppointment,
  onNavigateToBooking,
  onRefreshData,
}: ProfileViewProps) {
  // Navigation sub-tab inside profile
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'rewards' | 'wishlist'>('info');

  // Editable Form State
  const [formData, setFormData] = useState<CustomerProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Referral Invite Form State
  const [referralEmail, setReferralEmail] = useState('');
  const [isSendingReferral, setIsSendingReferral] = useState(false);
  const [referralFeedback, setReferralFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Appointments filter state
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize internal form data if external profile changes (and form is not currently dirty)
  useEffect(() => {
    if (!isDirty) {
      setFormData(profile);
    }
  }, [profile]);

  const handleInputChange = (field: keyof CustomerProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
  };

  const handleResetForm = () => {
    setFormData(profile);
    setIsDirty(false);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile coordinates');
      }

      const data = await res.json();
      if (data.profile) {
        onProfileUpdated(data.profile);
        setFormData(data.profile);
        setIsDirty(false);
        setSaveSuccessMessage('Your profile and styling preferences were successfully saved to Royal Tresses Cloud!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSaveSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      console.error('Save profile error:', err);
      setSaveErrorMessage(err.message || 'Network error occurred while saving profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralEmail) return;
    setIsSendingReferral(true);
    setReferralFeedback(null);

    try {
      const res = await fetch('/api/customer/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refereeEmail: referralEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setReferralEmail('');
        setReferralFeedback({
          type: 'success',
          message: 'Invitation sent! ₹500 referral credit was deposited to your Royal Glow Wallet.'
        });
        if (onRefreshData) onRefreshData();
      } else {
        setReferralFeedback({
          type: 'error',
          message: data.error || 'Referral was already registered in the system.'
        });
      }
    } catch (err: any) {
      setReferralFeedback({
        type: 'error',
        message: 'Could not send referral invitation. Please try again.'
      });
    } finally {
      setIsSendingReferral(false);
      setTimeout(() => setReferralFeedback(null), 6000);
    }
  };

  // Filter client appointments
  const filteredAppointments = appointments.filter(apt => {
    // Status filter
    if (appointmentFilter === 'upcoming' && (apt.status === 'completed' || apt.status === 'cancelled')) return false;
    if (appointmentFilter === 'completed' && apt.status !== 'completed') return false;
    if (appointmentFilter === 'cancelled' && apt.status !== 'cancelled') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchService = apt.serviceName.toLowerCase().includes(q);
      const matchStylist = apt.stylistName.toLowerCase().includes(q);
      const matchNotes = apt.notes?.toLowerCase().includes(q);
      return matchService || matchStylist || matchNotes;
    }
    return true;
  });

  const totalSpent = appointments
    .filter(a => a.paymentStatus === 'paid')
    .reduce((sum, a) => sum + (a.paymentAmount || 0), 0);

  const getLoyaltyTier = (spent: number) => {
    if (spent >= 50000) {
      return { 
        name: 'Platinum Tier (15% Cashback)', 
        level: 'platinum', 
        rewardPct: 15, 
        color: '#e5e7eb', 
        bg: 'bg-stone-200/20 border-stone-300/40 text-stone-200', 
        nextThreshold: 50000, 
        progress: 100,
        perks: '15% Reward Cashback + VIP Concierge & Complimentary Refreshments' 
      };
    } else if (spent >= 10000) {
      const progress = Math.min(100, Math.round(((spent - 10000) / (50000 - 10000)) * 100));
      return { 
        name: 'Diamond Tier (10% Cashback)', 
        level: 'diamond', 
        rewardPct: 10, 
        color: '#38bdf8', 
        bg: 'bg-sky-500/20 border-sky-500/40 text-sky-300', 
        nextThreshold: 50000, 
        progress,
        perks: '10% Reward Cashback + Priority Booking Access' 
      };
    } else {
      const progress = Math.min(100, Math.round((spent / 10000) * 100));
      return { 
        name: 'Gold Tier (5% Cashback)', 
        level: 'gold', 
        rewardPct: 5, 
        color: '#c5a059', 
        bg: 'bg-[#c5a059]/20 border-[#c5a059]/40 text-[#c5a059]', 
        nextThreshold: 10000, 
        progress,
        perks: '5% Reward Cashback on All Bookings & Referrals' 
      };
    }
  };

  const currentLoyalty = getLoyaltyTier(totalSpent);

  return (
    <div id="client-my-profile-container" className="space-y-6">
      
      {/* Profile Header Hero Card */}
      <div className="bg-linear-to-r from-[#121214] via-[#161619] to-[#1c1c1f] border border-[#2a2a2d] p-6 md:p-8 rounded-xl relative overflow-hidden">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#c5a059] to-[#e6ca85] text-black font-serif font-bold text-3xl flex items-center justify-center shadow-lg shadow-[#c5a059]/10">
                {formData.name ? formData.name.charAt(0) : 'J'}
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-[#121214] rounded-full border border-stone-800">
                <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full block border-2 border-[#121214]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-serif italic text-white font-medium">
                  {formData.name || 'Royal Tresses Valued Client'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold tracking-wider border ${currentLoyalty.bg}`}>
                  👑 {currentLoyalty.name}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-1.5 text-xs text-stone-400 font-sans flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-stone-500" />
                  {formData.email}
                </span>
                <span className="hidden sm:inline text-stone-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-stone-500" />
                  {formData.phone}
                </span>
                <span className="hidden sm:inline text-stone-600">•</span>
                <span className="flex items-center gap-1.5 text-stone-400">
                  <MapPin size={13} className="text-[#c5a059]" />
                  {tenants.find(t => t.id === formData.preferredBranch)?.name || 'C-Scheme, Jaipur'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            {onNavigateToBooking && (
              <button
                type="button"
                onClick={() => onNavigateToBooking()}
                className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-bold font-mono uppercase tracking-wider px-4 py-2.5 rounded-sm transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar size={13} />
                <span>Book New Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-[#2a2a2d]/80">
          <div className="bg-[#0a0a0b]/80 border border-[#2a2a2d] p-3.5 rounded-lg">
            <span className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block">Royal Glow Wallet</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl md:text-2xl font-serif text-[#c5a059] font-bold">₹{customerWalletBalance.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-emerald-400 font-mono">Available</span>
            </div>
          </div>

          <div className="bg-[#0a0a0b]/80 border border-[#2a2a2d] p-3.5 rounded-lg">
            <span className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block">Total Appointments</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl md:text-2xl font-serif text-white font-bold">{appointments.length}</span>
              <span className="text-[10px] text-stone-400 font-mono">Sessions</span>
            </div>
          </div>

          <div className="bg-[#0a0a0b]/80 border border-[#2a2a2d] p-3.5 rounded-lg">
            <span className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block">Cumulative Spend</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl md:text-2xl font-serif text-white font-bold">₹{totalSpent.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-[#c5a059] font-mono">Captured</span>
            </div>
          </div>

          <div className="bg-[#0a0a0b]/80 border border-[#2a2a2d] p-3.5 rounded-lg">
            <span className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block">Referral Rewards</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl md:text-2xl font-serif text-emerald-400 font-bold">{referrals.length}</span>
              <span className="text-[10px] text-stone-400 font-mono">Friends (₹{(referrals.length * 500).toLocaleString('en-IN')})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#2a2a2d] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition cursor-pointer ${
            activeTab === 'info'
              ? 'bg-[#c5a059] text-black shadow'
              : 'text-stone-400 hover:text-white hover:bg-[#121214]'
          }`}
        >
          <User size={14} />
          <span>My Details & Preferences</span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1" title="Unsaved changes"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-[#c5a059] text-black shadow'
              : 'text-stone-400 hover:text-white hover:bg-[#121214]'
          }`}
        >
          <Calendar size={14} />
          <span>My Appointments ({appointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-[#c5a059] text-black shadow'
              : 'text-stone-400 hover:text-white hover:bg-[#121214]'
          }`}
        >
          <Gift size={14} />
          <span>Rewards & Wallet (₹{customerWalletBalance.toLocaleString('en-IN')})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-[#c5a059] text-black shadow'
              : 'text-stone-400 hover:text-white hover:bg-[#121214]'
          }`}
        >
          <Heart size={14} />
          <span>Saved Salons ({formData.savedSalons?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Editable Contact Information & Preferences Form */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Status Feedback Banners */}
          {saveSuccessMessage && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSaveSuccessMessage(null)} 
                className="text-emerald-300 hover:text-white font-mono text-xs ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {saveErrorMessage && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{saveErrorMessage}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSaveErrorMessage(null)} 
                className="text-red-300 hover:text-white font-mono text-xs ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Section 1: Contact Details */}
          <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
              <div>
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <User size={16} className="text-[#c5a059]" />
                  Contact Information & Details
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Update your contact details for appointment confirmations and salon reminders.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-stone-850 px-2 py-0.5 rounded text-stone-400">
                My Account
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Full Name <span className="text-[#c5a059]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Ananya Singhania"
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Email Address <span className="text-[#c5a059]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Phone Number <span className="text-[#c5a059]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98290 12345"
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>
            </div>

            {/* Notification preference toggles */}
            <div className="pt-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-2 font-semibold flex items-center gap-1.5">
                <Bell size={13} className="text-[#c5a059]" />
                Appointment Reminders
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'both', label: 'SMS & Email', desc: 'SMS text reminder and calendar invite' },
                  { id: 'sms', label: 'SMS Only', desc: 'SMS reminder 2 hours before appointment' },
                  { id: 'email', label: 'Email Only', desc: 'Email receipt and appointment details' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleInputChange('notificationPreference', opt.id)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      formData.notificationPreference === opt.id
                        ? 'bg-[#c5a059]/10 border-[#c5a059] text-white'
                        : 'bg-[#0a0a0b] border-[#2a2a2d] text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{opt.label}</span>
                      {formData.notificationPreference === opt.id && (
                        <CheckCircle2 size={13} className="text-[#c5a059]" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Salon & Hair Preferences */}
          <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
              <div>
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <Scissors size={16} className="text-[#c5a059]" />
                  Hair, Skin & Styling Preferences
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Helps our stylists prepare the right hair care products, shampoo, and styling for you.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#c5a059]/10 text-[#c5a059] px-2 py-0.5 rounded">
                Saved Preferences
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Preferred Salon Branch
                </label>
                <select
                  value={formData.preferredBranch}
                  onChange={e => handleInputChange('preferredBranch', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Preferred Stylist
                </label>
                <select
                  value={formData.preferredStylist}
                  onChange={e => handleInputChange('preferredStylist', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  <option value="">No preference (Any available stylist)</option>
                  {stylists.map(st => (
                    <option key={st.id} value={st.name}>
                      {st.name} — {st.specialties.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Hair Type
                </label>
                <select
                  value={formData.hairTexture}
                  onChange={e => handleInputChange('hairTexture', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  <option value="Straight / Fine">Straight / Thin Hair</option>
                  <option value="Wavy / Textured">Wavy Hair</option>
                  <option value="Coarse / Curly">Thick / Curly Hair</option>
                  <option value="Kinky / Coiled">Frizzy / Deep Curls</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Face Shape
                </label>
                <select
                  value={formData.facialShape}
                  onChange={e => handleInputChange('facialShape', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  <option value="Oval Contour">Oval Face</option>
                  <option value="Square Contour">Square Face</option>
                  <option value="Round Contour">Round Face</option>
                  <option value="Heart Contour">Heart-shaped Face</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold flex items-center gap-1.5">
                  <Coffee size={13} className="text-[#c5a059]" />
                  Complimentary Welcome Drink
                </label>
                <input
                  type="text"
                  value={formData.beveragePreference}
                  onChange={e => handleInputChange('beveragePreference', e.target.value)}
                  placeholder="e.g. Saffron Masala Chai, Chilled Badam Milk, Tender Coconut Water, Rose Sharbat"
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Skin Sensitivities & Allergies
                </label>
                <input
                  type="text"
                  value={formData.allergiesOrSensitivities}
                  onChange={e => handleInputChange('allergiesOrSensitivities', e.target.value)}
                  placeholder="e.g. Sensitive scalp; prefers organic henna & ammonia-free herbal glazes; latex-free gloves only"
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Special Instructions & Stylist Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.specialInstructions}
                  onChange={e => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="e.g. Traditional almond oil head champi, warm herbal towel, gentle pressure point massage..."
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>
            </div>
          </div>

          {/* Sticky Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#121214] border border-[#2a2a2d] rounded-xl sticky bottom-4 z-20 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              {isDirty ? (
                <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  You have unsaved changes in your profile form
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  All preferences synced with server database
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider text-stone-400 hover:text-white bg-[#0a0a0b] border border-[#2a2a2d] hover:border-stone-500 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Discard</span>
                </button>
              )}

              <button
                type="submit"
                id="save-profile-btn"
                disabled={isSaving}
                className="bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-stone-800 text-black text-xs font-bold font-mono uppercase tracking-wider px-6 py-2.5 rounded shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

      {/* Tab 2: Historical Appointments Ledger */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2a2a2d]">
              <div>
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <Calendar size={16} className="text-[#c5a059]" />
                  Historical Appointments & Session Log
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Review all signature haircut, color artistry, and esthetic spa sessions recorded under your client account.
                </p>
              </div>

              {/* Status filter buttons */}
              <div className="flex items-center gap-1.5 bg-[#0a0a0b] p-1 rounded-md border border-[#2a2a2d] self-start sm:self-auto">
                {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAppointmentFilter(filter)}
                    className={`px-3 py-1 rounded text-[10px] font-mono uppercase font-bold tracking-wider transition ${
                      appointmentFilter === filter
                        ? 'bg-[#c5a059] text-black shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search appointments by service name, stylist, or notes..."
                className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2 text-stone-200 outline-none focus:border-[#c5a059] transition"
              />
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center bg-[#0a0a0b] rounded-lg border border-[#2a2a2d] space-y-3">
                <Calendar size={32} className="mx-auto text-stone-600 opacity-60" />
                <p className="text-stone-400 text-sm font-serif italic">No appointments match your active filter.</p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Reserve a personalized diagnostic hair or skincare session using our online reservation hub!
                </p>
                {onNavigateToBooking && (
                  <button
                    type="button"
                    onClick={() => onNavigateToBooking()}
                    className="mt-2 bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded transition cursor-pointer"
                  >
                    Explore Salon Catalog
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-5 bg-[#0a0a0b] border border-[#2a2a2d] hover:border-[#c5a059]/40 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-stone-200 bg-[#121214] border border-[#2a2a2d] px-2.5 py-1 rounded">
                          {apt.date} • {apt.time}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`text-[9px] px-2.5 py-0.5 font-mono font-bold rounded uppercase tracking-wider ${
                          apt.status === 'booked' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          apt.status === 'checked_in' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}>
                          {apt.status}
                        </span>

                        {/* Payment Status Badge */}
                        <span className={`text-[9px] px-2 py-0.5 font-mono font-bold rounded uppercase ${
                          apt.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          apt.paymentStatus === 'refunded' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {apt.paymentStatus === 'paid' ? '✓ Paid' : apt.paymentStatus === 'refunded' ? '↺ Refunded' : 'Pending Fee'}
                        </span>

                        <span className="text-[10px] text-stone-500 font-mono">
                          ID: {apt.id}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-serif italic text-white group-hover:text-[#c5a059] transition">
                          {apt.serviceName}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-stone-400 mt-1 flex-wrap font-sans">
                          <span>Stylist: <strong className="text-stone-300">{apt.stylistName}</strong></span>
                          <span className="text-stone-600">•</span>
                          <span>Branch: <span className="text-stone-300">{tenants.find(t => t.id === apt.tenantId)?.name || apt.tenantId}</span></span>
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-stone-500 leading-relaxed font-mono max-w-xl bg-[#121214] p-2 rounded border border-[#2a2a2d]">
                          <span className="text-stone-400">Notes:</span> {apt.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#2a2a2d]">
                      <span className="text-2xl font-serif text-[#c5a059] font-bold">
                        ₹{apt.paymentAmount.toLocaleString('en-IN')}
                      </span>

                      <div className="flex items-center gap-2">
                        {apt.paymentStatus === 'pending' && apt.status !== 'cancelled' && onPayAppointment && (
                          <button
                            type="button"
                            onClick={() => onPayAppointment(apt)}
                            className="bg-emerald-500 hover:bg-emerald-600 font-bold text-black text-[10px] uppercase font-mono px-3.5 py-1.5 rounded-sm transition shadow cursor-pointer flex items-center gap-1"
                          >
                            <CreditCard size={12} />
                            <span>Pay with Razorpay</span>
                          </button>
                        )}

                        {onNavigateToBooking && (
                          <button
                            type="button"
                            onClick={() => onNavigateToBooking(apt.serviceId, apt.stylistId)}
                            className="bg-[#121214] hover:bg-[#1a1a1e] border border-[#2a2a2d] text-stone-300 hover:text-white text-[10px] uppercase font-mono px-3 py-1.5 rounded-sm transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Rebook</span>
                            <ArrowUpRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Referral Rewards & Glow Digital Wallet */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">

          {/* Multi-Tiered Loyalty Program Status Card */}
          <div className="bg-gradient-to-r from-[#161619] via-[#1c1c21] to-[#161619] border border-[#c5a059]/40 p-6 rounded-xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 bg-[#c5a059] text-black font-mono text-[9px] font-extrabold px-3.5 py-1 rounded-bl-lg uppercase tracking-widest">
              LOYALTY REWARDS
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${currentLoyalty.bg}`}>
                    👑 {currentLoyalty.name} Active ({currentLoyalty.rewardPct}% Rewards Rate)
                  </span>
                  <span className="text-xs text-stone-400 font-mono">Total Salon Spend: ₹{totalSpent.toLocaleString('en-IN')}</span>
                </div>
                <h3 className="text-2xl font-serif italic text-white">Loyalty Club & Discount Rewards</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xl">
                  Get discount cashback on all your salon visits. The more appointments you book, the higher your reward level!
                </p>
              </div>

              <div className="flex gap-2">
                <div className={`px-3 py-2 rounded-lg border text-center ${currentLoyalty.bg}`}>
                  <span className="text-[9px] font-mono uppercase block text-stone-400">Current Discount</span>
                  <span className="text-lg font-bold font-mono">{currentLoyalty.rewardPct}% Back</span>
                </div>
              </div>
            </div>

            {/* Progress bar to next tier */}
            {currentLoyalty.level !== 'platinum' && (
              <>
                <div className="space-y-1.5 pt-2 border-t border-[#2a2a2d]">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-stone-400">Total spending needed for {currentLoyalty.level === 'gold' ? 'Diamond Level (₹10,000 Spend)' : 'Platinum Level (₹50,000 Spend)'}</span>
                    <span className="text-[#c5a059] font-bold">{currentLoyalty.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                    <div className="h-full bg-gradient-to-r from-[#c5a059] to-amber-300 transition-all duration-500" style={{ width: `${currentLoyalty.progress}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#2a2a2d]/50">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-stone-400">
                      {currentLoyalty.level === 'gold' 
                        ? `Friends to invite: ${Math.max(0, 2 - referrals.length)} more friend invite(s) to reach Diamond Level`
                        : `Friends to invite: ${Math.max(0, 6 - referrals.length)} more friend invite(s) to reach Platinum Level`}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {currentLoyalty.level === 'gold' ? `${referrals.length} / 2 Friends` : `${referrals.length} / 6 Friends`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                      style={{ 
                        width: `${currentLoyalty.level === 'gold' 
                          ? Math.min(100, (referrals.length / 2) * 100) 
                          : Math.min(100, ((referrals.length - 2) / 4) * 100)}%` 
                      }} 
                    />
                  </div>
                </div>
              </>
            )}

            {/* Tier Benefits Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className={`p-3 rounded-lg border ${totalSpent < 10000 ? 'bg-[#c5a059]/15 border-[#c5a059]' : 'bg-[#0a0a0b]/60 border-stone-800'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-serif font-bold text-white">💛 Gold Level</span>
                  <span className="text-[10px] font-mono text-[#c5a059] font-bold">5% Back</span>
                </div>
                <p className="text-[10px] text-stone-400">Under ₹10,000 salon spend. 5% cashback on all bookings.</p>
              </div>

              <div className={`p-3 rounded-lg border ${totalSpent >= 10000 && totalSpent < 50000 ? 'bg-sky-500/15 border-sky-500' : 'bg-[#0a0a0b]/60 border-stone-800'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-serif font-bold text-white">💎 Diamond Level</span>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">10% Back</span>
                </div>
                <p className="text-[10px] text-stone-400">₹10,000 – ₹49,999 spend. 10% cashback + priority appointments.</p>
              </div>

              <div className={`p-3 rounded-lg border ${totalSpent >= 50000 ? 'bg-stone-200/20 border-stone-300' : 'bg-[#0a0a0b]/60 border-stone-800'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-serif font-bold text-white">✨ Platinum Level</span>
                  <span className="text-[10px] font-mono text-stone-200 font-bold">15% Back</span>
                </div>
                <p className="text-[10px] text-stone-400">₹50,000+ spend. 15% cashback + free snacks & welcome drinks.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Wallet Balance Hero Tile */}
            <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl flex flex-col justify-between space-y-6 col-span-1">
              <div>
                <span className="px-2 py-0.5 bg-[#c5a059]/10 text-[#c5a059] text-[9px] font-mono font-bold rounded uppercase">
                  Salon Wallet
                </span>
                <h3 className="text-xl font-serif italic text-white mt-2">My Salon Wallet Balance</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Your referral reward money and festival discount credits. Use them for instant discount on any haircut or treatment.
                </p>
              </div>

              <div className="p-6 bg-[#0a0a0b] border border-stone-800 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-mono font-bold tracking-widest block">
                  Available Balance
                </span>
                <h4 className="text-4xl md:text-5xl font-serif text-[#c5a059] font-bold font-mono">
                  ₹{customerWalletBalance.toLocaleString('en-IN')}
                </h4>
                <p className="text-[10px] text-emerald-400 font-mono pt-1">
                  Ready to use on your next bill
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-stone-400 font-sans border-t border-[#2a2a2d] pt-4">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#c5a059]" />
                  <span>Get ₹500 discount for every friend you invite</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#c5a059]" />
                  <span>Instant deduction on your salon bill</span>
                </p>
              </div>
            </div>

            {/* Invite a Friend Form & Ledger */}
            <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-5 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
                <div>
                  <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                    <Gift size={16} className="text-[#c5a059]" />
                    Invite Friends & Get ₹500 Off
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Invite your friends to Royal Tresses Jaipur! When they register, ₹500 is added to your wallet right away.
                  </p>
                </div>
              </div>

              {/* Referral Feedback alert */}
              {referralFeedback && (
                <div className={`p-4 rounded-lg text-xs flex items-center gap-2.5 ${
                  referralFeedback.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {referralFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{referralFeedback.message}</span>
                </div>
              )}

              {/* Send invite form */}
              <form onSubmit={handleSendReferral} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg space-y-3">
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block font-semibold">
                  Friend's Email Address
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={referralEmail}
                    onChange={e => setReferralEmail(e.target.value)}
                    placeholder="friend.email@example.com"
                    className="flex-1 bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReferral || !referralEmail}
                    className="bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-stone-800 text-black text-xs font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSendingReferral ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Gift size={13} />
                        <span>Send ₹500 Invite</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Referral Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-stone-400 font-bold">
                    Friends You Have Invited ({referrals.length})
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Total Earned: ₹{(referrals.length * 500).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {referrals.length === 0 ? (
                    <div className="p-6 text-center bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-stone-500 text-xs italic">
                      No friends invited yet. Enter an email above to invite!
                    </div>
                  ) : (
                    referrals.map(ref => (
                      <div
                        key={ref.id}
                        className="p-3 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Gift size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-stone-200 font-mono text-xs">{ref.refereeEmail}</p>
                            <p className="text-[10px] text-stone-500">
                              Status: <span className="text-emerald-400 font-semibold">{ref.status || 'REWARDED'}</span>
                              {ref.createdAt && ` • ${new Date(ref.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                          +₹{(ref.rewardValue || 500).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Top 5 Referrers Social Competition Leaderboard Component */}
          <div className="bg-[#121214] border border-[#c5a059]/30 p-6 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#2a2a2d]">
              <div>
                <span className="p-1 px-1.5 bg-[#c5a059]/10 text-[#c5a059] rounded font-mono text-[9px] font-bold uppercase tracking-wider">
                  Customer Leaderboard
                </span>
                <h3 className="text-xl font-serif italic text-white mt-1">Top 5 Jaipur Referrers (Most Friends Invited)</h3>
                <p className="text-xs text-stone-400">
                  Our top clients who referred friends and earned maximum salon discounts in Jaipur.
                </p>
              </div>
              <div className="bg-[#0a0a0b] border border-[#2a2a2d] px-3 py-1.5 rounded-lg text-right">
                <span className="text-[9px] font-mono text-stone-400 block uppercase">Your Rank</span>
                <span className="text-xs font-mono font-bold text-[#c5a059]">
                  Rank #{Math.max(1, 6 - referrals.length)} ({referrals.length} Referrals)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { rank: 1, name: profile.name || 'Ananya Singhania', branch: 'C-Scheme Executive', count: Math.max(8, referrals.length + 3), earned: (Math.max(8, referrals.length + 3) * 500), tier: 'Platinum' },
                { rank: 2, name: 'Vikram Rathore', branch: 'Malviya Nagar Elite', count: 6, earned: 3000, tier: 'Platinum' },
                { rank: 3, name: 'Natasha Sharma', branch: 'Vaishali Nagar Chic', count: 5, earned: 2500, tier: 'Diamond' },
                { rank: 4, name: 'Siddharth Jaipuria', branch: 'C-Scheme Executive', count: 4, earned: 2000, tier: 'Diamond' },
                { rank: 5, name: 'Priya Mehta', branch: 'Malviya Nagar Elite', count: 3, earned: 1500, tier: 'Gold' },
              ].map((leader) => {
                const isCurrentUser = leader.name === (profile.name || 'Ananya Singhania');
                return (
                  <div
                    key={leader.rank}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                      isCurrentUser
                        ? 'bg-[#c5a059]/15 border-[#c5a059]/60 shadow-lg'
                        : 'bg-[#0a0a0b] border-[#2a2a2d] hover:border-stone-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        leader.rank === 1 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' :
                        leader.rank === 2 ? 'bg-stone-300 text-black' :
                        leader.rank === 3 ? 'bg-amber-700 text-amber-100' :
                        'bg-stone-800 text-stone-300'
                      }`}>
                        {leader.rank === 1 ? '👑' : `#${leader.rank}`}
                      </span>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-[#c5a059] text-black">
                          You
                        </span>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-serif font-bold text-white truncate">{leader.name}</h5>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">{leader.branch}</p>
                      <p className="text-[9px] text-[#c5a059] font-mono mt-1 font-semibold">{leader.tier} Tier</p>
                    </div>

                    <div className="pt-2 border-t border-[#2a2a2d] flex justify-between items-baseline">
                      <span className="text-[9px] font-mono text-stone-500 uppercase">{leader.count} Ref.</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        ₹{leader.earned.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Saved Salons & Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2d]">
              <div>
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <Heart size={16} className="text-[#c5a059] fill-[#c5a059]" />
                  Saved Salons & Beauty Parlours (Wishlist)
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Your bookmarked luxury beauty salons and hair studios across Jaipur.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-[#c5a059]/10 text-[#c5a059] px-2 py-0.5 rounded">
                {formData.savedSalons?.length || 0} Bookmarked
              </span>
            </div>

            {(!formData.savedSalons || formData.savedSalons.length === 0) ? (
              <div className="p-12 text-center bg-[#0a0a0b] rounded-lg border border-[#2a2a2d] space-y-3">
                <Heart size={32} className="mx-auto text-stone-600" />
                <h4 className="text-sm font-serif italic text-white">No Salons Saved in Wishlist Yet</h4>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Browse our salon discovery listing and click the heart icon on any beauty parlour to bookmark it here for quick access.
                </p>
                {/* Default showcase saved salon */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...formData,
                        savedSalons: ['downtown-executive', 'uptown-chic']
                      };
                      setFormData(updated);
                      setIsDirty(true);
                    }}
                    className="bg-[#c5a059] text-black text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded transition hover:bg-[#b08c49] cursor-pointer"
                  >
                    Load Sample Jaipur Wishlist Salons
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenants
                  .filter(t => formData.savedSalons?.includes(t.id))
                  .map(salon => (
                    <div key={salon.id} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] hover:border-[#c5a059]/40 rounded-lg flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/20 px-2 py-0.5 rounded">
                            📍 {salon.city}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...formData,
                                savedSalons: formData.savedSalons?.filter(id => id !== salon.id)
                              };
                              setFormData(updated);
                              setIsDirty(true);
                            }}
                            className="text-red-400 hover:text-red-300 text-xs p-1"
                            title="Remove from saved"
                          >
                            ♥ Remove
                          </button>
                        </div>
                        <h4 className="text-sm font-serif italic text-white font-bold mt-2">{salon.name}</h4>
                        <p className="text-xs text-stone-400 mt-1">{salon.address}</p>
                      </div>

                      <div className="pt-3 border-t border-[#2a2a2d] flex justify-between items-center text-xs">
                        <span className="text-amber-400 font-mono font-bold">{salon.rating} ★ Rating</span>
                        {onNavigateToBooking && (
                          <button
                            type="button"
                            onClick={() => onNavigateToBooking()}
                            className="bg-[#c5a059] text-black text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded transition hover:bg-[#b08c49] cursor-pointer"
                          >
                            Book Visit →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
export default ProfileView;

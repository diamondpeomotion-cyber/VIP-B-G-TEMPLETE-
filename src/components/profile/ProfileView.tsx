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
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'rewards'>('info');

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
        message: 'Could not dispatch referral invitation. Please try again.'
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
                <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold tracking-wider bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059]">
                  Jaipur VIP Prestige Tier
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
          <span>Contact Info & Preferences</span>
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
          <span>Appointment History ({appointments.length})</span>
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
          <span>Referral Rewards & Wallet (₹{customerWalletBalance.toLocaleString('en-IN')})</span>
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

          {/* Section 1: Contact Coordinates */}
          <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
              <div>
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <User size={16} className="text-[#c5a059]" />
                  Contact Information & Client Credentials
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Update your personal details used for reservation confirmation alerts and concierge check-in.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-stone-850 px-2 py-0.5 rounded text-stone-400">
                Primary Account
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
                  placeholder="e.g. Julianne Moore"
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
                  placeholder="client@nexora.com"
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
                  placeholder="+1 (555) 234-5678"
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition"
                />
              </div>
            </div>

            {/* Notification preference toggles */}
            <div className="pt-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-2 font-semibold flex items-center gap-1.5">
                <Bell size={13} className="text-[#c5a059]" />
                Appointment Reminders & Notification Channel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'both', label: 'SMS & Email', desc: 'Instant text dispatch + digital calendar calendar invite' },
                  { id: 'sms', label: 'SMS Only', desc: 'Text reminders 2 hours before scheduled slot' },
                  { id: 'email', label: 'Email Only', desc: 'Quiet receipts and PDF treatment summaries' },
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

          {/* Section 2: Salon & Biological Preferences */}
          <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
              <div>
                <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                  <Scissors size={16} className="text-[#c5a059]" />
                  Atelier & Styling Architecture Preferences
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Helps our master stylists customize formulas, thermal temperatures, and appointment preparation.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#c5a059]/10 text-[#c5a059] px-2 py-0.5 rounded">
                Personalized Formula
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
                  Preferred Specialist Stylist
                </label>
                <select
                  value={formData.preferredStylist}
                  onChange={e => handleInputChange('preferredStylist', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  <option value="">No preference (Auto-match best available)</option>
                  {stylists.map(st => (
                    <option key={st.id} value={st.name}>
                      {st.name} — {st.specialties.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Hair Biological Texture
                </label>
                <select
                  value={formData.hairTexture}
                  onChange={e => handleInputChange('hairTexture', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  <option value="Straight / Fine">Straight / Fine</option>
                  <option value="Wavy / Textured">Wavy / Textured</option>
                  <option value="Coarse / Curly">Coarse / Curly</option>
                  <option value="Kinky / Coiled">Kinky / Coiled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold">
                  Facial Structural Contour
                </label>
                <select
                  value={formData.facialShape}
                  onChange={e => handleInputChange('facialShape', e.target.value)}
                  className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded-md px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition cursor-pointer"
                >
                  <option value="Oval Contour">Oval Contour</option>
                  <option value="Square Contour">Square Contour</option>
                  <option value="Round Contour">Round Contour</option>
                  <option value="Heart Contour">Heart Contour</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5 font-semibold flex items-center gap-1.5">
                  <Coffee size={13} className="text-[#c5a059]" />
                  Complimentary Hospitality Beverage
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
                  Scalp, Skin Sensitivities & Allergies
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Wallet Balance Hero Tile */}
            <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl flex flex-col justify-between space-y-6 col-span-1">
              <div>
                <span className="px-2 py-0.5 bg-[#c5a059]/10 text-[#c5a059] text-[9px] font-mono font-bold rounded uppercase">
                  Digital Ledger Escrow
                </span>
                <h3 className="text-xl font-serif italic text-white mt-2">Personal Glow Wallet</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Referral bounties and seasonal credits stored in your client balance. Redeemable on any salon treatment.
                </p>
              </div>

              <div className="p-6 bg-[#0a0a0b] border border-stone-800 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-mono font-bold tracking-widest block">
                  Available Credits
                </span>
                <h4 className="text-4xl md:text-5xl font-serif text-[#c5a059] font-bold font-mono">
                  ₹{customerWalletBalance.toLocaleString('en-IN')}
                </h4>
                <p className="text-[10px] text-emerald-400 font-mono pt-1">
                  Ready to apply at session checkout
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-stone-400 font-sans border-t border-[#2a2a2d] pt-4">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#c5a059]" />
                  <span>Earn ₹500 for every friend who books</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#c5a059]" />
                  <span>Instant balance discount deduction on invoices</span>
                </p>
              </div>
            </div>

            {/* Invite a Friend Form & Ledger */}
            <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-5 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
                <div>
                  <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                    <Gift size={16} className="text-[#c5a059]" />
                    Share the Glow & Earn ₹500
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Send an exclusive VIP invitation. When your referee registers in the salon database, your wallet immediately receives ₹500!
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

              {/* Dispatch form */}
              <form onSubmit={handleSendReferral} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg space-y-3">
                <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block font-semibold">
                  Send Referral Invitation to Friend's Email
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={referralEmail}
                    onChange={e => setReferralEmail(e.target.value)}
                    placeholder="friend.glow@example.com"
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
                        <span>Dispatch ₹500 Reward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Referral Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-stone-400 font-bold">
                    Successful Referrals History ({referrals.length})
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Total Earned: ₹{(referrals.length * 500).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {referrals.length === 0 ? (
                    <div className="p-6 text-center bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg text-stone-500 text-xs italic">
                      No referral invitations dispatched yet. Invite your friends above!
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

        </div>
      )}

    </div>
  );
}
export default ProfileView;

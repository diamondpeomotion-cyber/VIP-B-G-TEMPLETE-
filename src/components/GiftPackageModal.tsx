import React, { useState } from 'react';
import { Gift, X, Check, Copy, Sparkles, Send, Heart, Mail, Smartphone, CheckCircle2, ShoppingBag } from 'lucide-react';
import { CustomerProfile } from '../types';

interface GiftPackageModalProps {
  packageObj: {
    id: string;
    name: string;
    price: number;
    origPrice: number;
    saving: number;
    badge: string;
    inclusions: string[];
  } | null;
  onClose: () => void;
  senderProfile: CustomerProfile;
  onVoucherCreated?: () => void;
}

export default function GiftPackageModal({
  packageObj,
  onClose,
  senderProfile,
  onVoucherCreated
}: GiftPackageModalProps) {
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState<string>('Wishing you a royal festive glow! Enjoy this special salon package at Royal Tresses Jaipur!');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdVoucher, setCreatedVoucher] = useState<any | null>(null);
  const [bonusAdded, setBonusAdded] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!packageObj) return null;

  const handlePurchaseGiftVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientEmail) {
      alert('Please enter your friend\'s name and email address!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gift-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: packageObj.name,
          packagePrice: packageObj.price,
          recipientName,
          recipientEmail,
          recipientPhone,
          senderName: senderProfile.name || 'Ananya Singhania',
          senderEmail: senderProfile.email || 'client@royaltresses.in',
          personalMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedVoucher(data.voucher);
        setBonusAdded(data.bonusWalletAdded || 0);
        if (onVoucherCreated) onVoucherCreated();
      } else {
        const err = await res.json();
        alert(err.error || 'Could not process gift voucher. Please try again!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyVoucherCode = () => {
    if (createdVoucher?.voucherCode) {
      navigator.clipboard.writeText(createdVoucher.voucherCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div
      id="gift-package-voucher-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
    >
      <div
        className="bg-[#121214] border-2 border-[#c5a059] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2a2a2d] bg-[#0a0a0b] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
              <Gift size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="p-1 px-2 rounded-sm bg-[#c5a059]/20 text-[#c5a059] text-[9px] uppercase font-mono font-bold flex items-center gap-1">
                  🎁 Festive Gift Voucher
                </span>
                <span className="text-[10px] text-amber-300 font-mono font-bold">
                  Get 10% Cashback Bonus
                </span>
              </div>
              <h3 id="gift-modal-title" className="text-lg sm:text-xl font-serif font-bold text-white">
                Gift '{packageObj.name}'
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto font-sans text-xs">
          
          {/* Package Summary Box */}
          <div className="p-3.5 rounded-xl bg-[#0a0a0b] border border-[#c5a059]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                Selected Festive Package
              </span>
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded font-bold">
                Save ₹{packageObj.saving.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <h4 className="text-sm font-serif font-bold text-white">{packageObj.name}</h4>
              <div className="text-right">
                <span className="text-xs text-stone-500 line-through font-mono mr-1.5">₹{packageObj.origPrice.toLocaleString('en-IN')}</span>
                <span className="text-base font-serif font-bold text-[#c5a059]">₹{packageObj.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-850">
              Valid at all Jaipur Branches (C-Scheme, Malviya Nagar, Vaishali Nagar) • Valid for 12 months
            </p>
          </div>

          {!createdVoucher ? (
            /* Gift Purchase Form */
            <form onSubmit={handlePurchaseGiftVoucher} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-stone-300 block">
                  1. Friend's Full Name (Recipient) *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Ishita Sharma"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-stone-300 block">
                    2. Friend's Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="friend.email@example.com"
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-stone-300 block">
                    3. Friend's WhatsApp / Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98290 00000"
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-stone-300 block">
                  4. Personal Gift Note / Message
                </label>
                <textarea
                  rows={2}
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="e.g. Wishing you a happy festive season! Enjoy this royal pampering session!"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Sender Details Note */}
              <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <Heart size={12} className="text-[#c5a059]" />
                  <span>Sender Name on Voucher: <strong className="text-white">{senderProfile.name || 'Ananya Singhania'}</strong></span>
                </div>
                <span className="text-[#c5a059] font-mono">10% Wallet Reward</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#c5a059] hover:bg-[#b08c49] disabled:bg-stone-800 text-black text-xs font-mono font-extrabold uppercase py-3 rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Generating Digital Gift Voucher...</span>
                ) : (
                  <>
                    <Gift size={14} />
                    <span>Purchase & Send Gift Voucher (₹{packageObj.price.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Created Digital Gift Voucher Card Display */
            <div className="space-y-4 animate-scaleUp">
              
              {/* Cashback Bonus Notice */}
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <div>
                  <strong className="text-xs block font-bold">Digital Gift Voucher Created & Emailed!</strong>
                  <span className="text-[10px] text-stone-300">
                    Bonus ₹{bonusAdded} cashback reward deposited into your Royal Glow Wallet!
                  </span>
                </div>
              </div>

              {/* Digital Luxury Gift Voucher Card */}
              <div className="bg-[#121214] border-2 border-[#c5a059] p-5 rounded-2xl shadow-2xl relative space-y-4 overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#c5a059] text-black font-mono text-[8px] font-extrabold px-3 py-0.5 rounded-bl-lg uppercase tracking-widest">
                  OFFICIAL SALON GIFT VOUCHER
                </div>

                <div className="flex justify-between items-start pt-1">
                  <div>
                    <span className="text-[9px] font-mono text-[#c5a059] font-bold uppercase tracking-wider block">
                      ROYAL TRESSES JAIPUR
                    </span>
                    <h4 className="text-base font-serif font-bold text-white mt-0.5">{createdVoucher.packageName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-serif font-bold text-[#c5a059]">₹{createdVoucher.packagePrice.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-stone-400 font-mono block">FULLY PAID VOUCHER</span>
                  </div>
                </div>

                {/* Voucher Code Banner */}
                <div className="bg-[#0a0a0b] border border-[#c5a059] p-3 rounded-xl text-center space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                    DIGITAL GIFT VOUCHER CODE
                  </span>
                  <div className="text-xl font-mono font-bold text-[#c5a059] tracking-widest select-all">
                    {createdVoucher.voucherCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVoucherCode}
                    className="text-[10px] font-mono text-stone-300 hover:text-white flex items-center justify-center gap-1 mx-auto underline pt-0.5 cursor-pointer"
                  >
                    {copiedCode ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>{copiedCode ? 'Voucher Code Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Recipient & Message Details */}
                <div className="space-y-1.5 text-[11px] font-sans text-stone-300 bg-[#0a0a0b] p-3 rounded-xl border border-stone-850">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Gift For:</span>
                    <strong className="text-white">{createdVoucher.recipientName} ({createdVoucher.recipientEmail})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Gift From:</span>
                    <strong className="text-stone-200">{createdVoucher.senderName}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-900 text-[10px] font-mono">
                    <span className="text-stone-500">Validity Period:</span>
                    <span className="text-emerald-400 font-bold">Valid Until {createdVoucher.validUntil} (12 Months)</span>
                  </div>
                </div>

                {/* Personal Message Quote */}
                <div className="p-2.5 bg-[#0a0a0b] rounded-lg border border-stone-850 italic text-[11px] text-stone-300">
                  "{createdVoucher.personalMessage}"
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedVoucher(null)}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-bold bg-[#121214] border border-stone-800 hover:border-stone-600 text-stone-300 transition cursor-pointer"
                >
                  Gift Another Package
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#c5a059] text-black text-xs font-mono font-extrabold uppercase px-4 py-2 rounded-lg transition hover:bg-[#b08c49] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

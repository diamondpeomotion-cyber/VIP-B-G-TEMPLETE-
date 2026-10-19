import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, QrCode, Building, Phone, ArrowRight, ShieldCheck, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, appointment, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash'>('upi');
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('client@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [payloadLog, setPayloadLog] = useState<any>(null);

  // Auto-format helper
  useEffect(() => {
    if (cardNumber.length > 0) {
      const sanitized = cardNumber.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const parts = [];
      for (let i = 0; i < sanitized.length; i += 4) {
        parts.push(sanitized.substr(i, 4));
      }
      setCardNumber(parts.join(' ').substring(0, 19));
    }
  }, [cardNumber]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          paymentMethod: method,
          currency: 'INR'
        })
      });

      const data = await response.json();
      
      // Artificial short delay to make the bank authorization feel realistic
      setTimeout(() => {
        setLoading(false);
        if (data.success) {
          setPaymentComplete(true);
          setPayloadLog(data);
          
          // Trigger callbacks after the congratulations screen has briefly settled
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3500);
        }
      }, 1800);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="payment-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Soft backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
        />

        {/* Razorpay Themed Card Modal */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl text-neutral-800"
        >
          {/* Brand Custom Header */}
          <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-bold">Royal Tresses Jaipur FastPay</p>
              <h3 className="text-lg font-semibold tracking-tight">Razorpay & UPI Gateway (₹ INR)</h3>
            </div>
            <button 
              id="close-payment-modal"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {/* Appointment mini summary */}
            <div className="mb-6 rounded-xl bg-neutral-50 px-4 py-3 flex justify-between items-center border border-neutral-100">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Service Billing</p>
                <h4 className="text-sm font-bold text-neutral-800">{appointment.serviceName}</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Specialist: {appointment.stylistName}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-neutral-400 uppercase">Total Payable</span>
                <p className="text-xl font-bold text-slate-900 font-mono">₹{appointment.paymentAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {!paymentComplete ? (
              <form onSubmit={handlePayment}>
                {/* Tabs selection */}
                <div className="grid grid-cols-4 gap-1.5 mb-6 bg-neutral-100 p-1 rounded-xl">
                  <button
                    id="pay-tab-upi"
                    type="button"
                    onClick={() => setMethod('upi')}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      method === 'upi' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <QrCode size={16} />
                    <span>UPI / QR</span>
                  </button>
                  <button
                    id="pay-tab-card"
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      method === 'card' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <CreditCard size={16} />
                    <span>Card</span>
                  </button>
                  <button
                    id="pay-tab-netbanking"
                    type="button"
                    onClick={() => setMethod('netbanking')}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      method === 'netbanking' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Building size={16} />
                    <span>Netbanking</span>
                  </button>
                  <button
                    id="pay-tab-cash"
                    type="button"
                    onClick={() => setMethod('cash')}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      method === 'cash' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    <span>Cash Counter</span>
                  </button>
                </div>

                {/* Sub Tab Panel View */}
                <div className="min-h-[140px] mb-6">
                  {method === 'upi' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col items-center">
                        <div className="w-32 h-32 bg-slate-900 rounded-lg flex items-center justify-center relative shadow-xs overflow-hidden">
                          {/* Simulated QR Code grids and animations */}
                          <div className="absolute inset-0 bg-linear-to-b from-transparent via-emerald-400/20 to-transparent animate-pulse" />
                          <QrCode size={96} className="text-white relative z-10" />
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-2 font-medium">Scan with PhonePe, Google Pay, Paytm, or BHIM</p>
                      </div>
                      <div className="w-full text-left">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Enter UPI VPA ID</label>
                        <input
                          id="upi-id-input"
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@okhdfcbank"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-800 focus:bg-white text-neutral-800 text-center font-mono"
                        />
                      </div>
                    </motion.div>
                  )}

                  {method === 'card' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Debit / Credit / RuPay Card</label>
                        <input
                          id="card-number-input"
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-800 focus:bg-white text-neutral-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1 font-mono">Expiry</label>
                          <input
                            id="card-expiry-input"
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-800 focus:bg-white text-neutral-800 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1 font-mono">CVV</label>
                          <input
                            id="card-cvv-input"
                            type="password"
                            required
                            placeholder="***"
                            maxLength={3}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-800 focus:bg-white text-neutral-800 text-center"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {method === 'netbanking' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Select Preferred Indian Bank</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['HDFC Bank', 'State Bank of India (SBI)', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Bank of Baroda'].map(bank => (
                            <button
                              id={`bank-select-${bank.replace(/\s+/g, '-').toLowerCase()}`}
                              key={bank}
                              type="button"
                              onClick={() => setSelectedBank(bank)}
                              className={`py-2 px-3 text-xs font-semibold rounded-lg text-left border transition cursor-pointer ${
                                selectedBank === bank 
                                  ? 'border-slate-900 bg-slate-50 text-slate-900' 
                                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-800'
                              }`}
                            >
                              {bank}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {method === 'cash' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-center">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Cash Counter Settlement</p>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Pay ₹{appointment.paymentAmount.toLocaleString('en-IN')} in cash directly at the Jaipur salon cash counter upon service completion.
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">Invoice and tax receipt will be issued instantly.</p>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Action Button */}
                <button
                  id="submit-payment-button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-md cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Authorizing Razorpay Gateway...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{appointment.paymentAmount.toLocaleString('en-IN')} Securely</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                  <CheckCircle2 size={44} />
                </div>
                <h4 className="text-lg font-bold text-neutral-800">Payment Captured Successfully!</h4>
                <p className="text-sm text-neutral-500 mt-1 max-w-[280px]">Your Razorpay order has completed and triggered our SalonOS payment callback.</p>
                
                {/* Simulated webhook log notification */}
                <div className="mt-5 w-full bg-slate-900 p-3 rounded-lg text-left hidden sm:block">
                  <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Background Webhook Streamed</p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1 font-bold">Event: payment.captured</p>
                  <p className="text-[10px] text-zinc-500 font-mono shrink mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    Txn ID: {payloadLog?.transactionId} | Order: {payloadLog?.orderId}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bottom Safe Badge */}
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-neutral-400 font-medium">
              <ShieldCheck size={14} className="text-slate-800" />
              <span className="text-[10px] uppercase font-mono tracking-widest">PCI-DSS Compliant • SSL Encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

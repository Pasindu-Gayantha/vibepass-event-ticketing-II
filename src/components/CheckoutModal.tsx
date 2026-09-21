import { useState, useEffect } from 'react';
import { X, CreditCard, QrCode, Loader2, User, Mail, Phone, Info } from 'lucide-react';
import type { TicketTier, VibeEvent, User as UserType } from '@/types';
import { formatLKR } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface CheckoutModalProps {
  event: VibeEvent;
  tier: TicketTier;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string;
  initialUser?: UserType;
  onClose: () => void;
  onConfirm: (details: { name: string; email: string; mobile: string; paymentMethod: 'card' | 'lankaqr' }) => Promise<void> | void;
}

export default function CheckoutModal({
  event,
  tier,
  quantity,
  subtotal,
  discount,
  total,
  promoCode,
  initialUser,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [mobile, setMobile] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'lankaqr'>('card');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialUser?.email) {
      setEmail(initialUser.email);
      return;
    }

    const loadUserFromSupabase = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setEmail(data.user.email);
      }
    };
    loadUserFromSupabase();
  }, [initialUser]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(mobile.replace(/\s/g, ''))) e.mobile = 'Enter a 10-digit number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm({ name, email, mobile, paymentMethod });

      // Save redeemed promo code for the user if applied
      if (promoCode && promoCode.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        const storageKey = `vibepass_used_promos_${normalizedEmail}`;
        const existingPromos: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const codeUpper = promoCode.trim().toUpperCase();
        if (!existingPromos.includes(codeUpper)) {
          existingPromos.push(codeUpper);
          localStorage.setItem(storageKey, JSON.stringify(existingPromos));
        }
      }
    } catch {
      setErrors({ submit: 'Payment failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#0a0a0f] rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-500/15">
          <h2 className="text-white font-bold text-lg">Checkout</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-5 bg-[#0a0a0f]/50 border-b border-purple-500/15">
          <div className="flex items-center gap-3 mb-3">
            <img src={event.banner_url} alt={event.title} className="w-14 h-14 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{event.title}</div>
              <div className="text-gray-400 text-xs">{tier.name} × {quantity}</div>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="text-white">{formatLKR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({promoCode})</span>
                <span>-{formatLKR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold pt-1 border-t border-purple-500/15">
              <span>Total</span>
              <span className="text-rose-400">{formatLKR(total)}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Linked Account Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              The ticket will be automatically linked to your logged-in account email so you can access it anytime under <strong>My Tickets</strong>.
            </span>
          </div>

          {/* Name */}
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
              className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all ${
                errors.name ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'
              }`}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Account Email
            </label>
            <input
              type="email"
              value={email}
              disabled={!!initialUser}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@vibepass.lk"
              className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all ${
                initialUser ? 'opacity-70 cursor-not-allowed border-purple-500/10' : ''
              } ${errors.email ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'}`}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="07XXXXXXXX"
              className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all ${
                errors.mobile ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'
              }`}
            />
            {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-2">Payment Method</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : 'border-purple-500/15 bg-white/5 hover:border-purple-500/30'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-rose-400' : 'text-gray-400'}`} />
                <span className="text-white text-sm font-medium">Credit / Debit Card</span>
                <div className={`ml-auto w-4 h-4 rounded-full border-2 transition-all ${
                  paymentMethod === 'card' ? 'border-rose-400 bg-rose-400' : 'border-gray-500'
                }`} />
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('lankaqr')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'lankaqr'
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : 'border-purple-500/15 bg-white/5 hover:border-purple-500/30'
                }`}
              >
                <QrCode className={`w-5 h-5 ${paymentMethod === 'lankaqr' ? 'text-rose-400' : 'text-gray-400'}`} />
                <span className="text-white text-sm font-medium">LankaQR / Bank Transfer</span>
                <div className={`ml-auto w-4 h-4 rounded-full border-2 transition-all ${
                  paymentMethod === 'lankaqr' ? 'border-rose-400 bg-rose-400' : 'border-gray-500'
                }`} />
              </button>
            </div>
          </div>

          {errors.submit && <p className="text-red-400 text-sm text-center">{errors.submit}</p>}

          {/* Pay Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${formatLKR(total)} & Get Ticket`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
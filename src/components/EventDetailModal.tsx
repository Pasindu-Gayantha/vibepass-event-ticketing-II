import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Users, Minus, Plus, Tag, Ticket } from 'lucide-react';
import type { VibeEvent, TicketTier } from '@/types';
import { formatLKR, formatDateFull, formatTime, getCountdown } from '@/lib/utils';

interface EventDetailModalProps {
  event: VibeEvent;
  tiers: TicketTier[];
  loading: boolean;
  onClose: () => void;
  onBook: (tier: TicketTier, quantity: number, promoCode: string, subtotal: number, discount: number, total: number) => void;
}

export default function EventDetailModal({ event, tiers, loading, onClose, onBook }: EventDetailModalProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const init: Record<string, number> = {};
    tiers.forEach((t) => { init[t.id] = 0; });
    setQuantities(init);
    setSelectedTierId(null);
    setPromoCode('');
    setDiscountPercent(0);
    setPromoMessage(null);
  }, [tiers]);

  const countdown = getCountdown(event.event_date);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || null;
  const selectedQty = selectedTier ? quantities[selectedTier.id] || 0 : 0;
  const subtotal = selectedTier ? selectedTier.price * selectedQty : 0;
  const discount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discount);

  const handleQtyChange = (tierId: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [tierId]: next };
    });
    if (delta > 0) setSelectedTierId(tierId);
    else if (Math.max(0, Math.min(max, (quantities[tierId] || 0) + delta)) === 0 && selectedTierId === tierId) {
      setSelectedTierId(null);
    }
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setDiscountPercent(0);
      setPromoMessage(null);
      return;
    }

    // Check if logged-in user already redeemed this promo code
    try {
      const storedUser = localStorage.getItem('vibepass_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.email) {
          const usedPromos: string[] = JSON.parse(
            localStorage.getItem(`vibepass_used_promos_${user.email.trim().toLowerCase()}`) || '[]'
          );
          if (usedPromos.includes(code)) {
            setDiscountPercent(0);
            setPromoMessage({ text: 'You have already redeemed this promo code!', isError: true });
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    if (code === 'VIBE10') {
      setDiscountPercent(10);
      setPromoMessage({ text: 'VIBE10 applied — 10% discount added!', isError: false });
    } else if (code === 'EARLY20') {
      setDiscountPercent(20);
      setPromoMessage({ text: 'EARLY20 applied — 20% Early Bird discount added!', isError: false });
    } else if (code === 'GROUP5') {
      setDiscountPercent(5);
      setPromoMessage({ text: 'GROUP5 applied — 5% Group discount added!', isError: false });
    } else {
      setDiscountPercent(0);
      setPromoMessage({ text: 'Invalid promo code. Try VIBE10, EARLY20, or GROUP5', isError: true });
    }
  };

  const handleBook = () => {
    if (!selectedTier || selectedQty === 0) return;
    onBook(selectedTier, selectedQty, discountPercent > 0 ? promoCode.trim().toUpperCase() : '', subtotal, discount, total);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" />
      <div
        className="relative min-h-screen flex items-start justify-center p-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-5xl bg-[#0a0a0f] rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-500/10">
          {/* Hero Banner */}
          <div className="relative h-64 sm:h-80 overflow-hidden">
            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#0a0a0f]/60 backdrop-blur-md border border-purple-500/20 flex items-center justify-center text-white hover:bg-[#0a0a0f]/80 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {event.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300">
                  {formatLKR(event.starting_price)} starting
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400" /> {event.venue}, {event.location}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-rose-400" /> {formatDateFull(event.event_date)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-rose-400" /> {formatTime(event.event_date)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Left: Details */}
            <div className="lg:col-span-2 p-6 space-y-6">
              {/* Countdown - Days, Hours, Minutes */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Days', value: countdown.days },
                  { label: 'Hours', value: countdown.hours },
                  { label: 'Minutes', value: countdown.minutes },
                ].map((item) => (
                  <div key={item.label} className="text-center bg-white/[0.03] rounded-xl border border-purple-500/15 py-3">
                    <div className="text-2xl font-bold text-rose-400 tabular-nums">
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="text-gray-500 text-xs uppercase font-medium mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Lineup */}
              <div>
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-400" /> Artist Lineup
                </h3>
                <div className="flex flex-wrap gap-2">
                  {event.lineup.map((artist) => (
                    <span key={artist} className="px-3 py-1.5 rounded-lg bg-white/5 border border-purple-500/15 text-gray-200 text-sm">
                      {artist}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-white font-bold text-lg mb-2">About this Event</h3>
                <p className="text-gray-400 leading-relaxed">{event.description}</p>
              </div>

              {/* Venue Info */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-purple-500/15">
                <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" /> Venue Details
                </h3>
                <p className="text-gray-400 text-sm">{event.venue}</p>
                <p className="text-gray-500 text-sm">{event.location}, Sri Lanka</p>
              </div>
            </div>

            {/* Right: Checkout Card */}
            <div className="lg:col-span-1 p-6 bg-[#0a0a0f]/50 border-t lg:border-t-0 lg:border-l border-purple-500/15 space-y-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-rose-400" /> Select Tickets
              </h3>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const qty = quantities[tier.id] || 0;
                    const isSelected = selectedTierId === tier.id;
                    return (
                      <div
                        key={tier.id}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-rose-500/50 bg-rose-500/5'
                            : 'border-purple-500/15 bg-white/[0.03] hover:border-purple-500/30'
                        }`}
                        onClick={() => setSelectedTierId(tier.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-white font-semibold text-sm">{tier.name}</div>
                            <div className="text-rose-400 font-bold text-lg">{formatLKR(tier.price)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQtyChange(tier.id, -1, tier.available); }}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold w-6 text-center tabular-nums">{qty}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQtyChange(tier.id, 1, tier.available); }}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                              disabled={qty >= tier.available}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {tier.perks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tier.perks.map((perk) => (
                              <span key={perk} className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                                {perk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Promo Code with real discount application */}
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (discountPercent > 0) {
                        setDiscountPercent(0);
                        setPromoMessage(null);
                      }
                    }}
                    placeholder="e.g. VIBE10"
                    className="flex-1 bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-all uppercase"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs mt-1.5 ${promoMessage.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                    {promoMessage.text}
                  </p>
                )}
                {!promoMessage && (
                  <p className="text-gray-500 text-xs mt-1.5">Use codes from Offers (e.g. VIBE10, EARLY20)</p>
                )}
              </div>

              {/* Subtotal & Discount Calculation */}
              <div className="space-y-2 pt-3 border-t border-purple-500/15">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span className="text-white">{formatLKR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-sm">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-{formatLKR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-1">
                  <span>Total</span>
                  <span className="text-rose-400">{formatLKR(total)}</span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBook}
                disabled={!selectedTier || selectedQty === 0}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {selectedTier && selectedQty > 0 ? `Book ${selectedQty} Ticket${selectedQty > 1 ? 's' : ''}` : 'Select Tickets to Book'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
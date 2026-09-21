import { useState, useEffect } from 'react';
import { Tag, Copy, Check, Clock, Flame, CheckCircle } from 'lucide-react';

interface Offer {
  code: string;
  title: string;
  description: string;
  badge: string;
  discount: string;
  bgImage: string;
  validUntil: string;
}

const offers: Offer[] = [
  {
    code: 'VIBE10',
    title: '10% Off Your First Booking',
    description: 'Use code VIBE10 at checkout for an instant 10% discount on any event. Limited time only!',
    badge: 'Active',
    discount: '10% OFF',
    bgImage: 'https://images.pexels.com/photos/1677710/pexels-photo-1677710.jpeg?auto=compress&cs=tinysrgb&w=940',
    validUntil: '2026-12-31T23:59:59',
  },
  {
    code: 'EARLY20',
    title: 'Early Bird Special',
    description: 'Book 30+ days before the event and get 20% off. Use code EARLY20 at checkout.',
    badge: 'Active',
    discount: '20% OFF',
    bgImage: 'https://images.pexels.com/photos/5193526/pexels-photo-5193526.jpeg?auto=compress&cs=tinysrgb&w=940',
    validUntil: '2026-12-15T23:59:59',
  },
  {
    code: 'GROUP5',
    title: 'Group Booking Bonus',
    description: 'Buy 5 or more tickets together and get a 5% group discount with code GROUP5.',
    badge: 'Active',
    discount: '5% OFF',
    bgImage: 'https://images.pexels.com/photos/7192878/pexels-photo-7192878.jpeg?auto=compress&cs=tinysrgb&w=940',
    validUntil: '2026-12-31T23:59:59',
  },
];

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function OfferCard({ offer, isRedeemed }: { offer: Offer; isRedeemed: boolean }) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(offer.validUntil);

  const handleCopy = () => {
    if (isRedeemed) return;
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group ${
        isRedeemed
          ? 'border-gray-800 bg-white/[0.01] opacity-60'
          : 'border-purple-500/15 bg-white/[0.03] backdrop-blur-md hover:border-rose-500/30 hover:shadow-lg hover:shadow-purple-500/20'
      }`}
    >
      {/* Background image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={offer.bgImage}
          alt={offer.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isRedeemed ? 'grayscale contrast-75' : 'group-hover:scale-110'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />

        {/* Discount tag */}
        <div
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-white text-sm font-bold shadow-lg ${
            isRedeemed
              ? 'bg-gray-700/80 text-gray-300'
              : 'bg-gradient-to-r from-rose-500 to-purple-600 shadow-purple-500/25'
          }`}
        >
          {offer.discount}
        </div>

        {/* Badge */}
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md flex items-center gap-1 ${
            isRedeemed
              ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isRedeemed ? (
            <>
              <CheckCircle className="w-3 h-3 text-gray-400" />
              Used
            </>
          ) : (
            <>
              <Flame className="w-3 h-3 text-emerald-300" />
              Active
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h2 className="text-white font-bold text-lg">{offer.title}</h2>
          <p className="text-gray-400 text-sm mt-1">{offer.description}</p>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-gray-500">Valid for:</span>
          {!countdown.expired ? (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">{countdown.days}d</span>
              <span className="bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">{countdown.hours}h</span>
              <span className="bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">{countdown.minutes}m</span>
              <span className="bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">{countdown.seconds}s</span>
            </div>
          ) : (
            <span className="text-red-400">Expired</span>
          )}
        </div>

        {/* Copy code button */}
        <button
          onClick={handleCopy}
          disabled={isRedeemed}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border font-mono font-bold text-sm transition-all ${
            isRedeemed
              ? 'bg-white/5 border-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-[#0a0a0f]/50 border-purple-500/20 text-rose-400 hover:bg-[#0a0a0f]/80 cursor-pointer'
          }`}
        >
          <span className="flex items-center gap-2">
            {isRedeemed ? (
              <CheckCircle className="w-4 h-4 text-gray-500" />
            ) : copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className={isRedeemed ? 'line-through text-gray-500' : ''}>{offer.code}</span>
          </span>
          <span className="text-xs font-sans">
            {isRedeemed ? 'Already Redeemed' : copied ? 'Copied!' : 'Click to copy'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const [usedPromos, setUsedPromos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('vibepass_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.email) {
          const email = user.email.trim().toLowerCase();
          const saved = JSON.parse(localStorage.getItem(`vibepass_used_promos_${email}`) || '[]');
          setUsedPromos(saved);
        }
      }
    } catch {
      setUsedPromos([]);
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-rose-400 text-sm font-medium mb-4">
            <Tag className="w-4 h-4" /> Exclusive Offers
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Save on Your Next Event</h1>
          <p className="text-gray-400">Use these promo codes at checkout to get discounts on your tickets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const isRedeemed = usedPromos.includes(offer.code.toUpperCase());
            return <OfferCard key={offer.code} offer={offer} isRedeemed={isRedeemed} />;
          })}
        </div>
      </div>
    </div>
  );
}
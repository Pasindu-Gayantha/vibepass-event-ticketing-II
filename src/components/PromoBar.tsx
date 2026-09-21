import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function PromoBar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 30000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-rose-500 via-purple-600 to-rose-500 text-white text-center py-2 px-4 text-sm font-medium overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      <div className="relative flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span>
          Limited Offer: Use code <span className="font-bold tracking-wider">VIBE10</span> for 10% OFF on checkout! Ends soon.
        </span>
      </div>
    </div>
  );
}

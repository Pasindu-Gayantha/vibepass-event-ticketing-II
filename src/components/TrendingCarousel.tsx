import { useRef } from 'react';
import { Flame, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { VibeEvent } from '@/types';
import { formatLKR } from '@/lib/utils';

interface TrendingCarouselProps {
  events: VibeEvent[];
  onEventClick: (event: VibeEvent) => void;
}

export default function TrendingCarousel({ events, onEventClick }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const trending = events.slice(0, 5);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (trending.length === 0) return null;

  return (
    <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-400" />
          Trending This Week
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-purple-500/20 border border-purple-500/10 flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-purple-500/20 border border-purple-500/10 flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-4 overflow-x-auto pb-2 scroll-smooth"
      >
        {trending.map((event) => {
          const d = event.event_date ? new Date(event.event_date) : new Date();
          const rawPrice = Number((event as any).starting_price ?? (event as any).price ?? 0);
          const validPrice = isNaN(rawPrice) ? 0 : rawPrice;

          return (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className="group relative flex-shrink-0 w-[260px] overflow-hidden rounded-2xl border border-purple-500/15 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-rose-500/40 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1"
            >
              {/* Banner */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={event.banner_url || 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />

                {/* Date badge */}
                <div className="absolute top-2 left-2 bg-[#0a0a0f]/90 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-purple-500/20 text-center">
                  <div className="text-rose-400 text-[10px] font-bold uppercase">
                    {d.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-white text-lg font-bold leading-none">
                    {d.getDate()}
                  </div>
                </div>

                {/* Trending pill */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-300 text-[10px] font-semibold flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5" /> Hot
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-1.5 text-left">
                <h3 className="text-white font-bold text-sm leading-tight truncate group-hover:text-rose-400 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-purple-500/10">
                  <span className="text-gray-500 text-[10px] uppercase">From</span>
                  <span className="text-rose-400 font-bold text-sm">{formatLKR(validPrice)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
import { useState } from 'react';
import { Search, Music, Ticket, ShieldCheck, Zap } from 'lucide-react';
import heroBg from '../hero-bg.png';

interface HeroProps {
  onSearch: (filters: { category: string; location: string; date: string }) => void;
}

const categories = ['All', 'Concerts', 'EDM', 'Acoustic'];

const trustBadges = [
  { icon: Ticket, label: 'Easy Booking' },
  { icon: ShieldCheck, label: 'Secure Payments' },
  { icon: Zap, label: 'Instant Confirmation' },
];

export default function Hero({ onSearch }: HeroProps) {
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = () => {
    onSearch({
      category: category === 'All' ? '' : category === 'Concerts' ? 'Concert' : category,
      location,
      date,
    });
  };

  return (
    <section className="relative min-h-[620px] w-full flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Concert background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-[#0a0a0f]/90 to-[#0a0a0f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/70 via-transparent to-[#0a0a0f]/30" />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/15 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-rose-400 text-sm font-medium mb-6">
            <Music className="w-4 h-4" />
            Sri Lanka's Premier Concert Ticketing Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 tracking-tight">
            Your Next <br />
            <span className="bg-gradient-to-r from-purple-500 via-rose-500 to-fuchsia-400 bg-clip-text text-transparent">
              Experience
            </span>
            <br />
            Awaits
          </h1>

          <p className="text-slate-300 text-lg max-w-xl mb-8">
            Discover the best events, book your tickets and be part of unforgettable moments.
          </p>

          {/* Floating Search Bar */}
          <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-full border border-purple-500/30 shadow-2xl shadow-purple-500/10 p-2 max-w-2xl">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 text-left">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:block w-px bg-purple-500/20" />

              <div className="flex-1 text-left">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location or Venue"
                  className="w-full bg-transparent px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div className="hidden sm:block w-px bg-purple-500/20" />

              <div className="flex-1 text-left">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent px-4 py-2.5 text-white text-sm focus:outline-none [color-scheme:dark]"
                />
              </div>

              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold px-6 py-2.5 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Trust Badges — Align based on Search bar */}
          <div className="grid grid-cols-3 items-center max-w-2xl mt-6 px-3">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              const alignment = 
                index === 0 
                  ? 'justify-start' 
                  : index === 1 
                  ? 'justify-center' 
                  : 'justify-end';

              return (
                <div
                  key={badge.label}
                  className={`flex items-center gap-2 text-xs sm:text-sm text-gray-300 ${alignment}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <span className="truncate">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
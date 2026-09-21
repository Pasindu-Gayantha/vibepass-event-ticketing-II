import { useState } from 'react';
import { AudioLines, Instagram, Youtube, Music, Send, Check } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'home' | 'organizer' | 'offers') => void;
  onCategorySelect: (category: string) => void;
}

export default function Footer({ onNavigate, onCategorySelect }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="border-t border-purple-500/10 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AudioLines className="w-6 h-6 text-rose-400" strokeWidth={2.5} />
              <span className="text-lg font-bold bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">
                VibePass
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Sri Lanka's premier concert ticketing platform. Live the Sound. Feel the Energy.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-purple-500/10 flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-purple-500/10 flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-purple-500/10 flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all">
                <Music className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => { onCategorySelect('Concert'); onNavigate('home'); }} className="text-gray-500 hover:text-rose-400 text-sm transition-all">Concerts</button></li>
              <li><button onClick={() => { onCategorySelect('EDM'); onNavigate('home'); }} className="text-gray-500 hover:text-rose-400 text-sm transition-all">EDM</button></li>
              <li><button onClick={() => { onCategorySelect('Acoustic'); onNavigate('home'); }} className="text-gray-500 hover:text-rose-400 text-sm transition-all">Acoustic</button></li>
              <li><button onClick={() => { onCategorySelect(''); onNavigate('home'); }} className="text-gray-500 hover:text-rose-400 text-sm transition-all">Venues</button></li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase mb-4">Legal & Support</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-gray-500 hover:text-rose-400 text-sm transition-all">Terms of Service</a></li>
              <li><a href="#" className="text-gray-500 hover:text-rose-400 text-sm transition-all">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-rose-400 text-sm transition-all">Refund Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-rose-400 text-sm transition-all">FAQ</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase mb-4">Newsletter</h4>
            <p className="text-gray-500 text-sm mb-3">Get notified about new events and exclusive offers.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                placeholder="Your email"
                className="flex-1 bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 transition-all"
              />
              <button
                onClick={handleSubscribe}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white transition-all hover:shadow-lg hover:shadow-purple-500/25"
              >
                {subscribed ? <Check className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {subscribed && <p className="text-emerald-400 text-xs mt-2">Subscribed! See you at the next show.</p>}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-purple-500/10 text-center">
          <p className="text-gray-600 text-sm">© 2026 VibePass Sri Lanka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

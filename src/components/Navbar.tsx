import { useState, useRef, useEffect } from 'react';
import { AudioLines, Menu, X, ChevronDown, Ticket, Lock, Home, Tag, Music, LogIn, Building2 } from 'lucide-react';
import type { User } from '@/types';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import { supabase } from '@/lib/supabase';

export type NavView = 'home' | 'admin' | 'organizer' | 'offers';

interface NavbarProps {
  view: NavView;
  isAdmin: boolean;
  user: User | null;
  ticketCount: number;
  onNavigate: (view: NavView) => void;
  onCategorySelect: (category: string) => void;
  onMyTickets: () => void;
  onAdminAccess: () => void;
  onShowAuth: () => void;
  onLogOut: () => void;
  onEditProfile: () => void;
}

const eventDropdownItems = [
  { label: 'All Events', category: '' },
  { label: 'Concerts', category: 'Concert' },
  { label: 'EDM Festivals', category: 'EDM' },
  { label: 'Acoustic Nights', category: 'Acoustic' },
];

export default function Navbar({
  view,
  isAdmin,
  user,
  ticketCount,
  onNavigate,
  onCategorySelect,
  onMyTickets,
  onAdminAccess,
  onShowAuth,
  onLogOut,
  onEditProfile,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(user);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setActiveUser(user);
  }, [user]);

  // Fetch count of proposals for the logged-in organizer
  const fetchProposalCount = async (email: string) => {
    try {
      const { count, error } = await supabase
        .from('organizer_inquiries')
        .select('*', { count: 'exact', head: true })
        .ilike('contact_email', email);

      if (!error && count !== null) {
        setProposalCount(count);
      }
    } catch {
      setProposalCount(0);
    }
  };

  // Sync auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const stored = localStorage.getItem('vibepass_user');
        if (stored) {
          const parsedUser: User = JSON.parse(stored);
          setActiveUser(parsedUser);
          if (parsedUser.role === 'organizer' && parsedUser.email) {
            fetchProposalCount(parsedUser.email);
          }
        } else {
          setActiveUser(null);
          setProposalCount(0);
        }
      } catch {
        setActiveUser(null);
        setProposalCount(0);
      }
    };

    handleAuthChange();

    window.addEventListener('vibepass_auth_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('vibepass_auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEventsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCategoryClick = (category: string) => {
    onCategorySelect(category);
    onNavigate('home');
    setEventsOpen(false);
    setMobileOpen(false);
  };

  const handleUserLogOut = () => {
    localStorage.removeItem('vibepass_user');
    setActiveUser(null);
    setProposalCount(0);
    window.dispatchEvent(new Event('vibepass_auth_changed'));
    onLogOut();
  };

  const isOrganizer = activeUser?.role === 'organizer';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-purple-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 group flex-shrink-0 cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/30 blur-lg group-hover:bg-purple-500/50 transition-all" />
              <AudioLines className="w-7 h-7 text-rose-400 relative z-10" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight relative z-10 bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">
              VibePass
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                view === 'home' ? 'text-rose-400 bg-rose-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4 inline mr-1" /> Home
            </button>

            {/* Events Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setEventsOpen(!eventsOpen)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                  eventsOpen ? 'text-rose-400 bg-rose-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Music className="w-4 h-4" /> Events
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${eventsOpen ? 'rotate-180' : ''}`} />
              </button>
              {eventsOpen && (
                <div className="absolute top-full mt-1 w-48 bg-[#0a0a0f]/95 backdrop-blur-lg rounded-xl border border-purple-500/20 shadow-xl shadow-purple-500/10 py-1.5">
                  {eventDropdownItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleCategoryClick(item.category)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-rose-400 hover:bg-purple-500/10 transition-all cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Button: Proposals or Tickets with Count */}
            {activeUser && (
              <button
                onClick={onMyTickets}
                className="relative px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                {isOrganizer ? (
                  <>
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>My Proposals</span>
                    {proposalCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-purple-500/25">
                        {proposalCount}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 text-rose-400" />
                    <span>My Tickets</span>
                    {ticketCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-purple-500/25">
                        {ticketCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onNavigate('offers')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                view === 'offers' ? 'text-rose-400 bg-rose-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag className="w-4 h-4" /> Offers
            </button>

            <button
              onClick={() => onNavigate('organizer')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                view === 'organizer' ? 'text-rose-400 bg-rose-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Host an Event
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onAdminAccess}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isAdmin
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-purple-500/20'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{isAdmin ? 'Admin' : 'Admin Access'}</span>
            </button>

            {activeUser ? (
              <UserProfileDropdown
                user={activeUser}
                ticketCount={isOrganizer ? proposalCount : ticketCount}
                onMyTickets={onMyTickets}
                onEditProfile={onEditProfile}
                onLogOut={handleUserLogOut}
              />
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Log In / Sign Up</span>
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-gray-300 hover:text-white p-2 cursor-pointer"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0a0a0f]/95 backdrop-blur-lg border-t border-purple-500/10">
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => { onNavigate('home'); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Home
            </button>
            <div className="px-3 py-1 text-gray-500 text-xs uppercase">Events</div>
            {eventDropdownItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleCategoryClick(item.category)}
                className="w-full text-left px-5 py-2 rounded-lg text-sm text-gray-300 hover:text-rose-400 hover:bg-purple-500/10 transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            {activeUser && (
              <button
                onClick={() => { onMyTickets(); setMobileOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isOrganizer ? (
                    <>
                      <Building2 className="w-4 h-4 text-purple-400" /> My Proposals
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 text-rose-400" /> My Tickets
                    </>
                  )}
                </span>
                {(isOrganizer ? proposalCount : ticketCount) > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                    isOrganizer ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-rose-500 to-purple-600'
                  }`}>
                    {isOrganizer ? proposalCount : ticketCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => { onNavigate('offers'); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Offers
            </button>
            <button
              onClick={() => { onNavigate('organizer'); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Host an Event
            </button>
            {!activeUser && (
              <button
                onClick={() => { onShowAuth(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-rose-500 to-purple-600 text-white transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Log In / Sign Up
              </button>
            )}
            {activeUser && (
              <button
                onClick={() => { onEditProfile(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-rose-400 hover:bg-purple-500/10 transition-all cursor-pointer"
              >
                My Profile / Settings
              </button>
            )}
            {activeUser && (
              <button
                onClick={() => { handleUserLogOut(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
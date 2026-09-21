import { useRef, useEffect } from 'react';
import { Mail, Phone, Ticket, LogOut, ChevronDown, Settings, FileText } from 'lucide-react';
import type { User as UserType } from '@/types';

interface UserProfileDropdownProps {
  user: UserType;
  ticketCount: number;
  onMyTickets: () => void;
  onEditProfile: () => void;
  onLogOut: () => void;
}

export default function UserProfileDropdown({
  user,
  ticketCount,
  onMyTickets,
  onEditProfile,
  onLogOut,
}: UserProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOrganizer = user.role === 'organizer';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        ref.current.classList.remove('profile-dropdown-open');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = () => {
    ref.current?.classList.toggle('profile-dropdown-open');
  };

  const close = () => {
    ref.current?.classList.remove('profile-dropdown-open');
  };

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-purple-500/15 transition-all cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/20">
          {initials}
        </div>
        <span className="hidden sm:inline text-white text-sm font-medium max-w-[100px] truncate">{user.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {/* Dropdown */}
      <div className="profile-dropdown hidden absolute top-full right-0 mt-2 w-64 bg-[#0a0a0f]/95 backdrop-blur-lg rounded-xl border border-purple-500/20 shadow-xl shadow-purple-500/10 py-2 z-50">
        {/* User details */}
        <div className="px-4 py-3 border-b border-purple-500/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate flex items-center gap-1.5">
                <span>{user.name}</span>
                {isOrganizer && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-medium">
                    Organizer
                  </span>
                )}
              </div>
              <div className="text-gray-500 text-xs truncate">{user.email}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Mail className="w-3 h-3" /> {user.email}
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Phone className="w-3 h-3" /> {user.phone}
            </div>
          </div>
        </div>

        {/* My Profile / Settings */}
        <button
          onClick={() => { onEditProfile(); close(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-rose-400 hover:bg-purple-500/10 transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" /> My Profile / Settings
        </button>

        {/* Role-based link: "My Proposals" for Organizers vs "My Booked Tickets" for Customers */}
        {isOrganizer ? (
          <button
            onClick={() => { onMyTickets(); close(); }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:text-rose-400 hover:bg-purple-500/10 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> My Proposals
            </span>
          </button>
        ) : (
          <button
            onClick={() => { onMyTickets(); close(); }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:text-rose-400 hover:bg-purple-500/10 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Ticket className="w-4 h-4" /> My Booked Tickets
            </span>
            {ticketCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                {ticketCount}
              </span>
            )}
          </button>
        )}

        {/* Log Out */}
        <button
          onClick={() => { onLogOut(); close(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all border-t border-purple-500/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </div>
  );
}
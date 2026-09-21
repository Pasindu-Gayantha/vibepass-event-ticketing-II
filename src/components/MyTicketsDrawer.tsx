import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Ticket, Calendar, MapPin, Loader2, Building2, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { formatLKR, formatDateFull } from '@/lib/utils';
import { fetchUserTicketsByEmail } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { BookingWithDetails, User } from '@/types';

interface MyTicketsDrawerProps {
  onClose: () => void;
  refreshKey: number;
  sessionTickets: BookingWithDetails[];
  userEmail?: string;
}

interface OrganizerProposal {
  id: string;
  organizer_name: string;
  event_title: string;
  expected_attendees: number;
  message?: string;
  status: string;
  created_at: string;
}

export default function MyTicketsDrawer({ onClose, sessionTickets, userEmail }: MyTicketsDrawerProps) {
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<BookingWithDetails[]>(sessionTickets);
  const [proposals, setProposals] = useState<OrganizerProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Identify current logged in user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vibepass_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const isOrganizer = currentUser?.role === 'organizer';
  const activeEmail = userEmail || currentUser?.email;

  useEffect(() => {
    async function loadData() {
      if (!activeEmail) {
        setTickets(sessionTickets);
        return;
      }

      setLoading(true);

      if (isOrganizer) {
        // Fetch inquiries submitted by this organizer
        try {
          const { data, error } = await supabase
            .from('organizer_inquiries')
            .select('*')
            .ilike('contact_email', activeEmail)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setProposals(data as OrganizerProposal[]);
          }
        } catch (err) {
          console.error('Failed to load organizer proposals:', err);
        } finally {
          setLoading(false);
        }
      } else {
        // Fetch customer booked tickets
        try {
          const dbTickets = await fetchUserTicketsByEmail(activeEmail);
          const map = new Map<string, BookingWithDetails>();
          [...dbTickets, ...sessionTickets].forEach((t) => map.set(t.booking_ref, t));
          setTickets(Array.from(map.values()));
        } catch (err) {
          console.error('Failed to load tickets from db:', err);
        } finally {
          setLoading(false);
        }
      }
    }

    loadData();
  }, [activeEmail, isOrganizer, sessionTickets]);

  const handleDownload = (b: BookingWithDetails) => {
    setPrintingId(b.id);
    const ticketEl = document.getElementById(`print-ticket-${b.id}`);
    if (ticketEl) {
      ticketEl.classList.add('print-ticket');
      window.print();
      setTimeout(() => {
        ticketEl.classList.remove('print-ticket');
        setPrintingId(null);
      }, 500);
    } else {
      setPrintingId(null);
    }
  };

  const statusStyles: Record<string, string> = {
    confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    redeemed: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full bg-[#0a0a0f] border-l border-purple-500/20 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-purple-500/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOrganizer ? (
              <>
                <Building2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-bold text-lg">My Event Proposals</h2>
                {proposals.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold">
                    {proposals.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <Ticket className="w-5 h-5 text-rose-400" />
                <h2 className="text-white font-bold text-lg">My Tickets</h2>
                {tickets.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold">
                    {tickets.length}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-rose-400" />
              <p className="text-sm">{isOrganizer ? 'Fetching your proposals...' : 'Fetching your tickets...'}</p>
            </div>
          ) : isOrganizer ? (
            /* Organizer Proposals View */
            proposals.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No proposals submitted yet.</p>
                <p className="text-gray-600 text-sm mt-1">Submit your concert proposals using "Host an Event".</p>
              </div>
            ) : (
              proposals.map((prop) => {
                const isApproved = prop.status.toLowerCase() === 'approved';
                const isRejected = prop.status.toLowerCase() === 'rejected';

                return (
                  <div
                    key={prop.id}
                    className="rounded-2xl border border-purple-500/20 bg-white/[0.03] overflow-hidden p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-bold text-sm leading-snug">{prop.event_title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{prop.organizer_name}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isRejected
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isRejected ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {prop.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300 bg-white/[0.02] p-2.5 rounded-xl border border-purple-500/10">
                      <p className="line-clamp-2 text-gray-400">{prop.message || 'No additional proposal description provided.'}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-purple-500/10">
                      <span>Attendees: <strong className="text-gray-300">{prop.expected_attendees}</strong></span>
                      <span>{new Date(prop.created_at).toLocaleDateString()}</span>
                    </div>

                    {isApproved && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span>Proposal Approved by VibePass Team! Check your email for further instructions.</span>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            /* Attendee Tickets View */
            tickets.length === 0 ? (
              <div className="text-center py-20">
                <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No tickets booked yet.</p>
                <p className="text-gray-600 text-sm mt-1">Your booked passes will appear here.</p>
              </div>
            ) : (
              tickets.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-purple-500/20 bg-white/[0.03] overflow-hidden"
                >
                  <div id={`print-ticket-${b.id}`} className="hidden">
                    <div className="p-8 bg-white text-black">
                      <h1 className="text-2xl font-bold text-purple-600 mb-1">VibePass</h1>
                      <p className="text-gray-500 text-sm mb-4">Digital Concert Ticket</p>
                      <div className="border-t border-b border-gray-300 py-4 my-4 space-y-1 text-sm">
                        <p><strong>Event:</strong> {b.event?.title || '-'}</p>
                        <p><strong>Date:</strong> {b.event ? formatDateFull(b.event.event_date) : '-'}</p>
                        <p><strong>Venue:</strong> {b.event?.venue || '-'}</p>
                        <p><strong>Tier:</strong> {b.tier?.name || '-'}</p>
                        <p><strong>Quantity:</strong> {b.quantity}</p>
                        <p><strong>Customer:</strong> {b.customer_name}</p>
                        <p><strong>Booking ID:</strong> {b.booking_ref}</p>
                        <p><strong>Total Paid:</strong> {formatLKR(b.total_amount)}</p>
                        <p><strong>Status:</strong> {b.status}</p>
                      </div>
                      <p className="text-xs text-gray-400">Present this ticket at the entrance. Valid ID required.</p>
                    </div>
                  </div>

                  <div className="p-4 flex items-start gap-3">
                    {b.event?.banner_url && (
                      <img
                        src={b.event.banner_url}
                        alt={b.event?.title || ''}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{b.event?.title || 'Event'}</h3>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <Calendar className="w-3 h-3" /> {b.event ? formatDateFull(b.event.event_date) : '-'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" /> {b.event?.venue || '-'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusStyles[b.status] || ''}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-4 border-t border-purple-500/10 bg-purple-500/[0.03]">
                    <div className="p-2 bg-white rounded-xl flex-shrink-0">
                      <QRCodeSVG
                        value={JSON.stringify({ ref: b.booking_ref, name: b.customer_name, event: b.event?.title, tier: b.tier?.name, qty: b.quantity })}
                        size={80}
                        level="M"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-gray-500 text-[10px] uppercase">Booking ID</div>
                      <div className="text-rose-400 font-mono font-bold text-xs">{b.booking_ref}</div>
                      <div className="text-gray-400 text-xs">
                        {b.tier?.name} × {b.quantity}
                      </div>
                      <div className="text-white font-semibold text-sm">{formatLKR(b.total_amount)}</div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-purple-500/10">
                    <button
                      onClick={() => handleDownload(b)}
                      disabled={printingId === b.id}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all disabled:opacity-60 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> {printingId === b.id ? 'Preparing...' : 'Download Ticket (PDF)'}
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import {
  DollarSign, Ticket, Music, MessageSquare, ScanLine,
  CheckCircle2, XCircle, AlertCircle, Loader2, Clock, LogOut, Plus,
} from 'lucide-react';
import { fetchAdminStats, fetchRecentBookings, fetchInquiries, validateTicket, redeemTicket, updateInquiryStatus } from '@/lib/data';
import { formatLKR, formatDate } from '@/lib/utils';
import type { BookingWithDetails, OrganizerInquiry, VibeEvent } from '@/types';
import CreateEventModal from '@/components/CreateEventModal';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  redeemed: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  pending: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  reviewing: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

interface AdminDashboardProps {
  onLogOut: () => void;
  onCreateEvent: (event: VibeEvent) => void;
}

export default function AdminDashboard({ onLogOut, onCreateEvent }: AdminDashboardProps) {
  const [stats, setStats] = useState({ totalRevenue: 0, ticketsSold: 0, activeConcerts: 0, pendingInquiries: 0 });
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [inquiries, setInquiries] = useState<OrganizerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketInput, setTicketInput] = useState('');
  const [ticketResult, setTicketResult] = useState<{ type: 'idle' | 'loading' | 'valid' | 'redeemed' | 'invalid'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handlePublishEvent = (event: VibeEvent) => {
    onCreateEvent(event);
    setShowCreateModal(false);
    loadAll();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, b, i] = await Promise.all([
        fetchAdminStats(),
        fetchRecentBookings(10),
        fetchInquiries(),
      ]);
      setStats(s);
      setBookings(b);
      setInquiries(i);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateTicket = async () => {
    if (!ticketInput.trim()) return;
    setTicketResult({ type: 'loading', message: 'Checking...' });
    try {
      const result = await validateTicket(ticketInput.trim().toUpperCase());
      if (!result.found) {
        setTicketResult({ type: 'invalid', message: 'Ticket not found in system' });
      } else if (result.status === 'redeemed') {
        setTicketResult({ type: 'redeemed', message: 'Already Redeemed' });
      } else if (result.status === 'cancelled') {
        setTicketResult({ type: 'invalid', message: 'Ticket cancelled' });
      } else {
        await redeemTicket(ticketInput.trim().toUpperCase());
        setTicketResult({ type: 'valid', message: 'Valid Ticket - Marked as redeemed' });
        loadAll();
      }
    } catch {
      setTicketResult({ type: 'invalid', message: 'Validation failed. Try again.' });
    }
  };

  const handleInquiryAction = async (id: string, status: string) => {
    try {
      await updateInquiryStatus(id, status);
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: status as OrganizerInquiry['status'] } : i)));
      const s = await fetchAdminStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to update inquiry', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Revenue', value: formatLKR(stats.totalRevenue), icon: DollarSign, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Tickets Sold', value: stats.ticketsSold.toString(), icon: Ticket, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Active Concerts', value: stats.activeConcerts.toString(), icon: Music, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Pending Inquiries', value: stats.pendingInquiries.toString(), icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Monitor bookings, inquiries, and validate tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
            <button
              onClick={onLogOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-purple-500/15 text-sm font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="p-5 rounded-2xl border border-purple-500/15 bg-white/[0.03] backdrop-blur-md">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="text-gray-400 text-xs uppercase">{kpi.label}</div>
                <div className="text-white font-bold text-xl mt-1">{kpi.value}</div>
              </div>
            );
          })}
        </div>

        {/* Ticket Validator */}
        <div className="p-5 rounded-2xl border border-purple-500/15 bg-white/[0.03] backdrop-blur-md">
          <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
            <ScanLine className="w-5 h-5 text-rose-400" /> Verify Ticket QR
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => {
                setTicketInput(e.target.value);
                setTicketResult({ type: 'idle', message: '' });
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateTicket()}
              placeholder="Enter Booking ID (e.g. VP-2026-001234)"
              className="flex-1 bg-white/5 border border-purple-500/15 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-all font-mono"
            />
            <button
              onClick={handleValidateTicket}
              disabled={ticketResult.type === 'loading'}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
            >
              {ticketResult.type === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Validate'}
            </button>
          </div>
          {ticketResult.type !== 'idle' && ticketResult.type !== 'loading' && (
            <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${
              ticketResult.type === 'valid' ? 'text-emerald-400' :
              ticketResult.type === 'redeemed' ? 'text-rose-400' : 'text-red-400'
            }`}>
              {ticketResult.type === 'valid' && <CheckCircle2 className="w-5 h-5" />}
              {ticketResult.type === 'redeemed' && <AlertCircle className="w-5 h-5" />}
              {ticketResult.type === 'invalid' && <XCircle className="w-5 h-5" />}
              {ticketResult.message}
            </div>
          )}
          <p className="text-gray-500 text-xs mt-2">Try VP-2026-001234 (confirmed) or VP-2026-001236 (already redeemed)</p>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="p-5 rounded-2xl border border-purple-500/15 bg-white/[0.03] backdrop-blur-md">
            <h2 className="text-white font-bold text-lg mb-4">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b border-purple-500/15">
                    <th className="text-left py-2 px-2">Customer</th>
                    <th className="text-left py-2 px-2">Event</th>
                    <th className="text-left py-2 px-2">Tier</th>
                    <th className="text-right py-2 px-2">Amount</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-purple-500/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-2 text-white text-xs">{b.customer_name}</td>
                      <td className="py-3 px-2 text-gray-300 text-xs max-w-[120px] truncate">{b.event?.title || '-'}</td>
                      <td className="py-3 px-2 text-gray-300 text-xs">{b.tier?.name || '-'}</td>
                      <td className="py-3 px-2 text-rose-400 text-xs text-right font-semibold">{formatLKR(b.total_amount)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[b.status] || ''}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Organizer Inquiries */}
          <div className="p-5 rounded-2xl border border-purple-500/15 bg-white/[0.03] backdrop-blur-md">
            <h2 className="text-white font-bold text-lg mb-4">Organizer Inquiries</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-3 rounded-xl bg-white/5 border border-purple-500/10">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-white text-sm font-semibold">{inq.organizer_name}</div>
                      <div className="text-gray-500 text-xs">{inq.email}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusStyles[inq.status] || ''}`}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">{inq.event_concept}</p>
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                    <Clock className="w-3 h-3" /> {formatDate(inq.created_at)}
                    <span>·</span>
                    <span>{inq.expected_attendees} expected</span>
                  </div>
                  <div className="flex gap-2">
                    {inq.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'reviewing')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'approved')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'rejected')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {inq.status === 'reviewing' && (
                      <>
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'approved')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'rejected')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onPublish={handlePublishEvent}
        />
      )}
    </div>
  );
}

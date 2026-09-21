import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Download, ArrowLeft, Calendar, MapPin, User, Ticket, CreditCard, Printer } from 'lucide-react';
import type { VibeEvent, TicketTier } from '@/types';
import { formatLKR, formatDateFull, formatTime } from '@/lib/utils';

interface ConfirmationScreenProps {
  event: VibeEvent;
  tier: TicketTier;
  quantity: number;
  total: number;
  bookingRef: string;
  customerName: string;
  paymentMethod: string;
  onBackToEvents: () => void;
}

export default function ConfirmationScreen({
  event,
  tier,
  quantity,
  total,
  bookingRef,
  customerName,
  paymentMethod,
  onBackToEvents,
}: ConfirmationScreenProps) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = [
      '═══════════════════════════════════',
      '         VIBEPASS - DIGITAL TICKET',
      '═══════════════════════════════════',
      '',
      `Booking ID: ${bookingRef}`,
      `Event: ${event.title}`,
      `Date: ${formatDateFull(event.event_date)} at ${formatTime(event.event_date)}`,
      `Venue: ${event.venue}, ${event.location}`,
      `Tier: ${tier.name}`,
      `Quantity: ${quantity}`,
      `Customer: ${customerName}`,
      `Payment: ${paymentMethod === 'card' ? 'Credit/Debit Card' : 'LankaQR/Bank Transfer'}`,
      `Total Paid: ${formatLKR(total)}`,
      '',
      '═══════════════════════════════════',
      '  Present the QR code at the entry',
      '═══════════════════════════════════',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VibePass-Ticket-${bookingRef}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Animated Checkmark */}
        <div className="text-center no-print">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 transition-all duration-500 ${
              showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <CheckCircle2
              className={`w-12 h-12 text-emerald-400 transition-all duration-700 delay-200 ${
                showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mt-4">Booking Confirmed!</h1>
          <p className="text-gray-400 mt-1">Your digital ticket is ready. Present the QR code at entry.</p>
        </div>

        {/* Digital Ticket */}
        <div className="print-ticket relative bg-[#0a0a0f] rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-500/10">
          {/* Ticket header strip */}
          <div className="print-accent h-2 bg-gradient-to-r from-rose-500 to-purple-600" />

          <div className="p-6">
            {/* Event Info */}
            <div className="flex items-start gap-4 mb-6">
              <img src={event.banner_url} alt={event.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 no-print" />
              <div className="flex-1 min-w-0">
                <h2 className="print-text-dark text-white font-bold text-xl truncate">{event.title}</h2>
                <div className="print-text-muted flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                  <Calendar className="w-3.5 h-3.5 no-print" /> {formatDateFull(event.event_date)}
                </div>
                <div className="print-text-muted flex items-center gap-1.5 text-gray-400 text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5 no-print" /> {event.venue}, {event.location}
                </div>
              </div>
            </div>

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="print-border p-3 rounded-xl bg-white/5 border border-purple-500/10">
                <div className="print-text-muted text-gray-500 text-xs uppercase flex items-center gap-1"><User className="w-3 h-3 no-print" /> Customer</div>
                <div className="print-text-dark text-white font-semibold text-sm mt-1">{customerName}</div>
              </div>
              <div className="print-border p-3 rounded-xl bg-white/5 border border-purple-500/10">
                <div className="print-text-muted text-gray-500 text-xs uppercase flex items-center gap-1"><Ticket className="w-3 h-3 no-print" /> Tier</div>
                <div className="print-text-dark text-white font-semibold text-sm mt-1">{tier.name} × {quantity}</div>
              </div>
              <div className="print-border p-3 rounded-xl bg-white/5 border border-purple-500/10">
                <div className="print-text-muted text-gray-500 text-xs uppercase">Booking ID</div>
                <div className="text-rose-400 font-bold text-sm mt-1 font-mono">{bookingRef}</div>
              </div>
              <div className="print-border p-3 rounded-xl bg-white/5 border border-purple-500/10">
                <div className="print-text-muted text-gray-500 text-xs uppercase flex items-center gap-1"><CreditCard className="w-3 h-3 no-print" /> Total Paid</div>
                <div className="print-text-dark text-white font-semibold text-sm mt-1">{formatLKR(total)}</div>
              </div>
            </div>

            {/* QR Code */}
            <div className="print-qr flex flex-col items-center py-4 border-t border-dashed border-purple-500/10 print-border">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG
                  value={JSON.stringify({ ref: bookingRef, name: customerName, event: event.title, tier: tier.name, qty: quantity })}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="print-text-muted text-gray-500 text-xs mt-3 text-center">Scan this QR code at the venue entrance</p>
            </div>
          </div>

          {/* Ticket perforation */}
          <div className="flex items-center gap-2 px-6 no-print">
            <div className="flex-1 border-t border-dashed border-purple-500/10" />
            <div className="w-3 h-3 rounded-full bg-[#0a0a0f] -ml-3" />
            <div className="w-3 h-3 rounded-full bg-[#0a0a0f] -mr-3" />
            <div className="flex-1 border-t border-dashed border-purple-500/10" />
          </div>

          <div className="p-6 pt-4 flex items-center justify-between no-print">
            <div>
              <div className="text-gray-500 text-xs uppercase">Payment Method</div>
              <div className="text-white text-sm font-medium">
                {paymentMethod === 'card' ? 'Credit / Debit Card' : 'LankaQR / Bank Transfer'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-xs uppercase">Status</div>
              <div className="text-emerald-400 text-sm font-semibold">Confirmed</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl border border-purple-500/15 transition-all"
          >
            <Printer className="w-5 h-5" />
            Download Ticket (PDF)
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium border border-purple-500/15 transition-all"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Save .txt</span>
          </button>
          <button
            onClick={onBackToEvents}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
        </div>
      </div>
    </div>
  );
}

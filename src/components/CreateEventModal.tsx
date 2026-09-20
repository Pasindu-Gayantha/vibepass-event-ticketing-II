import { useState } from 'react';
import { X, Loader2, CheckCircle2, Calendar, Music, MapPin, Image, DollarSign, Ticket, AlignLeft } from 'lucide-react';
import type { VibeEvent, EventCategory } from '@/types';

interface CreateEventModalProps {
  onClose: () => void;
  onPublish: (event: VibeEvent) => void;
}

interface FormState {
  title: string;
  category: string;
  venue: string;
  location: string;
  event_date: string;
  banner_url: string;
  starting_price: string;
  total_tickets: string;
  description: string;
}

const categoryMap: Record<string, EventCategory> = {
  Concert: 'Concert',
  'EDM Festival': 'EDM',
  'Acoustic Night': 'Acoustic',
};

const inputClass =
  'w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all';
const labelClass = 'text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1';

export default function CreateEventModal({ onClose, onPublish }: CreateEventModalProps) {
  const [form, setForm] = useState<FormState>({
    title: '',
    category: 'Concert',
    venue: '',
    location: '',
    event_date: '',
    banner_url: '',
    starting_price: '',
    total_tickets: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Event title is required';
    if (!form.venue.trim()) e.venue = 'Venue is required';
    if (!form.event_date) e.event_date = 'Date and time are required';
    if (!form.starting_price || Number(form.starting_price) <= 0) e.starting_price = 'Enter a valid price';
    if (!form.total_tickets || Number(form.total_tickets) <= 0) e.total_tickets = 'Enter a valid ticket count';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const newEvent: VibeEvent = {
      id: `evt-${Date.now()}`,
      title: form.title.trim(),
      category: categoryMap[form.category] || 'Concert',
      venue: form.venue.trim(),
      location: form.location.trim() || form.venue.trim(),
      event_date: form.event_date,
      banner_url: form.banner_url.trim() || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
      lineup: [],
      description: form.description.trim() || `Experience an unforgettable live event: ${form.title.trim()} at ${form.venue.trim()}! Join us for incredible music and vibes.`,
      tickets_remaining: Number(form.total_tickets),
      starting_price: Number(form.starting_price),
      status: 'active',
      created_at: new Date().toISOString(),
    };

    onPublish(newEvent);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a0a0f]/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-rose-500/10 to-purple-600/10 p-6 border-b border-purple-500/10 backdrop-blur-xl rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Add New Event</h2>
              <p className="text-gray-400 text-sm">Create and publish a new event listing</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}><Music className="w-3 h-3" /> Event Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Sunset Rave Festival 2026"
              className={inputClass}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}><AlignLeft className="w-3 h-3" /> Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Provide a captivating description for this event..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Category + Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><Calendar className="w-3 h-3" /> Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className={inputClass}
              >
                <option value="Concert" className="bg-[#0a0a0f]">Concert</option>
                <option value="EDM Festival" className="bg-[#0a0a0f]">EDM Festival</option>
                <option value="Acoustic Night" className="bg-[#0a0a0f]">Acoustic Night</option>
              </select>
            </div>
            <div>
              <label className={labelClass}><MapPin className="w-3 h-3" /> Venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
                placeholder="Sugathadasa Stadium"
                className={inputClass}
              />
              {errors.venue && <p className="text-red-400 text-xs mt-1">{errors.venue}</p>}
            </div>
          </div>

          {/* Location + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><MapPin className="w-3 h-3" /> Location (City)</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Colombo"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><Calendar className="w-3 h-3" /> Date & Time</label>
              <input
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => update('event_date', e.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
              />
              {errors.event_date && <p className="text-red-400 text-xs mt-1">{errors.event_date}</p>}
            </div>
          </div>

          {/* Banner URL */}
          <div>
            <label className={labelClass}><Image className="w-3 h-3" /> Banner Image URL</label>
            <input
              type="text"
              value={form.banner_url}
              onChange={(e) => update('banner_url', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={inputClass}
            />
          </div>

          {/* Price + Tickets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><DollarSign className="w-3 h-3" /> Starting Price (LKR)</label>
              <input
                type="number"
                value={form.starting_price}
                onChange={(e) => update('starting_price', e.target.value)}
                placeholder="5000"
                className={inputClass}
              />
              {errors.starting_price && <p className="text-red-400 text-xs mt-1">{errors.starting_price}</p>}
            </div>
            <div>
              <label className={labelClass}><Ticket className="w-3 h-3" /> Total Tickets</label>
              <input
                type="number"
                value={form.total_tickets}
                onChange={(e) => update('total_tickets', e.target.value)}
                placeholder="500"
                className={inputClass}
              />
              {errors.total_tickets && <p className="text-red-400 text-xs mt-1">{errors.total_tickets}</p>}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Publish Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
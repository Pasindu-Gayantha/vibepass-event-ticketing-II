import { useState, useEffect } from 'react';
import { Send, User, Mail, Phone, Music, Users, MessageSquare, CheckCircle2, Loader2, Lock, ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { createInquiry } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import UserAuthModal from '@/components/UserAuthModal';
import type { User as UserType } from '@/types';

export default function OrganizerForm() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [form, setForm] = useState({
    organizerName: '',
    email: '',
    phone: '',
    eventConcept: '',
    expectedAttendees: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Local storage එකෙන් සහ Supabase එකෙන් logged-in user profile එක ලබා ගැනීම
  const checkUserStatus = async () => {
    try {
      const stored = localStorage.getItem('vibepass_user');
      if (stored) {
        const parsed: UserType = JSON.parse(stored);
        
        // Supabase user_profiles වෙතින් නවතම role එක ලබා ගැනීම
        if (parsed.email) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, phone, role')
            .ilike('email', parsed.email)
            .maybeSingle();

          const updatedUser: UserType = {
            ...parsed,
            role: (profile?.role as 'customer' | 'organizer') || parsed.role || 'customer',
          };
          setCurrentUser(updatedUser);
          setForm((prev) => ({ ...prev, email: updatedUser.email }));
          return;
        }
        setCurrentUser(parsed);
        setForm((prev) => ({ ...prev, email: parsed.email }));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.organizerName.trim()) e.organizerName = 'Organizer name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit number';
    if (!form.eventConcept.trim()) e.eventConcept = 'Event concept is required';
    if (!form.expectedAttendees.trim()) e.expectedAttendees = 'Expected attendees is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Proposal එක createInquiry මඟින් database එකට save කිරීම
      await createInquiry({
        organizer_name: form.organizerName,
        email: form.email,
        phone: form.phone,
        event_concept: form.eventConcept,
        expected_attendees: parseInt(form.expectedAttendees) || 100,
        notes: form.notes || null,
      });

      // 2. User ගේ role එක database එකේ 'organizer' බව තහවුරු කිරීම
      if (currentUser?.email) {
        await supabase
          .from('user_profiles')
          .update({ role: 'organizer' })
          .ilike('email', currentUser.email);

        const updatedUser = { ...currentUser, role: 'organizer' as const };
        localStorage.setItem('vibepass_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }

      setSubmitted(true);
    } catch {
      setErrors({ submit: 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // 1. සාර්ථක වූ පසු පෙන්වන Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg text-center space-y-5 bg-[#0a0a0f] p-8 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Proposal Submitted Successfully!</h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Thank you for partnering with VibePass, <strong className="text-rose-400">{form.organizerName}</strong>! Your event proposal has been received. Our event operations team will review the concept and contact you shortly via email or phone.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  organizerName: '',
                  email: currentUser?.email || '',
                  phone: '',
                  eventConcept: '',
                  expectedAttendees: '',
                  notes: '',
                });
              }}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-purple-500/15 cursor-pointer text-sm"
            >
              Submit Another Proposal
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-semibold transition-all text-sm shadow-lg shadow-purple-500/20"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-rose-400 text-sm font-medium mb-4">
            <Music className="w-4 h-4" /> B2B Organizer Partnership
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Host Your Event</h1>
          <p className="text-gray-400">Partner with VibePass to sell tickets for your concert, festival, or acoustic night.</p>
        </div>

        {/* 2. Logged-out User සීමා කිරීම (Lock Card) */}
        {!currentUser ? (
          <div className="bg-[#0a0a0f] rounded-3xl border border-purple-500/20 p-8 text-center space-y-5 shadow-2xl shadow-purple-500/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1.5">Authentication Required</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Please sign in or create an Organizer account to submit an event proposal and partner with VibePass.
              </p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer text-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Register to Continue
            </button>
          </div>
        ) : currentUser.role === 'customer' ? (
          /* 3. Customer කෙනෙක් නම් Role Restriction Card */
          <div className="bg-[#0a0a0f] rounded-3xl border border-purple-500/20 p-8 text-center space-y-5 shadow-2xl shadow-purple-500/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1.5">Organizer Account Required</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                You are currently signed in as an <strong>Attendee (Customer)</strong>. Only registered Event Organizers can submit proposals.
              </p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-rose-400 font-semibold px-6 py-3 rounded-xl border border-purple-500/20 transition-all cursor-pointer text-sm"
            >
              Switch or Create Organizer Account
            </button>
          </div>
        ) : (
          /* 4. Verified Organizer Form එක */
          <div className="bg-[#0a0a0f] rounded-3xl border border-purple-500/20 p-6 sm:p-8 space-y-5">
            {/* Name - හිස්ව තබා අතින් type කිරීමට ඉඩ දේ */}
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3" /> Organizer / Organization Name
              </label>
              <input
                type="text"
                value={form.organizerName}
                onChange={(e) => handleChange('organizerName', e.target.value)}
                placeholder="Enter host name or production company"
                className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all ${
                  errors.organizerName ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'
                }`}
              />
              {errors.organizerName && <p className="text-red-400 text-xs mt-1">{errors.organizerName}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email - Logged-in email එකෙන් auto-fill වී disabled වේ */}
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Account Email (Verified)
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  placeholder="organizer@vibepass.lk"
                  className="w-full bg-white/5 border border-purple-500/10 opacity-70 cursor-not-allowed rounded-xl px-3 py-2.5 text-gray-300 text-sm focus:outline-none"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone - හිස්ව තබා අතින් type කිරීමට ඉඩ දේ */}
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="07XXXXXXXX"
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all ${
                    errors.phone ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'
                  }`}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Event Concept */}
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                <Music className="w-3 h-3" /> Event Concept & Plan
              </label>
              <textarea
                value={form.eventConcept}
                onChange={(e) => handleChange('eventConcept', e.target.value)}
                placeholder="Describe your event — genre, expected venue, proposed dates, planned lineup..."
                rows={3}
                className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all resize-none ${
                  errors.eventConcept ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'
                }`}
              />
              {errors.eventConcept && <p className="text-red-400 text-xs mt-1">{errors.eventConcept}</p>}
            </div>

            {/* Expected Attendees */}
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Expected Attendees
              </label>
              <input
                type="number"
                value={form.expectedAttendees}
                onChange={(e) => handleChange('expectedAttendees', e.target.value)}
                placeholder="e.g. 500"
                className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition-all ${
                  errors.expectedAttendees ? 'border-red-500/50' : 'border-purple-500/15 focus:border-rose-500/50'
                }`}
              />
              {errors.expectedAttendees && <p className="text-red-400 text-xs mt-1">{errors.expectedAttendees}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Additional Notes (Optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special requirements, ticketing tier ideas, or preferred dates..."
                rows={2}
                className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-all resize-none"
              />
            </div>

            {errors.submit && <p className="text-red-400 text-sm text-center">{errors.submit}</p>}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Proposal...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Proposal
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal Trigger */}
      {showAuthModal && (
        <UserAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setForm((prev) => ({ ...prev, email: user.email }));
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
}
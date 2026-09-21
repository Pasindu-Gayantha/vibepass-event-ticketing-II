import { useState } from 'react';
import { X, UserIcon, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updated: User) => void;
}

export default function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upsert profile into user_profiles table (updates existing or inserts new)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            email: email.trim(),
            full_name: name.trim(),
            phone: phone.trim(),
          },
          { onConflict: 'email' }
        );

      if (profileError) {
        console.warn('Could not upsert user_profiles table:', profileError.message);
      }

      const updatedUser: User = {
        ...user,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      // 2. Persist in localStorage
      localStorage.setItem('vibepass_user', JSON.stringify(updatedUser));

      onSave(updatedUser);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md bg-[#0a0a0f]/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-500/10 to-purple-600/10 p-6 border-b border-purple-500/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/25">
              {initials}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">My Profile</h2>
              <p className="text-gray-400 text-sm">Update your account details</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <UserIcon className="w-3 h-3" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-gray-400 text-sm cursor-not-allowed transition-all opacity-70"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Contact Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0771234567"
              className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {saved && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2.5">
              <CheckCircle2 className="w-4 h-4" />
              Profile updated successfully!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
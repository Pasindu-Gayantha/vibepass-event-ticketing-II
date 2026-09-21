import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, Loader2, Zap, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface UserAuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const DEMO_USER: User = {
  name: 'Kasun Perera',
  email: 'user@vibepass.lk',
  phone: '0771234567',
  role: 'customer',
};

export default function UserAuthModal({ onClose, onSuccess }: UserAuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleSignIn = async () => {
    setError('');
    const email = signInEmail.trim().toLowerCase();
    if (!email || !signInPassword.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (email === DEMO_USER.email && signInPassword === 'User@123') {
        // Fetch updated profile from user_profiles table if available
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, phone')
          .ilike('email', email)
          .maybeSingle();

        const authenticatedUser: User = {
          name: profile?.full_name || DEMO_USER.name,
          email: DEMO_USER.email,
          phone: profile?.phone || DEMO_USER.phone,
        };

        onSuccess(authenticatedUser);
      } else {
        setError('Invalid credentials. Try the Demo Login button below.');
      }
    } catch {
      onSuccess(DEMO_USER);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const email = signUpEmail.trim().toLowerCase();
    const name = signUpName.trim();
    const phone = signUpPhone.trim() || '0771234567';

    try {
      await supabase
        .from('user_profiles')
        .upsert(
          {
            email,
            full_name: name,
            phone,
          },
          { onConflict: 'email' }
        );

      onSuccess({
        name,
        email,
        phone,
      });
    } catch {
      onSuccess({
        name,
        email,
        phone,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setSignInEmail(DEMO_USER.email);
    setSignInPassword('User@123');

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, phone')
        .ilike('email', DEMO_USER.email)
        .maybeSingle();

      const authenticatedUser: User = {
        name: profile?.full_name || DEMO_USER.name,
        email: DEMO_USER.email,
        phone: profile?.phone || DEMO_USER.phone,
      };

      onSuccess(authenticatedUser);
    } catch {
      onSuccess(DEMO_USER);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Welcome to VibePass</h2>
              <p className="text-gray-400 text-sm">Sign in or create your account</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-purple-500/10">
          <button
            onClick={() => { setTab('signin'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              tab === 'signin'
                ? 'text-rose-400 border-b-2 border-rose-500/50 bg-rose-500/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              tab === 'signup'
                ? 'text-rose-400 border-b-2 border-rose-500/50 bg-rose-500/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {tab === 'signin' ? (
            <>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Password
                </label>
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="Enter password"
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" /> Full Name
                </label>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone <span className="text-gray-600 normal-case">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="0771234567"
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Password
                </label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
                />
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {/* Submit button */}
          <button
            onClick={tab === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {tab === 'signin' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              tab === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>

          {/* Demo Login */}
          {tab === 'signin' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-purple-500/15" />
                <span className="text-gray-600 text-xs uppercase">or</span>
                <div className="flex-1 h-px bg-purple-500/15" />
              </div>
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-rose-400 font-semibold py-2.5 rounded-xl border border-purple-500/20 transition-all disabled:opacity-60"
              >
                <Zap className="w-4 h-4" />
                Demo User Login
              </button>
              <p className="text-gray-600 text-xs text-center">
                Email: user@vibepass.lk · Password: User@123
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
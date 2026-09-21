import { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_EMAIL = 'admin@vibepass.lk';
const ADMIN_PASSWORD = 'Admin@2026';

export default function AdminLoginModal({ onClose, onSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Invalid credentials. Access denied.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md bg-[#0a0a0f] rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-500/20"
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
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Admin Access</h2>
              <p className="text-gray-400 text-sm">Secure login required</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin@vibepass.lk"
              className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase mb-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter password"
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2.5 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-all"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Unlock Dashboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

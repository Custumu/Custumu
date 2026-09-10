import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalView,
    openAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    isConfigured,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isAuthModalOpen) return null;

  const isSignUp = authModalView === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const data = await signUpWithEmail(email, password, fullName);
        if (data?.session) {
          setSuccessMsg('Account created and signed in successfully!');
          setTimeout(() => {
            closeAuthModal();
            resetForm();
          }, 1000);
        } else {
          setSuccessMsg(
            'Account created! Please check your email inbox to confirm your registration.'
          );
        }
      } else {
        await signInWithEmail(email, password);
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          closeAuthModal();
          resetForm();
        }, 800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider = 'google') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setErrorMsg(err.message || `Failed to sign in with ${provider}.`);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchView = (newView) => {
    resetForm();
    openAuthModal(newView);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Background Banner */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-blue-50/70 via-white to-slate-50/50 dark:from-blue-950/20 dark:via-[#161619] dark:to-[#1a1a20] border-b border-slate-100 dark:border-[#24242c]">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#25252c] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 rounded-xl bg-[#205ae3] text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isSignUp ? 'Create your account' : 'Sign in to Custumu'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSignUp
                  ? 'Access multi-device sync, cloud jobs, and high-capacity AI'
                  : 'Welcome back! Continue to your documents and tools'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#202026] rounded-xl mt-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => switchView('signin')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                !isSignUp
                  ? 'bg-white dark:bg-[#2b2b34] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchView('signup')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                isSignUp
                  ? 'bg-white dark:bg-[#2b2b34] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Missing Keys Setup Banner */}
          {!isConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2.5">
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Supabase Keys Required:</span>
                <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                  Add <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[10px]">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[10px]">VITE_SUPABASE_PUBLISHABLE_KEY</code> to your project's <code className="font-mono">.env</code> file.
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-tight">{errorMsg}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-tight">{successMsg}</div>
            </div>
          )}

          {/* Social Sign-In Button */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading || !isConfigured}
            className="w-full py-2.5 px-4 bg-white dark:bg-[#1f1f26] border border-slate-200 dark:border-[#2f2f3a] hover:bg-slate-50 dark:hover:bg-[#25252f] text-slate-700 dark:text-slate-200 rounded-xl font-medium flex items-center justify-center space-x-2.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-[#27272e]" />
            </div>
            <span className="relative px-3 bg-white dark:bg-[#161619] text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#1c1c22] border border-slate-200 dark:border-[#2e2e38] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#205ae3]/40 focus:border-[#205ae3] text-xs transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#1c1c22] border border-slate-200 dark:border-[#2e2e38] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#205ae3]/40 focus:border-[#205ae3] text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#1c1c22] border border-slate-200 dark:border-[#2e2e38] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#205ae3]/40 focus:border-[#205ae3] text-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isSignUp && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Minimum 6 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#205ae3] hover:bg-[#184cc8] text-white font-medium rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="text-[#205ae3] hover:underline font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="text-[#205ae3] hover:underline font-semibold cursor-pointer"
                >
                  Create one for free
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

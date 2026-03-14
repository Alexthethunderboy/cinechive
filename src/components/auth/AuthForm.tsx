'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { signUp, login } from '@/app/auth/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

// Username must only use alphanumeric, dots, underscores, hyphens
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export default function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Read ?error= from URL (e.g. from OAuth callback failures)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const username = (formData.get('username') as string)?.trim();
    const password = formData.get('password') as string;

    // Client-side username format validation
    if (!USERNAME_REGEX.test(username)) {
      setError('Username can only contain letters, numbers, dots, underscores, and hyphens.');
      return;
    }

    // Confirm password check (signup only)
    if (mode === 'signup') {
      const confirmPassword = formData.get('confirmPassword') as string;
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);
    const action = mode === 'signup' ? signUp : login;

    try {
      const result = await action(formData);
      if (result && 'error' in result) {
        setError(result.error as string);
      }
      // Both login and signup: redirect() is called inside the server action on success
    } catch (err) {
      // Next.js redirect() throws a special internal marker — re-throw it so navigation works
      if (
        err !== null &&
        typeof err === 'object' &&
        'digest' in err &&
        typeof (err as Record<string, unknown>).digest === 'string' &&
        ((err as Record<string, unknown>).digest as string).startsWith('NEXT_REDIRECT')
      ) {
        throw err;
      }
      // For all other unexpected errors, show a friendly message
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-white/5 blur-3xl rounded-full" />

        <div className="relative z-10">
          <header className="mb-8 text-center flex flex-col items-center">
            <img
              src="/app-logo.png"
              alt="CineChive Logo"
              className="w-16 h-16 object-contain mb-6 drop-shadow-xl brightness-110"
            />
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl font-heading italic tracking-tighter text-white mb-2 uppercase"
            >
              {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE COLLECTION'}
            </motion.h1>
            <p className="text-muted text-sm font-heading">
              {mode === 'login'
                ? 'Enter your credentials to access the library'
                : 'Create an account to start your collection'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                <input
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  inputMode="text"
                  placeholder="thecurator"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-hidden focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all font-heading min-h-[44px]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-white/20 focus:outline-hidden focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all font-heading"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-white/20 focus:outline-hidden focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all font-heading"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-2 px-3 rounded-lg text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-2 px-3 rounded-lg text-center font-medium"
                >
                  Account created! You can now log in.
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full group relative overflow-hidden bg-white text-black font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest font-metadata text-xs min-h-[44px]"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === 'login' ? 'SIGN IN' : 'REGISTER'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-muted text-sm font-heading">
              {mode === 'login' ? "No library yet?" : "Already a curator?"}
              {' '}
              <Link
                href={mode === 'login' ? '/signup' : '/login'}
                className="text-white hover:text-white/60 transition-colors font-bold ml-1"
              >
                {mode === 'login' ? 'CREATE ONE' : 'SIGN IN'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Visual flair for the background */}
      <div className="mt-8 flex justify-center text-white/60/20">
        <Sparkles size={32} className="animate-pulse" />
      </div>
    </div>
  );
}

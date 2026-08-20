'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { signUp, login } from '@/app/auth/actions';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

// Username must only use alphanumeric, dots, underscores, hyphens
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export default function AuthForm({ mode }: AuthFormProps) {
  const { serviceStatus } = useAuth();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const serviceUnavailable = serviceStatus === 'unavailable';

  // Read ?error= from URL (e.g. from OAuth callback failures)
  useEffect(() => {
    const urlError = searchParams.get('error');
    const reason = searchParams.get('reason');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    } else if (reason === 'service-unavailable') {
      setError('Account services are temporarily unavailable. The public archive is still open.');
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (serviceUnavailable) {
      setError('Account services are temporarily unavailable. You can still browse and search the archive.');
      return;
    }

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
            <Image
              src="/app-logo.png"
              alt="CineChive Logo"
              width={398}
              height={424}
              className="mb-6 h-auto w-16 object-contain drop-shadow-xl brightness-110"
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
                ? (serviceUnavailable ? 'Your private device archive is ready' : 'Enter your credentials to access the library')
                : (serviceUnavailable ? 'Use a local curator identity while accounts are paused' : 'Create an account to start your collection')}
            </p>
          </header>

          {serviceUnavailable ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/8 p-4 text-center">
                <p className="text-sm font-heading text-emerald-100">No password is needed in local mode.</p>
                <p className="mt-2 text-xs leading-relaxed text-emerald-100/55">Your profile, library, journal, reviews, likes, collections and reminders stay in this browser.</p>
              </div>
              <Link href={returnTo.startsWith('/') ? returnTo : '/profile'} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-metadata text-xs font-bold uppercase tracking-widest text-black">
                Continue as local curator <ArrowRight size={16} />
              </Link>
              <Link href="/local-mode" className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white">What works locally?</Link>
            </div>
          ) : <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="auth-username" className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                <input
                  id="auth-username"
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
              <label htmlFor="auth-password" className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                <input
                  id="auth-password"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                <label htmlFor="auth-confirm-password" className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                  <input
                    id="auth-confirm-password"
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
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {serviceUnavailable && !error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="status"
                  className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs py-3 px-3 rounded-lg text-center font-medium"
                >
                  Accounts are offline right now. Browsing, discovery, and search remain available.
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-2 px-3 rounded-lg text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || serviceUnavailable}
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
          </form>}

          {!serviceUnavailable && <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-muted text-sm font-heading">
              {mode === 'login' ? "No library yet?" : "Already a curator?"}
              {' '}
              <Link
                href={`${mode === 'login' ? '/signup' : '/login'}?returnTo=${encodeURIComponent(returnTo)}`}
                className="text-white hover:text-white/60 transition-colors font-bold ml-1"
              >
                {mode === 'login' ? 'CREATE ONE' : 'SIGN IN'}
              </Link>
            </p>
          </div>}

          {serviceUnavailable && (
            <Link
              href="/vault"
              className="mt-4 flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              Open local library
            </Link>
          )}
        </div>
      </motion.div>

      {/* Visual flair for the background */}
      <div className="mt-8 flex justify-center text-white/60/20">
        <Sparkles size={32} className="animate-pulse" />
      </div>
    </div>
  );
}

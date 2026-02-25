'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { signUp, login } from '@/app/auth/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const action = mode === 'signup' ? signUp : login;
    
    const result = await action(formData);

    if (result && 'error' in result) {
      setError(result.error as string);
      setIsLoading(false);
    } else if (mode === 'signup' && result && 'success' in result) {
      setSuccess(true);
      setIsLoading(false);
    }
    // Login redirects automatically on success
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-vibe-cyan/20 blur-3xl rounded-full" />

        <div className="relative z-10">
          <header className="mb-8 text-center">
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl font-display italic tracking-tighter bg-linear-to-r from-vibe-violet to-vibe-cyan bg-clip-text text-transparent mb-2"
            >
              {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE ARCHIVE'}
            </motion.h1>
            <p className="text-muted text-sm font-heading">
              {mode === 'login' 
                ? 'Enter your credentials to access the vault' 
                : 'Create an account to start your collection'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="thearchivist"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-hidden focus:ring-2 focus:ring-vibe-violet/50 focus:border-vibe-violet/50 transition-all font-heading"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-hidden focus:ring-2 focus:ring-vibe-violet/50 focus:border-vibe-violet/50 transition-all font-heading"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs uppercase font-bold tracking-widest text-muted ml-1">Date of Birth</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white/60 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                  </span>
                  <input
                    name="dob"
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-hidden focus:ring-2 focus:ring-vibe-violet/50 focus:border-vibe-violet/50 transition-all font-heading scheme-dark"
                  />
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
              className="w-full group relative overflow-hidden bg-linear-to-r from-vibe-violet to-vibe-cyan text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === 'login' ? 'SIGN IN' : 'REGISTER'}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-muted text-sm font-heading">
              {mode === 'login' ? "Don't have an archive yet?" : "Already an archivist?"}
              {' '}
              <Link 
                href={mode === 'login' ? '/signup' : '/login'}
                className="text-white/60 hover:text-vibe-cyan transition-colors font-bold ml-1"
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

'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface ProfileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function ProfileEmptyState({ icon: Icon, title, body, ctaLabel, ctaHref }: ProfileEmptyStateProps) {
  return (
    <div className="py-16 px-6 text-center border border-dashed border-white/10 rounded-3xl bg-white/3 space-y-4">
      <div className="mx-auto w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={18} className="text-white/40" />
      </div>
      <h3 className="font-heading text-xl italic uppercase tracking-wide text-white/70">{title}</h3>
      <p className="font-metadata text-xs uppercase tracking-widest text-white/35">{body}</p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="inline-flex px-4 py-2 rounded-full border border-white/20 text-[10px] uppercase tracking-widest text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

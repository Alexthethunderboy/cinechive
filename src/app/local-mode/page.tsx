import Link from 'next/link';
import { Archive, Check, CloudOff, Users, X } from 'lucide-react';

export const metadata = {
  title: 'Local Mode | CineChive',
  description: 'What works while CineChive runs without its account backend.',
};

export default function LocalModePage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-28 pt-24 md:px-8">
      <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
        <CloudOff size={25} />
      </div>
      <p className="font-metadata text-[10px] uppercase tracking-[0.35em] text-emerald-300/60">Supabase paused</p>
      <h1 className="mt-3 max-w-3xl font-heading text-5xl italic tracking-tighter text-white md:text-7xl">Your private archive still works.</h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/50">
        CineChive is using a local curator identity and storing personal data in this browser. Nothing here syncs automatically, so export a backup before clearing browser storage.
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/5 p-6">
          <div className="mb-5 flex items-center gap-3"><Archive size={18} className="text-emerald-300" /><h2 className="font-heading text-2xl text-white">Available locally</h2></div>
          <ul className="space-y-3 text-sm text-white/55">
            {['Local identity, profile and avatar', 'Library, ratings and private reviews', 'Journal and screening history', 'Collections and manual file export', 'Likes, dislikes and release reminders', 'In-app reminder activity'].map((item) => (
              <li key={item} className="flex gap-3"><Check size={15} className="mt-0.5 shrink-0 text-emerald-300" />{item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
          <div className="mb-5 flex items-center gap-3"><Users size={18} className="text-white/35" /><h2 className="font-heading text-2xl text-white">Needs a backend</h2></div>
          <ul className="space-y-3 text-sm text-white/45">
            {['Password or magic-link authentication', 'Cross-device sync and recovery', 'Community posts and reactions between people', 'Follows and social notifications', 'Durable public collection links', 'Email or push reminder delivery'].map((item) => (
              <li key={item} className="flex gap-3"><X size={15} className="mt-0.5 shrink-0 text-white/25" />{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/vault" className="rounded-full bg-white px-6 py-3 font-heading text-sm font-bold text-black">Open Library</Link>
        <Link href="/profile/settings" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-heading text-sm font-bold text-white hover:bg-white/10">Backup & settings</Link>
      </div>
    </div>
  );
}

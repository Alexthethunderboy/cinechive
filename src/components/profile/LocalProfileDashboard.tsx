'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Archive, BookOpen, FolderHeart, Heart, PenLine, Settings, Star, Trash2 } from 'lucide-react';
import CinematicAvatar from './CinematicAvatar';
import GlassPanel from '@/components/ui/GlassPanel';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';
import { cn } from '@/lib/utils';
import { mapLocalMediaEntry, removeLocalJournalEntry, useLocalArchive } from '@/lib/local-archive';

type ProfileTab = 'overview' | 'library' | 'journal' | 'reviews' | 'likes' | 'collections';

const tabs: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'library', label: 'Library' },
  { id: 'journal', label: 'Journal' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'likes', label: 'Likes' },
  { id: 'collections', label: 'Collections' },
];

export default function LocalProfileDashboard() {
  const archive = useLocalArchive();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const saved = useMemo(
    () => archive.mediaEntries.filter((entry) => entry.is_vault).map(mapLocalMediaEntry),
    [archive.mediaEntries],
  );
  const reviews = archive.mediaEntries.filter((entry) => entry.rating || entry.comment);
  const likes = archive.preferences.filter((preference) => preference.reaction === 'like');

  return (
    <div className="min-h-screen px-3 pb-32 pt-20 sm:px-5 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-xs text-emerald-100/80">
          Local profile · Private to this browser. Your archive works without Supabase, but it does not sync to another device.
        </div>

        <header className="mb-10 flex flex-col gap-7 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <CinematicAvatar
              src={archive.profile.avatar_url}
              username={archive.profile.username}
              seed={archive.profile.avatar_seed}
              avatarMode={archive.profile.avatar_mode}
              avatarCharacter={archive.profile.avatar_character}
              avatarAnimation={archive.profile.avatar_animation}
              style={archive.profile.primary_style}
              size="xl"
            />
            <div>
              <p className="mb-2 font-metadata text-[10px] uppercase tracking-[0.3em] text-emerald-300/70">Device curator</p>
              <h1 className="font-heading text-4xl italic tracking-tighter text-white sm:text-6xl">
                {archive.profile.display_name || archive.profile.username}
              </h1>
              <p className="mt-2 font-mono text-xs text-white/35">@{archive.profile.username}</p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55">{archive.profile.bio}</p>
            </div>
          </div>
          <Link
            href="/profile/settings"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 font-metadata text-[10px] uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Settings size={15} /> Edit profile
          </Link>
        </header>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat icon={Archive} label="Saved" value={saved.length} />
          <Stat icon={BookOpen} label="Journal" value={archive.journalEntries.length} />
          <Stat icon={PenLine} label="Reviews" value={reviews.length} />
          <Stat icon={Heart} label="Likes" value={likes.length} />
          <Stat icon={FolderHeart} label="Collections" value={archive.collections.length} />
        </div>

        <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 font-metadata text-[10px] uppercase tracking-widest transition-colors',
                activeTab === tab.id ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <motion.section key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <ProfileLane title="Recently saved" empty="Save a title and it will appear here.">
                {saved.slice(0, 4).map((media, index) => (
                  <DiscoveryCard key={`${media.type}:${media.sourceId}`} media={media} index={index} />
                ))}
              </ProfileLane>
              <ProfileLane title="Recent journal" empty="Log a screening from any title page.">
                <JournalList entries={archive.journalEntries.slice(0, 5)} />
              </ProfileLane>
            </div>
          )}

          {activeTab === 'library' && (
            <MediaGrid empty="Your library is empty." items={saved} />
          )}

          {activeTab === 'journal' && (
            archive.journalEntries.length
              ? <JournalList entries={archive.journalEntries} removable />
              : <Empty text="No screenings logged yet." />
          )}

          {activeTab === 'reviews' && (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.length ? reviews.map((entry) => (
                <GlassPanel key={entry.id} className="flex gap-4 border-white/10 bg-white/3 p-4">
                  <Poster src={entry.poster_url} title={entry.title} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-lg text-white">{entry.title}</h3>
                    {entry.rating && <p className="mt-1 flex items-center gap-1 text-xs text-amber-300"><Star size={12} fill="currentColor" /> {entry.rating}/10</p>}
                    {entry.comment && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/50">{entry.comment}</p>}
                  </div>
                </GlassPanel>
              )) : <Empty text="Rate or review a title to build this shelf." />}
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {likes.length ? likes.map((item) => (
                <Link key={item.id} href={`/media/${item.media_type}/${item.media_id}`} className="group">
                  <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {item.poster_url && <Image src={item.poster_url} alt={item.title} fill className="object-cover transition-transform group-hover:scale-105" />}
                  </div>
                  <p className="mt-2 truncate font-heading text-sm text-white/70 group-hover:text-white">{item.title}</p>
                </Link>
              )) : <Empty text="Titles you like will appear here." />}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archive.collections.length ? archive.collections.map((collection) => (
                <Link key={collection.id} href={`/vault/collections/${collection.id}`}>
                  <GlassPanel className="h-full border-white/10 bg-white/3 p-6 transition-colors hover:bg-white/6">
                    <FolderHeart className="mb-8 text-white/30" />
                    <h3 className="font-heading text-2xl text-white">{collection.title}</h3>
                    <p className="mt-2 text-xs text-white/35">{collection.collection_items.length} items · Local only</p>
                  </GlassPanel>
                </Link>
              )) : <Empty text="Create your first collection from the Library." />}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: number }) {
  return (
    <GlassPanel className="border-white/10 bg-white/3 p-4">
      <Icon size={16} className="mb-4 text-white/25" />
      <p className="font-heading text-3xl text-white">{value}</p>
      <p className="font-metadata text-[9px] uppercase tracking-widest text-white/30">{label}</p>
    </GlassPanel>
  );
}

function ProfileLane({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div>
      <h2 className="mb-5 font-heading text-2xl italic text-white">{title}</h2>
      {hasChildren ? <div className="grid grid-cols-2 gap-4">{children}</div> : <Empty text={empty} />}
    </div>
  );
}

function MediaGrid({ items, empty }: { items: ReturnType<typeof mapLocalMediaEntry>[]; empty: string }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
      {items.map((media, index) => <DiscoveryCard key={`${media.type}:${media.sourceId}`} media={media} index={index} />)}
    </div>
  );
}

function JournalList({ entries, removable = false }: { entries: ReturnType<typeof useLocalArchive>['journalEntries']; removable?: boolean }) {
  return (
    <div className="col-span-full space-y-3">
      {entries.map((entry) => (
        <GlassPanel key={entry.id} className="flex items-center gap-4 border-white/10 bg-white/3 p-3">
          <Poster src={entry.poster_url} title={entry.title} />
          <div className="min-w-0 flex-1">
            <Link href={`/media/${entry.media_type}/${entry.media_id}`} className="truncate font-heading text-white hover:text-accent">{entry.title}</Link>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/30">
              {new Date(entry.watched_at).toLocaleDateString()} {entry.is_rewatch ? '· Rewatch' : ''} {entry.rating ? `· ${entry.rating}/10` : ''}
            </p>
          </div>
          {removable && (
            <button onClick={() => removeLocalJournalEntry(entry.id)} aria-label={`Remove ${entry.title} journal entry`} className="rounded-full p-2 text-white/25 hover:bg-rose-500/10 hover:text-rose-300">
              <Trash2 size={15} />
            </button>
          )}
        </GlassPanel>
      ))}
    </div>
  );
}

function Poster({ src, title }: { src: string | null; title: string }) {
  return (
    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
      {src && <Image src={src} alt={title} fill className="object-cover" />}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-white/10 px-5 py-16 text-center font-metadata text-[10px] uppercase tracking-widest text-white/25">{text}</div>;
}

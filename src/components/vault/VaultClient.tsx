'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderHeart, 
  Bookmark, 
  Plus, 
  Search, 
  ChevronRight,
  Loader2,
  Trash2,
  Share2
} from 'lucide-react';
import GlassPanel from '../ui/GlassPanel';
import { DiscoveryCard } from '../cinema/DiscoveryCard';
import { UnifiedMedia } from '@/lib/api/mapping';
import { cn } from '@/lib/utils';
import NewCollectionModal from './NewCollectionModal';
import Link from 'next/link';

interface VaultClientProps {
  initialCollections: any[];
  initialSavedMedia: any[];
}

export default function VaultClient({ initialCollections, initialSavedMedia }: VaultClientProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'saved'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Filter logic
  const filteredCollections = initialCollections.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSaved = initialSavedMedia.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="font-heading text-5xl md:text-7xl tracking-tighter text-white italic uppercase leading-none mb-2">
              The Vault
            </h1>
            <p className="text-white/40 font-metadata text-xs uppercase tracking-[0.3em]">
              Your Personal Cinematheque
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover/search:text-white/40 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Archive..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs font-metadata text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all w-64"
              />
            </div>
            
            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-metadata text-[10px] uppercase tracking-widest font-bold hover:bg-white/90 transition-all"
            >
              <Plus size={14} /> New Collection
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 gap-8">
          <button 
            onClick={() => setActiveTab('collections')}
            className={cn(
              "pb-4 font-metadata text-xs uppercase tracking-widest transition-all relative",
              activeTab === 'collections' ? "text-white" : "text-white/30 hover:text-white/60"
            )}
          >
            Collections ({initialCollections.length})
            {activeTab === 'collections' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-px bg-white" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={cn(
              "pb-4 font-metadata text-xs uppercase tracking-widest transition-all relative",
              activeTab === 'saved' ? "text-white" : "text-white/30 hover:text-white/60"
            )}
          >
            Saved Media ({initialSavedMedia.length})
            {activeTab === 'saved' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-px bg-white" />
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'collections' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.length > 0 ? (
                filteredCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))
              ) : (
                <EmptyState 
                  icon={<FolderHeart size={40} className="text-white/10" />}
                  title="No Collections Found"
                  description="Start curating your own cinematic editorial volumes."
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredSaved.length > 0 ? (
                filteredSaved.map((media, idx) => (
                  <DiscoveryCard key={media.id} media={media} index={idx} isAlreadySaved={true} />
                ))
              ) : (
                <EmptyState 
                  icon={<Bookmark size={40} className="text-white/10" />}
                  title="Your Vault is Empty"
                  description="Items you bookmark across the app will appear here."
                />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <NewCollectionModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
      />
    </div>
  );
}

function CollectionCard({ collection }: { collection: any }) {
  const itemCount = collection.collection_items?.[0]?.count || 0;

  return (
    <Link href={`/vault/collections/${collection.id}`}>
      <GlassPanel className="p-6 group hover:border-white/20 transition-all h-48 flex flex-col justify-between border-white/5">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
            <FolderHeart size={20} />
          </div>
          {collection.is_public && (
            <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              Public
            </span>
          )}
        </div>
        
        <div>
          <h3 className="font-heading text-2xl text-white group-hover:text-accent transition-colors leading-none mb-2">
            {collection.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-white/40 font-metadata text-[10px] uppercase tracking-widest">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </p>
            <ChevronRight size={14} className="text-white/20 group-hover:translate-x-1 group-hover:text-white transition-all" />
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="mb-6">{icon}</div>
      <h3 className="font-heading text-2xl text-white/50 mb-2 uppercase italic">{title}</h3>
      <p className="text-white/30 font-metadata text-[10px] uppercase tracking-widest max-w-xs">{description}</p>
    </div>
  );
}

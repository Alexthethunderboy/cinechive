'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Loader2, Trash2 } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { getCommentsAction, postCommentAction, deleteCommentAction, CommentWithUser } from '@/lib/reaction-actions';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityType: string;
  userId: string | null;
}

export default function CommentDrawer({
  isOpen,
  onClose,
  activityId,
  activityType,
  userId
}: CommentDrawerProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, startPosting] = useTransition();

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, activityId]);

  async function loadComments() {
    setIsLoading(true);
    const data = await getCommentsAction(activityId);
    setComments(data);
    setIsLoading(false);
  }

  async function handleSubmit() {
    if (!newComment.trim()) return;

    startPosting(async () => {
      const result = await postCommentAction(activityId, activityType, newComment);
      if (result.success) {
        setNewComment('');
        loadComments(); // Refresh list
        toast.success('Comment posted');
      } else {
        toast.error(result.error || 'Failed to post comment');
      }
    });
  }

  async function handleDelete(commentId: string) {
    const result = await deleteCommentAction(commentId);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer / Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-white/10 z-60 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-accent" size={20} />
                <h2 className="font-display text-xl tracking-tight uppercase font-bold italic">Discussion</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-white/20" size={32} />
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment, index) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 group"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5">
                      {comment.avatar_url ? (
                        <Image src={comment.avatar_url} alt={comment.username} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold">
                          {comment.username[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-bold text-xs text-white/80">{comment.username}</span>
                        <span className="font-data text-[9px] text-white/20">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed font-heading bg-white/3 p-3 rounded-2xl rounded-tl-none border border-white/5">
                        {comment.body}
                      </p>
                      {userId === comment.user_id && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] uppercase font-bold text-rose-500 hover:text-rose-400 mt-1 pl-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                  <MessageSquare size={48} strokeWidth={1} />
                  <p className="font-heading italic uppercase text-lg tracking-widest">No notes yet</p>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-6 border-t border-white/5 bg-white/2">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a cinephile note..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isPosting}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-heading focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all placeholder:text-white/20 pr-12"
                  />
                  <button 
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || isPosting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-accent hover:bg-accent/10 disabled:opacity-30 disabled:text-white/20 transition-all"
                  >
                    {isPosting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </div>
              <p className="mt-4 text-[9px] uppercase tracking-[0.2em] font-bold text-white/20 text-center">
                Keep the critique civil.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

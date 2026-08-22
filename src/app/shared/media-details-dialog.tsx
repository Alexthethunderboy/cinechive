'use client';

import { useRef, type MouseEvent } from 'react';
import { Info, X } from 'lucide-react';

interface MediaDetailsDialogProps {
  dialogId: string;
  title: string;
  overview: string | null;
  mediaLabel: string;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  seasonLabel: string | null;
  genres: string[];
}

export default function MediaDetailsDialog({
  dialogId,
  title,
  overview,
  mediaLabel,
  releaseYear,
  runtimeMinutes,
  seasonLabel,
  genres,
}: MediaDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.currentTarget === event.target) event.currentTarget.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`View details for ${title}`}
        className="absolute right-3 top-3 z-20 inline-flex size-11 touch-manipulation items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
      >
        <Info aria-hidden="true" className="size-4.5" />
      </button>

      <dialog
        ref={dialogRef}
        onClick={closeFromBackdrop}
        aria-labelledby={dialogId}
        className="fixed inset-x-0 bottom-0 top-auto z-50 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-[2rem] border border-white/10 bg-zinc-950 p-0 text-white shadow-[0_-30px_100px_rgba(0,0,0,0.75)] backdrop:bg-black/80 backdrop:backdrop-blur-sm open:flex open:flex-col sm:inset-1/2 sm:bottom-auto sm:w-[min(92vw,36rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]"
      >
        <div className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-300">{mediaLabel}</p>
            <h3 id={dialogId} className="mt-2 font-heading text-3xl uppercase leading-none sm:text-4xl">
              {title}
            </h3>
          </div>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Close details"
              className="inline-flex size-11 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </form>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap gap-2 text-xs font-bold text-zinc-300">
            {releaseYear && <span className="rounded-full bg-white/7 px-3 py-1.5">{releaseYear}</span>}
            {seasonLabel && <span className="rounded-full bg-white/7 px-3 py-1.5">{seasonLabel}</span>}
            {runtimeMinutes && <span className="rounded-full bg-white/7 px-3 py-1.5">{runtimeMinutes} min</span>}
            {genres.map((genre) => <span key={genre} className="rounded-full bg-white/7 px-3 py-1.5">{genre}</span>)}
          </div>
          <p className="mt-6 text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
            {overview || 'No overview is available for this title.'}
          </p>
        </div>
      </dialog>
    </>
  );
}

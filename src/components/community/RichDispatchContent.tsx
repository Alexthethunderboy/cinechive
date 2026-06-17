'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function RichDispatchContent({ content }: { content: string }) {
  if (!content) return null;

  // Extract YouTube URL if present
  const ytMatch = content.match(YOUTUBE_REGEX);
  const ytUrl = ytMatch ? ytMatch[0] : null;

  // If there's a YouTube video, we render the text above it and the video below
  if (ytUrl) {
    // Remove the URL from the text so we don't display it raw
    const textWithoutUrl = content.replace(ytUrl, '').trim();

    return (
      <div className="space-y-4">
        {textWithoutUrl && (
          <p className="text-white/90 text-[15px] md:text-base font-heading leading-relaxed whitespace-pre-wrap">
            {textWithoutUrl}
          </p>
        )}
        <div className="rounded-2xl overflow-hidden border border-white/10 relative pt-[56.25%] bg-black/50">
          <div className="absolute inset-0">
             {/* @ts-ignore */} <ReactPlayer 
              url={ytUrl} 
              width="100%" 
              height="100%" 
              controls 
              light={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback to regular text, making standard URLs clickable
  const parts = content.split(URL_REGEX);
  
  return (
    <p className="text-white/90 text-[15px] md:text-base font-heading leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
}

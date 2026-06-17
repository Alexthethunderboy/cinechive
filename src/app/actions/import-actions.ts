'use server';

import { createClient } from '@/lib/supabase/server';
import { MediaFetcher } from '@/lib/api/MediaFetcher';
import { revalidatePath } from 'next/cache';

export interface ImportRow {
  Title: string;
  Year?: string;
  Rating?: string;
  Tags?: string;
  Date?: string;
}

export async function processLetterboxdImportAction(rows: ImportRow[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Process in small batches to avoid TMDB rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (row) => {
      try {
        const title = row.Title || (row as any).Name; // Letterboxd sometimes uses Name instead of Title
        if (!title) {
          results.failed++;
          return;
        }

        // Search TMDB for movie
        const searchResults = await MediaFetcher.searchMedia(title, 1);
        
        // Filter by year if available
        let bestMatch = searchResults.find(m => m.type === 'movie' || m.type === 'tv');
        if (row.Year && bestMatch) {
          const yearMatch = searchResults.find(m => (m.type === 'movie' || m.type === 'tv') && String(m.releaseYear) === String(row.Year));
          if (yearMatch) bestMatch = yearMatch;
        }

        if (!bestMatch) {
          results.failed++;
          results.errors.push(`Could not find match for: ${title}`);
          return;
        }

        // Insert into media_entries
        const { error: insertError } = await (supabase.from('media_entries') as any).insert({
          user_id: user.id,
          media_type: bestMatch.type === 'movie' ? 'movie' : 'tv',
          external_id: `${bestMatch.type}_${bestMatch.id}`,
          title: bestMatch.displayTitle,
          poster_url: bestMatch.posterUrl || bestMatch.backdropUrl,
          year: bestMatch.releaseYear || parseInt(row.Year || '0'),
          notes: `Imported from Letterboxd${row.Rating ? ` | Rating: ${row.Rating}` : ''}`,
          is_vault: true
        });

        if (insertError) {
          // If unique constraint violation (already in vault), just count as successful skip
          if (insertError.code === '23505') {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Failed to save ${title}: ${insertError.message}`);
          }
        } else {
          results.successful++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing ${(row as any).Title || (row as any).Name}`);
      }
    }));
    
    // Tiny delay between batches to respect TMDB rate limits
    if (i + BATCH_SIZE < rows.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  revalidatePath('/vault');
  revalidatePath('/profile');
  
  return { success: true, ...results };
}

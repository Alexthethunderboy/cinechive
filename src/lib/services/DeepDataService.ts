import { createClient } from '@/lib/supabase/server';

export interface TriviaItem {
  id: string;
  text: string;
  category: 'production' | 'casting' | 'easter_egg' | 'general';
}

export interface TechnicalSpecs {
  camera?: string;
  negativeFormat?: string;
  aspectRatio?: string;
  soundMix?: string[];
}

export class DeepDataService {
  /**
   * Fetches trivia for a movie. Tries cache first, then scrapes IMDb.
   */
  static async fetchTrivia(tmdbId: string, imdbId?: string): Promise<TriviaItem[]> {
    if (!imdbId) return [];

    const supabase = await createClient();

    // 1. Check Cache
    const { data: cached } = await (supabase
      .from('media_metadata_cache') as any)
      .select('trivia')
      .eq('tmdb_id', tmdbId)
      .single();

    if (cached?.trivia && (cached.trivia as any[]).length > 0) {
      return cached.trivia as TriviaItem[];
    }

    // 2. Fetch from OMDb (if available) or Scrape IMDb
    // For this implementation, we'll focus on a robust OMDb/IMDb hybrid approach
    const trivia = await this.scrapeIMDbTrivia(imdbId);

    // 3. Update Cache
    if (trivia.length > 0) {
      await (supabase.from('media_metadata_cache') as any).upsert({
        tmdb_id: tmdbId,
        imdb_id: imdbId,
        media_type: 'movie', // Default to movie for now
        trivia,
        last_updated: new Date().toISOString()
      }, { onConflict: 'tmdb_id' });
    }

    return trivia;
  }

  /**
   * Extracts technical specs from TMDB data and keywords
   */
  static getTechnicalSpecs(tmdbData: any): TechnicalSpecs {
    const keywords = tmdbData.keywords?.keywords || [];
    const specs: TechnicalSpecs = {};

    // Map common tech keywords to specs
    const keywordMap: Record<string, keyof TechnicalSpecs> = {
      'imax': 'camera',
      '70mm': 'negativeFormat',
      '35mm': 'negativeFormat',
      'panavision': 'camera',
      'arri': 'camera',
      'dolby atmos': 'soundMix',
      'dts': 'soundMix',
      'sdds': 'soundMix',
    };

    keywords.forEach((kw: any) => {
      const name = kw.name.toLowerCase();
      for (const [key, field] of Object.entries(keywordMap)) {
        if (name.includes(key)) {
          if (field === 'soundMix') {
            specs.soundMix = Array.from(new Set([...(specs.soundMix || []), name.toUpperCase()]));
          } else {
            specs[field] = name.toUpperCase();
          }
        }
      }
    });

    // Fallback for Aspect Ratio (often in release dates or specific metadata if we added it)
    // For now, we'll look for specific strings in overview/keywords
    if (tmdbData.overview?.includes('2.39:1')) specs.aspectRatio = '2.39:1';
    if (tmdbData.overview?.includes('1.85:1')) specs.aspectRatio = '1.85:1';

    return specs;
  }

  /**
   * Internal IMDb Trivia Scraper
   * Note: In a production environment, use a proxy or specialized API
   */
  private static async scrapeIMDbTrivia(imdbId: string): Promise<TriviaItem[]> {
    try {
      const url = `https://www.imdb.com/title/${imdbId}/trivia`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) return [];

      const html = await response.text();
      
      // Simple regex extraction for trivia items
      // This is a placeholder for a more robust parser (e.g. cheerio-like on server)
      const triviaMatches = html.match(/<div class="ipc-html-content-inner-div" role="presentation">([\s\S]*?)<\/div>/g) || [];
      
      const trivia: TriviaItem[] = triviaMatches.slice(0, 15).map((match, index) => {
        const text = match.replace(/<[^>]*>?/gm, '').trim();
        let category: TriviaItem['category'] = 'general';

        if (text.toLowerCase().includes('cameo') || text.toLowerCase().includes('cast')) category = 'casting';
        if (text.toLowerCase().includes('original') || text.toLowerCase().includes('budget')) category = 'production';
        if (text.toLowerCase().includes('easter egg') || text.toLowerCase().includes('reference')) category = 'easter_egg';

        return {
          id: `trivia-${index}`,
          text,
          category
        };
      });

      return trivia;
    } catch (error) {
      console.error('Failed to scrape IMDb Trivia:', error);
      return [];
    }
  }
}

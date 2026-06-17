'use server';

import { getMovieDetails } from './api/tmdb';
import { DeepDataService } from './services/DeepDataService';
import { getVaultEntries } from './media-actions';

export async function getRandomTriviaAction() {
  const entries = await getVaultEntries();
  const movies = entries.filter(e => e.media_type === 'movie');
  
  if (movies.length === 0) return null;
  
  const randomMovie = movies[Math.floor(Math.random() * movies.length)];
  
  try {
    const details = await getMovieDetails(parseInt(randomMovie.media_id));
    const imdbId = details.external_ids?.imdb_id;
    
    if (!imdbId) return null;
    
    const trivia = await DeepDataService.fetchTrivia(randomMovie.media_id, imdbId);
    if (trivia.length === 0) return null;
    
    const randomTrivia = trivia[Math.floor(Math.random() * trivia.length)];
    
    return {
      movieTitle: randomMovie.title,
      trivia: randomTrivia,
      mediaId: randomMovie.media_id,
      mediaType: randomMovie.media_type
    };
  } catch (error) {
    console.error("Failed to fetch random trivia:", error);
    return null;
  }
}


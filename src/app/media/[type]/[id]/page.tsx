import { notFound } from 'next/navigation';
import { getMovieDetails, getTvDetails, getPersonDetails, getPersonMovieCredits } from '@/lib/api/tmdb';
import { mapTMDBDetailToUnified, mapTMDBPersonCreditToUnified, mapAniListDetailToUnified, DetailedMedia, UnifiedMedia } from '@/lib/api/mapping';
import ClientMediaDetail from '@/components/media/ClientMediaDetail';
import { getMediaEntryForUser } from '@/lib/actions';
import CatalogExplorer from '@/components/cinema/CatalogExplorer';
import { SearchService } from '@/lib/services/SearchService';
import { AniListFetcher } from '@/lib/api/anilist';
import { DeepDataService } from '@/lib/services/DeepDataService';
import { ScriptService } from '@/lib/services/ScriptService';

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { type, id } = await params;

  // Handle Person Type separately since it uses CatalogExplorer
  if (type === 'person') {
    try {
      const person = await getPersonDetails(Number(id));
      const credits = await getPersonMovieCredits(Number(id));
      const works = credits.cast.concat(credits.crew).map(mapTMDBPersonCreditToUnified);
      
      // Deduplicate works by ID
      const uniqueWorks: UnifiedMedia[] = Array.from(new Map(works.map((w: UnifiedMedia) => [w.id, w])).values()) as UnifiedMedia[];

      return (
        <div className="py-20 px-6 md:px-16">
          <CatalogExplorer 
            person={{
              name: person.name,
              biography: person.biography,
              profilePath: person.profile_path,
              knownFor: person.known_for_department,
              birthday: person.birthday,
              placeOfBirth: person.place_of_birth,
            }} 
            works={uniqueWorks} 
          />
        </div>
      );
    } catch (error) {
      console.error("Failed to fetch person details:", error);
      return notFound();
    }
  }

  let media: DetailedMedia | null = null;

  try {
    if (type === 'movie' || type === 'documentary' || type === 'tv') {
      const isTv = type === 'tv';
      const data = await SearchService.getDeepEntityDetails(id, isTv ? 'tv' : 'movie');
      
      media = mapTMDBDetailToUnified(data, isTv ? 'tv' : 'movie');
      
      // Add extra deep links (cinema focused)
      media.composers = data.composers;

      // Fetch Deep Metadata (Trivia, Technical Lab, Scripts)
      const imdbId = data.external_ids?.imdb_id;
      const [trivia, scripts] = await Promise.all([
        imdbId ? DeepDataService.fetchTrivia(id, imdbId) : Promise.resolve([]),
        ScriptService.findScript(media.title, imdbId)
      ]);

      const techSpecs = DeepDataService.getTechnicalSpecs(data);

      (media as any).deepData = {
        trivia,
        specs: techSpecs,
        scripts
      };
    } else if (type === 'anime') {
      const data = await AniListFetcher.getAnimeDetails(Number(id));
      media = mapAniListDetailToUnified(data);
    }
  } catch (error) {
    console.error("Failed to fetch media details:", error);
    return notFound();
  }

  if (!media) return notFound();

  // Fetch user-specific archive entry if it exists
  const userEntry = await getMediaEntryForUser(id, type);

  return <ClientMediaDetail media={media} initialUserEntry={userEntry} deepData={(media as any).deepData} />;
}

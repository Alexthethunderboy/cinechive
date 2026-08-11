import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPersonDetails, getPersonMovieCredits } from '@/lib/api/tmdb';
import { mapTMDBPersonCreditToUnified, mapAniListDetailToUnified, DetailedMedia, UnifiedMedia } from '@/lib/api/mapping';
import ClientMediaDetail from '@/components/media/ClientMediaDetail';
import CatalogExplorer from '@/components/cinema/CatalogExplorer';
import { SearchService } from '@/lib/services/SearchService';
import { AniListFetcher } from '@/lib/api/anilist';
import { DeepDataService, TechnicalSpecs, TriviaItem } from '@/lib/services/DeepDataService';
import type { ScriptInfo } from '@/lib/services/ScriptService';
import { resolveRegion } from '@/lib/region';
import { cookies, headers } from 'next/headers';

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { type, id } = await params;
  const { via } = await searchParams;
  const sharer = typeof via === 'string' ? via : undefined;
  
  if (type === 'person') {
    try {
      const person = await getPersonDetails(Number(id));
      const baseTitle = person.name;
      const title = sharer ? `${baseTitle} (Shared by @${sharer})` : baseTitle;
      
      return {
        title,
        description: person.biography?.slice(0, 160) || `Explore the works of ${person.name} on CineChive.`,
        openGraph: {
          title,
          images: person.profile_path ? [`https://image.tmdb.org/t/p/w780${person.profile_path}`] : [],
        }
      };
    } catch {
      return { title: 'Person Details' };
    }
  }

  try {
    const requestHeaders = await headers();
    const requestCookies = await cookies();
    const region = resolveRegion({
      headersObj: requestHeaders,
      cookieRegion: requestCookies.get('watchRegion')?.value
    });
    let title: string = '';
    let description = '';
    let image = '';

    if (type === 'anime') {
       const data = await AniListFetcher.getAnimeDetails(Number(id));
       const titleRaw = data.title.english || data.title.romaji || 'Anime Details';
       title = titleRaw;
       description = data.description?.replace(/<[^>]*>/g, '').slice(0, 160) || '';
       image = data.bannerImage || data.coverImage.extraLarge || '';
    } else {
       const isTv = type === 'tv';
       const { media } = await SearchService.getDeepEntityDetails(id, isTv ? 'tv' : 'movie', region);
       title = media.displayTitle || '';
       description = media.overview.slice(0, 160);
       image = media.backdropUrl || media.posterUrl || '';
    }

    const finalTitle = sharer ? `${title} (via @${sharer})` : title;

    return {
      title: finalTitle,
      description,
      openGraph: {
        title: finalTitle,
        description,
        type: 'video.movie',
        images: image ? [image] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Media Details' };
  }
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const requestHeaders = await headers();
  const requestCookies = await cookies();
  const region = resolveRegion({
    headersObj: requestHeaders,
    cookieRegion: requestCookies.get('watchRegion')?.value
  });

  // Handle Person Type separately since it uses CatalogExplorer
  if (type === 'person') {
    let person;
    let credits;
    try {
      [person, credits] = await Promise.all([
        getPersonDetails(Number(id)),
        getPersonMovieCredits(Number(id)),
      ]);
    } catch (error) {
      console.error("Failed to fetch person details:", error);
      return notFound();
    }
    const works = credits.cast.concat(credits.crew).map(mapTMDBPersonCreditToUnified);
    const uniqueWorks: UnifiedMedia[] = Array.from(new Map(works.map((w: UnifiedMedia) => [w.id, w])).values()) as UnifiedMedia[];

    return (
      <div className="py-20 px-6 md:px-16">
        <CatalogExplorer
          person={{
            name: person.name,
            biography: person.biography,
            profileUrl: person.profile_path ? `https://image.tmdb.org/t/p/w780${person.profile_path}` : null,
            knownFor: person.known_for_department,
            birthday: person.birthday,
            placeOfBirth: person.place_of_birth,
          }}
          works={uniqueWorks}
        />
      </div>
    );
  }

  let media: DetailedMedia | null = null;
  let deepData: {
    trivia: TriviaItem[];
    specs: TechnicalSpecs;
    scripts: ScriptInfo[];
  } | undefined;

  try {
    if (type === 'movie' || type === 'documentary' || type === 'tv') {
      const isTv = type === 'tv';
      const { media: mappedMedia, raw: rawData } = await SearchService.getDeepEntityDetails(id, isTv ? 'tv' : 'movie', region);
      media = mappedMedia;

      deepData = {
        trivia: [],
        specs: DeepDataService.getTechnicalSpecs(rawData),
        scripts: [],
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

  return <ClientMediaDetail key={`${type}-${id}`} media={media} deepData={deepData} />;
}

import { UniversalMedia } from '@/lib/api/UniversalTransformer';

interface ExternalWatchLink {
  providerName: string;
  url: string;
}

/**
 * Expected WATCH_LINKS_API_URL response shape:
 * { "links": [{ "providerName": "Netflix", "url": "https://..." }] }
 */

function normalizeProviderName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const PROVIDER_ALIAS_GROUPS = [
  ['max', 'hbomax', 'hbo', 'maxamazonchannel'],
  ['primevideo', 'amazonprimevideo', 'amazonprime', 'amazonvideo'],
  ['appletvplus', 'appletv+', 'appletvplusamazonchannel'],
  ['disney+', 'disneyplus'],
  ['paramount+', 'paramountplus'],
  ['peacock', 'peacockpremium'],
  ['hulu', 'huluplus'],
];

function getProviderAliases(name: string): string[] {
  const normalized = normalizeProviderName(name);
  const matched = PROVIDER_ALIAS_GROUPS.find((group) =>
    group.map((item) => normalizeProviderName(item)).includes(normalized)
  );
  if (!matched) return [normalized];
  return matched.map((item) => normalizeProviderName(item));
}

export class WatchLinkService {
  static async enrichWithExternalLinks(media: UniversalMedia): Promise<UniversalMedia> {
    const apiKey = process.env.WATCHMODE_API_KEY;
    if (!apiKey || !media.providers || media.providers.length === 0 || media.source !== 'tmdb') {
      return media;
    }

    try {
      const watchmodeId = `${media.type === 'tv' ? 'tv' : 'movie'}-${media.sourceId}`;
      const detailsUrl = `https://api.watchmode.com/v1/title/${watchmodeId}/details/?apiKey=${encodeURIComponent(apiKey)}&append_to_response=sources`;
      const response = await fetch(detailsUrl, {
        cache: 'no-store'
      });
      if (!response.ok) return media;

      const payload = (await response.json()) as {
        sources?: Array<{ name?: string; web_url?: string; type?: string }>;
      };
      const links: ExternalWatchLink[] = (payload.sources || [])
        .filter((source) => source.type === 'sub' && !!source.name && !!source.web_url)
        .map((source) => ({
          providerName: source.name as string,
          url: source.web_url as string
        }));
      if (links.length === 0) return media;

      const linkMap = new Map<string, string>();
      for (const entry of links) {
        for (const alias of getProviderAliases(entry.providerName)) {
          if (!linkMap.has(alias)) {
            linkMap.set(alias, entry.url);
          }
        }
      }

      return {
        ...media,
        providers: media.providers.map((provider) => ({
          ...provider,
          watchUrl:
            getProviderAliases(provider.provider_name).map((alias) => linkMap.get(alias)).find(Boolean) ||
            provider.watchUrl
        }))
      };
    } catch (error) {
      console.error('[WatchLinkService] external link enrichment failed', error);
      return media;
    }
  }
}

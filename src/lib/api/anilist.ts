export interface AniListAnime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  startDate: {
    year: number | null;
  };
  status: string;
  season: string | null;
  seasonYear: number | null;
  format: string | null; // TV, MOVIE, OVA, ONA
  episodes: number | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  averageScore: number | null; // 0-100
  studios: {
    nodes: {
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }[];
  };
  trailer: {
    id: string;
    site: string; // youtube, dailymotion
  } | null;
  characters: {
    edges: {
      role: string;
      node: {
        id: number;
        name: {
          userPreferred: string;
        };
        image: {
          large: string | null;
        };
      };
      voiceActors: {
        id: number;
        name: {
          userPreferred: string;
        };
      }[];
    }[];
  };
}

export class AniListFetcher {
  private static ENDPOINT = 'https://graphql.anilist.co';

  private static async fetchGraphQL(query: string, variables: any) {
    const response = await fetch(this.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      }),
      // Cache heavily for discovery feeds, revalidate every hour
      next: { revalidate: 3600 } 
    });

    const json = await response.json();
    
    if (!response.ok || json.errors) {
      console.error("AniList API Error:", json.errors || response.statusText);
      throw new Error("Failed to fetch from AniList");
    }

    return json.data;
  }

  static async getTrendingAnime(page: number = 1, perPage: number = 20): Promise<{ media: AniListAnime[], pageInfo: { hasNextPage: boolean } }> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
            id
            title {
              romaji
              english
              native
            }
            startDate {
              year
            }
            status
            season
            seasonYear
            format
            episodes
            coverImage {
              extraLarge
              large
            }
            bannerImage
            description(asHtml: false)
            genres
            averageScore
            studios(isMain: true) {
              nodes {
                id
                name
                isAnimationStudio
              }
            }
            trailer {
              id
              site
            }
            characters(sort: ROLE, perPage: 5) {
              edges {
                role
                node {
                  id
                  name {
                    userPreferred
                  }
                  image {
                    large
                  }
                }
                voiceActors(language: JAPANESE, sort: RELEVANCE) {
                  id
                  name {
                    userPreferred
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL(query, { page, perPage });
    return {
      media: data.Page.media,
      pageInfo: data.Page.pageInfo
    };
  }

  static async getAnimeDetails(id: number): Promise<AniListAnime> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          startDate {
            year
          }
          status
          season
          seasonYear
          format
          episodes
          coverImage {
            extraLarge
            large
          }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          studios(isMain: true) {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          trailer {
            id
            site
          }
          characters(sort: ROLE, perPage: 15) {
            edges {
              role
              node {
                id
                name {
                  userPreferred
                }
                image {
                  large
                }
              }
              voiceActors(language: JAPANESE, sort: RELEVANCE) {
                id
                name {
                  userPreferred
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL(query, { id });
    return data.Media;
  }
}


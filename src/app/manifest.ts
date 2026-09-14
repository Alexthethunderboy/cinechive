import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CineChive Shared Library',
    short_name: 'CineChive',
    description: 'A private family catalogue for movies and TV shared through iCloud.',
    start_url: '/shared',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}

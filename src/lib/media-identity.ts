type MediaLike = {
  id?: string | number | null;
  sourceId?: string | number | null;
  type: string;
};

export function toCanonicalMediaId(media: MediaLike): string {
  const sourceId = media.sourceId ?? media.id;
  if (sourceId === null || sourceId === undefined) return '';
  const raw = String(sourceId);
  if (raw.includes('-')) {
    const parts = raw.split('-');
    return parts[parts.length - 1] || raw;
  }
  return raw;
}

export function buildMediaHref(media: MediaLike): string {
  const mediaType = media.type === 'documentary' ? 'movie' : media.type;
  return `/media/${mediaType}/${toCanonicalMediaId(media)}`;
}

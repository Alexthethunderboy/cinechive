const ISO_COUNTRY_RE = /^[A-Z]{2}$/;

function sanitizeRegion(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const normalized = candidate.trim().toUpperCase();
  return ISO_COUNTRY_RE.test(normalized) ? normalized : null;
}

function regionFromAcceptLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;
  const first = acceptLanguage.split(',')[0]?.trim();
  if (!first) return null;
  const parts = first.split('-');
  if (parts.length < 2) return null;
  return sanitizeRegion(parts[1]);
}

export function resolveRegion(options: {
  cookieRegion?: string | null;
  headersObj: Headers;
}): string {
  const byCookie = sanitizeRegion(options.cookieRegion);
  if (byCookie) return byCookie;

  const byVercel = sanitizeRegion(options.headersObj.get('x-vercel-ip-country'));
  if (byVercel) return byVercel;

  const byCloudflare = sanitizeRegion(options.headersObj.get('cf-ipcountry'));
  if (byCloudflare) return byCloudflare;

  const byLocale = regionFromAcceptLanguage(options.headersObj.get('accept-language'));
  if (byLocale) return byLocale;

  return 'US';
}

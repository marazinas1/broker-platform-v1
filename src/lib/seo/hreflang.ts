/** Strip the leading locale segment from a pathname. */
export function stripLocale(path: string, enabledLocales: string[]): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length && enabledLocales.includes(parts[0]!)) {
    return "/" + parts.slice(1).join("/");
  }
  return path.startsWith("/") ? path : `/${path}`;
}

/** Build absolute URL for a given locale + trailing path (no locale prefix). */
export function localizedUrl(
  origin: string,
  locale: string,
  pathWithoutLocale: string,
): string {
  const clean = pathWithoutLocale === "/" ? "" : pathWithoutLocale;
  return `${origin}/${locale}${clean}`;
}

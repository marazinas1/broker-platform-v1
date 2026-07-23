import { localizedUrl, stripLocale } from "./hreflang";

export interface SeoInput {
  origin: string;
  path: string;
  locale: string;
  enabledLocales: string[];
  defaultLocale: string;
  title: string;
  description: string;
  siteName: string;
  ogImage?: string | null;
  ogDefaultImage?: string | null;
  ogType?: "website" | "article" | "product";
  noindex?: boolean;
}

export interface HeadResult {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
}

function absolutize(origin: string, url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildHead(input: SeoInput): HeadResult {
  const {
    origin,
    path,
    locale,
    enabledLocales,
    defaultLocale,
    title,
    description,
    siteName,
    ogImage,
    ogDefaultImage,
    ogType = "website",
    noindex,
  } = input;

  const canonical = `${origin}${path}`;
  const image = absolutize(origin, ogImage ?? ogDefaultImage);
  const bareSubpath = stripLocale(path, enabledLocales);

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: siteName },
    { property: "og:locale", content: locale },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }

  if (noindex) {
    meta.push({ name: "robots", content: "noindex,nofollow" });
  }

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonical },
  ];
  for (const alt of enabledLocales) {
    links.push({
      rel: "alternate",
      hreflang: alt,
      href: localizedUrl(origin, alt, bareSubpath),
    });
  }
  links.push({
    rel: "alternate",
    hreflang: "x-default",
    href: localizedUrl(origin, defaultLocale, bareSubpath),
  });

  return { meta, links };
}

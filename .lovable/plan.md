
## Goal

Scaffold a multi-tenant real estate broker template on **TanStack Start** (SSR). Folder names mirror the Next.js `/app/[locale]/(public|admin)` mental model. No client-specific data, no hardcoded strings, all theme values driven by the DB. Establish the SEO/OG mechanism, typed `site_settings` schema, and the full feature-flag set in this first step.

Stack note: Next.js is not supported on this platform. TanStack Start + Vite + React 19 + TS strict + Tailwind v4 + shadcn + Lovable Cloud (Supabase) + `i18next`/`react-i18next` (TanStack-native equivalent of `next-intl`; message-file authoring is identical).

## What gets built in this step

Foundation only — no listings, no admin UI, no auth flows.

1. Folder scaffold mirroring the requested Next-style tree
2. Locale-prefixed routing (`/de`, `/en`) — German default, English secondary
3. Supabase client helpers (browser, server-fn, admin) via Lovable Cloud
4. **DB-driven theme** — CSS variables written server-side from `site_settings`
5. **SEO/OG mechanism** — shared `buildHead()` helper used by every route
6. `site_settings` + `feature_flags` tables (typed columns, RLS, GRANTs, seed)
7. Homepage rendering translated `"setup.complete"` + locale switcher
8. Zero hardcoded client data anywhere

## Folder structure

```text
src/
  routes/
    __root.tsx                       # shell, providers; sitewide default meta only
    index.tsx                        # redirect "/" -> "/{default_locale}"
    $locale.tsx                      # locale layout: validate, set i18n, <Outlet/>
    $locale.index.tsx                # public home: uses buildHead() + i18n
    _authenticated/route.tsx         # Cloud-managed admin gate (not authored here)
    api/                             # server routes (empty)
  components/
    ui/                              # shadcn (untouched)
    shared/                          # LocaleSwitcher, ThemeStyleTag, etc.
    brand/                           # per-client overrides (README only)
  lib/
    supabase/
      client.ts                      # browser (Cloud-generated)
      auth-middleware.ts             # Cloud-generated
      client.server.ts               # admin (Cloud-generated)
    config/
      site-settings.functions.ts     # getSiteSettings() server fn (public read)
      feature-flags.functions.ts     # getFeatureFlags() server fn
      site-config.ts                 # typed SiteSettings + FeatureFlags interfaces
    seo/
      build-head.ts                  # THE shared head/meta helper (see below)
      origin.functions.ts            # getRequestOrigin() server fn for absolute URLs
      hreflang.ts                    # builds hreflang alternates from enabled_locales
    validation/
      site-settings.ts               # zod
      energy-cert.ts                 # per-country zod stubs (AT/DE/CH/IS/US)
    utils/cn.ts
  i18n/
    config.ts                        # i18next: locales=["de","en"], default "de"
    provider.tsx
  messages/
    de.json
    en.json
  types/
    site-settings.ts
    feature-flags.ts
  styles.css                         # neutral defaults for every semantic token
supabase/
  migrations/
    <ts>_init_site_settings.sql
```

`[locale]` → `$locale` (TanStack dynamic segment). `(public)`/`(admin)` route groups → top-level public routes + `_authenticated/` pathless layout (Cloud-managed).

## SEO / Open Graph mechanism (foundation-level, hard requirement)

Shared helper in `src/lib/seo/build-head.ts`:

```ts
type SeoInput = {
  origin: string;                    // absolute origin, from getRequestOrigin()
  path: string;                      // e.g. "/de" or "/de/objekte/xyz"
  locale: "de" | "en";
  enabledLocales: ("de" | "en")[];
  defaultLocale: "de" | "en";
  title: string;                     // already localized
  description: string;               // already localized
  ogImage?: string | null;           // absolute; falls back to settings.og_default_image
  ogType?: "website" | "article" | "product";
  siteName: string;                  // from site_settings.site_name
  noindex?: boolean;
};
```

`buildHead(input)` returns a `{ meta, links }` object containing, on every call:

- `<title>`, `<meta name="description">`
- `og:title`, `og:description`, `og:type`, `og:url` (absolute), `og:image` (absolute; falls back to `site_settings.og_default_image`), `og:site_name`, `og:locale`
- `twitter:card` = `summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
- `<link rel="canonical">` (leaf routes only — `__root.tsx` does NOT emit canonical)
- `<link rel="alternate" hreflang="…">` for every enabled locale plus `x-default` pointing at `default_locale`
- Optional `robots: noindex` when requested

Rules the helper enforces:
- `og:image` is set ONLY when `buildHead()` is called (i.e. leaf routes). `__root.tsx` never emits `og:image`.
- All URLs (`og:url`, `og:image`, canonical, hreflang) are absolute, built from `origin`.
- Per `head-meta` guidance, `title` is a `meta` entry (not a top-level field).

Wiring:
- `__root.tsx` `head()` holds sitewide defaults only: `charSet`, `viewport`, `og:type: website`, favicon, stylesheet. No canonical, no page-specific title/description, no `og:image`.
- Each leaf route (starting with `$locale.index.tsx`) has a `loader` that calls `getSiteSettings()` + `getRequestOrigin()` and returns them; its `head({ loaderData, params })` calls `buildHead(...)`.
- Homepage demo: title = t("home.title"), description = t("home.description"), ogImage = `settings.og_default_image` (absolute), hreflang for `de` and `en`.

Verification (added to checklist): `curl -s http://localhost:8080/de | grep -E 'og:|twitter:|canonical|hreflang'` — every OG/Twitter/canonical/hreflang tag must appear in the raw HTML response, not injected after hydration.

## Database — `site_settings` (typed columns)

Single-row config table. Explicit columns for scalars; jsonb reserved for per-locale content and open-ended sets.

```sql
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  legal_name text,
  country text not null check (country in ('AT','DE','CH','IS','US')),
  default_locale text not null default 'de',
  enabled_locales text[] not null default '{de,en}',
  currency text not null default 'EUR',
  area_unit text not null default 'sqm' check (area_unit in ('sqm','sqft')),

  logo_url text,
  logo_dark_url text,
  favicon_url text,
  og_default_image text,

  primary_color text,
  secondary_color text,
  accent_color text,
  font_heading text,
  font_body text,

  contact_email text,
  contact_phone text,
  whatsapp text,
  address_street text,
  address_zip text,
  address_city text,
  address_country text,
  geo_lat numeric,
  geo_lng numeric,

  opening_hours jsonb not null default '{}'::jsonb,
  social jsonb not null default '{}'::jsonb,

  google_analytics_id text,
  google_site_verification text,
  plausible_domain text,

  legal_impressum jsonb not null default '{}'::jsonb,  -- {"de": "...", "en": "..."}
  legal_privacy   jsonb not null default '{}'::jsonb,
  legal_terms     jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);
```

RLS + GRANTs:
- `GRANT SELECT ON public.site_settings TO anon, authenticated;`
- `GRANT ALL ON public.site_settings TO service_role;`
- RLS enabled; single policy: `for select using (true)`. No public write policies.
- Migration inserts one neutral default row (site_name = 'Template', country = 'AT', default_locale = 'de', enabled_locales = `{de,en}`) so a fresh clone renders.

## Database — `feature_flags` (full set seeded, sales-only enabled)

```sql
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

Seeded rows (in the same migration):

| key | enabled | description |
|---|---|---|
| sales | true | Sales listings |
| rentals | false | Rental listings |
| valuation | false | Property valuation tool |
| sold_archive | false | Archive of sold properties |
| team | false | Team / agent profiles |
| blog | false | Blog / news |
| area_pages | false | Neighborhood/area landing pages |
| testimonials | false | Customer testimonials |
| saved_search | false | User saved searches |
| mortgage_calc | false | Mortgage calculator |
| virtual_tours | false | Virtual tour embeds |
| crm_sync | false | External CRM sync |

RLS + GRANTs: `SELECT` to `anon, authenticated`; `ALL` to `service_role`; RLS on; `for select using (true)`.

## Theme system

- `styles.css` declares neutral defaults for every semantic token via existing `@theme inline` + `:root { … }`.
- `__root.tsx` server-side loader fetches `site_settings`, and renders a `<style>:root{ --primary: …; --secondary: …; --accent: …; --font-heading: …; --font-body: …; }</style>` inside `<head>` via the `head().scripts`/`links` API (using a raw style link or an inline style meta entry). Values come from typed columns (`primary_color`, `secondary_color`, `accent_color`, `font_heading`, `font_body`). No FOUC, no client roundtrip.
- Tailwind utilities (`bg-primary`, `text-foreground`, `font-heading`) resolve to those variables. Nothing in components references literal colors.

## i18n

- `i18next` + `react-i18next`, resources from `src/messages/{de,en}.json`.
- Locale = `$locale` URL segment; validated against `site_settings.enabled_locales`; invalid → redirect to `default_locale`.
- `<LocaleSwitcher />` renders one `<Link>` per enabled locale, preserving the current path.
- All UI text — including "Setup complete" — resolves through `t("setup.complete")`.

## Feature flag helper

`getFeatureFlags()` server fn returns `Record<string, { enabled: boolean; config: Record<string, unknown> }>`. Preloaded in `__root.tsx` loader; components consume via `useFeatureFlag(key)` hook backed by TanStack Query.

## File-size rule

Every new file ≤ 200 lines. Route files delegate to `/components/shared/`; business logic in `/lib/`.

## Not built now

- Listings schema/pages/search
- Admin panel content (gate exists, pages don't)
- Auth UI beyond Cloud-provided `/auth`
- Real per-country energy validators (stubs only)
- Client brand components (folder + README only)

## Verification checklist

- `build:dev` passes.
- `/` → `/de`.
- `/de` renders "Einrichtung abgeschlossen"; `/en` renders "Setup complete".
- Locale switcher works, updates `<html lang>`.
- **`curl -s $ORIGIN/de` raw HTML contains**: `<title>`, `meta[name=description]`, all `og:*` (including absolute `og:image` from `og_default_image`), `twitter:card`+`twitter:title`+`twitter:description`+`twitter:image`, `link[rel=canonical]` (absolute), and `link[rel=alternate][hreflang]` for `de`, `en`, `x-default`.
- View source shows `:root { --primary: …; … }` inlined before hydration.
- No literal company name, phone, hex color, or English/German string in any component file.
- `select * from feature_flags` returns 12 rows; only `sales` is enabled.

## Technical details

- **Cloud enablement**: first build-mode action calls `supabase--enable` so Supabase provisions before the migration runs.
- **`getSiteSettings()`** uses a server-side publishable Supabase client (not `supabaseAdmin`) with the `sb_`-key fetch shim from the server-functions knowledge, since the row is publicly readable.
- **`getRequestOrigin()`** reads `x-forwarded-proto` + `host` inside `createServerFn` so `og:image`/canonical/hreflang URLs are absolute at SSR time.
- **`buildHead()`** is pure and unit-testable; it never reads env or `window`.
- **Admin `_authenticated/route.tsx`** is Cloud-managed and appears when Cloud is enabled; this plan does not author it.

# Visual foundation: theme, hero, listing cards

Scope: theme tokens + fonts, the homepage hero, the listing card, the header logo, and the language default. Other sections, pages and the admin panel stay untouched.

## 1. Language: English first

- Update `site_settings` for this client: `default_locale = 'en'`, `enabled_locales = ['en','de']` (en first) — via a database change plus the same edit in the Waltner seed file so a fresh clone matches.
- Change the template fallback locale to `en` in `src/i18n/config.ts` (`DEFAULT_LOCALE`), so `/` and any locale-less path resolve to English.
- All new copy (hero line, CTA, card labels) is written in `src/messages/en.json`. `src/messages/de.json` gets the same keys with the English text as a placeholder, marked for translation later.
- The existing locale toggle already builds `/{locale}/...` from `enabled_locales`, so EN/DE switching keeps working with no change.

## 2. Palette and typography

Rewire the existing token layer in `src/styles.css` — no hardcoded colours in components, so the admin colour fields keep working.

- Named tokens: paper `#F6F3ED`, ink `#2A2622`, stone `#8A8175`, linen `#E8E3D9`, sage `#6B7259`, clay `#A67C6D`.
- Map them onto the semantic tokens the app already uses: background = paper, foreground = ink, muted-foreground = stone, muted/card/border = linen, primary = sage, accent = clay (used very sparingly).
- Sage appears only on links, one button variant, small accents and active states — never as a large filled block.
- Fonts: install `@fontsource-variable/fraunces`, `@fontsource-variable/inter` and `@fontsource/petit-formal-script`, importing the `latin-ext` subset explicitly in `src/styles.css` (top import block). Remove the Google Fonts `<link>` and the Instrument Serif / Work Sans references from `src/routes/__root.tsx`. No `font-optical-sizing: auto`.
- Tokens: `--font-heading` Fraunces, `--font-body` Inter, plus a new `--font-script` for the signature. Numbers keep the existing `.tabular-figures` utility on Inter.
- Dramatic type scale: hero headline `clamp(2.75rem, 8vw, 6rem)`, section headings a clear step smaller, body calm. Added as heading utilities so components stay thin.
- Because the seed sets `font_heading`/`font_body` in `site_settings`, those values are updated to the new families so the DB override matches the new defaults.

## 3. Signature motif

New `src/components/brand/Signature.tsx` (small): renders `site_settings.primary_agent_name` in the script font at a chosen size, with a `variant` for hero (on photo) and section (on paper). Falls back to nothing when no agent name is set. Used in the hero now; other placements come when those sections are reworked.

## 4. Logo

New `src/components/brand/BrandMark.tsx`: `site_settings.site_name` (or agent name) in Fraunces with a small wide-tracked `IMMOBILIEN`-style line beneath in Inter, the sub-line text coming from the translation file. Swapped into the header link in `PublicChrome.tsx` (single-line change there).

## 5. Hero rebuild

Rewrite `src/components/brand/Hero.tsx` and split it so each file stays small:
- Full-bleed warm architectural photograph (welcoming German family home with natural light) from a high-quality Unsplash URL, used as the default when `site_settings` has no hero image; a DB value always wins.
- Gradient limited to the lower text band for readability only.
- Fraunces headline from `home.hero_line` (rewritten warm English positioning line, e.g. "Your home in good hands"), the signature motif beneath, and one sage-filled CTA button linking to the listings page.
- The existing `property` and `broker` hero variants stay available but are reduced to thin wrappers over the shared layout pieces so all three share the new typography.

## 6. Listing card rebuild

Rewrite `src/components/brand/ListingCard.tsx`:
- Larger dominant photo, `4/3` (or `3/2`) crop, hairline linen border only, no shadow, near-square corners.
- Title in Fraunces; city and price in Inter with tabular figures.
- Status as small uppercase tracked type in stone, or sage for `coming_soon` — no coloured badge.
- Hover: image scales `1.03` over 500ms ease-out; nothing else moves.

## 7. Verification

- Playwright screenshot of `/en` hero and the featured card grid at desktop and mobile widths.
- Temporarily render "Häuser" and "Königstraße" in Fraunces and the script font, screenshot to confirm ä ö ü ß, then remove the test markup.
- Confirm `/` lands on English, the toggle reaches `/de`, and changing `primary_color` in site settings still re-tints the theme.

## Technical notes

- Colour tokens stay in `src/styles.css` under `@theme inline`; `ThemeStyleTag` continues to inject DB overrides, so admin colour changes still win over the defaults.
- No route or `lib` changes beyond the locale default and seed values; all visual work lives in `src/components/brand/`.
- New brand components stay well under 200 lines each; hero variants split into separate files if needed.

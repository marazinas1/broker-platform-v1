# /components/brand

Per-client design components live here. This folder is the ONLY place a fork
should modify visual/brand-specific components. Everything else in
`/components/shared`, `/lib`, `/routes` stays untouched across clones.

Fork workflow per new client:

1. Clone the repository.
2. Populate `site_settings` (colors, fonts, logo, contact info) — no code change.
3. Add/override components in this folder as needed (custom hero, footer, etc.).

Never hardcode client-specific values in `/components/shared` or `/routes`.

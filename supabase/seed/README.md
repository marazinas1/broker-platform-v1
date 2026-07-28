# Demo seed datasets

Each file in this folder is a self-contained demo dataset for one prospect
or client. Running a seed wipes the current `listings`, `listing_images`,
`listing_documents`, `listing_tours` and `inquiries` rows, updates the
single `site_settings` row in place, and inserts the demo content. Feature
flags, profiles, roles and permissions are left alone.

Only one seed is active at a time. Swap datasets wholesale.

## Available seeds

- `de-rheinberger.sql` — Immobilien Rheinberger, a Saarbrücken agency with
  twelve listings across sale, rent, and sold.
- `de-berg.sql` — Berg Immobilien, a fully fictional solo broker
  (Katharina Berg) in Püttlingen with eight sale-only listings between
  150k and 380k EUR. This is the dataset used for prospect demos: it
  contains no real person, business, domain or phone number.

## Swap in a new seed

1. Open the SQL file you want to run (for example `de-berg.sql`).
2. Execute it against the project database using whichever tool the current
   Lovable session provides for database migrations or inserts. Nothing in
   the app code needs to change.
3. Publish. The public site immediately reflects the new demo — the site
   name, contact details, branding colours, homepage layout, credibility
   stats, listings and images all come from these rows.

## Adding a new prospect

1. Copy the closest existing seed file and rename it (`de-<name>.sql`).
2. Edit the `UPDATE public.site_settings` block for the new client's brand,
   contact, colours, homepage sections and credibility stats.
3. Adjust the `INSERT INTO public.listings` block and image URLs to match
   the client's market. Keep the `id` values in a distinct UUID prefix so
   two seeds cannot collide during development.
4. Add an entry to the list above.

Never edit application code to customise a single client. If a demo needs a
change that a seed cannot express, the schema is missing a column — extend
`site_settings` or the relevant table with a migration first, then use the
new field from the seed.

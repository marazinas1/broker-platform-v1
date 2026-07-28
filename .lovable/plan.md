## Pass 1 — rebrand, copy, thin spots (images untouched)

Scope for this pass: steps 1, 3 and 4. Existing Unsplash hotlinks stay exactly as they are; `og_default_image` keeps its current Unsplash URL for now. No image generation, no storage uploads, no changes to the valuation page's hardcoded image. Those all move to pass 2.

### 1. Rebrand to Katharina Berg / Berg Immobilien

Rename `supabase/seed/de-waltner.sql` to `supabase/seed/de-berg.sql` and rewrite every identity field:

| Field | New value |
| --- | --- |
| site_name | Berg Immobilien |
| legal_name | Katharina Berg — Berg Immobilien |
| primary_agent_name | Katharina Berg |
| primary_agent_role | Immobilienmaklerin, Saarland |
| contact_email | kontakt@berg-immobilien-saar.de |
| contact_phone | +49 6898 5512 480 |
| address | Rathausstraße 24, 66346 Püttlingen |

Also rewritten: `credibility_heading` ("Warum Berg Immobilien"), `about_body`, `legal_impressum`, the seed file's header comment, and `supabase/seed/README.md` (which currently still names her).

The database currently holds the old identity, so the seed gets applied as part of this pass — the file alone changes nothing.

### 3. Listing copy at agency standard

All eight listings get rewritten German copy: a headline naming the property and its town, then 2–3 paragraphs covering Baujahr and Zustand, the room layout floor by floor, Ausstattung (Heizung, Fenster, Bäder, Bodenbeläge), and Lage/Umgebung — schools, shops, motorway access, walking distance to the Ortsmitte. Target 900–1400 characters each; today they run 119–732.

All eight also get four `content_sections` — Lage, Ausstattung, Grundriss, Energie. The two sold listings currently have zero sections and ~130-character descriptions, so they get the largest lift. Meta titles and descriptions rewritten per listing to match.

### 4. Remaining thin spots

- `about_body` and the Über-mich paragraphs written in the first person for Katharina Berg — her route into the profession, how she works, why she deliberately keeps few listings at a time.
- `opening_hours` set to a plausible solo-broker schedule, including appointment-only evenings.
- `geo_lat` / `geo_lng` pointed at the Püttlingen office so the contact-page map lands correctly.
- Energy blocks carried across intact and completed anywhere a field is thin, so DE validation shows full values on all eight listings.

### Verification before I stop

- `rg -i "waltner|dorothe|waltner-immobilien"` across the repo returns nothing.
- The same check run against every text column in the database — site_settings, listing titles, descriptions, meta fields, content_sections, image alt text — returns nothing.
- Fetch the rendered HTML of homepage, listings index, a detail page, Über mich and Kontakt and grep the markup and head tags for the old name.

Then I stop and hand it to you for a read-through. No publish in this pass — publishing waits until the imagery lands, unless you want the copy live sooner.

## Pass 2 (queued, not started)

~45 property photos at 5–6 per listing, a Katharina Berg portrait, and a homepage hero — generated as one coherent photographic set, uploaded to the `listing-images` bucket through the existing pipeline with variants, German alt text and blurhash. `og_default_image` repointed at the hero, and the valuation route's hardcoded Unsplash URL swapped out. Then the full page-by-page walkthrough and publish.

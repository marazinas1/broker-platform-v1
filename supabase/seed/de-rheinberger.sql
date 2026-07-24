-- =============================================================================
-- Demo seed: Immobilien Rheinberger — Saarbrücken, Germany (agency demo)
-- =============================================================================
-- This file replaces all listing / inquiry data with a realistic German
-- broker demo. Swap this file wholesale to spin up a different region or a
-- real client. The site_settings row is upserted-in-place (never deleted).
-- =============================================================================

-- Disable non-replica triggers so the seed can publish listings without an
-- authenticated user (the publish-permission trigger requires auth.uid()).
SET session_replication_role = 'replica';

-- ---------------------------------------------------------------------------
-- 0. Wipe existing demo data.
-- ---------------------------------------------------------------------------
DELETE FROM public.inquiries;
DELETE FROM public.listing_documents;
DELETE FROM public.listing_tours;
DELETE FROM public.listing_images;
DELETE FROM public.listings;

-- ---------------------------------------------------------------------------
-- 1. Site settings — one row per install, updated in place.
-- ---------------------------------------------------------------------------
UPDATE public.site_settings SET
  site_name        = 'Immobilien Rheinberger',
  legal_name       = 'Rheinberger Immobilien GmbH',
  country          = 'DE',
  default_locale   = 'de',
  enabled_locales  = ARRAY['de','en'],
  currency         = 'EUR',
  area_unit        = 'sqm',
  contact_email    = 'kontakt@rheinberger-immobilien.de',
  contact_phone    = '+49 681 9587 4210',
  whatsapp         = '+49 175 3384210',
  address_street   = 'Bahnhofstraße 47',
  address_zip      = '66111',
  address_city     = 'Saarbrücken',
  address_country  = 'Deutschland',
  geo_lat          = 49.2354,
  geo_lng          = 6.9969,
  primary_agent_name      = 'Kathrin Rheinberger',
  primary_agent_role      = 'Geschäftsführerin & Inhaberin',
  primary_agent_photo_url = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
  homepage_sections = '[
    {"key":"hero","enabled":true,"variant":"region"},
    {"key":"categories","enabled":true},
    {"key":"featured","enabled":true},
    {"key":"credibility","enabled":true},
    {"key":"sold","enabled":true},
    {"key":"about","enabled":true},
    {"key":"team","enabled":false},
    {"key":"areas","enabled":true},
    {"key":"contact","enabled":true}
  ]'::jsonb,
  credibility_stats = '[
    {"value":"22","label":{"de":"Jahre am Markt","en":"Years in business"}},
    {"value":"480+","label":{"de":"Vermittelte Objekte","en":"Properties sold"}},
    {"value":"IVD","label":{"de":"Mitglied im Verband","en":"IVD member"}},
    {"value":"4,9 / 5","label":{"de":"Google-Bewertungen","en":"Google reviews"}}
  ]'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. Listings.
-- ---------------------------------------------------------------------------
-- Photo pool (Unsplash) — reused across listings.
-- Note: variants store {large, medium, thumb, og} URLs.
-- ---------------------------------------------------------------------------

WITH photo(pid, url_base) AS (
  VALUES
    ('h1', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'),
    ('h2', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('h3', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),
    ('h4', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),
    ('h5', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'),
    ('h6', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),
    ('h7', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'),
    ('h8', 'https://images.unsplash.com/photo-1449844908441-8829872d2607'),
    ('h9', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'),
    ('h10','https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('h11','https://images.unsplash.com/photo-1524230572899-a752b3835840'),
    ('h12','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0'),
    ('h13','https://images.unsplash.com/photo-1580587771525-78b9dba3b914'),
    ('h14','https://images.unsplash.com/photo-1505692795793-20f543407193'),
    ('land','https://images.unsplash.com/photo-1500382017468-9049fed747ef')
)
SELECT 1;  -- reference only, actual images inserted below

INSERT INTO public.listings (
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at,
  is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period,
  additional_costs,
  living_area, plot_area, rooms, bedrooms, bathrooms, floor, total_floors,
  year_built, year_renovated,
  address_street, address_number, address_zip, address_city, address_region, address_country,
  geo_lat, geo_lng, geo_precision,
  energy, features, condition, heating_type,
  title, description, content_sections
) VALUES
-- 1. Detached house — Saarbrücken St. Arnual  (SALE, featured)
(
  '22222222-0000-0000-0000-000000000001', 'einfamilienhaus-saarbruecken-st-arnual-6-zimmer', 'RB-2024-001',
  'active','sale','house', now() - interval '18 days', NULL,
  true, true, 10,
  495000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  186, 612, 6, 4, 2, NULL, 2,
  1974, 2019,
  'Hangstraße', '18', '66119', 'Saarbrücken', 'Saarland', 'Deutschland',
  49.2205, 7.0106, 'approximate',
  '{"certificate_type":"Bedarfsausweis","final_energy":78,"energy_source":"Gas","efficiency_class":"C","year_built":1974}'::jsonb,
  ARRAY['garage','terrace','garden','fireplace','cellar'],
  'renovated','Gas-Brennwert',
  '{"de":"Charakterhaus in St. Arnual mit Blick über das Saartal","en":"A distinctive family home in St. Arnual with sweeping views over the Saar valley"}'::jsonb,
  '{"de":"Wenige Minuten oberhalb der Saarbrücker Innenstadt gelegen, verbindet dieses freistehende Einfamilienhaus die ruhige Wohnlage von St. Arnual mit einer bemerkenswerten Fernsicht bis in die Weinberge auf französischer Seite. Das Objekt wurde 2019 grundlegend energetisch saniert und präsentiert sich heute mit einer klaren, zurückhaltenden Formensprache.\n\nÜber zwei Wohnebenen verteilen sich sechs Zimmer, ein offener Wohn-Essbereich mit Kaminofen und eine Küche mit Zugang auf die Süd-West-Terrasse. Vier Schlafzimmer, zwei Bäder und ein separater Hauswirtschaftsraum bieten Raum für eine Familie oder für hybrides Arbeiten. Der 612 m² große Garten ist gewachsen, gepflegt und uneinsehbar.\n\nSt. Arnual gilt seit Jahren als eine der begehrtesten Wohnlagen der Landeshauptstadt: Wochenmarkt, Stiftskirche, Grundschule und ein feines Café-Angebot sind fußläufig erreichbar, die A620 in wenigen Minuten. Wir empfehlen dieses Haus Familien und Doppelverdienern, die eine gehobene, ruhige Wohnadresse suchen, ohne auf urbane Nähe zu verzichten.","en":"Perched a few minutes above Saarbrücken city centre, this detached family home combines the quiet residential feel of St. Arnual with a remarkable outlook towards the vineyards on the French side of the border. The property was comprehensively refurbished in 2019 and today reads as a restrained, contemporary home.\n\nSix rooms are arranged across two levels, together with an open living-and-dining area with a wood-burning stove and a kitchen opening on to the south-west terrace. Four bedrooms, two bathrooms and a separate utility room support family life or dual home offices. The mature 612 m² garden is landscaped and private.\n\nSt. Arnual has been one of the capital''s most sought-after neighbourhoods for years: weekly market, Stiftskirche church, primary school and a well-curated café scene are within walking distance, and the A620 motorway is minutes away. We recommend this house to families and dual-income households looking for an established, quiet address without losing city proximity."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Grundlegend saniert 2019","Süd-West-Terrasse mit Fernblick","Kaminofen im Wohnbereich","Doppelgarage","Uneinsehbarer Garten 612 m²"],"en":["Fully refurbished 2019","South-west terrace with panoramic view","Wood-burning stove in living room","Double garage","Private 612 m² garden"]}},
    {"key":"property_info","items":{"de":["6 Zimmer auf zwei Ebenen","186 m² Wohnfläche","4 Schlafzimmer, 2 Bäder","Separater Hauswirtschaftsraum","Vollkeller"],"en":["6 rooms across two levels","186 m² living area","4 bedrooms, 2 bathrooms","Separate utility room","Full cellar"]}},
    {"key":"building_info","items":{"de":["Baujahr 1974, Sanierung 2019","Gas-Brennwertheizung","Dreifachverglasung","Dachdämmung 2019 erneuert","Energieklasse C"],"en":["Built 1974, refurbished 2019","Gas condensing boiler","Triple glazing","Roof insulation replaced 2019","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["Grundschule in 5 Gehminuten","Wochenmarkt am Stiftsplatz","A620 in 4 Autominuten","Hauptbahnhof in 10 Minuten","Naturschutzgebiet St. Arnualer Wiesen"],"en":["Primary school within 5 min walk","Weekly market on Stiftsplatz","A620 motorway 4 min by car","Central station in 10 min","St. Arnualer Wiesen nature reserve"]}}
  ]'::jsonb
),
-- 2. Detached house — Riegelsberg
(
  '22222222-0000-0000-0000-000000000002', 'einfamilienhaus-riegelsberg-5-zimmer', 'RB-2024-002',
  'active','sale','house', now() - interval '12 days', NULL,
  true, false, 20,
  385000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  148, 480, 5, 3, 2, NULL, 2,
  1998, 2016,
  'Kirchenstraße', '9', '66292', 'Riegelsberg', 'Saarland', 'Deutschland',
  49.2977, 6.9410, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":112,"energy_source":"Öl","efficiency_class":"D","year_built":1998}'::jsonb,
  ARRAY['garage','terrace','garden','cellar','fitted_kitchen'],
  'good','Öl-Zentralheizung',
  '{"de":"Freistehendes Einfamilienhaus in ruhiger Wohnlage von Riegelsberg","en":"Detached family home in a quiet residential street in Riegelsberg"}'::jsonb,
  '{"de":"Das Haus wurde 1998 in solider Massivbauweise errichtet und 2016 im Innenbereich modernisiert. Fünf Zimmer, ein großzügiges Wohnzimmer mit offenem Übergang zur Küche und ein Wintergarten mit Blick in den Garten prägen das Erdgeschoss.\n\nIm Obergeschoss liegen drei Schlafzimmer und das Familienbad mit bodengleicher Dusche. Der ausgebaute Spitzboden dient heute als Arbeitszimmer. Der 480 m² große Garten grenzt an eine Streuobstwiese, die nicht bebaut werden darf.\n\nRiegelsberg bietet komplette Nahversorgung, zwei Grundschulen und die Saarbahnhaltestelle Rathaus mit 20-Minuten-Takt in die Landeshauptstadt. Ein Objekt für Familien, die außerhalb wohnen möchten, ohne den Anschluss zu verlieren.","en":"Solidly built in 1998 and modernised internally in 2016. Five rooms; the ground floor offers a generous living room opening on to the kitchen, and a conservatory looking on to the garden.\n\nThe first floor holds three bedrooms and the family bathroom with a walk-in shower. The finished attic currently serves as a study. The 480 m² garden borders on protected orchard land that cannot be built on.\n\nRiegelsberg has full local amenities, two primary schools and the Saarbahn light-rail stop Rathaus with a 20-minute service into the capital. A house for families who want to live outside the city without losing connection."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Freistehend, Massivbauweise","Wintergarten mit Gartenblick","Ausgebauter Spitzboden","Garten grenzt an Streuobstwiese","Saarbahn-Anschluss in 8 Minuten"],"en":["Detached, solid construction","Conservatory overlooking garden","Finished attic","Garden bordering orchard land","Saarbahn light rail 8 min away"]}},
    {"key":"property_info","items":{"de":["5 Zimmer","148 m² Wohnfläche","3 Schlafzimmer, 2 Bäder","Einbauküche verbleibt","Doppelgarage"],"en":["5 rooms","148 m² living area","3 bedrooms, 2 bathrooms","Fitted kitchen included","Double garage"]}},
    {"key":"building_info","items":{"de":["Baujahr 1998, modernisiert 2016","Öl-Zentralheizung","Isolierverglasung","Vollkeller","Energieklasse D"],"en":["Built 1998, modernised 2016","Oil central heating","Double glazing","Full cellar","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Grundschule 400 m","Rewe und Bäckerei fußläufig","Saarbrücken in 15 Autominuten","Naherholung Köllertal","Kita direkt am Ort"],"en":["Primary school 400 m","Supermarket and bakery walkable","Saarbrücken in 15 min drive","Köllertal recreation area","Nursery in the neighbourhood"]}}
  ]'::jsonb
),
-- 3. Detached house — Sulzbach
(
  '22222222-0000-0000-0000-000000000003', 'einfamilienhaus-sulzbach-4-zimmer', 'RB-2024-003',
  'active','sale','house', now() - interval '31 days', NULL,
  false, false, 30,
  245000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  112, 320, 4, 3, 1, NULL, 2,
  1962, 2008,
  'Bergstraße', '22', '66280', 'Sulzbach', 'Saarland', 'Deutschland',
  49.2986, 7.0510, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":148,"energy_source":"Gas","efficiency_class":"E","year_built":1962}'::jsonb,
  ARRAY['garden','cellar','garage'],
  'good','Gas-Zentralheizung',
  '{"de":"Solides Einfamilienhaus mit gepflegtem Garten in Sulzbach","en":"Well-kept detached home with mature garden in Sulzbach"}'::jsonb,
  '{"de":"Ein bezugsfertiges Haus aus den frühen sechziger Jahren in einer ruhigen, gewachsenen Wohnstraße. Der Vorbesitzer hat kontinuierlich instand gehalten; die Küche wurde 2019 erneuert.\n\nVier Zimmer, ein Bad mit Wanne und Dusche sowie ein Vollkeller mit Werkstatt und Waschküche. Das Grundstück umfasst 320 m² mit reifem Baumbestand.\n\nSulzbach bietet ÖPNV-Anschluss über die Saarbahn und komplette Infrastruktur. Für Ersterwerber und junge Familien eine realistische Alternative zu höheren Preislagen in Saarbrücken.","en":"A ready-to-move-in house from the early 1960s on a quiet, established residential street. The previous owner maintained it continuously; the kitchen was renewed in 2019.\n\nFour rooms, one bathroom with tub and shower, and a full cellar with workshop and laundry. The 320 m² plot features mature trees.\n\nSulzbach offers Saarbahn public transport and full local infrastructure. A realistic alternative to higher price brackets in Saarbrücken for first-time buyers and young families."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Bezugsfertig, gepflegt","Küche 2019 neu","Reifer Garten mit Baumbestand","Ruhige Wohnstraße"],"en":["Move-in ready, well-kept","Kitchen renewed 2019","Mature garden with trees","Quiet residential street"]}},
    {"key":"property_info","items":{"de":["4 Zimmer","112 m² Wohnfläche","3 Schlafzimmer, 1 Bad","Vollkeller mit Werkstatt","Einzelgarage"],"en":["4 rooms","112 m² living area","3 bedrooms, 1 bathroom","Full cellar with workshop","Single garage"]}},
    {"key":"building_info","items":{"de":["Baujahr 1962, Modernisierungen bis 2019","Gas-Zentralheizung","Isolierverglasung 2008","Fassade 2015 gestrichen","Energieklasse E"],"en":["Built 1962, updates until 2019","Gas central heating","Double glazing installed 2008","Facade repainted 2015","Efficiency class E"]}},
    {"key":"surroundings","items":{"de":["Saarbahn-Haltestelle 600 m","Grundschule fußläufig","Wochenmarkt samstags","A623 in 3 Minuten","Wanderwege Fischbachtal"],"en":["Saarbahn stop 600 m","Primary school walkable","Weekly market on Saturdays","A623 in 3 min","Fischbachtal hiking trails"]}}
  ]'::jsonb
),
-- 4. Apartment — Saarbrücken Rotenbühl (SALE, featured)
(
  '22222222-0000-0000-0000-000000000004', 'eigentumswohnung-saarbruecken-rotenbuehl-4-zimmer', 'RB-2024-004',
  'active','sale','apartment', now() - interval '8 days', NULL,
  true, false, 15,
  285000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig","hausgeld":"245 EUR / Monat"}'::jsonb,
  96, NULL, 4, 2, 1, 2, 4,
  1958, 2020,
  'Rotenbühler Weg', '31', '66123', 'Saarbrücken', 'Saarland', 'Deutschland',
  49.2385, 7.0055, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":95,"energy_source":"Fernwärme","efficiency_class":"C","year_built":1958}'::jsonb,
  ARRAY['balcony','elevator','cellar','fitted_kitchen'],
  'renovated','Fernwärme',
  '{"de":"Sanierte 4-Zimmer-Wohnung mit Balkon am Rotenbühl","en":"Renovated four-room apartment with balcony in Rotenbühl"}'::jsonb,
  '{"de":"Diese Eigentumswohnung liegt im zweiten Obergeschoss eines gepflegten Sechs-Parteien-Hauses am Rotenbühl, einer der ruhigsten und grünsten Adressen der Innenstadt. Die Wohnung wurde 2020 komplett saniert: neue Elektrik, neue Sanitärstränge, geölter Eichenparkett und eine hochwertige Einbauküche.\n\n96 m² Wohnfläche verteilen sich auf einen großen Wohn-Ess-Bereich mit Zugang zum Süd-Balkon, zwei Schlafzimmer, ein Arbeitszimmer und ein modernes Tageslichtbad. Ein Aufzug und ein separater Kellerraum gehören zur Einheit.\n\nDer Rotenbühl ist in wenigen Gehminuten mit der Uni, der Uniklinik und dem Deutsch-Französischen Garten verbunden. Wir empfehlen die Wohnung Paaren, kleinen Familien und Kapitalanlegern mit langfristigem Horizont.","en":"This condominium is on the second floor of a well-maintained six-unit building in Rotenbühl, one of the greenest and quietest addresses within the city. The apartment was fully refurbished in 2020: new electrics, new plumbing risers, oiled oak parquet and a premium fitted kitchen.\n\n96 m² of living area is arranged as a large living-and-dining space opening on to the south-facing balcony, two bedrooms, a study and a modern day-lit bathroom. A lift and a private cellar storage unit belong to the flat.\n\nRotenbühl is minutes on foot from the university, the university hospital and the Deutsch-Französischer Garten park. Suited to couples, small families and long-horizon investors."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Komplettsanierung 2020","Süd-Balkon","Geölter Eichenparkett","Aufzug im Haus","Ruhige Innenstadtlage"],"en":["Fully refurbished 2020","South-facing balcony","Oiled oak parquet","Lift in building","Quiet inner-city location"]}},
    {"key":"property_info","items":{"de":["4 Zimmer, 2 Schlafzimmer","96 m² Wohnfläche","2. Obergeschoss","Modernes Tageslichtbad","Kellerraum inklusive"],"en":["4 rooms, 2 bedrooms","96 m² living area","2nd floor","Modern day-lit bathroom","Cellar storage included"]}},
    {"key":"building_info","items":{"de":["6-Parteien-Haus, Baujahr 1958","Fernwärme","Aufzug","Fassade 2019 gedämmt","Energieklasse C"],"en":["6-unit building, built 1958","District heating","Lift","Facade insulated 2019","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["Uni-Campus in 8 Gehminuten","Deutsch-Französischer Garten","Straßenbahnlinie 108","Rewe und Denns direkt am Platz","Uniklinik in 10 Minuten"],"en":["University campus 8 min walk","Deutsch-Französischer Garten park","Bus route 108","Supermarket and organic grocer nearby","University hospital 10 min"]}}
  ]'::jsonb
),
-- 5. Apartment — St. Ingbert
(
  '22222222-0000-0000-0000-000000000005', 'eigentumswohnung-st-ingbert-3-zimmer', 'RB-2024-005',
  'active','sale','apartment', now() - interval '22 days', NULL,
  false, false, 25,
  189000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig","hausgeld":"185 EUR / Monat"}'::jsonb,
  78, NULL, 3, 2, 1, 1, 3,
  1985, 2014,
  'Ensheimer Straße', '54', '66386', 'St. Ingbert', 'Saarland', 'Deutschland',
  49.2760, 7.1145, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":118,"energy_source":"Gas","efficiency_class":"D","year_built":1985}'::jsonb,
  ARRAY['balcony','cellar','parking'],
  'good','Gas-Zentralheizung',
  '{"de":"Helle 3-Zimmer-Wohnung mit Balkon und Stellplatz in St. Ingbert","en":"Bright three-room apartment with balcony and parking space in St. Ingbert"}'::jsonb,
  '{"de":"Die Wohnung im ersten Obergeschoss eines Sechsparteienhauses wurde 2014 modernisiert. Neuer Wohnungseingangsbereich, neues Bad und laminierter Boden im Wohnbereich.\n\nDrei Zimmer, ein Wannenbad mit Fenster und eine separate Küche mit Balkonzugang. Der Balkon ist nach Westen ausgerichtet. Ein Kellerraum und ein Außenstellplatz gehören zur Einheit.\n\nSt. Ingbert bietet gute Anbindung an die A6, das Fußgängerkerngebiet ist in wenigen Gehminuten erreichbar. Geeignet für Kapitalanleger — Wohnungen in dieser Größe werden hier zuverlässig vermietet.","en":"This first-floor flat in a six-unit building was modernised in 2014. New entrance area, new bathroom and laminate flooring in the living area.\n\nThree rooms, a windowed bathroom with tub and a separate kitchen with balcony access. The balcony faces west. A cellar unit and an outdoor parking space are included.\n\nSt. Ingbert has good access to the A6 motorway and the pedestrian core is a short walk away. A dependable investment property — flats of this size rent reliably here."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Modernisiert 2014","West-Balkon","Außenstellplatz inklusive","Solide Vermietbarkeit"],"en":["Modernised 2014","West-facing balcony","Outdoor parking included","Reliable rental demand"]}},
    {"key":"property_info","items":{"de":["3 Zimmer, 2 Schlafzimmer","78 m² Wohnfläche","1. Obergeschoss von 3","Wannenbad mit Fenster","Kellerraum"],"en":["3 rooms, 2 bedrooms","78 m² living area","1st floor of 3","Windowed bathroom with tub","Cellar storage"]}},
    {"key":"building_info","items":{"de":["Baujahr 1985","Gas-Zentralheizung","Isolierverglasung","Kein Aufzug","Energieklasse D"],"en":["Built 1985","Gas central heating","Double glazing","No lift","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Fußgängerzone 700 m","Bahnhof St. Ingbert 900 m","A6-Anschluss 3 Minuten","Grundschule Rohrbach"],"en":["Pedestrian zone 700 m","St. Ingbert station 900 m","A6 access 3 min","Rohrbach primary school"]}}
  ]'::jsonb
),
-- 6. Apartment — Völklingen
(
  '22222222-0000-0000-0000-000000000006', 'eigentumswohnung-voelklingen-3-zimmer', 'RB-2024-006',
  'active','sale','apartment', now() - interval '40 days', NULL,
  false, false, 40,
  129000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig","hausgeld":"165 EUR / Monat"}'::jsonb,
  72, NULL, 3, 2, 1, 3, 4,
  1972, 2010,
  'Kühlweinstraße', '11', '66333', 'Völklingen', 'Saarland', 'Deutschland',
  49.2510, 6.8580, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":135,"energy_source":"Gas","efficiency_class":"D","year_built":1972}'::jsonb,
  ARRAY['balcony','cellar','elevator'],
  'good','Gas-Zentralheizung',
  '{"de":"Bezugsfertige 3-Zimmer-Wohnung mit Loggia in zentraler Lage","en":"Move-in ready three-room apartment with loggia in a central location"}'::jsonb,
  '{"de":"Die Wohnung liegt im dritten Obergeschoss mit Aufzug und wurde 2010 modernisiert. Ein großer Wohnraum mit Loggia, zwei Schlafzimmer und ein modernes Wannenbad.\n\nDas Objekt eignet sich als Kapitalanlage — die Wohnung wurde in den vergangenen Jahren durchgehend vermietet und wird aktuell unvermietet übergeben. Kellerraum und Fahrradkeller gehören zur Einheit.\n\nVölklingen ist mit S-Bahn in 12 Minuten in Saarbrücken. Preislich weiterhin einer der attraktivsten Standorte im Regionalverband.","en":"The apartment is on the third floor with lift access and was modernised in 2010. A large living room with loggia, two bedrooms and a modern bathroom with tub.\n\nThe property is well suited as an investment — it has been continuously rented in recent years and is handed over vacant. A cellar unit and bicycle storage are included.\n\nVölklingen is 12 minutes from Saarbrücken by S-Bahn train and remains one of the most affordable submarkets in the regional area."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["3. OG mit Aufzug","Loggia zum Innenhof","Modernisiert 2010","Attraktives Preisniveau"],"en":["3rd floor with lift","Loggia facing courtyard","Modernised 2010","Attractive price level"]}},
    {"key":"property_info","items":{"de":["3 Zimmer","72 m² Wohnfläche","2 Schlafzimmer, 1 Bad","Aufzug","Fahrradkeller"],"en":["3 rooms","72 m² living area","2 bedrooms, 1 bathroom","Lift","Bicycle storage"]}},
    {"key":"building_info","items":{"de":["Baujahr 1972","Gas-Zentralheizung","Isolierverglasung","Energieklasse D"],"en":["Built 1972","Gas central heating","Double glazing","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Bahnhof Völklingen 800 m","Weltkulturerbe Völklinger Hütte","Innenstadt fußläufig","A620 in 2 Minuten"],"en":["Völklingen station 800 m","UNESCO Ironworks nearby","Town centre walkable","A620 in 2 min"]}}
  ]'::jsonb
),
-- 7. Building plot — Püttlingen
(
  '22222222-0000-0000-0000-000000000007', 'baugrundstueck-puettlingen-680-qm', 'RB-2024-007',
  'active','sale','land', now() - interval '5 days', NULL,
  false, false, 50,
  145000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  NULL, 680, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL,
  'Am Sandberg', NULL, '66346', 'Püttlingen', 'Saarland', 'Deutschland',
  49.2830, 6.8850, 'approximate',
  '{}'::jsonb,
  ARRAY['sunny_plot'],
  NULL, NULL,
  '{"de":"Sonniges Baugrundstück in ruhiger Wohnlage von Püttlingen","en":"Sunny building plot in a quiet residential setting in Püttlingen"}'::jsonb,
  '{"de":"Ein 680 m² großes, leicht nach Süden geneigtes Grundstück in einer bestehenden Ein- und Zweifamilienhausbebauung. Baurecht besteht nach § 34 BauGB — vergleichbare Bauvorhaben in der Nachbarschaft wurden zuletzt genehmigt.\n\nDas Grundstück ist voll erschlossen. Ein aktuelles Bodengutachten liegt vor und kann Interessenten nach Unterzeichnung einer Vertraulichkeitsvereinbarung übergeben werden.\n\nPüttlingen bietet vollständige Infrastruktur und mit der Saarbahn eine 25-Minuten-Verbindung nach Saarbrücken.","en":"A 680 m² plot with a gentle southern slope, situated in an established neighbourhood of single- and two-family homes. Building rights follow § 34 of the German Building Code — comparable projects nearby have recently been approved.\n\nThe plot is fully connected to services. A current soil report is available on request following signature of a confidentiality agreement.\n\nPüttlingen offers full infrastructure and, via the Saarbahn light rail, a 25-minute connection to Saarbrücken."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Süd-geneigte Lage","Voll erschlossen","Baurecht nach § 34 BauGB","Bodengutachten vorhanden"],"en":["Southern slope","Fully serviced","Building rights per § 34","Soil report available"]}},
    {"key":"property_info","items":{"de":["680 m² Grundstücksfläche","Wohnbebauung ringsum","Zufahrt vorhanden"],"en":["680 m² plot area","Residential surroundings","Access road in place"]}},
    {"key":"building_info","items":{"de":["Kein Bebauungsplan — § 34","Höchstens zweigeschossig üblich"],"en":["No zoning plan — § 34 applies","Two-storey buildings typical"]}},
    {"key":"surroundings","items":{"de":["Grundschule 500 m","Saarbahn-Haltestelle 700 m","Wald in Gehweite","Saarbrücken in 20 Autominuten"],"en":["Primary school 500 m","Saarbahn stop 700 m","Forest walkable","Saarbrücken 20 min drive"]}}
  ]'::jsonb
),
-- 8. Rental apartment — Saarbrücken Nauwieser Viertel
(
  '22222222-0000-0000-0000-000000000008', 'mietwohnung-saarbruecken-nauwieser-viertel-2-zimmer', 'RB-2024-008',
  'active','rent','apartment', now() - interval '3 days', NULL,
  false, false, 60,
  850, false, 'month', '{"nebenkosten":"180 EUR / Monat","kaution":"2 Monatsmieten"}'::jsonb,
  62, NULL, 2, 1, 1, 2, 4,
  1902, 2018,
  'Nauwieser Straße', '27', '66111', 'Saarbrücken', 'Saarland', 'Deutschland',
  49.2338, 7.0055, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":102,"energy_source":"Gas","efficiency_class":"C","year_built":1902}'::jsonb,
  ARRAY['fitted_kitchen','high_ceilings','wooden_floors'],
  'renovated','Gas-Etagenheizung',
  '{"de":"Charmante 2-Zimmer-Altbauwohnung im Nauwieser Viertel","en":"Charming two-room period apartment in the Nauwieser quarter"}'::jsonb,
  '{"de":"Diese Altbauwohnung im zweiten Stock eines Gründerzeithauses wurde 2018 sorgfältig saniert. Originaler Dielenboden, hohe Decken mit Stuck, eine helle Wohnküche und ein modernes Duschbad.\n\nDas Nauwieser Viertel ist Saarbrückens lebendigstes Innenstadtquartier — Cafés, Bars, kleine Läden und der Nauwieser Platz bilden ein soziales Zentrum. Nichts für Ruhesuchende, viel für Menschen, die urbanes Leben schätzen.\n\nDie Wohnung wird provisionsfrei vermietet. Nichtraucherhaushalt, ohne Haustiere.","en":"This period apartment on the second floor of a Wilhelminian townhouse was carefully renovated in 2018. Original board flooring, high stuccoed ceilings, a bright eat-in kitchen and a modern shower room.\n\nThe Nauwieser quarter is Saarbrücken''s most lively inner-city neighbourhood — cafés, bars, small shops and the Nauwieser square form its social heart. Not for those looking for silence; ideal for people who value urban life.\n\nOffered without agency fee. Non-smoking household, no pets."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Sanierter Altbau 2018","Originaler Dielenboden","Stuckdecken","Provisionsfrei"],"en":["Renovated period building 2018","Original board flooring","Stuccoed ceilings","No agency fee"]}},
    {"key":"property_info","items":{"de":["2 Zimmer","62 m² Wohnfläche","2. Obergeschoss","Wohnküche","Duschbad"],"en":["2 rooms","62 m² living area","2nd floor","Eat-in kitchen","Shower room"]}},
    {"key":"building_info","items":{"de":["Baujahr 1902, saniert 2018","Gas-Etagenheizung","Isolierverglasung mit Kastenfenster-Optik","Energieklasse C"],"en":["Built 1902, renovated 2018","Gas boiler per unit","Double glazing in period-style frames","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["Nauwieser Platz 100 m","Hauptbahnhof 15 Gehminuten","St. Johanner Markt 8 Minuten","Uni per Bus in 12 Minuten"],"en":["Nauwieser square 100 m","Central station 15 min walk","St. Johanner market 8 min","University by bus in 12 min"]}}
  ]'::jsonb
),
-- 9. Rental house — Riegelsberg
(
  '22222222-0000-0000-0000-000000000009', 'mietshaus-riegelsberg-4-zimmer', 'RB-2024-009',
  'active','rent','house', now() - interval '10 days', NULL,
  false, false, 65,
  1100, false, 'month', '{"nebenkosten":"260 EUR / Monat","kaution":"3 Monatskaltmieten"}'::jsonb,
  128, 380, 4, 3, 1, NULL, 2,
  1978, 2015,
  'Rosenstraße', '5', '66292', 'Riegelsberg', 'Saarland', 'Deutschland',
  49.3010, 6.9445, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":128,"energy_source":"Gas","efficiency_class":"D","year_built":1978}'::jsonb,
  ARRAY['garage','garden','terrace','cellar'],
  'good','Gas-Zentralheizung',
  '{"de":"Freistehendes Reihenendhaus zur Miete mit Garten und Garage","en":"Detached end-of-terrace house to rent with garden and garage"}'::jsonb,
  '{"de":"Vier Zimmer auf zwei Ebenen mit Süd-Terrasse und einem 380 m² großen Garten. Küche mit Einbaugeräten, Familienbad und ein separates Gäste-WC.\n\nDie Miete richtet sich an eine Familie mit langfristiger Perspektive. Nichtraucherhaushalt bevorzugt, Haustiere nach Absprache.","en":"Four rooms across two levels with a south-facing terrace and a 380 m² garden. Fitted kitchen, family bathroom and separate guest WC.\n\nOffered to a family looking for a long-term rental. Non-smoking household preferred, pets by arrangement."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Freistehendes Reihenendhaus","Süd-Terrasse","Garten 380 m²","Einzelgarage"],"en":["End-of-terrace, detached feel","South-facing terrace","380 m² garden","Single garage"]}},
    {"key":"property_info","items":{"de":["4 Zimmer","128 m² Wohnfläche","3 Schlafzimmer, 1 Bad","Gäste-WC","Einbauküche"],"en":["4 rooms","128 m² living area","3 bedrooms, 1 bathroom","Guest WC","Fitted kitchen"]}},
    {"key":"building_info","items":{"de":["Baujahr 1978, modernisiert 2015","Gas-Zentralheizung","Isolierverglasung","Energieklasse D"],"en":["Built 1978, modernised 2015","Gas central heating","Double glazing","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Grundschule 300 m","Saarbahn-Anschluss","Wanderwege Köllertal"],"en":["Primary school 300 m","Saarbahn light rail","Köllertal hiking trails"]}}
  ]'::jsonb
),
-- 10. Coming soon — St. Ingbert
(
  '22222222-0000-0000-0000-00000000000a', 'stadthaus-st-ingbert-5-zimmer-in-vorbereitung', 'RB-2024-010',
  'coming_soon','sale','house', now() - interval '2 days', NULL,
  false, true, 70,
  NULL, true, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  162, 410, 5, 3, 2, NULL, 2,
  1965, 2022,
  'Bahnhofstraße', '88', '66386', 'St. Ingbert', 'Saarland', 'Deutschland',
  49.2782, 7.1150, 'approximate',
  '{"certificate_type":"Bedarfsausweis","final_energy":88,"energy_source":"Gas","efficiency_class":"C","year_built":1965}'::jsonb,
  ARRAY['garage','garden','terrace','cellar'],
  'renovated','Gas-Brennwert',
  '{"de":"Elegantes Stadthaus in St. Ingbert — Vermarktung in Vorbereitung","en":"Elegant townhouse in St. Ingbert — going to market shortly"}'::jsonb,
  '{"de":"Ein durchgehend sanierter Familiensitz nahe der Innenstadt. Fünf Zimmer, zwei Bäder, hochwertige Ausstattung. Fotos, Grundrisse und Preis werden Anfang der kommenden Woche freigegeben.\n\nInteressenten können sich bereits vormerken lassen — Besichtigungen ausschließlich nach terminlicher Abstimmung.","en":"A comprehensively refurbished family residence near the town centre. Five rooms, two bathrooms, high-end finishes. Photos, floor plans and price will be released early next week.\n\nInterested parties may register in advance — viewings strictly by appointment."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Vollständig saniert 2022","Ruhige Zentrumslage","Vormerkung möglich"],"en":["Comprehensively refurbished 2022","Quiet central location","Advance registration open"]}},
    {"key":"property_info","items":{"de":["5 Zimmer","162 m² Wohnfläche","3 Schlafzimmer, 2 Bäder","Einzelgarage"],"en":["5 rooms","162 m² living area","3 bedrooms, 2 bathrooms","Single garage"]}},
    {"key":"building_info","items":{"de":["Baujahr 1965, Sanierung 2022","Gas-Brennwertheizung","Dreifachverglasung","Energieklasse C"],"en":["Built 1965, refurbished 2022","Gas condensing boiler","Triple glazing","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["Fußgängerzone in 6 Gehminuten","Bahnhof St. Ingbert 900 m","A6-Anschluss 4 Minuten"],"en":["Pedestrian zone 6 min walk","Station 900 m","A6 access 4 min"]}}
  ]'::jsonb
),
-- 11. Sold — Völklingen (4 months ago)
(
  '22222222-0000-0000-0000-00000000000b', 'einfamilienhaus-voelklingen-verkauft', 'RB-2023-055',
  'sold','sale','house', now() - interval '9 months', now() - interval '4 months',
  false, false, 100,
  329000, false, 'total', '{}'::jsonb,
  138, 420, 5, 3, 2, NULL, 2,
  1988, 2012,
  NULL, NULL, '66333', 'Völklingen', 'Saarland', 'Deutschland',
  49.2495, 6.8620, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":124,"energy_source":"Gas","efficiency_class":"D","year_built":1988}'::jsonb,
  ARRAY['garage','garden','terrace'],
  'good','Gas-Zentralheizung',
  '{"de":"Einfamilienhaus in Völklingen — erfolgreich vermittelt","en":"Single-family home in Völklingen — successfully sold"}'::jsonb,
  '{"de":"Ein freistehendes Haus in einer ruhigen Wohnstraße, das wir innerhalb von sechs Wochen an eine junge Familie aus dem Regionalverband vermitteln konnten","en":"A detached house on a quiet residential street, sold within six weeks to a young family from the regional district"}'::jsonb,
  '[]'::jsonb
),
-- 12. Sold — Saarbrücken (2 months ago)
(
  '22222222-0000-0000-0000-00000000000c', 'eigentumswohnung-saarbruecken-triller-verkauft', 'RB-2024-020',
  'sold','sale','apartment', now() - interval '5 months', now() - interval '2 months',
  false, false, 110,
  268000, false, 'total', '{}'::jsonb,
  84, NULL, 3, 2, 1, 4, 5,
  1965, 2019,
  NULL, NULL, '66117', 'Saarbrücken', 'Saarland', 'Deutschland',
  49.2321, 6.9905, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":98,"energy_source":"Fernwärme","efficiency_class":"C","year_built":1965}'::jsonb,
  ARRAY['balcony','elevator','cellar'],
  'renovated','Fernwärme',
  '{"de":"Sanierte Eigentumswohnung am Triller — erfolgreich vermittelt","en":"Refurbished condominium in Triller — successfully sold"}'::jsonb,
  '{"de":"Eine helle Wohnung mit Süd-West-Balkon, die wir off-market an einen langjährigen Interessenten unserer Kartei vermittelt haben","en":"A bright apartment with south-west balcony, sold off-market to a long-standing candidate from our register"}'::jsonb,
  '[]'::jsonb
);

-- ---------------------------------------------------------------------------
-- 3. Listing images.
-- ---------------------------------------------------------------------------
INSERT INTO public.listing_images (
  listing_id, storage_path, variants, is_primary, sort_order, processing_status, width, height, alt_text
)
SELECT
  l.id::uuid,
  'seed/' || l.slug || '/' || img.n::text || '.jpg',
  jsonb_build_object(
    'large',  jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=1600&q=80'),
    'medium', jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=900&q=80'),
    'thumb',  jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=480&q=70'),
    'og',     jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=1200&h=630&q=80')
  ),
  img.n = 1,
  img.n - 1,
  'done',
  1600, 1067,
  '{}'::jsonb
FROM public.listings l
JOIN LATERAL (
  VALUES
    ('22222222-0000-0000-0000-000000000001'::uuid, 1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'),
    ('22222222-0000-0000-0000-000000000001'::uuid, 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('22222222-0000-0000-0000-000000000001'::uuid, 3, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),
    ('22222222-0000-0000-0000-000000000001'::uuid, 4, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'),
    ('22222222-0000-0000-0000-000000000001'::uuid, 5, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),
    ('22222222-0000-0000-0000-000000000001'::uuid, 6, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),

    ('22222222-0000-0000-0000-000000000002'::uuid, 1, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0'),
    ('22222222-0000-0000-0000-000000000002'::uuid, 2, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'),
    ('22222222-0000-0000-0000-000000000002'::uuid, 3, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('22222222-0000-0000-0000-000000000002'::uuid, 4, 'https://images.unsplash.com/photo-1505692795793-20f543407193'),
    ('22222222-0000-0000-0000-000000000002'::uuid, 5, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),

    ('22222222-0000-0000-0000-000000000003'::uuid, 1, 'https://images.unsplash.com/photo-1449844908441-8829872d2607'),
    ('22222222-0000-0000-0000-000000000003'::uuid, 2, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('22222222-0000-0000-0000-000000000003'::uuid, 3, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),
    ('22222222-0000-0000-0000-000000000003'::uuid, 4, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),

    ('22222222-0000-0000-0000-000000000004'::uuid, 1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'),
    ('22222222-0000-0000-0000-000000000004'::uuid, 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('22222222-0000-0000-0000-000000000004'::uuid, 3, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),
    ('22222222-0000-0000-0000-000000000004'::uuid, 4, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'),
    ('22222222-0000-0000-0000-000000000004'::uuid, 5, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),

    ('22222222-0000-0000-0000-000000000005'::uuid, 1, 'https://images.unsplash.com/photo-1524230572899-a752b3835840'),
    ('22222222-0000-0000-0000-000000000005'::uuid, 2, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('22222222-0000-0000-0000-000000000005'::uuid, 3, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),
    ('22222222-0000-0000-0000-000000000005'::uuid, 4, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),

    ('22222222-0000-0000-0000-000000000006'::uuid, 1, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'),
    ('22222222-0000-0000-0000-000000000006'::uuid, 2, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),
    ('22222222-0000-0000-0000-000000000006'::uuid, 3, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('22222222-0000-0000-0000-000000000006'::uuid, 4, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),

    ('22222222-0000-0000-0000-000000000007'::uuid, 1, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef'),
    ('22222222-0000-0000-0000-000000000007'::uuid, 2, 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735'),

    ('22222222-0000-0000-0000-000000000008'::uuid, 1, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'),
    ('22222222-0000-0000-0000-000000000008'::uuid, 2, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('22222222-0000-0000-0000-000000000008'::uuid, 3, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),

    ('22222222-0000-0000-0000-000000000009'::uuid, 1, 'https://images.unsplash.com/photo-1505692795793-20f543407193'),
    ('22222222-0000-0000-0000-000000000009'::uuid, 2, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0'),
    ('22222222-0000-0000-0000-000000000009'::uuid, 3, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),

    ('22222222-0000-0000-0000-00000000000a'::uuid, 1, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'),
    ('22222222-0000-0000-0000-00000000000a'::uuid, 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('22222222-0000-0000-0000-00000000000a'::uuid, 3, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),

    ('22222222-0000-0000-0000-00000000000b'::uuid, 1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'),
    ('22222222-0000-0000-0000-00000000000b'::uuid, 2, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),

    ('22222222-0000-0000-0000-00000000000c'::uuid, 1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'),
    ('22222222-0000-0000-0000-00000000000c'::uuid, 2, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811')
) AS img(listing_id, n, base) ON img.listing_id = l.id;

UPDATE public.site_settings SET
  primary_agent_photo_url = NULL,
  credibility_heading = '{"de":"Warum Dorothe Waltner","en":"Why Dorothe Waltner"}'::jsonb,
  about_body = '{"de":"Ich begleite Eigentümer und Käufer im Saarland persönlich — von der ersten Wertermittlung bis zum Notartermin. Als Einzelmaklerin arbeite ich bewusst mit wenigen Objekten gleichzeitig, damit jedes die Aufmerksamkeit bekommt, die es verdient. Kein Callcenter, keine Übergabe an Kollegen: Sie sprechen mit mir.","en":"I personally guide owners and buyers across the Saarland — from the first valuation to signing at the notary. As a solo broker I deliberately handle only a handful of properties at a time, so each one gets the attention it deserves. No call centre, no handovers: you speak with me."}'::jsonb
WHERE site_name = 'Immobilienberatung Dorothe Waltner';

UPDATE public.listings SET is_featured = true
WHERE id IN (
  '33333333-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000004'
);
-- Synthetic, deterministic data shaped like the shared multi-tenant DB.
-- 300 organizations, 25,000 properties (UCCI: 500), ~13 images per property.
SELECT setseed(0.42);

INSERT INTO organizations (id, organization_name, updated_at)
SELECT CASE WHEN g = 1 THEN 'ucci-org' ELSE 'org-' || g END, 'Organización ' || g, now()
FROM generate_series(1, 300) g;

INSERT INTO agents (id, organization_id, full_name, mobile_phone, updated_at)
SELECT 'agent-' || g, 'ucci-org', 'Agente ' || g, '54922300000' || g, now()
FROM generate_series(1, 6) g;

WITH base AS (
  SELECT g,
         CASE WHEN g <= 500 THEN 'ucci-org' ELSE 'org-' || (2 + (g % 299)) END AS org,
         (ARRAY['venta','venta','alquiler','venta_alquiler'])[1 + floor(random() * 4)::int] AS op,
         random() AS r_status, random() AS r_pub, random() AS r_loc, random() AS r_price
  FROM generate_series(1, 25000) g
)
INSERT INTO properties (
  id, organization_id, internal_code, title, description, property_type, operation_type,
  sale_price, rent_price, currency, address, street_number, locality, province, neighborhood,
  rooms, bedrooms, bathrooms, total_surface, covered_surface, age, status, is_published,
  featured, hide_sale_price, amenities, agent_id, created_at, updated_at, published_at)
SELECT
  gen_random_uuid()::text, org, (1000 + g)::text,
  'Propiedad ' || g || ' ' || (ARRAY['luminosa','con jardín','a estrenar','con pileta','frente al mar'])[1 + g % 5],
  repeat('Texto descriptivo de la propiedad con detalles de ambientes y ubicación. ', 12),
  (ARRAY['casa','departamento','departamento','ph','chalet','terreno','local_comercial','oficina','cochera','galpon','ph_chalet'])[1 + floor(random() * 11)::int]::"PropertyType",
  op::"OperationType",
  CASE WHEN op IN ('venta','venta_alquiler') THEN round((20000 + r_price * 780000)::numeric, 2) END,
  CASE WHEN op IN ('alquiler','venta_alquiler') THEN round((200000 + r_price * 2800000)::numeric, 2) END,
  (CASE WHEN op = 'alquiler' THEN 'ARS' ELSE 'USD' END)::"Currency",
  'Calle ' || (g % 400), (g % 5000)::text,
  CASE WHEN r_loc < 0.70 THEN 'Mar del Plata' WHEN r_loc < 0.80 THEN 'Batán' WHEN r_loc < 0.88 THEN 'Sierra de los Padres'
       WHEN r_loc < 0.94 THEN 'Santa Clara del Mar' ELSE 'Miramar' END,
  'Buenos Aires',
  CASE WHEN random() < 0.15 THEN NULL ELSE 'Barrio ' || (1 + floor(random() * 40)::int) END,
  1 + floor(random() * 6)::int, floor(random() * 5)::int, 1 + floor(random() * 3)::int,
  round((40 + random() * 900)::numeric, 2), round((30 + random() * 400)::numeric, 2), floor(random() * 60)::int,
  (CASE WHEN r_status < 0.70 THEN 'disponible' WHEN r_status < 0.85 THEN 'vendida' WHEN r_status < 0.90 THEN 'reservada'
        WHEN r_status < 0.97 THEN 'alquilada' ELSE 'en_construccion' END)::"PropertyStatus",
  r_pub < 0.85, random() < 0.1, random() < 0.05,
  (SELECT jsonb_agg(a) FROM (SELECT a FROM unnest(ARRAY['pileta','parrilla','cochera cubierta','jardín','quincho','balcón',
      'calefacción central','aire acondicionado','laundry','gimnasio']) a WHERE length(a) > (g % 1) ORDER BY random() LIMIT 1 + (g % 5)) s),
  CASE WHEN org = 'ucci-org' AND random() < 0.5 THEN 'agent-' || (1 + floor(random() * 6)::int) END,
  now() - (random() * interval '1095 days'), now(), now() - (random() * interval '1000 days')
FROM base;

INSERT INTO property_images (id, property_id, image_url, "order", is_main)
SELECT gen_random_uuid()::text, p.id,
       'https://example.supabase.co/storage/v1/object/public/property-images/properties/' || p.id || '/' || i || '.jpg',
       i, i = 0
FROM properties p, LATERAL generate_series(0, 2 + (abs(hashtext(p.id)) % 20)) i;

INSERT INTO property_videos (id, property_id, video_url, "order")
SELECT gen_random_uuid()::text, id, 'https://youtu.be/dQw4w9WgXcQ', 0
FROM properties WHERE abs(hashtext(id)) % 10 = 0;

ANALYZE;

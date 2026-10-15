-- Synthetic, deterministic data for end-to-end tests (CI). Never run against production.
-- Organization "ucci-org" (set ORGANIZATION_ID=ucci-org) plus one other agency
-- whose listings must never show up.
SELECT setseed(0.42);

INSERT INTO organizations (id, organization_name, updated_at) VALUES
  ('ucci-org', 'UCCI Propiedades (test)', now()),
  ('other-org', 'Otra inmobiliaria (test)', now());

INSERT INTO agents (id, organization_id, full_name, mobile_phone, license_number, updated_at)
SELECT 'agent-' || g, 'ucci-org', 'Agente ' || g, '54922300000' || g, 'CMCPMDP ' || (1000 + g), now()
FROM generate_series(1, 3) g;

WITH base AS (
  SELECT g,
         CASE WHEN g <= 150 THEN 'ucci-org' ELSE 'other-org' END AS org,
         CASE WHEN g % 5 = 0 THEN 'alquiler' WHEN g % 7 = 0 THEN 'venta_alquiler' ELSE 'venta' END AS op,
         CASE WHEN g % 10 = 1 THEN 'vendida' WHEN g % 10 = 2 THEN 'reservada' WHEN g % 17 = 0 THEN 'alquilada' ELSE 'disponible' END AS st
  FROM generate_series(1, 170) g
)
INSERT INTO properties (
  id, organization_id, internal_code, title, description, property_type, operation_type,
  sale_price, rent_price, currency, address, street_number, locality, province, neighborhood,
  latitude, longitude, rooms, bedrooms, bathrooms, total_surface, covered_surface, status,
  is_published, featured, hide_sale_price, hide_location, amenities, agent_id, created_at, updated_at, published_at)
SELECT
  gen_random_uuid()::text, org, (1000 + g)::text,
  'Propiedad ' || g || ' ' || (ARRAY['luminosa','con jardín','a estrenar','con pileta','frente al mar'])[1 + g % 5],
  repeat('Descripción de prueba con ambientes, orientación y servicios. ', 6),
  (ARRAY['casa','departamento','ph','chalet','terreno','local_comercial','oficina','cochera','galpon','ph_chalet'])[1 + g % 10]::"PropertyType",
  op::"OperationType",
  CASE WHEN op IN ('venta','venta_alquiler') THEN 30000 + g * 2500 END,
  CASE WHEN op IN ('alquiler','venta_alquiler') THEN 300000 + g * 10000 END,
  (CASE WHEN op = 'alquiler' THEN 'ARS' ELSE 'USD' END)::"Currency",
  'Calle ' || g, (100 + g)::text, 'Mar del Plata', 'Buenos Aires',
  CASE WHEN g % 6 = 0 THEN NULL ELSE 'Barrio ' || (1 + g % 8) END,
  -38.0 - (g % 50) / 1000.0, -57.55 - (g % 50) / 1000.0,
  1 + g % 6, g % 5, 1 + g % 3, 50 + g * 3, 40 + g * 2, st::"PropertyStatus",
  g % 23 <> 0, g % 9 = 0, g % 13 = 0, g % 19 = 0,
  to_jsonb((ARRAY['pileta','parrilla','cochera cubierta'])[1:1 + g % 3]),
  CASE WHEN org = 'ucci-org' AND g % 4 = 0 THEN 'agent-' || (1 + g % 3) END,
  now() - (g || ' days')::interval, now(), now() - (g || ' days')::interval
FROM base;

-- 2 to 7 photos per listing, served from public/ (no external hosts in CI).
INSERT INTO property_images (id, property_id, image_url, "order", is_main)
SELECT gen_random_uuid()::text, p.id, '/placeholder-property.jpg', i, i = 0
FROM properties p, LATERAL generate_series(0, 1 + abs(hashtext(p.id)) % 6) i;

ANALYZE;

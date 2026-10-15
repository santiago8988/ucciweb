-- Read-only database role for the public website (audit finding SEC-02).
--
-- Run ONCE in the Supabase SQL editor (as postgres), after replacing the password.
-- Then point the website's DATABASE_URL at this role through the pooler:
--   postgresql://web_readonly.<project_ref>:<password>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?connection_limit=5&pool_timeout=10
--
-- The website only reads published properties of one organization; it must not be
-- able to read the consortium/financial tables or write anything.

CREATE ROLE web_readonly WITH LOGIN PASSWORD 'CAMBIAR-por-una-clave-larga-y-aleatoria' NOINHERIT;

-- Fail fast instead of hanging requests.
ALTER ROLE web_readonly SET statement_timeout = '5s';
ALTER ROLE web_readonly SET idle_in_transaction_session_timeout = '10s';

GRANT USAGE ON SCHEMA public TO web_readonly;
GRANT SELECT ON public.properties,
                public.property_images,
                public.property_videos,
                public.agents
  TO web_readonly;

-- RLS is ENABLED on these four tables (verified 2026-10-14, with no policies), so
-- this role sees zero rows until read policies exist: run readonly-policies.sql next.

-- Verify (should list only SELECT on the four tables):
--   SELECT table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE grantee = 'web_readonly';

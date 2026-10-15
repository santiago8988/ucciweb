-- Row Level Security policies for the web_readonly role (run after readonly-role.sql).
--
-- RLS is enabled on these tables and they have no policies, so every role that
-- doesn't bypass RLS (anon, authenticated, web_readonly) sees zero rows. These
-- policies apply ONLY to web_readonly: the agents' app (postgres) and the
-- Supabase API roles are not affected.
--
-- Scope: published properties of ONE organization. Even with a leaked website
-- credential, other agencies' data stays invisible.
-- Replace <ORGANIZATION_ID> with the value of ORGANIZATION_ID (.env.local).

CREATE POLICY web_readonly_select ON public.properties
  FOR SELECT TO web_readonly
  USING (organization_id = '<ORGANIZATION_ID>' AND is_published);

CREATE POLICY web_readonly_select ON public.property_images
  FOR SELECT TO web_readonly
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id
      AND p.organization_id = '<ORGANIZATION_ID>'
      AND p.is_published
  ));

CREATE POLICY web_readonly_select ON public.property_videos
  FOR SELECT TO web_readonly
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id
      AND p.organization_id = '<ORGANIZATION_ID>'
      AND p.is_published
  ));

CREATE POLICY web_readonly_select ON public.agents
  FOR SELECT TO web_readonly
  USING (organization_id = '<ORGANIZATION_ID>' AND deleted_at IS NULL);

-- Verify:
--   SELECT tablename, policyname, roles FROM pg_policies WHERE policyname = 'web_readonly_select';
-- Then, from the repo: node db/verify-readonly.js

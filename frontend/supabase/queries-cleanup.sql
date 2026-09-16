-- One-time cleanup of the extra query access system.
-- Run in Supabase SQL Editor. No contact enquiries are deleted.
DROP FUNCTION IF EXISTS public.list_portfolio_queries(integer, text, text);
DROP TABLE IF EXISTS public.portfolio_query_readers;

-- Use the dashboard's existing Supabase login for read access.
GRANT SELECT ON public.portfolio_contact_requests TO authenticated;
REVOKE ALL ON public.portfolio_contact_requests FROM anon;
ALTER TABLE public.portfolio_contact_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboard_read_enquiries ON public.portfolio_contact_requests;
CREATE POLICY dashboard_read_enquiries ON public.portfolio_contact_requests
  FOR SELECT TO authenticated USING (true);

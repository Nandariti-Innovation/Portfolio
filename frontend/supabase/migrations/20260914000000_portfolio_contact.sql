-- Run in Supabase SQL Editor once. Browser roles cannot read or write these enquiries.
CREATE TABLE IF NOT EXISTS public.portfolio_contact_requests (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  resend_id text
);
ALTER TABLE public.portfolio_contact_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portfolio_contact_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.portfolio_contact_requests TO service_role;

CREATE OR REPLACE FUNCTION public.register_portfolio_contact(p_id uuid, p_payload jsonb, p_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE saved public.portfolio_contact_requests;
BEGIN
  -- Serialize reservations so parallel edge isolates cannot race the rate limit or UUID insert.
  PERFORM pg_advisory_xact_lock(14092026);
  SELECT * INTO saved FROM public.portfolio_contact_requests WHERE id = p_id;
  IF FOUND THEN
    IF saved.payload_hash <> p_hash THEN RETURN jsonb_build_object('code', 'conflict'); END IF;
    RETURN jsonb_build_object('code', 'ready', 'created_at', saved.created_at, 'resend_id', saved.resend_id);
  END IF;
  IF (SELECT count(*) FROM public.portfolio_contact_requests WHERE created_at > now() - interval '15 minutes') >= 30
    OR (SELECT count(*) FROM public.portfolio_contact_requests WHERE created_at > now() - interval '15 minutes'
        AND lower(payload->>'email') = lower(p_payload->>'email')) >= 3 THEN
    RETURN jsonb_build_object('code', 'limited');
  END IF;
  INSERT INTO public.portfolio_contact_requests(id, payload, payload_hash) VALUES(p_id, p_payload, p_hash) RETURNING * INTO saved;
  RETURN jsonb_build_object('code', 'ready', 'created_at', saved.created_at, 'resend_id', saved.resend_id);
END;
$$;
REVOKE ALL ON FUNCTION public.register_portfolio_contact(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_portfolio_contact(uuid, jsonb, text) TO service_role;
CREATE INDEX IF NOT EXISTS portfolio_contact_created_at ON public.portfolio_contact_requests(created_at);

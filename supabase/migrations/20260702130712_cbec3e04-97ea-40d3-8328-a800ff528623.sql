-- Solicitações de entrada em equipe
CREATE TABLE public.team_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID,
  UNIQUE (team_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_join_requests TO authenticated;
GRANT ALL ON public.team_join_requests TO service_role;

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Requester vê suas próprias solicitações; líder vê as do time dele
CREATE POLICY "requester_or_leader_can_read"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.leader_id = auth.uid())
  );

-- Bloqueia writes diretos do cliente; toda mutação passa por RPC SECURITY DEFINER
CREATE POLICY "deny_client_writes_insert" ON public.team_join_requests FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "deny_client_writes_update" ON public.team_join_requests FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_client_writes_delete" ON public.team_join_requests FOR DELETE TO authenticated USING (false);

-- Piloto pede para entrar
CREATE OR REPLACE FUNCTION public.request_join_team(_team_id UUID, _message TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  new_id UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = uid) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  -- Reabre solicitação se já existir (independente do status anterior)
  INSERT INTO public.team_join_requests (team_id, user_id, message, status)
  VALUES (_team_id, uid, NULLIF(btrim(_message), ''), 'pending')
  ON CONFLICT (team_id, user_id) DO UPDATE
    SET status = 'pending',
        message = EXCLUDED.message,
        created_at = now(),
        responded_at = NULL,
        responded_by = NULL
  RETURNING id INTO new_id;

  RETURN new_id;
END $$;

-- Líder aprova ou rejeita
CREATE OR REPLACE FUNCTION public.respond_join_request(_request_id UUID, _accept BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  req RECORD;
  cnt INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT r.*, t.leader_id, t.members_count
    INTO req
    FROM public.team_join_requests r
    JOIN public.teams t ON t.id = r.team_id
   WHERE r.id = _request_id FOR UPDATE;
  IF req IS NULL THEN RAISE EXCEPTION 'request_not_found'; END IF;
  IF req.leader_id <> uid THEN RAISE EXCEPTION 'not_leader'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'already_resolved'; END IF;

  IF _accept THEN
    IF req.members_count >= 50 THEN RAISE EXCEPTION 'team_full'; END IF;
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (req.team_id, req.user_id, 'member')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    UPDATE public.teams SET members_count = members_count + 1 WHERE id = req.team_id;
    UPDATE public.team_join_requests
       SET status = 'approved', responded_at = now(), responded_by = uid
     WHERE id = _request_id;
  ELSE
    UPDATE public.team_join_requests
       SET status = 'rejected', responded_at = now(), responded_by = uid
     WHERE id = _request_id;
  END IF;
END $$;

-- Piloto cancela sua própria solicitação
CREATE OR REPLACE FUNCTION public.cancel_join_request(_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  req RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO req FROM public.team_join_requests WHERE id = _request_id;
  IF req IS NULL OR req.user_id <> uid THEN RAISE EXCEPTION 'not_owner'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'already_resolved'; END IF;
  UPDATE public.team_join_requests SET status = 'cancelled' WHERE id = _request_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.request_join_team(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_join_request(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_join_request(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_join_team(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_join_request(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_join_request(UUID) TO authenticated;
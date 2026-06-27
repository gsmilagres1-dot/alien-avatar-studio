
-- =========================================================
-- FASE 4 — Equipes Alien
-- =========================================================

-- ---------- teams ----------
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code TEXT,
  flag_emoji TEXT,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  fichas INTEGER NOT NULL DEFAULT 0,
  members_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teams_name_len CHECK (char_length(name) BETWEEN 1 AND 16)
);
CREATE UNIQUE INDEX teams_name_lower_uidx ON public.teams (lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER teams_touch BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- team_members ----------
CREATE TYPE public.team_role AS ENUM ('leader', 'member');

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX team_members_user_idx ON public.team_members (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ---------- team_invites ----------
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uses INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX team_invites_team_idx ON public.team_invites (team_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- ---------- helper functions (security definer to avoid RLS recursion) ----------
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_leader(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = _team_id AND leader_id = _user_id
  );
$$;

-- ---------- policies: teams ----------
-- Ranking público para autenticados (somente leitura).
CREATE POLICY "teams_select_all_auth" ON public.teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "teams_update_leader" ON public.teams
  FOR UPDATE TO authenticated
  USING (leader_id = auth.uid())
  WITH CHECK (leader_id = auth.uid());

CREATE POLICY "teams_delete_leader" ON public.teams
  FOR DELETE TO authenticated
  USING (leader_id = auth.uid());

-- Inserção feita via função SECURITY DEFINER (create_team); negar insert direto.
-- Nenhuma policy INSERT = bloqueado para o cliente.

-- ---------- policies: team_members ----------
CREATE POLICY "tm_select_same_team" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_team_member(team_id, auth.uid())
  );

-- Membro pode sair sozinho; líder pode remover qualquer membro (exceto a si).
CREATE POLICY "tm_delete_self_or_leader" ON public.team_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR (public.is_team_leader(team_id, auth.uid()) AND role <> 'leader')
  );

-- Inserção apenas via função (create_team / join_team_via_invite).

-- ---------- policies: team_invites ----------
CREATE POLICY "ti_select_leader" ON public.team_invites
  FOR SELECT TO authenticated
  USING (public.is_team_leader(team_id, auth.uid()));

CREATE POLICY "ti_insert_leader" ON public.team_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_team_leader(team_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "ti_delete_leader" ON public.team_invites
  FOR DELETE TO authenticated
  USING (public.is_team_leader(team_id, auth.uid()));

-- ---------- create_team ----------
CREATE OR REPLACE FUNCTION public.create_team(
  _name TEXT,
  _country_code TEXT DEFAULT NULL,
  _flag_emoji TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  new_team_id UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF char_length(coalesce(_name,'')) < 1 OR char_length(_name) > 16 THEN
    RAISE EXCEPTION 'invalid_name_length';
  END IF;

  INSERT INTO public.teams (name, country_code, flag_emoji, description, leader_id, members_count)
  VALUES (_name, _country_code, _flag_emoji, _description, uid, 1)
  RETURNING id INTO new_team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, uid, 'leader');

  RETURN new_team_id;
END;
$$;

-- ---------- join_team_via_invite ----------
CREATE OR REPLACE FUNCTION public.join_team_via_invite(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  inv RECORD;
  cnt INTEGER;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO inv FROM public.team_invites WHERE token = _token;
  IF inv IS NULL THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RAISE EXCEPTION 'invite_expired';
  END IF;
  IF inv.max_uses IS NOT NULL AND inv.uses >= inv.max_uses THEN
    RAISE EXCEPTION 'invite_exhausted';
  END IF;

  SELECT members_count INTO cnt FROM public.teams WHERE id = inv.team_id FOR UPDATE;
  IF cnt >= 50 THEN
    RAISE EXCEPTION 'team_full';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (inv.team_id, uid, 'member')
  ON CONFLICT (team_id, user_id) DO NOTHING;

  UPDATE public.teams SET members_count = members_count + 1 WHERE id = inv.team_id;
  UPDATE public.team_invites SET uses = uses + 1 WHERE id = inv.id;

  RETURN inv.team_id;
END;
$$;

-- ---------- leave_team (membro sai; líder não pode sair sem transferir) ----------
CREATE OR REPLACE FUNCTION public.leave_team(_team_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  is_leader BOOLEAN;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT (leader_id = uid) INTO is_leader FROM public.teams WHERE id = _team_id;
  IF is_leader THEN RAISE EXCEPTION 'leader_cannot_leave'; END IF;

  DELETE FROM public.team_members WHERE team_id = _team_id AND user_id = uid;
  UPDATE public.teams SET members_count = GREATEST(members_count - 1, 0) WHERE id = _team_id;
END;
$$;

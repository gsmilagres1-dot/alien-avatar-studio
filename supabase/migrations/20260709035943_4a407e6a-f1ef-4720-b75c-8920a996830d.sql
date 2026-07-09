CREATE TABLE public.space_map_seals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES public.identities(id) ON DELETE SET NULL,
  object_id text NOT NULL,
  object_name text NOT NULL,
  object_kind text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL DEFAULT 9,
  difficulty integer NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  fichas_earned integer NOT NULL DEFAULT 0,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, object_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_map_seals TO authenticated;
GRANT ALL ON public.space_map_seals TO service_role;
ALTER TABLE public.space_map_seals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own space seals select" ON public.space_map_seals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own space seals insert" ON public.space_map_seals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own space seals update" ON public.space_map_seals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own space seals delete" ON public.space_map_seals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.space_map_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES public.identities(id) ON DELETE SET NULL,
  prize_id text NOT NULL,
  title text NOT NULL,
  threshold integer NOT NULL,
  seals_count integer NOT NULL,
  image_url text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prize_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_map_prizes TO authenticated;
GRANT ALL ON public.space_map_prizes TO service_role;
ALTER TABLE public.space_map_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own space prizes select" ON public.space_map_prizes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own space prizes insert" ON public.space_map_prizes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own space prizes update" ON public.space_map_prizes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own space prizes delete" ON public.space_map_prizes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_space_map_seals_user ON public.space_map_seals(user_id, issued_at DESC);
CREATE INDEX idx_space_map_prizes_user ON public.space_map_prizes(user_id, claimed_at DESC);
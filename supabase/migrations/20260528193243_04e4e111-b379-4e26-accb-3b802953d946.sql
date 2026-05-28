
CREATE TABLE public.journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  identity_id uuid NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  current_level integer NOT NULL DEFAULT 1,
  attempts_used integer NOT NULL DEFAULT 0,
  final_destination_name text,
  final_destination_kind text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(identity_id)
);

GRANT SELECT, INSERT, UPDATE ON public.journeys TO authenticated;
GRANT ALL ON public.journeys TO service_role;

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own journey select" ON public.journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own journey insert" ON public.journeys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own journey update" ON public.journeys FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_journeys_touch BEFORE UPDATE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_journeys_user_status ON public.journeys(user_id, status);

ALTER TABLE public.quiz_attempts ADD COLUMN journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE;
ALTER TABLE public.visas ADD COLUMN journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE;
ALTER TABLE public.visas ADD COLUMN kind text NOT NULL DEFAULT 'normal';

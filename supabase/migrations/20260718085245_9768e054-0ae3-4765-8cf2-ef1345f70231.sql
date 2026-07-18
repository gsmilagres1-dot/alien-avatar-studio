ALTER TABLE public.mining_progress
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS collected integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crashed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selected_ship text NOT NULL DEFAULT 'esportiva',
  ADD COLUMN IF NOT EXISTS selected_skin text,
  ADD COLUMN IF NOT EXISTS purchased_skins text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.mining_progress ALTER COLUMN material_key DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='mining_progress_user_id_key'
  ) THEN
    -- Ensure one row per user for the hangar/session state
    CREATE UNIQUE INDEX mining_progress_user_id_key ON public.mining_progress(user_id) WHERE material_key IS NULL;
  END IF;
END $$;
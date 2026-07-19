ALTER TABLE public.mining_progress
  ADD COLUMN IF NOT EXISTS purchased_ships text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS cleared_destinations text[] NOT NULL DEFAULT '{}'::text[];
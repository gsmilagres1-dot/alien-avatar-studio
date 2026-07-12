ALTER TABLE public.visas DROP CONSTRAINT IF EXISTS visas_user_id_destination_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS visas_journey_destination_unique
  ON public.visas (journey_id, destination_id)
  WHERE journey_id IS NOT NULL;

UPDATE public.journeys
SET status = 'active',
    completed_at = NULL,
    final_destination_name = NULL,
    final_destination_kind = NULL,
    updated_at = now()
WHERE status = 'completed';
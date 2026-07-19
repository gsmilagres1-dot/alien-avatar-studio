DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.identities'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%ship_category%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.identities DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.identities
  ADD CONSTRAINT identities_ship_category_check
  CHECK (ship_category IS NULL OR ship_category IN ('esportiva','offroad','corrida','teleportadora'));
-- =====================
-- NAVES EXTRAS DO HANGAR (Across Age)
-- Mesma ideia de purchased_skins, agora pra naves compradas.
-- =====================
ALTER TABLE public.mining_progress
  ADD COLUMN purchased_ships TEXT[] NOT NULL DEFAULT '{}';

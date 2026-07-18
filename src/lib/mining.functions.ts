import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MaterialKey = "ouro" | "monumento" | "niquel" | "ferramenta" | "cadmio" | "alien";

const FICHAS_PER_COLLECT = 1;
const FICHAS_LEVEL_BONUS = 10;

// Mesmas 4 naves de src/lib/alien.ts (SHIPS) — repetido aqui como
// literal porque server functions validam com Zod, não com o tipo TS.
export const SHIP_MODELS = ["esportiva", "offroad", "corrida", "teleportadora"] as const;
export type ShipModel = (typeof SHIP_MODELS)[number];

// Naves extras só do hangar de mineração (não afetam a identidade/nave
// "oficial" do jogador, que continua sendo as 4 de cima). As 4 primeiras
// são grátis; as 7 seguintes custam fichas até serem compradas.
export const EXTRA_SHIPS = [
  { id: "aerodeslizador", name: "Aerodeslizador", price: 0 },
  { id: "vtol-classica", name: "VTOL Clássica", price: 0 },
  { id: "quadricoptero", name: "Quadricóptero", price: 0 },
  { id: "furtiva", name: "Furtiva", price: 0 },
  { id: "bronze-jato", name: "Jato Bronze", price: 800 },
  { id: "asa-negra", name: "Asa Negra", price: 800 },
  { id: "limusine-voadora", name: "Limusine Voadora", price: 800 },
  { id: "biplano-retro", name: "Biplano Retrô", price: 800 },
  { id: "prancha-prata", name: "Prancha Prateada", price: 800 },
  { id: "hexacoptero", name: "Hexacóptero", price: 800 },
  { id: "concept-vermelho", name: "Concept Vermelho", price: 800 },
] as const;
export type ExtraShipId = (typeof EXTRA_SHIPS)[number]["id"];
const ALL_SHIP_KEYS = [...SHIP_MODELS, ...EXTRA_SHIPS.map((s) => s.id)] as unknown as [string, ...string[]];

// Mesmas 12 raças de FALLBACK_RACE_IMAGES em identities.server.ts.
export const RACE_SKINS = [
  "starseed", "nordico", "grey", "reptiliano", "draconiano", "insectoide",
  "aviario", "anunnaki", "siriano", "pleiadiano", "lyriano", "kashyapa",
] as const;
export type RaceSkin = (typeof RACE_SKINS)[number];

const SKIN_PRICE = 40;
const UNLOCK_EVERY_N_COLLECTS = 5;

async function ensureProgress(supabaseAdmin: any, userId: string) {
  const { data } = await supabaseAdmin
    .from("mining_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await supabaseAdmin
    .from("mining_progress")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return inserted;
}

export const getMiningState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);
    return {
      level: progress.level as number,
      collected: progress.collected as number,
      landed: progress.landed as number,
      crashed: progress.crashed as number,
    };
  });

const resultInput = z.object({
  materialKey: z.enum(["ouro", "monumento", "niquel", "ferramenta", "cadmio", "alien"]),
  success: z.boolean(),
});

export const submitMiningResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resultInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);

    if (!data.success) {
      const { data: updated, error } = await supabaseAdmin
        .from("mining_progress")
        .update({ crashed: progress.crashed + 1 })
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return {
        level: updated.level as number,
        collected: updated.collected as number,
        fichasEarned: 0,
        leveledUp: false,
        balance: null as number | null,
      };
    }

    let level = progress.level as number;
    let collected = (progress.collected as number) + 1;
    let leveledUp = false;
    let fichasEarned = FICHAS_PER_COLLECT;
    if (collected >= 10 && level < 10) {
      level += 1;
      collected = 0;
      leveledUp = true;
      fichasEarned += FICHAS_LEVEL_BONUS;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("mining_progress")
      .update({ level, collected, landed: progress.landed + 1 })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const { data: balance, error: fichasErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: fichasEarned,
      _reason: leveledUp ? "mineracao_nivel" : "mineracao_coleta",
      _meta: { materialKey: data.materialKey, level: updated.level },
    });
    if (fichasErr) throw new Error(fichasErr.message);

    return {
      level: updated.level as number,
      collected: updated.collected as number,
      fichasEarned,
      leveledUp,
      balance: balance as number,
    };
  });

export const getHangarState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);

    const freeUnlockedCount = Math.min(
      RACE_SKINS.length,
      Math.floor((progress.landed as number) / UNLOCK_EVERY_N_COLLECTS) + 1
    );
    const freeUnlocked = RACE_SKINS.slice(0, freeUnlockedCount);
    const purchased = (progress.purchased_skins as string[] | null) ?? [];
    const purchasedShips = (progress.purchased_ships as string[] | null) ?? [];

    return {
      shipModels: SHIP_MODELS,
      extraShips: EXTRA_SHIPS,
      unlockedExtraShips: EXTRA_SHIPS.filter((s) => s.price === 0 || purchasedShips.includes(s.id)).map((s) => s.id),
      raceSkins: RACE_SKINS,
      unlockedSkins: Array.from(new Set([...freeUnlocked, ...purchased])) as RaceSkin[],
      selectedShip: (progress.selected_ship as string) ?? "esportiva",
      selectedSkin: (progress.selected_skin as RaceSkin | null) ?? null,
      landed: progress.landed as number,
      skinPrice: SKIN_PRICE,
      unlockEveryNCollects: UNLOCK_EVERY_N_COLLECTS,
    };
  });

const selectionInput = z.object({
  selectedShip: z.enum(ALL_SHIP_KEYS),
  selectedSkin: z.enum(RACE_SKINS).nullable(),
});

export const setHangarSelection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => selectionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);

    const extraShip = EXTRA_SHIPS.find((s) => s.id === data.selectedShip);
    if (extraShip && extraShip.price > 0) {
      const purchasedShips = (progress.purchased_ships as string[] | null) ?? [];
      if (!purchasedShips.includes(data.selectedShip)) {
        throw new Error("Essa nave ainda não foi desbloqueada");
      }
    }

    if (data.selectedSkin) {
      const freeUnlockedCount = Math.min(
        RACE_SKINS.length,
        Math.floor((progress.landed as number) / UNLOCK_EVERY_N_COLLECTS) + 1
      );
      const freeUnlocked = RACE_SKINS.slice(0, freeUnlockedCount) as string[];
      const purchased = (progress.purchased_skins as string[] | null) ?? [];
      if (!freeUnlocked.includes(data.selectedSkin) && !purchased.includes(data.selectedSkin)) {
        throw new Error("Essa skin ainda não foi desbloqueada");
      }
    }

    const { error } = await supabaseAdmin
      .from("mining_progress")
      .update({ selected_ship: data.selectedShip, selected_skin: data.selectedSkin })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const purchaseShipInput = z.object({
  ship: z.enum(EXTRA_SHIPS.map((s) => s.id) as unknown as [string, ...string[]]),
});

export const purchaseShip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => purchaseShipInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);
    const purchasedShips = (progress.purchased_ships as string[] | null) ?? [];
    if (purchasedShips.includes(data.ship)) return { ok: true, alreadyOwned: true, balance: null as number | null };

    const shipDef = EXTRA_SHIPS.find((s) => s.id === data.ship)!;
    const { data: balance, error: fichasErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: -shipDef.price,
      _reason: "compra_nave_extra",
      _meta: { ship: data.ship },
    });
    if (fichasErr) throw new Error(fichasErr.message);

    const { error } = await supabaseAdmin
      .from("mining_progress")
      .update({ purchased_ships: [...purchasedShips, data.ship] })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { ok: true, alreadyOwned: false, balance: balance as number };
  });

const purchaseInput = z.object({ skin: z.enum(RACE_SKINS) });

export const purchaseSkin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => purchaseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);
    const purchased = (progress.purchased_skins as string[] | null) ?? [];
    if (purchased.includes(data.skin)) return { ok: true, alreadyOwned: true, balance: null as number | null };

    const { data: balance, error: fichasErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: -SKIN_PRICE,
      _reason: "compra_skin_piloto",
      _meta: { skin: data.skin },
    });
    if (fichasErr) throw new Error(fichasErr.message);

    const { error } = await supabaseAdmin
      .from("mining_progress")
      .update({ purchased_skins: [...purchased, data.skin] })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { ok: true, alreadyOwned: false, balance: balance as number };
  });
    

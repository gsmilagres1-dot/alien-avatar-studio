import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEAM_DESTINATIONS } from "@/lib/team-destinations";

export type MaterialKey = "ouro" | "monumento" | "niquel" | "ferramenta" | "cadmio" | "alien";

const FICHAS_PER_COLLECT = 10;

// Ordem da rota de fases — sistema solar primeiro (por `level` 1-5 já
// existente em cada destino de intergalactic.ts), depois as 30 galáxias/
// nebulosas/exoplanetas/aglomerados/quasares de team-destinations.ts,
// também ordenados por dificuldade.
const SOLAR_ROUTE = [
  "marte", "mercurio", "lua", "venus", "jupiter", "plutao",
  "saturno", "urano", "netuno", "europa",
  "kepler", "alpha_a", "proxima", "sol", "betelgeuse",
] as const;
const GALAXY_ROUTE = [...TEAM_DESTINATIONS].sort((a, b) => a.level - b.level).map((d) => d.id);

export const ROUTE_ORDER = [...SOLAR_ROUTE, ...GALAXY_ROUTE] as unknown as [string, ...string[]];
export type RouteDestinationId = string;

// Mesmas 4 naves de src/lib/alien.ts (SHIPS) — repetido aqui como
// literal porque server functions validam com Zod, não com o tipo TS.
export const SHIP_MODELS = ["esportiva", "offroad", "corrida", "teleportadora"] as const;
export type ShipModel = (typeof SHIP_MODELS)[number];

// Naves extras só do hangar de mineração (não afetam a identidade/nave
// "oficial" do jogador, que continua sendo as 4 de cima). As 4 primeiras
// são grátis; o resto custa fichas até ser comprado. Preço varia pela
// categoria da nave (ver src/lib/ship-stats.ts): naves "micro"/leves são
// mais baratas, "grande" (carregam mais material) são mais caras.
//
// 12 naves removidas (duplicidade / imagem ruim): Jato Bronze, Asa
// Negra, Limusine Voadora, Biplano Retrô, Prancha Prateada, Hexacóptero,
// Concept Vermelho, Delorean Classic, Nano Mold, Shadow Slim, Love
// Flyer, Lander RZ-9.
export const EXTRA_SHIPS = [
  { id: "aerodeslizador", name: "Aerodeslizador", price: 0 },
  { id: "vtol-classica", name: "VTOL Clássica", price: 0 },
  { id: "quadricoptero", name: "Quadricóptero", price: 0 },
  { id: "furtiva", name: "Furtiva", price: 0 },

  // ---- leva de 15 naves novas (recortadas no contorno) ----
  { id: "cadillactic-zx", name: "El Cadillactic ZX", price: 850 },
  { id: "modulo-c23", name: "Módulo Intergaláctico C-23", price: 1000 },
  { id: "navigator-original", name: "Navigator Original", price: 1400 },
  { id: "supersonic-force1", name: "Super-Sonic Force 1", price: 1050 },
  { id: "easy-rider-bus", name: "Easy Rider Bus", price: 1500 },
  { id: "unilander-77", name: "Uni-Lander 77", price: 650 },
  { id: "unilander", name: "Uni-Lander", price: 850 },
  { id: "egg-lander-1001", name: "Egg Lander 1001", price: 600 },
  { id: "navigator", name: "Navigator", price: 1600 },
  { id: "hover-coupe-rz", name: "Hover Coupe RZ", price: 800 },

  // ---- leva nova: 12 naves ----
  { id: "cruzer-noturno", name: "Cruzer Noturno", price: 850 },
  { id: "cruzador-aurun", name: "Cruzador Aurun", price: 1050 },
  { id: "aranha-lander", name: "Aranha Lander", price: 1500 },
  { id: "galactic-diamond", name: "Galactic Diamond", price: 900 },
  { id: "modal-multidimensional", name: "Modal Multidimensional", price: 1100 },
  { id: "super-duty-vanguard", name: "Super Duty Vanguard", price: 1550 },
  { id: "speed-bee-predator", name: "Speed Bee Predator", price: 1000 },
  { id: "cruzer-dourado", name: "Cruzer Dourado", price: 850 },
  { id: "lander-expedicao", name: "Lander Expedição", price: 900 },
  { id: "speed-bee-rubi", name: "Speed Bee Rubi", price: 800 },
  { id: "cruzer-aereo", name: "Cruzer Aéreo", price: 800 },
  { id: "bolha-lander", name: "Bolha Lander", price: 650 },
] as const;
export type ExtraShipId = (typeof EXTRA_SHIPS)[number]["id"];
const ALL_SHIP_KEYS = [...SHIP_MODELS, ...EXTRA_SHIPS.map((s) => s.id)] as unknown as [string, ...string[]];

// Mesmas 12 raças de FALLBACK_RACE_IMAGES em identities.server.ts.
export const RACE_SKINS = [
  "starseed", "nordico", "grey", "reptiliano", "draconiano", "insectoide",
  "aviario", "anunnaki", "siriano", "pleiadiano", "lyriano", "kashyapa",
] as const;
export type RaceSkin = (typeof RACE_SKINS)[number];

const SKIN_PRICE = 100;
const PHASE_CLEAR_BONUS = 50;
// A primeira skin (starseed) vem liberada de graça, como ponto de
// partida — todas as outras só saem comprando com fichas. Removido o
// desbloqueio automático por quantidade de coletas (antigo
// UNLOCK_EVERY_N_COLLECTS): isso fazia as skins abrirem sozinhas com o
// tempo, sem precisar gastar fichas, o que tirava o incentivo de jogar
// mais pra comprar.
const FREE_STARTER_SKINS = 1;

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
      const { error } = await supabaseAdmin
        .from("mining_progress")
        .update({ crashed: progress.crashed + 1 })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { fichasEarned: 0, balance: null as number | null };
    }

    const { error } = await supabaseAdmin
      .from("mining_progress")
      .update({ landed: progress.landed + 1 })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const { data: balance, error: fichasErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: FICHAS_PER_COLLECT,
      _reason: "mineracao_coleta",
      _meta: { materialKey: data.materialKey },
    });
    if (fichasErr) throw new Error(fichasErr.message);

    return { fichasEarned: FICHAS_PER_COLLECT, balance: balance as number };
  });

export const getHangarState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);

    const freeUnlocked = RACE_SKINS.slice(0, FREE_STARTER_SKINS);
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
      const freeUnlocked = RACE_SKINS.slice(0, FREE_STARTER_SKINS) as string[];
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

export const getRouteState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);
    const cleared = (progress.cleared_destinations as string[] | null) ?? [];

    // Libera o primeiro destino sempre, e cada um seguinte só depois
    // que o anterior na sequência foi completado (leva inteira + base).
    const unlocked: string[] = [];
    for (const id of ROUTE_ORDER) {
      unlocked.push(id);
      if (!cleared.includes(id)) break;
    }

    return {
      routeOrder: ROUTE_ORDER,
      clearedDestinations: cleared,
      unlockedDestinations: unlocked,
    };
  });

const clearDestInput = z.object({
  destinationId: z.enum(ROUTE_ORDER),
});

export const clearDestinationWave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => clearDestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const progress = await ensureProgress(supabaseAdmin, userId);
    const cleared = (progress.cleared_destinations as string[] | null) ?? [];
    if (cleared.includes(data.destinationId)) return { ok: true, alreadyCleared: true, balance: null as number | null };

    const { error } = await supabaseAdmin
      .from("mining_progress")
      .update({ cleared_destinations: [...cleared, data.destinationId] })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const { data: balance, error: fichasErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: PHASE_CLEAR_BONUS,
      _reason: "mineracao_fase_completa",
      _meta: { destinationId: data.destinationId },
    });
    if (fichasErr) throw new Error(fichasErr.message);

    return { ok: true, alreadyCleared: false, balance: balance as number };
  });

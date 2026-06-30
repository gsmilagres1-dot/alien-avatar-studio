import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALL_DESTINATIONS, getAnyDestination } from "@/lib/intergalactic";
import { getBankForDestination } from "@/lib/intergalactic-questions";
import { getTeamBank } from "@/lib/team-destinations";

const BATTLE_QUESTIONS = 9;

function getBank(id: string) {
  const s = getBankForDestination(id);
  if (s.length) return s;
  return getTeamBank(id);
}

function pickQuestions(destId: string, seed: number) {
  const bank = getBank(destId);
  if (!bank.length) return [];
  // simple shuffle with seed
  let a = seed | 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = bank.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, BATTLE_QUESTIONS).map((q) => ({
    q: q.q,
    choices: q.choices,
    answer: q.answer,
  }));
}

export const listBattlesForMyTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships } = await supabase
      .from("team_members").select("team_id").eq("user_id", userId);
    const teamIds = (memberships ?? []).map((m) => m.team_id);
    if (!teamIds.length) return { battles: [], teams: [] };
    const { data: battles } = await supabase
      .from("battles")
      .select("*, team_a:teams!battles_team_a_id_fkey(id, name, flag_emoji), team_b:teams!battles_team_b_id_fkey(id, name, flag_emoji)")
      .or(`team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`)
      .order("created_at", { ascending: false });
    const { data: teams } = await supabase
      .from("teams").select("id, name, leader_id, flag_emoji").in("id", teamIds);
    return { battles: battles ?? [], teams: teams ?? [] };
  });

export const listOpenTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("teams").select("id, name, flag_emoji, members_count")
      .order("members_count", { ascending: false }).limit(40);
    return data ?? [];
  });

export const createBattleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    teamAId: z.string().uuid(),
    teamBId: z.string().uuid(),
    destinationId: z.string().min(1).max(64),
    betFichas: z.number().int().min(0).max(10000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: id, error } = await supabaseAdmin.rpc("create_battle", {
      _caller_id: context.userId,
      _team_a_id: data.teamAId,
      _team_b_id: data.teamBId,
      _destination_key: data.destinationId,
      _bet_fichas: data.betFichas,
    });
    if (error) throw new Error(error.message);
    return { battleId: id as string };
  });

export const acceptBattleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ battleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("accept_battle", { _caller_id: context.userId, _battle_id: data.battleId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getBattleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ battleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: battle } = await supabase
      .from("battles")
      .select("*, team_a:teams!battles_team_a_id_fkey(id, name, flag_emoji, leader_id), team_b:teams!battles_team_b_id_fkey(id, name, flag_emoji, leader_id)")
      .eq("id", data.battleId).maybeSingle();
    if (!battle) throw new Error("Batalha não encontrada");
    const { data: parts } = await supabase
      .from("battle_participants").select("*").eq("battle_id", data.battleId);
    const dest = getAnyDestination(battle.destination_key);
    const me = (parts ?? []).find((p) => p.user_id === userId);
    return { battle, participants: parts ?? [], destination: dest, mySubmission: me };
  });

export const startBattleQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ battleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: battle } = await supabase
      .from("battles").select("*").eq("id", data.battleId).maybeSingle();
    if (!battle) throw new Error("Batalha não encontrada");
    if (battle.status !== "active") throw new Error("Batalha não está ativa");
    // seed per user+battle so same questions on resume
    let h = 2166136261 >>> 0;
    const s = `${data.battleId}:${userId}`;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    const questions = pickQuestions(battle.destination_key, h >>> 0);
    if (!questions.length) throw new Error("Banco de perguntas indisponível");
    return { questions };
  });

export const submitBattleScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    battleId: z.string().uuid(),
    answers: z.array(z.number().min(0).max(3)).length(BATTLE_QUESTIONS),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Re-derive the same quiz the client received so we score against the
    // server's answer key, never client-supplied keys.
    const { data: battle } = await supabase
      .from("battles").select("team_a_id, team_b_id, status, destination_key").eq("id", data.battleId).maybeSingle();
    if (!battle) throw new Error("Batalha não encontrada");
    if (battle.status !== "active") throw new Error("Batalha não está ativa");

    let h = 2166136261 >>> 0;
    const s = `${data.battleId}:${userId}`;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    const questions = pickQuestions(battle.destination_key, h >>> 0);
    if (questions.length !== BATTLE_QUESTIONS) throw new Error("Banco de perguntas indisponível");

    const score = data.answers.reduce(
      (acc, a, i) => acc + (a === questions[i].answer ? 1 : 0),
      0,
    );

    const { error } = await supabaseAdmin.rpc("submit_battle_score", {
      _battle_id: data.battleId, _score: score,
    });
    if (error) throw new Error(error.message);

    // Try to finalize: if every member of both teams already submitted
    let finalized = false;
    let winnerId: string | null = null;
    const { data: mems } = await supabaseAdmin
      .from("team_members").select("user_id, team_id")
      .in("team_id", [battle.team_a_id, battle.team_b_id].filter((x): x is string => !!x));
    const { data: parts } = await supabaseAdmin
      .from("battle_participants").select("user_id").eq("battle_id", data.battleId).not("score", "is", null);
    const total = (mems ?? []).length;
    const submitted = (parts ?? []).length;
    if (total > 0 && submitted >= total) {
      const { data: w } = await supabaseAdmin.rpc("finalize_battle", { _caller_id: userId, _battle_id: data.battleId });
      finalized = true;
      winnerId = (w as string | null) ?? null;
    }
    return { score, total: BATTLE_QUESTIONS, finalized, winnerId };
  });

export const finalizeBattleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ battleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Authorize: caller must be a member of either team in the battle.
    const { data: battle } = await supabaseAdmin
      .from("battles").select("team_a_id, team_b_id").eq("id", data.battleId).maybeSingle();
    if (!battle) throw new Error("Batalha não encontrada");
    const { data: membership } = await supabaseAdmin
      .from("team_members").select("team_id").eq("user_id", context.userId)
      .in("team_id", [battle.team_a_id, battle.team_b_id].filter((x): x is string => !!x));
    if (!membership?.length) throw new Error("Você não participa desta batalha");
    const { data: w, error } = await supabaseAdmin.rpc("finalize_battle", { _caller_id: context.userId, _battle_id: data.battleId });
    if (error) throw new Error(error.message);
    return { winnerId: (w as string | null) ?? null };
  });


// Listing of valid destinations for battles (5-pick: subset of 45)
export function listBattleDestinations() {
  return ALL_DESTINATIONS.slice(0, 5).map((d) => ({ id: d.id, name: d.name, kind: d.kind }));
}

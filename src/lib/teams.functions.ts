import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NameSchema = z.string().trim().min(1).max(16);

export const createTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: NameSchema,
      countryCode: z.string().max(4).optional().nullable(),
      flagEmoji: z.string().max(8).optional().nullable(),
      description: z.string().max(280).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: teamId, error } = await context.supabase.rpc("create_team", {
      _name: data.name,
      _country_code: data.countryCode ?? undefined,
      _flag_emoji: data.flagEmoji ?? undefined,
      _description: data.description ?? undefined,
    });
    if (error) {
      if (error.message.includes("duplicate")) throw new Error("Já existe uma equipe com esse nome");
      throw new Error(error.message);
    }
    return { teamId: teamId as string };
  });

export const listTeamsRanking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("teams")
      .select("id, name, flag_emoji, country_code, score, fichas, members_count, leader_id, description")
      .order("score", { ascending: false })
      .order("members_count", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("team_members")
      .select("role, team_id, team:teams(id, name, flag_emoji, country_code, description, score, fichas, members_count, leader_id)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row?.team) return null;
    return { team: row.team, role: row.role as "leader" | "member" };
  });

export const getTeamDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: team, error } = await context.supabase
      .from("teams")
      .select("id, name, flag_emoji, country_code, description, score, fichas, members_count, leader_id")
      .eq("id", data.teamId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!team) return null;

    const { data: members } = await context.supabase
      .from("team_members")
      .select("user_id, role, joined_at")
      .eq("team_id", data.teamId)
      .order("joined_at", { ascending: true });

    return { team, members: members ?? [] };
  });

export const updateTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      teamId: z.string().uuid(),
      name: NameSchema.optional(),
      flagEmoji: z.string().max(8).optional().nullable(),
      countryCode: z.string().max(4).optional().nullable(),
      description: z.string().max(280).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { name?: string; flag_emoji?: string | null; country_code?: string | null; description?: string | null } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.flagEmoji !== undefined) patch.flag_emoji = data.flagEmoji;
    if (data.countryCode !== undefined) patch.country_code = data.countryCode;
    if (data.description !== undefined) patch.description = data.description;
    const { error } = await context.supabase.from("teams").update(patch).eq("id", data.teamId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    const { data: row, error } = await context.supabase
      .from("team_invites")
      .insert({ team_id: data.teamId, token, created_by: context.userId })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return { token: row.token };
  });

export const listInvites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("team_invites")
      .select("id, token, uses, max_uses, expires_at, created_at")
      .eq("team_id", data.teamId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const joinTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ token: z.string().min(4).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: teamId, error } = await context.supabase.rpc("join_team_via_invite", { _token: data.token });
    if (error) {
      const map: Record<string, string> = {
        invite_not_found: "Convite inválido ou expirado",
        invite_expired: "Convite expirado",
        invite_exhausted: "Convite já atingiu o limite de usos",
        team_full: "Esta equipe já está lotada (50 membros)",
      };
      const key = Object.keys(map).find((k) => error.message.includes(k));
      throw new Error(key ? map[key] : error.message);
    }
    return { teamId: teamId as string };
  });

export const leaveTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("leave_team", { _team_id: data.teamId });
    if (error) {
      if (error.message.includes("leader_cannot_leave")) {
        throw new Error("O líder não pode sair da equipe. Transfira a liderança ou exclua a equipe.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid(), userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("team_members")
      .delete()
      .eq("team_id", data.teamId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

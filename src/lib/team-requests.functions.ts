import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Piloto solicita entrada em uma equipe. */
export const requestJoinTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ teamId: z.string().uuid(), message: z.string().max(200).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("request_join_team", {
      _team_id: data.teamId,
      _message: data.message ?? null,
    });
    if (error) {
      if (error.message.includes("already_member")) throw new Error("Você já faz parte dessa equipe");
      throw new Error(error.message);
    }
    return { requestId: id as string };
  });

/** Piloto cancela a própria solicitação. */
export const cancelJoinRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("cancel_join_request", {
      _request_id: data.requestId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Líder aprova ou rejeita uma solicitação. */
export const respondJoinRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ requestId: z.string().uuid(), accept: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("respond_join_request", {
      _request_id: data.requestId,
      _accept: data.accept,
    });
    if (error) {
      if (error.message.includes("team_full")) throw new Error("Equipe lotada (50 membros)");
      if (error.message.includes("already_resolved")) throw new Error("Solicitação já respondida");
      throw new Error(error.message);
    }
    return { ok: true };
  });

/** Minhas solicitações pendentes (piloto), com nome da equipe. */
export const listMyJoinRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("team_join_requests")
      .select("id, team_id, status, created_at, teams(id, name, flag_emoji)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

/** Solicitações pendentes da equipe (visível ao líder). Retorna também o nome alien do requester. */
export const listTeamJoinRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: reqs, error } = await context.supabase
      .from("team_join_requests")
      .select("id, user_id, message, status, created_at")
      .eq("team_id", data.teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((reqs ?? []).map((r) => r.user_id)));
    if (!userIds.length) return { requests: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: idents } = await supabaseAdmin
      .from("identities")
      .select("user_id, alien_name, avatar_url, species, planet_id, updated_at")
      .in("user_id", userIds)
      .order("updated_at", { ascending: false });

    const byUser = new Map<string, NonNullable<typeof idents>[number]>();
    for (const i of idents ?? []) if (!byUser.has(i.user_id)) byUser.set(i.user_id, i);

    return {
      requests: (reqs ?? []).map((r) => ({
        ...r,
        identity: byUser.get(r.user_id) ?? null,
      })),
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listTeamMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ teamId: z.string().uuid(), limit: z.number().int().min(1).max(200).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("team_messages")
      .select("id, team_id, user_id, content, created_at")
      .eq("team_id", data.teamId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw new Error(error.message);
    return (rows ?? []).reverse();
  });

export const sendTeamMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    teamId: z.string().uuid(),
    content: z.string().trim().min(1).max(500),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("team_messages")
      .insert({ team_id: data.teamId, user_id: context.userId, content: data.content })
      .select("id, team_id, user_id, content, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

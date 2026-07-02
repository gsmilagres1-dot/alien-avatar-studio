import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ranking público de pilotos inscritos.
 * Retorna todos os usuários com perfil, ordenados pelo total de selos (visas)
 * conquistados. Cada linha inclui a identidade atualmente em uso (a mais
 * recentemente atualizada) para exibir avatar e nome alienígena.
 * Apenas dados públicos são expostos — nada de e-mail ou user_id sensível é
 * usado no cliente para exibição.
 */
export const listPilotsRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: visas }, { data: identities }] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, display_name, created_at"),
      supabaseAdmin.from("visas").select("user_id"),
      supabaseAdmin
        .from("identities")
        .select(
          "id, user_id, human_name, alien_name, species, planet_id, avatar_url, ship_image_url, ship_category, rank, license_class, id_number, galactic_birth, gender, updated_at",
        )
        .order("updated_at", { ascending: false }),
    ]);

    const visasByUser = new Map<string, number>();
    for (const v of visas ?? []) {
      const k = (v as { user_id: string }).user_id;
      visasByUser.set(k, (visasByUser.get(k) ?? 0) + 1);
    }

    // Primeira identidade encontrada por user_id = a mais recentemente atualizada.
    const currentByUser = new Map<string, NonNullable<typeof identities>[number]>();
    for (const i of identities ?? []) {
      if (!currentByUser.has(i.user_id)) currentByUser.set(i.user_id, i);
    }

    const rows = (profiles ?? [])
      .map((p) => {
        const ident = currentByUser.get(p.user_id) ?? null;
        return {
          userId: p.user_id,
          displayName: p.display_name ?? ident?.alien_name ?? "Piloto",
          joinedAt: p.created_at,
          visas: visasByUser.get(p.user_id) ?? 0,
          identity: ident,
        };
      })
      // Esconde perfis vazios (contas de teste sem nenhuma identidade criada).
      .filter((r) => r.identity !== null);

    rows.sort((a, b) => {
      if (b.visas !== a.visas) return b.visas - a.visas;
      return (a.joinedAt ?? "").localeCompare(b.joinedAt ?? "");
    });

    return { total: rows.length, rows };
  });

export const getPilotDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, created_at")
      .eq("user_id", data.userId)
      .maybeSingle();
    const { data: identities } = await supabaseAdmin
      .from("identities")
      .select("*")
      .eq("user_id", data.userId)
      .order("updated_at", { ascending: false });
    const identity = identities?.[0] ?? null;
    const { count: visasCount } = await supabaseAdmin
      .from("visas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.userId);
    return { profile, identity, visasCount: visasCount ?? 0 };
  });

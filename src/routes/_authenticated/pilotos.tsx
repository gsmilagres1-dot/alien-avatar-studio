import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Trophy, X, Rocket, Sparkles, ChevronRight, Users, Trash2, ImagePlus, Check } from "lucide-react";
import { toast } from "sonner";
import { listPilotsRanking, getPilotDetail } from "@/lib/pilots.functions";
import {
  deleteIdentity,
  listMyIdentities,
  setIdentityAvatarFromGallery,
} from "@/lib/identities.functions";

export const Route = createFileRoute("/_authenticated/pilotos")({ component: PilotosPage });

const SPECIES_EMOJI: Record<string, string> = {
  starseed: "✨",
  nordico: "💫",
  grey: "👽",
  reptiliano: "🐉",
  draconiano: "🔥",
  insectoide: "🦋",
};

function speciesEmoji(planetId?: string | null, species?: string | null) {
  if (planetId && SPECIES_EMOJI[planetId]) return SPECIES_EMOJI[planetId];
  const s = (species ?? "").toLowerCase();
  for (const k of Object.keys(SPECIES_EMOJI)) if (s.includes(k)) return SPECIES_EMOJI[k];
  return "🛸";
}

function PilotosPage() {
  const { auth } = Route.useRouteContext();
  const currentUserId: string | null = (auth as { user?: { id?: string } } | undefined)?.user?.id ?? null;
  const listFn = useServerFn(listPilotsRanking);
  const { data, isLoading } = useQuery({
    queryKey: ["pilots-ranking"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });
  const [openUser, setOpenUser] = useState<string | null>(null);

  return (
    <main className="max-w-3xl mx-auto px-3 py-5">
      <header className="mb-4">
        <h1 className="font-display text-2xl text-gradient-neon flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" /> Pilotos inscritos
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ranking dos alienígenas inscritos na Federação. Clique em um piloto para ver a identidade em uso.
        </p>
        {data && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-mono">
            <Sparkles className="w-3 h-3 text-accent" /> {data.total} pilotos na Federação
          </div>
        )}
      </header>

      {isLoading && (
        <div className="py-10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
        </div>
      )}

      {!isLoading && (data?.rows ?? []).length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-10">Ninguém por aqui ainda.</div>
      )}

      <ol className="space-y-2">
        {(data?.rows ?? []).map((row, i) => {
          const pos = i + 1;
          const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : null;
          const flag = speciesEmoji(row.identity?.planet_id, row.identity?.species);
          const isMe = row.userId === currentUserId;
          return (
            <li key={row.userId}>
              <button
                onClick={() => setOpenUser(row.userId)}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  pos <= 3
                    ? "border-accent/60 bg-gradient-to-r from-accent/10 to-transparent shadow-neon"
                    : "border-border/50 bg-black/30 hover:border-accent/40"
                }`}
              >
                <div className="shrink-0 w-9 text-center">
                  <div className={`font-display text-lg ${pos <= 3 ? "text-accent" : "text-white/70"}`}>
                    {medal ?? pos}
                  </div>
                </div>
                <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-accent/30 bg-black/60 flex items-center justify-center">
                  {row.identity?.avatar_url ? (
                    <img
                      src={row.identity.avatar_url}
                      alt={row.displayName}
                      loading="lazy"
                      className="w-full h-full object-cover object-[center_25%]"
                    />
                  ) : (
                    <Rocket className="w-4 h-4 text-accent/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg leading-none">{flag}</span>
                    <span className="font-display truncate">{row.displayName}</span>
                    {isMe && (
                      <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40">
                        você
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono truncate">
                    {row.identity?.alien_name ?? "sem identidade ativa"}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 pr-1">
                  <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_oklch(0.85_0.2_90)]" />
                  <span className="font-mono text-sm">{row.visas}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {openUser && (
        <PilotDetailModal
          userId={openUser}
          isSelf={openUser === currentUserId}
          onClose={() => setOpenUser(null)}
        />
      )}
    </main>
  );
}

function PilotDetailModal({ userId, isSelf, onClose }: { userId: string; isSelf: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getPilotDetail);
  const listMineFn = useServerFn(listMyIdentities);
  const swapFn = useServerFn(setIdentityAvatarFromGallery);
  const deleteFn = useServerFn(deleteIdentity);

  const { data, isLoading } = useQuery({
    queryKey: ["pilot-detail", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });
  const { data: mine } = useQuery({
    queryKey: ["my-identities-gallery"],
    queryFn: () => listMineFn(),
    enabled: isSelf,
  });

  const identity = data?.identity ?? null;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refreshAll() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pilot-detail", userId] }),
      qc.invalidateQueries({ queryKey: ["pilots-ranking"] }),
      qc.invalidateQueries({ queryKey: ["identities-with-journeys"] }),
      qc.invalidateQueries({ queryKey: ["my-identities-gallery"] }),
    ]);
  }

  async function handleSwap(sourceIdentityId: string) {
    if (!identity) return;
    setBusy(true);
    try {
      await swapFn({ data: { identityId: identity.id, sourceIdentityId } });
      await refreshAll();
      setPickerOpen(false);
      toast.success("Avatar trocado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!identity) return;
    if (!confirm("Apagar essa identidade? A viagem também será removida.")) return;
    setBusy(true);
    try {
      await deleteFn({ data: { id: identity.id } });
      await refreshAll();
      toast.success("Identidade apagada");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-auto rounded-3xl border-2 border-accent/60 bg-background shadow-neon"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
          <div className="font-display text-sm text-gradient-neon flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Identidade em uso
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        {isLoading && (
          <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
        )}
        {!isLoading && !identity && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Este piloto ainda não tem identidade ativa.
          </div>
        )}
        {identity && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <div className="relative">
                <div className="w-28 h-32 rounded-xl overflow-hidden border border-accent/40 shadow-neon bg-black/60">
                  {identity.avatar_url ? (
                    <img src={identity.avatar_url} alt={identity.alien_name ?? ""} className="w-full h-full object-cover object-[center_25%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-accent/60" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-mono font-bold">
                  VERIFIED
                </div>
              </div>
              <div className="space-y-1.5">
                <Row label="Nome alien" value={identity.alien_name} highlight />
                <Row label="Espécie" value={identity.species} />
                <Row label="Origem" value={identity.planet_id} />
                <Row label="Nasc. galáctico" value={identity.galactic_birth} />
                <Row label="Nº Universal" value={identity.id_number} mono />
              </div>
            </div>
            {identity.ship_image_url && (
              <div className="rounded-xl overflow-hidden border border-accent/20">
                <img src={identity.ship_image_url} alt="Nave" loading="lazy" className="w-full h-40 object-cover" />
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Nave · {identity.ship_category ?? "—"}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-black/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Selos conquistados</div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-mono text-sm">{data?.visasCount ?? 0}</span>
              </div>
            </div>

            {isSelf && (
              <div className="space-y-2 pt-1">
                {!pickerOpen && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-bold disabled:opacity-50"
                    >
                      <ImagePlus className="w-3.5 h-3.5" /> Trocar avatar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleDelete}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-bold disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Apagar perfil
                    </button>
                  </div>
                )}
                {pickerOpen && (
                  <div className="rounded-xl border border-accent/30 bg-black/40 p-2">
                    <div className="flex items-center justify-between px-1 pb-2">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                        Escolher avatar da galeria
                      </div>
                      <button type="button" onClick={() => setPickerOpen(false)} className="text-[10px] text-muted-foreground hover:text-accent">
                        cancelar
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-56 overflow-auto">
                      {(mine?.identities ?? []).map((it) => {
                        const active = it.avatar_url === identity.avatar_url;
                        return (
                          <button
                            key={it.id}
                            type="button"
                            disabled={busy || active}
                            onClick={() => handleSwap(it.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 ${active ? "border-accent" : "border-transparent hover:border-accent/50"} disabled:opacity-60`}
                            title={it.alien_name ?? ""}
                          >
                            {it.avatar_url ? (
                              <img src={it.avatar_url} alt={it.alien_name ?? ""} loading="lazy" className="w-full h-full object-cover object-[center_25%]" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black/60">
                                <Rocket className="w-4 h-4 text-accent/60" />
                              </div>
                            )}
                            {active && (
                              <div className="absolute inset-0 bg-accent/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-accent-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {(mine?.identities ?? []).length === 0 && (
                        <div className="col-span-4 text-center text-xs text-muted-foreground py-6">
                          Nenhum avatar salvo na galeria.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Link
                  to="/galeria"
                  className="block text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent"
                >
                  abrir minha galeria completa →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value?: string | null; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-sm leading-tight ${highlight ? "text-gradient-neon font-display text-base" : ""} ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

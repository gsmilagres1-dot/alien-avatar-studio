import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { deleteIdentity } from "@/lib/identities.functions";
import { listIdentitiesWithJourneys } from "@/lib/gallery.functions";
import { rescueLostIdentity, RESCUE_COST } from "@/lib/rescue.functions";
import {
  purchaseExtraIdentityPack,
  EXTRA_PACK_COST,
  EXTRA_PACK_SLOTS,
  FREE_IDENTITIES_LIMIT,
} from "@/lib/identity-pack.functions";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, Trash2, Plus, Rocket, Skull, Sparkles, MapPin, LifeBuoy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ShareProfileImage } from "@/components/ShareProfileImage";
import { DestinationBadge } from "@/components/DestinationBadge";

export const Route = createFileRoute("/_authenticated/galeria")({ component: Galeria });

function Galeria() {
  const navigate = useNavigate();
  const list = useServerFn(listIdentitiesWithJourneys);
  const del = useServerFn(deleteIdentity);
  const rescueFn = useServerFn(rescueLostIdentity);
  const { fichas, refresh: refreshWallet } = useWallet();
  const qc = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rescuingId, setRescuingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["identities-with-journeys"], queryFn: () => list() });

  async function remove(id: string) {
    if (!confirm("Apagar essa identidade e sua viagem?")) return;
    setRemovingId(id);
    try {
      await del({ data: { id } });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["identities-with-journeys"] }),
        qc.invalidateQueries({ queryKey: ["identities"] }),
      ]);
      toast.success("Removida");
    } catch (e) { toast.error((e as Error).message); }
    finally { setRemovingId(null); }
  }

  async function rescue(id: string) {
    if (fichas < RESCUE_COST) {
      toast.error(`Faltam ${RESCUE_COST - fichas} fichas para o resgate`);
      return;
    }
    if (!confirm(`Resgatar essa identidade perdida no espaço? Custa ${RESCUE_COST} fichas.`)) return;
    setRescuingId(id);
    try {
      await rescueFn({ data: { identityId: id } });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["identities-with-journeys"] }),
        refreshWallet(),
      ]);
      toast.success("Resgatado! Selos preservados, viagem reativada.");
      navigate({ to: "/galaxia", search: { identityId: id } });
    } catch (e) { toast.error((e as Error).message); }
    finally { setRescuingId(null); }
  }

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gradient-neon">Minha galeria</h1>
        <Link to="/criar" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-neon">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Link>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>}

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Rocket className="w-10 h-10 text-accent mx-auto" />
          <p className="font-display mt-3">Nenhuma identidade ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie sua primeira grátis.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items.map(({ identity: i, journey, visas }) => {
          const fatal = journey?.final_destination_kind === "fatal";
          const active = journey?.status === "active";
          const done = journey?.status === "completed";
          return (
            <div key={i.id} className="glass rounded-2xl overflow-hidden">
              <div className="relative">
                <img src={i.avatar_url} alt={i.alien_name} className="w-full aspect-square object-cover object-[center_25%]" />
                <button
                    type="button"
                  onClick={() => remove(i.id)}
                  aria-label="Apagar avatar"
                  title="Apagar avatar"
                    disabled={removingId === i.id}
                  className="absolute top-2 right-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-destructive/90 text-destructive-foreground shadow-lg hover:bg-destructive transition active:scale-95">
                  {removingId === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
                {i.ship_image_url && (
                  <img src={i.ship_image_url} alt="Nave" className="absolute bottom-2 right-2 w-20 h-20 rounded-xl object-cover border-2 border-accent shadow-neon" />
                )}
              </div>
              <div className="p-4">
                <div className="font-display text-lg text-gradient-neon">{i.alien_name}</div>
                <div className="text-xs text-muted-foreground">{i.species}</div>
                <div className="font-mono text-[10px] text-accent mt-1">{i.id_number}</div>

                <div className={`mt-3 rounded-lg p-2 text-xs flex items-start gap-2 ${fatal ? "bg-destructive/10 border border-destructive/30" : done ? "bg-accent/10 border border-accent/30" : "bg-muted/30"}`}>
                  {fatal ? <Skull className="w-3.5 h-3.5 mt-0.5 text-destructive" />
                    : done ? <Sparkles className="w-3.5 h-3.5 mt-0.5 text-accent" />
                    : <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />}
                  <div className="flex-1">
                    {fatal && <><b>Perdido em</b> {journey.final_destination_name}</>}
                    {done && <><b>Chegou em</b> {journey.final_destination_name}</>}
                    {active && <>Em viagem · nível {journey.current_level}/5</>}
                    {!journey && <>Sem viagem iniciada</>}
                  </div>
                </div>

                {visas.length > 0 && (
                  <div className="mt-3 rounded-xl border border-accent/20 bg-black/30 p-2">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5 px-1">
                      Selos · {visas.length} destino{visas.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {visas.map((v) => (
                        <DestinationBadge
                          key={v.id}
                          destinationId={v.destination_id}
                          destinationName={v.destination_name}
                          tier={(v.tier ?? "bronze") as "bronze" | "silver" | "gold"}
                          size={44}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {fatal && (
                  <button
                    type="button"
                    disabled={rescuingId === i.id || fichas < RESCUE_COST}
                    onClick={() => rescue(i.id)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-bold shadow-neon disabled:opacity-50 disabled:cursor-not-allowed"
                    title={fichas < RESCUE_COST ? `Faltam ${RESCUE_COST - fichas} fichas` : "Resgatar identidade perdida"}
                  >
                    {rescuingId === i.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LifeBuoy className="w-3.5 h-3.5" />}
                    Resgatar do espaço · {RESCUE_COST} fichas
                  </button>
                )}

                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/galaxia", search: { identityId: i.id } })}
                    className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                    <Rocket className="w-3 h-3" /> {active ? "Continuar" : journey ? "Ver viagem" : "Viajar"}
                  </button>
                  <ShareProfileImage identity={i} />
                  <button type="button" disabled={removingId === i.id} onClick={() => remove(i.id)} className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline disabled:opacity-50">
                    {removingId === i.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Apagar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

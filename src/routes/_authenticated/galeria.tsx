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
import { Loader2, Trash2, Plus, Rocket, Skull, Sparkles, MapPin, LifeBuoy, UserPlus, ImageIcon, Box } from "lucide-react";
import { STLPreviewModal } from "@/components/STLPreviewModal";
import { toast } from "sonner";
import { ShareProfileImage } from "@/components/ShareProfileImage";
import { DestinationBadge } from "@/components/DestinationBadge";

export const Route = createFileRoute("/_authenticated/galeria")({ component: Galeria });

function Galeria() {
  const navigate = useNavigate();
  const list = useServerFn(listIdentitiesWithJourneys);
  const del = useServerFn(deleteIdentity);
  const rescueFn = useServerFn(rescueLostIdentity);
  const buyPackFn = useServerFn(purchaseExtraIdentityPack);
  const { fichas, refresh: refreshWallet } = useWallet();
  const qc = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rescuingId, setRescuingId] = useState<string | null>(null);
  const [buyingPack, setBuyingPack] = useState(false);

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
    toast.info(`Resgatando identidade — ${RESCUE_COST} fichas`);
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

  async function buyExtraPack() {
    if (fichas < EXTRA_PACK_COST) {
      toast.error(`Faltam ${EXTRA_PACK_COST - fichas} fichas para comprar o pacote extra`);
      return;
    }
    if (!confirm(`Liberar mais ${EXTRA_PACK_SLOTS} avatares alien por ${EXTRA_PACK_COST} fichas?`)) return;
    setBuyingPack(true);
    try {
      await buyPackFn();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["active-payment"] }),
        refreshWallet(),
      ]);
      toast.success(`Liberados ${EXTRA_PACK_SLOTS} novos slots de avatar!`);
      navigate({ to: "/criar" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBuyingPack(false); }
  }

  const identityCount = data?.items.length ?? 0;
  const draftCount = data?.drafts.length ?? 0;
  const reachedFreeLimit = identityCount >= FREE_IDENTITIES_LIMIT;

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="font-display text-2xl text-gradient-neon">Minha galeria</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={buyExtraPack}
            disabled={buyingPack || fichas < EXTRA_PACK_COST}
            title={fichas < EXTRA_PACK_COST ? `Faltam ${EXTRA_PACK_COST - fichas} fichas` : `Mais ${EXTRA_PACK_SLOTS} avatares por ${EXTRA_PACK_COST} fichas`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[11px] font-bold shadow-neon disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buyingPack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            +{EXTRA_PACK_SLOTS} avatares · {EXTRA_PACK_COST} fichas
          </button>
          <Link to="/criar" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-neon">
            <Plus className="w-3.5 h-3.5" /> Nova
          </Link>
        </div>
      </div>

      {reachedFreeLimit && (
        <div className="glass rounded-2xl p-4 mb-6 border border-amber-500/40 bg-amber-500/5">
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <b className="text-amber-300">Você atingiu o limite de {FREE_IDENTITIES_LIMIT} identidades gratuitas.</b>{" "}
            Para criar mais avatares alien, libere um pacote extra de {EXTRA_PACK_SLOTS} por {EXTRA_PACK_COST} fichas.
            Eles ficam guardados aqui na galeria para viagens e batalhas.
          </p>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>}

      {!isLoading && identityCount === 0 && draftCount === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <Rocket className="w-10 h-10 text-accent mx-auto" />
          <p className="font-display mt-3">Nenhuma identidade ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie sua primeira grátis.</p>
        </div>
      )}

      {!isLoading && draftCount > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-lg text-accent">Avatares salvos para finalizar</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{draftCount} pendente{draftCount > 1 ? "s" : ""}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.drafts.map((draft) => (
              <div key={draft.id} className="glass rounded-2xl overflow-hidden">
                <div className="relative">
                  <img src={draft.avatar_url} alt={`Avatar salvo #${draft.variant_index}`} className="w-full aspect-square object-cover object-[center_25%]" />
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[10px] font-mono text-accent backdrop-blur">
                    <ImageIcon className="w-3 h-3" /> #{draft.variant_index}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-display text-base text-gradient-neon">Avatar aguardando identidade</div>
                  <p className="text-xs text-muted-foreground mt-1">Já está salvo na sua conta. Continue para preencher nome/data e confirmar.</p>
                  <Link to="/criar" className="mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-neon">
                    <Sparkles className="w-3.5 h-3.5" /> Continuar criação
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isLoading && (data?.spacePrizes.length ?? 0) > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-lg text-accent">Prêmios do Mapa Espacial</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{data?.spaceSeals.length ?? 0} selo(s)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.spacePrizes.map((prize) => (
              <div key={prize.id} className="glass rounded-2xl overflow-hidden border border-accent/20">
                {prize.image_url && (
                  <img src={prize.image_url} alt={prize.title} className="w-full aspect-square object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                    {prize.threshold} selos · salvo na galeria
                  </div>
                  <div className="font-display text-base text-gradient-neon mt-1">{prize.title}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desbloqueado com {prize.seals_count} selo(s) do segundo mapa.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items.map(({ identity: i, journey, visas }) => {
          const fatal = journey?.final_destination_kind === "fatal";
          const active = journey?.status === "active";
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

                <div className={`mt-3 rounded-lg p-2 text-xs flex items-start gap-2 ${fatal ? "bg-destructive/10 border border-destructive/30" : "bg-muted/30"}`}>
                  {fatal ? <Skull className="w-3.5 h-3.5 mt-0.5 text-destructive" />
                    : <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />}
                  <div className="flex-1">
                    {fatal && <><b>Perdido em</b> {journey.final_destination_name}</>}
                    {active && <>Em viagem · {visas.length}/45 selos</>}
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
                  <button
                    type="button"
                    onClick={async () => {
                      const t = toast.loading("Gerando molde 3D (.stl)...");
                      try {
                        const size = await downloadAvatarSTL(i.avatar_url, i.alien_name, { widthMm: 80 });
                        toast.success(`Molde 3D pronto (${(size / 1024).toFixed(0)} KB) — Bambu · Flashforge · Creality.`, { id: t });
                      } catch (e) {
                        toast.error((e as Error).message, { id: t });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                    title="Baixar .stl para impressoras 3D (Bambu, Flashforge, Creality)"
                  >
                    <Box className="w-3 h-3" /> Molde 3D
                  </button>
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

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Coins, Check } from "lucide-react";
import { toast } from "sonner";
import { SHIPS, RACES } from "@/lib/alien";
import { getHangarState, setHangarSelection, purchaseSkin, type ShipModel, type RaceSkin } from "@/lib/mining.functions";
import shipEsportiva from "@/assets/ship-esportiva.jpg";
import shipOffroad from "@/assets/ship-offroad.jpg";
import shipCorrida from "@/assets/ship-corrida.jpg";
import shipTeleportadora from "@/assets/teleporter-prize.jpg";
import raceStarseed from "@/assets/race-starseed.jpg";
import raceNordico from "@/assets/race-nordico.jpg";
import raceGrey from "@/assets/race-grey.jpg";
import raceReptiliano from "@/assets/race-reptiliano.jpg";
import raceDraconiano from "@/assets/race-draconiano.jpg";
import raceInsectoide from "@/assets/race-insectoide.jpg";
import raceAviario from "@/assets/race-aviario.jpg";
import raceAnunnaki from "@/assets/race-anunnaki.jpg";
import raceSiriano from "@/assets/race-siriano.jpg";
import racePleiadiano from "@/assets/race-pleiadiano.jpg";
import raceLyriano from "@/assets/race-lyriano.jpg";
import raceKashyapa from "@/assets/race-kashyapa.jpg";

const SHIP_IMAGES: Record<ShipModel, string> = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
  teleportadora: shipTeleportadora,
};

const SKIN_IMAGES: Record<RaceSkin, string> = {
  starseed: raceStarseed,
  nordico: raceNordico,
  grey: raceGrey,
  reptiliano: raceReptiliano,
  draconiano: raceDraconiano,
  insectoide: raceInsectoide,
  aviario: raceAviario,
  anunnaki: raceAnunnaki,
  siriano: raceSiriano,
  pleiadiano: racePleiadiano,
  lyriano: raceLyriano,
  kashyapa: raceKashyapa,
};

function skinLabel(skin: RaceSkin) {
  return RACES.find((r) => r.id === skin)?.name ?? skin;
}

export function HangarSelect({
  ownAvatarUrl,
  ownShipUrl,
  onStart,
}: {
  ownAvatarUrl: string | null;
  ownShipUrl: string;
  onStart: (shipImageUrl: string, pilotAvatarUrl: string | null) => void;
}) {
  const getHangar = useServerFn(getHangarState);
  const saveSelection = useServerFn(setHangarSelection);
  const buySkin = useServerFn(purchaseSkin);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["hangar-state"], queryFn: () => getHangar() });
  const [ship, setShip] = useState<ShipModel | null>(null);
  const [skin, setSkin] = useState<RaceSkin | null | undefined>(undefined); // undefined = ainda não escolheu nada (usa próprio avatar)
  const [busySkin, setBusySkin] = useState<RaceSkin | null>(null);

  if (isLoading || !data) {
    return <div className="text-center text-sm text-muted-foreground py-10">Carregando hangar...</div>;
  }

  const selectedShip = ship ?? data.selectedShip;
  const selectedSkin = skin === undefined ? data.selectedSkin : skin;
  const unlockedSet = new Set(data.unlockedSkins);

  async function handleBuy(s: RaceSkin) {
    setBusySkin(s);
    try {
      const result = await buySkin({ data: { skin: s } });
      if (result.alreadyOwned) {
        toast.info("Você já tem essa skin.");
      } else {
        toast.success(`Skin desbloqueada! Saldo: ${result.balance} 🪙`);
      }
      qc.invalidateQueries({ queryKey: ["hangar-state"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      setSkin(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu pra comprar essa skin.");
    } finally {
      setBusySkin(null);
    }
  }

  async function handleStart() {
    try {
      await saveSelection({ data: { selectedShip, selectedSkin: selectedSkin ?? null } });
    } catch (e) {
      console.error(e);
    }
    const shipImageUrl = selectedShip ? SHIP_IMAGES[selectedShip] : ownShipUrl;
    const pilotAvatarUrl = selectedSkin ? SKIN_IMAGES[selectedSkin] : ownAvatarUrl;
    onStart(shipImageUrl, pilotAvatarUrl);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="font-display text-2xl text-center mb-1">Estação Espacial</h2>
      <p className="text-center text-xs text-muted-foreground mb-6">Escolha a nave e o visual do piloto antes de partir</p>

      <h3 className="font-display text-sm mb-2 text-accent">Nave</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {SHIPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setShip(s.id)}
            className={`rounded-xl overflow-hidden border-2 text-left transition ${
              selectedShip === s.id ? "border-accent shadow-neon" : "border-border"
            }`}
          >
            <img src={SHIP_IMAGES[s.id]} alt={s.name} className="w-full aspect-square object-cover" />
            <div className="p-1.5 bg-black/40">
              <div className="text-[11px] font-display flex items-center gap-1">
                {s.name} {selectedShip === s.id && <Check className="w-3 h-3 text-accent" />}
              </div>
              <div className="text-[9px] text-muted-foreground leading-tight">{s.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <h3 className="font-display text-sm mb-2 text-accent">
        Skin do piloto <span className="text-[10px] text-muted-foreground">— desbloqueia 1 nova a cada {data.unlockEveryNCollects} coletas ({data.landed} até agora), ou compre por {data.skinPrice} 🪙</span>
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setSkin(null)}
          className={`flex-shrink-0 w-16 rounded-full overflow-hidden border-2 ${
            selectedSkin === null ? "border-accent shadow-neon" : "border-border"
          }`}
          title="Usar meu avatar"
        >
          {ownAvatarUrl ? (
            <img src={ownAvatarUrl} alt="Meu avatar" className="w-16 h-16 object-cover" />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center text-[9px] text-muted-foreground bg-input">Meu</div>
          )}
        </button>
        {data.raceSkins.map((s) => {
          const unlocked = unlockedSet.has(s);
          return (
            <div key={s} className="flex-shrink-0 flex flex-col items-center gap-1">
              <button
                onClick={() => (unlocked ? setSkin(s) : handleBuy(s))}
                disabled={busySkin === s}
                className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${
                  selectedSkin === s ? "border-accent shadow-neon" : "border-border"
                }`}
                title={unlocked ? skinLabel(s) : `Comprar por ${data.skinPrice} fichas`}
              >
                <img src={SKIN_IMAGES[s]} alt={skinLabel(s)} className={`w-16 h-16 object-cover ${unlocked ? "" : "opacity-30 grayscale"}`} />
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
              <span className="text-[8px] text-muted-foreground text-center leading-none max-w-[64px] truncate">{skinLabel(s)}</span>
              {!unlocked && (
                <span className="text-[8px] flex items-center gap-0.5 text-amber-300">
                  <Coins className="w-2.5 h-2.5" /> {data.skinPrice}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-alien-grad text-primary-foreground font-display font-bold shadow-neon"
      >
        ▶ Partir com essa configuração
      </button>
    </div>
  );
}

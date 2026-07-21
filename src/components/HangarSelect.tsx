import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Coins, Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { SHIPS, RACES } from "@/lib/alien";
import {
  getHangarState, setHangarSelection, purchaseSkin, purchaseShip,
  EXTRA_SHIPS, RACE_SKINS, type ShipModel, type RaceSkin,
} from "@/lib/mining.functions";
import shipEsportiva from "@/assets/ship-esportiva.png";
import shipOffroad from "@/assets/ship-offroad.png";
import shipCorrida from "@/assets/ship-corrida.png";
import shipTeleportadora from "@/assets/teleporter-prize.png";
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
import { getShipStats } from "@/lib/ship-stats";
import shipCadillacticZx from "@/assets/ship-extra-cadillactic-zx.png";
import shipModuloC23 from "@/assets/ship-extra-modulo-c23.png";
import shipNavigatorOriginal from "@/assets/ship-extra-navigator-original.png";
import shipSupersonicForce1 from "@/assets/ship-extra-supersonic-force1.png";
import shipEasyRiderBus from "@/assets/ship-extra-easy-rider-bus.png";
import shipUnilander77 from "@/assets/ship-extra-unilander-77.png";
import shipUnilander from "@/assets/ship-extra-unilander.png";
import shipEggLander1001 from "@/assets/ship-extra-egg-lander-1001.png";
import shipNavigator from "@/assets/ship-extra-navigator.png";
import shipHoverCoupeRz from "@/assets/ship-extra-hover-coupe-rz.png";

// ---- leva nova: 12 naves, todas suas próprias imagens (fundo removido) ----
import shipCruzerNoturno from "@/assets/ship-extra-cruzer-noturno.png";
import shipCruzadorAurun from "@/assets/ship-extra-cruzador-aurun.png";
import shipAranhaLander from "@/assets/ship-extra-aranha-lander.png";
import shipGalacticDiamond from "@/assets/ship-extra-galactic-diamond.png";
import shipModalMultidimensional from "@/assets/ship-extra-modal-multidimensional.png";
import shipSuperDutyVanguard from "@/assets/ship-extra-super-duty-vanguard.png";
import shipSpeedBeePredator from "@/assets/ship-extra-speed-bee-predator.png";
import shipCruzerDourado from "@/assets/ship-extra-cruzer-dourado.png";
import shipLanderExpedicao from "@/assets/ship-extra-lander-expedicao.png";
import shipSpeedBeeRubi from "@/assets/ship-extra-speed-bee-rubi.png";
import shipCruzerAereo from "@/assets/ship-extra-cruzer-aereo.png";
import shipBolhaLander from "@/assets/ship-extra-bolha-lander.png";

const SHIP_IMAGES: Record<ShipModel, string> = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
  teleportadora: shipTeleportadora,
};

// As 11 primeiras naves extras ainda usam as 4 imagens base como
// placeholder (pendente de imagem própria gerada/licenciada). As 15
// mais novas abaixo já têm imagem real, recortada no contorno.
const EXTRA_SHIP_IMAGES: Record<string, string> = {
  aerodeslizador: shipEsportiva,
  "vtol-classica": shipOffroad,
  quadricoptero: shipCorrida,
  furtiva: shipTeleportadora,

  // ---- leva de 15 naves novas — imagens reais, recortadas no contorno ----
  "cadillactic-zx": shipCadillacticZx,
  "modulo-c23": shipModuloC23,
  "navigator-original": shipNavigatorOriginal,
  "supersonic-force1": shipSupersonicForce1,
  "easy-rider-bus": shipEasyRiderBus,
  "unilander-77": shipUnilander77,
  "unilander": shipUnilander,
  "egg-lander-1001": shipEggLander1001,
  "navigator": shipNavigator,
  "hover-coupe-rz": shipHoverCoupeRz,

  // ---- leva nova: 12 naves ----
  "cruzer-noturno": shipCruzerNoturno,
  "cruzador-aurun": shipCruzadorAurun,
  "aranha-lander": shipAranhaLander,
  "galactic-diamond": shipGalacticDiamond,
  "modal-multidimensional": shipModalMultidimensional,
  "super-duty-vanguard": shipSuperDutyVanguard,
  "speed-bee-predator": shipSpeedBeePredator,
  "cruzer-dourado": shipCruzerDourado,
  "lander-expedicao": shipLanderExpedicao,
  "speed-bee-rubi": shipSpeedBeeRubi,
  "cruzer-aereo": shipCruzerAereo,
  "bolha-lander": shipBolhaLander,
};

// Naves cuja arte original nasce com o bico virado pra ESQUERDA — mesma
// lista que recebeu noseAngleDeg: 180 em ship-stats.ts. A miniatura da
// loja é espelhada (scaleX(-1)) pra mostrar a nave já virada pro lado
// certo (bico/farol pra direita), igual vai aparecer parada no jogo.
function shipThumbTransform(_id: string) {
  return "scale(1.08)";
}

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
  onStart: (shipImageUrl: string, pilotAvatarUrl: string | null, shipKey?: string | null) => void;
}) {
  const getHangar = useServerFn(getHangarState);
  const saveSelection = useServerFn(setHangarSelection);
  const buySkin = useServerFn(purchaseSkin);
  const buyShip = useServerFn(purchaseShip);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hangar-state"],
    queryFn: () => withHangarTimeout(getHangar(), 6500),
    retry: false,
  });
  const [ship, setShip] = useState<string | null>(null);
  const [skin, setSkin] = useState<RaceSkin | null | undefined>(undefined); // undefined = ainda não escolheu nada (usa próprio avatar)
  const [busySkin, setBusySkin] = useState<RaceSkin | null>(null);
  const [busyShip, setBusyShip] = useState<string | null>(null);

  if (isLoading && !isError) {
    return <div className="text-center text-sm text-muted-foreground py-10">Carregando hangar...</div>;
  }

  const hangarState = data ?? {
    unlockedExtraShips: EXTRA_SHIPS.filter((s) => s.price === 0).map((s) => s.id),
    raceSkins: RACE_SKINS,
    unlockedSkins: [RACE_SKINS[0]],
    selectedShip: "esportiva",
    selectedSkin: null,
    landed: 0,
    skinPrice: 100,
  };

  const selectedShip = ship ?? hangarState.selectedShip;
  const selectedSkin = skin === undefined ? hangarState.selectedSkin : skin;
  const unlockedSet = new Set(hangarState.unlockedSkins);
  const unlockedShipSet = new Set(hangarState.unlockedExtraShips);

  async function handleBuyShip(id: string) {
    setBusyShip(id);
    try {
      const result = await buyShip({ data: { ship: id } });
      if (result.alreadyOwned) {
        toast.info("Você já tem essa nave.");
      } else {
        toast.success(`Nave desbloqueada! Saldo: ${result.balance} 🪙`);
      }
      qc.invalidateQueries({ queryKey: ["hangar-state"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      setShip(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu pra comprar essa nave.");
    } finally {
      setBusyShip(null);
    }
  }

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
      await withHangarTimeout(saveSelection({ data: { selectedShip, selectedSkin: selectedSkin ?? null } }), 3500);
    } catch (e) {
      console.error(e);
    }
    const shipImageUrl =
      (SHIP_IMAGES as Record<string, string>)[selectedShip] ?? EXTRA_SHIP_IMAGES[selectedShip] ?? ownShipUrl;
    const pilotAvatarUrl = selectedSkin ? SKIN_IMAGES[selectedSkin] : ownAvatarUrl;
    onStart(shipImageUrl, pilotAvatarUrl, selectedShip);
  }

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-6 relative"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 10%, rgba(61,219,201,0.10), transparent 55%), " +
          "radial-gradient(ellipse at 85% 30%, rgba(232,179,74,0.08), transparent 50%), " +
          "radial-gradient(1px 1px at 10% 20%, #fff 99%, transparent), " +
          "radial-gradient(1px 1px at 80% 15%, #fff 99%, transparent), " +
          "radial-gradient(1px 1px at 60% 60%, #cbd5e1 99%, transparent), " +
          "radial-gradient(1.5px 1.5px at 30% 80%, #fff 99%, transparent), " +
          "radial-gradient(1px 1px at 90% 75%, #fff 99%, transparent), " +
          "linear-gradient(180deg, #05010f 0%, #0a0e27 100%)",
        backgroundColor: "#05010f",
      }}
    >
      <h2 className="font-display text-2xl text-center mb-1">Estação Espacial</h2>
      <p className="text-center text-xs text-muted-foreground mb-6">Escolha a nave e o visual do piloto antes de partir</p>

      <h3 className="font-display text-sm mb-2 text-accent">Nave</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {SHIPS.map((s) => {
          const stats = getShipStats(s.id);
          return (
          <button
            key={s.id}
            onClick={() => setShip(s.id)}
            className={`rounded-xl overflow-hidden border-2 text-left transition ${
              selectedShip === s.id ? "border-accent shadow-neon" : "border-border"
            }`}
          >
            <img
              src={SHIP_IMAGES[s.id]}
              alt={s.name}
              className="w-full aspect-square object-contain bg-black/20"
              style={{
                transform: shipThumbTransform(s.id),
              }}
            />
            <div className="p-1.5 bg-black/40">
              <div className="text-[11px] font-display flex items-center gap-1">
                {s.name} {selectedShip === s.id && <Check className="w-3 h-3 text-accent" />}
              </div>
              <div className="text-[9px] text-muted-foreground leading-tight">{s.desc}</div>
              <div className="text-[8px] text-teal-300/80 leading-tight mt-0.5">{stats.blurb}</div>
            </div>
          </button>
          );
        })}
      </div>

      <h3 className="font-display text-sm mb-2 text-accent">
        Naves extras <span className="text-[10px] text-muted-foreground">— 4 grátis, as demais por 800 🪙 cada</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {EXTRA_SHIPS.map((s) => {
          const unlocked = unlockedShipSet.has(s.id);
          const stats = getShipStats(s.id);
          return (
            <div key={s.id} className="flex flex-col gap-1">
              <button
                onClick={() => (unlocked ? setShip(s.id) : handleBuyShip(s.id))}
                disabled={busyShip === s.id}
                className={`relative rounded-xl overflow-hidden border-2 text-left transition ${
                  selectedShip === s.id ? "border-accent shadow-neon" : "border-border"
                }`}
              >
                <img
                  src={EXTRA_SHIP_IMAGES[s.id]}
                  alt={s.name}
                  className={`w-full aspect-square object-contain bg-black/20 ${unlocked ? "" : "opacity-90"}`}
                  style={{
                    transform: shipThumbTransform(s.id),
                  }}
                />
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                    <Lock className="w-4 h-4 text-white" />
                    <span className="text-[9px] flex items-center gap-0.5 text-amber-200 bg-black/60 px-1.5 rounded-full">
                      <Coins className="w-2.5 h-2.5" /> {s.price}
                    </span>
                  </div>
                )}
                <div className="p-1.5 bg-black/40">
                  <div className="text-[11px] font-display flex items-center gap-1">
                    {s.name} {selectedShip === s.id && <Check className="w-3 h-3 text-accent" />}
                  </div>
                  <div className="text-[8px] text-teal-300/80 leading-tight mt-0.5">{stats.blurb}</div>
                </div>
              </button>
              {unlocked && (
                <button
                  onClick={() => toast.info("Mudar de cor precisa gerar uma imagem nova pela IA — em breve.")}
                  className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground border border-border rounded-full py-1"
                >
                  <Palette className="w-2.5 h-2.5" /> Mudar cor (IA)
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="font-display text-sm mb-2 text-accent">
        Skin do piloto <span className="text-[10px] text-muted-foreground">— compre por {hangarState.skinPrice} 🪙 (fichas ganhas jogando ou compradas)</span>
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
        {hangarState.raceSkins.map((s) => {
          const unlocked = unlockedSet.has(s);
          return (
            <div key={s} className="flex-shrink-0 flex flex-col items-center gap-1">
              <button
                onClick={() => (unlocked ? setSkin(s) : handleBuy(s))}
                disabled={busySkin === s}
                className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${
                  selectedSkin === s ? "border-accent shadow-neon" : "border-border"
                }`}
                title={unlocked ? skinLabel(s) : `Comprar por ${hangarState.skinPrice} fichas`}
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
                  <Coins className="w-2.5 h-2.5" /> {hangarState.skinPrice}
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

function withHangarTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("O hangar demorou demais para responder")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

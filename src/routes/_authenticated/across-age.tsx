import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { listMyIdentities } from "@/lib/identities.functions";
import { getMiningState, submitMiningResult, clearDestinationWave, type MaterialKey } from "@/lib/mining.functions";
import { getDestination } from "@/lib/intergalactic";
import { getBankForDestination } from "@/lib/intergalactic-questions";
import { getTeamDestination } from "@/lib/team-destinations";
import { listMyUpgrades } from "@/lib/upgrades.functions";
import { SOSButton } from "@/components/SOSButton";
import { HangarSelect } from "@/components/HangarSelect";
import { TeleporterLoadingIntro } from "@/components/TeleporterLoadingIntro";
import { getBiomeTheme } from "@/lib/space-biomes";
import shipEsportiva from "@/assets/ship-esportiva.jpg";
import shipOffroad from "@/assets/ship-offroad.jpg";
import shipCorrida from "@/assets/ship-corrida.jpg";

const SHIP_PREVIEWS: Record<string, string> = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
};

export const Route = createFileRoute("/_authenticated/across-age")({
  validateSearch: (s: Record<string, unknown>) => ({
    identityId: typeof s.identityId === "string" ? s.identityId : undefined,
    destinationId: typeof s.destinationId === "string" ? s.destinationId : undefined,
  }),
  component: AcrossAge,
});

function AcrossAge() {
  const { identityId, destinationId } = Route.useSearch();
  const listIdentities = useServerFn(listMyIdentities);
  const getMining = useServerFn(getMiningState);
  const submitResult = useServerFn(submitMiningResult);
  const getUpgrades = useServerFn(listMyUpgrades);
  const clearWave = useServerFn(clearDestinationWave);
  const qc = useQueryClient();
  const [showIntro, setShowIntro] = useState(true);
  const [loadout, setLoadout] = useState<{ shipImageUrl: string; pilotAvatarUrl: string | null } | null>(null);

  const { data: identitiesData, isLoading: loadingIdentities } = useQuery({
    queryKey: ["identities"],
    queryFn: () => listIdentities(),
  });
  const { data: miningData, isLoading: loadingMining } = useQuery({
    queryKey: ["mining-state"],
    queryFn: () => getMining(),
  });
  const { data: upgradesData } = useQuery({
    queryKey: ["upgrades"],
    queryFn: () => getUpgrades(),
  });
  const upgradeLevels: Record<string, number> = {};
  (upgradesData?.upgrades ?? []).forEach((u: { upgrade_key: string; level: number }) => {
    upgradeLevels[u.upgrade_key] = u.level;
  });

  const identities = identitiesData?.identities ?? [];
  const pilot = identities.find((i) => i.id === identityId) ?? identities[0];

  const handleResult = useCallback(
    async (materialKey: MaterialKey, success: boolean) => {
      try {
        const result = await submitResult({ data: { materialKey, success } });
        if (success) {
          qc.invalidateQueries({ queryKey: ["wallet"] });
          toast.success(`Material coletado! +${result.fichasEarned} 🪙`);
        }
      } catch (e) {
        console.error(e);
        toast.error("Não deu pra salvar o progresso dessa viagem.");
      }
    },
    [submitResult, qc]
  );

  const handleWaveCleared = useCallback(async () => {
    if (!destinationId) return;
    try {
      const result = await clearWave({ data: { destinationId } });
      if (!result.alreadyCleared) {
        qc.invalidateQueries({ queryKey: ["route-state"] });
        qc.invalidateQueries({ queryKey: ["wallet"] });
        toast.success(`Fase completa! +50 🪙 de bônus (saldo: ${result.balance}). Próximo destino liberado 🚀`);
      }
    } catch (e) {
      console.error(e);
    }
  }, [clearWave, destinationId, qc]);

  if (showIntro) {
    return <TeleporterLoadingIntro onComplete={() => setShowIntro(false)} />;
  }

  if (loadingIdentities || loadingMining) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <Rocket className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          Você precisa criar uma identidade alien (com avatar e nave) antes de pilotar no Across Age.
        </p>
        <Link to="/criar" className="underline text-accent">
          Criar identidade
        </Link>
      </div>
    );
  }

  const ownShipUrl = pilot.ship_image_url || SHIP_PREVIEWS[pilot.ship_category ?? "offroad"];

  if (!loadout) {
    return (
      <HangarSelect
        ownAvatarUrl={pilot.avatar_url}
        ownShipUrl={ownShipUrl}
        onStart={(shipImageUrl, pilotAvatarUrl) => setLoadout({ shipImageUrl, pilotAvatarUrl })}
      />
    );
  }

  return (
    <GameCanvas
      key={`${pilot.id}-${destinationId ?? "default"}`}
      pilotAvatarUrl={loadout.pilotAvatarUrl}
      shipImageUrl={loadout.shipImageUrl}
      pilotName={pilot.alien_name ?? "Piloto"}
      startLevel={destinationId ? (getDestination(destinationId)?.level ?? 1) : (miningData?.level ?? 1)}
      destinationId={destinationId ?? null}
      destinationFact={destinationId ? pickDestinationFact(destinationId) : null}
      upgradeLevels={upgradeLevels}
      onResult={handleResult}
      onWaveCleared={handleWaveCleared}
    />
  );
}

function pickDestinationFact(destinationId: string): string | null {
  const teamDest = getTeamDestination(destinationId);
  if (teamDest) {
    const facts = [teamDest.highlight, teamDest.trivia, `descoberta: ${teamDest.discovered}`, `distância: ${teamDest.distance}`];
    return facts[Math.floor(Math.random() * facts.length)];
  }
  const bank = getBankForDestination(destinationId);
  if (bank.length === 0) return null;
  const pick = bank[Math.floor(Math.random() * bank.length)];
  const answerText = pick.choices[pick.answer];
  return `${pick.q} ${answerText}.`;
}

// =========================================================
// GAME CANVAS — motor do Across Age (mundo aberto)
// A nave voa livre por um mapa maior que a tela (câmera segue
// a nave). Pontos de coleta ficam fixos no mapa; detritos são
// obstáculos que rondam o espaço. Voltar à base reabastece e
// avança pra próxima leva de coleta.
// =========================================================

const MATERIALS: {
  id: MaterialKey; name: string; icon: string; tool: "rede" | "ima" | "sucao";
  desc: string; state: string;
}[] = [
  { id: "ouro", name: "Ouro", icon: "🥇", tool: "rede", desc: "Pepitas soltas espalhadas na superfície rochosa.", state: "Sólido solto" },
  { id: "monumento", name: "Partes de monumento", icon: "🗿", tool: "rede", desc: "Fragmentos sólidos e pesados de uma estrutura antiga.", state: "Sólido solto" },
  { id: "niquel", name: "Níquel", icon: "⚙️", tool: "ima", desc: "Veios metálicos ferromagnéticos cravados na rocha.", state: "Metal magnético" },
  { id: "ferramenta", name: "Ferramenta antiga", icon: "🔨", tool: "ima", desc: "Peça de metal enferrujado, fortemente atraída por ímãs.", state: "Metal magnético" },
  { id: "cadmio", name: "Cádmio", icon: "🧪", tool: "sucao", desc: "Bolsão de vapor metálico denso, sob pressão.", state: "Gás / fluido" },
  { id: "alien", name: "Tecnologia alienígena", icon: "🛸", tool: "sucao", desc: "Energia instável em estado fluido, de origem desconhecida.", state: "Gás / fluido" },
];
const TOOLS = [
  { id: "rede", name: "Rede metálica", icon: "🕸️", desc: "Para sólidos soltos" },
  { id: "ima", name: "Superímã", icon: "🧲", desc: "Para metais magnéticos" },
  { id: "sucao", name: "Sucção de dutos", icon: "🌀", desc: "Para gases e fluidos" },
] as const;
const TOOL_VISUAL: Record<string, { icon: string; verb: string; label: string }> = {
  rede: { icon: "🕸️", verb: "Lançando a rede", label: "🕸️ PUXAR A REDE" },
  ima: { icon: "🧲", verb: "Ativando o ímã", label: "🧲 ATIVAR ÍMÃ" },
  sucao: { icon: "🌀", verb: "Abrindo o conduto", label: "🌀 SUGAR" },
};
const FUNNY_LOSSES = [
  "Combustível zerou no meio do nada. Você fica à deriva...",
  "Vazamento no tanque — hora de ser rebocado.",
  "Nave com defeito — peças baratas da loja.",
  "Motor engasgou. Sinal de socorro enviado à base.",
  "O manche travou porque alguém derramou suco de asteroide nele.",
  "Reserva zerada a poucos metros da base. Que azar.",
];
const DEBRIS_KINDS = ["geladeira", "satelite", "meteorito", "nave", "ovni"] as const;

function drawDebrisPiece(
  c: CanvasRenderingContext2D,
  d: { x: number; y: number; r: number; kind: typeof DEBRIS_KINDS[number]; rot: number }
) {
  c.save();
  c.translate(d.x, d.y);
  c.rotate(d.rot);
  const s = d.r;
  switch (d.kind) {
    case "geladeira": {
      c.fillStyle = "#9aa0c8";
      c.fillRect(-s * 0.6, -s, s * 1.2, s * 2);
      c.strokeStyle = "#4a4438"; c.lineWidth = 1.5;
      c.strokeRect(-s * 0.6, -s, s * 1.2, s * 2);
      c.beginPath(); c.moveTo(-s * 0.6, -s * 0.15); c.lineTo(s * 0.6, -s * 0.15); c.stroke();
      c.fillStyle = "#4a4438";
      c.fillRect(s * 0.25, -s * 0.75, s * 0.12, s * 0.4);
      break;
    }
    case "satelite": {
      c.fillStyle = "#c9cfe8";
      c.beginPath(); c.ellipse(0, 0, s * 0.4, s * 0.9, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#4a4438"; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = "#3a4a7a";
      c.fillRect(-s * 2.1, -s * 0.35, s * 1.5, s * 0.7);
      c.fillStyle = "#ff7a4a";
      c.fillRect(s * 0.6, -s * 0.35, s * 1.5, s * 0.7);
      c.strokeStyle = "#1c2050"; c.lineWidth = 1;
      c.strokeRect(-s * 2.1, -s * 0.35, s * 1.5, s * 0.7);
      c.strokeRect(s * 0.6, -s * 0.35, s * 1.5, s * 0.7);
      c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, -s * 1.4); c.stroke();
      break;
    }
    case "meteorito": {
      c.fillStyle = "#8a6a5a";
      c.beginPath();
      const pts = 7;
      for (let i = 0; i < pts; i++) {
        const ang = (i / pts) * Math.PI * 2;
        const rr = s * (0.75 + Math.sin(i * 2.7) * 0.25);
        const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.fill();
      c.strokeStyle = "#5a4438"; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = "#5a4438";
      c.beginPath(); c.arc(-s * 0.2, -s * 0.1, s * 0.18, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(s * 0.25, s * 0.2, s * 0.14, 0, Math.PI * 2); c.fill();
      break;
    }
    case "nave": {
      c.fillStyle = "#c25acb";
      c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.7, s * 0.8); c.lineTo(0, s * 0.4); c.lineTo(-s * 0.7, s * 0.8); c.closePath(); c.fill();
      c.strokeStyle = "#5a2060"; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = "#ffd27a";
      c.beginPath(); c.arc(0, -s * 0.1, s * 0.22, 0, Math.PI * 2); c.fill();
      break;
    }
    case "ovni":
    default: {
      c.fillStyle = "#3ddbc9";
      c.beginPath(); c.ellipse(0, 0, s * 1.1, s * 0.45, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#1c8f8f"; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = "#a8f5ec";
      c.beginPath(); c.ellipse(0, -s * 0.25, s * 0.55, s * 0.4, 0, Math.PI, Math.PI * 2); c.fill();
      c.fillStyle = "#ffd27a";
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.arc(i * s * 0.6, s * 0.1, s * 0.1, 0, Math.PI * 2); c.fill();
      }
      break;
    }
  }
  c.restore();
}

type GameCanvasProps = {
  pilotAvatarUrl: string | null;
  shipImageUrl: string;
  pilotName: string;
  startLevel: number;
  destinationId?: string | null;
  destinationFact?: string | null;
  upgradeLevels?: Record<string, number>;
  onResult: (materialKey: MaterialKey, success: boolean) => void;
  onWaveCleared?: () => void;
};

function GameCanvas({ pilotAvatarUrl, shipImageUrl, pilotName, startLevel, destinationId, destinationFact, upgradeLevels, onResult, onWaveCleared }: GameCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rescueRef = useRef<(() => void) | undefined>(undefined);
  const navigate = useNavigate();
  const theme = getBiomeTheme(destinationId);
  const ups = upgradeLevels ?? {};
  const upPropulsor = ups["propulsor"] ?? 0;
  const upTanque = ups["tanque"] ?? 0;
  const upOxigenio = ups["oxigenio"] ?? 0;
  const upCarga = ups["carga-mineracao"] ?? 0;
  const toolUpgradeKey: Record<"rede" | "ima" | "sucao", string> = { rede: "gancho", ima: "ima", sucao: "sucao" };

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0;

    const shipImg = new Image();
    shipImg.crossOrigin = "anonymous";
    shipImg.src = shipImageUrl;
    let shipImgReady = false;
    const SHIP_TARGET_SIZE = 96;
    let shipDrawW = SHIP_TARGET_SIZE, shipDrawH = SHIP_TARGET_SIZE;
    shipImg.onload = () => {
      shipImgReady = true;
      const ar = shipImg.naturalWidth / shipImg.naturalHeight || 1;
      if (ar >= 1) { shipDrawW = SHIP_TARGET_SIZE; shipDrawH = SHIP_TARGET_SIZE / ar; }
      else { shipDrawH = SHIP_TARGET_SIZE; shipDrawW = SHIP_TARGET_SIZE * ar; }
    };

    let bgImgReady = false;
    const bgImg = new Image();
    if (theme.bgImageUrl) {
      bgImg.onload = () => { bgImgReady = true; };
      bgImg.src = theme.bgImageUrl;
    }

    const FICHAS_PER_COLLECT = 1;
    const decorPoints: { x: number; y: number; emoji: string; size: number }[] = [];
    const MAX_FUEL = 100 + upTanque * 20;
    const MAX_O2 = 60 + upOxigenio * 15;
    const BASE_CARGO_CAP = 4 + upCarga * 2;
    function cargoCap() { return Math.round(BASE_CARGO_CAP * (1 + state.cargoBonusPct / 100)); }
    const O2_DRAIN_RATE = 1; // por segundo, sempre correndo (independente de acelerar)

    const state = {
      level: Math.min(5, Math.max(1, startLevel)),
      collected: 0,
      landed: 0,
      crashed: 0,
      fuel: MAX_FUEL,
      o2: MAX_O2,
      fichas: 0,
      flashT: 0,
      cargoBonusPct: 0,
      phaseFichas: 0,
      phaseStartMs: 0,
      phaseDone: false,
    };

    const el = <T extends HTMLElement = HTMLElement>(sel: string) => root!.querySelector<T>(sel)!;

    type Node = { x: number; y: number; material: typeof MATERIALS[number]; collected: boolean };
    type Debris = { x: number; y: number; vx: number; vy: number; r: number; kind: typeof DEBRIS_KINDS[number]; rot: number; spin: number };

    let ship = { x: 0, y: 0, vx: 0, vy: 0, facing: 1 };
    let WORLD_W = 1800, WORLD_H = 900;
    let camX = 0, camY = 0;
    let base = { x: 100, y: 450 };
    let nodes: Node[] = [];
    let debris: Debris[] = [];
    let stars: { x: number; y: number; r: number; tw: number }[] = [];
    let running = false;
    let rafId = 0;
    const keys = { left: false, right: false, thrust: false };
    let nearbyNodeIndex = -1;
    let fuelBurnRate = 0, thrustPower = 0, damping = 0.992;

    function difficultyParams(level: number) {
      return {
        fuelBurnRate: (5 + level * 0.6) * (theme.danger ? 1.4 : 1),
        thrustPower: 150 * (1 + upPropulsor * 0.15),
        damping: 0.992,
        nodeCount: 5 + level,
        debrisCount: 3 + Math.floor(level * 0.9),
        debrisSpeed: 26 + level * 9,
        worldW: 1700 + level * 130,
        worldH: 850 + level * 35,
      };
    }

    function resize() { W = canvas!.width = canvas!.clientWidth; H = canvas!.height = canvas!.clientHeight; }

    function makeStars() {
      stars = Array.from({ length: 160 }, () => ({
        x: Math.random() * WORLD_W, y: Math.random() * WORLD_H,
        r: Math.random() * 1.6 + 0.3, tw: Math.random() * Math.PI * 2,
      }));
    }

    function updateHud() {
      el("#fichas-badge").textContent = `🪙 ${state.fichas}`;
      el<HTMLDivElement>("#fuel-fill").style.width = Math.max(0, (state.fuel / MAX_FUEL) * 100) + "%";
      el<HTMLDivElement>("#o2-fill").style.width = Math.max(0, (state.o2 / MAX_O2) * 100) + "%";
      const total = nodes.length || 1;
      const done = nodes.filter((n) => n.collected).length;
      el("#cargo-count").textContent = `📦 ${done}/${total} · 🎒 ${state.collected}/${cargoCap()}`;
      el("#level-badge").textContent = `NÍVEL ${state.level}/5`;
    }

    function resetWave() {
      const p = difficultyParams(state.level);
      fuelBurnRate = p.fuelBurnRate; thrustPower = p.thrustPower; damping = p.damping;
      WORLD_W = p.worldW; WORLD_H = p.worldH;
      base = { x: 110, y: WORLD_H / 2 };
      ship = { x: base.x, y: base.y - 6, vx: 0, vy: 0, facing: 1 };
      state.fuel = MAX_FUEL;
      state.o2 = MAX_O2;
      state.phaseFichas = 0;
      state.phaseStartMs = performance.now();
      state.phaseDone = false;
      nodes = Array.from({ length: p.nodeCount }, () => ({
        x: 260 + Math.random() * (WORLD_W - 360),
        y: 60 + Math.random() * (WORLD_H - 120),
        material: MATERIALS[Math.floor(Math.random() * MATERIALS.length)],
        collected: false,
      }));
      debris = Array.from({ length: p.debrisCount }, () => {
        const a = Math.random() * Math.PI * 2;
        const kind = DEBRIS_KINDS[Math.floor(Math.random() * DEBRIS_KINDS.length)];
        return {
          x: 260 + Math.random() * (WORLD_W - 360), y: 60 + Math.random() * (WORLD_H - 120),
          vx: Math.cos(a) * p.debrisSpeed, vy: Math.sin(a) * p.debrisSpeed,
          r: 10 + Math.random() * 9, kind, rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * (kind === "ovni" ? 0.6 : 1.6),
        };
      });
      nearbyNodeIndex = -1;
      decorPoints.length = 0;
      const decorCount = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < decorCount; i++) {
        decorPoints.push({
          x: 100 + Math.random() * (WORLD_W - 200),
          y: 40 + Math.random() * (WORLD_H - 80),
          emoji: theme.decor[Math.floor(Math.random() * theme.decor.length)],
          size: 22 + Math.random() * 14,
        });
      }
      makeStars();
      camX = Math.max(0, Math.min(WORLD_W - W, ship.x - W / 2));
      camY = Math.max(0, Math.min(WORLD_H - H, ship.y - H / 2));
      updateHud();
    }

    function drawBase(c: CanvasRenderingContext2D, b: { x: number; y: number }) {
      c.save();
      c.translate(b.x, b.y);
      const grad = c.createRadialGradient(-6, -6, 4, 0, 0, 30);
      grad.addColorStop(0, "#a8f5ec"); grad.addColorStop(1, "#1c8f8f");
      c.fillStyle = grad; c.shadowColor = "#3ddbc9"; c.shadowBlur = 20;
      c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = "#eef0ff"; c.lineWidth = 2; c.setLineDash([3, 3]);
      c.beginPath(); c.arc(0, 0, 38, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.font = "20px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("🌍", 0, 0);
      c.restore();
      c.save();
      c.font = "10px monospace"; c.fillStyle = "#3ddbc9"; c.textAlign = "center";
      c.fillText("BASE", b.x, b.y + 52);
      c.restore();
    }

    function drawNode(c: CanvasRenderingContext2D, n: Node) {
      c.save();
      c.translate(n.x, n.y);
      const pulse = 0.8 + Math.sin(performance.now() / 300 + n.x) * 0.2;
      c.strokeStyle = "rgba(61,219,201,0.65)"; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 20 * pulse, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "rgba(61,219,201,0.12)";
      c.beginPath(); c.arc(0, 0, 20 * pulse, 0, Math.PI * 2); c.fill();
      c.font = "20px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(n.material.icon, 0, 0);
      c.restore();
    }

    function drawShip(c: CanvasRenderingContext2D, thrustingUp: boolean, thrustingSide: boolean) {
      for (let i = 0; i < state.collected; i++) {
        const back = 30 + i * 15;
        const tx = ship.x - ship.facing * back, ty = ship.y;
        c.font = "13px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText("📦", tx, ty);
      }
      c.save();
      c.translate(ship.x, ship.y);
      c.scale(ship.facing, 1);
      if (shipImgReady) {
        c.drawImage(shipImg, -shipDrawW / 2, -shipDrawH / 2, shipDrawW, shipDrawH);
      } else {
        c.fillStyle = thrustingUp || thrustingSide ? "#ff9d3d" : "#3ddbc9";
        c.beginPath(); c.moveTo(14, 0); c.lineTo(-10, -9); c.lineTo(-6, 0); c.lineTo(-10, 9); c.closePath(); c.fill();
      }
      if (thrustingSide) {
        const flameX = shipImgReady ? -shipDrawW / 2 + 3 : -8;
        c.fillStyle = "#ffd27a";
        c.beginPath(); c.moveTo(flameX, -4); c.lineTo(flameX - 12 - Math.random() * 8, 0); c.lineTo(flameX, 4); c.closePath(); c.fill();
      }
      c.restore();
      if (thrustingUp) {
        const flameY = shipImgReady ? shipDrawH / 2 - 3 : 9;
        c.fillStyle = "#ffd27a";
        c.beginPath(); c.moveTo(ship.x - 4, ship.y + flameY); c.lineTo(ship.x, ship.y + flameY + 12 + Math.random() * 8); c.lineTo(ship.x + 4, ship.y + flameY); c.closePath(); c.fill();
      }
    }

    function draw() {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, theme.skyTop);
      bgGrad.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(-camX, -camY);

      if (bgImgReady) {
        ctx.globalAlpha = 0.8;
        ctx.drawImage(bgImg, 0, 0, WORLD_W, WORLD_H);
        ctx.globalAlpha = 1;
        // véu escuro pra manter nós/detritos/HUD legíveis por cima da foto
        ctx.fillStyle = "rgba(5,7,20,0.28)";
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      }

      ctx.fillStyle = theme.starColor;
      stars.forEach((s) => {
        s.tw += 0.02;
        ctx.globalAlpha = 0.4 + Math.sin(s.tw) * 0.4;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = theme.horizonGlow; ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, WORLD_W - 4, WORLD_H - 4);

      // silhueta de horizonte decorativa (estilo HCR2), fixa perto do fundo do mundo
      ctx.fillStyle = theme.horizonColor;
      ctx.beginPath();
      const ridgeY = WORLD_H - 26;
      ctx.moveTo(0, WORLD_H);
      ctx.lineTo(0, ridgeY);
      for (let x = 0; x <= WORLD_W; x += 60) {
        const bump = Math.sin(x * 0.01 + 1.3) * 14 + Math.sin(x * 0.037) * 6;
        ctx.lineTo(x, ridgeY + bump);
      }
      ctx.lineTo(WORLD_W, WORLD_H);
      ctx.closePath(); ctx.fill();

      // objetos cômicos decorativos (não interagem, só dão graça ao cenário)
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      decorPoints.forEach((d) => {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.font = `${d.size}px sans-serif`;
        ctx.fillText(d.emoji, d.x, d.y);
        ctx.restore();
      });

      drawBase(ctx, base);
      nodes.forEach((n) => { if (!n.collected) drawNode(ctx, n); });
      debris.forEach((d) => drawDebrisPiece(ctx, d));
      drawShip(ctx, keys.thrust && state.fuel > 0, (keys.left || keys.right) && state.fuel > 0);
      ctx.restore();

      if (state.flashT > 0) {
        ctx.fillStyle = `rgba(255,92,92,${Math.min(0.35, state.flashT)})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    let lastT = 0;
    function loop(t: number) {
      if (!running) return;
      const dt = Math.min((t - lastT) / 1000, 0.05) || 0.016;
      lastT = t;
      update(dt);
      draw();
      if (running) rafId = requestAnimationFrame(loop);
    }

    function update(dt: number) {
      if (state.flashT > 0) state.flashT -= dt;
      state.o2 = Math.max(0, state.o2 - O2_DRAIN_RATE * dt);
      let burningFuel = false;
      if (keys.left && state.fuel > 0) {
        ship.vx -= thrustPower * dt;
        ship.facing = -1;
        burningFuel = true;
      }
      if (keys.right && state.fuel > 0) {
        ship.vx += thrustPower * dt;
        ship.facing = 1;
        burningFuel = true;
      }
      if (keys.thrust && state.fuel > 0) {
        ship.vy -= thrustPower * dt;
        burningFuel = true;
      }
      if (burningFuel) state.fuel = Math.max(0, state.fuel - fuelBurnRate * dt);
      ship.vx *= damping; ship.vy *= damping;
      ship.x += ship.vx * dt; ship.y += ship.vy * dt;
      const margin = shipImgReady ? Math.max(shipDrawW, shipDrawH) / 2 + 4 : 18;
      ship.x = Math.max(margin, Math.min(WORLD_W - margin, ship.x));
      ship.y = Math.max(margin, Math.min(WORLD_H - margin, ship.y));

      debris.forEach((d) => {
        d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.spin * dt;
        if (d.x < d.r || d.x > WORLD_W - d.r) d.vx *= -1;
        if (d.y < d.r || d.y > WORLD_H - d.r) d.vy *= -1;
      });
      const shipHitR = shipImgReady ? (Math.max(shipDrawW, shipDrawH) / 2) * 0.55 : 10;
      for (const d of debris) {
        const dist = Math.hypot(ship.x - d.x, ship.y - d.y);
        if (dist < d.r + shipHitR) {
          state.fuel = Math.max(0, state.fuel - 14);
          state.flashT = 0.3;
          const ang = Math.atan2(ship.y - d.y, ship.x - d.x);
          ship.vx += Math.cos(ang) * 160; ship.vy += Math.sin(ang) * 160;
          break;
        }
      }

      nearbyNodeIndex = -1;
      if (state.collected < cargoCap()) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.collected) continue;
          const toolEase = ups[toolUpgradeKey[n.material.tool]] ?? 0;
          const pickupRadius = 40 + toolEase * 8;
          if (Math.hypot(ship.x - n.x, ship.y - n.y) < pickupRadius) { nearbyNodeIndex = i; break; }
        }
      }
      updateCollectButton();

      if (Math.hypot(ship.x - base.x, ship.y - base.y) < 46) {
        if (state.fuel < MAX_FUEL) state.fuel = MAX_FUEL;
        if (state.o2 < MAX_O2) state.o2 = MAX_O2;
        state.collected = 0;
        if (!state.phaseDone && nodes.length > 0 && nodes.every((n) => n.collected)) completePhase();
      }

      if (state.fuel <= 0) { stopLoop(); state.crashed++; loseGame("fuel"); return; }
      if (state.o2 <= 0) { stopLoop(); state.crashed++; loseGame("o2"); return; }

      camX = Math.max(0, Math.min(WORLD_W - W, ship.x - W / 2));
      camY = Math.max(0, Math.min(WORLD_H - H, ship.y - H / 2));
      updateHud();
    }

    function completePhase() {
      state.phaseDone = true;
      stopLoop();
      const elapsedSec = Math.max(0, (performance.now() - state.phaseStartMs) / 1000);
      const mm = Math.floor(elapsedSec / 60), ss = Math.floor(elapsedSec % 60);
      el("#phase-time").textContent = `${mm}:${ss.toString().padStart(2, "0")}`;
      el("#phase-fichas").textContent = `+${state.phaseFichas} 🪙`;
      showOverlay("win-overlay");
      onWaveCleared?.();
    }

    function startLoop() { running = true; lastT = performance.now(); rafId = requestAnimationFrame(loop); }
    function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

    function bindHold(selector: string, key: "left" | "right" | "thrust") {
      const btn = el(selector);
      const on = (e: Event) => { e.preventDefault(); keys[key] = true; };
      const off = (e: Event) => { e.preventDefault(); keys[key] = false; };
      btn.addEventListener("touchstart", on); btn.addEventListener("touchend", off); btn.addEventListener("touchcancel", off);
      btn.addEventListener("mousedown", on); btn.addEventListener("mouseup", off); btn.addEventListener("mouseleave", off);
    }
    bindHold("#left-btn", "left"); bindHold("#right-btn", "right"); bindHold("#thrust-btn", "thrust");

    function showOverlay(id: string) {
      ["start-overlay", "lose-overlay", "win-overlay"].forEach((o) => el(`#${o}`).classList.toggle("hidden", o !== id));
    }
    function hideAllOverlays() {
      ["start-overlay", "lose-overlay", "win-overlay"].forEach((o) => el(`#${o}`).classList.add("hidden"));
    }

    function startRun() {
      hideAllOverlays(); resize(); resetWave(); startLoop();
    }

    function rescue() {
      state.fuel = MAX_FUEL;
      state.o2 = MAX_O2;
      state.cargoBonusPct += 25;
      ship.x = base.x; ship.y = base.y - 6; ship.vx = 0; ship.vy = 0;
      hideAllOverlays();
      startLoop();
    }
    rescueRef.current = rescue;

    function loseGame(cause: "fuel" | "o2" = "fuel") {
      el("#lose-title").textContent = cause === "o2" ? "SEM OXIGÊNIO" : "SEM COMBUSTÍVEL";
      el("#funny-msg").textContent =
        cause === "o2"
          ? "O ar acabou antes de você voltar. Bom que era só um jogo."
          : FUNNY_LOSSES[Math.floor(Math.random() * FUNNY_LOSSES.length)];
      el("#lose-level").textContent = String(state.level);
      el("#lose-collected").textContent = `${nodes.filter((n) => n.collected).length}/${nodes.length}`;
      showOverlay("lose-overlay");
    }

    function updateCollectButton() {
      const btn = el<HTMLButtonElement>("#collect-btn");
      if (nearbyNodeIndex !== -1) {
        const node = nodes[nearbyNodeIndex];
        btn.classList.remove("hidden");
        btn.textContent = `🎯 COLETAR ${node.material.icon}`;
      } else {
        btn.classList.add("hidden");
      }
    }

    function collectNearbyNode() {
      if (nearbyNodeIndex === -1) return;
      const node = nodes[nearbyNodeIndex];
      node.collected = true;
      state.collected++; state.landed++; state.fichas += FICHAS_PER_COLLECT; state.phaseFichas += FICHAS_PER_COLLECT;
      nearbyNodeIndex = -1;
      updateCollectButton();
      updateHud();
      onResult(node.material.id, true);
    }

    el("#collect-btn").addEventListener("click", collectNearbyNode);
    el("#start-btn").addEventListener("click", startRun);
    el("#retry-btn").addEventListener("click", startRun);
    el("#win-retry-btn").addEventListener("click", startRun);

    resize(); makeStars(); draw();
    window.addEventListener("resize", resize);
    return () => {
      stopLoop();
      rescueRef.current = undefined;
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="across-age-root">
      <style>{ACROSS_AGE_CSS}</style>
      <div id="hud">
        <div id="hud-normal">
          <div className="gauge">
            <div className="gauge-label">⛽ Combustível</div>
            <div className="gauge-track"><div id="fuel-fill" className="gauge-fill" style={{ width: "100%" }} /></div>
          </div>
          <div className="gauge">
            <div className="gauge-label">🫁 O2</div>
            <div className="gauge-track"><div id="o2-fill" className="gauge-fill o2" style={{ width: "100%" }} /></div>
          </div>
          <div id="cargo-count" className="pixel" style={{ fontSize: 10, color: "var(--teal)", alignSelf: "center", whiteSpace: "nowrap" }}>📦 0/0</div>
        </div>
        <div id="fichas-badge" className="pixel">🪙 0</div>
        <div id="level-badge" className="pixel">NÍVEL {startLevel}/5</div>
      </div>

      <div id="stage">
        <canvas ref={canvasRef} />
        <div id="pilot-badge"><img id="pilot-img" alt="Piloto" src={pilotAvatarUrl ?? undefined} /><span>{pilotName}</span></div>
        <button id="collect-btn" className="btn collect-btn hidden">🎯 COLETAR</button>
        <div id="controls">
          <div className="side-pair">
            <div className="ctrl-btn pixel" id="left-btn">◀</div>
            <div className="ctrl-btn pixel" id="right-btn">▶</div>
          </div>
          <div className="lever-btn" id="thrust-btn">
            <div className="lever-track">
              <div className="lever-handle">▲</div>
            </div>
          </div>
        </div>
      </div>

      <div id="start-overlay" className="overlay">
        <div className="title-big pixel">ACROSS<br />AGE</div>
        <img id="ship-briefing-img" src={shipImageUrl} alt="Sua nave" style={{ width: 260, borderRadius: 14, border: "2px solid var(--gold-dim)" }} />
        <div className="subtitle" style={{ marginTop: -6, opacity: 0.8 }}>Piloto: {pilotName}</div>
        <div className="subtitle" style={{ marginTop: -10, color: theme.glowColor }}>
          Destino: {theme.label}{theme.danger ? " ☢️ (combustível some mais rápido aqui)" : ""}
        </div>
        <div className="subtitle">
          Voe pelo mapa, desvie dos detritos e chegue perto dos pontos brilhantes.<br />
          Quando "🎯 COLETAR" aparecer, toca pra recolher o material.<br />
          Colete tudo e volte à base no menor tempo possível — combustível e O2 são o limite.
        </div>
        {destinationFact && (
          <div className="subtitle" style={{ color: theme.glowColor, opacity: 0.9, fontSize: 12 }}>
            🛰️ Você sabia? {destinationFact}
          </div>
        )}
        <button className="btn" id="start-btn">▶ JOGAR</button>
      </div>

      <div id="lose-overlay" className="overlay hidden">
        <div id="lose-title" className="title-big pixel" style={{ fontSize: 16 }}>SEM COMBUSTÍVEL</div>
        <div id="funny-msg" className="funny-msg" />
        <div className="stat-row"><span>Nível: <b id="lose-level">1</b></span><span>Coleta da leva: <b id="lose-collected">0/0</b></span></div>
        <button className="btn" id="retry-btn">↻ TENTAR NOVAMENTE</button>
        <SOSButton
          cost={25}
          reason="sos_resgate_mineracao"
          label="Resgate"
          onSuccess={() => rescueRef.current?.()}
        />
      </div>

      <div id="win-overlay" className="overlay hidden">
        <div className="title-big pixel" style={{ fontSize: 16, color: "var(--teal)" }}>FASE COMPLETA!</div>
        <div className="stat-row">
          <span>Tempo: <b id="phase-time">0:00</b></span>
          <span>Ganho: <b id="phase-fichas">+0 🪙</b></span>
        </div>
        <div className="subtitle">Quanto menos tempo, melhor — combustível e O2 são o limite.</div>
        <button className="btn" id="win-retry-btn">↻ JOGAR DE NOVO</button>
        <button
          className="btn"
          style={{ borderColor: "var(--teal)", color: "var(--teal)" }}
          onClick={() => navigate({ to: "/rota" })}
        >
          🗺️ VOLTAR À ROTA
        </button>
      </div>
    </div>
  );
}

const ACROSS_AGE_CSS = `
.across-age-root{ --void:#0a0e27; --void-deep:#050714; --gold:#e8b34a; --gold-dim:#8a6a2a; --teal:#3ddbc9; --danger:#ff5c5c; --ink:#eef0ff; --ink-dim:#9aa0c8;
  position:relative; width:100%; height:80vh; max-height:820px; margin:0 auto; border-radius:16px; overflow:hidden;
  background:radial-gradient(ellipse at 50% 20%, #14183c 0%, var(--void-deep) 70%); color:var(--ink); font-family:'Space Grotesk',sans-serif; }
.across-age-root .pixel{ font-family:'Press Start 2P', monospace; }
.across-age-root .hidden{ display:none !important; }
.across-age-root #hud{ display:flex; justify-content:space-between; align-items:center; padding:10px 14px; gap:10px; position:relative; z-index:5; }
.across-age-root #hud-normal{ display:flex; gap:10px; flex:1; align-items:center; }
.across-age-root .gauge{ flex:1; }
.across-age-root .gauge-label{ font-size:10px; color:var(--ink-dim); margin-bottom:4px; text-transform:uppercase; }
.across-age-root .gauge-track{ height:8px; border-radius:4px; background:#1c2050; overflow:hidden; border:1px solid #2b2f66; }
.across-age-root .gauge-fill{ height:100%; border-radius:4px; transition:width .15s linear; background:linear-gradient(90deg,var(--gold-dim),var(--gold)); }
.across-age-root .gauge-fill.o2{ background:linear-gradient(90deg,#1c6f8f,#5ad2e6); }
.across-age-root #level-badge{ font-size:10px; padding:6px 10px; border:1px solid var(--gold); border-radius:20px; color:var(--gold); white-space:nowrap; height:fit-content; }
.across-age-root #fichas-badge{ font-size:10px; padding:6px 10px; border:1px solid var(--teal); border-radius:20px; color:var(--teal); white-space:nowrap; height:fit-content; }
.across-age-root #stage{ position:relative; height:calc(100% - 46px); overflow:hidden; }
.across-age-root canvas{ position:absolute; top:0; left:0; width:100%; height:100%; display:block; }
.across-age-root #controls{ position:absolute; bottom:0; left:0; right:0; display:flex; justify-content:space-between; align-items:flex-end; padding:18px; z-index:6; pointer-events:none; }
.across-age-root .collect-btn{ position:absolute; left:50%; bottom:112px; transform:translateX(-50%); z-index:7; padding:10px 18px; font-size:12px; animation:collectPulse 1s ease-in-out infinite; }
@keyframes collectPulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(232,179,74,.55); } 50%{ box-shadow:0 0 0 14px rgba(232,179,74,0); } }
.across-age-root .ctrl-btn{
  pointer-events:auto; width:64px; height:64px; border-radius:50%;
  background:linear-gradient(150deg,#eef1f4 0%,#c3c9d1 35%,#8b929c 70%,#6b7280 100%);
  border:2px solid #5a6068; color:#2a2f38; font-size:22px; display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 0 #4a4f58, inset 0 1px 3px rgba(255,255,255,.7), inset 0 -3px 4px rgba(0,0,0,.15);
  text-shadow:0 1px 0 rgba(255,255,255,.5);
}
.across-age-root .ctrl-btn:active{
  background:linear-gradient(150deg,#c3c9d1,#8b929c);
  box-shadow:0 1px 0 #4a4f58, inset 0 2px 4px rgba(0,0,0,.25);
  transform:translateY(2px);
}
.across-age-root .lever-btn{
  pointer-events:auto; width:60px; height:104px; border-radius:14px;
  background:linear-gradient(150deg,#dfe3e7,#9aa1ab);
  border:2px solid #5a6068; box-shadow:0 4px 0 #4a4f58, inset 0 1px 3px rgba(255,255,255,.6);
  display:flex; align-items:flex-end; justify-content:center; padding-bottom:8px;
}
.across-age-root .lever-track{
  position:relative; width:10px; height:82px; margin:0 auto; border-radius:6px;
  background:linear-gradient(180deg,#3a3f47,#1c2026); box-shadow:inset 0 2px 4px rgba(0,0,0,.6);
}
.across-age-root .lever-handle{
  position:absolute; left:50%; bottom:0; width:36px; height:26px; border-radius:8px;
  transform:translate(-50%,0); transition:bottom .12s ease;
  background:linear-gradient(150deg,#f2f4f6,#a8afb8); border:2px solid #5a6068;
  display:flex; align-items:center; justify-content:center; font-size:13px; color:#2a2f38;
  box-shadow:0 2px 0 #4a4f58, inset 0 1px 2px rgba(255,255,255,.7);
}
.across-age-root .lever-btn:active .lever-handle{ bottom:52px; }
.across-age-root .side-pair{ display:flex; gap:12px; }
.across-age-root .overlay{ position:absolute; inset:0; z-index:20; background:rgba(5,7,20,.92); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px; gap:14px; overflow:auto; }
.across-age-root .title-big{ font-size:22px; color:var(--gold); line-height:1.6; }
.across-age-root .subtitle{ font-size:13px; color:var(--ink-dim); max-width:340px; line-height:1.6; }
.across-age-root .btn{ font-family:'Press Start 2P', monospace; font-size:12px; padding:14px 22px; border-radius:10px; border:2px solid var(--gold); background:transparent; color:var(--gold); cursor:pointer; }
.across-age-root .btn:active{ background:var(--gold); color:var(--void-deep); }
.across-age-root .funny-msg{ font-size:13px; color:var(--danger); max-width:320px; line-height:1.6; font-style:italic; }
.across-age-root .stat-row{ display:flex; gap:18px; font-size:11px; color:var(--ink-dim); flex-wrap:wrap; justify-content:center; }
.across-age-root .stat-row b{ color:var(--teal); }
.across-age-root .target-icon{ font-size:40px; }
.across-age-root #tool-row{ display:flex; gap:12px; margin-top:8px; }
.across-age-root .tool-card{ width:100px; padding:12px 8px; border-radius:12px; border:2px solid #2b2f66; background:#12163a; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10px; color:var(--ink-dim); cursor:pointer; }
.across-age-root .tool-card:active{ border-color:var(--teal); background:#182050; }
.across-age-root .tool-icon{ font-size:26px; }
.across-age-root .tool-name{ color:var(--ink); font-weight:700; }
.across-age-root .tool-desc{ color:var(--ink-dim); font-size:9px; line-height:1.3; }
.across-age-root #pilot-badge{ position:absolute; top:12px; left:12px; z-index:10; display:flex; flex-direction:column; align-items:center; gap:3px; }
.across-age-root #pilot-img{ width:64px; height:64px; border-radius:50%; object-fit:cover; border:3px solid var(--teal); background:#12163a; box-shadow:0 0 10px rgba(61,219,201,.45); }
.across-age-root #pilot-badge span{ font-size:8px; color:var(--teal); letter-spacing:.5px; background:rgba(5,7,20,.7); padding:2px 6px; border-radius:8px; max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.across-age-root #aim-section{ display:flex; flex-direction:column; align-items:center; margin-top:4px; }
.across-age-root #collect-scene{ display:flex; flex-direction:column; align-items:center; gap:0; margin-bottom:10px; }
.across-age-root #collect-ship{ width:50px; height:50px; object-fit:contain; filter:drop-shadow(0 0 10px rgba(232,179,74,.55)); z-index:2; }
.across-age-root #collect-track{ position:relative; width:34px; height:150px; margin:2px 0; }
.across-age-root #collect-line{ position:absolute; top:0; left:50%; width:2px; height:0; transform:translateX(-50%); background:repeating-linear-gradient(180deg, var(--gold-dim) 0 6px, transparent 6px 11px); transition:height .05s linear; }
.across-age-root #collect-zone{ position:absolute; left:2px; right:2px; background:rgba(61,219,201,.3); border-top:2px solid var(--teal); border-bottom:2px solid var(--teal); border-radius:4px; }
.across-age-root #collect-tool-icon{ position:absolute; left:50%; top:0; width:26px; height:26px; margin-left:-13px; display:flex; align-items:center; justify-content:center; font-size:20px; transition:filter .1s; }
.across-age-root #collect-target-mini{ font-size:30px; margin-top:-4px; }
.across-age-root .tool-ima #collect-line{ background:none; width:1px; }
.across-age-root .tool-ima #collect-track::before{ content:''; position:absolute; inset:0; margin:auto; width:8px; height:8px; border-radius:50%; box-shadow:0 0 0 0 rgba(61,219,201,.5); animation:pulseWave 1.1s ease-out infinite; left:50%; top:0; transform:translateX(-50%); }
@keyframes pulseWave{ 0%{ box-shadow:0 0 0 0 rgba(61,219,201,.55); } 100%{ box-shadow:0 0 0 60px rgba(61,219,201,0); } }
.across-age-root .tool-sucao #collect-line{ width:10px; background:linear-gradient(180deg, rgba(61,219,201,.6), rgba(61,219,201,.1)); background-size:10px 16px; animation:sucaoFlow .5s linear infinite; border-radius:5px; }
@keyframes sucaoFlow{ from{ background-position:0 0; } to{ background-position:0 16px; } }
`;

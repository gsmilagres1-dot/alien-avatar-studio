import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef } from "react";
import { Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { listMyIdentities } from "@/lib/identities.functions";
import { getMiningState, submitMiningResult, type MaterialKey } from "@/lib/mining.functions";
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
  }),
  component: AcrossAge,
});

function AcrossAge() {
  const { identityId } = Route.useSearch();
  const listIdentities = useServerFn(listMyIdentities);
  const getMining = useServerFn(getMiningState);
  const submitResult = useServerFn(submitMiningResult);
  const qc = useQueryClient();

  const { data: identitiesData, isLoading: loadingIdentities } = useQuery({
    queryKey: ["identities"],
    queryFn: () => listIdentities(),
  });
  const { data: miningData, isLoading: loadingMining } = useQuery({
    queryKey: ["mining-state"],
    queryFn: () => getMining(),
  });

  const identities = identitiesData?.identities ?? [];
  const pilot = identities.find((i) => i.id === identityId) ?? identities[0];

  const handleResult = useCallback(
    async (materialKey: MaterialKey, success: boolean) => {
      try {
        const result = await submitResult({ data: { materialKey, success } });
        qc.invalidateQueries({ queryKey: ["mining-state"] });
        if (success && result.upgradeKey) {
          toast.success(`Material coletado! Nave: ${result.upgradeKey} nível ${result.upgradeLevel}`);
        }
      } catch (e) {
        console.error(e);
        toast.error("Não deu pra salvar o progresso dessa viagem.");
      }
    },
    [submitResult, qc]
  );

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

  const shipImageUrl = pilot.ship_image_url || SHIP_PREVIEWS[pilot.ship_category ?? "offroad"];

  return (
    <GameCanvas
      key={pilot.id}
      pilotAvatarUrl={pilot.avatar_url}
      shipImageUrl={shipImageUrl}
      pilotName={pilot.alien_name ?? "Piloto"}
      startLevel={miningData?.level ?? 1}
      onResult={handleResult}
    />
  );
}

// =========================================================
// GAME CANVAS — motor do Across Age (Fases 1, 2 e 3)
// Portado do protótipo standalone, agora usando avatar/nave
// reais da identidade e salvando resultado no Supabase.
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
const FUNNY_LOSSES = [
  "Uma mosca entrou no teletransportador...",
  "Vazamento no túnel de minhoca!",
  "Nave com defeito — peças baratas da loja.",
  "Erro no transmutador: você foi parar na Idade da Pedra. Descubra o fogo pra voltar.",
  "O manche travou porque alguém derramou suco de asteroide nele.",
  "Combustível acabou a 3 metros do alvo. Que azar.",
];
const FUNNY_DEBRIS = [
  "Um parafuso perdido furou o casco. Bem-vindo à sucata espacial.",
  "Você colidiu com uma geladeira soviética desaparecida em 1979.",
  "Detrito misterioso — parecia uma bota, explodiu como uma bota espacial.",
  "Bateu numa placa de trânsito interestelar escrito \"PARE\".",
  "Um cometa de granizo cósmico rachou o para-brisa.",
  "A carga balançou tanto que derrubou o café do piloto no painel.",
];

type GameCanvasProps = {
  pilotAvatarUrl: string | null;
  shipImageUrl: string;
  pilotName: string;
  startLevel: number;
  onResult: (materialKey: MaterialKey, success: boolean) => void;
};

function GameCanvas({ pilotAvatarUrl, shipImageUrl, pilotName, startLevel, onResult }: GameCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    shipImg.onload = () => { shipImgReady = true; };

    const state = {
      level: Math.min(10, Math.max(1, startLevel)),
      phase: 1 as 1 | 2 | 3,
      collected: 0,
      landed: 0,
      crashed: 0,
      currentMaterial: MATERIALS[0],
      fuel: 100,
      oxygen: 100,
    };

    function pickMaterial() {
      return MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
    }

    // ---------------- DOM refs (dentro do root) ----------------
    const el = <T extends HTMLElement = HTMLElement>(sel: string) => root!.querySelector<T>(sel)!;

    // ---------------- física ----------------
    let ship: { x: number; y: number; vx: number; vy: number; angle: number } | null = null;
    let pad: { x: number; y: number; w: number } | null = null;
    let debris: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    let running = false;
    let rafId = 0;
    const keys = { left: false, right: false, thrust: false };
    let fuelBurnRate = 0, gravity = 0, padWidth = 0, allowedAngle = 0, allowedSpeed = 0, thrustPower = 0, rotationRate = 0;

    function difficultyParams(level: number) {
      return {
        fuelBurnRate: 6 + level * 1.2,
        gravity: 34 + level * 3.5,
        padWidth: Math.max(38, 105 - level * 7),
        allowedAngle: Math.max(10, 30 - level * 1.8),
        allowedSpeed: Math.max(30, 90 - level * 6),
        thrustPower: 130,
        rotationRate: 110,
      };
    }
    function difficultyParams3(level: number) {
      return {
        gravity: 40 + level * 4,
        thrustPower: Math.max(70, 100 - level * 3),
        rotationRate: Math.max(55, 85 - level * 3),
        padWidth: Math.max(55, 105 - level * 5),
        allowedAngle: Math.max(12, 32 - level * 1.8),
        allowedSpeed: Math.max(35, 95 - level * 5),
        debrisCount: 3 + Math.floor(level * 0.9),
        debrisSpeed: 35 + level * 12,
      };
    }

    let stars: { x: number; y: number; r: number; tw: number }[] = [];
    function resize() {
      W = canvas!.width = canvas!.clientWidth;
      H = canvas!.height = canvas!.clientHeight;
    }
    function makeStars() {
      stars = Array.from({ length: 70 }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, tw: Math.random() * Math.PI * 2,
      }));
    }

    function updateHud() {
      if (state.phase === 3) {
        el("#hud-normal").classList.add("hidden");
        el("#hud-phase3").classList.remove("hidden");
        el("#debris-count").textContent = String(debris.length);
        el("#level-badge").textContent = `RETORNO · NÍVEL ${state.level}/10`;
      } else {
        el("#hud-normal").classList.remove("hidden");
        el("#hud-phase3").classList.add("hidden");
        el<HTMLDivElement>("#fuel-fill").style.width = Math.max(0, state.fuel) + "%";
        el<HTMLDivElement>("#ox-fill").style.width = Math.max(0, state.oxygen) + "%";
        el("#level-badge").textContent = `NÍVEL ${state.level}/10`;
      }
    }

    function resetShip() {
      state.phase = 1;
      const p = difficultyParams(state.level);
      ({ fuelBurnRate, gravity, padWidth, allowedAngle, allowedSpeed, thrustPower, rotationRate } = p);
      ship = { x: W * 0.5 + (Math.random() * W * 0.4 - W * 0.2), y: 60, vx: Math.random() * 40 - 20, vy: 0, angle: 0 };
      pad = { x: Math.random() * (W - padWidth - 40) + 20, y: H - 34, w: padWidth };
      state.fuel = 100;
      updateHud();
    }
    function resetReturn() {
      state.phase = 3;
      const p = difficultyParams3(state.level);
      gravity = p.gravity; thrustPower = p.thrustPower; rotationRate = p.rotationRate;
      padWidth = p.padWidth; allowedAngle = p.allowedAngle; allowedSpeed = p.allowedSpeed;
      ship = { x: W * 0.5, y: 60, vx: 0, vy: 0, angle: 0 };
      pad = { x: Math.random() * (W - padWidth - 40) + 20, y: H - 34, w: padWidth };
      debris = Array.from({ length: p.debrisCount }, () => {
        const a = Math.random() * Math.PI * 2;
        return { x: Math.random() * (W - 60) + 30, y: 110 + Math.random() * (H - 280), vx: Math.cos(a) * p.debrisSpeed, vy: Math.sin(a) * p.debrisSpeed, r: 10 + Math.random() * 9 };
      });
      updateHud();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let zoom = 1;
      const pivotX = W / 2, pivotY = H - 24;
      if (ship && (state.phase === 1 || state.phase === 3)) {
        const altRatio = Math.max(0, Math.min(1, 1 - ship.y / (H - 37)));
        zoom = 0.85 + altRatio * 0.4;
      }
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.scale(zoom, zoom);
      ctx.translate(-pivotX, -pivotY);

      ctx.fillStyle = "#eef0ff";
      stars.forEach((s) => {
        s.tw += 0.02;
        ctx.globalAlpha = 0.4 + Math.sin(s.tw) * 0.4;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#161a42";
      ctx.fillRect(0, H - 24, W, 24);

      if (!ship || !pad) { ctx.restore(); return; }
      const isReturn = state.phase === 3;
      const baseColor = isReturn ? "#3ddbc9" : "#e8b34a";
      const planetCx = pad.x + pad.w / 2, planetCy = pad.y + 16, planetR = Math.max(22, pad.w * 0.55);
      const grad = ctx.createRadialGradient(planetCx - planetR * 0.3, planetCy - planetR * 0.3, planetR * 0.15, planetCx, planetCy, planetR);
      grad.addColorStop(0, isReturn ? "#a8f5ec" : "#ffe1a3");
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad; ctx.shadowColor = baseColor; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(planetCx, planetCy, planetR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath(); ctx.arc(planetCx - planetR * 0.3, planetCy - planetR * 0.12, planetR * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(planetCx + planetR * 0.22, planetCy + planetR * 0.22, planetR * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = baseColor; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(pad.x, pad.y); ctx.lineTo(pad.x + pad.w, pad.y); ctx.stroke();
      ctx.setLineDash([]);

      if (isReturn) {
        debris.forEach((d) => {
          ctx.fillStyle = "#8a6a5a";
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#5a4438"; ctx.lineWidth = 2; ctx.stroke();
        });
      }

      const thrusting = keys.thrust && (isReturn || state.fuel > 0);
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate((ship.angle * Math.PI) / 180);
      if (isReturn) { ctx.fillStyle = "#e8b34a"; ctx.fillRect(-7, 10, 14, 9); }
      if (shipImgReady) {
        const s = 32;
        ctx.drawImage(shipImg, -s / 2, -s / 2 - 3, s, s);
      } else {
        ctx.fillStyle = thrusting ? "#ff9d3d" : isReturn ? "#e8b34a" : "#3ddbc9";
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, 12); ctx.lineTo(0, 7); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
      }
      if (thrusting) {
        ctx.fillStyle = "#ffd27a";
        ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(0, 22 + Math.random() * 8); ctx.lineTo(4, 10); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    }

    let lastT = 0;
    function loop(t: number) {
      if (!running) return;
      const dt = Math.min((t - lastT) / 1000, 0.05) || 0.016;
      lastT = t;
      if (state.phase === 3) updatePhase3(dt); else updatePhase1(dt);
    }
    function updatePhase1(dt: number) {
      if (!ship || !pad) return;
      ship.vy += gravity * dt;
      if (keys.left) ship.angle -= rotationRate * dt;
      if (keys.right) ship.angle += rotationRate * dt;
      ship.angle = Math.max(-75, Math.min(75, ship.angle));
      if (keys.thrust && state.fuel > 0) {
        const rad = (ship.angle * Math.PI) / 180;
        ship.vx += Math.sin(rad) * thrustPower * dt;
        ship.vy -= Math.cos(rad) * thrustPower * dt;
        state.fuel -= fuelBurnRate * dt;
      }
      ship.x += ship.vx * dt; ship.y += ship.vy * dt;
      if (ship.x < 15) { ship.x = 15; ship.vx *= -0.3; }
      if (ship.x > W - 15) { ship.x = W - 15; ship.vx *= -0.3; }
      updateHud();
      if (ship.y >= H - 34 - 13) {
        ship.y = H - 34 - 13;
        const speed = Math.hypot(ship.vx, ship.vy);
        const onPad = ship.x > pad.x && ship.x < pad.x + pad.w;
        const okAngle = Math.abs(ship.angle) <= allowedAngle;
        const okSpeed = speed <= allowedSpeed;
        stopLoop();
        if (onPad && okAngle && okSpeed) { state.landed++; goToPhase2(); }
        else { state.crashed++; loseGame(); }
        return;
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }
    function updatePhase3(dt: number) {
      if (!ship || !pad) return;
      ship.vy += gravity * dt;
      if (keys.left) ship.angle -= rotationRate * dt;
      if (keys.right) ship.angle += rotationRate * dt;
      ship.angle = Math.max(-75, Math.min(75, ship.angle));
      if (keys.thrust) {
        const rad = (ship.angle * Math.PI) / 180;
        ship.vx += Math.sin(rad) * thrustPower * dt;
        ship.vy -= Math.cos(rad) * thrustPower * dt;
      }
      ship.x += ship.vx * dt; ship.y += ship.vy * dt;
      if (ship.x < 15) { ship.x = 15; ship.vx *= -0.3; }
      if (ship.x > W - 15) { ship.x = W - 15; ship.vx *= -0.3; }
      debris.forEach((d) => {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < d.r || d.x > W - d.r) d.vx *= -1;
        if (d.y < 40) { d.y = 40; d.vy *= -1; }
        if (d.y > H - 70) { d.y = H - 70; d.vy *= -1; }
      });
      for (const d of debris) {
        if (Math.hypot(ship.x - d.x, ship.y - d.y) < d.r + 10) {
          state.crashed++; stopLoop(); loseDebris(); return;
        }
      }
      updateHud();
      if (ship.y >= H - 34 - 13) {
        ship.y = H - 34 - 13;
        const speed = Math.hypot(ship.vx, ship.vy);
        const onPad = ship.x > pad.x && ship.x < pad.x + pad.w;
        const okAngle = Math.abs(ship.angle) <= allowedAngle;
        const okSpeed = speed <= allowedSpeed;
        stopLoop();
        if (onPad && okAngle && okSpeed) {
          state.landed++;
          state.collected = Math.min(10, state.collected + 1);
          showResult(true);
        } else { state.crashed++; loseReturn(); }
        return;
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }
    function startLoop() { running = true; lastT = performance.now(); rafId = requestAnimationFrame(loop); }
    function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

    // ---------------- controles ----------------
    function bindHold(selector: string, key: "left" | "right" | "thrust") {
      const btn = el(selector);
      const on = (e: Event) => { e.preventDefault(); keys[key] = true; };
      const off = (e: Event) => { e.preventDefault(); keys[key] = false; };
      btn.addEventListener("touchstart", on); btn.addEventListener("touchend", off); btn.addEventListener("touchcancel", off);
      btn.addEventListener("mousedown", on); btn.addEventListener("mouseup", off); btn.addEventListener("mouseleave", off);
    }
    bindHold("#left-btn", "left"); bindHold("#right-btn", "right"); bindHold("#thrust-btn", "thrust");

    // ---------------- overlays ----------------
    function showOverlay(id: string) {
      ["start-overlay", "lose-overlay", "phase2", "result"].forEach((o) => el(`#${o}`).classList.toggle("hidden", o !== id));
    }
    function hideAllOverlays() {
      ["start-overlay", "lose-overlay", "phase2", "result"].forEach((o) => el(`#${o}`).classList.add("hidden"));
    }
    function startPhase1() { hideAllOverlays(); resize(); makeStars(); resetShip(); draw(); startLoop(); }
    function startPhase3() { hideAllOverlays(); resize(); resetReturn(); draw(); startLoop(); }

    function loseGame() {
      el("#funny-msg").textContent = FUNNY_LOSSES[Math.floor(Math.random() * FUNNY_LOSSES.length)];
      el("#lose-level").textContent = String(state.level);
      el("#lose-collected").textContent = `${state.collected}/10`;
      showOverlay("lose-overlay");
    }
    function loseDebris() {
      el("#funny-msg").textContent = FUNNY_DEBRIS[Math.floor(Math.random() * FUNNY_DEBRIS.length)];
      el("#lose-level").textContent = String(state.level);
      el("#lose-collected").textContent = `${state.collected}/10`;
      showOverlay("lose-overlay");
      onResult(state.currentMaterial.id, false);
    }
    function loseReturn() {
      el("#funny-msg").textContent = "Pouso de retorno malsucedido — " + FUNNY_LOSSES[Math.floor(Math.random() * FUNNY_LOSSES.length)];
      el("#lose-level").textContent = String(state.level);
      el("#lose-collected").textContent = `${state.collected}/10`;
      showOverlay("lose-overlay");
      onResult(state.currentMaterial.id, false);
    }

    let oxTimer: ReturnType<typeof setInterval> | null = null;
    function goToPhase2() {
      state.phase = 2; state.oxygen = 100; updateHud();
      state.currentMaterial = pickMaterial();
      el("#target-icon").textContent = state.currentMaterial.icon;
      el("#target-name").textContent = state.currentMaterial.name;
      el("#target-state").textContent = state.currentMaterial.state;
      el("#target-desc").textContent = state.currentMaterial.desc;
      const pImg = el<HTMLImageElement>("#pilot-img");
      if (pilotAvatarUrl) pImg.src = pilotAvatarUrl;

      el("#tool-row").classList.remove("hidden");
      el("#tool-prompt").classList.remove("hidden");
      el("#aim-section").classList.add("hidden");
      stopAim();

      const row = el("#tool-row");
      row.innerHTML = "";
      TOOLS.forEach((tool) => {
        const card = document.createElement("div");
        card.className = "tool-card";
        card.innerHTML = `<div class="tool-icon">${tool.icon}</div><div class="tool-name">${tool.name}</div><div class="tool-desc">${tool.desc}</div>`;
        card.addEventListener("click", () => chooseTool(tool.id));
        row.appendChild(card);
      });

      showOverlay("phase2");
      const t0 = performance.now();
      const oxygenDuration = Math.max(2.5, 9 - state.level * 0.7);
      if (oxTimer) clearInterval(oxTimer);
      oxTimer = setInterval(() => {
        const elapsed = (performance.now() - t0) / 1000;
        state.oxygen = Math.max(0, 100 - (elapsed / oxygenDuration) * 100);
        updateHud();
        if (state.oxygen <= 0) {
          if (oxTimer) clearInterval(oxTimer);
          stopAim();
          loseGame();
          onResult(state.currentMaterial.id, false);
        }
      }, 100);
    }

    function chooseTool(toolId: string) {
      if (toolId === state.currentMaterial.tool) armTool();
      else {
        if (oxTimer) clearInterval(oxTimer);
        const correctTool = TOOLS.find((t) => t.id === state.currentMaterial.tool)!;
        el("#funny-msg").textContent = `${state.currentMaterial.name} é ${state.currentMaterial.state.toLowerCase()} — precisava da ${correctTool.name}. ${FUNNY_LOSSES[Math.floor(Math.random() * FUNNY_LOSSES.length)]}`;
        el("#lose-level").textContent = String(state.level);
        el("#lose-collected").textContent = `${state.collected}/10`;
        showOverlay("lose-overlay");
        onResult(state.currentMaterial.id, false);
      }
    }

    let aimRunning = false, aimRafId = 0, markerX = 0, markerDir = 1, aimSpeed = 0, aimZoneLeft = 0, aimZoneWidth = 0;
    const AIM_TRACK_WIDTH = 260;
    function armTool() {
      el("#tool-row").classList.add("hidden");
      el("#tool-prompt").classList.add("hidden");
      el("#aim-section").classList.remove("hidden");
      const level = state.level;
      aimZoneWidth = Math.max(30, 95 - level * 6.5);
      aimZoneLeft = Math.random() * (AIM_TRACK_WIDTH - aimZoneWidth);
      aimSpeed = 140 + level * 18;
      const zoneEl = el<HTMLDivElement>("#aim-zone");
      zoneEl.style.left = aimZoneLeft + "px"; zoneEl.style.width = aimZoneWidth + "px";
      markerX = 0; markerDir = 1;
      let lastTt = performance.now();
      aimRunning = true;
      function animate(t: number) {
        if (!aimRunning) return;
        const dt = Math.min((t - lastTt) / 1000, 0.05); lastTt = t;
        markerX += aimSpeed * dt * markerDir;
        if (markerX > AIM_TRACK_WIDTH - 4) { markerX = AIM_TRACK_WIDTH - 4; markerDir = -1; }
        if (markerX < 0) { markerX = 0; markerDir = 1; }
        el<HTMLDivElement>("#aim-marker").style.left = markerX + "px";
        aimRafId = requestAnimationFrame(animate);
      }
      aimRafId = requestAnimationFrame(animate);
    }
    function stopAim() { aimRunning = false; if (aimRafId) cancelAnimationFrame(aimRafId); }

    el("#launch-btn").addEventListener("click", () => {
      if (!aimRunning) return;
      const hit = markerX + 2 >= aimZoneLeft && markerX + 2 <= aimZoneLeft + aimZoneWidth;
      if (hit) {
        stopAim();
        if (oxTimer) clearInterval(oxTimer);
        startPhase3();
      } else {
        const marker = el<HTMLDivElement>("#aim-marker");
        marker.style.background = "#ff5c5c";
        setTimeout(() => { marker.style.background = "var(--gold)"; }, 180);
      }
    });

    function showResult(success: boolean) {
      el("#result-title").textContent = "VIAGEM CONCLUÍDA!";
      el("#res-material").textContent = state.currentMaterial.name;
      el("#res-progress").textContent = `${state.collected}/10`;
      el("#res-level").textContent = `${state.level}/10`;
      el("#res-landed").textContent = String(state.landed);
      el("#res-crashed").textContent = String(state.crashed);
      showOverlay("result");
      if (state.collected >= 10 && state.level < 10) { state.level++; state.collected = 0; }
      onResult(state.currentMaterial.id, true);
    }

    el("#start-btn").addEventListener("click", () => { startPhase1(); });
    el("#retry-btn").addEventListener("click", startPhase1);
    el("#next-btn").addEventListener("click", startPhase1);

    resize(); makeStars(); draw();
    window.addEventListener("resize", resize);
    return () => {
      stopLoop(); stopAim();
      if (oxTimer) clearInterval(oxTimer);
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
            <div className="gauge-label">🫧 Oxigênio</div>
            <div className="gauge-track"><div id="ox-fill" className="gauge-fill" style={{ width: "100%" }} /></div>
          </div>
        </div>
        <div id="hud-phase3" className="hidden">
          <div className="gauge-label">⚠ Carga pesada — desvie dos detritos (<span id="debris-count">0</span>)</div>
        </div>
        <div id="level-badge" className="pixel">NÍVEL {startLevel}/10</div>
      </div>

      <div id="stage">
        <canvas ref={canvasRef} />
        <div id="controls">
          <div className="side-pair">
            <div className="ctrl-btn pixel" id="left-btn">◀</div>
            <div className="ctrl-btn pixel" id="right-btn">▶</div>
          </div>
          <div className="ctrl-btn pixel" id="thrust-btn">▲</div>
        </div>
      </div>

      <div id="start-overlay" className="overlay">
        <div className="title-big pixel">ACROSS<br />AGE</div>
        <img id="ship-briefing-img" src={shipImageUrl} alt="Sua nave" style={{ width: 220, borderRadius: 14, border: "2px solid var(--gold-dim)" }} />
        <div className="subtitle" style={{ marginTop: -6, opacity: 0.8 }}>Piloto: {pilotName}</div>
        <div className="subtitle">
          Fase 1: pouse a nave no planeta-alvo.<br />
          Fase 2: escolha a ferramenta certa e lance no momento certo.<br />
          Fase 3: volte pra Terra com a carga pesada, desviando dos detritos.
        </div>
        <button className="btn" id="start-btn">▶ JOGAR</button>
      </div>

      <div id="lose-overlay" className="overlay hidden">
        <div className="title-big pixel" style={{ fontSize: 16 }}>JOGADA PERDIDA</div>
        <div id="funny-msg" className="funny-msg" />
        <div className="stat-row"><span>Nível: <b id="lose-level">1</b></span><span>Coleta total: <b id="lose-collected">0/10</b></span></div>
        <button className="btn" id="retry-btn">↻ TENTAR NOVAMENTE</button>
      </div>

      <div id="phase2" className="overlay hidden">
        <div id="pilot-badge"><img id="pilot-img" alt="Piloto" /><span>PILOTO</span></div>
        <div className="title-big pixel" style={{ fontSize: 14 }}>POUSO OK!</div>
        <div className="target-icon" id="target-icon">🥇</div>
        <div id="target-name" className="pixel" style={{ fontSize: 12, color: "var(--gold)", marginTop: -8 }}>Ouro</div>
        <div id="target-state" style={{ fontSize: 10, color: "var(--teal)", letterSpacing: ".5px", textTransform: "uppercase", marginTop: -10 }}>Sólido solto</div>
        <div id="target-desc" className="subtitle" style={{ marginTop: -6 }}>—</div>
        <div id="tool-prompt" className="subtitle" style={{ marginTop: -6, opacity: 0.8 }}>Qual ferramenta combina com esse tipo de garimpo?</div>
        <div id="tool-row" />
        <div id="aim-section" className="hidden">
          <div className="subtitle" style={{ margin: "2px 0 6px" }}>Lance no momento certo!</div>
          <div id="aim-track"><div id="aim-zone" /><div id="aim-marker" /></div>
          <button className="btn" id="launch-btn">🎯 LANÇAR</button>
        </div>
      </div>

      <div id="result" className="overlay hidden">
        <div className="title-big pixel" id="result-title" style={{ fontSize: 16, color: "var(--teal)" }}>COLETA CONCLUÍDA!</div>
        <div className="stat-row">
          <span>Material: <b id="res-material">-</b></span>
          <span>Progresso: <b id="res-progress">1/10</b></span>
          <span>Nível: <b id="res-level">1/10</b></span>
        </div>
        <div className="stat-row">
          <span>Pousos OK: <b id="res-landed">0</b></span>
          <span>Avarias: <b id="res-crashed">0</b></span>
        </div>
        <button className="btn" id="next-btn">▶ PRÓXIMA VIAGEM</button>
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
.across-age-root #hud{ display:flex; justify-content:space-between; align-items:flex-start; padding:10px 14px; gap:10px; position:relative; z-index:5; }
.across-age-root #hud-normal{ display:flex; gap:10px; flex:1; }
.across-age-root #hud-phase3{ flex:1; display:flex; align-items:center; }
.across-age-root #hud-phase3 .gauge-label{ color:var(--danger); font-size:10px; text-transform:uppercase; }
.across-age-root .gauge{ flex:1; }
.across-age-root .gauge-label{ font-size:10px; color:var(--ink-dim); margin-bottom:4px; text-transform:uppercase; }
.across-age-root .gauge-track{ height:8px; border-radius:4px; background:#1c2050; overflow:hidden; border:1px solid #2b2f66; }
.across-age-root .gauge-fill{ height:100%; border-radius:4px; transition:width .15s linear; background:linear-gradient(90deg,var(--gold-dim),var(--gold)); }
.across-age-root #ox-fill{ background:linear-gradient(90deg,#1c8f8f,var(--teal)); }
.across-age-root #level-badge{ font-size:10px; padding:6px 10px; border:1px solid var(--gold); border-radius:20px; color:var(--gold); white-space:nowrap; height:fit-content; }
.across-age-root #stage{ position:relative; height:calc(100% - 46px); overflow:hidden; }
.across-age-root canvas{ position:absolute; top:0; left:0; width:100%; height:100%; display:block; }
.across-age-root #controls{ position:absolute; bottom:0; left:0; right:0; display:flex; justify-content:space-between; align-items:flex-end; padding:18px; z-index:6; pointer-events:none; }
.across-age-root .ctrl-btn{ pointer-events:auto; width:64px; height:64px; border-radius:50%; background:rgba(20,24,60,.85); border:2px solid var(--gold-dim); color:var(--gold); font-size:22px; display:flex; align-items:center; justify-content:center; }
.across-age-root .ctrl-btn:active{ background:rgba(232,179,74,.25); border-color:var(--gold); }
.across-age-root #thrust-btn{ width:78px; height:78px; font-size:26px; }
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
.across-age-root #pilot-badge{ position:absolute; top:14px; left:14px; z-index:25; display:flex; flex-direction:column; align-items:center; gap:3px; }
.across-age-root #pilot-img{ width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid var(--teal); background:#12163a; }
.across-age-root #pilot-badge span{ font-size:8px; color:var(--teal); letter-spacing:1px; }
.across-age-root #aim-section{ display:flex; flex-direction:column; align-items:center; margin-top:4px; }
.across-age-root #aim-track{ position:relative; width:260px; height:16px; background:#12163a; border:1px solid #2b2f66; border-radius:8px; overflow:hidden; margin-bottom:12px; }
.across-age-root #aim-zone{ position:absolute; top:0; bottom:0; background:rgba(61,219,201,.35); border-left:2px solid var(--teal); border-right:2px solid var(--teal); }
.across-age-root #aim-marker{ position:absolute; top:-3px; left:0; width:4px; height:22px; background:var(--gold); border-radius:2px; }
`;

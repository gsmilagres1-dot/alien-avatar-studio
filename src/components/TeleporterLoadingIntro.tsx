import { useEffect, useState } from "react";
import cockpitView from "@/assets/cockpit-view.jpg";
import teleporterCabin from "@/assets/teleporter-prize.jpg";
import wormholePrize from "@/assets/wormhole-prize.jpg";

// =========================================================
// TeleporterLoadingIntro
// Tela de abertura do Across Age: a cabine teletransportadora
// atravessa o buraco de minhoca (cockpit-view.jpg) com as
// turbinas cintilando, chega com um flash + fumaça, e pousa
// dentro do portal (wormhole-prize.jpg) com as turbinas apagadas.
// Toca uma vez toda vez que a pessoa entra no jogo pelo Hub.
// =========================================================

type Stage = "enter" | "flying" | "arriving" | "settled" | "done";

const STAGE_STYLE: Record<Stage, { scale: number; x: number; y: number; opacity: number; glow: number }> = {
  enter: { scale: 0.07, x: 18, y: -4, opacity: 0, glow: 0 },
  flying: { scale: 0.74, x: 0, y: 0, opacity: 1, glow: 10 },
  arriving: { scale: 1.12, x: 0, y: 4, opacity: 1, glow: 26 },
  settled: { scale: 1.02, x: 0, y: 0, opacity: 1, glow: 16 },
  done: { scale: 1.02, x: 0, y: 0, opacity: 1, glow: 10 },
};

const CABIN_MASK =
  "radial-gradient(ellipse 62% 58% at 50% 46%, black 50%, rgba(0,0,0,.7) 68%, transparent 88%)";

export function TeleporterLoadingIntro({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>("enter");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("flying"), 60),
      setTimeout(() => setStage("arriving"), 1300),
      setTimeout(() => setStage("settled"), 2200),
      setTimeout(() => setStage("done"), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === "done" && !skipped) {
      const t = setTimeout(onComplete, 250);
      return () => clearTimeout(t);
    }
  }, [stage, skipped, onComplete]);

  function handleSkip() {
    setSkipped(true);
    onComplete();
  }

  const s = STAGE_STYLE[stage];
  const showPortal = stage === "arriving" || stage === "settled" || stage === "done";
  const flashing = stage === "arriving";
  const thrustersOn = stage === "flying";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000",
        overflow: "hidden",
      }}
      onClick={handleSkip}
    >
      {/* fundo: buraco de minhoca */}
      <img
        src={cockpitView}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.15)",
          opacity: showPortal ? 0 : 1,
          transition: "opacity 0.7s ease",
        }}
      />
      {/* fundo: portal (anéis verticais) */}
      <img
        src={wormholePrize}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.05)",
          opacity: showPortal ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* fumaça na chegada */}
      {(stage === "arriving" || stage === "settled") && (
        <>
          <div
            style={{
              position: "absolute",
              left: "38%",
              top: "58%",
              width: "12cqw",
              height: "6cqw",
              maxWidth: 120,
              maxHeight: 60,
              background: "radial-gradient(ellipse, rgba(200,220,255,.55), transparent 70%)",
              filter: "blur(6px)",
              transform: "translate(-50%,-50%)",
              animation: "taiSmokeOut 1.6s ease-out forwards",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "62%",
              top: "60%",
              width: "10cqw",
              height: "5.5cqw",
              maxWidth: 100,
              maxHeight: 55,
              background: "radial-gradient(ellipse, rgba(255,200,240,.5), transparent 70%)",
              filter: "blur(6px)",
              transform: "translate(-50%,-50%)",
              animation: "taiSmokeOut 1.8s ease-out forwards",
              animationDelay: "0.1s",
            }}
          />
        </>
      )}

      {/* cabine teletransportadora */}
      <div
        style={{
          position: "absolute",
          left: `${50 + s.x}%`,
          top: `${56 + s.y}%`,
          width: "42%",
          maxWidth: 360,
          transform: `translate(-50%,-50%) scale(${s.scale})`,
          transition:
            "left 1.1s cubic-bezier(.2,.7,.3,1), top 1.1s cubic-bezier(.2,.7,.3,1), transform 1.1s cubic-bezier(.2,.7,.3,1)",
        }}
      >
        {/* névoa colorida atrás da cabine, pra casar com o portal */}
        <div
          style={{
            position: "absolute",
            inset: "-15%",
            background:
              "radial-gradient(ellipse, rgba(120,190,255,.35), rgba(230,110,255,.22) 55%, transparent 78%)",
            filter: "blur(14px)",
            opacity: s.opacity * 0.9,
            transition: "opacity 0.6s ease",
          }}
        />
        {/* cabine recortada (CSS crop, sem gerar arquivo de imagem novo) */}
        <div style={{ position: "relative", aspectRatio: "615 / 901", width: "100%" }}>
          <img
            src={teleporterCabin}
            alt="Cabine teletransportadora"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 44%",
              opacity: s.opacity,
              filter: `saturate(1.15) contrast(1.05) drop-shadow(0 0 ${s.glow}px rgba(120,180,255,.8)) drop-shadow(0 0 ${
                s.glow * 1.6
              }px rgba(255,120,220,.5))`,
              WebkitMaskImage: CABIN_MASK,
              maskImage: CABIN_MASK,
              transition: "opacity 0.6s ease, filter 0.8s ease",
            }}
          />
          {/* turbinas: cintilam voando, apagam na chegada */}
          {["23%", "77%"].map((left, i) => (
            <div
              key={left}
              style={{
                position: "absolute",
                left,
                top: "16%",
                width: "12%",
                height: "30%",
                transform: "translateX(-50%)",
                transformOrigin: "top center",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.95), rgba(120,200,255,.85) 35%, rgba(90,140,255,.15) 90%)",
                borderRadius: "50% 50% 50% 50% / 20% 20% 60% 60%",
                filter: "blur(1.5px)",
                opacity: thrustersOn ? 1 : 0,
                animation: thrustersOn
                  ? `taiThrusterFlicker ${0.35 + i * 0.08}s ease-in-out infinite alternate`
                  : "none",
                animationDelay: `${i * 0.12}s`,
                transition: "opacity 0.45s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* flash branco no instante da chegada */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "white",
          opacity: flashing ? 0.55 : 0,
          transition: flashing ? "opacity 0.08s ease" : "opacity 0.6s ease",
          pointerEvents: "none",
        }}
      />

      {/* rótulo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "8%",
          textAlign: "center",
          opacity: stage === "settled" || stage === "done" ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <span
          style={{
            fontSize: 12,
            letterSpacing: 2,
            color: "#3ddbc9",
            background: "rgba(5,7,20,.7)",
            padding: "7px 16px",
            borderRadius: 20,
            fontFamily: "monospace",
          }}
        >
          ENTRANDO NO HANGAR...
        </span>
      </div>

      {/* pular */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          fontSize: 11,
          padding: "6px 12px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,.35)",
          background: "rgba(0,0,0,.4)",
          color: "rgba(255,255,255,.8)",
          fontFamily: "monospace",
        }}
      >
        PULAR ▶▶
      </button>

      <style>{`
        @keyframes taiSmokeOut {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(0.4); }
          30% { opacity: .7; }
          100% { opacity: 0; transform: translate(-50%,-70%) scale(1.6); }
        }
        @keyframes taiThrusterFlicker {
          0% { opacity: .75; transform: translateX(-50%) scaleY(.85) scaleX(.9); }
          50% { opacity: 1; transform: translateX(-50%) scaleY(1.08) scaleX(1.05); }
          100% { opacity: .9; transform: translateX(-50%) scaleY(1) scaleX(1); }
        }
      `}</style>
    </div>
  );
    }

import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Rocket, Sparkles, Stamp, MapPin, Cpu, Radar, Satellite, Users, Coins, Map, Gauge, Zap, Shield, Signal, Swords, Wrench } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUpgradeStats } from "@/hooks/useUpgradeStats";
import cockpitView from "@/assets/cockpit-view.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Identidade Alien · Vire um alienígena grátis" },
      { name: "description", content: "Tire uma selfie, escolha sua raça e receba sua identidade alienígena, passaporte e nave personalizada. 100% grátis." },
      { property: "og:title", content: "Identidade Alien" },
      { property: "og:description", content: "Sua versão alienígena com IA: identidade, passaporte e nave. Viaje pela galáxia grátis." },
    ],
  }),
  component: Landing,
});

interface Task {
  step: string;
  icon: typeof Camera;
  title: string;
  desc: string;
  metal: "silver" | "gold" | "copper" | "plasma";
  hint: string;
  to: string;
}

const TASKS: Task[] = [
  { step: "01", icon: Camera, title: "Selfie",     desc: "Avatar alien por IA",      metal: "silver", hint: "CAM-Δ7", to: "/criar" },
  { step: "02", icon: Stamp,  title: "Passaporte", desc: "Documento galáctico",      metal: "gold",   hint: "DOC-Ω",  to: "/criar" },
  { step: "03", icon: Rocket, title: "Nave",       desc: "Esportiva · off-road",     metal: "copper", hint: "NAV-3",  to: "/criar" },
  { step: "04", icon: MapPin, title: "Destino",    desc: "45 destinos liberados",    metal: "plasma", hint: "MAP-∞",  to: "/mapa" },
];

const METAL: Record<Task["metal"], { ring: string; chip: string; accent: string; glow: string }> = {
  silver: { ring: "from-[#f4f6fa] via-[#9aa3b2] to-[#3b4250]", chip: "from-[#e8ecf3] to-[#8a93a3]", accent: "text-slate-200", glow: "#9aa3b2" },
  gold:   { ring: "from-[#fff3c2] via-[#d4ad4a] to-[#5a3d0a]", chip: "from-[#ffe9a3] to-[#a07a1f]", accent: "text-amber-200", glow: "#d4ad4a" },
  copper: { ring: "from-[#f8d8b6] via-[#c08050] to-[#4a2510]", chip: "from-[#f4cfa4] to-[#9a5a2c]", accent: "text-orange-200", glow: "#c08050" },
  plasma: { ring: "from-[#c9f0ff] via-[#7a4dd0] to-[#1a0a3a]", chip: "from-[#b0e8ff] to-[#5a32a6]", accent: "text-cyan-200", glow: "#7a4dd0" },
};

function Readout({ icon: Icon, label, value, color }: { icon: typeof Gauge; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-black/70 border border-white/10 px-1.5 py-1">
      <Icon className="w-3 h-3 shrink-0" style={{ color }} />
      <div className="min-w-0 leading-none">
        <div className="text-[7px] font-mono uppercase tracking-widest text-white/50">{label}</div>
        <div className="text-[10px] font-mono font-bold truncate" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

function Landing() {
  const stats = useUpgradeStats();
  return (
    <main className="relative z-10 min-h-screen overflow-hidden">
      {/* ===== COCKPIT VIEWPORT (arched window) ===== */}
      <section className="relative">
        <div className="relative aspect-[16/10] w-full">
          <img
            src={cockpitView}
            alt="Vista do cockpit da nave alien"
            width={1536}
            height={896}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* HUD overlay top */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase text-cyan-300">
              <Sparkles className="w-3 h-3" /> Fed. Galáctica · v2.0
            </div>
            <LanguageSwitcher />
          </div>

          {/* Center hero text — projected on viewport */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)]">
              <span className="text-gradient-alien">Vire um</span>{" "}
              <span className="text-gradient-neon">alien</span>
            </h1>
            <p className="mt-2 text-[11px] sm:text-sm text-white/90 max-w-xs drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Selfie → passaporte → nave → 45 destinos. 100% grátis.
            </p>
          </div>

          {/* Side readouts on viewport frame */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 w-[88px]">
            <Readout icon={Gauge} label="Velocidade" value={stats.speedC} color="#22d3ee" />
            <Readout icon={Zap}   label="Reator"    value={stats.reactor}    color="#34d399" />
            <Readout icon={Shield} label="Escudos"  value={stats.shields}     color="#a78bfa" />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 w-[88px] items-end">
            <Readout icon={Radar}     label="Radar"  value={stats.radar}  color="#fbbf24" />
            <Readout icon={Satellite} label="Sync"   value="LINK"  color="#22d3ee" />
            <Readout icon={Signal}    label="Sinal"  value="-42dB" color="#fbbf24" />
          </div>

          {/* Bottom curved bezel suggesting cockpit edge */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
      </section>

      {/* ===== MAIN CONSOLE ===== */}
      <section className="relative -mt-4 px-3 pb-10">
        {/* Console title bar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-accent">
            <Cpu className="w-3 h-3" /> Painel da nave · check-in pré-voo
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            ONLINE
          </div>
        </div>

        {/* Primary CTA bar */}
        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 shadow-[0_4px_20px_rgba(251,146,60,0.4)] mb-3">
          <div className="rounded-2xl bg-black/85 backdrop-blur p-3 flex gap-2">
            <Link
              to="/criar"
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground font-display font-bold text-sm shadow-neon hover:scale-[1.02] transition"
            >
              <Camera className="w-4 h-4" />
              Criar identidade
            </Link>
            <Link to="/galeria" className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl glass text-xs">
              Galeria
            </Link>
          </div>
        </div>

        {/* 4 manual tasks — console tiles */}
        <div className="grid grid-cols-2 gap-2 text-left">
          {TASKS.map((t) => {
            const m = METAL[t.metal];
            return (
              <Link
                key={t.title}
                to={t.to}
                className={`relative rounded-xl p-[2px] bg-gradient-to-br ${m.ring} shadow-[0_4px_14px_rgba(0,0,0,0.6)] active:scale-[0.98] transition`}
              >
                <div className="rounded-xl bg-gradient-to-b from-black/90 via-black/75 to-black/90 p-2.5 h-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-gradient-to-b ${m.chip} text-black tracking-widest`}>
                      {t.step}
                    </span>
                    <span className="text-[7px] font-mono text-white/40 tracking-widest">{t.hint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`relative w-9 h-9 shrink-0 rounded-full p-[2px] bg-gradient-to-br ${m.ring}`}>
                      <div className="w-full h-full rounded-full bg-black/85 flex items-center justify-center">
                        <t.icon className={`w-4 h-4 ${m.accent}`} />
                      </div>
                      <span
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: m.glow, boxShadow: `0 0 6px ${m.glow}` }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-xs text-foreground leading-tight truncate">{t.title}</div>
                      <div className="text-[9px] text-white/55 leading-tight truncate">{t.desc}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* divider rivets */}
        <div className="my-3 flex items-center gap-2 px-1">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-[8px] font-mono text-white/40 tracking-widest">HUBS · DESTINOS</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="w-1 h-1 rounded-full bg-white/30" />
        </div>

        {/* 6 hub buttons — futuristic console style */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: "/equipes",  icon: Users,  label: "Equipe",   sub: "Intergaláctica", metal: "gold"   as const, hint: "TEAM-Σ" },
            { to: "/loja",     icon: Coins,  label: "Fichas",   sub: "Loja · S.O.S.",  metal: "gold"   as const, hint: "FIC-€"  },
            { to: "/mapa",     icon: Map,    label: "Mapa",     sub: "45 destinos",    metal: "plasma" as const, hint: "MAP-∞"  },
            { to: "/batalha",  icon: Swords, label: "Batalha",  sub: "9 perguntas",    metal: "copper" as const, hint: "BTL-X"  },
            { to: "/upgrades", icon: Wrench, label: "Upgrades", sub: "Evoluir nave",   metal: "silver" as const, hint: "UPG-7"  },
            { to: "/galeria",  icon: Rocket, label: "Galeria",  sub: "Suas identid.",  metal: "plasma" as const, hint: "GAL-9"  },
          ].map((h) => {
            const m = METAL[h.metal];
            return (
              <Link
                key={h.to}
                to={h.to}
                className={`relative rounded-xl p-[2px] bg-gradient-to-br ${m.ring} shadow-[0_4px_14px_rgba(0,0,0,0.6)] active:scale-[0.97] hover:scale-[1.02] transition`}
              >
                <div className="rounded-xl bg-gradient-to-b from-black/90 via-black/75 to-black/90 p-2 h-full flex flex-col items-center text-center">
                  <span className="text-[7px] font-mono text-white/40 tracking-widest self-end">{h.hint}</span>
                  <div className={`relative w-9 h-9 rounded-full p-[2px] bg-gradient-to-br ${m.ring} mb-1`}>
                    <div className="w-full h-full rounded-full bg-black/85 flex items-center justify-center">
                      <h.icon className={`w-4 h-4 ${m.accent}`} />
                    </div>
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: m.glow, boxShadow: `0 0 6px ${m.glow}` }}
                    />
                  </div>
                  <div className="font-display text-[11px] text-foreground leading-tight">{h.label}</div>
                  <div className="text-[8px] text-white/55 leading-tight">{h.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>


        {/* Bottom status strip */}
        <div className="mt-3 rounded-xl bg-black/70 border border-white/10 px-3 py-2 grid grid-cols-3 gap-2">
          <div>
            <div className="text-[7px] font-mono uppercase tracking-widest text-white/40">Selos</div>
            <div className="text-[10px] font-mono text-amber-300">ouro · prata · cobre</div>
          </div>
          <div className="text-center">
            <div className="text-[7px] font-mono uppercase tracking-widest text-white/40">Quiz</div>
            <div className="text-[10px] font-mono text-cyan-300">9 perguntas / nó</div>
          </div>
          <div className="text-right">
            <div className="text-[7px] font-mono uppercase tracking-widest text-white/40">Embarque</div>
            <div className="text-[10px] font-mono text-emerald-300">PRONTO</div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] font-mono text-white/50">
          Grátis · até 3 opções por selfie e novas identidades sem cobrança.
        </p>
      </section>
    </main>
  );
}

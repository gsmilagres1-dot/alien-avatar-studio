import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Rocket, Sparkles, Wallet, Share2, Stamp, MapPin, Cpu, Radar, Satellite, Users, Coins, Map } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
}

const TASKS: Task[] = [
  { step: "01", icon: Camera,   title: "Tirar selfie",     desc: "Foto vira avatar alien por IA",           metal: "silver", hint: "MOD · CAM-Δ7" },
  { step: "02", icon: Stamp,    title: "Fazer passaporte", desc: "Documento galáctico liberado grátis",     metal: "gold",   hint: "MOD · DOC-Ω" },
  { step: "03", icon: Rocket,   title: "Escolher nave",    desc: "Esportiva, off-road ou pod racer",        metal: "copper", hint: "MOD · NAV-3" },
  { step: "04", icon: MapPin,   title: "Escolher destino", desc: "10 planetas · 3 sois · 2 luas",           metal: "plasma", hint: "MOD · MAP-∞" },
];

const METAL_FRAME: Record<Task["metal"], { ring: string; chip: string; accent: string }> = {
  silver: {
    ring: "from-[#f4f6fa] via-[#9aa3b2] to-[#3b4250]",
    chip: "from-[#e8ecf3] to-[#8a93a3]",
    accent: "text-slate-200",
  },
  gold: {
    ring: "from-[#fff3c2] via-[#d4ad4a] to-[#5a3d0a]",
    chip: "from-[#ffe9a3] to-[#a07a1f]",
    accent: "text-amber-200",
  },
  copper: {
    ring: "from-[#f8d8b6] via-[#c08050] to-[#4a2510]",
    chip: "from-[#f4cfa4] to-[#9a5a2c]",
    accent: "text-orange-200",
  },
  plasma: {
    ring: "from-[#c9f0ff] via-[#7a4dd0] to-[#1a0a3a]",
    chip: "from-[#b0e8ff] to-[#5a32a6]",
    accent: "text-cyan-200",
  },
};

function Landing() {
  return (
    <main className="relative z-10 min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-5 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-6">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-accent">Federação Galáctica · v2.0</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight">
          <span className="text-gradient-alien">Vire um</span>
          <br />
          <span className="text-gradient-neon">alienígena</span>
        </h1>
        <p className="mt-6 text-muted-foreground max-w-md mx-auto">
          Fluxo 100% grátis: criar identidade, liberar passaporte, escolher destino, escolher nave e jogar o quiz sem cobranças.
        </p>

        <div className="mt-8 inline-flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/criar"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-accent text-accent-foreground font-display font-bold shadow-neon hover:scale-105 transition"
          >
            <Camera className="w-5 h-5" />
            Criar minha identidade — grátis
          </Link>
          <Link to="/galeria" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full glass">
            Minha galeria
          </Link>
        </div>

        {/* Painel de bordo */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent">
              <Cpu className="w-3 h-3" /> Painel da nave · check-in pré-voo
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <Radar className="w-3 h-3 animate-pulse" /> ONLINE
              <Satellite className="w-3 h-3" /> SYNC
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {TASKS.map((t) => {
              const m = METAL_FRAME[t.metal];
              return (
                <div
                  key={t.title}
                  className={`relative rounded-2xl p-[2px] bg-gradient-to-br ${m.ring} shadow-[0_4px_18px_rgba(0,0,0,0.5)]`}
                >
                  <div className="rounded-2xl bg-gradient-to-b from-black/85 via-black/70 to-black/85 p-3 backdrop-blur-sm h-full">
                    {/* Top chip row */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-gradient-to-b ${m.chip} text-black tracking-widest`}
                      >
                        {t.step}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground tracking-widest">{t.hint}</span>
                    </div>

                    {/* Icon disc with metal ring */}
                    <div className={`relative mx-auto mb-2 w-12 h-12 rounded-full p-[2px] bg-gradient-to-br ${m.ring}`}>
                      <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                        <t.icon className={`w-5 h-5 ${m.accent}`} />
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                    </div>

                    <div className="font-display text-sm text-center text-foreground">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground text-center mt-0.5 leading-tight">{t.desc}</div>

                    {/* bottom rivets */}
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="h-px flex-1 mx-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between px-1 text-[9px] font-mono text-muted-foreground tracking-widest">
            <span>SYS · pronto p/ embarque</span>
            <span>SELOS · ouro · prata · cobre</span>
          </div>
        </div>

        <p className="mt-12 text-[11px] font-mono text-muted-foreground">
          Grátis · até 3 opções por selfie e novas identidades sem cobrança.
        </p>
      </div>
    </main>
  );
}

import { Sparkles } from "lucide-react";
import type { AlienIdentity } from "@/lib/alien";

type CardType = "identidade" | "trabalho" | "motorista";

const META: Record<CardType, { title: string; subtitle: string; emblem: string }> = {
  identidade: {
    title: "Identidade Alienígena",
    subtitle: "Federação Galáctica · Documento Universal",
    emblem: "RG·ALIEN",
  },
  trabalho: {
    title: "Carteira de Trabalho",
    subtitle: "Sindicato Interestelar de Espécies",
    emblem: "CTPS·G",
  },
  motorista: {
    title: "Carteira de Habilitação",
    subtitle: "Departamento de Tráfego Orbital",
    emblem: "CNH·∞",
  },
};

export function AlienCard({
  type,
  identity,
  avatarUrl,
}: {
  type: CardType;
  identity: AlienIdentity;
  avatarUrl: string;
}) {
  const meta = META[type];
  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-card-alien glass">
      {/* top banner */}
      <div className="relative px-5 pt-4 pb-3 bg-alien-grad">
        <div className="flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-display text-[11px] tracking-widest uppercase">
              {meta.subtitle}
            </span>
          </div>
          <span className="font-mono text-[10px] opacity-90">{meta.emblem}</span>
        </div>
        <h3 className="font-display text-lg text-primary-foreground mt-1">
          {meta.title}
        </h3>
      </div>

      {/* body */}
      <div className="p-5 grid grid-cols-[96px_1fr] gap-4">
        <div className="relative">
          <div className="w-24 h-28 rounded-lg overflow-hidden border border-accent/40 shadow-neon">
            <img
              src={avatarUrl}
              alt="Avatar alienígena"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-mono font-bold">
            VERIFIED
          </div>
        </div>

        <div className="space-y-1.5 text-foreground">
          <Row label="Nome" value={identity.alienName} highlight />
          <Row label="Espécie" value={identity.species} />
          <Row label="Origem" value={identity.planetName} />
          <Row label="Nascimento" value={identity.galacticBirth} />
          {type === "identidade" && (
            <Row label="Nº Universal" value={identity.idNumber} mono />
          )}
          {type === "trabalho" && <Row label="Função" value={identity.rank} />}
          {type === "motorista" && (
            <Row label="Categoria" value={identity.licenseClass} />
          )}
        </div>
      </div>

      {/* footer */}
      <div className="px-5 pb-4 pt-2 border-t border-border/40 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">
          T-Terra · {identity.earthDate}
        </span>
        <span className="font-mono text-[10px] text-accent">
          {identity.idNumber}
        </span>
      </div>

      {/* hologram strip */}
      <div className="absolute top-0 right-0 bottom-0 w-1 bg-alien-grad opacity-70 animate-pulse-neon" />
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm leading-tight ${highlight ? "text-gradient-neon font-display text-base" : ""} ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Rocket } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";

export const Route = createFileRoute("/_authenticated/mapa")({
  component: Mapa,
});

function Mapa() {
  return (
    <main className="px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl text-gradient-neon">Mapa Intergaláctico</h1>
        <WalletBadge />
      </div>
      <div className="glass rounded-2xl p-8 text-center border border-accent/30">
        <Map className="w-12 h-12 text-accent mx-auto" />
        <h2 className="font-display text-xl mt-3">Mapa com 45 destinos</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Sua posição no espaço, trajeto percorrido, selos conquistados, alimentos de astronauta e anéis de minhoca — tudo num mapa estilo aventura.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-accent">
          <Rocket className="w-4 h-4" /> Em construção · Fase 6
        </div>
      </div>
      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline">← voltar à home</Link>
      </div>
    </main>
  );
}

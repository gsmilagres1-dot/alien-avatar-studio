import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Plus, Loader2 } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";

export const Route = createFileRoute("/_authenticated/equipes")({
  component: Equipes,
});

function Equipes() {
  return (
    <main className="px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl text-gradient-neon">Equipes Alien</h1>
        <WalletBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Forme uma equipe de até 50 membros, dispute batalhas-quiz online com 5 destinos de 9 perguntas cada e aposte fichas contra equipes adversárias.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-accent/30">
          <Plus className="w-7 h-7 text-accent mb-2" />
          <h2 className="font-display text-lg">Criar equipe</h2>
          <p className="text-xs text-muted-foreground mt-1">Nome até 16 caracteres, bandeira do país, link de convite.</p>
          <button disabled className="mt-3 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold opacity-50">
            <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Em desenvolvimento
          </button>
        </div>
        <div className="glass rounded-2xl p-5 border border-accent/30">
          <Users className="w-7 h-7 text-accent mb-2" />
          <h2 className="font-display text-lg">Ranking de equipes</h2>
          <p className="text-xs text-muted-foreground mt-1">Pontuação acumulada, selos de ouro/prata/bronze, saldo de fichas.</p>
          <div className="mt-3 text-[10px] text-muted-foreground">Lista vazia · seja o primeiro a fundar uma equipe.</div>
        </div>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/galaxia" className="underline">← voltar para a galáxia singular</Link>
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Rocket, Sparkles, Wallet, Share2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Identidade Alien · Vire um alienígena grátis" },
      { name: "description", content: "Tire uma selfie, escolha um planeta e receba RG, CTPS e CNH alienígenas. Inclui nave personalizada. 100% grátis." },
      { property: "og:title", content: "Identidade Alien" },
      { property: "og:description", content: "Sua versão alienígena com IA: identidade, CTPS, CNH e nave. Compartilhe nas redes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { auth } = Route.useRouteContext();
  return (
    <main className="relative z-10 min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
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
          Sua selfie + IA = RG, CTPS, CNH e até uma nave alien. Pronto pra imprimir como crachá e compartilhar.
        </p>

        <div className="mt-8 inline-flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={auth.isAuthenticated ? "/criar" : "/login"}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-accent text-accent-foreground font-display font-bold shadow-neon hover:scale-105 transition"
          >
            <Camera className="w-5 h-5" />
            Criar minha identidade — R$ 2,99
          </Link>
          {auth.isAuthenticated && (
            <Link to="/galeria" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full glass">
              Minha galeria
            </Link>
          )}
        </div>

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          {[
            { i: Camera, t: "Sua selfie", d: "Foto vira avatar alien" },
            { i: Wallet, t: "3 carteiras", d: "RG, CTPS e CNH" },
            { i: Rocket, t: "Sua nave", d: "Esportiva, off-road ou corrida" },
            { i: Share2, t: "Compartilhe", d: "Instagram, X, Threads..." },
          ].map((x) => (
            <div key={x.t} className="glass rounded-xl p-4">
              <x.i className="w-5 h-5 text-accent" />
              <div className="font-display text-sm mt-2">{x.t}</div>
              <div className="text-[11px] text-muted-foreground">{x.d}</div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[11px] font-mono text-muted-foreground">
          R$ 2,99 = 1 identidade final + até 3 opções de avatar pra escolher.
        </p>
      </div>
    </main>
  );
}

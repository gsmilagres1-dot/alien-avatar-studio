import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Rocket, Sparkles, Wallet, Share2 } from "lucide-react";
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

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          {[
            { i: Camera, t: "Sua selfie", d: "Foto vira avatar alien" },
            { i: Wallet, t: "Passaporte", d: "Liberado grátis na viagem" },
            { i: Rocket, t: "Destino + nave", d: "Escolha a rota e a nave" },
            { i: Share2, t: "Quiz final", d: "Complete a viagem sem pagar" },
          ].map((x) => (
            <div key={x.t} className="glass rounded-xl p-4">
              <x.i className="w-5 h-5 text-accent" />
              <div className="font-display text-sm mt-2">{x.t}</div>
              <div className="text-[11px] text-muted-foreground">{x.d}</div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[11px] font-mono text-muted-foreground">
          Grátis · até 3 opções por selfie e novas identidades sem cobrança.
        </p>
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, PlayCircle, Loader2, X, Hourglass } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { claimVideoAdReward, getVideoAdStatus } from "@/lib/wallet.functions";
import { useWallet } from "@/hooks/useWallet";
import { WalletBadge } from "@/components/WalletBadge";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PACKS = [
  { id: "fichas_pack_100",  fichas: 100,  price: "R$ 1,99" },
  { id: "fichas_pack_300",  fichas: 300,  price: "R$ 4,99" },
  { id: "fichas_pack_700",  fichas: 700,  price: "R$ 9,99" },
  { id: "fichas_pack_1000", fichas: 1000, price: "R$ 13,99" },
];

export const Route = createFileRoute("/_authenticated/loja")({
  component: Loja,
});

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Loja() {
  const claimFn = useServerFn(claimVideoAdReward);
  const statusFn = useServerFn(getVideoAdStatus);
  const { refresh } = useWallet();
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(7);
  const [nextAt, setNextAt] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  async function loadStatus() {
    try {
      const s = await statusFn();
      setRemaining(s.remaining);
      setNextAt(s.nextAt);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => { loadStatus(); }, []);
  useEffect(() => {
    if (!nextAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextAt]);

  const cooldownMs = nextAt ? new Date(nextAt).getTime() - now : 0;
  const cooldownActive = remaining === 0 && cooldownMs > 0;

  useEffect(() => {
    if (nextAt && cooldownMs <= 0) loadStatus();
  }, [cooldownMs, nextAt]);

  async function watchAd() {
    if (cooldownActive || watching) return;
    setWatching(true);
    setProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / 5000) * 100));
    }, 100);
    setTimeout(async () => {
      clearInterval(tick);
      try {
        await claimFn();
        await refresh();
        await loadStatus();
        toast.success("+5 fichas grátis!");
      } catch (e) {
        const msg = (e as Error).message ?? "";
        if (msg.startsWith("cooldown:")) {
          const iso = msg.slice("cooldown:".length);
          setNextAt(iso);
          setRemaining(0);
          toast.error("Limite atingido — aguarde 3h para novos vídeos");
        } else {
          toast.error(msg);
        }
      } finally {
        setWatching(false);
        setProgress(0);
      }
    }, 5000);
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&next=/loja`
      : "";

  return (
    <>
      <PaymentTestModeBanner />
      <main className="px-4 py-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-gradient-neon">Loja de Fichas</h1>
          <WalletBadge />
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Fichas do teletransportador são usadas para S.O.S. (voltar pergunta, resgate do vácuo), apostas em batalhas de equipe e upgrades de nave.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {PACKS.map((p) => (
            <div key={p.id} className="glass rounded-2xl p-4 text-center border border-yellow-500/30">
              <Coins className="w-7 h-7 text-yellow-400 mx-auto" />
              <div className="font-display text-2xl text-yellow-300 mt-1">{p.fichas}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">fichas</div>
              <div className="mt-2 text-sm font-bold">{p.price}</div>
              <button
                onClick={() => setBuyingPack(p.id)}
                className="mt-2 w-full px-3 py-2 rounded-full bg-yellow-500 text-black text-xs font-bold hover:bg-yellow-400 transition-colors"
              >
                Comprar
              </button>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-5 border border-accent/30">
          <div className="flex items-center gap-3 mb-2">
            <PlayCircle className="w-7 h-7 text-accent" />
            <div className="flex-1">
              <h2 className="font-display text-lg">Assista e ganhe</h2>
              <p className="text-xs text-muted-foreground">
                Assista 1 vídeo e leve <b>5 fichas grátis</b>. Limite: <b>7 vídeos a cada 3 horas</b>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Vídeos restantes nesta janela</span>
            <span className="font-mono text-accent">{remaining}/7</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(remaining / 7) * 100}%` }}
            />
          </div>

          {cooldownActive ? (
            <div className="w-full mt-1 px-4 py-3 rounded-full bg-muted text-muted-foreground font-bold text-sm inline-flex items-center justify-center gap-2">
              <Hourglass className="w-4 h-4 animate-pulse" />
              Libera em {formatCountdown(cooldownMs)}
            </div>
          ) : (
            <button
              onClick={watchAd}
              disabled={watching}
              className="w-full mt-1 px-4 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm disabled:opacity-60"
            >
              {watching ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Assistindo… {Math.round(progress)}%</span>
              ) : (
                "Assistir vídeo (+5 fichas)"
              )}
            </button>
          )}
          {watching && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          <Link to="/" className="underline">← voltar à home</Link>
        </div>
      </main>

      {buyingPack && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl w-full max-w-md my-8">
            <button
              onClick={() => setBuyingPack(null)}
              aria-label="Fechar"
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <StripeEmbeddedCheckout returnUrl={returnUrl} kind="fichas" pack={buyingPack} />
          </div>
        </div>
      )}
    </>
  );
}

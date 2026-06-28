import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Coins, Loader2, ArrowLeft, Rocket, Lock } from "lucide-react";
import { toast } from "sonner";
import { UPGRADES, MAX_UPGRADE_LEVEL, upgradeCost, type UpgradeKey } from "@/lib/upgrades";
import { listMyUpgrades, purchaseUpgradeFn } from "@/lib/upgrades.functions";

export const Route = createFileRoute("/_authenticated/upgrades")({
  head: () => ({ meta: [{ title: "Upgrades de Nave · Alien" }] }),
  component: UpgradesShop,
});

function UpgradesShop() {
  const qc = useQueryClient();
  const fetchUps = useServerFn(listMyUpgrades);
  const purchase = useServerFn(purchaseUpgradeFn);

  const q = useQuery({ queryKey: ["my-upgrades"], queryFn: () => fetchUps() });
  const buyM = useMutation({
    mutationFn: (key: UpgradeKey) => purchase({ data: { upgradeKey: key } }),
    onSuccess: ({ newLevel }) => {
      toast.success(`Upgrade subiu para nível ${newLevel}!`);
      qc.invalidateQueries({ queryKey: ["my-upgrades"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ups = q.data?.upgrades ?? [];
  const fichas = q.data?.fichas ?? 0;
  const getLevel = (k: string) => ups.find((u: any) => u.upgrade_key === k)?.level ?? 0;

  return (
    <main className="relative z-10 min-h-screen px-4 py-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <Link to="/" className="text-xs text-muted-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Home
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-sm">
          <Coins className="w-3.5 h-3.5 text-amber-400" /> <span className="font-mono">{fichas}</span>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-5 h-5 text-cyan-400" />
        <h1 className="font-display text-2xl">Upgrades de Nave</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Use suas fichas para evoluir a nave. Cada nível custa <span className="font-mono">nível × 50</span> fichas. Máx. {MAX_UPGRADE_LEVEL}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {UPGRADES.map((u) => {
          const lvl = getLevel(u.key);
          const next = lvl + 1;
          const cost = upgradeCost(next);
          const maxed = lvl >= MAX_UPGRADE_LEVEL;
          const canBuy = !maxed && fichas >= cost && !buyM.isPending;
          const Icon = u.icon;
          return (
            <div key={u.key} className="rounded-2xl p-[2px] bg-gradient-to-br from-white/20 to-white/5">
              <div className="rounded-2xl bg-black/85 p-4 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${u.color} grid place-items-center ring-2 ring-white/20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm">{u.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{u.desc}</div>
                  </div>
                </div>

                {/* Level bar */}
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i < lvl ? "bg-gradient-to-r " + u.color : "bg-white/10"}`} />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Nível {lvl}/{MAX_UPGRADE_LEVEL}</span>
                  {!maxed && (
                    <span className="font-mono text-amber-300 flex items-center gap-0.5">
                      <Coins className="w-3 h-3" /> {cost}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => buyM.mutate(u.key as UpgradeKey)}
                  disabled={!canBuy}
                  className={`mt-3 px-3 py-2 rounded-lg text-sm font-bold ${
                    maxed ? "bg-white/5 text-muted-foreground" :
                    canBuy ? "bg-accent text-accent-foreground" :
                    "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {buyM.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                   maxed ? <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Máximo</span> :
                   fichas < cost ? "Fichas insuficientes" :
                   `Comprar Nv ${next}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

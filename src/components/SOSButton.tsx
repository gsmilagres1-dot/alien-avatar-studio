import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { spendFichas } from "@/lib/wallet.functions";
import { useWallet } from "@/hooks/useWallet";

interface Props {
  cost: number;
  reason: Parameters<typeof spendFichas>[0]["data"]["reason"];
  label: string;
  onSuccess: () => void;
  meta?: Record<string, unknown>;
  className?: string;
}

/** Botão S.O.S. estilo "LAUNCH" amarelo/preto listrado. */
export function SOSButton({ cost, reason, label, onSuccess, meta, className = "" }: Props) {
  const fn = useServerFn(spendFichas);
  const { fichas, refresh } = useWallet();
  const [busy, setBusy] = useState(false);
  const insufficient = fichas < cost;

  return (
    <button
      disabled={busy || insufficient}
      onClick={async () => {
        if (!confirm(`Usar ${cost} fichas em "${label}"?`)) return;
        setBusy(true);
        try {
          await fn({ data: { amount: cost, reason, meta } });
          await refresh();
          onSuccess();
          toast.success(`S.O.S. acionado — ${cost} fichas`);
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
      className={`group relative inline-flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl overflow-hidden border-2 border-black shadow-[0_4px_0_rgba(0,0,0,0.6)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg,#facc15 0 10px,#000 10px 20px)",
      }}
      title={insufficient ? `Faltam ${cost - fichas} fichas` : label}
    >
      <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white shadow">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
        S.O.S.
      </span>
      <span className="text-[9px] font-bold text-black bg-yellow-100 px-1.5 rounded mt-0.5">{label}</span>
      <span className="text-[9px] font-mono text-white bg-black/80 px-1.5 rounded">{cost} fichas</span>
    </button>
  );
}

import { Link } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

export function WalletBadge({ className = "" }: { className?: string }) {
  const { fichas, isLoading } = useWallet();
  return (
    <Link
      to="/loja"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 text-xs font-bold hover:bg-yellow-500/25 transition ${className}`}
    >
      <Coins className="w-3.5 h-3.5" />
      {isLoading ? "…" : fichas} <span className="font-mono text-[10px] opacity-70">fichas</span>
    </Link>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWallet } from "@/lib/wallet.functions";

export function useWallet() {
  const fn = useServerFn(getWallet);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["wallet"], queryFn: () => fn() });
  return {
    wallet: q.data,
    fichas: q.data?.fichas ?? 0,
    isLoading: q.isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  };
}

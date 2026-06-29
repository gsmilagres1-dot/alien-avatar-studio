import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { listMyUpgrades } from "@/lib/upgrades.functions";
import type { UpgradeKey } from "@/lib/upgrades";

export interface UpgradeStats {
  authenticated: boolean;
  levels: Record<UpgradeKey, number>;
  fichas: number;
  // Derived HUD values
  speedC: string;   // velocidade fração de c
  reactor: string;  // % reator
  shields: string;  // status escudo
  radar: string;    // naves detectadas
}

function buildStats(levels: Record<UpgradeKey, number>, fichas: number, authenticated: boolean): UpgradeStats {
  const speedFraction = Math.min(0.99, 0.42 + levels.speed * 0.1);
  const reactorPct = Math.min(100, 80 + levels.energy * 4);
  const shieldLabel = levels.shield >= 4 ? "MAX" : levels.shield >= 2 ? "OK+" : levels.shield >= 1 ? "OK" : "—";
  const radarNaves = 3 + levels.radar * 2;
  return {
    authenticated,
    levels,
    fichas,
    speedC: `${speedFraction.toFixed(2)} c`,
    reactor: `${reactorPct}%`,
    shields: shieldLabel,
    radar: `${radarNaves} nv`,
  };
}

const DEFAULT_LEVELS: Record<UpgradeKey, number> = { speed: 0, shield: 0, radar: 0, energy: 0, cargo: 0 };

export function useUpgradeStats(): UpgradeStats {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const upFn = useServerFn(listMyUpgrades);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (mounted) setAuthed(!!s?.user);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const q = useQuery({
    queryKey: ["upgrade-stats"],
    queryFn: () => upFn(),
    enabled: authed === true,
    staleTime: 30_000,
  });

  if (!authed || !q.data) return buildStats(DEFAULT_LEVELS, 0, !!authed);
  const levels = { ...DEFAULT_LEVELS };
  for (const u of q.data.upgrades) {
    if (u.upgrade_key in levels) {
      levels[u.upgrade_key as UpgradeKey] = u.level ?? 0;
    }
  }
  return buildStats(levels, q.data.fichas ?? 0, true);
}

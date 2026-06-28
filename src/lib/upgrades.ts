import { Gauge, Shield, Radar, Zap, Package } from "lucide-react";

export const UPGRADES = [
  { key: "speed",  label: "Velocidade", desc: "Reduz tempo entre destinos",  icon: Gauge,  color: "from-cyan-400 to-blue-700" },
  { key: "shield", label: "Escudo",     desc: "Protege em batalhas",          icon: Shield, color: "from-purple-500 to-fuchsia-700" },
  { key: "radar",  label: "Radar",      desc: "Detecta equipes próximas",     icon: Radar,  color: "from-amber-400 to-orange-600" },
  { key: "energy", label: "Reator",     desc: "Mais tentativas de quiz",      icon: Zap,    color: "from-emerald-400 to-green-700" },
  { key: "cargo",  label: "Carga",      desc: "Carrega mais fichas/selos",    icon: Package, color: "from-pink-400 to-rose-700" },
] as const;

export type UpgradeKey = (typeof UPGRADES)[number]["key"];
export const MAX_UPGRADE_LEVEL = 5;
export function upgradeCost(nextLevel: number) { return nextLevel * 50; }

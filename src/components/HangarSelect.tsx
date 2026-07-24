import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Coins, Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { SHIPS, RACES } from "@/lib/alien";
import {
  getHangarState, setHangarSelection, purchaseSkin, purchaseShip,
  EXTRA_SHIPS, RACE_SKINS, type ShipModel, type RaceSkin,
} from "@/lib/mining.functions";
import shipEsportiva from "@/assets/ship-esportiva.png";
import shipOffroad from "@/assets/ship-offroad.png";
import shipCorrida from "@/assets/ship-corrida.png";
import shipTeleportadora from "@/assets/teleporter-prize.png";
import raceStarseed from "@/assets/race-starseed.jpg";
import raceNordico from "@/assets/race-nordico.jpg";
import raceGrey from "@/assets/race-grey.jpg";
import raceReptiliano from "@/assets/race-reptiliano.jpg";
import raceDraconiano from "@/assets/race-draconiano.jpg";
import raceInsectoide from "@/assets/race-insectoide.jpg";
import raceAviario from "@/assets/race-aviario.jpg";
import raceAnunna

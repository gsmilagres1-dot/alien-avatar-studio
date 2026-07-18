import { Buffer } from "buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildAvatarPrompt, buildShipPrompt, getRace, type ShipId } from "@/lib/alien";
import shipEsportiva from "@/assets/ship-esportiva.jpg";
import shipOffroad from "@/assets/ship-offroad.jpg";
import shipCorrida from "@/assets/ship-corrida.jpg";
import shipTeleportadora from "@/assets/teleporter-prize.jpg";
import raceStarseed from "@/assets/race-starseed.jpg";
import raceNordico from "@/assets/race-nordico.jpg";
import raceGrey from "@/assets/race-grey.jpg";
import raceReptiliano from "@/assets/race-reptiliano.jpg";
import raceDraconiano from "@/assets/race-draconiano.jpg";
import raceInsectoide from "@/assets/race-insectoide.jpg";
import raceAviario from "@/assets/race-aviario.jpg";
import raceAnunnaki from "@/assets/race-anunnaki.jpg";
import raceSiriano from "@/assets/race-siriano.jpg";
import racePleiadiano from "@/assets/race-pleiadiano.jpg";
import raceLyriano from "@/assets/race-lyriano.jpg";
import raceKashyapa from "@/assets/race-kashyapa.jpg";

const GATEWAY_IMG = "https://ai.gateway.lovable.dev/v1/images/generations";

export const FALLBACK_SHIP_IMAGES = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
  teleportadora: shipTeleportadora,
} satisfies Record<ShipId, string>;

export const FALLBACK_RACE_IMAGES: Record<string, string> = {
  starseed: raceStarseed,
  nordico: raceNordico,
  grey: raceGrey,
  reptiliano: raceReptiliano,
  draconiano: raceDraconiano,
  insectoide: raceInsectoide,
  aviario: raceAviario,
  anunnaki: raceAnunnaki,
  siriano: raceSiriano,
  pleiadiano: racePleiadiano,
  lyriano: raceLyriano,
  kashyapa: raceKashyapa,
};

export async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function isAiImageUnavailable(message: string) {
  return (
    message === "Créditos de IA esgotados" ||
    message === "Muitos pedidos à IA — espere um momento" ||
    message === "IA não retornou imagem" ||
    message.startsWith("Falha na IA (")
  );
}

function bufferFromImageDataUrl(dataUrl: string): { bytes: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Imagem inválida");
  return { bytes: Buffer.from(match[2], "base64"), contentType: match[1] };
}

function bufferFromImageValue(value: string): Buffer | null {
  if (value.startsWith("data:image/")) return bufferFromImageDataUrl(value).bytes;
  if (/^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 200) return Buffer.from(value.replace(/\s/g, ""), "base64");
  return null;
}

function findImageValue(value: unknown, depth = 0): string | null {
  if (depth > 6 || value == null) return null;
  if (typeof value === "string") {
    if (value.startsWith("data:image/")) return value;
    const match = value.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    return match?.[0] ?? null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageValue(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["b64_json", "url", "image_url", "images", "content", "message", "choices", "data", "output"]) {
      const found = findImageValue(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function extractGeneratedImage(response: unknown): Buffer {
  const dataUrl = findImageValue(response);
  if (dataUrl) {
    const bytes = bufferFromImageValue(dataUrl);
    if (bytes) return bytes;
  }
  const data = (response as { data?: { b64_json?: string; url?: string }[] })?.data;
  const value = data?.[0]?.b64_json ?? data?.[0]?.url;
  if (value) {
    const bytes = bufferFromImageValue(value);
    if (bytes) return bytes;
  }
  throw new Error("IA não retornou imagem");
}

export async function generateImage(prompt: string, refImageDataUrl?: string): Promise<Buffer> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");

  const content: unknown[] = [{ type: "text", text: prompt }];
  if (refImageDataUrl) {
    content.push({ type: "image_url", image_url: { url: refImageDataUrl } });
  }

  const res = await fetch(GATEWAY_IMG, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Muitos pedidos à IA — espere um momento");
    if (res.status === 402) throw new Error("Créditos de IA esgotados");
    throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 200)}`);
  }
  const j = await res.json();
  return extractGeneratedImage(j);
}

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: string,
  bytes: Buffer,
  contentType = "image/png",
): Promise<string> {
  const path = `${userId}/${kind}-${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage
    .from("alien-avatars")
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(`Upload falhou: ${error.message}`);
  const { data } = supabase.storage.from("alien-avatars").getPublicUrl(path);
  return data.publicUrl;
}

export function storagePathFromPublicUrl(publicUrl: string) {
  const marker = "/storage/v1/object/public/alien-avatars/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export function buildAvatarPromptForRace(planetId: string, gender: "male" | "female" | "undefined", variant: number) {
  return buildAvatarPrompt({ race: getRace(planetId), gender, variant });
}

export function buildShipPromptForRace(category: ShipId, planetId: string) {
  return buildShipPrompt(category, getRace(planetId).origin);
                                    }

import { useEffect, useRef, useState } from "react";
import { Download, Facebook, Linkedin, Mail, MessageCircle, Send, Share2, Twitter, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PLAYSTORE_URL =
  (typeof window !== "undefined" && (window as any).__PLAYSTORE_URL__) ||
  "https://play.google.com/store/apps/details?id=app.identidadealien";

type Identity = {
  alien_name: string;
  species: string;
  id_number: string;
  avatar_url: string;
  ship_image_url?: string | null;
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderCard(identity: Identity): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0420");
  bg.addColorStop(0.5, "#1a0942");
  bg.addColorStop(1, "#040016");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Star dots
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Header
  ctx.fillStyle = "#7af0ff";
  ctx.font = "bold 36px Orbitron, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FEDERAÇÃO GALÁCTICA", W / 2, 90);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "22px JetBrains Mono, monospace";
  ctx.fillText("IDENTIDADE ALIENÍGENA OFICIAL", W / 2, 130);

  // Avatar
  try {
    const avatar = await loadImage(identity.avatar_url);
    const size = 620;
    const ax = (W - size) / 2;
    const ay = 180;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ax, ay, size, size, 36);
    ctx.clip();
    ctx.drawImage(avatar, ax, ay, size, size);
    ctx.restore();
    // border glow
    ctx.strokeStyle = "#7af0ff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#7af0ff";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.roundRect(ax, ay, size, size, 36);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch {
    // ignore avatar errors
  }

  // Ship overlay
  if (identity.ship_image_url) {
    try {
      const ship = await loadImage(identity.ship_image_url);
      const s = 180;
      const sx = W - s - 240;
      const sy = 180 + 620 - s + 40;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(sx, sy, s, s, 20);
      ctx.clip();
      ctx.drawImage(ship, sx, sy, s, s);
      ctx.restore();
      ctx.strokeStyle = "#ff66cc";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(sx, sy, s, s, 20);
      ctx.stroke();
    } catch {}
  }

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px Orbitron, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(identity.alien_name.toUpperCase(), W / 2, 900);

  // Species
  ctx.fillStyle = "#ff66cc";
  ctx.font = "30px Orbitron, system-ui, sans-serif";
  ctx.fillText(identity.species, W / 2, 950);

  // ID
  ctx.fillStyle = "#7af0ff";
  ctx.font = "26px JetBrains Mono, monospace";
  ctx.fillText(identity.id_number, W / 2, 1000);

  // CTA panel
  ctx.fillStyle = "rgba(122,240,255,0.12)";
  ctx.strokeStyle = "rgba(122,240,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, 1080, W - 120, 210, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Orbitron, system-ui, sans-serif";
  ctx.fillText("CRIE A SUA IDENTIDADE ALIEN", W / 2, 1145);
  ctx.fillStyle = "#7af0ff";
  ctx.font = "26px JetBrains Mono, monospace";
  ctx.fillText("Baixe grátis na Google Play", W / 2, 1190);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "22px JetBrains Mono, monospace";
  const short = PLAYSTORE_URL.replace(/^https?:\/\//, "");
  ctx.fillText(short, W / 2, 1240);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas fail"))), "image/png", 0.95),
  );
}

export function ShareProfileImage({ identity }: { identity: Identity }) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const builtFor = useRef<string>("");

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  async function ensureImage() {
    if (blob && builtFor.current === identity.id_number) return blob;
    setLoading(true);
    try {
      const b = await renderCard(identity);
      setBlob(b);
      if (url) URL.revokeObjectURL(url);
      const u = URL.createObjectURL(b);
      setUrl(u);
      builtFor.current = identity.id_number;
      return b;
    } finally {
      setLoading(false);
    }
  }

  async function openPanel() {
    setOpen(true);
    try { await ensureImage(); } catch { toast.error("Não consegui gerar a imagem"); }
  }

  async function nativeShare() {
    const b = await ensureImage();
    const file = new File([b], `${identity.alien_name}.png`, { type: "image/png" });
    const text = `Sou ${identity.alien_name} (${identity.species}). Crie sua identidade alien grátis!`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Identidade Alien", text, url: PLAYSTORE_URL });
        return;
      } catch {}
    }
    download();
    toast.info("Imagem baixada. Anexe no app que quiser.");
  }

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${identity.alien_name.replace(/\s+/g, "-")}.png`;
    a.click();
  }

  async function copyImage() {
    try {
      const b = await ensureImage();
      // @ts-ignore
      await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
      toast.success("Imagem copiada — cole no Instagram/Threads.");
    } catch {
      download();
      toast.info("Copie não suportado — baixei a imagem.");
    }
  }

  const text = `Sou ${identity.alien_name} (${identity.species}). Crie sua identidade alien grátis!`;
  const enc = encodeURIComponent;
  const shareUrl = PLAYSTORE_URL;
  const t = enc(text);
  const u = enc(shareUrl);

  const targets = [
    { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${t}%20${u}` },
    { label: "Threads", icon: Send, href: `https://www.threads.net/intent/post?text=${t}%20${u}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "E-mail", icon: Mail, href: `mailto:?subject=${enc("Minha identidade alien")}&body=${t}%20${u}` },
  ];

  return (
    <>
      <button
        onClick={openPanel}
        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
      >
        <Share2 className="w-3 h-3" /> Compartilhar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass rounded-2xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-gradient-neon">Compartilhar identidade</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground text-xs">Fechar</button>
            </div>

            <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-black/40 flex items-center justify-center mb-3">
              {loading && <Loader2 className="w-6 h-6 animate-spin text-accent" />}
              {!loading && url && <img src={url} alt="Cartão de identidade alien" className="w-full h-full object-contain" />}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={nativeShare} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-bold">
                <Share2 className="w-3.5 h-3.5" /> Compartilhar imagem
              </button>
              <button onClick={download} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass text-xs">
                <Download className="w-3.5 h-3.5" /> Baixar
              </button>
            </div>

            <button onClick={copyImage} className="w-full mb-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass text-xs">
              📋 Copiar imagem (Instagram / Threads)
            </button>

            <div className="grid grid-cols-3 gap-2">
              {targets.map((tg) => (
                <a
                  key={tg.label}
                  href={tg.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center gap-1 px-2 py-3 rounded-lg glass text-[11px] hover:border-accent"
                >
                  <tg.icon className="w-4 h-4 text-accent" />
                  {tg.label}
                </a>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              Instagram não aceita links externos — use “Copiar imagem” e cole no post/story.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

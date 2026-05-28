import { Facebook, Instagram, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

export function ShareButtons({ url, text }: { url: string; text: string }) {
  const enc = encodeURIComponent;
  const shareUrl = enc(url);
  const shareText = enc(text);

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Identidade Alien", text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copiado!");
    }
  }

  const links = [
    { i: Twitter, label: "X", href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}` },
    { i: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { i: Instagram, label: "Threads", href: `https://www.threads.net/intent/post?text=${shareText}%20${shareUrl}` },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button onClick={nativeShare} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-neon">
        <Share2 className="w-3.5 h-3.5" /> Compartilhar
      </button>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full glass text-xs hover:border-accent">
          <l.i className="w-3.5 h-3.5" /> {l.label}
        </a>
      ))}
    </div>
  );
}

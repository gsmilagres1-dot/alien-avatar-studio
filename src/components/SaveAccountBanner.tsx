import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { AuthState } from "@/router";

const DISMISS_KEY = "save-account-banner-dismissed-at";
const DISMISS_DAYS = 3;

export function SaveAccountBanner() {
  const router = useRouter();
  const auth = (router.options.context as { auth: AuthState }).auth;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) { setDismissed(false); return; }
      const at = Number(raw);
      const stale = Date.now() - at > DISMISS_DAYS * 24 * 60 * 60 * 1000;
      setDismissed(!stale);
    } catch {
      setDismissed(false);
    }
  }, [auth.userId]);

  if (auth.loading || !auth.isAuthenticated || !auth.isAnonymous || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-40 px-3 pt-2 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto flex items-center gap-2 rounded-lg glass border border-accent/40 px-3 py-2 shadow-card-alien">
        <Sparkles className="w-4 h-4 text-accent shrink-0" />
        <div className="flex-1 text-[11px] leading-tight text-foreground">
          Salve seu progresso — sem conta o histórico pode sumir ao trocar de navegador.
        </div>
        <Link
          to="/login"
          search={{ redirect: window.location.pathname }}
          className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-accent text-accent-foreground hover:brightness-110 whitespace-nowrap"
        >
          Salvar conta
        </Link>
        <button
          onClick={() => {
            try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
            setDismissed(true);
          }}
          className="p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dispensar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

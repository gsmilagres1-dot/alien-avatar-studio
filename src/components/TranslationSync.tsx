import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { syncPageTranslation } from "@/lib/translator";

/**
 * Re-runs page translation after every SPA route change so the new content
 * is rendered in the user's chosen language.
 */
export function TranslationSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Run shortly after the new route mounts, then again to catch async UI.
    const t1 = window.setTimeout(() => void syncPageTranslation(), 80);
    const t2 = window.setTimeout(() => void syncPageTranslation(), 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}

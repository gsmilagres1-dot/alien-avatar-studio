import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const PAGE_LANG = "pt";

function readCurrentLang(): string {
  if (typeof document === "undefined") return PAGE_LANG;
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m?.[1] ?? PAGE_LANG;
}

function ensureLoaded() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.display = "none";
    document.body.appendChild(div);
  }
  if (!document.getElementById("gt-style-override")) {
    const style = document.createElement("style");
    style.id = "gt-style-override";
    style.textContent = `
      .goog-te-banner-frame.skiptranslate, .goog-te-gadget { display: none !important; }
      body { top: 0 !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);
  }
  const w = window as unknown as {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement?: new (opts: object, el: string) => void } };
  };
  if (!w.googleTranslateElementInit) {
    w.googleTranslateElementInit = () => {
      const TE = w.google?.translate?.TranslateElement;
      if (TE) new TE({ pageLanguage: PAGE_LANG, autoDisplay: false }, "google_translate_element");
    };
  }
  if (!document.querySelector('script[data-gt-loader="1"]')) {
    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    s.dataset.gtLoader = "1";
    document.body.appendChild(s);
  }
}

function applyTranslation(lang: string, attempts = 0) {
  if (lang === PAGE_LANG) return;
  const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (!select) {
    if (attempts < 20) {
      window.setTimeout(() => applyTranslation(lang, attempts + 1), 250);
    }
    return;
  }
  if (select.value !== lang) {
    select.value = lang;
  }
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Re-triggers Google Translate after SPA route changes so the newly rendered
 * page content gets translated into the active language.
 */
export function TranslationSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureLoaded();
    const lang = readCurrentLang();
    if (lang === PAGE_LANG) return;
    // Wait a tick so the new route content is in the DOM, then nudge GT.
    const t1 = window.setTimeout(() => applyTranslation(lang), 50);
    const t2 = window.setTimeout(() => applyTranslation(lang), 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}

import { useEffect, useRef, useState } from "react";
import { Languages, Check, Search } from "lucide-react";

// Lista completa dos idiomas suportados pelo Google Tradutor
const LANGUAGES: { code: string; label: string }[] = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "中文 (简体)" },
  { code: "zh-TW", label: "中文 (繁體)" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "el", label: "Ελληνικά" },
  { code: "he", label: "עברית" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "fil", label: "Filipino" },
  { code: "uk", label: "Українська" },
  { code: "ro", label: "Română" },
  { code: "cs", label: "Čeština" },
  { code: "sk", label: "Slovenčina" },
  { code: "hu", label: "Magyar" },
  { code: "bg", label: "Български" },
  { code: "hr", label: "Hrvatski" },
  { code: "sr", label: "Српски" },
  { code: "ca", label: "Català" },
  { code: "gl", label: "Galego" },
  { code: "eu", label: "Euskara" },
  { code: "af", label: "Afrikaans" },
  { code: "sw", label: "Kiswahili" },
  { code: "fa", label: "فارسی" },
  { code: "ur", label: "اردو" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "ne", label: "नेपाली" },
  { code: "si", label: "සිංහල" },
  { code: "lt", label: "Lietuvių" },
  { code: "lv", label: "Latviešu" },
  { code: "et", label: "Eesti" },
  { code: "sl", label: "Slovenščina" },
  { code: "is", label: "Íslenska" },
  { code: "ga", label: "Gaeilge" },
  { code: "cy", label: "Cymraeg" },
  { code: "mt", label: "Malti" },
  { code: "sq", label: "Shqip" },
  { code: "mk", label: "Македонски" },
  { code: "bs", label: "Bosanski" },
  { code: "hy", label: "Հայերեն" },
  { code: "az", label: "Azərbaycan" },
  { code: "ka", label: "ქართული" },
  { code: "kk", label: "Қазақ тілі" },
  { code: "uz", label: "Oʻzbek" },
  { code: "mn", label: "Монгол" },
  { code: "my", label: "မြန်မာ" },
  { code: "km", label: "ភាសាខ្មែរ" },
  { code: "lo", label: "ລາວ" },
  { code: "am", label: "አማርኛ" },
  { code: "yo", label: "Yorùbá" },
  { code: "zu", label: "isiZulu" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
  { code: "so", label: "Soomaali" },
  { code: "eo", label: "Esperanto" },
  { code: "la", label: "Latina" },
];

const COOKIE_NAME = "googtrans";
const PAGE_LANG = "pt";

function setCookie(name: string, value: string) {
  // Set on current host + parent domain (Google Translate needs this)
  document.cookie = `${name}=${value};path=/`;
  const host = window.location.hostname;
  if (host.includes(".")) {
    const parent = host.replace(/^[^.]+\./, ".");
    document.cookie = `${name}=${value};path=/;domain=${parent}`;
  }
}

function readCurrentLang(): string {
  if (typeof document === "undefined") return PAGE_LANG;
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m?.[1] ?? PAGE_LANG;
}

function ensureGoogleTranslateLoaded() {
  if (typeof window === "undefined") return;
  // Hidden mount point
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.display = "none";
    document.body.appendChild(div);
  }
  // Hide the Google top banner
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

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [current, setCurrent] = useState<string>(PAGE_LANG);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureGoogleTranslateLoaded();
    setCurrent(readCurrentLang());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const pick = (code: string) => {
    setCookie(COOKIE_NAME, `/${PAGE_LANG}/${code}`);
    setCurrent(code);
    setOpen(false);
    // Reload to let Google Translate re-apply across the whole page
    window.location.reload();
  };

  const filtered = LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(filter.toLowerCase()) || l.code.includes(filter.toLowerCase())
  );

  const label = LANGUAGES.find((l) => l.code === current)?.label ?? "Idioma";

  return (
    <div className="relative notranslate" translate="no" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-accent/10"
            : "inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-2 text-xs"
        }
      >
        <Languages className={compact ? "w-3.5 h-3.5" : "w-4 h-4 text-accent"} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl backdrop-blur z-50 flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar idioma…"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>
          <div className="overflow-y-auto p-1">
            {filtered.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => pick(option.code)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${current === option.code ? "bg-accent/10 text-accent" : "hover:bg-accent/5"}`}
              >
                <span>{option.label}</span>
                {current === option.code && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">Nada encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

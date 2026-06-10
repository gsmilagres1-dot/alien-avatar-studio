// Lightweight client-side translator that walks the DOM and replaces text
// nodes using Google Translate's free public endpoint (no API key).
// Originals are stashed in a WeakMap so switching back to PT restores them.

const SOURCE_LANG = "pt";
const ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const CACHE_PREFIX = "tr:v1:";

const originals = new WeakMap<Text, string>();
let currentRun = 0;

function getLang(): string {
  if (typeof localStorage === "undefined") return SOURCE_LANG;
  return localStorage.getItem("app_lang") || SOURCE_LANG;
}

export function setLang(lang: string) {
  localStorage.setItem("app_lang", lang);
}

function cacheKey(target: string, text: string) {
  return `${CACHE_PREFIX}${target}:${text}`;
}

function readCache(target: string, text: string): string | null {
  try {
    return localStorage.getItem(cacheKey(target, text));
  } catch {
    return null;
  }
}

function writeCache(target: string, text: string, value: string) {
  try {
    localStorage.setItem(cacheKey(target, text), value);
  } catch {
    /* quota — ignore */
  }
}

async function translateOne(text: string, target: string): Promise<string> {
  const cached = readCache(target, text);
  if (cached !== null) return cached;
  const url = `${ENDPOINT}?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate ${res.status}`);
  const data = (await res.json()) as Array<Array<[string, string]>>;
  const out = (data?.[0] ?? []).map((seg) => seg?.[0] ?? "").join("");
  if (out) writeCache(target, text, out);
  return out || text;
}

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SVG", "PATH", "CANVAS",
]);

function isSkippable(node: Node): boolean {
  let el: Node | null = node.parentNode;
  while (el && el.nodeType === 1) {
    const e = el as Element;
    if (SKIP_TAGS.has(e.tagName)) return true;
    if (e.classList?.contains("notranslate")) return true;
    if ((e as HTMLElement).getAttribute?.("translate") === "no") return true;
    el = e.parentNode;
  }
  return false;
}

function collectTextNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const text = n.nodeValue ?? "";
      if (!text.trim()) return NodeFilter.FILTER_REJECT;
      if (isSkippable(n)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let cur: Node | null;
  while ((cur = walker.nextNode())) out.push(cur as Text);
  return out;
}

async function applyTranslations(target: string, runId: number) {
  const nodes = collectTextNodes(document.body);
  // Process in small batches to keep UI responsive.
  for (let i = 0; i < nodes.length; i += 8) {
    if (runId !== currentRun) return;
    const slice = nodes.slice(i, i + 8);
    await Promise.all(
      slice.map(async (node) => {
        const original = originals.get(node) ?? node.nodeValue ?? "";
        if (!originals.has(node)) originals.set(node, original);
        const trimmed = original.trim();
        if (!trimmed) return;
        try {
          const translated = await translateOne(trimmed, target);
          if (runId !== currentRun) return;
          // Preserve surrounding whitespace.
          const leading = original.match(/^\s*/)?.[0] ?? "";
          const trailing = original.match(/\s*$/)?.[0] ?? "";
          node.nodeValue = `${leading}${translated}${trailing}`;
        } catch {
          /* ignore single-node failures */
        }
      })
    );
  }
}

function restoreOriginals() {
  const nodes = collectTextNodes(document.body);
  for (const node of nodes) {
    const orig = originals.get(node);
    if (orig != null) node.nodeValue = orig;
  }
}

/** Re-translate the entire visible page into the active language. */
export async function syncPageTranslation() {
  if (typeof document === "undefined") return;
  const target = getLang();
  const runId = ++currentRun;
  if (target === SOURCE_LANG) {
    restoreOriginals();
    return;
  }
  // Defer to next frame so the new route content is in the DOM.
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await applyTranslations(target, runId);
}

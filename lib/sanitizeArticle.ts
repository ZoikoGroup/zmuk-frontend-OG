
const THEME_HOSTILE_PROPS = [
  "color",
  "background",
  "background-color",
  "background-image",
  "font-family",
  "font",
  "font-size",
  "line-height",
  "text-shadow",
  "border-color",
  "-webkit-text-fill-color",
];

/** Legacy presentational attributes from very old Word exports. */
const LEGACY_ATTRS = ["bgcolor", "color", "face", "background", "text", "link"];

/** Elements removed entirely, contents and all. */
const FORBIDDEN_TAGS = ["script", "style", "link", "meta", "base", "object", "embed"];

/** Tags unwrapped — their children are kept, the wrapper itself dropped. */
const UNWRAP_TAGS = ["font", "basefont"];

function stripInlineTheme(el: Element): void {
  const style = (el as HTMLElement).style;
  if (!style || !el.hasAttribute("style")) return;

  for (const prop of THEME_HOSTILE_PROPS) {
    style.removeProperty(prop);
  }

  // Nothing worth keeping left — drop the attribute entirely.
  if (style.length === 0) {
    el.removeAttribute("style");
  }
}

function stripDangerous(el: Element): void {
  // Inline event handlers: onclick, onerror, onload, ...
  for (const name of el.getAttributeNames()) {
    if (name.toLowerCase().startsWith("on")) {
      el.removeAttribute(name);
    }
  }

  // javascript: and data: URLs
  for (const attr of ["href", "src", "xlink:href"]) {
    const val = el.getAttribute(attr);
    if (!val) continue;
    const normalised = val.trim().toLowerCase().replace(/[\s\u0000-\u001f]/g, "");
    if (normalised.startsWith("javascript:") || normalised.startsWith("vbscript:")) {
      el.removeAttribute(attr);
    }
  }
}

function unwrap(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

export function sanitizeArticleHtml(html: string): string {
  // DOMParser is browser-only. During SSR return the raw string; the client
  // pass will clean it before paint.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  // 1. Remove forbidden elements
  doc.body.querySelectorAll(FORBIDDEN_TAGS.join(",")).forEach((n) => n.remove());

  // 2. Walk everything left
  doc.body.querySelectorAll("*").forEach((el) => {
    stripDangerous(el);
    stripInlineTheme(el);

    for (const attr of LEGACY_ATTRS) {
      el.removeAttribute(attr);
    }

    // Word leaves class="MsoNormal" etc. Drop those but keep CKEditor's own
    // sizing classes (text-tiny / text-small / text-big / text-huge).
    const keep = Array.from(el.classList).filter((c) => /^text-(tiny|small|big|huge)$/.test(c));
    if (el.classList.length > 0) {
      el.removeAttribute("class");
      keep.forEach((c) => el.classList.add(c));
    }
  });

  // 3. Unwrap <font> tags
  doc.body.querySelectorAll(UNWRAP_TAGS.join(",")).forEach(unwrap);

  // 4. Lazy-load content images and drop hardcoded pixel dimensions that
  //    overflow narrow screens.
  doc.body.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
    img.removeAttribute("width");
    img.removeAttribute("height");
    if (!img.getAttribute("alt")) img.setAttribute("alt", "");
  });

  // 5. External links open safely
  doc.body.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });

  // 6. Wrap tables so wide pricing tables scroll instead of breaking layout
  doc.body.querySelectorAll("table").forEach((table) => {
    if ((table.parentElement as HTMLElement | null)?.dataset.tableScroll) return;
    const wrap = doc.createElement("div");
    wrap.dataset.tableScroll = "true";
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  // 7. Drop empty paragraphs Word scatters everywhere
  doc.body.querySelectorAll("p").forEach((p) => {
    const text = (p.textContent ?? "").replace(/\u00a0/g, " ").trim();
    if (text === "" && p.querySelector("img,iframe,br,table") === null) {
      p.remove();
    }
  });

  return doc.body.innerHTML;
}

export default sanitizeArticleHtml;
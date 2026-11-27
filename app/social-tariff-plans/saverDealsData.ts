// Zoiko Saver Deals: catalogue and helpers.
// Source: saver-deals.html wireframe v4.0 (19 November 2026).
// Prices are in pence and are SAMPLE values until the tariff register is signed off.

export type Term = "12m" | "30d";
export type Kind = "sim" | "bb" | "ph" | "bun";

/** One Saver plan as shown on the page, built from a backend plan (GET /api/plans/v1/). */
export interface UiPlan {
  id: string; // backend slug
  backendId: number;
  kind: Kind;
  name: string;
  headline: string; // "10GB", "Up to 30 Mbps", "1,000 minutes"
  headlineUnit: string; // "data", "", "minutes"
  subs?: { mins: string; texts: string }; // SIM allowances, when the description has them
  price: Record<Term, number | null>; // pence
  setup: number | null; // one-off installation, pence
  bullets: string[];
  includes: string[]; // bundles: the services in the package
  raw: BackendPlan; // full backend plan, passed to the cart
}

export const TERM: Record<Term, { l: string; long: string }> = {
  "12m": { l: "12-month plan", long: "12-month minimum term" },
  "30d": { l: "30-day plan", long: "30-day rolling plan" },
};

export const HELP_PHONE_DISPLAY = "020 7164 6399";
export const HELP_PHONE_TEL = "+442071646399";

// ── helpers ─────────────────────────────────────────────────────────────────

export const gbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ── Backend plans ───────────────────────────────────────────────────────────
// The Saver plans live in the normal plans API. Their categories are mixed (the bundles are filed
// under "digital-phone-lines"), so those are told apart by name.

export interface BackendPlan {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: string;
  price_12: string | null;
  price_24: string | null;
  price_30: string | null;
  data_allowance: string | null;
  is_popular?: boolean;
  features: { title: string }[];
  category: { slug: string } | null;
}

const SAVER_CATEGORIES = ["sim-only-plans", "super-fast-broadband", "digital-phone-lines", "zoiko-combo-deals"];

const pence = (v: string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

/** Description lines: the backend sends one feature per line (sometimes with a features list). */
function descLines(p: BackendPlan): string[] {
  const fromList = (p.features ?? []).map((f) => f.title.trim()).filter(Boolean);
  if (fromList.length) return fromList;
  return (p.short_description ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const isHeading = (l: string) => /^(additional features|includes)\b:?$/i.test(l.replace(/:$/, "").trim()) || /^(additional features|includes):?$/i.test(l);
const isInstall = (l: string) => /^installation cost/i.test(l);
const installFee = (lines: string[]): number | null => {
  const l = lines.find(isInstall);
  const m = l?.match(/(\d+(?:\.\d+)?)\s*$/);
  return m ? pence(m[1]) : null;
};

const SPEEDS: Record<string, number> = { basic: 30, plus: 60 };

function classify(p: BackendPlan): Kind | null {
  // Same idea as the old Saver page: the backend category decides the section.
  // Bundles are filed under "digital-phone-lines" on the live backend, so those are picked out by name.
  const slug = p.category?.slug;
  if (slug === "zoiko-combo-deals") return "bun";
  if (slug === "super-fast-broadband") return "bb";
  if (slug === "digital-phone-lines") return /combo|complete/i.test(p.name) ? "bun" : "ph";
  if (slug === "sim-only-plans") return "sim";
  return null;
}

export function toUiPlan(p: BackendPlan): UiPlan | null {
  const kind = classify(p);
  if (!kind) return null;
  const lines = descLines(p);
  const base = pence(p.price);
  const p12 = pence(p.price_12) ?? base;
  const p30 = pence(p.price_30) ?? base;
  const out: UiPlan = {
    id: p.slug,
    backendId: p.id,
    kind,
    name: p.name.replace(/^zoiko\s+/i, ""),
    headline: "",
    headlineUnit: "",
    price: { "12m": p12, "30d": p30 },
    setup: installFee(lines),
    bullets: [],
    includes: [],
    raw: p,
  };

  if (kind === "sim") {
    const mins = lines.find((l) => /minutes/i.test(l));
    const texts = lines.find((l) => /texts/i.test(l));
    const num = (l?: string) => (l?.match(/^(unlimited|[\d,]+)/i)?.[1] ?? "");
    out.headline = p.data_allowance ?? "";
    out.headlineUnit = "data";
    if (mins && texts) out.subs = { mins: cap(num(mins)), texts: cap(num(texts)) };
    out.bullets = lines.filter((l) => !isHeading(l) && !isInstall(l) && l !== mins && l !== texts);
    return out;
  }

  if (kind === "bb") {
    const text = `${p.name} ${lines.join(" ")}`;
    const m = text.match(/(\d+)\s*mbps/i);
    const tier = Object.keys(SPEEDS).find((k) => p.name.toLowerCase().includes(k));
    const speed = m ? Number(m[1]) : tier ? SPEEDS[tier] : null; // speed isn't in the API: fall back by tier
    out.headline = speed ? `Up to ${speed}` : (p.data_allowance ?? "");
    out.headlineUnit = speed ? "Mbps" : "data";
    out.bullets = lines.filter((l) => !isHeading(l) && !isInstall(l));
    return out;
  }

  if (kind === "ph") {
    const first = lines.find((l) => /minutes/i.test(l));
    const m = first?.match(/^([\d,]+)/);
    out.headline = m ? Number(m[1].replace(/,/g, "")).toLocaleString("en-GB") : "";
    out.headlineUnit = "minutes";
    out.bullets = lines.filter((l) => l !== first && !isHeading(l) && !isInstall(l));
    return out;
  }

  // bundle: "Includes:" lists the services, "Additional Features:" the extras
  const inc: string[] = [];
  const extra: string[] = [];
  let section: "inc" | "extra" | "" = "";
  for (const l of lines) {
    if (/^includes:?$/i.test(l)) section = "inc";
    else if (/^additional features:?$/i.test(l)) section = "extra";
    else if (isInstall(l)) continue;
    else if (section === "inc") inc.push(l);
    else extra.push(l);
  }
  out.includes = inc;
  out.bullets = extra;
  return out;
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

export async function loadSaverPlans(): Promise<UiPlan[]> {
  const res = await fetch(`${API_BASE}/api/plans/v1/`);
  if (!res.ok) throw new Error("Failed to load plans");
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return (data as BackendPlan[])
    .filter((p) => p.category && SAVER_CATEGORIES.includes(p.category.slug))
    .map(toUiPlan)
    .filter((x): x is UiPlan => !!x)
    .sort((a, b) => (a.price["12m"] ?? 0) - (b.price["12m"] ?? 0));
}

"use client";

// All available devices (Figma design). Everything on the cards and in the filters comes from the
// products API (/api/products/). Nothing here is invented: if the API doesn't send something
// (stock, battery, 5G, eSIM) it isn't shown. "View options" opens the product page and the
// cart / checkout work exactly as before.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Heart,
  Headphones,
  LayoutGrid,
  List as ListIcon,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Truck,
  X,
  Layers,
  FileText,
  Sparkles,
  Leaf,
} from "lucide-react";
import { CopyEmailButton, supportGmailHref } from "../components/EmailSupport";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const LIST_URL = `${API_BASE}/api/products/`;

// ── API shape: GET /api/products/  (ProductListSerializer) ──
interface AttrGroup {
  name: string;
  values: string[];
}
interface Category {
  id: number;
  name: string;
  slug: string;
}
interface Product {
  id: number;
  name: string;
  slug: string;
  category: Category | null;
  brand: string;
  price_min: string | number | null;
  price_max: string | number | null;
  primary_image: string | null;
  is_featured: boolean;
  attributes: AttrGroup[];
}

// Colour names to swatch colours (unknown names get a neutral grey)
const COLOUR_HEX: Record<string, string> = {
  gold: "#d4af37", green: "#1f6b4f", grey: "#9ca3af", gray: "#9ca3af", silver: "#e5e7eb",
  black: "#1f2937", white: "#ffffff", blue: "#3b82f6", red: "#ef4444", pink: "#f9a8d4",
  purple: "#8b5cf6", yellow: "#eab308", obsidian: "#1f2937", midnight: "#0f172a", starlight: "#f1e7d6",
  graphite: "#4b5563", "sierra blue": "#9ec5e8", "space grey": "#6b7280", "space gray": "#6b7280",
};
const hexFor = (name: string) => COLOUR_HEX[name.toLowerCase()] ?? "#9ca3af";

function attrValues(p: Product, ...names: string[]): string[] {
  const wanted = names.map((n) => n.toLowerCase());
  const g = p.attributes?.find((a) => wanted.includes(a.name.toLowerCase()));
  return g?.values ?? [];
}
const uniqCI = (list: string[]) => {
  const seen = new Set<string>();
  return list.filter((v) => {
    const k = v.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
const prettyStorage = (v: string) => v.replace(/\s+/g, "").replace(/(\d+)\s*(gb|tb)/i, (_m, n, u) => `${n} ${String(u).toUpperCase()}`);
const storageGb = (v: string) => {
  const m = v.replace(/\s+/g, "").match(/(\d+(?:\.\d+)?)(gb|tb)/i);
  if (!m) return 0;
  return Number(m[1]) * (m[2].toLowerCase() === "tb" ? 1024 : 1);
};
const prettyCondition = (v: string) => v.replace(/\s*[-–]\s*/, " – ");
const conditionGrade = (v: string) => (v.match(/^[A-Za-z]\d/)?.[0] ?? v).toUpperCase();
const isRefurb = (p: Product) =>
  attrValues(p, "Condition").some((c) => /^[a-z]\d|refurb|flawless|excellent|good/i.test(c)) ||
  /refurb/i.test(p.category?.name ?? "");
const isNewCondition = (p: Product) => !isRefurb(p) && attrValues(p, "Condition").some((c) => /new/i.test(c));
const priceOf = (p: Product) => Number(p.price_min ?? 0);

type Tab = { type: "all" | "refurb" | "category" | "brand"; value: string };
type Sort = "recommended" | "price-asc" | "price-desc" | "name";
const SORTS: { value: Sort; label: string }[] = [
  { value: "recommended", label: "Sort by: Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];
const PAGE_SIZE = 9;
const WISHLIST_KEY = "zoiko_device_wishlist";

// ── Small UI pieces (module level) ──

function CheckGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (options.length === 0) return null;
  return (
    <div className="border-t border-gray-100 dark:border-gray-700 py-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-sm font-bold text-[#0D1935] dark:text-white cursor-pointer">
        <span>
          {title} ({options.length})
        </span>
        <ChevronDown className={`w-4 h-4 transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2.5">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} className="w-4 h-4 rounded accent-[#E01C5B]" />
              <span>
                {o.label} ({o.count})
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceCard({
  d,
  list,
  wished,
  compared,
  onWish,
  onCompare,
  onQuick,
}: {
  d: Product;
  list: boolean;
  wished: boolean;
  compared: boolean;
  onWish: () => void;
  onCompare: () => void;
  onQuick: () => void;
}) {
  const conditions = uniqCI(attrValues(d, "Condition"));
  const colours = uniqCI(attrValues(d, "Color", "Colour"));
  const storages = uniqCI(attrValues(d, "Storage")).sort((a, b) => storageGb(a) - storageGb(b));
  const topStorage = storages.length ? prettyStorage(storages[storages.length - 1]) : "";
  const refurb = isRefurb(d);
  const isNew = isNewCondition(d);
  const sub = refurb
    ? `Refurbished${conditions.length ? ` · ${conditions.map(conditionGrade).join(" / ")} options` : ""}`
    : isNew
      ? "New"
      : d.brand;

  return (
    <div className={`relative rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 flex ${list ? "flex-row gap-5 items-center" : "flex-col"}`}>
      {(refurb || isNew) && (
        <span className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white ${refurb ? "bg-emerald-600" : "bg-[#1D2B6B]"}`}>
          {refurb ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {refurb ? "Refurbished" : "New"}
        </span>
      )}
      <button
        type="button"
        onClick={onWish}
        aria-label={wished ? "Remove from saved devices" : "Save device"}
        aria-pressed={wished}
        className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center cursor-pointer"
      >
        <Heart className={`w-4 h-4 ${wished ? "fill-[#E01C5B] text-[#E01C5B]" : "text-[#E01C5B]"}`} />
      </button>

      <div className={`flex items-center justify-center ${list ? "h-36 w-36 shrink-0" : "h-44 mb-4 mt-4"}`}>
        {d.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.primary_image} alt={d.name} loading="lazy" className="h-full w-auto object-contain" />
        ) : (
          <div className="h-full w-28 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="text-sm font-bold text-[#0D1935] dark:text-white">{d.name}</h3>
        <p className="text-xs text-gray-500">{sub}</p>
        <p className="mt-2 text-xs text-gray-500">
          <span className="font-semibold text-[#E01C5B]">From</span>
        </p>
        <p className="text-2xl font-extrabold text-[#E01C5B] leading-none">£{priceOf(d).toFixed(2)}</p>
        <p className="mt-1 text-[11px] text-gray-400">Handset price (SIM plan optional)</p>

        {topStorage && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
            <Smartphone className="w-4 h-4 text-gray-400" />
            <span>Up to {topStorage}</span>
          </div>
        )}

        {colours.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
            <span>Available colours:</span>
            <span className="flex gap-1.5">
              {colours.slice(0, 5).map((c) => (
                <span key={c} title={c} className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: hexFor(c) }} />
              ))}
            </span>
          </div>
        )}

        <Link
          href={`/product/${d.slug}`}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E01C5B] hover:bg-[#c8164f] text-white text-sm font-bold py-2.5 transition"
        >
          View options <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={compared} onChange={onCompare} className="w-4 h-4 rounded accent-[#E01C5B]" />
            Compare
          </label>
          <button type="button" onClick={onQuick} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-[#E01C5B]">
            <Eye className="w-4 h-4" /> Quick view
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-white dark:bg-gray-800 rounded-3xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto p-6 shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0D1935] dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DevicesList({ variant = "all" }: { variant?: "all" | "refurbished" }) {
  const refurbPage = variant === "refurbished";
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // The refurbished page only lists refurbished phones; every filter and count is built from that set.
  const products = useMemo(() => (refurbPage ? allProducts.filter(isRefurb) : allProducts), [allProducts, refurbPage]);
  const [heroQuery, setHeroQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>({ type: "all", value: "" });
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [storages, setStorages] = useState<string[]>([]);
  const [colours, setColours] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [quick, setQuick] = useState<Product | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      let all: Product[] = [];
      let url: string | null = LIST_URL;
      while (url) {
        const res: Response = await fetch(url);
        if (!res.ok) throw new Error("We couldn't load the devices. Please try again.");
        const data: { results?: Product[]; next?: string | null } = await res.json();
        if (Array.isArray(data)) {
          all = data as unknown as Product[];
          break;
        }
        all = all.concat(data.results ?? []);
        url = data.next ?? null;
      }
      setAllProducts(all);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load the devices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // Saved devices live in this browser
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(WISHLIST_KEY);
        if (raw) setWishlist(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const toggleWish = (id: number) =>
    setWishlist((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  const toggleCompare = (id: number) => setCompare((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id]));

  // ── Options built from the data ──
  const priceBounds = useMemo(() => {
    const prices = products.map(priceOf).filter((n) => n > 0);
    if (prices.length === 0) return { lo: 0, hi: 1000 };
    return { lo: Math.floor(Math.min(...prices)), hi: Math.ceil(Math.max(...prices)) };
  }, [products]);
  const lo = minPrice ?? priceBounds.lo;
  const hi = maxPrice ?? priceBounds.hi;

  const count = (pick: (p: Product) => string[]) => {
    const map = new Map<string, { label: string; count: number }>();
    products.forEach((p) =>
      uniqCI(pick(p)).forEach((v) => {
        const k = v.toLowerCase();
        const cur = map.get(k);
        map.set(k, { label: cur?.label ?? v, count: (cur?.count ?? 0) + 1 });
      })
    );
    return Array.from(map.entries()).map(([value, x]) => ({ value, label: x.label, count: x.count }));
  };
  const brandOpts = useMemo(
    () =>
      count((p) => (p.brand ? [p.brand] : [])).sort((a, b) => b.count - a.count),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products]
  );
  const conditionOpts = useMemo(
    () =>
      count((p) => attrValues(p, "Condition"))
        .map((o) => ({ ...o, label: prettyCondition(o.label) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products]
  );
  const storageOpts = useMemo(
    () =>
      count((p) => attrValues(p, "Storage"))
        .map((o) => ({ ...o, label: prettyStorage(o.label) }))
        .sort((a, b) => storageGb(a.label) - storageGb(b.label)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products]
  );
  const colourOpts = useMemo(
    () => count((p) => attrValues(p, "Color", "Colour")).sort((a, b) => b.count - a.count),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products]
  );
  const categoryOpts = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    products.forEach((p) => {
      if (!p.category) return;
      const cur = map.get(p.category.slug);
      map.set(p.category.slug, { name: p.category.name, count: (cur?.count ?? 0) + 1 });
    });
    return Array.from(map.entries()).map(([slug, x]) => ({ slug, ...x }));
  }, [products]);
  const refurbCount = useMemo(() => products.filter(isRefurb).length, [products]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (tab.type === "refurb" && !isRefurb(p)) return false;
      if (tab.type === "category" && p.category?.slug !== tab.value) return false;
      if (tab.type === "brand" && (p.brand || "").toLowerCase() !== tab.value) return false;
      if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q)) return false;
      if (brands.length && !brands.includes((p.brand || "").toLowerCase())) return false;
      if (conditions.length && !attrValues(p, "Condition").some((v) => conditions.includes(v.toLowerCase()))) return false;
      if (storages.length && !attrValues(p, "Storage").some((v) => storages.includes(v.toLowerCase()))) return false;
      if (colours.length && !attrValues(p, "Color", "Colour").some((v) => colours.includes(v.toLowerCase()))) return false;
      const price = priceOf(p);
      if (price < lo || price > hi) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return list;
  }, [products, tab, query, brands, conditions, storages, colours, lo, hi, sort]);

  const shown = filtered.slice(0, visible);
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => {
    setter((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
    setVisible(PAGE_SIZE);
  };
  const clearAll = () => {
    setTab({ type: "all", value: "" });
    setQuery("");
    setBrands([]);
    setConditions([]);
    setStorages([]);
    setColours([]);
    setMinPrice(null);
    setMaxPrice(null);
    setVisible(PAGE_SIZE);
  };
  const pickTab = (t: Tab) => {
    setTab(t);
    setVisible(PAGE_SIZE);
  };
  const scrollToList = () => document.getElementById("device-list")?.scrollIntoView({ behavior: "smooth" });
  const openChat = () => window.dispatchEvent(new Event("zoiko-open-chat"));

  const tabs: { t: Tab; label: string; sub: string; icon: React.ReactNode; href?: string }[] = [
    refurbPage
      ? { t: { type: "all", value: "link" }, label: "All devices", sub: String(allProducts.length), icon: <LayoutGrid className="w-5 h-5" />, href: "/devices" }
      : { t: { type: "all", value: "" }, label: "All devices", sub: String(products.length), icon: <LayoutGrid className="w-5 h-5" /> },
    ...(refurbPage
      ? [{ t: { type: "all", value: "" } as Tab, label: "Refurbished smartphones", sub: String(products.length), icon: <RefreshCw className="w-5 h-5" /> }]
      : refurbCount > 0
        ? [{ t: { type: "refurb", value: "" } as Tab, label: "Refurbished smartphones", sub: String(refurbCount), icon: <RefreshCw className="w-5 h-5" /> }]
        : []),
    ...categoryOpts.map((c) => ({ t: { type: "category", value: c.slug } as Tab, label: c.name, sub: `(All models) · ${c.count}`, icon: <Smartphone className="w-5 h-5" /> })),
    ...brandOpts.slice(0, 3).map((b) => ({ t: { type: "brand", value: b.value } as Tab, label: b.label, sub: `${b.count}`, icon: <span className="w-5 h-5 rounded bg-[#0D1935] text-white text-[11px] font-bold flex items-center justify-center">{b.label.charAt(0)}</span> })),
  ];

  const compareItems = products.filter((p) => compare.includes(p.id));

  const filterPanel = (
    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-[#0D1935] dark:text-white mb-3">
        <SlidersHorizontal className="w-4 h-4" /> {refurbPage ? `Filter phones (${products.length})` : "Filter devices"}
      </div>
      <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden mb-3">
        <Search className="w-4 h-4 text-gray-400 ml-3" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Search brand or model"
          aria-label="Search brand or model"
          className="flex-1 px-2.5 py-2 text-sm bg-transparent outline-none text-[#0D1935] dark:text-white"
        />
        <span className="px-3 py-2 text-xs font-bold text-[#E01C5B] bg-[#E01C5B]/10">Go</span>
      </div>

      <CheckGroup title="Brand" options={brandOpts} selected={brands} onToggle={toggleIn(setBrands)} />
      <CheckGroup title="Condition" options={conditionOpts} selected={conditions} onToggle={toggleIn(setConditions)} />

      <div className="border-t border-gray-100 dark:border-gray-700 py-4">
        <div className="text-sm font-bold text-[#0D1935] dark:text-white">Price range</div>
        <div className="mt-2 text-xs font-semibold text-[#E01C5B]">
          £{lo} – £{hi}
        </div>
        <input
          type="range"
          min={priceBounds.lo}
          max={priceBounds.hi}
          value={lo}
          aria-label="Minimum price"
          onChange={(e) => {
            setMinPrice(Math.min(Number(e.target.value), hi));
            setVisible(PAGE_SIZE);
          }}
          className="w-full accent-[#E01C5B]"
        />
        <input
          type="range"
          min={priceBounds.lo}
          max={priceBounds.hi}
          value={hi}
          aria-label="Maximum price"
          onChange={(e) => {
            setMaxPrice(Math.max(Number(e.target.value), lo));
            setVisible(PAGE_SIZE);
          }}
          className="w-full accent-[#E01C5B]"
        />
        <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-gray-500">
          <label>
            Min £
            <input
              type="number"
              value={lo}
              min={priceBounds.lo}
              max={hi}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value) || 0, hi))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 text-sm bg-transparent text-[#0D1935] dark:text-white"
            />
          </label>
          <label>
            Max £
            <input
              type="number"
              value={hi}
              min={lo}
              max={priceBounds.hi}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value) || 0, lo))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 text-sm bg-transparent text-[#0D1935] dark:text-white"
            />
          </label>
        </div>
      </div>

      <CheckGroup title="Storage" options={storageOpts} selected={storages} onToggle={toggleIn(setStorages)} />

      {colourOpts.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 py-4">
          <div className="text-sm font-bold text-[#0D1935] dark:text-white mb-3">Colour</div>
          <div className="flex flex-wrap gap-3">
            {colourOpts.map((c) => {
              const on = colours.includes(c.value);
              return (
                <button key={c.value} type="button" onClick={() => toggleIn(setColours)(c.value)} aria-pressed={on} className="flex flex-col items-center gap-1 cursor-pointer">
                  <span className={`w-7 h-7 rounded-full border ${on ? "ring-2 ring-offset-2 ring-[#E01C5B]" : "border-gray-200"}`} style={{ backgroundColor: hexFor(c.label) }} />
                  <span className="text-[10px] text-gray-500">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button type="button" onClick={clearAll} className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#E01C5B] text-[#E01C5B] hover:bg-[#E01C5B]/5 text-sm font-bold py-2.5 cursor-pointer">
        <RefreshCw className="w-4 h-4" /> Clear all filters
      </button>
    </div>
  );

  return (
    <div className="bg-[#F6F7FB] dark:bg-gray-900 dark:text-white">
      {/* Hero */}
      {refurbPage ? (
        <section className="relative overflow-hidden bg-gradient-to-r from-[#E01C5B] via-[#B0155A] to-[#0B5D3E]">
          <div className="max-w-6xl mx-auto px-5 sm:px-7 py-10 grid grid-cols-1 md:grid-cols-[1.2fr_1fr_0.6fr] gap-6 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.05] tracking-tight">Refurbished Smartphones</h1>
              <p className="mt-3 text-base text-white/95">Premium phones, great value and a more sustainable choice.</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-white">
                {["Professionally checked", "A1 & A2 graded", "Warranty terms on every phone", "UK delivery"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(heroQuery);
                  setVisible(PAGE_SIZE);
                  scrollToList();
                }}
                className="mt-5 flex items-center rounded-full bg-white p-1.5 shadow-lg max-w-xl"
              >
                <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                <input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Search by brand, model or feature (e.g. iPhone 13, 128 GB)"
                  aria-label="Search refurbished phones"
                  className="flex-1 min-w-0 px-3 py-2 text-sm text-[#0D1935] bg-transparent outline-none"
                />
                <button type="submit" className="rounded-full bg-[#E01C5B] hover:bg-[#c8164f] text-white text-sm font-bold px-6 py-2.5 cursor-pointer">
                  Search
                </button>
              </form>
            </div>
            <div className="hidden md:flex justify-center">
              <Image src="/images/refurbished image.png" alt="Refurbished smartphones" width={360} height={250} priority className="w-full max-w-[360px] h-auto" />
            </div>
            <div className="hidden md:flex flex-col items-center text-center text-white gap-3">
              <span className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf className="w-7 h-7" />
              </span>
              <span className="text-sm font-semibold max-w-[150px]">A smarter, more sustainable choice</span>
            </div>
          </div>
        </section>
      ) : (
      <section className="relative overflow-hidden bg-gradient-to-r from-[#E01C5B] via-[#B0155A] to-[#0B5D3E]">
        <div className="max-w-6xl mx-auto px-5 sm:px-7 py-10 grid grid-cols-1 md:grid-cols-[1.1fr_1fr_0.7fr] gap-6 items-center">
          <div>
            <p className="text-xs font-semibold text-white/80">Phones &amp; Devices</p>
            <h1 className="mt-1 text-4xl sm:text-5xl font-extrabold text-white leading-[1.05] tracking-tight">All Available Devices</h1>
            <p className="mt-3 text-sm text-white/90 max-w-md">
              Discover refurbished smartphones, explore our device range and find the right match for you with a flexible Zoiko SIM plan.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={scrollToList} className="inline-flex items-center gap-2 rounded-full bg-white text-[#E01C5B] text-sm font-bold px-5 py-2.5 cursor-pointer">
                <Smartphone className="w-4 h-4" /> Explore devices
              </button>
              <button
                type="button"
                onClick={() => {
                  pickTab({ type: "refurb", value: "" });
                  scrollToList();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 text-white text-sm font-bold px-5 py-2.5 hover:bg-white/10 cursor-pointer"
              >
                Shop refurbished <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <Image src="/images/device-section-1 phone.png" alt="Refurbished smartphones" width={340} height={270} priority className="w-full max-w-[340px] h-auto" />
          </div>
          <ul className="hidden md:flex flex-col gap-3 text-sm font-semibold text-white">
            {["Clear prices", "Graded condition", "Flexible 30-day plans", "Help when you need it"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* Trust strip */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-5 sm:px-7 py-4 grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: <ShieldCheck className="w-6 h-6" />, t: "Professionally checked", s: "Thoroughly tested and verified" },
            { icon: <Layers className="w-6 h-6" />, t: "A1 & A2 graded", s: "Clear, fair condition standards" },
            { icon: <FileText className="w-6 h-6" />, t: "Warranty cover", s: "See warranty terms", href: "/terms-and-conditions" },
            { icon: <Truck className="w-6 h-6" />, t: "UK delivery", s: "See delivery options", href: "/free-delivery" },
            { icon: <RefreshCw className="w-6 h-6" />, t: "Returns", s: "Read our returns policy", href: "/return-policy" },
          ].map((i) => (
            <div key={i.t} className="flex items-center gap-3">
              <span className="text-[#E01C5B]">{i.icon}</span>
              <div>
                <div className="text-xs font-bold text-[#0D1935] dark:text-white">{i.t}</div>
                {i.href ? (
                  <Link href={i.href} className="text-[11px] font-semibold text-[#E01C5B] underline">
                    {i.s}
                  </Link>
                ) : (
                  <div className="text-[11px] text-gray-500">{i.s}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-7 py-8">
        {/* Category tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2" role="tablist" aria-label="Device categories">
          {tabs.map((x) => {
            const on = tab.type === x.t.type && tab.value === x.t.value;
            if (x.href) {
              return (
                <Link
                  key={`${x.t.type}-${x.t.value}`}
                  href={x.href}
                  className="shrink-0 flex items-center gap-3 rounded-xl border px-4 py-3 text-left bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#0D1935] dark:text-white"
                >
                  {x.icon}
                  <span>
                    <span className="block text-sm font-bold leading-tight">{x.label}</span>
                    <span className="block text-[11px] text-gray-500">{x.sub}</span>
                  </span>
                </Link>
              );
            }
            return (
              <button
                key={`${x.t.type}-${x.t.value}`}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pickTab(x.t)}
                className={`shrink-0 flex items-center gap-3 rounded-xl border px-4 py-3 text-left cursor-pointer ${
                  on ? "bg-[#0B3D2E] text-white border-[#0B3D2E]" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#0D1935] dark:text-white"
                }`}
              >
                {x.icon}
                <span>
                  <span className="block text-sm font-bold leading-tight">{x.label}</span>
                  <span className={`block text-[11px] ${on ? "text-white/70" : "text-gray-500"}`}>{x.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="device-list" className="mt-6 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start">
          {/* Filters */}
          <div className="hidden lg:block">{filterPanel}</div>
          <div className="lg:hidden">
            <button type="button" onClick={() => setFiltersOpen(true)} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-[#0D1935] cursor-pointer">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            {filtersOpen && (
              <Modal title="Filters" onClose={() => setFiltersOpen(false)}>
                {filterPanel}
                <button type="button" onClick={() => setFiltersOpen(false)} className="mt-4 w-full rounded-full bg-[#E01C5B] text-white text-sm font-bold py-2.5 cursor-pointer">
                  Show {filtered.length} devices
                </button>
              </Modal>
            )}
          </div>

          {/* Results */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0D1935] dark:text-white">{refurbPage ? "Find your next phone" : "Explore our devices"}</h2>
                <p className="text-xs text-gray-500">{filtered.length} {refurbPage ? "phones" : "devices"} found</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs font-bold">
                  <button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"} className={`inline-flex items-center gap-1.5 px-3 py-2 cursor-pointer ${view === "grid" ? "bg-[#E01C5B] text-white" : "bg-white dark:bg-gray-800 text-gray-600"}`}>
                    <LayoutGrid className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`inline-flex items-center gap-1.5 px-3 py-2 cursor-pointer ${view === "list" ? "bg-[#E01C5B] text-white" : "bg-white dark:bg-gray-800 text-gray-600"}`}>
                    <ListIcon className="w-3.5 h-3.5" /> List
                  </button>
                </div>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as Sort);
                    setVisible(PAGE_SIZE);
                  }}
                  aria-label="Sort devices"
                  className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-[#0D1935] dark:text-white"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-96 rounded-2xl bg-white/70 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 flex items-center justify-between gap-3">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      load();
                    }}
                    className="rounded-full bg-red-600 text-white text-xs font-bold px-4 py-2 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-10 text-center">
                  <p className="text-sm font-bold text-[#0D1935] dark:text-white">{products.length === 0 ? "No devices available yet." : "No devices match your filters."}</p>
                  {products.length > 0 && (
                    <button type="button" onClick={clearAll} className="mt-3 rounded-full bg-[#E01C5B] text-white text-xs font-bold px-5 py-2 cursor-pointer">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch" : "flex flex-col gap-4"}>
                  {shown.map((d) => (
                    <DeviceCard
                      key={d.id}
                      d={d}
                      list={view === "list"}
                      wished={wishlist.includes(d.id)}
                      compared={compare.includes(d.id)}
                      onWish={() => toggleWish(d.id)}
                      onCompare={() => toggleCompare(d.id)}
                      onQuick={() => setQuick(d)}
                    />
                  ))}
                </div>
              )}
            </div>

            {!loading && !error && filtered.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Showing {shown.length} of {filtered.length} {refurbPage ? "phones" : "devices"}
                </p>
                {shown.length < filtered.length && (
                  <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#E01C5B] text-[#E01C5B] hover:bg-[#E01C5B]/5 text-sm font-bold px-6 py-2.5 cursor-pointer">
                    Show more {refurbPage ? "phones" : "devices"} <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Condition grades */}
        <section className="mt-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr_auto] gap-4 items-center">
          <div className="border-l-4 border-[#E01C5B] pl-4">
            <div className="text-base font-extrabold text-[#E01C5B]">Our condition grades</div>
            <div className="text-xs text-gray-500">Choose the condition that suits you.</div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-[#0D1935]">A1 – Flawless</div>
              <div className="text-xs text-gray-600">Minimal visible cosmetic wear, such as very light signs of previous use.</div>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-[#0D1935]">A2 – Excellent</div>
              <div className="text-xs text-gray-600">Light cosmetic wear, such as minor marks from normal use.</div>
            </div>
          </div>
          <Link href="/return-policy" className="text-xs font-bold text-[#E01C5B] underline inline-flex items-center gap-1">
            View full grading guide <ArrowRight className="w-3 h-3" />
          </Link>
        </section>

        {/* How it works */}
        <section className="mt-5 rounded-2xl bg-[#FDF2F6] border border-[#F9C6D7]/60 p-5 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-start">
          <div className="border-l-4 border-[#E01C5B] pl-4">
            <div className="text-base font-extrabold text-[#E01C5B]">How it works</div>
            <div className="text-xs text-gray-500">Get your refurbished phone in four simple steps.</div>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Choose your phone", "Select the model, storage, colour and condition."],
              ["Add a SIM plan (optional)", "Keep your current plan or choose a flexible 30-day plan."],
              ["Review your order", "See the handset price, any SIM plan cost and delivery details."],
              ["Secure checkout", "Confirm your details and pay securely."],
            ].map(([t, s], i) => (
              <li key={t} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-[#E01C5B] text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div>
                  <div className="text-sm font-bold text-[#0D1935]">{t}</div>
                  <div className="text-xs text-gray-600">{s}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Need a hand */}
        <section className="mt-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 grid grid-cols-1 lg:grid-cols-4 gap-5 items-center">
          <div className="flex items-center gap-3">
            <Headphones className="w-8 h-8 text-[#E01C5B]" />
            <div>
              <div className="text-base font-extrabold text-[#E01C5B]">Need a hand?</div>
              <div className="text-xs text-gray-500">Our UK-based support team is here to help.</div>
            </div>
          </div>
          <button type="button" onClick={openChat} className="flex items-center gap-3 text-left cursor-pointer">
            <MessageCircle className="w-5 h-5 text-[#E01C5B]" />
            <span>
              <span className="block text-sm font-bold text-[#0D1935] dark:text-white">Chat with Zovie</span>
              <span className="block text-xs text-gray-500">Virtual assistant · human help in staffed hours</span>
            </span>
          </button>
          <a href="tel:03330040333" className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#E01C5B]" />
            <span>
              <span className="block text-sm font-bold text-[#0D1935] dark:text-white">Call us</span>
              <span className="block text-xs font-semibold text-[#E01C5B] underline">0333 004 0333</span>
              <span className="block text-xs text-gray-500">Mon–Fri, 8am–8pm | Sat–Sun, 9am–6pm</span>
            </span>
          </a>
          {/* PREVIOUS: <a href="mailto:help@zoikomobile.co.uk"> (does nothing without a mail app) */}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#E01C5B]" />
            <span>
              <a href={supportGmailHref()} target="_blank" rel="noopener noreferrer" className="block">
                <span className="block text-sm font-bold text-[#0D1935] dark:text-white">Email us</span>
                <span className="block text-xs font-semibold text-[#E01C5B] underline">help@zoikomobile.co.uk</span>
              </a>
              <CopyEmailButton className="mt-1" />
            </span>
          </div>
        </section>
      </div>

      {/* Compare bar */}
      {compare.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full bg-[#0D1935] text-white shadow-xl px-5 py-3 flex items-center gap-4 text-sm">
          <span>{compare.length} selected (max 3)</span>
          <button type="button" onClick={() => setCompareOpen(true)} disabled={compare.length < 2} className="rounded-full bg-[#E01C5B] disabled:opacity-50 px-4 py-1.5 text-xs font-bold cursor-pointer">
            Compare
          </button>
          <button type="button" onClick={() => setCompare([])} className="text-xs text-white/70 hover:text-white cursor-pointer">
            Clear
          </button>
        </div>
      )}

      {compareOpen && (
        <Modal title="Compare devices" onClose={() => setCompareOpen(false)} wide>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2" />
                  {compareItems.map((p) => (
                    <th key={p.id} className="p-2 text-left align-bottom">
                      <div className="font-bold text-[#0D1935]">{p.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Brand", (p: Product) => p.brand || "—"],
                    ["From", (p: Product) => `£${priceOf(p).toFixed(2)}`],
                    ["Condition", (p: Product) => uniqCI(attrValues(p, "Condition")).map(prettyCondition).join(", ") || "—"],
                    ["Storage", (p: Product) => uniqCI(attrValues(p, "Storage")).map(prettyStorage).join(", ") || "—"],
                    ["Colours", (p: Product) => uniqCI(attrValues(p, "Color", "Colour")).join(", ") || "—"],
                  ] as [string, (p: Product) => string][]
                ).map(([k, fn]) => (
                  <tr key={k} className="border-t border-gray-100">
                    <td className="p-2 text-gray-500">{k}</td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="p-2 font-semibold text-[#0D1935]">
                        {fn(p)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-gray-100">
                  <td />
                  {compareItems.map((p) => (
                    <td key={p.id} className="p-2">
                      <Link href={`/product/${p.slug}`} className="inline-flex items-center gap-1 rounded-full bg-[#E01C5B] text-white text-xs font-bold px-4 py-2">
                        View options
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {quick && (
        <Modal title={quick.name} onClose={() => setQuick(null)}>
          <div className="flex justify-center h-44 mb-4">
            {quick.primary_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quick.primary_image} alt={quick.name} className="h-full w-auto object-contain" />
            )}
          </div>
          <p className="text-xs text-gray-500">{quick.brand}</p>
          <p className="text-2xl font-extrabold text-[#E01C5B]">From £{priceOf(quick).toFixed(2)}</p>
          <dl className="mt-3 text-sm">
            {(
              [
                ["Condition", uniqCI(attrValues(quick, "Condition")).map(prettyCondition).join(", ")],
                ["Storage", uniqCI(attrValues(quick, "Storage")).map(prettyStorage).join(", ")],
                ["Colours", uniqCI(attrValues(quick, "Color", "Colour")).join(", ")],
              ] as [string, string][]
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2 border-t border-gray-100">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-semibold text-[#0D1935] text-right">{v}</dd>
                </div>
              ))}
          </dl>
          <Link href={`/product/${quick.slug}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01C5B] text-white text-sm font-bold py-2.5">
            View options <ArrowRight className="w-4 h-4" />
          </Link>
        </Modal>
      )}
    </div>
  );
}

export default DevicesList;
export { DevicesList };

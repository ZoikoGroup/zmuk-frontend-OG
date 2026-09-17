"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const LIST_URL = `${API_BASE}/api/products/`;

// ── API shape: GET /api/products/  (ProductListSerializer) ──
interface AttrGroup { name: string; values: string[]; }
interface Category { id: number; name: string; slug: string; }
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

// Map colour names to swatch hex (extend as needed)
const COLOUR_HEX: Record<string, string> = {
  gold: "#d4af37", green: "#1f6b4f", grey: "#9ca3af", gray: "#9ca3af",
  silver: "#e5e7eb", black: "#1f2937", white: "#ffffff", blue: "#3b82f6",
  red: "#ef4444", pink: "#ec4899", purple: "#8b5cf6", yellow: "#eab308",
};
const hexFor = (name: string) => COLOUR_HEX[name.toLowerCase()] ?? "#9ca3af";

// Pull values for an attribute group by (loose) name match
function attrValues(p: Product, ...names: string[]): string[] {
  const wanted = names.map((n) => n.toLowerCase());
  const g = p.attributes?.find((a) => wanted.includes(a.name.toLowerCase()));
  return g?.values ?? [];
}

const PAGE_SIZE = 6;
type Sort = "default" | "price-asc" | "price-desc" | "name";
const SORTS: { value: Sort; label: string }[] = [
  { value: "default", label: "Default sorting" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

function DeviceCard({ d }: { d: Product }) {
  const conditions = attrValues(d, "Condition");
  const colours = attrValues(d, "Color", "Colour");
  const storages = attrValues(d, "Storage");
  const from = Number(d.price_min ?? 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex h-44 items-center justify-center">
        {d.primary_image
          ? <img src={d.primary_image} alt={d.name} className="h-full w-auto object-contain" />
          : <div className="h-full w-32 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700" />}
      </div>

      <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">{d.name}</h3>

      <p className="text-xs text-gray-400">Starting from:</p>
      <p className="mb-4 text-2xl font-extrabold text-[#e6007e]">£{from.toFixed(2)}</p>

      {conditions.length > 0 && (
        <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
          <p className="text-xs text-gray-400">Device condition:</p>
          <p className="text-sm font-semibold text-green-600">{conditions.join(", ")}</p>
        </div>
      )}

      {colours.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Available colours:</span>
          <div className="flex gap-1.5">
            {colours.map((c) => (
              <span key={c} title={c} className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: hexFor(c) }} />
            ))}
          </div>
        </div>
      )}

      {storages.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Internal storage:</span>
          <span className="text-right text-sm font-medium text-gray-700 dark:text-gray-200">{storages.join(" | ")}</span>
        </div>
      )}

      <Link
        href={`/product/${d.slug}`}
        className="mt-auto block w-full rounded-md border border-green-600 py-2.5 text-center text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700"
      >
        View Details
      </Link>
    </div>
  );
}

function DevicesList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("default");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(LIST_URL);
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        // supports array OR paginated { results: [...] }
        setProducts(Array.isArray(data) ? data : data.results ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => Number(a.price_min ?? 0) - Number(b.price_min ?? 0));
    else if (sort === "price-desc") list.sort((a, b) => Number(b.price_min ?? 0) - Number(a.price_min ?? 0));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Grab &amp; Go Smartphones with 30-Day Flexi SIM Plans</h1>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing <span className="font-bold text-green-600">{pageItems.length} Products</span> out of{" "}
            <span className="font-bold">{products.length}</span>
          </p>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as Sort); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status"><span className="sr-only">Loading...</span></div>
          </div>
        ) : error ? (
          <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
        ) : pageItems.length === 0 ? (
          <p className="text-center text-gray-500">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((d) => <DeviceCard key={d.id} d={d} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">&#8249;</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => setPage(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${page === n ? "bg-teal-600 text-white" : "border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>{n}</button>
            ))}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Next</button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">&#8250;</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DevicesList;
export { DevicesList };
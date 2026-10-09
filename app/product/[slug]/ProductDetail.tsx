"use client";

import React, { useEffect, useMemo, useState } from "react";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";





// ── API shape: GET /api/products/<slug>/  (ProductDetailSerializer) ──
interface ImageT { id: number; image: string; alt_text: string; is_primary: boolean; order: number; }
interface VariantT {
  id: number;
  sku: string;
  price: string | number;
  stock: number;
  in_stock: boolean;
  is_active: boolean;
  image: number | null;
  attributes_dict: Record<string, string>; // { "Condition": "A1-Flawless", "Color": "Gold", "Storage": "64GB" }
}
interface AttrOption { name: string; slug: string; options: string[]; }
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  brand: string;
  price_min: string | number | null;
  images: ImageT[];
  variants: VariantT[];
  attribute_options: AttrOption[];
}

// MEDIA urls may come back relative ("/media/..") -> prefix with API_BASE
const absUrl = (u: string) => (u && u.startsWith("/") ? `${API_BASE}${u}` : u);

function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImg, setActiveImg] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) {
      setError("Product not found");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${slug}/`);
        if (!res.ok) throw new Error("Product not found");
        setProduct(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Product not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.is_active),
    [product]
  );

  // Set sensible defaults once loaded: first in-stock option per attribute
  useEffect(() => {
    if (!product) return;
    const init: Record<string, string> = {};
    for (const opt of product.attribute_options) {
      const firstSelectable = opt.options.find((val) =>
        activeVariants.some((v) => v.attributes_dict[opt.name] === val)
      );
      if (firstSelectable) init[opt.name] = firstSelectable;
    }
    setSelected(init);
  }, [product, activeVariants]);

  // Is this option value available, given the OTHER current selections?
  const optionAvailable = (attrName: string, value: string) =>
    activeVariants.some(
      (v) =>
        v.attributes_dict[attrName] === value &&
        Object.entries(selected).every(
          ([k, val]) => k === attrName || !val || v.attributes_dict[k] === val
        )
    );

  // The variant(s) that exactly match all selected attributes.
  // If duplicates exist for the same combo, prefer one that is in stock.
  const matched = useMemo(() => {
    if (!product) return null;
    const names = product.attribute_options.map((o) => o.name);
    if (names.some((n) => !selected[n])) return null; // not all chosen
    const matches = activeVariants.filter((v) =>
      names.every((n) => v.attributes_dict[n] === selected[n])
    );
    // prefer an in-stock variant; fall back to the first match
    return matches.find((v) => v.in_stock || Number(v.stock) > 0) ?? matches[0] ?? null;
  }, [product, activeVariants, selected]);

  // Treat stock > 0 as the source of truth (don't rely solely on the in_stock flag)
  const inStock = !!matched && (matched.in_stock || Number(matched.stock) > 0);
  const price = matched ? Number(matched.price) : null;
  const canAdd = inStock;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status"><span className="sr-only">Loading...</span></div>
      </div>
    );
  }
  if (error || !product) return <p className="py-20 text-center text-gray-500">{error ?? "Product not found."}</p>;

  const chip = (active: boolean, disabled = false) =>
    `rounded-md border px-4 py-1.5 text-sm font-medium transition-colors ${
      disabled
        ? "cursor-not-allowed border-gray-200 text-gray-300 line-through dark:border-gray-700 dark:text-gray-600"
        : active
          ? "border-gray-800 bg-gray-800 text-white dark:border-white dark:bg-white dark:text-gray-900"
          : "border-gray-300 text-gray-700 hover:border-gray-500 dark:border-gray-600 dark:text-gray-200"
    }`;

  const images = product.images ?? [];
  const mainSrc = images[activeImg] ? absUrl(images[activeImg].image) : "";

  const addToCart = () => {
  if (!matched || !product) return;

  const item = {
    id: matched.id,
    slug: product.slug,
    name: product.name,
    image: images[0] ? absUrl(images[0].image) : null,
    price: Number(matched.price),
    qty,
    type: "product",
    attributes: matched.attributes_dict,
  };

  const existing = JSON.parse(localStorage.getItem("cart") || "[]");

  // If same variant already exists, increase quantity
  const index = existing.findIndex(
    (x: any) => x.id === item.id && x.type === "product"
  );

  if (index >= 0) {
    existing[index].qty += qty;
  } else {
    existing.push(item);
  }

  localStorage.setItem("cart", JSON.stringify(existing));

  window.dispatchEvent(new Event("zoiko-cart"));

  alert("Added to cart!");
};


  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">

        {/* Gallery */}
        <div className="flex gap-4">
          {images.length > 1 && (
            <div className="flex flex-col gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-green-600" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <img src={absUrl(img.image)} alt={img.alt_text || `${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
            {mainSrc
              ? <img src={mainSrc} alt={product.name} className="max-h-[420px] w-auto object-contain" />
              : <div className="h-72 w-full rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700" />}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white">{product.name}</h1>

          {/* Dynamic attribute groups (Condition, Colour, Storage, ...) */}
          {product.attribute_options.map((opt) => (
            <div key={opt.name} className="mb-5">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                {opt.name} : <span className="font-semibold text-gray-900 dark:text-white">{selected[opt.name] ?? "—"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {opt.options.map((val) => {
                  const available = optionAvailable(opt.name, val);
                  const active = selected[opt.name] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={!available && !active}
                      onClick={() => available && setSelected((s) => ({ ...s, [opt.name]: val }))}
                      className={chip(active, !available && !active)}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setSelected({})} className="mb-6 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600">
            Clear
          </button>

          <div className="mb-6 border-t border-gray-100 pt-6 dark:border-gray-700">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {price !== null ? `£${price.toFixed(2)}` : "Select options"}
            </p>
            {matched && !inStock && (
              <p className="mt-1 text-sm font-medium text-red-500">Out of stock</p>
            )}
          </div>

          {/* Qty + add to cart */}
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-md border border-gray-300 px-3 py-2 text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
  onClick={addToCart}
  disabled={!canAdd}
              className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
export { ProductDetail };
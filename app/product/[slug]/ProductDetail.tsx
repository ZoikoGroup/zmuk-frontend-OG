"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import DeviceRecommendations, { rememberViewedDevice } from "./DeviceRecommendations";

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

// Colour swatches for the Colour option chips (same palette as the devices list)
const COLOUR_HEX: Record<string, string> = {
  gold: "#d4af37", green: "#1f6b4f", grey: "#9ca3af", gray: "#9ca3af",
  silver: "#e5e7eb", black: "#1f2937", white: "#ffffff", blue: "#3b82f6",
  red: "#ef4444", pink: "#ec4899", purple: "#8b5cf6", yellow: "#eab308",
  midnight: "#1e293b", starlight: "#f5f0e6",
};
const isColourAttr = (name: string) => /^colou?r$/i.test(name.trim());
const hexFor = (name: string) => COLOUR_HEX[name.toLowerCase().trim()];

function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImg, setActiveImg] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart: addItemToCart } = useCart();

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
        setActiveImg(0); // reset gallery when moving to another device
        setQty(1);
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

  // Remember this device for the "Recently viewed" row
  useEffect(() => {
    if (!product) return;
    const primary = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
    rememberViewedDevice({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: primary ? absUrl(primary.image) : "",
      priceFrom: product.price_min != null ? Number(product.price_min) : null,
    });
  }, [product]);

  // Hide the "added" confirmation after a few seconds
  useEffect(() => {
    if (!justAdded) return;
    const id = window.setTimeout(() => setJustAdded(false), 4000);
    return () => window.clearTimeout(id);
  }, [justAdded]);

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

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#FFF5FA] to-white">
        <div className="mx-auto grid max-w-6xl animate-pulse gap-10 px-4 py-12 lg:grid-cols-2" role="status">
          <span className="sr-only">Loading...</span>
          <div className="aspect-square rounded-3xl bg-gray-100" />
          <div className="space-y-5">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-10 w-2/3 rounded bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-12 w-1/2 rounded-xl bg-gray-100" />
            <div className="h-14 rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !product) {
    return (
      <div className="flex flex-col items-center px-4 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e6007e]/10 text-[#e6007e]">
          <Smartphone className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-gray-900">We couldn&rsquo;t find that device</h1>
        <p className="mt-2 text-gray-500">{error ?? "Product not found."}</p>
        <Link
          href="/devices"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e6007e] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#C4006B]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to all devices
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const mainSrc = images[activeImg] ? absUrl(images[activeImg].image) : "";
  const prevImg = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % images.length);

  const safeQty = Math.max(1, Math.floor(qty) || 1);
  const total = price !== null ? price * safeQty : null;
  const lowStock = inStock && matched && Number(matched.stock) > 0 && Number(matched.stock) <= 5;

  const addToCart = () => {
    if (!matched || !product) return;

    // Go through CartContext (never write localStorage directly) so the cart,
    // header badge and checkout all stay in sync. Adding the same variant again
    // increases its quantity, because the cartKey is the variant id.
    addItemToCart({
      cartKey: `product-${matched.id}`,
      id: matched.id,
      type: "product",
      name: product.name,
      slug: product.slug,
      image: images[0] ? absUrl(images[0].image) : "",
      price: Number(matched.price),
      quantity: safeQty,
      metadata: {
        productId: product.id,
        brand: product.brand,
        sku: matched.sku,
        attributes: matched.attributes_dict,
      },
    });

    setJustAdded(true);
  };

  const ctaLabel = !matched ? "Select your options" : !inStock ? "Out of stock" : "Add to cart";

  return (
    <div className="bg-gradient-to-b from-[#FFF5FA] via-white to-white pb-28 text-gray-900 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="transition hover:text-[#e6007e]">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/devices" className="transition hover:text-[#e6007e]">Devices</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-semibold text-gray-800">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ── Gallery ── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-pink-100 bg-white p-8 shadow-[0_20px_60px_rgba(230,0,126,0.08)]">
              <div className="pointer-events-none absolute inset-x-10 bottom-6 h-10 rounded-full bg-[#e6007e]/10 blur-2xl" />
              {mainSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={mainSrc}
                  src={mainSrc}
                  alt={images[activeImg]?.alt_text || product.name}
                  className="relative max-h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Smartphone className="h-24 w-24 text-gray-200" />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImg}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-700 shadow-md ring-1 ring-gray-100 transition hover:bg-white hover:text-[#e6007e] sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImg}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-700 shadow-md ring-1 ring-gray-100 transition hover:bg-white hover:text-[#e6007e] sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-gray-900/70 px-2.5 py-1 text-xs font-semibold text-white">
                    {activeImg + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={activeImg === i}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white p-1.5 transition ${
                      activeImg === i
                        ? "border-[#e6007e] shadow-[0_6px_16px_rgba(230,0,126,0.25)]"
                        : "border-gray-100 opacity-70 hover:border-pink-200 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={absUrl(img.image)} alt={img.alt_text || `${product.name} ${i + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div>
            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e6007e]">{product.brand}</p>
            )}
            <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="text-4xl font-black text-gray-900">
                {price !== null ? `£${price.toFixed(2)}` : product.price_min ? (
                  <>
                    <span className="mr-1 text-base font-semibold text-gray-500">From</span>£{Number(product.price_min).toFixed(2)}
                  </>
                ) : (
                  "—"
                )}
              </p>
              {matched ? (
                inStock ? (
                  <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {lowStock ? `Only ${matched.stock} left` : "In stock"}
                  </span>
                ) : (
                  <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-200">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Out of stock
                  </span>
                )
              ) : (
                <span className="mb-1.5 text-xs font-semibold text-gray-500">Choose all options to see the price</span>
              )}
            </div>

            {/* Options */}
            <div className="mt-6 space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              {product.attribute_options.map((opt) => {
                const colour = isColourAttr(opt.name);
                return (
                  <fieldset key={opt.name}>
                    <legend className="mb-2.5 flex w-full items-center justify-between text-sm">
                      <span className="font-bold text-gray-900">{opt.name}</span>
                      <span className="font-semibold text-[#e6007e]">{selected[opt.name] ?? "Select"}</span>
                    </legend>
                    <div className="flex flex-wrap gap-2.5">
                      {opt.options.map((val) => {
                        const available = optionAvailable(opt.name, val);
                        const active = selected[opt.name] === val;
                        const disabled = !available && !active;
                        const swatch = colour ? hexFor(val) : undefined;
                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={disabled}
                            aria-pressed={active}
                            onClick={() => available && setSelected((s) => ({ ...s, [opt.name]: val }))}
                            className={`relative inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                              disabled
                                ? "cursor-not-allowed border-dashed border-gray-200 bg-gray-50 text-gray-300 line-through"
                                : active
                                  ? "border-[#e6007e] bg-[#FFF0F8] text-[#C4006B] shadow-[0_6px_16px_rgba(230,0,126,0.18)]"
                                  : "border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-[#e6007e]/50 hover:shadow-sm"
                            }`}
                          >
                            {colour && (
                              <span
                                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                                style={{ backgroundColor: swatch ?? "#d1d5db" }}
                              />
                            )}
                            {val}
                            {active && (
                              <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#e6007e] text-white shadow">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}

              {Object.keys(selected).length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected({})}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-[#e6007e]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset selections
                </button>
              )}
            </div>

            {/* Quantity + Add to cart */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-14 items-center justify-between rounded-xl border-2 border-gray-200 bg-white sm:w-40">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={safeQty <= 1}
                  aria-label="Decrease quantity"
                  className="grid h-full w-12 place-items-center text-gray-600 transition hover:text-[#e6007e] disabled:text-gray-300"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  aria-label="Quantity"
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center text-base font-bold text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="grid h-full w-12 place-items-center text-gray-600 transition hover:text-[#e6007e]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={addToCart}
                disabled={!canAdd}
                className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e6007e] to-[#A3157A] px-6 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(230,0,126,0.35)] transition hover:scale-[1.01] hover:shadow-[0_16px_34px_rgba(230,0,126,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:hover:scale-100"
              >
                <ShoppingBag className="h-5 w-5" />
                {ctaLabel}
                {canAdd && total !== null && safeQty > 1 && (
                  <span className="ml-1 rounded-lg bg-white/20 px-2 py-0.5 text-sm">£{total.toFixed(2)}</span>
                )}
              </button>
            </div>

            {/* Added confirmation */}
            {justAdded && (
              <div
                role="status"
                className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  Added to cart
                </span>
                <span className="flex items-center gap-3">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#e6007e] hover:underline"
                  >
                    Checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setJustAdded(false)}
                    aria-label="Dismiss"
                    className="text-emerald-700/60 hover:text-emerald-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              </div>
            )}

            {/* Trust points */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { Icon: Truck, title: "Free UK delivery", text: "Straight to your door" },
                { Icon: ShieldCheck, title: "Secure checkout", text: "Safe, encrypted payment" },
                { Icon: PackageCheck, title: "Pair with a SIM", text: "30-Day Flexi SIM plans" },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e6007e]/10 text-[#e6007e]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-gray-900">{title}</span>
                    <span className="block text-xs text-gray-500">{text}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description?.trim() && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-black text-gray-900">About this device</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SIM offers, similar devices, recently viewed */}
      <DeviceRecommendations
        currentSlug={product.slug}
        brand={product.brand}
        price={price ?? (product.price_min != null ? Number(product.price_min) : null)}
      />

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-500">{product.name}</p>
            <p className="text-lg font-black text-gray-900">{total !== null ? `£${total.toFixed(2)}` : "Select options"}</p>
          </div>
          <button
            type="button"
            onClick={addToCart}
            disabled={!canAdd}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#e6007e] to-[#A3157A] px-5 text-sm font-extrabold text-white shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
          >
            <ShoppingBag className="h-4 w-4" />
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
export { ProductDetail };

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
// NOTE: these two imports assume this file is app/page.tsx and your context/
// components live at app/context and app/components (same as your /plans page,
// which imports "../context/..."). If your homepage sits elsewhere, adjust the
// relative path (e.g. "../context/CartContext").
import { useCart } from "./context/CartContext";
import ChooseSimTypeModal from "./components/ChooseSimTypeModal";

// ─── DATA ────────────────────────────────────────────────────────────────────

const joinFeatures = [
  { icon: "/images/homepage/📱.png", label: "Keep Your Number" },
  { icon: "/images/homepage/🎵.png", label: "Apple Music Free" },
  { icon: "/images/homepage/⚡.png", label: "Quick & Easy" },
  { icon: "/images/homepage/📊.png", label: "Track Your Usage" },
  { icon: "/images/homepage/🎁.png", label: "Great Rewards" },
];

const whyChoose = [
  {
    icon: "/images/homepage/📡.png",
    title: "Free 5G Access",
    desc: "Lightning-fast speeds at no extra cost",
  },
  {
    icon: "/images/homepage/🚚.png",
    title: "Free UK Delivery",
    desc: "Quick delivery to your doorstep",
  },
  {
    icon: "/images/homepage/🌍.png",
    title: "Free 5G EU Roaming",
    desc: "Stay connected across Europe",
  },
  {
    icon: "/images/homepage/💬.png",
    title: "Free Customer Service Call",
    desc: "Always here to help you",
  },
  {
    icon: "/images/homepage/⏰.png",
    title: "Free 24×7 Customer Support",
    desc: "Round-the-clock assistance",
  },
  {
    icon: "/images/homepage/🔄.png",
    title: "Free Switching to Zoiko Mobile",
    desc: "Seamless transition process",
  },
];

const careOptions = [
  {
    icon: "/images/homepage/✉️.png",
    title: "Email Support",
    desc: "Contact us at any time of the day via email",
  },
  {
    icon: "/images/homepage/💬 (1).png",
    title: "Live Chat",
    desc: "Chat with our team 24/7 for instant responses",
  },
  {
    icon: "/images/homepage/⏰ (1).png",
    title: "Extended Support",
    desc: "Our customer service is open for extended hours",
  },
  {
    icon: "/images/homepage/📱 (1).png",
    title: "Self-Service Portal",
    desc: "Get quick answers in our online help center",
  },
  {
    icon: "/images/homepage/💻.png",
    title: "Ask Me Temporarily",
    desc: "Quick help for common questions",
  },
  {
    icon: "/images/homepage/🎧.png",
    title: "Contact Sales",
    desc: "Speak to our sales team Monday to Sunday",
  },
];

// ─── CONFIG ──────────────────────────────────────────────────────────────────

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Full Devices listing route — update to match your app.
const DEVICES_ROUTE = "/devices";

// ─── PLANS DATA FETCHING (ported from the All Plans page) ─────────────────────

const SIM_SLUG = "sim-only-plans";

const DURATIONS = ["24 Month Plan", "12 Month Plan", "30 Day Plan"] as const;
type Duration = (typeof DURATIONS)[number];

interface Feature {
  id: number;
  title: string;
}
interface Category {
  id: number;
  name: string;
  slug: string;
}
interface Plan {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: string;
  price_24: string | null;
  price_12: string | null;
  price_30: string | null;
  data_allowance: string | null;
  tier_label: string | null;
  is_popular: boolean;
  category: Category | null;
  features: Feature[];
  // These come back from /api/plans/v1/ too and are what addPlanToCart uses,
  // so the type must match the /plans page's Plan for addPlanToCart to accept it.
  transatelID: string | null;
  final_price: string;
  duration_days: number;
}

function priceFor(plan: Plan, duration: Duration): string {
  const raw =
    duration === "24 Month Plan"
      ? plan.price_24
      : duration === "12 Month Plan"
        ? plan.price_12
        : plan.price_30;
  return Number(raw ?? plan.price).toFixed(2);
}

function bullets(plan: Plan): string[] {
  if (plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── DEVICES DATA FETCHING (ported from the Devices listing page) ─────────────

const PRODUCTS_URL = `${API_BASE}/api/products/`;

interface AttrGroup {
  name: string;
  values: string[];
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

// Map colour names to swatch hex (extend as needed)
const COLOUR_HEX: Record<string, string> = {
  gold: "#d4af37",
  green: "#1f6b4f",
  grey: "#9ca3af",
  gray: "#9ca3af",
  silver: "#e5e7eb",
  black: "#1f2937",
  white: "#ffffff",
  blue: "#3b82f6",
  red: "#ef4444",
  pink: "#ec4899",
  purple: "#8b5cf6",
  yellow: "#eab308",
};
const hexFor = (name: string) => COLOUR_HEX[name.toLowerCase()] ?? "#9ca3af";

function attrValues(p: Product, ...names: string[]): string[] {
  const wanted = names.map((n) => n.toLowerCase());
  const g = p.attributes?.find((a) => wanted.includes(a.name.toLowerCase()));
  return g?.values ?? [];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PINK = "#e6007e";
const GREEN = "#00a859";

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#e6007e]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      className="h-5 w-5 text-amber-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9z" />
    </svg>
  );
}

function DeviceCard({ d }: { d: Product }) {
  const conditions = attrValues(d, "Condition");
  const colours = attrValues(d, "Color", "Colour");
  const storages = attrValues(d, "Storage");
  const from = Number(d.price_min ?? 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex h-44 items-center justify-center">
        {d.primary_image ? (
          <img
            src={d.primary_image}
            alt={d.name}
            className="h-full w-auto object-contain"
          />
        ) : (
          <div className="h-full w-32 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700" />
        )}
      </div>

      <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">
        {d.name}
      </h3>

      <p className="text-xs text-gray-400">Starting from:</p>
      <p className="mb-4 text-2xl font-extrabold text-[#e6007e]">
        £{from.toFixed(2)}
      </p>

      {conditions.length > 0 && (
        <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
          <p className="text-xs text-gray-400">Device condition:</p>
          <p className="text-sm font-semibold text-green-600">
            {conditions.join(", ")}
          </p>
        </div>
      )}

      {colours.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Available colours:
          </span>
          <div className="flex gap-1.5">
            {colours.map((c) => (
              <span
                key={c}
                title={c}
                className="h-4 w-4 rounded-full border border-gray-200"
                style={{ backgroundColor: hexFor(c) }}
              />
            ))}
          </div>
        </div>
      )}

      {storages.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Internal storage:
          </span>
          <span className="text-right text-sm font-medium text-gray-700 dark:text-gray-200">
            {storages.join(" | ")}
          </span>
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

// ─── SECTIONS ────────────────────────────────────────────────────────────────

/** 1. HERO */
function Hero() {
  return (
    <section className="bg-white dark:bg-gray-800">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 md:px-8 lg:grid-cols-2 lg:gap-6 lg:py-16">
        {/* Text */}
        <div className="order-1">
          <h1 className="font-extrabold leading-tight text-[#c4007a] text-[clamp(2rem,5vw,3.25rem)]">
            Make the Smart Switch today!
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
            Unlimited Data | Unlimited Calls | Roam Free in 30+ Countries
          </p>

          <div className="mt-6 flex items-end gap-2">
            <span className="font-extrabold text-[#e6007e] text-[clamp(2.25rem,6vw,3.5rem)] leading-none">
              £0.00
            </span>
            <span className="mb-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              /Month For Up To 3 Months*
            </span>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="/switch-and-save">
              {" "}
              <button
                type="button"
                className="rounded-full bg-[#e6007e] px-8 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#c4007a]"
              >
                Switch &amp; Save
              </button>
            </a>
            <a href="/plans">
              <button
                type="button"
                className="rounded-full border border-[#e6007e] px-8 py-3 text-sm font-semibold text-[#e6007e] transition-colors hover:bg-[#fff0f8] dark:hover:bg-[#e6007e]/10"
              >
                View Plans
              </button>
            </a>
          </div>
        </div>

        {/* Image collage — space reserved */}
        <div className="order-2">
          <div className="relative w-full overflow-hidden rounded-2xl aspect-[4/3] bg-gradient-to-br from-[#f3e8f7] via-[#e9c9e8] to-[#8e3a8c]">
            <Image
              src="/images/homepage/girl.png"
              alt="Happy Zoiko Mobile customers"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** 2. JOIN ZOIKO */
function JoinZoiko() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 md:px-8 dark:bg-gray-800">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.4rem,3.5vw,2rem)]">
          Join Zoiko Mobile today and start something new!
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {joinFeatures.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-3 rounded-xl bg-gray-50 px-3 py-6 text-center dark:bg-gray-800"
            >
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image
                  src={f.icon}
                  alt={f.label}
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 sm:text-sm">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 3. WHY CHOOSE */
function WhyChoose() {
  return (
    <section className="bg-[#eef9f3] px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-800">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.5rem,4vw,2.25rem)]">
          Why Choose Zoiko Mobile?
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChoose.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800"
            >
              <div className="relative mb-4 h-10 w-10">
                <Image
                  src={item.icon}
                  alt={item.title}
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 4. PLANS — fetched live, capped at 3 SIM-only plans.
    "Buy this plan" -> pick SIM type -> addPlanToCart -> redirect to /checkout
    (same flow as the /plans page, so the checkout cart is populated correctly). */
function Plans() {
  const { addPlanToCart } = useCart();
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>("24 Month Plan");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (!res.ok) throw new Error("Failed to load plans");
        setAllPlans(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // SIM-only plans only, and just the first 3 for the homepage teaser.
  const simPlans = useMemo(
    () => allPlans.filter((p) => p.category?.slug === SIM_SLUG).slice(0, 3),
    [allPlans],
  );

  // Open the eSIM / pSIM chooser (needed so the checkout can route SIM lines).
  const handleBuyNow = (plan: Plan) => setSimTypePlan(plan);

  // Add to cart with the chosen SIM type, then go straight to checkout.
  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(simTypePlan, simType);
    setSimTypePlan(null);
    router.push("/checkout");
  };

  return (
    <section className="bg-white px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-800">
      {/* Choose SIM Type modal (eSIM / pSIM) */}
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.5rem,4vw,2.25rem)]">
          Choose Your SIM Only Plan &amp; Duration Below
        </h2>

        {/* Duration toggle */}
        <div className="mx-auto mt-8 flex w-fit flex-wrap justify-center gap-1 rounded-full border border-gray-200 p-1 dark:border-gray-700">
          {DURATIONS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDuration(tab)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                duration === tab
                  ? "bg-[#e6007e] text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 flex justify-center py-10">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-[#e6007e] border-t-transparent"
              role="status"
            >
              <span className="sr-only">Loading plans…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mx-auto mt-10 max-w-md rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && simPlans.length === 0 && (
          <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No plans available right now. Please check back soon.
          </p>
        )}

        {/* Plan cards */}
        {!loading && !error && simPlans.length > 0 && (
          <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {simPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white p-6 sm:p-7 dark:bg-gray-800 ${
                  plan.is_popular
                    ? "border-2 border-[#e6007e] shadow-xl lg:-translate-y-3"
                    : "border border-gray-200 shadow-sm dark:border-gray-700"
                }`}
              >
                {plan.is_popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e6007e] px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}

                <span className="mx-auto rounded-full bg-[#fde4f2] px-4 py-1 text-xs font-semibold text-[#c4007a]">
                  {plan.tier_label ?? plan.name}
                </span>

                {plan.data_allowance && (
                  <p className="mt-5 text-center font-extrabold text-[#00a859] text-[clamp(1.75rem,4vw,2.25rem)]">
                    {plan.data_allowance}
                  </p>
                )}

                <div className="mt-2 text-center">
                  <span className="font-extrabold text-[#e6007e] text-[clamp(1.75rem,4vw,2.25rem)]">
                    £{priceFor(plan, duration)}
                  </span>
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                    per month
                  </span>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {bullets(plan).map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <CheckIcon />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleBuyNow(plan)}
                  className="mt-6 rounded-full bg-[#e6007e] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]"
                >
                  Buy this plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import React from "react";
import { PhoneCall, Search, Coins, RefreshCw } from "lucide-react";

interface TrustReason {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
}

const trustReasons: TrustReason[] = [
  {
    imageSrc: "/images/homepage/💻.png",
    imageAlt: "Free International Calls Icon",
    title: "Free International Calls",
    description:
      "Ring your loved ones abroad & stay in touch without the hefty bill",
  },
  {
    imageSrc: "/images/homepage/🔄.png",
    imageAlt: "No Credit Check Icon",
    title: "No Credit Check Required",
    description: "We've made it easier than ever for you to switch",
  },
  {
    imageSrc: "/images/homepage/💻.png",
    imageAlt: "Pocket-friendly Pricing Icon",
    title: "Pocket-friendly Pricing",
    description: "Enjoy a whole lot of data without breaking your bank",
  },
  {
    imageSrc: "/images/homepage/🔄.png",
    imageAlt: "Easy to Switch Icon",
    title: "Easy to Switch",
    description: "Switching to Zoiko Mobile has never been easier",
  },
];

function ReasonsToTrustSection() {
  return (
    <section className="w-full bg-[#F6F8FA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-[#101828] mb-10 tracking-tight">
          Reasons to Trust Zoiko Mobile
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustReasons.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col items-center text-center transition-all duration-200 hover:shadow-md"
            >
              {/* Lucide Icon Container */}
              {/* Image Icon Container */}
              <div className="mb-6 flex items-center justify-center">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>

              {/* Title */}
              <h3 className="text-[18px] font-bold text-[#101828] mb-3 leading-snug">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 5. DEVICES — refurbished smartphones teaser, fetched live, capped at 4 */
function Devices() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(PRODUCTS_URL);
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        // supports array OR paginated { results: [...] }
        setProducts(Array.isArray(data) ? data : (data.results ?? []));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Featured first, then the rest — capped at 4 for the homepage teaser.
  const devices = useMemo(() => {
    const featured = products.filter((p) => p.is_featured);
    const rest = products.filter((p) => !p.is_featured);
    return [...featured, ...rest].slice(0, 4);
  }, [products]);

  return (
    <section className="bg-gray-50 px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.5rem,4vw,2.25rem)]">
          <span className="text-[#e6007e]">Pick</span> Up A Fantastic Deal On
          Our Refurbished Smartphones!
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-500 dark:text-gray-400">
          From Apple iPhones to Samsung Galaxy devices, we&rsquo;ve thoroughly
          inspected and restored each smartphone for you.
        </p>

        {/* Loading */}
        {loading && (
          <div className="mt-10 flex justify-center py-10">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
              role="status"
            >
              <span className="sr-only">Loading devices…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mx-auto mt-10 max-w-md rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && devices.length === 0 && (
          <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No devices available right now. Please check back soon.
          </p>
        )}

        {/* Device cards */}
        {!loading && !error && devices.length > 0 && (
          <>
            <div className="mt-10 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {devices.map((d) => (
                <DeviceCard key={d.id} d={d} />
              ))}
            </div>

            {/* View all devices */}
            <div className="mt-10 text-center">
              <Link
                href={DEVICES_ROUTE}
                className="inline-block rounded-full border border-[#e6007e] px-8 py-3 text-sm font-semibold text-[#e6007e] transition-colors hover:bg-[#fff0f8] dark:hover:bg-[#e6007e]/10"
              >
                View all devices
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** 6. CUSTOMER CARE */
function CustomerCare() {
  return (
    <section className="bg-[#eef2fb] px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-800">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.5rem,4vw,2.25rem)]">
          Zoiko Customer Care
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-500 dark:text-gray-400">
          We understand the importance of having a mobile. When you may not be
          on best person in the US, we offer a variety of accessible customer
          support options.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {careOptions.map((opt) => (
            <div
              key={opt.title}
              className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-800"
            >
              <div className="relative mb-4 h-10 w-10">
                <Image
                  src={opt.icon}
                  alt={opt.title}
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white">
                {opt.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {opt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 7. REVIEW */
function Review() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-800">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-extrabold text-gray-800 dark:text-white text-[clamp(1.25rem,3vw,1.75rem)]">
          Great
        </h2>
        <p className="mt-4 text-sm italic leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
          Zoiko Mobile has extremely changed the way I use my phone. With their
          affordable prices and excellent customer support, I couldn&rsquo;t be
          happier with my switch!
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} />
            ))}
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            Great
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Based on over 3,000 reviews
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ZoikoMobileHome() {
  return (
    <main className="font-sans">
      <Hero />
      <JoinZoiko />
      <WhyChoose />
      <Plans />
      <ReasonsToTrustSection />
      <Devices />
      <CustomerCare />
      <Review />
    </main>
  );
}

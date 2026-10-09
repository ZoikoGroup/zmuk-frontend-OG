"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const DATA_SLUG = "data-only-plans";

type Duration = "24 Month Plan" | "12 Month Plan" | "30 Day Plan";
const DURATIONS: Duration[] = ["24 Month Plan", "12 Month Plan", "30 Day Plan"];

interface Feature { id: number; title: string; }
interface Category { id: number; name: string; slug: string; }
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
}

function priceFor(plan: Plan, duration: Duration): string {
  const raw =
    duration === "24 Month Plan" ? plan.price_24 :
    duration === "12 Month Plan" ? plan.price_12 :
    plan.price_30;
  return Number(raw ?? plan.price).toFixed(2);
}

function bullets(plan: Plan): string[] {
  if (plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

const Check = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
  </svg>
);

function PlanCard({ plan, duration }: { plan: Plan; duration: Duration }) {
    const { addPlanToCart } = useCart();
    const router = useRouter();
  
    const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

    const handleBuyNow = (plan: Plan) => {
      setSimTypePlan(plan);
    };

    const confirmSimType = (simType: "esim" | "psim") => {
      if (!simTypePlan) return;
      addPlanToCart(simTypePlan, simType);
      setSimTypePlan(null);
      router.push("/checkout");
    };
  
  return (
    <div className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${
      plan.is_popular ? "border-2 border-teal-400" : "border border-gray-100 dark:border-gray-700"
    }`}>
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}
      {plan.is_popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e6007e] px-3 py-0.5 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}

      <h3 className="mb-5 text-center text-xl font-bold text-green-600">{plan.name}</h3>

      <div className="mb-6 flex min-h-[150px] flex-col justify-center rounded-xl bg-gray-50 py-6 text-center dark:bg-gray-900">
        {plan.data_allowance && (
          <>
            <div className="text-4xl font-extrabold text-green-600">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-3 text-3xl font-extrabold text-[#e6007e]">£{priceFor(plan, duration)}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>

      <ul className="mb-6 flex-1 space-y-3 border-t border-gray-100 pt-5 dark:border-gray-700">
        {bullets(plan).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check /><span>{f}</span>
          </li>
        ))}
      </ul>

      <button onClick={() => handleBuyNow(plan)} className="mt-auto w-full rounded-md bg-[#e6007e] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
        Buy this plan
      </button>
    </div>
  );
}

// ── Banner pills ──
const IconCoins = () => (
  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <ellipse cx="12" cy="6" rx="7" ry="3" /><path strokeLinecap="round" d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </svg>
);
const IconInfinity = () => (
  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M7 9a3 3 0 100 6c2 0 3-2 5-3 2-1 3-3 5-3a3 3 0 110 6c-2 0-3-2-5-3-2-1-3-3-5-3z" />
  </svg>
);
const IconPound = () => (
  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7c-.7-1.2-2-2-3.5-2C10 5 9 7 9 9v3H7m0 0h6m-6 0c0 3-1 4-2 5h12" />
  </svg>
);

const PILLS = [
  { icon: <IconCoins />, label: "Data Only SIMs" },
  { icon: <IconInfinity />, label: "Unlimited Data" },
  { icon: <IconPound />, label: "Affordable Prices" },
];

// ── Why Choose icons ──
const IconSignal = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="14" width="3" height="6" rx="1"/><rect x="9" y="10" width="3" height="10" rx="1"/><rect x="15" y="6" width="3" height="14" rx="1"/></svg>
);
const IconTruck = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>
);
const IconSpeed = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 13l4-4M4 17a8 8 0 1116 0"/></svg>
);
const IconPhone = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 4h3l2 5-2 1c1 2 3 4 5 5l1-2 5 2v3a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/></svg>
);
const IconHeadset = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 13v-1a8 8 0 1116 0v1"/><rect x="3" y="13" width="4" height="6" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/></svg>
);
const IconSwitch = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h13l-3-3M20 16H7l3 3"/></svg>
);

const WHY = [
  { icon: <IconSignal />, title: "Free 5G SIM Cards", text: "Get the latest 5G technology with our complimentary SIM cards" },
  { icon: <IconTruck />, title: "Free UK Delivery", text: "Fast and reliable delivery service across the United Kingdom" },
  { icon: <IconSpeed />, title: "Free 5G Data Speed", text: "Experience lightning-fast 5G speeds at no extra cost" },
  { icon: <IconPhone />, title: "Free Customer Service Call", text: "Get support whenever you need it with our free customer service" },
  { icon: <IconHeadset />, title: "Free 24×7 Customer Support", text: "Round-the-clock customer support for all your needs" },
  { icon: <IconSwitch />, title: "Free Switching to Zoiko Mobile", text: "Switch to us hassle-free and keep your existing number" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Dataonly() {
  const [duration, setDuration] = useState<Duration>("24 Month Plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (!res.ok) throw new Error("Failed to load plans");
        setPlans(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dataPlans = useMemo(() => plans.filter((p) => p.category?.slug === DATA_SLUG), [plans]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">

      {/* Banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-10 text-center">
        <h1 className="mb-6 text-2xl font-bold text-white sm:text-3xl">Select Contract Duration</h1>
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-4">
          {PILLS.map((p) => (
            <span key={p.label} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">
              {p.icon}{p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex justify-center px-4 pt-10">
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                duration === d ? "bg-yellow-400 text-gray-900" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
        )}

        {!loading && !error && dataPlans.length > 0 && (
          <>
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
              {dataPlans.map((p) => <PlanCard key={p.id} plan={p} duration={duration} />)}
            </div>
            {/* decorative dots */}
            <div className="mt-8 flex justify-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e6007e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            </div>
          </>
        )}

        {!loading && !error && dataPlans.length === 0 && (
          <p className="text-center text-gray-500">No data-only plans available yet.</p>
        )}
      </div>

      {/* Connect banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-5 text-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-[#e6007e]">Z</div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Get Connected With Zoiko Mobile&rsquo;s Data Only SIMs &mdash; Fast, Reliable, And Easy To Use!
          </h2>
        </div>
      </div>

      {/* Why Choose */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">
            Why Choose Zoiko Mobile?
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-teal-500">
                  {w.icon}
                </div>
                <h3 className="mb-2 font-bold text-gray-800 dark:text-white">{w.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
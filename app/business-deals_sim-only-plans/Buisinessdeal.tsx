"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const BUSINESS_SLUG = "zoiko-sim-only-business-deals";

type Duration = "24 Month Plan" | "12 Month Plan" | "30 Day Plan";
const DURATIONS: Duration[] = ["24 Month Plan", "12 Month Plan", "30 Day Plan"];

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

// Tier pill colors
function tierClasses(tier: string | null): string {
  switch ((tier || "").toUpperCase()) {
    case "ESSENTIAL": return "bg-teal-500 text-white";
    case "PROFESSIONAL": return "bg-[#e6007e] text-white";
    case "ENTERPRISE": return "bg-yellow-400 text-gray-900";
    default: return "bg-gray-200 text-gray-700";
  }
}

const GreenCheck = () => (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
    <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  </span>
);

const WarnIcon = () => (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-900">!</span>
);

function FeatureRow({ text }: { text: string }) {
  const isRoaming = text.toLowerCase().startsWith("eu roaming");
  return (
    <li className="flex items-start gap-2 border-b border-gray-100 pb-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
      {isRoaming ? <WarnIcon /> : <GreenCheck />}
      <span>{text}</span>
    </li>
  );
}

function PlanCard({ plan, duration }: { plan: Plan; duration: Duration }) {
    const { addPlanToCart } = useCart();
    const router = useRouter();
  
    const handleBuyNow = (plan: Plan) => {
      addPlanToCart(plan);
      router.push("/checkout");
    };
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${
        plan.is_popular ? "border-2 border-yellow-400" : "border border-gray-100 dark:border-gray-700"
      }`}
    >
      {plan.is_popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e6007e] px-3 py-0.5 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}

      {/* Header */}
      <div className="flex min-h-[110px] flex-col items-center justify-center gap-3 text-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
        {plan.tier_label && (
          <span className={`inline-block rounded-full px-4 py-1 text-xs font-bold ${tierClasses(plan.tier_label)}`}>
            {plan.tier_label}
          </span>
        )}
      </div>

      {/* Data + price */}
      <div className="my-5 flex min-h-[140px] flex-col justify-center rounded-xl bg-gray-50 py-6 text-center dark:bg-gray-900">
        {plan.data_allowance && (
          <>
            <div className="text-3xl font-extrabold text-yellow-400">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-3 text-2xl font-bold text-[#e6007e]">£{priceFor(plan, duration)}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {bullets(plan).map((f, i) => (
          <FeatureRow key={i} text={f} />
        ))}
      </ul>

      {/* Buttons */}
      <div className="mt-auto space-y-2">
       
        <button onClick={() => handleBuyNow(plan)} className="w-full rounded-md bg-[#e6007e] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
          BUY THIS PLAN
        </button>
      </div>
    </div>
  );
}

// ── Why Choose icons ──
const IconShield = () => (
  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
  </svg>
);
const IconSupport = () => (
  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="9" cy="8" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19a5.5 5.5 0 0111 0" />
    <circle cx="17.5" cy="9.5" r="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a4 4 0 015.5-3.7" />
  </svg>
);
const IconGear = () => (
  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </svg>
);
const IconChart = () => (
  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16l4-5 3 3 4-6" />
  </svg>
);

const WHY = [
  { icon: <IconShield />, title: "Enterprise Security", text: "Advanced security features and encrypted connections for your business data" },
  { icon: <IconSupport />, title: "Dedicated Support", text: "Priority customer support with dedicated business account managers" },
  { icon: <IconGear />, title: "Flexible Management", text: "Easy-to-use business portal for managing multiple lines and billing" },
  { icon: <IconChart />, title: "Usage Analytics", text: "Detailed usage reports and analytics to optimize your business connectivity" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function Buisinessdeal() {
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

  const Buisinessdeal = useMemo(
    () => plans.filter((p) => p.category?.slug === BUSINESS_SLUG),
    [plans]
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900">

      {/* Banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Business SIM Only Plans</h1>
      </div>

      {/* Select duration */}
      <div className="px-4 pt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Select Contract Duration</h2>
        <span className="mt-2 inline-block h-1 w-16 rounded bg-green-500" />
      </div>

      <div className="mb-10 mt-8 flex justify-center px-4">
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                duration === d
                  ? "bg-yellow-400 text-gray-900"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="bg-gray-100 px-4 py-12 dark:bg-gray-800">
        <div className="mx-auto max-w-5xl">
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

          {!loading && !error && Buisinessdeal.length > 0 && (
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
              {Buisinessdeal.map((plan) => (
                <PlanCard key={plan.id} plan={plan} duration={duration} />
              ))}
            </div>
          )}

          {!loading && !error && Buisinessdeal.length === 0 && (
            <p className="text-center text-gray-500">No business plans available yet.</p>
          )}
        </div>
      </div>

      {/* Why Choose */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">Why Choose Zoiko Business?</h2>
            <span className="mt-2 inline-block h-1 w-16 rounded bg-green-500" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-teal-500">
                  {w.icon}
                </div>
                <h3 className="mb-2 font-bold text-gray-800 dark:text-white">{w.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default Buisinessdeal;
export { Buisinessdeal };
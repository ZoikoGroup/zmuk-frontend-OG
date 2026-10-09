"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";

// .env.local -> NEXT_PUBLIC_API_URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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

// Match a plan's category by keywords in its name OR slug (tolerant to slug spelling).
function catMatch(p: Plan, ...keywords: string[]): boolean {
  const hay = `${p.category?.name ?? ""} ${p.category?.slug ?? ""}`.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

function monthly(plan: Plan): string {
  return Number(plan.price_30 ?? plan.price_12 ?? plan.price).toFixed(2);
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

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">{children}</h2>
      <span className="mt-2 inline-block h-1 w-16 rounded bg-yellow-400" />
    </div>
  );
}

function PlanCard({ plan, badge, onBuyNow }: { plan: Plan; badge?: string; onBuyNow: (plan: Plan) => void }) {
  const highlighted = plan.is_popular || !!badge;

  return (
    <div className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${highlighted ? "border-2 border-teal-500" : "border border-gray-100 dark:border-gray-700"
      }`}>
      {highlighted && badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-teal-600 px-3 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}

      <h3 className="mb-5 text-center text-lg font-bold text-green-600">{plan.name}</h3>

      <div className="mb-5 flex min-h-[140px] flex-col justify-center rounded-xl bg-gray-50 py-6 text-center dark:bg-gray-900">
        {plan.data_allowance && (
          <>
            <div className="text-3xl font-extrabold text-green-600">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-3 text-2xl font-extrabold text-[#e6007e]">£{monthly(plan)}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {bullets(plan).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check /><span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2">
        {/* <button className="w-full rounded-md border border-green-600 py-2 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
          View Details
        </button> */}
        <button onClick={() => onBuyNow(plan)} className="w-full rounded-md bg-[#e6007e] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
          Buy this plan
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function ThirtyDayPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
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

  // Tolerant category matching (name OR slug keywords)
  const noContract = useMemo(() => plans.filter((p) => catMatch(p, "no contract", "no-contract", "30-day")), [plans]);
  const dataOnly = useMemo(() => plans.filter((p) => catMatch(p, "data only", "data-only")), [plans]);
  const roaming = useMemo(() => plans.filter((p) => catMatch(p, "roaming")), [plans]);

  const scroll = (dir: -1 | 1) => {
    sliderRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

      {/* Hero */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-14 text-center">
        <h1 className="text-4xl font-extrabold text-yellow-300 sm:text-5xl">FlexiFrenzy</h1>
        <p className="mt-3 text-sm font-medium text-white sm:text-base">30-Day Plans With No Commitments</p>
      </div>

      <div className="mx-auto max-w-6xl px-4">

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status"><span className="sr-only">Loading...</span></div>
          </div>
        )}
        {error && (
          <div className="my-8 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* 30-Day No Contract */}
            {noContract.length > 0 && (
              <section className="py-12">
                <SectionHead>30-Day &lsquo;No Contract&rsquo; Plans</SectionHead>
                <div className="flex flex-wrap justify-center gap-6">
                  {noContract.map((p) => (
                    <div key={p.id} className="w-full max-w-[340px] sm:w-[320px]">
                      <PlanCard plan={p} badge={p.is_popular ? "Best Value" : undefined} onBuyNow={handleBuyNow} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Data-Only SIM (slider) */}
            {dataOnly.length > 0 && (
              <section className="py-12">
                <SectionHead>Data-Only SIM Plans</SectionHead>
                <div className="relative">
                  {dataOnly.length > 3 && (
                    <>
                      <button type="button" onClick={() => scroll(-1)} aria-label="Previous"
                        className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-green-500 bg-white text-green-600 shadow dark:bg-gray-800">&#8249;</button>
                      <button type="button" onClick={() => scroll(1)} aria-label="Next"
                        className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-green-500 bg-white text-green-600 shadow dark:bg-gray-800">&#8250;</button>
                    </>
                  )}
                  <div ref={sliderRef} className={`flex snap-x gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${dataOnly.length <= 3 ? "justify-center" : ""}`}>
                    {dataOnly.map((p) => (
                      <div key={p.id} className="w-[300px] shrink-0 snap-start">
                        <PlanCard plan={p} onBuyNow={handleBuyNow} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Roaming */}
            {roaming.length > 0 && (
              <section className="py-12">
                <SectionHead>Zoiko Roaming Deals</SectionHead>
                <div className="flex flex-wrap justify-center gap-6">
                  {roaming.map((p) => (
                    <div key={p.id} className="w-full max-w-[400px] sm:w-[380px]">
                      <PlanCard plan={p} onBuyNow={handleBuyNow} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Testimonial */}
        <section className="pb-16">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-800">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">


              
                  &ldquo;Brilliant service. From the moment I downloaded their app, accessing their brilliant
                  customer services has been a pleasure. Not only is it incredibly user-friendly, but its pricing is
                  also very competitive compared to other options in the market. I can confidently say that Zoiko
                  Mobile has made my life so much easier!&rdquo;
                </p>
                <p className="mt-3 text-sm font-semibold text-green-600">Michelle T.</p>
              </div>
              <div className="flex h-20 w-20 items-center justify-center justify-self-center rounded-full bg-gradient-to-br from-green-600 to-teal-500 text-white">
                <svg className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0116 0z" /></svg>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-lg text-yellow-400">&#9733;&#9733;&#9733;&#9733;&#9734;</div>
              <p className="mt-1 font-semibold text-gray-800 dark:text-white">Great</p>
              <p className="text-xs text-gray-400">Based on over 3,000 reviews</p>
              <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <span className="text-green-500">&#9733;</span> Trustpilot
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default ThirtyDayPlans;
export { ThirtyDayPlans };
"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import React, { useEffect, useMemo, useState } from "react";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Category slugs feeding each section (create these in the admin)
const SIM_SLUG = "sim-only-plans";
const BROADBAND_SLUG = "super-fast-broadband";
const PHONE_SLUG = "digital-phone-lines";
const COMBO_SLUG = "zoiko-combo-deals";

// Hero images — put files in /public and update paths
const HERO_MAIN = "/images/Rectangle 947.png";
const HERO_SMALL = "/images/Rectangle 948.png";

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

type SimDuration = "12 Months" | "30 Day Plan";

function num(v: string | null, fallback: string): string {
  return Number(v ?? fallback).toFixed(2);
}

function lines(plan: Plan): string[] {
  if (plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

// ── icons ──
const GreenCheck = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
  </svg>
);

// Render a plan's lines, treating "Additional Features"/"Includes" as subheadings
// and "Installation cost..." as a grey box.
function FeatureBlock({ items }: { items: string[] }) {
  return (
    <div className="mb-6 space-y-3">
      {items.map((line, i) => {
        const isHeading = /^(additional features|includes)\b/i.test(line);
        const isInstall = /^installation cost/i.test(line);
        if (isHeading) {
          return (
            <p key={i} className="pt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {line.replace(/:?\s*$/, "")}:
            </p>
          );
        }
        if (isInstall) {
          return (
            <div key={i} className="rounded-md bg-gray-100 px-3 py-2 text-center text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
              {line}
            </div>
          );
        }
        return (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <GreenCheck /><span>{line}</span>
          </div>
        );
      })}
    </div>
  );
}

function Buttons({ onclick }: { onclick: () => void }) {
  return (
    <div className="mt-auto space-y-2">
      {/* <button className="w-full rounded-md border border-green-600 py-2 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
        View Details
      </button> */}
      <button onClick={onclick} className="w-full rounded-md bg-[#e6007e] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]" >
        Buy this plan
      </button>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e6007e] px-3 py-0.5 text-xs font-semibold text-white">
      {text}
    </span>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">{title}</h2>
      <span className="mt-2 inline-block h-1 w-16 rounded bg-yellow-400" />
      {sub && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Cards ──
function SimCard({ plan, duration ,onBuyNow }: { plan: Plan; duration: SimDuration; onBuyNow: (plan: Plan) => void }) {
  const price = duration === "12 Months" ? num(plan.price_12, plan.price) : num(plan.price_30, plan.price);
  return (
    <div className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${plan.is_popular ? "border-2 border-teal-400" : "border border-gray-100 dark:border-gray-700"
      }`}>
      {plan.is_popular && <Badge text="Most Popular" />}
      <h3 className="mb-4 text-center text-base font-semibold text-gray-800 dark:text-white">{plan.name}</h3>
      <div className="mb-5 flex min-h-[130px] flex-col justify-center rounded-xl bg-gray-50 py-5 text-center dark:bg-gray-900">
        {plan.data_allowance && (
          <>
            <div className="text-3xl font-extrabold text-green-600">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">£{price}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>
      <FeatureBlock items={lines(plan)} />
      <Buttons onclick={() => onBuyNow(plan)} />
    </div>
  );
}

function BroadbandCard({ plan, onBuyNow }: { plan: Plan; onBuyNow: (plan: Plan) => void }) {
  return (
    <div className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${plan.is_popular ? "border-2 border-teal-400" : "border border-gray-100 dark:border-gray-700"
      }`}>
      {plan.is_popular && <Badge text="Recommended" />}
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">{plan.name}</h3>
      <div className="mb-5 flex min-h-[120px] flex-col justify-center rounded-xl bg-gray-50 py-5 text-center dark:bg-gray-900">
        {plan.data_allowance && <div className="text-xs text-gray-400">Upto</div>}
        {plan.data_allowance && <div className="text-3xl font-extrabold text-green-600">{plan.data_allowance}</div>}
        <div className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">£{num(plan.price_12, plan.price)}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>
      <FeatureBlock items={lines(plan)} />
      <Buttons onclick={() => onBuyNow(plan)} />
    </div>
  );
}

function PhoneCard({ plan, onBuyNow }: { plan: Plan; onBuyNow: (plan: Plan) => void }) {
  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white">{plan.name}</h3>
      <div className="mb-5">
        <div className="text-2xl font-bold text-gray-800 dark:text-white">£{num(plan.price_12, plan.price)}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>
      <FeatureBlock items={lines(plan)} />
      <Buttons onclick={() => onBuyNow(plan)} />
    </div>
  );
}

function ComboCard({ plan, onBuyNow }: { plan: Plan; onBuyNow: (plan: Plan) => void }) {
  return (
    <div className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${plan.is_popular ? "border-2 border-teal-400" : "border border-gray-100 dark:border-gray-700"
      }`}>
      {plan.is_popular && <Badge text="Best Value" />}
      <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white">{plan.name}</h3>
      <div className="mb-5">
        <div className="text-2xl font-bold text-gray-800 dark:text-white">£{num(plan.price_12, plan.price)}</div>
        <div className="text-xs text-gray-400">per month</div>
      </div>
      <FeatureBlock items={lines(plan)} />
      <Buttons onclick={() => onBuyNow(plan)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function Saverdeals() {
  const [simDuration, setSimDuration] = useState<SimDuration>("12 Months");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addPlanToCart } = useCart();
  const router = useRouter();

  const handleBuyNow = (plan: Plan) => {
    addPlanToCart(plan);
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

  const sim = useMemo(() => plans.filter((p) => p.category?.slug === SIM_SLUG), [plans]);
  const broadband = useMemo(() => plans.filter((p) => p.category?.slug === BROADBAND_SLUG), [plans]);
  const phone = useMemo(() => plans.filter((p) => p.category?.slug === PHONE_SLUG), [plans]);
  const combo = useMemo(() => plans.filter((p) => p.category?.slug === COMBO_SLUG), [plans]);

  return (
    <div className="bg-white dark:bg-gray-900">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
              A Comprehensive Plan For Low-Income Individuals &amp; Families
            </span>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">Zoiko Saver Deals</h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/90">
              Our <span className="font-semibold text-yellow-300">Zoiko Saver Plans</span> are designed to bridge
              the digital divide by providing{" "}
              <span className="font-semibold text-yellow-300">affordable and reliable mobile, broadband, and digital phone services</span>{" "}
              to low-income individuals. By offering competitive pricing, flexible packages, and robust customer
              support, Zoiko Mobile ensures that everyone stays connected without breaking the bank.
            </p>
          </div>

          <div className="relative">
            <img src={HERO_MAIN} alt="Saver deals" className="h-64 w-full rounded-2xl object-cover" />
            <img src={HERO_SMALL} alt="Family" className="absolute -bottom-6 right-4 h-28 w-44 rounded-2xl border-4 border-white object-cover shadow-lg" />
            <span className="absolute -bottom-2 left-4 rounded bg-black/30 px-2 py-0.5 text-xs font-semibold text-white">Save More</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">

        {/* loading / error */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="my-8 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* ── SIM Only Plans ── */}
            {sim.length > 0 && (
              <section className="py-16">
                <SectionHead title="SIM Only Plans" sub="Select Contract Duration" />
                <div className="mb-10 flex justify-center">
                  <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {(["12 Months", "30 Day Plan"] as SimDuration[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSimDuration(d)}
                        className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${simDuration === d ? "bg-yellow-400 text-gray-900" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                          }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
                  {sim.map((p) => <SimCard key={p.id} plan={p} duration={simDuration} onBuyNow={handleBuyNow} />)}
                </div>
              </section>
            )}

            {/* ── Super-fast Broadband ── */}
            {broadband.length > 0 && (
              <section className="py-16">
                <SectionHead title="Super-fast Broadband" sub="Contract Duration - 12 Month" />
                <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                  {broadband.map((p) => <BroadbandCard key={p.id} plan={p} onBuyNow={handleBuyNow} />)}
                </div>
              </section>
            )}

            {/* ── Digital Phone Lines ── */}
            {phone.length > 0 && (
              <section className="py-16">
                <SectionHead title="Digital Phone Lines" sub="Contract Duration - 12 Month" />
                <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                  {phone.map((p) => <PhoneCard key={p.id} plan={p} onBuyNow={handleBuyNow} />)}
                </div>
              </section>
            )}

            {/* ── Zoiko Combo Deals ── */}
            {combo.length > 0 && (
              <section className="py-16">
                <SectionHead title="Zoiko Combo Deals" sub="Contract Duration - 12 Month" />
                <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
                  {combo.map((p) => <ComboCard key={p.id} plan={p} onBuyNow={handleBuyNow} />)}
                </div>
              </section>
            )}
          </>
        )}

        {/* Closing text */}
        <div className="mx-auto max-w-3xl pb-16 text-center">
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-green-600">Zoiko Saver Deals</span> is designed to bridge the
            digital divide by providing affordable and reliable mobile, broadband, and digital phone services to
            low-income individuals. By offering competitive pricing, flexible packages, and robust customer
            support, Zoiko Mobile ensures that everyone has access to essential communication tools.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Saverdeals;
export { Saverdeals };
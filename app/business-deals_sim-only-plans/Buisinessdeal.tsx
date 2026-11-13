"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const BUSINESS_SLUG = "zoiko-sim-only-business-deals";

// Same duration keys as before (they map to price_24 / price_12 / price_30).
type Duration = "24 Month Plan" | "12 Month Plan" | "30 Day Plan";
const DURATIONS: { key: Duration; label: string; term: string }[] = [
  { key: "24 Month Plan", label: "24 months", term: "24-month" },
  { key: "12 Month Plan", label: "12 months", term: "12-month" },
  { key: "30 Day Plan", label: "30 days", term: "30-day" },
];

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

function priceNumber(plan: Plan, duration: Duration): number {
  const raw =
    duration === "24 Month Plan" ? plan.price_24 :
    duration === "12 Month Plan" ? plan.price_12 :
    plan.price_30;
  return Number(raw ?? plan.price);
}

const priceFor = (plan: Plan, duration: Duration) => priceNumber(plan, duration).toFixed(2);

function bullets(plan: Plan): string[] {
  if (plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

const Svg = ({ className = "h-5 w-5", children }: { className?: string; children: React.ReactNode }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IconArrow = () => <Svg className="h-4 w-4"><path d="M9 6l6 6-6 6" /></Svg>;
const IconCheck = () => <Svg className="mt-0.5 h-4 w-4 shrink-0 text-[#C80F57]"><path d="M5 12l5 5 9-10" /></Svg>;
const IconInfo = () => <Svg className="mt-0.5 h-4 w-4 shrink-0 text-[#C80F57]"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></Svg>;
const IconGlobe = () => <Svg className="mt-0.5 h-4 w-4 shrink-0 text-[#C80F57]"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Svg>;
const IconCalendar = () => <Svg><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>;
const IconBriefcase = () => <Svg className="h-4 w-4"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></Svg>;
const IconSwap = () => <Svg><path d="M7 7h12l-3-3M17 17H5l3 3" /></Svg>;
const IconTeam = () => <Svg><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0111 0" /><circle cx="17.5" cy="9.5" r="2" /><path d="M15 19a4 4 0 015.5-3.7" /></Svg>;
const IconHeadset = () => <Svg><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></Svg>;

const WHY_POINTS = [
  "Clear per-line monthly prices",
  "24-month, 12-month and 30-day contract options",
  "Keep your business numbers with a PAC transfer",
  "One line for sole traders, or talk to us about a team",
  "UK-based support by phone and email",
];

const FAQS = [
  { q: "Who can buy a business plan?", a: "Sole traders and businesses ordering mobile lines for their work. Talk to our team if you’re unsure which plan suits you." },
  { q: "How are prices shown?", a: "Each plan shows its monthly price per line for the contract length you choose." },
  { q: "Can I order several lines?", a: "Yes. Tell us how many lines you need and whether everyone needs the same plan, and we’ll prepare a quote." },
  { q: "Can I keep my business numbers?", a: "Yes. Text PAC to 65075 from each phone you’re moving, then add the codes to your order. Transfers normally complete within one working day of the switch request." },
  { q: "What contract information will I get?", a: "You’ll see your contract summary, including length and price, before you confirm your order." },
  { q: "Are international calls included?", a: "See each plan’s details for what’s included, and check roaming availability and charges before you travel." },
];

function PlanCard({ plan, duration, term, onChoose }: {
  plan: Plan; duration: Duration; term: string; onChoose: () => void;
}) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#f3dfe7] bg-white shadow-[0_10px_30px_rgba(20,26,69,0.08)]">
      <div className="flex items-center gap-2 bg-[#fdf1f5] px-5 py-3.5 text-sm font-bold text-[#C80F57]">
        <IconBriefcase />
        <span>{plan.name}</span>
        {plan.is_popular && (
          <span className="ml-auto rounded-full bg-[#C80F57] px-2.5 py-0.5 text-[11px] font-bold text-white">Most popular</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="text-center">
          {plan.data_allowance && (
            <div className="text-4xl font-extrabold tracking-tight text-[#0D382D]">{plan.data_allowance}</div>
          )}
          <div className="mt-1 text-4xl font-extrabold text-[#C80F57]">
            £{priceFor(plan, duration)}
            <span className="ml-1 text-base font-semibold text-[#141A45]">/month</span>
          </div>
          <p className="mt-1 text-[11px] text-[#7a7f96]">{term} contract</p>
        </div>

        <ul className="my-5 flex-1 space-y-2.5">
          {bullets(plan).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-[#141A45]">
              {f.toLowerCase().startsWith("eu roaming") ? <IconGlobe /> : <IconCheck />}<span>{f}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onChoose}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(200,15,87,0.3)] transition hover:-translate-y-px"
        >
          Choose plan <IconArrow />
        </button>
      </div>
    </article>
  );
}

/**
 * Business SIM-only plans
 */
export default function Buisinessdeal() {
  const { addPlanToCart } = useCart();
  const router = useRouter();

  const [duration, setDuration] = useState<Duration>("24 Month Plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (!res.ok) throw new Error("Failed to load plans");
        const data = await res.json();
        if (alive) setPlans(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [reloadKey]);

  const businessPlans = useMemo(() => plans.filter((p) => p.category?.slug === BUSINESS_SLUG), [plans]);
  const durationMeta = DURATIONS.find((d) => d.key === duration)!;

  // Same flow as before: add to cart -> /checkout.
  const handleBuyNow = (plan: Plan) => {
    addPlanToCart(plan);
    router.push("/checkout");
  };

  return (
    <div className="w-full bg-[#f8f9fa] font-sans text-[#141A45]">
      {/* ── Section 1: Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#f7f8f9] via-[#fafbfc] to-white pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            
            {/* Left Content Column */}
            <div className="flex flex-col items-start lg:col-span-6 xl:col-span-7">
              {/* Overline / Tagline */}
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs sm:text-sm lg:text-base font-extrabold uppercase tracking-[4.07px] text-[#141A45]">
                  Zoiko for Business
                </span>
                <div className="h-1 w-28 sm:w-32 rounded-full bg-[#FA2268]" />
              </div>

              {/* Main Heading */}
              <div className="pt-4 sm:pt-6">
                <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold leading-[1.08] tracking-tight">
                  <span className="block text-[#0D382D]">Business</span>
                  <span className="block text-[#C80F57]">SIM-only plans</span>
                </h1>
              </div>

              {/* Subheading 1 (Bold) */}
              <div className="pt-3 sm:pt-4">
                <p className="text-xl sm:text-2xl font-bold leading-snug text-[#141A45] max-w-xl">
                  Straightforward mobile plans for sole traders and growing teams.
                </p>
              </div>

              {/* Subheading 2 (Regular) */}
              <div className="pt-2 sm:pt-3">
                <p className="text-base sm:text-lg font-normal leading-relaxed text-[#4E5A8A] max-w-xl">
                  Clear per-line prices with and without VAT, a choice of contract length, and help from our team when you need more lines.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="pt-6 sm:pt-8 flex flex-wrap items-center gap-4 sm:gap-5">
                <Link
                  href="#plans"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] px-7 py-3.5 sm:px-8 sm:py-4 text-base sm:text-lg font-extrabold text-white shadow-[0px_12px_24px_-10px_rgba(200,15,87,0.60)] transition-all duration-200 hover:shadow-[0px_16px_30px_-8px_rgba(200,15,87,0.75)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Browse plans</span>
                  <svg
                    className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>

                <Link
                  href="/contact-us"
                  className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-[#FA2268] bg-white/90 px-7 py-3.5 sm:px-8 sm:py-4 text-base sm:text-lg font-extrabold text-[#C80F57] shadow-sm transition-all duration-200 hover:bg-rose-50/60 hover:border-[#C80F57] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Talk to sales</span>
                  <svg
                    className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right Photo Collage Column */}
            <div className="flex justify-center lg:col-span-6 xl:col-span-5 lg:justify-end">
              <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4.5">
                
                {/* Tall Card - Teams */}
                <div className="relative h-[380px] w-[260px] sm:h-[461px] sm:w-[298px] overflow-hidden rounded-3xl bg-white shadow-[0px_18px_40px_-24px_rgba(20,26,69,0.35)] shrink-0">
                  <Image
                    src="/images/business-sim-plans/Colleagues talking in a meeting.png"
                    alt="Teams"
                    fill
                    sizes="(max-width: 640px) 260px, 298px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    priority
                  />
                  {/* Badge */}
                  <div className="absolute left-3.5 bottom-3.5 sm:left-4 sm:bottom-4 rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] px-3.5 py-1.5 shadow-md">
                    <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                      Teams
                    </span>
                  </div>
                </div>

                {/* Right Stacked Column - Sole traders & Growing businesses */}
                <div className="flex flex-col gap-3.5 sm:gap-4.5">
                  {/* Top Card - Sole traders */}
                  <div className="relative h-[180px] w-[260px] sm:h-[220px] sm:w-[259px] overflow-hidden rounded-3xl bg-white shadow-[0px_18px_40px_-24px_rgba(20,26,69,0.35)] shrink-0">
                    <Image
                      src="/images/business-sim-plans/A small business owner at work.png"
                      alt="Sole traders"
                      fill
                      sizes="(max-width: 640px) 260px, 259px"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {/* Badge */}
                    <div className="absolute left-3.5 bottom-3.5 sm:left-4 sm:bottom-4 rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] px-3.5 py-1.5 shadow-md">
                      <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                        Sole traders
                      </span>
                    </div>
                  </div>

                  {/* Bottom Card - Growing businesses */}
                  <div className="relative h-[180px] w-[260px] sm:h-[220px] sm:w-[259px] overflow-hidden rounded-3xl bg-white shadow-[0px_18px_40px_-24px_rgba(20,26,69,0.35)] shrink-0">
                    <Image
                      src="/images/business-sim-plans/A team working together around laptops.png"
                      alt="Growing businesses"
                      fill
                      sizes="(max-width: 640px) 260px, 259px"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {/* Badge */}
                    <div className="absolute left-3.5 bottom-3.5 sm:left-4 sm:bottom-4 rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] px-3.5 py-1.5 shadow-md">
                      <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                        Growing businesses
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Bottom subtle divider ribbon */}
        <div className="relative mt-8 sm:mt-12 w-full overflow-hidden pointer-events-none">
          <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#FA2268] via-[#C80F57] to-[#FA2268] opacity-75" />
        </div>
      </section>

      {/* ── Section 2: Choose your business plan ── */}
      <section id="plans" className="scroll-mt-20 bg-gradient-to-b from-white to-[#fff5f8] px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0D382D] sm:text-5xl">Choose your business plan</h2>
            <p className="mt-3 text-base text-[#141A45]">Three plans, priced per line. Pick a contract length to see the price per line.</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#141A45]">
              <span className="text-[#C80F57]"><IconCalendar /></span>
              Choose your contract length
            </div>
            <div className="inline-flex rounded-full border border-[#eceaf3] bg-white p-1 shadow-sm" role="tablist" aria-label="Contract length">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={duration === d.key}
                  onClick={() => setDuration(d.key)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                    duration === d.key ? "bg-gradient-to-r from-[#FA2268] to-[#C80F57] text-white" : "text-[#141A45] hover:text-[#C80F57]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {!loading && !error && businessPlans.length > 0 && (
              <p className="mb-3 text-xs font-bold text-[#141A45]">
                {businessPlans.length} plans · {durationMeta.label} · prices per line
              </p>
            )}

            {loading && (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C80F57] border-t-transparent" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                <span>{error}</span>
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-full border border-red-500 px-3 py-1 text-sm font-semibold">Retry</button>
              </div>
            )}
            {!loading && !error && businessPlans.length > 0 && (
              <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
                {businessPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    duration={duration}
                    term={durationMeta.term}
                    onChoose={() => handleBuyNow(plan)}
                  />
                ))}
              </div>
            )}
            {!loading && !error && businessPlans.length === 0 && (
              <p className="text-center text-[#4E5A8A]">No business plans available yet.</p>
            )}

          </div>
        </div>
      </section>

      {/* ── Section 3: Why Zoiko for Business ── */}
      <section className="px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-block border-b-4 border-[#FA2268] pb-1 text-xs font-extrabold uppercase tracking-[0.25em] text-[#141A45]">Why Zoiko for business</span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-[#0D382D] sm:text-4xl">Simple to buy, clear to budget</h2>
            <ul className="mt-5 space-y-2.5">
              {WHY_POINTS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-[#141A45]"><IconCheck /><span>{t}</span></li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-[#141A45]">We only list features we can currently provide.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl border border-[#f3dfe7] bg-white p-5 shadow-[0_8px_24px_rgba(20,26,69,0.06)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fde4ee] text-[#C80F57]"><IconSwap /></span>
              <div>
                <h3 className="font-extrabold text-[#0D382D]">Keep your numbers</h3>
                <p className="mt-1 text-sm text-[#4E5A8A]">Text PAC to 65075 from each phone you’re moving, then add the codes to your order. Transfers normally complete within one working day of the switch request.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-[#f3dfe7] bg-white p-5 shadow-[0_8px_24px_rgba(20,26,69,0.06)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fde4ee] text-[#C80F57]"><IconTeam /></span>
              <div>
                <h3 className="font-extrabold text-[#0D382D]">Ordering for a team?</h3>
                <p className="mt-1 text-sm text-[#4E5A8A]">Tell us how many lines you need and whether everyone needs the same plan. We’ll prepare a quote — no payment needed to ask.</p>
                <a href="tel:02071646399" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#C80F57] hover:underline">Request a team quote <IconArrow /></a>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-[#f3dfe7] bg-white p-5 shadow-[0_8px_24px_rgba(20,26,69,0.06)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fde4ee] text-[#C80F57]"><IconHeadset /></span>
              <div>
                <h3 className="font-extrabold text-[#0D382D]">Talk to our team</h3>
                <p className="mt-1 text-sm text-[#4E5A8A]">
                  Phone <a href="tel:02071646399" className="font-semibold text-[#C80F57] underline">020 7164 6399</a> or email{" "}
                  <a href="mailto:help@zoikomobile.co.uk" className="font-semibold text-[#C80F57] underline">help@zoikomobile.co.uk</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: FAQs ── */}
      <section className="bg-gradient-to-b from-white to-[#fff5f8] px-4 pb-20 pt-10 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight text-[#0D382D] sm:text-4xl">Business plan questions</h2>
            <p className="mt-3 text-sm text-[#141A45]">Information updated 12 November 2026.</p>
          </div>
          <div className="rounded-2xl border border-[#f3dfe7] bg-white px-6 py-2 shadow-[0_8px_24px_rgba(20,26,69,0.06)]">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-[#eef0f6] last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-bold text-[#141A45] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-[#C80F57] transition-transform group-open:-rotate-[135deg]" />
                </summary>
                <p className="pb-4 text-sm text-[#4E5A8A]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export { Buisinessdeal };

/*
// =============================================================================
// PREVIOUS IMPLEMENTATION (COMMENTED OUT FOR REFERENCE)
// =============================================================================

// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
// const BUSINESS_SLUG = "zoiko-sim-only-business-deals";

// type Duration = "24 Month Plan" | "12 Month Plan" | "30 Day Plan";
// const DURATIONS: Duration[] = ["24 Month Plan", "12 Month Plan", "30 Day Plan"];

// interface Feature {
//   id: number;
//   title: string;
// }
// interface Category {
//   id: number;
//   name: string;
//   slug: string;
// }
// interface Plan {
//   id: number;
//   name: string;
//   slug: string;
//   short_description: string | null;
//   price: string;
//   price_24: string | null;
//   price_12: string | null;
//   price_30: string | null;
//   data_allowance: string | null;
//   tier_label: string | null;
//   is_popular: boolean;
//   category: Category | null;
//   features: Feature[];
// }

// function priceFor(plan: Plan, duration: Duration): string {
//   const raw =
//     duration === "24 Month Plan" ? plan.price_24 :
//     duration === "12 Month Plan" ? plan.price_12 :
//     plan.price_30;
//   return Number(raw ?? plan.price).toFixed(2);
// }

// function bullets(plan: Plan): string[] {
//   if (plan.features.length > 0) return plan.features.map((f) => f.title);
//   if (!plan.short_description) return [];
//   return plan.short_description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
// }

// function tierClasses(tier: string | null): string {
//   switch ((tier || "").toUpperCase()) {
//     case "ESSENTIAL": return "bg-teal-500 text-white";
//     case "PROFESSIONAL": return "bg-[#e6007e] text-white";
//     case "ENTERPRISE": return "bg-yellow-400 text-gray-900";
//     default: return "bg-gray-200 text-gray-700";
//   }
// }

// const GreenCheck = () => (
//   <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
//     <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
//       <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
//     </svg>
//   </span>
// );

// const WarnIcon = () => (
//   <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-900">!</span>
// );

// function FeatureRow({ text }: { text: string }) {
//   const isRoaming = text.toLowerCase().startsWith("eu roaming");
//   return (
//     <li className="flex items-start gap-2 border-b border-gray-100 pb-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
//       {isRoaming ? <WarnIcon /> : <GreenCheck />}
//       <span>{text}</span>
//     </li>
//   );
// }

// function PlanCard({ plan, duration }: { plan: Plan; duration: Duration }) {
//     const { addPlanToCart } = useCart();
//     const router = useRouter();
//   
//     const handleBuyNow = (plan: Plan) => {
//       addPlanToCart(plan);
//       router.push("/checkout");
//     };
//   return (
//     <div
//       className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${
//         plan.is_popular ? "border-2 border-yellow-400" : "border border-gray-100 dark:border-gray-700"
//       }`}
//     >
//       {plan.is_popular && (
//         <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e6007e] px-3 py-0.5 text-xs font-semibold text-white">
//           Most Popular
//         </span>
//       )}

//       <div className="flex min-h-[110px] flex-col items-center justify-center gap-3 text-center">
//         <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
//         {plan.tier_label && (
//           <span className={`inline-block rounded-full px-4 py-1 text-xs font-bold ${tierClasses(plan.tier_label)}`}>
//             {plan.tier_label}
//           </span>
//         )}
//       </div>

//       <div className="my-5 flex min-h-[140px] flex-col justify-center rounded-xl bg-gray-50 py-6 text-center dark:bg-gray-900">
//         {plan.data_allowance && (
//           <>
//             <div className="text-3xl font-extrabold text-yellow-400">{plan.data_allowance}</div>
//             <div className="text-xs tracking-wide text-gray-400">DATA</div>
//           </>
//         )}
//         <div className="mt-3 text-2xl font-bold text-[#e6007e]">£{priceFor(plan, duration)}</div>
//         <div className="text-xs text-gray-400">per month</div>
//       </div>

//       <ul className="mb-6 flex-1 space-y-3">
//         {bullets(plan).map((f, i) => (
//           <FeatureRow key={i} text={f} />
//         ))}
//       </ul>

//       <div className="mt-auto space-y-2">
//         <button onClick={() => handleBuyNow(plan)} className="w-full rounded-md bg-[#e6007e] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
//           BUY THIS PLAN
//         </button>
//       </div>
//     </div>
//   );
// }

// const IconShield = () => (
//   <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
//   </svg>
// );
// const IconSupport = () => (
//   <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <circle cx="9" cy="8" r="3" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19a5.5 5.5 0 0111 0" />
//     <circle cx="17.5" cy="9.5" r="2" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a4 4 0 015.5-3.7" />
//   </svg>
// );
// const IconGear = () => (
//   <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <circle cx="12" cy="12" r="3" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
//   </svg>
// );
// const IconChart = () => (
//   <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16l4-5 3 3 4-6" />
//   </svg>
// );

// const WHY = [
//   { icon: <IconShield />, title: "Enterprise Security", text: "Advanced security features and encrypted connections for your business data" },
//   { icon: <IconSupport />, title: "Dedicated Support", text: "Priority customer support with dedicated business account managers" },
//   { icon: <IconGear />, title: "Flexible Management", text: "Easy-to-use business portal for managing multiple lines and billing" },
//   { icon: <IconChart />, title: "Usage Analytics", text: "Detailed usage reports and analytics to optimize your business connectivity" },
// ];

// function OldBuisinessdeal() {
//   const [duration, setDuration] = useState<Duration>("24 Month Plan");
//   const [plans, setPlans] = useState<Plan[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/api/plans/v1/`);
//         if (!res.ok) throw new Error("Failed to load plans");
//         setPlans(await res.json());
//       } catch (e) {
//         setError(e instanceof Error ? e.message : "Failed to load plans");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const Buisinessdeal = useMemo(
//     () => plans.filter((p) => p.category?.slug === BUSINESS_SLUG),
//     [plans]
//   );

//   return (
//     <div className="bg-gray-50 dark:bg-gray-900">
//       <div className="bg-gradient-to-r from-green-600 to-teal-500 py-8 px-4 text-center">
//         <h1 className="text-2xl font-bold text-white sm:text-3xl">Business SIM Only Plans</h1>
//       </div>
//       <div className="px-4 pt-12 text-center">
//         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Select Contract Duration</h2>
//         <span className="mt-2 inline-block h-1 w-16 rounded bg-green-500" />
//       </div>
//       <div className="mb-10 mt-8 flex justify-center px-4">
//         <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
//           {DURATIONS.map((d) => (
//             <button
//               key={d}
//               type="button"
//               onClick={() => setDuration(d)}
//               className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
//                 duration === d
//                   ? "bg-yellow-400 text-gray-900"
//                   : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//               }`}
//             >
//               {d}
//             </button>
//           ))}
//         </div>
//       </div>
//       <div className="bg-gray-100 px-4 py-12 dark:bg-gray-800">
//         <div className="mx-auto max-w-5xl">
//           {loading && (
//             <div className="flex justify-center py-10">
//               <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status">
//                 <span className="sr-only">Loading...</span>
//               </div>
//             </div>
//           )}
//           {error && (
//             <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
//           )}
//           {!loading && !error && Buisinessdeal.length > 0 && (
//             <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
//               {Buisinessdeal.map((plan) => (
//                 <PlanCard key={plan.id} plan={plan} duration={duration} />
//               ))}
//             </div>
//           )}
//           {!loading && !error && Buisinessdeal.length === 0 && (
//             <p className="text-center text-gray-500">No business plans available yet.</p>
//           )}
//         </div>
//       </div>
//       <section className="px-4 py-16">
//         <div className="mx-auto max-w-5xl">
//           <div className="mb-12 text-center">
//             <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">Why Choose Zoiko Business?</h2>
//             <span className="mt-2 inline-block h-1 w-16 rounded bg-green-500" />
//           </div>
//           <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//             {WHY.map((w) => (
//               <div key={w.title} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
//                 <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-teal-500">
//                   {w.icon}
//                 </div>
//                 <h3 className="mb-2 font-bold text-gray-800 dark:text-white">{w.title}</h3>
//                 <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">{w.text}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
*/

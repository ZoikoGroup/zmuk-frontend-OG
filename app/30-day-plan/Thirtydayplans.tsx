"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

type SortKey = "data" | "price";
const MAX_COMPARE = 3;

// Match a plan's category by keywords in its name OR slug (tolerant to slug spelling).
function catMatch(p: Plan, ...keywords: string[]): boolean {
  const hay = `${p.category?.name ?? ""} ${p.category?.slug ?? ""}`.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

// Same price rule as before: 30-day price first.
function monthlyNumber(plan: Plan): number {
  return Number(plan.price_30 ?? plan.price_12 ?? plan.price);
}
const monthly = (plan: Plan) => monthlyNumber(plan).toFixed(2);

function gbValue(plan: Plan): number {
  const a = (plan.data_allowance ?? "").toLowerCase();
  if (a.includes("unlimited")) return Number.POSITIVE_INFINITY;
  const m = a.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

function bullets(plan: Plan): string[] {
  if (plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

// ── icons ──────────────────────────────────────────────────────────────────
const Svg = ({ className = "h-5 w-5", children }: { className?: string; children: React.ReactNode }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconArrow = () => <Svg className="h-4 w-4"><path d="M9 6l6 6-6 6" /></Svg>;
const IconCheck = () => <Svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0d4a33]"><path d="M5 12l5 5 9-10" /></Svg>;
const IconCalendar = () => <Svg><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>;
const IconPlan = () => <Svg className="h-4 w-4"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></Svg>;
const IconTag = () => <Svg><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></Svg>;
const IconDoc = () => <Svg><path d="M6 3h9l4 4v14H6z" /><path d="M9 13h6M9 17h6" /></Svg>;
const IconSignal = () => <Svg><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5a6 6 0 000 9M16.5 7.5a6 6 0 010 9M4.5 4.5a10 10 0 000 15M19.5 4.5a10 10 0 010 15" /></Svg>;
const IconSwap = () => <Svg><path d="M4 8h13l-3-3M20 16H7l3 3" /></Svg>;
const IconHeadset = () => <Svg><path d="M4 13v-1a8 8 0 1116 0v1" /><rect x="3" y="13" width="4" height="6" rx="1" /><rect x="17" y="13" width="4" height="6" rx="1" /></Svg>;
const IconLayers = () => <Svg><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></Svg>;
const IconInfo = () => <Svg className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></Svg>;

// ── static (non-plan) page copy ────────────────────────────────────────────
const HOW_STEPS = [
  { n: "01", title: "Choose your plan", text: "Pick your data allowance. Each 30-day period includes the same allowance." },
  { n: "02", title: "Keep or get your number", text: "Bring your number with a PAC — text PAC to 65075 — or get a new Zoiko number." },
  { n: "03", title: "Activate your SIM or eSIM", text: "Use a physical SIM, or eSIM on a compatible, unlocked phone where available." },
];

const HOW_POINTS = [
  { icon: <IconCalendar />, title: "30-day commitment", text: "Each plan runs for 30 days and then renews. You’ll see the exact renewal and notice terms before you join." },
  { icon: <IconTag />, title: "Clear prices", text: "Prices include VAT and are shown per 30 days. Any upfront charge or future price change is shown in pounds and pence." },
  { icon: <IconDoc />, title: "Contract information first", text: "You’ll see your contract summary and information before you agree." },
];

const HELP_LINKS = [
  { href: "/coverage-checker", label: "Check coverage", icon: <IconSignal /> },
  { href: "/switch-and-save", label: "Keep your number", icon: <IconSwap /> },
  { href: "/contact-us", label: "Contact our team", icon: <IconHeadset /> },
  { href: "/plans", label: "All SIM-only plans", icon: <IconLayers /> },
];

const FAQS = [
  { q: "What does “30-day” mean?", a: "Your plan runs for 30 days and then renews. The renewal and notice terms for each plan are shown before you join." },
  { q: "How do I cancel, and how much notice is needed?", a: "Notice and cancellation terms are shown in each plan’s details and in your contract summary before you agree." },
  { q: "What happens to unused allowance?", a: "See the plan details for what applies to any allowance left at the end of each 30-day period." },
  { q: "Can I keep my number?", a: "Yes. You can bring your number with a PAC code, or get a new Zoiko number." },
  { q: "Will it work where I am?", a: "Use the coverage checker to see the network where you live, work or travel." },
  { q: "Can I use eSIM?", a: "eSIM is available on compatible, unlocked phones where offered. Check the plan details and your device first." },
  { q: "Can my price change?", a: "Any upfront charge or future price change is shown in pounds and pence before you join." },
];

const img = (name: string) => encodeURI(`/images/30-day-only-plans/${name}`);

// ─────────────────────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({
  plan, badge, compared, compareDisabled, onToggleCompare, onBuyNow,
}: {
  plan: Plan; badge?: string;
  compared: boolean; compareDisabled: boolean;
  onToggleCompare: () => void; onBuyNow: (plan: Plan) => void;
}) {
  const [open, setOpen] = useState(false);
  const list = bullets(plan);
  const shown = open ? list : list.slice(0, 4);

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#ece9f2] bg-white p-5 shadow-[0_8px_28px_rgba(20,25,74,0.07)]">
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-24 bg-gradient-to-bl from-[#ffd9bf]/70 to-transparent" aria-hidden="true" />
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg bg-[#fde8ef] px-3 py-1.5 text-xs font-bold text-[#d10f5b]">
          <IconPlan />{plan.name}
        </span>
        {badge && (
          <span className="rounded-full bg-[#d10f5b] px-2.5 py-0.5 text-[11px] font-bold text-white">{badge}</span>
        )}
      </div>

      <div className="text-center">
        {plan.data_allowance && (
          <div className="text-4xl font-extrabold tracking-tight text-[#0d4a33]">{plan.data_allowance}</div>
        )}
        <div className="mt-2 text-3xl font-extrabold text-[#d10f5b]">
          £{monthly(plan)}
          <span className="ml-1 text-sm font-semibold text-[#5b6078]">/30 days</span>
        </div>
        <p className="mt-1 text-[11px] text-[#7a7f96]">incl. VAT · 30-day plan, renews every 30 days</p>
      </div>

      <ul className="my-5 flex-1 space-y-2.5 border-t border-[#eef0f6] pt-4">
        {shown.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-[#14194a]">
            <IconCheck /><span>{f}</span>
          </li>
        ))}
        {open && plan.short_description && plan.features.length > 0 && (
          <li className="pt-1 text-[12px] leading-snug text-[#5b6078]">{plan.short_description}</li>
        )}
      </ul>

      <button
        type="button"
        onClick={() => onBuyNow(plan)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#e0176a] to-[#b00c4d] py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(209,15,91,0.28)] transition hover:-translate-y-px"
      >
        Choose plan <IconArrow />
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#d10f5b] bg-white py-2.5 text-sm font-bold text-[#d10f5b] transition hover:bg-[#fff0f5]"
      >
        {open ? "Hide plan details" : "Full plan details"} <IconArrow />
      </button>

      <label className={`mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#5b6078] ${compareDisabled && !compared ? "opacity-50" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          checked={compared}
          disabled={compareDisabled && !compared}
          onChange={onToggleCompare}
          className="h-4 w-4 accent-[#d10f5b]"
        />
        Compare
      </label>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare dialog
// ─────────────────────────────────────────────────────────────────────────────
function CompareDialog({
  plans, onClose, onChoose,
}: { plans: Plan[]; onClose: () => void; onChoose: (p: Plan) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compare 30-day plans"
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#0d4a33]">Compare plans · 30-day</h2>
          <button type="button" onClick={onClose} aria-label="Close comparison" className="rounded-lg px-3 py-1 text-xl text-[#5b6078] hover:bg-[#f1f3f9]">✕</button>
        </div>
        <div className={`grid gap-4 ${plans.length === 3 ? "md:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : ""}`}>
          {plans.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-[#ece9f2] p-4">
              <h3 className="text-sm font-bold text-[#d10f5b]">{p.name}</h3>
              <div className="mt-1 text-3xl font-extrabold text-[#0d4a33]">{p.data_allowance}</div>
              <div className="text-xl font-extrabold text-[#d10f5b]">£{monthly(p)}<span className="ml-1 text-xs font-semibold text-[#5b6078]">/30 days</span></div>
              <ul className="my-3 flex-1 space-y-2">
                {bullets(p).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#14194a]"><IconCheck /><span>{f}</span></li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onChoose(p)}
                className="rounded-xl bg-gradient-to-br from-[#e0176a] to-[#b00c4d] py-2.5 text-sm font-bold text-white"
              >
                Choose plan
              </button>
            </div>
          ))}
        </div>
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
  const [reloadKey, setReloadKey] = useState(0);
  const { addPlanToCart } = useCart();
  const router = useRouter();

  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);
  const [sort, setSort] = useState<SortKey>("data");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const handleBuyNow = (plan: Plan) => {
    setSimTypePlan(plan);
  };

  // Same flow as before: pick SIM type -> add to cart -> /checkout.
  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(simTypePlan, simType);
    setSimTypePlan(null);
    router.push("/checkout");
  };

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

  // Only the 30-day / no-contract plans are shown on this page.
  const noContract = useMemo(() => plans.filter((p) => catMatch(p, "no contract", "no-contract", "30-day")), [plans]);

  const sortedPlans = useMemo(() => {
    const list = [...noContract];
    list.sort((a, b) => (sort === "data" ? gbValue(a) - gbValue(b) : monthlyNumber(a) - monthlyNumber(b)));
    return list;
  }, [noContract, sort]);

  const comparedPlans = sortedPlans.filter((p) => compareIds.includes(p.id));
  const toggleCompare = (id: number) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev
    );

  return (
    <div className="bg-[#f7f7fb] font-sans text-[#14194a]">
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}
      {showCompare && comparedPlans.length > 1 && (
        <CompareDialog
          plans={comparedPlans}
          onClose={() => setShowCompare(false)}
          onChoose={(p) => { setShowCompare(false); setSimTypePlan(p); }}
        />
      )}

      {/* ── Hero ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#fff3f7] via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-20 pt-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-block border-b-4 border-[#d10f5b] pb-2 text-xs font-extrabold uppercase tracking-[0.25em]">
              Shorter commitments. Your choice.
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0d4a33] sm:text-5xl">
              30-Day Flexible <span className="block text-[#d10f5b]">SIM-Only Plans</span>
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold">
              Choose a SIM-only plan with a 30-day commitment.
            </p>
            <p className="mt-2 max-w-md text-sm text-[#5b6078]">
              See your data, price and terms clearly before you join.
            </p>
            <div className="mt-6 flex flex-col items-start gap-3">
              <a href="#plans" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#e0176a] to-[#b00c4d] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(209,15,91,0.28)]">
                View 30-day plans <IconArrow />
              </a>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border-2 border-[#d10f5b] bg-white px-6 py-3 text-sm font-bold text-[#d10f5b] hover:bg-[#fff0f5]">
                How 30-day plans work <IconArrow />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-2 gap-3">
            <div className="relative row-span-2 min-h-[280px] overflow-hidden rounded-2xl shadow-lg">
              <Image src={img("People using their smartphones.png")} alt="Smartphones on a desk" fill sizes="(min-width:768px) 22vw, 50vw" className="object-cover" priority />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d10f5b] px-3 py-1 text-xs font-bold text-white">Your plan</span>
            </div>
            <div className="relative min-h-[134px] overflow-hidden rounded-2xl shadow-lg">
              <Image src={img("A person holding a smartphone.png")} alt="A person holding a smartphone" fill sizes="(min-width:768px) 16vw, 50vw" className="object-cover" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d10f5b] px-3 py-1 text-xs font-bold text-white">Your number</span>
            </div>
            <div className="relative min-h-[134px] overflow-hidden rounded-2xl shadow-lg">
              <Image src={img("A smartphone on a desk.png")} alt="People using their smartphones" fill sizes="(min-width:768px) 16vw, 50vw" className="object-cover" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d10f5b] px-3 py-1 text-xs font-bold text-white">SIM or eSIM</span>
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="d30-swoosh" x1="0" x2="1">
              <stop offset="0" stopColor="#ff7a45" /><stop offset="0.5" stopColor="#d10f5b" /><stop offset="1" stopColor="#c2105a" />
            </linearGradient>
          </defs>
          <path d="M0 58 C 420 40, 900 10, 1440 6 L1440 18 C 900 22, 420 52, 0 60 Z" fill="url(#d30-swoosh)" />
        </svg>
      </header>

      {/* ── Plans ── */}
      <section id="plans" className="bg-gradient-to-b from-white to-[#fff6f9] px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#0d4a33] sm:text-4xl">Choose your 30-day plan</h2>
          <p className="mt-2 text-center text-sm text-[#5b6078]">
            The same SIM-only plans as our full range — on a 30-day commitment.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold"><IconCalendar />Choose your contract length</span>
            <div className="inline-flex rounded-full border border-[#e6e8f0] bg-white p-1 shadow-sm">
              <Link href="/plans" className="rounded-full px-5 py-2 text-sm font-bold text-[#5b6078] hover:text-[#14194a]">24 months</Link>
              <Link href="/plans" className="rounded-full px-5 py-2 text-sm font-bold text-[#5b6078] hover:text-[#14194a]">12 months</Link>
              <span aria-current="true" className="rounded-full bg-[#d10f5b] px-5 py-2 text-sm font-bold text-white">30 days</span>
            </div>
          </div>
          <p className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 rounded-full border border-[#bfe6cf] bg-[#effaf3] px-4 py-2 text-xs font-bold text-[#0d4a33]">
            <IconInfo />30-day option selected. Renewals and cancellation terms are shown with each plan.
          </p>

          {!loading && !error && sortedPlans.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#5b6078]">{sortedPlans.length} plans · 30 days</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#7a7f96]">Sort by</span>
                {([["data", "Data: low to high"], ["price", "Price: low to high"]] as [SortKey, string][]).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={sort === k}
                    onClick={() => setSort(k)}
                    className={`rounded-full border px-3 py-1.5 font-bold ${sort === k ? "border-[#d10f5b] bg-[#fff0f5] text-[#d10f5b]" : "border-[#e6e8f0] bg-white text-[#5b6078]"}`}
                  >
                    {l}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={comparedPlans.length < 2}
                  onClick={() => setShowCompare(true)}
                  className="rounded-full bg-[#14194a] px-3 py-1.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Compare selected ({comparedPlans.length}/{MAX_COMPARE})
                </button>
              </div>
            </div>
          )}

          <div className="mt-6" aria-live="polite">
            {loading && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3" role="status">
                <span className="sr-only">Checking the latest plan details…</span>
                {[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-white shadow" />)}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-center text-red-700">
                <p>{error}</p>
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-2 rounded-full border-2 border-[#d10f5b] px-4 py-1.5 text-sm font-bold text-[#d10f5b]">
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && sortedPlans.length > 0 && (
              <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
                {sortedPlans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    badge={p.is_popular ? "Best Value" : undefined}
                    compared={compareIds.includes(p.id)}
                    compareDisabled={compareIds.length >= MAX_COMPARE}
                    onToggleCompare={() => toggleCompare(p.id)}
                    onBuyNow={handleBuyNow}
                  />
                ))}
              </div>
            )}
            {!loading && !error && sortedPlans.length === 0 && (
              <p className="text-center text-[#5b6078]">No 30-day plans available yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── How 30-day plans work ── */}
      <section id="how" className="px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d10f5b]">How 30-day plans work</p>
            <span className="mt-2 block h-[3px] w-10 rounded bg-[#d10f5b]" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#0d4a33]">A plan that runs 30 days at a time</h2>
            <p className="mt-3 text-sm text-[#5b6078]">
              Your plan renews every 30 days. The renewal, notice and cancellation terms for each plan are shown before you join, in the plan details and in your contract summary.
            </p>
            <ol className="mt-6 space-y-5">
              {HOW_STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d10f5b] text-xs font-extrabold text-white">{s.n}</span>
                  <div>
                    <h3 className="text-sm font-extrabold">{s.title}</h3>
                    <p className="text-[13px] leading-snug text-[#5b6078]">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/switch-and-save" className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[#d10f5b] bg-white px-5 py-2.5 text-sm font-bold text-[#d10f5b] hover:bg-[#fff0f5]">
              How switching works <IconArrow />
            </Link>
          </div>

          <div className="space-y-4 self-center">
            {HOW_POINTS.map((p) => (
              <div key={p.title} className="flex gap-4 rounded-2xl border border-[#ece9f2] bg-white p-5 shadow-[0_8px_28px_rgba(20,25,74,0.06)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fde4ee] text-[#d10f5b]">{p.icon}</span>
                <div>
                  <h3 className="text-sm font-extrabold">{p.title}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-[#5b6078]">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── We're here to help ── */}
      <section className="bg-gradient-to-b from-[#fff6f9] to-white px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d10f5b]">Help choosing?</p>
          <span className="mx-auto mt-2 block h-[3px] w-10 rounded bg-[#d10f5b]" aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0d4a33] sm:text-4xl">We&rsquo;re here to help</h2>
          <nav aria-label="Help" className="mt-8 grid rounded-2xl border border-[#ece9f2] bg-[#fff0f5] text-sm font-bold sm:grid-cols-4 sm:divide-x sm:divide-[#eceef6]">
            {HELP_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-center gap-2 px-4 py-4 text-[#14194a] hover:text-[#d10f5b]">
                <span className="text-[#d10f5b]">{l.icon}</span>{l.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 pb-20 pt-6">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0d4a33]">How do 30-day plans work?</h2>
            <p className="mt-2 text-sm text-[#5b6078]">Information updated 11 November 2026.</p>
          </div>
          <div className="rounded-2xl border border-[#ece9f2] bg-white px-6 py-2 shadow-[0_8px_28px_rgba(20,25,74,0.06)]">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-[#eef0f6] last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-[#d10f5b] transition-transform group-open:-rotate-[135deg]" aria-hidden="true" />
                </summary>
                <p className="pb-4 text-[13px] leading-relaxed text-[#5b6078]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ThirtyDayPlans;
export { ThirtyDayPlans };

/*
=============================================================================
PREVIOUS 30-DAY PLANS IMPLEMENTATION (commented out, kept for reference)
=============================================================================
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
        </button> * /}
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

      {/* Hero * /}
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
            {/* 30-Day No Contract * /}
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

            {/* Data-Only SIM (slider) * /}
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

            {/* Roaming * /}
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

        {/* Testimonial * /}
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
*/

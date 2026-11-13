"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const DATA_SLUG = "data-only-plans";

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

type SortKey = "data" | "price";
const MAX_COMPARE = 3;

// ── helpers (all values come from the plans API) ───────────────────────────
function priceNumber(plan: Plan, duration: Duration): number {
  const raw =
    duration === "24 Month Plan" ? plan.price_24 :
    duration === "12 Month Plan" ? plan.price_12 :
    plan.price_30;
  return Number(raw ?? plan.price);
}
const priceFor = (plan: Plan, duration: Duration) => priceNumber(plan, duration).toFixed(2);

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

// ── small icons ────────────────────────────────────────────────────────────
type IconProps = { className?: string };
const Svg = ({ className = "h-5 w-5", children }: IconProps & { children: React.ReactNode }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconArrow = () => <Svg className="h-4 w-4"><path d="M9 6l6 6-6 6" /></Svg>;
const IconCheck = () => <Svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0d4a33]"><path d="M5 12l5 5 9-10" /></Svg>;
const IconCalendar = () => <Svg><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>;
const IconData = () => <Svg className="h-4 w-4"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Svg>;
const IconTablet = () => <Svg><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M11 18h2" /></Svg>;
const IconLaptop = () => <Svg><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 20h20" /></Svg>;
const IconWifi = () => <Svg><path d="M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0" /><circle cx="12" cy="19" r="1" /></Svg>;
const IconRouter = () => <Svg><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 17h.01M11 17h.01M8 14l-2-8M16 14l2-8" /></Svg>;
const IconMail = () => <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>;
const IconGlobe = () => <Svg><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Svg>;
const IconSignal = () => <Svg><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5a6 6 0 000 9M16.5 7.5a6 6 0 010 9M4.5 4.5a10 10 0 000 15M19.5 4.5a10 10 0 010 15" /></Svg>;
const IconRefresh = () => <Svg><path d="M21 12a9 9 0 00-15-6.7L3 8M3 3v5h5M3 12a9 9 0 0015 6.7L21 16M21 21v-5h-5" /></Svg>;
const IconBriefcase = () => <Svg><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></Svg>;

// ── static (non-plan) page copy ────────────────────────────────────────────
const DEVICES = [
  {
    key: "tablet", label: "Tablet", icon: <IconTablet />, title: "Tablets",
    text: "Use a cellular (4G/5G) tablet that’s unlocked. Check whether it takes a nano SIM or eSIM.",
    points: ["Wi-Fi-only tablets can’t use a mobile SIM", "Light browsing and video calls suit a smaller allowance"],
  },
  {
    key: "laptop", label: "Laptop", icon: <IconLaptop />, title: "Laptops",
    text: "Use a laptop with a built-in cellular modem, or connect through a mobile Wi-Fi device.",
    points: ["Most laptops need a modem or hotspot to use a SIM", "Larger downloads and video meetings use more data"],
  },
  {
    key: "mifi", label: "Mobile Wi-Fi", icon: <IconWifi />, title: "Mobile Wi-Fi",
    text: "A pocket Wi-Fi device shares one connection with several devices at once.",
    points: ["Check the device is unlocked to any network", "More connected devices means faster data use"],
  },
  {
    key: "router", label: "Router", icon: <IconRouter />, title: "Routers",
    text: "Use an unlocked 4G/5G router to share a connection at home or on the move.",
    points: ["Check the router has a SIM slot and is unlocked", "Heavy streaming and gaming use the most data"],
  },
];
const DEVICE_NOTE = "This is guidance, not a guarantee of compatibility. APN, bands and tethering policy — technical policy registry.";

const CHECKS = [
  { n: "01", title: "Is it a cellular model?", text: "Wi-Fi-only tablets and laptops can’t take a mobile SIM. Look for “Cellular”, “4G” or “5G” in the model name." },
  { n: "02", title: "Is it unlocked?", text: "Devices locked to another network won’t accept a Zoiko SIM." },
  { n: "03", title: "Physical SIM or eSIM?", text: "Check which your device supports. eSIM availability depends on the plan and is confirmed before you pay." },
];

const STEPS = [
  { n: "1", title: "Choose your plan", text: "Pick your data allowance and contract length." },
  { n: "2", title: "Confirm SIM and terms", text: "Choose physical SIM or eSIM where available, and check your contract summary." },
  { n: "3", title: "Order and activate", text: "Pop the SIM in your device and follow the activation steps. We’ll track each stage for you." },
];

const FAQS = [
  { q: "What is a data-only SIM?", a: "A data-only SIM gives you mobile data for a compatible device, such as a tablet, laptop or mobile Wi-Fi device. Calls and texts aren’t part of these plans unless a plan’s details say otherwise." },
  { q: "Will it work in my tablet?", a: "It will if your tablet is a cellular (4G/5G) model and is unlocked. Wi-Fi-only tablets can’t use a mobile SIM." },
  { q: "Can I use it in a Wi-Fi router?", a: "Yes, in an unlocked 4G/5G router with a SIM slot. Check your router’s details before you order." },
  { q: "Can it make calls or send texts?", a: "Data-only plans are designed for mobile data. See each plan’s details for exactly what is included." },
  { q: "What happens when my data runs out?", a: "See the plan details for what applies once your allowance is used. You can also top up from the Top up page." },
  { q: "Can I keep my existing number?", a: "Data-only SIMs are for connecting devices to mobile data. If you want to bring a mobile number across, see Switch & Save." },
];

const img = (name: string) => encodeURI(`/images/data-only-plans/${name}`);

// ─────────────────────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({
  plan, duration, term, compared, compareDisabled, onToggleCompare, onChoose,
}: {
  plan: Plan; duration: Duration; term: string;
  compared: boolean; compareDisabled: boolean;
  onToggleCompare: () => void; onChoose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const list = bullets(plan);
  const shown = open ? list : list.slice(0, 4);

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#ece9f2] bg-white p-5 shadow-[0_8px_28px_rgba(20,25,74,0.07)]">
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-24 bg-gradient-to-bl from-[#ffd9bf]/70 to-transparent" aria-hidden="true" />
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg bg-[#fde8ef] px-3 py-1.5 text-xs font-bold text-[#d10f5b]">
          <IconData />{plan.name}
        </span>
        {plan.is_popular && (
          <span className="rounded-full bg-[#d10f5b] px-2.5 py-0.5 text-[11px] font-bold text-white">Most popular</span>
        )}
      </div>

      <div className="text-center">
        {plan.data_allowance && (
          <div className="text-4xl font-extrabold tracking-tight text-[#0d4a33]">{plan.data_allowance}</div>
        )}
        <div className="mt-2 text-3xl font-extrabold text-[#d10f5b]">
          £{priceFor(plan, duration)}
          <span className="ml-1 text-sm font-semibold text-[#5b6078]">/month</span>
        </div>
        <p className="mt-1 text-[11px] text-[#7a7f96]">incl. VAT · {term} contract</p>
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
        onClick={onChoose}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#e0176a] to-[#b00c4d] py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(209,15,91,0.28)] transition hover:-translate-y-px"
      >
        Choose this plan <IconArrow />
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
  plans, duration, term, onClose, onChoose,
}: { plans: Plan[]; duration: Duration; term: string; onClose: () => void; onChoose: (p: Plan) => void }) {
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
        aria-label="Compare data plans"
        className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#0d4a33]">Compare plans · {term} contract</h2>
          <button type="button" onClick={onClose} aria-label="Close comparison" className="rounded-lg px-3 py-1 text-xl text-[#5b6078] hover:bg-[#f1f3f9]">✕</button>
        </div>
        <div className={`grid gap-4 ${plans.length === 3 ? "md:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : ""}`}>
          {plans.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-[#ece9f2] p-4">
              <h3 className="text-sm font-bold text-[#d10f5b]">{p.name}</h3>
              <div className="mt-1 text-3xl font-extrabold text-[#0d4a33]">{p.data_allowance}</div>
              <div className="text-xl font-extrabold text-[#d10f5b]">£{priceFor(p, duration)}<span className="ml-1 text-xs font-semibold text-[#5b6078]">/month</span></div>
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
                Choose this plan
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
export default function Dataonly() {
  const { addPlanToCart } = useCart();
  const router = useRouter();

  const [duration, setDuration] = useState<Duration>("24 Month Plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [sort, setSort] = useState<SortKey>("data");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);
  const [device, setDevice] = useState(DEVICES[0].key);

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

  const dataPlans = useMemo(() => plans.filter((p) => p.category?.slug === DATA_SLUG), [plans]);

  const sortedPlans = useMemo(() => {
    const list = [...dataPlans];
    list.sort((a, b) =>
      sort === "data"
        ? gbValue(a) - gbValue(b)
        : priceNumber(a, duration) - priceNumber(b, duration)
    );
    return list;
  }, [dataPlans, sort, duration]);

  const durationMeta = DURATIONS.find((d) => d.key === duration)!;
  const comparedPlans = sortedPlans.filter((p) => compareIds.includes(p.id));

  // Same flow as before: pick SIM type -> add to cart -> /checkout.
  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(simTypePlan, simType);
    setSimTypePlan(null);
    router.push("/checkout");
  };

  const toggleCompare = (id: number) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev
    );

  // Usage guide ranges come from the live plans (no hard-coded sizes).
  const guide = useMemo(() => {
    const finite = sortedPlans.filter((p) => Number.isFinite(gbValue(p)));
    const byData = [...finite].sort((a, b) => gbValue(a) - gbValue(b));
    const label = (list: Plan[]) =>
      list.length === 0 ? null : list.length === 1
        ? list[0].data_allowance
        : `${list[0].data_allowance}–${list[list.length - 1].data_allowance}`;
    const light = byData.filter((p) => gbValue(p) <= 3);
    const heavy = [...byData.filter((p) => gbValue(p) > 30), ...sortedPlans.filter((p) => !Number.isFinite(gbValue(p)))];
    const regular = byData.filter((p) => gbValue(p) > 3 && gbValue(p) <= 30);
    return { light: label(light), regular: label(regular), heavy: label(heavy.sort((a, b) => gbValue(a) - gbValue(b))) };
  }, [sortedPlans]);

  const activeDevice = DEVICES.find((d) => d.key === device)!;

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
          duration={duration}
          term={durationMeta.term}
          onClose={() => setShowCompare(false)}
          onChoose={(p) => { setShowCompare(false); setSimTypePlan(p); }}
        />
      )}

      {/* ── Hero ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#fff3f7] via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-20 pt-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-block border-b-4 border-[#d10f5b] pb-2 text-xs font-extrabold uppercase tracking-[0.25em]">
              Mobile data, no calls needed
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0d4a33] sm:text-5xl">
              Data-Only <span className="block">SIM Plans</span>
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold">
              Mobile data for compatible tablets, laptops and mobile Wi-Fi devices.
            </p>
            <p className="mt-2 max-w-md text-sm text-[#5b6078]">
              Choose your data and contract length. Calls and texts aren&rsquo;t part of these plans unless a plan&rsquo;s details say otherwise.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#plans" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#e0176a] to-[#b00c4d] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(209,15,91,0.28)]">
                View plans <IconArrow />
              </a>
              <Link href="/coverage-checker" className="inline-flex items-center gap-2 rounded-full border-2 border-[#d10f5b] bg-white px-6 py-3 text-sm font-bold text-[#d10f5b] hover:bg-[#fff0f5]">
                Check coverage <IconArrow />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-2 gap-3">
            <div className="relative row-span-2 min-h-[280px] overflow-hidden rounded-2xl shadow-lg">
              <Image src={img("A person using a tablet.png")} alt="A person using a tablet" fill sizes="(min-width:768px) 22vw, 50vw" className="object-cover" priority />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d10f5b] px-3 py-1 text-xs font-bold text-white">Tablet</span>
            </div>
            <div className="relative min-h-[134px] overflow-hidden rounded-2xl shadow-lg">
              <Image src={img("A laptop on a desk.png")} alt="A laptop on a desk" fill sizes="(min-width:768px) 16vw, 50vw" className="object-cover" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d10f5b] px-3 py-1 text-xs font-bold text-white">Laptop</span>
            </div>
            <div className="relative min-h-[134px] overflow-hidden rounded-2xl shadow-lg">
              <Image src={img("A mobile Wi-Fi router.png")} alt="A mobile Wi-Fi router" fill sizes="(min-width:768px) 16vw, 50vw" className="object-cover" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d10f5b] px-3 py-1 text-xs font-bold text-white">Mobile Wi-Fi</span>
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="dop-swoosh" x1="0" x2="1">
              <stop offset="0" stopColor="#ff7a45" /><stop offset="0.5" stopColor="#d10f5b" /><stop offset="1" stopColor="#c2105a" />
            </linearGradient>
          </defs>
          <path d="M0 58 C 420 40, 900 10, 1440 6 L1440 18 C 900 22, 420 52, 0 60 Z" fill="url(#dop-swoosh)" />
        </svg>
      </header>

      {/* ── Plans ── */}
      <section id="plans" className="bg-gradient-to-b from-white to-[#fff6f9] px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#0d4a33] sm:text-4xl">Choose your data plan</h2>
          <p className="mt-2 text-center text-sm text-[#5b6078]">
            {dataPlans.length > 0
              ? `${dataPlans.length} data allowances, each on 24-month, 12-month or 30-day terms.`
              : "Data allowances on 24-month, 12-month or 30-day terms."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold"><IconCalendar />Choose your contract length</span>
            <div role="radiogroup" aria-label="Choose your plan duration" className="inline-flex rounded-full border border-[#e6e8f0] bg-white p-1 shadow-sm">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="radio"
                  aria-checked={duration === d.key}
                  onClick={() => setDuration(d.key)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${duration === d.key ? "bg-[#d10f5b] text-white" : "text-[#5b6078] hover:text-[#14194a]"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {!loading && !error && dataPlans.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#5b6078]">{dataPlans.length} plans · {durationMeta.label}</span>
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
                    duration={duration}
                    term={durationMeta.term}
                    compared={compareIds.includes(p.id)}
                    compareDisabled={compareIds.length >= MAX_COMPARE}
                    onToggleCompare={() => toggleCompare(p.id)}
                    onChoose={() => setSimTypePlan(p)}
                  />
                ))}
              </div>
            )}
            {!loading && !error && sortedPlans.length === 0 && (
              <p className="text-center text-[#5b6078]">No data-only plans available yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Check your device ── */}
      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d10f5b]">Will it work?</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0d4a33]">Check your device first</h2>
            <p className="mt-2 text-sm text-[#5b6078]">
              A data-only SIM works in devices that can connect to a mobile network. Three quick checks:
            </p>
            <ol className="mt-6 space-y-5">
              {CHECKS.map((c) => (
                <li key={c.n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d10f5b] text-xs font-extrabold text-white">{c.n}</span>
                  <div>
                    <h3 className="text-sm font-extrabold">{c.title}</h3>
                    <p className="text-[13px] leading-snug text-[#5b6078]">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div role="tablist" aria-label="Device type" className="flex flex-wrap gap-2">
              {DEVICES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={device === d.key}
                  onClick={() => setDevice(d.key)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${device === d.key ? "border-[#d10f5b] bg-[#d10f5b] text-white" : "border-[#e6e8f0] bg-white text-[#14194a]"}`}
                >
                  {d.icon}{d.label}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="mt-4 rounded-2xl border border-[#ece9f2] bg-white p-6 shadow-[0_8px_28px_rgba(20,25,74,0.07)]">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#fde4ee] text-[#d10f5b]">{activeDevice.icon}</span>
              <h3 className="text-base font-extrabold">{activeDevice.title}</h3>
              <p className="mt-1 text-sm text-[#5b6078]">{activeDevice.text}</p>
              <ul className="mt-3 space-y-2">
                {activeDevice.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm"><IconCheck /><span>{p}</span></li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-[#7a7f96]">{DEVICE_NOTE}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How much data ── */}
      <section className="bg-gradient-to-b from-[#fff6f9] to-white px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d10f5b]">How much data?</p>
          <span className="mx-auto mt-2 block h-[3px] w-10 rounded bg-[#d10f5b]" aria-hidden="true" />
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0d4a33] sm:text-4xl">A rough guide to choosing</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#5b6078]">
            Everyone uses data differently. Check your current device&rsquo;s usage settings for the best guide.
          </p>
          <div className="mt-8 grid gap-5 text-left md:grid-cols-3">
            {[
              {
                icon: <IconMail />,
                title: "Light use",
                text: "Email, browsing, maps and messaging on a tablet or laptop.",
                range: "1GB–3GB",
              },
              {
                icon: <IconGlobe />,
                title: "Regular use",
                text: "Video calls, music streaming and working on the go.",
                range: "10GB–30GB",
              },
              {
                icon: <IconWifi />,
                title: "Heavy use",
                text: "Streaming video or sharing a connection with several devices.",
                range: "100GB",
              },
            ].map((g) => (
              <div key={g.title} className="rounded-2xl border border-[#ece9f2] bg-white p-6 shadow-[0_8px_28px_rgba(20,25,74,0.06)]">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fde8ef] text-[#d10f5b]">{g.icon}</span>
                <h3 className="font-extrabold text-[#0d4a33]">{g.title}</h3>
                <p className="mt-1 text-[13px] text-[#5b6078]">{g.text}</p>
                <a href="#plans" className="mt-4 inline-block rounded-full bg-[#fde8ef] px-3.5 py-1.5 text-xs font-bold text-[#d10f5b] hover:bg-[#fbd5e3] transition">
                  Look at {g.range}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three steps ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#d10f5b]">Getting started</p>
          <span className="mx-auto mt-2 block h-[3px] w-10 rounded bg-[#d10f5b]" aria-hidden="true" />
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0d4a33] sm:text-4xl">Three steps to get connected</h2>
          <div className="mt-8 grid gap-5 text-left md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-[#ece9f2] bg-white p-6 shadow-[0_8px_28px_rgba(20,25,74,0.06)]">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e0176a] to-[#b00c4d] text-xs font-extrabold text-white">{s.n}</span>
                <h3 className="font-extrabold">{s.title}</h3>
                <p className="mt-1 text-[13px] text-[#5b6078]">{s.text}</p>
              </div>
            ))}
          </div>
          <nav aria-label="Related" className="mt-6 grid divide-[#eceef6] rounded-2xl border border-[#ece9f2] bg-[#fff0f5] text-sm font-bold sm:grid-cols-4 sm:divide-x">
            {[
              { href: "/coverage-checker", label: "Check coverage", icon: <IconSignal /> },
              { href: "/roaming-and-coverage", label: "Roaming", icon: <IconGlobe /> },
              { href: "/top-up", label: "Top up", icon: <IconRefresh /> },
              { href: "/business-deals_sim-only-plans", label: "Business data", icon: <IconBriefcase /> },
            ].map((l) => (
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
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0d4a33]">Data-only SIM questions</h2>
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

/*
=============================================================================
PREVIOUS DATA-ONLY PLANS IMPLEMENTATION (commented out, kept for reference)
=============================================================================
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

      {/* Banner * /}
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

      {/* Toggle * /}
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

      {/* Cards * /}
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
            {/* decorative dots * /}
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

      {/* Connect banner * /}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-5 text-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-[#e6007e]">Z</div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Get Connected With Zoiko Mobile&rsquo;s Data Only SIMs &mdash; Fast, Reliable, And Easy To Use!
          </h2>
        </div>
      </div>

      {/* Why Choose * /}
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
*/

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Briefcase,
  Wifi,
  Calendar,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  PhoneCall,
  PawPrint,
  Music,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Category slugs
const SIM_SLUG = "sim-only-plans";
const BUSINESS_SLUG = "zoiko-sim-only-business-deals";
const DATA_SLUG = "data-only-plans";

type CategoryTab = "personal" | "business" | "data-only";
type DurationTab = "30-days" | "12-months" | "24-months";

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
  description?: string | null;
  price: string;
  price_24: string | null;
  price_12: string | null;
  price_30: string | null;
  data_allowance: string | null;
  tier_label: string | null;
  is_popular: boolean;
  category: Category | null;
  features: Feature[];
  transatelID?: string | null;
  final_price?: string;
  duration_days?: number;
}

const FAQS = [
  {
    question: "What’s the difference between 30-day and 12 or 24-month plans?",
    answer:
      "A 30-day rolling plan offers total flexibility: you can change your allowance or cancel anytime with 30 days’ notice. Our 12-month and 24-month plans offer the lowest monthly rates in exchange for a committed contract term.",
  },
  {
    question: "Will my price go up during my contract?",
    answer:
      "Our headline prices are clear and transparent. Contract terms are clearly stated during checkout. Any adjustments follow standard UK communications regulator (Ofcom) guidelines, and we always communicate changes well in advance.",
  },
  {
    question: "Can I keep my number?",
    answer:
      "Yes! It’s completely free and takes less than 60 seconds. Simply text 'PAC' to 65075 from your current provider to receive your 9-digit code, and submit it during checkout or anytime in your dashboard.",
  },
  {
    question: "Is EU roaming included?",
    answer:
      "Yes, EU roaming is included in all our mobile plans up to your plan's roaming allowance (e.g. up to 40GB on unlimited plans) across 30+ European destinations with no extra daily fees.",
  },
];

export function Allplans() {
  const { addPlanToCart } = useCart();
  const router = useRouter();

  // Selected Category Tab
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("personal");
  // Selected Duration Tab
  const [durationTab, setDurationTab] = useState<DurationTab>("30-days");

  // Purely dynamic backend plans state (NO HARDCODED DATA)
  const [personalPlans, setPersonalPlans] = useState<Plan[]>([]);
  const [businessPlans, setBusinessPlans] = useState<Plan[]>([]);
  const [dataOnlyPlans, setDataOnlyPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // SIM Modal
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

  // Price change info modal
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Open FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Compare selection
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  // ─── FETCH PLANS DIRECTLY FROM BACKEND APIS ───
  useEffect(() => {
    let isMounted = true;

    async function loadBackendPlans() {
      setLoading(true);

      // 1. Fetch Personal SIMs (All Plans API: /api/plans/v1/)
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (res.ok) {
          const data: Plan[] = await res.json();
          if (isMounted) {
            const personal = data.filter((p) => {
              const catSlug = (p.category?.slug ?? "").toLowerCase();
              return catSlug !== BUSINESS_SLUG && catSlug !== DATA_SLUG;
            });
            setPersonalPlans(personal.length > 0 ? personal : data);
          }
        }
      } catch (err) {
        console.warn("Could not load personal plans from API:", err);
      }

      // 2. Fetch Business SIMs (Business Plans API)
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/category/${BUSINESS_SLUG}/`);
        if (res.ok) {
          const data: Plan[] = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setBusinessPlans(data);
          }
        } else {
          const allRes = await fetch(`${API_BASE}/api/plans/v1/`);
          if (allRes.ok) {
            const allData: Plan[] = await allRes.json();
            const biz = allData.filter((p) => {
              const catSlug = (p.category?.slug ?? "").toLowerCase();
              const catName = (p.category?.name ?? "").toLowerCase();
              return catSlug === BUSINESS_SLUG || catSlug.includes("business") || catName.includes("business");
            });
            if (isMounted) setBusinessPlans(biz);
          }
        }
      } catch (err) {
        console.warn("Could not load business plans from API:", err);
      }

      // 3. Fetch Data-only SIMs (Data-only Plans API)
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/category/${DATA_SLUG}/`);
        if (res.ok) {
          const data: Plan[] = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setDataOnlyPlans(data);
          }
        } else {
          const allRes = await fetch(`${API_BASE}/api/plans/v1/`);
          if (allRes.ok) {
            const allData: Plan[] = await allRes.json();
            const dataOnly = allData.filter((p) => {
              const catSlug = (p.category?.slug ?? "").toLowerCase();
              const catName = (p.category?.name ?? "").toLowerCase();
              return catSlug === DATA_SLUG || catSlug.includes("data") || catName.includes("data");
            });
            if (isMounted) setDataOnlyPlans(dataOnly);
          }
        }
      } catch (err) {
        console.warn("Could not load data-only plans from API:", err);
      }

      if (isMounted) setLoading(false);
    }

    loadBackendPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active plans based on selected category tab (from backend state only)
  const activePlans = useMemo(() => {
    if (categoryTab === "personal") return personalPlans;
    if (categoryTab === "business") return businessPlans;
    return dataOnlyPlans;
  }, [categoryTab, personalPlans, businessPlans, dataOnlyPlans]);

  // Compute dynamic price for the plan based on selected duration
  const getPlanPrice = (plan: Plan): string => {
    if (durationTab === "30-days") {
      return Number(plan.price_30 ?? plan.price).toFixed(2);
    }
    if (durationTab === "12-months") {
      return Number(plan.price_12 ?? plan.price).toFixed(2);
    }
    return Number(plan.price_24 ?? plan.price).toFixed(2);
  };

  const getDurationLabel = (): string => {
    if (durationTab === "30-days") return "30 days";
    if (durationTab === "12-months") return "12 months";
    return "24 months";
  };

  const getNoticeText = (): string => {
    if (durationTab === "30-days") {
      return "Rolling 30-day plan. Renewal and notice period are set out in your contract summary.";
    }
    if (durationTab === "12-months") {
      return "12-month fixed contract. Early cancellation terms apply as set out in your summary.";
    }
    return "24-month fixed contract with best monthly value. Contract summary applies.";
  };

  // Extract feature bullets dynamically from plan object
  const getPlanBullets = (plan: Plan): string[] => {
    if (plan.features && plan.features.length > 0) {
      return plan.features.map((f) => f.title);
    }
    if (plan.short_description) {
      return plan.short_description
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  // Buy now handler
  const handleBuyNow = (plan: Plan) => {
    setSimTypePlan(plan);
  };

  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    const finalPlan = {
      ...simTypePlan,
      final_price: getPlanPrice(simTypePlan),
      duration_days: durationTab === "30-days" ? 30 : durationTab === "12-months" ? 365 : 730,
    };
    addPlanToCart(finalPlan as any, simType);
    setSimTypePlan(null);
    router.push("/checkout");
  };

  const toggleCompare = (id: number) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFAFC] text-[#0D1935] font-['Figtree',sans-serif]">
      {/* Choose SIM Type modal (eSIM / pSIM) */}
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

      {/* Price Information Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowPriceModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-[#0D1935] mb-3">
              How Prices May Change
            </h3>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Our 30-day rolling plans provide maximum flexibility with observed monthly rates that continue until you modify or cancel your plan.
              </p>
              <p>
                For committed contract agreements (12 and 24-month plans), your monthly fee is protected for the initial duration. In accordance with Ofcom regulations, annual adjustments reflecting the Consumer Price Index (CPI) plus 3.9% may apply each April.
              </p>
              <p>
                All prices include UK VAT at the standard rate of 20% unless explicitly indicated for registered VAT-exclusive business accounts.
              </p>
            </div>
            <button
              onClick={() => setShowPriceModal(false)}
              className="mt-6 w-full py-3 bg-[#E01C5B] text-white font-semibold rounded-2xl hover:bg-[#c8164f] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── 1. HERO BANNER (FULL-BLEED EDGE-TO-EDGE) ─── */}
      <section className="relative w-full bg-white overflow-hidden">
        {/* Full-width container */}
        <div className="relative w-full min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] flex items-center">
          
          {/* Right Image: Stretches all the way to the right screen edge */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[62%] lg:w-[65%] overflow-hidden pointer-events-none">
            <img
              src="/images/plans/woman-headphones.png"
              alt="The Animal & Music Loving Network"
              className="w-full h-full object-cover object-[right_center] md:object-[right_20%]"
            />
            {/* Smooth gradient blend fading from pure white into the photo */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-24% md:via-15% to-transparent to-60% md:to-35%" />
          </div>

          {/* Left Text Content Area (Centered within standard page max-width) */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 md:py-16">
            <div className="max-w-xl">
              {/* Green Eyebrow */}
              <div className="text-[#0E8A5E] text-xs sm:text-sm font-extrabold uppercase tracking-wide font-['Figtree']">
                THE ANIMAL &amp; MUSIC LOVING NETWORK
              </div>

              {/* Main Headline */}
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-[#0D1935] leading-[1.14] tracking-tight">
                Stay connected <br />
                to what you{" "}
                <span className="relative inline-block text-[#0D1935]">
                  love.
                  {/* Exact pink curved smile underline */}
                  <svg
                    className="absolute -bottom-2 left-0 right-0 w-full h-3 text-[#E01C5B] overflow-visible"
                    viewBox="0 0 60 10"
                    fill="none"
                  >
                    <path
                      d="M2 5C18 9 42 9 58 4"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-3 text-sm sm:text-base lg:text-lg text-[#2E3A59] font-medium leading-relaxed max-w-md">
                Flexible mobile plans. Clear choices. More of what matters.
              </p>

              {/* Explore Plans CTA Button */}
              <div className="mt-6">
                <a
                  href="#plans-grid-section"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-base font-bold rounded-full shadow-[0px_6px_20px_rgba(224,28,91,0.4)] hover:shadow-[0px_8px_24px_rgba(224,28,91,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Explore plans</span>
                  <span className="text-lg leading-none">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Full-bleed seamless bottom wave with orange glow & pink stroke */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
            <svg
              viewBox="0 0 1440 70"
              className="w-full h-10 sm:h-14 lg:h-16"
              preserveAspectRatio="none"
              fill="none"
            >
              <defs>
                {/* Orange accent gradient on the left corner */}
                <linearGradient id="orangeGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
                  <stop offset="25%" stopColor="#FDBA74" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#FED7AA" stopOpacity="0.2" />
                  <stop offset="70%" stopColor="#FFF" stopOpacity="0" />
                </linearGradient>

                {/* Pink line stroke gradient across the wave */}
                <linearGradient id="pinkLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
                  <stop offset="15%" stopColor="#E01C5B" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#F43F5E" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Left orange gradient curved wash (flush with bottom-left corner) */}
              <path
                d="M0 70 L0 18 Q 220 8 480 48 L 520 70 Z"
                fill="url(#orangeGlow)"
              />

              {/* Pink glow stroke along the wave crest */}
              <path
                d="M0 46 Q 360 22 760 36 T 1440 28"
                stroke="url(#pinkLine)"
                strokeWidth="3.5"
                fill="none"
              />

              {/* Solid curved base matching page background #FAFAFC */}
              <path
                d="M0 70 H1440 V28 Q 1080 36 760 36 T 0 46 Z"
                fill="#FAFAFC"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ─── 2. MAIN PLANS SECTION ─── */}
      <main id="plans-grid-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6 sm:space-y-8">
        
        {/* SIM Category Tabs (Personal SIMs, Business SIMs, Data-only SIMs) */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 flex-wrap">
          {/* Tab 1: Personal SIMs */}
          <button
            type="button"
            onClick={() => setCategoryTab("personal")}
            className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all cursor-pointer ${
              categoryTab === "personal"
                ? "bg-gradient-to-r from-[#E01C5B] via-[#E6007E] to-[#F02868] text-white shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)] scale-105"
                : "bg-white text-[#0D1935] border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>Personal SIMs</span>
          </button>

          {/* Tab 2: Business SIMs */}
          <button
            type="button"
            onClick={() => setCategoryTab("business")}
            className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all cursor-pointer ${
              categoryTab === "business"
                ? "bg-gradient-to-r from-[#E01C5B] via-[#E6007E] to-[#F02868] text-white shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)] scale-105"
                : "bg-white text-[#0D1935] border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>Business SIMs</span>
          </button>

          {/* Tab 3: Data-only SIMs */}
          <button
            type="button"
            onClick={() => setCategoryTab("data-only")}
            className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all cursor-pointer ${
              categoryTab === "data-only"
                ? "bg-gradient-to-r from-[#E01C5B] via-[#E6007E] to-[#F02868] text-white shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)] scale-105"
                : "bg-white text-[#0D1935] border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Wifi className="w-5 h-5" />
            <span>Data-only SIMs</span>
          </button>
        </div>

        {/* Plan Duration Selector Container */}
        <div className="w-full bg-[#F8FAFC] border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01C5B]">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[#0D1935] text-base font-extrabold font-['Figtree']">
              Choose your plan duration
            </span>
          </div>

          {/* Duration Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDurationTab("30-days")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                durationTab === "30-days"
                  ? "bg-gradient-to-r from-[#E01C5B] to-[#F02868] text-white shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)]"
                  : "bg-white text-[#0D1935] border border-slate-200 hover:border-slate-300"
              }`}
            >
              30 days
            </button>
            <button
              type="button"
              onClick={() => setDurationTab("12-months")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                durationTab === "12-months"
                  ? "bg-gradient-to-r from-[#E01C5B] to-[#F02868] text-white shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)]"
                  : "bg-white text-[#0D1935] border border-slate-200 hover:border-slate-300"
              }`}
            >
              12 months
            </button>
            <button
              type="button"
              onClick={() => setDurationTab("24-months")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                durationTab === "24-months"
                  ? "bg-gradient-to-r from-[#E01C5B] to-[#F02868] text-white shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)]"
                  : "bg-white text-[#0D1935] border border-slate-200 hover:border-slate-300"
              }`}
            >
              24 months
            </button>
          </div>
        </div>

        {/* Meta Bar: Plans Count & VAT Information */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-[#54617E] px-1">
          <div>
            <span className="font-medium text-[#2E3A59]">
              {activePlans.length} plans
            </span>{" "}
            · {getDurationLabel()}
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span>Prices include VAT unless stated ·</span>
            <button
              type="button"
              onClick={() => setShowPriceModal(true)}
              className="text-[#E01C5B] font-bold hover:underline cursor-pointer"
            >
              How prices may change
            </button>
          </div>
        </div>

        {/* ─── 3. PLANS 3-COLUMN GRID (100% POPULATED FROM BACKEND) ─── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#E01C5B] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading plans from Zoiko Mobile...</p>
          </div>
        ) : activePlans.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-base font-bold text-[#0D1935]">No plans currently available in this category.</p>
            <p className="text-sm text-slate-500 mt-1">Please try another duration or select a different category above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {activePlans.map((plan) => {
              const price = getPlanPrice(plan);
              const isChecked = selectedForCompare.includes(plan.id);
              const bullets = getPlanBullets(plan);

              return (
                <div
                  key={plan.id}
                  className="relative bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-[0px_2px_4px_0px_rgba(20,26,69,0.04),0px_6px_18px_-8px_rgba(20,26,69,0.14)] hover:shadow-[0px_8px_24px_rgba(20,26,69,0.12)] transition-all overflow-hidden group"
                >
                  {/* Top Right Orange Brush Accent */}
                  <div className="absolute top-3.5 right-3.5 w-20 h-5 overflow-hidden pointer-events-none">
                    <div className="w-24 h-4 bg-gradient-to-r from-orange-400 to-rose-400 opacity-30 -rotate-12 translate-x-3 -translate-y-1 rounded-full" />
                  </div>

                  <div>
                    {/* Header: Icon, Name & Price */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#F1F5F9] border border-slate-100 flex items-center justify-center text-[#E01C5B] shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-xl font-extrabold text-[#0D1935] tracking-tight font-['Figtree'] leading-6">
                          {plan.name}
                        </h3>

                        {/* Price Display */}
                        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl sm:text-4xl font-extrabold text-[#E01C5B] leading-none">
                            £{price}
                          </span>
                          <span className="text-base font-semibold text-[#2E3A59]">
                            /month
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#54617E] leading-tight">
                          incl. VAT · {getDurationLabel()} rolling plan · Observed price
                        </p>
                      </div>
                    </div>

                    {/* Features List with Spring Green Checkmarks */}
                    <div className="mt-5 space-y-2">
                      {/* Highlight Data Allowance if present */}
                      {plan.data_allowance && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-5 pt-0.5 text-[#00A859] shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <span className="text-base font-bold text-[#2E3A59] leading-snug">
                            {plan.data_allowance} UK data
                          </span>
                        </div>
                      )}

                      {/* Bullets directly from backend plan */}
                      {bullets.length > 0 ? (
                        bullets.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="w-4 h-5 pt-0.5 text-[#00A859] shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="text-sm sm:text-base text-[#2E3A59] leading-snug">
                              {feat}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-start gap-2.5">
                            <div className="w-4 h-5 pt-0.5 text-[#00A859] shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="text-base text-[#2E3A59] leading-snug">
                              Unlimited UK calls · Unlimited UK texts
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <div className="w-4 h-5 pt-0.5 text-[#00A859] shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="text-base text-[#2E3A59] leading-snug">
                              EU roaming included{" "}
                              <span className="text-xs text-[#54617E]">(eligible destinations)</span>
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <div className="w-4 h-5 pt-0.5 text-[#00A859] shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <span className="text-base text-[#2E3A59] leading-snug">
                              Wi-Fi Calling &amp; eSIM{" "}
                              <span className="text-xs text-[#54617E]">(compatible devices)</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Notice Box */}
                    <div className="mt-4 p-3 bg-[#F8FAFC] border border-slate-200/90 rounded-xl">
                      <p className="text-xs text-[#2E3A59] leading-relaxed">
                        {getNoticeText()}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  <div className="mt-5 space-y-3">
                    {/* View plan & choose Button */}
                    <button
                      type="button"
                      onClick={() => handleBuyNow(plan)}
                      className="w-full py-3.5 px-6 bg-gradient-to-r from-[#E01C5B] via-[#E6007E] to-[#F02868] text-white font-bold text-base rounded-2xl shadow-[0px_10px_22px_-10px_rgba(224,28,91,0.55)] hover:shadow-[0px_12px_26px_-8px_rgba(224,28,91,0.7)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <span>View plan &amp; choose</span>
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Compare & Full plan details Row */}
                    <div className="flex items-center justify-between pt-1 text-base font-semibold text-[#0D1935]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompare(plan.id)}
                          className="w-5 h-5 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B] cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-[#0D1935]">Compare</span>
                      </label>

                      <Link
                        href={`/dashboard/compare-plans`}
                        className="text-[#E01C5B] hover:underline flex items-center gap-1 text-sm font-bold"
                      >
                        <span>Full plan details</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── 4. CONNECTED TO WHAT MATTERS BANNER ─── */}
        <section className="w-full bg-gradient-to-r from-[#0B4D33] to-[#125E40] rounded-3xl px-6 sm:px-8 py-5 text-white flex flex-col md:flex-row items-center gap-5 shadow-sm">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <PawPrint className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <Music className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Connected to what matters — people, animals and music.
            </h2>
            <p className="mt-0.5 text-emerald-100 text-sm sm:text-base font-normal">
              We’re The Animal &amp; Music Loving Network. Find out about the programmes we support.
            </p>
          </div>
        </section>

        {/* ─── 5. THREE TRUST / CONVENIENCE CARDS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1: Check coverage */}
          <div className="bg-white rounded-3xl border border-slate-200 p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-3xl bg-[#F1F5F9] flex items-center justify-center text-[#E01C5B] shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">Check coverage</h3>
                <p className="mt-1 text-sm text-[#54617E] leading-relaxed">
                  See predicted coverage for your postcode before you choose.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-1">
              <Link
                href="/coverage-checker"
                className="inline-flex items-center gap-1 text-base font-bold text-[#E01C5B] hover:underline"
              >
                <span>Check my postcode</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Keep your number */}
          <div className="bg-white rounded-3xl border border-slate-200 p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-3xl bg-[#F1F5F9] flex items-center justify-center text-[#E01C5B] shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">Keep your number</h3>
                <p className="mt-1 text-sm text-[#54617E] leading-relaxed">
                  Bring your number with a PAC, or start fresh with a new one.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-1">
              <Link
                href="/switch-and-save"
                className="inline-flex items-center gap-1 text-base font-bold text-[#E01C5B] hover:underline"
              >
                <span>How switching works</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Talk to a person */}
          <div className="bg-white rounded-3xl border border-slate-200 p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-3xl bg-[#F1F5F9] flex items-center justify-center text-[#E01C5B] shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">Talk to a person</h3>
                <p className="mt-1 text-sm text-[#54617E] leading-relaxed">
                  Our UK team is available by phone and email. Zovie, our virtual assistant, can help anytime.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-1">
              <a
                href="tel:+448000488400"
                className="inline-flex items-center gap-1 text-base font-bold text-[#E01C5B] hover:underline"
              >
                <span>+44 800 048 8400</span>
              </a>
            </div>
          </div>
        </div>

        {/* ─── 6. QUESTIONS ABOUT OUR PLANS (FAQ ACCORDION) ─── */}
        <section className="pt-6 pb-12 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935]">
            Questions about our plans
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-bold text-[#0D1935]">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 sm:px-8 pb-6 pt-1 text-sm sm:text-base text-[#54617E] leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Allplans;

/* ========================================================================= */
/* PREVIOUS CODE (COMMENTED OUT AS REQUESTED)                                */
/* ========================================================================= */
/*
function AllplansOld() {
  const { addPlanToCart } = useCart();
  const router = useRouter();
  const [simDuration, setSimDuration] = useState<any>("24 Month Plan");
  const [bizDuration, setBizDuration] = useState<any>("24 Month Plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

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

  const simPlans = useMemo(() => {
    return plans.filter((p) => {
      const s = (p.category?.slug ?? "").toLowerCase();
      if (s === BUSINESS_SLUG || s === "zoiko-roaming-deals") return false;
      return s === SIM_SLUG || s.includes("sim") || s.includes("saver");
    });
  }, [plans]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Choose Your SIM Only Plan & Duration Below
        </h1>
      </div>
    </div>
  );
}
*/

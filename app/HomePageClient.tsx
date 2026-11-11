"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Briefcase,
  Wifi,
  Tablet,
  Layers,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Radio,
  ExternalLink,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Headphones,
  PawPrint,
  Music,
  ArrowRight,
  Search,
  Globe,
  User,
  ArrowLeftRight,
  Scale,
  CreditCard,
} from "lucide-react";
import { useCart } from "./context/CartContext";
import ChooseSimTypeModal from "./components/ChooseSimTypeModal";
import { openChat } from "./components/ChatbotWidget";

// ─── CONFIG & TYPES ──────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const SIM_SLUG = "sim-only-plans";
const BUSINESS_SLUG = "zoiko-sim-only-business-deals";
const DATA_SLUG = "data-only-plans";

type CategoryTab = "personal" | "business" | "data-only";
type DurationTab = "24-months" | "12-months" | "30-days";

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

// Popular destinations for Travelling Abroad
const POPULAR_DESTINATIONS = [
  "Spain",
  "France",
  "Italy",
  "Germany",
  "Greece",
  "Ireland",
  "Portugal",
  "United States (USA)",
  "Canada",
  "Australia",
  "India",
  "Cyprus",
  "Turkey",
  "Netherlands",
  "Norway",
  "Switzerland",
  "Poland",
  "Austria",
  "Belgium",
  "Croatia",
  "Iceland",
  "Sweden",
  "Denmark",
  "Malta",
  "United Arab Emirates (UAE)",
];

const FAQS = [
  {
    question: "Can I keep my number?",
    answer:
      "Yes, switching is 100% free under UK Ofcom regulations. Just text 'PAC' to 65075 from your current provider to receive your 9-digit code, and submit it during checkout or anytime in your dashboard. Number transfers normally complete within 1 working day.",
  },
  {
    question: "Which SIM should I choose?",
    answer:
      "We offer both physical Multi-SIMs (Standard, Micro & Nano in one pop-out card) delivered free across the UK, as well as digital eSIMs for immediate QR-code activation on compatible smartphones, tablets and smartwatches.",
  },
  {
    question: "What’s included in EU roaming?",
    answer:
      "All Zoiko personal plans include inclusive EU roaming allowances across 30+ European destinations with zero daily surcharge. You can use your data, minutes, and texts just like you do at home in the UK, subject to our fair usage policy.",
  },
  {
    question: "How do plan lengths differ?",
    answer:
      "Our 30-day plans give total month-to-month flexibility with no long-term commitment. Our 12-month and 24-month plans offer our lowest guaranteed monthly rates with inclusive EU roaming and 5G connectivity.",
  },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ZoikoMobileHome() {
  const router = useRouter();
  const { addPlanToCart } = useCart();

  // Plan Filtering State
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("personal");
  const [durationTab, setDurationTab] = useState<DurationTab>("24-months");

  // Dynamic Plans from Backend
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // SIM Modal
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Travelling Abroad Destination State
  const [selectedDestination, setSelectedDestination] = useState<string>("Spain");

  // Coverage Postcode State
  const [coveragePostcode, setCoveragePostcode] = useState<string>("");
  const [coverageError, setCoverageError] = useState<string>("");

  // ─── 1. FETCH LIVE PLANS FROM BACKEND API ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function fetchPlans() {
      setLoadingPlans(true);
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (res.ok) {
          const data: Plan[] = await res.json();
          if (isMounted && Array.isArray(data)) {
            setAllPlans(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch backend plans:", err);
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    }
    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter plans based on active Category
  const filteredPlans = useMemo(() => {
    if (!allPlans || allPlans.length === 0) return [];

    let list = allPlans;
    if (categoryTab === "business") {
      list = allPlans.filter((p) => {
        const slug = (p.category?.slug ?? "").toLowerCase();
        const name = (p.category?.name ?? "").toLowerCase();
        return slug === BUSINESS_SLUG || slug.includes("business") || name.includes("business");
      });
    } else if (categoryTab === "data-only") {
      list = allPlans.filter((p) => {
        const slug = (p.category?.slug ?? "").toLowerCase();
        const name = (p.category?.name ?? "").toLowerCase();
        return slug === DATA_SLUG || slug.includes("data") || name.includes("data");
      });
    } else {
      // Personal
      list = allPlans.filter((p) => {
        const slug = (p.category?.slug ?? "").toLowerCase();
        return slug !== BUSINESS_SLUG && slug !== DATA_SLUG && !slug.includes("business");
      });
    }

    // Sort: popular first, then by price
    return list.slice(0, 3);
  }, [allPlans, categoryTab]);

  // Helper to get active price based on contract length
  const getPlanPrice = (p: Plan): string => {
    let raw = p.price;
    if (durationTab === "24-months" && p.price_24) raw = p.price_24;
    else if (durationTab === "12-months" && p.price_12) raw = p.price_12;
    else if (durationTab === "30-days" && p.price_30) raw = p.price_30;

    const num = Number(raw ?? p.price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Extract EU roaming allowance label
  const getEuRoamingLabel = (p: Plan): string => {
    const feat = p.features?.find((f) => f.title.toLowerCase().includes("roam"));
    if (feat) return feat.title;
    const gb = p.data_allowance || "";
    if (gb.includes("30") || gb.includes("Unlimited")) return "EU roaming 15GB";
    if (gb.includes("10")) return "EU roaming 5GB";
    return "EU roaming 2GB";
  };

  // Add Plan to Cart Handler
  const handleConfirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    const durationDays = durationTab === "30-days" ? 30 : durationTab === "12-months" ? 365 : 730;
    const finalPlan = {
      ...simTypePlan,
      final_price: getPlanPrice(simTypePlan),
      duration_days: durationDays,
    };
    addPlanToCart(finalPlan as any, simType);
    setSimTypePlan(null);
    router.push("/checkout");
  };

  // Travelling Abroad Action
  const handleCheckWhatsIncluded = () => {
    const country = selectedDestination.trim() || "Spain";
    router.push(`/roaming-and-coverage?country=${encodeURIComponent(country)}`);
  };

  // Third-party Coverage Checker Action
  const handleCheckCoverage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pc = coveragePostcode.trim();
    if (pc && pc.length < 3) {
      setCoverageError("Please enter a valid UK postcode.");
      return;
    }
    setCoverageError("");

    // Open live third-party EE Network coverage checker with the postcode
    const targetUrl = pc
      ? `https://coverage.ee.co.uk/coverage/ee?postcode=${encodeURIComponent(pc)}`
      : "https://ee.co.uk/help/mobile-coverage-checker";
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full bg-[#FAFAFC] text-slate-800 font-sans selection:bg-[#E01C5B] selection:text-white overflow-x-hidden">
      
      {/* ─── 1. HERO SECTION ───────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#F5F6F8] via-[#F8F9FA] via-35% to-white to-55% pt-8 pb-20 sm:pb-28 lg:pt-12 lg:pb-36 min-h-[540px] lg:min-h-[600px] flex items-center">
        {/* Full-bleed Hero Photo of Woman with Headphones & Dog on the right */}
        <div className="absolute right-0 top-0 w-full sm:w-[62%] lg:w-[65%] h-full pointer-events-none z-0">
          <Image
            src="/images/updated-home-page/A smiling woman wearing headphones.png"
            alt="Smiling woman wearing headphones with dog in London"
            fill
            priority
            className="object-cover object-right-top"
            sizes="(max-width: 1224px) 100vw, 65vw"
          />
          {/* Smooth blend gradient overlay from left into photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5F6F8] via-[#F8F9FA]/90 via-12% to-transparent to-40%" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
          <div className="max-w-3xl flex flex-col items-start gap-4">
            
            {/* Tagline Badge */}
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-[#0D382D] text-sm sm:text-base font-extrabold uppercase tracking-[4.07px]">
                The Animal &amp; Music Loving Network
              </span>
              <div className="w-32 h-1 bg-[#E01C5B] rounded-xs" />
            </div>

            {/* Main Heading */}
            <h1 className="pt-1 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[54px]">
              <span className="text-[#0D382D] block">Stay connected to</span>
              <span className="text-[#E01C5B] block">what you love.</span>
            </h1>

            {/* Subheading */}
            <p className="text-[#0D382D] text-lg sm:text-2xl font-medium leading-8 max-w-2xl">
              Flexible mobile plans, easy switching and more freedom to<br className="hidden sm:inline" /> stay connected across the UK and beyond.
            </p>

            {/* Frosted Deal Box */}
            <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-white/85 to-white/95 rounded-3xl border border-pink-200 backdrop-blur-[6px] shadow-[0px_14px_30px_-18px_rgba(200,15,87,0.45)] inline-flex flex-col sm:flex-row items-start sm:items-center">
              <div className="sm:pr-9 sm:border-r-2 border-pink-200/80 flex flex-col gap-1">
                <div className="text-[#E01C5B] text-4xl font-extrabold leading-9">30GB</div>
                <div className="text-[#E01C5B] text-lg font-medium leading-7">Unlimited UK Calls &amp; Texts</div>
              </div>
              <div className="sm:pl-9 pt-3 sm:pt-0 flex flex-col">
                <span className="text-[#0D382D] text-lg font-medium leading-7">From just</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#E01C5B] text-4xl font-extrabold leading-10">£16.99</span>
                  <span className="text-[#E01C5B] text-xl font-medium leading-6">/month</span>
                </div>
                <span className="text-slate-500 text-xs font-normal leading-4 mt-1">
                  Zoiko Max 30GB · 24-month contract · observed price
                </span>
              </div>
            </div>

            {/* Hero CTA Buttons */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <a
                href="#plans"
                className="min-w-[210px] min-h-[56px] px-8 py-3.5 rounded-full bg-gradient-to-b from-[#FA2268] to-[#E01C5B] text-white font-extrabold text-xl shadow-[0px_12px_24px_-10px_rgba(200,15,87,0.60)] hover:brightness-105 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>View Plans</span>
                <ChevronRight className="w-5 h-5 stroke-[2.4] transition-transform group-hover:translate-x-1" />
              </a>

              <Link
                href="/switch-and-save"
                className="min-w-[230px] min-h-[56px] px-8 py-3.5 rounded-full bg-white/90 text-[#E01C5B] border-2 border-[#E01C5B] font-extrabold text-xl hover:bg-pink-50 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>Switch &amp; Save</span>
                <ChevronRight className="w-5 h-5 stroke-[2.4] text-[#E01C5B] transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom Curved Wave Decorative Banner */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
          <svg
            viewBox="0 0 1440 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-14 sm:h-20 lg:h-24"
            preserveAspectRatio="none"
          >
            {/* Orange Accent Curve underneath */}
            <path
              d="M0 65 Q 400 45 720 60 T 1440 40 L 1440 90 L 0 90 Z"
              fill="url(#orangeAccentGrad)"
              opacity="0.95"
            />
            {/* Rose Wave Curve */}
            <path
              d="M0 45 Q 360 20 720 40 T 1440 25 L 1440 90 L 0 90 Z"
              fill="url(#roseWaveGrad)"
            />
            <defs>
              <linearGradient id="roseWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C80F57" />
                <stop offset="50%" stopColor="#E01C5B" />
                <stop offset="100%" stopColor="#FA2D70" />
              </linearGradient>
              <linearGradient id="orangeAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="60%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* ─── 2. QUICK NAVIGATION RIBBON (Floating Overlap Card) ─── */}
      <section className="relative z-20 max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-12 -mt-8 sm:-mt-10 lg:-mt-12">
        <div className="bg-gradient-to-b from-white to-[#F7F8FA] rounded-[30px] p-2.5 border border-slate-200/90 shadow-[0px_18px_40px_-26px_rgba(20,26,69,0.35)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-emerald-100/90">
          
          {/* 1. Personal SIM-only */}
          <Link
            href="/plans"
            className="flex items-center gap-3.5 px-4 py-4 rounded-[20px] hover:bg-white/80 transition group cursor-pointer"
          >
            <div className="text-[#E01C5B] shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                <path d="M7.3 2.5H13.5L18.5 7.5V19.7A1.8 1.8 0 0 1 16.7 21.5H7.3A1.8 1.8 0 0 1 5.5 19.7V4.3A1.8 1.8 0 0 1 7.3 2.5Z" />
                <rect x="8.5" y="11" width="7" height="6.5" rx="1" />
                <path d="M12 11v6.5" />
                <path d="M8.5 14.25h7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-extrabold text-[#0D382D] group-hover:text-[#E01C5B] transition leading-5">
                Personal SIM-only
              </div>
              <div className="text-sm text-slate-600 leading-5 mt-1">Flexible plans for everyday life</div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E01C5B] group-hover:translate-x-1 transition ml-1 shrink-0" />
          </Link>

          {/* 2. Business SIM-only */}
          <Link
            href="/business-deals_sim-only-plans"
            className="flex items-center gap-3.5 px-4 py-4 rounded-[20px] hover:bg-white/80 transition group cursor-pointer"
          >
            <div className="text-[#E01C5B] shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase className="w-10 h-10 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-extrabold text-[#0D382D] group-hover:text-[#E01C5B] transition leading-5">
                Business SIM-only
              </div>
              <div className="text-sm text-slate-600 leading-5 mt-1">
                Reliable, cost-effective mobile<br className="hidden xl:inline" /> for your business
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E01C5B] group-hover:translate-x-1 transition ml-1 shrink-0" />
          </Link>

          {/* 3. Data-only SIMs */}
          <Link
            href="/data-only-plans"
            className="flex items-center gap-3.5 px-4 py-4 rounded-[20px] hover:bg-white/80 transition group cursor-pointer"
          >
            <div className="text-[#E01C5B] shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-10 h-10 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-extrabold text-[#0D382D] group-hover:text-[#E01C5B] transition leading-5">
                Data-only SIMs
              </div>
              <div className="text-sm text-slate-600 leading-5 mt-1">
                Stay connected on your tablet,<br className="hidden xl:inline" /> router or device
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E01C5B] group-hover:translate-x-1 transition ml-1 shrink-0" />
          </Link>

          {/* 4. Phones & Devices */}
          <Link
            href="/devices"
            className="flex items-center gap-3.5 px-4 py-4 rounded-[20px] hover:bg-white/80 transition group cursor-pointer"
          >
            <div className="text-[#E01C5B] shrink-0 group-hover:scale-105 transition-transform">
              <Smartphone className="w-10 h-10 stroke-[1.8]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-extrabold text-[#0D382D] group-hover:text-[#E01C5B] transition leading-5">
                Phones &amp; Devices
              </div>
              <div className="text-sm text-slate-600 leading-5 mt-1">
                Great value phones, including<br className="hidden xl:inline" /> refurbished options
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E01C5B] group-hover:translate-x-1 transition ml-1 shrink-0" />
          </Link>

        </div>
      </section>

      {/* ─── 3. DYNAMIC PLANS SECTION ("Find your fit") ───────────────────── */}
      <section id="plans" className="relative py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Ambient background decorative elements matching Figma export */}
        <div className="w-72 sm:w-80 h-[460px] left-0 bottom-10 absolute pointer-events-none rounded-r-[180px] bg-[#FFF0F4]/90 -z-0" />
        <div className="w-48 sm:w-64 h-[60px] right-0 bottom-0 absolute pointer-events-none rounded-tl-[180px] bg-gradient-to-t from-[#F59E0B] via-[#FB923C] to-[#F97316]/90 -z-0 opacity-90" />

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0D382D] tracking-tight">
            Find your fit
          </h2>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xl sm:text-2xl text-slate-700 font-normal">
            <span>Plans for you, your</span>
            <span className="relative font-normal text-slate-800 px-1">
              business
              <svg viewBox="0 0 80 8" fill="none" className="w-full h-2 absolute left-0 -bottom-1">
                <path d="M1 5 Q 40 1 79 5" stroke="#E01C5B" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            <span>and your devices.</span>
          </div>
        </div>

        {/* Category Switcher Pill Container (Figma 1190px pill) */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="w-full max-w-4xl p-1.5 bg-white rounded-full border border-slate-200/90 shadow-[0_10px_26px_-18px_rgba(20,26,69,0.25)] flex flex-wrap sm:flex-nowrap items-center justify-center gap-2">
            
            {/* Personal SIM-only */}
            <button
              onClick={() => setCategoryTab("personal")}
              className={`flex-1 min-h-[52px] px-6 sm:px-10 py-3 rounded-full text-base sm:text-lg font-extrabold transition-all flex items-center justify-center gap-3 cursor-pointer ${
                categoryTab === "personal"
                  ? "bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white shadow-[0_10px_22px_-12px_rgba(200,15,87,0.7)]"
                  : "text-[#0D382D] hover:text-[#E01C5B] hover:bg-slate-50"
              }`}
            >
              <User className={`w-5 h-5 stroke-[2.2] ${categoryTab === "personal" ? "text-white" : "text-[#E01C5B]"}`} />
              <span>Personal SIM-only</span>
            </button>

            {/* Business SIM-only */}
            <button
              onClick={() => setCategoryTab("business")}
              className={`flex-1 min-h-[52px] px-6 sm:px-10 py-3 rounded-full text-base sm:text-lg font-extrabold transition-all flex items-center justify-center gap-3 cursor-pointer ${
                categoryTab === "business"
                  ? "bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white shadow-[0_10px_22px_-12px_rgba(200,15,87,0.7)]"
                  : "text-[#0D382D] hover:text-[#E01C5B] hover:bg-slate-50"
              }`}
            >
              <Briefcase className={`w-5 h-5 stroke-[2.2] ${categoryTab === "business" ? "text-white" : "text-[#E01C5B]"}`} />
              <span>Business SIM-only</span>
            </button>

            {/* Data-only SIMs */}
            <button
              onClick={() => setCategoryTab("data-only")}
              className={`flex-1 min-h-[52px] px-6 sm:px-10 py-3 rounded-full text-base sm:text-lg font-extrabold transition-all flex items-center justify-center gap-3 cursor-pointer ${
                categoryTab === "data-only"
                  ? "bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white shadow-[0_10px_22px_-12px_rgba(200,15,87,0.7)]"
                  : "text-[#0D382D] hover:text-[#E01C5B] hover:bg-slate-50"
              }`}
            >
              <Layers className={`w-5 h-5 stroke-[2.2] ${categoryTab === "data-only" ? "text-white" : "text-[#E01C5B]"}`} />
              <span>Data-only SIMs</span>
            </button>
          </div>
        </div>

        {/* Contract Duration Switcher */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-5 sm:gap-7 mb-12">
          
          {/* Label with pink calendar icon & vertical divider */}
          <div className="flex items-center gap-3 pr-0 sm:pr-7 sm:border-r border-slate-300">
            <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200/80 flex items-center justify-center text-[#E01C5B]">
              <Calendar className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-[#0D382D] font-extrabold text-lg sm:text-xl">
              Choose your contract length
            </span>
          </div>

          {/* Toggle Pills */}
          <div className="bg-white rounded-full border border-slate-200/90 shadow-[0px_1px_2px_0px_rgba(20,26,69,0.05)] flex items-center overflow-hidden">
            <button
              onClick={() => setDurationTab("24-months")}
              className={`w-36 min-h-11 px-4 py-2.5 rounded-full font-bold text-base transition-all cursor-pointer ${
                durationTab === "24-months"
                  ? "bg-gradient-to-b from-[#FA2268] to-[#E01C5B] text-white shadow-sm"
                  : "text-[#0D382D] hover:text-[#E01C5B]"
              }`}
            >
              24 months
            </button>
            <button
              onClick={() => setDurationTab("12-months")}
              className={`w-36 min-h-11 px-4 py-2.5 rounded-full font-bold text-base transition-all cursor-pointer ${
                durationTab === "12-months"
                  ? "bg-gradient-to-b from-[#FA2268] to-[#E01C5B] text-white shadow-sm"
                  : "text-[#0D382D] hover:text-[#E01C5B]"
              }`}
            >
              12 months
            </button>
            <button
              onClick={() => setDurationTab("30-days")}
              className={`w-36 min-h-11 px-4 py-2.5 rounded-full font-bold text-base transition-all cursor-pointer ${
                durationTab === "30-days"
                  ? "bg-gradient-to-b from-[#FA2268] to-[#E01C5B] text-white shadow-sm"
                  : "text-[#0D382D] hover:text-[#E01C5B]"
              }`}
            >
              30 days
            </button>
          </div>
        </div>

        {/* Dynamic Plan Cards Grid */}
        {loadingPlans ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-[#E01C5B] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Loading live plans...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-base font-semibold">No plans found in this category.</p>
            <Link href="/plans" className="mt-3 inline-block text-sm font-bold text-[#E01C5B] hover:underline">
              Browse all plans →
            </Link>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((plan, idx) => {
              const price = getPlanPrice(plan);
              const allowance = plan.data_allowance || (idx === 0 ? "3GB" : idx === 1 ? "10GB" : "30GB");
              const planTitle = idx === 0 ? "Zoiko Plus 3GB" : idx === 1 ? "Zoiko Standard 10GB" : "Zoiko Max 30GB";

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_18px_40px_-24px_rgba(20,26,69,0.30)] flex flex-col overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Card Header Strip with SIM icon & Top-Right Orange Curve */}
                  <div className="relative min-h-[76px] px-5 py-5 bg-gradient-to-r from-[#FFF5F8] via-[#FAF6F8] to-white border-b border-slate-100 flex items-center justify-between overflow-hidden">
                    <div className="flex items-center gap-3.5">
                      <div className="pr-3.5 border-r border-pink-200/80">
                        <div className="text-[#E01C5B] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                            <path d="M7.3 2.5H13.5L18.5 7.5V19.7A1.8 1.8 0 0 1 16.7 21.5H7.3A1.8 1.8 0 0 1 5.5 19.7V4.3A1.8 1.8 0 0 1 7.3 2.5Z" />
                            <rect x="8.5" y="11" width="7" height="6.5" rx="1" />
                            <path d="M12 11v6.5" />
                            <path d="M8.5 14.25h7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-base font-extrabold text-[#E01C5B]">
                        {plan.name || planTitle}
                      </span>
                    </div>

                    {/* Top-Right Decorative Orange Curve */}
                    <div className="absolute right-0 top-0 w-20 h-9 pointer-events-none overflow-hidden">
                      <svg viewBox="0 0 80 44" fill="none" className="w-20 h-11">
                        <path d="M0 0 C45 6 70 24 80 44" stroke="#F97316" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-7 flex-1 flex flex-col justify-between gap-6">
                    
                    {/* Big Data & Price */}
                    <div className="text-center">
                      <div className="text-5xl font-extrabold text-[#0D382D] tracking-tight">
                        {allowance}
                      </div>
                      <div className="flex items-baseline justify-center gap-1.5 mt-2">
                        <span className="text-5xl font-extrabold text-[#E01C5B]">£{price}</span>
                        <span className="text-[#0D382D] text-xl font-semibold">/month</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-normal">
                        incl. VAT · {durationTab.replace("-", " ")} contract
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 py-4 border-t border-b border-slate-100 text-sm sm:text-base text-slate-700">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#E01C5B] stroke-[2.5] shrink-0 mt-0.5" />
                        <span>{idx === 2 ? "Unlimited UK calls & texts" : "500 UK minutes"}</span>
                      </div>
                      {idx !== 2 && (
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-[#E01C5B] stroke-[2.5] shrink-0 mt-0.5" />
                          <span className="text-slate-600">UK texts: [catalogue value]</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#E01C5B] stroke-[2.5] shrink-0 mt-0.5" />
                        <span>Wi-Fi Calling &amp; eSIM <span className="text-xs text-slate-500">(compatible devices)</span></span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#E01C5B] stroke-[2.5] shrink-0 mt-0.5" />
                        <span>{getEuRoamingLabel(plan)}</span>
                      </div>
                    </div>

                    {/* Price Rise Notice */}
                    <div className="text-center text-xs text-slate-400 font-normal">
                      Price rises: [£/p and date — catalogue] · Upfront: [catalogue]
                    </div>

                    {/* Dual Action Buttons (Choose plan + Full plan details) */}
                    <div className="flex flex-col gap-3 pt-1">
                      <button
                        onClick={() => setSimTypePlan(plan)}
                        className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-base shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] hover:brightness-105 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Choose plan</span>
                        <ChevronRight className="w-4 h-4 stroke-[2.4]" />
                      </button>

                      <Link
                        href={`/plans?category=${categoryTab}`}
                        className="w-full py-3 px-6 rounded-full bg-white text-[#E01C5B] border border-[#E01C5B] font-extrabold text-base hover:bg-pink-50 transition text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Full plan details</span>
                        <ChevronRight className="w-4 h-4 text-[#E01C5B] stroke-[2.4]" />
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Explore All Plans Bar */}
        <div className="relative z-10 mt-12 flex flex-wrap items-center justify-center gap-7">
          <Link
            href="/plans"
            className="px-8 py-3.5 rounded-full bg-white text-[#E01C5B] border-2 border-[#E01C5B] font-extrabold text-lg sm:text-xl hover:bg-pink-50 transition shadow-xs flex items-center gap-2.5 cursor-pointer"
          >
            <User className="w-5 h-5 text-[#E01C5B] stroke-[2.2]" />
            <span>Explore all personal plans</span>
            <ChevronRight className="w-4 h-4 text-[#E01C5B] stroke-[2.4]" />
          </Link>

          <div className="flex items-center gap-3.5 text-base font-bold text-[#E01C5B]">
            <Link href="/business-deals_sim-only-plans" className="hover:underline flex items-center gap-1">
              <span>Business plans</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/data-only-plans" className="hover:underline flex items-center gap-1">
              <span>Data-only plans</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/devices" className="hover:underline flex items-center gap-1">
              <span>Phones &amp; Devices</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </Link>
          </div>
        </div>

        {/* 4-Tool Quick Action Strip */}
        <div className="relative z-10 mt-12 p-2 bg-[#FFF7F9] rounded-full border border-pink-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-pink-200/80 text-center">
          <a
            href="https://coverage.ee.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-full hover:bg-white transition flex items-center justify-center gap-3 text-lg font-extrabold text-[#0D382D] group"
          >
            <Radio className="w-6 h-6 text-[#E01C5B] stroke-[2.2] group-hover:scale-105 transition-transform" />
            <span>Check coverage</span>
          </a>
          <Link
            href="/switch-and-save"
            className="p-3.5 rounded-full hover:bg-white transition flex items-center justify-center gap-3 text-lg font-extrabold text-[#0D382D] group"
          >
            <ArrowLeftRight className="w-6 h-6 text-[#E01C5B] stroke-[2.2] group-hover:scale-105 transition-transform" />
            <span>Keep your number</span>
          </Link>
          <Link
            href="/activate-your-sim"
            className="p-3.5 rounded-full hover:bg-white transition flex items-center justify-center gap-3 text-lg font-extrabold text-[#0D382D] group"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#E01C5B] group-hover:scale-105 transition-transform">
              <path d="M7.3 2.5H13.5L18.5 7.5V19.7A1.8 1.8 0 0 1 16.7 21.5H7.3A1.8 1.8 0 0 1 5.5 19.7V4.3A1.8 1.8 0 0 1 7.3 2.5Z" />
              <rect x="8.5" y="11" width="7" height="6.5" rx="1" />
              <path d="M12 11v6.5" />
              <path d="M8.5 14.25h7" />
            </svg>
            <span>eSIM or physical SIM</span>
          </Link>
          <Link
            href="/dashboard/compare-plans"
            className="p-3.5 rounded-full hover:bg-white transition flex items-center justify-center gap-3 text-lg font-extrabold text-[#0D382D] group"
          >
            <Scale className="w-6 h-6 text-[#E01C5B] stroke-[2.4] group-hover:scale-105 transition-transform" />
            <span>Compare plans</span>
          </Link>
        </div>

      </section>

      {/* ─── 4. WHY ZOIKO SECTION ("Clear choices, real help") ────────────── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Image with Network Pill Badge (Figma height 668px) */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-[557px] h-[500px] sm:h-[600px] lg:h-[668px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/images/updated-home-page/A woman relaxing at home with her dog.png"
                  alt="A woman relaxing at home with her dog"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 557px"
                />
                <div className="absolute bottom-5 left-5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2">
                  <PawPrint className="w-4 h-4" />
                  <span>The Animal &amp; Music Loving Network</span>
                </div>
              </div>
            </div>

            {/* Right Copy & Stats */}
            <div className="lg:col-span-6 flex flex-col items-start gap-5">
              <div className="flex flex-col items-start gap-2">
                <span className="text-[#0D382D] text-xs sm:text-sm font-extrabold uppercase tracking-[3px]">
                  Why Zoiko
                </span>
                <div className="w-16 h-1 bg-[#E01C5B] rounded-full" />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0D382D] tracking-tight">
                Clear choices, real help
              </h2>

              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                Flexible plan lengths with the term always shown beside the price, tools to manage everything yourself, UK-based help and eSIM on compatible phones.
              </p>

              {/* 3 Metric Cards */}
              <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#E01C5B]">3</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    Plan lengths: 30 days, 12 or 24 months
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#E01C5B]">1</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    Working day usual transfer after switch
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#E01C5B]">24/7</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    Zovie virtual assistant for quick answers
                  </div>
                </div>
              </div>

              {/* Key Bullet List */}
              <div className="space-y-2 pt-2 text-sm sm:text-base font-medium text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#E01C5B] shrink-0" />
                  <span>Manage usage, top-ups and numbers in My Zoiko</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#E01C5B] shrink-0" />
                  <span>Talk to our UK team in published hours</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── 5. SWITCH TO ZOIKO IN THREE STEPS ──────────────────────────────── */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Stepper Flow */}
          <div className="lg:col-span-7 flex flex-col items-start gap-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0D382D] tracking-tight">
              Switch to Zoiko in three steps
            </h2>

            <div className="relative space-y-8 pl-4 sm:pl-6 border-l-2 border-pink-200">
              
              {/* Step 1 */}
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[30px] sm:-left-[38px] top-0 w-10 h-10 rounded-2xl bg-gradient-to-b from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  01
                </div>
                <div className="pl-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0D382D]">Choose your plan</h3>
                  <p className="text-slate-600 text-sm sm:text-base mt-1">
                    Pick your data and plan length. Every personal plan price includes VAT with transparent terms.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[30px] sm:-left-[38px] top-0 w-10 h-10 rounded-2xl bg-gradient-to-b from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  02
                </div>
                <div className="pl-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0D382D]">
                    Request your PAC — or use a new number
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base mt-1">
                    To keep your number, text <strong className="text-[#0D382D]">PAC</strong> to <strong className="text-[#0D382D]">65075</strong>. To leave and get a new number, text <strong className="text-[#0D382D]">STAC</strong> to <strong className="text-[#0D382D]">75075</strong>. Both are 100% free.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-[30px] sm:-left-[38px] top-0 w-10 h-10 rounded-2xl bg-gradient-to-b from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                  03
                </div>
                <div className="pl-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0D382D]">Activate and track</h3>
                  <p className="text-slate-600 text-sm sm:text-base mt-1">
                    We show each step live as it’s confirmed. Number transfers normally complete within one working day of the switch request.
                  </p>
                </div>
              </div>

            </div>

            <Link
              href="/switch-and-save"
              className="px-7 py-3 rounded-full bg-white text-[#E01C5B] border-2 border-[#E01C5B] font-extrabold text-base hover:bg-pink-50 transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>How switching works</span>
              <ChevronRight className="w-4 h-4 text-[#E01C5B]" />
            </Link>
          </div>

          {/* Right Image (Figma height 742px) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[557px] h-[520px] sm:h-[620px] lg:h-[742px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src="/images/updated-home-page/A person holding a smartphone.png"
                alt="A person holding a smartphone with SIM signal"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 557px"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── 6. TRAVELLING ABROAD (Roaming Section) ─────────────────────────── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-white border-t border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Image with EU Roaming Badge */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/images/updated-home-page/View of an aeroplane wing above the clouds.png"
                  alt="View of an aeroplane wing above the clouds"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                <div className="absolute bottom-4 left-4 px-4 py-2 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>EU roaming in eligible destinations</span>
                </div>
              </div>
            </div>

            {/* Right Card: Country Selection & Check What's Included */}
            <div className="lg:col-span-6 flex flex-col items-start gap-5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0D382D] tracking-tight">
                Travelling abroad?
              </h2>

              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                See what your plan includes before you go — included EU allowances, out-of-bundle rates and fair-use rules.
              </p>

              {/* Destination Form Card (Note: 'Your plan' button REMOVED as requested) */}
              <div className="w-full p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-[0_18px_40px_-24px_rgba(20,26,69,0.25)] flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="destination-select" className="text-sm font-bold text-[#0D382D] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#E01C5B]" />
                    <span>Choose your destination</span>
                  </label>
                  <select
                    id="destination-select"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#E01C5B] cursor-pointer"
                  >
                    {POPULAR_DESTINATIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleCheckWhatsIncluded}
                  className="w-full sm:w-auto mt-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] hover:brightness-105 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Check what’s included</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── 7. GOOD CONNECTIONS DO GOOD (Community) ────────────────────────── */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-center">
          
          {/* Left Overlapping White Card */}
          <div className="relative z-10 w-full lg:w-[540px] xl:w-[580px] lg:-mr-16 xl:-mr-20 p-8 sm:p-12 lg:p-14 bg-white rounded-3xl border border-slate-100 shadow-[0_24px_50px_-24px_rgba(200,15,87,0.35)] flex flex-col items-start gap-3">
            <span className="text-[#E01C5B] text-xs sm:text-sm font-extrabold uppercase tracking-[2.5px]">
              The Animal &amp; Music Loving Network
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0D382D] tracking-tight leading-[1.12]">
              Good Connections Do<br />Good
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed pt-1 pb-3">
              We’re a mobile network for people who love animals and music. Find out about the community programmes we’re part of and the stories behind them.
            </p>
            <Link
              href="/animals-and-music"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] hover:brightness-105 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Discover our story</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right Images Composition: Portrait Concert + Stacked Dog & Cat */}
          <div className="mt-8 lg:mt-0 flex items-center gap-3 sm:gap-4 shrink-0 max-w-full overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {/* Tall Portrait Concert Image */}
            <div className="w-[260px] sm:w-[320px] lg:w-[353px] h-[420px] sm:h-[480px] lg:h-[500px] relative rounded-3xl overflow-hidden shadow-lg shrink-0">
              <Image
                src="/images/updated-home-page/A crowd enjoying a live music concert.png"
                alt="A crowd enjoying a live music concert"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 353px"
              />
            </div>

            {/* Two Stacked Images: Dog (top) & Cat (bottom) */}
            <div className="flex flex-col gap-3 sm:gap-4 w-[200px] sm:w-[260px] lg:w-[295px] shrink-0">
              <div className="w-full h-[202px] sm:h-[232px] lg:h-[242px] relative rounded-3xl overflow-hidden shadow-md">
                <Image
                  src="/images/updated-home-page/A golden retriever puppy.png"
                  alt="A golden retriever puppy"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 295px"
                />
              </div>
              <div className="w-full h-[202px] sm:h-[232px] lg:h-[242px] relative rounded-3xl overflow-hidden shadow-md">
                <Image
                  src="/images/updated-home-page/A close-up of a cat.png"
                  alt="A close-up of a cat"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 295px"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 8. MORE FROM ZOIKO (Phones, Households, Business) ───────────────── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-extrabold text-[#E01C5B] uppercase tracking-[2.5px] mb-2">
              More from Zoiko
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D382D] tracking-tight">
              Phones, households and business
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Refurbished Smartphones */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/updated-home-page/A smartphone on a desk.png"
                  alt="A smartphone on a desk"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 380px"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0D382D]">Refurbished smartphones</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Live stock, prices, condition grades and warranty appear here when our device feed is connected.
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Stock feed pending
                  </span>
                </div>
                <Link href="/devices" className="text-sm font-extrabold text-[#E01C5B] hover:underline flex items-center gap-1 pt-2">
                  <span>Browse devices</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Household line */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/updated-home-page/A family spending time together at home.png"
                  alt="A family spending time together at home"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 380px"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0D382D]">Another line for your household</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Add a number for someone at home and manage it conveniently inside My Zoiko.
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Availability to confirm
                  </span>
                </div>
                <Link href="/plans" className="text-sm font-extrabold text-[#E01C5B] hover:underline flex items-center gap-1 pt-2">
                  <span>Find out more</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 3: Business SIMs */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/updated-home-page/Colleagues talking in a meeting.png"
                  alt="Colleagues talking in a meeting"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 380px"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0D382D]">Business SIMs</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    SIM-only plans for sole traders and growing teams, with a direct call-back option for multiple lines.
                  </p>
                </div>
                <Link href="/business-deals_sim-only-plans" className="text-sm font-extrabold text-[#E01C5B] hover:underline flex items-center gap-1 pt-2">
                  <span>Explore business plans</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 9. HELP & SUPPORT ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex flex-col items-center gap-2 mb-3">
            <span className="text-xs sm:text-sm font-extrabold text-[#E01C5B] uppercase tracking-[2.52px]">
              Help &amp; support
            </span>
            <div className="w-16 h-1 bg-[#E01C5B] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0D382D] tracking-tight">
            Help before and after you buy
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6">
          
          {/* Card 1: 24/7 Zovie Assistant */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#FFF5F8] via-[#FFF9FA] to-white border border-pink-100/70 shadow-[0_18px_40px_-24px_rgba(20,26,69,0.15)] flex flex-col justify-between gap-6">
            <div>
              <div className="w-11 h-11 text-[#E01C5B] flex items-center justify-start mb-4">
                <MessageSquare className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#0D382D]">Instant answers, any time</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2.5">
                Zovie is our virtual assistant and is available 24/7 for quick answers. It isn’t a person — you can ask for our team at any time.
              </p>
              
              <div className="flex items-center gap-3 mt-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-100/60 flex items-center justify-center text-[#E01C5B] shrink-0">
                  <MessageSquare className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="font-bold text-[#0D382D] text-base leading-tight">Zovie</div>
                  <div className="text-xs text-slate-500 mt-0.5">Virtual assistant · 24/7</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => openChat()}
              className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] hover:brightness-105 transition flex items-center justify-center gap-2 self-start cursor-pointer"
            >
              <span>Chat with Zovie</span>
            </button>
          </div>

          {/* Card 2: Talk to our UK team */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#FFF5F8] via-[#FFF9FA] to-white border border-pink-100/70 shadow-[0_18px_40px_-24px_rgba(20,26,69,0.15)] flex flex-col justify-between gap-6">
            <div>
              <div className="w-11 h-11 text-[#E01C5B] flex items-center justify-start mb-4">
                <Headphones className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#0D382D]">Talk to our UK team</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2.5">
                Phone <a href="tel:02071646399" className="text-[#E01C5B] font-bold underline">020 7164 6399</a> or email{" "}
                <a href="mailto:help@zoikomobile.co.uk" className="text-[#E01C5B] font-bold underline">help@zoikomobile.co.uk</a>. [Published human support hours]
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6 mt-auto">
              <div className="w-12 h-12 rounded-2xl bg-pink-100/60 flex items-center justify-center text-[#E01C5B] shrink-0">
                <Headphones className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="font-bold text-[#0D382D] text-base leading-tight">Zoiko Customer Care</div>
                <div className="text-xs text-slate-500 mt-0.5">UK based · Human support</div>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Quick Actions Ribbon */}
        <div className="w-full bg-[#FFF5F8] border border-pink-100/70 rounded-full py-3.5 px-4 sm:px-6 flex flex-wrap md:flex-nowrap items-center divide-y md:divide-y-0 md:divide-x divide-pink-200/70 shadow-sm">
          <Link
            href="/dashboard/orders"
            className="flex-1 py-1.5 md:py-0 px-3 text-center text-sm sm:text-base font-bold text-[#0D382D] hover:text-[#E01C5B] transition flex items-center justify-center gap-1.5 group"
          >
            <span>Track an order</span>
            <ChevronRight className="w-4 h-4 text-[#E01C5B] group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/activate-your-sim"
            className="flex-1 py-1.5 md:py-0 px-3 text-center text-sm sm:text-base font-bold text-[#0D382D] hover:text-[#E01C5B] transition flex items-center justify-center gap-1.5 group"
          >
            <span>Activate your SIM</span>
            <ChevronRight className="w-4 h-4 text-[#E01C5B] group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/dashboard/support"
            className="flex-1 py-1.5 md:py-0 px-3 text-center text-sm sm:text-base font-bold text-[#0D382D] hover:text-[#E01C5B] transition flex items-center justify-center gap-1.5 group"
          >
            <span>Lost or stolen SIM</span>
            <ChevronRight className="w-4 h-4 text-[#E01C5B] group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/top-up"
            className="flex-1 py-1.5 md:py-0 px-3 text-center text-sm sm:text-base font-bold text-[#0D382D] hover:text-[#E01C5B] transition flex items-center justify-center gap-1.5 group"
          >
            <span>Top up</span>
            <ChevronRight className="w-4 h-4 text-[#E01C5B] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </section>

      {/* ─── 10. QUESTIONS BEFORE YOU BUY (FAQ Accordion) ───────────────────── */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Heading & Subtitle */}
          <div className="lg:col-span-5 pt-2">
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0D382D] tracking-tight leading-[1.15]">
              Questions before you<br className="hidden sm:inline" /> buy
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-md">
              Quick answers, with links to the full terms.
            </p>
          </div>

          {/* Right Column: White Card with Accordion */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-[0_18px_40px_-24px_rgba(20,26,69,0.15)] p-6 sm:p-8 divide-y divide-slate-100">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 transition">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 font-bold text-base sm:text-lg text-[#0D382D] hover:text-[#E01C5B] transition py-1 cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#E01C5B] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed pr-6">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── 11. WILL IT WORK WHERE YOU ARE? (Coverage Checker) ─────────────── */}
      <section id="coverage" className="py-20 lg:py-24 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D382D] tracking-tight">
            Will it work where you are?
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            Check predicted 4G and 5G coverage for a postcode. Predictions aren’t guarantees — coverage varies indoors, by building and by device.
          </p>

          {/* Postcode Form Box */}
          <form
            onSubmit={handleCheckCoverage}
            className="mt-8 p-2 bg-white rounded-full border border-slate-300 shadow-[0_24px_50px_-20px_rgba(20,26,69,0.25)] flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto"
          >
            <div className="flex-1 flex items-center gap-3 pl-4 py-2 w-full">
              <MapPin className="w-5 h-5 text-[#E01C5B] shrink-0" />
              <input
                type="text"
                value={coveragePostcode}
                onChange={(e) => {
                  setCoveragePostcode(e.target.value.toUpperCase());
                  if (coverageError) setCoverageError("");
                }}
                placeholder="Enter your postcode, e.g. SW1A 1AA"
                className="w-full text-sm sm:text-base text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none uppercase font-semibold"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E01C5B] to-[#C80F57] text-white font-extrabold text-sm shadow-md hover:brightness-105 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Check coverage</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </form>

          {coverageError && (
            <p className="mt-3 text-xs text-rose-600 font-semibold">{coverageError}</p>
          )}

          <div className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#E01C5B]" />
            <span>Opens live UK EE coverage map powered by the UK&apos;s No.1 network</span>
          </div>

        </div>
      </section>

      {/* ─── SIM TYPE MODAL ────────────────────────────────────────────────── */}
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={handleConfirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

    </div>
  );
}

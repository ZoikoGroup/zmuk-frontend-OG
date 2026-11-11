"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";
import { Check, ArrowRight, ShieldCheck, Truck, Smartphone, Zap, Sparkles, HelpCircle, Heart, Music, PhoneCall } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const SIM_SLUG = "sim-only-plans";

const DURATIONS = ["24 Months Plan", "12 Month Plan", "30 Days Plan"] as const;
type Duration = (typeof DURATIONS)[number];

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Feature {
  id: number;
  title: string;
  description: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  price_24: string | null;
  price_12: string | null;
  price_30: string | null;
  data_allowance: string | null;
  tier_label: string | null;
  is_popular: boolean;
  category: Category | null;
  features: Feature[];
  transatelID: string | null;
  final_price: string;
  duration_days: number;
}

function priceFor(plan: Plan, duration: Duration): string {
  const raw =
    duration.startsWith("24")
      ? plan.price_24
      : duration.startsWith("12")
        ? plan.price_12
        : plan.price_30;
  return Number(raw ?? plan.price).toFixed(2);
}

function bullets(plan: Plan): string[] {
  if (plan.features && plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PlanCheckIcon({ dark }: { dark?: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${dark ? "text-[#00E575]" : "text-[#C41E3A]"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const FAQS = [
  {
    q: "Who can get the Black Friday offer?",
    tag: "NEW LINES",
    a: "The 30% discount applies to the monthly charge on selected SIM-only plans for eligible new lines joining Zoiko Mobile."
  },
  {
    q: "How long does the discount last?",
    tag: "3 MONTHS",
    a: "The promotional discount applies for your first three months. After that, your plan's standard monthly price applies seamlessly."
  },
  {
    q: "When does the sale run?",
    tag: "27–30 NOV",
    a: "Our Black Friday promotions run from Friday 27 November through Cyber Monday 30 November 2026."
  },
  {
    q: "Can I keep my number when switching?",
    tag: "YES",
    a: "You can keep your current number easily. Simply request a free PAC code from your existing provider and we will transfer it."
  },
  {
    q: "Do SIMs require credit checks?",
    tag: "NO",
    a: "No credit checks are required for any of our SIM-only plans. Everyone is welcome to connect."
  },
  {
    q: "Do prices include VAT and price rises?",
    tag: "VAT INCLUDED",
    a: "All prices shown include standard UK VAT. We operate with complete transparency and no unexpected hidden surcharges."
  }
];

export default function BlackFridayPage() {
  const router = useRouter();
  const { addPlanToCart } = useCart();

  const [duration, setDuration] = useState<Duration>("24 Months Plan");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

  // Load plans from API (same as homepage)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (!res.ok) throw new Error("Failed to load plans");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllPlans(data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // SIM-only plans only, capped at 3 plans just like homepage
  const simPlans = useMemo(() => {
    const filtered = allPlans.filter((p) => {
      const slug = (p.category?.slug ?? "").toLowerCase();
      const name = (p.category?.name ?? "").toLowerCase();
      return slug === SIM_SLUG || name.includes("sim") || slug === "personal";
    });
    const result = filtered.length > 0 ? filtered : allPlans;
    return result.slice(0, 3);
  }, [allPlans]);

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
    <div className="relative w-full overflow-hidden bg-white text-[#1E1E24] font-sans">
      {/* Custom Keyframe Animations from Reference HTML */}
      <style jsx global>{`
        @keyframes uk-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .uk-marquee {
          display: flex;
          width: max-content;
          animation: uk-scroll 32s linear infinite;
        }
        .uk-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes uk-swing {
          0%,
          100% {
            transform: rotate(-3.5deg);
          }
          50% {
            transform: rotate(3.5deg);
          }
        }
        .uk-swing {
          transform-origin: top center;
          animation: uk-swing 4s ease-in-out infinite;
        }

        @keyframes uk-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .uk-float {
          animation: uk-float 4.5s ease-in-out infinite;
        }

        @keyframes uk-glow {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.04);
          }
        }
        .uk-glow {
          animation: uk-glow 3s ease-in-out infinite;
        }

        @keyframes uk-pulse-slow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.06);
          }
        }
        .uk-pulse-slow {
          animation: uk-pulse-slow 4s ease-in-out infinite;
        }

        @keyframes uk-eq {
          0%,
          100% {
            transform: scaleY(0.25);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .uk-eq span {
          display: inline-block;
          transform-origin: bottom;
          animation: uk-eq 1.2s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Modal for SIM Selection */}
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (WITH VIBRANT BACKGROUND BLASTS & ANIMATIONS)             */}
      {/* ========================================================================= */}
      <section
        aria-label="Black Friday 2026 Offer"
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(ellipse 65% 75% at 75% 45%, rgba(209,69,174,0.55) 0%, rgba(209,69,174,0) 70%), radial-gradient(ellipse 45% 60% at 5% 0%, rgba(246,100,160,0.32) 0%, rgba(246,100,160,0) 70%), linear-gradient(135deg, #12041A 0%, #2A0A3C 55%, #4A1268 100%)",
        }}
      >
        {/* Animated Background Blasts, Light Trails, Sparkles & Shapes */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Glowing Trail Curves */}
          <svg className="w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 1440 640">
            <defs>
              <linearGradient id="heroTrail" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#F664A0" stopOpacity="0" />
                <stop offset="0.5" stopColor="#F664A0" stopOpacity="0.8" />
                <stop offset="1" stopColor="#B455E8" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="heroTrail2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#FFD60A" stopOpacity="0" />
                <stop offset="0.6" stopColor="#FFD60A" stopOpacity="0.6" />
                <stop offset="1" stopColor="#FFD60A" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M-40 580 C 360 490, 640 640, 980 490 S 1380 280, 1500 250"
              fill="none"
              stroke="url(#heroTrail)"
              strokeWidth="4"
            />
            <path
              d="M520 680 C 820 580, 1100 620, 1500 490"
              fill="none"
              stroke="url(#heroTrail2)"
              strokeWidth="2"
            />
          </svg>

          {/* Floating Outline Tag/Capsule Blast Left */}
          <div className="uk-float absolute left-6 top-16 w-12 h-12 rounded-2xl border-2 border-white/20 -rotate-12 pointer-events-none" />
          <div className="uk-float absolute left-24 bottom-24 w-8 h-8 rounded-lg border border-pink-300/30 rotate-45 pointer-events-none" />

          {/* Sparkle Stars & Confetti Rectangles (Blasts) */}
          {/* Top-left yellow confetti bar */}
          <div className="uk-float absolute left-14 top-10 w-4 h-1.5 rounded-full bg-[#FFD60A] -rotate-[25deg] shadow-[0_0_8px_#FFD60A]" />
          {/* Four-point Sparkle 1 */}
          <div className="uk-glow absolute left-[18%] top-[14%] pointer-events-none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFD60A">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          {/* Four-point Sparkle 2 */}
          <div className="uk-glow absolute left-[44%] top-[10%] pointer-events-none [animation-delay:1.2s]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F664A0">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          {/* Four-point Sparkle 3 near Offer Box */}
          <div className="uk-glow absolute left-[48%] top-[56%] pointer-events-none [animation-delay:2s]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8CC6">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          {/* Confetti Particle Blasts */}
          <div className="uk-float absolute left-[35%] bottom-[18%] w-3.5 h-1.5 rounded-sm bg-[#2AA672] rotate-[35deg]" />
          <div className="uk-float absolute left-[48%] bottom-[8%] w-3 h-1 rounded-sm bg-white/70 rotate-[50deg]" />
          <div className="uk-float absolute right-[45%] top-[18%] w-3 h-1.5 rounded-sm bg-[#FFD60A] -rotate-[40deg]" />

          {/* Floating Music Note & Paw Print near Couple */}
          <div className="uk-float absolute right-[42%] top-[30%] pointer-events-none text-pink-300/80 text-xl font-bold">
            ♪
          </div>
          <div className="uk-float absolute right-[44%] bottom-[24%] pointer-events-none text-pink-400/70 text-lg [animation-delay:1.5s]">
            🐾
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Copy + Offer Box */}
            <div className="flex flex-col items-start gap-6 lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD60A] px-4 py-1.5 text-xs font-black tracking-widest text-[#2A1E00] shadow-md">
                <Sparkles className="w-4 h-4 text-[#A3157A]" />
                BLACK FRIDAY SALE 2026
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.05] drop-shadow-[0_4px_30px_rgba(60,0,40,0.4)]">
                Stay connected{" "}
                <span className="bg-gradient-to-r from-[#FF8CC6] via-[#F664A0] to-[#C77DFF] bg-clip-text text-transparent">
                  to what you love.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-lg sm:text-xl font-medium text-[#F1DDF2] leading-relaxed">
                Black Friday savings on selected Zoiko Mobile UK SIM-only plans.
              </p>

              {/* Offer Panel (Dominant 30% Off Box) */}
              <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white text-[#1E1E24] shadow-[0px_22px_50px_0px_rgba(40,0,40,0.45)] ring-2 ring-[#FFD60A]/80 transition-transform duration-300 hover:scale-[1.01]">
                {/* Header bar */}
                <div className="flex items-center justify-between bg-[#12041A] px-5 py-2.5 text-white">
                  <span className="text-xs font-extrabold tracking-widest text-[#FFD60A]">
                    BLACK FRIDAY OFFER
                  </span>
                  <span className="text-xs font-black tracking-widest text-[#FF8CC6]">
                    27 – 30 NOV
                  </span>
                </div>

                {/* Offer details */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
                  <div className="flex items-baseline gap-2 bg-gradient-to-br from-[#C41E3A] to-[#A3157A] text-white px-5 py-4 rounded-xl shadow-md min-w-[140px] justify-center">
                    <span className="text-5xl font-black leading-none">30%</span>
                    <span className="text-lg font-black tracking-wider">OFF</span>
                  </div>

                  <div className="flex-1 border-t sm:border-t-0 sm:border-l border-pink-100 sm:pl-5 text-left">
                    <p className="text-sm sm:text-base font-bold text-gray-800 leading-snug">
                      the monthly charge on selected SIM-only plans for your{" "}
                      <span className="text-[#C41E3A] font-extrabold">first 3 months</span>
                      , for eligible new lines
                    </p>
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      e.g. 12GB Value Pack: £8.50/mo, then £12.14/mo on 24-month plan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Note */}
              <p className="max-w-xl text-xs text-[#D8C2DC] leading-normal">
                Selected SIM-only plans, eligible new lines only. Offer subject to approval. Standard monthly price applies after the first three months.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href="#plans"
                  className="inline-flex items-center gap-3 rounded-xl bg-[#C41E3A] px-8 py-4 text-base font-extrabold text-white shadow-[0px_12px_30px_0px_rgba(196,30,58,0.5)] transition-all hover:bg-[#A3157A] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore SIM-only plans
                  <ArrowRight className="w-5 h-5" />
                </a>

                <Link
                  href="/devices"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#A3157A] shadow-md transition-all hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Smartphone className="w-5 h-5 text-[#C41E3A]" />
                  Shop Smartphones
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Visual with Couple + Dog & Hanging Swing Sign */}
            <div className="relative flex justify-center items-center lg:col-span-5">
              {/* Outer Glow Disc & Neon Ring */}
              <div className="uk-glow absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-[#F664A0]/40 to-[#A3157A]/40 blur-2xl pointer-events-none" />

              {/* Image Container with Neon Border */}
              <div className="relative w-full max-w-[500px] aspect-[578/510] rounded-[34px] overflow-hidden shadow-[0px_30px_70px_0px_rgba(40,0,40,0.65)] ring-4 ring-[#F664A0]/55 bg-gradient-to-br from-[#2A0A3C] to-[#12041A]">
                <Image
                  src="/images/landing-page/Gradient (21).png"
                  alt="Zoiko Mobile UK Black Friday Celebration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Hanging Swing Sign hanging over the top-right corner of the image */}
              <div className="absolute -top-10 right-2 sm:right-4 z-20 pointer-events-none">
                <div className="uk-swing flex flex-col items-center">
                  {/* Hanging Cord */}
                  <div className="w-[2px] h-12 bg-gray-900/90 shadow-sm" />
                  {/* Black Tag with Hole & Pink SALE */}
                  <div className="relative bg-[#120417] text-white border-2 border-[#D145AE] px-5 py-3 rounded-2xl shadow-2xl text-center backdrop-blur-md min-w-[110px]">
                    {/* Hole circle at top */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-100/90 shadow-inner" />
                    <span className="block text-[10px] font-black tracking-widest uppercase text-white/90 pt-1">
                      BLACK
                    </span>
                    <span className="block text-[11px] font-black tracking-widest uppercase text-white leading-none">
                      FRIDAY
                    </span>
                    <span className="block text-base font-black tracking-wider text-[#FF64A0] leading-tight drop-shadow-[0_0_8px_#FF64A0]">
                      SALE
                    </span>
                    <span className="block text-[8px] font-extrabold tracking-wider text-pink-200 uppercase mt-0.5">
                      NOV 27 – 30
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INFINITE TICKER BAR (MARQUEE)                                         */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-[#120417] py-3.5 text-white border-y border-[#FFD60A]/30">
        <div className="uk-marquee flex items-center gap-8 whitespace-nowrap text-xs font-black tracking-widest uppercase">
          {[...Array(4)].map((_, idx) => (
            <React.Fragment key={idx}>
              <span className="flex items-center gap-2 text-[#FFD60A]">
                ★ BLACK FRIDAY · 27 NOV 2026
              </span>
              <span className="text-white/80">UNLIMITED MINUTES &amp; TEXTS</span>
              <span className="flex items-center gap-2 text-[#FF8CC6]">
                ★ CYBER MONDAY · 30 NOV 2026
              </span>
              <span className="text-white/80">5G INCLUDED AT NO EXTRA COST</span>
              <span className="flex items-center gap-2 text-[#5FE0A6]">
                ★ SIM-ONLY BLACK FRIDAY SAVINGS
              </span>
              <span className="text-white/80">NO CREDIT CHECKS</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION 1: BLACK FRIDAY DEALS 2026 (EXACT FIGMA LAYOUT & ANIMATIONS)   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#FFF8DC] px-4 py-20 sm:px-6 lg:px-8">
        {/* Left Swinging "SALE" Tag */}
        <div className="absolute top-0 left-6 sm:left-14 z-20 pointer-events-none">
          <div className="uk-swing flex flex-col items-center">
            {/* Hanging Cord */}
            <div className="w-[2px] h-[65px] bg-[#120417]" />
            {/* Red SALE Tag */}
            <div className="relative bg-[#C41E3A] text-white rounded-t-lg rounded-b-xl px-4 pt-6 pb-2.5 text-center shadow-[0_8px_20px_rgba(196,30,58,0.35)] min-w-[70px]">
              {/* Hole circle at top */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#FFF8DC]" />
              <span className="block text-base font-black tracking-wider leading-none">
                SALE
              </span>
            </div>
          </div>
        </div>

        {/* Right Swinging "BLACK FRIDAY" Tag */}
        <div className="absolute top-0 right-6 sm:right-16 z-20 pointer-events-none">
          <div className="uk-swing flex flex-col items-center [animation-delay:1s]">
            {/* Hanging Cord */}
            <div className="w-[2px] h-[90px] bg-[#120417]" />
            {/* Black & Yellow Tag */}
            <div className="relative bg-[#120417] text-[#FFD60A] border-2 border-[#D145AE] rounded-t-lg rounded-b-xl px-3.5 pt-6 pb-2.5 text-center shadow-[0_8px_20px_rgba(0,0,0,0.4)] min-w-[85px]">
              {/* Hole circle at top */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#FFF8DC]" />
              <span className="block text-xs font-black tracking-wider leading-tight">
                BLACK<br />FRIDAY
              </span>
            </div>
          </div>
        </div>

        {/* Confetti & Sparkles Floating on Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Yellow Sparkle Left */}
          <div className="uk-float absolute left-10 sm:left-24 top-1/2 -translate-y-1/2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>

          {/* Magenta Sparkle Right */}
          <div className="uk-float absolute right-8 sm:right-28 top-1/2 -translate-y-1/2 [animation-delay:1.5s]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#D145AE">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>

          {/* Tilted Rectangular Confetti */}
          <div className="absolute left-28 top-20 w-3.5 h-1.5 rounded-sm bg-[#F664A0] rotate-[30deg] opacity-75" />
          <div className="absolute left-48 bottom-16 w-3.5 h-1.5 rounded-sm bg-[#2AA672] -rotate-[25deg] opacity-75" />
          <div className="absolute right-40 top-24 w-3.5 h-1.5 rounded-sm bg-[#120417] -rotate-[35deg] opacity-60" />
          <div className="absolute right-24 bottom-16 w-3.5 h-1.5 rounded-sm bg-[#C41E3A] rotate-[45deg] opacity-75" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 mx-auto max-w-[1080px]">
          {/* Section Heading with Gradient Underline */}
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F5A3E] tracking-tight">
              Black Friday Deals 2026
            </h2>
            <span className="w-18 h-1 rounded-full bg-gradient-to-r from-[#C41E3A] to-[#FFD60A]" />
          </div>

          {/* 3 White Center-Aligned Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {/* CARD 1: SIM-Only Black Friday Deal */}
            <article className="relative flex flex-col items-center text-center justify-between rounded-[22px] bg-white p-7 sm:py-8 shadow-[0px_12px_34px_0px_rgba(80,50,0,0.10)] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_20px_45px_0px_rgba(80,50,0,0.18)]">
              {/* Diagonal Corner Ribbon "HERO DEAL" */}
              <div
                aria-hidden="true"
                className="absolute top-[18px] -right-[40px] rotate-[40deg] bg-[#120417] text-[#FFD60A] text-[10px] font-black tracking-widest px-11 py-1.5 shadow-sm uppercase select-none"
              >
                HERO DEAL
              </div>

              {/* SIM Card SVG Icon */}
              <div className="flex items-center justify-center mb-2">
                <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
                  <rect x="14" y="6" width="46" height="62" rx="6" fill="#F664A0" />
                  <path
                    d="M14 18 L26 6 H54 a6 6 0 0 1 6 6 V62 a6 6 0 0 1 -6 6 H20 a6 6 0 0 1 -6 -6z"
                    fill="#D145AE"
                  />
                  <rect x="24" y="28" width="26" height="22" rx="4" fill="#FFD60A" />
                  <path
                    d="M24 39h26M37 28v22M30 28v8M44 42v8"
                    stroke="#C49A00"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Card Texts */}
              <div className="flex flex-col items-center gap-1.5">
                <h3 className="text-[19px] font-extrabold text-[#1F5A3E] leading-snug">
                  SIM-Only Black Friday Deal
                </h3>
                <p className="text-[15px] font-bold text-[#1E1E24] leading-snug">
                  30% off the monthly charge for 3 months
                </p>
              </div>

              {/* Link CTA */}
              <div className="mt-5">
                <a
                  href="#plans"
                  className="inline-flex items-center gap-1 text-[15px] font-bold text-[#C41E3A] hover:underline transition-all"
                >
                  View plans →
                </a>
              </div>
            </article>

            {/* CARD 2: Certified Refurbished Phones */}
            <article className="relative flex flex-col items-center text-center justify-between rounded-[22px] bg-white p-7 sm:py-8 shadow-[0px_12px_34px_0px_rgba(80,50,0,0.10)] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_20px_45px_0px_rgba(80,50,0,0.18)]">
              {/* Fan-Out of 4 Smartphones */}
              <div className="relative h-[82px] w-48 flex items-end justify-center mb-2">
                <Image
                  src="/images/landing-page/manifest/84e86df6-b79d-46d9-a843-09ce709b0289.png"
                  alt="Pink iPhone"
                  width={46}
                  height={72}
                  className="absolute left-2 bottom-0 -rotate-12 drop-shadow-md z-10"
                />
                <Image
                  src="/images/landing-page/manifest/ea677e1b-28ea-4321-954d-b119745eb11e.png"
                  alt="Purple iPhone"
                  width={50}
                  height={80}
                  className="absolute left-14 bottom-0 -rotate-3 drop-shadow-lg z-20"
                />
                <Image
                  src="/images/landing-page/manifest/69d2bcc3-b071-4b5b-b48c-509f2ab4322c.png"
                  alt="Blue iPhone"
                  width={50}
                  height={80}
                  className="absolute left-24 bottom-0 rotate-3 drop-shadow-lg z-20"
                />
                <Image
                  src="/images/landing-page/manifest/959d0c7d-fd6c-4dd1-b0dc-a2523ad8bf93.png"
                  alt="Pixel"
                  width={46}
                  height={72}
                  className="absolute right-2 bottom-0 rotate-12 drop-shadow-md z-10"
                />
              </div>

              {/* Card Texts */}
              <div className="flex flex-col items-center gap-1.5">
                <h3 className="text-[19px] font-extrabold text-[#1F5A3E] leading-snug">
                  Certified Refurbished Phones
                </h3>
                <p className="text-[15px] font-bold text-[#1E1E24] leading-snug">
                  12-month warranty on every device
                </p>
              </div>

              {/* Link CTA */}
              <div className="mt-5">
                <Link
                  href="/devices"
                  className="inline-flex items-center gap-1 text-[15px] font-bold text-[#C41E3A] hover:underline transition-all"
                >
                  Shop phones →
                </Link>
              </div>
            </article>

            {/* CARD 3: Animals & Music */}
            <article className="relative flex flex-col items-center text-center justify-between rounded-[22px] bg-white p-7 sm:py-8 shadow-[0px_12px_34px_0px_rgba(80,50,0,0.10)] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_20px_45px_0px_rgba(80,50,0,0.18)]">
              {/* Circular Badge with Paw Print & Musical Notes */}
              <div className="flex items-center justify-center mb-2">
                <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
                  <circle cx="37" cy="37" r="34" fill="#F3E6FA" />
                  <g transform="translate(13 22) scale(1)" fill="#8023A0">
                    <ellipse cx="16" cy="21" rx="7" ry="6" />
                    <ellipse cx="7" cy="13" rx="3" ry="4" />
                    <ellipse cx="25" cy="13" rx="3" ry="4" />
                    <ellipse cx="12" cy="7" rx="3" ry="4" />
                    <ellipse cx="20" cy="7" rx="3" ry="4" />
                  </g>
                  <g
                    transform="translate(40 18)"
                    fill="none"
                    stroke="#C41E3A"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 26V6l14-3v19" />
                    <circle cx="3" cy="26" r="3.5" fill="#C41E3A" />
                    <circle cx="17" cy="22" r="3.5" fill="#C41E3A" />
                  </g>
                </svg>
              </div>

              {/* Card Texts */}
              <div className="flex flex-col items-center gap-1.5">
                <h3 className="text-[19px] font-extrabold text-[#1F5A3E] leading-snug">
                  Animals &amp; Music
                </h3>
                <p className="text-[15px] font-bold text-[#1E1E24] leading-snug">
                  A network for the things you love
                </p>
              </div>

              {/* Link CTA */}
              <div className="mt-5">
                <a
                  href="#animals-music"
                  className="inline-flex items-center gap-1 text-[15px] font-bold text-[#C41E3A] hover:underline transition-all"
                >
                  Discover more →
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 2: SIM-ONLY BLACK FRIDAY PLANS (DATA BUNDLES)                  */}
      {/*    SAME AS HOMEPAGE LOGIC + ONLY "BUY THIS PLAN" BUTTON (NO VIEW DETAILS)  */}
      {/* ========================================================================= */}
      <section id="plans" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* Confetti & Sparkles Blast on Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Sparkles */}
          <div className="uk-glow absolute left-8 top-16">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-glow absolute right-12 top-24 [animation-delay:1.3s]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#F664A0">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-float absolute left-[15%] bottom-16">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#C77DFF">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-glow absolute right-[18%] bottom-20 [animation-delay:2s]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFD60A">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          {/* Confetti Bars */}
          <div className="uk-float absolute left-20 top-36 w-3.5 h-1.5 rounded-full bg-[#FFD60A] -rotate-[30deg] opacity-70" />
          <div className="uk-float absolute right-24 top-48 w-3.5 h-1.5 rounded-full bg-[#C41E3A] rotate-[40deg] opacity-70" />
          <div className="uk-float absolute left-1/3 bottom-10 w-3 h-1 rounded-full bg-[#2AA672] -rotate-[20deg] opacity-60" />
          <div className="uk-float absolute right-1/3 bottom-12 w-3.5 h-1.5 rounded-full bg-[#FF8CC6] rotate-[35deg] opacity-70" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Section Header Matching Design */}
          <div className="text-center">
            {/* Black Pill Badge with Pink Star and Yellow Text */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#120417] px-4 py-1.5 shadow-sm">
              <span className="text-[#FF8CC6] text-xs">★</span>
              <span className="text-[#FFD60A] text-xs font-black tracking-widest uppercase">
                BLACK FRIDAY · 27–30 NOV
              </span>
            </div>

            <h2 className="mt-3.5 text-center font-black text-[#120417] text-2xl sm:text-3xl md:text-4xl tracking-tight">
              SIM-Only Black Friday Plans (Data Bundles)
            </h2>

            {/* Gradient accent bar */}
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-[#C41E3A] to-[#FFD60A]" />

            <p className="mt-2.5 text-xs sm:text-sm text-gray-500 font-medium">
              All plans include unlimited minutes, texts, 5G and no credit checks.
            </p>

            {/* Duration Tabs */}
            <div className="mx-auto mt-6 flex w-fit flex-wrap items-center justify-center gap-2.5">
              {DURATIONS.map((tab) => {
                const isActive = duration === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDuration(tab)}
                    className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#B31862] text-white shadow-[0_4px_14px_rgba(179,24,98,0.35)]"
                        : "bg-[#F3F4F6] text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-12 flex justify-center py-10">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-[#B31862] border-t-transparent"
                role="status"
              >
                <span className="sr-only">Loading plans…</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="mx-auto mt-10 max-w-md rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && simPlans.length === 0 && (
            <p className="mt-10 text-center text-sm text-gray-500">
              No plans available right now. Please check back soon.
            </p>
          )}

          {/* Dynamic Plans Grid from Backend API */}
          {!loading && simPlans.length > 0 && (
            <div className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {simPlans.map((plan, idx) => {
                const isDark = plan.is_popular || idx === 1;
                const basePrice = priceFor(plan, duration);
                const discountPrice = (Number(basePrice) * 0.7).toFixed(2);
                const feats = bullets(plan);
                const tierName = plan.tier_label || plan.name;
                const displayData = plan.data_allowance || "Data Plan";

                return (
                  <div
                    key={plan.id}
                    className={`relative flex h-full flex-col justify-between rounded-[26px] p-7 sm:p-8 transition-all overflow-hidden ${
                      isDark
                        ? "bg-gradient-to-b from-[#2A083D] via-[#1A0527] to-[#12041D] text-white shadow-[0px_20px_50px_rgba(163,21,122,0.45)] border border-[#A3157A]"
                        : "bg-white text-[#18181B] shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-100/90"
                    }`}
                  >
                    {/* Top-Left Diagonal Ribbon */}
                    <div
                      className={`absolute -left-12 top-6 -rotate-45 w-44 py-1 text-center text-[9px] font-black tracking-widest shadow-sm uppercase pointer-events-none select-none z-10 ${
                        isDark ? "bg-[#FFD60A] text-[#120417]" : "bg-[#120417] text-white"
                      }`}
                    >
                      BLACK FRIDAY
                    </div>

                    <div>
                      {/* Tier Label Capsule */}
                      <div className="flex justify-center">
                        <span
                          className={`rounded-full px-4 py-1 text-xs font-bold tracking-wide ${
                            isDark
                              ? "bg-white/10 border border-white/15 text-[#FF8CC6]"
                              : "bg-[#FDE8EF] text-[#B31862]"
                          }`}
                        >
                          {tierName}
                        </span>
                      </div>

                      {/* Data Allowance */}
                      <div className="mt-3.5 text-center">
                        <span
                          className={`font-black text-4xl sm:text-[42px] leading-tight tracking-tight ${
                            isDark ? "text-[#00E575]" : "text-[#00A859]"
                          }`}
                        >
                          {displayData}
                        </span>
                      </div>

                      {/* Yellow Promo Badge */}
                      <div className="mt-2.5 flex justify-center">
                        <span className="bg-[#FFD60A] text-[#120417] text-[11px] font-black tracking-wider px-3.5 py-1 rounded-[3px] uppercase">
                          30% OFF · FIRST 3 MONTHS
                        </span>
                      </div>

                      {/* Price Section */}
                      <div className="mt-3.5 flex items-baseline justify-center gap-1">
                        <span
                          className={`font-black text-3xl sm:text-4xl tracking-tight ${
                            isDark ? "text-white" : "text-[#C41E3A]"
                          }`}
                        >
                          £{discountPrice}
                        </span>
                        <span
                          className={`text-xs font-medium ml-1 ${
                            isDark ? "text-pink-200/70" : "text-gray-500"
                          }`}
                        >
                          per month
                        </span>
                      </div>

                      {/* Then Price Capsule */}
                      <div className="mt-3 flex justify-center">
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold text-center ${
                            isDark
                              ? "bg-white/10 border border-white/10 text-gray-200"
                              : "bg-[#F3F4F6] text-[#374151]"
                          }`}
                        >
                          Then £{basePrice} per month · {duration.toLowerCase()}
                        </span>
                      </div>

                      {/* Features List with Dividers */}
                      {feats.length > 0 && (
                        <ul className="mt-7 flex flex-col">
                          {feats.map((feat, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2.5 border-t py-3.5 text-xs sm:text-[13px] font-medium ${
                                isDark ? "border-white/10 text-gray-200" : "border-gray-100 text-gray-700"
                              }`}
                            >
                              <PlanCheckIcon dark={isDark} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Action Buttons: View Details + Buy this plan */}
                    <div className="mt-8 flex flex-col gap-2.5">
                      <Link
                        href={plan.slug ? `/plans/${plan.slug}` : "/plans"}
                        className={`w-full rounded-full border bg-transparent py-2.5 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isDark
                            ? "border-white/30 text-white hover:bg-white/10"
                            : "border-[#00A859] text-[#00A859] hover:bg-emerald-50"
                        }`}
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleBuyNow(plan)}
                        className="w-full rounded-full bg-[#B31862] py-3 text-center text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#991252] shadow-[0_4px_14px_rgba(179,24,98,0.35)] hover:shadow-lg active:scale-[0.99] cursor-pointer"
                      >
                        Buy this plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legal Disclaimer Note */}
          <p className="mt-10 text-center text-[11px] sm:text-xs text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Black Friday pricing applies to the monthly charge on selected SIM-only plans for eligible new lines, for the first three months. Standard monthly price applies after. Prices include VAT.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 3: ANIMALS & MUSIC (EXACT FIGMA LAYOUT WITH BIG EQUALIZER)     */}
      {/* ========================================================================= */}
      <section id="animals-music" className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 border-t border-gray-100">
        {/* Background Confetti & Sparkles Blast */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="uk-glow absolute left-10 top-12">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-glow absolute right-14 top-16 [animation-delay:1.5s]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#D145AE">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-float absolute left-24 bottom-14 w-3.5 h-1.5 rounded-full bg-[#FFD60A] rotate-45 opacity-70" />
          <div className="uk-float absolute right-28 bottom-16 w-3.5 h-1.5 rounded-full bg-[#C41E3A] -rotate-[30deg] opacity-70" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Header with Top Category Pill and Right Link */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="block text-xs font-black tracking-widest text-[#4A1268] uppercase mb-2">
                WHY ZOIKO MOBILE UK
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                A network for people who love<br />
                <span className="text-[#E6007E]">animals</span> and{" "}
                <span className="text-[#4A1268]">music.</span>
              </h2>
            </div>

            <div>
              <Link
                href="/animals-and-music"
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#C41E3A] hover:text-[#A3157A] hover:underline transition-colors"
              >
                Discover Animals &amp; Music →
              </Link>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: Animal Lovers */}
            <div className="relative overflow-hidden rounded-[28px] p-8 sm:p-10 text-white bg-[#E6007E] shadow-[0_16px_40px_rgba(230,0,126,0.3)] flex flex-col justify-between min-h-[320px]">
              {/* Subtle background paw pattern */}
              <div className="pointer-events-none absolute right-4 top-4 select-none opacity-20">
                <svg width="140" height="140" viewBox="0 0 32 32" fill="#ffffff">
                  <ellipse cx="16" cy="21" rx="7" ry="6" />
                  <ellipse cx="7" cy="13" rx="3" ry="4" />
                  <ellipse cx="25" cy="13" rx="3" ry="4" />
                  <ellipse cx="12" cy="7" rx="3" ry="4" />
                  <ellipse cx="20" cy="7" rx="3" ry="4" />
                </svg>
              </div>

              {/* Top Row: Black Friday Pill Badge */}
              <div className="relative z-10 mb-8">
                <span className="inline-block rounded-full bg-[#120417] px-4 py-1.5 text-xs font-black tracking-widest text-[#FFD60A] uppercase shadow-sm">
                  BLACK FRIDAY
                </span>
              </div>

              {/* Bottom Content */}
              <div className="relative z-10 flex flex-col gap-2 mt-auto">
                <span className="text-xs font-extrabold tracking-widest text-white/90 uppercase">
                  FOR ANIMAL LOVERS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                  Stay close to the companions who matter.
                </h3>
                <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed mt-1">
                  A mobile brand built around people who love animals. Every Zoiko Mobile plan supports animal causes across the UK.
                </p>
              </div>
            </div>

            {/* Right Card: Music Lovers (with Big Headphones & Big Equalizer Bars) */}
            <div className="relative overflow-hidden rounded-[28px] p-8 sm:p-10 text-white bg-[#20083B] shadow-[0_16px_40px_rgba(32,8,59,0.35)] flex flex-col justify-between min-h-[320px]">
              {/* Top Row: Large Glowing Headphones (Left) & BIG EQUALIZER BARS (Right) */}
              <div className="relative z-10 flex items-center justify-between mb-8">
                {/* Large Neon Headphones Icon */}
                <div className="text-[#FF8CC6] drop-shadow-[0_0_12px_rgba(246,100,160,0.7)]">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </div>

                {/* BIG Sound Equalizer (7 Thick Animated Vertical Bars) */}
                <div className="uk-eq flex items-end gap-2 h-16 px-2">
                  {/* Bar 1 - Yellow */}
                  <span className="w-2.5 h-12 bg-[#FFD60A] rounded-full [animation-delay:0.1s]" />
                  {/* Bar 2 - Yellow */}
                  <span className="w-2.5 h-15 bg-[#FFD60A] rounded-full [animation-delay:0.35s]" />
                  {/* Bar 3 - Pink */}
                  <span className="w-2.5 h-16 bg-[#F664A0] rounded-full [animation-delay:0.15s]" />
                  {/* Bar 4 - Light Purple */}
                  <span className="w-2.5 h-13 bg-[#C77DFF] rounded-full [animation-delay:0.45s]" />
                  {/* Bar 5 - Purple */}
                  <span className="w-2.5 h-16 bg-[#8023A0] rounded-full [animation-delay:0.2s]" />
                  {/* Bar 6 - Yellow */}
                  <span className="w-2.5 h-14 bg-[#FFD60A] rounded-full [animation-delay:0.5s]" />
                  {/* Bar 7 - Yellow */}
                  <span className="w-2.5 h-11 bg-[#FFD60A] rounded-full [animation-delay:0.25s]" />
                </div>
              </div>

              {/* Bottom Content */}
              <div className="relative z-10 flex flex-col gap-2 mt-auto">
                <span className="text-xs font-extrabold tracking-widest text-[#FFD60A] uppercase">
                  FOR MUSIC LOVERS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                  Keep the soundtrack of your day playing.
                </h3>
                <p className="text-sm sm:text-base font-medium text-gray-300 leading-relaxed mt-1">
                  A mobile brand built around people who love music. Unlimited streaming perks and exclusive festival access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 4: CERTIFIED REFURBISHED PHONES                                */}
      {/* ========================================================================= */}
      <section
        id="phones"
        className="relative overflow-hidden text-white px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 75% 50%, rgba(209,69,174,0.45) 0%, rgba(209,69,174,0) 70%), linear-gradient(135deg, #12041A 0%, #2A0A3C 100%)",
        }}
      >
        {/* Background Confetti & Sparkles Blast */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="uk-glow absolute left-12 top-14">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFD60A">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-glow absolute right-16 top-20 [animation-delay:1.2s]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#F664A0">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-float absolute left-[20%] bottom-14 w-3.5 h-1.5 rounded-full bg-[#FFD60A] -rotate-45 opacity-70" />
          <div className="uk-float absolute right-[25%] bottom-12 w-3.5 h-1.5 rounded-full bg-[#5FE0A6] rotate-30 opacity-70" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Copy */}
            <div className="lg:col-span-6 flex flex-col items-start gap-5">
              <span className="rounded-full bg-[#FFD60A] px-4 py-1 text-xs font-black tracking-widest text-[#2A1E00] uppercase">
                CERTIFIED REFURBISHED PHONES
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Pair your SIM with a certified refurbished phone.
              </h2>

              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg">
                Every phone passes a thorough multi-point technical inspection, comes backed by our comprehensive 12-month warranty, and is delivered free anywhere in the UK.
              </p>

              <div className="pt-2">
                <Link
                  href="/devices"
                  className="inline-flex items-center gap-3 rounded-xl bg-[#FFD60A] px-8 py-4 text-base font-black text-[#2A1E00] shadow-lg transition-all hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Shop Smartphones
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right Display: Fan-Out Smartphones */}
            <div className="relative lg:col-span-6 flex items-center justify-center min-h-[360px]">
              {/* Hanging Warranty Tag with Swing Animation */}
              <div className="absolute -top-6 right-6 z-20 hidden sm:block">
                <div className="uk-swing flex flex-col items-center">
                  <div className="w-[1px] h-6 bg-white/60" />
                  <div className="bg-[#C41E3A] text-white border-2 border-white px-3 py-1.5 rounded-lg shadow-xl text-center">
                    <span className="block text-[9px] font-black uppercase tracking-wider">
                      WARRANTY
                    </span>
                    <span className="text-xs font-extrabold">12 MONTHS</span>
                  </div>
                </div>
              </div>

              {/* Fan-Out Phone Images from Manifest */}
              <div className="relative w-full max-w-[420px] h-[340px] flex items-center justify-center">
                <Image
                  src="/images/landing-page/manifest/84e86df6-b79d-46d9-a843-09ce709b0289.png"
                  alt="Pink iPhone Refurbished"
                  width={140}
                  height={220}
                  className="absolute left-4 top-14 -rotate-12 drop-shadow-2xl z-10 transition-transform hover:scale-105"
                />
                <Image
                  src="/images/landing-page/manifest/69d2bcc3-b071-4b5b-b48c-509f2ab4322c.png"
                  alt="Blue iPhone Refurbished"
                  width={150}
                  height={240}
                  className="absolute left-24 top-6 -rotate-6 drop-shadow-2xl z-20 transition-transform hover:scale-105"
                />
                <Image
                  src="/images/landing-page/manifest/ea677e1b-28ea-4321-954d-b119745eb11e.png"
                  alt="Purple iPhone Refurbished"
                  width={160}
                  height={260}
                  className="absolute left-44 top-0 rotate-6 drop-shadow-2xl z-30 transition-transform hover:scale-105"
                />
                <Image
                  src="/images/landing-page/manifest/959d0c7d-fd6c-4dd1-b0dc-a2523ad8bf93.png"
                  alt="Pixel Refurbished"
                  width={150}
                  height={240}
                  className="absolute right-4 top-10 rotate-12 drop-shadow-2xl z-20 transition-transform hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION 5: WHY CHOOSE ZOIKO MOBILE UK? (EMERALD GRADIENT)              */}
      {/* ========================================================================= */}
      <section
        className="relative overflow-hidden text-white px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(180deg, #1B8357 0%, #146A66 100%)",
        }}
      >
        {/* Background Confetti & Sparkles Blast */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="uk-glow absolute left-14 top-14">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFD60A">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-glow absolute right-16 top-16 [animation-delay:1.4s]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-float absolute left-1/4 bottom-12 w-3.5 h-1.5 rounded-full bg-white/70 rotate-45" />
          <div className="uk-float absolute right-1/4 bottom-14 w-3.5 h-1.5 rounded-full bg-[#FFD60A] -rotate-30" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="rounded-full bg-white/20 backdrop-blur-md px-4 py-1 text-xs font-black tracking-widest uppercase">
              WHY CHOOSE ZOIKO MOBILE UK
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built around you. And what you care about.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Pillar 1 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#FFD60A]" />
              </div>
              <h3 className="text-lg font-black">Transparent pricing</h3>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                Clear monthly rates with no unexpected extra line items or mid-contract surprises.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#FFD60A]" />
              </div>
              <h3 className="text-lg font-black">No credit checks</h3>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                Instant onboarding for everyone. You do not need a perfect credit score to get connected.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#FFD60A]" />
              </div>
              <h3 className="text-lg font-black">5G included free</h3>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                High-speed 5G connectivity is included as standard across all SIM-only bundles.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#FFD60A]" />
              </div>
              <h3 className="text-lg font-black">Purpose-driven</h3>
              <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                Every line supports UK animal protection charities, giving purpose to every text and call.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION 6: BLACK FRIDAY FAQ                                            */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#FFF8DC] px-4 py-20 sm:px-6 lg:px-8">
        {/* Background Confetti & Sparkles Blast */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="uk-glow absolute left-10 top-16">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-glow absolute right-12 top-14 [animation-delay:1.5s]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#D145AE">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>
          <div className="uk-float absolute left-24 bottom-14 w-3.5 h-1.5 rounded-full bg-[#C41E3A] rotate-45 opacity-70" />
          <div className="uk-float absolute right-24 bottom-16 w-3.5 h-1.5 rounded-full bg-[#2AA672] -rotate-30 opacity-70" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1F5A3E] tracking-tight">
              Black Friday FAQ
            </h2>
            <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-[#C41E3A] to-[#FFD60A]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white p-6 shadow-sm border-l-4 border-[#C41E3A] flex flex-col justify-start gap-3 hover:shadow-md transition-shadow"
              >
                <h3 className="text-base font-extrabold text-[#1F5A3E] leading-snug">
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-black text-[#C41E3A]">{faq.tag}</span> – {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. SECTION 7: FINAL CTA BANNER                                            */}
      {/* ========================================================================= */}
      <section
        className="relative overflow-hidden text-white px-4 py-24 sm:px-6 lg:px-8 text-center"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(209,69,174,0.45) 0%, rgba(209,69,174,0) 70%), linear-gradient(135deg, #12041A 0%, #2A0A3C 60%, #4A1268 100%)",
        }}
      >
        {/* Giant Watermark Text in Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 select-none overflow-hidden">
          <span className="text-[140px] sm:text-[240px] font-black tracking-tighter whitespace-nowrap leading-none">
            BLACK FRIDAY
          </span>
        </div>

        <div className="relative z-10 mx-auto max-w-3xl flex flex-col items-center gap-6">
          <span className="rounded-full bg-[#FFD60A] px-4 py-1 text-xs font-black tracking-widest text-[#2A1E00] uppercase">
            DON&apos;T MISS OUT · OFFER ENDS 30 NOV
          </span>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Your Black Friday savings start here.
          </h2>

          <p className="text-base sm:text-lg text-pink-100 max-w-xl">
            30% off the monthly charge on selected SIM-only plans for your first 3 months. No credit checks, free delivery, and instant eSIM activation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#plans"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C41E3A] px-8 py-4 text-base font-extrabold text-white shadow-xl transition-all hover:bg-[#A3157A] hover:scale-105 active:scale-95"
            >
              Explore SIM-only plans
              <ArrowRight className="w-5 h-5" />
            </a>

            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/20 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

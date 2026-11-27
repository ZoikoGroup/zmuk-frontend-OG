"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Layers,
  PhoneCall,
  Plane,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Search,
  Smartphone,
  Phone,
  AlertTriangle,
  User,
  ChevronRight,
  ChevronDown,
  Info,
  PhoneForwarded,
  Sparkles,
  SlidersHorizontal,
  Activity,
  Bell,
  UserCog,
  Wrench,
  HelpCircle,
  Bot,
  MessageSquare,
  X,
} from "lucide-react";
import { isLoggedIn } from "../utils/auth";
import { openChat } from "../components/ChatbotWidget";
import { CopyEmailButton, SUPPORT_EMAIL, supportGmailHref } from "../components/EmailSupport";

type NumberType = "mobile" | "landline" | "special";
type OriginType = "uk" | "abroad";

interface CountryEntry {
  name: string;
  code: string;
  flag: string;
  sampleIncluded: boolean;
  exampleFormat: string;
}

const COUNTRIES: CountryEntry[] = [
  { name: "India", code: "+91", flag: "🇮🇳", sampleIncluded: true, exampleFormat: "+91 XXXXX XXXXX" },
  { name: "USA", code: "+1", flag: "🇺🇸", sampleIncluded: true, exampleFormat: "+1 XXX XXX XXXX" },
  { name: "Nigeria", code: "+234", flag: "🇳🇬", sampleIncluded: false, exampleFormat: "+234 XXX XXX XXXX" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰", sampleIncluded: false, exampleFormat: "+92 XXX XXXXXXX" },
  { name: "Jamaica", code: "+1", flag: "🇯🇲", sampleIncluded: false, exampleFormat: "+1 876 XXX XXXX" },
  { name: "France", code: "+33", flag: "🇫🇷", sampleIncluded: true, exampleFormat: "+33 X XX XX XX XX" },
  { name: "Canada", code: "+1", flag: "🇨🇦", sampleIncluded: true, exampleFormat: "+1 XXX XXX XXXX" },
  { name: "Australia", code: "+61", flag: "🇦🇺", sampleIncluded: true, exampleFormat: "+61 4XX XXX XXX" },
  { name: "Spain", code: "+34", flag: "🇪🇸", sampleIncluded: true, exampleFormat: "+34 XXX XXX XXX" },
  { name: "Germany", code: "+49", flag: "🇩🇪", sampleIncluded: true, exampleFormat: "+49 XXX XXXXXXXX" },
  { name: "Ireland", code: "+353", flag: "🇮🇪", sampleIncluded: true, exampleFormat: "+353 XX XXX XXXX" },
  { name: "Poland", code: "+48", flag: "🇵🇱", sampleIncluded: true, exampleFormat: "+48 XXX XXX XXX" },
];

const POPULAR_COUNTRIES = COUNTRIES.slice(0, 6);

const PLANS = [
  { id: "", name: "Choose your plan…", hasIntlMinutes: false },
  { id: "essential-5gb", name: "Essential 5GB", hasIntlMinutes: false },
  { id: "core-15gb", name: "Core 15GB", hasIntlMinutes: false },
  { id: "max-30gb", name: "Max 30GB", hasIntlMinutes: true },
  { id: "elite-100gb", name: "Elite 100GB", hasIntlMinutes: true },
  { id: "unlimited", name: "Unlimited Data", hasIntlMinutes: true },
];

const SUBNAV_ITEMS = [
  { label: "Check rates", href: "#rates", icon: Globe },
  { label: "Plan benefits", href: "#benefits", icon: Layers },
  { label: "How to dial", href: "#dial", icon: PhoneCall },
  { label: "UK vs roaming", href: "#ukvs", icon: Plane },
  { label: "Manage & control", href: "#manage", icon: ShieldCheck },
  { label: "Get support", href: "#faq-zovie", icon: Headphones },
];

const HERO_CHECKS = [
  "International minutes on selected plans",
  "Clear, published rates",
  "Mobile and landline numbers",
  "Check and manage in MyZoiko",
];

const FAQS = [
  {
    q: "Which countries are included in my plan?",
    a: "Selected Zoiko plans (including Max 30GB, Elite 100GB and Unlimited Data under tariff ZMUK-INTL-v1) include international minutes to eligible destinations. Select your country and plan above or sign in to MyZoiko to confirm your exact line inclusions.",
  },
  {
    q: "How are international calls charged?",
    a: "Calls to included destinations come out of your plan’s monthly international minutes first. Calls to non-included countries, or usage after your allowance runs out, follow our standard published per-minute tariff.",
  },
  {
    q: "Is there a connection charge?",
    a: "Any applicable connection fee or minimum call charge is always shown clearly alongside the published per-minute rate before you call.",
  },
  {
    q: "Can I call internationally on a 30-day plan?",
    a: "Yes — eligible 30-day SIM-only plans come with international calling access enabled from the UK, and selected tiers include bundled international minutes.",
  },
  {
    q: "Are premium or special numbers included?",
    a: "No. Special, premium-rate, personal numbering, and satellite destinations are never part of inclusive international allowances and are billed separately.",
  },
  {
    q: "How can I add extra international minutes?",
    a: "No standalone international calling add-on bundle is currently available to purchase online. If you frequently call abroad, upgrading to an eligible plan with bundled minutes is the simplest option.",
  },
];

function Internationalcalls() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  // Rate checker state
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryEntry>(COUNTRIES[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [planId, setPlanId] = useState("");
  const [numberType, setNumberType] = useState<NumberType>("mobile");
  const [origin, setOrigin] = useState<OriginType>("uk");
  const [checkedSummary, setCheckedSummary] = useState<{
    title: string;
    detail: string;
    tone: "included" | "standard" | "abroad";
  } | null>(null);

  // UI state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [allCountriesOpen, setAllCountriesOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const filteredSuggestions = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countryQuery.trim().toLowerCase()) ||
      c.code.includes(countryQuery.trim())
  );

  const filteredModalCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(modalSearch.trim().toLowerCase()) ||
      c.code.includes(modalSearch.trim())
  );

  const runRateCheck = (
    targetCountry = selectedCountry,
    targetPlanId = planId,
    targetNumType = numberType,
    targetOrigin = origin
  ) => {
    if (targetOrigin === "abroad") {
      setCheckedSummary({
        title: "Calling while abroad uses roaming rates",
        detail:
          "Because you selected “I’m abroad”, calls follow roaming rules for your current zone rather than UK international calling rates.",
        tone: "abroad",
      });
      return;
    }

    const plan = PLANS.find((p) => p.id === targetPlanId);
    if (!targetPlanId || !plan) {
      setCheckedSummary({
        title: `Published guidance for ${targetCountry.name} (${targetCountry.code})`,
        detail:
          "Select your Zoiko plan above or sign in to MyZoiko to see whether calls to this destination are included in your plan or charged at standard published rates.",
        tone: "standard",
      });
      return;
    }

    if (targetNumType === "special") {
      setCheckedSummary({
        title: `Special / premium numbers in ${targetCountry.name} (${targetCountry.code})`,
        detail:
          "Special, premium, and satellite numbers are excluded from plan international allowances and billed at published special-service rates.",
        tone: "standard",
      });
      return;
    }

    if (plan.hasIntlMinutes && targetCountry.sampleIncluded) {
      setCheckedSummary({
        title: `Included destination on ${plan.name}`,
        detail: `${targetNumType === "mobile" ? "Mobile" : "Landline"} calls from the UK to ${targetCountry.name} (${targetCountry.code}) draw from your plan’s inclusive international minutes (ZMUK-INTL-v1).`,
        tone: "included",
      });
    } else {
      setCheckedSummary({
        title: `${targetCountry.name} (${targetCountry.code}) on ${plan.name}`,
        detail: `${targetNumType === "mobile" ? "Mobile" : "Landline"} calls from the UK to ${targetCountry.name} aren’t covered in this plan’s allowance and are charged at standard published per-minute rates.`,
        tone: "standard",
      });
    }
  };

  const handleSelectCountry = (c: CountryEntry) => {
    setSelectedCountry(c);
    setCountryQuery(`${c.name} (${c.code})`);
    setShowSuggestions(false);
    runRateCheck(c, planId, numberType, origin);
  };

  const handleCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match =
      COUNTRIES.find(
        (c) =>
          countryQuery.toLowerCase().includes(c.name.toLowerCase()) ||
          countryQuery.includes(c.code)
      ) ?? selectedCountry;
    setSelectedCountry(match);
    runRateCheck(match, planId, numberType, origin);
  };

  const goToMyZoiko = () => {
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login?next=/dashboard");
    }
  };

  const cleanCode = selectedCountry.code.replace("+", "");

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-[#141a45]">
      {/* 1. IC-04 HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(600px 300px at 62% 50%, rgba(236,21,108,0.35) 0%, rgba(236,21,108,0) 70%), linear-gradient(100deg, #5c0a35 0%, #9e0d4c 30%, #c80f57 46%, #6a1450 66%, #0f4733 100%)",
        }}
      >
        <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-10 lg:py-6">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_252px]">
            {/* Left Copy */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[1.68px] text-[#fde6ee]">
                International calling
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-1.2px] text-white sm:text-4xl lg:text-[51.2px] lg:leading-[53.76px] lg:tracking-[-1.536px]">
                Stay close, wherever
                <br />
                they are.
              </h1>
              <p className="mt-3 max-w-[560px] text-base font-semibold leading-[1.5] text-[#fde6ee] sm:text-[18.4px] sm:leading-[27.6px]">
                Call friends, family and business contacts around the world from the UK. Check the
                rate for your plan before you call.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="#rates"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-white/90 bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-[22px] text-[15px] sm:text-[17px] font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(0,0,0,0.6)] transition hover:brightness-110"
                >
                  <span>Check international rates</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </a>
                <a
                  href="#benefits"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-white/85 bg-[#140a28]/30 px-[22px] text-[15px] sm:text-[17px] font-extrabold text-white backdrop-blur-sm transition hover:bg-[#140a28]/50"
                >
                  <span>View plan benefits</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </a>
              </div>
            </div>

            {/* Middle Graphic */}
            <div className="relative mx-auto h-[210px] w-full max-w-[374px] sm:h-[249px]">
              <Image
                src="/images/international-calling/hero-calling-graphic.png"
                alt="Global video and international voice calling illustration"
                fill
                priority
                className="object-contain"
              />
            </div>

            {/* Right White Checklist Card */}
            <ul className="space-y-2.5 rounded-[18px] bg-white px-4 py-3.5 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.5)]">
              {HERO_CHECKS.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-[22px] w-[22px] shrink-0 text-[#1f8c44]" />
                  <span className="text-sm font-bold leading-[21px] text-[#141a45]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* STICKY SUB-NAV */}
      <nav
        aria-label="On this page"
        className="sticky top-0 z-20 border-b border-[#e5e7f0] bg-white shadow-[0_6px_16px_-14px_rgba(20,26,69,0.35)]"
      >
        <div className="mx-auto max-w-[1280px] px-4 py-1.5 sm:px-6 lg:px-10">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {SUBNAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={`flex-1 min-w-[140px] ${
                    idx > 0 ? "border-l border-[#e5e7f0]" : ""
                  }`}
                >
                  <a
                    href={item.href}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-[#141a45] whitespace-nowrap transition hover:bg-[#fff4f7] hover:text-[#c80f57]"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#c80f57]" />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-7 sm:px-6 lg:px-10">
        {/* 2. IC-06 RATE CHECKER + PLAN AT A GLANCE */}
        <section className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          {/* Left: Rate Checker */}
          <div
            id="rates"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Check international calling rates
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  See the cost of calling mobile and landline numbers from the UK.
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckSubmit} className="mt-4 space-y-3.5">
              <div className="grid gap-3.5 md:grid-cols-2">
                {/* Country input with suggestions */}
                <div className="relative flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#141a45] sm:text-base">
                    Country / destination
                  </label>
                  <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-[#d3d6e4] bg-white px-3 focus-within:border-[#c80f57]">
                    <Search className="h-5 w-5 shrink-0 text-[#565c7e]" />
                    <input
                      type="text"
                      value={countryQuery}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onChange={(e) => {
                        setCountryQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      placeholder="Country or code, e.g. India or +91"
                      className="w-full bg-transparent py-2.5 text-sm font-bold text-[#141a45] placeholder:text-[#757575] focus:outline-none sm:text-base"
                    />
                  </div>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-[86px] z-30 max-h-52 overflow-y-auto rounded-xl border border-[#d3d6e4] bg-white p-1.5 shadow-lg">
                      {filteredSuggestions.slice(0, 6).map((c) => (
                        <li key={c.name}>
                          <button
                            type="button"
                            onMouseDown={() => handleSelectCountry(c)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-[#141a45] hover:bg-[#fff4f7] cursor-pointer"
                          >
                            <span>
                              {c.flag} {c.name}
                            </span>
                            <span className="text-xs text-[#565c7e]">{c.code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Plan Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#141a45] sm:text-base">
                    Your Zoiko plan
                  </label>
                  <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-[#d3d6e4] bg-white px-3 focus-within:border-[#c80f57]">
                    <Layers className="h-5 w-5 shrink-0 text-[#c80f57]" />
                    <select
                      aria-label="Your Zoiko plan"
                      value={planId}
                      onChange={(e) => {
                        setPlanId(e.target.value);
                        runRateCheck(selectedCountry, e.target.value, numberType, origin);
                      }}
                      className="w-full bg-transparent py-2.5 text-sm font-bold text-[#141a45] focus:outline-none cursor-pointer sm:text-base"
                    >
                      {PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Number Type segmented + CTA */}
              <div className="grid items-end gap-3.5 md:grid-cols-2">
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="px-0.5 text-sm font-bold text-[#141a45] sm:text-base">
                    Number type
                  </legend>
                  <div className="grid grid-cols-3 rounded-[14px] bg-[#f1f2f7] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNumberType("mobile");
                        runRateCheck(selectedCountry, planId, "mobile", origin);
                      }}
                      className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-extrabold transition cursor-pointer ${
                        numberType === "mobile"
                          ? "bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white"
                          : "text-[#2d3361] hover:bg-white/60"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNumberType("landline");
                        runRateCheck(selectedCountry, planId, "landline", origin);
                      }}
                      className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-extrabold transition cursor-pointer ${
                        numberType === "landline"
                          ? "bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white"
                          : "text-[#2d3361] hover:bg-white/60"
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span>Landline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNumberType("special");
                        runRateCheck(selectedCountry, planId, "special", origin);
                      }}
                      className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] px-3 text-sm font-extrabold transition cursor-pointer ${
                        numberType === "special"
                          ? "bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white"
                          : "text-[#2d3361] hover:bg-white/60"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Special</span>
                    </button>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-6 text-[17px] font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110 cursor-pointer"
                >
                  <span>Check rate</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Row 3: Origin Pills */}
              <div className="flex flex-wrap items-center gap-3.5 pt-0.5">
                <span className="text-sm font-bold text-[#141a45] sm:text-base">
                  Where are you calling from?
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("uk");
                      runRateCheck(selectedCountry, planId, numberType, "uk");
                    }}
                    className={`min-h-[40px] rounded-full border px-4 text-sm font-bold transition cursor-pointer ${
                      origin === "uk"
                        ? "border-[#ec156c] bg-[#fff4f7] text-[#c80f57]"
                        : "border-[#d3d6e4] bg-white text-[#2d3361] hover:bg-slate-50"
                    }`}
                  >
                    The UK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("abroad");
                      runRateCheck(selectedCountry, planId, numberType, "abroad");
                    }}
                    className={`min-h-[40px] rounded-full border px-4 text-sm font-bold transition cursor-pointer ${
                      origin === "abroad"
                        ? "border-[#ec156c] bg-[#fff4f7] text-[#c80f57]"
                        : "border-[#d3d6e4] bg-white text-[#2d3361] hover:bg-slate-50"
                    }`}
                  >
                    I’m abroad
                  </button>
                </div>
              </div>
            </form>

            {/* Bottom Info / Result Banner */}
            <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-dashed border-[#fde6ee] bg-[#fcfcfe] p-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                {checkedSummary ? <Sparkles className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
              </div>
              {checkedSummary ? (
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-[#141a45]">
                    {checkedSummary.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-[18px] text-[#2d3361] sm:text-sm">
                    {checkedSummary.detail}
                  </p>
                  {checkedSummary.tone === "abroad" && (
                    <Link
                      href="/roaming-and-coverage"
                      className="mt-1.5 inline-block text-xs font-extrabold text-[#c80f57] underline"
                    >
                      Check roaming &amp; overage rates ›
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Choose a country and Zoiko plan to check published calling rates from the UK. We
                  never show example prices.
                </p>
              )}
            </div>
          </div>

          {/* Right: Your plan at a glance */}
          <aside className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white">
                <UserCog className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Your plan at a glance
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Sign in to MyZoiko to see the international minutes and rates for your line.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 pb-2.5">
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <PhoneCall className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">International minutes</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <Globe className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Included destinations</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Plan status</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <Info className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Extra international minutes</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
            </ul>

            <button
              type="button"
              onClick={goToMyZoiko}
              className="mt-2 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-6 text-[17px] font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110 cursor-pointer"
            >
              <User className="h-5 w-5" />
              <span>{loggedIn ? "Manage in MyZoiko" : "Sign in to MyZoiko"}</span>
              <ChevronRight className="h-5 w-5" />
            </button>

            <p className="mt-2.5 text-center text-sm text-[#565c7e]">
              You can check published rates without signing in.
            </p>
          </aside>
        </section>

        {/* 3. IC-07 THREE EXPLANATION PANELS */}
        <section className="grid items-stretch gap-[18px] lg:grid-cols-3">
          {/* Panel 1: Benefits */}
          <div
            id="benefits"
            className="flex flex-col justify-between rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div>
              <div className="flex items-center gap-3.5 pb-3.5">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                    International calling benefits
                  </h2>
                  <p className="text-sm leading-[21px] text-[#2d3361]">
                    What’s included depends on your plan.
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm leading-[20.3px] text-[#2d3361]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>International minutes on Max 30GB, Elite 100GB and Unlimited Data</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Call both mobile and landline numbers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Clear, published rates — with the connection charge shown</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Choose a plan above to see exactly what’s included</span>
                </li>
              </ul>

              <div className="mt-3 flex items-center gap-2 text-xs text-[#565c7e]">
                <span className="rounded-md bg-[#eef0f6] px-1.5 py-0.5 text-[11px] font-bold">
                  Sample
                </span>
                <span>Inclusions from the sample tariff ZMUK-INTL-v1.</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/plans"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-4 text-base font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110"
              >
                <span>See eligible plans</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Panel 2: How to dial */}
          <div
            id="dial"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  How to dial an international number
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Make a call from the UK in a simple format.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,0.65fr)_auto_minmax(0,0.85fr)_auto_minmax(0,2.1fr)] items-start gap-1.5 text-center">
              <div>
                <div className="flex min-h-[46px] items-center justify-center rounded-xl border border-[#d3d6e4] bg-white font-black text-[#2d3361]">
                  +
                </div>
                <span className="mt-1 block text-[11px] leading-[13.75px] text-[#2d3361]">
                  International
                  <br />
                  prefix
                </span>
              </div>
              <span className="pt-2.5 text-base font-black text-[#c80f57]">+</span>
              <div>
                <div className="flex min-h-[46px] items-center justify-center rounded-xl border border-[#d3d6e4] bg-white font-black text-[#2d3361]">
                  {cleanCode}
                </div>
                <span className="mt-1 block text-[11px] leading-[13.75px] text-[#2d3361]">
                  Country
                  <br />
                  code ({selectedCountry.name})
                </span>
              </div>
              <span className="pt-2.5 text-base font-black text-[#c80f57]">+</span>
              <div>
                <div className="flex min-h-[46px] items-center justify-center rounded-xl border border-[#d3d6e4] bg-white px-2 text-sm font-black tracking-[0.45px] text-[#2d3361]">
                  XXXXX XXXXX
                </div>
                <span className="mt-1 block text-[11px] leading-[13.75px] text-[#2d3361]">
                  The national number
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#fde6ee] bg-[#fff4f7] p-3">
              <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#c80f57]" />
              <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                Example: {selectedCountry.name}. To call a mobile in {selectedCountry.name}, dial{" "}
                <strong className="font-bold">{selectedCountry.exampleFormat}</strong>. If the number
                starts with 0 when dialled locally, leave the 0 out.
              </p>
            </div>

            <p className="mt-2.5 text-xs leading-[18px] text-[#565c7e]">
              X stands for a digit. Standard E.164 international numbering format applies across
              all destinations.
            </p>
          </div>

          {/* Panel 3: UK vs roaming */}
          <div
            id="ukvs"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Plane className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  UK vs roaming: what’s the difference?
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Calling overseas from the UK is different from making calls while travelling
                  abroad.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href="#rates"
                className="group flex items-center gap-3 rounded-2xl border border-[#bfe3cb] bg-[#f0f9f3] p-3.5 transition hover:shadow-sm"
              >
                <PhoneForwarded className="h-7 w-7 shrink-0 text-[#1f8c44]" />
                <div className="flex-1">
                  <p className="text-base font-bold text-[#141a45]">Calling from the UK</p>
                  <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                    You’re in the UK and calling an overseas number. Use this page’s rates and your
                    plan’s international allowance.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#1f8c44] transition group-hover:translate-x-0.5" />
              </a>

              <Link
                href="/roaming-and-coverage"
                className="group flex items-center gap-3 rounded-2xl border border-[#fde6ee] bg-[#fff4f7] p-3.5 transition hover:shadow-sm"
              >
                <Plane className="h-7 w-7 shrink-0 text-[#c80f57]" />
                <div className="flex-1">
                  <p className="text-base font-bold text-[#141a45]">
                    Calling while abroad (roaming)
                  </p>
                  <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                    You’re outside the UK calling locally, to the UK or another country. Check
                    roaming rates and your plan’s roaming allowance.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#c80f57] transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 4. IC-08/09 POPULAR DESTINATIONS + ADD-ONS */}
        <section className="grid items-stretch gap-[18px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Left: Popular destinations */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Popular international destinations
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Quick access to rates for common destinations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
              {POPULAR_COUNTRIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectCountry(c)}
                  className={`flex min-h-[92px] flex-col items-center justify-center gap-0.5 rounded-[14px] border px-1.5 py-2.5 transition cursor-pointer ${
                    selectedCountry.name === c.name
                      ? "border-[#c80f57] bg-[#fff4f7]"
                      : "border-[#e5e7f0] bg-white hover:border-[#c80f57]/50"
                  }`}
                >
                  <span aria-hidden="true" className="text-[28px] leading-none">
                    {c.flag}
                  </span>
                  <span className="mt-1 text-sm font-bold text-[#141a45]">{c.name}</span>
                  <span className="text-xs text-[#2d3361]">({c.code})</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setAllCountriesOpen(true)}
                className="flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-[14px] border border-[#e5e7f0] bg-white px-1.5 py-2.5 text-center transition hover:border-[#c80f57] hover:bg-[#fff4f7]/40 cursor-pointer"
              >
                <span className="text-xl font-bold text-[#c80f57]">+</span>
                <span className="text-sm font-bold leading-tight text-[#c80f57]">
                  View all countries
                </span>
              </button>
            </div>
          </div>

          {/* Right: International calling add-ons */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  International calling add-ons
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">Need more minutes?</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-[#e5e7f0] bg-[#fafafc] p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4f7] text-[#c80f57]">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold leading-6 text-[#141a45]">
                  No additional international calling bundle is available for this plan at present.
                </p>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  If you call abroad often, a plan with international minutes may suit you better.
                </p>
                <Link
                  href="/plans"
                  className="inline-flex items-center gap-1 pt-1 text-base font-extrabold text-[#c80f57] underline hover:brightness-110"
                >
                  <span>Check your available plans</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. IC-10/11 MANAGE + TROUBLESHOOTING */}
        <section className="grid items-stretch gap-[18px] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Left: Manage your international calling */}
          <div
            id="manage"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <SlidersHorizontal className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Manage your international calling
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Keep track of your usage and spending.
                </p>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4">
              <button
                type="button"
                onClick={goToMyZoiko}
                className="flex flex-col items-start gap-1 rounded-[14px] border border-[#e5e7f0] bg-white p-3 text-left transition hover:border-[#c80f57]/50 cursor-pointer"
              >
                <Activity className="h-[26px] w-[26px] text-[#c80f57]" />
                <span className="mt-0.5 text-sm font-bold text-[#141a45]">Check usage</span>
                <span className="text-xs leading-[16.2px] text-[#2d3361]">
                  See your international calls and remaining minutes.
                </span>
              </button>

              <button
                type="button"
                onClick={goToMyZoiko}
                className="flex flex-col items-start gap-1 rounded-[14px] border border-[#e5e7f0] bg-white p-3 text-left transition hover:border-[#c80f57]/50 cursor-pointer"
              >
                <Bell className="h-[26px] w-[26px] text-[#c80f57]" />
                <span className="mt-0.5 text-sm font-bold text-[#141a45]">Usage alerts</span>
                <span className="text-xs leading-[16.2px] text-[#2d3361]">
                  How we let you know about your usage.
                </span>
              </button>

              <button
                type="button"
                onClick={goToMyZoiko}
                className="flex flex-col items-start gap-1 rounded-[14px] border border-[#e5e7f0] bg-white p-3 text-left transition hover:border-[#c80f57]/50 cursor-pointer"
              >
                <ShieldCheck className="h-[26px] w-[26px] text-[#c80f57]" />
                <span className="mt-0.5 text-sm font-bold text-[#141a45]">Spend controls</span>
                <span className="text-xs leading-[16.2px] text-[#2d3361]">
                  Set a monthly spending limit in MyZoiko.
                </span>
              </button>

              <button
                type="button"
                onClick={goToMyZoiko}
                className="flex flex-col items-start gap-1 rounded-[14px] border border-[#e5e7f0] bg-white p-3 text-left transition hover:border-[#c80f57]/50 cursor-pointer"
              >
                <UserCog className="h-[26px] w-[26px] text-[#c80f57]" />
                <span className="mt-0.5 text-sm font-bold text-[#141a45]">Account settings</span>
                <span className="text-xs leading-[16.2px] text-[#2d3361]">
                  International calling access on your line.
                </span>
              </button>
            </div>
          </div>

          {/* Right: Troubleshooting international calls */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Troubleshooting international calls
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Not able to make a call? Try these quick checks.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <ul className="space-y-2 text-sm leading-[20.3px] text-[#2d3361]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>
                    Use the full international format — <strong className="font-bold">+</strong>,
                    the country code, then the number.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Check the number isn’t a premium, satellite or special number.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>
                    Check you have allowance left, or that out-of-allowance calls aren’t blocked by
                    your spending limit.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Restart your phone and try again.</span>
                </li>
              </ul>

              <Link
                href="/roaming-help"
                className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border-2 border-[#ec156c] bg-white px-4 py-3.5 transition hover:bg-[#fff4f7]"
              >
                <div>
                  <p className="text-base font-bold text-[#c80f57]">Still not working?</p>
                  <p className="text-sm font-bold text-[#c80f57]">Get step-by-step help</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#c80f57]" />
              </Link>
            </div>
          </div>
        </section>

        {/* 6. IC-12 FAQS + ZOVIE */}
        <section
          id="faq-zovie"
          className="grid items-stretch gap-[18px] pb-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          {/* Left: FAQs */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Frequently asked questions
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Quick answers to common questions.
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="self-start rounded-xl border border-[#e5e7f0] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2.5 text-left cursor-pointer"
                    >
                      <span className="text-[13px] font-extrabold leading-[19.5px] text-[#2d3361]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#565c7e] transition-transform ${
                          isOpen ? "rotate-180 text-[#c80f57]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="border-t border-[#e5e7f0] px-3 py-2.5 text-xs leading-[18px] text-[#565c7e]">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Chat with Zovie */}
          <div
            className="flex items-center gap-4 rounded-[22px] px-[22px] py-5 text-white shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #0b3a2a 0%, #0f4733 60%, #13573f 100%)",
            }}
          >
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Bot className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-[-0.3px]">Chat with Zovie</h2>
              <p className="text-sm leading-[21px] text-[#d6e3dd]">
                Our virtual assistant can answer questions about international calling, rates and
                plan eligibility. Ask to speak to our team at any time.
              </p>
              <button
                type="button"
                onClick={openChat}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-[18px] text-[16px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7] cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Start a chat</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <p className="text-xs leading-[18px] text-[#d6e3dd]">
                Zovie will never ask for passwords or security codes.
              </p>
              {/* Email support: Gmail compose in a new tab (mailto: fails with no mail app) + copy */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/20 pt-3">
                <a
                  href={supportGmailHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-white underline underline-offset-2 hover:text-[#ffd6e4]"
                >
                  Email us: {SUPPORT_EMAIL}
                </a>
                <CopyEmailButton className="border-white! text-white! hover:bg-white! hover:text-[#c80f57]!" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ALL COUNTRIES MODAL */}
      {allCountriesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="all-countries-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e7f0] pb-4">
              <div>
                <h3 id="all-countries-title" className="text-lg font-extrabold text-[#141a45]">
                  Select a destination
                </h3>
                <p className="text-xs text-[#565c7e]">
                  Choose a country to check international rates &amp; dialling format
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllCountriesOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#141a45] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#d3d6e4] px-3 py-2">
              <Search className="h-4 w-4 text-[#565c7e]" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search country or dialling code..."
                className="w-full bg-transparent text-sm font-semibold text-[#141a45] focus:outline-none"
              />
            </div>

            <div className="mt-4 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {filteredModalCountries.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    handleSelectCountry(c);
                    setAllCountriesOpen(false);
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#e5e7f0] px-3 py-2.5 text-left transition hover:border-[#c80f57] hover:bg-[#fff4f7] cursor-pointer"
                >
                  <span className="text-sm font-bold text-[#141a45]">
                    {c.flag} {c.name}
                  </span>
                  <span className="text-xs font-semibold text-[#565c7e]">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Internationalcalls;
export { Internationalcalls };

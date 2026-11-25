"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Globe,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Signal,
  User,
  Zap,
} from "lucide-react";
import { isLoggedIn } from "../utils/auth";
import { openChat } from "../components/ChatbotWidget";
import {
  formatRateDisplay,
  getPublicRates,
  searchDestinations,
  type Destination,
  type PublicQuote,
} from "../services/roamingApi";

interface PlanOption {
  id: string;
  name: string;
  dataAllowance: string;
  callsAllowance: string;
  textsAllowance: string;
}

interface CountryItem {
  code: string;
  name: string;
  flag: string;
  zone: string;
  zoneType: "eu" | "row" | "row2";
}

interface PassOption {
  id: string;
  title: string;
  price: string;
  validity: string;
  bestValue?: boolean;
}

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const DEFAULT_PLANS: PlanOption[] = [
  {
    id: "zoiko-unlimited-50gb",
    name: "Zoiko Unlimited 50GB",
    dataAllowance: "50GB",
    callsAllowance: "Unlimited",
    textsAllowance: "Unlimited",
  },
  {
    id: "zoiko-essential-10gb",
    name: "Zoiko Essential 10GB",
    dataAllowance: "10GB",
    callsAllowance: "Unlimited",
    textsAllowance: "Unlimited",
  },
  {
    id: "zoiko-plus-30gb",
    name: "Zoiko Plus 30GB",
    dataAllowance: "30GB",
    callsAllowance: "Unlimited",
    textsAllowance: "Unlimited",
  },
  {
    id: "zoiko-max-unlimited",
    name: "Zoiko Max Unlimited",
    dataAllowance: "50GB",
    callsAllowance: "Unlimited",
    textsAllowance: "Unlimited",
  },
];
*/

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const CURATED_COUNTRIES: CountryItem[] = [
  { code: "ES", name: "Spain", flag: "🇪🇸", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "FR", name: "France", flag: "🇫🇷", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "IT", name: "Italy", flag: "🇮🇹", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "DE", name: "Germany", flag: "🇩🇪", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "GR", name: "Greece", flag: "🇬🇷", zone: "EU (Zone 1)", zoneType: "eu" },
  { code: "US", name: "United States", flag: "🇺🇸", zone: "Rest of World (Zone 2)", zoneType: "row" },
  { code: "CA", name: "Canada", flag: "🇨🇦", zone: "Rest of World (Zone 2)", zoneType: "row" },
  { code: "AU", name: "Australia", flag: "🇦🇺", zone: "Rest of World (Zone 2)", zoneType: "row" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", zone: "Rest of World (Zone 3)", zoneType: "row2" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", zone: "Rest of World (Zone 2)", zoneType: "row" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", zone: "Rest of World (Zone 2)", zoneType: "row" },
  { code: "JP", name: "Japan", flag: "🇯🇵", zone: "Rest of World (Zone 3)", zoneType: "row2" },
  { code: "IN", name: "India", flag: "🇮🇳", zone: "Rest of World (Zone 3)", zoneType: "row2" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", zone: "Rest of World (Zone 2)", zoneType: "row" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", zone: "Rest of World (Zone 3)", zoneType: "row2" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", zone: "Rest of World (Zone 3)", zoneType: "row2" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", zone: "Rest of World (Zone 2)", zoneType: "row" },
];
*/

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const ROAMING_PASSES: PassOption[] = [
  { id: "pass-1gb", title: "1 GB Pass", price: "£4.00", validity: "Valid for 7 days", bestValue: true },
  { id: "pass-5gb", title: "5 GB Pass", price: "£10.00", validity: "Valid for 14 days" },
  { id: "pass-10gb", title: "10GB Pass", price: "£18.00", validity: "Valid for 30 days" },
];
*/
// No passes endpoint exists on the backend yet; the passes section stays hidden until one does.
const ROAMING_PASSES: PassOption[] = [];

const FAQS = [
  {
    q: "Will I be charged for roaming in Spain?",
    a: "In EU Zone 1 destinations like Spain, eligible plans let you use your roaming allowance at no extra daily charge, subject to our fair use policy.",
  },
  {
    q: "How does my plan allowance work abroad?",
    a: "Your plan's published roaming data cap, minutes and texts apply in eligible destinations. Once reached, standard out-of-bundle rates or an active roaming pass apply.",
  },
  {
    q: "What are the out-of-bundle rates?",
    a: "Out-of-bundle rates vary by roaming zone and service (data per MB, calls per minute, texts per message) and are shown in the rate checker above.",
  },
  {
    q: "Can I use my phone as a mobile hotspot while roaming?",
    a: "Personal hotspot / tethering is supported within your eligible roaming data allowance where local partner networks permit.",
  },
  {
    q: "How do I set a spend limit for roaming?",
    a: "Sign in to MyZoiko to view or configure your roaming spend cap and receive automated usage notifications.",
  },
];

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const ZONE_INFO_LIST = [
  {
    title: "EU & EEA (Zone 1)",
    zoneType: "eu" as CountryItem["zoneType"],
    badge: "Included in eligible plans",
    badgeStyle: "bg-[#dcfce7] text-[#15803d]",
    description:
      "Use your UK plan's roaming data allowance, minutes to UK & Zone 1 numbers, and texts at no extra daily charge (subject to fair use policy).",
  },
  {
    title: "Rest of World (Zone 2)",
    zoneType: "row" as CountryItem["zoneType"],
    badge: "Pay-as-you-go rates",
    badgeStyle: "bg-[#fef3c7] text-[#92400e]",
    description:
      "Popular destinations outside the EU such as the US, Canada, Australia and Switzerland. Charged per MB, minute and text unless a pass applies.",
  },
  {
    title: "Rest of World (Zone 3 / Extended)",
    zoneType: "row2" as CountryItem["zoneType"],
    badge: "Standard international roaming",
    badgeStyle: "bg-[#ffe4e6] text-[#9f1239]",
    description:
      "Extended international destinations with destination-specific PAYG data, voice and SMS rates. Check exact rates using the destination checker.",
  },
];
*/

const EMPTY_PLAN: PlanOption = {
  id: "",
  name: "Your plan",
  dataAllowance: "—",
  callsAllowance: "—",
  textsAllowance: "—",
};

function codeToFlagEmoji(code: string): string {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return "🌍";
  const first = 0x1f1e6 + (clean.charCodeAt(0) - 65);
  const second = 0x1f1e6 + (clean.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}

function classifyZone(zoneName?: string | null): "eu" | "row" | "row2" {
  const lower = (zoneName || "").toLowerCase();
  if (lower.includes("eu") || lower.includes("zone 1") || lower.includes("eea")) {
    return "eu";
  }
  if (lower.includes("zone 3") || lower.includes("band c") || lower.includes("rest")) {
    return "row2";
  }
  return "row";
}

function getDemonymCallLabel(countryName: string): string {
  if (countryName === "Spain") return "To Spanish numbers";
  return `Within ${countryName}`;
}

export default function Roaming() {
  const searchParams = useSearchParams();
  const ratesSectionRef = useRef<HTMLElement | null>(null);

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ES");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedPassId, setSelectedPassId] = useState<string>(ROAMING_PASSES[0]?.id ?? "");

  const [publicQuote, setPublicQuote] = useState<PublicQuote | null>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const [zonesModalOpen, setZonesModalOpen] = useState<boolean>(false);
  const [destinationsModalOpen, setDestinationsModalOpen] = useState<boolean>(false);
  const [passesModalOpen, setPassesModalOpen] = useState<boolean>(false);
  const [destinationFilter, setDestinationFilter] = useState<string>("");

  useEffect(() => {
    setSignedIn(isLoggedIn());
  }, []);

  // Load destinations from public API and merge with curated list
  useEffect(() => {
    const controller = new AbortController();
    searchDestinations("", controller.signal)
      .then((apiDestinations: Destination[]) => {
        if (!Array.isArray(apiDestinations) || apiDestinations.length === 0) return;

        const mergedMap = new Map<string, CountryItem>();

        for (const dest of apiDestinations) {
          const code = (dest.code || "").toUpperCase();
          if (!code) continue;
          mergedMap.set(code, {
            code,
            name: dest.name || code,
            flag: codeToFlagEmoji(code),
            zone: dest.rating_zone || "International Roaming",
            zoneType: classifyZone(dest.rating_zone),
          });
        }

        const merged = Array.from(mergedMap.values()).sort((a, b) => {
          if (a.code === "ES") return -1;
          if (b.code === "ES") return 1;
          return a.name.localeCompare(b.name);
        });
        setCountries(merged);
      })
      .catch(() => {
        // API unreachable: leave the destination list empty
      });

    return () => controller.abort();
  }, []);

  // Load live plans from API when available to supplement plan selector
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return;
    const controller = new AbortController();

    fetch(`${baseUrl}/api/plans/v1/`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload?.results || payload?.plans;
        if (!Array.isArray(list) || list.length === 0) return;

        const mapped: PlanOption[] = [];
        for (const item of list) {
          const name = item?.title || item?.name || item?.plan_name;
          if (!name || typeof name !== "string") continue;
          const id = String(item?.slug || item?.id || name.toLowerCase().replace(/\s+/g, "-"));
          if (mapped.some((p) => p.id === id)) continue;
          const gb =
            item?.data_allowance ||
            item?.data ||
            (typeof item?.data_gb === "number" ? `${item.data_gb}GB` : "—");
          mapped.push({
            id,
            name,
            dataAllowance: String(gb),
            callsAllowance: "—",
            textsAllowance: "—",
          });
        }
        if (mapped.length > 0) {
          // Plans come only from the API
          setPlans(mapped);
          setSelectedPlanId((cur) => (mapped.some((p) => p.id === cur) ? cur : mapped[0].id));
        }
      })
      .catch(() => {
        // API unreachable: leave the plan list empty
      });

    return () => controller.abort();
  }, []);

  // Default to the first live destination if the initial code isn't in the list
  useEffect(() => {
    if (countries.length === 0) return;
    if (!countries.some((c) => c.code === selectedCountryCode)) {
      setSelectedCountryCode(countries[0].code);
    }
  }, [countries, selectedCountryCode]);

  // Sync URL query params (?country= or ?search=)
  useEffect(() => {
    const param = (searchParams.get("country") || searchParams.get("search") || "").trim();
    if (!param) return;
    const lower = param.toLowerCase();
    const matched = countries.find(
      (c) => c.code.toLowerCase() === lower || c.name.toLowerCase() === lower
    );
    if (matched) {
      setSelectedCountryCode(matched.code);
    }
  }, [searchParams, countries]);

  const selectedCountry = useMemo(() => {
    return (
      countries.find((c) => c.code === selectedCountryCode) || {
        code: selectedCountryCode,
        name: selectedCountryCode,
        flag: codeToFlagEmoji(selectedCountryCode),
        zone: "International Roaming",
        zoneType: "row" as const,
      }
    );
  }, [countries, selectedCountryCode]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || EMPTY_PLAN;
  }, [plans, selectedPlanId]);

  const fetchRatesForCountry = async (code: string, signal?: AbortSignal) => {
    setLoadingRates(true);
    try {
      const data = await getPublicRates(code, undefined, signal);
      if (data && data.rates) {
        setPublicQuote(data);
      } else {
        setPublicQuote(null);
      }
    } catch {
      setPublicQuote(null);
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRatesForCountry(selectedCountryCode, controller.signal);
    return () => controller.abort();
  }, [selectedCountryCode]);

  const handleCheckRatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRatesForCountry(selectedCountryCode);
    ratesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const resolvedZoneLabel = useMemo(() => {
    if (publicQuote?.destination?.rating_zone) {
      const rz = publicQuote.destination.rating_zone;
      if (rz.toLowerCase().includes("eu") && !rz.includes("(")) {
        return "EU (Zone 1)";
      }
      return rz;
    }
    return selectedCountry.zone;
  }, [publicQuote, selectedCountry.zone]);

  const isEuZone = useMemo(() => {
    return classifyZone(resolvedZoneLabel) === "eu";
  }, [resolvedZoneLabel]);

  const rateCards = useMemo(() => {
    const apiRates = publicQuote?.rates;
    const countryName = selectedCountry.name;

    if (isEuZone) {
      return {
        dataValue: selectedPlan.dataAllowance,
        dataSubline1: "roaming allowance",
        dataSubline2: "(UK plan allowance)",
        dataBadge: "✓ Included",
        dataIncluded: true,

        ukCallsValue: selectedPlan.callsAllowance,
        ukCallsSubline: `UK numbers from ${countryName}`,
        ukCallsBadge: "✓ Included",
        ukCallsIncluded: true,

        localCallsValue: selectedPlan.callsAllowance,
        localCallsSubline: getDemonymCallLabel(countryName),
        localCallsBadge: "✓ Included",
        localCallsIncluded: true,

        incomingValue: apiRates?.voice_incoming?.display || "—",
        incomingSubline: `Receive calls while in ${countryName}`,
        incomingBadge: "✓ Included",
        incomingIncluded: true,

        textsValue: selectedPlan.textsAllowance,
        textsSubline: `Send texts to the UK and within ${countryName}`,
        textsBadge: "✓ Included",
        textsIncluded: true,

        oobData: apiRates?.data?.display || "—",
        oobCalls: apiRates?.voice_to_uk?.display || "—",
        oobTexts: apiRates?.sms?.display || "—",
      };
    }


    return {
      dataValue: apiRates?.data?.display || "—",
      dataSubline1: apiRates?.data?.unit || "Pay-as-you-go data",
      dataSubline2: "Outside EU Zone 1",
      dataBadge: "Standard rate",
      dataIncluded: false,

      ukCallsValue: apiRates?.voice_to_uk?.display || "—",
      ukCallsSubline: `UK numbers from ${countryName}`,
      ukCallsBadge: "Standard rate",
      ukCallsIncluded: false,

      localCallsValue: apiRates?.voice_local?.display || "—",
      localCallsSubline: getDemonymCallLabel(countryName),
      localCallsBadge: "Standard rate",
      localCallsIncluded: false,

      incomingValue: apiRates?.voice_incoming?.display || "—",
      incomingSubline: `Receive calls while in ${countryName}`,
      incomingBadge: "Standard rate",
      incomingIncluded: false,

      textsValue: apiRates?.sms?.display || "—",
      textsSubline: `Send texts from ${countryName}`,
      textsBadge: "Standard rate",
      textsIncluded: false,

      oobData: apiRates?.data?.display || "—",
      oobCalls: apiRates?.voice_to_uk?.display || "—",
      oobTexts: apiRates?.sms?.display || "—",
    };
  }, [isEuZone, publicQuote, selectedCountry, selectedPlan]);

  const zoneGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const c of countries) {
      const list = groups.get(c.zone) || [];
      list.push(c.name);
      groups.set(c.zone, list);
    }
    return Array.from(groups.entries())
      .map(([zone, names]) => ({ zone, count: names.length, examples: names.slice(0, 6) }))
      .sort((x, y) => x.zone.localeCompare(y.zone));
  }, [countries]);

  const filteredModalCountries = useMemo(() => {
    const q = destinationFilter.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.zone.toLowerCase().includes(q)
    );
  }, [countries, destinationFilter]);

  const myZoikoHref = signedIn
    ? "/dashboard/roaming-and-travel"
    : "/login?next=/dashboard/roaming-and-travel";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* Section 1: Hero Banner */}
      <section className="relative overflow-hidden bg-[linear-gradient(133deg,#9C0744_6%,#C90058_39%,#4B1D47_62%,#053B39_94%)]">
        <img
          src="/images/roaming-and-coverage/hero-banner.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right md:object-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#8f063d]/90 via-[#9c0744]/55 to-transparent lg:via-[#9c0744]/30"
        />

        <div className="relative mx-auto max-w-[1224px] px-4 py-9 sm:px-6 md:py-11">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/90">
            ROAMING &amp; OVERAGE RATES
          </p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[38px]">
            Know your roaming costs before
            <br className="hidden sm:inline" /> you travel.
          </h1>
          <p className="mt-2.5 max-w-[500px] text-[14px] leading-relaxed text-white/90">
            Check charges, allowances and passes for any destination, with clear
            and transparent rates.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#0f172a]/35 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-xs">
              <Globe
                className="h-4 w-4 shrink-0 text-white"
                strokeWidth={2}
                aria-hidden="true"
              />
              200+ destinations
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#0f172a]/35 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-xs">
              <Zap
                className="h-4 w-4 shrink-0 text-white"
                strokeWidth={2}
                aria-hidden="true"
              />
              Clear, upfront rates
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#0f172a]/35 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-xs">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-white"
                strokeWidth={2}
                aria-hidden="true"
              />
              Control your spend
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-[1224px] space-y-[18px] px-4 py-6 sm:px-6">
        {/* Card 1: Check your roaming charges */}
        <section className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-5 shadow-[0px_3px_7px_rgba(5,59,57,0.05)] sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#fecdd3] bg-[#fff1f5]">
              <Globe
                className="h-5 w-5 text-[#c90058]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[22px]">
                Check your roaming charges
              </h2>
              <p className="mt-0.5 text-[13px] text-[#475569]">
                Select your destination and plan to see included allowances and
                out-of-bundle rates.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCheckRatesSubmit}
            className="mt-4 grid grid-cols-1 items-end gap-4 lg:grid-cols-[1fr_1fr_230px]"
          >
            <div>
              <label
                htmlFor="roaming-destination-select"
                className="block text-[13px] font-extrabold text-[#0f172a]"
              >
                Where are you travelling?
              </label>
              <div className="relative mt-1.5 flex h-[46px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-[#cbd5e1] bg-white px-3 focus-within:border-[#c90058]">
                <Search
                  className="h-4 w-4 shrink-0 text-[#64748b]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="text-[16px] leading-none" aria-hidden="true">
                  {selectedCountry.flag}
                </span>
                <select
                  id="roaming-destination-select"
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="h-full w-full flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-[14px] font-bold text-[#0f172a] outline-none"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 h-4 w-4 text-[#0f172a]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="roaming-plan-select"
                className="block text-[13px] font-extrabold text-[#0f172a]"
              >
                Your Zoiko plan
              </label>
              <div className="relative mt-1.5 flex h-[46px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-[#cbd5e1] bg-white px-3 focus-within:border-[#c90058]">
                <Layers
                  className="h-4 w-4 shrink-0 text-[#64748b]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <select
                  id="roaming-plan-select"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="h-full w-full flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-[14px] font-bold text-[#0f172a] outline-none"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 h-4 w-4 text-[#0f172a]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#c90058] px-5 text-[14px] font-bold text-white shadow-[0px_6px_8px_rgba(201,0,88,0.24)] transition hover:bg-[#a90049]"
            >
              <span>Check roaming rates</span>
              <span aria-hidden="true">›</span>
            </button>
          </form>

          <div className="mt-3 flex items-center gap-1.5 text-[12.5px]">
            <User
              className="h-[15px] w-[15px] shrink-0 text-[#c90058]"
              strokeWidth={2}
              aria-hidden="true"
            />
            <p className="text-[#334155]">
              <Link
                href={myZoikoHref}
                className="font-bold text-[#c90058] underline-offset-2 hover:underline"
              >
                {signedIn ? "View MyZoiko" : "Sign in to MyZoiko"}
              </Link>{" "}
              for personalised rates, usage and spend controls.
            </p>
          </div>
        </section>

        {/* Card 2: Your roaming rates in {Country} */}
        <section
          ref={ratesSectionRef}
          className="grid grid-cols-1 gap-[18px] rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)] lg:grid-cols-[186px_1fr]"
        >
          <div className="relative min-h-[225px] overflow-hidden rounded-[12px] bg-gradient-to-b from-[#38bdf8] via-[#fbbf24] to-[#b45309]">
            <img
              src="/images/roaming-and-coverage/destination-spain.png"
              alt={`${selectedCountry.name} roaming destination`}
              className="h-full min-h-[225px] w-full object-cover"
            />
            {selectedCountry.code !== "ES" && (
              <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full bg-[#0f172a]/75 px-3 py-1 text-[11.5px] font-bold text-white backdrop-blur-xs">
                <span>{selectedCountry.flag}</span>
                <span className="truncate">{selectedCountry.name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              {/* Top header bar */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#e2e8f0] bg-[#fef2f2] text-[20px]">
                    {selectedCountry.flag}
                  </div>
                  <div>
                    <h2 className="text-[20px] font-extrabold leading-tight text-[#0f172a]">
                      Your roaming rates in {selectedCountry.name}
                    </h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#475569]">
                      <span>Plan: {selectedPlan.name}</span>
                      <span aria-hidden="true">|</span>
                      <span>Roaming zone: {resolvedZoneLabel}</span>
                      <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-[2px] text-[11px] font-bold text-[#15803d]">
                        ✓ Based on your selected plan
                      </span>
                      {loadingRates && (
                        <span className="text-[11px] font-semibold text-[#c90058]">
                          Updating...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setZonesModalOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#fecdd3] bg-[#fff1f5] px-3 py-1.5 text-[12px] font-bold text-[#0f172a] transition hover:border-[#c90058]"
                  >
                    <span className="font-extrabold text-[#c90058]">i</span>
                    <span>About roaming zones</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestinationsModalOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#fecdd3] bg-[#fff1f5] px-3 py-1.5 text-[12px] font-bold text-[#0f172a] transition hover:border-[#c90058]"
                  >
                    <MapPin
                      className="h-[13px] w-[13px] text-[#c90058]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>View all destinations</span>
                  </button>
                </div>
              </div>

              {/* 6 Rate Tiles */}
              <div className="my-3 grid grid-cols-2 gap-[10px] sm:grid-cols-3 xl:grid-cols-6">
                {/* Tile 1: Data */}
                <div className="flex min-h-[129px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-[#334155]">
                      <span className="text-[#16a34a]" aria-hidden="true">📶</span>
                      <span>Data</span>
                    </div>
                    <p className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#0f172a]">
                      {rateCards.dataValue}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-[1.25] text-[#475569]">
                      {rateCards.dataSubline1}
                      <br />
                      {rateCards.dataSubline2}
                    </p>
                  </div>
                  <div
                    className={`mt-2 rounded-full px-2 py-[3px] text-[11px] font-extrabold ${
                      rateCards.dataIncluded
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {rateCards.dataBadge}
                  </div>
                </div>

                {/* Tile 2: Calls to the UK */}
                <div className="flex min-h-[129px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-[#334155]">
                      <span className="text-[#c90058]" aria-hidden="true">📞</span>
                      <span>Calls to the UK</span>
                    </div>
                    <p className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#0f172a]">
                      {rateCards.ukCallsValue}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-[1.25] text-[#475569]">
                      {rateCards.ukCallsSubline}
                    </p>
                  </div>
                  <div
                    className={`mt-2 rounded-full px-2 py-[3px] text-[11px] font-extrabold ${
                      rateCards.ukCallsIncluded
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {rateCards.ukCallsBadge}
                  </div>
                </div>

                {/* Tile 3: Calls in Country */}
                <div className="flex min-h-[129px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-[#334155]">
                      <span className="text-[#c90058]" aria-hidden="true">📞</span>
                      <span className="truncate">Calls in {selectedCountry.name}</span>
                    </div>
                    <p className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#0f172a]">
                      {rateCards.localCallsValue}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-[1.25] text-[#475569]">
                      {rateCards.localCallsSubline}
                    </p>
                  </div>
                  <div
                    className={`mt-2 rounded-full px-2 py-[3px] text-[11px] font-extrabold ${
                      rateCards.localCallsIncluded
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {rateCards.localCallsBadge}
                  </div>
                </div>

                {/* Tile 4: Incoming calls */}
                <div className="flex min-h-[129px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-[#334155]">
                      <span className="text-[#c90058]" aria-hidden="true">📲</span>
                      <span>Incoming calls</span>
                    </div>
                    <p className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#0f172a]">
                      {rateCards.incomingValue}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-[1.25] text-[#475569]">
                      {rateCards.incomingSubline}
                    </p>
                  </div>
                  <div
                    className={`mt-2 rounded-full px-2 py-[3px] text-[11px] font-extrabold ${
                      rateCards.incomingIncluded
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {rateCards.incomingBadge}
                  </div>
                </div>

                {/* Tile 5: Texts */}
                <div className="flex min-h-[129px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[11.5px] font-bold text-[#334155]">
                      <span className="text-[#064f46]" aria-hidden="true">💬</span>
                      <span>Texts</span>
                    </div>
                    <p className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#0f172a]">
                      {rateCards.textsValue}
                    </p>
                    <p className="mt-1 text-[10.5px] leading-[1.25] text-[#475569]">
                      {rateCards.textsSubline}
                    </p>
                  </div>
                  <div
                    className={`mt-2 rounded-full px-2 py-[3px] text-[11px] font-extrabold ${
                      rateCards.textsIncluded
                        ? "bg-[#dcfce7] text-[#15803d]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {rateCards.textsBadge}
                  </div>
                </div>

                {/* Tile 6: Out-of-bundle rates */}
                <div className="flex min-h-[129px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-3 text-left">
                  <div>
                    <div className="flex items-center gap-1 text-[11.5px] font-bold text-[#334155]">
                      <span className="text-[#c90058]" aria-hidden="true">⚙</span>
                      <span>Out-of-bundle rates</span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-extrabold text-[#0f172a]">
                      From plan limit
                    </p>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[11px] leading-[1.45] text-[#0f172a]">
                    <p>
                      • Data:{" "}
                      <span className="font-extrabold">{rateCards.oobData}</span>
                    </p>
                    <p>
                      • Calls:{" "}
                      <span className="font-extrabold">{rateCards.oobCalls}</span>
                    </p>
                    <p>
                      • Texts:{" "}
                      <span className="font-extrabold">{rateCards.oobTexts}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fair use notice strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#fecdd3] bg-[#fff1f5] px-3.5 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-extrabold text-[#c90058]" aria-hidden="true">
                  ⓘ
                </span>
                <p className="text-[12px] text-[#0f172a]">
                  <span className="font-bold">Fair use:</span> Roaming is for
                  reasonable, periodic travel. Higher or prolonged use abroad may
                  be subject to our fair use policy.
                </p>
              </div>
              <Link
                href="/terms-and-conditions"
                className="whitespace-nowrap text-[12px] font-extrabold text-[#c90058] hover:underline"
              >
                Read the full roaming policy ›
              </Link>
            </div>
          </div>
        </section>

        {/* Row 3: Roaming passes + Control your spending (both with Upcoming tags) */}
        <section className={`grid grid-cols-1 gap-[18px] ${ROAMING_PASSES.length > 0 ? "lg:grid-cols-[1.22fr_1fr]" : ""}`}>
          {/* Roaming passes */}
          {ROAMING_PASSES.length > 0 && (
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                  <Layers
                    className="h-5 w-5 text-[#c90058]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                    Roaming passes
                  </h2>
                  <p className="text-[12.5px] text-[#475569]">
                    Need more data or a longer stay?
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#fecdd3] bg-[#fff1f5] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#c90058]">
                Upcoming
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 items-center gap-[10px] sm:grid-cols-[1fr_1fr_1fr_155px]">
              {ROAMING_PASSES.map((pass) => {
                const isSelected = selectedPassId === pass.id;
                return (
                  <button
                    key={pass.id}
                    type="button"
                    onClick={() => setSelectedPassId(pass.id)}
                    className={`relative flex h-[86px] cursor-pointer flex-col items-start justify-center rounded-[12px] border-[1.5px] px-2.5 pt-3 pb-2 text-left transition ${
                      isSelected
                        ? "border-[#c90058] bg-[#fff1f5]"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }`}
                  >
                    {pass.bestValue && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#c90058] px-2.5 py-[2px] text-[9.5px] font-extrabold text-white">
                        Best value
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[13px] font-extrabold ${
                          isSelected ? "text-[#c90058]" : "text-[#94a3b8]"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected ? "◉" : "○"}
                      </span>
                      <span className="text-[13px] font-extrabold text-[#0f172a]">
                        {pass.title}
                      </span>
                    </div>
                    <p className="pl-5 pt-0.5 text-[15px] font-extrabold text-[#0f172a]">
                      {pass.price}
                    </p>
                    <p className="pl-5 text-[11px] text-[#475569]">
                      {pass.validity}
                    </p>
                  </button>
                );
              })}

              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Upcoming feature — roaming passes will be available soon"
                  className="flex min-h-[40px] w-full cursor-not-allowed items-center justify-center gap-1 rounded-full bg-[#c90058]/60 px-3 text-[12.5px] font-bold text-white"
                >
                  <span>Add a roaming pass</span>
                  <span aria-hidden="true">›</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPassesModalOpen(true)}
                  className="cursor-pointer text-[11.5px] font-bold text-[#c90058] underline hover:opacity-80"
                >
                  View all roaming passes ›
                </button>
              </div>
            </div>
          </div>

          )}

          {/* Control your spending */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="grid grid-cols-1 items-center gap-[14px] sm:grid-cols-[1fr_165px]">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                      <ShieldCheck
                        className="h-5 w-5 text-[#c90058]"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                        Control your spending
                      </h2>
                      <p className="text-[12.5px] text-[#475569]">
                        Stay in control when you roam abroad.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-[#fecdd3] bg-[#fff1f5] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#c90058]">
                    Upcoming
                  </span>
                </div>

                <ul className="mt-3 space-y-2.5">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] bg-[#064f46] text-[11px] font-extrabold text-white">
                      ✓
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#0f172a]">
                      Set a roaming spend limit in MyZoiko
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] bg-[#064f46] text-[11px] font-extrabold text-white">
                      ✓
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#0f172a]">
                      Get usage alerts (data, calls and texts)
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] bg-[#064f46] text-[11px] font-extrabold text-white">
                      ✓
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#0f172a]">
                      Pause roaming at any time
                    </span>
                  </li>
                </ul>
              </div>

              {/* MyZoiko miniature device mockup */}
              <div className="mx-auto w-[165px] rounded-[18px] bg-[#111827] p-[5px] shadow-[0px_8px_10px_rgba(15,23,42,0.14)]">
                <div className="overflow-hidden rounded-[14px] bg-white">
                  <div className="bg-[#c90058] py-[5px] text-center text-[10.5px] font-extrabold text-white">
                    MyZoiko
                  </div>
                  <div className="px-2.5 py-2 text-center">
                    <p className="text-[10px] font-bold text-[#475569]">
                      Roaming spend limit
                    </p>
                    <p className="mt-0.5 text-[18px] font-extrabold leading-tight text-[#0f172a]">
                      £50.00
                    </p>
                    <div className="mt-1.5 h-[4px] w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                      <div className="h-full w-[45%] bg-[#064f46]" />
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-[#f1f5f9] py-[3px]">
                      <span className="text-[9px] font-bold text-[#334155]">
                        Usage alerts
                      </span>
                      <span className="relative inline-block h-[13px] w-[24px] rounded-full bg-[#064f46]">
                        <span className="absolute top-[2px] left-[13px] h-[9px] w-[9px] rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#f1f5f9] py-[3px]">
                      <span className="text-[9px] font-bold text-[#334155]">
                        Roaming
                      </span>
                      <span className="relative inline-block h-[13px] w-[24px] rounded-full bg-[#064f46]">
                        <span className="absolute top-[2px] left-[13px] h-[9px] w-[9px] rounded-full bg-white" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 4: Before you travel + Useful information + FAQs */}
        <section className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {/* Before you travel */}
          <div className="flex flex-col gap-5 rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                <Send
                  className="h-5 w-5 text-[#c90058]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                  Before you travel
                </h2>
                <p className="text-[12.5px] text-[#475569]">
                  A quick checklist for a hassle-free trip.
                </p>
              </div>
            </div>

            <ul className="space-y-5 pt-1">
              {[
                "Check your plan's roaming inclusions and destination zone.",
                "Add a roaming pass if you need extra data.",
                "Turn on data roaming in your device settings.",
                "Keep an eye on your usage in MyZoiko.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] bg-[#064f46] text-[11px] font-extrabold text-white">
                    ✓
                  </span>
                  <span className="text-[12.5px] font-semibold leading-snug text-[#0f172a]">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful information */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                <BookOpen
                  className="h-5 w-5 text-[#c90058]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                  Useful information
                </h2>
                <p className="text-[12.5px] text-[#475569]">
                  Everything you need to know about roaming.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                {
                  label: "Roaming included in plans",
                  href: "/roaming-included-in-plans",
                  icon: (
                    <img
                      src="/images/roaming-and-coverage/icon-sim-included.svg"
                      alt=""
                      className="h-[17px] w-[17px] shrink-0"
                    />
                  ),
                },
                {
                  label: "International calling",
                  href: "/international-calling",
                  icon: (
                    <Phone
                      className="h-[17px] w-[17px] shrink-0 text-[#c90058]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  label: "Network coverage abroad",
                  href: "/coverage-checker",
                  icon: (
                    <Signal
                      className="h-[17px] w-[17px] shrink-0 text-[#c90058]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  label: "Roaming help & troubleshooting",
                  href: "/support",
                  icon: (
                    <CircleHelp
                      className="h-[17px] w-[17px] shrink-0 text-[#c90058]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ),
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 transition hover:border-[#fecdd3] hover:bg-[#fff1f5]/50"
                >
                  <span className="flex items-center gap-2.5 text-[13px] font-bold text-[#0f172a]">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  <span className="text-[14px] font-extrabold text-[#c90058]" aria-hidden="true">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Frequently asked questions */}
          {FAQS.length > 0 && (
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5] text-[16px] font-bold text-[#c90058]">
                  ?
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                    Frequently asked questions
                  </h2>
                  <p className="text-[12.5px] text-[#475569]">
                    Quick answers to common roaming questions.
                  </p>
                </div>
              </div>
              <Link
                href="/faqs"
                className="shrink-0 text-[12px] font-extrabold text-[#c90058] hover:underline"
              >
                View all FAQs ›
              </Link>
            </div>

            <div className="mt-3 space-y-[7px]">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-[9px] border border-[#e2e8f0] bg-[#f8fafc]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left"
                    >
                      <span className="text-[12.5px] font-bold leading-snug text-[#0f172a]">
                        {faq.q}
                      </span>
                      <span
                        className="shrink-0 text-[16px] font-extrabold leading-none text-[#c90058]"
                        aria-hidden="true"
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#e2e8f0] bg-white px-3 pt-2 pb-2.5">
                        <p className="text-[12px] leading-relaxed text-[#334155]">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </section>

        {/* Bottom Travelling Soon CTA Strip */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-gradient-to-r from-[#064f46] via-[#0b5d51] to-[#053b39] px-6 py-4 shadow-[0px_4px_14px_rgba(5,59,57,0.18)]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Send
                className="h-5 w-5 text-white"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-[18px] font-extrabold text-white">
                Travelling soon?
              </h2>
              <p className="text-[12.5px] text-white/85">
                Check your destination, add a pass and stay connected with Zoiko
                Mobile UK.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openChat()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-extrabold text-[#c90058] shadow-xs transition hover:bg-[#fff1f5]"
            >
              <MessageSquare
                className="h-4 w-4 text-[#c90058]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Chat with Zovie</span>
            </button>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-extrabold text-[#0f172a] shadow-xs transition hover:bg-[#f8fafc]"
            >
              <Phone
                className="h-4 w-4 text-[#c90058]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Contact support</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Modal: About roaming zones */}
      {zonesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setZonesModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-extrabold text-[#0f172a]">
                About Zoiko Roaming Zones
              </h3>
              <button
                type="button"
                onClick={() => setZonesModalOpen(false)}
                className="cursor-pointer rounded-full px-2 py-1 text-[16px] font-bold text-[#64748b] hover:bg-[#f1f5f9]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {zoneGroups.length === 0 && (
                <p className="text-[13px] text-[#475569]">Zone information is unavailable right now.</p>
              )}
              {zoneGroups.map((z) => (
                <div
                  key={z.zone}
                  className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[14px] font-extrabold text-[#0f172a]">{z.zone}</p>
                    <span className="rounded-full bg-[#e2e8f0] px-2.5 py-0.5 text-[11px] font-bold text-[#334155]">
                      {z.count} destination{z.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#475569]">
                    {z.examples.join(", ")}
                    {z.count > z.examples.length ? ` and ${z.count - z.examples.length} more` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: View all destinations */}
      {destinationsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDestinationsModalOpen(false)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#0f172a]">
                  All roaming destinations ({countries.length})
                </h3>
                <p className="text-[12.5px] text-[#475569]">
                  Select any destination to update your roaming rate quote.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDestinationsModalOpen(false)}
                className="cursor-pointer rounded-full px-2 py-1 text-[16px] font-bold text-[#64748b] hover:bg-[#f1f5f9]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                placeholder="Search country, ISO code or roaming zone..."
                className="w-full rounded-[10px] border border-[#cbd5e1] px-3.5 py-2 text-[13.5px] text-[#0f172a] outline-none focus:border-[#c90058]"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredModalCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountryCode(country.code);
                    setDestinationsModalOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-[10px] border px-3 py-2 text-left transition ${
                    selectedCountryCode === country.code
                      ? "border-[#c90058] bg-[#fff1f5]"
                      : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#fecdd3]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[16px]">{country.flag}</span>
                    <span className="text-[13px] font-bold text-[#0f172a]">
                      {country.name}
                    </span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#64748b]">
                    {country.zone}
                  </span>
                </button>
              ))}
              {filteredModalCountries.length === 0 && (
                <p className="col-span-full py-6 text-center text-[13px] text-[#64748b]">
                  No destinations matched &ldquo;{destinationFilter}&rdquo;.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upcoming Roaming Passes overview */}
      {passesModalOpen && ROAMING_PASSES.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPassesModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-extrabold text-[#0f172a]">
                  Roaming Passes
                </h3>
                <span className="rounded-full border border-[#fecdd3] bg-[#fff1f5] px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase text-[#c90058]">
                  Upcoming
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPassesModalOpen(false)}
                className="cursor-pointer rounded-full px-2 py-1 text-[16px] font-bold text-[#64748b] hover:bg-[#f1f5f9]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-[13px] text-[#475569]">
              Optional travel data passes are coming soon to Zoiko Mobile UK.
              Preview upcoming pass tiers below:
            </p>
            <div className="mt-4 space-y-2.5">
              {ROAMING_PASSES.map((pass) => (
                <div
                  key={pass.id}
                  className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-extrabold text-[#0f172a]">
                      {pass.title}
                    </p>
                    <p className="text-[12px] text-[#475569]">{pass.validity}</p>
                  </div>
                  <span className="text-[15px] font-extrabold text-[#c90058]">
                    {pass.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// OLD ROAMING.TSX IMPLEMENTATION (COMMENTED OUT AS REQUESTED)
// =============================================================================
// "use client";
// 
// import { useState, useMemo, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import { Search, Globe, Phone, MessageSquare, Database, Check, ShieldCheck } from "lucide-react";
// import {
//   searchDestinations,
//   getPublicRates,
//   formatRateDisplay,
//   getVatBasisLabel,
//   formatDisplayDate,
//   RATE_TILE_LABELS,
//   type Destination,
//   type PublicQuote,
// } from "../services/roamingApi";
// 
// // â”€â”€â”€ DATA & ZONE RATES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 
// export interface ZoneRates {
//   zone: string;
//   zoneName: string;
//   isEuIncluded: boolean;
//   countries: string;
//   textSent: string;
//   textReceived: string;
//   callSent: string;
//   callReceived: string;
//   dataPriceMb: string;
// }
// 
// export const ZONES_DATA: ZoneRates[] = [
//   {
//     zone: "Zone 1",
//     zoneName: "Zone 1 (UK Offshore & Ireland)",
//     isEuIncluded: true,
//     countries: "Ireland, Isle of Man, Guernsey, Jersey",
//     textSent: "Â£0.08",
//     textReceived: "Â£0.00",
//     callSent: "Â£0.013",
//     callReceived: "Â£0.036",
//     dataPriceMb: "Â£0.0040",
//   },
//   {
//     zone: "Zone 2",
//     zoneName: "Zone 2 (EU & EEA + Wider Europe)",
//     isEuIncluded: true,
//     countries: "Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Gibraltar, Greece, Hungary, Iceland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Monaco, Netherlands, Norway, Poland, Portugal, Romania, San Marino, Slovakia, Slovenia, Spain, Sweden, Switzerland, Turkey, Vatican City, Albania, Andorra, Bosnia & Herzegovina, North Macedonia, Serbia",
//     textSent: "Â£0.10",
//     textReceived: "Â£0.00",
//     callSent: "Â£0.065",
//     callReceived: "Â£0.052",
//     dataPriceMb: "Â£0.0160",
//   },
//   {
//     zone: "Zone 3",
//     zoneName: "Zone 3 (Asia Pacific & Subcontinent)",
//     isEuIncluded: false,
//     countries: "Australia, China, Hong Kong, India, New Zealand, Philippines, Singapore, South Korea",
//     textSent: "Â£0.16",
//     textReceived: "Â£0.00",
//     callSent: "Â£0.065",
//     callReceived: "Â£0.033",
//     dataPriceMb: "Â£0.0320",
//   },
//   {
//     zone: "Zone 4",
//     zoneName: "Zone 4 (North America)",
//     isEuIncluded: false,
//     countries: "USA (United States), Canada",
//     textSent: "Â£0.35",
//     textReceived: "Â£0.00",
//     callSent: "Â£0.065",
//     callReceived: "Â£0.390",
//     dataPriceMb: "Â£0.0800",
//   },
//   {
//     zone: "Zone 5",
//     zoneName: "Zone 5 (Middle East & North Africa)",
//     isEuIncluded: false,
//     countries: "Algeria, Egypt, Israel, Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Qatar, Saudi Arabia, Syria, Tunisia, United Arab Emirates (Dubai)",
//     textSent: "Â£0.70",
//     textReceived: "Â£0.00",
//     callSent: "Â£0.520",
//     callReceived: "Â£1.170",
//     dataPriceMb: "Â£1.0900",
//   },
//   {
//     zone: "Zone 6",
//     zoneName: "Zone 6 (Rest of the World)",
//     isEuIncluded: false,
//     countries: "Afghanistan, Argentina, Brazil, Chile, Colombia, Costa Rica, Ghana, Indonesia, Jamaica, Japan, Kenya, Malaysia, Mexico, Nigeria, Pakistan, Peru, South Africa, Sri Lanka, Thailand, Vietnam & all other worldwide destinations",
//     textSent: "Â£0.70",
//     textReceived: "Â£0.00",
//     callSent: "Â£0.830",
//     callReceived: "Â£1.170",
//     dataPriceMb: "Â£3.1250",
//   },
// ];
// 
// // Popular individual destination lookup list
// const POPULAR_COUNTRIES = [
//   { name: "United States", code: "US", zone: "Zone 4", flag: "ðŸ‡ºðŸ‡¸" },
//   { name: "Spain", code: "ES", zone: "Zone 2", flag: "ðŸ‡ªðŸ‡¸" },
//   { name: "France", code: "FR", zone: "Zone 2", flag: "ðŸ‡«ðŸ‡·" },
//   { name: "India", code: "IN", zone: "Zone 3", flag: "ðŸ‡®ðŸ‡³" },
//   { name: "Ireland", code: "IE", zone: "Zone 1", flag: "ðŸ‡®ðŸ‡ª" },
//   { name: "TÃ¼rkiye (Turkey)", code: "TR", zone: "Zone 2", flag: "ðŸ‡¹ðŸ‡·" },
//   { name: "United Arab Emirates (Dubai)", code: "AE", zone: "Zone 5", flag: "ðŸ‡¦ðŸ‡ª" },
//   { name: "Australia", code: "AU", zone: "Zone 3", flag: "ðŸ‡¦ðŸ‡º" },
//   { name: "Canada", code: "CA", zone: "Zone 4", flag: "ðŸ‡¨ðŸ‡¦" },
//   { name: "Germany", code: "DE", zone: "Zone 2", flag: "ðŸ‡©ðŸ‡ª" },
//   { name: "Italy", code: "IT", zone: "Zone 2", flag: "ðŸ‡®ðŸ‡¹" },
//   { name: "Greece", code: "GR", zone: "Zone 2", flag: "ðŸ‡¬ðŸ‡·" },
//   { name: "Portugal", code: "PT", zone: "Zone 2", flag: "ðŸ‡µðŸ‡¹" },
//   { name: "Saudi Arabia", code: "SA", zone: "Zone 5", flag: "ðŸ‡¸ðŸ‡¦" },
//   { name: "Pakistan", code: "PK", zone: "Zone 6", flag: "ðŸ‡µðŸ‡°" },
//   { name: "South Africa", code: "ZA", zone: "Zone 6", flag: "ðŸ‡¿ðŸ‡¦" },
//   { name: "China", code: "CN", zone: "Zone 3", flag: "ðŸ‡¨ðŸ‡³" },
//   { name: "Japan", code: "JP", zone: "Zone 6", flag: "ðŸ‡¯ðŸ‡µ" },
//   { name: "Thailand", code: "TH", zone: "Zone 6", flag: "ðŸ‡¹ðŸ‡­" },
//   { name: "Brazil", code: "BR", zone: "Zone 6", flag: "ðŸ‡§ðŸ‡·" },
//   { name: "New Zealand", code: "NZ", zone: "Zone 3", flag: "ðŸ‡³ðŸ‡¿" },
//   { name: "Egypt", code: "EG", zone: "Zone 5", flag: "ðŸ‡ªðŸ‡¬" },
//   { name: "Morocco", code: "MA", zone: "Zone 5", flag: "ðŸ‡²ðŸ‡¦" },
//   { name: "Singapore", code: "SG", zone: "Zone 3", flag: "ðŸ‡¸ðŸ‡¬" },
//   { name: "Switzerland", code: "CH", zone: "Zone 2", flag: "ðŸ‡¨ðŸ‡­" },
//   { name: "Netherlands", code: "NL", zone: "Zone 2", flag: "ðŸ‡³ðŸ‡±" },
//   { name: "Poland", code: "PL", zone: "Zone 2", flag: "ðŸ‡µðŸ‡±" },
// ];
// 
// // â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 
// const pillColor: Record<string, string> = {
//   text: "bg-[#6d5dd3]",
//   calls: "bg-[#e6007e]",
//   data: "bg-[#ec4faa]",
// };
// 
// function Pill({ label, color }: { label: string; color: keyof typeof pillColor }) {
//   return (
//     <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white ${pillColor[color]}`}>
//       {label}
//     </span>
//   );
// }
// 
// function TableShell({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[640px] text-left">{children}</table>
//       </div>
//     </div>
//   );
// }
// 
// // â”€â”€â”€ PAGE COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 
// export default function Roaming() {
//   const searchParams = useSearchParams();
//   const initialCountry = searchParams?.get("country") || searchParams?.get("search") || "";
//   const [searchQuery, setSearchQuery] = useState(initialCountry);
// 
//   useEffect(() => {
//     const c = searchParams?.get("country") || searchParams?.get("search");
//     if (c) {
//       setSearchQuery(c);
//     }
//   }, [searchParams]);
//   const [selectedZone, setSelectedZone] = useState<string>("Zone 2");
// 
//   // Live destinations and rates from the backend (apps/roaming). When the backend has no data for the
//   // search, the published zone table below is still shown, exactly as before.
//   const [liveDest, setLiveDest] = useState<Destination[]>([]);
//   const [liveLoading, setLiveLoading] = useState(false);
//   const [liveCode, setLiveCode] = useState<string | null>(null);
//   const [liveQuote, setLiveQuote] = useState<PublicQuote | null>(null);
//   const [liveQuoteLoading, setLiveQuoteLoading] = useState(false);
//   const [liveQuoteError, setLiveQuoteError] = useState("");
// 
//   useEffect(() => {
//     const q = searchQuery.trim();
//     if (!q) return;
//     const ctrl = new AbortController();
//     const t = setTimeout(async () => {
//       setLiveLoading(true);
//       try {
//         const list = await searchDestinations(q, ctrl.signal);
//         setLiveDest(list);
//         // pick the first match so its rates show straight away
//         setLiveCode((prev) => (prev && list.some((d) => d.code === prev) ? prev : list[0]?.code ?? null));
//       } catch (e) {
//         if ((e as Error)?.name !== "AbortError") {
//           setLiveDest([]);
//           setLiveCode(null);
//         }
//       } finally {
//         if (!ctrl.signal.aborted) setLiveLoading(false);
//       }
//     }, 300);
//     return () => {
//       clearTimeout(t);
//       ctrl.abort();
//     };
//   }, [searchQuery]);
// 
//   useEffect(() => {
//     if (!liveCode) return;
//     const ctrl = new AbortController();
//     const kickoff = setTimeout(() => {
//       setLiveQuoteLoading(true);
//       setLiveQuoteError("");
//     }, 0);
//     getPublicRates(liveCode, undefined, ctrl.signal)
//       .then((q) => setLiveQuote(q))
//       .catch((e) => {
//         if ((e as Error)?.name === "AbortError") return;
//         setLiveQuote(null);
//         setLiveQuoteError("We couldn't load the rates for this destination right now.");
//       })
//       .finally(() => {
//         if (!ctrl.signal.aborted) setLiveQuoteLoading(false);
//       });
//     return () => {
//       clearTimeout(kickoff);
//       ctrl.abort();
//     };
//   }, [liveCode]);
// 
//   const hasLive = searchQuery.trim() !== "" && liveDest.length > 0;
// 
//   // Search filter across countries and zones
//   const searchResults = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) return null;
// 
//     // Search popular list
//     const matchedCountries = POPULAR_COUNTRIES.filter(
//       (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
//     );
// 
//     // Search zone countries
//     const matchedZones = ZONES_DATA.filter(
//       (z) => z.zone.toLowerCase().includes(q) || z.countries.toLowerCase().includes(q)
//     );
// 
//     return {
//       countries: matchedCountries,
//       zones: matchedZones,
//     };
//   }, [searchQuery]);
// 
//   const activeZoneDetails = useMemo(() => {
//     return ZONES_DATA.find((z) => z.zone === selectedZone) || ZONES_DATA[1];
//   }, [selectedZone]);
// 
//   return (
//     <main className="bg-gray-50 font-sans dark:bg-gray-900 pb-16">
//       {/* â”€â”€â”€ Hero â”€â”€â”€ */}
//       <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
//         <div className="max-w-4xl mx-auto">
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
//             <Globe className="w-3.5 h-3.5" />
//             Official Roaming Tariffs &amp; Country Rates
//           </span>
//           <h1 className="font-extrabold text-[clamp(1.8rem,4.5vw,2.75rem)] tracking-tight">
//             Zoiko Roaming Zone Charges &amp; Country Rates
//           </h1>
//           <p className="mt-3 text-sm sm:text-base text-white/90 max-w-2xl mx-auto">
//             Check transparent out-of-bundle roaming costs for calls, texts, and data across all global zones and destinations.
//           </p>
// 
//           {/* Country Search Bar in Hero */}
//           <div className="mt-8 max-w-xl mx-auto relative text-left">
//             <div className="relative">
//               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder="Search any country (e.g. USA, Spain, India, France, UAE)..."
//                 className="w-full bg-white text-gray-900 pl-11 pr-4 py-3.5 rounded-2xl shadow-lg border-0 text-sm focus:ring-2 focus:ring-white placeholder:text-gray-400"
//               />
//               {searchQuery && (
//                 <button
//                   type="button"
//                   onClick={() => setSearchQuery("")}
//                   className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
//                 >
//                   Clear
//                 </button>
//               )}
//             </div>
// 
//             {/* Quick Suggestions */}
//             <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap text-xs text-white/80">
//               <span className="font-medium">Popular:</span>
//               {["Spain", "United States", "France", "India", "Ireland", "TÃ¼rkiye"].map((c) => (
//                 <button
//                   key={c}
//                   type="button"
//                   onClick={() => setSearchQuery(c)}
//                   className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 transition cursor-pointer"
//                 >
//                   {c}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>
// 
//       <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 md:px-8">
//         {/* â”€â”€â”€ Search Results Box (When Query Active) â”€â”€â”€ */}
//         {searchResults && (
//           <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-gray-700">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                 <Globe className="w-5 h-5 text-[#0e8f74]" />
//                 <span>Search Results for &ldquo;{searchQuery}&rdquo;</span>
//               </h2>
//               <span className="text-xs text-gray-500">
//                 {liveLoading
//                   ? "Searchingâ€¦"
//                   : hasLive
//                     ? `Found ${liveDest.length} destination${liveDest.length === 1 ? "" : "s"}`
//                     : `Found ${searchResults.countries.length + searchResults.zones.length} matching entries`}
//               </span>
//             </div>
// 
//             {/* Live rates from the backend */}
//             {hasLive && (
//               <div className="mb-5">
//                 <div className="flex flex-wrap gap-2 mb-3">
//                   {liveDest.slice(0, 12).map((d) => (
//                     <button
//                       key={d.code}
//                       type="button"
//                       onClick={() => setLiveCode(d.code)}
//                       className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
//                         liveCode === d.code
//                           ? "bg-[#0e8f74] text-white"
//                           : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
//                       }`}
//                     >
//                       {d.name}
//                     </button>
//                   ))}
//                 </div>
// 
//                 {liveQuoteLoading && <div className="text-xs text-gray-500">Loading ratesâ€¦</div>}
//                 {liveQuoteError && (
//                   <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{liveQuoteError}</div>
//                 )}
//                 {liveQuote && liveQuote.destination.code === liveCode && !liveQuoteLoading && (
//                   <div className="rounded-xl border border-emerald-100 dark:border-gray-700 p-4">
//                     <div className="text-sm font-bold text-gray-900 dark:text-white">{liveQuote.destination.name}</div>
//                     {liveQuote.message && (
//                       <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{liveQuote.message}</p>
//                     )}
//                     {liveQuote.rates ? (
//                       <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
//                         {RATE_TILE_LABELS.map(({ key, label }) => {
//                           const v = formatRateDisplay(liveQuote.rates ? liveQuote.rates[key] : null);
//                           if (!v) return null;
//                           return (
//                             <div key={key} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
//                               <div className="text-[11px] text-gray-400">{label}</div>
//                               <div className="text-sm font-bold text-[#0e8f74]">{v}</div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     ) : (
//                       <a
//                         href={liveQuote.action?.kind === "contact_support" ? "/contact-us" : "#"}
//                         className="mt-3 inline-block px-4 py-2 rounded-xl bg-[#0D1935] text-white text-xs font-semibold"
//                       >
//                         {liveQuote.action?.label || "Contact support"}
//                       </a>
//                     )}
//                     {(getVatBasisLabel(liveQuote.charging?.vat_basis) ||
//                       liveQuote.commercial_basis?.effective_from) && (
//                       <p className="mt-3 text-[11px] text-gray-500">
//                         {getVatBasisLabel(liveQuote.charging?.vat_basis)}
//                         {liveQuote.commercial_basis?.effective_from
//                           ? ` Â· Effective from ${formatDisplayDate(liveQuote.commercial_basis.effective_from)}`
//                           : ""}
//                       </p>
//                     )}
//                     {liveQuote.warnings?.map((w) => (
//                       <p key={w.code} className="mt-2 text-[11px] text-amber-700">
//                         {w.message}
//                       </p>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
// 
//             {/* Matched Countries Cards */}
//             {!hasLive && searchResults.countries.length > 0 && (
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
//                 {searchResults.countries.map((c) => {
//                   const zData = ZONES_DATA.find((z) => z.zone === c.zone) || ZONES_DATA[1];
//                   return (
//                     <div
//                       key={c.name}
//                       onClick={() => setSelectedZone(c.zone)}
//                       className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 hover:border-[#0e8f74] transition cursor-pointer"
//                     >
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                           <span className="text-xl">{c.flag}</span>
//                           <span className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</span>
//                         </div>
//                         <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0e8f74] border border-emerald-200">
//                           {c.zone}
//                         </span>
//                       </div>
//                       <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-2">
//                         <div>
//                           <div className="text-gray-400">Data</div>
//                           <div className="font-bold text-[#0e8f74]">{zData.dataPriceMb}/MB</div>
//                         </div>
//                         <div>
//                           <div className="text-gray-400">Calls Sent</div>
//                           <div className="font-bold text-gray-800 dark:text-gray-200">{zData.callSent}/min</div>
//                         </div>
//                         <div>
//                           <div className="text-gray-400">Texts Sent</div>
//                           <div className="font-bold text-gray-800 dark:text-gray-200">{zData.textSent}</div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
// 
//             {/* Matched Zones */}
//             {!hasLive && searchResults.zones.length > 0 && (
//               <div className="space-y-2">
//                 <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Matching Zones</div>
//                 {searchResults.zones.map((z) => (
//                   <div key={z.zone} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200">
//                     <span className="font-bold text-[#0e8f74]">{z.zoneName}:</span> {z.countries}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
// 
//         {/* â”€â”€â”€ Interactive Zone Inspector Card â”€â”€â”€ */}
//         <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
//             <div>
//               <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                 <span>Select a Zone to Inspect Countries &amp; Costs</span>
//               </h2>
//               <p className="text-xs text-gray-500 mt-0.5">Click any zone button below to view all included countries and out-of-bundle rates</p>
//             </div>
//             {activeZoneDetails.isEuIncluded && (
//               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
//                 <ShieldCheck className="w-3.5 h-3.5" />
//                 EU Roaming Included with UK Allowance
//               </span>
//             )}
//           </div>
// 
//           {/* Zone Selector Pills */}
//           <div className="flex items-center gap-2 pt-4 pb-4 overflow-x-auto">
//             {ZONES_DATA.map((z) => (
//               <button
//                 key={z.zone}
//                 type="button"
//                 onClick={() => setSelectedZone(z.zone)}
//                 className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
//                   selectedZone === z.zone
//                     ? "bg-[#0e8f74] text-white shadow-sm"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
//                 }`}
//               >
//                 {z.zone}
//               </button>
//             ))}
//           </div>
// 
//           {/* Active Zone Detail Card */}
//           <div className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-emerald-50/20 dark:from-gray-750 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
//             <div className="flex items-start justify-between gap-3 flex-wrap">
//               <div>
//                 <h3 className="text-base font-bold text-gray-900 dark:text-white">{activeZoneDetails.zoneName}</h3>
//                 <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
//                   <span className="font-semibold text-gray-800 dark:text-white">Included Countries: </span>
//                   {activeZoneDetails.countries}
//                 </p>
//               </div>
//             </div>
// 
//             {/* 4 Rate Tiles */}
//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200/80 dark:border-gray-700">
//               <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
//                   <Database className="w-3.5 h-3.5 text-[#ec4faa]" />
//                   <span>Data</span>
//                 </div>
//                 <div className="text-base sm:text-lg font-extrabold text-[#0e8f74] dark:text-[#34d39e]">
//                   {activeZoneDetails.dataPriceMb} <span className="text-xs font-normal text-gray-500">/ MB</span>
//                 </div>
//               </div>
// 
//               <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
//                   <Phone className="w-3.5 h-3.5 text-[#e6007e]" />
//                   <span>Calls Sent</span>
//                 </div>
//                 <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
//                   {activeZoneDetails.callSent} <span className="text-xs font-normal text-gray-500">/ min</span>
//                 </div>
//               </div>
// 
//               <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
//                   <Phone className="w-3.5 h-3.5 text-slate-400" />
//                   <span>Calls Received</span>
//                 </div>
//                 <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
//                   {activeZoneDetails.callReceived} <span className="text-xs font-normal text-gray-500">/ min</span>
//                 </div>
//               </div>
// 
//               <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
//                   <MessageSquare className="w-3.5 h-3.5 text-[#6d5dd3]" />
//                   <span>Text (SMS)</span>
//                 </div>
//                 <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
//                   {activeZoneDetails.textSent} <span className="text-xs font-normal text-gray-500">sent Â· Â£0.00 rec</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
// 
//         {/* â”€â”€â”€ 1. Text Charges Table â”€â”€â”€ */}
//         <section>
//           <div className="mb-4 flex items-center gap-3">
//             <Pill label="TEXT" color="text" />
//             <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">Roaming Zone Charges (Text)</h2>
//           </div>
//           <TableShell>
//             <thead>
//               <tr className="border-b border-gray-100 dark:border-gray-700">
//                 <th className="px-5 py-4 align-top w-2/5">
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Zones</p>
//                   <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Countries included in Zone</p>
//                 </th>
//                 <th className="px-5 py-4 align-top">
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Text Sent</p>
//                   <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">To any destination whilst abroad (Â£)</p>
//                 </th>
//                 <th className="px-5 py-4 align-top">
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Text Received</p>
//                   <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Received whilst abroad (Â£)</p>
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {ZONES_DATA.map((r) => (
//                 <tr key={r.zone} className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-750 transition">
//                   <td className="px-5 py-4 align-top">
//                     <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.zone} Countries</div>
//                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2" title={r.countries}>
//                       {r.countries}
//                     </div>
//                   </td>
//                   <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.textSent}</td>
//                   <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.textReceived} (Free)</td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableShell>
//         </section>
// 
//         {/* â”€â”€â”€ 2. Calls Charges Table â”€â”€â”€ */}
//         <section>
//           <div className="mb-4 flex items-center gap-3">
//             <Pill label="CALLS" color="calls" />
//             <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">Roaming Zones (Calls)</h2>
//           </div>
//           <TableShell>
//             <thead>
//               <tr className="border-b border-gray-100 dark:border-gray-700">
//                 <th className="px-5 py-4 align-top w-2/5">
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Zones &amp; Countries</p>
//                 </th>
//                 <th className="px-5 py-4 align-top">
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Minute (Calls Sent)</p>
//                   <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Sent from visited Zones to any destination (Â£/min)</p>
//                 </th>
//                 <th className="px-5 py-4 align-top">
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Minute (Calls Received)</p>
//                   <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Received whilst abroad (Â£/min)</p>
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {ZONES_DATA.map((r) => (
//                 <tr key={r.zone} className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-750 transition">
//                   <td className="px-5 py-4 align-top">
//                     <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.zone} Countries</div>
//                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2" title={r.countries}>
//                       {r.countries}
//                     </div>
//                   </td>
//                   <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.callSent} / min</td>
//                   <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.callReceived} / min</td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableShell>
//         </section>
// 
//         {/* â”€â”€â”€ 3. Data Charges Table â”€â”€â”€ */}
//         <section>
//           <div className="mb-4 flex items-center gap-3">
//             <Pill label="DATA" color="data" />
//             <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">Zoiko Roaming Zone Charges (Data)</h2>
//           </div>
//           <TableShell>
//             <thead>
//               <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
//                 <th className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200 w-2/5">Zones &amp; Countries</th>
//                 <th className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">Price (Â£)/MB</th>
//                 <th className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">Equivalent per GB</th>
//               </tr>
//             </thead>
//             <tbody>
//               {ZONES_DATA.map((r) => {
//                 const numMb = parseFloat(r.dataPriceMb.replace("Â£", ""));
//                 const approxGb = (numMb * 1024).toFixed(2);
//                 return (
//                   <tr key={r.zone} className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-750 transition">
//                     <td className="px-5 py-4 align-top">
//                       <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.zone} Countries</div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2" title={r.countries}>
//                         {r.countries}
//                       </div>
//                     </td>
//                     <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.dataPriceMb} / MB</td>
//                     <td className="px-5 py-4 text-xs font-semibold text-gray-600 dark:text-gray-300">~Â£{approxGb} / GB</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </TableShell>
//           <p className="mt-4 text-center text-xs italic text-gray-400 dark:text-gray-500">
//             Roaming Data is billed per kilobyte sent to or from Subscribers.
//           </p>
//         </section>
// 
//         {/* â”€â”€â”€ For Pay Monthly Subscribers â”€â”€â”€ */}
//         <section className="overflow-hidden rounded-2xl border-t-4 border-[#17a06a] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
//           <h2 className="text-center text-lg font-bold text-gray-800 dark:text-white">For Pay Monthly Subscribers</h2>
//           <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-300">
//             For monthly recurring data bundles,{" "}
//             <strong className="font-semibold text-gray-700 dark:text-gray-100">Zoiko Mobile does not impose a cap</strong>, and any
//             Out-of-Bundle usage will be charged at the{" "}
//             <strong className="font-semibold text-gray-700 dark:text-gray-100">Data Out-of-Bundle Charge rate</strong>. Subscriptions
//             are charged upfront for the upcoming month. Pro-rata charges apply during the first billing
//             period from the date of bundle activation until the next bill-cycle date.
//           </p>
//         </section>
// 
//         {/* â”€â”€â”€ Voice And Text Bundles â”€â”€â”€ */}
//         <section className="overflow-hidden rounded-2xl border-t-4 border-[#e6007e] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
//           <h2 className="text-center text-lg font-bold text-gray-800 dark:text-white">Voice And Text Bundles</h2>
//           <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-500 dark:text-gray-300">
//             <p>
//               Zoiko Mobile offers{" "}
//               <strong className="font-semibold text-gray-700 dark:text-gray-100">Voice and Text Bundles for National Calls and National Texts</strong>{" "}
//               within the Underlying Mobile Network and while roaming in Zone 1 (to comply with RLAH
//               regulations). These bundles do not cover Calls and SMS while roaming outside the EU, to any
//               International destination, to any Premium or Special numbers or Services, or incoming Calls and
//               Texts.{" "}
//               <strong className="font-semibold text-gray-700 dark:text-gray-100">
//                 Please note that only one Voice and Texts Bundle can be subscribed to per SIM card at a time.
//                 Pro-rata charges are applied during the first billing period from the date of Bundle activation
//                 until the next bill-cycle date. No pro-rata balance is refunded upon Bundle de-activation (the
//                 last month is fully billed).
//               </strong>
//             </p>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }

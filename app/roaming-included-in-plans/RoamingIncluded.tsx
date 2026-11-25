"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  FileText,
  Globe,
  Headphones,
  Layers,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  User,
} from "lucide-react";
import { getToken, isLoggedIn } from "../utils/auth";
import { getLines, type Line } from "../dashboard/add-new-number/addLineApi";
import { openChat } from "../components/ChatbotWidget";
import {
  formatAllowanceMb,
  getLineQuote,
  getPublicRates,
  isLineQuote,
  searchDestinations,
  type Destination,
  type LineQuote,
  type PublicQuote,
} from "../services/roamingApi";

interface PublishedPlanExample {
  id: string;
  name: string;
  symbol: string;
  ukData: string;
  euData: string;
  euMinutesValue: string;
  euMinutesLabel: string;
  euTextsValue: string;
  euTextsLabel: string;
  euCallsTable: string;
  euTextsTable: string;
  euSummary: string;
}

interface DestinationItem {
  code: string;
  name: string;
  dropdownLabel: string;
  flag: string;
  zone: string;
  isEu: boolean;
}

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const PUBLISHED_PLANS: PublishedPlanExample[] = [
  {
    id: "zoiko-max-30gb",
    name: "Zoiko Max 30GB",
    symbol: "▤",
    ukData: "30GB",
    euData: "15GB",
    euMinutesValue: "1,000",
    euMinutesLabel: "minutes included",
    euTextsValue: "1,000",
    euTextsLabel: "texts included",
    euCallsTable: "1,000 minutes",
    euTextsTable: "1,000 texts",
    euSummary: "15GB data, 1,000 minutes and 1,000 texts",
  },
  {
    id: "zoiko-elite-100gb",
    name: "Zoiko Elite 100GB",
    symbol: "❖",
    ukData: "100GB",
    euData: "30GB",
    euMinutesValue: "2,000",
    euMinutesLabel: "minutes included",
    euTextsValue: "2,000",
    euTextsLabel: "texts included",
    euCallsTable: "2,000 minutes",
    euTextsTable: "2,000 texts",
    euSummary: "30GB data, 2,000 minutes and 2,000 texts",
  },
  {
    id: "zoiko-unlimited-data",
    name: "Zoiko Unlimited Data",
    symbol: "∞",
    ukData: "Unlimited",
    euData: "40GB",
    euMinutesValue: "Unlimited",
    euMinutesLabel: "minutes included",
    euTextsValue: "Unlimited",
    euTextsLabel: "texts included",
    euCallsTable: "Unlimited",
    euTextsTable: "Unlimited",
    euSummary: "40GB data, Unlimited minutes and Unlimited texts",
  },
];
*/

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const COMPARISON_ORDER_IDS = [
  "zoiko-unlimited-data",
  "zoiko-elite-100gb",
  "zoiko-max-30gb",
];
*/

const CONTRACT_DURATIONS = ["30-day", "12-month", "24-month"] as const;

// STATIC DATA REMOVED - now loaded from the API. Old hardcoded version kept for reference:
/*
const CURATED_DESTINATIONS: DestinationItem[] = [
  {
    code: "ES",
    name: "Spain",
    dropdownLabel: "Spain (example)",
    flag: "🇪🇸",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "FR",
    name: "France",
    dropdownLabel: "France",
    flag: "🇫🇷",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "IT",
    name: "Italy",
    dropdownLabel: "Italy",
    flag: "🇮🇹",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "PT",
    name: "Portugal",
    dropdownLabel: "Portugal",
    flag: "🇵🇹",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "DE",
    name: "Germany",
    dropdownLabel: "Germany",
    flag: "🇩🇪",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "IE",
    name: "Ireland",
    dropdownLabel: "Ireland",
    flag: "🇮🇪",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "NL",
    name: "Netherlands",
    dropdownLabel: "Netherlands",
    flag: "🇳🇱",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "GR",
    name: "Greece",
    dropdownLabel: "Greece",
    flag: "🇬🇷",
    zone: "EU (Zone 1)",
    isEu: true,
  },
  {
    code: "US",
    name: "United States",
    dropdownLabel: "United States",
    flag: "🇺🇸",
    zone: "Rest of World (Zone 2)",
    isEu: false,
  },
  {
    code: "CA",
    name: "Canada",
    dropdownLabel: "Canada",
    flag: "🇨🇦",
    zone: "Rest of World (Zone 2)",
    isEu: false,
  },
  {
    code: "AU",
    name: "Australia",
    dropdownLabel: "Australia",
    flag: "🇦🇺",
    zone: "Rest of World (Zone 2)",
    isEu: false,
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dropdownLabel: "United Arab Emirates",
    flag: "🇦🇪",
    zone: "Rest of World (Zone 3)",
    isEu: false,
  },
  {
    code: "CH",
    name: "Switzerland",
    dropdownLabel: "Switzerland",
    flag: "🇨🇭",
    zone: "Rest of World (Zone 2)",
    isEu: false,
  },
];
*/

const INCLUDED_GUIDE_CARDS = [
  {
    icon: "🇪🇺",
    title: "Eligible destinations",
    description:
      "Included in selected EU and related destinations (as defined in your plan).",
  },
  {
    icon: "📶",
    title: "Data",
    description:
      "Use your included roaming data allowance (e.g. 15GB, 30GB or 40GB depending on your plan).",
  },
  {
    icon: "📞",
    title: "Calls",
    description:
      "Make calls to the UK and within the visited country from your included minutes.",
  },
  {
    icon: "💬",
    title: "Texts",
    description:
      "Send texts to the UK and within the visited country from your included texts.",
  },
  {
    icon: "🛡️",
    title: "Fair use",
    description:
      "Our fair use policy helps keep roaming for genuine travel and prevents abusive use.",
  },
];

const TRAVELLER_STEPS = [
  {
    step: 1,
    title: "Check destination",
    description: "Confirm your destination is included in your plan.",
  },
  {
    step: 2,
    title: "Know fair use",
    description: "Understand the fair use rules that apply abroad.",
  },
  {
    step: 3,
    title: "Review costs",
    description: "See what happens once your allowance is used.",
  },
  {
    step: 4,
    title: "Turn on roaming",
    description: "Enable data roaming in your device settings before you travel.",
  },
];

const FAQS = [
  {
    q: "What's included in my roaming allowance?",
    a: "Eligible plans include a roaming data allowance, minutes and texts for use in selected EU destinations, subject to fair use rules.",
  },
  {
    q: "What happens after my allowance is used?",
    a: "Once your included roaming data, minutes or texts are used, standard out-of-bundle roaming rates or an active roaming pass apply.",
  },
  {
    q: "Which destinations are included?",
    a: "Selected EU and related destinations are included depending on your specific plan version. Always check your destination in the finder above.",
  },
  {
    q: "Do I need to do anything before I travel?",
    a: "Check your destination and fair use terms, verify your roaming spend limit in MyZoiko, and enable data roaming on your phone when you arrive.",
  },
];

function codeToFlagEmoji(code: string): string {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return "🌍";
  const first = 0x1f1e6 + (clean.charCodeAt(0) - 65);
  const second = 0x1f1e6 + (clean.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}

function isEuZoneName(zoneName?: string | null): boolean {
  const lower = (zoneName || "").toLowerCase();
  return (
    lower.includes("eu") ||
    lower.includes("zone 1") ||
    lower.includes("eea")
  );
}

// Live plans from /api/plans/v1/. The public plans API carries no roaming
// allowance, so these show "Varies" until the customer picks their own line.
function planFromApi(item: Record<string, unknown>): PublishedPlanExample | null {
  const name = (item?.name || item?.title) as string | undefined;
  if (!name || typeof name !== "string") return null;
  const id = `api-${String(item?.slug || item?.id || name).toLowerCase().replace(/\s+/g, "-")}`;
  return {
    id,
    name,
    symbol: "▤",
    ukData: String(item?.data_allowance || "your UK data"),
    euData: "Varies",
    euMinutesValue: "Varies",
    euMinutesLabel: "by plan version",
    euTextsValue: "Varies",
    euTextsLabel: "by plan version",
    euCallsTable: "Varies",
    euTextsTable: "Varies",
    euSummary: "Varies by plan version. Choose your line above (sign in) to see your exact allowance.",
  };
}

const EMPTY_PLAN: PublishedPlanExample = {
  id: "",
  name: "Your plan",
  symbol: "▤",
  ukData: "your UK data",
  euData: "Varies",
  euMinutesValue: "Varies",
  euMinutesLabel: "by plan version",
  euTextsValue: "Varies",
  euTextsLabel: "by plan version",
  euCallsTable: "Varies",
  euTextsTable: "Varies",
  euSummary: "Varies by plan version. Choose your line above (sign in) to see your exact allowance.",
};

const unlimitedOr = (unlimited: boolean, n: number | null) =>
  unlimited ? "Unlimited" : n === null || n === undefined ? "—" : n.toLocaleString("en-GB");

export default function RoamingIncluded() {
  const summarySectionRef = useRef<HTMLElement | null>(null);

  const [destinations, setDestinations] =
    useState<DestinationItem[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ES");
  const [selectedPlanId, setSelectedPlanId] =
    useState<string>("");
  const [contractDuration, setContractDuration] = useState<string>("30-day");
  const [publicQuote, setPublicQuote] = useState<PublicQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([]);
  const [plans, setPlans] = useState<PublishedPlanExample[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineQuote, setLineQuote] = useState<LineQuote | null>(null);

  useEffect(() => {
    setSignedIn(isLoggedIn());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    searchDestinations("", controller.signal)
      .then((apiDestinations: Destination[]) => {
        if (!Array.isArray(apiDestinations) || apiDestinations.length === 0) {
          return;
        }
        const merged = new Map<string, DestinationItem>();

        for (const dest of apiDestinations) {
          const code = (dest.code || "").toUpperCase();
          if (!code) continue;
          merged.set(code, {
            code,
            name: dest.name || code,
            dropdownLabel: dest.name || code,
            flag: codeToFlagEmoji(code),
            zone: dest.rating_zone || "International Roaming",
            isEu: isEuZoneName(dest.rating_zone),
          });
        }

        const sorted = Array.from(merged.values()).sort((a, b) => {
          if (a.code === "ES") return -1;
          if (b.code === "ES") return 1;
          return a.name.localeCompare(b.name);
        });
        setDestinations(sorted);
      })
      .catch(() => {
        // API unreachable: leave the destination list empty
      });

    return () => controller.abort();
  }, []);

  // Default to the first live destination if the initial code isn't in the list
  useEffect(() => {
    if (destinations.length === 0) return;
    if (!destinations.some((d) => d.code === selectedCountryCode)) {
      setSelectedCountryCode(destinations[0].code);
    }
  }, [destinations, selectedCountryCode]);

  // Live plan list
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return;
    const controller = new AbortController();
    fetch(`${baseUrl}/api/plans/v1/`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload?.results || payload?.plans;
        if (!Array.isArray(list)) return;
        // Plans come only from the API. It carries no roaming allowance, so each
        // shows "Varies" until a signed-in customer picks their own line.
        const seen = new Set<string>();
        const live: PublishedPlanExample[] = [];
        for (const item of list) {
          const apiPlan = planFromApi(item);
          if (!apiPlan) continue;
          const key = apiPlan.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          live.push(apiPlan);
        }
        if (live.length > 0) {
          setPlans(live);
          setSelectedPlanId((cur) => (live.some((p) => p.id === cur) ? cur : live[0].id));
        }
      })
      .catch(() => {
        // API unreachable: leave the plan list empty
      });
    return () => controller.abort();
  }, []);

  // Signed-in customers: load their lines and default to the first active one
  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    getLines()
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data?.lines) ? data.lines : [];
        setLines(list);
        const first = list.find((l) => l.status === "active") || list[0];
        if (first) setSelectedLineId(first.id);
      })
      .catch(() => {
        // Not fatal: fall back to published examples
      });
    return () => {
      alive = false;
    };
  }, [signedIn]);

  // Personalised entitlement for the chosen line + destination
  useEffect(() => {
    const token = getToken();
    if (!selectedLineId || !token) return;
    const controller = new AbortController();
    getLineQuote(token, selectedLineId, selectedCountryCode, undefined, controller.signal)
      .then((q) => setLineQuote(q))
      .catch(() => setLineQuote(null));
    return () => controller.abort();
  }, [selectedLineId, selectedCountryCode]);

  const activeLine = useMemo(
    () => lines.find((l) => l.id === selectedLineId) || null,
    [lines, selectedLineId]
  );
  // Ignore a stale quote that belongs to another line/destination
  const activeLineQuote =
    selectedLineId &&
    lineQuote &&
    isLineQuote(lineQuote) &&
    lineQuote.line.id === selectedLineId &&
    lineQuote.destination.code.toUpperCase() === selectedCountryCode.toUpperCase()
      ? lineQuote
      : null;

  const fetchDestinationQuote = async (code: string, signal?: AbortSignal) => {
    setLoadingQuote(true);
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
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchDestinationQuote(selectedCountryCode, controller.signal);
    return () => controller.abort();
  }, [selectedCountryCode]);

  const selectedDestination = useMemo(() => {
    return (
      destinations.find((d) => d.code === selectedCountryCode) || {
        code: selectedCountryCode,
        name: selectedCountryCode,
        dropdownLabel: selectedCountryCode,
        flag: codeToFlagEmoji(selectedCountryCode),
        zone: "International Roaming",
        isEu: false,
      }
    );
  }, [destinations, selectedCountryCode]);

  const selectedPlan = useMemo(() => {
    return (
      plans.find((p) => p.id === selectedPlanId) ||
      plans[0] ||
      EMPTY_PLAN
    );
  }, [plans, selectedPlanId]);

  const comparisonPlans = useMemo(() => {
    return plans.slice(0, 3);
  }, [plans]);

  const isSelectedEu = useMemo(() => {
    if (publicQuote?.destination?.rating_zone) {
      return isEuZoneName(publicQuote.destination.rating_zone);
    }
    return selectedDestination.isEu;
  }, [publicQuote, selectedDestination.isEu]);

  const liveEntitlement =
    activeLineQuote?.status === "READY_PERSONALISED" &&
    activeLineQuote.outcome === "INCLUDED_WITH_LIMIT"
      ? activeLineQuote.entitlement
      : null;

  const summaryMetrics = useMemo(() => {
    if (liveEntitlement) {
      return {
        dataValue: formatAllowanceMb(liveEntitlement.data_mb),
        dataLine1: "data",
        dataLine2: "included",
        minutesValue: unlimitedOr(liveEntitlement.voice_unlimited, liveEntitlement.voice_minutes),
        minutesLine1: "minutes",
        minutesLine2: "included",
        textsValue: unlimitedOr(liveEntitlement.sms_unlimited, liveEntitlement.sms),
        textsLine1: "texts",
        textsLine2: "included",
        badgeText: "✓ Included on your plan",
        badgeIncluded: true,
        benefitHeading: `Your roaming allowance (${selectedDestination.name}):`,
      };
    }
    if (activeLineQuote?.status === "READY_PERSONALISED" && activeLineQuote.outcome === "NOT_SUPPORTED") {
      return {
        dataValue: "—",
        dataLine1: "data",
        dataLine2: "not available",
        minutesValue: "—",
        minutesLine1: "calls",
        minutesLine2: "not available",
        textsValue: "—",
        textsLine1: "texts",
        textsLine2: "not available",
        badgeText: "Not supported here",
        badgeIncluded: false,
        benefitHeading: `Your plan in ${selectedDestination.name}:`,
      };
    }
    if (isSelectedEu && !activeLineQuote) {
      return {
        dataValue: selectedPlan.euData,
        dataLine1: "data",
        dataLine2: "included",
        minutesValue: selectedPlan.euMinutesValue,
        minutesLine1: "minutes",
        minutesLine2: "included",
        textsValue: selectedPlan.euTextsValue,
        textsLine1: "texts",
        textsLine2: "included",
        badgeText: "✓ EU roaming",
        badgeIncluded: true,
        benefitHeading: `EU roaming benefit (${selectedDestination.name} • ${contractDuration} example):`,
      };
    }

    const rates = activeLineQuote?.rates ?? publicQuote?.rates;
    return {
      dataValue: rates?.data?.display || "—",
      dataLine1: "PAYG data",
      dataLine2: "rate",
      minutesValue: rates?.voice_to_uk?.display || "—",
      minutesLine1: "calls",
      minutesLine2: "rate",
      textsValue: rates?.sms?.display || "—",
      textsLine1: "texts",
      textsLine2: "rate",
      badgeText: "Standard PAYG",
      badgeIncluded: false,
      benefitHeading: `Roaming rate notice (${selectedDestination.name} • ${contractDuration} example):`,
    };
  }, [
    contractDuration,
    isSelectedEu,
    publicQuote,
    activeLineQuote,
    liveEntitlement,
    selectedDestination.name,
    selectedPlan,
  ]);

  const handleCheckInclusionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDestinationQuote(selectedCountryCode);
    summarySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  const handleScrollToFinder = () => {
    document
      .getElementById("plan-finder")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const myZoikoHref = signedIn
    ? "/dashboard/roaming-and-travel"
    : "/login?next=/dashboard/roaming-and-travel";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* Section 1: Hero Banner (reuses roaming-and-coverage hero banner image) */}
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

        <div className="relative mx-auto max-w-[1264px] px-4 py-8 sm:px-6 md:py-10">
          <div className="max-w-[748px]">
            <h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white sm:text-[40px]">
              See what roaming is included in your plan.
            </h1>
            <p className="mt-2.5 max-w-[500px] text-[15.5px] font-medium leading-[1.45] text-white/95">
              Understand your data, calls and texts abroad before you travel.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleScrollToFinder}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-white/88 bg-[#c90058] px-[22px] py-2.5 text-[14px] font-bold text-white shadow-[0px_6px_8px_rgba(0,0,0,0.22)] transition hover:bg-[#a90049]"
              >
                <span>Check my plan</span>
                <span aria-hidden="true">›</span>
              </button>
              <Link
                href="/roaming-and-coverage"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-[1.5px] border-white/85 bg-[#053b39]/45 px-[22px] py-2.5 text-[14px] font-bold text-white backdrop-blur-[6px] transition hover:bg-[#053b39]/65"
              >
                <span>Explore roaming rates</span>
                <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-[1264px] space-y-[18px] px-4 py-6 sm:px-6">
        {/* Card 1: Find your roaming allowance */}
        <section
          id="plan-finder"
          className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-5 shadow-[0px_3px_7px_rgba(5,59,57,0.05)] sm:px-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
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
                  Find your roaming allowance
                </h2>
                <p className="mt-0.5 text-[13px] text-[#475569]">
                  Select a destination, plan and contract to see what&apos;s
                  included when you travel.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[13px]">
              <User
                className="h-4 w-4 shrink-0 text-[#c90058]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <p className="text-[#334155]">
                <Link
                  href={myZoikoHref}
                  className="font-bold text-[#c90058] hover:underline"
                >
                  {signedIn ? "View MyZoiko" : "Sign in to MyZoiko"}
                </Link>{" "}
                for your exact plan and usage.
              </p>
            </div>
          </div>

          {signedIn && lines.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-[#fecdd3] bg-[#fff1f5] px-4 py-3">
              <label
                htmlFor="inclusions-line-select"
                className="text-[13px] font-extrabold text-[#0f172a]"
              >
                Show allowance for my line
              </label>
              <select
                id="inclusions-line-select"
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="h-[38px] cursor-pointer rounded-[10px] border-[1.5px] border-[#cbd5e1] bg-white px-3 text-[13px] font-bold text-[#0f172a] outline-none focus:border-[#c90058]"
              >
                <option value="">Use a published example plan</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.msisdn || "Pending number") + (l.plan?.name ? ` · ${l.plan.name}` : "")}
                  </option>
                ))}
              </select>
              <span className="text-[12px] text-[#475569]">
                Live from your account, so it reflects your actual plan and contract.
              </span>
            </div>
          )}

          <form
            onSubmit={handleCheckInclusionsSubmit}
            className="mt-4 grid grid-cols-1 items-end gap-[14px] lg:grid-cols-[1.35fr_1.35fr_1fr_205px]"
          >
            <div>
              <label
                htmlFor="inclusions-country-select"
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
                  {selectedDestination.flag}
                </span>
                <select
                  id="inclusions-country-select"
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="h-full w-full flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-[14px] font-bold text-[#0f172a] outline-none"
                >
                  {destinations.map((dest) => (
                    <option key={dest.code} value={dest.code}>
                      {dest.dropdownLabel}
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
                htmlFor="inclusions-plan-select"
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
                  id="inclusions-plan-select"
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

            <div>
              <label
                htmlFor="inclusions-contract-select"
                className="block text-[13px] font-extrabold text-[#0f172a]"
              >
                Contract duration
              </label>
              <div className="relative mt-1.5 flex h-[46px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-[#cbd5e1] bg-white px-3 focus-within:border-[#c90058]">
                <Calendar
                  className="h-4 w-4 shrink-0 text-[#64748b]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <select
                  id="inclusions-contract-select"
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  className="h-full w-full flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-[14px] font-bold text-[#0f172a] outline-none"
                >
                  {CONTRACT_DURATIONS.map((dur) => (
                    <option key={dur} value={dur}>
                      {dur}
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
              <span>Check inclusions</span>
              <span aria-hidden="true">›</span>
            </button>
          </form>
        </section>

        {/* Card 2: Published Plan Example Summary */}
        <section
          ref={summarySectionRef}
          className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[186px_1.5fr_1fr_1fr]">
            {/* Destination image */}
            <div className="relative min-h-[205px] overflow-hidden rounded-[12px] bg-gradient-to-b from-[#0284c7] via-[#7dd3fc] to-[#fde68a]">
              <img
                src="/images/roaming-and-coverage/destination-spain.png"
                alt={`${selectedDestination.name} roaming destination`}
                className="h-full min-h-[205px] w-full object-cover"
              />
              {selectedDestination.code !== "ES" && (
                <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full bg-[#0f172a]/75 px-3 py-1 text-[11.5px] font-bold text-white backdrop-blur-xs">
                  <span>{selectedDestination.flag}</span>
                  <span className="truncate">{selectedDestination.name}</span>
                </div>
              )}
            </div>

            {/* Plan example + 3 allowance tiles */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full bg-[#c90058] px-3 py-1 text-[11px] font-extrabold text-white">
                  {activeLineQuote ? "Your plan — live from your account" : "Published plan example — verify your tariff"}
                </span>
                <h2 className="mt-2 text-[22px] font-extrabold leading-tight text-[#0f172a]">
                  {activeLineQuote && activeLine?.plan?.name ? activeLine.plan.name : selectedPlan.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-[#334155]">
                  <span aria-hidden="true">
                    {isSelectedEu ? "🇪🇺" : selectedDestination.flag}
                  </span>
                  <span>{summaryMetrics.benefitHeading}</span>
                  {loadingQuote && (
                    <span className="text-[11px] font-semibold text-[#c90058]">
                      Updating...
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px]" aria-hidden="true">
                      📶
                    </span>
                    <div>
                      <p className="text-[16.5px] font-extrabold leading-tight text-[#0f172a]">
                        {summaryMetrics.dataValue}
                      </p>
                      <p className="text-[11px] font-semibold leading-tight text-[#475569]">
                        {summaryMetrics.dataLine1}
                        <br />
                        {summaryMetrics.dataLine2}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-extrabold ${
                      summaryMetrics.badgeIncluded
                        ? "text-[#15803d]"
                        : "text-[#92400e]"
                    }`}
                  >
                    {summaryMetrics.badgeText}
                  </p>
                </div>

                <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px]" aria-hidden="true">
                      📞
                    </span>
                    <div>
                      <p className="text-[16.5px] font-extrabold leading-tight text-[#0f172a]">
                        {summaryMetrics.minutesValue}
                      </p>
                      <p className="text-[11px] font-semibold leading-tight text-[#475569]">
                        {summaryMetrics.minutesLine1}
                        <br />
                        {summaryMetrics.minutesLine2}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-extrabold ${
                      summaryMetrics.badgeIncluded
                        ? "text-[#15803d]"
                        : "text-[#92400e]"
                    }`}
                  >
                    {summaryMetrics.badgeText}
                  </p>
                </div>

                <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[15px]" aria-hidden="true">
                      💬
                    </span>
                    <div>
                      <p className="text-[16.5px] font-extrabold leading-tight text-[#0f172a]">
                        {summaryMetrics.textsValue}
                      </p>
                      <p className="text-[11px] font-semibold leading-tight text-[#475569]">
                        {summaryMetrics.textsLine1}
                        <br />
                        {summaryMetrics.textsLine2}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-extrabold ${
                      summaryMetrics.badgeIncluded
                        ? "text-[#15803d]"
                        : "text-[#92400e]"
                    }`}
                  >
                    {summaryMetrics.badgeText}
                  </p>
                </div>
              </div>
            </div>

            {/* UK vs EU allowance comparison box */}
            <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[17px]">
                  🇬🇧
                </div>
                <div>
                  <h3 className="text-[13.5px] font-extrabold text-[#0f172a]">
                    UK allowance
                  </h3>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#475569]">
                    {activeLine?.plan?.data_allowance
                      ? `Your plan's UK allowance (${activeLine.plan.data_allowance} in the UK)`
                      : <>Your plan&apos;s UK allowance (e.g. {selectedPlan.ukData} in the UK)</>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[17px]">
                  🇪🇺
                </div>
                <div>
                  <h3 className="text-[13.5px] font-extrabold text-[#0f172a]">
                    Roaming allowance (EU)
                  </h3>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#475569]">
                    {liveEntitlement
                      ? [liveEntitlement.fair_use_terms, activeLineQuote?.message]
                          .filter(Boolean)
                          .join(" ") ||
                        `${formatAllowanceMb(liveEntitlement.data_mb)} data, ${summaryMetrics.minutesValue} minutes and ${summaryMetrics.textsValue} texts`
                      : activeLineQuote?.message || selectedPlan.euSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* What happens after my allowance? */}
            <div className="flex flex-col justify-between rounded-[14px] border border-[#fecdd3] bg-[#fff1f5] px-4 py-3.5">
              <div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border-2 border-[#c90058] text-[15px] font-extrabold text-[#c90058]">
                    i
                  </span>
                  <h3 className="text-[14.5px] font-extrabold leading-tight text-[#0f172a]">
                    What happens after my allowance?
                  </h3>
                </div>
                <p className="mt-2.5 text-[12px] leading-[1.4] text-[#334155]">
                  Once your included roaming allowance is used, standard{" "}
                  <strong className="font-bold">roaming rates</strong> (overage)
                  apply for additional data, calls and texts.
                </p>
              </div>
              <Link
                href={`/roaming-and-coverage?country=${selectedDestination.code}`}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-extrabold text-[#c90058] hover:underline"
              >
                <span>See roaming rates</span>
                <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>

          {/* Bottom notice bar */}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-[10px] border border-[#fecdd3] bg-[#fff1f5] px-3.5 py-2 text-center">
            <span className="text-[12px] font-extrabold text-[#c90058]" aria-hidden="true">
              ⓘ
            </span>
            <p className="text-[12px] text-[#0f172a]">
              Published example, subject to plan and destination verification.
              Your actual entitlement depends on your plan version and contract.
            </p>
          </div>
        </section>

        {/* Card 3: Compare published EU roaming inclusions */}
        <section className="rounded-[16px] border border-[#e2e8f0] bg-white px-[22px] py-5 shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
              <Layers
                className="h-5 w-5 text-[#c90058]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[21px]">
                Compare published EU roaming inclusions
              </h2>
              <p className="text-[13px] text-[#475569]">
                A quick comparison of EU roaming allowances from selected Zoiko
                plans.
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_235px]">
            <div>
              <div className="overflow-x-auto rounded-[12px] border border-[#e2e8f0]">
                <table className="w-full min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      <th className="px-3.5 py-2.5 text-[12.5px] font-extrabold text-[#0f172a]">
                        Zoiko plan (published example)
                      </th>
                      <th className="px-3.5 py-2.5 text-[12.5px] font-extrabold text-[#0f172a]">
                        EU roaming data
                      </th>
                      <th className="px-3.5 py-2.5 text-[12.5px] font-extrabold text-[#0f172a]">
                        EU roaming calls
                      </th>
                      <th className="px-3.5 py-2.5 text-[12.5px] font-extrabold text-[#0f172a]">
                        EU roaming texts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonPlans.map((plan, idx) => {
                      const isActive = selectedPlanId === plan.id;
                      const isLast = idx === comparisonPlans.length - 1;
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`cursor-pointer transition ${
                            !isLast ? "border-b border-[#e2e8f0]" : ""
                          } ${
                            isActive
                              ? "bg-[#f0fdf4]"
                              : "bg-white hover:bg-[#f8fafc]"
                          }`}
                        >
                          <td className="px-3.5 py-3 text-[13.5px] font-extrabold text-[#c90058]">
                            <span className="inline-flex items-center gap-2.5">
                              <span aria-hidden="true">{plan.symbol}</span>
                              <span>{plan.name}</span>
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-[13.5px] font-bold text-[#0f172a]">
                            <span className="mr-1.5 font-extrabold text-[#16a34a]">
                              ✓
                            </span>
                            {plan.euData}
                          </td>
                          <td className="px-3.5 py-3 text-[13.5px] font-bold text-[#0f172a]">
                            <span className="mr-1.5 font-extrabold text-[#16a34a]">
                              ✓
                            </span>
                            {plan.euCallsTable}
                          </td>
                          <td className="px-3.5 py-3 text-[13.5px] font-bold text-[#0f172a]">
                            <div className="flex items-center justify-between">
                              <span>
                                <span className="mr-1.5 font-extrabold text-[#16a34a]">
                                  ✓
                                </span>
                                {plan.euTextsTable}
                              </span>
                              <span
                                className="font-bold text-[#c90058]"
                                aria-hidden="true"
                              >
                                ›
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-2 rounded-[10px] border border-[#fecdd3] bg-[#fff1f5] px-3.5 py-2 text-center">
                <span className="text-[12px] font-extrabold text-[#c90058]" aria-hidden="true">
                  ⓘ
                </span>
                <p className="text-[12px] text-[#0f172a]">
                  Examples from published plans; actual entitlements depend on
                  plan version and contract.
                </p>
              </div>
            </div>

            {/* Sidebar: Other plans */}
            <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                  <FileText
                    className="h-[18px] w-[18px] text-[#c90058]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-[#0f172a]">
                    Other plans
                  </h3>
                  <p className="mt-1 text-[12px] leading-[1.38] text-[#475569]">
                    See roaming inclusions for all Zoiko plans, including
                    SIM-only and business plans.
                  </p>
                </div>
              </div>

              <Link
                href="/plans"
                className="mt-4 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#c90058] bg-white px-4 text-[13px] font-extrabold text-[#c90058] transition hover:bg-[#fff1f5]"
              >
                <span>View all plans</span>
                <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Card 4: What's included, and where? */}
        <section className="rounded-[16px] border border-[#e2e8f0] bg-white px-[22px] py-5 shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
              <MapPin
                className="h-5 w-5 text-[#c90058]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[21px]">
                What&apos;s included, and where?
              </h2>
              <p className="text-[13px] text-[#475569]">
                A simple guide to what your roaming allowance covers.
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {INCLUDED_GUIDE_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[16px] leading-none" aria-hidden="true">
                    {card.icon}
                  </span>
                  <h3 className="text-[13px] font-extrabold text-[#0f172a]">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-[1.38] text-[#475569]">
                  {card.description}
                </p>
              </article>
            ))}

            <aside className="flex flex-col justify-center rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] p-3.5 lg:col-span-1">
              <div className="flex items-start gap-2">
                <span
                  className="text-[16px] font-extrabold leading-tight text-[#1d4ed8]"
                  aria-hidden="true"
                >
                  ⓘ
                </span>
                <h3 className="text-[12.5px] font-extrabold leading-[1.3] text-[#0f172a]">
                  EU does not automatically mean every European territory is
                  included.
                </h3>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-[1.35] text-[#334155]">
                Check your plan&apos;s roaming destination list for full
                details.
              </p>
            </aside>
          </div>
        </section>

        {/* Row 5: Traveller checklist + More roaming help */}
        <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-[2.33fr_1fr]">
          {/* Traveller checklist */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                <Briefcase
                  className="h-5 w-5 text-[#c90058]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-[20px] font-extrabold leading-tight text-[#0f172a] sm:text-[21px]">
                  Traveller checklist
                </h2>
                <p className="text-[13px] text-[#475569]">
                  Get set for your trip with these quick steps.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TRAVELLER_STEPS.map((item) => (
                <div key={item.step} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#c90058] text-[12px] font-extrabold text-white">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-extrabold text-[#0f172a]">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] leading-[1.35] text-[#475569]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* More roaming help */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                <Link2
                  className="h-[18px] w-[18px] text-[#c90058]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <h2 className="text-[18px] font-extrabold text-[#0f172a]">
                More roaming help
              </h2>
            </div>

            <div className="mt-3 space-y-2">
              {[
                {
                  label: "Roaming & Overage Rates",
                  href: "/roaming-and-coverage",
                },
                {
                  label: "International Calling",
                  href: "/international-calling",
                },
                { label: "Roaming Help", href: "/support" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[13px] font-bold text-[#0f172a] transition hover:border-[#fecdd3] hover:bg-[#fff1f5]/50"
                >
                  <span>{link.label}</span>
                  <span
                    className="text-[14px] font-extrabold text-[#c90058]"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Row 6: Frequently asked questions + Need more help? */}
        <section className={`grid grid-cols-1 gap-[18px] ${FAQS.length > 0 ? "lg:grid-cols-[2.08fr_1fr]" : ""}`}>
          {/* Frequently asked questions */}
          {FAQS.length > 0 && (
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5] text-[16px] font-bold text-[#c90058]">
                  ?
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                    Frequently asked questions
                  </h2>
                  <p className="text-[13px] text-[#475569]">
                    Quick answers to common roaming questions.
                  </p>
                </div>
              </div>
              <Link
                href="/faqs"
                className="text-[12.5px] font-extrabold text-[#c90058] hover:underline"
              >
                View all FAQs ›
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndices.includes(idx);
                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left"
                    >
                      <span className="text-[12.5px] font-bold text-[#0f172a]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#c90058] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#e2e8f0] bg-white px-3 pt-2 pb-2.5">
                        <p className="text-[12px] leading-[1.4] text-[#334155]">
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

          {/* Need more help? */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff1f5]">
                <Headphones
                  className="h-[19px] w-[19px] text-[#c90058]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold leading-tight text-[#0f172a]">
                  Need more help?
                </h2>
                <p className="text-[13px] text-[#475569]">
                  Our UK-based support team is here for you.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => openChat()}
                className="flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#c90058] px-3 text-[13px] font-bold text-white transition hover:bg-[#a90049]"
              >
                <MessageSquare
                  className="h-4 w-4 shrink-0 text-white"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>Chat with Zovie ›</span>
              </button>
              <Link
                href="/contact-us"
                className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#c90058] bg-white px-3 text-[13px] font-extrabold text-[#c90058] transition hover:bg-[#fff1f5]"
              >
                <Phone
                  className="h-4 w-4 shrink-0 text-[#c90058]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>Contact support ›</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

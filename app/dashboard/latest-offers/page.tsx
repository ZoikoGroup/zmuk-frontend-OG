"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getLines } from "../add-new-number/addLineApi";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import beQuick from "../../utils/dasdbeQuickApi";
import {
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Tag,
  CheckCircle2,
  Star,
  Info,
  Search,
  Check,
  Database,
  Gift,
  Sparkles,
  Crown,
  Mail,
  Smartphone,
  X,
  XCircle,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { recordBoosterPurchase } from "../../utils/dashboardSync";
import {
  getMyStatus as getPsStatus,
  getPlans as getPsPlans,
  getToken as getVerifyToken,
} from "../../civilservants/publicSectorApi";
import type { PlansResponse as PsPlansResponse, MyStatus as PsMyStatus } from "../../civilservants/publicSectorApi";
import { getStudentStatus, getStudentPlans } from "../../student-deals/studentApi";
import type { StudentPlansResponse, StudentMyStatus } from "../../student-deals/studentApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface LineOption {
  id: string;
  number: string;
  planName: string;
  dataAllowance: string;
  price: number;
  renewDate: string;
}

type OfferCategory =
  | "Plan upgrades"
  | "Add-ons & data"
  | "Roaming & travel"
  | "Refer & earn"
  | "Account exclusives"
  | "Verified discounts";

interface OfferItem {
  id: string;
  title: string;
  subtitle: string;
  category: OfferCategory;
  badgeText?: string;
  badgeIcon?: "clock" | "star";
  bannerGradient: string;
  bannerGraphic: "unlimited" | "10gb" | "gift" | "roaming" | "5gb" | "refer";
  bullets: string[];
  priceMain: string;
  priceSub?: string;
  priceStrike?: string;
  priceAfter?: string;
  termsText: string;
  termsBoldEnd?: string;
  reasonText: string;
  endsText?: string;
  daysLeft?: number;
  numericPrice: number;
  recommendedRank: number;
  backendPlan?: any;
  /** Verified-discount offers send the customer to the page where the plans are bought. */
  href?: string;
  ctaLabel?: string;
}

type DiscountablePlan = {
  price: string;
  price_24: string | null;
  price_12: string | null;
  price_30: string | null;
  discounted_prices?: {
    price_24: string | null;
    price_12: string | null;
    price_30: string | null;
    price: string | null;
  } | null;
};

/** Lowest discounted monthly price across all terms, with the normal price of the same plan and term. */
function lowestDiscounted(plans: DiscountablePlan[]): { price: number; normal: number } | null {
  let best: { price: number; normal: number } | null = null;
  for (const p of plans) {
    const d = p.discounted_prices;
    if (!d) continue;
    for (const f of ["price_24", "price_12", "price_30"] as const) {
      const price = Number(d[f]);
      if (d[f] == null || !Number.isFinite(price)) continue;
      if (!best || price < best.price) best = { price, normal: Number(p[f] ?? p.price) };
    }
  }
  return best;
}

// Only offers the backend can honour are shown. The older demo offers (boosters, account exclusives,
// plan-upgrade cards and the plan comparison) stay in the code but are hidden until the backend delivers them.
const SHOW_DEMO_OFFERS = false;

// Limited-time offers come from the backend offers list. Change this path if the backend uses another URL.
const OFFERS_API_PATH = "/api/v1/offers/";

type PromoOffer = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  bullets: string[];
  termsText: string;
  discountLabel: string;
  couponCode: string;
  startsAt: Date | null;
  endsAt: Date | null;
  /** serverTime - browser time, so the card appears and disappears on the server's clock */
  clockOffsetMs: number;
  combinable: boolean;
  ctaLabel: string;
  ctaHref: string;
  priority: number;
  /** "coupon" has a code and a discount; "info" is text only */
  mechanism: "coupon" | "info";
};

function normalisePromos(body: any): PromoOffer[] {
  const list: any[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.data?.results)
        ? body.data.results
        : Array.isArray(body?.offers)
          ? body.offers
          : Array.isArray(body?.results)
            ? body.results
            : [];
  const topServerTime = body?.server_time || body?.data?.server_time || null;
  const toDate = (v: any) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  return list
    .filter((o) => o && typeof o === "object")
    .map((o, i) => {
      const server = toDate(o.server_time || topServerTime);
      const type = String(o.discount_type || "").toLowerCase();
      const val = Number(o.discount_value);
      const discountLabel =
        Number.isFinite(val) && val > 0
          ? type === "flat" || type === "fixed"
            ? `£${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)} off`
            : `${val % 1 === 0 ? val.toFixed(0) : val}% off`
          : "";
      return {
        id: String(o.id ?? o.slug ?? i),
        title: String(o.title || o.name || "Offer"),
        subtitle: String(o.subtitle || o.description || ""),
        badge: String(o.badge || o.badge_text || "Limited time"),
        bullets: Array.isArray(o.bullets) ? o.bullets.map((b: any) => String(b)).filter(Boolean) : [],
        termsText: String(o.terms_text || o.terms || ""),
        discountLabel,
        couponCode: String(o.coupon_code || o.code || ""),
        startsAt: toDate(o.starts_at || o.valid_from),
        endsAt: toDate(o.ends_at || o.valid_till),
        clockOffsetMs: server ? server.getTime() - Date.now() : 0,
        combinable: o.combinable === true,
        ctaLabel: String(o.cta_label || ""),
        ctaHref: String(o.cta_href || ""),
        priority: Number.isFinite(Number(o.priority)) ? Number(o.priority) : 100 + i,
        mechanism: o.mechanism === "info" ? "info" : "coupon",
      } as PromoOffer;
    });
}

/** "9 days left", "5 h 20 min left", "Ended" */
function promoTimeLeft(endsAt: Date | null, nowMs: number): string {
  if (!endsAt) return "";
  const diff = endsAt.getTime() - nowMs;
  if (diff <= 0) return "Ended";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;
  const hours = Math.floor(mins / 60);
  return `${hours} h ${mins % 60} min left`;
}

export default function LatestOffersPage() {
  const router = useRouter();

  // Sidebar & top nav state
  const [activeTab, setActiveTab] = useState("offers");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");

  // User & lines state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("Customer");

  const getFormattedFreshness = useCallback(() => {
    const now = new Date();
    const tz = now.getTimezoneOffset() === 0 ? "GMT" : "BST";
    return `${now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })} ${tz}, ${now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;
  }, []);

  const [freshnessTime, setFreshnessTime] = useState<string>("Checking...");

  const [lines, setLines] = useState<LineOption[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const [djangoPlans, setDjangoPlans] = useState<any[]>([]);

  // Limited-time offers from the backend (null = still loading)
  const [promos, setPromos] = useState<PromoOffer[] | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const loadPromos = useCallback(async () => {
    try {
      const tk = getVerifyToken();
      const res = await fetch(`${API_BASE}${OFFERS_API_PATH}`, {
        headers: tk ? { Authorization: `Token ${tk}` } : {},
      });
      if (!res.ok) {
        setPromos([]);
        return;
      }
      const body = await res.json().catch(() => null);
      setPromos(normalisePromos(body));
    } catch {
      setPromos([]);
    }
  }, []);
  useEffect(() => {
    loadPromos();
  }, [loadPromos]);
  // Refetch when the customer comes back to this tab, so new offers appear
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadPromos();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadPromos]);

  // Verification state (public sector 30%, students 20%) drives the "Verified discounts" offers.
  const [verified, setVerified] = useState<{
    loggedIn: boolean;
    ps: { me: PsMyStatus | null; plans: PsPlansResponse | null };
    student: { me: StudentMyStatus | null; plans: StudentPlansResponse | null };
  } | null>(null);

  const loadVerified = useCallback(async () => {
    const loggedIn = !!getVerifyToken();
    const [psMe, psPlans, stMe, stPlans] = await Promise.all([
      loggedIn ? getPsStatus().catch(() => null) : Promise.resolve(null),
      getPsPlans().catch(() => null),
      loggedIn ? getStudentStatus().catch(() => null) : Promise.resolve(null),
      getStudentPlans().catch(() => null),
    ]);
    setVerified({ loggedIn, ps: { me: psMe, plans: psPlans }, student: { me: stMe, plans: stPlans } });
  }, []);
  useEffect(() => {
    loadVerified();
  }, [loadVerified]);

  // Hero carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Filter, search & sort state
  const [activeCategory, setActiveCategory] = useState<string>("All offers");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "Recommended" | "Price: Low to high" | "Ending soonest"
  >("Recommended");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);

  // Offer choices & exclusives state
  const [personalisedOrder, setPersonalisedOrder] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [claimedExclusives, setClaimedExclusives] = useState<string[]>([]);

  // Detail & action modals
  const [selectedOfferModal, setSelectedOfferModal] = useState<OfferItem | null>(
    null
  );
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, _type?: "success" | "error" | "info") => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const computeRenewalDate = (rawDate?: string | Date): string => {
    const now = new Date();
    let cycleDay = 28;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        cycleDay = d.getDate();
      }
    }
    const renewal = new Date(now.getFullYear(), now.getMonth(), cycleDay);
    if (now.getDate() >= cycleDay) {
      renewal.setMonth(renewal.getMonth() + 1);
    }
    return renewal.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const formatMsisdn = (raw: string) => {
    const cleaned = String(raw || "").replace(/\D/g, "");
    if (!cleaned) return "Pending activation";
    const local = cleaned.startsWith("44") ? "0" + cleaned.slice(2) : cleaned;
    if (local.length === 11) {
      return `${local.slice(0, 5)} ${local.slice(5)}`;
    }
    return local;
  };

  const fetchOffersData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("zoiko_token")
          : null;
      const userStr =
        typeof window !== "undefined"
          ? localStorage.getItem("zoiko_user")
          : null;

      let parsedUser: any = {};
      if (userStr) {
        try {
          parsedUser = JSON.parse(userStr);
        } catch {
          parsedUser = {};
        }
      }

      const email = parsedUser?.email || "";
      const name =
        parsedUser?.name ||
        [parsedUser?.first_name, parsedUser?.last_name]
          .filter(Boolean)
          .join(" ") ||
        (email ? email.split("@")[0] : "Customer");

      setUserName(name);

      // Load saved preferences from localStorage
      if (typeof window !== "undefined") {
        const savedPers = localStorage.getItem("zmuk_offers_personalised");
        if (savedPers !== null) setPersonalisedOrder(savedPers === "true");
        const savedMkt = localStorage.getItem("zmuk_offers_marketing");
        if (savedMkt !== null) setMarketingOptIn(savedMkt === "true");
        const savedClaims = localStorage.getItem("zmuk_claimed_exclusives");
        if (savedClaims) {
          try {
            setClaimedExclusives(JSON.parse(savedClaims));
          } catch {}
        }
      }

      // 1. Fetch plans catalogue from Django backend
      try {
        const plansRes = await fetch(`${API_BASE}/api/plans/v1/`);
        if (plansRes.ok) {
          const plansJson = await plansRes.json();
          const fetchedPlans = Array.isArray(plansJson)
            ? plansJson
            : plansJson?.results || plansJson?.data || [];
          setDjangoPlans(fetchedPlans);
        }
      } catch {
        // Non-fatal
      }

      // 2. The customer's real lines (Django lines API). Only active lines with a number count.
      const discoveredLines: LineOption[] = [];
      if (token) {
        try {
          const lr = await getLines();
          (lr?.lines || []).forEach((l, idx) => {
            if (l.status !== "active" || !l.msisdn) return;
            discoveredLines.push({
              id: String(l.id || idx + 1),
              number: formatMsisdn(l.msisdn),
              planName: l.plan?.name || "Your plan",
              dataAllowance: l.plan?.data_allowance || "",
              price: Number(l.plan?.price) || 0,
              renewDate: computeRenewalDate(l.activated_at || l.created_at),
            });
          });
        } catch {
          // no lines found
        }
      }

      setLines(discoveredLines);
      setSelectedLineId((prev) => prev || discoveredLines[0]?.id || "");
      setFreshnessTime(getFormattedFreshness());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getFormattedFreshness]);

  useEffect(() => {
    fetchOffersData(false);
  }, [fetchOffersData]);

  const currentLine: LineOption = useMemo(() => {
    return (
      lines.find((l) => l.id === selectedLineId) ||
      lines[0] || {
        id: "",
        number: "No active SIM",
        planName: "Add a number to get offers for it",
        dataAllowance: "",
        price: 0,
        renewDate: computeRenewalDate(),
      }
    );
  }, [lines, selectedLineId]);

  const hasActiveLine = useMemo(() => {
    return Boolean(
      lines.length > 0 &&
      currentLine.id &&
      currentLine.number !== "Pending activation"
    );
  }, [lines, currentLine]);

  // Compute dynamic promotional schedule dates & catalogue version
  const schedule = useMemo(() => {
    const now = new Date();
    const tz = now.getTimezoneOffset() === 0 ? "GMT" : "BST";

    // End of current calendar month at 23:59
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    const daysLeftPromo = Math.max(
      1,
      Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const promoEndFormatted = `Ends 23:59 ${tz}, ${monthEnd.toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    )}`;

    // Booster ends in 7 days
    const boosterEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    boosterEnd.setHours(23, 59, 59);
    const daysLeftBooster = Math.max(
      1,
      Math.ceil((boosterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const boosterEndFormatted = `Ends 23:59 ${tz}, ${boosterEnd.toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    )}`;

    // Exclusive reward ends in 30 days
    const exclusiveEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    exclusiveEnd.setHours(23, 59, 59);
    const daysLeftExclusive = Math.max(
      1,
      Math.ceil(
        (exclusiveEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const exclusiveEndFormatted = `Ends 23:59 ${tz}, ${exclusiveEnd.toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    )}`;

    // Standard pricing starts 3 months after next renewal
    const standardPriceDate = new Date(now);
    standardPriceDate.setMonth(standardPriceDate.getMonth() + 3);
    const standardPriceFormatted = standardPriceDate.toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );

    const catalogueCode = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    return {
      now,
      tz,
      promoEndFormatted,
      daysLeftPromo,
      boosterEndFormatted,
      daysLeftBooster,
      exclusiveEndFormatted,
      daysLeftExclusive,
      standardPriceFormatted,
      catalogueCode,
    };
  }, []);

  // Identify the matching unlimited plan from backend API (/api/plans/v1/), fallback gracefully
  const backendUnlimitedPlan = useMemo(() => {
    if (!djangoPlans || djangoPlans.length === 0) return null;
    return (
      djangoPlans.find((p) =>
        String(p?.slug || "").toLowerCase().includes("unlimited") ||
        String(p?.name || "").toLowerCase().includes("unlimited")
      ) || djangoPlans[0]
    );
  }, [djangoPlans]);

  // Dynamic upgrade details linked directly to backend API
  const activePlanToUpgrade = selectedUpgradePlan || backendUnlimitedPlan;

  const upgradeTitle = backendUnlimitedPlan?.name || "Zoiko Unlimited";
  const upgradePromoPrice = backendUnlimitedPlan
    ? parseFloat(
        backendUnlimitedPlan.sale_price ||
          backendUnlimitedPlan.final_price ||
          backendUnlimitedPlan.price ||
          "19.99"
      )
    : 19.99;
  const upgradeRegularPrice = backendUnlimitedPlan
    ? parseFloat(backendUnlimitedPlan.price || "24.99")
    : 24.99;
  const upgradeAllowance =
    backendUnlimitedPlan?.data_allowance || "Unlimited (fair use)";
  const upgradeBullets = useMemo(() => {
    if (
      backendUnlimitedPlan?.features &&
      Array.isArray(backendUnlimitedPlan.features) &&
      backendUnlimitedPlan.features.length > 0
    ) {
      return backendUnlimitedPlan.features
        .map((f: any) =>
          typeof f === "string" ? f : f?.title || String(f?.name || f)
        )
        .filter(Boolean);
    }
    return [
      "Unlimited data (fair use)",
      "Unlimited UK calls and texts",
      "EU roaming included",
    ];
  }, [backendUnlimitedPlan]);

  const modalPlanTitle = activePlanToUpgrade?.name || upgradeTitle;
  const modalPlanPromoPrice = activePlanToUpgrade
    ? parseFloat(
        activePlanToUpgrade.sale_price ||
          activePlanToUpgrade.final_price ||
          activePlanToUpgrade.price ||
          "19.99"
      )
    : upgradePromoPrice;
  const modalPlanRegularPrice = activePlanToUpgrade
    ? parseFloat(activePlanToUpgrade.price || "24.99")
    : upgradeRegularPrice;
  const modalPlanAllowance =
    activePlanToUpgrade?.data_allowance || upgradeAllowance;

  // Offers driven by the customer's verification status. Everything comes from the API.
  const verifiedOffers: OfferItem[] = useMemo(() => {
    if (!verified) return [];
    const make = (
      kind: "ps" | "student",
      status: string,
      plansResp: { discount_applies: boolean; discount_percent: string; plans: DiscountablePlan[] } | null,
      validUntil: string | null | undefined
    ): OfferItem | null => {
      const plansList = plansResp?.plans ?? [];
      const pctNum = Math.round(Number(plansResp?.discount_percent)) || 0;
      const pct = pctNum > 0 ? `${pctNum}%` : "Discount";
      const who = kind === "ps" ? "public sector workers" : "students";
      const href = kind === "ps" ? "/civilservants" : "/student-deals";
      const applies = !!plansResp?.discount_applies;
      const best = applies ? lowestDiscounted(plansList) : null;
      const until = validUntil
        ? new Date(validUntil).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;
      const count = plansList.length;
      const planText = count > 0 ? `${count} selected plan${count === 1 ? "" : "s"}` : "selected plans";

      const base = {
        id: `verified-${kind}`,
        category: "Verified discounts" as OfferCategory,
        bannerGradient:
          kind === "ps" ? "from-[#0B4D2F] via-[#0F6B41] to-[#168A55]" : "from-[#1B1738] via-[#271E4A] to-[#34235C]",
        bannerGraphic: "gift" as const,
        href,
      };

      if (applies) {
        return {
          ...base,
          title: `${pct} off for verified ${who}`,
          subtitle: "Applied automatically at checkout",
          badgeText: "Verified",
          badgeIcon: "star" as const,
          bullets: [
            `${pct} off ${planText}`,
            "Pick your contract length on the plans page",
            until ? `Verified until ${until}` : "Stays on while you're verified",
          ],
          priceMain: best ? `£${best.price.toFixed(2)}` : `${pct} off`,
          priceSub: best ? "a month, from" : undefined,
          priceStrike: best ? `Usually £${best.normal.toFixed(2)}` : undefined,
          termsText: "Added at checkout, from any page. Coupons can't be used together with this discount.",
          reasonText: `You're a verified ${kind === "ps" ? "public sector worker" : "student"}`,
          numericPrice: best?.price ?? 0,
          recommendedRank: 0,
          ctaLabel: "Choose your plan",
        };
      }

      const pending = status === "pending";
      return {
        ...base,
        title: pending
          ? `Your ${kind === "ps" ? "public sector" : "student"} check is in progress`
          : `${pct} off for ${who}`,
        subtitle: pending ? "We'll email you once it's reviewed" : "Verify once to see your price",
        badgeText: pending ? "In progress" : undefined,
        bullets: [
          `${pct} off ${planText}`,
          pending ? "Normal prices apply until you're approved" : "You can buy at the normal price any time",
          status === "expired"
            ? "Your verification has ended. Verify again to keep student prices."
            : status === "rejected"
              ? "Your last application wasn't approved. You can apply again."
              : "Verification is done securely in your account",
        ],
        priceMain: `${pct} off`,
        priceSub: "once verified",
        termsText: pending
          ? "Verification is being reviewed."
          : "The discount is applied at checkout after you're approved.",
        reasonText: !verified.loggedIn ? "Log in to check your eligibility" : "Based on your verification status",
        numericPrice: 0,
        recommendedRank: 8,
        ctaLabel: pending ? "View plans" : "Check eligibility",
      };
    };

    const ps = make("ps", verified.ps.me?.status ?? verified.ps.plans?.status ?? "none", verified.ps.plans, null);
    const st = make(
      "student",
      verified.student.me?.status ?? verified.student.plans?.status ?? "none",
      verified.student.plans,
      verified.student.me?.application?.valid_until
    );
    return [ps, st].filter((o): o is OfferItem => !!o);
  }, [verified]);

  // Build dynamic offers tailored to the selected line
  const legacyOffers: OfferItem[] = useMemo(() => {
    return [
      ...verifiedOffers,
      {
        id: "zoiko-unlimited",
        title: upgradeTitle,
        subtitle: `£${Math.max(
          1,
          Math.round(upgradeRegularPrice - upgradePromoPrice)
        )} off a month for 3 months`,
        category: "Plan upgrades",
        badgeText: "Limited time",
        badgeIcon: "clock",
        bannerGradient: "from-[#D91B5C] via-[#B4144B] to-[#820E36]",
        bannerGraphic: "unlimited",
        bullets: upgradeBullets,
        priceMain: `£${upgradePromoPrice.toFixed(2)}`,
        priceSub: "a month for 3 months",
        priceAfter: `then £${upgradeRegularPrice.toFixed(2)} a month`,
        termsText: `Monthly rolling. Starts at your renewal on ${currentLine.renewDate}. From ${schedule.standardPriceFormatted} you pay £${upgradeRegularPrice.toFixed(2)} a month.`,
        termsBoldEnd: `${schedule.promoEndFormatted}.`,
        reasonText: `Based on your ${currentLine.planName}`,
        endsText: schedule.promoEndFormatted,
        daysLeft: schedule.daysLeftPromo,
        numericPrice: upgradePromoPrice,
        recommendedRank: 1,
        backendPlan: backendUnlimitedPlan,
      },
      {
        id: "booster-10gb",
        title: "10 GB data booster",
        subtitle: "£2 off for a short time",
        category: "Add-ons & data",
        badgeText: "Ends soon",
        badgeIcon: "clock",
        bannerGradient: "from-[#111936] via-[#182952] to-[#1D3566]",
        bannerGraphic: "10gb",
        bullets: [
          "10 GB UK data",
          "Used before your plan data",
          "One per number",
        ],
        priceMain: "£6.00",
        priceSub: "one-off",
        priceStrike: "Usually £8.00",
        termsText: `Ends when your allowance renews on ${currentLine.renewDate}. No renewal.`,
        termsBoldEnd: `${schedule.boosterEndFormatted}.`,
        reasonText: "Ends soonest",
        endsText: schedule.boosterEndFormatted,
        daysLeft: schedule.daysLeftBooster,
        numericPrice: 6.0,
        recommendedRank: 2,
      },
      {
        id: "thank-you-5gb",
        title: "Thank-you 5 GB booster",
        subtitle: "For 6 months with Zoiko",
        category: "Account exclusives",
        badgeText: "Account exclusive",
        badgeIcon: "star",
        bannerGradient: "from-[#1B1738] via-[#271E4A] to-[#34235C]",
        bannerGraphic: "gift",
        bullets: [
          "5 GB UK data, free",
          `For ${currentLine.number} only`,
          "Ends when your allowance renews",
        ],
        priceMain: "Free",
        priceSub: "£0.00",
        termsText: `Claim once. Granted to this account on ${currentLine.renewDate}.`,
        termsBoldEnd: `${schedule.exclusiveEndFormatted}.`,
        reasonText: "Granted to your account",
        endsText: schedule.exclusiveEndFormatted,
        daysLeft: schedule.daysLeftExclusive,
        numericPrice: 0,
        recommendedRank: 3,
      },
      {
        id: "usa-canada-pass",
        title: "USA & Canada 7-day pass",
        subtitle: "For trips outside Europe",
        category: "Roaming & travel",
        bannerGradient: "from-[#EA7A2E] via-[#E44946] to-[#DF1D5A]",
        bannerGraphic: "roaming",
        bullets: [
          "5 GB data",
          "300 mins and 300 texts",
          "United States and Canada only",
        ],
        priceMain: "£15.00",
        priceSub: "one-off",
        termsText:
          "Starts when you first use your phone there. Must start within 30 days. No renewal.",
        reasonText: "Roaming outside Europe isn’t in your plan",
        daysLeft: 99,
        numericPrice: 15.0,
        recommendedRank: 4,
      },
      {
        id: "booster-5gb-standard",
        title: "5 GB data booster",
        subtitle: "Instant extra UK data",
        category: "Add-ons & data",
        bannerGradient: "from-[#111936] via-[#182952] to-[#1D3566]",
        bannerGraphic: "5gb",
        bullets: [
          "5 GB UK data",
          "Starts immediately on your number",
          "Used before your monthly plan data",
        ],
        priceMain: "£5.00",
        priceSub: "one-off",
        termsText: `Valid until your plan renews on ${currentLine.renewDate}. One-off charge added to your next bill.`,
        reasonText: `Available for ${currentLine.number}`,
        daysLeft: schedule.daysLeftPromo,
        numericPrice: 5.0,
        recommendedRank: 5,
      },
      {
        id: "refer-friend-credit",
        title: "Refer a friend · £10.00 credit",
        subtitle: "Share Zoiko with a friend",
        category: "Refer & earn",
        bannerGradient: "from-[#D91B5C] via-[#B4144B] to-[#820E36]",
        bannerGraphic: "refer",
        bullets: [
          "£10.00 bill credit for you",
          "£10.00 bill credit for your friend",
          "Up to £100.00 per calendar year",
        ],
        priceMain: "£10.00",
        priceSub: "bill credit per friend",
        termsText:
          "Credit is added after your friend activates a pay-monthly SIM and pays their first monthly bill.",
        reasonText: "Included with your active Zoiko account",
        daysLeft: 365,
        numericPrice: 0,
        recommendedRank: 6,
      },
      // Map other backend catalogue plans into Plan Upgrades
      ...(djangoPlans || [])
        .filter(
          (p) =>
            p &&
            p.id !== backendUnlimitedPlan?.id &&
            p.slug !== backendUnlimitedPlan?.slug &&
            String(p.name || "").toLowerCase() !== upgradeTitle.toLowerCase()
        )
        .map((p, idx) => {
          const sPrice = parseFloat(
            p.sale_price || p.final_price || p.price || "15.00"
          );
          const rPrice = parseFloat(p.price || "18.00");
          const hasDiscount =
            !isNaN(sPrice) && !isNaN(rPrice) && sPrice < rPrice;
          const discountDiff = hasDiscount ? Math.round(rPrice - sPrice) : 0;
          const bullets =
            Array.isArray(p.features) && p.features.length > 0
              ? p.features
                  .map((f: any) =>
                    typeof f === "string" ? f : f?.title || String(f?.name || f)
                  )
                  .filter(Boolean)
              : [
                  `${p.data_allowance || "High-speed"} UK data`,
                  "Unlimited UK calls and texts",
                  "EU roaming included",
                ];

          return {
            id: `plan-${p.slug || p.id}`,
            title: p.name || `Zoiko ${p.data_allowance || "Plan"}`,
            subtitle: hasDiscount
              ? `£${discountDiff} off promotional rate`
              : `Upgrade to ${p.data_allowance || "more data"}`,
            category: "Plan upgrades" as OfferCategory,
            badgeText: hasDiscount ? "Limited time" : "Standard",
            badgeIcon: "clock" as const,
            bannerGradient: "from-[#820E36] via-[#B4144B] to-[#D91B5C]",
            bannerGraphic: "unlimited" as const,
            bullets: bullets.slice(0, 3),
            priceMain: `£${sPrice.toFixed(2)}`,
            priceSub: "a month",
            priceStrike: hasDiscount
              ? `Usually £${rPrice.toFixed(2)}`
              : undefined,
            termsText: `Monthly rolling. Starts at your renewal on ${currentLine.renewDate}. No contract lock-in.`,
            reasonText: `Available for ${currentLine.number}`,
            numericPrice: sPrice,
            recommendedRank: 7 + idx,
            backendPlan: p,
          };
        }),
    ];
  }, [
    currentLine,
    schedule,
    upgradeTitle,
    upgradePromoPrice,
    upgradeRegularPrice,
    upgradeBullets,
    backendUnlimitedPlan,
    djangoPlans,
    verifiedOffers,
  ]);
  void legacyOffers; // kept for later, see SHOW_DEMO_OFFERS

  // What the page shows: the public sector and student offers (always), plus backend promotions below.
  const allOffers: OfferItem[] = verifiedOffers;

  // Dynamic limited-time offers
  const limitedOffers = useMemo(() => {
    return allOffers.filter(
      (o) =>
        o.badgeText === "Limited time" ||
        o.badgeText === "Ends soon" ||
        o.category === "Account exclusives" ||
        (o.daysLeft !== undefined && o.daysLeft <= 30)
    );
  }, [allOffers]);

  // Ending soon metrics
  const endingSoonOffers = useMemo(
    () => allOffers.filter((o) => o.daysLeft !== undefined && o.daysLeft <= 7),
    [allOffers]
  );

  const earliestEndingOffer = useMemo(() => {
    const withDays = allOffers.filter(
      (o) => o.daysLeft !== undefined && o.daysLeft > 0
    );
    withDays.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
    return withDays[0] || null;
  }, [allOffers]);

  const exclusivesCount = useMemo(
    () => allOffers.filter((o) => o.category === "Account exclusives").length,
    [allOffers]
  );

  // Dynamic Hero carousel slides matching original latest offers page
  const legacyHeroSlides = useMemo(
    () => [
      {
        id: "zoiko-unlimited",
        badge: "Limited time",
        title: `Unlimited data for £${upgradePromoPrice.toFixed(
          2
        )} a month for 3 months`,
        description: `£${upgradePromoPrice.toFixed(
          2
        )} a month for 3 months, then £${upgradeRegularPrice.toFixed(
          2
        )} a month. Monthly rolling. Starts at your renewal on ${
          currentLine.renewDate
        }. From ${schedule.standardPriceFormatted} you pay £${upgradeRegularPrice.toFixed(
          2
        )} a month. Offer ${schedule.promoEndFormatted}.`,
        offerId: "zoiko-unlimited",
      },
      {
        id: "booster-10gb",
        badge: "Ends soon",
        title: "10 GB data booster for £6.00 one-off",
        description: `£2 off for a short time (usually £8.00). Starts right away on ${currentLine.number} and is used before your monthly plan data until ${currentLine.renewDate}. Offer ${schedule.boosterEndFormatted}.`,
        offerId: "booster-10gb",
      },
      {
        id: "thank-you-5gb",
        badge: "Account exclusive",
        title: "Thank-you 5 GB booster — Free",
        description: `Granted to your account for 6 months with Zoiko. Adds 5 GB of UK data to ${currentLine.number} at £0.00 until your allowance renews on ${currentLine.renewDate}. Claim by ${schedule.exclusiveEndFormatted}.`,
        offerId: "thank-you-5gb",
      },
    ],
    [
      currentLine,
      schedule,
      upgradePromoPrice,
      upgradeRegularPrice,
    ]
  );

  void legacyHeroSlides; // kept for later, see SHOW_DEMO_OFFERS

  // Does the customer already have a verified discount? (public sector or student)
  const isVerifiedCustomer = !!(verified?.ps.plans?.discount_applies || verified?.student.plans?.discount_applies);

  // Backend promotions that are live right now (server clock), most important first.
  const activePromos = useMemo(() => {
    return (promos ?? [])
      .filter((o) => {
        const now = nowTick + o.clockOffsetMs;
        if (o.startsAt && now < o.startsAt.getTime()) return false;
        if (o.endsAt && now >= o.endsAt.getTime()) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [promos, nowTick]);

  // Hero slides: live promotions (unless the customer can't use them), then public sector and student.
  const heroSlides = useMemo(() => {
    const promoSlides = activePromos
      .filter((o) => o.mechanism !== "coupon" || o.combinable || !isVerifiedCustomer)
      .map((o) => ({
        id: `promo-${o.id}`,
        badge: o.badge,
        title: o.title,
        description: [o.subtitle, o.couponCode ? `Use code ${o.couponCode} at the cart.` : ""].filter(Boolean).join(" "),
        offerId: "",
        graphic: o.discountLabel ? o.discountLabel.replace(" off", "") : o.mechanism === "info" ? "✦" : "%",
        href: o.ctaHref || "/plans",
        ctaLabel: o.ctaLabel || "Choose a plan",
      }));
    const verifiedSlides = verifiedOffers.map((o) => {
      const pct = `${o.title} ${o.priceMain}`.match(/(\d+)%/);
      return {
        id: o.id,
        badge: o.badgeText || o.category,
        title: o.title,
        description: `${[o.subtitle, ...o.bullets.slice(0, 2)].filter(Boolean).join(". ")}.`,
        offerId: o.id,
        graphic: pct ? `${pct[1]}%` : "%",
        href: "",
        ctaLabel: "",
      };
    });
    const slides = [...promoSlides, ...verifiedSlides];
    if (slides.length > 0) return slides;
    return [
      {
        id: "none",
        badge: "Offers",
        title: "Your offers",
        description: "Offers for public sector workers and students appear here.",
        offerId: "",
        graphic: "%",
        href: "",
        ctaLabel: "",
      },
    ];
  }, [activePromos, isVerifiedCustomer, verifiedOffers]);

  // "At a glance": the customer's verification status for each programme.
  const glance = useMemo(() => {
    const line = (
      who: string,
      me: { status?: string } | null | undefined,
      plansResp: { status?: string; discount_percent?: string } | null | undefined
    ) => {
      const status = me?.status ?? plansResp?.status ?? "none";
      const pct = Math.round(Number(plansResp?.discount_percent)) || 0;
      const off = pct ? `${pct}% off` : "a discount";
      if (status === "approved") return { title: `${who}: verified`, sub: `${off} applied at checkout` };
      if (status === "pending") return { title: `${who}: in progress`, sub: "We'll email you once it's reviewed" };
      if (status === "rejected") return { title: `${who}: not approved`, sub: "You can apply again" };
      if (status === "expired") return { title: `${who}: expired`, sub: "Verify again to keep your discount" };
      return {
        title: `${who}: not verified`,
        sub: verified?.loggedIn ? `Verify to get ${off}` : "Log in to check your eligibility",
      };
    };
    return {
      ps: line("Public sector", verified?.ps.me, verified?.ps.plans),
      student: line("Student", verified?.student.me, verified?.student.plans),
    };
  }, [verified]);

  // Auto-advance carousel when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, heroSlides.length]);

  // Filter counts
  const categoryTabs = useMemo(() => {
    const countFor = (cat: OfferCategory) =>
      allOffers.filter((o) => o.category === cat).length;
    return [
      { label: "All offers", count: allOffers.length },
      { label: "Plan upgrades", count: countFor("Plan upgrades") },
      { label: "Add-ons & data", count: countFor("Add-ons & data") },
      { label: "Roaming & travel", count: countFor("Roaming & travel") },
      { label: "Refer & earn", count: countFor("Refer & earn") },
      { label: "Account exclusives", count: countFor("Account exclusives") },
      { label: "Verified discounts", count: countFor("Verified discounts") },
    ].filter((t) => t.label === "All offers" || t.count > 0);
  }, [allOffers]);

  // Filtered & sorted offers
  const filteredOffers = useMemo(() => {
    let list = [...allOffers];
    if (activeCategory !== "All offers") {
      list = list.filter((o) => o.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.subtitle.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q) ||
          o.bullets.some((b) => b.toLowerCase().includes(q))
      );
    }
    if (sortBy === "Price: Low to high") {
      list.sort((a, b) => a.numericPrice - b.numericPrice);
    } else if (sortBy === "Ending soonest") {
      list.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
    } else if (personalisedOrder) {
      list.sort((a, b) => a.recommendedRank - b.recommendedRank);
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [allOffers, activeCategory, searchQuery, sortBy, personalisedOrder]);

  const displayedOffers = useMemo(() => {
    if (
      showAllOffers ||
      activeCategory !== "All offers" ||
      searchQuery.trim()
    ) {
      return filteredOffers;
    }
    return filteredOffers.slice(0, 4);
  }, [filteredOffers, showAllOffers, activeCategory, searchQuery]);

  const handleTogglePersonalised = () => {
    const next = !personalisedOrder;
    setPersonalisedOrder(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("zmuk_offers_personalised", String(next));
    }
    showToast(
      next
        ? "Personalised offer ordering turned on."
        : "Personalised order turned off — showing standard order."
    );
  };

  const handleToggleMarketing = () => {
    const next = !marketingOptIn;
    setMarketingOptIn(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("zmuk_offers_marketing", String(next));
    }
    showToast(
      next
        ? "You’re opted in to offer emails and texts."
        : "Offer emails and texts turned off."
    );
  };

  const handleClaimExclusive = async (offerId: string, title: string) => {
    if (!hasActiveLine) {
      showToast("Please activate a SIM line before claiming account exclusives.");
      return;
    }
    if (claimedExclusives.includes(offerId)) {
      showToast(`${title} is already claimed on ${currentLine.number}.`);
      return;
    }

    const offer = allOffers.find((o) => o.id === offerId);
    if (offer && offer.daysLeft !== undefined && offer.daysLeft <= 0) {
      showToast("This exclusive reward has expired.", "error");
      return;
    }

    setIsClaiming(true);
    try {
      recordBoosterPurchase({
        addedGb: 5,
        cost: 0,
        lineId: currentLine.id,
        lineNumber: currentLine.number,
        boosterName: "Thank-you 5 GB Booster",
      });

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("zoiko_token")
          : null;
      if (token) {
        await fetch(`${API_BASE}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: "general",
            subject: `Account Exclusive Claimed: ${title}`,
            message: `Customer claimed exclusive reward "${title}" for line ${currentLine.number} (ID: ${currentLine.id}).`,
          }),
        }).catch(() => {});
      }

      const updated = [...claimedExclusives, offerId];
      setClaimedExclusives(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("zmuk_claimed_exclusives", JSON.stringify(updated));
      }
      showToast(`+5 GB Thank-you booster applied to ${currentLine.number} at £0.00!`);
    } catch {
      showToast("Could not claim exclusive. Please try again or contact support.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!hasActiveLine) {
      setUpgradeError("You need an active SIM line to schedule an upgrade.");
      return;
    }

    const targetPlan = activePlanToUpgrade || backendUnlimitedPlan;
    const targetTitle = targetPlan?.name || upgradeTitle;
    const targetPrice = targetPlan
      ? parseFloat(
          targetPlan.sale_price ||
            targetPlan.final_price ||
            targetPlan.price ||
            "19.99"
        )
      : upgradePromoPrice;
    const targetRegularPrice = targetPlan
      ? parseFloat(targetPlan.price || "24.99")
      : upgradeRegularPrice;
    const targetPlanId = targetPlan?.id || 1;
    const targetPlanSlug = targetPlan?.slug || "zoiko-unlimited";

    if (
      String(currentLine.planName || "").toLowerCase().trim() ===
      targetTitle.toLowerCase().trim()
    ) {
      setUpgradeError(
        `This line (${currentLine.number}) is already active on ${targetTitle}. Please select a different plan.`
      );
      return;
    }

    setIsUpgrading(true);
    setUpgradeError("");

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("zoiko_token")
          : null;
      if (token) {
        await fetch(`${API_BASE}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: "plan_change",
            subject: `Plan Upgrade to ${targetTitle} for ${currentLine.number}`,
            message: `User requested plan upgrade from ${currentLine.planName} to ${targetTitle} (Plan ID: ${targetPlanId}, Slug: ${targetPlanSlug}, Price: £${targetPrice.toFixed(
              2
            )}/mo promo for 3 months, then £${targetRegularPrice.toFixed(
              2
            )}/mo from ${schedule.standardPriceFormatted}) effective next renewal ${
              currentLine.renewDate
            }.\nLine: ${currentLine.number} (ID: ${currentLine.id}).`,
          }),
        }).catch(() => {});
      }

      setUpgradeModalOpen(false);
      showToast(
        `${targetTitle} scheduled for ${currentLine.number} starting ${currentLine.renewDate}.`
      );
    } catch {
      setUpgradeError("Failed to schedule upgrade. Please contact support.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleAddonOffer = async (offer: OfferItem) => {
    if (!hasActiveLine) {
      showToast("Please activate a SIM line before purchasing add-ons.");
      return;
    }

    if (offer.daysLeft !== undefined && offer.daysLeft <= 0) {
      showToast("This promotional offer has expired.", "error");
      return;
    }

    // Spend limit cap validation
    if (typeof window !== "undefined" && offer.numericPrice > 0) {
      const savedLimits = localStorage.getItem("zoiko_bill_limits");
      if (savedLimits) {
        try {
          const parsed = JSON.parse(savedLimits);
          const limit = parsed[currentLine.id] || parsed[currentLine.number];
          if (
            typeof limit === "number" &&
            limit > 0 &&
            offer.numericPrice > limit
          ) {
            showToast(
              `This add-on (£${offer.numericPrice.toFixed(
                2
              )}) exceeds your monthly spend cap of £${limit.toFixed(
                2
              )}. Please adjust your spending cap in Bills & Payments.`,
              "error"
            );
            return;
          }
        } catch {}
      }
    }

    let addedGb = 0;
    const match = offer.title.match(/(\d+)\s*GB/i);
    if (match) addedGb = Number(match[1]);

    recordBoosterPurchase({
      addedGb: addedGb || 5,
      cost: offer.numericPrice,
      lineId: currentLine.id,
      lineNumber: currentLine.number,
      boosterName: offer.title,
    });

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("zoiko_token")
        : null;
    if (token) {
      await fetch(`${API_BASE}/api/support/tickets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: "billing",
          subject: `Add-on Purchase: ${offer.title} for ${currentLine.number}`,
          message: `User accepted offer: ${offer.title} (£${offer.numericPrice.toFixed(
            2
          )}) for line ${currentLine.number}.`,
        }),
      }).catch(() => {});
    }

    showToast(`${offer.title} added for ${currentLine.number}!`);
  };

  const renderBannerGraphic = (type: OfferItem["bannerGraphic"]) => {
    if (type === "unlimited") {
      return (
        <div className="relative flex items-end justify-end h-full">
          <div className="w-24 h-24 rounded-full bg-white/10 absolute -right-4 -top-6 pointer-events-none" />
          <div className="w-11 h-16 rounded-t-xl border-[1.75px] border-b-0 border-white/80 flex items-center justify-center translate-y-3.5 mr-3">
            <span className="text-white text-base font-bold leading-none">
              ∞
            </span>
          </div>
        </div>
      );
    }
    if (type === "10gb") {
      return (
        <div className="relative flex items-center justify-end h-full pr-3 pt-4">
          <div className="w-24 h-24 rounded-full bg-white/5 absolute -right-4 -top-6 pointer-events-none" />
          <span className="text-white text-[22px] font-extrabold tracking-tight leading-none">
            10 GB
          </span>
        </div>
      );
    }
    if (type === "5gb") {
      return (
        <div className="relative flex items-center justify-end h-full pr-3 pt-4">
          <div className="w-24 h-24 rounded-full bg-white/5 absolute -right-4 -top-6 pointer-events-none" />
          <span className="text-white text-[22px] font-extrabold tracking-tight leading-none">
            5 GB
          </span>
        </div>
      );
    }
    if (type === "gift") {
      return (
        <div className="relative flex items-end justify-end h-full pr-3">
          <div className="w-24 h-24 rounded-full bg-white/8 absolute -right-4 -top-6 pointer-events-none" />
          {/* Flat gift box graphic matching screenshot */}
          <div className="w-11 flex flex-col items-center translate-y-2">
            {/* Lid */}
            <div className="w-11 h-2.5 bg-[#F59E0B] rounded-t-sm relative flex justify-center">
              <div className="w-1.5 h-full bg-white/90" />
            </div>
            {/* Box body */}
            <div className="w-10 h-8 bg-[#E01C5B] flex justify-center">
              <div className="w-1.5 h-full bg-white/90" />
            </div>
          </div>
        </div>
      );
    }
    if (type === "roaming") {
      return (
        <div className="relative flex items-center justify-end h-full pr-1 pt-2">
          <div className="w-24 h-24 rounded-full bg-white/10 absolute -right-4 -top-6 pointer-events-none" />
          <svg
            className="w-36 h-16 text-white"
            viewBox="0 0 150 60"
            fill="none"
          >
            <path
              d="M10 54 C 48 16, 102 14, 140 34"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.75"
              strokeDasharray="3.5 3.5"
              strokeLinecap="round"
            />
            {/* Paper airplane / arrow along arc */}
            <polygon
              points="96,17 113,22 100,27 103,22"
              fill="white"
            />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-xl border border-white/40 flex items-center justify-center mr-2 mt-2">
        <Gift className="w-6 h-6 text-white/90" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#101828] font-sans p-3 sm:p-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#101828] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Left Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            numbersCount={lines.length}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            planName={hasActiveLine ? currentLine.planName : ""}
            renewDate={hasActiveLine ? currentLine.renewDate : ""}
          />
        </div>

        {/* Main Content Column */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Navigation Header */}
          <DashboardTopNav
            userName={userName}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Latest offers"
            customSubtitle="Offers you can get on your selected number, with the full price and terms up front."
          />

          {/* Sub-header Bar: Freshness & Line Selector Card */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#667085]">
              <Clock className="w-3.5 h-3.5 text-[#667085]" />
              <span>Offers checked {freshnessTime} · catalogue {schedule.catalogueCode}</span>
              <button
                type="button"
                onClick={() => {
                  fetchOffersData(true);
                  loadPromos();
                  loadVerified();
                }}
                title="Refresh offers"
                className="w-7 h-7 rounded-lg hover:bg-white/80 flex items-center justify-center text-[#1D2433] transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    refreshing ? "animate-spin text-[#E01C5B]" : ""
                  }`}
                />
              </button>
            </div>

            {/* "Offers for" Line Selector Card matching reference screenshot */}
            <div className="relative w-full sm:w-auto sm:min-w-[360px]">
              <button
                type="button"
                onClick={() => hasActiveLine && setLineDropdownOpen((prev) => !prev)}
                className="w-full px-3.5 py-2 bg-white rounded-2xl border border-[#E4E7EC] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.03)] flex items-center justify-between gap-3 hover:border-[#D0D5DD] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left min-w-0">
                  <div className="w-7 h-7 rounded-lg border border-[#E4E7EC] flex items-center justify-center text-[#475467] shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-[#667085] leading-3.5">
                      Offers for
                    </div>
                    <div className="text-xs font-bold text-[#101828] leading-4 truncate">
                      {hasActiveLine ? `${currentLine.number} · ${currentLine.planName}` : "No active SIM"}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#667085] shrink-0" />
              </button>

              {lineDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-full min-w-[280px] bg-white rounded-2xl shadow-xl border border-[#E4E7EC] py-1.5 z-40">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                    Select a number
                  </div>
                  {lines.map((line) => {
                    const isSelected = line.id === currentLine.id;
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => {
                          setSelectedLineId(line.id);
                          setLineDropdownOpen(false);
                          showToast(`Showing offers for ${line.number}`);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#FDF2F6] text-[#E01C5B] font-bold"
                            : "text-[#101828] hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold">{line.number}</div>
                          <div className="text-[11px] text-[#667085]">
                            {line.planName}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#E01C5B]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ROW 1: Featured Offer Hero Carousel (8 cols) + At a Glance (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 8 cols: Hero Carousel */}
            <div className="lg:col-span-8 min-h-[290px] p-6 sm:p-7 relative bg-gradient-to-br from-[#D91B5C] via-[#B4144B] to-[#820E36] rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between overflow-hidden text-white">
              {/* Soft glow circle & top-right phone outline with ∞ */}
              <div className="w-72 h-72 -right-12 -top-24 absolute rounded-full bg-white/8 pointer-events-none" />
              <div className="hidden sm:flex right-14 -top-3 absolute pointer-events-none">
                <div className="w-28 h-40 rounded-b-[22px] border-[2.25px] border-t-0 border-white/85 flex flex-col items-center justify-start pt-5">
                  <span className="text-white text-3xl font-light tracking-tighter leading-none">
                    {heroSlides[activeSlide]?.graphic ?? ""}
                  </span>
                </div>
              </div>

              {/* Slide Content */}
              <div className="max-w-[460px] flex flex-col items-start gap-2.5 relative z-10">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full inline-flex items-center gap-1.5 text-[11px] font-bold text-white">
                  <Clock className="w-3 h-3 text-white shrink-0" />
                  <span>{heroSlides[activeSlide].badge}</span>
                </span>
                <h2 className="text-2xl sm:text-[26px] font-extrabold leading-[1.2] tracking-tight text-white">
                  {heroSlides[activeSlide].title}
                </h2>
                <p className="text-xs text-white/90 leading-relaxed">
                  {heroSlides[activeSlide].description}
                </p>
                <div className="pt-1.5">
                  <button
                    type="button"
                    style={
                      heroSlides[activeSlide].href || allOffers.some((o) => o.id === heroSlides[activeSlide].offerId)
                        ? undefined
                        : { display: "none" }
                    }
                    onClick={() => {
                      if (heroSlides[activeSlide].href) {
                        router.push(heroSlides[activeSlide].href);
                        return;
                      }
                      const found = allOffers.find(
                        (o) => o.id === heroSlides[activeSlide].offerId
                      );
                      if (found) setSelectedOfferModal(found);
                    }}
                    className="px-4 py-2 bg-white hover:bg-white/95 text-[#101828] rounded-full inline-flex items-center gap-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <span>{heroSlides[activeSlide].ctaLabel || "View offer"}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#101828]" />
                  </button>
                </div>
              </div>

              {/* Carousel Controls Bottom Bar */}
              <div className="pt-4 flex items-center gap-2 relative z-10">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (prev) =>
                        (prev - 1 + heroSlides.length) % heroSlides.length
                    )
                  }
                  aria-label="Previous offer slide"
                  className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
                  className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 text-white" />
                  ) : (
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide((prev) => (prev + 1) % heroSlides.length)
                  }
                  aria-label="Next offer slide"
                  className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Indicator Dots + 1 / 3 inline */}
                <div className="pl-1 flex items-center gap-1.5">
                  {heroSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeSlide === idx
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/45 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>

                <div className="pl-1 text-[11px] font-medium text-white/85">
                  {activeSlide + 1} / {heroSlides.length}
                </div>
              </div>
            </div>

            {/* Right 4 cols: At a Glance Card */}
            <div className="lg:col-span-4 p-5 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="w-8 h-8 rounded-full bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] leading-5">
                      At a glance
                    </h3>
                    <p className="text-[11px] text-[#667085] leading-4">
                      Your account
                    </p>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#F2F4F7]">
                  {/* Row 1 */}
                  <div className="py-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#101828] leading-4">
                        {allOffers.length} offers you can view
                      </div>
                      <div className="text-[11px] text-[#667085] leading-4 mt-0.5">
                        Discounts you can get
                      </div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="py-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#101828] leading-4">
                        {glance.ps.title}
                      </div>
                      <div className="text-[11px] text-[#667085] leading-4 mt-0.5">
                        {glance.ps.sub}
                      </div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="py-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#101828] leading-4">
                        {glance.student.title}
                      </div>
                      <div className="text-[11px] text-[#667085] leading-4 mt-0.5">
                        {glance.student.sub}
                      </div>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(true)}
                    className="pt-2.5 pb-1 flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#101828] leading-4">
                        How we choose what to show
                      </div>
                      <div className="text-[11px] text-[#667085] leading-4 mt-0.5">
                        {personalisedOrder
                          ? "Personalised using your plan"
                          : "Standard catalogue order"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Category Filter Pills + Search & Sort Card */}
          <div className="p-4 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.label;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveCategory(tab.label)}
                    className={`px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#E01C5B] text-white border border-[#E01C5B]"
                        : "bg-white text-[#101828] border border-[#E4E7EC] hover:bg-[#F8F9FB]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-[#F2F4F7] text-[#475467]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-[#E4E7EC] flex items-center gap-2 focus-within:border-[#E01C5B] transition-colors">
                <Search className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search offers"
                  className="w-full bg-transparent text-xs text-[#101828] placeholder-[#667085] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[#667085] hover:text-[#101828] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen((prev) => !prev)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-[#F8F9FB] rounded-xl border border-[#E4E7EC] inline-flex items-center justify-between gap-2 text-xs text-[#101828] transition-colors cursor-pointer"
                >
                  <span>
                    <strong className="font-bold">Sort: {sortBy}</strong>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
                </button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-[#E4E7EC] py-1 z-30">
                    {(
                      [
                        "Recommended",
                        "Price: Low to high",
                        "Ending soonest",
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSortBy(opt);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between cursor-pointer ${
                          sortBy === opt
                            ? "bg-[#FDF2F6] text-[#E01C5B] font-bold"
                            : "text-[#101828] hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt}</span>
                        {sortBy === opt && (
                          <Check className="w-3.5 h-3.5 text-[#E01C5B]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 3: Recommended for you (8 cols) + Your exclusives & Your offer choices (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 8 cols: Recommended for you */}
            <div className="lg:col-span-8 p-5 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-4">
              {SHOW_DEMO_OFFERS && (
                <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] leading-5">
                      Recommended for you
                    </h3>
                    <p className="text-[11px] text-[#667085] leading-4">
                      {personalisedOrder
                        ? "Ordered using your plan · every offer is checked for this number"
                        : "Unordered catalogue · every offer is checked for this number"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllOffers((prev) => !prev)}
                  className="px-2 py-1 rounded-[10px] inline-flex items-center gap-1 text-xs font-bold text-[#E01C5B] hover:bg-[#FDF2F6] transition-colors cursor-pointer"
                >
                  <span>
                    {showAllOffers
                      ? "Show top 4"
                      : `View all ${filteredOffers.length}`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

                </>
              )}

              {/* 2x2 Offer Cards Grid */}
              {displayedOffers.length === 0 ? (
                <div className="p-8 bg-[#F8F9FB] rounded-2xl text-center flex flex-col items-center gap-2">
                  <p className="text-sm font-bold text-[#101828]">
                    No matching offers found
                  </p>
                  <p className="text-xs text-[#667085]">
                    Try clearing your search or choosing &ldquo;All
                    offers&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("All offers");
                      setSearchQuery("");
                    }}
                    className="mt-1 px-3.5 py-1.5 bg-[#E01C5B] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedOffers.map((offer) => {
                    const isClaimed = claimedExclusives.includes(offer.id);
                    return (
                      <div
                        key={offer.id}
                        className="bg-white rounded-2xl border border-[#EAECF0] flex flex-col justify-between overflow-hidden hover:border-[#D0D5DD] transition-all"
                      >
                        <div>
                          {/* Top Gradient Banner */}
                          <div
                            className={`h-24 p-3 relative bg-gradient-to-br ${offer.bannerGradient} flex items-start justify-between overflow-hidden`}
                          >
                            <div className="relative z-10">
                              {offer.badgeText && (
                                <span className="px-2.5 py-0.5 bg-white text-[#101828] rounded-full inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs">
                                  {offer.badgeIcon === "star" ? (
                                    <Star className="w-3 h-3 text-[#101828] shrink-0" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-[#101828] shrink-0" />
                                  )}
                                  <span>{offer.badgeText}</span>
                                </span>
                              )}
                            </div>
                            <div className="h-full flex items-end pointer-events-none">
                              {renderBannerGraphic(offer.bannerGraphic)}
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 flex flex-col gap-2.5">
                            <div>
                              <h4 className="text-sm font-bold text-[#101828] leading-5">
                                {offer.title}
                              </h4>
                              <p className="text-[11px] text-[#667085] leading-4 mt-0.5">
                                {offer.subtitle}
                              </p>
                            </div>

                            {/* 3 Green Check Bullets */}
                            <div className="flex flex-col gap-1">
                              {offer.bullets.map((bullet, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-1.5 text-[11px] text-[#344054]"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#12B76A] shrink-0 mt-0.5" />
                                  <span>{bullet}</span>
                                </div>
                              ))}
                            </div>

                            {/* Price Block */}
                            <div className="pt-2 border-t border-[#F2F4F7] flex flex-col gap-0.5">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-lg font-extrabold text-[#101828] leading-6">
                                  {offer.priceMain}
                                </span>
                                {offer.priceSub && (
                                  <span className="text-[11px] text-[#667085]">
                                    {offer.priceSub}
                                  </span>
                                )}
                                {offer.priceStrike && (
                                  <span className="text-[11px] text-[#667085] line-through">
                                    {offer.priceStrike}
                                  </span>
                                )}
                              </div>
                              {offer.priceAfter && (
                                <div className="text-[11px] font-medium text-[#344054] leading-4">
                                  {offer.priceAfter}
                                </div>
                              )}
                            </div>

                            {/* Terms Box */}
                            <div className="px-3 py-2 bg-[#F8F9FB] rounded-xl text-[11px] text-[#475467] leading-4">
                              <span>{offer.termsText}</span>
                              {offer.termsBoldEnd && (
                                <strong className="font-bold text-[#101828] ml-1">
                                  {offer.termsBoldEnd}
                                </strong>
                              )}
                            </div>

                            {/* Why you're seeing this */}
                            <div className="flex items-start gap-1.5 text-[10px] text-[#667085] leading-3.5">
                              <Info className="w-3 h-3 text-[#98A2B3] shrink-0 mt-0.5" />
                              <span>
                                Why you’re seeing this: {offer.reasonText}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom CTA Button */}
                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() => setSelectedOfferModal(offer)}
                            className="w-full py-2 px-3 bg-[#E01C5B] hover:bg-[#C81650] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            {isClaimed ? "Claimed · View details" : "View details"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Note */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#667085]">
                <Info className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                <span>
                  Prices include VAT. Catalogue {schedule.catalogueCode} — verified for {currentLine.number}.
                </span>
              </div>
            </div>

            {/* Right 4 cols: Your exclusives + Your offer choices (Matching media_1792561619113_6e37981a.png) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Card 1: Your exclusives */}
              <div className="p-5 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] leading-5">
                      Your exclusives
                    </h3>
                    <p className="text-[11px] text-[#667085] leading-4">
                      Granted to your account
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {SHOW_DEMO_OFFERS && (
                    <>
                  <div className="p-3 bg-white rounded-2xl border border-[#EAECF0] flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#101828] leading-4">
                          Thank-you 5 GB booster
                        </div>
                        <div className="text-[11px] text-[#667085] leading-3.5 mt-0.5">
                          Free · Claim by {schedule.exclusiveEndFormatted.replace("Ends ", "")}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleClaimExclusive(
                          "thank-you-5gb",
                          "Thank-you 5 GB booster"
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                        claimedExclusives.includes("thank-you-5gb")
                          ? "bg-[#ECFDF3] text-[#027A48]"
                          : "bg-[#E01C5B] hover:bg-[#C81650] text-white"
                      }`}
                    >
                      {claimedExclusives.includes("thank-you-5gb")
                        ? "Claimed"
                        : "Claim"}
                    </button>
                  </div>

                    </>
                  )}

                  {/* Exclusive 2: White bordered card */}
                  <div className="p-3 bg-white rounded-2xl border border-[#EAECF0] flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                        <Gift className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#101828] leading-4">
                          Refer a friend
                        </div>
                        <div className="text-[11px] text-[#667085] leading-3.5 mt-0.5">
                          Coming soon
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/refer-and-earn")}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#F9C6D7] text-[#E01C5B] hover:bg-[#FDF2F6] text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#667085]">
                  <Info className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                  <span>eSIM and device deals aren’t offered here yet.</span>
                </div>
              </div>

              {/* Card 2: Your offer choices (With left Star/Mail icons & clean divider rows) */}
              <div className="p-5 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] leading-5">
                      Your offer choices
                    </h3>
                    <p className="text-[11px] text-[#667085] leading-4">
                      Change these any time
                    </p>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#F2F4F7]">
                  {/* Toggle 1: Personalised order with Star icon box */}
                  <div className="py-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F2F4F7] flex items-center justify-center text-[#475467] shrink-0 mt-0.5">
                        <Star className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#101828] leading-4">
                          Personalised order
                        </div>
                        <div className="text-[11px] text-[#667085] leading-3.5 mt-0.5">
                          Uses your plan to order offers. Off shows the same
                          offers, unordered.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={personalisedOrder}
                      onClick={handleTogglePersonalised}
                      className={`w-10 h-5 p-0.5 rounded-full transition-colors flex items-center shrink-0 cursor-pointer ${
                        personalisedOrder
                          ? "bg-[#E01C5B] justify-end"
                          : "bg-[#D0D5DD] justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow-xs block" />
                    </button>
                  </div>

                  {/* Toggle 2: Offer emails and texts with Mail icon box */}
                  <div className="py-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F2F4F7] flex items-center justify-center text-[#475467] shrink-0 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#101828] leading-4">
                          Offer emails and texts
                        </div>
                        <div className="text-[11px] text-[#667085] leading-3.5 mt-0.5">
                          Marketing messages. Only sent if you agree.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={marketingOptIn}
                      onClick={handleToggleMarketing}
                      className={`w-10 h-5 p-0.5 rounded-full transition-colors flex items-center shrink-0 cursor-pointer ${
                        marketingOptIn
                          ? "bg-[#E01C5B] justify-end"
                          : "bg-[#D0D5DD] justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow-xs block" />
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#E01C5B] hover:underline cursor-pointer"
                  >
                    <span>How we use your information</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 4: Limited-time offers (live from the backend offers list) */}
          <div className="p-5 sm:p-6 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828] leading-5">Limited-time offers</h3>
                  <p className="text-xs text-[#667085] leading-4 mt-0.5">
                    Live from our offers list. End times are shown in UK time.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8F9FB] border border-[#EAECF0] text-[11px] font-semibold text-[#475467]">
                <Info className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                Coupon codes can&apos;t be used with a verified public sector or student discount
              </span>
            </div>

            {promos === null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-56 rounded-2xl bg-[#F2F4F7] animate-pulse" />
                ))}
              </div>
            ) : activePromos.length === 0 ? (
              <div className="py-10 px-6 rounded-2xl bg-gradient-to-br from-[#FDF2F6] to-[#F8F9FB] border border-[#F9C6D7]/60 flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#E01C5B]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-[#101828]">No limited-time offers right now</p>
                <p className="text-xs text-[#667085] max-w-sm">
                  When we run a sale it appears here with its code and end date. Your public sector and student
                  discounts are always available above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activePromos.map((o) => {
                  const blocked = o.mechanism === "coupon" && !o.combinable && isVerifiedCustomer;
                  const nowMs = nowTick + o.clockOffsetMs;
                  const endsText = o.endsAt
                    ? `Ends ${o.endsAt.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/London",
                      })}`
                    : "";
                  return (
                    <div
                      key={o.id}
                      className={`rounded-2xl overflow-hidden border flex flex-col bg-white ${
                        blocked ? "border-[#EAECF0]" : "border-[#F9C6D7] shadow-[0px_8px_24px_-12px_rgba(224,28,91,0.35)]"
                      }`}
                    >
                      <div
                        className={`relative px-5 pt-5 pb-5 text-white ${
                          blocked
                            ? "bg-gradient-to-br from-[#667085] to-[#475467]"
                            : "bg-gradient-to-br from-[#D91B5C] via-[#B4144B] to-[#820E36]"
                        }`}
                      >
                        <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold">
                          <Clock className="w-3 h-3" />
                          {o.badge}
                        </span>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-base font-extrabold leading-snug">{o.title}</h4>
                            {o.subtitle && <p className="text-xs text-white/85 mt-1 leading-relaxed">{o.subtitle}</p>}
                          </div>
                          {o.discountLabel && (
                            <div className="shrink-0 text-right text-3xl font-black leading-none tracking-tight">
                              {o.discountLabel.replace(" off", "")}
                              <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-1">off</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col gap-3.5 flex-1">
                        {o.bullets.length > 0 && (
                          <ul className="flex flex-col gap-1.5">
                            {o.bullets.slice(0, 4).map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[#344054]">
                                <Check className="w-3.5 h-3.5 text-[#12B76A] shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {o.couponCode && !blocked && (
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#E01C5B]/50 bg-[#FDF2F6] px-3.5 py-2.5">
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Coupon code</div>
                              <div className="font-mono text-sm font-extrabold text-[#BA1248] truncate">{o.couponCode.toUpperCase()}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  navigator.clipboard?.writeText(o.couponCode);
                                } catch {
                                  // ignore
                                }
                                showToast("Code copied");
                              }}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-[#F9C6D7] text-[11px] font-bold text-[#E01C5B] hover:bg-[#FFF5F8] transition cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#B54708]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {promoTimeLeft(o.endsAt, nowMs)}
                          </span>
                          {endsText && <span className="text-[#667085] font-medium">{endsText}</span>}
                        </div>

                        {o.termsText && <p className="text-[11px] text-[#667085] leading-relaxed whitespace-pre-line">{o.termsText}</p>}

                        {o.mechanism === "coupon" && !o.combinable && (
                          <p className="flex items-start gap-1.5 text-[11px] text-[#667085]">
                            <Info className="w-3.5 h-3.5 text-[#98A2B3] shrink-0 mt-0.5" />
                            Can&apos;t be combined with a verified public sector or student discount.
                          </p>
                        )}

                        <div className="mt-auto pt-1">
                          {blocked ? (
                            <div className="rounded-xl bg-[#F8F9FB] border border-[#EAECF0] px-3.5 py-2.5 text-xs font-semibold text-[#475467]">
                              Not applicable: you already have a verified discount.
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => router.push(o.ctaHref || "/plans")}
                              className="w-full px-4 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#C81650] text-white text-xs font-bold transition cursor-pointer inline-flex items-center justify-center gap-1.5"
                            >
                              <span>{o.ctaLabel || "Choose a plan"}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Old row (Limited-time offers demo + Plan upgrade comparison), kept behind SHOW_DEMO_OFFERS */}
          {SHOW_DEMO_OFFERS && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 7 cols: Limited-time offers */}
            <div className="lg:col-span-7 p-5 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#101828] leading-5">
                    Limited-time offers
                  </h3>
                  <p className="text-[11px] text-[#667085] leading-4">
                    Real end dates, shown in UK time
                  </p>
                </div>
              </div>

              {/* 3-Column Grid for Active Limited-time Offers (White Cards) + Expired Card (Gray Card) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card 1: 10 GB data booster (White Card) */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#EAECF0] flex flex-col justify-between gap-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold text-[#101828] leading-4">
                      10 GB data booster
                    </div>
                    <div className="text-[11px] text-[#667085] leading-4">
                      £2 off for a short time
                    </div>
                    <div className="pt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-base font-extrabold text-[#101828]">
                        £6.00
                      </span>
                      <span className="text-[11px] text-[#667085] line-through">
                        £8.00
                      </span>
                    </div>
                    <div className="text-[11px] text-[#667085] leading-3.5">
                      one-off
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-1.5 text-[11px] font-bold text-[#B54708] leading-3.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{schedule.boosterEndFormatted} · {schedule.daysLeftBooster} days</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const found = allOffers.find(
                          (o) => o.id === "booster-10gb"
                        );
                        if (found) setSelectedOfferModal(found);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-white border border-[#F9C6D7] text-[#E01C5B] hover:bg-[#FDF2F6] text-xs font-bold transition-colors cursor-pointer"
                    >
                      View details
                    </button>
                  </div>
                </div>

                {/* Card 2: Zoiko Unlimited (White Card) */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#EAECF0] flex flex-col justify-between gap-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold text-[#101828] leading-4">
                      Zoiko Unlimited
                    </div>
                    <div className="text-[11px] text-[#667085] leading-4">
                      £5 off a month for 3 months
                    </div>
                    <div className="pt-1 flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-[#101828]">
                        £19.99
                      </span>
                    </div>
                    <div className="text-[11px] text-[#667085] leading-3.5">
                      a month for 3 months, then £24.99 a month
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-1.5 text-[11px] font-bold text-[#B54708] leading-3.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{schedule.promoEndFormatted} · {schedule.daysLeftPromo} days</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const found = allOffers.find(
                          (o) => o.id === "zoiko-unlimited"
                        );
                        if (found) setSelectedOfferModal(found);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-white border border-[#F9C6D7] text-[#E01C5B] hover:bg-[#FDF2F6] text-xs font-bold transition-colors cursor-pointer"
                    >
                      View details
                    </button>
                  </div>
                </div>

                {/* Card 3: Thank-you 5 GB booster (White Card) */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#EAECF0] flex flex-col justify-between gap-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-bold text-[#101828] leading-4">
                      Thank-you 5 GB booster
                    </div>
                    <div className="text-[11px] text-[#667085] leading-4">
                      For 6 months with Zoiko
                    </div>
                    <div className="pt-1 flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-[#101828]">
                        Free
                      </span>
                    </div>
                    <div className="text-[11px] text-[#667085] leading-3.5">
                      free
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-1.5 text-[11px] font-bold text-[#B54708] leading-3.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{schedule.exclusiveEndFormatted} · {schedule.daysLeftExclusive} days</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const found = allOffers.find(
                          (o) => o.id === "thank-you-5gb"
                        );
                        if (found) setSelectedOfferModal(found);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-white border border-[#F9C6D7] text-[#E01C5B] hover:bg-[#FDF2F6] text-xs font-bold transition-colors cursor-pointer"
                    >
                      View details
                    </button>
                  </div>
                </div>

                {/* Card 4: Expired EU Day Pass (Light Gray Card) */}
                <div className="p-3.5 bg-[#F2F4F7] rounded-2xl border border-[#EAECF0] flex flex-col justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#101828] leading-4">
                      EU Day Pass · 3 days for £5.00
                    </div>
                    <div className="text-[11px] text-[#667085] leading-4 mt-0.5">
                      No longer available
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] font-bold text-[#667085] leading-3.5">
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Ended past promotional period</span>
                  </div>
                  <div className="text-[11px] text-[#667085] leading-3.5">
                    Anyone who bought it keeps what they bought.
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Plan upgrade Comparison Card (Matching media_1792561619113_6e37981a.png) */}
            <div className="lg:col-span-5 p-5 bg-white rounded-[22px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B] shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] leading-5">
                      Plan upgrade
                    </h3>
                    <p className="text-[11px] text-[#667085] leading-4">
                      Compare before you change
                    </p>
                  </div>
                </div>

                {/* Borderless Comparison Table with Soft-Pink "With offer" Column */}
                <div className="text-xs">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 border-b border-[#F2F4F7] text-[11px] font-medium text-[#667085]">
                    <div className="col-span-4 py-2 pr-2">&nbsp;</div>
                    <div className="col-span-3 py-2 px-2">Now</div>
                    <div className="col-span-5 py-2 px-3">With offer</div>
                  </div>

                  {/* Row 1: Plan */}
                  <div className="grid grid-cols-12 items-center border-b border-[#F2F4F7] text-[11px]">
                    <div className="col-span-4 py-2.5 pr-2 text-[#667085]">
                      Plan
                    </div>
                    <div className="col-span-3 py-2.5 px-2 text-[#101828]">
                      {currentLine.planName}
                    </div>
                    <div className="col-span-5 py-2.5 px-3 bg-[#FDF2F6] font-bold text-[#101828] rounded-t-lg">
                      {upgradeTitle}
                    </div>
                  </div>

                  {/* Row 2: Data */}
                  <div className="grid grid-cols-12 items-center border-b border-[#F2F4F7] text-[11px]">
                    <div className="col-span-4 py-2.5 pr-2 text-[#667085]">
                      Data
                    </div>
                    <div className="col-span-3 py-2.5 px-2 text-[#101828]">
                      {currentLine.dataAllowance}
                    </div>
                    <div className="col-span-5 py-2.5 px-3 bg-[#FDF2F6] font-bold text-[#101828]">
                      {upgradeAllowance}
                    </div>
                  </div>

                  {/* Row 3: Promotional period */}
                  <div className="grid grid-cols-12 items-center border-b border-[#F2F4F7] text-[11px]">
                    <div className="col-span-4 py-2.5 pr-2 text-[#667085]">
                      {currentLine.renewDate} – 3 months
                    </div>
                    <div className="col-span-3 py-2.5 px-2 text-[#101828]">
                      £{currentLine.price.toFixed(2)} a month
                    </div>
                    <div className="col-span-5 py-2.5 px-3 bg-[#FDF2F6] font-bold text-[#101828]">
                      £{upgradePromoPrice.toFixed(2)} a month
                    </div>
                  </div>

                  {/* Row 4: Standard price */}
                  <div className="grid grid-cols-12 items-center border-b border-[#F2F4F7] text-[11px]">
                    <div className="col-span-4 py-2.5 pr-2 text-[#667085]">
                      From {schedule.standardPriceFormatted}
                    </div>
                    <div className="col-span-3 py-2.5 px-2 text-[#101828]">
                      £{currentLine.price.toFixed(2)} a month
                    </div>
                    <div className="col-span-5 py-2.5 px-3 bg-[#FDF2F6] font-bold text-[#101828]">
                      £{upgradeRegularPrice.toFixed(2)} a month
                    </div>
                  </div>

                  {/* Row 5: Contract */}
                  <div className="grid grid-cols-12 items-center text-[11px]">
                    <div className="col-span-4 py-2.5 pr-2 text-[#667085]">
                      Contract
                    </div>
                    <div className="col-span-3 py-2.5 px-2 text-[#101828]">
                      Monthly rolling
                    </div>
                    <div className="col-span-5 py-2.5 px-3 bg-[#FDF2F6] font-bold text-[#101828] rounded-b-lg">
                      Monthly rolling · no exit fee
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#667085]">
                  <Clock className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                  <span>Offer {schedule.promoEndFormatted}</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasActiveLine) {
                      showToast(
                        "No active SIM line found to upgrade. Please activate a SIM first."
                      );
                      return;
                    }
                    setSelectedUpgradePlan(backendUnlimitedPlan);
                    setUpgradeModalOpen(true);
                  }}
                  className="py-2 px-4 bg-[#E01C5B] hover:bg-[#C81650] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Compare and continue
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Offer Details Modal */}
      {selectedOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`p-6 bg-gradient-to-br ${selectedOfferModal.bannerGradient} text-white flex items-start justify-between`}
            >
              <div>
                {selectedOfferModal.badgeText && (
                  <span className="px-2.5 py-0.5 bg-white text-[#101828] rounded-full text-[11px] font-bold">
                    {selectedOfferModal.badgeText}
                  </span>
                )}
                <h3 className="text-xl font-extrabold mt-2">
                  {selectedOfferModal.title}
                </h3>
                <p className="text-xs text-white/85 mt-0.5">
                  {selectedOfferModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfferModal(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-baseline justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-2xl font-extrabold text-[#101828]">
                    {selectedOfferModal.priceMain}
                  </span>
                  {selectedOfferModal.priceSub && (
                    <span className="text-xs text-[#667085] ml-1.5">
                      {selectedOfferModal.priceSub}
                    </span>
                  )}
                  {selectedOfferModal.priceAfter && (
                    <div className="text-xs text-[#667085] mt-0.5">
                      {selectedOfferModal.priceAfter}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-[#E01C5B] bg-[#FDF2F6] px-2.5 py-1 rounded-full">
                  For {currentLine.number}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-[#101828]">
                  What’s included
                </div>
                {selectedOfferModal.bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-[#101828]"
                  >
                    <Check className="w-4 h-4 text-[#12B76A] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-[#F8F9FB] rounded-xl text-xs text-[#667085] leading-relaxed">
                <strong className="text-[#101828] block mb-1">
                  Key terms & billing
                </strong>
                <span>{selectedOfferModal.termsText}</span>
                {selectedOfferModal.termsBoldEnd && (
                  <strong className="font-bold text-[#101828] ml-1">
                    {selectedOfferModal.termsBoldEnd}
                  </strong>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOfferModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#E4E7EC] text-xs font-bold text-[#667085] hover:text-[#101828] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => {
                    const offer = selectedOfferModal;
                    if (offer.category === "Verified discounts" && offer.href) {
                      setSelectedOfferModal(null);
                      router.push(offer.href);
                    } else if (offer.category === "Account exclusives") {
                      setSelectedOfferModal(null);
                      handleClaimExclusive(offer.id, offer.title);
                    } else if (offer.category === "Refer & earn") {
                      setSelectedOfferModal(null);
                      router.push("/dashboard/refer-and-earn");
                    } else if (offer.category === "Plan upgrades") {
                      setSelectedOfferModal(null);
                      if (!hasActiveLine) {
                        showToast(
                          "No active SIM line found to upgrade. Please activate a SIM first."
                        );
                        return;
                      }
                      setSelectedUpgradePlan(
                        offer.backendPlan || backendUnlimitedPlan
                      );
                      setUpgradeModalOpen(true);
                    } else {
                      setSelectedOfferModal(null);
                      handleAddonOffer(offer);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#C81650] text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : selectedOfferModal.category === "Verified discounts" ? (
                    selectedOfferModal.ctaLabel || "Choose your plan"
                  ) : selectedOfferModal.category === "Account exclusives" ? (
                    "Claim free booster"
                  ) : selectedOfferModal.category === "Plan upgrades" ? (
                    "Review plan upgrade"
                  ) : selectedOfferModal.category === "Refer & earn" ? (
                    "Go to Refer & earn"
                  ) : (
                    `Get offer on ${currentLine.number}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Upgrade Confirmation Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B]">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828]">
                    Upgrade to {modalPlanTitle}
                  </h3>
                  <p className="text-xs text-[#667085]">
                    For {currentLine.number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#667085] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {upgradeError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{upgradeError}</span>
              </div>
            )}

            <div className="p-3.5 bg-[#F8F9FB] rounded-2xl text-xs text-[#101828] flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[#667085]">Starts on</span>
                <span className="font-bold">
                  {currentLine.renewDate} (next renewal)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">
                  {modalPlanRegularPrice > modalPlanPromoPrice
                    ? "First 3 months"
                    : "Monthly price"}
                </span>
                <span className="font-bold text-[#E01C5B]">
                  £{modalPlanPromoPrice.toFixed(2)} / month
                </span>
              </div>
              {modalPlanRegularPrice > modalPlanPromoPrice && (
                <div className="flex justify-between">
                  <span className="text-[#667085]">
                    From {schedule.standardPriceFormatted}
                  </span>
                  <span className="font-bold">
                    £{modalPlanRegularPrice.toFixed(2)} / month
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#667085]">Data allowance</span>
                <span className="font-bold">{modalPlanAllowance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Contract</span>
                <span className="font-bold">Monthly rolling · £0 exit fee</span>
              </div>
            </div>

            <p className="text-[11px] text-[#667085] leading-relaxed">
              Your current {currentLine.planName} allowance continues until{" "}
              {currentLine.renewDate}. You can cancel or change your scheduled
              upgrade any time before renewal.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E4E7EC] text-xs font-bold text-[#667085] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpgrading}
                onClick={handleConfirmUpgrade}
                className="px-5 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#C81650] text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scheduling upgrade...</span>
                  </>
                ) : (
                  "Confirm upgrade"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Personalisation Info Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FDF2F6] flex items-center justify-center text-[#E01C5B]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828]">
                    How we choose & order offers
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Transparent UK pricing & privacy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#667085] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#667085] flex flex-col gap-2.5 leading-relaxed">
              <p>
                <strong className="text-[#101828]">Eligibility check:</strong>{" "}
                We only show offers that can be activated on{" "}
                <strong className="text-[#101828]">{currentLine.number}</strong>{" "}
                ({currentLine.planName}).
              </p>
              <p>
                <strong className="text-[#101828]">Personalised order:</strong>{" "}
                When enabled, we order the same catalogue using your current
                plan allowance, renewal date, and included roaming zones.
                Turning it off shows the exact same offers in alphabetical
                order.
              </p>
              <p>
                <strong className="text-[#101828]">Up-front terms:</strong>{" "}
                Every offer shows its promotional price, when the standard price
                resumes, and the exact UK end time.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-bold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

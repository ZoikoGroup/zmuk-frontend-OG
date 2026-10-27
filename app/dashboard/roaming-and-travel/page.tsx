"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  Info,
  Plane,
  Search,
  Calendar,
  Ticket,
  Wallet,
  Plus,
  BarChart2,
  Table,
  MapPin,
  Flag,
  Settings,
  Signal,
  Gauge,
  Bell,
  Map,
  Lock,
  Zap,
  Wrench,
  Headphones,
  Check,
  MessageSquare,
  X,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import {
  BoosterModal,
  ReportActivityModal,
  ComparePlansModal,
} from "../components/DashboardModals";

// Real BeQuick API Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import beQuick from "../../utils/dasdbeQuickApi";
import {
  getFallbackUserLine,
  getBoosterSummary,
  recordBoosterPurchase,
} from "../../utils/dashboardSync";
import { validateSpendLimit } from "../../utils/validators";

export interface RoamingLineRecord {
  id: string;
  number: string;
  planName: string;
  status: string;
  renewDate: string;
  roamingEnabled: boolean;
  totalDataGb: number;
  euFairUseLimitGb: number;
  euFairUseRemainingGb: number;
  euUsedGb: number;
  roamingCallsMins: number;
  roamingTextsCount: number;
  billingPeriodLabel: string;
}

export interface DestinationConfig {
  id: string;
  name: string;
  zone: string;
  isEuIncluded: boolean;
  dataRate: string;
  callsMadeRate: string;
  callsReceivedRate: string;
  textsSentRate: string;
  hasTravelPass: boolean;
  passes: {
    id: string;
    title: string;
    subtitle: string;
    price: number;
    priceUnit: string;
    bullets: { icon: "check" | "clock" | "info"; text: string }[];
  }[];
}

export interface ActiveTravelPass {
  id: string;
  title: string;
  destination: string;
  price: number;
  purchasedAt: string;
}

const DESTINATIONS_CATALOG: DestinationConfig[] = [
  {
    id: "us",
    name: "United States",
    zone: "Zone 4 (North America)",
    isEuIncluded: false,
    dataRate: "£0.0800 per MB (8p/MB)",
    callsMadeRate: "£0.065 per min (6.5p/min)",
    callsReceivedRate: "£0.390 per min (39p/min)",
    textsSentRate: "£0.35 each (35p)",
    hasTravelPass: true,
    passes: [
      {
        id: "world-day-pass-us",
        title: "World Day Pass",
        subtitle: "United States, Canada",
        price: 6.0,
        priceUnit: "per day used · incl. VAT",
        bullets: [
          { icon: "check", text: "Uses your UK allowance" },
          { icon: "check", text: "Each day you use your phone" },
          {
            icon: "clock",
            text: "Charged only on days you use data, calls or texts in the USA or Canada",
          },
          {
            icon: "info",
            text: "Fair use 2 GB a day · Auto-renews: No — remove it any time",
          },
        ],
      },
      {
        id: "usa-canada-7d",
        title: "USA & Canada 7-day pass",
        subtitle: "United States, Canada",
        price: 15.0,
        priceUnit: "one-off · incl. VAT",
        bullets: [
          { icon: "check", text: "5 GB data · 300 mins · 300 texts" },
          { icon: "check", text: "7 days" },
          {
            icon: "clock",
            text: "Starts when you first use your phone in the USA or Canada. Must start within 30 days.",
          },
          {
            icon: "info",
            text: "Calls and texts to UK, US and Canadian numbers · Auto-renews: No",
          },
        ],
      },
    ],
  },
  {
    id: "fr",
    name: "France",
    zone: "Zone 2 (EU & EEA)",
    isEuIncluded: true,
    dataRate: "Included (Overage: £0.0160/MB)",
    callsMadeRate: "Included in UK allowance",
    callsReceivedRate: "Free (£0.00)",
    textsSentRate: "Included in UK allowance",
    hasTravelPass: true,
    passes: [
      {
        id: "eu-fair-use-boost",
        title: "EU Extra 5GB Booster",
        subtitle: "All 27 EU & EEA destinations",
        price: 5.0,
        priceUnit: "one-off · incl. VAT",
        bullets: [
          { icon: "check", text: "Adds 5 GB extra EU roaming data" },
          { icon: "check", text: "Valid until your current cycle renews" },
          {
            icon: "clock",
            text: "Starts immediately once your included EU fair use allowance is reached",
          },
          {
            icon: "info",
            text: "Calls and texts remain unlimited · Auto-renews: No",
          },
        ],
      },
      {
        id: "eu-fair-use-15gb",
        title: "EU Extended 15GB Pass",
        subtitle: "All 27 EU & EEA destinations",
        price: 10.0,
        priceUnit: "one-off · incl. VAT",
        bullets: [
          { icon: "check", text: "Adds 15 GB extra EU roaming data" },
          { icon: "check", text: "30 days validity" },
          {
            icon: "clock",
            text: "Activates on first data session abroad after your included EU allowance",
          },
          {
            icon: "info",
            text: "High-speed 5G partner networks · Auto-renews: No",
          },
        ],
      },
    ],
  },
  {
    id: "es",
    name: "Spain",
    zone: "Zone 2 (EU & EEA)",
    isEuIncluded: true,
    dataRate: "Included (Overage: £0.0160/MB)",
    callsMadeRate: "Included in UK allowance",
    callsReceivedRate: "Free (£0.00)",
    textsSentRate: "Included in UK allowance",
    hasTravelPass: true,
    passes: [
      {
        id: "es-eu-boost-5gb",
        title: "EU Extra 5GB Booster",
        subtitle: "Spain & all EU/EEA destinations",
        price: 5.0,
        priceUnit: "one-off · incl. VAT",
        bullets: [
          { icon: "check", text: "Adds 5 GB extra EU roaming data" },
          { icon: "check", text: "Valid until your current cycle renews" },
          {
            icon: "clock",
            text: "Starts immediately once your included EU fair use allowance is reached",
          },
          {
            icon: "info",
            text: "Calls and texts remain unlimited · Auto-renews: No",
          },
        ],
      },
      {
        id: "es-eu-boost-15gb",
        title: "EU Extended 15GB Pass",
        subtitle: "Spain & all EU/EEA destinations",
        price: 10.0,
        priceUnit: "one-off · incl. VAT",
        bullets: [
          { icon: "check", text: "Adds 15 GB extra EU roaming data" },
          { icon: "check", text: "30 days validity" },
          {
            icon: "clock",
            text: "Activates on first data session abroad after your included EU allowance",
          },
          {
            icon: "info",
            text: "High-speed 5G partner networks · Auto-renews: No",
          },
        ],
      },
    ],
  },
  {
    id: "tr",
    name: "Türkiye",
    zone: "Zone 2 (Non-EU Europe)",
    isEuIncluded: false,
    dataRate: "£0.0160 per MB (1.6p/MB)",
    callsMadeRate: "£0.065 per min (6.5p/min)",
    callsReceivedRate: "£0.052 per min (5.2p/min)",
    textsSentRate: "£0.10 each (10p)",
    hasTravelPass: true,
    passes: [
      {
        id: "tr-day-pass",
        title: "World Day Pass",
        subtitle: "Türkiye & 45+ global destinations",
        price: 6.0,
        priceUnit: "per day used · incl. VAT",
        bullets: [
          { icon: "check", text: "Uses your UK allowance" },
          { icon: "check", text: "Each day you use your phone" },
          {
            icon: "clock",
            text: "Charged only on days you use data, calls or texts in Türkiye",
          },
          {
            icon: "info",
            text: "Fair use 2 GB a day · Auto-renews: No — remove it any time",
          },
        ],
      },
      {
        id: "tr-7d-pass",
        title: "Türkiye 7-day Holiday Pass",
        subtitle: "Türkiye",
        price: 14.0,
        priceUnit: "one-off · incl. VAT",
        bullets: [
          { icon: "check", text: "5 GB data · 250 mins · 250 texts" },
          { icon: "check", text: "7 days" },
          {
            icon: "clock",
            text: "Starts when you first use your phone in Türkiye. Must start within 30 days.",
          },
          {
            icon: "info",
            text: "Calls and texts to UK and Turkish numbers · Auto-renews: No",
          },
        ],
      },
    ],
  },
  {
    id: "in",
    name: "India",
    zone: "Zone 3 (Asia Pacific & Subcontinent)",
    isEuIncluded: false,
    dataRate: "£0.0320 per MB (3.2p/MB)",
    callsMadeRate: "£0.065 per min (6.5p/min)",
    callsReceivedRate: "£0.033 per min (3.3p/min)",
    textsSentRate: "£0.16 each (16p)",
    hasTravelPass: false,
    passes: [],
  },
  {
    id: "ae",
    name: "United Arab Emirates",
    zone: "Zone 5 (Middle East & North Africa)",
    isEuIncluded: false,
    dataRate: "£1.0900 per MB (£1.09/MB)",
    callsMadeRate: "£0.520 per min (52p/min)",
    callsReceivedRate: "£1.170 per min",
    textsSentRate: "£0.70 each (70p)",
    hasTravelPass: false,
    passes: [],
  },
];

function CountryFlagBadge({
  countryId,
  size = "sm",
}: {
  countryId: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-9 h-6 rounded-[5px]" : "w-5 h-3.5 rounded-[3px]";

  if (countryId === "fr") {
    return (
      <span
        className={`${dim} inline-flex overflow-hidden shadow-[0px_0px_0px_1px_rgba(18,27,52,0.08)] shrink-0`}
      >
        <span className="w-1/3 h-full bg-[#244AA5]" />
        <span className="w-1/3 h-full bg-white" />
        <span className="w-1/3 h-full bg-[#E03232]" />
      </span>
    );
  }
  if (countryId === "es") {
    return (
      <span
        className={`${dim} inline-flex flex-col overflow-hidden shadow-[0px_0px_0px_1px_rgba(18,27,52,0.08)] shrink-0`}
      >
        <span className="w-full h-1/4 bg-[#C60B1E]" />
        <span className="w-full h-2/4 bg-[#FFC400]" />
        <span className="w-full h-1/4 bg-[#C60B1E]" />
      </span>
    );
  }
  if (countryId === "in") {
    return (
      <span className={`${dim} inline-flex flex-col overflow-hidden shadow-[0px_0px_0px_1px_rgba(18,27,52,0.08)] shrink-0`}>
        <span className="w-full h-1/3 bg-[#FF9933]" />
        <span className="w-full h-1/3 bg-white flex items-center justify-center">
          <span className="w-1 h-1 rounded-full bg-[#000080]" />
        </span>
        <span className="w-full h-1/3 bg-[#138808]" />
      </span>
    );
  }
  if (countryId === "ae") {
    return (
      <span className={`${dim} relative inline-flex overflow-hidden shadow-[0px_0px_0px_1px_rgba(18,27,52,0.08)] shrink-0`}>
        <span className="w-1/4 h-full bg-[#FF0000]" />
        <span className="flex-1 flex flex-col h-full">
          <span className="w-full h-1/3 bg-[#00732F]" />
          <span className="w-full h-1/3 bg-white" />
          <span className="w-full h-1/3 bg-black" />
        </span>
      </span>
    );
  }
  if (countryId === "tr") {
    return (
      <span
        className={`${dim} relative inline-flex items-center justify-center bg-[#E30A17] overflow-hidden shadow-[0px_0px_0px_1px_rgba(18,27,52,0.08)] shrink-0`}
      >
        <span className="w-2 h-2 rounded-full bg-white" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#E30A17] -ml-1" />
      </span>
    );
  }
  // Default US Flag
  return (
    <span
      className={`${dim} relative inline-flex flex-col justify-between bg-white overflow-hidden shadow-[0px_0px_0px_1px_rgba(18,27,52,0.08)] shrink-0`}
    >
      {[0, 1, 2, 3, 4, 5, 6].map((stripe) => (
        <span key={stripe} className="w-full h-[1.5px] bg-[#CA2B37]" />
      ))}
      <span className="w-[45%] h-[55%] bg-[#203B7E] absolute left-0 top-0" />
    </span>
  );
}

function formatUkNumber(mdn?: string | number): string {
  if (!mdn) return "Pending number";
  let s = String(mdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return String(mdn);
}

function niceStatus(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "Active";
    case "inactive":
    case "paused":
    case "suspended":
      return "Paused";
    case "cancelled":
    case "terminated":
      return "Inactive";
    case "draft":
    case "pending":
      return "Pending";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Active";
  }
}

export default function RoamingAndTravelPage() {
  const router = useRouter();

  // ── Dynamic User & Auth State ──
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Account holder");
  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Navigation & Header State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("roaming");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ── Dynamic Lines & Selection State ──
  const [lines, setLines] = useState<RoamingLineRecord[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState<boolean>(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  const [freshnessTime, setFreshnessTime] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ── Destination Checker State ──
  const [selectedCountryId, setSelectedCountryId] = useState<string>("us");
  const [countrySearchText, setCountrySearchText] = useState<string>("United States");
  const [countrySearchFocused, setCountrySearchFocused] = useState<boolean>(false);
  const [travelDate, setTravelDate] = useState<string>(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().split("T")[0];
  });
  const [travelDateError, setTravelDateError] = useState<string>("");

  // ── Roaming Usage & Passes State ──
  const [usageRange, setUsageRange] = useState<"7d" | "30d">("7d");
  const [usageRangeDropdownOpen, setUsageRangeDropdownOpen] = useState<boolean>(false);
  const [usageTypeTab, setUsageTypeTab] = useState<"data" | "calls" | "texts">("data");
  const [showUsageTable, setShowUsageTable] = useState<boolean>(false);
  const [activePassesByLine, setActivePassesByLine] = useState<Record<string, ActiveTravelPass[]>>(
    {}
  );

  // ── Bill Limit & Alerts State ──
  const [billLimit, setBillLimit] = useState<number>(100);
  const [billLimitModalOpen, setBillLimitModalOpen] = useState<boolean>(false);
  const [tempBillLimit, setTempBillLimit] = useState<string>("100.00");
  const [billLimitError, setBillLimitError] = useState<string>("");

  const [alertsModalOpen, setAlertsModalOpen] = useState<boolean>(false);
  const [extraSmsAlertAt80, setExtraSmsAlertAt80] = useState<boolean>(true);
  const [extraEmailAlert, setExtraEmailAlert] = useState<boolean>(true);

  // ── Interactive Modals ──
  const [boosterOpen, setBoosterOpen] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [comparePlansOpen, setComparePlansOpen] = useState<boolean>(false);

  const [guideModal, setGuideModal] = useState<{
    title: string;
    subtitle: string;
    steps: string[];
  } | null>(null);

  const [buyPassModal, setBuyPassModal] = useState<{
    id: string;
    title: string;
    subtitle: string;
    price: number;
    priceUnit: string;
  } | null>(null);
  const [passPurchaseError, setPassPurchaseError] = useState<string>("");
  const [isBuyingPass, setIsBuyingPass] = useState<boolean>(false);

  const [queryRoamingModalOpen, setQueryRoamingModalOpen] = useState<boolean>(false);
  const [queryRoamingNote, setQueryRoamingNote] = useState<string>("");
  const [queryError, setQueryError] = useState<string>("");
  const [isSubmittingQuery, setIsSubmittingQuery] = useState<boolean>(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);

  const destinationSectionRef = useRef<HTMLDivElement>(null);
  const passesSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    router.push("/login");
  };

  // Close line dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (lineDropdownRef.current && !lineDropdownRef.current.contains(e.target as Node)) {
        setLineDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Load saved bill limit & passes from localStorage
  useEffect(() => {
    try {
      const savedLimit = localStorage.getItem("zoiko_bill_limit");
      if (savedLimit && !isNaN(Number(savedLimit))) {
        setBillLimit(Number(savedLimit));
        setTempBillLimit(Number(savedLimit).toFixed(2));
      } else {
        const savedSettings = localStorage.getItem("zoiko_billing_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (typeof parsed.billLimit === "number") {
            setBillLimit(parsed.billLimit);
            setTempBillLimit(parsed.billLimit.toFixed(2));
          }
        }
      }
      const savedPasses = localStorage.getItem("zoiko_roaming_passes");
      if (savedPasses) {
        setActivePassesByLine(JSON.parse(savedPasses));
      }
    } catch {}
  }, []);

  // ── Fetch 100% Dynamic Lines & Roaming Balances from Django & BeQuick APIs ──
  const loadRoamingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      setFreshnessTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
          " BST, " +
          now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      );

      const token =
        localStorage.getItem("zoiko_token") ||
        localStorage.getItem("driverx_token") ||
        "";
      const rawUser =
        localStorage.getItem("zoiko_user") ||
        localStorage.getItem("driverx_user");

      const userData = rawUser ? JSON.parse(rawUser) : null;
      const email: string = userData?.email || "";
      const fullName =
        [userData?.first_name, userData?.last_name].filter(Boolean).join(" ").trim() ||
        userData?.name ||
        userData?.username ||
        (email ? email.split("@")[0] : "Account Member");

      setUserName(fullName);
      if (userData?.role) setUserRole(String(userData.role));

      setLines([]);
      setSelectedLineId("");

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      // Fetch live catalogue plans from Django so we can resolve plan data allowances
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cataloguePlans: any[] = [];
      try {
        const plansRes = await fetch(`${API_BASE}/api/plans/v1/`);
        if (plansRes.ok) {
          const pData = await plansRes.json();
          if (Array.isArray(pData)) cataloguePlans = pData;
        }
      } catch {}

      if (!token && !email) {
        setIsLoading(false);
        return;
      }

      let foundSubscriberId: string | number | null = userData?.subscriber_id || null;

      // 1. Check Django bqorders for subscriber_id
      if (token && email) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ logged_user: email }),
          });
          if (res.ok) {
            const data = await res.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userGroups = (data.groups?.[email] || {}) as Record<string, any[]>;
            for (const [, entries] of Object.entries(userGroups)) {
              const entry = entries?.[0];
              if (!entry) continue;
              if (!foundSubscriberId && entry.subscriber_id) {
                foundSubscriberId = entry.subscriber_id;
              }
            }
          }
        } catch (e) {
          console.warn("Could not query Django bqorders:", e);
        }
      }

      // 2. Query BeQuick subscriber by email if not found in Django
      if (!foundSubscriberId && email) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subRes = (await beQuick.getSubscriberByEmail(email)) as any;
          if (subRes && subRes.subscriber_id) {
            foundSubscriberId = subRes.subscriber_id;
          }
        } catch (e) {
          console.warn("Could not query BeQuick subscriber:", e);
        }
      }

      // 3. Fetch subscriber details & live lines + service_balances
      if (foundSubscriberId) {
        setSubscriberId(foundSubscriberId);

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subDetails = (await beQuick.getSubscriberDetails(foundSubscriberId)) as any;
          const subObj =
            subDetails?.subscriber || subDetails?.subscribers?.[0] || subDetails;
          if (subObj) {
            const bqName = [subObj.first_name, subObj.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();
            if (bqName) setUserName(bqName);
          }
        } catch {}

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bqLines = ((await beQuick.getUserLines(foundSubscriberId)) || []) as any[];
          if (bqLines && bqLines.length > 0) {
            const loadedLines: RoamingLineRecord[] = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              bqLines.map(async (line: any) => {
                const lineId = String(line.id);
                let planName = line.device_name || line.plan_name || "Zoiko Mobile Plan";
                let renewDate = "—";
                let billingPeriodLabel = "Current billing period";
                const status = niceStatus(line.status);

                let totalDataGb = 0;
                let euFairUseLimitGb = 0;
                let euFairUseRemainingGb = 0;
                let euUsedGb = 0;
                const roamingCallsMins = 0;
                const roamingTextsCount = 0;

                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const details = (await beQuick.getPlanDetails(line.id, true)) as any;
                  const currentPlan = details?.current_plans?.[0];
                  if (currentPlan?.name) {
                    planName = currentPlan.name;
                  }

                  if (details?.service_period?.end_at) {
                    const endDt = new Date(details.service_period.end_at);
                    if (!isNaN(endDt.getTime())) {
                      renewDate = endDt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      });
                    }
                  }
                  if (details?.service_period?.start_at) {
                    const startDt = new Date(details.service_period.start_at);
                    if (!isNaN(startDt.getTime())) {
                      const sStr = startDt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      });
                      const eStr = now.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      });
                      billingPeriodLabel = `This billing period · ${sStr} – ${eStr}`;
                    }
                  }
                } catch {}

                // Parse total GB from plan name or catalogue plan
                const gbMatch = planName.match(/(\d+)\s*GB/i);
                if (gbMatch) {
                  totalDataGb = Number(gbMatch[1]);
                } else {
                  const matchedCatalogue = cataloguePlans.find(
                    (cp) =>
                      cp.name?.toLowerCase() === planName.toLowerCase() ||
                      planName.toLowerCase().includes(cp.name?.toLowerCase() || "___")
                  );
                  if (matchedCatalogue?.data_allowance) {
                    const m2 = String(matchedCatalogue.data_allowance).match(/(\d+)/);
                    if (m2) totalDataGb = Number(m2[1]);
                  }
                }

                // Fetch real line service balances
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const bucketsRes = (await beQuick.getLineBuckets(line.id)) as any;
                  const balances =
                    bucketsRes?.service_balances ||
                    bucketsRes?.balances ||
                    bucketsRes?.data ||
                    [];
                  if (Array.isArray(balances) && balances.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    balances.forEach((b: any) => {
                      const bType = String(b.service_type || b.name || "").toLowerCase();
                      const totalRaw = Number(b.total_units || b.initial_amount || 0);
                      const remRaw = Number(b.remaining_units || b.remaining_amount || 0);
                      const usedRaw = Math.max(0, totalRaw - remRaw);

                      if (bType.includes("roam") && bType.includes("data")) {
                        euFairUseLimitGb = Number((totalRaw / (1024 * 1024 * 1024)).toFixed(1));
                        euFairUseRemainingGb = Number((remRaw / (1024 * 1024 * 1024)).toFixed(1));
                        euUsedGb = Number((usedRaw / (1024 * 1024 * 1024)).toFixed(2));
                      } else if (bType.includes("data") && totalDataGb === 0 && totalRaw > 0) {
                        totalDataGb = Number((totalRaw / (1024 * 1024 * 1024)).toFixed(1));
                      }
                    });
                  }
                } catch {}

                if (euFairUseLimitGb === 0 && totalDataGb > 0) {
                  euFairUseLimitGb = Math.min(15, Number((totalDataGb * 0.5).toFixed(1)));
                  euFairUseRemainingGb = Number(
                    Math.max(0, euFairUseLimitGb - euUsedGb).toFixed(1)
                  );
                }

                return {
                  id: lineId,
                  number: formatUkNumber(line.mdn),
                  planName,
                  status,
                  renewDate,
                  roamingEnabled: status === "Active",
                  totalDataGb,
                  euFairUseLimitGb,
                  euFairUseRemainingGb,
                  euUsedGb,
                  roamingCallsMins,
                  roamingTextsCount,
                  billingPeriodLabel,
                };
              })
            );

            setLines(loadedLines);
            setUnreadNotifications(loadedLines.length);
            if (loadedLines.length > 0) {
              setSelectedLineId(loadedLines[0].id);
            }
          }
        } catch (e) {
          console.warn("Error fetching lines for roaming page:", e);
        }
      }

      // If no BeQuick telecom lines were returned, check fallback
      setLines((current) => {
        if (current.length === 0) {
          const fallback = getFallbackUserLine(userData);
          if (!fallback) {
            setSelectedLineId("");
            setUnreadNotifications(0);
            return [];
          }
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const primaryLine: RoamingLineRecord = {
            id: fallback.id,
            number: fallback.number,
            planName: fallback.planName,
            status: "Active",
            renewDate: nextMonth.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            roamingEnabled: true,
            totalDataGb: fallback.planGb,
            euFairUseLimitGb: Math.min(25, fallback.planGb),
            euFairUseRemainingGb: Number(
              (Math.min(25, fallback.planGb) - 3.8).toFixed(1)
            ),
            euUsedGb: 3.8,
            roamingCallsMins: 45,
            roamingTextsCount: 22,
            billingPeriodLabel: "Current billing cycle",
          };
          setSelectedLineId(primaryLine.id);
          setUnreadNotifications(1);
          return [primaryLine];
        }
        return current;
      });
    } catch (err) {
      console.error("Failed to load dynamic roaming data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoamingData();
    const handleSync = () => loadRoamingData();
    window.addEventListener("zoiko-booster-updated", handleSync);
    window.addEventListener("zoiko-auth", handleSync);
    return () => {
      window.removeEventListener("zoiko-booster-updated", handleSync);
      window.removeEventListener("zoiko-auth", handleSync);
    };
  }, [loadRoamingData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadRoamingData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Roaming status & network permissions refreshed", "info");
    }, 350);
  };

  // ── Current Selected Line & Destination ──
  const currentLine = useMemo<RoamingLineRecord>(() => {
    const found = lines.find((l) => l.id === selectedLineId) || lines[0];
    if (found) return found;
    return {
      id: "none",
      number: "No active number",
      planName: "No active plan",
      status: "Inactive",
      renewDate: "—",
      roamingEnabled: false,
      totalDataGb: 0,
      euFairUseLimitGb: 0,
      euFairUseRemainingGb: 0,
      euUsedGb: 0,
      roamingCallsMins: 0,
      roamingTextsCount: 0,
      billingPeriodLabel: "Current billing period",
    };
  }, [lines, selectedLineId]);

  const currentDestination = useMemo<DestinationConfig>(() => {
    return (
      DESTINATIONS_CATALOG.find((d) => d.id === selectedCountryId) ||
      DESTINATIONS_CATALOG[0]
    );
  }, [selectedCountryId]);

  const filteredCountries = useMemo(() => {
    const q = countrySearchText.trim().toLowerCase();
    if (!q) return DESTINATIONS_CATALOG;
    const matches = DESTINATIONS_CATALOG.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches : DESTINATIONS_CATALOG;
  }, [countrySearchText]);

  const formattedTravelDateLabel = useMemo(() => {
    if (!travelDate) return "upcoming travel";
    const dt = new Date(travelDate);
    if (isNaN(dt.getTime())) return travelDate;
    return dt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [travelDate]);

  const activeLinePasses = useMemo(() => {
    return activePassesByLine[currentLine.id] || [];
  }, [activePassesByLine, currentLine.id]);

  // Build 7-day timeline bars anchored to today
  const sevenDayUsageTimeline = useMemo(() => {
    const days: { dateLabel: string; isToday: boolean; gbUsed: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      days.push({
        dateLabel: label,
        isToday: i === 0,
        gbUsed: i === 0 ? currentLine.euUsedGb : 0,
      });
    }
    return days;
  }, [currentLine.euUsedGb]);

  const euFairUseProgressPct = useMemo(() => {
    if (currentLine.euFairUseLimitGb <= 0) return 0;
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (currentLine.euFairUseRemainingGb / currentLine.euFairUseLimitGb) * 100
        )
      )
    );
  }, [currentLine.euFairUseRemainingGb, currentLine.euFairUseLimitGb]);

  const hasActiveLine = useMemo(() => {
    return Boolean(
      currentLine.id &&
      currentLine.id !== "none" &&
      currentLine.number !== "No active number" &&
      currentLine.status !== "Inactive"
    );
  }, [currentLine]);

  // Handlers
  const handleSelectCountry = (dest: DestinationConfig) => {
    setSelectedCountryId(dest.id);
    setCountrySearchText(dest.name);
    setCountrySearchFocused(false);
  };

  const handleTravelDateChange = (val: string) => {
    setTravelDate(val);
    if (!val) {
      setTravelDateError("Please select a travel date.");
      return;
    }
    const sel = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sel < today) {
      setTravelDateError("Travel date cannot be in the past.");
    } else {
      setTravelDateError("");
    }
  };

  const handleInitiateBuyPass = (pass: {
    id: string;
    title: string;
    subtitle: string;
    price: number;
    priceUnit: string;
  }) => {
    if (!hasActiveLine) {
      showToast("Please activate a SIM line before purchasing a travel pass.", "info");
      return;
    }
    setPassPurchaseError("");
    setBuyPassModal(pass);
  };

  const handleConfirmBuyPass = async () => {
    if (!buyPassModal) return;
    if (!hasActiveLine) {
      showToast("You need an active SIM line to purchase a travel pass.", "info");
      setBuyPassModal(null);
      return;
    }

    if (buyPassModal.price > billLimit) {
      setPassPurchaseError(
        `This pass costs £${buyPassModal.price.toFixed(2)}, which exceeds your current monthly bill limit of £${billLimit.toFixed(2)}. Please increase your bill limit first.`
      );
      return;
    }

    setIsBuyingPass(true);
    setPassPurchaseError("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: "roaming",
            subject: `Travel Pass Purchase: ${buyPassModal.title} for ${currentLine.number}`,
            message: `User purchased ${buyPassModal.title} (£${buyPassModal.price.toFixed(2)}) for destination ${buyPassModal.subtitle}.\nLine: ${currentLine.number} (ID: ${currentLine.id}).`,
          }),
        }).catch(() => {});
      }

      const newPass: ActiveTravelPass = {
        id: `${buyPassModal.id}-${Date.now()}`,
        title: buyPassModal.title,
        destination: buyPassModal.subtitle,
        price: buyPassModal.price,
        purchasedAt: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      };
      const nextMap = {
        ...activePassesByLine,
        [currentLine.id]: [...(activePassesByLine[currentLine.id] || []), newPass],
      };
      setActivePassesByLine(nextMap);
      try {
        localStorage.setItem("zoiko_roaming_passes", JSON.stringify(nextMap));
      } catch {}
      setBuyPassModal(null);
      showToast(
        `Added ${buyPassModal.title} (£${buyPassModal.price.toFixed(2)}) to ${currentLine.number}!`,
        "success"
      );
    } catch {
      setPassPurchaseError("Unable to activate pass. Please try again or contact support.");
    } finally {
      setIsBuyingPass(false);
    }
  };

  const handleSaveBillLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateSpendLimit(tempBillLimit);
    if (!check.isValid) {
      setBillLimitError(check.error || "Please enter a valid limit.");
      showToast(check.error || "Please enter a valid limit.", "info");
      return;
    }
    const val = check.amount ?? 0;
    if (val > 100) {
      setBillLimitError("Monthly spend cap cannot exceed £100.00.");
      return;
    }
    setBillLimitError("");
    setBillLimit(val);
    try {
      localStorage.setItem("zoiko_bill_limit", String(val));
      const existing = localStorage.getItem("zoiko_billing_settings");
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        "zoiko_billing_settings",
        JSON.stringify({ ...parsed, billLimit: val })
      );
    } catch {}
    setBillLimitModalOpen(false);
    showToast(`Monthly mobile bill limit updated to £${val.toFixed(2)}`, "success");
  };

  const handleSubmitRoamingQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActiveLine) {
      showToast("You need an active line to query roaming charges.", "info");
      return;
    }
    if (!queryRoamingNote.trim() || queryRoamingNote.trim().length < 10) {
      setQueryError("Please provide at least 10 characters describing your query.");
      showToast("Please provide at least 10 characters describing your query.", "info");
      return;
    }
    if (queryRoamingNote.trim().length > 1000) {
      setQueryError("Query text cannot exceed 1000 characters.");
      return;
    }

    setQueryError("");
    setIsSubmittingQuery(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
      const refCode = `ZM-ROAM-${Math.floor(100000 + Math.random() * 900000)}`;

      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: "billing",
            subject: `Roaming Charge Query for ${currentLine.number} (${refCode})`,
            message: `User query on roaming charges for line ${currentLine.number} (${currentLine.billingPeriodLabel}):\n\n${queryRoamingNote.trim()}`,
          }),
        }).catch(() => {});
      }

      setQueryRoamingModalOpen(false);
      setQueryRoamingNote("");
      showToast(`Roaming query submitted. Case reference: ${refCode}`, "success");
    } catch {
      setQueryError("Could not submit query. Please try again or contact support.");
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEEEF0] font-sans text-[#0D1935] p-3 sm:p-5">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0D1935] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Main Container Layout — Identical Sticky Sidebar Frame */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Left Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            numbersCount={lines.length}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenComparePlans={() => setComparePlansOpen(true)}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            onOpenAddNumber={() => router.push("/dashboard/my-mobile-numbers")}
            planName={currentLine.planName}
            renewDate={currentLine.renewDate}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Navigation Header */}
          <DashboardTopNav
            userName={userName || "Account Holder"}
            userRole={userRole}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unreadNotifications={unreadNotifications}
            onClearNotifications={() => setUnreadNotifications(0)}
            onLogout={handleLogout}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Roaming & travel"
            customSubtitle="Check your destination's roaming rates and options before you travel."
          />

          {/* Sub-header Control Bar: Freshness Status (left) + Line Selector (right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Roaming status checked time + Refresh button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#54617E]">
                <Clock className="w-3.5 h-3.5 text-[#54617E]" />
                <span>Roaming status checked {freshnessTime}</span>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Refresh roaming status"
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing || isLoading ? "animate-spin text-[#E01C5B]" : ""
                  }`}
                />
              </button>
            </div>

            {/* Right: "Roaming for" White Card Selector */}
            <div className="relative" ref={lineDropdownRef}>
              <button
                type="button"
                onClick={() => setLineDropdownOpen(!lineDropdownOpen)}
                className="min-h-14 pl-3 pr-3.5 py-1.5 bg-white rounded-2xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] inline-flex items-center gap-3 hover:border-slate-300 transition cursor-pointer text-left"
              >
                <div className="w-6 h-8 flex items-center justify-center text-[#1E2D4D] shrink-0">
                  <Smartphone className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="min-w-0 sm:min-w-[230px] pr-2 sm:pr-4">
                  <div className="text-xs font-normal text-[#54617E] leading-4">
                    Roaming for
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#0D1935] leading-5">
                    {currentLine.number} · {currentLine.planName}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#54617E] shrink-0 ml-auto transition-transform ${
                    lineDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {lineDropdownOpen && lines.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30">
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#54617E] uppercase tracking-wider border-b border-slate-100">
                    Select mobile number ({lines.length})
                  </div>
                  {lines.map((ln) => {
                    const isSel = ln.id === currentLine.id;
                    return (
                      <button
                        key={ln.id}
                        type="button"
                        onClick={() => {
                          setSelectedLineId(ln.id);
                          setLineDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          isSel ? "bg-[#E01C5B]/5" : ""
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#0D1935]">
                            {ln.number}
                          </div>
                          <div className="text-[11px] text-[#54617E]">{ln.planName}</div>
                        </div>
                        {isSel && <Check className="w-4 h-4 text-[#E01C5B]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── HERO BANNER: "Travelling soon?" ── */}
          <div className="relative min-h-32 px-6 py-5 rounded-[20px] bg-gradient-to-r from-[#0D1935] via-[#152852] to-[#1D2449] flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden shadow-xs">
            {/* Right scenic coastal travel backdrop */}
            <div
              className="hidden md:block absolute right-0 top-0 bottom-0 w-[48%] bg-cover bg-center opacity-90"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #152852 0%, rgba(21,40,82,0.15) 28%, rgba(21,40,82,0) 100%), url('https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80')",
              }}
            />

            <div className="relative z-10 max-w-[540px] flex flex-col gap-2">
              <h2 className="text-white text-xl font-extrabold leading-7">
                Travelling soon?
              </h2>
              <p className="text-white/85 text-sm font-normal leading-5">
                Check what&apos;s included for {currentLine.number}, what it costs, and
                how to keep spending under control — before you go.
              </p>
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <span className="h-6 px-2.5 bg-white/15 rounded-full inline-flex items-center gap-1.5 text-white text-xs font-semibold">
                  <MessageSquare className="w-3 h-3 text-white" />
                  <span>We text you the charges when you arrive</span>
                </span>
                <span className="h-6 px-2.5 bg-white/15 rounded-full inline-flex items-center gap-1.5 text-white text-xs font-semibold">
                  <Gauge className="w-3 h-3 text-white" />
                  <span>Your £{billLimit.toFixed(2)} bill limit still applies</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── ROW 1: 3-Column Grid (International roaming [3] + Check a destination [5] + Your roaming balance [4]) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Card 1: International roaming (Solid Pink Card, lg:col-span-3) */}
            <div className="lg:col-span-3 p-5 relative bg-[#E01C5B] rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-4 overflow-hidden text-white">
              {/* Top-right 6x3 decorative dot matrix */}
              <div className="w-24 h-12 right-[16px] top-[19px] absolute opacity-10 inline-flex flex-col justify-start items-start gap-2.5 pointer-events-none">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="self-stretch inline-flex justify-between items-center">
                    {[0, 1, 2, 3, 4, 5].map((col) => (
                      <div key={col} className="w-1 h-1 bg-white rounded-full" />
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-lg font-bold leading-6">
                      International roaming
                    </h3>
                    <span className="text-white/80 text-xs font-normal leading-4">
                      Your line&apos;s network permission
                    </span>
                  </div>
                </div>

                {/* White Inner Line Box */}
                <div className="px-3.5 py-3 bg-white rounded-2xl flex items-center gap-3 text-[#0D1935]">
                  <Smartphone className="w-5 h-6 text-[#1E2D4D] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#0D1935] text-base font-bold leading-5 truncate">
                      {currentLine.number}
                    </span>
                    <span className="text-[#54617E] text-xs font-normal leading-4 truncate">
                      {currentLine.planName}
                    </span>
                  </div>
                </div>

                {/* Availability Status */}
                <div className="pt-1 flex items-start gap-2.5">
                  <div className="w-9 h-9 bg-white/15 rounded-[10px] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-white text-base font-extrabold leading-5">
                      {currentLine.roamingEnabled
                        ? "Roaming available for this line"
                        : "No active line selected"}
                    </div>
                    <span className="text-white/85 text-xs font-normal leading-4">
                      Verified {freshnessTime}.
                    </span>
                  </div>
                </div>

                {/* Phone setting note */}
                <div className="pt-1 inline-flex items-start gap-1.5 text-white/85 text-xs leading-4">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/85" />
                  <span>
                    This isn&apos;t your phone&apos;s data roaming setting. Turn data
                    roaming on or off in your phone&apos;s settings.
                  </span>
                </div>
              </div>

              {/* Footer Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setGuideModal({
                      title: "Phone set-up guide for roaming",
                      subtitle: `For ${currentLine.number}`,
                      steps: [
                        "1. iPhone (iOS): Go to Settings → Mobile Service → Mobile Data Options → toggle Data Roaming ON when you want to use data abroad.",
                        "2. Android: Go to Settings → Network & Internet → SIMs → Zoiko Mobile → toggle Roaming ON.",
                        "3. Before boarding a flight or ferry near international waters, keep Data Roaming OFF until you arrive on land.",
                      ],
                    })
                  }
                  className="h-9 px-3.5 py-2 rounded-[10px] border border-white/55 hover:bg-white/10 inline-flex items-center gap-2 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone set-up guide</span>
                </button>
              </div>
            </div>

            {/* Card 2: Check a destination (White Card, lg:col-span-5) */}
            <div
              ref={destinationSectionRef}
              className="lg:col-span-5 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start gap-3.5"
            >
              {/* Header */}
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                    Check a destination
                  </h3>
                  <span className="text-[#54617E] text-xs font-normal leading-5">
                    What&apos;s included and what it costs for {currentLine.number}
                  </span>
                </div>
              </div>

              {/* Country Search + Travel Date Inputs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5">
                {/* Country Input */}
                <div className="flex-1 flex flex-col gap-1 relative">
                  <label className="text-[#54617E] text-xs font-normal leading-4">
                    Country
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#54617E] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={countrySearchText}
                      onFocus={() => setCountrySearchFocused(true)}
                      onBlur={() => setTimeout(() => setCountrySearchFocused(false), 180)}
                      onChange={(e) => {
                        setCountrySearchText(e.target.value);
                        const match = DESTINATIONS_CATALOG.find(
                          (c) =>
                            c.name.toLowerCase() === e.target.value.trim().toLowerCase()
                        );
                        if (match) setSelectedCountryId(match.id);
                      }}
                      placeholder="Search country..."
                      className="w-full h-10 pl-9 pr-3 py-2 bg-white rounded-xl border border-[#E5E8EF] text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                    />
                  </div>
                  {countrySearchFocused && (
                    <div className="absolute left-0 right-0 top-[62px] bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                      {filteredCountries.map((dest) => (
                        <button
                          key={dest.id}
                          type="button"
                          onMouseDown={() => handleSelectCountry(dest)}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-[#0D1935] hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <CountryFlagBadge countryId={dest.id} size="sm" />
                            <span>{dest.name}</span>
                          </div>
                          <span className="text-[11px] font-normal text-[#54617E]">
                            {dest.zone}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Travel Date Input */}
                <div className="w-full sm:w-44 flex flex-col gap-1">
                  <label className="text-[#54617E] text-xs font-normal leading-4">
                    Travel date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={travelDate}
                      onChange={(e) => handleTravelDateChange(e.target.value)}
                      className={`w-full h-10 px-3 py-2 bg-white rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
                        travelDateError
                          ? "border-red-400 bg-red-50/20 focus:border-red-500"
                          : "border-[#E5E8EF] focus:border-[#E01C5B]"
                      }`}
                    />
                  </div>
                  {travelDateError && (
                    <span className="text-[11px] text-red-600 font-medium">{travelDateError}</span>
                  )}
                </div>
              </div>

              {/* Quick Country Filter Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  DESTINATIONS_CATALOG.find((d) => d.id === "fr")!,
                  DESTINATIONS_CATALOG.find((d) => d.id === "es")!,
                  DESTINATIONS_CATALOG.find((d) => d.id === "us")!,
                  DESTINATIONS_CATALOG.find((d) => d.id === "tr")!,
                ].map((dest) => {
                  const isActive = selectedCountryId === dest.id;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => handleSelectCountry(dest)}
                      className={`h-8 pl-2 pr-3 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-semibold transition cursor-pointer border ${
                        isActive
                          ? "bg-[#FAF1F4] border-[#E01C5B] text-[#B9154B]"
                          : "bg-white border-[#E5E8EF] text-[#0D1935] hover:border-slate-300"
                      }`}
                    >
                      <CountryFlagBadge countryId={dest.id} size="sm" />
                      <span>{dest.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Country Details Box */}
              <div className="p-4 rounded-2xl border border-[#E5E8EF] flex flex-col gap-3">
                {/* Country Title + Zone + Travel pass badge */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <CountryFlagBadge countryId={currentDestination.id} size="lg" />
                    <div>
                      <h4 className="text-[#0D1935] text-lg font-extrabold leading-6">
                        {currentDestination.name}
                      </h4>
                      <span className="text-[#54617E] text-xs font-normal leading-4">
                        {currentDestination.zone} · for travel on {formattedTravelDateLabel}
                      </span>
                    </div>
                  </div>
                  {currentDestination.isEuIncluded && (
                    <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1E8E5A]/10 text-[#1E8E5A]">
                      <Ticket className="w-3 h-3" />
                      <span>Included in your plan</span>
                    </span>
                  )}
                </div>

                {/* Plan Inclusion Description */}
                <p className="text-[#3B4A68] text-sm font-normal leading-5">
                  {currentDestination.isEuIncluded
                    ? `EU roaming is included in your plan for ${currentDestination.name} up to your fair use allowance.`
                    : `Roaming isn't included in your plan for ${currentDestination.name}. Review rates before using your phone there.`}
                </p>

                {/* 2x2 Rate Cards Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 bg-[#F6F7FA] rounded-xl flex flex-col">
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Data
                    </span>
                    <span className="text-[#0D1935] text-sm font-bold leading-5">
                      {currentDestination.dataRate}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-[#F6F7FA] rounded-xl flex flex-col">
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Calls made
                    </span>
                    <span className="text-[#0D1935] text-sm font-bold leading-5">
                      {currentDestination.callsMadeRate}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-[#F6F7FA] rounded-xl flex flex-col">
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Calls received
                    </span>
                    <span className="text-[#0D1935] text-sm font-bold leading-5">
                      {currentDestination.callsReceivedRate}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-[#F6F7FA] rounded-xl flex flex-col">
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Texts sent
                    </span>
                    <span className="text-[#0D1935] text-sm font-bold leading-5">
                      {currentDestination.textsSentRate}
                    </span>
                  </div>
                </div>

                {/* Tariff Footnotes */}
                <div className="pt-1 flex flex-col gap-1.5 text-xs text-[#54617E]">
                  <div className="inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                    <span>
                      {currentDestination.isEuIncluded
                        ? "Fair use rules apply within the EU/EEA zone"
                        : "Standard rates apply without a pass"}
                    </span>
                  </div>
                  <div className="inline-flex items-start gap-1.5">
                    <FileTextIcon className="w-3.5 h-3.5 text-[#54617E] shrink-0 mt-0.5" />
                    <span>
                      Prices include VAT · data charged per KB, calls per second after the
                      first minute
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                    <span>Tariff checked {freshnessTime}</span>
                  </div>
                  <a
                    href="/roaming-and-coverage"
                    className="mt-2 pt-2 border-t border-[#E5E8EF] flex items-center justify-between text-xs font-semibold text-[#E01C5B] hover:underline"
                  >
                    <span>View all roaming zones &amp; complete country rates table</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Card 3: Your roaming balance (White Card, lg:col-span-4) */}
            <div className="lg:col-span-4 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                        Your roaming balance
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        Upcoming
                      </span>
                    </div>
                    <span className="text-[#54617E] text-xs font-normal leading-5">
                      Network records to {freshnessTime}
                    </span>
                  </div>
                </div>

                {/* Active Travel Pass Status (commented out) */}

                {/* EU Roaming Fair Use Box */}
                <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#0D1935] text-sm font-bold leading-5">
                        EU roaming in your plan
                      </span>
                      <span className="text-[#54617E] text-xs font-normal leading-4">
                        {currentLine.euFairUseLimitGb} GB fair use · counts toward your{" "}
                        {currentLine.totalDataGb} GB
                        {currentLine.renewDate !== "—"
                          ? ` · renews ${currentLine.renewDate}`
                          : ""}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[#0D1935] text-xl font-extrabold leading-6">
                        {currentLine.euFairUseRemainingGb} GB
                      </div>
                      <div className="text-[#54617E] text-xs font-bold leading-4">
                        left of {currentLine.euFairUseLimitGb} GB
                      </div>
                    </div>
                  </div>

                  {/* Green Progress Bar */}
                  <div className="w-full h-1.5 bg-[#E3E6EE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1E8E5A] rounded-full transition-all duration-300"
                      style={{ width: `${euFairUseProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Button (Add travel pass commented out) */}
            </div>
          </div>

          {/* ── ROW 2: 3 Equal Columns (Roaming usage + Where you've roamed + Roaming settings) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Card 4: Roaming usage */}
            <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3.5">
                {/* Header + Range Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                      <BarChart2 className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                          Roaming usage
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          Upcoming
                        </span>
                      </div>
                      <span className="text-[#54617E] text-xs font-normal leading-4 block">
                        Usage was last updated at {freshnessTime}
                      </span>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setUsageRangeDropdownOpen(!usageRangeDropdownOpen)}
                      className="h-9 px-3 bg-white rounded-[10px] border border-[#E5E8EF] inline-flex items-center gap-2 text-xs font-semibold text-[#0D1935] hover:border-slate-300 cursor-pointer"
                    >
                      <span>{usageRange === "7d" ? "Last 7 days" : "This billing cycle"}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#54617E]" />
                    </button>
                    {usageRangeDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setUsageRange("7d");
                            setUsageRangeDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                        >
                          <span>Last 7 days</span>
                          {usageRange === "7d" && (
                            <Check className="w-3.5 h-3.5 text-[#E01C5B]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUsageRange("30d");
                            setUsageRangeDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                        >
                          <span>This billing cycle</span>
                          {usageRange === "30d" && (
                            <Check className="w-3.5 h-3.5 text-[#E01C5B]" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data | Calls | Texts Tabs */}
                <div className="border-b border-[#E5E8EF] flex items-center gap-1">
                  {(
                    [
                      { id: "data", label: "Data" },
                      { id: "calls", label: "Calls" },
                      { id: "texts", label: "Texts" },
                    ] as const
                  ).map((tab) => {
                    const active = usageTypeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setUsageTypeTab(tab.id)}
                        className={`h-10 px-3.5 pt-2 pb-2.5 border-b-2 text-sm font-semibold transition cursor-pointer ${
                          active
                            ? "border-[#E01C5B] text-[#B9154B]"
                            : "border-transparent text-[#54617E] hover:text-[#0D1935]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Summary Stat Columns */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="text-[#0D1935] text-2xl font-extrabold leading-8">
                      {usageTypeTab === "data"
                        ? `${currentLine.euUsedGb} GB`
                        : usageTypeTab === "calls"
                        ? `${currentLine.roamingCallsMins} min`
                        : `${currentLine.roamingTextsCount}`}
                    </div>
                    <div className="text-[#54617E] text-xs font-normal leading-4">
                      used abroad · {usageRange === "7d" ? "last 7 days" : "this cycle"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#0D1935] text-2xl font-extrabold leading-8">
                      {usageTypeTab === "data"
                        ? `${currentLine.euFairUseRemainingGb} GB`
                        : "Unlimited"}
                    </div>
                    <div className="text-[#54617E] text-xs font-normal leading-4">
                      {usageTypeTab === "data"
                        ? `EU fair use left of ${currentLine.euFairUseLimitGb} GB`
                        : "within EU fair use"}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap text-xs text-[#54617E]">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#E01C5B]" />
                    <span className="text-[#3B4A68]">EU zone</span>
                  </div>
                  <span>Grey dots: no roaming that day</span>
                </div>

                {/* Chart OR Table */}
                {!showUsageTable ? (
                  <div className="relative h-36 pt-3 select-none">
                    {/* Y-Axis Grid Lines */}
                    {[
                      { label: "0.5 GB", top: "top-[12px]" },
                      { label: "0.25 GB", top: "top-[64px]" },
                      { label: "0 GB", top: "top-[116px]" },
                    ].map((axis) => (
                      <div
                        key={axis.label}
                        className={`absolute inset-x-0 ${axis.top} flex items-center`}
                      >
                        <span className="w-10 text-right pr-2 text-[9px] text-[#54617E]">
                          {axis.label}
                        </span>
                        <div className="flex-1 border-t border-[#ECEFF5]" />
                      </div>
                    ))}

                    {/* 7-day bars */}
                    <div className="absolute left-11 right-1 top-[12px] bottom-[20px] grid grid-cols-7 gap-2 items-end">
                      {sevenDayUsageTimeline.map((day) => {
                        const hasUsage = day.gbUsed > 0;
                        const pct = hasUsage
                          ? Math.min(100, Math.max(18, Math.round((day.gbUsed / 0.5) * 100)))
                          : 0;
                        return (
                          <div
                            key={day.dateLabel}
                            className="h-full flex flex-col justify-end items-center"
                          >
                            {day.isToday && (
                              <span className="text-[8px] font-bold text-[#3B5998] mb-0.5">
                                Today
                              </span>
                            )}
                            {hasUsage ? (
                              <div
                                style={{ height: `${pct}%` }}
                                className="w-4 rounded-t-xs bg-[#E01C5B]"
                              />
                            ) : day.isToday ? (
                              <div className="w-4 h-5 rounded-t-xs border border-[#96A3BE]" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C4CDDF] mb-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute left-11 right-1 bottom-0 grid grid-cols-7 gap-2 text-center">
                      {sevenDayUsageTimeline.map((day) => (
                        <span
                          key={day.dateLabel}
                          className="text-[8.5px] text-[#54617E] truncate"
                        >
                          {day.dateLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto border border-[#E5E8EF] rounded-xl divide-y divide-[#E5E8EF] text-xs">
                    {sevenDayUsageTimeline
                      .slice()
                      .reverse()
                      .map((day) => (
                        <div
                          key={day.dateLabel}
                          className="px-3 py-2 flex items-center justify-between"
                        >
                          <span className="text-[#0D1935] font-medium">
                            {day.dateLabel} {day.isToday ? "(Today)" : ""}
                          </span>
                          <span className="text-[#54617E] font-semibold">
                            {day.gbUsed.toFixed(2)} GB
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-[#54617E]">
                  <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                  <span>Roaming usage can take up to 24 hours to appear.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUsageTable(!showUsageTable)}
                  className="self-start inline-flex items-center gap-1.5 text-[#B9154B] text-xs font-semibold hover:underline cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showUsageTable ? "Show as chart" : "Show as table"}</span>
                </button>
              </div>
            </div>

            {/* Card 5: Where you've roamed */}
            <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                        Where you&apos;ve roamed
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        Upcoming
                      </span>
                    </div>
                    <span className="text-[#54617E] text-xs font-normal leading-5">
                      {currentLine.billingPeriodLabel}
                    </span>
                  </div>
                </div>

                {/* Table Header */}
                <div className="w-full">
                  <div className="grid grid-cols-12 pb-2 text-xs font-semibold text-[#54617E]">
                    <div className="col-span-4">Country</div>
                    <div className="col-span-2 text-right">Data</div>
                    <div className="col-span-3 text-right">Calls · texts</div>
                    <div className="col-span-3 text-right">Charges</div>
                  </div>

                  {currentLine.euUsedGb > 0 ? (
                    <div className="grid grid-cols-12 items-center py-4 border-t border-[#ECEFF5] text-xs">
                      <div className="col-span-4 flex items-center gap-2 font-semibold text-[#0D1935]">
                        <CountryFlagBadge countryId="es" size="sm" />
                        <span>EU Zone</span>
                      </div>
                      <div className="col-span-2 text-right text-[#0D1935]">
                        {currentLine.euUsedGb} GB
                      </div>
                      <div className="col-span-3 text-right text-[#0D1935]">
                        {currentLine.roamingCallsMins} min · {currentLine.roamingTextsCount}
                      </div>
                      <div className="col-span-3 flex flex-col items-end gap-1">
                        <span className="font-bold text-[#0D1935]">£0.00</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1E8E5A]/10 text-[#1E8E5A] text-[10px] font-semibold">
                          Included
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 border-t border-[#ECEFF5] text-xs text-[#54617E] flex items-center justify-between">
                      <span>No roaming sessions recorded this billing period</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#F6F7FA] text-[#1E8E5A] font-semibold text-[11px]">
                        £0.00
                      </span>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="inline-flex items-start gap-1.5 text-xs text-[#54617E] leading-4">
                  <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0 mt-0.5" />
                  <span>
                    From network records received {freshnessTime}. Charges are final once
                    they&apos;re on a bill. £0.00 means no charge, not &ldquo;not priced
                    yet&rdquo;.
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setQueryRoamingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[#B9154B] text-xs font-semibold hover:underline cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Query a roaming charge</span>
                </button>
              </div>
            </div>

            {/* Card 6: Roaming settings */}
            <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                      Roaming settings
                    </h3>
                    <span className="text-[#54617E] text-xs font-normal leading-5">
                      For {currentLine.number}
                    </span>
                  </div>
                </div>

                {/* 5 Settings Rows */}
                <div className="flex flex-col">
                  {/* Row 1: Data, calls & texts abroad */}
                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Data, calls & texts abroad",
                        subtitle: `Phone settings for ${currentLine.number}`,
                        steps: [
                          "1. Your Zoiko line has network permission for international roaming enabled.",
                          "2. To use mobile data abroad, enable Data Roaming in your device settings upon arrival.",
                          "3. To prevent any background data usage in non-EU countries, switch Data Roaming OFF in your phone settings and use Wi-Fi or a Travel Pass.",
                        ],
                      })
                    }
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Data, calls &amp; texts abroad
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Turned on or off in your phone&apos;s settings
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#0D1935]">
                      <span>Guide</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                    </div>
                  </button>

                  {/* Row 2: Preferred network */}
                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Preferred network selection",
                        subtitle: `For ${currentLine.number}`,
                        steps: [
                          "1. Keep Network Selection set to Automatic so your phone connects to our strongest 4G/5G partner network when you land.",
                          "2. If signal drops or data doesn't connect immediately, toggle Airplane Mode on for 10 seconds and off again.",
                          "3. You can also manually select a partner network under Settings → Mobile Network → Network Operators.",
                        ],
                      })
                    }
                    className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Signal className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Preferred network
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Automatic · choose in your phone&apos;s settings
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#0D1935]">
                      <span>Guide</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                    </div>
                  </button>

                  {/* Row 3: Mobile bill limit */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempBillLimit(billLimit.toFixed(2));
                      setBillLimitModalOpen(true);
                    }}
                    className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Gauge className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Mobile bill limit
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Covers roaming passes and charges outside your plan
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#0D1935]">
                      <span>£{billLimit.toFixed(2)}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                    </div>
                  </button>

                  {/* Row 4: Usage alerts */}
                  <button
                    type="button"
                    onClick={() => setAlertsModalOpen(true)}
                    className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Usage alerts
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Optional extra reminders
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#0D1935]">
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                    </div>
                  </button>

                  {/* Row 5: Near the border or coast */}
                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Near the border or coast",
                        subtitle: "How to avoid accidental roaming charges",
                        steps: [
                          "1. In Northern Ireland: EU roaming is included in your plan, so connecting to an Irish network won't incur extra charges within your EU fair use limit.",
                          "2. Along the English Channel coast (e.g. Dover, Folkestone) or on ferries: Your phone may pick up maritime or French networks. Switch Network Selection to Manual ('Zoiko') or turn Data Roaming OFF while at sea.",
                          "3. Near non-EU borders (e.g. Switzerland, Türkiye from Greek islands, Monaco): Set your network manually to stay on an EU partner network.",
                        ],
                      })
                    }
                    className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Map className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Near the border or coast
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Avoid roaming by accident, e.g. in Northern Ireland
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#0D1935]">
                      <span>Read</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Always Sent Lock Box */}
              <div className="p-3 bg-[#F6F7FA] rounded-xl inline-flex items-start gap-2.5 text-xs text-[#3B4A68] leading-4">
                <Lock className="w-3.5 h-3.5 text-[#3B4A68] shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold text-[#3B4A68]">Always sent:</strong> when
                  you arrive abroad, we text you the charges, what&apos;s included and how
                  to limit spend. Optional alerts can&apos;t turn this off.
                </span>
              </div>
            </div>
          </div>

          {/* ── ROW 3: 2-Column Grid (Travel passes for {Country} [8] + Quick actions [4]) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Card 7: Travel passes for Destination (commented out) */}
            {false && (
              <>
{/* Card 7: Travel passes for {Destination} (lg:col-span-8) */}
            <div
              ref={passesSectionRef}
              className="lg:col-span-8 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-4"
            >
              {/* Header */}
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                    Travel passes for {currentDestination.name}
                  </h3>
                  <span className="text-[#54617E] text-xs font-normal leading-5">
                    Only passes this number can use · select a pass to review and add to{" "}
                    {currentLine.number}
                  </span>
                </div>
              </div>

              {/* 2 Pass Cards Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                {currentDestination.passes.map((pass) => (
                  <div
                    key={pass.id}
                    className="p-4 bg-white rounded-2xl border border-[#E5E8EF] flex flex-col justify-between gap-3"
                  >
                    <div className="flex flex-col gap-2.5">
                      {/* Pass Title */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                          <Ticket className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div>
                          <h4 className="text-[#0D1935] text-base font-bold leading-5">
                            {pass.title}
                          </h4>
                          <span className="text-[#54617E] text-xs font-normal leading-4">
                            {pass.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="inline-flex items-baseline gap-2 pt-0.5">
                        <span className="text-[#0D1935] text-2xl font-extrabold leading-8">
                          £{pass.price.toFixed(2)}
                        </span>
                        <span className="text-[#54617E] text-xs font-medium leading-4">
                          {pass.priceUnit}
                        </span>
                      </div>

                      {/* Bullet Points */}
                      <div className="flex flex-col gap-1.5 pt-0.5">
                        {pass.bullets.map((b, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-start gap-1.5 text-xs text-[#3B4A68] leading-4"
                          >
                            {b.icon === "check" ? (
                              <Check className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0 mt-0.5" />
                            ) : b.icon === "clock" ? (
                              <Clock className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0 mt-0.5" />
                            )}
                            <span>{b.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review and buy button */}
                    <button
                      type="button"
                      onClick={() => handleInitiateBuyPass(pass)}
                      className="w-full h-9 py-2 bg-[#E01C5B] hover:bg-[#c81750] rounded-[10px] inline-flex items-center justify-center text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Review and buy
                    </button>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}

            {/* Card 8: Quick actions (lg:col-span-4) */}
            <div className="lg:col-span-12 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start gap-3.5">
              {/* Header */}
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                    Quick actions
                  </h3>
                  <span className="text-[#54617E] text-xs font-normal leading-5">
                    Works from abroad too
                  </span>
                </div>
              </div>

              {/* 5 Action Rows */}
              <div className="flex flex-col">
                {/* 1. Check rates */}
                <button
                  type="button"
                  onClick={() =>
                    destinationSectionRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-sm font-semibold leading-5">
                        Check rates
                      </span>
                      <span className="text-[#54617E] text-xs font-normal leading-4">
                        For any destination
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8F9BB3] shrink-0" />
                </button>

                {/* 2. Add a travel pass (commented out) */}

                {/* 3. Manage bill limit */}
                <button
                  type="button"
                  onClick={() => {
                    setTempBillLimit(billLimit.toFixed(2));
                    setBillLimitModalOpen(true);
                  }}
                  className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                      <Gauge className="w-4 h-4 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Manage bill limit
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          Upcoming
                        </span>
                      </div>
                      <span className="text-[#54617E] text-xs font-normal leading-4">
                        Currently £{billLimit.toFixed(2)} a month
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8F9BB3] shrink-0" />
                </button>

                {/* 4. Roaming troubleshooting */}
                <button
                  type="button"
                  onClick={() =>
                    setGuideModal({
                      title: "Roaming troubleshooting",
                      subtitle: "No signal or data abroad?",
                      steps: [
                        "1. Confirm Data Roaming is turned ON in your phone's settings.",
                        "2. Restart your phone or toggle Airplane Mode ON for 15 seconds, then OFF so it registers with the local partner tower.",
                        "3. Check your APN is set to 'zoiko' under Mobile Data Network settings.",
                        "4. Ensure your monthly mobile bill limit (£" +
                          billLimit.toFixed(2) +
                          ") hasn't been reached if you are outside the EU zone.",
                      ],
                    })
                  }
                  className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-sm font-semibold leading-5">
                        Roaming troubleshooting
                      </span>
                      <span className="text-[#54617E] text-xs font-normal leading-4">
                        No signal or data abroad?
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8F9BB3] shrink-0" />
                </button>

                {/* 5. Contact support */}
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/support")}
                  className="py-2.5 border-t border-[#ECEFF5] flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-sm font-semibold leading-5">
                        Contact support
                      </span>
                      <span className="text-[#54617E] text-xs font-normal leading-4">
                        We can help while you&apos;re away
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8F9BB3] shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* 1. Guide / Info Modal */}
      {guideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">{guideModal.title}</h3>
                <p className="text-xs text-[#54617E]">{guideModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setGuideModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 flex flex-col gap-2.5 text-xs text-[#3B4A68] leading-5">
              {guideModal.steps.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F6F7FA] border border-slate-100"
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGuideModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0D1935] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Review & Buy Travel Pass Modal (commented out) */}

      {/* 3. Manage Bill Limit Modal */}
      {billLimitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#FAF1F4] rounded-xl flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0D1935]">
                      Monthly mobile bill limit
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-xs text-[#54617E]">
                    Covers roaming passes and charges outside your plan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBillLimitModalOpen(false);
                  setBillLimitError("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBillLimit} className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Select preset or enter custom limit (£)
                </label>
                <div className="grid grid-cols-4 gap-2 pb-1">
                  {[0, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setTempBillLimit(preset.toFixed(2));
                        setBillLimitError("");
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        parseFloat(tempBillLimit) === preset
                          ? "bg-[#E01C5B] text-white border-[#E01C5B]"
                          : "bg-slate-50 text-[#0D1935] border-slate-200 hover:border-[#E01C5B]/40"
                      }`}
                    >
                      £{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tempBillLimit}
                  onChange={(e) => {
                    setTempBillLimit(e.target.value);
                    if (billLimitError) setBillLimitError("");
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none transition ${
                    billLimitError
                      ? "border-red-400 bg-red-50/20 focus:border-red-500"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {billLimitError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{billLimitError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setBillLimitModalOpen(false);
                    setBillLimitError("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] cursor-pointer"
                >
                  Save bill limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Usage Alerts Modal */}
      {alertsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#FAF1F4] rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Roaming usage alerts
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    Optional extra reminders for {currentLine.number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlertsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 flex flex-col gap-3 text-xs">
              <label className="p-3 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-semibold text-[#0D1935]">
                    80% EU fair use SMS alert
                  </div>
                  <div className="text-[#54617E]">
                    Text me when I&apos;ve used 80% of my EU fair use allowance
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={extraSmsAlertAt80}
                  onChange={(e) => setExtraSmsAlertAt80(e.target.checked)}
                  className="w-4 h-4 accent-[#E01C5B]"
                />
              </label>

              <label className="p-3 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-semibold text-[#0D1935]">
                    Email roaming summary
                  </div>
                  <div className="text-[#54617E]">
                    Send an email whenever a travel pass activates abroad
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={extraEmailAlert}
                  onChange={(e) => setExtraEmailAlert(e.target.checked)}
                  className="w-4 h-4 accent-[#E01C5B]"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAlertsModalOpen(false);
                  showToast("Roaming alert preferences saved", "success");
                }}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] cursor-pointer"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Query a Roaming Charge Modal */}
      {queryRoamingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#FAF1F4] rounded-xl flex items-center justify-center">
                  <Flag className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Query a roaming charge
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    For {currentLine.number} · {currentLine.billingPeriodLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQueryRoamingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRoamingQuery} className="pt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0D1935]">
                    Tell us which roaming session or charge you&apos;d like checked <span className="text-[#E01C5B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#54617E]">
                    {queryRoamingNote.length}/1000
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  maxLength={1000}
                  value={queryRoamingNote}
                  onChange={(e) => {
                    setQueryRoamingNote(e.target.value);
                    if (queryError) setQueryError("");
                  }}
                  placeholder="e.g. Border roaming near Northern Ireland or unexpected pass charge..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0D1935] focus:outline-none transition ${
                    queryError
                      ? "border-red-400 bg-red-50/20 focus:border-red-500"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {queryError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{queryError}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setQueryRoamingModalOpen(false);
                    setQueryError("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuery}
                  className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingQuery ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit query</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Dashboard Modals */}
      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={currentLine.euFairUseRemainingGb || 15}
        onApplyBooster={(addedGb: number, cost: number) => {
          recordBoosterPurchase({
            addedGb,
            cost,
            lineId: currentLine.id,
            lineNumber: currentLine.number,
            boosterName: `${addedGb} GB Data Booster`,
          });
          showToast(`Added +${addedGb}GB data booster (£${cost.toFixed(2)}) to ${currentLine.number}!`, "success");
        }}
      />
      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={() => showToast("Report submitted to our security team", "success")}
      />
      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName={currentLine.planName}
        onSelectPlan={(planTitle: string) => {
          setComparePlansOpen(false);
          showToast(`Selected ${planTitle}`, "info");
        }}
      />
    </div>
  );
}

function FileTextIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    >
      <rect x="3" y="2" width="10" height="12" rx="1.5" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" />
      <line x1="5.5" y1="10.5" x2="8.5" y2="10.5" />
    </svg>
  );
}

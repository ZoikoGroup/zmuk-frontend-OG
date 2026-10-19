"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import beQuick from "../../utils/dasdbeQuickApi";
import {
  Smartphone,
  ChevronDown,
  RotateCw,
  Clock,
  CheckCircle2,
  Info,
  Zap,
  Database,
  Phone,
  MessageSquare,
  Globe,
  Settings,
  Star,
  Wifi,
  Voicemail,
  Ban,
  Gauge,
  ArrowRight,
  ChevronRight,
  Check,
  X,
  Receipt,
} from "lucide-react";

interface LineAddonItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  billingType: "one-off" | "monthly" | "per-day";
  category: "booster" | "call-text" | "travel";
  status: "Active" | "Pending" | "Recurring" | "Expired" | "Cancelled";
  addedAt: string;
  renewsOrEndsText: string;
}

interface AddonLineRecord {
  id: string;
  number: string;
  label: string;
  planName: string;
  status: string;
  dataRemainingGb: number;
  dataTotalGb: number;
  callsLabel: string;
  textsLabel: string;
  renewDate: string;
  accountSuffix: string;
}

interface DestinationPassOption {
  id: string;
  title: string;
  coverageLabel: string;
  price: number;
  priceUnit: string;
  allowanceDesc: string;
  billingType: "one-off" | "per-day";
}

interface DestinationConfig {
  name: string;
  code: string;
  passes: DestinationPassOption[];
}

const DESTINATIONS: Record<string, DestinationConfig> = {
  "United States": {
    name: "United States",
    code: "US",
    passes: [
      {
        id: "world-day-pass-us",
        title: "World Day Pass",
        coverageLabel: "United States, Canada",
        price: 6.0,
        priceUnit: "per day used",
        allowanceDesc: "Uses your UK allowance · fair use 2 GB a day",
        billingType: "per-day",
      },
      {
        id: "usa-canada-7d",
        title: "USA & Canada 7-day pass",
        coverageLabel: "United States, Canada",
        price: 15.0,
        priceUnit: "one-off",
        allowanceDesc: "5 GB, 300 mins, 300 texts · 7 days from first use",
        billingType: "one-off",
      },
    ],
  },
  Canada: {
    name: "Canada",
    code: "CA",
    passes: [
      {
        id: "world-day-pass-ca",
        title: "World Day Pass",
        coverageLabel: "United States, Canada",
        price: 6.0,
        priceUnit: "per day used",
        allowanceDesc: "Uses your UK allowance · fair use 2 GB a day",
        billingType: "per-day",
      },
      {
        id: "usa-canada-7d-ca",
        title: "USA & Canada 7-day pass",
        coverageLabel: "United States, Canada",
        price: 15.0,
        priceUnit: "one-off",
        allowanceDesc: "5 GB, 300 mins, 300 texts · 7 days from first use",
        billingType: "one-off",
      },
    ],
  },
  "Türkiye": {
    name: "Türkiye",
    code: "TR",
    passes: [
      {
        id: "world-day-pass-tr",
        title: "World Day Pass",
        coverageLabel: "Türkiye & Zone 1 destinations",
        price: 6.0,
        priceUnit: "per day used",
        allowanceDesc: "Uses your UK allowance · fair use 2 GB a day",
        billingType: "per-day",
      },
      {
        id: "turkey-7d-pass",
        title: "Türkiye 7-day pass",
        coverageLabel: "Türkiye",
        price: 15.0,
        priceUnit: "one-off",
        allowanceDesc: "5 GB, 300 mins, 300 texts · 7 days from first use",
        billingType: "one-off",
      },
    ],
  },
  France: {
    name: "France",
    code: "FR",
    passes: [
      {
        id: "eu-extra-data-fr",
        title: "EU Roaming Extra 5 GB",
        coverageLabel: "France & EU/EEA Zone",
        price: 8.0,
        priceUnit: "one-off",
        allowanceDesc: "Extra 5 GB above your 15 GB EU fair-use cap · 30 days",
        billingType: "one-off",
      },
      {
        id: "eu-extra-10gb-fr",
        title: "EU Roaming Extra 10 GB",
        coverageLabel: "France & EU/EEA Zone",
        price: 14.0,
        priceUnit: "one-off",
        allowanceDesc: "Extra 10 GB above your 15 GB EU fair-use cap · 30 days",
        billingType: "one-off",
      },
    ],
  },
  Spain: {
    name: "Spain",
    code: "ES",
    passes: [
      {
        id: "eu-extra-data-es",
        title: "EU Roaming Extra 5 GB",
        coverageLabel: "Spain & EU/EEA Zone",
        price: 8.0,
        priceUnit: "one-off",
        allowanceDesc: "Extra 5 GB above your 15 GB EU fair-use cap · 30 days",
        billingType: "one-off",
      },
      {
        id: "eu-extra-10gb-es",
        title: "EU Roaming Extra 10 GB",
        coverageLabel: "Spain & EU/EEA Zone",
        price: 14.0,
        priceUnit: "one-off",
        allowanceDesc: "Extra 10 GB above your 15 GB EU fair-use cap · 30 days",
        billingType: "one-off",
      },
    ],
  },
  Australia: {
    name: "Australia",
    code: "AU",
    passes: [
      {
        id: "world-day-pass-au",
        title: "World Day Pass",
        coverageLabel: "Australia & New Zealand",
        price: 6.0,
        priceUnit: "per day used",
        allowanceDesc: "Uses your UK allowance · fair use 2 GB a day",
        billingType: "per-day",
      },
      {
        id: "anz-7d-pass",
        title: "Australia & NZ 7-day pass",
        coverageLabel: "Australia, New Zealand",
        price: 18.0,
        priceUnit: "one-off",
        allowanceDesc: "5 GB, 300 mins, 300 texts · 7 days from first use",
        billingType: "one-off",
      },
    ],
  },
};

function CountryFlagBadge({ code }: { code: string }) {
  if (code === "US") {
    return (
      <span className="inline-flex w-5 h-3.5 rounded-[3px] overflow-hidden border border-slate-200 relative shrink-0 bg-white">
        <span className="absolute inset-0 flex flex-col">
          <span className="flex-1 bg-[#B22234]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#B22234]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#B22234]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#B22234]" />
        </span>
        <span className="w-2.5 h-2 bg-[#3C3B6E] absolute top-0 left-0" />
      </span>
    );
  }
  if (code === "FR") {
    return (
      <span className="inline-flex w-5 h-3.5 rounded-[3px] overflow-hidden border border-slate-200 shrink-0">
        <span className="w-1/3 h-full bg-[#002395]" />
        <span className="w-1/3 h-full bg-white" />
        <span className="w-1/3 h-full bg-[#ED2939]" />
      </span>
    );
  }
  if (code === "ES") {
    return (
      <span className="inline-flex flex-col w-5 h-3.5 rounded-[3px] overflow-hidden border border-slate-200 shrink-0">
        <span className="h-1/4 w-full bg-[#AA151B]" />
        <span className="h-2/4 w-full bg-[#F1BF00]" />
        <span className="h-1/4 w-full bg-[#AA151B]" />
      </span>
    );
  }
  if (code === "TR") {
    return (
      <span className="inline-flex items-center justify-center w-5 h-3.5 rounded-[3px] overflow-hidden bg-[#E30A17] text-white text-[8px] font-bold shrink-0">
        ☪
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-3.5 rounded-[3px] overflow-hidden bg-[#012169] text-white text-[7px] font-bold shrink-0">
      {code}
    </span>
  );
}

export default function AddonsAndBoostersPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("addons");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [freshnessTime, setFreshnessTime] = useState("10:42");

  // User profile state
  const [userName, setUserName] = useState("Member");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic lines state
  const [lines, setLines] = useState<AddonLineRecord[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");

  // Tabs & UI state
  const [boosterTab, setBoosterTab] = useState<"one-off" | "monthly">("one-off");
  const [callTextTab, setCallTextTab] = useState<"UK" | "International">("UK");
  const [selectedDestination, setSelectedDestination] = useState<string>("United States");
  const [manageFilter, setManageFilter] = useState<
    "Active" | "Pending" | "Recurring" | "Expired" | "Cancelled"
  >("Active");

  // Per-line Add-ons state (persisted in localStorage per line ID)
  const [lineAddonsMap, setLineAddonsMap] = useState<Record<string, LineAddonItem[]>>({});

  // Spending controls / Bill limit
  const [billLimitByLine, setBillLimitByLine] = useState<Record<string, number>>({});
  const [billLimitModalOpen, setBillLimitModalOpen] = useState(false);
  const [draftBillLimit, setDraftBillLimit] = useState<string>("25");

  // Modals for purchasing / guides / order history
  const [pendingPurchase, setPendingPurchase] = useState<{
    title: string;
    subtitle: string;
    price: number;
    billingType: "one-off" | "monthly" | "per-day";
    category: "booster" | "call-text" | "travel";
    renewsOrEndsText: string;
  } | null>(null);

  const [guideModal, setGuideModal] = useState<{
    title: string;
    subtitle: string;
    steps: string[];
  } | null>(null);

  const [orderHistoryModalOpen, setOrderHistoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs for smooth scrolling from Quick add-ons
  const boostersRef = useRef<HTMLDivElement | null>(null);
  const callTextRef = useRef<HTMLDivElement | null>(null);
  const travelPassesRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const formatUkPhone = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return "";
    const normalized = digits.startsWith("44")
      ? "0" + digits.slice(2)
      : digits.startsWith("0")
      ? digits
      : "0" + digits;
    if (normalized.length === 11) {
      return `${normalized.slice(0, 5)} ${normalized.slice(5)}`;
    }
    return normalized;
  };

  const fetchAddonsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const now = new Date();
      setFreshnessTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );

      let email = "";
      let name = "Member";
      let token = "";

      if (typeof window !== "undefined") {
        token = localStorage.getItem("zoiko_token") || "";
        const savedLimits = localStorage.getItem("zoiko_bill_limits");
        if (savedLimits) {
          try {
            setBillLimitByLine(JSON.parse(savedLimits));
          } catch {
            // ignore
          }
        }
        const savedAddons = localStorage.getItem("zoiko_line_addons");
        if (savedAddons) {
          try {
            setLineAddonsMap(JSON.parse(savedAddons));
          } catch {
            // ignore
          }
        }

        const userStr = localStorage.getItem("zoiko_user");
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            email = parsed.email || "";
            name =
              [parsed.first_name, parsed.last_name].filter(Boolean).join(" ") ||
              parsed.name ||
              (email ? email.split("@")[0] : "Member");
            setUserPhone(parsed.phone || parsed.telephone || "");
          } catch {
            // ignore
          }
        }
      }

      setUserEmail(email);
      setUserName(name);

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      let djangoOrders: any[] = [];
      let catalogPlans: any[] = [];

      if (token && email) {
        const [ordersRes, plansRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ logged_user: email }),
          }).catch(() => null),
          fetch(`${API_BASE}/api/plans/v1/`).catch(() => null),
        ]);

        if (ordersRes && ordersRes.ok) {
          const data = await ordersRes.json();
          if (data?.orders && Array.isArray(data.orders)) {
            djangoOrders = data.orders;
          } else if (Array.isArray(data)) {
            djangoOrders = data;
          }
        }
        if (plansRes && plansRes.ok) {
          const pData = await plansRes.json();
          catalogPlans = Array.isArray(pData) ? pData : pData?.results || [];
        }
      }

      let subscriberId: string | number | null = null;
      let bqLines: any[] = [];
      let bqDetails: any = null;

      if (email) {
        const subLookup = await beQuick.getSubscriberByEmail(email);
        subscriberId = subLookup && subLookup.subscriber_id ? subLookup.subscriber_id : null;

        if (subscriberId) {
          const [detailsRes, linesRes] = await Promise.all([
            beQuick.getSubscriberDetails(subscriberId),
            beQuick.getUserLines(subscriberId),
          ]);
          bqDetails = detailsRes;
          bqLines =
            linesRes?.lines ||
            detailsRes?.subscribers?.[0]?.lines ||
            [];
        }
      }

      const subObj = bqDetails?.subscribers?.[0];
      if (subObj) {
        const fullName = [subObj.first_name, subObj.last_name]
          .filter(Boolean)
          .join(" ");
        if (fullName) setUserName(fullName);
        if (subObj.contact_number) setUserPhone(subObj.contact_number);
      }

      const firstOrder = djangoOrders[0];
      if (firstOrder?.billing_address) {
        const b = firstOrder.billing_address;
        const addr = [b.address_line_1, b.city, b.postal_code]
          .filter(Boolean)
          .join(", ");
        if (addr) setUserAddress(addr);
      }

      const accountSuffix = subscriberId
        ? String(subscriberId).slice(-4)
        : firstOrder?.id
        ? String(firstOrder.id).slice(-4)
        : "";

      const assembledLines: AddonLineRecord[] = [];

      if (bqLines.length > 0) {
        for (let idx = 0; idx < bqLines.length; idx++) {
          const l = bqLines[idx];
          const lineId = String(l.id || `line-${idx + 1}`);
          const rawMsisdn = l.mdn || l.msisdn || l.phone_number || "";
          const formattedMsisdn = rawMsisdn
            ? formatUkPhone(rawMsisdn)
            : `SIM #${idx + 1}`;

          let planName = l.plan_name || "Zoiko Max 30GB";
          let dataTotalGb = 30;
          let dataUsedGb = 0;
          let renewDate = "28 Apr";

          try {
            const [planRes, bucketsRes] = await Promise.all([
              beQuick.getPlanDetails(lineId),
              beQuick.getLineBuckets(lineId),
            ]);
            if (planRes?.plan?.name) {
              planName = planRes.plan.name;
            }
            const buckets =
              bucketsRes?.buckets ||
              bucketsRes?.service_buckets ||
              [];
            const dataBucket = buckets.find(
              (b: any) =>
                String(b.bucket_type || b.type || "")
                  .toLowerCase()
                  .includes("data")
            );
            if (dataBucket) {
              const totalKb = Number(
                dataBucket.total || dataBucket.initial_quantity || 0
              );
              const remKb = Number(
                dataBucket.remaining || dataBucket.balance || 0
              );
              if (totalKb > 0) {
                dataTotalGb = Math.max(
                  1,
                  Math.round((totalKb / (1024 * 1024)) * 10) / 10
                );
                const remGb = Math.max(
                  0,
                  Math.round((remKb / (1024 * 1024)) * 10) / 10
                );
                dataUsedGb = Math.max(
                  0,
                  Math.round((dataTotalGb - remGb) * 10) / 10
                );
              }
              if (dataBucket.end_at || dataBucket.expires_at) {
                const d = new Date(dataBucket.end_at || dataBucket.expires_at);
                if (!isNaN(d.getTime())) {
                  renewDate = d.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  });
                }
              }
            }
          } catch {
            // fallback to order/catalog details if BeQuick bucket fails
          }

          const dataRemainingGb = Math.max(
            0,
            Math.round((dataTotalGb - dataUsedGb) * 10) / 10
          );

          assembledLines.push({
            id: lineId,
            number: formattedMsisdn,
            label: l.label || l.nickname || (idx === 0 ? "Primary" : `Line ${idx + 1}`),
            planName,
            status: String(l.status || "active").toLowerCase() === "active" ? "Active" : "Active",
            dataRemainingGb,
            dataTotalGb,
            callsLabel: "Unlimited",
            textsLabel: "Unlimited",
            renewDate,
            accountSuffix,
          });
        }
      }

      if (assembledLines.length === 0 && djangoOrders.length > 0) {
        djangoOrders.forEach((ord: any, idx: number) => {
          const lineId = String(ord.id || `order-line-${idx + 1}`);
          const planTitle =
            ord.plan_title ||
            ord.plan?.title ||
            ord.items?.[0]?.plan_title ||
            "Zoiko Mobile Plan";
          const matchedCatalog = catalogPlans.find(
            (cp: any) =>
              String(cp.title || "").toLowerCase() ===
              String(planTitle).toLowerCase()
          );
          const parsedAllowance = parseFloat(
            String(matchedCatalog?.data_allowance || "30").replace(/[^\d.]/g, "")
          );
          const totalGb =
            !isNaN(parsedAllowance) && parsedAllowance > 0 ? parsedAllowance : 30;

          const rawPhone =
            ord.msisdn ||
            ord.phone_number ||
            ord.port_in_number ||
            ord.billing_address?.phone ||
            "";

          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const renewStr = nextMonth.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });

          assembledLines.push({
            id: lineId,
            number: rawPhone ? formatUkPhone(rawPhone) : `Order #${ord.id || idx + 1}`,
            label: idx === 0 ? "Primary" : `Line ${idx + 1}`,
            planName: planTitle,
            status: "Active",
            dataRemainingGb: totalGb,
            dataTotalGb: totalGb,
            callsLabel: "Unlimited",
            textsLabel: "Unlimited",
            renewDate: renewStr,
            accountSuffix: accountSuffix || String(ord.id || "").slice(-4),
          });
        });
      }

      setLines(assembledLines);
      if (assembledLines.length > 0) {
        setSelectedLineId((prev) =>
          prev && assembledLines.some((l) => l.id === prev)
            ? prev
            : assembledLines[0].id
        );
      }
    } catch (err) {
      console.error("Failed to load add-ons & boosters data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAddonsData(false);
  }, [fetchAddonsData]);

  const currentLine: AddonLineRecord | null =
    lines.find((l) => l.id === selectedLineId) || lines[0] || null;

  const currentLineAddons: LineAddonItem[] = currentLine
    ? lineAddonsMap[currentLine.id] || []
    : [];

  const activeAddonsCount = currentLineAddons.filter(
    (a) => a.status === "Active" || a.status === "Recurring"
  ).length;

  const currentBillLimit = currentLine
    ? billLimitByLine[currentLine.id] ?? 25
    : 25;

  const handleConfirmPurchase = () => {
    if (!pendingPurchase || !currentLine) return;

    const newItem: LineAddonItem = {
      id: `addon-${Date.now()}`,
      title: pendingPurchase.title,
      subtitle: pendingPurchase.subtitle,
      price: pendingPurchase.price,
      billingType: pendingPurchase.billingType,
      category: pendingPurchase.category,
      status: pendingPurchase.billingType === "monthly" ? "Recurring" : "Active",
      addedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      renewsOrEndsText: pendingPurchase.renewsOrEndsText,
    };

    const updatedForLine = [newItem, ...(lineAddonsMap[currentLine.id] || [])];
    const nextMap = {
      ...lineAddonsMap,
      [currentLine.id]: updatedForLine,
    };
    setLineAddonsMap(nextMap);
    if (typeof window !== "undefined") {
      localStorage.setItem("zoiko_line_addons", JSON.stringify(nextMap));
    }

    setManageFilter(newItem.status === "Recurring" ? "Recurring" : "Active");
    showToast(`${pendingPurchase.title} added to ${currentLine.number}`);
    setPendingPurchase(null);
  };

  const handleCancelAddon = (addonId: string) => {
    if (!currentLine) return;
    const updatedForLine = (lineAddonsMap[currentLine.id] || []).map((item) =>
      item.id === addonId ? { ...item, status: "Cancelled" as const } : item
    );
    const nextMap = {
      ...lineAddonsMap,
      [currentLine.id]: updatedForLine,
    };
    setLineAddonsMap(nextMap);
    if (typeof window !== "undefined") {
      localStorage.setItem("zoiko_line_addons", JSON.stringify(nextMap));
    }
    showToast("Add-on cancelled.");
  };

  const handleSaveBillLimit = () => {
    if (!currentLine) return;
    const parsed = Math.max(0, parseFloat(draftBillLimit) || 0);
    const nextLimits = {
      ...billLimitByLine,
      [currentLine.id]: parsed,
    };
    setBillLimitByLine(nextLimits);
    if (typeof window !== "undefined") {
      localStorage.setItem("zoiko_bill_limits", JSON.stringify(nextLimits));
    }
    setBillLimitModalOpen(false);
    showToast(`Spending limit updated to £${parsed.toFixed(2)} for ${currentLine.number}`);
  };

  const boosterOptions =
    boosterTab === "one-off"
      ? [
          {
            size: "2 GB",
            price: 3.0,
            unit: "one-off",
            badge: "One-off",
            desc: `Ends when your allowance renews, ${currentLine?.renewDate || "next billing cycle"}`,
          },
          {
            size: "5 GB",
            price: 5.0,
            unit: "one-off",
            badge: "One-off",
            desc: `Ends when your allowance renews, ${currentLine?.renewDate || "next billing cycle"}`,
          },
          {
            size: "10 GB",
            price: 8.0,
            unit: "one-off",
            badge: "One-off",
            desc: `Ends when your allowance renews, ${currentLine?.renewDate || "next billing cycle"}`,
          },
        ]
      : [
          {
            size: "2 GB",
            price: 2.5,
            unit: "/month",
            badge: "Monthly",
            desc: `Renews every month on ${currentLine?.renewDate || "your billing date"}`,
          },
          {
            size: "5 GB",
            price: 4.5,
            unit: "/month",
            badge: "Monthly",
            desc: `Renews every month on ${currentLine?.renewDate || "your billing date"}`,
          },
          {
            size: "10 GB",
            price: 7.0,
            unit: "/month",
            badge: "Monthly",
            desc: `Renews every month on ${currentLine?.renewDate || "your billing date"}`,
          },
        ];

  const destinationConfig =
    DESTINATIONS[selectedDestination] || DESTINATIONS["United States"];

  const filterCounts = {
    Active: currentLineAddons.filter((a) => a.status === "Active").length,
    Pending: currentLineAddons.filter((a) => a.status === "Pending").length,
    Recurring: currentLineAddons.filter((a) => a.status === "Recurring").length,
    Expired: currentLineAddons.filter((a) => a.status === "Expired").length,
    Cancelled: currentLineAddons.filter((a) => a.status === "Cancelled").length,
  };

  const filteredAddons = currentLineAddons.filter(
    (a) => a.status === manageFilter
  );

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-4 md:p-5">
      <div className="max-w-[1520px] mx-auto flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Sidebar */}
        <div className="w-full lg:w-64 min-w-[256px] lg:sticky lg:top-5 shrink-0">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={lines.length}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Navigation Bar */}
          <DashboardTopNav
            userName={userName}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Add-ons & data boosters"
            customSubtitle="Add data, international minutes, texts or a travel pass when you need them."
          />

          {/* Sub-header Freshness Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#4C566A]">
              <Clock className="w-3.5 h-3.5 text-[#4C566A]" />
              <span>Offers checked {freshnessTime}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchAddonsData(true)}
              disabled={refreshing}
              title="Refresh add-on offers"
              className="w-8 h-8 rounded-[10px] bg-white border border-[#121B34]/10 flex items-center justify-center text-[#0D1935] hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {toastMessage && (
            <div className="bg-[#0D1935] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9F6E]" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />
              <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />
            </div>
          ) : !currentLine ? (
            <div className="bg-white rounded-3xl p-8 border border-[#121B34]/10 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E01C5B]/10 text-[#E01C5B] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0D1935]">
                No active mobile numbers found
              </h2>
              <p className="text-sm text-[#4C566A] max-w-md">
                Once you have an active SIM or eSIM line on your Zoiko Mobile account, you can add data boosters, international packs, and travel passes here.
              </p>
              <Link
                href="/dashboard/my-mobile-numbers"
                className="mt-1 px-4 py-2.5 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c8164f] transition"
              >
                Go to My mobile numbers
              </Link>
            </div>
          ) : (
            <>
              {/* ROW 1: Selected Line Pink Card + Quick Add-ons White Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* Left Card: Selected Line Overview (Solid Pink #E01C5B) */}
                <div className="relative bg-[#E01C5B] rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-3.5 overflow-hidden text-white">
                  {/* Decorative Top-Right 6x3 White Dot Matrix */}
                  <div className="w-28 h-12 absolute right-3 top-2.5 opacity-10 pointer-events-none grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white block"
                      />
                    ))}
                  </div>

                  {/* Top Row: Number & Plan + Line Selector Dropdown */}
                  <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-white shrink-0" />
                      <div>
                        <div className="text-lg font-bold tracking-tight text-white leading-6">
                          {currentLine.number}
                        </div>
                        <div className="text-xs text-white/85 leading-4">
                          {currentLine.planName}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        aria-label="Select mobile number"
                        value={currentLine.id}
                        onChange={(e) => setSelectedLineId(e.target.value)}
                        className="appearance-none bg-transparent border border-white/60 hover:border-white rounded-xl pl-3.5 pr-8 py-2 text-xs font-medium text-white focus:outline-none cursor-pointer"
                      >
                        {lines.map((line) => (
                          <option
                            key={line.id}
                            value={line.id}
                            className="text-[#0D1935] bg-white"
                          >
                            {line.number}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-white/85 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Middle Row: 3 White Allowance Stat Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
                    {/* Data Left */}
                    <div className="p-3 bg-white rounded-2xl flex items-center gap-2.5 text-[#0D1935]">
                      <div className="w-8 h-8 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#0D1935] leading-5 truncate">
                          {currentLine.dataRemainingGb} GB
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4 truncate">
                          of {currentLine.dataTotalGb} GB left
                        </div>
                      </div>
                    </div>

                    {/* UK Minutes */}
                    <div className="p-3 bg-white rounded-2xl flex items-center gap-2.5 text-[#0D1935]">
                      <div className="w-8 h-8 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#0D1935] leading-5 truncate">
                          {currentLine.callsLabel}
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4 truncate">
                          UK minutes
                        </div>
                      </div>
                    </div>

                    {/* UK Texts */}
                    <div className="p-3 bg-white rounded-2xl flex items-center gap-2.5 text-[#0D1935]">
                      <div className="w-8 h-8 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#0D1935] leading-5 truncate">
                          {currentLine.textsLabel}
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4 truncate">
                          UK texts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Renewal Note */}
                  <div className="flex items-center gap-1.5 text-xs text-white/85 relative z-10">
                    <Clock className="w-3.5 h-3.5 text-white/85 shrink-0" />
                    <span>
                      Usage updated {freshnessTime} · allowance renews{" "}
                      {currentLine.renewDate}
                    </span>
                  </div>

                  {/* Bottom White Box: Can buy add-ons */}
                  <div className="px-3.5 py-2.5 bg-white rounded-2xl flex items-center gap-2.5 text-[#0D1935] relative z-10">
                    <div className="w-8 h-8 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#E01C5B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#0D1935] leading-4">
                        Can buy add-ons
                      </div>
                      <div className="text-xs text-[#4C566A] leading-4 truncate">
                        {activeAddonsCount} active add-ons · charges go on bill
                        account{" "}
                        {currentLine.accountSuffix
                          ? `••${currentLine.accountSuffix}`
                          : "on file"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Quick add-ons */}
                <div className="bg-white rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0D1935] leading-5">
                          Quick add-ons
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-4">
                          Jump to options for {currentLine.number}
                        </p>
                      </div>
                    </div>

                    {/* 4 Quick Action Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          boostersRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          })
                        }
                        className="p-3.5 bg-[#F6F7FA] hover:bg-[#EDEEF2] rounded-2xl flex flex-col justify-between items-start gap-2.5 text-left transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center">
                          <Database className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0D1935] leading-4">
                            Data booster
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] group-hover:translate-x-0.5 transition-transform">
                            <span>View options</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCallTextTab("International");
                          callTextRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }}
                        className="p-3.5 bg-[#F6F7FA] hover:bg-[#EDEEF2] rounded-2xl flex flex-col justify-between items-start gap-2.5 text-left transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0D1935] leading-4">
                            International calls
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] group-hover:translate-x-0.5 transition-transform">
                            <span>View options</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCallTextTab("International");
                          callTextRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }}
                        className="p-3.5 bg-[#F6F7FA] hover:bg-[#EDEEF2] rounded-2xl flex flex-col justify-between items-start gap-2.5 text-left transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0D1935] leading-4">
                            International texts
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] group-hover:translate-x-0.5 transition-transform">
                            <span>View options</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          travelPassesRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          })
                        }
                        className="p-3.5 bg-[#F6F7FA] hover:bg-[#EDEEF2] rounded-2xl flex flex-col justify-between items-start gap-2.5 text-left transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0D1935] leading-4">
                            Travel pass
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] group-hover:translate-x-0.5 transition-transform">
                            <span>View options</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="flex items-center gap-1.5 text-xs text-[#4C566A]">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0" />
                    <span>
                      Nothing is bought until you review the full price and
                      confirm.
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 2: Data Boosters + Call & Text Add-ons */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* Left Card: Data boosters */}
                <div
                  ref={boostersRef}
                  className="bg-white rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-3.5"
                >
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0D1935] leading-5">
                          Data boosters
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-4">
                          UK data for {currentLine.number} · prices include VAT
                        </p>
                      </div>
                    </div>

                    {/* Underline Tabs: One-off | Renews monthly */}
                    <div className="border-b border-[#121B34]/10 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setBoosterTab("one-off")}
                        className={`pb-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                          boosterTab === "one-off"
                            ? "border-[#E01C5B] text-[#E01C5B]"
                            : "border-transparent text-[#4C566A] hover:text-[#0D1935]"
                        }`}
                      >
                        One-off
                      </button>
                      <button
                        type="button"
                        onClick={() => setBoosterTab("monthly")}
                        className={`pb-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                          boosterTab === "monthly"
                            ? "border-[#E01C5B] text-[#E01C5B]"
                            : "border-transparent text-[#4C566A] hover:text-[#0D1935]"
                        }`}
                      >
                        Renews monthly
                      </button>
                    </div>

                    {/* 3 Booster Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {boosterOptions.map((opt) => (
                        <div
                          key={opt.size}
                          className="p-3.5 bg-[#F6F7FA] rounded-2xl flex flex-col justify-between gap-3"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="text-lg font-bold text-[#0D1935] leading-7">
                              {opt.size}
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              {opt.desc}
                            </div>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-[#0D1935]">
                              £{opt.price.toFixed(2)}
                            </span>
                            <span className="text-xs text-[#4C566A]">
                              {opt.unit}
                            </span>
                          </div>

                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#121B34]/5 text-[#4C566A] text-xs font-medium">
                              <Check className="w-3 h-3 text-[#4C566A]" />
                              {opt.badge}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setPendingPurchase({
                                title: `${opt.size} Data Booster`,
                                subtitle: `${
                                  boosterTab === "one-off"
                                    ? "One-off UK data booster"
                                    : "Monthly recurring UK data booster"
                                } for ${currentLine.number}`,
                                price: opt.price,
                                billingType:
                                  boosterTab === "one-off"
                                    ? "one-off"
                                    : "monthly",
                                category: "booster",
                                renewsOrEndsText: opt.desc,
                              })
                            }
                            className="w-full py-2 px-3 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                          >
                            Select booster
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="flex items-center gap-1.5 text-xs text-[#4C566A]">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0" />
                    <span>
                      Boosters start once the network activates them and are
                      used before your plan data.
                    </span>
                  </div>
                </div>

                {/* Right Card: Call & text add-ons */}
                <div
                  ref={callTextRef}
                  className="bg-white rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-start gap-3.5"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0D1935] leading-5">
                        Call &amp; text add-ons
                      </h2>
                      <p className="text-xs text-[#4C566A] leading-4">
                        UK and international are sold separately
                      </p>
                    </div>
                  </div>

                  {/* Underline Tabs: UK | International */}
                  <div className="border-b border-[#121B34]/10 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setCallTextTab("UK")}
                      className={`pb-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                        callTextTab === "UK"
                          ? "border-[#E01C5B] text-[#E01C5B]"
                          : "border-transparent text-[#4C566A] hover:text-[#0D1935]"
                      }`}
                    >
                      UK
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallTextTab("International")}
                      className={`pb-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                        callTextTab === "International"
                          ? "border-[#E01C5B] text-[#E01C5B]"
                          : "border-transparent text-[#4C566A] hover:text-[#0D1935]"
                      }`}
                    >
                      International
                    </button>
                  </div>

                  {callTextTab === "UK" ? (
                    <div className="p-4 bg-[#F6F7FA] rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-[#0D1935] leading-4">
                          You already have unlimited UK minutes and texts
                        </div>
                        <p className="text-xs text-[#4C566A] leading-4">
                          {currentLine.planName} includes them, so we don&apos;t
                          offer UK minute or text packs for this number.
                          Premium-rate and service numbers are charged
                          separately.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex flex-col justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#0D1935]">
                            100 International Minutes
                          </div>
                          <div className="text-xs text-[#4C566A] mt-0.5">
                            Call 45+ destinations from the UK · valid until{" "}
                            {currentLine.renewDate}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-[#0D1935]">
                            £5.00
                          </span>
                          <span className="text-xs text-[#4C566A]">one-off</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingPurchase({
                              title: "100 International Minutes",
                              subtitle: `International calling pack from the UK for ${currentLine.number}`,
                              price: 5.0,
                              billingType: "one-off",
                              category: "call-text",
                              renewsOrEndsText: `Ends ${currentLine.renewDate}`,
                            })
                          }
                          className="w-full py-2 px-3 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          Select add-on
                        </button>
                      </div>

                      <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex flex-col justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#0D1935]">
                            100 International Texts
                          </div>
                          <div className="text-xs text-[#4C566A] mt-0.5">
                            Send international SMS from the UK · valid until{" "}
                            {currentLine.renewDate}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-[#0D1935]">
                            £3.00
                          </span>
                          <span className="text-xs text-[#4C566A]">one-off</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingPurchase({
                              title: "100 International Texts",
                              subtitle: `International SMS pack from the UK for ${currentLine.number}`,
                              price: 3.0,
                              billingType: "one-off",
                              category: "call-text",
                              renewsOrEndsText: `Ends ${currentLine.renewDate}`,
                            })
                          }
                          className="w-full py-2 px-3 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          Select add-on
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 3: Travel passes (5 cols) + Manage add-ons (4 cols) + More extras (3 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Card 5: Travel passes (5 cols) */}
                <div
                  ref={travelPassesRef}
                  className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-3.5"
                >
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0D1935] leading-5">
                          Travel passes
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-4">
                          Choose where you&apos;re going first
                        </p>
                      </div>
                    </div>

                    {/* Destination Selector Row */}
                    <div className="flex flex-wrap items-end gap-2.5">
                      <div className="flex-1 min-w-[180px] flex flex-col gap-1">
                        <label className="text-xs font-medium text-[#4C566A]">
                          Destination
                        </label>
                        <div className="relative">
                          <select
                            aria-label="Destination country"
                            value={selectedDestination}
                            onChange={(e) =>
                              setSelectedDestination(e.target.value)
                            }
                            className="w-full appearance-none bg-white border border-[#121B34]/10 rounded-xl pl-3.5 pr-8 py-2 text-xs font-medium text-[#0D1935] focus:outline-none focus:border-[#E01C5B] cursor-pointer"
                          >
                            {Object.keys(DESTINATIONS).map((countryName) => (
                              <option key={countryName} value={countryName}>
                                {countryName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-[#4C566A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="pb-2 inline-flex items-center gap-2">
                        <CountryFlagBadge code={destinationConfig.code} />
                        <span className="text-xs font-bold text-[#0D1935]">
                          {destinationConfig.name}
                        </span>
                      </div>
                    </div>

                    {/* Stacked Pass Cards */}
                    <div className="flex flex-col gap-2.5">
                      {destinationConfig.passes.map((pass) => (
                        <div
                          key={pass.id}
                          className="p-3.5 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-[#0D1935] leading-4">
                                {pass.title}
                              </div>
                              <div className="text-xs text-[#4C566A] leading-4 mt-0.5">
                                {pass.coverageLabel}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-[#0D1935] leading-5">
                                £{pass.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-[#4C566A] leading-4">
                                {pass.priceUnit}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-[#4C566A] leading-4">
                            {pass.allowanceDesc}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setPendingPurchase({
                                title: pass.title,
                                subtitle: `${pass.coverageLabel} · ${pass.allowanceDesc}`,
                                price: pass.price,
                                billingType: pass.billingType,
                                category: "travel",
                                renewsOrEndsText: pass.priceUnit,
                              })
                            }
                            className="w-full py-2 px-3 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                          >
                            Select pass
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Link */}
                  <div className="pt-1">
                    <Link
                      href="/dashboard/roaming-and-travel"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E01C5B] hover:underline"
                    >
                      <span>
                        Full rates and coverage in Roaming &amp; travel
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Card 6: Manage add-ons (4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0D1935] leading-5">
                          Manage add-ons
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-4">
                          For {currentLine.number}
                        </p>
                      </div>
                    </div>

                    {/* 5 Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          "Active",
                          "Pending",
                          "Recurring",
                          "Expired",
                          "Cancelled",
                        ] as const
                      ).map((tab) => {
                        const isSelected = manageFilter === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setManageFilter(tab)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer ${
                              isSelected
                                ? "bg-[#0D1935] text-white"
                                : "bg-[#F6F7FA] text-[#4C566A] hover:text-[#0D1935]"
                            }`}
                          >
                            <span>{tab}</span>
                            <span
                              className={
                                isSelected ? "text-white/75" : "text-[#4C566A]"
                              }
                            >
                              {filterCounts[tab]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add-ons List or Empty State */}
                    {filteredAddons.length === 0 ? (
                      <div className="p-6 bg-[#F6F7FA] rounded-2xl flex flex-col items-center justify-center text-center gap-1 my-auto min-h-[160px]">
                        <div className="text-xs font-bold text-[#0D1935]">
                          No {manageFilter.toLowerCase()} add-ons
                        </div>
                        <div className="text-xs text-[#4C566A]">
                          Add a booster or pass above when you need more.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                        {filteredAddons.map((addon) => (
                          <div
                            key={addon.id}
                            className="p-3 bg-[#F6F7FA] rounded-2xl flex items-start justify-between gap-2.5"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#0D1935]">
                                {addon.title}
                              </div>
                              <div className="text-xs text-[#4C566A] mt-0.5">
                                £{addon.price.toFixed(2)} ·{" "}
                                {addon.renewsOrEndsText}
                              </div>
                            </div>
                            {(addon.status === "Active" ||
                              addon.status === "Recurring") && (
                              <button
                                type="button"
                                onClick={() => handleCancelAddon(addon.id)}
                                className="text-xs font-semibold text-[#E01C5B] hover:underline shrink-0 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Links */}
                  <div className="pt-2.5 border-t border-[#121B34]/10 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderHistoryModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Order history &amp; receipts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDraftBillLimit(String(currentBillLimit));
                        setBillLimitModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Bill limit</span>
                    </button>
                  </div>
                </div>

                {/* Card 7: More extras (3 cols) */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0D1935] leading-5">
                          More extras
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-4">
                          What&apos;s included and what we can set up
                        </p>
                      </div>
                    </div>

                    {/* 4 Extras Rows */}
                    <div className="flex flex-col gap-2">
                      {/* Row 1: Mobile hotspot */}
                      <div className="p-3 bg-[#F6F7FA] rounded-2xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                            <Wifi className="w-4 h-4 text-[#0D1935]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0D1935] leading-4">
                              Mobile hotspot
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              Included in your plan — no add-on needed
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setGuideModal({
                              title: "Mobile hotspot & tethering",
                              subtitle: `Included at no extra cost on ${currentLine.planName}`,
                              steps: [
                                "Open Settings on your phone and go to Personal Hotspot (iOS) or Hotspot & Tethering (Android).",
                                "Toggle on Allow Others to Join / Wi-Fi Hotspot.",
                                "Hotspot usage comes out of your normal UK data allowance (and any active data boosters first).",
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline shrink-0 cursor-pointer"
                        >
                          <span>Guide</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Row 2: Voicemail */}
                      <div className="p-3 bg-[#F6F7FA] rounded-2xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                            <Voicemail className="w-4 h-4 text-[#0D1935]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0D1935] leading-4">
                              Voicemail
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              Included · set up from your phone
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setGuideModal({
                              title: "Setting up Voicemail",
                              subtitle: `Included with ${currentLine.number}`,
                              steps: [
                                "Dial 121 (or press and hold 1 on your keypad) from your Zoiko Mobile SIM.",
                                "Follow the spoken prompts to record your greeting and set a 4-digit voicemail PIN.",
                                "Calls to voicemail within the UK are included in your unlimited UK minutes.",
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline shrink-0 cursor-pointer"
                        >
                          <span>Guide</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Row 3: Call barring */}
                      <div className="p-3 bg-[#F6F7FA] rounded-2xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                            <Ban className="w-4 h-4 text-[#0D1935]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0D1935] leading-4">
                              Call barring
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              International or premium-rate numbers
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setGuideModal({
                              title: "Call barring & restrictions",
                              subtitle: `Manage call restrictions for ${currentLine.number}`,
                              steps: [
                                "Premium-rate and international call barring can be toggled directly in your handset Call Settings or by contacting Zoiko Support.",
                                "You can also set a £0.00 out-of-plan Bill Limit under Spending controls to prevent any out-of-bundle call charges.",
                                "Need immediate network-level barring? Call 020 7164 6399 or email support@zoikomobile.co.uk.",
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline shrink-0 cursor-pointer"
                        >
                          <span>Support</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Row 4: Spending controls */}
                      <div className="p-3 bg-[#F6F7FA] rounded-2xl flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                            <Gauge className="w-4 h-4 text-[#0D1935]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0D1935] leading-4">
                              Spending controls
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              Your £{currentBillLimit.toFixed(0)} bill limit
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftBillLimit(String(currentBillLimit));
                            setBillLimitModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline shrink-0 cursor-pointer"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="flex items-center gap-1.5 text-xs text-[#4C566A]">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0" />
                    <span>
                      Extras we don&apos;t sell, like cloud storage, aren&apos;t
                      listed.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {pendingPurchase && currentLine && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Confirm {pendingPurchase.title}
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  {pendingPurchase.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingPurchase(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Mobile number</span>
                <span className="font-bold text-[#0D1935]">
                  {currentLine.number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Price (incl. VAT)</span>
                <span className="font-bold text-[#0D1935]">
                  £{pendingPurchase.price.toFixed(2)}{" "}
                  {pendingPurchase.billingType === "monthly"
                    ? "/month"
                    : pendingPurchase.billingType === "per-day"
                    ? "per day used"
                    : "one-off"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Validity</span>
                <span className="font-medium text-[#0D1935]">
                  {pendingPurchase.renewsOrEndsText}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Charged to</span>
                <span className="font-medium text-[#0D1935]">
                  Bill account{" "}
                  {currentLine.accountSuffix
                    ? `••${currentLine.accountSuffix}`
                    : "on file"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingPurchase(null)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Confirm &amp; add (£{pendingPurchase.price.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Limit / Spending Controls Modal */}
      {billLimitModalOpen && currentLine && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Spending controls &amp; bill limit
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Set the maximum monthly out-of-plan spend for{" "}
                  {currentLine.number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBillLimitModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0D1935]">
                Monthly bill cap (£)
              </label>
              <input
                type="number"
                min={0}
                step={5}
                value={draftBillLimit}
                onChange={(e) => setDraftBillLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#121B34]/15 text-sm font-bold text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[0, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDraftBillLimit(String(preset))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      Number(draftBillLimit) === preset
                        ? "bg-[#E01C5B] text-white"
                        : "bg-[#F6F7FA] text-[#4C566A] hover:text-[#0D1935]"
                    }`}
                  >
                    £{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBillLimitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBillLimit}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Save bill limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order History & Receipts Modal */}
      {orderHistoryModalOpen && currentLine && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Order history &amp; receipts
                  </h3>
                  <p className="text-xs text-[#4C566A]">
                    Add-ons ordered for {currentLine.number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderHistoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {currentLineAddons.length === 0 ? (
              <div className="p-6 bg-[#F6F7FA] rounded-2xl text-center text-xs text-[#4C566A]">
                No add-on purchases recorded for this line yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {currentLineAddons.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F6F7FA] rounded-2xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#0D1935]">
                        {item.title}
                      </div>
                      <div className="text-[#4C566A]">
                        Ordered {item.addedAt} · {item.status}
                      </div>
                    </div>
                    <div className="font-bold text-[#0D1935]">
                      £{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/dashboard/bills-and-payments"
                className="text-xs font-semibold text-[#E01C5B] hover:underline"
              >
                View full statements in Bills &amp; payments →
              </Link>
              <button
                type="button"
                onClick={() => setOrderHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1935] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide / Support Modal */}
      {guideModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  {guideModal.title}
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  {guideModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuideModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="flex flex-col gap-2.5 text-xs text-[#0D1935] list-decimal list-inside bg-[#F6F7FA] p-4 rounded-2xl">
              {guideModal.steps.map((step, i) => (
                <li key={i} className="leading-5">
                  {step}
                </li>
              ))}
            </ol>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGuideModal(null)}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold cursor-pointer"
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

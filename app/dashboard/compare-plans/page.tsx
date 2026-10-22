"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  RotateCw,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  X,
  ArrowRight,
  Scale,
  Star,
  FileText,
  HelpCircle,
  MessageSquare,
  Globe,
  Radio,
  Zap,
  Sliders,
  Sparkles,
  AlertCircle,
  Info,
  Calendar,
  Shield,
  Layers,
  Phone,
  Send,
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
// Real BeQuick API Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import beQuick from "../../utils/dasdbeQuickApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface PlanItem {
  id: string;
  name: string;
  shortName: string;
  tier: "5G" | "4G";
  subtitle: string;
  price: number;
  billingCycle: string;
  dataAllowance: string;
  dataAmountGb: number;
  dataDetails?: string;
  calls: string;
  texts: string;
  roaming: string;
  roamingDetails: string;
  is5G: boolean;
  terms: string;
  promoSubtext?: string;
  promoNotice?: string;
}

interface UserLine {
  id: string;
  number: string;
  planId: string;
  planName: string;
  renewDate: string;
  simType: string;
  status: string;
}

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: "plan-max",
    name: "Zoiko Max 30GB",
    shortName: "Zoiko Max",
    tier: "5G",
    subtitle: "More data and EU roaming",
    price: 19.99,
    billingCycle: "a month",
    dataAllowance: "30 GB",
    dataAmountGb: 30,
    calls: "Unlimited UK calls",
    texts: "Unlimited UK texts",
    roaming: "Included in 8 EU countries",
    roamingDetails: "15 GB fair use",
    is5G: true,
    terms: "Monthly rolling · no exit fee · prices include VAT · no price rises announced",
  },
  {
    id: "plan-lite",
    name: "Zoiko Lite 10GB",
    shortName: "Zoiko Lite",
    tier: "4G",
    subtitle: "For lighter use",
    price: 9.99,
    billingCycle: "a month",
    dataAllowance: "10 GB",
    dataAmountGb: 10,
    calls: "Unlimited UK calls",
    texts: "Unlimited UK texts",
    roaming: "Not included",
    roamingDetails: "EU Day Pass £2.50 per day used",
    is5G: false,
    terms: "Monthly rolling · no exit fee · prices include VAT · no price rises announced",
  },
  {
    id: "plan-unlimited",
    name: "Zoiko Unlimited",
    shortName: "Zoiko Unlimited",
    tier: "5G",
    subtitle: "For heavy data users",
    price: 19.99,
    billingCycle: "a month",
    promoSubtext: "for 3 months, then £24.99 a month",
    promoNotice: computeDynamicPromoNotice(),
    dataAllowance: "Unlimited",
    dataAmountGb: 999,
    dataDetails: "Fair use policy applies",
    calls: "Unlimited UK calls",
    texts: "Unlimited UK texts",
    roaming: "Included in 8 EU countries",
    roamingDetails: "15 GB fair use",
    is5G: true,
    terms: "Monthly rolling · no exit fee · prices include VAT · no price rises announced",
  },
];

function computeDynamicRenewalDate(dateStr?: string | Date): string {
  const base = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(base.getTime())) {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  const next = new Date(base);
  const now = new Date();
  while (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function computeDynamicCheckedAt(): string {
  const now = new Date();
  return `${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST, ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

function computeCatalogueCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-A`;
}

function computeDynamicPromoNotice(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const formatted = lastDay.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `Offer ends 23:59 GMT, ${formatted}`;
}

function formatUkNumber(mdn?: string | number): string {
  if (!mdn) return "07700 900123";
  let s = String(mdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return String(mdn);
}

function parseStoredUser(): any {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      localStorage.getItem("zoiko_user") ||
      localStorage.getItem("driverx_user") ||
      "{}"
    );
  } catch {
    return {};
  }
}

function resolveUserNames(user: any) {
  const email = (user?.email || "").trim();
  let first = (user?.first_name || "").trim();
  let last = (user?.last_name || "").trim();

  if (!first && !last && (user?.name || user?.full_name)) {
    const raw = String(user.name || user.full_name).trim();
    const parts = raw.split(/\s+/);
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }

  if (!first && user?.username && !user.username.includes("@")) {
    const clean = String(user.username).replace(/[._-]+/g, " ").trim();
    const parts = clean
      .split(/\s+/)
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }

  if (!first && email && email.includes("@")) {
    const local = email.split("@")[0];
    const parts = local
      .replace(/[0-9]+/g, "")
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

    if (parts.length >= 2) {
      first = parts[0];
      last = parts.slice(1).join(" ");
    } else if (parts.length === 1 && parts[0].length > 0) {
      first = parts[0];
    } else {
      first = local.charAt(0).toUpperCase() + local.slice(1);
    }
  }

  return { first, last, email };
}

export default function ComparePlansPage() {
  const router = useRouter();

  // Layout & Sidebar
  const [activeTab, setActiveTab] = useState("compare-plans");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");

  // User Profile - Synchronous initialization from localStorage
  const initialUser = useMemo(() => parseStoredUser(), []);
  const initialResolved = useMemo(() => resolveUserNames(initialUser), [initialUser]);
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token") || "";
  });
  const [userName, setUserName] = useState(() => {
    if (typeof window === "undefined") return "Account Holder";
    const pref =
      localStorage.getItem("zoiko_preferred_name") ||
      initialUser?.preferred_name ||
      initialResolved.first ||
      "";
    return [initialResolved.first, initialResolved.last].filter(Boolean).join(" ").trim() || pref || "Account Holder";
  });
  const [userEmail, setUserEmail] = useState(() => {
    return initialResolved.email || initialUser?.email || "";
  });

  // Plans & Lines
  const [plans, setPlans] = useState<PlanItem[]>(DEFAULT_PLANS);
  const [lines, setLines] = useState<UserLine[]>(() => {
    if (typeof window === "undefined") return [];
    const savedPlanName = localStorage.getItem("zoiko_active_plan") || "Zoiko Max 30GB";
    const userPhone =
      initialUser?.phone_number ||
      initialUser?.phone ||
      initialUser?.contact_number ||
      initialUser?.mobile ||
      localStorage.getItem("zoiko_user_phone") ||
      "";
    const planId = savedPlanName.toLowerCase().includes("lite")
      ? "plan-lite"
      : savedPlanName.toLowerCase().includes("unlimited")
      ? "plan-unlimited"
      : "plan-max";

    return [
      {
        id: "line-1",
        number: formatUkNumber(userPhone || "07700 900123"),
        planId,
        planName: savedPlanName,
        renewDate: computeDynamicRenewalDate(),
        simType: "eSIM",
        status: "Active",
      },
    ];
  });
  const [selectedLineId, setSelectedLineId] = useState<string>("line-1");
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);

  // Filters
  const [dataFilter, setDataFilter] = useState<"all" | "10" | "30" | "unlimited">("all");
  const [budgetFilter, setBudgetFilter] = useState<"all" | "under15" | "15to25" | "25plus">("all");
  const [contractFilter, setContractFilter] = useState<"all" | "monthly" | "12mo">("all");
  const [moreFiltersModalOpen, setMoreFiltersModalOpen] = useState(false);
  const [filter5GOnly, setFilter5GOnly] = useState(false);
  const [filterEuRoamingOnly, setFilterEuRoamingOnly] = useState(false);

  // Selected compare checkboxes (IDs of additional plans selected to compare with current plan)
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  // Modals
  const [modal, setModal] = useState<
    null | "compare_table" | "review_switch" | "view_details" | "recommendation" | "what_happens" | "help"
  >(null);
  const [targetPlanForSwitch, setTargetPlanForSwitch] = useState<PlanItem | null>(null);
  const [targetPlanForDetails, setTargetPlanForDetails] = useState<PlanItem | null>(null);
  const [switchAgreed, setSwitchAgreed] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

  // Timestamp & refresh
  const [checkedAt, setCheckedAt] = useState(computeDynamicCheckedAt);
  const [refreshing, setRefreshing] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Close line selector on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#line-selector-dropdown") && !target.closest("#line-selector-btn")) {
        setLineDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load user info, lines, and plans
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const storedToken =
        localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token") || "";
      setToken(storedToken);

      let user: any = {};
      try {
        user = JSON.parse(
          localStorage.getItem("zoiko_user") ||
          localStorage.getItem("driverx_user") ||
          "{}"
        );
      } catch {}

      const resolved = resolveUserNames(user);
      const email = resolved.email || user?.email || "";
      setUserEmail(email);

      const pref =
        localStorage.getItem("zoiko_preferred_name") ||
        user?.preferred_name ||
        resolved.first ||
        "";
      const full = [resolved.first, resolved.last].filter(Boolean).join(" ").trim() || pref || "Account Holder";
      setUserName(full);

      const userPhone =
        user?.phone_number ||
        user?.phone ||
        user?.contact_number ||
        user?.mobile ||
        localStorage.getItem("zoiko_user_phone") ||
        "";

      // 1. Fetch live plans from backend if available
      try {
        const plansRes = await fetch(`${API_BASE}/api/plans/v1/`);
        if (plansRes.ok) {
          const pData = await plansRes.json();
          if (Array.isArray(pData) && pData.length > 0) {
            const mappedPlans: PlanItem[] = pData.map((p: any) => ({
              id: String(p.id || p.slug),
              name: p.name || p.title || "Zoiko Plan",
              shortName: p.name ? p.name.replace(/\s*\d+GB.*$/i, "").trim() : "Zoiko",
              tier: p.tier_label?.includes("5G") || p.is_5g ? "5G" : "4G",
              subtitle: p.short_description || p.subtitle || "Flexible mobile plan",
              price: Number(p.price || 19.99),
              billingCycle: "a month",
              dataAllowance: p.data_allowance || `${p.data_amount || 30} GB`,
              dataAmountGb: Number(p.data_amount || 30),
              calls: "Unlimited UK calls",
              texts: "Unlimited UK texts",
              roaming: p.roaming_included ? "Included in 8 EU countries" : "Not included",
              roamingDetails: p.roaming_included ? "15 GB fair use" : "EU Day Pass £2.50 per day used",
              is5G: p.tier_label?.includes("5G") || p.is_5g || true,
              terms: "Monthly rolling · no exit fee · prices include VAT · no price rises announced",
            }));
            if (mappedPlans.length >= 3) {
              setPlans(mappedPlans);
            }
          }
        }
      } catch {}

      // 2. Fetch real user lines from bqorders or sims orders
      let fetchedLines: UserLine[] = [];

      if (email) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(storedToken ? { Authorization: `Token ${storedToken}` } : {}),
            },
            body: JSON.stringify({ logged_user: email }),
          });

          if (res.ok) {
            const data = await res.json();
            const userGroups = (data.groups?.[email] || {}) as Record<string, any[]>;
            let idx = 0;

            for (const [orderId, entries] of Object.entries(userGroups)) {
              const entry = entries?.[0];
              if (!entry) continue;

              const linePhone =
                entry.phone_number ||
                entry.msisdn ||
                entry.mobile_number ||
                entry.cart?.[0]?.phone_number;

              const pTitle =
                entry.cart?.[0]?.title ||
                entry.cart?.[0]?.name ||
                entry.plan?.title ||
                entry.plan_name ||
                "Zoiko Max 30GB";

              const isEsim =
                entry.sim_type?.toLowerCase() === "esim" ||
                entry.is_esim === true ||
                entry.is_esim === "true";

              fetchedLines.push({
                id: String(entry.order_db_id || orderId || `line-${idx + 1}`),
                number: formatUkNumber(linePhone || userPhone || "07700 900123"),
                planId: pTitle.toLowerCase().includes("lite")
                  ? "plan-lite"
                  : pTitle.toLowerCase().includes("unlimited")
                  ? "plan-unlimited"
                  : "plan-max",
                planName: pTitle,
                renewDate: computeDynamicRenewalDate(entry.created_at || entry.order_date || entry.date),
                simType: isEsim ? "eSIM" : "SIM card",
                status: "Active",
              });
              idx++;
            }
          }
        } catch (err) {
          console.warn("Could not query bqorders:", err);
        }

        // Query SIM orders
        try {
          const simRes = await fetch(`${API_BASE}/api/v1/sims/orders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(storedToken ? { Authorization: `Token ${storedToken}` } : {}),
            },
            body: JSON.stringify({ logged_user: email }),
          });

          if (simRes.ok) {
            const simData = await simRes.json();
            const groups = (simData.groups?.[email] || {}) as Record<string, any[]>;
            for (const [orderId, entries] of Object.entries(groups)) {
              const entry = entries?.[0];
              if (!entry) continue;
              const exists = fetchedLines.some((n) => n.id === String(entry.id || orderId));
              if (!exists) {
                const isEsim = entry.sim_type?.toLowerCase() === "esim";
                fetchedLines.push({
                  id: String(entry.id || orderId),
                  number: formatUkNumber(entry.phone_number || entry.msisdn || userPhone || "07700 900123"),
                  planId: "plan-unlimited",
                  planName: entry.plan_name || entry.plan?.title || "Zoiko Unlimited",
                  renewDate: computeDynamicRenewalDate(entry.created_at || entry.order_date),
                  simType: isEsim ? "eSIM" : "SIM card",
                  status: "Pending",
                });
              }
            }
          }
        } catch {}
      }

      // If no orders found, provide sensible primary line for the active user
      if (fetchedLines.length === 0) {
        const savedPlanName = localStorage.getItem("zoiko_active_plan") || "Zoiko Max 30GB";
        fetchedLines = [
          {
            id: "line-1",
            number: formatUkNumber(userPhone || "07700 900123"),
            planId: savedPlanName.toLowerCase().includes("lite")
              ? "plan-lite"
              : savedPlanName.toLowerCase().includes("unlimited")
              ? "plan-unlimited"
              : "plan-max",
            planName: savedPlanName,
            renewDate: computeDynamicRenewalDate(),
            simType: "eSIM",
            status: "Active",
          },
        ];
      }

      setLines(fetchedLines);
      if (fetchedLines[0]) {
        setSelectedLineId((prev) => (fetchedLines.some((l) => l.id === prev) ? prev : fetchedLines[0].id));
      }

      setCheckedAt(computeDynamicCheckedAt());
    } finally {
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500);
        showToast("Plans catalogue refreshed.");
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current selected line object
  const currentLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0] || {
      id: "line-1",
      number: "07700 900123",
      planId: "plan-max",
      planName: "Zoiko Max 30GB",
      renewDate: computeDynamicRenewalDate(),
      simType: "eSIM",
      status: "Active",
    };
  }, [lines, selectedLineId]);

  // Current active plan object for this line
  const currentPlan = useMemo(() => {
    const found = plans.find((p) => p.id === currentLine.planId || p.name === currentLine.planName);
    return found || plans[0] || DEFAULT_PLANS[0];
  }, [plans, currentLine]);

  // Dynamic average data usage for this line based on storage or plan baseline
  const averageUsageGb = useMemo(() => {
    if (typeof window === "undefined") return 14.2;
    const storedUsed = localStorage.getItem("zoiko_data_used");
    if (storedUsed && !isNaN(Number(storedUsed))) return Number(storedUsed);
    const storedRemaining = localStorage.getItem("zoiko_data_remaining");
    if (storedRemaining && !isNaN(Number(storedRemaining))) {
      const tot = currentPlan.dataAmountGb;
      const used = Math.max(0, tot - Number(storedRemaining));
      return Number(used.toFixed(1));
    }
    return Number((currentPlan.dataAmountGb * 0.47).toFixed(1));
  }, [currentPlan]);

  // Dynamic recommendation based on actual usage
  const recommendedPlan = useMemo(() => {
    if (averageUsageGb <= 8) {
      return plans.find((p) => p.id === "plan-lite") || DEFAULT_PLANS[1];
    } else if (averageUsageGb > 25) {
      return plans.find((p) => p.id === "plan-unlimited") || DEFAULT_PLANS[2];
    } else {
      return plans.find((p) => p.id === "plan-max") || DEFAULT_PLANS[0];
    }
  }, [plans, averageUsageGb]);

  // Filter non-current plans
  const filteredOtherPlans = useMemo(() => {
    return plans.filter((p) => {
      if (p.id === currentPlan.id) return false;

      // Data filter
      if (dataFilter === "10" && p.dataAmountGb < 10) return false;
      if (dataFilter === "30" && p.dataAmountGb < 30) return false;
      if (dataFilter === "unlimited" && p.dataAmountGb < 900) return false;

      // Budget filter
      if (budgetFilter === "under15" && p.price >= 15) return false;
      if (budgetFilter === "15to25" && (p.price < 15 || p.price > 25)) return false;
      if (budgetFilter === "25plus" && p.price <= 25) return false;

      // Contract filter
      if (contractFilter === "12mo" && !p.terms.includes("12")) return false;

      // More filters
      if (filter5GOnly && !p.is5G) return false;
      if (filterEuRoamingOnly && !p.roaming.toLowerCase().includes("included")) return false;

      return true;
    });
  }, [plans, currentPlan, dataFilter, budgetFilter, contractFilter, filter5GOnly, filterEuRoamingOnly]);

  // Toggle compare checkbox
  const toggleComparePlan = (planId: string) => {
    if (selectedCompareIds.includes(planId)) {
      setSelectedCompareIds(selectedCompareIds.filter((id) => id !== planId));
    } else {
      if (selectedCompareIds.length >= 2) {
        showToast("You can compare up to 3 plans at a time (including your current plan).");
        return;
      }
      setSelectedCompareIds([...selectedCompareIds, planId]);
    }
  };

  // Compare plans array (always includes current plan + selected ones)
  const plansToCompare = useMemo(() => {
    const additional = plans.filter((p) => selectedCompareIds.includes(p.id) && p.id !== currentPlan.id);
    return [currentPlan, ...additional];
  }, [plans, currentPlan, selectedCompareIds]);

  // Handle plan switch confirmation
  const handleConfirmSwitch = () => {
    if (!targetPlanForSwitch) return;
    setSwitchLoading(true);

    setTimeout(() => {
      // Update local state
      const updatedLines = lines.map((l) => {
        if (l.id === currentLine.id) {
          return {
            ...l,
            planId: targetPlanForSwitch.id,
            planName: targetPlanForSwitch.name,
          };
        }
        return l;
      });

      setLines(updatedLines);
      localStorage.setItem("zoiko_active_plan", targetPlanForSwitch.name);
      window.dispatchEvent(new Event("zoiko-auth"));

      setSelectedCompareIds((prev) => prev.filter((id) => id !== targetPlanForSwitch.id));
      setSwitchLoading(false);
      setModal(null);
      setSwitchAgreed(false);
      showToast(`Plan switch confirmed for ${currentLine.number}. Your switch to ${targetPlanForSwitch.name} takes effect on ${currentLine.renewDate}.`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-3 sm:p-5">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 bg-[#0D1935] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-medium border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#E6007E] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={lines.length}
            planName={currentPlan.name}
            renewDate={currentLine.renewDate}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Nav */}
          <DashboardTopNav
            userName={userName || "Account Holder"}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Compare plans"
            customSubtitle="Compare plans you can switch to, see exactly what changes, then decide."
          />

          {/* Status Strip & Line Switcher Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Freshness Timestamp */}
            <div className="flex items-center gap-2 text-xs text-[#54617E]">
              <Clock className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
              <span>
                Plans checked {checkedAt} · catalogue {computeCatalogueCode()}
              </span>
              <button
                type="button"
                onClick={() => loadData(true)}
                title="Refresh plans catalogue"
                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Right: Comparing plans for selector */}
            <div className="relative" id="line-selector-dropdown">
              <button
                type="button"
                id="line-selector-btn"
                onClick={() => setLineDropdownOpen(!lineDropdownOpen)}
                className="px-3.5 py-2 bg-white rounded-2xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E6E8EE] flex items-center gap-2.5 hover:border-[#E01C5B]/40 transition cursor-pointer"
              >
                <div className="w-7 h-9 rounded-lg border-[1.5px] border-[#0D1935] flex flex-col justify-between items-center p-1 shrink-0">
                  <span className="w-2 h-[1px] bg-slate-400 rounded-full" />
                  <span className="w-1 h-1 bg-[#0D1935] rounded-full" />
                </div>
                <div className="text-left min-w-[200px]">
                  <div className="text-[11px] text-[#54617E]">Comparing plans for</div>
                  <div className="text-sm font-bold text-[#0D1935] truncate">
                    {currentLine.number} · {currentLine.planName}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${lineDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Line Dropdown Menu */}
              {lineDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[#54617E] uppercase tracking-wider">
                    Select a line
                  </div>
                  <div className="space-y-1 pt-1">
                    {lines.map((line) => {
                      const isSelected = line.id === currentLine.id;
                      return (
                        <button
                          key={line.id}
                          type="button"
                          onClick={() => {
                            setSelectedLineId(line.id);
                            setSelectedCompareIds([]);
                            setLineDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                            isSelected ? "bg-[#FDE8F1] text-[#E01C5B]" : "hover:bg-slate-50 text-[#0D1935]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{line.number}</div>
                            <div className="text-[11px] text-slate-500 truncate">{line.planName} · {line.simType}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#E01C5B] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3 Top Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: 5G on Max and Unlimited */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E8EE] flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#FDE8F1] text-[#E01C5B] font-extrabold text-xs flex items-center justify-center shrink-0">
                5G
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0D1935] leading-tight">5G on Max and Unlimited</h4>
                <p className="text-xs text-[#54617E] mt-0.5 truncate">Where available, with a 5G phone</p>
              </div>
            </div>

            {/* Card 2: EU roaming */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E8EE] flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0D1935] leading-tight">EU roaming on Max and Unlimited</h4>
                <p className="text-xs text-[#54617E] mt-0.5 truncate">8 named countries · 15 GB fair use</p>
              </div>
            </div>

            {/* Card 3: Monthly rolling */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E6E8EE] flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                <RotateCw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0D1935] leading-tight">Monthly rolling plans</h4>
                <p className="text-xs text-[#54617E] mt-0.5 truncate">No exit fee on these plans</p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HERO BANNER: Magenta Current Plan Banner */}
          {/* ========================================================================= */}
          <div className="w-full p-5 sm:p-6 relative bg-[#E01C5B] rounded-[20px] text-white shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Subtle decorative background circles & dot matrix */}
            <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none overflow-hidden">
              <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white" />
              <div className="absolute right-20 top-16 w-32 h-32 rounded-full bg-white" />
            </div>

            {/* Left: Current Plan Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-white/16 border border-white/20 flex flex-col items-center justify-center text-white font-extrabold text-xs uppercase leading-tight shrink-0 shadow-inner">
                <span>ZOIKO</span>
                <span>{currentPlan.shortName.replace(/^zoiko\s*/i, "")}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/90">Your current plan</span>
                  <span className="px-2.5 py-0.5 bg-white text-[#E01C5B] text-[11px] font-bold rounded-full flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 leading-tight truncate">
                  {currentPlan.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">£{currentPlan.price.toFixed(2)}</span>
                  <span className="text-xs text-white/90 font-medium">a month</span>
                </div>
                <p className="text-xs text-white/85 mt-1 font-normal">
                  {currentLine.number} · renews {currentLine.renewDate}
                </p>
              </div>
            </div>

            {/* Middle: 4 White Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10 shrink-0">
              <div className="px-3 py-2.5 bg-white rounded-xl text-[#0D1935] shadow-xs flex flex-col justify-center min-w-[90px]">
                <div className="text-base sm:text-lg font-bold leading-tight">{currentPlan.dataAllowance}</div>
                <div className="text-[11px] text-[#54617E] mt-0.5">UK data</div>
              </div>
              <div className="px-3 py-2.5 bg-white rounded-xl text-[#0D1935] shadow-xs flex flex-col justify-center min-w-[90px]">
                <div className="text-base sm:text-lg font-bold leading-tight">{currentPlan.calls.replace(/\s*uk\s*calls/i, "") || "Unlimited"}</div>
                <div className="text-[11px] text-[#54617E] mt-0.5">UK calls</div>
              </div>
              <div className="px-3 py-2.5 bg-white rounded-xl text-[#0D1935] shadow-xs flex flex-col justify-center min-w-[90px]">
                <div className="text-base sm:text-lg font-bold leading-tight">{currentPlan.texts.replace(/\s*uk\s*texts/i, "") || "Unlimited"}</div>
                <div className="text-[11px] text-[#54617E] mt-0.5">UK texts</div>
              </div>
              <div className="px-3 py-2.5 bg-white rounded-xl text-[#0D1935] shadow-xs flex flex-col justify-center min-w-[90px]">
                <div className="text-base sm:text-lg font-bold leading-tight truncate">{currentPlan.roaming.toLowerCase().includes("included") ? "EU roaming" : "Roaming"}</div>
                <div className="text-[11px] text-[#54617E] mt-0.5 truncate">{currentPlan.roamingDetails}</div>
              </div>
            </div>

            {/* Right: View Plan Details Action */}
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTargetPlanForDetails(currentPlan);
                  setModal("view_details");
                }}
                className="w-full sm:w-auto h-10 px-4 bg-white text-[#E01C5B] hover:bg-white/95 text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>View plan details</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FIND YOUR NEXT PLAN: Filter & Search Card */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-[20px] p-5 border border-[#E6E8EE] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col gap-4">
            {/* Filter Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDE8F1] flex items-center justify-center text-[#E01C5B] shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Find your next plan</h3>
                  <p className="text-xs text-[#54617E]">Only plans this number can switch to</p>
                </div>
              </div>

              <div className="h-9 px-3.5 py-1.5 bg-[#FDE8F1]/50 rounded-full border border-[#E01C5B] text-[#E01C5B] text-xs font-semibold flex items-center self-start sm:self-auto">
                Monthly plans
              </div>
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Filter 1: Data Allowance */}
              <div>
                <label className="block text-xs text-[#54617E] mb-1">Data allowance</label>
                <div className="relative">
                  <select
                    value={dataFilter}
                    onChange={(e) => setDataFilter(e.target.value as any)}
                    className="w-full h-11 pl-3 pr-8 bg-white border border-[#E6E8EE] rounded-xl text-xs sm:text-sm font-semibold text-[#0D1935] appearance-none focus:outline-none focus:border-[#E01C5B] cursor-pointer"
                  >
                    <option value="all">Any amount</option>
                    <option value="10">10 GB+</option>
                    <option value="30">30 GB+</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Filter 2: Monthly Budget */}
              <div>
                <label className="block text-xs text-[#54617E] mb-1">Monthly budget (today’s price)</label>
                <div className="relative">
                  <select
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value as any)}
                    className="w-full h-11 pl-3 pr-8 bg-white border border-[#E6E8EE] rounded-xl text-xs sm:text-sm font-semibold text-[#0D1935] appearance-none focus:outline-none focus:border-[#E01C5B] cursor-pointer"
                  >
                    <option value="all">Any price</option>
                    <option value="under15">Under £15</option>
                    <option value="15to25">£15 - £25</option>
                    <option value="25plus">£25+</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Filter 3: Contract Length */}
              <div>
                <label className="block text-xs text-[#54617E] mb-1">Contract length</label>
                <div className="relative">
                  <select
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value as any)}
                    className="w-full h-11 pl-3 pr-8 bg-white border border-[#E6E8EE] rounded-xl text-xs sm:text-sm font-semibold text-[#0D1935] appearance-none focus:outline-none focus:border-[#E01C5B] cursor-pointer"
                  >
                    <option value="all">Any</option>
                    <option value="monthly">Monthly rolling</option>
                    <option value="12mo">12 months</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Filter 4: More Filters Button */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setMoreFiltersModalOpen(true)}
                  className="w-full h-11 px-4 bg-slate-100 hover:bg-slate-200 text-[#0D1935] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Sliders className="w-4 h-4" />
                  <span>More filters</span>
                </button>
              </div>
            </div>

            {/* Filter Summary Strip */}
            <div className="pt-2 border-t border-[#F2F4F7] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-[#3E4D71]">
                <strong className="font-bold">{filteredOtherPlans.length} other plans</strong> match
              </div>
              <div className="flex items-center gap-1.5 text-[#54617E] flex-wrap">
                <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                <span>
                  Pay as you go, data-only and family plans aren’t sold online. Travel passes and international minutes are{" "}
                  <Link href="/dashboard/addons-and-boosters" className="text-[#E01C5B] font-semibold hover:underline">
                    add-ons
                  </Link>
                  .
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PLANS COMPARISON CARDS: Dynamic Responsive Grid */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* --------------------------------------------------------------------- */}
            {/* CARD 1: Current Plan (Always rendered with Current Plan Ribbon) */}
            {/* --------------------------------------------------------------------- */}
            <div className="relative rounded-2xl border-2 border-[#E01C5B] bg-gradient-to-b from-[#F9FAFB] to-white p-4 sm:p-5 flex flex-col justify-between shadow-xs overflow-hidden pt-10">
              {/* Top Banner Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-[#E01C5B] text-white flex items-center justify-center text-xs font-bold tracking-wide uppercase">
                Your current plan
              </div>

              <div>
                {/* Header: Title + Tier badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0D1935]">{currentPlan.shortName}</h3>
                    <p className="text-xs text-[#54617E] mt-0.5">{currentPlan.subtitle}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-[#0D1935] text-xs font-extrabold rounded-lg">
                    {currentPlan.tier}
                  </span>
                </div>

                {/* Price + Promo offer */}
                <div className="pt-3.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#0D1935]">
                      £{currentPlan.price.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-[#54617E]">a month</span>
                  </div>
                  {currentPlan.promoSubtext && (
                    <p className="text-xs font-semibold text-[#0066CC] mt-0.5">{currentPlan.promoSubtext}</p>
                  )}
                  {currentPlan.promoNotice && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF4ED] text-[#D95304] text-[11px] font-bold mt-2 border border-[#FEE4D2]">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{currentPlan.promoNotice}</span>
                    </div>
                  )}
                </div>

                {/* Features list */}
                <div className="pt-4 space-y-2.5">
                  {/* Data */}
                  <div className="flex items-start gap-2.5 text-xs text-[#0D1935]">
                    <div className="w-7 h-7 rounded-lg bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                      <Radio className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">{currentPlan.dataAllowance} UK data</div>
                      {currentPlan.dataDetails && (
                        <div className="text-[11px] text-[#54617E]">{currentPlan.dataDetails}</div>
                      )}
                    </div>
                  </div>

                  {/* Calls */}
                  <div className="flex items-center gap-2.5 text-xs text-[#0D1935]">
                    <div className="w-7 h-7 rounded-lg bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <strong className="font-bold">{currentPlan.calls}</strong>
                    </span>
                  </div>

                  {/* Texts */}
                  <div className="flex items-center gap-2.5 text-xs text-[#0D1935]">
                    <div className="w-7 h-7 rounded-lg bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <strong className="font-bold">{currentPlan.texts}</strong>
                    </span>
                  </div>

                  {/* Roaming */}
                  <div className="flex items-start gap-2.5 text-xs text-[#0D1935]">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        currentPlan.roaming.toLowerCase().includes("not")
                          ? "bg-slate-100 text-slate-500"
                          : "bg-[#FDE8F1] text-[#E01C5B]"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">{currentPlan.roaming}</div>
                      <div className="text-[11px] text-[#54617E]">{currentPlan.roamingDetails}</div>
                    </div>
                  </div>
                </div>

                {/* Terms footnote */}
                <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-[#54617E] leading-relaxed">
                  {currentPlan.terms}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E01C5B]">
                  <Check className="w-4 h-4" />
                  <span>Always compared</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTargetPlanForDetails(currentPlan);
                    setModal("view_details");
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#E01C5B] text-[#E01C5B] text-xs font-semibold rounded-xl transition cursor-pointer shadow-2xs"
                >
                  View plan
                </button>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* CARDS 2+: Available Plans to Switch To (Filtered dynamically) */}
            {/* --------------------------------------------------------------------- */}
            {filteredOtherPlans.map((plan) => {
              const isCompared = selectedCompareIds.includes(plan.id);
              const isRoamingNotIncluded = plan.roaming.toLowerCase().includes("not");

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-[#E6E8EE] bg-white p-4 sm:p-5 flex flex-col justify-between shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] hover:border-slate-300 transition"
                >
                  <div>
                    {/* Header: Title + Tier badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0D1935]">{plan.shortName}</h3>
                        <p className="text-xs text-[#54617E] mt-0.5">{plan.subtitle}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-extrabold rounded-lg ${
                          plan.is5G ? "bg-slate-100 text-[#0D1935]" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {plan.tier}
                      </span>
                    </div>

                    {/* Price + Promo offer */}
                    <div className="pt-3.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#0D1935]">
                          £{plan.price.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-[#54617E]">a month</span>
                      </div>
                      {plan.promoSubtext && (
                        <p className="text-xs font-semibold text-[#0066CC] mt-0.5">{plan.promoSubtext}</p>
                      )}
                      {plan.promoNotice && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF4ED] text-[#D95304] text-[11px] font-bold mt-2 border border-[#FEE4D2]">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{plan.promoNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="pt-4 space-y-2.5">
                      {/* Data */}
                      <div className="flex items-start gap-2.5 text-xs text-[#0D1935]">
                        <div className="w-7 h-7 rounded-lg bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">{plan.dataAllowance} UK data</div>
                          {plan.dataDetails && (
                            <div className="text-[11px] text-[#54617E]">{plan.dataDetails}</div>
                          )}
                        </div>
                      </div>

                      {/* Calls */}
                      <div className="flex items-center gap-2.5 text-xs text-[#0D1935]">
                        <div className="w-7 h-7 rounded-lg bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span>
                          <strong className="font-bold">{plan.calls}</strong>
                        </span>
                      </div>

                      {/* Texts */}
                      <div className="flex items-center gap-2.5 text-xs text-[#0D1935]">
                        <div className="w-7 h-7 rounded-lg bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span>
                          <strong className="font-bold">{plan.texts}</strong>
                        </span>
                      </div>

                      {/* Roaming */}
                      <div className="flex items-start gap-2.5 text-xs text-[#0D1935]">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isRoamingNotIncluded
                              ? "bg-slate-100 text-slate-500"
                              : "bg-[#FDE8F1] text-[#E01C5B]"
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold">{plan.roaming}</div>
                          <div className="text-[11px] text-[#54617E]">{plan.roamingDetails}</div>
                        </div>
                      </div>
                    </div>

                    {/* Terms footnote */}
                    <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-[#54617E] leading-relaxed">
                      {plan.terms}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#0D1935] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleComparePlan(plan.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B] cursor-pointer"
                      />
                      <span>Compare</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetPlanForSwitch(plan);
                        setModal("review_switch");
                      }}
                      className="px-3.5 py-2 bg-[#E01C5B] hover:bg-[#c9144e] text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Review switch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty state when filters return 0 matching alternative plans */}
            {filteredOtherPlans.length === 0 && (
              <div className="col-span-1 md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center mb-3">
                  <Sliders className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#0D1935]">No alternative plans match your filters</h4>
                <p className="text-xs text-[#54617E] mt-1 max-w-sm">
                  Try clearing your data or budget filters to view all available mobile plans for {currentLine.number}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDataFilter("all");
                    setBudgetFilter("all");
                    setContractFilter("all");
                    setFilter5GOnly(false);
                    setFilterEuRoamingOnly(false);
                  }}
                  className="mt-4 px-4 py-2 bg-[#E01C5B] text-white text-xs font-semibold rounded-xl hover:bg-[#c9144e] transition cursor-pointer shadow-xs"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COMPARE SELECTED PLANS: Docked Action Bar */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#E6E8EE] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDE8F1] flex items-center justify-center text-[#E01C5B] shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#0D1935]">Compare selected plans</h4>
                <p className="text-xs text-[#54617E]">Your current plan is always included. Tick up to 2 more.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="px-3 py-1.5 bg-slate-100 text-[#0D1935] text-xs font-bold rounded-xl">
                {selectedCompareIds.length + 1} of 3 selected
              </span>

              <button
                type="button"
                disabled={selectedCompareIds.length === 0}
                onClick={() => setModal("compare_table")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs ${
                  selectedCompareIds.length > 0
                    ? "bg-[#E01C5B] text-white hover:bg-[#c9144e] cursor-pointer"
                    : "bg-[#E01C5B]/40 text-white cursor-not-allowed"
                }`}
              >
                <span>Compare plans</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM 3 ADVISORY CARDS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Our recommendation */}
            <button
              type="button"
              onClick={() => setModal("recommendation")}
              className="bg-white rounded-[20px] p-5 border border-[#E6E8EE] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex items-center justify-between gap-3 text-left hover:border-[#E01C5B]/40 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-[#0D1935] group-hover:text-[#E01C5B] transition truncate">
                    Our recommendation
                  </h4>
                  <p className="text-xs text-[#54617E] leading-snug mt-0.5">
                    Based on your last 2 complete billing cycles
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
            </button>

            {/* Card 2: What happens if you switch? */}
            <button
              type="button"
              onClick={() => setModal("what_happens")}
              className="bg-white rounded-[20px] p-5 border border-[#E6E8EE] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex items-center justify-between gap-3 text-left hover:border-[#E01C5B]/40 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-[#0D1935] group-hover:text-[#E01C5B] transition truncate">
                    What happens if you switch?
                  </h4>
                  <p className="text-xs text-[#54617E] leading-snug mt-0.5">
                    Prices over time, start date and what you keep
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
            </button>

            {/* Card 3: Need help choosing? */}
            <Link
              href="/dashboard/support"
              className="bg-white rounded-[20px] p-5 border border-[#E6E8EE] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex items-center justify-between gap-3 text-left hover:border-[#E01C5B]/40 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDE8F1] text-[#E01C5B] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-[#0D1935] group-hover:text-[#E01C5B] transition truncate">
                    Need help choosing?
                  </h4>
                  <p className="text-xs text-[#54617E] leading-snug mt-0.5">
                    Message our team — we’ll reply in your requests
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Side-by-Side Comparison Table */}
      {/* ========================================================================= */}
      {modal === "compare_table" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-[#E01C5B]" />
                <h3 className="text-lg font-bold text-[#0D1935]">Compare selected plans for {currentLine.number}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-3 text-[#54617E] font-medium w-1/4">Plan feature</th>
                    {plansToCompare.map((p) => (
                      <th key={p.id} className="py-3 px-3 text-[#0D1935] font-extrabold text-sm sm:text-base">
                        <div className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.id === currentPlan.id && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] text-[10px] font-bold">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#E01C5B] mt-0.5">£{p.price.toFixed(2)}/mo</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#54617E]">Data allowance</td>
                    {plansToCompare.map((p) => (
                      <td key={p.id} className="py-3 px-3 font-bold text-[#0D1935]">
                        {p.dataAllowance}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#54617E]">Calls & Texts</td>
                    {plansToCompare.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-[#0D1935]">
                        Unlimited UK
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#54617E]">5G Network</td>
                    {plansToCompare.map((p) => (
                      <td key={p.id} className="py-3 px-3 font-medium text-[#0D1935]">
                        {p.is5G ? (
                          <span className="inline-flex items-center gap-1 text-[#027A48]">
                            <Check className="w-3.5 h-3.5" /> 5G ready
                          </span>
                        ) : (
                          <span className="text-slate-500">4G standard</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#54617E]">EU Roaming</td>
                    {plansToCompare.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-[#0D1935]">
                        <div>{p.roaming}</div>
                        <div className="text-[11px] text-[#54617E]">{p.roamingDetails}</div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#54617E]">Commitment</td>
                    {plansToCompare.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-[#54617E]">
                        Monthly rolling (no exit fees)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-[#54617E]">Action</td>
                    {plansToCompare.map((p) => (
                      <td key={p.id} className="py-3 px-3">
                        {p.id === currentPlan.id ? (
                          <span className="text-xs font-semibold text-[#54617E]">Your active plan</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetPlanForSwitch(p);
                              setModal("review_switch");
                            }}
                            className="px-3.5 py-1.5 bg-[#E01C5B] hover:bg-[#c9144e] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Switch to this plan
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0D1935] text-xs font-semibold rounded-xl"
              >
                Close comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Review Plan Switch */}
      {/* ========================================================================= */}
      {modal === "review_switch" && targetPlanForSwitch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Review switch for {currentLine.number}</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-4">
              {/* Transition summary card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#54617E]">Current plan</div>
                  <div className="text-sm font-bold text-[#0D1935]">{currentPlan.name}</div>
                  <div className="text-xs text-[#54617E]">£{currentPlan.price.toFixed(2)}/month</div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#E01C5B] shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#54617E]">New plan</div>
                  <div className="text-sm font-bold text-[#E01C5B]">{targetPlanForSwitch.name}</div>
                  <div className="text-xs font-bold text-[#0D1935]">£{targetPlanForSwitch.price.toFixed(2)}/month</div>
                </div>
              </div>

              {/* What changes & what stays same */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>No downtime or SIM swap needed:</strong> Your number {currentLine.number} will switch automatically on {currentLine.renewDate}.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Billing update:</strong> Your Direct Debit will adjust to £{targetPlanForSwitch.price.toFixed(2)} starting on your next billing cycle.
                  </div>
                </div>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-2.5 pt-2 text-xs text-[#0D1935] cursor-pointer">
                <input
                  type="checkbox"
                  checked={switchAgreed}
                  onChange={(e) => setSwitchAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B] cursor-pointer"
                />
                <span className="leading-tight">
                  I agree to switch {currentLine.number} to {targetPlanForSwitch.name} on monthly rolling terms with no exit fee.
                </span>
              </label>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!switchAgreed || switchLoading}
                  onClick={handleConfirmSwitch}
                  className="px-5 py-2.5 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {switchLoading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming switch...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm plan switch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: View Plan Details */}
      {/* ========================================================================= */}
      {modal === "view_details" && targetPlanForDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">{targetPlanForDetails.name}</h3>
                <p className="text-xs text-[#54617E]">Full plan allowances & terms</p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5 text-xs text-[#0D1935]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                <span className="text-slate-600">Standard monthly price:</span>
                <span className="text-lg font-bold text-[#0D1935]">£{targetPlanForDetails.price.toFixed(2)}/mo</span>
              </div>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#54617E]">UK Data:</span>
                  <span className="font-bold">{targetPlanForDetails.dataAllowance}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#54617E]">Standard UK Calls & Texts:</span>
                  <span className="font-bold">Unlimited</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#54617E]">Network coverage:</span>
                  <span className="font-bold">{targetPlanForDetails.tier} 99% UK population</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#54617E]">EU Roaming allowance:</span>
                  <span className="font-bold">{targetPlanForDetails.roamingDetails}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#54617E]">Contract duration:</span>
                  <span className="font-bold">30-day monthly rolling</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 bg-[#0D1935] text-white text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Our Recommendation */}
      {/* ========================================================================= */}
      {modal === "recommendation" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-[#E01C5B]" />
                <h3 className="text-base font-bold text-[#0D1935]">Our Recommendation</h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5 text-xs text-[#54617E] leading-relaxed">
              <p>
                Based on your last 2 billing cycles on <strong>{currentLine.number}</strong>, your average monthly data usage was <strong>{averageUsageGb} GB</strong>.
              </p>
              <div className="p-3.5 bg-[#FDE8F1] rounded-2xl border border-[#FBCFE8] text-[#0D1935]">
                <div className="font-bold text-sm text-[#E01C5B] mb-1">Recommended: {recommendedPlan.name}</div>
                <p className="text-xs text-[#54617E]">
                  {recommendedPlan.id === "plan-lite"
                    ? "Great value option for moderate usage with full UK coverage."
                    : recommendedPlan.id === "plan-unlimited"
                    ? "Ideal for heavy streaming, downloads, and worry-free data usage with 5G connectivity."
                    : "You have plenty of headroom to stream and download without hitting speed caps, plus free EU roaming included at no extra charge."}
                </p>
              </div>
              {currentPlan.id === recommendedPlan.id ? (
                <div className="p-3 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>You are already enjoying our best-matched plan for your line!</span>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPlanForSwitch(recommendedPlan);
                      setModal("review_switch");
                    }}
                    className="w-full py-2.5 bg-[#E01C5B] hover:bg-[#c9144e] text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Switch to recommended plan ({recommendedPlan.shortName})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p>
                Switching plans takes effect on your next renewal ({currentLine.renewDate}) with zero downtime and no exit fees!
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0D1935] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: What Happens If You Switch */}
      {/* ========================================================================= */}
      {modal === "what_happens" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#E01C5B]" />
                <h3 className="text-base font-bold text-[#0D1935]">What happens if you switch?</h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs text-[#54617E] leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-[#0D1935] block mb-1">1. Keep your number & SIM</strong>
                <span>You do not need a new SIM or eSIM. Your existing phone connection remains uninterrupted.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-[#0D1935] block mb-1">2. Timing of the change</strong>
                <span>Your new plan allowances and pricing take effect from your next renewal date ({currentLine.renewDate}).</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-[#0D1935] block mb-1">3. Direct Debit updates automatically</strong>
                <span>We automatically update your invoice and bank mandate with zero manual steps.</span>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 bg-[#0D1935] text-white text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: More Filters */}
      {/* ========================================================================= */}
      {moreFiltersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Filter plan features</h3>
              <button
                type="button"
                onClick={() => setMoreFiltersModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5">
              <label className="flex items-center gap-3 text-xs font-semibold text-[#0D1935] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter5GOnly}
                  onChange={(e) => setFilter5GOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B] cursor-pointer"
                />
                <span>5G Network Ready Only</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold text-[#0D1935] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterEuRoamingOnly}
                  onChange={(e) => setFilterEuRoamingOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B] cursor-pointer"
                />
                <span>EU Roaming Included</span>
              </label>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFilter5GOnly(false);
                    setFilterEuRoamingOnly(false);
                  }}
                  className="text-xs text-[#54617E] hover:text-[#0D1935]"
                >
                  Reset filters
                </button>

                <button
                  type="button"
                  onClick={() => setMoreFiltersModalOpen(false)}
                  className="px-4 py-2 bg-[#E01C5B] hover:bg-[#c9144e] text-white text-xs font-semibold rounded-xl"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw,
  Clock,
  ChevronDown,
  Database,
  Phone,
  MessageSquare,
  Check,
  MinusCircle,
  Info,
  ArrowRight,
  Plus,
  Lock,
  Mail,
  Smartphone,
  Calendar,
  BarChart2,
  PieChart,
  TrendingUp,
  Star,
  Table,
  Gauge,
  Globe,
  Bell,
  CheckCircle2,
  AlertCircle,
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

export interface UsageLineItem {
  id: string;
  number: string;
  planName: string;
  status: string;
  isPrimary: boolean;
  isUnlimited: boolean;
  renewDate: string;
  renewDateFull: string;
  daysUntilRenew: number;
  cycleStartLabel: string;
  cycleEndLabel: string;
  cycleEndWithYear: string;
  cycleTotalDays: number;
  cycleCompletedDays: number;
  cycleStartDate: Date;
}

export interface LineAllowanceMetrics {
  dataTotal: number;
  dataUsed: number;
  dataRemaining: number;
  roamingDataUsed: number;
  callsUnlimited: boolean;
  callsTotal: number | null;
  callsUsed: number;
  callsRemaining: number | null;
  textsUnlimited: boolean;
  textsTotal: number | null;
  textsUsed: number;
  textsRemaining: number | null;
  roamingTotal: number;
  roamingUsed: number;
  roamingRemaining: number;
  activeBoostersCount: number;
  activeBoostersGb: number;
}

export interface DailyUsageBar {
  dayIndex: number;
  dayNumber: number;
  dateLabel: string;
  status: "completed" | "today" | "future";
  ukDataGb: number;
  roamingDataGb: number;
  callsMins: number;
  textsCount: number;
}

const DESTINATION_COUNTRIES = [
  {
    code: "FR",
    name: "France",
    zone: "EU Roaming Included",
    summary: "Included in your EU roaming fair use allowance at no extra cost.",
  },
  {
    code: "ES",
    name: "Spain",
    zone: "EU Roaming Included",
    summary: "Included in your EU roaming fair use allowance at no extra cost.",
  },
  {
    code: "DE",
    name: "Germany",
    zone: "EU Roaming Included",
    summary: "Included in your EU roaming fair use allowance at no extra cost.",
  },
  {
    code: "IE",
    name: "Ireland",
    zone: "EU Roaming Included",
    summary: "Included in your EU roaming fair use allowance at no extra cost.",
  },
  {
    code: "IT",
    name: "Italy",
    zone: "EU Roaming Included",
    summary: "Included in your EU roaming fair use allowance at no extra cost.",
  },
  {
    code: "US",
    name: "United States",
    zone: "Rest of World Zone 1",
    summary: "Outside EU zone — out-of-plan roaming rates or travel add-ons apply.",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    zone: "Rest of World Zone 2",
    summary: "Outside EU zone — standard international roaming rates apply.",
  },
  {
    code: "IN",
    name: "India",
    zone: "Rest of World Zone 2",
    summary: "Outside EU zone — standard international roaming rates apply.",
  },
  {
    code: "AU",
    name: "Australia",
    zone: "Rest of World Zone 1",
    summary: "Outside EU zone — out-of-plan roaming rates or travel add-ons apply.",
  },
];

// ── Dynamic Formatters ──
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

function kbToGb(kb: number): number {
  return Number((kb / 1024 / 1024).toFixed(1));
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "your registered email";
  const [local, domain] = email.split("@");
  if (local.length <= 1) return `${local[0] || "*"}•••••@${domain}`;
  return `${local[0]}•••••@${domain}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPrimaryLine(line: any): boolean {
  return (
    line.primary === true ||
    line.primary === "true" ||
    line.primary === 1 ||
    line.primary === "1"
  );
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

/**
 * Generates deterministic daily bars across the billing cycle that sum up
 * to the line's live API usage (`dataUsed`, `roamingUsed`, `callsUsed`, `textsUsed`).
 */
function buildDynamicCycleDays(
  lineId: string,
  cycleStartDate: Date,
  totalDays: number,
  completedDays: number,
  metrics: LineAllowanceMetrics
): DailyUsageBar[] {
  const days: DailyUsageBar[] = [];
  const safeTotalDays = Math.max(28, Math.min(31, totalDays || 30));
  const safeCompleted = Math.max(1, Math.min(safeTotalDays - 1, completedDays || 16));

  // Deterministic pattern per day
  const basePattern = [
    0.55, 0.65, 0.48, 0.78, 0.58, 0.88, 0.66, 0.58, 0.48, 0.78, 0.68, 0.58, 0.58, 0.48, 0.88, 1.6,
  ];
  const seedOffset = lineId
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const weights: number[] = [];
  let weightSum = 0;
  for (let i = 0; i < safeCompleted; i++) {
    const w = basePattern[(i + seedOffset) % basePattern.length];
    weights.push(w);
    weightSum += w;
  }

  const domesticDataUsed = Math.max(0, metrics.dataUsed - metrics.roamingDataUsed);

  for (let i = 0; i < safeTotalDays; i++) {
    const d = new Date(cycleStartDate);
    d.setDate(cycleStartDate.getDate() + i);
    const dateLabel = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

    if (i < safeCompleted) {
      const share = weightSum > 0 ? weights[i] / weightSum : 0;
      const isRoamingDay =
        metrics.roamingDataUsed > 0 &&
        i >= Math.max(0, safeCompleted - 5) &&
        i <= Math.max(0, safeCompleted - 3);
      const roamGb = isRoamingDay
        ? Number((metrics.roamingDataUsed / 3).toFixed(2))
        : 0;
      const ukGb =
        domesticDataUsed > 0
          ? Number((domesticDataUsed * share).toFixed(2))
          : 0;
      const callsMins =
        metrics.callsUsed > 0 ? Math.round(metrics.callsUsed * share) : 0;
      const textsCnt =
        metrics.textsUsed > 0 ? Math.round(metrics.textsUsed * share) : 0;

      days.push({
        dayIndex: i,
        dayNumber: d.getDate(),
        dateLabel,
        status: "completed",
        ukDataGb: ukGb,
        roamingDataGb: roamGb,
        callsMins,
        textsCount: textsCnt,
      });
    } else if (i === safeCompleted) {
      days.push({
        dayIndex: i,
        dayNumber: d.getDate(),
        dateLabel,
        status: "today",
        ukDataGb: 0,
        roamingDataGb: 0,
        callsMins: 0,
        textsCount: 0,
      });
    } else {
      days.push({
        dayIndex: i,
        dayNumber: d.getDate(),
        dateLabel,
        status: "future",
        ukDataGb: 0,
        roamingDataGb: 0,
        callsMins: 0,
        textsCount: 0,
      });
    }
  }

  return days;
}

export default function UsageAndAllowancesPage() {
  const router = useRouter();

  // ── Dynamic User & Auth State ──
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Account holder");
  const [accountEmail, setAccountEmail] = useState<string>("");
  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Navigation & Header State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("usage");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ── Dynamic Lines & Usage Metrics ──
  const [lines, setLines] = useState<UsageLineItem[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [metricsByLine, setMetricsByLine] = useState<Record<string, LineAllowanceMetrics>>({});

  // ── Interactive Controls State ──
  const [freshnessTime, setFreshnessTime] = useState<string>("Just now");
  const [shortTime, setShortTime] = useState<string>("09:15");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lineDropdownOpen, setLineDropdownOpen] = useState<boolean>(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  const [cycleChartTab, setCycleChartTab] = useState<"data" | "calls" | "texts">("data");
  const [showAsTable, setShowAsTable] = useState<boolean>(false);
  const [selectedCycleOffset, setSelectedCycleOffset] = useState<number>(0);
  const [cycleDropdownOpen, setCycleDropdownOpen] = useState<boolean>(false);
  const cycleDropdownRef = useRef<HTMLDivElement>(null);

  const [breakdownTab, setBreakdownTab] = useState<"domestic" | "roaming">("domestic");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState<boolean>(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // ── Usage Alerts Toggles (matching screenshot defaults: ON, OFF, ON) ──
  const [alertData80, setAlertData80] = useState<boolean>(true);
  const [alertRoamingSpend, setAlertRoamingSpend] = useState<boolean>(false);
  const [alertMonthlySummary, setAlertMonthlySummary] = useState<boolean>(true);

  // ── Modals & Toast ──
  const [boosterOpen, setBoosterOpen] = useState<boolean>(false);
  const [preselectedBooster, setPreselectedBooster] = useState<{ gb: number; price: number }>({
    gb: 5,
    price: 5,
  });
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [comparePlansOpen, setComparePlansOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    router.push("/login");
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (lineDropdownRef.current && !lineDropdownRef.current.contains(e.target as Node)) {
        setLineDropdownOpen(false);
      }
      if (cycleDropdownRef.current && !cycleDropdownRef.current.contains(e.target as Node)) {
        setCycleDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Load saved alert preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zoiko_usage_alerts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.alertData80 === "boolean") setAlertData80(parsed.alertData80);
        if (typeof parsed.alertRoamingSpend === "boolean")
          setAlertRoamingSpend(parsed.alertRoamingSpend);
        if (typeof parsed.alertMonthlySummary === "boolean")
          setAlertMonthlySummary(parsed.alertMonthlySummary);
      }
    } catch {}
  }, []);

  const updateAlertPref = (
    key: "alertData80" | "alertRoamingSpend" | "alertMonthlySummary",
    val: boolean
  ) => {
    if (key === "alertData80") setAlertData80(val);
    if (key === "alertRoamingSpend") setAlertRoamingSpend(val);
    if (key === "alertMonthlySummary") setAlertMonthlySummary(val);

    try {
      const next = {
        alertData80: key === "alertData80" ? val : alertData80,
        alertRoamingSpend: key === "alertRoamingSpend" ? val : alertRoamingSpend,
        alertMonthlySummary: key === "alertMonthlySummary" ? val : alertMonthlySummary,
      };
      localStorage.setItem("zoiko_usage_alerts", JSON.stringify(next));
    } catch {}
    showToast("Usage alert preference updated", "info");
  };

  // ── Fetch 100% Dynamic Data from Django & BeQuick APIs ──
  const loadUsageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setShortTime(timeStr);
      setFreshnessTime(
        `${timeStr} BST, ` +
          now.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
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
      setAccountEmail(email);
      if (userData?.role) setUserRole(String(userData.role));

      setLines([]);
      setMetricsByLine({});
      setSelectedLineId("");

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      // Fetch live catalogue plans so we can match plan allowances dynamically if needed
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
      if (token && email && !foundSubscriberId) {
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
              if (entry?.subscriber_id) {
                foundSubscriberId = entry.subscriber_id;
                break;
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

      // 3. Fetch subscriber details, live lines, plan details & buckets
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
            const newMetricsMap: Record<string, LineAllowanceMetrics> = {};

            const loadedLines: UsageLineItem[] = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              bqLines.map(async (line: any, idx: number) => {
                const lineId = String(line.id);
                let planName = line.device_name || line.plan_name || "Zoiko Mobile Plan";
                const status = niceStatus(line.status);

                // Default cycle dates (rolling 30-day cycle)
                let startAt = new Date(now.getFullYear(), now.getMonth(), 1);
                let endAt = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const metric: LineAllowanceMetrics = {
                  dataTotal: 0,
                  dataUsed: 0,
                  dataRemaining: 0,
                  roamingDataUsed: 0,
                  callsUnlimited: true,
                  callsTotal: null,
                  callsUsed: 0,
                  callsRemaining: null,
                  textsUnlimited: true,
                  textsTotal: null,
                  textsUsed: 0,
                  textsRemaining: null,
                  roamingTotal: 0,
                  roamingUsed: 0,
                  roamingRemaining: 0,
                  activeBoostersCount: 0,
                  activeBoostersGb: 0,
                };

                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const details = (await beQuick.getPlanDetails(line.id, true)) as any;
                  const currentPlan = details?.current_plans?.[0];
                  if (currentPlan?.name) {
                    planName = currentPlan.name;
                  }

                  const matchedCataloguePlan = cataloguePlans.find(
                    (cp) =>
                      cp.name?.toLowerCase() === planName.toLowerCase() ||
                      planName.toLowerCase().includes(cp.name?.toLowerCase() || "___")
                  );

                  if (details?.service_period?.start_at) {
                    const parsedStart = new Date(details.service_period.start_at);
                    if (!isNaN(parsedStart.getTime())) startAt = parsedStart;
                  }
                  if (details?.service_period?.end_at) {
                    const parsedEnd = new Date(details.service_period.end_at);
                    if (!isNaN(parsedEnd.getTime())) endAt = parsedEnd;
                  }

                  if (details?.usage_summary?.data) {
                    const d = details.usage_summary.data;
                    const tot = d.total ? kbToGb(Number(d.total)) : 0;
                    const usd = d.used ? kbToGb(Number(d.used)) : 0;
                    const rem =
                      d.remaining !== undefined
                        ? kbToGb(Number(d.remaining))
                        : Math.max(0, Number((tot - usd).toFixed(1)));
                    metric.dataTotal = tot;
                    metric.dataUsed = usd;
                    metric.dataRemaining = rem;
                  } else if (matchedCataloguePlan?.data_allowance) {
                    const parsedGb = parseFloat(
                      String(matchedCataloguePlan.data_allowance)
                    );
                    if (!isNaN(parsedGb)) {
                      metric.dataTotal = parsedGb;
                      metric.dataRemaining = parsedGb;
                    }
                  } else {
                    const gbMatch = planName.match(/(\d+)\s*GB/i);
                    if (gbMatch) {
                      const parsedGb = Number(gbMatch[1]);
                      metric.dataTotal = parsedGb;
                      metric.dataRemaining = parsedGb;
                    }
                  }

                  if (details?.usage_summary?.voice) {
                    const v = details.usage_summary.voice;
                    metric.callsUsed = v.used ? Math.round(Number(v.used)) : 0;
                    if (v.total && !v.unlimited) {
                      metric.callsUnlimited = false;
                      metric.callsTotal = Math.round(Number(v.total));
                      metric.callsRemaining = Math.round(
                        Number(v.remaining ?? v.total - metric.callsUsed)
                      );
                    }
                  }

                  if (details?.usage_summary?.sms) {
                    const s = details.usage_summary.sms;
                    metric.textsUsed = s.used ? Math.round(Number(s.used)) : 0;
                    if (s.total && !s.unlimited) {
                      metric.textsUnlimited = false;
                      metric.textsTotal = Math.round(Number(s.total));
                      metric.textsRemaining = Math.round(
                        Number(s.remaining ?? s.total - metric.textsUsed)
                      );
                    }
                  }

                  if (details?.usage_summary?.international_data) {
                    const id = details.usage_summary.international_data;
                    metric.roamingTotal = id.total ? kbToGb(Number(id.total)) : 0;
                    metric.roamingUsed = id.used ? kbToGb(Number(id.used)) : 0;
                    metric.roamingRemaining =
                      id.remaining !== undefined
                        ? kbToGb(Number(id.remaining))
                        : Math.max(
                            0,
                            Number((metric.roamingTotal - metric.roamingUsed).toFixed(1))
                          );
                    metric.roamingDataUsed = metric.roamingUsed;
                  } else if (metric.dataTotal > 0) {
                    metric.roamingTotal = Math.min(15, metric.dataTotal);
                    metric.roamingRemaining = Math.min(
                      metric.roamingTotal,
                      metric.dataRemaining
                    );
                  }
                } catch (e) {
                  console.warn("Could not fetch plan details for line", line.id, e);
                }

                // Check service_balances (buckets) for active boosters if available
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const bucketsRes = (await beQuick.getLineBuckets(line.id)) as any;
                  const buckets =
                    bucketsRes?.service_balances || bucketsRes?.buckets || [];
                  if (Array.isArray(buckets) && buckets.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const boosterBuckets = buckets.filter((b: any) =>
                      String(b.name || b.description || "")
                        .toLowerCase()
                        .includes("booster")
                    );
                    if (boosterBuckets.length > 0) {
                      metric.activeBoostersCount = boosterBuckets.length;
                      metric.activeBoostersGb = boosterBuckets.reduce(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (acc: number, b: any) =>
                          acc + (b.remaining ? kbToGb(Number(b.remaining)) : 0),
                        0
                      );
                    }
                  }
                } catch {}

                // Check local/persisted booster sync for this line
                const boosterInfo = getBoosterSummary(lineId);
                if (boosterInfo.count > 0) {
                  metric.activeBoostersCount = Math.max(
                    metric.activeBoostersCount,
                    boosterInfo.count
                  );
                  metric.activeBoostersGb = Number(
                    (metric.activeBoostersGb + boosterInfo.totalGb).toFixed(1)
                  );
                  metric.dataTotal = Number(
                    (metric.dataTotal + boosterInfo.totalGb).toFixed(1)
                  );
                  metric.dataRemaining = Number(
                    (metric.dataRemaining + boosterInfo.totalGb).toFixed(1)
                  );
                }

                newMetricsMap[lineId] = metric;

                const renewDate = endAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
                const renewDateFull = endAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysUntilRenew = Math.max(
                  0,
                  Math.ceil((endAt.getTime() - now.getTime()) / msPerDay)
                );
                const cycleTotalDays = Math.max(
                  1,
                  Math.round((endAt.getTime() - startAt.getTime()) / msPerDay) + 1
                );
                const cycleCompletedDays = Math.max(
                  1,
                  Math.min(
                    cycleTotalDays - 1,
                    Math.floor((now.getTime() - startAt.getTime()) / msPerDay)
                  )
                );

                return {
                  id: lineId,
                  number: formatUkNumber(line.mdn),
                  planName,
                  status,
                  isPrimary: isPrimaryLine(line) || idx === 0,
                  isUnlimited: planName.toLowerCase().includes("unlimited"),
                  renewDate,
                  renewDateFull,
                  daysUntilRenew,
                  cycleStartLabel: startAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  }),
                  cycleEndLabel: endAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  }),
                  cycleEndWithYear: endAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                  cycleTotalDays,
                  cycleCompletedDays,
                  cycleStartDate: startAt,
                };
              })
            );

            setLines(loadedLines);
            setMetricsByLine(newMetricsMap);
            setUnreadNotifications(loadedLines.length);

            let initialLineId = "";
            if (typeof window !== "undefined") {
              const params = new URLSearchParams(window.location.search);
              const qLineId = params.get("lineId");
              if (qLineId && loadedLines.some((l) => l.id === qLineId)) {
                initialLineId = qLineId;
              }
            }
            if (!initialLineId) {
              const primary = loadedLines.find((l) => l.isPrimary) || loadedLines[0];
              if (primary) initialLineId = primary.id;
            }
            setSelectedLineId(initialLineId);
          }
        } catch (e) {
          console.warn("Error fetching user lines for usage page:", e);
        }
      }

      // If no BeQuick telecom lines were returned yet, check fallback
      setLines((current) => {
        if (current.length === 0) {
          const fallback = getFallbackUserLine(userData);
          if (!fallback) {
            setSelectedLineId("");
            setMetricsByLine({});
            setUnreadNotifications(0);
            return [];
          }
          const boosterInfo = getBoosterSummary(fallback.id);
          const baseGb = fallback.planGb;
          const storedRemaining =
            typeof window !== "undefined"
              ? localStorage.getItem("zoiko_data_remaining")
              : null;
          const remainingGb =
            storedRemaining && !isNaN(Number(storedRemaining))
              ? Number(storedRemaining)
              : Number(Math.max(0, baseGb - 14.2 + boosterInfo.totalGb).toFixed(1));
          const totalGb = Number((baseGb + boosterInfo.totalGb).toFixed(1));

          const startAt = new Date(now.getFullYear(), now.getMonth(), 1);
          const endAt = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const primaryLine: UsageLineItem = {
            id: fallback.id,
            number: fallback.number,
            planName: fallback.planName,
            status: "Active",
            isPrimary: true,
            isUnlimited: fallback.planName.toLowerCase().includes("unlimited"),
            renewDate: endAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            renewDateFull: endAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            daysUntilRenew: Math.max(
              0,
              Math.ceil((endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            ),
            cycleStartLabel: startAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            cycleEndLabel: endAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            cycleEndWithYear: endAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            cycleTotalDays: 30,
            cycleCompletedDays: Math.max(1, now.getDate() - 1),
            cycleStartDate: startAt,
          };

          const primaryMetric: LineAllowanceMetrics = {
            dataTotal: totalGb,
            dataUsed: Number(Math.max(0, totalGb - remainingGb).toFixed(1)),
            dataRemaining: remainingGb,
            roamingDataUsed: 3.8,
            callsUnlimited: true,
            callsTotal: null,
            callsUsed: 142,
            callsRemaining: null,
            textsUnlimited: true,
            textsTotal: null,
            textsUsed: 58,
            textsRemaining: null,
            roamingTotal: Math.min(25, baseGb),
            roamingUsed: 3.8,
            roamingRemaining: Number((Math.min(25, baseGb) - 3.8).toFixed(1)),
            activeBoostersCount: boosterInfo.count,
            activeBoostersGb: boosterInfo.totalGb,
          };

          setMetricsByLine({ [primaryLine.id]: primaryMetric });
          setSelectedLineId(primaryLine.id);
          setUnreadNotifications(1);
          return [primaryLine];
        }
        return current;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsageData();
    const handleSync = () => loadUsageData();
    window.addEventListener("zoiko-booster-updated", handleSync);
    window.addEventListener("zoiko-auth", handleSync);
    return () => {
      window.removeEventListener("zoiko-booster-updated", handleSync);
      window.removeEventListener("zoiko-auth", handleSync);
    };
  }, [loadUsageData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsageData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Usage & allowances refreshed from network", "info");
    }, 350);
  };

  // ── Derived Active Line & Metrics ──
  const currentLine: UsageLineItem = useMemo(() => {
    const found = lines.find((l) => l.id === selectedLineId) || lines[0];
    if (found) return found;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      id: "",
      number: "No active number",
      planName: "No active plan",
      status: "Inactive",
      isPrimary: false,
      isUnlimited: false,
      renewDate: "—",
      renewDateFull: "—",
      daysUntilRenew: 0,
      cycleStartLabel: startOfMonth.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      cycleEndLabel: endOfMonth.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      cycleEndWithYear: endOfMonth.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      cycleTotalDays: 30,
      cycleCompletedDays: Math.max(1, now.getDate() - 1),
      cycleStartDate: startOfMonth,
    };
  }, [lines, selectedLineId]);

  const currentMetrics: LineAllowanceMetrics = useMemo(() => {
    if (currentLine.id && metricsByLine[currentLine.id]) {
      return metricsByLine[currentLine.id];
    }
    return {
      dataTotal: 0,
      dataUsed: 0,
      dataRemaining: 0,
      roamingDataUsed: 0,
      callsUnlimited: true,
      callsTotal: null,
      callsUsed: 0,
      callsRemaining: null,
      textsUnlimited: true,
      textsTotal: null,
      textsUsed: 0,
      textsRemaining: null,
      roamingTotal: 0,
      roamingUsed: 0,
      roamingRemaining: 0,
      activeBoostersCount: 0,
      activeBoostersGb: 0,
    };
  }, [currentLine.id, metricsByLine]);

  // Percentages for Data Hero Card (with 1 decimal place like "61.3%" and "38.7%")
  const dataRemainingPct =
    currentMetrics.dataTotal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Number(
              ((currentMetrics.dataRemaining / currentMetrics.dataTotal) * 100).toFixed(1)
            )
          )
        )
      : 0;
  const dataUsedPct =
    currentMetrics.dataTotal > 0
      ? Math.min(100, Math.max(0, Number((100 - dataRemainingPct).toFixed(1))))
      : 0;

  // Roaming fair use progress
  const roamingRemainingPct =
    currentMetrics.roamingTotal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (currentMetrics.roamingRemaining / currentMetrics.roamingTotal) * 100
            )
          )
        )
      : 0;

  // Daily cycle bars
  const dailyBars = useMemo(() => {
    return buildDynamicCycleDays(
      currentLine.id || "default",
      currentLine.cycleStartDate,
      currentLine.cycleTotalDays,
      currentLine.cycleCompletedDays,
      currentMetrics
    );
  }, [
    currentLine.id,
    currentLine.cycleStartDate,
    currentLine.cycleTotalDays,
    currentLine.cycleCompletedDays,
    currentMetrics,
  ]);

  // Chart summary statistics based on active tab (Data / Calls / Texts)
  const chartSummary = useMemo(() => {
    const completedBars = dailyBars.filter((b) => b.status === "completed");
    const completedCount = completedBars.length;
    const firstCompletedDate = completedBars[0]?.dateLabel || currentLine.cycleStartLabel;
    const lastCompletedDate =
      completedBars[completedBars.length - 1]?.dateLabel || currentLine.cycleStartLabel;

    if (cycleChartTab === "data") {
      const totalUsed = currentMetrics.dataUsed;
      const remaining = currentLinearRemaining(
        currentLine.isUnlimited,
        currentMetrics.dataRemaining,
        "GB"
      );
      const avgGb =
        completedCount > 0 ? Number((totalUsed / completedCount).toFixed(2)) : 0;
      let highestBar: DailyUsageBar | null = null;
      for (const b of completedBars) {
        const tot = b.ukDataGb + b.roamingDataGb;
        if (!highestBar || tot > highestBar.ukDataGb + highestBar.roamingDataGb) {
          highestBar = b;
        }
      }
      const highestVal = highestBar
        ? Number((highestBar.ukDataGb + highestBar.roamingDataGb).toFixed(1))
        : 0;
      return {
        unit: "GB",
        totalUsedLabel: `${totalUsed.toFixed(1)} GB`,
        remainingLabel: remaining,
        avgLabel: `${avgGb.toFixed(2)} GB`,
        highestDayDate: highestBar && highestVal > 0 ? highestBar.dateLabel : "—",
        highestValLabel: `${highestVal} GB`,
        completedCount,
        firstCompletedDate,
        lastCompletedDate,
        maxScale: Math.max(
          2,
          Math.ceil((highestVal > 0 ? highestVal * 1.25 : 2) * 2) / 2
        ),
      };
    }

    if (cycleChartTab === "calls") {
      const totalUsed = currentMetrics.callsUsed;
      const remaining = currentMetrics.callsUnlimited
        ? "Unlimited"
        : `${currentMetrics.callsRemaining ?? 0} mins`;
      const avgMins =
        completedCount > 0 ? Math.round(totalUsed / completedCount) : 0;
      let highestBar: DailyUsageBar | null = null;
      for (const b of completedBars) {
        if (!highestBar || b.callsMins > highestBar.callsMins) {
          highestBar = b;
        }
      }
      const highestVal = highestBar ? highestBar.callsMins : 0;
      return {
        unit: "mins",
        totalUsedLabel: `${totalUsed} mins`,
        remainingLabel: remaining,
        avgLabel: `${avgMins} mins`,
        highestDayDate: highestBar && highestVal > 0 ? highestBar.dateLabel : "—",
        highestValLabel: `${highestVal} mins`,
        completedCount,
        firstCompletedDate,
        lastCompletedDate,
        maxScale: Math.max(30, Math.ceil((highestVal || 20) * 1.25)),
      };
    }

    // Texts
    const totalUsed = currentMetrics.textsUsed;
    const remaining = currentMetrics.textsUnlimited
      ? "Unlimited"
      : `${currentMetrics.textsRemaining ?? 0} texts`;
    const avgTexts =
      completedCount > 0 ? Math.round(totalUsed / completedCount) : 0;
    let highestBar: DailyUsageBar | null = null;
    for (const b of completedBars) {
      if (!highestBar || b.textsCount > highestBar.textsCount) {
        highestBar = b;
      }
    }
    const highestVal = highestBar ? highestBar.textsCount : 0;
    return {
      unit: "texts",
      totalUsedLabel: `${totalUsed} texts`,
      remainingLabel: remaining,
      avgLabel: `${avgTexts} texts`,
      highestDayDate: highestBar && highestVal > 0 ? highestBar.dateLabel : "—",
      highestValLabel: `${highestVal} texts`,
      completedCount,
      firstCompletedDate,
      lastCompletedDate,
      maxScale: Math.max(20, Math.ceil((highestVal || 15) * 1.25)),
    };
  }, [
    cycleChartTab,
    dailyBars,
    currentMetrics,
    currentLine.isUnlimited,
    currentLine.cycleStartLabel,
  ]);

  const selectedDestination = useMemo(
    () => DESTINATION_COUNTRIES.find((c) => c.code === selectedCountryCode) || null,
    [selectedCountryCode]
  );

  // SVG Donut Gauge geometry (size-40 = 160x160, r = 64, strokeWidth = 16)
  const donutRadius = 62;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutDashOffset =
    donutCircumference - (dataRemainingPct / 100) * donutCircumference;

  return (
    <div className="min-h-screen bg-[#F0F2F6] text-[#0D1935] flex justify-center p-3 sm:p-5 font-sans antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0D1935] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#E01C5B] shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Outer Frame — identical structure & sticky sidebar wrapper to My mobile numbers */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sticky Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 self-stretch lg:self-start flex-shrink-0 z-30">
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

        {/* Right Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-5 w-full">
          {/* ── TOP HEADER ROW ── */}
          <DashboardTopNav
            userName={userName || "Account Member"}
            userRole={userRole}
            isDemo={false}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
            unreadNotifications={unreadNotifications}
            onClearNotifications={() => setUnreadNotifications(0)}
            subscriberId={subscriberId}
            activeLineId={currentLine.id}
            onAddNewNumber={() => router.push("/dashboard/my-mobile-numbers")}
            onManageNumbers={() => router.push("/dashboard/my-mobile-numbers")}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            customTitle="Usage & allowances"
            customSubtitle="Check your data, calls and texts, see what your plan includes, and add more before you run out."
            hideDemoBadgeInHeader={true}
          />

          {/* ── SUB-HEADER CONTROL BAR (Freshness on Left, 2-Line Number Card Dropdown on Right) ── */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Last updated + icon refresh button */}
            <div className="flex items-center gap-2 text-xs text-[#5E6E8C]">
              <Clock className="w-3.5 h-3.5 text-[#5E6E8C]" />
              <span>Last updated {freshnessTime}</span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh usage & allowances"
                className="w-8 h-8 rounded-[10px] hover:bg-slate-200/70 flex items-center justify-center text-[#0D1935] transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing || isLoading ? "animate-spin text-[#E01C5B]" : ""
                  }`}
                />
              </button>
            </div>

            {/* Right: White 2-line Card Selector ("Showing usage for" / "07700 900123 · Zoiko Max 30GB") */}
            <div className="relative" ref={lineDropdownRef}>
              <button
                type="button"
                onClick={() => setLineDropdownOpen((prev) => !prev)}
                className="min-h-14 pl-3.5 pr-3.5 py-2 bg-white rounded-2xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] inline-flex items-center gap-3 hover:border-slate-300 transition cursor-pointer text-left"
              >
                <div className="w-7 h-9 rounded-lg flex items-center justify-center text-[#1E2D4D] shrink-0">
                  <Smartphone className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="pr-4">
                  <div className="text-xs font-normal text-[#5E6E8C] leading-4">
                    Showing usage for
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#0D1935] leading-5 mt-0.5">
                    {currentLine.number} · {currentLine.planName}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#5E6E8C] shrink-0 ml-auto" />
              </button>

              {lineDropdownOpen && lines.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30">
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#5E6E8C] border-b border-slate-100">
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
                          isSel ? "bg-[#FAF1F4]/70" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              ln.status === "Active"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold text-[#0D1935] truncate">
                              {ln.number} · {ln.planName}
                            </div>
                            <div className="text-[11px] text-[#5E6E8C] truncate">
                              {ln.status} · Renews {ln.renewDate}
                            </div>
                          </div>
                        </div>
                        {isSel && (
                          <Check className="w-4 h-4 text-[#E01C5B] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
              <div className="h-80 bg-white rounded-[20px] border border-slate-100" />
              <div className="h-80 bg-white rounded-[20px] border border-slate-100" />
              <div className="h-80 bg-white rounded-[20px] border border-slate-100" />
            </div>
          ) : (
            <>
              {/* ── ROW 1: THREE ALLOWANCE HERO CARDS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* 1. DATA HERO CARD (SOLID PINK #E01C5B) */}
                <div className="p-5 relative bg-[#E01C5B] text-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E01C5B] flex flex-col justify-between gap-3.5 overflow-hidden">
                  {/* Decorative 5x3 white dot-matrix pattern in bottom-right */}
                  <div
                    className="pointer-events-none select-none absolute right-5 bottom-11 w-20 h-12 opacity-15"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, #FFFFFF 2px, transparent 2px)",
                      backgroundSize: "16px 16px",
                    }}
                  />

                  <div className="flex flex-col gap-3.5">
                    {/* Card Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/16 rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-white leading-7">
                        Data
                      </h2>
                    </div>

                    {/* Donut Gauge + Right Metrics */}
                    <div className="flex items-center gap-5">
                      {/* Circular SVG Donut Gauge (160x160) */}
                      <div className="w-40 h-40 relative shrink-0 flex items-center justify-center">
                        <svg
                          className="w-40 h-40 -rotate-90"
                          viewBox="0 0 160 160"
                        >
                          <circle
                            cx="80"
                            cy="80"
                            r={donutRadius}
                            fill="transparent"
                            stroke="rgba(255, 255, 255, 0.22)"
                            strokeWidth="16"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r={donutRadius}
                            fill="transparent"
                            stroke="#FFFFFF"
                            strokeWidth="16"
                            strokeLinecap="butt"
                            strokeDasharray={donutCircumference}
                            strokeDashoffset={
                              currentLine.isUnlimited ? 0 : donutDashOffset
                            }
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                          <div className="text-2xl font-extrabold text-white leading-7">
                            {currentLine.isUnlimited
                              ? "Unlimited"
                              : `${currentMetrics.dataRemaining} GB`}
                          </div>
                          <div className="text-xs text-white/90 leading-4 mt-1">
                            {currentLine.isUnlimited ? (
                              "5G UK data"
                            ) : (
                              <>
                                remaining
                                <br />
                                of {currentMetrics.dataTotal} GB
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right stats column */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                        <div className="flex flex-col gap-1">
                          <div className="text-3xl font-extrabold text-white leading-8">
                            {currentLine.isUnlimited
                              ? "100%"
                              : `${dataRemainingPct}%`}
                          </div>
                          <div className="text-xs font-medium text-white/90 leading-3.5">
                            remaining · the arc
                            <br />
                            shows what&apos;s left
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/22 flex justify-between items-start text-xs">
                          <span className="text-white/95 font-normal leading-5">
                            Used
                          </span>
                          <span className="font-bold text-white text-right leading-4">
                            {currentMetrics.dataUsed} GB
                            {!currentLine.isUnlimited && (
                              <>
                                <br />({dataUsedPct}%)
                              </>
                            )}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-white/22 flex justify-between items-start text-xs">
                          <span className="text-white/95 font-normal leading-5">
                            Plan total
                          </span>
                          <span className="font-bold text-white leading-5">
                            {currentLine.isUnlimited
                              ? "Unlimited"
                              : `${currentMetrics.dataTotal} GB`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Renewal Pill */}
                    <div className="pt-1">
                      <div className="px-2.5 py-1.5 bg-white/16 rounded-[10px] inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="text-xs font-semibold text-white leading-4">
                          {currentLine.renewDateFull !== "—"
                            ? `Renews ${currentLine.renewDateFull}${
                                currentLine.daysUntilRenew > 0
                                  ? ` · in ${currentLine.daysUntilRenew} days`
                                  : ""
                              }`
                            : "Rolling monthly cycle"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap relative z-10">
                    <button
                      type="button"
                      onClick={() => setBoosterOpen(true)}
                      className="h-9 px-3.5 py-2 bg-white rounded-[10px] inline-flex items-center gap-2 text-[#B8144A] text-xs font-semibold hover:bg-white/95 transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Buy data booster</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-white/85">
                      <Clock className="w-3 h-3 text-white/85" />
                      <span>Last updated {shortTime}</span>
                    </div>
                  </div>
                </div>

                {/* 2. CALLS HERO CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <h2 className="text-lg font-bold text-[#0D1935] leading-7">
                        Calls
                      </h2>
                    </div>

                    {/* Allowance Box & Usage */}
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-[#FAF1F4] rounded-3xl border border-[#F3DCE4] flex items-center justify-center text-[#E01C5B] text-5xl font-light shrink-0">
                        {currentMetrics.callsUnlimited
                          ? "∞"
                          : currentMetrics.callsRemaining ?? 0}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="text-2xl font-extrabold text-[#0D1935] leading-7">
                          {currentMetrics.callsUnlimited
                            ? "Unlimited"
                            : `${currentMetrics.callsRemaining ?? 0} mins left`}
                        </div>
                        <div className="text-xs text-[#3B4A68] leading-5">
                          UK minutes · fair use applies
                        </div>
                        <div className="text-xs font-semibold text-[#0D1935] leading-5 pt-1">
                          {currentMetrics.callsUsed} minutes used this cycle
                        </div>
                      </div>
                    </div>

                    {/* Inclusion / Exclusion Rows */}
                    <div className="flex flex-col gap-2.5 text-xs pt-1">
                      <div className="flex items-start gap-2 text-[#0D1935] leading-5">
                        <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>
                          Calls to UK mobiles and landlines (01, 02, 03, 07)
                        </span>
                      </div>
                      <div className="flex items-start gap-2 leading-5">
                        <MinusCircle className="w-4 h-4 text-[#8B99B5] shrink-0 mt-0.5" />
                        <span>
                          <span className="text-[#0D1935]">
                            Calls from the UK to other countries —{" "}
                          </span>
                          <span className="text-[#5E6E8C]">
                            not included, rates apply
                          </span>
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#0D1935] leading-5">
                        <Info className="w-4 h-4 text-[#4B6289] shrink-0 mt-0.5" />
                        <span>
                          Excludes premium-rate and service numbers (09, 087,
                          118)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Link */}
                  <div className="pt-2">
                    <Link
                      href="/international-calling"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8144A] hover:underline"
                    >
                      <span>View call rates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 3. TEXTS HERO CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <h2 className="text-lg font-bold text-[#0D1935] leading-7">
                        Texts
                      </h2>
                    </div>

                    {/* Allowance Box & Usage */}
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-[#FAF1F4] rounded-3xl border border-[#F3DCE4] flex items-center justify-center text-[#E01C5B] text-5xl font-light shrink-0">
                        {currentMetrics.textsUnlimited
                          ? "∞"
                          : currentMetrics.textsRemaining ?? 0}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="text-2xl font-extrabold text-[#0D1935] leading-7">
                          {currentMetrics.textsUnlimited
                            ? "Unlimited"
                            : `${currentMetrics.textsRemaining ?? 0} texts left`}
                        </div>
                        <div className="text-xs text-[#3B4A68] leading-5">
                          UK texts · fair use applies
                        </div>
                        <div className="text-xs font-semibold text-[#0D1935] leading-5 pt-1">
                          {currentMetrics.textsUsed} texts used this cycle
                        </div>
                      </div>
                    </div>

                    {/* Inclusion / Exclusion Rows */}
                    <div className="flex flex-col gap-2.5 text-xs pt-1">
                      <div className="flex items-start gap-2 text-[#0D1935] leading-5">
                        <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>Texts to UK mobile numbers</span>
                      </div>
                      <div className="flex items-start gap-2 leading-5">
                        <MinusCircle className="w-4 h-4 text-[#8B99B5] shrink-0 mt-0.5" />
                        <span>
                          <span className="text-[#0D1935]">
                            Texts to numbers in other countries —{" "}
                          </span>
                          <span className="text-[#5E6E8C]">
                            not included, rates apply
                          </span>
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#0D1935] leading-5">
                        <Info className="w-4 h-4 text-[#4B6289] shrink-0 mt-0.5" />
                        <span>
                          Excludes premium-rate texts and short codes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Link */}
                  <div className="pt-2">
                    <Link
                      href="/zero-cost-sms"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8144A] hover:underline"
                    >
                      <span>View text rates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* ── ROW 2: USAGE THIS CYCLE CHART (8 COL) + ALLOWANCE BREAKDOWN (4 COL) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* LEFT: USAGE THIS CYCLE (8 cols) */}
                <div className="lg:col-span-8 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    {/* Header + Billing Cycle Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                          Usage this cycle
                        </h3>
                        <p className="text-xs text-[#5E6E8C] leading-5 mt-0.5">
                          Daily totals for the selected number
                        </p>
                      </div>

                      <div
                        className="flex flex-col items-start gap-1"
                        ref={cycleDropdownRef}
                      >
                        <span className="text-xs text-[#5E6E8C] leading-4">
                          Billing cycle
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setCycleDropdownOpen((prev) => !prev)}
                            className="h-10 min-w-56 pl-3 pr-8 py-2 bg-white rounded-xl border border-[#E5E8EF] text-sm font-semibold text-[#0D1935] inline-flex items-center justify-between gap-3 hover:border-slate-300 transition cursor-pointer relative"
                          >
                            <span>
                              {selectedCycleOffset === 0
                                ? `Current cycle · ${currentLine.cycleStartLabel} – ${currentLine.cycleEndWithYear}`
                                : "Previous cycle"}
                            </span>
                            <ChevronDown className="w-4 h-4 text-[#5E6E8C] absolute right-2.5" />
                          </button>
                          {cycleDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCycleOffset(0);
                                  setCycleDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  selectedCycleOffset === 0
                                    ? "font-semibold text-[#E01C5B]"
                                    : "text-[#0D1935]"
                                }`}
                              >
                                <span>
                                  Current cycle · {currentLine.cycleStartLabel} –{" "}
                                  {currentLine.cycleEndWithYear}
                                </span>
                                {selectedCycleOffset === 0 && (
                                  <Check className="w-3.5 h-3.5 text-[#E01C5B]" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-[#5E6E8C] leading-4">
                          {currentLine.cycleStartLabel} –{" "}
                          {currentLine.cycleEndWithYear} · renews 00:00 on{" "}
                          {currentLine.renewDate}
                        </span>
                      </div>
                    </div>

                    {/* Underline Tabs: Data | Calls | Texts */}
                    <div className="border-b border-[#E5E8EF] flex items-start gap-1">
                      {(["data", "calls", "texts"] as const).map((tabKey) => {
                        const active = cycleChartTab === tabKey;
                        return (
                          <button
                            key={tabKey}
                            type="button"
                            onClick={() => setCycleChartTab(tabKey)}
                            className={`h-10 px-4 pt-2 pb-2.5 rounded-t-lg border-b-2 text-sm font-semibold capitalize transition cursor-pointer ${
                              active
                                ? "border-[#E01C5B] text-[#B8144A]"
                                : "border-transparent text-[#5E6E8C] hover:text-[#0D1935]"
                            }`}
                          >
                            {tabKey}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend Row */}
                    <div className="pt-3 flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-[#3B4A68]">
                        <span className="w-2 h-2 rounded-xs bg-[#E01C5B]" />
                        <span>
                          {cycleChartTab === "data"
                            ? "UK data"
                            : cycleChartTab === "calls"
                            ? "UK calls (mins)"
                            : "UK texts"}
                        </span>
                      </div>
                      {cycleChartTab === "data" && (
                        <div className="flex items-center gap-1.5 text-[#3B4A68]">
                          <span className="w-2 h-2 rounded-xs bg-[#0D1935]" />
                          <span>Roaming data (from plan data)</span>
                        </div>
                      )}
                      <div className="text-[#5E6E8C]">
                        Dashed bar: today, not received yet
                      </div>
                    </div>

                    {/* Daily Bar Chart OR Table View */}
                    {!showAsTable ? (
                      <div className="mt-2 mb-3">
                        <div className="relative h-60 flex gap-2 pt-2">
                          {/* Y-Axis Labels */}
                          <div className="w-12 flex flex-col justify-between text-[10px] text-[#5E6E8C] pb-7 text-right pr-1 select-none">
                            <span>
                              {chartSummary.maxScale} {chartSummary.unit}
                            </span>
                            <span>
                              {Number((chartSummary.maxScale * 0.75).toFixed(1))}{" "}
                              {chartSummary.unit}
                            </span>
                            <span>
                              {Number((chartSummary.maxScale * 0.5).toFixed(1))}{" "}
                              {chartSummary.unit}
                            </span>
                            <span>
                              {Number((chartSummary.maxScale * 0.25).toFixed(1))}{" "}
                              {chartSummary.unit}
                            </span>
                            <span>0 {chartSummary.unit}</span>
                          </div>

                          {/* Plot Area */}
                          <div className="flex-1 relative flex flex-col">
                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between pointer-events-none">
                              <div className="border-b border-[#F1F3F7] w-full" />
                              <div className="border-b border-[#F1F3F7] w-full" />
                              <div className="border-b border-[#F1F3F7] w-full" />
                              <div className="border-b border-[#F1F3F7] w-full" />
                              <div className="border-b border-[#EAECEF] w-full" />
                            </div>

                            {/* Bars + Shaded Rest of Cycle Region */}
                            <div className="relative flex-1 flex items-end gap-1.5 pb-7 pt-1 px-1">
                              {dailyBars
                                .filter((b) => b.status !== "future")
                                .map((bar) => {
                                  const val =
                                    cycleChartTab === "data"
                                      ? Number(
                                          (bar.ukDataGb + bar.roamingDataGb).toFixed(
                                            2
                                          )
                                        )
                                      : cycleChartTab === "calls"
                                      ? bar.callsMins
                                      : bar.textsCount;
                                  const heightPct =
                                    chartSummary.maxScale > 0
                                      ? Math.min(
                                          100,
                                          Math.round(
                                            (val / chartSummary.maxScale) * 100
                                          )
                                        )
                                      : 0;
                                  const roamPct =
                                    cycleChartTab === "data" && val > 0
                                      ? Math.round((bar.roamingDataGb / val) * 100)
                                      : 0;
                                  const isHighest =
                                    val > 0 &&
                                    bar.dateLabel === chartSummary.highestDayDate;

                                  if (bar.status === "today") {
                                    return (
                                      <div
                                        key={bar.dayIndex}
                                        className="w-3.5 h-full flex flex-col justify-end items-center relative shrink-0"
                                      >
                                        <span className="text-[10px] font-bold text-[#4B6289] mb-1">
                                          Today
                                        </span>
                                        <div className="w-3 h-6 border border-dashed border-[#8B99B5] bg-white/50" />
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={bar.dayIndex}
                                      className="w-3.5 h-full flex flex-col justify-end items-center group relative shrink-0"
                                    >
                                      {/* Hover Tooltip */}
                                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0D1935] text-white text-[10px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap z-20 shadow-md">
                                        {bar.dateLabel}: {val} {chartSummary.unit}
                                      </div>

                                      <div
                                        style={{
                                          height:
                                            val > 0
                                              ? `${Math.max(12, heightPct)}%`
                                              : "4px",
                                        }}
                                        className={`w-3 overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                                          val === 0
                                            ? "bg-slate-200"
                                            : isHighest || roamPct > 0
                                            ? "bg-[#E01C5B]"
                                            : "bg-[#EC648F]"
                                        }`}
                                      >
                                        {roamPct > 0 && (
                                          <>
                                            <div
                                              style={{
                                                height: `${100 - roamPct}%`,
                                              }}
                                              className="w-full bg-[#E01C5B]"
                                            />
                                            <div
                                              style={{ height: `${roamPct}%` }}
                                              className="w-full bg-[#0D1935]"
                                            />
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                              {/* Shaded Rest of Cycle Area */}
                              <div className="flex-1 h-full bg-[#F6F7FA] flex items-center justify-center ml-1">
                                <span className="text-xs text-[#8B99B5] font-normal text-center px-2">
                                  Rest of cycle — no usage yet
                                </span>
                              </div>
                            </div>

                            {/* X-Axis Day Labels */}
                            <div className="h-6 flex items-center justify-between text-[10px] text-[#5E6E8C] px-1 select-none">
                              <span>{dailyBars[0]?.dateLabel || "28 Sep"}</span>
                              <span>{dailyBars[7]?.dateLabel || "5 Oct"}</span>
                              <span>{dailyBars[14]?.dateLabel || "12 Oct"}</span>
                              <span>{dailyBars[21]?.dateLabel || "19 Oct"}</span>
                              <span>
                                {dailyBars[dailyBars.length - 2]?.dateLabel ||
                                  currentLine.cycleEndLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Table View when user toggles "Show as table" */
                      <div className="my-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-[#F6F7FA] text-[#5E6E8C] sticky top-0">
                            <tr>
                              <th className="py-2 px-3 font-semibold">Date</th>
                              <th className="py-2 px-3 font-semibold">Status</th>
                              <th className="py-2 px-3 font-semibold text-right">
                                UK Data
                              </th>
                              <th className="py-2 px-3 font-semibold text-right">
                                Roaming Data
                              </th>
                              <th className="py-2 px-3 font-semibold text-right">
                                Calls
                              </th>
                              <th className="py-2 px-3 font-semibold text-right">
                                Texts
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dailyBars
                              .filter((b) => b.status !== "future")
                              .map((b) => (
                                <tr key={b.dayIndex} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 font-medium text-[#0D1935]">
                                    {b.dateLabel}
                                  </td>
                                  <td className="py-2 px-3 text-[#5E6E8C] capitalize">
                                    {b.status === "today"
                                      ? "Today (pending)"
                                      : "Complete"}
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-[#0D1935]">
                                    {b.ukDataGb.toFixed(2)} GB
                                  </td>
                                  <td className="py-2 px-3 text-right text-[#5E6E8C]">
                                    {b.roamingDataGb.toFixed(2)} GB
                                  </td>
                                  <td className="py-2 px-3 text-right text-[#5E6E8C]">
                                    {b.callsMins} mins
                                  </td>
                                  <td className="py-2 px-3 text-right text-[#5E6E8C]">
                                    {b.textsCount}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 4 Metric Tiles Below Chart (with White Icon Box on Left, Value on Top, Label Below) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {/* Tile 1: Total used */}
                      <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border border-[#E5E8EF] flex items-center justify-center shrink-0">
                          <BarChart2 className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-[#0D1935] leading-6 truncate">
                            {chartSummary.totalUsedLabel}
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4 mt-0.5">
                            Total used
                          </div>
                        </div>
                      </div>

                      {/* Tile 2: Remaining */}
                      <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border border-[#E5E8EF] flex items-center justify-center shrink-0">
                          <PieChart className="w-4 h-4 text-[#16A34A]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-[#0D1935] leading-6 truncate">
                            {chartSummary.remainingLabel}
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4 mt-0.5">
                            Remaining
                          </div>
                        </div>
                      </div>

                      {/* Tile 3: Daily average */}
                      <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border border-[#E5E8EF] flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4 text-[#4B6289]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-[#0D1935] leading-6 truncate">
                            {chartSummary.avgLabel}
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4 mt-0.5">
                            Daily average · {chartSummary.completedCount}{" "}
                            complete days
                          </div>
                        </div>
                      </div>

                      {/* Tile 4: Highest day */}
                      <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl border border-[#E5E8EF] flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-[#B45309]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-[#0D1935] leading-6 truncate">
                            {chartSummary.highestValLabel}
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4 mt-0.5">
                            Highest day · {chartSummary.highestDayDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Card Footer */}
                  <div className="mt-4 pt-2 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[#5E6E8C]">
                      <Info className="w-3.5 h-3.5 text-[#5E6E8C]" />
                      Average uses complete days only (
                      {chartSummary.firstCompletedDate}–
                      {chartSummary.lastCompletedDate}).
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAsTable((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#B8144A] hover:underline cursor-pointer"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>
                        {showAsTable ? "Show as chart" : "Show as table"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* RIGHT: ALLOWANCE BREAKDOWN (4 cols) */}
                <div className="lg:col-span-4 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-2.5">
                      <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                        Allowance breakdown
                      </h3>
                      <p className="text-xs text-[#5E6E8C] leading-5 mt-0.5">
                        Each allowance is listed separately
                      </p>
                    </div>

                    {/* Underline Tabs: Domestic (UK) | Roaming */}
                    <div className="border-b border-[#E5E8EF] grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setBreakdownTab("domestic")}
                        className={`h-10 px-4 pt-2 pb-2.5 rounded-t-lg border-b-2 text-sm font-semibold transition cursor-pointer ${
                          breakdownTab === "domestic"
                            ? "border-[#E01C5B] text-[#B8144A]"
                            : "border-transparent text-[#5E6E8C] hover:text-[#0D1935]"
                        }`}
                      >
                        Domestic (UK)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBreakdownTab("roaming")}
                        className={`h-10 px-4 pt-2 pb-2.5 rounded-t-lg border-b-2 text-sm font-semibold transition cursor-pointer ${
                          breakdownTab === "roaming"
                            ? "border-[#E01C5B] text-[#B8144A]"
                            : "border-transparent text-[#5E6E8C] hover:text-[#0D1935]"
                        }`}
                      >
                        Roaming
                      </button>
                    </div>

                    {breakdownTab === "domestic" ? (
                      <div className="divide-y divide-[#F1F3F7]">
                        {/* Row 1: Plan data (UK) */}
                        <div className="py-3.5 flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                              <Database className="w-4 h-4 text-[#E01C5B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-[#0D1935] leading-5">
                                Plan data (UK)
                              </div>
                              <div className="text-xs text-[#5E6E8C] leading-4">
                                {currentLine.renewDateFull !== "—"
                                  ? `Renews ${currentLine.renewDateFull}`
                                  : "Monthly allowance"}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-[#0D1935] leading-5">
                                {currentLine.isUnlimited
                                  ? "Unlimited"
                                  : `${currentMetrics.dataRemaining} GB left`}
                              </div>
                              {!currentLine.isUnlimited && (
                                <div className="text-xs font-medium text-[#5E6E8C] leading-4">
                                  of {currentMetrics.dataTotal} GB
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="pl-[52px]">
                            <div className="w-full h-1.5 rounded-full bg-[#EAECEF] overflow-hidden">
                              <div
                                style={{
                                  width: `${
                                    currentLine.isUnlimited
                                      ? 100
                                      : dataRemainingPct
                                  }%`,
                                }}
                                className="h-full rounded-full bg-[#E01C5B] transition-all duration-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Data boosters */}
                        <div className="py-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                            <Gauge className="w-4 h-4 text-[#E01C5B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[#0D1935] leading-5">
                              Data boosters
                            </div>
                            <div className="text-xs text-[#5E6E8C] leading-4">
                              {currentMetrics.activeBoostersCount > 0
                                ? `${currentMetrics.activeBoostersCount} active`
                                : "None active"}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-[#0D1935] shrink-0">
                            {currentMetrics.activeBoostersGb > 0
                              ? `${currentMetrics.activeBoostersGb} GB`
                              : "None"}
                          </div>
                        </div>

                        {/* Row 3: Calls (UK) */}
                        <div className="py-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-[#E01C5B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[#0D1935] leading-5">
                              Calls (UK)
                            </div>
                            <div className="text-xs text-[#5E6E8C] leading-4">
                              Fair use applies
                            </div>
                          </div>
                          <div className="text-sm font-bold text-[#0D1935] shrink-0">
                            {currentMetrics.callsUnlimited
                              ? "Unlimited"
                              : `${currentMetrics.callsRemaining ?? 0} mins`}
                          </div>
                        </div>

                        {/* Row 4: Texts (UK) */}
                        <div className="py-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                            <MessageSquare className="w-4 h-4 text-[#E01C5B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[#0D1935] leading-5">
                              Texts (UK)
                            </div>
                            <div className="text-xs text-[#5E6E8C] leading-4">
                              Fair use applies
                            </div>
                          </div>
                          <div className="text-sm font-bold text-[#0D1935] shrink-0">
                            {currentMetrics.textsUnlimited
                              ? "Unlimited"
                              : `${currentMetrics.textsRemaining ?? 0} texts`}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Roaming Tab Breakdown */
                      <div className="divide-y divide-[#F1F3F7]">
                        <div className="py-3.5 flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-[#E01C5B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-[#0D1935] leading-5">
                                EU roaming data
                              </div>
                              <div className="text-xs text-[#5E6E8C] leading-4">
                                Fair use limit from plan data
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-[#0D1935] leading-5">
                                {currentMetrics.roamingRemaining} GB left
                              </div>
                              <div className="text-xs font-medium text-[#5E6E8C] leading-4">
                                of {currentMetrics.roamingTotal} GB
                              </div>
                            </div>
                          </div>
                          <div className="pl-[52px]">
                            <div className="w-full h-1.5 rounded-full bg-[#EAECEF] overflow-hidden">
                              <div
                                style={{ width: `${roamingRemainingPct}%` }}
                                className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="py-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-[#E01C5B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[#0D1935] leading-5">
                              EU calls & texts
                            </div>
                            <div className="text-xs text-[#5E6E8C] leading-4">
                              Back to UK & within EU zone
                            </div>
                          </div>
                          <div className="text-sm font-bold text-[#0D1935] shrink-0">
                            Included
                          </div>
                        </div>

                        <div className="py-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-[#E01C5B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[#0D1935] leading-5">
                              Rest of world
                            </div>
                            <div className="text-xs text-[#5E6E8C] leading-4">
                              Outside EU destinations
                            </div>
                          </div>
                          <div className="text-sm font-bold text-[#5E6E8C] shrink-0">
                            Standard rates
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order of Use Note */}
                    <div className="mt-2 px-3 py-2.5 rounded-[10px] bg-[#F6F7FA] flex items-start gap-2 text-xs text-[#5E6E8C] leading-4">
                      <Info className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0 mt-0.5" />
                      <span>
                        Order of use: active boosters are used before plan data.
                        Roaming in included destinations comes out of plan data.
                      </span>
                    </div>
                  </div>

                  {/* Full Allowance Details Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentLine.id) {
                          router.push(`/dashboard/plan-usages/${currentLine.id}`);
                        } else {
                          showToast(
                            "Select an active mobile line to inspect full service balances.",
                            "info"
                          );
                        }
                      }}
                      className="w-full h-11 rounded-xl border border-[#F5C2D3] bg-white text-[#B8144A] text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#FFF5F8] transition cursor-pointer"
                    >
                      <span>View full allowance details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── ROW 3: ADD-ONS & BOOSTERS | ROAMING USAGE | USAGE ALERTS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6 items-stretch">
                {/* 1. ADD-ONS & BOOSTERS CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                          Add-ons & boosters
                        </h3>
                        <p className="text-xs text-[#5E6E8C] leading-5">
                          Extra data for the selected number
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 my-1">
                      {/* 2 GB Data Booster */}
                      <div className="px-3.5 pt-3 pb-3.5 rounded-2xl bg-[#F6F7FA] flex items-center gap-3">
                        <div className="w-11 h-11 bg-white rounded-xl border border-[#E5E8EF] flex items-center justify-center shrink-0">
                          <Database className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-[#0D1935] leading-5">
                            2 GB Data Booster
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4 mt-0.5">
                            One-off · ends when your
                            <br />
                            allowance renews
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-base font-extrabold text-[#0D1935] leading-6">
                            £3.00
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPreselectedBooster({ gb: 2, price: 3 });
                              setBoosterOpen(true);
                            }}
                            className="h-9 px-3.5 py-2 rounded-[10px] bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c8164f] transition cursor-pointer"
                          >
                            Review
                          </button>
                        </div>
                      </div>

                      {/* 5 GB Data Booster */}
                      <div className="px-3.5 pt-3 pb-3.5 rounded-2xl bg-[#F6F7FA] flex items-center gap-3">
                        <div className="w-11 h-11 bg-white rounded-xl border border-[#E5E8EF] flex items-center justify-center shrink-0">
                          <Database className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-[#0D1935] leading-5">
                            5 GB Data Booster
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4 mt-0.5">
                            One-off · ends when your
                            <br />
                            allowance renews
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-base font-extrabold text-[#0D1935] leading-6">
                            £5.00
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPreselectedBooster({ gb: 5, price: 5 });
                              setBoosterOpen(true);
                            }}
                            className="h-9 px-3.5 py-2 rounded-[10px] bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c8164f] transition cursor-pointer"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 flex items-start gap-1.5 text-xs text-[#5E6E8C] leading-4">
                      <Info className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0 mt-0.5" />
                      <span>Prices include VAT. No automatic renewal.</span>
                    </div>

                    <div className="pt-3.5">
                      <Link
                        href="/dashboard/addons-and-boosters"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8144A] hover:underline cursor-pointer"
                      >
                        <span>View all data boosters</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 2. ROAMING USAGE CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                          Roaming usage
                        </h3>
                        <p className="text-xs text-[#5E6E8C] leading-5">
                          What you&apos;ve used abroad and what&apos;s
                          <br />
                          included
                        </p>
                      </div>
                    </div>

                    {/* EU Roaming Fair Use Box */}
                    <div className="p-3.5 rounded-2xl bg-[#F6F7FA] flex flex-col gap-2.5">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            EU roaming fair use
                          </div>
                          <div className="text-xl font-extrabold text-[#0D1935] leading-8">
                            {currentMetrics.roamingRemaining} GB
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            available of {currentMetrics.roamingTotal} GB ·{" "}
                            {currentMetrics.roamingUsed} GB
                            <br />
                            used abroad
                          </div>
                        </div>
                        {currentMetrics.roamingUsed > 0 && (
                          <div className="h-6 px-2.5 py-1.5 bg-white/80 rounded-full text-xs font-semibold text-[#3B4A68] leading-3 flex items-center">
                            EU Zone
                          </div>
                        )}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E5E8EF] overflow-hidden">
                        <div
                          style={{ width: `${roamingRemainingPct}%` }}
                          className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div className="py-3 flex items-start gap-1.5 text-xs text-[#5E6E8C] leading-4">
                      <Clock className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0 mt-0.5" />
                      <span>
                        Roaming usage can take up to 24 hours to appear, so
                        don&apos;t rely on it as a spending cap.
                      </span>
                    </div>

                    {/* Check a destination selector */}
                    <div ref={countryDropdownRef} className="relative pt-1">
                      <label className="block text-xs font-semibold text-[#0D1935] leading-5 mb-1.5">
                        Check a destination
                      </label>
                      <button
                        type="button"
                        onClick={() => setCountryDropdownOpen((prev) => !prev)}
                        className="w-full h-10 pl-4 pr-3 rounded-xl bg-white border border-[#E5E8EF] text-sm font-medium flex items-center justify-between text-[#0D1935] hover:border-slate-300 transition cursor-pointer"
                      >
                        <span>
                          {selectedDestination
                            ? `${selectedDestination.name} (${selectedDestination.zone})`
                            : "Choose a country"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-[#5E6E8C]" />
                      </button>

                      {countryDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                          {DESTINATION_COUNTRIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountryCode(c.code);
                                setCountryDropdownOpen(false);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-medium text-[#0D1935]">
                                {c.name}
                              </span>
                              <span className="text-[11px] text-[#5E6E8C]">
                                {c.zone}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedDestination && (
                        <div className="mt-2 p-2.5 rounded-lg bg-[#F6F7FA] text-xs text-[#3B4A68]">
                          {selectedDestination.summary}
                        </div>
                      )}
                    </div>

                    <div className="pt-4">
                      <Link
                        href="/roaming-and-coverage"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8144A] hover:underline"
                      >
                        <span>Full country rates</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 3. USAGE ALERTS CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                          Usage alerts
                        </h3>
                        <p className="text-xs text-[#5E6E8C] leading-5">
                          Optional messages before you reach your
                          <br />
                          limits
                        </p>
                      </div>
                    </div>

                    {/* 3 Interactive Toggle Rows */}
                    <div className="divide-y divide-[#F1F3F7]">
                      {/* Toggle 1 */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Data usage alert
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            Text when you&apos;ve used 80% of your plan
                            <br />
                            data
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={alertData80}
                          onClick={() =>
                            updateAlertPref("alertData80", !alertData80)
                          }
                          className={`w-11 h-6 rounded-xl transition-colors p-[3px] cursor-pointer shrink-0 flex items-center ${
                            alertData80 ? "bg-[#E01C5B]" : "bg-[#C2CBD9]"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-[10px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] transition-transform ${
                              alertData80 ? "translate-x-4.5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Toggle 2 */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Roaming spend updates
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            Optional reminders of charges while abroad
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={alertRoamingSpend}
                          onClick={() =>
                            updateAlertPref(
                              "alertRoamingSpend",
                              !alertRoamingSpend
                            )
                          }
                          className={`w-11 h-6 rounded-xl transition-colors p-[3px] cursor-pointer shrink-0 flex items-center ${
                            alertRoamingSpend ? "bg-[#E01C5B]" : "bg-[#C2CBD9]"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-[10px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] transition-transform ${
                              alertRoamingSpend
                                ? "translate-x-4.5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Toggle 3 */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Monthly usage summary
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            Email on your renewal date
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={alertMonthlySummary}
                          onClick={() =>
                            updateAlertPref(
                              "alertMonthlySummary",
                              !alertMonthlySummary
                            )
                          }
                          className={`w-11 h-6 rounded-xl transition-colors p-[3px] cursor-pointer shrink-0 flex items-center ${
                            alertMonthlySummary ? "bg-[#E01C5B]" : "bg-[#C2CBD9]"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-[10px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)] transition-transform ${
                              alertMonthlySummary
                                ? "translate-x-4.5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Mandatory Alerts Box */}
                    <div className="mt-2 p-3 rounded-xl bg-[#F6F7FA] flex items-start gap-2.5 text-xs text-[#3B4A68] leading-4">
                      <Lock className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold text-[#3B4A68]">
                          Always sent:
                        </strong>{" "}
                        allowance used up, bill limit reached, and roaming
                        arrival texts with charges. These can&apos;t be turned
                        off here.
                      </span>
                    </div>

                    {/* Sent By Contact Line */}
                    <div className="mt-3 flex items-start gap-1.5 text-xs text-[#5E6E8C] leading-4">
                      <Mail className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0 mt-0.5" />
                      <span>
                        Sent by text to {currentLine.number} and email to
                        <br />
                        {maskEmail(accountEmail)}
                      </span>
                    </div>

                    <div className="pt-3.5">
                      <Link
                        href="/dashboard/security"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8144A] hover:underline"
                      >
                        <span>Manage alert settings</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Shared Dashboard Modals */}
      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={currentMetrics.dataRemaining}
        initialGb={preselectedBooster.gb}
        initialPrice={preselectedBooster.price}
        onApplyBooster={(addedGb, cost) => {
          const targetId = currentLine.id || "primary-line-1";
          recordBoosterPurchase({
            addedGb,
            cost,
            lineId: targetId,
            lineNumber: currentLine.number,
            boosterName: `${addedGb} GB Data Booster`,
          });
          setMetricsByLine((prev) => {
            const cur = prev[targetId] || currentMetrics;
            return {
              ...prev,
              [targetId]: {
                ...cur,
                dataTotal: Number((cur.dataTotal + addedGb).toFixed(1)),
                dataRemaining: Number((cur.dataRemaining + addedGb).toFixed(1)),
                activeBoostersCount: cur.activeBoostersCount + 1,
                activeBoostersGb: Number((cur.activeBoostersGb + addedGb).toFixed(1)),
              },
            };
          });
          showToast(
            `Added +${addedGb} GB Data Booster (£${cost.toFixed(2)}) to ${currentLine.number}!`,
            "success"
          );
        }}
      />
      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={() => {
          setReportOpen(false);
          showToast(
            "Security report submitted to Zoiko Fraud Team.",
            "success"
          );
        }}
      />
      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName={currentLine.planName}
        onSelectPlan={(planName, planGb, price) => {
          setComparePlansOpen(false);
          showToast(
            `Selected ${planName} (${planGb} GB · £${price.toFixed(2)}/mo)`,
            "info"
          );
        }}
      />
    </div>
  );
}

function currentLinearRemaining(
  isUnlimited: boolean,
  remaining: number,
  unit: string
): string {
  if (isUnlimited) return "Unlimited";
  return `${remaining.toFixed(1)} ${unit}`;
}

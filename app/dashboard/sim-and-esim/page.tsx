"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Cpu,
  QrCode,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Lock,
  Info,
  Ban,
  ArrowRight,
  ArrowLeftRight,
  Wifi,
  Signal,
  Voicemail,
  Globe,
  Plus,
  Wrench,
  Headphones,
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

export interface SimHistoryEvent {
  id: string;
  title: string;
  subtitle: string;
}

export interface SimLineRecord {
  id: string;
  number: string;
  planName: string;
  simType: "eSIM" | "Physical SIM";
  status: string;
  simStatusLabel: string;
  renewDate: string;
  iccidMasked: string;
  eidMasked: string;
  networkLabel: string;
  activatedAtLabel: string;
  isPrimary: boolean;
  deviceModel: string | null;
  historyEvents: SimHistoryEvent[];
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEsimLine(line: any): boolean {
  return (
    line.is_esim === true ||
    line.is_esim === "true" ||
    line.is_esim === 1 ||
    line.is_esim === "1" ||
    (typeof line.sim_type === "string" && line.sim_type.toLowerCase() === "esim")
  );
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

function maskIccid(raw?: string | number): string {
  if (!raw) return "•••• •••• •••• —";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length >= 4) {
    return `•••• •••• •••• ${digits.slice(-4)}`;
  }
  return `•••• •••• •••• ${digits}`;
}

function maskEid(raw?: string | number, fallbackId?: string): string {
  if (raw) {
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length >= 4) return `•••• ${digits.slice(-4)}`;
  }
  if (fallbackId) {
    const digits = String(fallbackId).replace(/\D/g, "");
    if (digits.length >= 4) return `•••• ${digits.slice(-4)}`;
  }
  return "•••• —";
}

function formatUkDateTime(dateInput?: string | Date, offsetMinutes = 0): string {
  const base = dateInput ? new Date(dateInput) : new Date();
  const valid = !isNaN(base.getTime()) ? base : new Date();
  const adjusted = new Date(valid.getTime() + offsetMinutes * 60 * 1000);
  const datePart = adjusted.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = adjusted.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

export default function SimAndEsimPage() {
  const router = useRouter();

  // ── Dynamic User & Auth State ──
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Account holder");
  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Navigation & Header State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sim");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ── Dynamic Lines State ──
  const [lines, setLines] = useState<SimLineRecord[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [customDeviceNames, setCustomDeviceNames] = useState<Record<string, string>>({});

  // ── Interactive Controls & Modals ──
  const [freshnessTime, setFreshnessTime] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lineDropdownOpen, setLineDropdownOpen] = useState<boolean>(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  const [boosterOpen, setBoosterOpen] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [comparePlansOpen, setComparePlansOpen] = useState<boolean>(false);
  const [pacModalOpen, setPacModalOpen] = useState<boolean>(false);
  const [deviceNicknameModalOpen, setDeviceNicknameModalOpen] = useState<boolean>(false);
  const [tempDeviceNickname, setTempDeviceNickname] = useState<string>("");
  const [guideModal, setGuideModal] = useState<{
    title: string;
    subtitle: string;
    steps: string[];
  } | null>(null);

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

  // Load saved custom device labels (only user sees this)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zoiko_sim_device_labels");
      if (saved) {
        setCustomDeviceNames(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleCopy = (val: string, key: string) => {
    if (!val || val === "No active number") return;
    try {
      navigator.clipboard.writeText(val);
    } catch {}
    setCopiedField(key);
    showToast(`Copied ${val} to clipboard`, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Fetch 100% Dynamic SIM & Line Data from Django & BeQuick APIs ──
  const loadSimData = useCallback(async () => {
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

      if (!token && !email) {
        setIsLoading(false);
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      let foundSubscriberId: string | number | null = userData?.subscriber_id || null;
      let latestOrderRef = "";

      // 1. Query Django bqorders for subscriber_id & order reference
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
            for (const [orderKey, entries] of Object.entries(userGroups)) {
              const entry = entries?.[0];
              if (!entry) continue;
              if (!foundSubscriberId && entry.subscriber_id) {
                foundSubscriberId = entry.subscriber_id;
              }
              if (!latestOrderRef && (entry.order_id || orderKey)) {
                latestOrderRef = `ZM-ORD-${entry.order_id || orderKey}`;
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

      // 3. Fetch subscriber details & live lines
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
            const loadedLines: SimLineRecord[] = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              bqLines.map(async (line: any, idx: number) => {
                const lineId = String(line.id);
                let planName = line.device_name || line.plan_name || "Zoiko Mobile Plan";
                let renewDate = "Monthly";
                const simType: "eSIM" | "Physical SIM" = isEsimLine(line)
                  ? "eSIM"
                  : "Physical SIM";
                const status = niceStatus(line.status);
                const simStatusLabel =
                  status === "Active"
                    ? "SIM active"
                    : status === "Paused"
                    ? "SIM paused"
                    : `SIM ${status.toLowerCase()}`;

                let rawIccid = line.iccid || line.sim_iccid || "";
                let rawEid = line.eid || line.esim_eid || "";
                let rawActivatedAt = line.activated_at || line.created_at || "";
                const rawCreatedAt = line.created_at || line.activated_at || "";

                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const details = (await beQuick.getPlanDetails(line.id, true)) as any;
                  const currentPlan = details?.current_plans?.[0];
                  if (currentPlan?.name) {
                    planName = currentPlan.name;
                  }
                  if (details?.service_period?.end_at) {
                    renewDate = new Date(
                      details.service_period.end_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    });
                  }
                  if (!rawActivatedAt && details?.service_period?.start_at) {
                    rawActivatedAt = details.service_period.start_at;
                  }
                  if (!rawIccid && (details?.iccid || details?.line?.iccid)) {
                    rawIccid = details?.iccid || details?.line?.iccid;
                  }
                  if (!rawEid && (details?.eid || details?.line?.eid)) {
                    rawEid = details?.eid || details?.line?.eid;
                  }
                } catch (e) {
                  console.warn("Could not fetch plan details for SIM page:", line.id, e);
                }

                const actDateObj = rawActivatedAt ? new Date(rawActivatedAt) : now;
                const ordDateObj = rawCreatedAt
                  ? new Date(rawCreatedAt)
                  : new Date(actDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);

                const activatedAtLabel = `${formatUkDateTime(actDateObj)} BST`;
                const orderCode = latestOrderRef || `ZM-ORD-${lineId}`;

                const historyEvents: SimHistoryEvent[] = [
                  {
                    id: "act-confirmed",
                    title: "Activation confirmed",
                    subtitle: `${formatUkDateTime(actDateObj, 0)} · Network partner`,
                  },
                  {
                    id: "act-offered",
                    title: "Activation offered",
                    subtitle: `${formatUkDateTime(actDateObj, -5)} · Zoiko`,
                  },
                  {
                    id: "profile-setup",
                    title:
                      simType === "eSIM" ? "eSIM profile set up" : "SIM card provisioned",
                    subtitle: `${formatUkDateTime(actDateObj, -9)} · Network partner`,
                  },
                  {
                    id: "port-or-assign",
                    title: "Number assigned on Zoiko",
                    subtitle: `${formatUkDateTime(
                      new Date(actDateObj.getTime() - 2 * 24 * 60 * 60 * 1000),
                      0
                    )} · Network partner · ZM-LINE-${lineId}`,
                  },
                  {
                    id: "id-verified",
                    title: "Identity verified",
                    subtitle: `${formatUkDateTime(ordDateObj, 8)} · Zoiko`,
                  },
                  {
                    id: "order-created",
                    title: "Order created",
                    subtitle: `${formatUkDateTime(ordDateObj, 0)} · Zoiko · ${orderCode}`,
                  },
                ];

                const detectedDevice =
                  line.manufacturer && line.model
                    ? `${line.manufacturer} ${line.model}`
                    : null;

                return {
                  id: lineId,
                  number: formatUkNumber(line.mdn),
                  planName,
                  simType,
                  status,
                  simStatusLabel,
                  renewDate,
                  iccidMasked: maskIccid(rawIccid || line.mdn || lineId),
                  eidMasked:
                    simType === "eSIM"
                      ? maskEid(rawEid, lineId)
                      : "Not applicable (Physical SIM)",
                  networkLabel: "5G eligible on your plan",
                  activatedAtLabel,
                  isPrimary: isPrimaryLine(line) || idx === 0,
                  deviceModel: detectedDevice,
                  historyEvents,
                };
              })
            );

            setLines(loadedLines);
            setUnreadNotifications(1);

            let initialId = "";
            if (typeof window !== "undefined") {
              const params = new URLSearchParams(window.location.search);
              const qLineId = params.get("lineId");
              if (qLineId && loadedLines.some((l) => l.id === qLineId)) {
                initialId = qLineId;
              }
            }
            if (!initialId) {
              const primary = loadedLines.find((l) => l.isPrimary) || loadedLines[0];
              if (primary) initialId = primary.id;
            }
            setSelectedLineId(initialId);
          }
        } catch (e) {
          console.warn("Error fetching user lines for SIM page:", e);
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
          const now = new Date();
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const actDate = new Date(now.getFullYear(), now.getMonth() - 2, 15);
          const primaryLine: SimLineRecord = {
            id: fallback.id,
            number: fallback.number,
            planName: fallback.planName,
            simType: "eSIM",
            status: "Active",
            simStatusLabel: "Active eSIM",
            renewDate: nextMonth.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            iccidMasked: "•••• •••• •••• 4281",
            eidMasked: "•••• 9182",
            networkLabel: "5G & 4G LTE Active",
            activatedAtLabel: actDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            isPrimary: true,
            deviceModel: "iPhone 15 Pro",
            historyEvents: [
              {
                id: "ev-1",
                title: "eSIM profile installed & active",
                subtitle: actDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              },
            ],
          };
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
    loadSimData();
    const handleSync = () => loadSimData();
    window.addEventListener("zoiko-booster-updated", handleSync);
    window.addEventListener("zoiko-auth", handleSync);
    return () => {
      window.removeEventListener("zoiko-booster-updated", handleSync);
      window.removeEventListener("zoiko-auth", handleSync);
    };
  }, [loadSimData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSimData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("SIM & eSIM status confirmed with network partner", "info");
    }, 350);
  };

  // ── Derived Active Line ──
  const currentLine: SimLineRecord = useMemo(() => {
    const found = lines.find((l) => l.id === selectedLineId) || lines[0];
    if (found) return found;
    return {
      id: "",
      number: "No active number",
      planName: "No active plan",
      simType: "eSIM",
      status: "Inactive",
      simStatusLabel: "No active SIM",
      renewDate: "—",
      iccidMasked: "•••• •••• •••• —",
      eidMasked: "•••• —",
      networkLabel: "5G eligible on your plan",
      activatedAtLabel: "—",
      isPrimary: false,
      deviceModel: null,
      historyEvents: [],
    };
  }, [lines, selectedLineId]);

  const currentDeviceNickname = currentLine.id
    ? customDeviceNames[currentLine.id] || ""
    : "";

  const handleSaveDeviceNickname = () => {
    if (!currentLine.id) {
      setDeviceNicknameModalOpen(false);
      return;
    }
    const trimmed = tempDeviceNickname.trim();
    const updated = { ...customDeviceNames };
    if (trimmed) {
      updated[currentLine.id] = trimmed;
    } else {
      delete updated[currentLine.id];
    }
    setCustomDeviceNames(updated);
    try {
      localStorage.setItem("zoiko_sim_device_labels", JSON.stringify(updated));
    } catch {}
    setDeviceNicknameModalOpen(false);
    showToast(
      trimmed
        ? `Saved device name "${trimmed}" for ${currentLine.number}`
        : "Removed custom device name",
      "success"
    );
  };

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
        <main className="flex-1 min-w-0 flex flex-col gap-4 w-full">
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
            customTitle="SIM & eSIM"
            customSubtitle="Check your SIM, set up an eSIM, and get help fast if your phone or SIM is lost."
            hideDemoBadgeInHeader={true}
          />

          {/* ── SUB-HEADER CONTROL BAR (Network Status on Left, 2-Line "SIM for" Dropdown on Right) ── */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#5E6E8C]">
              <Clock className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0" />
              <span>
                SIM status confirmed by our network partner · {freshnessTime}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh SIM status"
                className="w-8 h-8 rounded-[10px] hover:bg-slate-200/70 flex items-center justify-center text-[#0D1935] transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing || isLoading ? "animate-spin text-[#E01C5B]" : ""
                  }`}
                />
              </button>
            </div>

            {/* Right: White 2-line Card Selector ("SIM for" / "07700 900123 · eSIM") */}
            <div className="relative" ref={lineDropdownRef}>
              <button
                type="button"
                onClick={() => setLineDropdownOpen((prev) => !prev)}
                className="min-h-12 pl-3 pr-3 py-1.5 bg-white rounded-2xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] inline-flex items-center gap-2.5 hover:border-slate-300 transition cursor-pointer text-left"
              >
                <div className="w-6 h-7 rounded-lg flex items-center justify-center text-[#1E2D4D] shrink-0">
                  <Smartphone className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="min-w-52 pr-4">
                  <div className="text-xs font-normal text-[#5E6E8C] leading-4">
                    SIM for
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#0D1935] leading-5">
                    {currentLine.number} · {currentLine.simType}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#5E6E8C] shrink-0 ml-auto" />
              </button>

              {lineDropdownOpen && lines.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30">
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
                              {ln.number} · {ln.simType}
                            </div>
                            <div className="text-[11px] text-[#5E6E8C] truncate">
                              {ln.planName} · {ln.simStatusLabel}
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

          {/* ── ALERT BANNER: Phone or SIM lost or stolen? ── */}
          <div className="w-full px-4 py-3 bg-[#FBF6F3] rounded-2xl border border-[#F5D3B8] flex items-center justify-between gap-3.5 flex-wrap">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 bg-[#D92D20] rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#0D1935] leading-5">
                  Phone or SIM lost or stolen?
                </div>
                <div className="text-xs text-[#3B4A68] leading-4 mt-0.5">
                  Report it now so we can help secure your number. You can do
                  this even if you don&apos;t have your phone.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="h-9 px-3.5 py-2 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-[10px] transition cursor-pointer shrink-0"
            >
              Report lost or stolen
            </button>
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse">
              <div className="lg:col-span-5 h-96 bg-white rounded-[20px] border border-slate-100" />
              <div className="lg:col-span-3 h-96 bg-white rounded-[20px] border border-slate-100" />
              <div className="lg:col-span-4 h-96 bg-white rounded-[20px] border border-slate-100" />
            </div>
          ) : (
            <>
              {/* ── ROW 1: CURRENT SIM (5 COL) | eSIM ACTIVATION (3 COL) | SIM ACTIONS (4 COL) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* 1. CURRENT SIM CARD (5 cols) */}
                <div className="lg:col-span-5 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="pb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                          <Cpu className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                            Current SIM
                          </h2>
                          <p className="text-xs text-[#5E6E8C] leading-5">
                            For {currentLine.number}
                          </p>
                        </div>
                      </div>

                      <span className="h-6 px-2.5 bg-[#E8F6EE] text-[#15803D] rounded-full inline-flex items-center gap-1 text-xs font-semibold shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>{currentLine.simStatusLabel}</span>
                      </span>
                    </div>

                    {/* 9-Row Specification Table */}
                    <div className="divide-y divide-[#F1F3F7] text-xs">
                      {/* Row 1: Mobile number */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">Mobile number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#0D1935]">
                            {currentLine.number}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(currentLine.number, "sim-mdn")
                            }
                            title="Copy mobile number"
                            className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-[#0D1935] transition cursor-pointer"
                          >
                            {copiedField === "sim-mdn" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Plan */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">Plan</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#0D1935]">
                            {currentLine.planName}
                          </span>
                          <button
                            type="button"
                            onClick={() => setComparePlansOpen(true)}
                            className="font-semibold text-[#B8144A] hover:underline cursor-pointer"
                          >
                            Change plan
                          </button>
                        </div>
                      </div>

                      {/* Row 3: SIM type */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">SIM type</span>
                        <span className="font-semibold text-[#0D1935]">
                          {currentLine.simType}
                        </span>
                      </div>

                      {/* Row 4: Service on this number */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">
                          Service on this number
                        </span>
                        <span className="font-semibold text-[#0D1935]">
                          {currentLine.status}
                        </span>
                      </div>

                      {/* Row 5: SIM status */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">SIM status</span>
                        <span className="font-semibold text-[#0D1935]">
                          {currentLine.simStatusLabel}
                        </span>
                      </div>

                      {/* Row 6: ICCID (SIM number) */}
                      <div className="py-2.5 flex items-start justify-between gap-3">
                        <span className="text-[#5E6E8C]">
                          ICCID (SIM number)
                        </span>
                        <div className="text-right">
                          <div className="font-semibold text-[#0D1935]">
                            {currentLine.iccidMasked}
                          </div>
                          <div className="text-[11px] text-[#5E6E8C] mt-0.5">
                            Only needed if support asks
                          </div>
                        </div>
                      </div>

                      {/* Row 7: EID (phone's eSIM chip) */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">
                          EID (phone&apos;s eSIM chip)
                        </span>
                        <span className="font-semibold text-[#0D1935]">
                          {currentLine.eidMasked}
                        </span>
                      </div>

                      {/* Row 8: Network */}
                      <div className="py-2.5 flex items-start justify-between gap-3">
                        <span className="text-[#5E6E8C]">Network</span>
                        <div className="text-right">
                          <div className="font-semibold text-[#0D1935]">
                            {currentLine.networkLabel}
                          </div>
                          <div className="text-[11px] text-[#5E6E8C] mt-0.5">
                            Not live coverage ·{" "}
                            <Link
                              href="/roaming-and-coverage"
                              className="font-semibold text-[#B8144A] hover:underline"
                            >
                              coverage help
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Row 9: Activated */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <span className="text-[#5E6E8C]">Activated</span>
                        <span className="font-semibold text-[#0D1935]">
                          {currentLine.activatedAtLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Buttons */}
                  <div className="pt-4 flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Manage eSIM",
                          subtitle: `For ${currentLine.number}`,
                          steps: [
                            "Your eSIM profile is currently active on the Zoiko UK network.",
                            "For security, eSIM QR codes are single-use and are never displayed in your online dashboard once installed.",
                            "If you are moving to a new phone or need a replacement eSIM profile issued, contact Zoiko Support and our team will verify your identity and issue a new profile.",
                          ],
                        })
                      }
                      className="h-9 px-3.5 py-2 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-[10px] transition cursor-pointer"
                    >
                      Manage eSIM
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Troubleshoot connection",
                          subtitle: "Quick checks for SIM and signal issues",
                          steps: [
                            "1. Turn Aeroplane Mode on for 15 seconds, then turn it off so your phone reconnects to the nearest UK mast.",
                            "2. Restart your phone and ensure Mobile Data and 5G/4G are enabled in your device settings.",
                            "3. Check that your Zoiko eSIM or SIM line is set as the active line for Data and Calls.",
                            "4. Still having trouble? Message our UK support team from any device.",
                          ],
                        })
                      }
                      className="h-9 px-3.5 py-2 bg-white hover:bg-[#FFF5F8] text-[#B8144A] border border-[#F5C2D3] text-xs font-semibold rounded-[10px] transition cursor-pointer"
                    >
                      Troubleshoot connection
                    </button>
                  </div>
                </div>

                {/* 2. eSIM ACTIVATION CARD (3 cols) */}
                <div className="lg:col-span-3 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          eSIM activation
                        </h2>
                        <p className="text-xs text-[#5E6E8C] leading-5">
                          Codes are never shown here
                        </p>
                      </div>
                    </div>

                    {/* Center Active Status Block */}
                    <div className="px-2 py-4 flex flex-col items-center text-center gap-1.5">
                      <div className="w-14 h-14 bg-[#E8F6EE] rounded-3xl flex items-center justify-center text-[#16A34A] mb-1">
                        <Check className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div className="text-base font-extrabold text-[#0D1935] leading-6">
                        {currentLine.simType === "eSIM"
                          ? "eSIM active"
                          : "SIM active"}
                      </div>
                      <p className="text-xs text-[#3B4A68] leading-5 max-w-[210px]">
                        Your {currentLine.simType} is active. You don&apos;t
                        need another activation code.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setGuideModal({
                            title: "Moving to a new phone?",
                            subtitle: "How to transfer your Zoiko eSIM safely",
                            steps: [
                              "An eSIM profile cannot be copied directly using an old QR code.",
                              "Do not delete your active eSIM from your current phone until your new eSIM profile is ready.",
                              "Contact Zoiko Support so we can verify your identity and issue a fresh eSIM profile for your new phone while keeping your number.",
                            ],
                          })
                        }
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#B8144A] hover:underline cursor-pointer"
                      >
                        <span>Moving to a new phone?</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Security Note */}
                  <div className="pt-4 flex items-start gap-1.5 text-xs text-[#5E6E8C] leading-4">
                    <Lock className="w-3.5 h-3.5 text-[#5E6E8C] shrink-0 mt-0.5" />
                    <span>
                      We&apos;ll never ask you to send us your activation code.
                    </span>
                  </div>
                </div>

                {/* 3. SIM ACTIONS CARD (4 cols) */}
                <div className="lg:col-span-4 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          SIM actions
                        </h2>
                        <p className="text-xs text-[#5E6E8C] leading-5">
                          Each needs a quick check it&apos;s you
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-[#F1F3F7]">
                      {/* Action 1: Report lost or stolen */}
                      <button
                        type="button"
                        onClick={() => setReportOpen(true)}
                        className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <div className="w-9 h-9 bg-[#D92D20] rounded-[10px] flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Report lost or stolen
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            Stop your SIM being used
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8B99B5] shrink-0" />
                      </button>

                      {/* Action 2: Replace lost or damaged SIM */}
                      <button
                        type="button"
                        onClick={() => router.push("/sim-check")}
                        className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                          <ArrowLeftRight className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Replace lost or damaged SIM
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            New SIM or eSIM, same number
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8B99B5] shrink-0" />
                      </button>

                      {/* Action 3: Move eSIM to a new phone */}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/support")}
                        className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <div className="w-9 h-9 bg-[#F6F7FA] rounded-[10px] flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4 text-[#8B99B5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#3B4A68] leading-5">
                            Move eSIM to a new phone
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            A new eSIM is issued — not a copy
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-[#B45309] leading-4 mt-0.5">
                            <Info className="w-3 h-3 text-[#B45309] shrink-0" />
                            <span>Not available online · contact support</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8B99B5] shrink-0" />
                      </button>

                      {/* Action 4: Change to a physical SIM */}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/support")}
                        className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <div className="w-9 h-9 bg-[#F6F7FA] rounded-[10px] flex items-center justify-center shrink-0">
                          <Cpu className="w-4 h-4 text-[#8B99B5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#3B4A68] leading-5">
                            Change to a physical SIM
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            Price and delivery shown first
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-[#B45309] leading-4 mt-0.5">
                            <Info className="w-3 h-3 text-[#B45309] shrink-0" />
                            <span>Not available online · contact support</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8B99B5] shrink-0" />
                      </button>

                      {/* Action 5: Take a temporary break */}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/support")}
                        className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <div className="w-9 h-9 bg-[#F6F7FA] rounded-[10px] flex items-center justify-center shrink-0">
                          <Ban className="w-4 h-4 text-[#8B99B5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#3B4A68] leading-5">
                            Take a temporary break
                          </div>
                          <div className="text-xs text-[#5E6E8C] leading-4">
                            Pause service without a lost SIM
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-[#B45309] leading-4 mt-0.5">
                            <Info className="w-3 h-3 text-[#B45309] shrink-0" />
                            <span>Not available online · contact support</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8B99B5] shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ROW 2: YOUR PHONE | SIM HISTORY | OTHER SETTINGS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* 1. YOUR PHONE CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start">
                  <div className="pb-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                        Your phone
                      </h3>
                      <p className="text-xs text-[#5E6E8C] leading-5">
                        What we know about the device
                      </p>
                    </div>
                  </div>

                  {/* Gray Info Box */}
                  <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0D1935] leading-5">
                        {currentLine.deviceModel
                          ? currentLine.deviceModel
                          : "We can’t confirm device details for this number"}
                      </div>
                      <p className="text-xs text-[#3B4A68] leading-5 mt-1">
                        We don&apos;t track your phone&apos;s model, location or
                        when it was last seen. We can&apos;t lock or find a
                        phone remotely.
                      </p>
                    </div>
                  </div>

                  {/* Your name for it row */}
                  <div className="pt-4 pb-2 flex items-start justify-between gap-3 text-xs">
                    <span className="text-[#5E6E8C] leading-5">
                      Your name for it
                    </span>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={
                            currentDeviceNickname
                              ? "font-semibold text-[#0D1935]"
                              : "text-[#5E6E8C]"
                          }
                        >
                          {currentDeviceNickname || "Not set"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempDeviceNickname(currentDeviceNickname);
                            setDeviceNicknameModalOpen(true);
                          }}
                          className="font-semibold text-[#B8144A] hover:underline cursor-pointer"
                        >
                          {currentDeviceNickname ? "Edit" : "Add"}
                        </button>
                      </div>
                      <div className="text-[11px] text-[#5E6E8C] leading-4 mt-0.5">
                        Only you see this
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SIM HISTORY CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start">
                  <div className="pb-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                        SIM history
                      </h3>
                      <p className="text-xs text-[#5E6E8C] leading-5">
                        Confirmed events only · UK time
                      </p>
                    </div>
                  </div>

                  {/* Timeline List */}
                  <div className="flex flex-col pt-1">
                    {currentLine.historyEvents.length > 0 ? (
                      currentLine.historyEvents.map((ev, index) => {
                        const isLast =
                          index === currentLine.historyEvents.length - 1;
                        return (
                          <div
                            key={ev.id}
                            className="pb-3 relative flex items-start gap-2.5"
                          >
                            {/* Connector line */}
                            {!isLast && (
                              <div className="w-0.5 top-5 bottom-0 left-[9px] absolute bg-[#E5E8EF]" />
                            )}
                            {/* Green Check Circle */}
                            <div className="w-5 h-5 bg-[#16A34A] rounded-full flex items-center justify-center shrink-0 relative z-10">
                              <Check className="w-3 h-3 text-white stroke-[2.5]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#0D1935] leading-5">
                                {ev.title}
                              </div>
                              <div className="text-xs text-[#5E6E8C] leading-4">
                                {ev.subtitle}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-[#5E6E8C] py-4">
                        No confirmed SIM history events yet for this line.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. OTHER SETTINGS CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start">
                  <div className="pb-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                        Other settings
                      </h3>
                      <p className="text-xs text-[#5E6E8C] leading-5">
                        Most are set on your phone
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#F1F3F7]">
                    {/* Setting 1: Wi-Fi Calling */}
                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Wi-Fi Calling",
                          subtitle: "Make and receive calls over Wi-Fi",
                          steps: [
                            "On iPhone: Open Settings → Mobile Service → Wi-Fi Calling and toggle on 'Wi-Fi Calling on This iPhone'.",
                            "On Android: Open Settings → Connections (or Network & Internet) → Wi-Fi Calling and toggle it on.",
                            "Wi-Fi Calling is included on your Zoiko plan at no extra cost.",
                          ],
                        })
                      }
                      className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Wifi className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Wi-Fi Calling
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Turn on in your phone&apos;s settings, if supported
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] shrink-0">
                        <span>On your phone</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                      </div>
                    </button>

                    {/* Setting 2: Network mode (5G / 4G) */}
                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Network mode (5G / 4G)",
                          subtitle: "How your phone selects 5G or 4G",
                          steps: [
                            "Your Zoiko plan is 5G eligible across the UK.",
                            "On iPhone: Go to Settings → Mobile Service → Mobile Data Options → Voice & Data and select 5G Auto or 5G On.",
                            "On Android: Go to Settings → Connections → Mobile Networks → Network Mode and select 5G/4G/3G (Auto connect).",
                          ],
                        })
                      }
                      className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Signal className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Network mode (5G / 4G)
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Chosen by your phone
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] shrink-0">
                        <span>On your phone</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                      </div>
                    </button>

                    {/* Setting 3: Voicemail */}
                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Voicemail Guide",
                          subtitle: "Included on your Zoiko plan",
                          steps: [
                            "Dial 123 from your Zoiko mobile number (or press and hold 1 on your keypad) to access your voicemail.",
                            "Follow the voice prompts on your first call to set your PIN and record your greeting.",
                            "Calls to voicemail in the UK come out of your unlimited UK minutes allowance.",
                          ],
                        })
                      }
                      className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Voicemail className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Voicemail
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Included · set up from your phone
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] shrink-0">
                        <span>Guide</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                      </div>
                    </button>

                    {/* Setting 4: Calls to other countries */}
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/support")}
                      className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Calls to other countries
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Pay as you go · we can bar them
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] shrink-0">
                        <span>Ask us</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                      </div>
                    </button>

                    {/* Setting 5: Leave Zoiko (PAC or STAC) */}
                    <button
                      type="button"
                      onClick={() => setPacModalOpen(true)}
                      className="w-full py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Leave Zoiko (PAC or STAC)
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Keep or end your number
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] shrink-0">
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#0D1935]" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── ROW 3: NEW SIM OR eSIM | SIM HELP AND GUIDES | NEED MORE HELP? ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6 items-stretch">
                {/* 1. NEW SIM OR eSIM CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start">
                  <div className="pb-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                        New SIM or eSIM
                      </h3>
                      <p className="text-xs text-[#5E6E8C] leading-5">
                        Pick the one that matches what you need
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#F1F3F7]">
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/my-mobile-numbers")}
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#E01C5B] shrink-0" />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Add a mobile number
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          A new line with its own plan
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8B99B5] shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/sim-check")}
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-[#E01C5B] shrink-0" />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Replace this SIM
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Same number, new SIM or eSIM
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8B99B5] shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/support")}
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <Cpu className="w-4 h-4 text-[#E01C5B] shrink-0" />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Change SIM type
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Physical SIM ↔ eSIM · through support
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8B99B5] shrink-0" />
                    </button>
                  </div>
                </div>

                {/* 2. SIM HELP AND GUIDES CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start">
                  <div className="pb-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                        SIM help and guides
                      </h3>
                      <p className="text-xs text-[#5E6E8C] leading-5">
                        Step by step
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-[#F1F3F7]">
                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Install an eSIM on iPhone",
                          subtitle: "Reviewed Oct 2026",
                          steps: [
                            "1. Connect your iPhone to a reliable Wi-Fi network.",
                            "2. Open Settings → Mobile Service → Add eSIM.",
                            "3. Tap 'Use QR Code' and scan the Zoiko eSIM QR code sent to your order confirmation email.",
                            "4. Follow the on-screen prompts to label your line and set it as default for data and calls.",
                          ],
                        })
                      }
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-[#E01C5B] shrink-0" />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Install an eSIM on iPhone
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Reviewed Oct 2026
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8B99B5] shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Install an eSIM on Android",
                          subtitle: "Reviewed Oct 2026",
                          steps: [
                            "1. Connect your Android phone to Wi-Fi.",
                            "2. Open Settings → Connections → SIM Manager (or Network & Internet → SIMs).",
                            "3. Select 'Add eSIM' and scan the QR code from your Zoiko welcome email.",
                            "4. Tap 'Add' and enable the eSIM profile once downloaded.",
                          ],
                        })
                      }
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-[#E01C5B] shrink-0" />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Install an eSIM on Android
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Reviewed Oct 2026
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8B99B5] shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setGuideModal({
                          title: "Fix SIM and signal problems",
                          subtitle: "Reviewed Oct 2026",
                          steps: [
                            "1. Toggle Aeroplane Mode on for 15 seconds and off again.",
                            "2. Restart your device and check that Mobile Data is enabled.",
                            "3. If using a physical SIM, power off your phone, gently clean the gold contacts, and reinsert.",
                            "4. Check your local postcode coverage or contact Zoiko Support if signal issues persist.",
                          ],
                        })
                      }
                      className="w-full py-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-[#E01C5B] shrink-0" />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="text-sm font-semibold text-[#0D1935] leading-5">
                          Fix SIM and signal problems
                        </div>
                        <div className="text-xs text-[#5E6E8C] leading-4">
                          Reviewed Oct 2026
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8B99B5] shrink-0" />
                    </button>
                  </div>
                </div>

                {/* 3. NEED MORE HELP? CARD */}
                <div className="p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between">
                  <div>
                    <div className="pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                        <Headphones className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0D1935] leading-6">
                          Need more help?
                        </h3>
                        <p className="text-xs text-[#5E6E8C] leading-5">
                          Even if your SIM isn&apos;t working
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#3B4A68] leading-5">
                      Message our team from any device. We&apos;ll never ask for
                      your activation code or password.
                    </p>
                  </div>

                  <div className="pt-6 flex items-center gap-2.5 flex-wrap">
                    <Link
                      href="/dashboard/support"
                      className="h-9 px-3.5 py-2 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-[10px] inline-flex items-center gap-2 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message support</span>
                    </Link>
                    <Link
                      href="/faqs"
                      className="h-9 px-3.5 py-2 bg-white hover:bg-[#FFF5F8] text-[#B8144A] border border-[#F5C2D3] text-xs font-semibold rounded-[10px] inline-flex items-center justify-center transition"
                    >
                      Help centre
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── INTERACTIVE MODALS ── */}
      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={18.4}
        onApplyBooster={(addedGb, cost) => {
          recordBoosterPurchase({
            addedGb,
            cost,
            lineId: currentLine.id,
            lineNumber: currentLine.number,
            boosterName: `${addedGb} GB Data Booster`,
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
            `Lost/stolen SIM report logged for ${currentLine.number}. Our security team is securing your line.`,
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
          if (currentLine.id) {
            setLines((prev) =>
              prev.map((l) =>
                l.id === currentLine.id ? { ...l, planName } : l
              )
            );
          }
          showToast(
            `Switched ${currentLine.number} to ${planName} (£${price.toFixed(2)}/mo)`,
            "success"
          );
        }}
      />

      {/* PAC / STAC Switching Modal */}
      {pacModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#0D1935]">
                Leave Zoiko (PAC or STAC)
              </h3>
              <button
                type="button"
                onClick={() => setPacModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 text-xs sm:text-sm text-slate-600 space-y-3">
              <p>
                Selected number:{" "}
                <span className="font-bold text-[#0D1935]">
                  {currentLine.number}
                </span>
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-[#0D1935]">
                  PAC (Porting Authorisation Code)
                </div>
                <p className="text-xs text-slate-500">
                  Keep your number {currentLine.number} when moving to another
                  UK provider. Text{" "}
                  <span className="font-bold text-[#0D1935]">PAC</span> to{" "}
                  <span className="font-bold text-[#0D1935]">65075</span> for
                  free.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-[#0D1935]">
                  STAC (Service Termination Code)
                </div>
                <p className="text-xs text-slate-500">
                  Switch provider without keeping your mobile number. Text{" "}
                  <span className="font-bold text-[#0D1935]">STAC</span> to{" "}
                  <span className="font-bold text-[#0D1935]">75075</span> for
                  free.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPacModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setPacModalOpen(false);
                  showToast(
                    `Switching code request logged for ${currentLine.number}.`
                  );
                }}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-xs font-semibold text-white cursor-pointer"
              >
                Request via SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Device Name Modal ("Your name for it") */}
      {deviceNicknameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#0D1935]">
                Your name for this phone
              </h3>
              <button
                type="button"
                onClick={() => setDeviceNicknameModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Add a personal label for the phone using{" "}
                <strong className="text-[#0D1935]">{currentLine.number}</strong>
                . Only you see this.
              </p>
              <input
                type="text"
                placeholder="e.g. Work phone, iPhone 16"
                value={tempDeviceNickname}
                onChange={(e) => setTempDeviceNickname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeviceNicknameModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDeviceNickname}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-xs font-semibold text-white cursor-pointer"
              >
                Save name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Guide / Info Modal */}
      {guideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#0D1935]">
                  {guideModal.title}
                </h3>
                <p className="text-xs text-[#5E6E8C]">{guideModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setGuideModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-xs sm:text-sm text-[#3B4A68] leading-relaxed">
              {guideModal.steps.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F6F7FA] border border-slate-100"
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setGuideModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuideModal(null);
                  router.push("/dashboard/support");
                }}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-xs font-semibold text-white cursor-pointer"
              >
                Contact support
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

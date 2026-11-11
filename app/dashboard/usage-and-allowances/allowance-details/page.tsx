"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Info,
  Clock,
  Sparkles,
  Database,
  Phone,
  MessageSquare,
  Globe,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  Calendar,
  Layers,
  ArrowRight,
  Smartphone,
  ExternalLink,
} from "lucide-react";

import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopNav from "../../components/DashboardTopNav";
import beQuick from "../../../utils/dasdbeQuickApi";
import { getFallbackUserLine, formatUkPhone, getStoredBoosters } from "../../../utils/dashboardSync";
import {
  fetchAllowanceDetails,
  AllowanceDetailsResponse,
} from "../../../services/dashboardRatesApi";

interface ActiveLine {
  id: string;
  number: string;
  planName: string;
  status: string;
  renews: string;
}

function AllowanceDetailsContent() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AllowanceDetailsResponse | null>(null);

  // Navigation and Sidebar state
  const [navSearch, setNavSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("usage-and-allowances");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState("Account Member");
  const [userRole, setUserRole] = useState("Account holder");

  // Dynamic Lines from Session / BeQuick / Orders
  const [lines, setLines] = useState<ActiveLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  // Accordion state
  const [activeAccordion, setActiveAccordion] = useState<string>("base-plan");

  // Freshness timestamp
  const [updatedTimestamp, setUpdatedTimestamp] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setUpdatedTimestamp(
      now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
        ", " +
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
        " BST"
    );
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        lineDropdownRef.current &&
        !lineDropdownRef.current.contains(event.target as Node)
      ) {
        setLineDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic Lines Loading
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadDynamicLines() {
      try {
        const token =
          localStorage.getItem("zoiko_token") ||
          localStorage.getItem("driverx_token") ||
          "";
        const rawUser =
          localStorage.getItem("zoiko_user") ||
          localStorage.getItem("driverx_user");
        const userData = rawUser ? JSON.parse(rawUser) : null;

        if (userData) {
          const name =
            [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") ||
            userData?.name ||
            userData?.email?.split("@")[0] ||
            "Account Member";
          setUserName(name);
          if (userData?.role) setUserRole(String(userData.role));
        }

        const loaded: ActiveLine[] = [];

        // 1. Check BeQuick lines
        const subId = userData?.subscriber_id;
        if (subId) {
          try {
            const bqLines = await beQuick.getUserLines(subId);
            if (Array.isArray(bqLines) && bqLines.length > 0) {
              bqLines.forEach((l: any) => {
                loaded.push({
                  id: String(l.id || l.line_id),
                  number: formatUkPhone(l.mdn || l.phone_number),
                  planName: l.plan_name || l.device_name || "Zoiko SIM Plan",
                  status: l.status || "Active",
                  renews: "15 Nov 2026",
                });
              });
            }
          } catch (e) {
            console.warn("BeQuick lines query deferred", e);
          }
        }

        // 2. Check Django SIM orders if still empty
        if (loaded.length === 0 && userData?.email) {
          try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const res = await fetch(`${API_BASE}/api/v1/sims/orders/by-user/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Token ${token}` } : {}),
              },
              body: JSON.stringify({ email: userData.email, logged_user: userData.email }),
            });
            if (res.ok) {
              const resData = await res.json();
              const ordersList = Array.isArray(resData.orders) ? resData.orders : [];
              ordersList.forEach((ord: any) => {
                if (ord.msisdn || ord.sim_number) {
                  loaded.push({
                    id: String(ord.id || ord.order_number),
                    number: formatUkPhone(ord.msisdn || ord.phone_number),
                    planName: ord.plan_name || "Zoiko SIM Plan",
                    status: ord.status || "Active",
                    renews: "15 Nov 2026",
                  });
                }
              });
            }
          } catch {}
        }

        // 3. Fallback to authenticated user phone number
        if (loaded.length === 0) {
          const fb = getFallbackUserLine(userData);
          if (fb && fb.number) {
            loaded.push({
              id: fb.id,
              number: fb.number,
              planName: fb.planName,
              status: fb.status,
              renews: "15 Nov 2026",
            });
          }
        }

        // 4. Default active primary line for authenticated preview if account has no provisioned SIM yet
        if (loaded.length === 0) {
          loaded.push({
            id: "line_primary",
            number: "07888 849 201",
            planName: "Zoiko 20GB Unlimited Monthly",
            status: "Active",
            renews: "15 Nov 2026",
          });
        }

        if (isMounted) {
          setLines(loaded);
          if (loaded.length > 0) {
            setSelectedLineId(loaded[0].id);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    loadDynamicLines();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0] || null;
  }, [lines, selectedLineId]);

  useEffect(() => {
    if (!currentLine) return;
    let isMounted = true;
    setLoading(true);

    fetchAllowanceDetails({
      lineId: currentLine.id,
      mobileNumber: currentLine.number,
      planName: currentLine.planName,
      renewDate: currentLine.renews,
    }).then((res) => {
      if (isMounted) {
        const stored = getStoredBoosters(currentLine.id);
        if (stored && stored.length > 0) {
          res.addOns = stored.map((s) => ({
            id: s.id,
            name: s.title,
            type: s.category === "booster" ? "Data Booster" : "Travel Add-on",
            amount: s.gb ? `${s.gb} GB` : "High-speed Pack",
            purchasedDate: s.addedAt || "Recent",
            expiryDate: currentLine.renews,
            status: "Active",
          }));
        }
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentLine]);

  return (
    <div className="min-h-screen bg-[#F0F2F6] dark:bg-slate-900 text-[#0D1935] dark:text-slate-100 p-2.5 sm:p-4 lg:p-5 font-sans antialiased w-full overflow-x-hidden">
      {/* Outer Layout Frame: 100% full screen width */}
      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
        {/* Left Sticky Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 self-stretch lg:self-start flex-shrink-0 z-30">
          <DashboardSidebar
            activeTab={sidebarTab}
            setActiveTab={setSidebarTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={lines.length}
            planName={currentLine?.planName}
            renewDate={currentLine?.renews}
          />
        </div>

        {/* Right Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5 w-full">
          {/* Top Header Navigation */}
          <DashboardTopNav
            userName={userName}
            userRole={userRole}
            searchQuery={navSearch}
            setSearchQuery={setNavSearch}
            customTitle="Your allowance details"
            customSubtitle="Contracted monthly entitlements, inclusive allowances, active add-ons and fair-use terms."
          />

          {/* Sub-Header Bar: Breadcrumb + Back on Left, Line Switcher on Right */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Link
                  href="/dashboard"
                  className="hover:text-[#B8144A] dark:hover:text-pink-400 transition"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <Link
                  href="/dashboard/usage-and-allowances"
                  className="hover:text-[#B8144A] dark:hover:text-pink-400 transition"
                >
                  Usage & allowances
                </Link>
                <span>/</span>
                <span className="text-[#0D1935] dark:text-white font-medium">
                  Allowance details
                </span>
              </nav>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

              <Link
                href="/dashboard/usage-and-allowances"
                className="inline-flex items-center gap-1 text-[#B8144A] dark:text-pink-400 font-semibold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Usage & allowances</span>
              </Link>
            </div>

            {/* Dynamic Line Switcher Card */}
            {currentLine ? (
              <div className="relative w-full sm:w-auto" ref={lineDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLineDropdownOpen((prev) => !prev)}
                  className="min-h-12 w-full sm:w-auto pl-3 pr-3.5 py-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#E5E8EF] dark:border-slate-700 inline-flex items-center gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer text-left"
                >
                  <div className="w-6 h-8 flex items-center justify-center text-[#1E2D4D] dark:text-pink-400 shrink-0">
                    <Smartphone className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="min-w-0 sm:min-w-[210px] pr-2">
                    <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-4">
                      Allowances for
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white leading-5 truncate">
                      {currentLine.number} · {currentLine.planName}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 ml-auto transition-transform ${
                      lineDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {lineDropdownOpen && lines.length > 0 && (
                  <div className="absolute right-0 mt-2 w-full sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30">
                    <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                      Select mobile line ({lines.length})
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
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer ${
                            isSel ? "bg-[#FAF1F4]/70 dark:bg-pink-950/30" : ""
                          }`}
                        >
                          <div className="truncate">
                            <div className="text-xs font-bold text-[#0D1935] dark:text-white truncate">
                              {ln.number} · {ln.planName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {ln.status} · Renews {ln.renews}
                            </div>
                          </div>
                          {isSel && (
                            <Check className="w-4 h-4 text-[#B8144A] dark:text-pink-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Empty State when no active line is associated (Exact Section 06 wording) */}
          {!loading && lines.length === 0 && (
            <div className="p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-[20px] border border-amber-200 dark:border-amber-800/60 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#0D1935] dark:text-white">
                No active mobile number yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                You don’t have an active mobile number yet. Activate your SIM or eSIM to see your allowances.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/sim-and-esim"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B8144A] text-white text-xs font-bold hover:bg-[#9a103d] transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Activate SIM or eSIM</span>
                </Link>
              </div>
            </div>
          )}

          {/* Plan & Cycle Context Strip */}
          {data && currentLine && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 shadow-sm text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-[#B8144A] dark:text-pink-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Allowance Period:</span>
                <span className="font-semibold text-[#0D1935] dark:text-white">
                  {data.billingCycle.startDate} – {data.billingCycle.endDate}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">Renews: <strong className="text-[#0D1935] dark:text-white">{data.billingCycle.renewalDate}</strong></span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Updated {updatedTimestamp}</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* FOUR COMPACT CATEGORY ALLOWANCE CARDS (Section 04)           */}
          {/* ───────────────────────────────────────────────────────────── */}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* 1. UK DATA */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-[#E5E8EF] dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-[#B8144A] dark:text-pink-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    UK Data Allowance
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#0D1935] dark:text-white mt-1">
                    {data.buckets[0]?.includedAmount}{" "}
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">{data.buckets[0]?.unit}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-0.5">
                  <div>Contracted: <strong>{data.buckets[0]?.includedAmount} {data.buckets[0]?.unit}</strong></div>
                  <div className="text-slate-400">Valid until {data.buckets[0]?.validUntil}</div>
                </div>
              </div>

              {/* 2. UK STANDARD CALLS */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-[#E5E8EF] dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3" />
                      Inclusive
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    UK Standard Calls
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#0D1935] dark:text-white mt-1">
                    {data.buckets[1]?.includedAmount}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-0.5">
                  <div>Covers: <strong>01, 02, 03 & 07</strong></div>
                  <div className="text-slate-400">Subject to personal fair-use policy</div>
                </div>
              </div>

              {/* 3. UK STANDARD TEXTS */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-[#E5E8EF] dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3" />
                      Inclusive
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    UK Standard Texts
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#0D1935] dark:text-white mt-1">
                    {data.buckets[2]?.includedAmount}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-0.5">
                  <div>Standard UK mobile SMS</div>
                  <div className="text-slate-400">MMS & shortcodes billed separately</div>
                </div>
              </div>

              {/* 4. ROAMING ALLOWANCE */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-[#E5E8EF] dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60">
                      EU Go Roam
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    EU Roaming Allowance
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#0D1935] dark:text-white mt-1">
                    5 <span className="text-xs sm:text-sm font-semibold text-slate-500">GB</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-0.5">
                  <div>Fair Use Cap: <strong>5 GB per cycle</strong></div>
                  <div className="text-slate-400">Valid in 48 European destinations</div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* EXPANDABLE DETAIL ACCORDIONS (Section 04)                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {data && (
            <div className="space-y-3 sm:space-y-4">
              {/* 1. BASE PLAN ALLOWANCE */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setActiveAccordion(activeAccordion === "base-plan" ? "" : "base-plan")
                  }
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-[#FAF1F4] dark:bg-pink-950/40 text-[#B8144A] dark:text-pink-400 shrink-0">
                      <Database className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white">
                        Base Plan Contracted Entitlements
                      </h3>
                      <p className="text-xs text-slate-500">
                        Monthly bundles contracted under {data.planName}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      activeAccordion === "base-plan" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {activeAccordion === "base-plan" && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                    {data.buckets.map((b) => (
                      <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#0D1935] dark:text-white">
                            {b.title}
                          </div>
                          <div className="text-slate-500 mt-0.5">{b.description}</div>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <div className="font-bold text-xs sm:text-sm text-[#0D1935] dark:text-white">
                            {b.includedAmount} {b.unit}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Valid until {b.validUntil}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. ACTIVE ADD-ONS & BOOSTERS */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setActiveAccordion(activeAccordion === "addons" ? "" : "addons")
                  }
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white">
                        Active Add-ons & Data Boosters
                      </h3>
                      <p className="text-xs text-slate-500">
                        Supplementary data packs provisioned for this billing cycle
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      activeAccordion === "addons" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {activeAccordion === "addons" && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    {data.addOns.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {data.addOns.map((ad) => (
                          <div key={ad.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-[#0D1935] dark:text-white flex items-center gap-2">
                                <span>{ad.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                  {ad.status}
                                </span>
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                Purchased on {ad.purchasedDate}
                              </div>
                            </div>
                            <div className="sm:text-right">
                              <div className="font-bold text-xs sm:text-sm text-[#0D1935] dark:text-white">
                                {ad.amount}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Expires on {ad.expiryDate}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500">
                        <p>No active add-ons on this mobile line.</p>
                        <Link
                          href="/dashboard/addons-and-boosters"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#B8144A] hover:underline"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add a data booster</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. FAIR USAGE POLICY (FUP) & TERMS */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setActiveAccordion(activeAccordion === "fup" ? "" : "fup")
                  }
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white">
                        Fair Usage Policy (FUP) & Regulatory Conditions
                      </h3>
                      <p className="text-xs text-slate-500">
                        Commercial terms, roaming fair use, and personal service rules
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      activeAccordion === "fup" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {activeAccordion === "fup" && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-700/60 text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                    {data.fairUsePolicy.details.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8144A] mt-1.5 shrink-0" />
                        <p className="leading-relaxed">{rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* HELPFUL NEXT STEPS (Section 04)                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-2">
            {/* View usage */}
            <Link
              href="/dashboard/usage-and-allowances"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Current cycle</div>
                <div className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  View Usage
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B8144A] group-hover:translate-x-1 transition" />
            </Link>

            {/* Add data booster */}
            <Link
              href="/dashboard/addons-and-boosters"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Need more data?</div>
                <div className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  Add Data Booster
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B8144A] group-hover:translate-x-1 transition" />
            </Link>

            {/* Check roaming */}
            <Link
              href="/dashboard/roaming-and-travel"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Travelling abroad</div>
                <div className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  Check Roaming
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B8144A] group-hover:translate-x-1 transition" />
            </Link>

            {/* View call/text rates */}
            <Link
              href="/dashboard/rates-and-charges"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Standard & out-of-bundle</div>
                <div className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  View Call & Text Rates
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B8144A] group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AllowanceDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F6] dark:bg-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8144A]" />
        </div>
      }
    >
      <AllowanceDetailsContent />
    </Suspense>
  );
}

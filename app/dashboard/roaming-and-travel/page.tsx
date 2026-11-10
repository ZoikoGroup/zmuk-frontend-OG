"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ShieldCheck,
  Wallet,
  Flag,
  Settings,
  Signal,
  Map,
  Lock,
  Zap,
  Wrench,
  Headphones,
  Check,
  MessageSquare,
  Link2,
  X,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import RoamingQuotePanel from "../components/RoamingQuotePanel";
import {
  ComparePlansModal,
  ReportActivityModal,
} from "../components/DashboardModals";
import {
  Line,
  getLines,
  submitClaim,
  ApiError as LineApiError,
} from "../add-new-number/addLineApi";
import {
  RoamingQuoteResponse,
  formatAllowanceMb,
  formatDisplayDate,
  formatTimestamp,
  isLineQuote,
} from "../../services/roamingApi";

function formatUkNumber(msisdn?: string | null): string {
  if (!msisdn) return "Pending number";
  let s = String(msisdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return String(msisdn);
}

function niceLineStatus(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "Active";
    case "pending_activation":
      return "Pending activation";
    case "suspended":
      return "Suspended";
    case "terminated":
      return "Terminated";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  }
}

export default function RoamingAndTravelPage() {
  const router = useRouter();

  // ── User & Auth State ──
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Account Holder");
  const [userRole, setUserRole] = useState<string>("Account holder");
  const [isLoadingLines, setIsLoadingLines] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ── Navigation State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("roaming");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Real Lines from GET /api/v1/lines/ ──
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState<boolean>(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  // ── Live Quote from RoamingQuotePanel ──
  const [activeQuote, setActiveQuote] = useState<RoamingQuoteResponse | null>(null);

  // ── Link Existing Zoiko Number Claim Modal (POST /api/v1/lines/claims/) ──
  const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);
  const [claimMsisdn, setClaimMsisdn] = useState<string>("");
  const [claimIccid, setClaimIccid] = useState<string>("");
  const [claimOrderRef, setClaimOrderRef] = useState<string>("");
  const [claimSubmitting, setClaimSubmitting] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimResultMsg, setClaimResultMsg] = useState<string | null>(null);

  // ── Guides & Support Modals ──
  const [comparePlansOpen, setComparePlansOpen] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [guideModal, setGuideModal] = useState<{
    title: string;
    subtitle: string;
    steps: string[];
  } | null>(null);

  const [queryRoamingModalOpen, setQueryRoamingModalOpen] = useState<boolean>(false);
  const [queryRoamingNote, setQueryRoamingNote] = useState<string>("");
  const [queryError, setQueryError] = useState<string>("");
  const [isSubmittingQuery, setIsSubmittingQuery] = useState<boolean>(false);

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

  // Load real lines from GET /api/v1/lines/
  const loadLinesData = useCallback(async () => {
    setIsLoadingLines(true);
    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token")
          : null;
      const rawUser =
        typeof window !== "undefined"
          ? localStorage.getItem("zoiko_user") || localStorage.getItem("driverx_user")
          : null;

      setToken(storedToken);

      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          const fullName =
            [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
            u?.name ||
            u?.username ||
            (u?.email ? String(u.email).split("@")[0] : "Account Holder");
          setUserName(fullName);
          if (u?.role) setUserRole(String(u.role));
        } catch {}
      }

      if (!storedToken) {
        setLines([]);
        setSelectedLineId("");
        return;
      }

      const data = await getLines();
      const fetchedLines = Array.isArray(data?.lines) ? data.lines : [];
      setLines(fetchedLines);

      setSelectedLineId((prev) => {
        if (prev && fetchedLines.some((l) => l.id === prev)) return prev;
        const firstActive = fetchedLines.find((l) => l.status === "active");
        return firstActive ? firstActive.id : fetchedLines[0]?.id || "";
      });
    } catch (err) {
      console.warn("Could not load /api/v1/lines/:", err);
      setLines([]);
      setSelectedLineId("");
    } finally {
      setIsLoadingLines(false);
    }
  }, []);

  useEffect(() => {
    loadLinesData();
    const handleAuthSync = () => loadLinesData();
    window.addEventListener("zoiko-auth", handleAuthSync);
    return () => window.removeEventListener("zoiko-auth", handleAuthSync);
  }, [loadLinesData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadLinesData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Lines & roaming availability refreshed", "info");
    }, 300);
  };

  const currentLine = useMemo<Line | null>(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0] || null;
  }, [lines, selectedLineId]);

  const currentLineDisplayNumber = currentLine
    ? formatUkNumber(currentLine.msisdn)
    : "No line selected";
  const currentLinePlanName = currentLine?.plan?.name || "Unverified / no plan linked";

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimResultMsg(null);

    const payload: { msisdn?: string; iccid?: string; order_reference?: string } = {};
    if (claimMsisdn.trim()) payload.msisdn = claimMsisdn.trim();
    if (claimIccid.trim()) payload.iccid = claimIccid.trim();
    if (claimOrderRef.trim()) payload.order_reference = claimOrderRef.trim();

    if (Object.keys(payload).length < 2) {
      setClaimError("Please enter any two details (phone number, SIM ICCID, or order reference) to verify your SIM.");
      return;
    }

    setClaimSubmitting(true);
    try {
      const claim = await submitClaim(payload);
      setClaimResultMsg(claim.message);
      await loadLinesData();
    } catch (err: unknown) {
      if (err instanceof LineApiError) {
        setClaimError(err.message);
      } else {
        setClaimError("Could not submit claim right now. Please try again.");
      }
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleSubmitRoamingQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryRoamingNote.trim() || queryRoamingNote.trim().length < 10) {
      setQueryError("Please provide at least 10 characters describing your query.");
      return;
    }
    if (queryRoamingNote.trim().length > 1000) {
      setQueryError("Query text cannot exceed 1000 characters.");
      return;
    }

    setQueryError("");
    setIsSubmittingQuery(true);
    try {
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
      const quoteRef =
        activeQuote && isLineQuote(activeQuote) ? ` [Quote ID: ${activeQuote.quote_id}]` : "";

      if (storedToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${storedToken}`,
          },
          body: JSON.stringify({
            category: "billing",
            subject: `Roaming Enquiry for ${currentLineDisplayNumber}${quoteRef}`,
            message: `${queryRoamingNote.trim()}\n\nDestination: ${activeQuote?.destination?.name || "N/A"} (${activeQuote?.destination?.code || "—"})\nTravel date: ${activeQuote?.travel_date || "—"}`,
          }),
        }).catch(() => {});
      }

      setQueryRoamingModalOpen(false);
      setQueryRoamingNote("");
      showToast("Roaming query submitted to support", "success");
    } catch {
      setQueryError("Could not submit query. Please try again or contact support.");
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  // Determine Tariff Verified date strictly from API `commercial_basis.validation_date` (Rule 7)
  const verifiedDateText = activeQuote?.commercial_basis?.validation_date
    ? formatDisplayDate(activeQuote.commercial_basis.validation_date)
    : null;

  return (
    <div className="min-h-screen bg-[#EEEEF0] font-sans text-[#0D1935] p-3 sm:p-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0D1935] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
          <span className="text-sm font-medium">{toast.msg}</span>
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
            onOpenComparePlans={() => setComparePlansOpen(true)}
            onOpenAddNumber={() => router.push("/dashboard/my-mobile-numbers")}
            planName={currentLine?.plan?.name}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          <DashboardTopNav
            userName={userName}
            userRole={userRole}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unreadNotifications={0}
            onClearNotifications={() => {}}
            onLogout={handleLogout}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Roaming & travel"
            customSubtitle="Check your destination's roaming allowances and charges before you travel."
          />

          {/* Sub-header Bar: Verification Status (left) + Line Selector (right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#54617E]">
                <Clock className="w-3.5 h-3.5 text-[#54617E]" />
                <span>
                  {verifiedDateText
                    ? `Tariff verified on ${verifiedDateText}`
                    : activeQuote?.generated_at
                    ? `Checked at ${formatTimestamp(activeQuote.generated_at)}`
                    : "Live register check"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Refresh lines"
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing || isLoadingLines ? "animate-spin text-[#E01C5B]" : ""
                  }`}
                />
              </button>
            </div>

            {/* Right: Real Line Selector from GET /api/v1/lines/ */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative" ref={lineDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLineDropdownOpen((prev) => !prev)}
                  className="min-h-14 pl-3 pr-3.5 py-1.5 bg-white rounded-2xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] inline-flex items-center gap-3 hover:border-slate-300 transition cursor-pointer text-left"
                >
                  <div className="w-6 h-8 flex items-center justify-center text-[#1E2D4D] shrink-0">
                    <Smartphone className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0 sm:min-w-[230px] pr-2 sm:pr-4">
                    <div className="text-xs font-normal text-[#54617E] leading-4">
                      Roaming for
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#0D1935] leading-5 truncate">
                      {lines.length === 0
                        ? "No Zoiko lines linked"
                        : `${currentLineDisplayNumber} · ${currentLinePlanName}`}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#54617E] shrink-0 ml-auto transition-transform ${
                      lineDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {lineDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30">
                    <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#54617E] uppercase tracking-wider border-b border-slate-100">
                      Select mobile number ({lines.length})
                    </div>
                    {lines.length === 0 ? (
                      <div className="p-3.5 text-xs text-[#54617E] space-y-2">
                        <p>No lines found on your account.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setLineDropdownOpen(false);
                            setClaimModalOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-[#E01C5B] text-white font-semibold text-xs hover:bg-[#c81750] cursor-pointer"
                        >
                          Link an existing Zoiko number
                        </button>
                      </div>
                    ) : (
                      lines.map((ln) => {
                        const isSel = ln.id === currentLine?.id;
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
                                {formatUkNumber(ln.msisdn)}
                              </div>
                              <div className="text-[11px] text-[#54617E]">
                                {ln.plan?.name || "Unverified plan"} · {niceLineStatus(ln.status)}
                              </div>
                            </div>
                            {isSel && <Check className="w-4 h-4 text-[#E01C5B]" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── HERO BANNER: "Travelling soon?" ── */}
          <div className="relative min-h-32 px-6 py-5 rounded-[20px] bg-gradient-to-r from-[#0D1935] via-[#152852] to-[#1D2449] flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden shadow-xs">
            <div className="relative z-10 max-w-[620px] flex flex-col gap-2">
              <h2 className="text-white text-xl font-extrabold leading-7">
                Travelling soon?
              </h2>
              <p className="text-white/85 text-sm font-normal leading-5">
                {currentLine
                  ? `Check what's included for ${currentLineDisplayNumber} and what it costs — before you travel.`
                  : "Check our published roaming tariffs by destination and travel date."}
              </p>
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <span className="h-6 px-2.5 bg-white/15 rounded-full inline-flex items-center gap-1.5 text-white text-xs font-semibold">
                  <MessageSquare className="w-3 h-3 text-white" />
                  <span>We text you the charges when you arrive</span>
                </span>
                {activeQuote?.charging?.spend_control && (
                  <span className="h-6 px-2.5 bg-white/15 rounded-full inline-flex items-center gap-1.5 text-white text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3 text-white" />
                    <span>{activeQuote.charging.spend_control}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── ROW 1: 3-Column Grid (Line Card [3] + Check a Destination [6] + Roaming Balance [3]) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Card 1: Line Overview (Pink Card, lg:col-span-3) */}
            <div className="lg:col-span-3 p-5 relative bg-[#E01C5B] rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-4 overflow-hidden text-white">
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
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-lg font-bold leading-6">
                      International roaming
                    </h3>
                    <span className="text-white/80 text-xs font-normal leading-4">
                      Line status &amp; tariff info
                    </span>
                  </div>
                </div>

                {/* White Inner Line Box */}
                <div className="px-3.5 py-3 bg-white rounded-2xl flex items-center gap-3 text-[#0D1935]">
                  <Smartphone className="w-5 h-6 text-[#1E2D4D] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#0D1935] text-base font-bold leading-5 truncate">
                      {currentLine ? currentLineDisplayNumber : "No line selected"}
                    </span>
                    <span className="text-[#54617E] text-xs font-normal leading-4 truncate">
                      {currentLine ? `${currentLinePlanName} (${currentLine.term || "—"})` : "General rates mode"}
                    </span>
                  </div>
                </div>

                {/* Line Status & Backend Verification Date */}
                <div className="pt-1 flex items-start gap-2.5">
                  <div className="w-9 h-9 bg-white/15 rounded-[10px] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-white text-sm font-extrabold leading-5">
                      {currentLine
                        ? `Line status: ${niceLineStatus(currentLine.status)}`
                        : "Link a Zoiko number"}
                    </div>
                    <span className="text-white/85 text-xs font-normal leading-4">
                      {verifiedDateText
                        ? `Tariff verified on ${verifiedDateText}.`
                        : "Check destination below for tariff status."}
                    </span>
                  </div>
                </div>

                <div className="pt-1 inline-flex items-start gap-1.5 text-white/85 text-xs leading-4">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/85" />
                  <span>
                    Turn data roaming on or off in your phone&apos;s settings when travelling abroad.
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                {lines.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(true)}
                    className="h-9 px-3.5 py-2 rounded-[10px] bg-white text-[#E01C5B] hover:bg-pink-50 inline-flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Link existing number</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setGuideModal({
                      title: "Phone set-up guide for roaming",
                      subtitle: currentLine ? `For ${currentLineDisplayNumber}` : "Device guidance",
                      steps: [
                        "1. iPhone (iOS): Go to Settings → Mobile Service → Mobile Data Options → toggle Data Roaming ON when you want to use data abroad.",
                        "2. Android: Go to Settings → Network & Internet → SIMs → Zoiko Mobile → toggle Roaming ON.",
                        "3. Keep Data Roaming OFF while on ships, ferries, or aircraft unless you intend to pay separate maritime/satellite rates.",
                      ],
                    })
                  }
                  className="h-9 px-3.5 py-2 rounded-[10px] border border-white/55 hover:bg-white/10 inline-flex items-center justify-center gap-2 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone set-up guide</span>
                </button>
              </div>
            </div>

            {/* Card 2: Check a Destination (lg:col-span-6) */}
            <div className="lg:col-span-6 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col gap-4">
              <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                    Check a destination
                  </h3>
                  <span className="text-[#54617E] text-xs font-normal leading-5">
                    {currentLine
                      ? `Live tariff & allowances for ${currentLineDisplayNumber}`
                      : "General published roaming rates"}
                  </span>
                </div>
              </div>

              <RoamingQuotePanel
                token={token}
                lines={lines}
                selectedLineId={selectedLineId}
                onOpenLineSelector={() => setLineDropdownOpen(true)}
                onReloadLines={loadLinesData}
                onOpenLinkClaimModal={() => setClaimModalOpen(true)}
                onQuoteUpdated={setActiveQuote}
                initialCountryCode="FR"
              />
            </div>

            {/* Card 3: Your Roaming Balance (lg:col-span-3, strictly API-driven) */}
            <div className="lg:col-span-3 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3.5">
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                      Roaming balance
                    </h3>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      {activeQuote?.destination?.name
                        ? `For ${activeQuote.destination.name}`
                        : "Select a destination"}
                    </span>
                  </div>
                </div>

                {activeQuote &&
                isLineQuote(activeQuote) &&
                activeQuote.outcome === "INCLUDED_WITH_LIMIT" &&
                activeQuote.entitlement ? (
                  <div className="p-3.5 bg-[#F6F7FA] rounded-2xl border border-[#ECEFF5] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#0D1935] text-xs font-bold">
                        Plan entitlement
                      </span>
                      {activeQuote.entitlement.remaining.status === "coming_soon" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Coming soon
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Live
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#54617E]">Data limit</span>
                        <span className="font-bold text-[#0D1935]">
                          {formatAllowanceMb(activeQuote.entitlement.data_mb)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#54617E]">Voice minutes</span>
                        <span className="font-bold text-[#0D1935]">
                          {activeQuote.entitlement.voice_unlimited
                            ? "Unlimited minutes"
                            : activeQuote.entitlement.voice_minutes !== null
                            ? `${activeQuote.entitlement.voice_minutes}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#54617E]">Texts</span>
                        <span className="font-bold text-[#0D1935]">
                          {activeQuote.entitlement.sms_unlimited
                            ? "Unlimited texts"
                            : activeQuote.entitlement.sms !== null
                            ? `${activeQuote.entitlement.sms}`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs">
                      {activeQuote.entitlement.remaining.status === "coming_soon" ? (
                        <p className="font-semibold text-amber-800">
                          Remaining balance: coming soon
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-bold text-[#1E8E5A]">
                            Remaining:{" "}
                            {formatAllowanceMb(activeQuote.entitlement.remaining.data_mb)}
                          </p>
                          {activeQuote.entitlement.remaining.as_of && (
                            <p className="text-[11px] text-[#54617E]">
                              Updated at {formatTimestamp(activeQuote.entitlement.remaining.as_of)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F6F7FA] rounded-2xl border border-[#ECEFF5] text-xs text-[#54617E] space-y-2">
                    <p className="font-semibold text-[#0D1935]">
                      {activeQuote?.status === "READY_PERSONALISED" &&
                      activeQuote.outcome === "STANDARD_CHARGES"
                        ? "Standard roaming rates apply"
                        : activeQuote?.status === "READY_PERSONALISED" &&
                          activeQuote.outcome === "NOT_SUPPORTED"
                        ? "Roaming unavailable for this destination"
                        : "Remaining balance: coming soon"}
                    </p>
                    <p className="leading-4">
                      {activeQuote?.message ||
                        "Select a destination and travel date to check allowances and remaining balance."}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard/usage-and-allowances/allowance-details"
                  className="w-full h-10 px-4 py-2 rounded-xl border border-[#E5E8EF] hover:border-[#E01C5B] text-xs font-semibold text-[#0D1935] hover:text-[#E01C5B] transition inline-flex items-center justify-between"
                >
                  <span>View full allowance details</span>
                  <ChevronRight className="w-4 h-4 text-[#8F9BB3]" />
                </Link>
                <button
                  type="button"
                  onClick={() => setQueryRoamingModalOpen(true)}
                  className="self-start inline-flex items-center gap-1.5 text-[#B9154B] text-xs font-semibold hover:underline cursor-pointer pt-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Query a roaming charge</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── ROW 2: Safe Travel Guidance + Settings & Quick Actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Roaming Settings & Phone Guidance (lg:col-span-6) */}
            <div className="lg:col-span-6 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                      Device &amp; travel guidance
                    </h3>
                    <span className="text-[#54617E] text-xs font-normal leading-5">
                      Manage roaming settings on your phone
                    </span>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#ECEFF5]">
                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Data, calls & texts abroad",
                        subtitle: currentLine ? `Phone settings for ${currentLineDisplayNumber}` : "Phone settings",
                        steps: [
                          "1. Always check the quote for your specific destination and travel date before departing.",
                          "2. To use mobile data abroad, enable Data Roaming in your device settings upon arrival.",
                          "3. To prevent unexpected background data charges, switch Data Roaming OFF before entering destinations not covered by your plan.",
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

                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Preferred network selection",
                        subtitle: "Connecting to local partner networks",
                        steps: [
                          "1. Keep Network Selection set to Automatic so your phone connects to our strongest partner network when you land.",
                          "2. If data doesn't connect immediately, toggle Airplane Mode on for 10 seconds and off again.",
                          "3. You can also select a local network manually under Settings → Mobile Network → Network Selection.",
                        ],
                      })
                    }
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
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

                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Near the border or coast",
                        subtitle: "Avoid accidental roaming charges",
                        steps: [
                          "1. Check specific country and territory rules — nearby territories (such as Switzerland, Türkiye, Jersey, or Guernsey) can carry different rates from neighbouring EU countries.",
                          "2. Along coastal routes or ferries, your phone may latch onto a maritime satellite network. Switch Network Selection to Manual or turn Data Roaming OFF while at sea.",
                          "3. On flights, keep Airplane Mode ON unless explicitly intending to connect to an inflight roaming service.",
                        ],
                      })
                    }
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#F6F7FA] rounded-lg flex items-center justify-center shrink-0">
                        <Map className="w-4 h-4 text-[#1E2D4D]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Near the border, sea or flights
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Avoid maritime, aircraft &amp; border network surprises
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

              <div className="p-3 bg-[#F6F7FA] rounded-xl inline-flex items-start gap-2.5 text-xs text-[#3B4A68] leading-4">
                <Lock className="w-3.5 h-3.5 text-[#3B4A68] shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold text-[#3B4A68]">Arrival SMS notice:</strong>{" "}
                  When you arrive abroad, network billing systems automatically send your destination charges and spend control rules by text.
                </span>
              </div>
            </div>

            {/* Quick Actions (lg:col-span-6) */}
            <div className="lg:col-span-6 p-5 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-between gap-3.5">
              <div>
                <div className="inline-flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[#0D1935] text-lg font-bold leading-6">
                      Quick actions
                    </h3>
                    <span className="text-[#54617E] text-xs font-normal leading-5">
                      Tools &amp; support while preparing or away
                    </span>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#ECEFF5]">
                  <Link
                    href="/dashboard/rates-and-charges?tab=calls"
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Check UK &amp; roaming rates
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Full rate checker for calls, texts &amp; destinations
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8F9BB3] shrink-0" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(true)}
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FAF1F4] rounded-[10px] flex items-center justify-center shrink-0">
                        <Link2 className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#0D1935] text-sm font-semibold leading-5">
                          Link an existing Zoiko number
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Claim a SIM or number to see personalised quotes
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8F9BB3] shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setGuideModal({
                        title: "Roaming troubleshooting",
                        subtitle: "No signal or data abroad?",
                        steps: [
                          "1. Confirm Data Roaming is turned ON in your phone's settings.",
                          "2. Restart your phone or toggle Airplane Mode ON for 15 seconds, then OFF so it registers with a local network.",
                          "3. Check your APN is set to 'zoiko' under Mobile Data Network settings.",
                          "4. If your account has an active spend control reached or your line status isn't active, contact our support team.",
                        ],
                      })
                    }
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
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

                  <button
                    type="button"
                    onClick={() => {
                      const qId =
                        activeQuote && isLineQuote(activeQuote)
                          ? `?quote_id=${encodeURIComponent(activeQuote.quote_id)}`
                          : "";
                      router.push(`/dashboard/support${qId}`);
                    }}
                    className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 rounded-xl px-1 transition cursor-pointer"
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
                          We can help before or during your trip
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
      </div>

      {/* ── MODALS ── */}

      {/* Guide Modal */}
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

      {/* Link Existing Zoiko Number Modal (POST /api/v1/lines/claims/) */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#FAF1F4] rounded-xl flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Link an existing Zoiko number
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    Provide any two details to verify your SIM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClaimModalOpen(false);
                  setClaimError(null);
                  setClaimResultMsg(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {claimResultMsg ? (
              <div className="pt-4 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  {claimResultMsg}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setClaimModalOpen(false);
                      setClaimResultMsg(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="pt-4 flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#0D1935]">Zoiko mobile number</label>
                  <input
                    type="text"
                    value={claimMsisdn}
                    onChange={(e) => setClaimMsisdn(e.target.value)}
                    placeholder="e.g. 07700 900123"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#E01C5B]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#0D1935]">SIM ICCID (18–22 digits)</label>
                  <input
                    type="text"
                    value={claimIccid}
                    onChange={(e) => setClaimIccid(e.target.value)}
                    placeholder="e.g. 8944..."
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#E01C5B]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#0D1935]">Order reference</label>
                  <input
                    type="text"
                    value={claimOrderRef}
                    onChange={(e) => setClaimOrderRef(e.target.value)}
                    placeholder="e.g. ZMK-..."
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#E01C5B]"
                  />
                </div>
                {claimError && (
                  <p className="text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{claimError}</span>
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[#54617E] font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white font-semibold hover:bg-[#c81750] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {claimSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Verify &amp; link number</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Query Roaming Charge Modal */}
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
                    {currentLine ? `For ${currentLineDisplayNumber}` : "Support enquiry"}
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
                    Tell us what you&apos;d like checked <span className="text-[#E01C5B]">*</span>
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
                  placeholder="Describe the destination, date, or charge you want checked..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                />
                {queryError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
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
                  {isSubmittingQuery && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit query</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={() => showToast("Report submitted to our security team", "success")}
      />
      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName={currentLine?.plan?.name || ""}
        onSelectPlan={(planTitle: string) => {
          setComparePlansOpen(false);
          showToast(`Selected ${planTitle}`, "info");
        }}
      />
    </div>
  );
}

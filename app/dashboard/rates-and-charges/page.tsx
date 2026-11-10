"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  MessageSquare,
  Globe,
  ChevronDown,
  Check,
  Info,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertCircle,
  Plane,
  Smartphone,
  Calculator,
  CheckCircle2,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import RoamingQuotePanel from "../components/RoamingQuotePanel";
import { Line, getLines } from "../add-new-number/addLineApi";
import { formatUkPhone } from "../../utils/dashboardSync";
import {
  UK_CALL_DESTINATIONS,
  UK_TEXT_DESTINATIONS,
  UK_DIALLING_PREFIXES,
  RateDestination,
  RateServiceType,
  RateContext,
} from "../../services/dashboardRatesApi";

function niceStatus(status?: string): string {
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

function RatesAndChargesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab & Context from URL: ?tab=calls | texts & ?context=uk | abroad & ?country=FR
  const urlTab = searchParams.get("tab");
  const urlContext = searchParams.get("context");
  const urlCountry = searchParams.get("country") || "FR";

  const [activeTab, setActiveTab] = useState<RateServiceType>(
    urlTab === "texts" ? "texts" : "calls"
  );

  useEffect(() => {
    if (urlTab === "texts" || urlTab === "calls") {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: RateServiceType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard/rates-and-charges?${params.toString()}`, { scroll: false });
  };

  // Nav & Sidebar State
  const [navSearch, setNavSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("usage-and-allowances");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState("Account Member");
  const [userRole, setUserRole] = useState("Account holder");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real Lines from GET /api/v1/lines/
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  // Context: UK vs Abroad
  const [usageContext, setUsageContext] = useState<RateContext>(
    urlContext === "abroad" ? "abroad" : "uk"
  );

  useEffect(() => {
    if (urlContext === "abroad" || urlContext === "uk") {
      setUsageContext(urlContext);
    }
  }, [urlContext]);

  const [searchQuery, setSearchQuery] = useState("");

  // Live Number Lookup / Calculator State (CT-02 UK domestic classifier)
  const [testNumber, setTestNumber] = useState("");

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

  // Load Real User Lines strictly via GET /api/v1/lines/
  const loadDynamicLines = useCallback(async () => {
    setIsLoading(true);
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
          const userData = JSON.parse(rawUser);
          const name =
            [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") ||
            userData?.name ||
            userData?.email?.split("@")[0] ||
            "Account Member";
          setUserName(name);
          if (userData?.role) setUserRole(String(userData.role));
        } catch {}
      }

      if (!storedToken) {
        setLines([]);
        setSelectedLineId("");
        return;
      }

      const data = await getLines();
      const loaded = Array.isArray(data?.lines) ? data.lines : [];
      setLines(loaded);
      setSelectedLineId((prev) => {
        if (prev && loaded.some((l) => l.id === prev)) return prev;
        const firstActive = loaded.find((l) => l.status === "active");
        return firstActive ? firstActive.id : loaded[0]?.id || "";
      });
    } catch {
      setLines([]);
      setSelectedLineId("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDynamicLines();
  }, [loadDynamicLines]);

  const currentLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0] || null;
  }, [lines, selectedLineId]);

  // Current Destinations (UK CT-02)
  const destinations: RateDestination[] = useMemo(() => {
    return activeTab === "calls" ? UK_CALL_DESTINATIONS : UK_TEXT_DESTINATIONS;
  }, [activeTab]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.numberPrefixes.some((p) => p.includes(searchQuery))
    );
  }, [destinations, searchQuery]);

  // Interactive Live Number Evaluation (UK Domestic / International-from-UK CT-02)
  const evaluatedNumberResult = useMemo(() => {
    const raw = testNumber.trim().replace(/\s+/g, "");
    if (!raw) return null;

    if (raw.startsWith("+") && !raw.startsWith("+44")) {
      const matchedPrefix = UK_DIALLING_PREFIXES.find((p) =>
        raw.startsWith(p.prefix)
      );
      return {
        type: "International Call / Text from UK",
        detail: matchedPrefix
          ? `Calling ${matchedPrefix.label} (${matchedPrefix.prefix}) from within the UK`
          : "International destination called from within the UK",
        isIncluded: false,
        rate: "Standard international tariff applies (check abroad roaming rates separately under Abroad tab)",
        accessCharge: "Standard international tariff",
        vat: "Includes 20% VAT",
      };
    }

    let std = raw;
    if (std.startsWith("+44")) std = "0" + std.slice(3);
    if (std.startsWith("0044")) std = "0" + std.slice(4);

    if (std.startsWith("07")) {
      return {
        type: "UK Mobile Number",
        detail: "Standard mobile number on EE, O2, Vodafone, Three or UK MVNOs",
        isIncluded: true,
        rate:
          activeTab === "calls"
            ? "Included in your plan allowance for UK mobile calls."
            : "Included in your plan allowance for UK standard SMS.",
        increment: "Per-second billing after 60s minimum",
        vat: "Includes 20% VAT",
      };
    }

    if (
      std.startsWith("01") ||
      std.startsWith("02") ||
      std.startsWith("03")
    ) {
      return {
        type: "UK Landline (Geographic/Non-geographic)",
        detail: "Home, business, local authority or public service landline",
        isIncluded: true,
        rate:
          activeTab === "calls"
            ? "Included in your plan allowance for standard UK landline calls."
            : "Included in plan",
        increment: "Per-second billing after 60s minimum",
        vat: "Includes 20% VAT",
      };
    }

    if (std.startsWith("0800") || std.startsWith("0808")) {
      return {
        type: "Freephone Number",
        detail: "Free to call from any UK mobile or landline",
        isIncluded: true,
        rate: "Free (0p/min)",
        increment: "Zero charge",
        vat: "No charge",
      };
    }

    if (std.startsWith("084") || std.startsWith("087")) {
      return {
        type: "Service & Business Number",
        detail: "Special business helpline number with dual charging",
        isIncluded: false,
        rate: "Outside your allowance: 15p/min Zoiko Access Charge + provider service charge (Includes 20% VAT).",
        increment: "Per-minute billing",
        vat: "Includes 20% VAT",
      };
    }

    if (std.startsWith("09")) {
      return {
        type: "Premium Rate Service",
        detail: "These calls or texts may have additional service-provider charges. Check the full price before using them.",
        isIncluded: false,
        rate: "Outside your allowance: 15p/min access charge + up to £3.60/min service charge (Includes 20% VAT).",
        increment: "Per minute or fixed per call",
        vat: "Includes 20% VAT",
      };
    }

    if (["999", "112", "101", "111"].includes(std)) {
      return {
        type: "Emergency & Non-emergency Services",
        detail: "Emergency 999/112 or NHS 111 / Police 101 assistance",
        isIncluded: true,
        rate: "Free (0p)",
        increment: "Zero charge",
        vat: "No charge",
      };
    }

    return {
      type: "Unconfirmed Number Prefix",
      detail: "This prefix could not be automatically verified",
      isIncluded: false,
      rate: "We can’t confirm this rate right now. Please check with Zoiko Mobile before using this service.",
      vat: "Subject to terms",
    };
  }, [testNumber, activeTab]);

  return (
    <div className="min-h-screen bg-[#F0F2F6] dark:bg-slate-900 text-[#0D1935] dark:text-slate-100 p-2.5 sm:p-4 lg:p-5 font-sans antialiased w-full overflow-x-hidden">
      {/* Outer Layout Frame: 100% full screen width, identical to dashboard standard */}
      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
        {/* Left Sticky Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 self-stretch lg:self-start flex-shrink-0 z-30">
          <DashboardSidebar
            activeTab={sidebarTab}
            setActiveTab={setSidebarTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={lines.length}
            planName={currentLine?.plan?.name}
          />
        </div>

        {/* Right Main Content: Expands 100% to fit screen */}
        <main className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5 w-full">
          {/* Top Header Navigation */}
          <DashboardTopNav
            userName={userName}
            userRole={userRole}
            searchQuery={navSearch}
            setSearchQuery={setNavSearch}
            customTitle="Rates & charges"
            customSubtitle="Check call, SMS, and picture message charges. Look up inclusive allowances and out-of-bundle rates."
          />

          {/* Sub-Header Bar: Breadcrumb on Left, Line Switcher Card on Right */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                Rates & charges
              </span>
            </nav>

            {/* Dynamic Line Switcher Card */}
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
                    Rates for line
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#0D1935] dark:text-white leading-5 truncate">
                    {isLoading
                      ? "Loading lines…"
                      : currentLine
                      ? `${formatUkPhone(currentLine.msisdn || "")} · ${currentLine.plan?.name || "Unverified plan"}`
                      : "No active lines linked"}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 ml-auto transition-transform ${
                    lineDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {lineDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30">
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                    Select mobile line ({lines.length})
                  </div>
                  {lines.length === 0 ? (
                    <div className="p-3.5 text-xs text-slate-500 space-y-2">
                      <p>No lines found on your account.</p>
                      <Link
                        href="/dashboard/roaming-and-travel"
                        className="block w-full text-center py-2 px-3 rounded-xl bg-[#E01C5B] text-white font-semibold"
                      >
                        Link an existing Zoiko number
                      </Link>
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
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer ${
                            isSel ? "bg-[#FAF1F4]/70 dark:bg-pink-950/30" : ""
                          }`}
                        >
                          <div className="truncate">
                            <div className="text-xs font-bold text-[#0D1935] dark:text-white truncate">
                              {formatUkPhone(ln.msisdn || "")} · {ln.plan?.name || "Unverified plan"}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {niceStatus(ln.status)} {ln.term ? `· ${ln.term}` : ""}
                            </div>
                          </div>
                          {isSel && (
                            <Check className="w-4 h-4 text-[#B8144A] dark:text-pink-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Service Switcher (Calls vs Texts) & Context Switcher (In UK vs Abroad) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Primary Calls vs Texts Tab Switcher */}
            <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#E5E8EF] dark:border-slate-700 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleTabChange("calls")}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === "calls"
                    ? "bg-[#FAF1F4] dark:bg-pink-950/50 text-[#B8144A] dark:text-pink-400 border border-[#F5C2D3] dark:border-pink-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Call Rates</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("texts")}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === "texts"
                    ? "bg-[#FAF1F4] dark:bg-pink-950/50 text-[#B8144A] dark:text-pink-400 border border-[#F5C2D3] dark:border-pink-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Text & Picture Messages</span>
              </button>
            </div>

            {/* Context Selector: In the UK vs Abroad */}
            <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#E5E8EF] dark:border-slate-700 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setUsageContext("uk")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  usageContext === "uk"
                    ? "bg-[#0D1935] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                <span>In the UK</span>
              </button>
              <button
                type="button"
                onClick={() => setUsageContext("abroad")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  usageContext === "abroad"
                    ? "bg-[#0D1935] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                <span>Abroad (Roaming)</span>
              </button>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* INTERACTIVE NUMBER RATE CALCULATOR                            */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 shadow-sm border border-[#E5E8EF] dark:border-slate-700 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#0D1935] dark:text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#B8144A] dark:text-pink-400" />
                  <span>Live Number Rate Checker</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Type any mobile number, landline, business prefix (084/087), or international code (+1, +34) to calculate charges instantly.
                </p>
              </div>

              {testNumber && (
                <button
                  type="button"
                  onClick={() => setTestNumber("")}
                  className="text-xs text-slate-400 hover:text-slate-600 underline self-start sm:self-auto"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="e.g. 07888 123456, 020 7946 0912, 0800 1111, 0845 000 123, +1 555 123 4567..."
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0D1935] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#B8144A]/20"
              />
            </div>

            {/* Live Result Card */}
            {evaluatedNumberResult && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF1F4]/70 dark:bg-pink-950/20 border border-[#F5C2D3] dark:border-pink-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0D1935] dark:text-white">
                      {evaluatedNumberResult.type}
                    </span>
                    {evaluatedNumberResult.isIncluded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Included in plan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-3 h-3" />
                        Outside allowance
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {evaluatedNumberResult.detail}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black text-[#B8144A] dark:text-pink-400">
                    {evaluatedNumberResult.rate}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {evaluatedNumberResult.vat}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB CONTENT: IN THE UK                                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          {usageContext === "uk" ? (
            <div className="space-y-4">
              {/* Search input for UK numbers */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter category or prefix (07, 0800, 0845, landline, premium)..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E8EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8144A]/20"
                />
              </div>

              {/* Grid of Number Types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredDestinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-[#E5E8EF] dark:border-slate-700 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
                          {dest.numberPrefixes.join(", ")}
                        </span>
                        {dest.isIncludedInPlan ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                            <ShieldCheck className="w-3 h-3" />
                            Included in plan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                            Outside allowance
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#0D1935] dark:text-white">
                        {dest.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {dest.description}
                      </p>
                    </div>

                    {/* Rates & Billing Breakdown */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                      {dest.ratePerMinute && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Rate:</span>
                          <span className="font-semibold text-[#0D1935] dark:text-white text-right">
                            {dest.ratePerMinute}
                          </span>
                        </div>
                      )}
                      {dest.ratePerMessage && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Rate:</span>
                          <span className="font-semibold text-[#0D1935] dark:text-white text-right">
                            {dest.ratePerMessage}
                          </span>
                        </div>
                      )}
                      {dest.accessCharge && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Access charge:</span>
                          <span className="font-semibold text-[#0D1935] dark:text-white">
                            {dest.accessCharge}
                          </span>
                        </div>
                      )}
                      {dest.serviceCharge && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Service charge:</span>
                          <span className="font-semibold text-[#0D1935] dark:text-white">
                            {dest.serviceCharge}
                          </span>
                        </div>
                      )}
                      {dest.billingIncrement && (
                        <div className="flex justify-between items-center gap-2 text-[11px] text-slate-400">
                          <span>Increment:</span>
                          <span>{dest.billingIncrement}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                        <span>VAT treatment:</span>
                        <span>{dest.vatIncluded ? "Includes 20% VAT" : "VAT exempt"}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {dest.notes && dest.notes.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        {dest.notes.map((note, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ───────────────────────────────────────────────────────────── */
            /* TAB CONTENT: ABROAD (ROAMING — 100% Backend Quote Driven)    */
            /* ───────────────────────────────────────────────────────────── */
            <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-6 border border-[#E5E8EF] dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#E01C5B]" />
                    <h2 className="text-base sm:text-lg font-bold text-[#0D1935] dark:text-white">
                      Abroad &amp; International Roaming Tariffs
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live destination tariffs and plan allowances verified by the Zoiko roaming register.
                  </p>
                </div>
              </div>

              <RoamingQuotePanel
                token={token}
                lines={lines}
                selectedLineId={selectedLineId}
                onOpenLineSelector={() => setLineDropdownOpen(true)}
                onReloadLines={loadDynamicLines}
                onOpenLinkClaimModal={() => router.push("/dashboard/roaming-and-travel")}
                initialCountryCode={urlCountry}
                compact={true}
              />
            </div>
          )}

          {/* Bottom Helpful Navigation Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-2">
            <Link
              href="/dashboard/roaming-and-travel"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Travelling abroad?</div>
                <div className="text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  View Roaming & Travel
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B8144A] group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/dashboard/usage-and-allowances/allowance-details"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Plan balances</div>
                <div className="text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  View Allowance Details
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B8144A] group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/dashboard/usage-and-allowances"
              className="p-4 bg-white dark:bg-slate-800 rounded-[20px] border border-[#E5E8EF] dark:border-slate-700 hover:border-[#B8144A] dark:hover:border-pink-500 flex items-center justify-between group transition shadow-sm"
            >
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Spending limits</div>
                <div className="text-sm font-bold text-[#0D1935] dark:text-white group-hover:text-[#B8144A] transition">
                  Manage Spending Cap
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

export default function RatesAndChargesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F6] dark:bg-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8144A]" />
        </div>
      }
    >
      <RatesAndChargesContent />
    </Suspense>
  );
}

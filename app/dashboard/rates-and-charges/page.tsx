"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
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
  Clock,
  Sparkles,
  Plane,
  Receipt,
  Smartphone,
  Calculator,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import beQuick from "../../utils/dasdbeQuickApi";
import { getFallbackUserLine, formatUkPhone } from "../../utils/dashboardSync";
import {
  UK_CALL_DESTINATIONS,
  UK_TEXT_DESTINATIONS,
  POPULAR_COUNTRY_PROFILES,
  RateDestination,
  CountryRateProfile,
  RateServiceType,
  RateContext,
} from "../../services/dashboardRatesApi";

interface ActiveLine {
  id: string;
  number: string;
  planName: string;
  status: string;
  renews: string;
}

function RatesAndChargesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab from URL: ?tab=calls | texts
  const urlTab = searchParams.get("tab");
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
    router.replace(`/dashboard/rates-and-charges?tab=${tab}`, { scroll: false });
  };

  // Nav & Sidebar State
  const [navSearch, setNavSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("usage-and-allowances");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState("Account Member");
  const [userRole, setUserRole] = useState("Account holder");
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Lines from Auth / BeQuick / Fallback
  const [lines, setLines] = useState<ActiveLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const lineDropdownRef = useRef<HTMLDivElement>(null);

  // Context: UK vs Abroad
  const [usageContext, setUsageContext] = useState<RateContext>("uk");

  // Roaming & Country Filter State
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>("ES");
  const [searchQuery, setSearchQuery] = useState("");

  // Live Number Lookup / Calculator State
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

  // Dynamic User & Lines Loading
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

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
            console.warn("BeQuick lines unavailable, trying Django SIM orders", e);
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
              const data = await res.json();
              const ordersList = Array.isArray(data.orders) ? data.orders : [];
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

        // 3. Check fallback user line
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
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
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

  // Current Destinations
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

  // Roaming Countries List & Current Selection
  const currentCountry: CountryRateProfile = useMemo(() => {
    return (
      POPULAR_COUNTRY_PROFILES.find((c) => c.iso2 === selectedCountryIso) ||
      POPULAR_COUNTRY_PROFILES[0]
    );
  }, [selectedCountryIso]);

  // Interactive Live Number Evaluation
  const evaluatedNumberResult = useMemo(() => {
    const raw = testNumber.trim().replace(/\s+/g, "");
    if (!raw) return null;

    if (raw.startsWith("+") && !raw.startsWith("+44")) {
      const country = POPULAR_COUNTRY_PROFILES.find((c) =>
        raw.startsWith(c.countryCode)
      );
      return {
        type: "International Destination",
        detail: country
          ? `${country.countryName} (${country.countryCode})`
          : "International destination outside UK",
        isIncluded: false,
        rate:
          activeTab === "calls"
            ? country?.callRateToUK || "Outside your allowance: from 15p/min (Includes 20% VAT)"
            : country?.smsRateToUK || "Outside your allowance: 35p/SMS (Includes 20% VAT)",
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
            planName={currentLine?.planName}
            renewDate={currentLine?.renews}
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
                      Rates for active line
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
            /* TAB CONTENT: ABROAD (ROAMING)                                */
            /* ───────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Destination Filter Bar */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-[#E5E8EF] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-[#B8144A] dark:text-pink-400" />
                    <span className="text-sm font-bold text-[#0D1935] dark:text-white">
                      Destination Roaming Country
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rates may differ when you are abroad. Choose your destination to check roaming charges.
                  </p>
                </div>

                {/* Country dropdown selector */}
                <div className="w-full sm:w-72">
                  <select
                    value={selectedCountryIso}
                    onChange={(e) => setSelectedCountryIso(e.target.value)}
                    aria-label="Select destination country"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#B8144A]/20"
                  >
                    {POPULAR_COUNTRY_PROFILES.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.countryName} ({c.countryCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Country Roaming Pricing Snapshot */}
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-6 border border-[#E5E8EF] dark:border-slate-700 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-[#0D1935] dark:text-white">
                        {currentCountry.countryName}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {currentCountry.zone.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dialling prefix: {currentCountry.countryCode} · Standard UK mobile billing rules
                    </p>
                  </div>

                  {currentCountry.zone === "eu_eea" ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 self-start sm:self-auto">
                      <ShieldCheck className="w-4 h-4" />
                      <span>EU Roaming (Included in Plan)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 self-start sm:self-auto">
                      <Globe className="w-4 h-4" />
                      <span>Standard Roaming Rates Apply</span>
                    </div>
                  )}
                </div>

                {/* 4 Cards: UK Calls, Local Calls, SMS, Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Phone className="w-3.5 h-3.5 text-[#B8144A]" />
                      <span>Calls back to UK</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#0D1935] dark:text-white">
                      {currentCountry.callRateToUK}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Incoming: {currentCountry.incomingCallRate}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <span>Local Calls</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#0D1935] dark:text-white">
                      {currentCountry.callRateLocal}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Destination numbers
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>SMS & Messages</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#0D1935] dark:text-white">
                      {currentCountry.smsRateToUK}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      MMS: {currentCountry.mmsRate}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Globe className="w-3.5 h-3.5 text-purple-500" />
                      <span>Data Roaming</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#0D1935] dark:text-white">
                      {currentCountry.dataRoamingRate}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {currentCountry.fairUseCapGb
                        ? `${currentCountry.fairUseCapGb}GB fair-use cap`
                        : "Out-of-bundle rates"}
                    </div>
                  </div>
                </div>

                {/* Country Notes */}
                {currentCountry.notes && (
                  <div className="p-3.5 rounded-xl bg-[#FAF1F4] dark:bg-pink-950/20 border border-[#F5C2D3]/60 dark:border-pink-900/40 text-xs text-slate-700 dark:text-slate-200 space-y-1.5">
                    <div className="font-bold text-[#B8144A] dark:text-pink-400 flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      <span>Roaming Guidance & Policy</span>
                    </div>
                    {currentCountry.notes.map((n, idx) => (
                      <p key={idx} className="text-slate-600 dark:text-slate-300 pl-4 sm:pl-5">
                        • {n}
                      </p>
                    ))}
                  </div>
                )}
              </div>
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

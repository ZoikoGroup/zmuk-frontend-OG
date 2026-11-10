"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe,
  Plane,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  CheckCircle2,
  Loader2,
  Smartphone,
  Headphones,
  Calendar,
  Wifi,
  Phone,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  Link2,
} from "lucide-react";

import type { Line } from "../add-new-number/addLineApi";
import {
  Destination,
  LineQuote,
  PublicQuote,
  RoamingQuoteResponse,
  RoamingApiError,
  RATE_TILE_LABELS,
  classifyQuoteView,
  formatAllowanceMb,
  formatDisplayDate,
  formatRateDisplay,
  formatTimestamp,
  getExhaustionActionLabel,
  getLineQuote,
  getMaxTravelDateIso,
  getMinTravelDateIso,
  getPublicRates,
  getTodayIso,
  getVatBasisLabel,
  isLineQuote,
  searchDestinations,
} from "../../services/roamingApi";

interface RoamingQuotePanelProps {
  token: string | null;
  lines: Line[];
  selectedLineId: string;
  onOpenLineSelector?: () => void;
  onReloadLines?: () => void;
  onOpenLinkClaimModal?: () => void;
  onQuoteUpdated?: (quote: RoamingQuoteResponse | null) => void;
  initialCountryCode?: string;
  compact?: boolean;
}

const POPULAR_PRIORITY_CODES = ["FR", "ES", "US", "TR", "CH", "IN"];

function formatUkMsisdnDisplay(msisdn?: string | null): string {
  if (!msisdn) return "Pending number";
  let s = String(msisdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return msisdn;
}

export default function RoamingQuotePanel({
  token,
  lines,
  selectedLineId,
  onOpenLineSelector,
  onReloadLines,
  onOpenLinkClaimModal,
  onQuoteUpdated,
  initialCountryCode = "FR",
  compact = false,
}: RoamingQuotePanelProps) {
  const router = useRouter();

  // Destinations directory & search
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [searchingDestinations, setSearchingDestinations] = useState<boolean>(false);
  const [destinationSearchError, setDestinationSearchError] = useState<string | null>(null);

  const [selectedCode, setSelectedCode] = useState<string>(initialCountryCode.toUpperCase());
  const [travelDate, setTravelDate] = useState<string>(() => getTodayIso());
  const [travelDateError, setTravelDateError] = useState<string | null>(null);

  // Public fallback override when personal quote is pending/stale/unlinked
  const [forcePublicMode, setForcePublicMode] = useState<boolean>(false);

  // Quote state
  const [quote, setQuote] = useState<RoamingQuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const allowanceSectionRef = useRef<HTMLDivElement>(null);
  const ratesSectionRef = useRef<HTMLDivElement>(null);

  const minDate = useMemo(() => getMinTravelDateIso(), []);
  const maxDate = useMemo(() => getMaxTravelDateIso(), []);

  const selectedLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || null;
  }, [lines, selectedLineId]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Load initial full destination list once
  useEffect(() => {
    const controller = new AbortController();
    searchDestinations("", controller.signal)
      .then((list) => {
        setAllDestinations(list);
        setSearchResults(list.slice(0, 25));
        // If current selectedCode isn't set or not matched, keep or pick first
        const match = list.find((d) => d.code.toUpperCase() === selectedCode.toUpperCase());
        if (match) {
          setSearchInput(match.name);
        } else if (list.length > 0) {
          setSelectedCode(list[0].code);
          setSearchInput(list[0].name);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (err instanceof RoamingApiError) {
          setDestinationSearchError(err.message);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced backend destination search (300ms)
  useEffect(() => {
    if (!dropdownOpen) return;
    const trimmed = searchInput.trim();
    const currentSelectedObj = allDestinations.find(
      (d) => d.code.toUpperCase() === selectedCode.toUpperCase()
    );
    // Avoid searching when input matches the already-selected destination name verbatim
    const queryToSend =
      currentSelectedObj && currentSelectedObj.name.toLowerCase() === trimmed.toLowerCase()
        ? ""
        : trimmed;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearchingDestinations(true);
      setDestinationSearchError(null);
      searchDestinations(queryToSend, controller.signal)
        .then((list) => {
          setSearchResults(queryToSend ? list : list.slice(0, 25));
        })
        .catch((err) => {
          if (err?.name === "AbortError") return;
          if (err instanceof RoamingApiError) {
            setDestinationSearchError(err.message);
          } else {
            setDestinationSearchError("Could not search destinations.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSearchingDestinations(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput, dropdownOpen, selectedCode, allDestinations]);

  // Reset public fallback mode when line or country changes
  useEffect(() => {
    setForcePublicMode(false);
  }, [selectedLineId, selectedCode]);

  // Fetch roaming quote whenever line, country, date, or view mode changes (with AbortController)
  useEffect(() => {
    if (!selectedCode) return;

    // Validate date bounds client-side as well before request
    if (travelDate) {
      if (travelDate < minDate) {
        setTravelDateError("Travel date can't be more than 90 days ago.");
        return;
      }
      if (travelDate > maxDate) {
        setTravelDateError("Travel date can't be more than 365 days ahead.");
        return;
      }
    }
    setTravelDateError(null);

    const controller = new AbortController();
    setLoadingQuote(true);
    setQuoteError(null);

    async function load() {
      try {
        let data: RoamingQuoteResponse;
        if (token && selectedLineId && !forcePublicMode) {
          data = await getLineQuote(
            token,
            selectedLineId,
            selectedCode,
            travelDate || undefined,
            controller.signal
          );
        } else {
          data = await getPublicRates(
            selectedCode,
            travelDate || undefined,
            controller.signal
          );
        }

        if (!controller.signal.aborted) {
          setQuote(data);
          onQuoteUpdated?.(data);
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError") return;

        if (err instanceof RoamingApiError) {
          if (err.httpStatus === 401 && !forcePublicMode) {
            // Fall back cleanly to public rates if token is missing/expired
            try {
              const pub = await getPublicRates(
                selectedCode,
                travelDate || undefined,
                controller.signal
              );
              if (!controller.signal.aborted) {
                setQuote(pub);
                onQuoteUpdated?.(pub);
              }
              return;
            } catch {}
          }

          if (err.httpStatus === 404 && token && selectedLineId && !forcePublicMode) {
            // Line doesn't exist or doesn't belong to user -> reload lines list
            onReloadLines?.();
          }

          if (err.fieldErrors?.travel_date?.[0]) {
            setTravelDateError(err.fieldErrors.travel_date[0]);
          } else {
            setQuoteError(err.message);
          }
        } else {
          setQuoteError("Could not load roaming quote right now. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingQuote(false);
        }
      }
    }

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedLineId, selectedCode, travelDate, forcePublicMode]);

  // Derive quick chips directly from backend destinations (never hardcoding tariffs/zones)
  const quickChips = useMemo(() => {
    if (allDestinations.length === 0) return [];
    const chips: Destination[] = [];
    for (const code of POPULAR_PRIORITY_CODES) {
      const found = allDestinations.find((d) => d.code.toUpperCase() === code);
      if (found) chips.push(found);
    }
    return chips.slice(0, 6);
  }, [allDestinations]);

  const handleSelectDestination = (dest: Destination) => {
    setSelectedCode(dest.code);
    setSearchInput(dest.name);
    setDropdownOpen(false);
  };

  const handleActionClick = () => {
    if (!quote?.action) return;
    switch (quote.action.kind) {
      case "view_allowance":
        allowanceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      case "view_rates":
        if (ratesSectionRef.current) {
          ratesSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          router.push(`/dashboard/rates-and-charges?tab=calls&context=abroad&country=${encodeURIComponent(selectedCode)}`);
        }
        break;
      case "contact_support": {
        const qId = isLineQuote(quote) ? `?quote_id=${encodeURIComponent(quote.quote_id)}` : "";
        router.push(`/dashboard/support${qId}`);
        break;
      }
      case "choose_line":
        onOpenLineSelector?.();
        break;
    }
  };

  const viewKind = quote ? classifyQuoteView(quote) : null;
  const isPublicDisplay = quote ? !isLineQuote(quote) || quote.status === "PUBLIC_RATES_ONLY" : !token || lines.length === 0 || forcePublicMode;

  const canOfferPublicRatesLink =
    quote &&
    isLineQuote(quote) &&
    (quote.status === "TARIFF_MAPPING_PENDING" ||
      quote.status === "STALE" ||
      quote.status === "LEGACY_LINE_UNLINKED");

  const hasAnyRatesVisible =
    quote?.rates &&
    (viewKind === "included" || viewKind === "charged" || viewKind === "public");

  const hasAnyPriceInRates =
    quote?.rates &&
    Object.values(quote.rates).some((r) => r !== null);

  return (
    <div className="flex flex-col gap-4">
      {/* ── No active lines notice for logged-in user (8.1) ── */}
      {token && lines.length === 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">No Zoiko lines linked to your account yet</p>
              <p className="text-amber-800 mt-0.5">
                Showing general published rates (not a personalised quote). Link your existing Zoiko SIM or number to see allowances and charges for your plan.
              </p>
            </div>
          </div>
          {onOpenLinkClaimModal && (
            <button
              type="button"
              onClick={onOpenLinkClaimModal}
              className="px-3.5 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c81750] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Link an existing Zoiko number</span>
            </button>
          )}
        </div>
      )}

      {/* ── Destination Search & Travel Date Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
        {/* Destination Picker */}
        <div className="flex-1 flex flex-col gap-1 relative" ref={searchBoxRef}>
          <label className="text-[#54617E] text-xs font-medium leading-4">
            Destination country or network
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[#54617E] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setDropdownOpen(true);
              }}
              placeholder="Search country, code or alias (e.g. France, eire, jer, maritime)..."
              className="w-full h-10 pl-9 pr-8 py-2 bg-white rounded-xl border border-[#E5E8EF] text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
            />
            {searchingDestinations && (
              <Loader2 className="w-4 h-4 text-[#E01C5B] animate-spin absolute right-3 top-3" />
            )}
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-[62px] max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
              {destinationSearchError ? (
                <div className="px-3.5 py-2.5 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{destinationSearchError}</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-3.5 py-3 text-xs text-[#54617E]">
                  No roaming destinations matched &ldquo;{searchInput}&rdquo;. (Note: UK domestic usage isn&apos;t roaming.)
                </div>
              ) : (
                searchResults.map((dest) => {
                  const isSel = dest.code.toUpperCase() === selectedCode.toUpperCase();
                  return (
                    <button
                      key={dest.code}
                      type="button"
                      onMouseDown={() => handleSelectDestination(dest)}
                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        isSel ? "bg-[#FAF1F4] font-bold text-[#B9154B]" : "font-semibold text-[#0D1935]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 shrink-0">
                          {dest.code}
                        </span>
                        <span className="truncate">{dest.name}</span>
                        {dest.kind !== "country" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-[#54617E] capitalize shrink-0">
                            {dest.kind}
                          </span>
                        )}
                      </div>
                      {dest.rating_zone && (
                        <span className="text-[11px] font-normal text-[#54617E] shrink-0 ml-2">
                          {dest.rating_zone}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Travel Date Picker (-90d to +365d) */}
        <div className="w-full sm:w-48 flex flex-col gap-1">
          <label className="text-[#54617E] text-xs font-medium leading-4 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Travel date</span>
          </label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className={`w-full h-10 px-3 py-2 bg-white rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
              travelDateError
                ? "border-red-400 bg-red-50/20 focus:border-red-500"
                : "border-[#E5E8EF] focus:border-[#E01C5B]"
            }`}
          />
          {travelDateError && (
            <span className="text-[11px] text-red-600 font-medium">{travelDateError}</span>
          )}
        </div>
      </div>

      {/* Quick Destination Filter Chips (from live API list) */}
      {quickChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {quickChips.map((dest) => {
            const isActive = selectedCode.toUpperCase() === dest.code.toUpperCase();
            return (
              <button
                key={dest.code}
                type="button"
                onClick={() => handleSelectDestination(dest)}
                className={`h-8 px-3 py-1 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer border ${
                  isActive
                    ? "bg-[#FAF1F4] border-[#E01C5B] text-[#B9154B]"
                    : "bg-white border-[#E5E8EF] text-[#0D1935] hover:border-slate-300"
                }`}
              >
                <span className="text-[10px] font-mono opacity-75">{dest.code}</span>
                <span>{dest.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Quote Loading / Error / Result Card ── */}
      {loadingQuote ? (
        <div className="p-8 rounded-2xl border border-[#E5E8EF] bg-[#F8F9FB] flex flex-col items-center justify-center gap-2.5 text-[#54617E]">
          <Loader2 className="w-6 h-6 text-[#E01C5B] animate-spin" />
          <span className="text-xs font-semibold">Checking tariff &amp; allowances for {searchInput || selectedCode}…</span>
        </div>
      ) : quoteError ? (
        <div className="p-5 rounded-2xl border border-red-200 bg-red-50/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 space-y-1">
            <p className="font-bold">Could not retrieve roaming quote</p>
            <p>{quoteError}</p>
          </div>
        </div>
      ) : quote ? (
        <div className="flex flex-col gap-3">
          {/* Warnings Banner (e.g. high_risk_network for MARITIME / AIRCRAFT) */}
          {quote.warnings && quote.warnings.length > 0 && (
            <div className="space-y-2">
              {quote.warnings.map((w, idx) => (
                <div
                  key={`${w.code}-${idx}`}
                  className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-amber-950"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-5">
                    <span className="font-bold uppercase tracking-wide text-[10px] text-amber-700 block">
                      Network warning
                    </span>
                    <span className="font-medium">{w.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Result Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 ${
              isPublicDisplay
                ? "border-slate-300 bg-slate-50/60"
                : "border-[#E5E8EF] bg-white"
            }`}
          >
            {/* Public View Notice Bar (Rule 11: always visually distinct & clearly labelled) */}
            {isPublicDisplay && (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <Globe className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Not a personalised quote · General published roaming rates (Your plan may differ)</span>
                </div>
                {forcePublicMode && token && selectedLineId && (
                  <button
                    type="button"
                    onClick={() => setForcePublicMode(false)}
                    className="text-[11px] font-semibold text-pink-300 hover:text-white underline self-start sm:self-auto cursor-pointer"
                  >
                    Return to line quote
                  </button>
                )}
              </div>
            )}

            {/* Personal Line Quote Header Bar */}
            {!isPublicDisplay && isLineQuote(quote) && (
              <div className="px-3.5 py-2 rounded-xl bg-[#FAF1F4] border border-[#F5C2D3] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#0D1935]">
                  <Smartphone className="w-3.5 h-3.5 text-[#E01C5B]" />
                  <span className="font-bold">Personalised quote for</span>
                  <span className="font-mono font-bold text-[#B9154B]">
                    {quote.line.msisdn_masked || formatUkMsisdnDisplay(selectedLine?.msisdn)}
                  </span>
                  {quote.line.plan && (
                    <span className="text-[#54617E]">· {quote.line.plan}</span>
                  )}
                </div>
                <span className="text-[11px] text-[#54617E] capitalize">
                  Line status: {quote.line.status.replace("_", " ")}
                </span>
              </div>
            )}

            {/* Destination Header + Status Badge */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-[#0D1935] text-lg font-extrabold leading-6">
                    {quote.destination.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-600">
                    {quote.destination.code}
                  </span>
                  {quote.destination.rating_zone && (
                    <span className="text-xs text-[#54617E] font-medium">
                      {quote.destination.rating_zone}
                    </span>
                  )}
                </div>
                <p className="text-[#54617E] text-xs mt-1">
                  Travel date: {formatDisplayDate(quote.travel_date) || quote.travel_date}
                </p>
              </div>

              {/* Outcome / Status Badge (Section 6 table) */}
              {viewKind === "included" && (
                <span className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-bold bg-[#1E8E5A]/10 text-[#1E8E5A] border border-[#1E8E5A]/25">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Included</span>
                </span>
              )}
              {viewKind === "charged" && (
                <span className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Charges apply</span>
                </span>
              )}
              {viewKind === "unsupported" && (
                <span className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not available</span>
                </span>
              )}
              {viewKind === "public" && (
                <span className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-bold bg-slate-200/80 text-slate-800 border border-slate-300">
                  <Info className="w-3.5 h-3.5" />
                  <span>Not a personalised quote</span>
                </span>
              )}
              {viewKind === "info" && (
                <span className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Info className="w-3.5 h-3.5" />
                  <span>
                    {quote.status === "LINE_NOT_ACTIVE"
                      ? "Line not active"
                      : "Unavailable"}
                  </span>
                </span>
              )}
            </div>

            {/* Verbatim Approved Backend Message (Rule 2: never rewrite or shorten) */}
            <div
              className={`p-3.5 rounded-xl border ${
                viewKind === "unsupported"
                  ? "bg-red-50/70 border-red-200 text-red-900"
                  : viewKind === "included"
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                  : "bg-[#F6F7FA] border-[#E5E8EF] text-[#3B4A68]"
              }`}
            >
              <p className="text-xs sm:text-sm font-semibold leading-5">
                {quote.message}
              </p>
            </div>

            {/* ── Entitlement Section (ONLY for INCLUDED_WITH_LIMIT & non-null entitlement) ── */}
            {viewKind === "included" && isLineQuote(quote) && quote.entitlement && (
              <div
                id="roaming-allowance-section"
                ref={allowanceSectionRef}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    Your plan&apos;s roaming allowance
                  </h5>
                  {quote.entitlement.remaining.status === "coming_soon" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Remaining balance: coming soon
                    </span>
                  ) : (
                    quote.entitlement.remaining.as_of && (
                      <span className="text-[11px] text-[#54617E]">
                        Updated at {formatTimestamp(quote.entitlement.remaining.as_of)}
                      </span>
                    )
                  )}
                </div>

                {/* Allowance Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#54617E]">
                      <Wifi className="w-3.5 h-3.5 text-[#E01C5B]" />
                      <span>Data allowance</span>
                    </div>
                    <div className="text-base font-extrabold text-[#0D1935] mt-1">
                      {formatAllowanceMb(quote.entitlement.data_mb)}
                    </div>
                    {quote.entitlement.remaining.status !== "coming_soon" &&
                      quote.entitlement.remaining.data_mb !== null && (
                        <div className="text-[11px] text-[#1E8E5A] font-semibold mt-0.5">
                          {formatAllowanceMb(quote.entitlement.remaining.data_mb)} remaining
                        </div>
                      )}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#54617E]">
                      <Phone className="w-3.5 h-3.5 text-[#E01C5B]" />
                      <span>Voice minutes</span>
                    </div>
                    <div className="text-base font-extrabold text-[#0D1935] mt-1">
                      {quote.entitlement.voice_unlimited
                        ? "Unlimited minutes"
                        : quote.entitlement.voice_minutes !== null
                        ? `${quote.entitlement.voice_minutes} minutes`
                        : "—"}
                    </div>
                    {quote.entitlement.remaining.status !== "coming_soon" &&
                      quote.entitlement.remaining.voice_minutes !== null && (
                        <div className="text-[11px] text-[#1E8E5A] font-semibold mt-0.5">
                          {quote.entitlement.remaining.voice_minutes} mins remaining
                        </div>
                      )}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#54617E]">
                      <MessageSquare className="w-3.5 h-3.5 text-[#E01C5B]" />
                      <span>Texts (SMS)</span>
                    </div>
                    <div className="text-base font-extrabold text-[#0D1935] mt-1">
                      {quote.entitlement.sms_unlimited
                        ? "Unlimited texts"
                        : quote.entitlement.sms !== null
                        ? `${quote.entitlement.sms} texts`
                        : "—"}
                    </div>
                    {quote.entitlement.remaining.status !== "coming_soon" &&
                      quote.entitlement.remaining.sms !== null && (
                        <div className="text-[11px] text-[#1E8E5A] font-semibold mt-0.5">
                          {quote.entitlement.remaining.sms} texts remaining
                        </div>
                      )}
                  </div>
                </div>

                {quote.entitlement.fair_use_terms && (
                  <p className="text-[11px] text-[#54617E] leading-4">
                    {quote.entitlement.fair_use_terms}
                  </p>
                )}
              </div>
            )}

            {/* ── Rates Tiles Grid ── */}
            {hasAnyRatesVisible && quote.rates && (
              <div id="roaming-rates-section" ref={ratesSectionRef} className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    {viewKind === "included"
                      ? "Rates after your allowance runs out"
                      : "Roaming rates"}
                  </h5>
                  {quote.charging && hasAnyPriceInRates && (
                    <span className="text-[11px] font-semibold text-[#54617E]">
                      {getVatBasisLabel(quote.charging.vat_basis)}
                    </span>
                  )}
                </div>

                <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"} gap-2`}>
                  {RATE_TILE_LABELS.map(({ key, label }) => {
                    const tile = quote.rates ? quote.rates[key] : null;
                    const displayVal = formatRateDisplay(tile);
                    return (
                      <div
                        key={key}
                        className="px-3.5 py-2.5 bg-[#F6F7FA] rounded-xl border border-[#ECEFF5] flex flex-col justify-between"
                      >
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          {label}
                        </span>
                        {displayVal ? (
                          <span className="text-[#0D1935] text-sm font-bold leading-5 mt-0.5">
                            {displayVal}
                          </span>
                        ) : (
                          <span className="text-[#54617E] text-xs font-medium leading-5 mt-0.5">
                            Contact support for this rate
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Charging Basis & Spend Control (Rule 13 & Section 7) ── */}
            {quote.charging && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5 text-xs text-[#54617E]">
                {getVatBasisLabel(quote.charging.vat_basis) && (
                  <div className="font-semibold text-[#0D1935]">
                    {getVatBasisLabel(quote.charging.vat_basis)}
                    {quote.charging.units_rounding
                      ? ` · ${quote.charging.units_rounding}`
                      : ""}
                  </div>
                )}
                {getExhaustionActionLabel(quote.charging.exhaustion_action) && (
                  <div>{getExhaustionActionLabel(quote.charging.exhaustion_action)}</div>
                )}
                {quote.charging.spend_control && (
                  <div className="inline-flex items-center gap-1.5 text-[#0D1935] font-medium pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0" />
                    <span>{quote.charging.spend_control}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {quote.action && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    quote.action.kind === "choose_line"
                      ? "bg-[#E01C5B] hover:bg-[#c81750] text-white"
                      : quote.action.kind === "view_allowance"
                      ? "bg-[#1E8E5A] hover:bg-[#18754a] text-white"
                      : quote.action.kind === "contact_support"
                      ? "bg-[#0D1935] hover:bg-[#152852] text-white"
                      : "bg-[#0D1935] hover:bg-[#152852] text-white"
                  }`}
                >
                  {quote.action.kind === "contact_support" ? (
                    <Headphones className="w-4 h-4" />
                  ) : quote.action.kind === "choose_line" ? (
                    <Smartphone className="w-4 h-4" />
                  ) : quote.action.kind === "view_allowance" ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{quote.action.label}</span>
                </button>
              )}

              {/* Offer public rates fallback link when personal quote is pending/stale/unlinked (§8.1) */}
              {canOfferPublicRatesLink && !forcePublicMode && (
                <button
                  type="button"
                  onClick={() => setForcePublicMode(true)}
                  className="py-2.5 px-4 rounded-xl border border-[#E5E8EF] hover:border-[#E01C5B] text-xs font-semibold text-[#0D1935] hover:text-[#E01C5B] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>View general published rates</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* ── Commercial Basis / Verification Footer (Rule 7: validation_date from API) ── */}
            {(quote.commercial_basis || quote.generated_at) && (
              <div className="pt-2 border-t border-[#ECEFF5] flex flex-col gap-1 text-[11px] text-[#54617E]">
                {quote.commercial_basis?.effective_from && (
                  <div className="inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Tariff effective from {formatDisplayDate(quote.commercial_basis.effective_from)}
                      {quote.commercial_basis.effective_to
                        ? ` to ${formatDisplayDate(quote.commercial_basis.effective_to)}`
                        : " (current)"}
                    </span>
                  </div>
                )}
                {quote.commercial_basis?.validation_date && (
                  <div className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0" />
                    <span>
                      Verified on {formatDisplayDate(quote.commercial_basis.validation_date)}
                    </span>
                  </div>
                )}
                {quote.generated_at && (
                  <div className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Checked at {formatTimestamp(quote.generated_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

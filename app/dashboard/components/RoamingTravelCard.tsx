"use client";

import React, { useEffect, useState } from "react";
import { Search, MapPin, ChevronRight, Info, Check } from "lucide-react";
import {
  classifyQuoteView,
  getLineQuote,
  searchDestinations,
  type Destination,
} from "../../services/roamingApi";

interface CountryItem {
  id: string;
  name: string;
  included: boolean;
  flagType: "france" | "spain" | "ireland" | "usa" | "generic";
  notes?: string;
}

interface RoamingTravelCardProps {
  hasActivePlan?: boolean;
  roamingAllowanceGb?: number;
  /** Selected line (backend line id). Used to check what is included for that line. */
  activeLineId?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Popular destinations shown first when nothing is typed (only those the backend returns are shown).
const POPULAR_CODES = ["FR", "ES", "IE", "US", "IT", "DE", "PT", "CA", "AU"];

type Badge = "included" | "charged" | "unsupported" | "info";

function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "\u{1F310}";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1a5 + c.charCodeAt(0))
  );
}

export default function RoamingTravelCard({
  hasActivePlan = false,
  roamingAllowanceGb = 0,
  activeLineId = "",
}: RoamingTravelCardProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  // Badges are tied to the line they were fetched for, so switching line never shows stale ones.
  const [badgeState, setBadgeState] = useState<{ lineId: string; map: Record<string, Badge> }>({
    lineId: "",
    map: {},
  });
  const badges: Record<string, Badge> = badgeState.lineId === activeLineId ? badgeState.map : {};

  // Real destinations from the roaming API (search is debounced).
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(
      () => {
        searchDestinations(searchTerm, controller.signal)
          .then((list) => {
            setDestinations(list);
            setLoadState("ready");
          })
          .catch(() => {
            if (controller.signal.aborted) return;
            setDestinations([]);
            setLoadState("error");
          });
      },
      searchTerm ? 300 : 0
    );
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [searchTerm]);

  /* Old made-up list ("Illustrative entitlements for design review"), kept for reference:
  const allCountries: CountryItem[] = [
    { id: "fr", name: "France", included: true, flagType: "france" },
    { id: "es", name: "Spain", included: true, flagType: "spain" },
    { id: "ie", name: "Ireland", included: true, flagType: "ireland" },
    { id: "us", name: "United States", included: false, flagType: "usa" },
    { id: "it", name: "Italy", included: true, flagType: "generic" },
    { id: "de", name: "Germany", included: true, flagType: "generic" },
    { id: "pt", name: "Portugal", included: true, flagType: "generic" },
    { id: "ca", name: "Canada", included: false, flagType: "generic" },
    { id: "au", name: "Australia", included: false, flagType: "generic" },
  ];

  const filtered = allCountries.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );
  */

  const visible: Destination[] = (() => {
    if (searchTerm.trim()) return destinations.slice(0, 4);
    const popular = POPULAR_CODES.map((c) => destinations.find((d) => d.code === c)).filter(
      (d): d is Destination => Boolean(d)
    );
    return (popular.length ? popular : destinations).slice(0, 4);
  })();
  const visibleKey = visible.map((d) => d.code).join(",");

  // For the selected line, check what is included in each shown destination.
  useEffect(() => {
    if (!activeLineId || !UUID_RE.test(activeLineId) || !visibleKey) return;
    let token = "";
    try {
      token = localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token") || "";
    } catch {}
    if (!token) return;
    const controller = new AbortController();
    visibleKey.split(",").forEach((code) => {
      getLineQuote(token, activeLineId, code, undefined, controller.signal)
        .then((q) => {
          const kind = classifyQuoteView(q);
          const badge: Badge =
            kind === "included"
              ? "included"
              : kind === "charged"
                ? "charged"
                : kind === "unsupported"
                  ? "unsupported"
                  : "info";
          setBadgeState((prev) => ({
            lineId: activeLineId,
            map: { ...(prev.lineId === activeLineId ? prev.map : {}), [code]: badge },
          }));
        })
        .catch(() => {});
    });
    return () => controller.abort();
  }, [activeLineId, visibleKey]);

  // SVG Flags matching the snippet
  const renderFlag = (type: CountryItem["flagType"]) => {
    switch (type) {
      case "france":
        return (
          <div className="w-7 h-5 rounded-sm overflow-hidden flex shadow-xs border border-slate-200">
            <span className="w-1/3 h-full bg-[#002395]" />
            <span className="w-1/3 h-full bg-white" />
            <span className="w-1/3 h-full bg-[#ED2939]" />
          </div>
        );
      case "spain":
        return (
          <div className="w-7 h-5 rounded-sm overflow-hidden flex flex-col shadow-xs border border-slate-200">
            <span className="h-1/4 bg-[#AA151B]" />
            <span className="h-2/4 bg-[#F1BF00]" />
            <span className="h-1/4 bg-[#AA151B]" />
          </div>
        );
      case "ireland":
        return (
          <div className="w-7 h-5 rounded-sm overflow-hidden flex shadow-xs border border-slate-200">
            <span className="w-1/3 h-full bg-[#169B62]" />
            <span className="w-1/3 h-full bg-white" />
            <span className="w-1/3 h-full bg-[#FF883E]" />
          </div>
        );
      case "usa":
        return (
          <div className="w-7 h-5 rounded-sm overflow-hidden relative shadow-xs border border-slate-200 bg-white">
            <div className="flex flex-col h-full justify-between">
              <span className="h-0.5 bg-[#B22234]" />
              <span className="h-0.5 bg-[#B22234]" />
              <span className="h-0.5 bg-[#B22234]" />
              <span className="h-0.5 bg-[#B22234]" />
            </div>
            <div className="absolute top-0 left-0 w-3 h-2.5 bg-[#3C3B6E]" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-5 rounded-sm bg-slate-100 flex items-center justify-center border border-slate-200 text-[10px] font-bold text-slate-500">
            🌐
          </div>
        );
    }
  };

  return (
    <div
      id="roaming-section"
      className="rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
            Roaming &amp; travel
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Check what&apos;s included before you go
          </p>
        </div>
        <a
          href="/dashboard/roaming-and-travel"
          className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          <span>Manage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Search Input */}
      <div className="relative mt-3">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Where are you going?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-[#E01C5B] focus:ring-2 focus:ring-pink-100 transition shadow-sm placeholder:text-slate-400"
        />
      </div>

      {!hasActivePlan && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between">
          <span>No roaming plan active · Check rates below</span>
          <a href="/roaming-and-coverage" className="font-semibold text-[#E01C5B] hover:underline">
            Details
          </a>
        </div>
      )}

      {/* Country List */}
      <div className="flex flex-col divide-y divide-slate-100 my-2">
        {visible.map((dest) => {
          const badge = badges[dest.code];
          return (
            <a
              key={dest.code}
              href={`/roaming-and-coverage?country=${encodeURIComponent(dest.code)}`}
              className="py-2.5 px-1 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-lg leading-none" aria-hidden="true">
                  {flagEmoji(dest.code)}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#0D1935]">{dest.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {badge === "included" ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Included</span>
                  </span>
                ) : badge === "charged" ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold text-[11px]">
                    Pay as you go
                  </span>
                ) : badge === "unsupported" ? (
                  <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-semibold text-[11px]">
                    Not available
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                    See rates
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </a>
          );
        })}

        {loadState === "loading" && visible.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">Loading destinations&hellip;</div>
        )}
        {loadState === "error" && (
          <div className="py-6 text-center text-xs text-slate-400">
            Destinations are unavailable right now. Please try again shortly.
          </div>
        )}
        {loadState === "ready" && visible.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            {searchTerm.trim() ? (
              <>No destination matched &ldquo;{searchTerm}&rdquo;</>
            ) : (
              "No destinations to show yet."
            )}
          </div>
        )}
      </div>

      {/* Disclaimer Note */}
      <div className="pt-2 flex items-start gap-2 text-[11px] text-slate-500 border-t border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="leading-tight">
          {activeLineId && UUID_RE.test(activeLineId)
            ? "Shown for your selected line. Open a destination for full rates and charges."
            : "Open a destination to see rates. Choose a line to see what is included for you."}
        </p>
      </div>
    </div>
  );
}

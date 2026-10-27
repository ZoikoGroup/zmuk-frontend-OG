"use client";
import React, { useState, useEffect } from "react";
import { BarChart2, ChevronRight, Sparkles } from "lucide-react";
import { fetchZoikoNexMonthlyUsage, ZoikoNexCycleUsage, ZOIKONEX_CONFIG } from "../../utils/zoikoNexApi";

interface MonthlyData {
  month: string;
  ukData: number;
  roamingData: number;
  isInProgress?: boolean;
}

interface DataUsageHistoryCardProps {
  currentUsedGb?: number;
  currentTotalGb?: number;
  roamingUsedGb?: number;
  linesCount?: number;
  activeLineId?: string;
}

export default function DataUsageHistoryCard({
  currentUsedGb = 0,
  currentTotalGb = 0,
  roamingUsedGb = 0,
  linesCount = 0,
  activeLineId,
}: DataUsageHistoryCardProps) {
  const [viewMode, setViewMode] = useState<"by_cycle" | "this_cycle">("by_cycle");
  const [hoveredBar, setHoveredBar] = useState<{ month: string; type: string; val: number } | null>(null);
  const [zoikoNexData, setZoikoNexData] = useState<ZoikoNexCycleUsage[] | null>(null);

  const hasActivePlan = linesCount > 0 && currentTotalGb > 0;

  // Dynamic ZoikoNex CDR monthly usage API call — ready to plug in ZoikoNex endpoint
  useEffect(() => {
    let isMounted = true;
    async function loadZoikoNexUsage() {
      if (activeLineId) {
        const cycles = await fetchZoikoNexMonthlyUsage(activeLineId);
        if (isMounted && cycles) {
          setZoikoNexData(cycles);
        }
      }
    }
    loadZoikoNexUsage();
    return () => {
      isMounted = false;
    };
  }, [activeLineId]);

  const monthsData: MonthlyData[] = zoikoNexData && zoikoNexData.length > 0
    ? zoikoNexData.map((c) => ({
        month: c.cycleName,
        ukData: c.ukDataGb,
        roamingData: c.roamingDataGb,
      }))
    : hasActivePlan
    ? [
        {
          month: "Current",
          ukData: Number(currentUsedGb.toFixed(1)),
          roamingData: Number(roamingUsedGb.toFixed(1)),
          isInProgress: true,
        },
      ]
    : [];
  const maxVal = Math.max(30, currentTotalGb || 30);

  return (
    <div
      id="usage-section"
      className="rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between"
    >
      {/* Header + Segmented Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
              Data usage
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Upcoming</span>
            </span>
            <a
              href="/dashboard/usage-and-allowances"
              className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline"
            >
              <span>Full usage report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            UK and roaming data by billing cycle · Live daily and monthly usage history upcoming
          </p>
        </div>

        {/* Toggle [ By cycle | This cycle ] */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("by_cycle")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "by_cycle"
                ? "bg-white text-[#0D1935] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            By cycle
          </button>
          <button
            type="button"
            onClick={() => setViewMode("this_cycle")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "this_cycle"
                ? "bg-white text-[#0D1935] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            This cycle
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-600 pb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#E01C5B]" />
          <span>UK data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#0D1935]" />
          <span>Roaming data</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Lighter bars: current cycle in progress
        </div>
      </div>

      {/* Empty State or Bar Chart Container */}
      {!hasActivePlan ? (
        <div className="relative w-full h-64 sm:h-72 mt-2 flex flex-col items-center justify-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 text-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-2.5 shadow-xs">
            <BarChart2 className="w-6 h-6 text-slate-400" />
          </div>
          <h5 className="text-sm font-bold text-[#0D1935]">No data usage recorded yet</h5>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            UK data and international roaming consumption will be tracked across your billing cycles once your SIM is active.
          </p>
          <a
            href="/dashboard/addons-and-boosters"
            className="mt-4 px-4 py-2 rounded-xl bg-[#E01C5B] text-white font-semibold text-xs hover:bg-[#c9144e] transition cursor-pointer shadow-xs"
          >
            Browse SIM Plans
          </a>
        </div>
      ) : (
        <div className="relative w-full h-64 sm:h-72 mt-2">
          {/* Y-Axis Grid Lines & Labels */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-slate-400 text-xs">
            {[30, 20, 10, 0].map((tick) => (
              <div key={tick} className="flex items-center w-full">
                <span className="w-9 text-right pr-2 text-[11px] font-medium text-slate-400 flex-shrink-0">
                  {tick} GB
                </span>
                <div className="flex-1 border-b border-slate-200/70" />
              </div>
            ))}
          </div>

          {/* Hover Tooltip */}
          {hoveredBar && (
            <div className="absolute top-2 right-4 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg z-20 pointer-events-none">
              <span className="font-semibold">{hoveredBar.month}</span>: {hoveredBar.type}{" "}
              <span className="font-bold text-[#F472B6]">{hoveredBar.val} GB</span>
            </div>
          )}

          {/* Bars Container */}
          <div className="absolute inset-0 pl-10 pb-5 pt-3 flex items-end justify-around">
            {monthsData.map((d) => {
              const ukHeightPct = (d.ukData / maxVal) * 100;
              const roamingHeightPct = (d.roamingData / maxVal) * 100;

              // Highlight if "this_cycle" is selected and this is the active month
              const isDimmed = viewMode === "this_cycle" && !d.isInProgress;

              return (
                <div
                  key={d.month}
                  className={`flex flex-col items-center h-full justify-end group transition-opacity duration-300 ${
                    isDimmed ? "opacity-30" : "opacity-100"
                  }`}
                >
                  {/* Bars Pair */}
                  <div className="flex items-end gap-1 sm:gap-1.5 h-full pb-1">
                    {/* UK Data Bar */}
                    <div
                      onMouseEnter={() =>
                        setHoveredBar({ month: d.month, type: "UK data", val: d.ukData })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ height: `${ukHeightPct}%` }}
                      className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 cursor-pointer ${
                        d.isInProgress
                          ? "bg-[#F472B6] hover:bg-[#E01C5B]"
                          : "bg-[#E01C5B] hover:opacity-90"
                      }`}
                    />
                    {/* Roaming Data Bar */}
                    <div
                      onMouseEnter={() =>
                        setHoveredBar({
                          month: d.month,
                          type: "Roaming data",
                          val: d.roamingData,
                        })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ height: `${roamingHeightPct}%` }}
                      className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 cursor-pointer ${
                        d.isInProgress
                          ? "bg-[#60A5FA] hover:bg-[#0D1935]"
                          : "bg-[#0D1935] hover:opacity-90"
                      }`}
                    />
                  </div>

                  {/* X-Axis Label */}
                  <span className="text-xs text-slate-500 font-medium mt-1">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Footer Stats */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] text-slate-500 font-medium">
            Average per completed cycle
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0D1935] mt-0.5">
            {hasActivePlan ? `${currentUsedGb.toFixed(1)} GB` : "0.0 GB"}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">
            Plan allowance
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0D1935] mt-0.5">
            {currentTotalGb > 0 ? `${currentTotalGb} GB` : "No plan"}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">
            Roaming this year
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0D1935] mt-0.5">
            {hasActivePlan ? `${roamingUsedGb.toFixed(1)} GB` : "0.0 GB"}
          </div>
        </div>
      </div>

      {/* Live Usage Notice */}
      {!ZOIKONEX_CONFIG.IS_CONNECTED && (
        <div className="mt-3 py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 flex items-center justify-between gap-2">
          <span>Daily &amp; monthly usage history is upcoming. Real-time billing cycle data will sync automatically once active.</span>
          <span className="font-semibold text-slate-600 shrink-0">Upcoming</span>
        </div>
      )}
    </div>
  );
}

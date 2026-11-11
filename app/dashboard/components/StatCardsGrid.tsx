"use client";

import React from "react";
import {
  Wifi,
  CreditCard,
  Calendar,
  Cpu,
} from "lucide-react";
import { ZOIKONEX_CONFIG } from "../../utils/zoikoNexApi";

interface StatCardsGridProps {
  dataRemainingGb: number;
  dataTotalGb: number;
  dataRemainingPct: number;
  nextCollectionAmount: number;
  nextCollectionDate: string;
  linesCount: number;
  cycleDaysLeft: number;
  renewDate: string;
  lineStatus: string;
  simType: string;
}

export default function StatCardsGrid({
  dataRemainingGb = 0,
  dataTotalGb = 0,
  dataRemainingPct = 0,
  nextCollectionAmount = 0,
  nextCollectionDate = "—",
  linesCount = 0,
  cycleDaysLeft = 0,
  renewDate = "—",
  lineStatus = "Inactive",
  simType = "—",
}: StatCardsGridProps) {
  // Dot matrix SVG background pattern
  const DotMatrixWhite = () => (
    <div className="absolute top-2 right-4 w-28 h-20 opacity-20 pointer-events-none grid grid-cols-7 gap-3">
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} className="w-1 h-1 rounded-full bg-white" />
      ))}
    </div>
  );

  const DotMatrixGray = () => (
    <div className="absolute top-2 right-4 w-28 h-20 opacity-5 pointer-events-none grid grid-cols-7 gap-3">
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} className="w-1 h-1 rounded-full bg-[#0D1935]" />
      ))}
    </div>
  );

  const isLive = ZOIKONEX_CONFIG.IS_CONNECTED;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* ── CARD 1: Pink Hero Card (Data Remaining) ── */}
      <div className="relative overflow-hidden rounded-[20px] bg-[#E01C5B] p-5 text-white shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E01C5B] flex flex-col justify-between min-h-[176px]">
        <DotMatrixWhite />

        {/* Top: Icon + Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div className="px-2.5 py-1 bg-white text-[#E01C5B] text-xs font-bold rounded-full shadow-sm">
            {isLive && dataTotalGb > 0 ? `${dataRemainingPct}% remaining` : "Upcoming"}
          </div>
        </div>

        {/* Center: Label + Big Values */}
        <div className="mt-4 relative z-10">
          <div className="text-white/85 text-xs sm:text-sm font-medium">
            Data remaining
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {isLive && dataTotalGb > 0 ? (
                <>
                  {dataRemainingGb}
                  <span className="text-lg sm:text-xl font-bold ml-1 text-white/90">GB</span>
                </>
              ) : (
                <>
                  0
                  <span className="text-lg sm:text-xl font-bold ml-1 text-white/90">GB</span>
                </>
              )}
            </div>
            <div className="text-xs text-white/80 leading-tight">
              {isLive && dataTotalGb > 0 ? (
                <>of {dataTotalGb} GB<br />this cycle</>
              ) : (
                <>Live allowance<br />upcoming</>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Progress Bar */}
        <div className="mt-3 relative z-10">
          <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${isLive && dataTotalGb > 0 ? Math.min(100, Math.max(0, dataRemainingPct)) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 2: Next Collection ── */}
      <div className="relative overflow-hidden rounded-[20px] bg-white p-5 text-slate-800 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between min-h-[176px]">
        <DotMatrixGray />

        {/* Top: Icon + Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#0D1935]" />
          </div>
          <div className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
            {isLive && linesCount > 0 ? "Direct Debit" : "Upcoming"}
          </div>
        </div>

        {/* Center: Label + Big Values */}
        <div className="mt-4 relative z-10">
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            Next collection · account
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0D1935]">
              £{isLive ? nextCollectionAmount.toFixed(2) : "0.00"}
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              {isLive && linesCount > 0 ? (
                <>on {nextCollectionDate}<br />{linesCount} {linesCount === 1 ? "line" : "lines"}</>
              ) : (
                <>Live collections<br />upcoming</>
              )}
            </div>
          </div>
        </div>

        {/* Spacer for height alignment */}
        <div className="h-1.5" />
      </div>

      {/* ── CARD 3: Allowance Cycle ── */}
      <div className="relative overflow-hidden rounded-[20px] bg-white p-5 text-slate-800 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between min-h-[176px]">
        <DotMatrixGray />

        {/* Top: Icon + Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#0D1935]" />
          </div>
          <div className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
            isLive && linesCount > 0
              ? "bg-pink-50 text-[#E01C5B] border-pink-100"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}>
            {isLive && linesCount > 0 ? `Renews ${renewDate}` : "Upcoming"}
          </div>
        </div>

        {/* Center: Label + Big Values */}
        <div className="mt-4 relative z-10">
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            Allowance cycle
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            {isLive && linesCount > 0 ? (
              <>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0D1935]">
                  {cycleDaysLeft}
                  <span className="text-lg sm:text-xl font-bold ml-1 text-slate-500">days</span>
                </div>
                <div className="text-xs text-slate-500 leading-tight">
                  left until your<br />allowance renews
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0D1935]">
                  —
                </div>
                <div className="text-xs text-slate-500 leading-tight">
                  Cycle tracking<br />upcoming
                </div>
              </>
            )}
          </div>
        </div>

        {/* Spacer for height alignment */}
        <div className="h-1.5" />
      </div>

      {/* ── CARD 4: Line Status ── */}
      <div className="relative overflow-hidden rounded-[20px] bg-white p-5 text-slate-800 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between min-h-[176px]">
        <DotMatrixGray />

        {/* Top: Icon + Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#0D1935]" />
          </div>
          <div className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
            {isLive && linesCount > 0 ? simType : "Upcoming"}
          </div>
        </div>

        {/* Center: Label + Big Values */}
        <div className="mt-4 relative z-10">
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            Line status
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0D1935]">
              {isLive && linesCount > 0 ? lineStatus : "Upcoming"}
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              {isLive && linesCount > 0 ? (
                <>SIM status only —<br />not network health</>
              ) : (
                <>Live status<br />upcoming</>
              )}
            </div>
          </div>
        </div>

        {/* Spacer for height alignment */}
        <div className="h-1.5" />
      </div>
    </div>
  );
}

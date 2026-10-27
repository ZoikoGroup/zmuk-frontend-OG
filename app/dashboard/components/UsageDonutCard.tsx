"use client";

import React from "react";
import { ChevronRight, Plus, Check } from "lucide-react";
import { ZOIKONEX_CONFIG } from "../../utils/zoikoNexApi";

interface UsageDonutCardProps {
  dataRemainingGb: number;
  dataTotalGb: number;
  dataUsedGb: number;
  dataRemainingPct: number;
  updatedTime?: string;
  onOpenBoosterModal: () => void;
  onOpenDetails?: () => void;
}

export default function UsageDonutCard({
  dataRemainingGb = 0,
  dataTotalGb = 0,
  dataUsedGb = 0,
  dataRemainingPct = 0,
  updatedTime = "Just now",
  onOpenBoosterModal,
  onOpenDetails,
}: UsageDonutCardProps) {
  const isLive = ZOIKONEX_CONFIG.IS_CONNECTED;

  // SVG Donut calculation
  const radius = 78;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  // Progress offset (from top: -90 deg rotation)
  const offset = circumference - (Math.min(100, Math.max(0, isLive ? dataRemainingPct : 0)) / 100) * circumference;

  return (
    <div className="rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
            Data, calls &amp; texts
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Updated {updatedTime}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDetails || (() => window.location.assign("#usage-section"))}
          className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Donut Chart & Center Stats */}
      <div className="flex flex-col items-center justify-center my-4">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 200 200">
            {/* Background Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#F1F3F7"
              strokeWidth={strokeWidth}
            />
            {/* Pink Progress Arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#E01C5B"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
              {isLive && dataTotalGb > 0 ? `${dataRemainingGb} GB` : "0.0 GB"}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
              {isLive && dataTotalGb > 0 ? `remaining of ${dataTotalGb} GB` : "Live usage upcoming"}
            </span>
          </div>
        </div>

        {/* Center Badge below donut */}
        <div className="mt-2 px-3 py-1 bg-pink-50 text-[#E01C5B] text-xs font-semibold rounded-full border border-pink-100">
          {isLive && dataTotalGb > 0
            ? `${dataRemainingPct}% remaining · ${dataUsedGb} GB used`
            : "Data & allowances upcoming"}
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="flex flex-col border-t border-slate-100 divide-y divide-slate-100 text-xs">
        {/* Row 1: Data */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E01C5B]" />
            <span className="font-medium text-slate-700">Data</span>
          </div>
          <span className="font-semibold text-[#0D1935]">
            {isLive && dataTotalGb > 0 ? `${dataRemainingGb} GB / ${dataTotalGb} GB` : "0.0 GB"}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-pink-50 text-[#E01C5B] font-semibold text-[11px]">
            {isLive && dataTotalGb > 0 ? `${dataRemainingPct}% left` : "Upcoming"}
          </span>
        </div>

        {/* Row 2: UK Calls */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0D1935]" />
            <span className="font-medium text-slate-700">UK calls</span>
          </div>
          <span className="font-semibold text-[#0D1935]">
            {isLive && dataTotalGb > 0 ? "Unlimited" : "—"}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 ${
            isLive && dataTotalGb > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
          }`}>
            {isLive && dataTotalGb > 0 && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{isLive && dataTotalGb > 0 ? "Included" : "Upcoming"}</span>
          </span>
        </div>

        {/* Row 3: UK Texts */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span className="font-medium text-slate-700">UK texts</span>
          </div>
          <span className="font-semibold text-[#0D1935]">
            {isLive && dataTotalGb > 0 ? "Unlimited" : "—"}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 ${
            isLive && dataTotalGb > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
          }`}>
            {isLive && dataTotalGb > 0 && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{isLive && dataTotalGb > 0 ? "Included" : "Upcoming"}</span>
          </span>
        </div>
      </div>

      {/* Booster Action Button */}
      <div className="pt-3">
        {isLive && dataTotalGb > 0 ? (
          <button
            type="button"
            onClick={onOpenBoosterModal}
            className="w-full py-2.5 px-4 bg-[#E01C5B] hover:bg-[#c9144e] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buy data booster</span>
          </button>
        ) : (
          <a
            href="/dashboard/addons-and-boosters"
            className="w-full py-2.5 px-4 bg-[#E01C5B] hover:bg-[#c9144e] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Choose a plan</span>
          </a>
        )}
      </div>
    </div>
  );
}

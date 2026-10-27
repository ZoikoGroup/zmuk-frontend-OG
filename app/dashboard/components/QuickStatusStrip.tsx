"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  CheckCircle2,
  Cpu,
  ChevronDown,
  ChevronRight,
  Info,
  RefreshCw,
  Check,
} from "lucide-react";

export interface LineOption {
  id: string;
  number: string;
  planName: string;
  simType: string;
  status: string;
  renewDate: string;
  isPrimary?: boolean;
}

interface QuickStatusStripProps {
  lines: LineOption[];
  activeLineId: string;
  onSelectLine: (id: string) => void;
  lastUpdated?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onManagePlan?: () => void;
  onAddNewNumber?: () => void;
  onManageNumbers?: () => void;
}

export default function QuickStatusStrip({
  lines,
  activeLineId,
  onSelectLine,
  lastUpdated = "09:30 BST, 14 Oct",
  onRefresh,
  isRefreshing = false,
  onManagePlan,
  onAddNewNumber,
  onManageNumbers,
}: QuickStatusStripProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasLines = lines.length > 0;
  const activeLine = hasLines
    ? lines.find((l) => l.id === activeLineId) || lines[0]
    : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full flex items-center justify-between gap-3 flex-wrap py-2">
      {/* Left items: Pills */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {hasLines && activeLine ? (
          <>
            {/* Pill 1: Phone selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-11 px-3.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div className="text-xs">
                  <span className="text-slate-500 font-normal">Showing </span>
                  <span className="text-[#0D1935] font-bold">{activeLine.number}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
              </button>

              {/* Numbers Dropdown */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Mobile Number</span>
                    <span className="text-[10px] font-bold text-[#E01C5B]">{lines.length} total</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 max-h-60 overflow-y-auto">
                    {lines.map((line) => {
                      const isSelected = line.id === activeLine.id;
                      return (
                        <button
                          key={line.id}
                          type="button"
                          onClick={() => {
                            onSelectLine(line.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-pink-50 border border-pink-200 text-[#0D1935]"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-[#0D1935]">
                              {line.number}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {line.planName} · {line.simType}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#E01C5B] text-white flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Add / Manage Footer inside Dropdown */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                    {onAddNewNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onAddNewNumber();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E01C5B] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span>+ Add a new number</span>
                      </button>
                    )}
                    {onManageNumbers && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onManageNumbers();
                        }}
                        className="w-full py-1.5 px-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>Manage all numbers</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pill 2: Line active · eSIM */}
            <div className="h-11 px-3.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xs">
                <span className="text-[#0D1935] font-bold">
                  {activeLine.status === "Paused" ? "Line paused" : "Line active"}
                </span>
                <span className="text-slate-500 font-normal"> · {activeLine.simType}</span>
              </div>
            </div>

            {/* Pill 3: Plan Info & Manage Plan link */}
            <div className="h-11 px-3.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-4 h-4 text-[#E01C5B]" />
              </div>
              <div className="text-xs">
                <span className="text-[#0D1935] font-bold">{activeLine.planName}</span>
                <span className="text-slate-500 font-normal"> · renews {activeLine.renewDate}</span>
              </div>
              <button
                type="button"
                onClick={onManagePlan || (() => window.location.assign("/dashboard/compare-plans"))}
                className="ml-2 text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>Manage plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Empty State Pill 1: No active number */}
            <a
              href="/activate-your-sim"
              className="h-11 px-3.5 bg-white rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xs flex items-center gap-2">
                <div>
                  <span className="text-slate-500 font-normal">Number: </span>
                  <span className="text-[#0D1935] font-bold">No SIM active</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                  Upcoming
                </span>
              </div>
            </a>

            {/* Empty State Pill 2: Quick Add Number */}
            {onAddNewNumber && (
              <button
                type="button"
                onClick={onAddNewNumber}
                className="h-11 px-3.5 bg-white rounded-2xl border border-dashed border-[#E01C5B] flex items-center gap-2 text-xs font-semibold text-[#E01C5B] hover:bg-pink-50 transition cursor-pointer shadow-sm"
              >
                <span>+ Add a new number</span>
              </button>
            )}

            {/* Empty State Pill 3: Link to Plans */}
            <a
              href="/dashboard/compare-plans"
              className="h-11 px-3.5 bg-pink-50 rounded-2xl border border-pink-200 flex items-center gap-2 text-xs font-semibold text-[#E01C5B] hover:bg-pink-100 transition"
            >
              <Cpu className="w-4 h-4 text-[#E01C5B]" />
              <span>Browse 30-Day SIM Plans</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </>
        )}
      </div>

      {/* Right item: Usage freshness & refresh */}
      <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Usage updated</span>
        <span className="font-medium text-slate-600">{lastUpdated}</span>
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh dashboard data"
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-sm cursor-pointer ml-1"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#E01C5B]" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

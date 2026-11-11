"use client";

import React from "react";
import {
  Smartphone,
  ChevronRight,
  CheckCircle2,
  Users,
  Shield,
  Key,
  History,
  Lock,
  AlertTriangle,
  Plus,
  Check,
  Radio,
} from "lucide-react";
import { LineOption } from "./QuickStatusStrip";

interface BottomThreeCardsProps {
  lines: LineOption[];
  activeLineId: string;
  onSelectLine: (id: string) => void;
  onAddNewNumber: () => void;
  onManageMobile?: () => void;
  onManageNumbers?: () => void;
  onSwapSim?: () => void;
  onReportSuspicious: () => void;
  onToggle2FA?: () => void;
  twoFAEnabled?: boolean;
}

export default function BottomThreeCards({
  lines,
  activeLineId,
  onSelectLine,
  onAddNewNumber,
  onManageMobile,
  onManageNumbers,
  onSwapSim,
  onReportSuspicious,
  onToggle2FA,
  twoFAEnabled = true,
}: BottomThreeCardsProps) {
  const hasLines = lines.length > 0;
  const activeLine = lines.find((l) => l.id === activeLineId) || lines[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ── CARD 1: My Mobile ── */}
      <div
        id="my-mobile-section"
        className="rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-[#E01C5B]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#0D1935]">My mobile</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hasLines ? "Selected line" : "No active line"}
                </p>
              </div>
            </div>

            {hasLines ? (
              <button
                type="button"
                onClick={onManageMobile}
                className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href="/dashboard/sim-and-esim"
                className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>Activate</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* SIM Card Visual Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5 my-3">
            {/* Graphic SIM icon */}
            <div className="w-12 h-14 rounded-xl bg-white border border-slate-200 p-1.5 flex flex-col justify-between shadow-xs relative overflow-hidden flex-shrink-0">
              <div className={`w-full h-7 rounded-lg ${hasLines ? "bg-[#E01C5B]" : "bg-slate-200"} relative flex items-center justify-center`}>
                <div className={`w-4 h-3 rounded-xs ${hasLines ? "bg-amber-400" : "bg-slate-300"} border border-white/60`} />
              </div>
              <div className="w-2.5 h-1 rounded-full bg-slate-300 mx-auto" />
            </div>

            <div>
              <h5 className="text-sm sm:text-base font-bold text-[#0D1935] leading-tight">
                {activeLine ? activeLine.planName : "No active SIM or eSIM"}
              </h5>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-600 font-medium">
                  {activeLine ? activeLine.number : "No mobile device linked"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-semibold">
                  Account holder
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="flex flex-col divide-y divide-slate-100 text-xs py-1">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-medium">SIM type</span>
              <span className="font-semibold text-[#0D1935]">
                {activeLine
                  ? activeLine.simType.includes("eSIM")
                    ? "eSIM (digital)"
                    : "Physical SIM"
                  : "—"}
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-medium">SIM status</span>
              {activeLine ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-200/60 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  No SIM
                </span>
              )}
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Plan started</span>
              <span className="font-semibold text-[#0D1935]">
                {activeLine ? "Active" : "—"}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {activeLine && (
            <div className="pt-3 pb-2">
              <div className="flex items-center justify-between relative">
                {/* Connecting line */}
                <div className="absolute left-6 right-6 top-3 h-0.5 bg-emerald-400 -z-0" />

                {/* Step 1 */}
                <div className="flex flex-col items-center relative z-10 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#0D1935] mt-1">Requested</span>
                  <span className="text-[10px] text-slate-400">Confirmed</span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center relative z-10 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#0D1935] mt-1">Provisioned</span>
                  <span className="text-[10px] text-slate-400">Confirmed</span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center relative z-10 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#0D1935] mt-1">Activated</span>
                  <span className="text-[10px] text-slate-400">Confirmed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100 text-xs font-semibold pt-2">
          {activeLine ? (
            <>
              <button
                type="button"
                onClick={onManageMobile}
                className="py-2.5 flex items-center justify-between text-[#0D1935] hover:text-[#E01C5B] transition w-full text-left cursor-pointer"
              >
                <span>Manage SIM / eSIM</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={onSwapSim}
                className="py-2.5 flex items-center justify-between text-[#0D1935] hover:text-[#E01C5B] transition w-full text-left cursor-pointer"
              >
                <span>Replace or swap SIM</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </>
          ) : (
            <>
              <a
                href="/dashboard/sim-and-esim"
                className="py-2.5 flex items-center justify-between text-[#0D1935] hover:text-[#E01C5B] transition"
              >
                <span>Activate a SIM card</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="/dashboard/compare-plans"
                className="py-2.5 flex items-center justify-between text-[#0D1935] hover:text-[#E01C5B] transition"
              >
                <span>Browse SIM Plans</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* ── CARD 2: My Numbers ── */}
      <div
        id="my-numbers"
        className="rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#E01C5B]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#0D1935]">My numbers</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lines.filter((l) => (l.status || "").toLowerCase() === "active").length} active · {lines.length} {lines.length === 1 ? "line" : "lines"} total
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onManageNumbers}
              className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Numbers Interactive List */}
          {hasLines ? (
            <div className="flex flex-col gap-2.5 my-3">
              {lines.map((line) => {
                const isSelected = line.id === activeLineId;
                return (
                  <div
                    key={line.id}
                    onClick={() => onSelectLine(line.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? "border-[#E01C5B] bg-pink-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Radio Icon */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "border-[#E01C5B]" : "border-slate-300"
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />
                      )}
                    </div>

                    {/* Line Info */}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#0D1935]">
                        {line.number}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {line.planName} · {line.simType}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                        This device
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-[11px]">
                        Limited access
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="my-3 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center py-6">
              <Radio className="w-7 h-7 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-[#0D1935]">No phone numbers registered</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-[220px]">
                Order a physical SIM or activate an eSIM to link your mobile numbers here.
              </p>
            </div>
          )}
        </div>

        {/* Add Number Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={onAddNewNumber}
            className="w-full py-2.5 px-4 bg-white border border-dashed border-[#E01C5B] hover:bg-pink-50 text-[#E01C5B] font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add a new number</span>
          </button>
        </div>
      </div>

      {/* ── CARD 3: Account Security ── */}
      <div className="rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[#E01C5B]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#0D1935]">
                  Account security
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign-in protection and activity
                </p>
              </div>
            </div>

            <a
              href="/dashboard/security"
              className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Security Items List */}
          <div className="flex flex-col divide-y divide-slate-100 text-xs my-2">
            {/* 2FA - Two-factor authentication (Temporarily commented out)
            <div
              onClick={onToggle2FA}
              className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-1 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="font-semibold text-[#0D1935]">
                    Two-factor authentication
                  </div>
                  <div className="text-slate-400 text-[11px]">Authenticator app</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 border transition ${
                    twoFAEnabled
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {twoFAEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{twoFAEnabled ? "On" : "Off"}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFAEnabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle2FA?.();
                  }}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    twoFAEnabled ? "bg-[#E01C5B]" : "bg-slate-200"
                  }`}
                  title={twoFAEnabled ? "Click to disable 2FA" : "Click to enable 2FA"}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      twoFAEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
            */}

            {/* Recent Sign-ins */}
            <a
              href="/dashboard/security"
              className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-1 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="font-semibold text-[#0D1935]">Recent sign-ins</div>
                  <div className="text-slate-400 text-[11px]">Last 7 days</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  3 sessions
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </a>

            {/* Passkeys */}
            <div className="py-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="font-semibold text-[#0D1935]">Passkeys</div>
                  <div className="text-slate-400 text-[11px]">
                    Sign in with your device
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                Not available yet
              </span>
            </div>

            {/* Report Suspicious Activity */}
            <div
              onClick={onReportSuspicious}
              className="py-3 flex items-center justify-between hover:bg-red-50/50 px-1 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-[#0D1935]">
                    Report suspicious activity
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Creates a support case
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}

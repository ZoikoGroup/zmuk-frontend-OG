"use client";

import React, { useState ,useEffect } from "react";
import Link from "next/link";
import {
  X,
  Zap,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Check,
  Trash2,
  PauseCircle,
  PlayCircle,
  Radio,
  Users,
  Settings,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { LineOption } from "./QuickStatusStrip";

// ── 1. BUY DATA BOOSTER MODAL ──
interface BoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRemainingGb: number;
  onApplyBooster: (addedGb: number, cost: number) => void;
  initialGb?: number;
  initialPrice?: number;
}

export function BoosterModal({
  isOpen,
  onClose,
  currentRemainingGb,
  onApplyBooster,
  initialGb,
  initialPrice,
}: BoosterModalProps) {
  const [selectedBooster, setSelectedBooster] = useState<{ gb: number; price: number }>({
    gb: initialGb ?? 5,
    price: initialPrice ?? 5,
  });
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialGb !== undefined) {
        setSelectedBooster({
          gb: initialGb,
          price: initialPrice !== undefined ? initialPrice : (initialGb === 1 || initialGb === 2 ? 3 : initialGb === 5 ? 5 : initialGb === 10 ? 10 : 18),
        });
      } else {
        setSelectedBooster({ gb: 5, price: 5 });
      }
    }
  }, [isOpen, initialGb, initialPrice]);

  if (!isOpen) return null;

  const boosters = [
    { gb: 1, price: 3, label: "Quick top-up" },
    { gb: 2, price: 3, label: "Light boost" },
    { gb: 5, price: 5, label: "Most popular", recommended: true },
    { gb: 10, price: 10, label: "Heavy usage" },
    { gb: 20, price: 18, label: "Streaming & travel" },
  ];

  const handlePurchase = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyBooster(selectedBooster.gb, selectedBooster.price);
      setIsApplying(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#E01C5B] flex-shrink-0">
            <Zap className="w-6 h-6 text-[#E01C5B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0D1935]">Buy Data Booster</h3>
            <p className="text-xs text-slate-500">
              Boost your allowance instantly until the next billing cycle.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex justify-between">
          <span className="text-slate-500">Current remaining data:</span>
          <span className="font-bold text-[#0D1935]">{currentRemainingGb} GB</span>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {boosters.map((b) => {
            const isSelected = selectedBooster.gb === b.gb;
            return (
              <div
                key={b.gb}
                onClick={() => setSelectedBooster({ gb: b.gb, price: b.price })}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-[#E01C5B] bg-pink-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-[#E01C5B]" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0D1935]">
                      +{b.gb} GB Booster
                    </div>
                    <div className="text-[11px] text-slate-500">{b.label}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-[#0D1935]">£{b.price}.00</div>
                  {b.recommended && (
                    <span className="text-[10px] text-[#E01C5B] font-bold">Best value</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">New allowance will be:</div>
            <div className="text-base font-extrabold text-[#0D1935]">
              {(currentRemainingGb + selectedBooster.gb).toFixed(1)} GB
            </div>
          </div>
          <button
            type="button"
            disabled={isApplying}
            onClick={handlePurchase}
            className="px-6 py-2.5 bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isApplying ? "Adding booster..." : `Add for £${selectedBooster.price}.00`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 2. ADD NEW NUMBER MODAL ──
export interface AddNumberData {
  number: string;
  planName: string;
  simType: string;
  planGb?: number;
}

interface AddNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNumber: (newNumber: AddNumberData) => void;
}

const AVAILABLE_PLANS = [
  { name: "Zoiko Starter 5GB", price: "£7.99/mo", gb: 5 },
  { name: "Zoiko Lite 10GB", price: "£9.99/mo", gb: 10 },
  { name: "Zoiko Standard 20GB", price: "£14.99/mo", gb: 20 },
  { name: "Zoiko Max 30GB", price: "£19.99/mo", gb: 30 },
  { name: "Zoiko Ultra 50GB", price: "£24.99/mo", gb: 50 },
  { name: "Zoiko Unlimited 5G", price: "£29.99/mo", gb: 100 },
];

export function AddNumberModal({ isOpen, onClose, onAddNumber }: AddNumberModalProps) {
  const [number, setNumber] = useState("");
  const [planIndex, setPlanIndex] = useState(2); // default Zoiko Standard 20GB
  const [simType, setSimType] = useState<"eSIM" | "Physical SIM">("eSIM");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = number.replace(/\s+/g, "");
    if (!cleanNum) {
      setError("Please enter a valid UK mobile number.");
      return;
    }
    if (cleanNum.length < 10) {
      setError("Please enter a valid UK mobile number (minimum 10-11 digits).");
      return;
    }

    const selectedPlan = AVAILABLE_PLANS[planIndex];
    onAddNumber({
      number,
      planName: selectedPlan.name,
      simType: simType === "eSIM" ? "eSIM" : "Physical SIM",
      planGb: selectedPlan.gb,
    });
    setNumber("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#E01C5B] flex-shrink-0">
            <Smartphone className="w-6 h-6 text-[#E01C5B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0D1935]">Add a New Number</h3>
            <p className="text-xs text-slate-500">
              Register or link an extra mobile line to your Zoiko account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* Mobile Number Input */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">UK Mobile Number</label>
            <input
              type="tel"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. 07700 900555"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#E01C5B]"
              required
            />
            {error && <p className="text-red-500 text-[11px] mt-1 font-medium">{error}</p>}
          </div>

          {/* Choose Plan */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Choose Plan</label>
            <select
              value={planIndex}
              onChange={(e) => setPlanIndex(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#E01C5B] bg-white cursor-pointer"
            >
              {AVAILABLE_PLANS.map((p, idx) => (
                <option key={p.name} value={idx}>
                  {p.name} ({p.price})
                </option>
              ))}
            </select>
          </div>

          {/* SIM Type */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">SIM Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimType("eSIM")}
                className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer transition ${
                  simType === "eSIM"
                    ? "border-[#E01C5B] bg-pink-50 text-[#E01C5B] shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                eSIM (Digital)
              </button>
              <button
                type="button"
                onClick={() => setSimType("Physical SIM")}
                className={`py-2 px-3 rounded-xl border text-center font-semibold cursor-pointer transition ${
                  simType === "Physical SIM"
                    ? "border-[#E01C5B] bg-pink-50 text-[#E01C5B] shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Physical SIM
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white font-semibold text-xs rounded-xl transition shadow-sm cursor-pointer"
            >
              Confirm &amp; Add Line
            </button>
          </div>

          {/* Quick Project Links for Device IMEI Compatibility & SIM Activation */}
          <div className="pt-3 mt-1 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
            <a
              href="/dashboard/add-device"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-pink-50/50 text-slate-700 hover:text-[#E01C5B] font-medium transition"
            >
              <span>Check Device IMEI/EID Compatibility &amp; Add Device</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/activate-your-sim"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-pink-50/50 text-slate-700 hover:text-[#E01C5B] font-medium transition"
            >
              <span>Have a new Zoiko SIM card? Activate SIM / eSIM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MANAGE SINGLE LINE MODAL ──
interface ManageSingleLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: LineOption | null;
  metrics?: { remaining: number; total: number; used: number };
  onTogglePauseLine: (id: string) => void;
  onAddBooster: () => void;
  onSwapSim?: () => void;
}

export function ManageSingleLineModal({
  isOpen,
  onClose,
  line,
  metrics,
  onTogglePauseLine,
  onAddBooster,
  onSwapSim,
}: ManageSingleLineModalProps) {
  if (!isOpen || !line) return null;

  const isPaused = (line.status || "").toLowerCase() === "paused";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#E01C5B] flex-shrink-0">
            <Smartphone className="w-6 h-6 text-[#E01C5B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#0D1935]">{line.number}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isPaused ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isPaused ? "Paused" : "Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500">{line.planName}</p>
          </div>
        </div>

        {/* Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 text-xs">
          <div className="py-1.5 flex justify-between">
            <span className="text-slate-500">SIM Type</span>
            <span className="font-semibold text-[#0D1935]">
              {line.simType.includes("eSIM") ? "eSIM (digital)" : "Physical SIM"}
            </span>
          </div>
          <div className="py-1.5 flex justify-between">
            <span className="text-slate-500">Billing Cycle</span>
            <span className="font-semibold text-[#0D1935]">Monthly (renews {line.renewDate})</span>
          </div>
          {metrics && (
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">Data Remaining</span>
              <span className="font-semibold text-[#0D1935]">
                {metrics.remaining} GB of {metrics.total} GB
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 pt-1 text-xs">
          {/* Pause / Resume Line */}
          <button
            type="button"
            onClick={() => {
              onTogglePauseLine(line.id);
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer border ${
              isPaused
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
            }`}
          >
            {isPaused ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Resume Line (Reactivate SIM)</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Pause Line (Temporarily Disable Calls &amp; Data)</span>
              </>
            )}
          </button>

          {/* Add Data Booster */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddBooster();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer bg-white border border-slate-200 text-[#0D1935] hover:bg-slate-50"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Add Data Booster to this Line</span>
          </button>

          {/* View Full Usage Breakdown */}
          <a
            href={`/dashboard/plan-usages/${line.id}`}
            className="w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer bg-white border border-slate-200 text-[#0D1935] hover:bg-slate-50"
          >
            <BarChart2 className="w-4 h-4 text-[#E01C5B]" />
            <span>View Full Usage Breakdown</span>
          </a>

          {/* Replace / Swap SIM */}
          {onSwapSim && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwapSim();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition cursor-pointer bg-white border border-slate-200 text-[#0D1935] hover:bg-slate-50"
            >
              <Smartphone className="w-4 h-4 text-[#E01C5B]" />
              <span>Replace or Swap SIM / Request eSIM QR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MANAGE ALL NUMBERS MODAL ──
interface ManageAllNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineOption[];
  activeLineId: string;
  subscriberId?: string | number | null;
  onSelectLine: (id: string) => void;
  onSetPrimaryLine: (id: string) => void;
  onTogglePauseLine: (id: string) => void;
  onDeleteLine: (id: string) => void;
  onAddNewNumber: () => void;
}

export function ManageAllNumbersModal({
  isOpen,
  onClose,
  lines,
  activeLineId,
  subscriberId,
  onSelectLine,
  onSetPrimaryLine,
  onTogglePauseLine,
  onDeleteLine,
  onAddNewNumber,
}: ManageAllNumbersModalProps) {
  if (!isOpen) return null;

  const subIdStr = subscriberId ? String(subscriberId) : "1";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95 max-h-[90vh] overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#E01C5B] flex-shrink-0">
            <Users className="w-6 h-6 text-[#E01C5B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0D1935]">Manage My Numbers</h3>
            <p className="text-xs text-slate-500">
              {lines.length} {lines.length === 1 ? "mobile line" : "mobile lines"} linked to your account.
            </p>
          </div>
        </div>

        {/* List of Numbers */}
        <div className="overflow-y-auto max-h-[50vh] pr-1 flex flex-col gap-3 my-1">
          {lines.map((line) => {
            const isSelected = line.id === activeLineId;
            const isPaused = (line.status || "").toLowerCase() === "paused";

            return (
              <div
                key={line.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col gap-2.5 ${
                  isSelected
                    ? "border-[#E01C5B] bg-pink-50/30 shadow-xs"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectLine(line.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        isSelected ? "border-[#E01C5B]" : "border-slate-300"
                      }`}
                      title={isSelected ? "Currently selected active line" : "Click to select this line"}
                    >
                      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0D1935]">{line.number}</span>
                        {line.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            Primary
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isPaused
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          }`}
                        >
                          {isPaused ? "Paused" : "Active"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {line.planName} · {line.simType}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this line */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {!line.isPrimary && (
                      <button
                        type="button"
                        onClick={() => onSetPrimaryLine(line.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        title="Set this line as your account primary line"
                      >
                        Make Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onTogglePauseLine(line.id)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        isPaused
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                      title={isPaused ? "Resume line service" : "Pause line service"}
                    >
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to unlink ${line.number}?`)) {
                            onDeleteLine(line.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Unlink this number"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Add New Number & Full Page Link */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddNewNumber();
            }}
            className="w-full py-2.5 bg-white border border-dashed border-[#E01C5B] hover:bg-pink-50 text-[#E01C5B] font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add a new number</span>
          </button>
          <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
            <a
              href="/dashboard/my-mobile-numbers"
              className="text-slate-600 hover:text-[#E01C5B] font-semibold flex items-center gap-1 transition"
            >
              <span>Open Full Devices &amp; SIMs Manager</span>
              <ArrowRight className="w-3 h-3" />
            </a>
            <a
              href="/dashboard/add-device"
              className="text-slate-600 hover:text-[#E01C5B] font-semibold flex items-center gap-1 transition"
            >
              <span>Add Device (IMEI Check)</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. REPORT SUSPICIOUS ACTIVITY MODAL ──
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}

export function ReportActivityModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onSubmit(note);
      setLoading(false);
      setNote("");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0D1935]">Report Suspicious Activity</h3>
            <p className="text-xs text-slate-500">
              Our UK security team will investigate immediately.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the issue (e.g. unfamiliar sign-in, unauthorized changes)..."
            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-red-500 resize-none"
            required
          />

          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Case"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 4. COMPARE PLANS MODAL ──
interface ComparePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanName?: string;
  onSelectPlan?: (planName: string, planGb: number, price: number) => void;
}

export function ComparePlansModal({
  isOpen,
  onClose,
  currentPlanName,
  onSelectPlan,
}: ComparePlansModalProps) {
  if (!isOpen) return null;

  const effectiveCurrentPlan =
    currentPlanName ||
    (typeof window !== "undefined"
      ? localStorage.getItem("zoiko_active_plan") || "Zoiko SIM Plan"
      : "Zoiko SIM Plan");

  const plans = [
    {
      name: "Zoiko Lite 10GB",
      price: "£9.99",
      priceNum: 9.99,
      gb: 10,
      data: "10 GB 5G Data",
      calls: "Unlimited UK Calls & Texts",
      roaming: "EU Roaming Included",
    },
    {
      name: "Zoiko Max 30GB",
      price: "£19.99",
      priceNum: 19.99,
      gb: 30,
      data: "30 GB 5G Data",
      calls: "Unlimited UK Calls & Texts",
      roaming: "EU + 5 Travel Passes",
    },
    {
      name: "Zoiko Unlimited",
      price: "£19.99",
      priceNum: 19.99,
      gb: 100,
      data: "Unlimited 5G Data",
      calls: "Unlimited UK Calls & Texts",
      roaming: "Worldwide Roaming Included",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#E01C5B] flex-shrink-0">
            <Sparkles className="w-6 h-6 text-[#E01C5B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0D1935]">Compare Zoiko Plans</h3>
            <p className="text-xs text-slate-500">
              Upgrade or switch plans anytime with zero exit fees.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
          {plans.map((p) => {
            const isCurrent =
              effectiveCurrentPlan.toLowerCase() === p.name.toLowerCase() ||
              (effectiveCurrentPlan.toLowerCase().includes("lite") && p.name.includes("Lite")) ||
              (effectiveCurrentPlan.toLowerCase().includes("unlimited") && p.name.includes("Unlimited")) ||
              (effectiveCurrentPlan.toLowerCase().includes("max") && p.name.includes("Max"));
            return (
              <div
                key={p.name}
                className={`p-4 rounded-2xl border flex flex-col justify-between text-xs ${
                  isCurrent
                    ? "border-[#E01C5B] bg-pink-50/30 ring-1 ring-[#E01C5B]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold text-[#E01C5B] tracking-wider block mb-1">
                      Your current plan
                    </span>
                  )}
                  <h4 className="font-bold text-sm text-[#0D1935]">{p.name}</h4>
                  <div className="text-xl font-extrabold text-[#0D1935] my-1">
                    {p.price}
                    <span className="text-xs font-normal text-slate-500"> /mo</span>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                      <span>{p.data}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                      <span>{p.calls}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                      <span>{p.roaming}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("zoiko_active_plan", p.name);
                      window.dispatchEvent(new Event("zoiko-auth"));
                    }
                    if (onSelectPlan) {
                      onSelectPlan(p.name, p.gb, p.priceNum);
                    }
                    onClose();
                  }}
                  className={`w-full mt-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isCurrent
                      ? "bg-slate-100 text-slate-700 cursor-default"
                      : "bg-[#E01C5B] hover:bg-[#c9144e] text-white"
                  }`}
                >
                  {isCurrent ? "Active" : "Switch to this plan"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Want to explore all 30-day &amp; contract plans?</span>
          <Link
            href="/dashboard/compare-plans"
            onClick={onClose}
            className="text-[#E01C5B] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Compare all plans in dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, QrCode, Truck, X, Zap } from "lucide-react";

type SimType = "esim" | "psim";

const OPTIONS: {
  value: SimType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  BadgeIcon: typeof Zap;
  Icon: typeof QrCode;
}[] = [
  {
    value: "esim",
    title: "eSIM",
    subtitle: "Digital SIM",
    description:
      "Is your device eSIM-compatible? After your order we’ll email you instructions to download and activate your Zoiko Mobile eSIM.",
    badge: "Instant activation",
    BadgeIcon: Zap,
    Icon: QrCode,
  },
  {
    value: "psim",
    title: "pSIM",
    subtitle: "Physical SIM",
    description: "Physical SIM — shipped to you with your order.",
    badge: "Free UK delivery",
    BadgeIcon: Truck,
    Icon: CreditCard,
  },
];

// Shared "Choose SIM Type" modal (eSIM / pSIM), used by every plan page.
// The chosen type is passed back via onConfirm and stored on the cart item
// (metadata.simType) by addPlanToCart.
export default function ChooseSimTypeModal({
  planName,
  onConfirm,
  onClose,
}: {
  planName: string;
  onConfirm: (simType: SimType) => void;
  onClose: () => void;
}) {
  const [simType, setSimType] = useState<SimType>("psim");
  const [adding, setAdding] = useState(false);

  const confirm = () => {
    setAdding(true);
    onConfirm(simType);
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="sim-modal-fade fixed inset-0 z-50 flex items-end justify-center bg-[#0B0210]/60 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={onClose}
    >
      <style jsx global>{`
        @keyframes sim-modal-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sim-modal-pop {
          from { opacity: 0; transform: translateY(24px) scale(0.97) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .sim-modal-fade { animation: sim-modal-fade 0.2s ease-out both }
        .sim-modal-pop { animation: sim-modal-pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1) both }
        @media (prefers-reduced-motion: reduce) {
          .sim-modal-fade, .sim-modal-pop { animation: none }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sim-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="sim-modal-pop relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_rgba(30,0,40,0.35)] sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#12041A] via-[#3A0E52] to-[#e6007e] px-6 pb-6 pt-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#e6007e]/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-[#C77DFF]/30 blur-2xl" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:rotate-90 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-pink-200">Almost there</p>
          <h3 id="sim-modal-title" className="relative mt-1 text-2xl font-black tracking-tight">
            Choose your SIM type
          </h3>
          <span className="relative mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5FE0A6]" />
            <span className="truncate">{planName}</span>
          </span>
        </div>

        {/* Options */}
        <div role="radiogroup" aria-label="SIM type" className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {OPTIONS.map(({ value, title, subtitle, description, badge, BadgeIcon, Icon }) => {
            const selected = simType === value;
            return (
              <label
                key={value}
                className={`group relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all duration-200 ${
                  selected
                    ? "border-[#e6007e] bg-gradient-to-b from-[#FFF0F8] to-white shadow-[0_12px_30px_rgba(230,0,126,0.18)] sm:-translate-y-0.5"
                    : "border-gray-200 bg-white hover:border-[#e6007e]/40 hover:shadow-md"
                }`}
              >
                <input
                  type="radio"
                  name="simType"
                  value={value}
                  checked={selected}
                  onChange={() => setSimType(value)}
                  className="peer sr-only"
                />

                {/* Check indicator */}
                <span
                  className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border-2 transition-all ${
                    selected ? "scale-100 border-[#e6007e] bg-[#e6007e] text-white" : "border-gray-300 bg-white text-transparent"
                  } peer-focus-visible:ring-2 peer-focus-visible:ring-[#e6007e]/40 peer-focus-visible:ring-offset-2`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>

                {/* Icon */}
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl transition-colors ${
                    selected
                      ? "bg-gradient-to-br from-[#e6007e] to-[#A3157A] text-white shadow-md"
                      : "bg-gray-100 text-gray-500 group-hover:text-[#e6007e]"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <span className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-black text-gray-900">{title}</span>
                  <span className="text-xs font-semibold text-gray-500">{subtitle}</span>
                </span>

                <span className="mt-1 text-[13px] leading-relaxed text-gray-600">{description}</span>

                <span
                  className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    selected ? "bg-[#e6007e]/10 text-[#C4006B]" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <BadgeIcon className="h-3 w-3" />
                  {badge}
                </span>
              </label>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-200/70 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e6007e] to-[#A3157A] px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(230,0,126,0.35)] transition hover:scale-[1.02] hover:shadow-[0_14px_30px_rgba(230,0,126,0.45)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
          >
            {adding ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Adding…
              </>
            ) : (
              <>
                Add {simType === "esim" ? "eSIM" : "pSIM"} to order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

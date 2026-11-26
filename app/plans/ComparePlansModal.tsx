"use client";

import { useEffect, useMemo } from "react";
import { Award, Check, ChevronRight, Crown, PiggyBank, Plus, Signal, Sparkles, X } from "lucide-react";

type DurationTab = "30-days" | "12-months" | "24-months";

export interface ComparePlan {
  id: number;
  name: string;
  data_allowance: string | null;
  tier_label: string | null;
  is_popular: boolean;
  category: { name: string } | null;
}

const DURATIONS: { value: DurationTab; label: string }[] = [
  { value: "30-days", label: "30 days" },
  { value: "12-months", label: "12 months" },
  { value: "24-months", label: "24 months" },
];

// "3GB" -> 3, "500MB" -> 0.5, "Unlimited" -> Infinity, unknown -> null
function dataInGB(raw: string | null): number | null {
  if (!raw) return null;
  if (/unlimited/i.test(raw)) return Infinity;
  const m = raw.replace(",", ".").match(/([\d.]+)\s*(tb|gb|mb)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  return unit === "tb" ? n * 1000 : unit === "mb" ? n / 1000 : n;
}

export default function ComparePlansModal<P extends ComparePlan>({
  plans,
  durationTab,
  onDurationChange,
  getPrice,
  getBullets,
  noticeText,
  onRemove,
  onBuy,
  onAddMore,
  onClose,
}: {
  plans: P[];
  durationTab: DurationTab;
  onDurationChange: (d: DurationTab) => void;
  getPrice: (p: P) => string;
  getBullets: (p: P) => string[];
  noticeText: string;
  onRemove: (id: number) => void;
  onBuy: (p: P) => void;
  onAddMore: () => void;
  onClose: () => void;
}) {
  // Esc to close + lock page scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // ── Recommendation ──
  const insight = useMemo(() => {
    const rows = plans.map((p) => ({ p, price: Number(getPrice(p)), gb: dataInGB(p.data_allowance) }));
    if (!rows.length) return null;

    const cheapest = rows.reduce((a, b) => (b.price < a.price ? b : a));
    const withData = rows.filter((r) => r.gb !== null);
    const mostData = withData.length ? withData.reduce((a, b) => ((b.gb ?? 0) > (a.gb ?? 0) ? b : a)) : null;
    const finiteData = withData.filter((r) => Number.isFinite(r.gb) && (r.gb ?? 0) > 0);
    const bestPerGB = finiteData.length
      ? finiteData.reduce((a, b) => (b.price / (b.gb as number) < a.price / (a.gb as number) ? b : a))
      : null;

    // Our pick: unlimited plan if any, else best price per GB, else most popular, else cheapest
    const unlimited = rows.find((r) => r.gb === Infinity);
    let pick = cheapest;
    let reason = "The lowest monthly price of the plans you picked.";
    if (rows.length > 1) {
      if (unlimited) {
        pick = unlimited;
        reason = "Unlimited data, so you never have to watch your usage.";
      } else if (bestPerGB) {
        pick = bestPerGB;
        reason = `Best value — just £${(bestPerGB.price / (bestPerGB.gb as number)).toFixed(2)} per GB of data.`;
      } else {
        const popular = rows.find((r) => r.p.is_popular);
        if (popular) {
          pick = popular;
          reason = "Our most popular plan with customers.";
        }
      }
    }
    return {
      pickId: pick.p.id,
      pickName: pick.p.name,
      reason,
      cheapestId: rows.length > 1 ? cheapest.p.id : null,
      mostDataId: rows.length > 1 && mostData ? mostData.p.id : null,
    };
  }, [plans, getPrice]);

  const durationLabel = DURATIONS.find((d) => d.value === durationTab)?.label ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B0210]/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <style jsx global>{`
        @keyframes cmp-pop {
          from { opacity: 0; transform: translateY(24px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .cmp-pop { animation: cmp-pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1) both }
        @media (prefers-reduced-motion: reduce) { .cmp-pop { animation: none } }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        onClick={(e) => e.stopPropagation()}
        className="cmp-pop flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-[#FAFAFC] shadow-[0_30px_80px_rgba(30,0,40,0.4)] sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#12041A] via-[#3A0E52] to-[#E01C5B] px-5 pb-5 pt-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#E6007E]/40 blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 transition hover:rotate-90 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-pink-200">Side by side</p>
          <h2 id="compare-title" className="relative mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            Compare your plans
          </h2>

          {/* Duration switch */}
          <div className="relative mt-4 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => onDurationChange(d.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
                  durationTab === d.value ? "bg-white text-[#E01C5B] shadow" : "text-white/80 hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          {/* Recommendation banner */}
          {insight && plans.length > 1 && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFD60A] text-[#7A4B00] shadow-sm">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-gray-900">
                  We recommend <span className="text-[#E01C5B]">{insight.pickName}</span>
                </p>
                <p className="mt-0.5 text-sm text-gray-600">{insight.reason}</p>
              </div>
            </div>
          )}

          {plans.length < 2 && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 p-4 text-sm text-gray-700">
              <Sparkles className="h-5 w-5 shrink-0 text-[#E01C5B]" />
              Pick at least one more plan to see a side-by-side comparison and our recommendation.
            </div>
          )}

          {/* Plan columns */}
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {plans.map((p) => {
              const isPick = insight?.pickId === p.id && plans.length > 1;
              const bullets = getBullets(p);
              return (
                <div
                  key={p.id}
                  className={`relative flex w-[78%] shrink-0 snap-start flex-col rounded-3xl border-2 bg-white p-5 transition sm:w-auto sm:flex-1 sm:basis-0 ${
                    isPick ? "border-[#E01C5B] shadow-[0_18px_40px_rgba(224,28,91,0.18)]" : "border-gray-100 shadow-sm"
                  }`}
                >
                  {isPick && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-[#E01C5B] to-[#F02868] px-3 py-1 text-[10px] font-black tracking-widest text-white shadow">
                      <Award className="h-3 w-3" /> OUR PICK
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    aria-label={`Remove ${p.name} from comparison`}
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Name + tags */}
                  <div className="pr-6">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#E01C5B] to-[#A3157A] text-white">
                      <Signal className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-lg font-black leading-tight text-[#0D1935]">{p.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {insight?.cheapestId === p.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <PiggyBank className="h-3 w-3" /> Lowest price
                        </span>
                      )}
                      {insight?.mostDataId === p.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <Signal className="h-3 w-3" /> Most data
                        </span>
                      )}
                      {p.is_popular && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Popular</span>
                      )}
                    </div>
                  </div>

                  {/* Key numbers */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-[#FFF5FA] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Price</p>
                      <p className="mt-0.5 text-xl font-black text-[#E01C5B]">£{getPrice(p)}</p>
                      <p className="text-[10px] text-gray-500">per month</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">UK data</p>
                      <p className="mt-0.5 text-xl font-black text-[#0D1935]">{p.data_allowance ?? "—"}</p>
                      <p className="text-[10px] text-gray-500">{durationLabel}</p>
                    </div>
                  </div>

                  {/* Included */}
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-[#2E3A59]">
                    {bullets.length ? (
                      bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00A859]" strokeWidth={3} />
                          {b}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No extra details listed</li>
                    )}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onBuy(p)}
                    className={`mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-extrabold transition hover:scale-[1.02] active:scale-[0.98] ${
                      isPick
                        ? "bg-gradient-to-r from-[#E01C5B] via-[#E6007E] to-[#F02868] text-white shadow-[0_10px_24px_rgba(224,28,91,0.35)]"
                        : "border-2 border-[#E01C5B] bg-white text-[#E01C5B] hover:bg-pink-50"
                    }`}
                  >
                    Buy this SIM <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* Add another plan */}
            {plans.length < 3 && (
              <button
                type="button"
                onClick={onAddMore}
                className="flex w-[60%] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-5 text-sm font-bold text-gray-500 transition hover:border-[#E01C5B]/40 hover:text-[#E01C5B] sm:w-auto sm:flex-1 sm:basis-0"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-100">
                  <Plus className="h-5 w-5" />
                </span>
                Add another plan
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">{noticeText} Prices include VAT.</p>
        </div>
      </div>
    </div>
  );
}

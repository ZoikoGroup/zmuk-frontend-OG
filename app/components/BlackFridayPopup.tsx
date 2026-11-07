"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles, X } from "lucide-react";

// Sale window (UK is on GMT in November, so UTC == UK time)
const SALE_START = Date.UTC(2026, 10, 27, 0, 0, 0); // 27 Nov 2026 00:00
const SALE_END = Date.UTC(2026, 10, 30, 23, 59, 59); // 30 Nov 2026 23:59:59

const OPEN_DELAY_MS = 0;

// Dismissal lives only in memory: the popup shows on every fresh visit/refresh,
// but stays closed while the user navigates around the site after closing it.
let dismissedThisLoad = false;

// Don't interrupt users on these routes
const HIDDEN_PREFIXES = ["/black-friday", "/checkout", "/dashboard", "/login", "/reset-password"];

function getTimeLeft(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function wasDismissed(): boolean {
  return dismissedThisLoad;
}

function rememberDismissed() {
  dismissedThisLoad = true;
}

const CONFETTI = [
  { cls: "left-[8%] top-[10%] bg-[#FFD60A] rotate-[25deg]", delay: "0s" },
  { cls: "left-[22%] top-[4%] bg-[#F664A0] -rotate-[30deg]", delay: "0.6s" },
  { cls: "left-[48%] top-[8%] bg-[#5FE0A6] rotate-[40deg]", delay: "1.2s" },
  { cls: "right-[30%] top-[14%] bg-[#C77DFF] -rotate-[20deg]", delay: "0.3s" },
  { cls: "right-[8%] top-[40%] bg-[#FFD60A] rotate-[60deg]", delay: "0.9s" },
  { cls: "left-[5%] bottom-[22%] bg-[#FF8CC6] rotate-[15deg]", delay: "1.5s" },
  { cls: "left-[40%] bottom-[8%] bg-[#FFD60A] -rotate-[45deg]", delay: "0.4s" },
];

export default function BlackFridayPopup() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const hiddenRoute = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  const saleLive = now >= SALE_START && now <= SALE_END;
  const target = saleLive ? SALE_END : SALE_START;
  const t = getTimeLeft(target);

  // Open as soon as the site loads, until the sale ends
  useEffect(() => {
    if (hiddenRoute || Date.now() > SALE_END || wasDismissed()) return;
    const id = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [hiddenRoute]);

  // Live countdown while open
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  const close = useCallback(() => {
    rememberDismissed();
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 250);
  }, []);

  // Esc to close, lock page scroll, focus the close button
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open || hiddenRoute) return null;

  const units: [string, number][] = [
    ["Days", t.days],
    ["Hrs", t.hours],
    ["Min", t.minutes],
    ["Sec", t.seconds],
  ];

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${
        closing ? "bfp-fade-out" : "bfp-fade-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bfp-title"
      aria-describedby="bfp-desc"
    >
      <style jsx global>{`
        @keyframes bfp-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bfp-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes bfp-pop {
          0% { opacity: 0; transform: translateY(24px) scale(0.92) }
          60% { opacity: 1; transform: translateY(-4px) scale(1.01) }
          100% { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes bfp-swing {
          0%, 100% { transform: rotate(-5deg) }
          50% { transform: rotate(5deg) }
        }
        @keyframes bfp-float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
        }
        @keyframes bfp-shine {
          0% { transform: translateX(-120%) skewX(-20deg) }
          60%, 100% { transform: translateX(220%) skewX(-20deg) }
        }
        @keyframes bfp-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255, 214, 10, 0.55) }
          100% { box-shadow: 0 0 0 14px rgba(255, 214, 10, 0) }
        }
        .bfp-fade-in { animation: bfp-fade-in 0.3s ease-out both }
        .bfp-fade-out { animation: bfp-fade-out 0.25s ease-in both }
        .bfp-pop { animation: bfp-pop 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both }
        .bfp-swing { transform-origin: top center; animation: bfp-swing 3.5s ease-in-out infinite }
        .bfp-float { animation: bfp-float 3s ease-in-out infinite }
        .bfp-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          animation: bfp-shine 2.8s ease-in-out infinite;
        }
        .bfp-pulse { animation: bfp-pulse-ring 1.6s ease-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .bfp-pop, .bfp-swing, .bfp-float, .bfp-shine::after, .bfp-pulse { animation: none }
        }
      `}</style>

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close Black Friday offer"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-[#0B0210]/75 backdrop-blur-sm"
      />

      {/* Card */}
      <div
        className="bfp-pop relative w-full max-w-[860px] max-h-[92vh] overflow-y-auto rounded-[28px] text-white shadow-[0_40px_120px_rgba(20,0,30,0.7)] ring-2 ring-[#F664A0]/50"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 85% 30%, rgba(209,69,174,0.55) 0%, rgba(209,69,174,0) 70%), radial-gradient(ellipse 50% 60% at 0% 0%, rgba(246,100,160,0.3) 0%, rgba(246,100,160,0) 70%), linear-gradient(135deg, #12041A 0%, #2A0A3C 55%, #4A1268 100%)",
        }}
      >
        {/* Confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className={`bfp-float absolute h-1.5 w-4 rounded-full opacity-80 ${c.cls}`}
              style={{ animationDelay: c.delay }}
            />
          ))}
        </div>

        {/* Close */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 hover:rotate-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD60A]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative grid grid-cols-1 md:grid-cols-5">
          {/* Visual */}
          <div className="relative hidden md:col-span-2 md:block">
            <div className="absolute inset-0">
              <Image
                src="/images/landing-page/Gradient (21).png"
                alt=""
                fill
                sizes="350px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#2A0A3C]" />
            </div>

            {/* Swinging sale tag */}
            <div className="absolute left-6 top-0 z-20">
              <div className="bfp-swing flex flex-col items-center">
                <div className="h-10 w-[2px] bg-white/80" />
                <div className="relative min-w-[96px] rounded-2xl border-2 border-[#D145AE] bg-[#120417] px-4 py-2.5 text-center shadow-2xl">
                  <span className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-100/90" />
                  <span className="block pt-1 text-[10px] font-black tracking-widest">BLACK FRIDAY</span>
                  <span className="block text-lg font-black leading-tight text-[#FF64A0] drop-shadow-[0_0_8px_#FF64A0]">
                    SALE
                  </span>
                  <span className="block text-[8px] font-extrabold tracking-wider text-pink-200">NOV 27 – 30</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col gap-5 p-6 pt-12 sm:p-8 md:col-span-3 md:pt-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#FFD60A] px-3.5 py-1 text-[11px] font-black tracking-widest text-[#2A1E00] shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-[#A3157A]" />
              {saleLive ? "BLACK FRIDAY IS LIVE" : "BLACK FRIDAY SALE 2026"}
            </span>

            <h2 id="bfp-title" className="text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">
              Stay connected{" "}
              <span className="bg-gradient-to-r from-[#FF8CC6] via-[#F664A0] to-[#C77DFF] bg-clip-text text-transparent">
                to what you love.
              </span>
            </h2>

            {/* Offer */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-[#1E1E24] ring-2 ring-[#FFD60A]/80">
              <div className="bfp-shine relative flex shrink-0 items-baseline gap-1 overflow-hidden rounded-xl bg-gradient-to-br from-[#C41E3A] to-[#A3157A] px-4 py-3 text-white shadow-md">
                <span className="text-4xl font-black leading-none">30%</span>
                <span className="text-sm font-black">OFF</span>
              </div>
              <p id="bfp-desc" className="text-sm font-bold leading-snug text-gray-800">
                selected SIM-only plans for your{" "}
                <span className="font-extrabold text-[#C41E3A]">first 3 months</span>
                <span className="mt-1 block text-xs font-medium text-gray-500">
                  e.g. 12GB Value Pack from <b className="text-[#C41E3A]">£8.50/mo</b>{" "}
                  <s>£12.14</s>
                </span>
              </p>
            </div>

            {/* Countdown */}
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#FFD60A]">
                {saleLive ? "Hurry – deal ends in" : "Deals go live in"}
              </p>
              <div className="flex gap-2" aria-live="off">
                {units.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex min-w-[58px] flex-col items-center rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15 backdrop-blur"
                  >
                    <span className="font-mono text-2xl font-black tabular-nums leading-none">
                      {String(value).padStart(2, "0")}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-pink-200">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="https://zoikomobile.co.uk/black-friday"
                onClick={close}
                className="bfp-pulse inline-flex items-center justify-center gap-2 rounded-xl bg-[#C41E3A] px-6 py-3.5 text-base font-extrabold text-white shadow-[0_12px_30px_rgba(196,30,58,0.5)] transition hover:scale-[1.03] hover:bg-[#A3157A] active:scale-[0.98]"
              >
                {saleLive ? "Grab the deal" : "See Black Friday deals"}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <p className="text-[10px] leading-normal text-[#D8C2DC]/80">
              Selected SIM-only plans, eligible new lines only. Offer runs 27–30 Nov 2026. Standard monthly price applies
              after the first three months. Prices include VAT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

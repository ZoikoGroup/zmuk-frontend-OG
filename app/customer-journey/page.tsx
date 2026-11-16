import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Journey with Zoiko Mobile | Customer Journey",
  description:
    "From choosing a plan to getting connected, managing your line and getting help — every journey in one place.",
};

// ── Icons ───────────────────────────────────────────────────────────────────

const Svg = ({ className = "h-5 w-5", children }: { className?: string; children: React.ReactNode }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconArrowRight = ({ className = "h-4 w-4" }: { className?: string }) => (
  <Svg className={className}>
    <path d="M9 18l6-6-6-6" strokeWidth="2.4" />
  </Svg>
);

const IconUserLock = () => (
  <Svg className="h-3 w-3 text-white">
    <circle cx="12" cy="7" r="4" strokeWidth="2" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" />
  </Svg>
);

// Status Icons
const IconDocAlert = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M12 18h.01M12 11v4" />
  </Svg>
);

const IconCheckCircle = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" strokeWidth="2.2" />
  </Svg>
);

const IconCreditCard = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h3M15 15h3" />
  </Svg>
);

const IconSimPackage = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M9 13v5M15 13v5M9 13h6" />
  </Svg>
);

const IconAntenna = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M2 12a10 10 0 0 1 20 0M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <path d="M12 13v8M9 21h6" />
  </Svg>
);

const IconNumberTransfer = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" strokeWidth="2.2" />
  </Svg>
);

// ── Journey Data ────────────────────────────────────────────────────────────

interface JourneyCard {
  id: string;
  title: string;
  description: string;
  steps: string;
  image: string;
  isMyZoiko?: boolean;
  href: string;
}

const JOURNEYS: JourneyCard[] = [
  {
    id: "new-sim",
    title: "New SIM-Only Plan",
    description:
      "Choose a plan, decide about your number, add your details and pay securely. We’ll track your order until the network confirms your line.",
    steps: "7 steps · Acquisition + first line",
    image: "/images/customer-journey/image (6).png",
    href: "/plans",
  },
  {
    id: "switch-and-save",
    title: "Switch & Save",
    description:
      "Send a switching request without paying. If you go ahead, your order is completed separately and securely later.",
    steps: "7 steps · Request → controlled order",
    image: "/images/customer-journey/image (4).png",
    href: "/switch-and-save",
  },
  {
    id: "add-number",
    title: "Add a New Number",
    description:
      "Add another line to your MyZoiko account — your existing lines stay exactly as they are.",
    steps: "5 steps · Existing customer adds a line",
    image: "/images/customer-journey/image (8).png",
    isMyZoiko: true,
    href: "/dashboard/add-new-number",
  },
  {
    id: "business-sim",
    title: "Business SIM Plans",
    description:
      "Buy and manage lines for your business, with prices shown excluding and including VAT.",
    steps: "6 steps · Company + multi-line order",
    image: "/images/customer-journey/image (7).png",
    href: "/business-deals_sim-only-plans",
  },
  {
    id: "upgrade-plan",
    title: "Change or Upgrade Plan",
    description:
      "Compare eligible plans for your line and see exactly what changes before you confirm.",
    steps: "4 steps · Existing service change",
    image: "/images/customer-journey/image (10).png",
    isMyZoiko: true,
    href: "/dashboard/compare-plans",
  },
  {
    id: "roaming-travel",
    title: "Roaming & Travel",
    description:
      "Check what your line costs abroad before you travel, and keep an eye on usage while you’re away.",
    steps: "4 steps · Destination, charges, usage",
    image: "/images/customer-journey/image (5).png",
    isMyZoiko: true,
    href: "/dashboard/roaming-and-travel",
  },
  {
    id: "sim-replacement",
    title: "SIM Replacement & eSIM Transfer",
    description:
      "Replace a lost or damaged SIM, switch to eSIM, or move your eSIM to a new phone — securely.",
    steps: "6 steps · High-risk line change",
    image: "/images/customer-journey/image (9).png",
    isMyZoiko: true,
    href: "/dashboard/sim-and-esim",
  },
  {
    id: "billing-payments",
    title: "Billing & Payments",
    description: "View your bills, update billing details and pay securely.",
    steps: "4 steps · Invoice and payment lifecycle",
    image: "/images/customer-journey/image (3).png",
    isMyZoiko: true,
    href: "/dashboard/bills-and-payments",
  },
  {
    id: "support-complaints",
    title: "Support, Complaints & Closure",
    description:
      "Get help, raise a complaint, or manage cancellation and account closure — all in one place.",
    steps: "6 steps · Service and regulatory lifecycle",
    image: "/images/customer-journey/image (2).png",
    isMyZoiko: true,
    href: "/dashboard/support",
  },
  {
    id: "devices-accessories",
    title: "Devices & Accessories",
    description:
      "Buy a device or accessory on its own or with a Zoiko plan, with stock, delivery and returns shown clearly.",
    steps: "6 steps · Device-only or with a SIM plan",
    image: "/images/customer-journey/image (1).png",
    href: "/devices",
  },
];

const STATUSES = [
  {
    title: "Request received",
    description: "Switch & Save request — not an order",
    icon: <IconDocAlert />,
  },
  {
    title: "Order accepted",
    description: "Your order has passed its checks",
    icon: <IconCheckCircle />,
  },
  {
    title: "Payment confirmed",
    description: "From your bank and our ledger",
    icon: <IconCreditCard />,
  },
  {
    title: "SIM sent or eSIM ready",
    description: "From fulfilment or the network supplier",
    icon: <IconSimPackage />,
  },
  {
    title: "Service active",
    description: "Only on Transatel/Auriga confirmation",
    icon: <IconAntenna />,
  },
  {
    title: "Number transferred",
    description: "Tracked separately from activation",
    icon: <IconNumberTransfer />,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerJourneyPage() {
  return (
    <div className="w-full bg-[#f8f9fa] font-sans text-[#141A45]">
      
      {/* ── Section 1: Hero Banner ── */}
      <section className="relative overflow-hidden bg-[#0A261E]">
        {/* Right: skyline image with magenta/purple tint */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <Image
            src="/images/customer-journey/image (11).png"
            alt="London skyline at night"
            fill
            priority
            className="object-cover object-right"
          />
        </div>

        {/* Left: dark green panel with diagonal edge */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#08291F] to-[#0B3A2B] max-lg:opacity-85 lg:[clip-path:polygon(0_0,62%_0,44%_100%,0_100%)]"
        />

        <div className="relative mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-14">
          <div className="flex max-w-xl flex-col items-start gap-3 sm:gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9D8D1] sm:text-xs">
              Zoiko Mobile UK
            </span>

            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[44px]">
              Your journey with Zoiko Mobile
            </h1>

            <p className="max-w-md text-sm font-normal leading-relaxed text-[#E1E8E5] sm:text-base">
              From choosing a plan to getting connected, managing your line and getting help — every journey in one place.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-full bg-[#E5195E] px-5 py-2.5 text-sm font-semibold text-white shadow-[0px_8px_16px_-8px_rgba(229,25,94,0.8)] transition-all hover:bg-[#C80F57] active:scale-[0.98]"
              >
                Start with a new SIM
              </Link>

              <Link
                href="/switch-and-save"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]"
              >
                <span>Switch &amp; Save</span>
                <span className="transition-transform group-hover:translate-x-0.5">
                  <IconArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Ten Journeys Grid ── */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          
          {/* Section Header */}
          <div className="flex flex-col items-start gap-2 pb-10 sm:pb-12">
            <div className="flex flex-col items-start gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#C80F57] sm:text-sm">
                Ten journeys
              </span>
              <div className="h-1 w-16 rounded-full bg-[#FA2268]" />
            </div>

            <h2 className="pt-1 text-3xl font-extrabold tracking-tight text-[#0D382D] sm:text-4xl lg:text-5xl">
              Choose what you’d like to do
            </h2>

            <p className="max-w-2xl text-base text-[#141A45] sm:text-xl">
              Each journey shows every step, what you’ll need and what happens next.
            </p>
          </div>

          {/* 10 Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEYS.map((journey) => (
              <div
                key={journey.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0px_18px_40px_-26px_rgba(20,26,69,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_22px_45px_-20px_rgba(20,26,69,0.40)]"
              >
                {/* Image Header with MyZoiko Badge */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={journey.image}
                    alt={journey.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {journey.isMyZoiko && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0D382D]/90 px-2.5 py-1 text-xs font-extrabold text-white shadow-md backdrop-blur-sm">
                      <IconUserLock />
                      <span>MyZoiko</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="space-y-2.5">
                    <h3 className="text-lg font-extrabold leading-snug text-[#0D382D] sm:text-xl">
                      {journey.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#4E5A8A] sm:text-sm">
                      {journey.description}
                    </p>
                    <p className="text-xs font-semibold text-[#6C789E]">
                      {journey.steps}
                    </p>
                  </div>

                  {/* Start Journey Button */}
                  <div className="pt-5">
                    <Link
                      href={journey.href}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#FA2268] bg-white py-2.5 px-4 text-sm font-extrabold text-[#C80F57] shadow-sm transition-all hover:bg-rose-50/80 active:scale-[0.98]"
                    >
                      <span>Start journey</span>
                      <IconArrowRight className="h-4 w-4 text-[#C80F57]" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Section 3: What each status means ── */}
      <section className="bg-gradient-to-b from-[#fafbfc] to-white px-4 pt-16 pb-24 sm:px-6 sm:pt-20 sm:pb-28 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          
          {/* Header */}
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center pb-12 sm:pb-16">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#C80F57] sm:text-sm">
                What each status means
              </span>
              <div className="h-1 w-16 rounded-full bg-[#FA2268]" />
            </div>

            <h2 className="pt-2 text-3xl font-extrabold tracking-tight text-[#0D382D] sm:text-4xl lg:text-5xl">
              We never jump ahead
            </h2>

            <p className="mt-2 text-base text-[#141A45] sm:text-lg">
              Every stage is shown only when it’s confirmed by the right source.
            </p>
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {STATUSES.map((status, index) => (
              <div
                key={index}
                className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0px_8px_20px_-12px_rgba(20,26,69,0.15)] transition-all hover:border-[#FA2268]/40 hover:shadow-md"
              >
                {/* Icon Container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#C80F57]">
                  {status.icon}
                </div>

                {/* Title */}
                <h3 className="pt-1 text-sm font-bold text-[#0D382D] sm:text-base">
                  {status.title}
                </h3>

                {/* Description */}
                <p className="text-xs leading-relaxed text-[#4E5A8A]">
                  {status.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}

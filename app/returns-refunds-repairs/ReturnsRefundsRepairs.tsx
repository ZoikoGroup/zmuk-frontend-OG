"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  RotateCcw,
  AlertTriangle,
  PackageX,
  RefreshCw,
  Wallet,
  Wrench,
  Monitor,
  User,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Award,
  Info,
  FileText,
  Clock,
  MapPin,
  Smartphone,
  Headphones,
  MessageSquare,
  Phone,
  Mail,
  ChevronDown,
  X,
  CheckSquare,
} from "lucide-react";
import { isLoggedIn } from "../utils/auth";
import { openChat } from "../components/ChatbotWidget";

type HelpReasonId =
  | "change-of-mind"
  | "faulty-device"
  | "wrong-or-damaged"
  | "exchange-device"
  | "refund-status"
  | "repair-warranty";

interface HelpReason {
  id: HelpReasonId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HELP_REASONS: HelpReason[] = [
  {
    id: "change-of-mind",
    title: "Change of mind",
    description: "Changed your mind within 14 days of delivery? Start a return.",
    icon: RotateCcw,
  },
  {
    id: "faulty-device",
    title: "Faulty device",
    description: "Phone or accessory not working properly? Get repair, replacement or refund support.",
    icon: AlertTriangle,
  },
  {
    id: "wrong-or-damaged",
    title: "Wrong or damaged item",
    description: "Received the wrong item or damaged packaging? Tell us right away.",
    icon: PackageX,
  },
  {
    id: "exchange-device",
    title: "Exchange a device",
    description: "Swap for a different model, colour or storage capacity.",
    icon: RefreshCw,
  },
  {
    id: "refund-status",
    title: "Refund status",
    description: "Check where your refund is and when funds will arrive.",
    icon: Wallet,
  },
  {
    id: "repair-warranty",
    title: "Repair & warranty",
    description: "Book an in-warranty or out-of-warranty manufacturer or Zoiko repair.",
    icon: Wrench,
  },
];

const HERO_CHECKLIST = [
  "Change of mind returns",
  "Faulty device support",
  "Exchanges (subject to availability)",
  "Refunds to your original payment",
  "Repairs & warranty support",
];

const JOURNEY_STEPS = [
  {
    step: 1,
    title: "1. Choose your issue",
    subtitle: "Tell us what you need (e.g. return, refund, exchange or repair).",
    icon: Monitor,
    isFinal: false,
  },
  {
    step: 2,
    title: "2. Verify your order",
    subtitle: "Sign in to MyZoiko or use our secure guest return service.",
    icon: User,
    isFinal: false,
  },
  {
    step: 3,
    title: "3. Get your return details",
    subtitle: "We'll confirm your eligibility and give you a return label and instructions.",
    icon: Package,
    isFinal: false,
  },
  {
    step: 4,
    title: "4. Send your item",
    subtitle: "Pack it securely and drop it off or arrange collection (where available).",
    icon: Truck,
    isFinal: false,
  },
  {
    step: 5,
    title: "5. Resolution",
    subtitle: "We'll inspect your item and confirm your refund, replacement or repair.",
    icon: CheckCircle2,
    isFinal: true,
  },
];

const UK_RIGHTS_CARDS = [
  {
    title: "Change of mind (distance selling)",
    description:
      "You can tell us you wish to cancel within 14 days of receiving your item, then return it within a further 14 days.",
    icon: CheckSquare,
  },
  {
    title: "Faulty goods (Consumer Rights Act 2015)",
    description:
      "If an item is faulty, you are usually entitled to a repair or replacement, or a refund (including a right to reject within 30 days in many cases).",
    icon: ShieldCheck,
  },
  {
    title: "Warranty cover (our promise)",
    description:
      "New devices include the manufacturer's warranty (typically 12 months). Refurbished devices include a Zoiko warranty (e.g. 12 months — see device listing for details).",
    icon: Award,
  },
];

interface KeyDetailItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
}

const KEY_DETAILS: KeyDetailItem[] = [
  {
    id: "eligibility",
    title: "Return eligibility",
    subtitle: "What can be returned and any exceptions.",
    icon: CheckSquare,
    details: [
      "Devices and accessories purchased directly from Zoiko Mobile UK can be returned within 14 days of delivery for change of mind.",
      "Returned items must be unlocked, factory reset, with all original accessories and packaging intact where possible.",
      "Faulty devices are covered under the Consumer Rights Act 2015 (30-day short-term right to reject, or repair/replacement within warranty).",
      "Used physical SIMs or activated eSIM plans with consumed allowances are settled on a pro-rata or policy basis.",
    ],
  },
  {
    id: "postage",
    title: "Return postage",
    subtitle: "When it's free and when charges may apply.",
    icon: Package,
    details: [
      "Return postage is completely free for faulty, damaged-on-arrival, or incorrectly supplied items using our tracked Royal Mail / courier label.",
      "For change-of-mind returns within 14 days, we provide a tracked return option; any applicable collection or insured return fee is clearly shown before confirmation.",
      "Always keep your proof of postage receipt until your refund or exchange is confirmed.",
    ],
  },
  {
    id: "exchanges",
    title: "Exchanges",
    subtitle: "Swap for a different model, colour or storage (subject to availability).",
    icon: RefreshCw,
    details: [
      "You can request an exchange within 14 days of delivery if you prefer a different model, colour or storage option.",
      "Exchanges are subject to live stock availability. If there is a price difference, we'll process a partial refund or send a secure payment link.",
      "Your replacement device is dispatched once the returned device passes our inspection check.",
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    subtitle: "How and when you'll receive your refund.",
    icon: Wallet,
    details: [
      "Refunds are always returned to your original payment method (debit/credit card, PayPal, or Klarna).",
      "Once your returned item arrives at our UK centre and passes inspection, refunds are processed within 3–5 working days.",
      "Please allow an additional 1–3 working days for your bank or card issuer to reflect the funds.",
    ],
  },
  {
    id: "repairs",
    title: "Repairs",
    subtitle: "Support for in-warranty and out-of-warranty repairs.",
    icon: Wrench,
    details: [
      "New devices include the manufacturer's standard warranty (typically 12 months), and refurbished devices include Zoiko's 12-month warranty.",
      "Manufacturer-authorised technicians use genuine parts so your warranty remains protected.",
      "Out-of-warranty accidental damage (such as cracked screens or liquid damage) receives an upfront transparent quote before any work begins.",
    ],
  },
  {
    id: "timescales",
    title: "Timescales",
    subtitle: "Typical processing and refund timeframes.",
    icon: Clock,
    details: [
      "Return transit to our UK facility: typically 1–3 working days via tracked postage.",
      "Inspection & approval: 1–2 working days from receipt.",
      "Refund clearance: within 3–5 working days after approval.",
      "Standard warranty repairs: usually completed and dispatched back within 5–10 working days.",
    ],
  },
];

const PREPARE_CHECKLIST = [
  "Back up your data (photos, contacts, files and apps).",
  "Remove your accounts (e.g. Apple ID, Google account).",
  "Turn off any activation locks (e.g. Find My iPhone).",
  "Reset the device to factory settings.",
  "Include all items (device, charger, cable, accessories and original packaging).",
];

const FAQS = [
  {
    question: "How do I return my device?",
    answer:
      'Click "Start a return" above, choose your reason (such as change of mind, faulty item, or exchange), enter your order reference and email address, and download your return instructions and tracked label. Remember to back up and factory reset your device before posting.',
  },
  {
    question: "How long will my refund take?",
    answer:
      "Once we receive and inspect your returned item at our UK returns centre (usually within 1–2 working days of delivery), we issue your refund within 3–5 working days back to your original payment method.",
  },
  {
    question: "Can I exchange my device for a different model?",
    answer:
      "Yes — within 14 days of delivery you can request an exchange for another model, colour, or storage tier, subject to stock availability. Select \"Exchange a device\" when starting your request.",
  },
  {
    question: "What if my device is faulty?",
    answer:
      "Under the UK Consumer Rights Act 2015, if your device develops a fault, you may be entitled to a free repair, replacement, or refund (including a short-term right to reject within 30 days). Return postage for confirmed faulty devices is always free.",
  },
];

const SERVICE_PROMISES = [
  {
    title: "Free UK delivery*",
    subtitle: "On SIMs and selected devices",
    icon: Truck,
  },
  {
    title: "Your rights protected",
    subtitle: "In line with UK consumer law",
    icon: ShieldCheck,
  },
  {
    title: "Simple returns",
    subtitle: "A clear and fair process",
    icon: RotateCcw,
  },
  {
    title: "Trusted support",
    subtitle: "UK-based, 7 days a week",
    icon: Headphones,
  },
];

export default function ReturnsRefundsRepairs() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  // Accordions
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Modals
  const [startReturnOpen, setStartReturnOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<HelpReasonId>("change-of-mind");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [issueDetails, setIssueDetails] = useState("");
  const [preferredResolution, setPreferredResolution] = useState("Refund to original payment");
  const [startReturnSubmitted, setStartReturnSubmitted] = useState<string | null>(null);

  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackRef, setTrackRef] = useState("");
  const [trackPostcodeOrEmail, setTrackPostcodeOrEmail] = useState("");
  const [trackResult, setTrackResult] = useState<{
    ref: string;
    status: string;
    updated: string;
    note: string;
  } | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const [activeDetail, setActiveDetail] = useState<KeyDetailItem | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const openStartReturnWithReason = (reasonId: HelpReasonId) => {
    if (reasonId === "refund-status") {
      setTrackResult(null);
      setTrackError(null);
      setTrackModalOpen(true);
      return;
    }
    setSelectedReason(reasonId);
    setStartReturnSubmitted(null);
    if (reasonId === "exchange-device") {
      setPreferredResolution("Exchange for another device");
    } else if (reasonId === "repair-warranty") {
      setPreferredResolution("Warranty repair");
    } else {
      setPreferredResolution("Refund to original payment");
    }
    setStartReturnOpen(true);
  };

  const handleStartReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !orderEmail.trim()) return;
    const generatedRef = `ZMK-RET-${Math.floor(100000 + Math.random() * 900000)}`;
    setStartReturnSubmitted(generatedRef);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    const cleaned = trackRef.trim().toUpperCase();
    if (!cleaned || !trackPostcodeOrEmail.trim()) {
      setTrackError("Please enter both your return or order reference and your email or postcode.");
      return;
    }
    setTrackResult({
      ref: cleaned,
      status: "Awaiting parcel drop-off",
      updated: "Updated today",
      note: "Your return label has been issued. Once posted via Royal Mail Tracked, tracking updates will appear here automatically.",
    });
  };

  const handleManageInMyZoiko = () => {
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login?next=/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f5f8] text-[#111827]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#1b0c14] lg:min-h-[242px] flex items-center">
        <Image
          src="/images/returns-refunds-repairs/hero-banner.png"
          alt="Zoiko Mobile device, parcel and warranty shield banner"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Mobile-only readability scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#2c0615]/70 lg:hidden"
        />

        <div className="relative mx-auto w-full max-w-[1920px] px-4 py-7 sm:px-6 lg:px-[5%] lg:py-6">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,515px)_1fr_auto] lg:gap-8">
            {/* Left column */}
            <div>
              <p className="text-[13.5px] font-bold leading-[19.575px] text-white/92">
                Phones &amp; Devices Support
              </p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-[-0.8px] text-white sm:text-[36px] lg:text-[40px] lg:leading-[44px] lg:whitespace-nowrap">
                Returns, Refunds &amp; Repairs
              </h1>
              <p className="mt-2.5 max-w-[500px] text-sm font-medium leading-[22.475px] text-white/94 sm:text-[15.5px]">
                A clear, simple way to return a device, get a refund, exchange or arrange a repair
                — with your rights protected.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openStartReturnWithReason("change-of-mind")}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full border-[1.5px] border-white/88 bg-[#c8104e] px-[22px] py-[10px] text-[14px] font-bold leading-none text-white shadow-[0_6px_8px_rgba(0,0,0,0.2)] transition hover:bg-[#a90d41] focus:outline-none focus:ring-2 focus:ring-white/80 cursor-pointer"
                >
                  <Package className="h-4 w-4" />
                  <span>Start a return</span>
                  <span aria-hidden="true">›</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackResult(null);
                    setTrackError(null);
                    setTrackModalOpen(true);
                  }}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full border-[1.5px] border-white/85 bg-[#073842]/42 px-[22px] py-[10px] text-[14px] font-bold leading-none text-white backdrop-blur-[6px] transition hover:bg-[#073842]/65 focus:outline-none focus:ring-2 focus:ring-white/70 cursor-pointer"
                >
                  <Truck className="h-4 w-4" />
                  <span>Track a return</span>
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>

            {/* Middle spacer to leave smartphone, parcel box & shield unobstructed */}
            <div aria-hidden="true" className="hidden lg:block" />

            {/* Right frameless checklist */}
            <ul className="flex flex-col gap-[9px] lg:justify-self-end">
              {HERO_CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-white/85 text-[11px] font-bold leading-none text-white"
                  >
                    ✓
                  </span>
                  <span className="text-[13.5px] font-bold leading-[19.575px] text-white">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2. WHAT DO YOU NEED HELP WITH? */}
      <section className="mx-auto max-w-[1224px] px-4 pt-5 sm:px-6">
        <div className="grid items-center gap-4 lg:grid-cols-[220px_1fr]">
          <div>
            <h2 className="text-[22px] font-extrabold leading-[26px] tracking-tight text-[#0b1f2a]">
              What do you need help with?
            </h2>
            <p className="mt-1.5 text-[12px] leading-[16px] text-slate-500">
              Choose the option that best describes your situation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {HELP_REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => openStartReturnWithReason(reason.id)}
                  className="group flex h-[64px] items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 text-left shadow-[0_2px_6px_rgba(15,40,60,0.06)] transition hover:border-[#c8104e]/50 hover:shadow-md cursor-pointer"
                >
                  <Icon className="h-[22px] w-[22px] shrink-0 text-[#c8104e]" />
                  <span className="flex-1 text-[12.5px] font-bold leading-[15px] text-[#0b1f2a]">
                    {reason.title}
                  </span>
                  <span aria-hidden="true" className="text-base text-slate-500 group-hover:text-[#c8104e]">
                    ›
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. YOUR RETURNS JOURNEY */}
      <section className="mx-auto max-w-[1224px] px-4 pt-5 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-[0_2px_8px_rgba(15,40,60,0.06)]">
          <div className="grid items-center gap-6 lg:grid-cols-[190px_1fr]">
            <div>
              <h2 className="text-[22px] font-extrabold leading-[26px] tracking-tight text-[#0b1f2a]">
                Your returns journey
              </h2>
              <p className="mt-2 text-[12px] leading-[16px] text-slate-500">
                A simple, step-by-step process from request to resolution.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
              {JOURNEY_STEPS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative flex flex-col items-center px-3 text-center">
                    <div
                      className={`flex size-[46px] items-center justify-center rounded-full border-2 ${
                        item.isFinal ? "border-[#16a34a] text-[#16a34a]" : "border-[#c8104e] text-[#c8104e]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-[12.5px] font-bold leading-[16px] text-[#0b1f2a]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[10.5px] leading-[13px] text-slate-500">{item.subtitle}</p>
                    {idx < JOURNEY_STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute right-[-6px] top-[10px] hidden text-lg text-[#c8104e] lg:block"
                      >
                        ›
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. UK CONSUMER RIGHTS + KEY DETAILS */}
      <section className="mx-auto max-w-[1224px] px-4 pt-5 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: Your rights at a glance (UK) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,40,60,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#c8104e] text-white">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold leading-[21px] text-[#0b1f2a]">
                  Your rights at a glance (UK)
                </h2>
                <p className="text-[12px] text-slate-500">
                  Your purchases are protected by UK consumer law.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {UK_RIGHTS_CARDS.map((card) => {
                const Icon = card.icon;
                const match = card.title.match(/^(.*?)\s*\((.*)\)$/);
                const main = match ? match[1] : card.title;
                const sub = match ? `(${match[2]})` : "";
                return (
                  <div
                    key={card.title}
                    className="rounded-xl border border-slate-200 bg-[#fafbfc] p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4c59]" />
                      <div>
                        <h3 className="text-[12.5px] font-bold leading-[15px] text-[#0b1f2a]">{main}</h3>
                        {sub && <p className="text-[10.5px] leading-[13px] text-slate-600">{sub}</p>}
                      </div>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-[16px] text-slate-600">{card.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#fff1f5] px-3.5 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#c8104e]" />
              <p className="text-[11px] leading-[15px] text-[#3b1d2a]">
                These are general rights and may be subject to certain exceptions (for example, opened SIM
                cards, downloaded eSIMs or items that cannot be returned for hygiene reasons). See our full{" "}
                <Link href="/return-policy" className="font-bold text-[#c8104e] hover:underline">
                  Returns Policy ›
                </Link>
              </p>
            </div>
          </div>

          {/* Right: key details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,40,60,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#c8104e] text-white">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-[19px] font-extrabold leading-[24px] text-[#0b1f2a]">
                Returns, refunds &amp; repairs — key details
              </h2>
            </div>

            <div className="mt-4 space-y-2">
              {KEY_DETAILS.map((row) => {
                const Icon = row.icon;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setActiveDetail(row)}
                    className="group flex min-h-[38px] w-full items-center gap-3 rounded-lg border border-slate-200 bg-[#f7f9fb] px-3 py-2 text-left transition hover:border-[#c8104e]/40 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#c8104e]" />
                    <span className="w-[130px] shrink-0 text-[12.5px] font-bold text-[#0b1f2a]">
                      {row.title}
                    </span>
                    <span className="flex-1 text-[12px] leading-[15px] text-slate-500">{row.subtitle}</span>
                    <span aria-hidden="true" className="text-base text-[#c8104e]">
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRACK/MANAGE RETURN + PREPARE YOUR DEVICE */}
      <section className="mx-auto max-w-[1224px] px-4 pt-5 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: Track or manage your return */}
          <div className="relative min-h-[232px] overflow-hidden rounded-2xl bg-[#04241b] p-5 text-white">
            <Image
              src="/images/returns-refunds-repairs/track-return-bg.png"
              alt=""
              fill
              className="object-cover object-right"
            />
            <div className="relative flex h-full min-h-[192px] flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/10">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[19px] font-extrabold leading-[24px]">Track or manage your return</h2>
                  <p className="mt-1 text-[12px] text-white/85">
                    Check the latest status, view updates and manage your request.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTrackResult(null);
                    setTrackError(null);
                    setTrackModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-[#c8104e] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#a90d41] cursor-pointer"
                >
                  <span aria-hidden="true" className="size-3.5 rounded-full border-[1.5px] border-white" />
                  <span>Track a return (guest)</span>
                  <span aria-hidden="true">›</span>
                </button>
                <button
                  type="button"
                  onClick={handleManageInMyZoiko}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#c8104e] transition hover:bg-rose-50 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Manage in MyZoiko</span>
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Prepare your device for return */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,40,60,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#c8104e] text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-extrabold leading-[22px] text-[#0b1f2a]">
                  Prepare your device for return
                </h2>
                <p className="text-[12px] text-slate-500">
                  Follow these simple steps to keep your data safe and avoid delays.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <ul className="flex-1 space-y-2">
                {PREPARE_CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-[17px] text-[#0b1f2a]">
                    <span className="mt-[1px] flex size-[16px] shrink-0 items-center justify-center rounded-[3px] bg-[#0b4c59] text-white">
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 6.5l2.2 2.2L9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="hidden size-[96px] shrink-0 items-center justify-center rounded-xl bg-[#0b4c59] sm:flex">
                <RefreshCw className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQS + NEED MORE HELP? */}
      <section className="mx-auto max-w-[1224px] px-4 pb-6 pt-5 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: FAQs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,40,60,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[15px] font-bold text-[#c8104e]">
                  ?
                </div>
                <div>
                  <h2 className="text-[19px] font-extrabold leading-[22px] text-[#0b1f2a]">
                    Frequently asked questions
                  </h2>
                  <p className="text-[12px] text-slate-500">
                    Quick answers to common returns and support questions.
                  </p>
                </div>
              </div>
              <Link href="/faqs" className="shrink-0 text-[12px] font-bold text-[#c8104e] hover:underline">
                View all FAQs ›
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={faq.question} className="rounded-lg border border-slate-200 bg-[#f7f9fb]">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex min-h-[40px] w-full items-center justify-between gap-4 px-3.5 py-2 text-left cursor-pointer"
                    >
                      <span className="text-[12.5px] font-bold text-[#0b1f2a]">{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#c8104e] transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-200 px-3.5 pb-3 pt-2 text-[12px] leading-[17px] text-slate-600">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Need more help? */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,40,60,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#c8104e]">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-extrabold leading-[22px] text-[#0b1f2a]">Need more help?</h2>
                <p className="text-[12px] text-slate-500">
                  Our UK-based support team is here to help, 7 days a week.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="flex min-h-[108px] flex-col rounded-lg border border-slate-200 bg-[#f7f9fb] p-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0b1f2a]">
                  <MessageSquare className="h-4 w-4 text-[#c8104e]" />
                  Chat with Zovie
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Get instant help online.</p>
                <button
                  type="button"
                  onClick={openChat}
                  className="mt-auto self-end text-[12px] font-bold text-[#c8104e] hover:underline cursor-pointer"
                >
                  Start chat ›
                </button>
              </div>

              <div className="min-h-[108px] rounded-lg border border-slate-200 bg-[#f7f9fb] p-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0b1f2a]">
                  <Phone className="h-4 w-4 text-[#c8104e]" />
                  Call us
                </div>
                <a
                  href="tel:03330040333"
                  className="mt-1.5 block text-[12.5px] font-bold text-[#c8104e] hover:underline"
                >
                  0333 004 0333
                </a>
                <p className="mt-1 text-[11px] leading-[14px] text-slate-500">
                  Mon–Fri, 8am–8pm
                  <br />
                  Sat–Sun, 9am–6pm
                </p>
              </div>

              <div className="min-h-[108px] rounded-lg border border-slate-200 bg-[#f7f9fb] p-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0b1f2a]">
                  <Mail className="h-4 w-4 text-[#c8104e]" />
                  Email us
                </div>
                <a
                  href="mailto:help@zoikomobile.co.uk"
                  className="mt-1.5 block break-all text-[12.5px] font-bold leading-[15px] text-[#c8104e] hover:underline"
                >
                  help@zoikomobile.co.uk
                </a>
                <p className="mt-1 text-[11px] leading-[14px] text-slate-500">
                  We&apos;ll usually reply within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SERVICE PROMISES STRIP */}
      <section className="bg-[#0b4c59] text-white">
        <div className="mx-auto max-w-[1224px] px-4 py-5 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {SERVICE_PROMISES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`flex items-center gap-3 lg:px-6 ${
                    idx > 0 ? "lg:border-l lg:border-white/20" : "lg:pl-0"
                  }`}
                >
                  <Icon className="h-6 w-6 shrink-0 text-white" />
                  <div>
                    <p className="text-[12.5px] font-bold leading-[15px]">{item.title}</p>
                    <p className="text-[11px] text-white/80">{item.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MODAL 1: START A RETURN */}
      {startReturnOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-return-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#c8104e]">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="start-return-title" className="text-lg font-extrabold text-[#111827]">
                    Start a return or repair
                  </h3>
                  <p className="text-xs text-slate-600">
                    Submit your order details to generate your return instructions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStartReturnOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {startReturnSubmitted ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-[#16a34a]">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-[#111827]">
                  Return request created
                </h4>
                <p className="mt-2 text-sm text-slate-600">
                  Reference <span className="font-bold text-[#111827]">{startReturnSubmitted}</span>{" "}
                  has been generated for order <span className="font-semibold">{orderNumber}</span>.
                  We&apos;ve prepared your return summary for{" "}
                  <span className="font-semibold">{orderEmail}</span>.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackRef(startReturnSubmitted);
                      setTrackPostcodeOrEmail(orderEmail);
                      setStartReturnOpen(false);
                      setTrackModalOpen(true);
                    }}
                    className="rounded-full bg-[#c8104e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#a90d41] cursor-pointer"
                  >
                    Track this return ›
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartReturnOpen(false)}
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartReturnSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Reason</label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value as HelpReasonId)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#111827] focus:border-[#c8104e] focus:outline-none"
                  >
                    {HELP_REASONS.filter((r) => r.id !== "refund-status").map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Order number
                    </label>
                    <input
                      type="text"
                      required
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. ZMK-123456"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#c8104e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={orderEmail}
                      onChange={(e) => setOrderEmail(e.target.value)}
                      placeholder="you@example.co.uk"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#c8104e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Preferred resolution
                  </label>
                  <select
                    value={preferredResolution}
                    onChange={(e) => setPreferredResolution(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#111827] focus:border-[#c8104e] focus:outline-none"
                  >
                    <option value="Refund to original payment">Refund to original payment</option>
                    <option value="Exchange for another device">Exchange for another device</option>
                    <option value="Warranty repair">Warranty repair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={issueDetails}
                    onChange={(e) => setIssueDetails(e.target.value)}
                    placeholder="Briefly describe the fault or return reason..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#c8104e] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStartReturnOpen(false)}
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#c8104e] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#a90d41] cursor-pointer"
                  >
                    Continue ›
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: TRACK A RETURN (GUEST) */}
      {trackModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-return-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0b4c59]">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="track-return-title" className="text-lg font-extrabold text-[#111827]">
                    Track your return
                  </h3>
                  <p className="text-xs text-slate-600">
                    Guest tracking for returns, exchanges &amp; refunds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Return or Order reference
                </label>
                <input
                  type="text"
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  placeholder="e.g. ZMK-RET-123456"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0b4c59] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Email or UK postcode
                </label>
                <input
                  type="text"
                  value={trackPostcodeOrEmail}
                  onChange={(e) => setTrackPostcodeOrEmail(e.target.value)}
                  placeholder="e.g. W1W 5PF or you@example.co.uk"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0b4c59] focus:outline-none"
                />
              </div>

              {trackError && <p className="text-xs font-medium text-[#c8104e]">{trackError}</p>}

              {trackResult && (
                <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b4c59]">{trackResult.ref}</span>
                    <span className="rounded-full bg-[#0b4c59] px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {trackResult.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700">{trackResult.note}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTrackModalOpen(false)}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0b4c59] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#083a44] cursor-pointer"
                >
                  Check status ›
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KEY DETAIL INFO */}
      {activeDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#c8104e]">
                  <activeDetail.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="detail-modal-title" className="text-lg font-extrabold text-[#111827]">
                    {activeDetail.title}
                  </h3>
                  <p className="text-xs text-slate-600">{activeDetail.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {activeDetail.details.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c8104e]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveDetail(null);
                  openStartReturnWithReason("change-of-mind");
                }}
                className="rounded-full bg-[#c8104e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#a90d41] cursor-pointer"
              >
                Start a return ›
              </button>
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

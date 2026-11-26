"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Plane,
  Settings,
  Smartphone,
  Percent,
  ShieldCheck,
  Headphones,
  Bot,
  AlertCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  User,
  Globe,
  PhoneCall,
  BookOpen,
  Download,
  Briefcase,
  AlertTriangle,
  Ship,
  MapPin,
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  Activity,
  X,
} from "lucide-react";
import { isLoggedIn } from "../utils/auth";
import { openChat } from "../components/ChatbotWidget";

type IssueOption =
  | ""
  | "no-signal"
  | "no-data"
  | "calls-texts"
  | "slow-data"
  | "unexpected-charges";

type DeviceOption = "" | "iphone" | "android" | "other";

type DestinationOption =
  | ""
  | "eu-eea"
  | "usa"
  | "india"
  | "uae"
  | "australia"
  | "other-world";

interface TravelWarning {
  id: string;
  title: string;
  shortText: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
}

const TOPIC_LINKS = [
  { label: "Step-by-step fixes", href: "#wizard", icon: Settings },
  { label: "iPhone & Android guides", href: "#wizard", icon: Smartphone },
  { label: "Check costs & allowances", href: "#more-ways", icon: Percent },
  { label: "Account & network checks", href: "#account", icon: ShieldCheck },
  { label: "Get support", href: "#help-strip", icon: Headphones },
];

const DESTINATIONS: { value: DestinationOption; label: string; flag: string }[] = [
  { value: "eu-eea", label: "EU / EEA (e.g. Spain, France)", flag: "🇪🇺" },
  { value: "usa", label: "United States", flag: "🇺🇸" },
  { value: "india", label: "India", flag: "🇮🇳" },
  { value: "uae", label: "UAE (Dubai / Abu Dhabi)", flag: "🇦🇪" },
  { value: "australia", label: "Australia", flag: "🇦🇺" },
  { value: "other-world", label: "Rest of the World", flag: "🌍" },
];

const ZOIKO_PLANS = [
  "I'm not sure / skip",
  "Essential 5GB",
  "Core 15GB",
  "Max 30GB",
  "Elite 100GB",
  "Unlimited Data",
  "Data Only / Business SIM",
];

const BEFORE_TRAVEL_ITEMS = [
  "Check your plan’s roaming allowance and your destination’s zone.",
  "Check your phone’s settings — mobile data and data roaming.",
  "Make sure your SIM or eSIM line is turned on.",
  "Set a roaming spending limit in MyZoiko.",
  "Download this guide for offline access.",
];

const TRAVEL_WARNINGS: TravelWarning[] = [
  {
    id: "cruises",
    title: "Cruises",
    shortText:
      "Ships use satellite networks that can be expensive and aren’t included in your plan.",
    badgeClass: "text-[#c80f57]",
    icon: Ship,
    details: [
      "Maritime/satellite networks at sea operate outside standard EU/international roaming zones and are billed at maritime satellite rates.",
      "Turn on Airplane Mode while sailing and connect to ship Wi-Fi where available.",
      "Re-enable mobile data only after docking on land and verifying your phone displays a terrestrial local network.",
    ],
  },
  {
    id: "aircraft",
    title: "Aircraft",
    shortText: "In-flight mobile services use separate networks with higher charges.",
    badgeClass: "text-[#c80f57]",
    icon: Plane,
    details: [
      "AeroMobile / OnAir inflight cellular networks use satellite links and are excluded from inclusive roaming allowances.",
      "Switch your phone to Airplane Mode before takeoff and use onboard Wi-Fi instead of cellular data.",
      "Set a monthly roaming spend cap in MyZoiko before travelling to avoid accidental background app charges.",
    ],
  },
  {
    id: "borders",
    title: "Border areas",
    shortText:
      "Near borders, your phone may connect to a network in another country. Check charges first.",
    badgeClass: "text-[#c80f57]",
    icon: MapPin,
    details: [
      "In border regions (e.g. Northern Ireland/Republic of Ireland, Gibraltar/Spain, Swiss borders, or Greek islands near Turkey), devices can latch onto a neighbouring mast.",
      "Switch Automatic Network Selection OFF in Mobile Network settings and manually choose an operator in your destination country.",
      "Watch for our welcome SMS confirming which country’s network you have joined.",
    ],
  },
];

const ROAMING_FAQS = [
  {
    q: "Why do I have no signal abroad?",
    a: "First toggle Airplane Mode on for 15 seconds and back off. Ensure your Zoiko SIM/eSIM line is enabled and try switching Network Selection from Automatic to Manual to pick a local partner network.",
  },
  {
    q: "Why isn’t my mobile data working?",
    a: "Data Roaming is switched off by default on most phones. Enable both Mobile Data and Data Roaming in Cellular/Mobile Network settings, then verify you haven't reached your MyZoiko roaming spend limit.",
  },
  {
    q: "Can I make and receive calls and texts?",
    a: "Yes — dial numbers in full international format using + followed by the country code (for the UK use +44 and drop the leading 0). Incoming SMS messages are generally free.",
  },
  {
    q: "Do I need to change my APN settings?",
    a: "Usually APN settings configure automatically. If you still see 4G/5G bars with no internet after enabling Data Roaming, reset network settings or check your APN profile is active for Zoiko Mobile UK.",
  },
  {
    q: "Does Wi-Fi Calling work abroad?",
    a: "Wi-Fi Calling availability outside the UK depends on local network support and regulatory rules. Calling over standard cellular or checking your zone rates in advance is recommended.",
  },
  {
    q: "What are roaming spend limits and how do they work?",
    a: "Your MyZoiko spend limit caps out-of-allowance roaming charges per billing cycle so you don't run up unexpected bills. When reached, paid roaming pauses until you adjust the cap in MyZoiko.",
  },
  {
    q: "How do I use an eSIM while travelling?",
    a: "Keep your Zoiko eSIM turned ON in Mobile Service/SIM Manager and set it as your primary line for voice/data if using Zoiko roaming, or toggle Data Roaming on only for the active travel eSIM.",
  },
  {
    q: "Can I call emergency services abroad?",
    a: "Yes — in the EU/EEA dial 112 (or 911 in North America) free of charge even without active credit or signal from your home network, provided any local mast is reachable.",
  },
];

function buildFixSteps(
  issue: IssueOption,
  device: DeviceOption,
  destination: DestinationOption
): string[] {
  const deviceSteps =
    device === "iphone"
      ? "Open Settings → Mobile Service → Mobile Data Options → turn ON Data Roaming and ensure the Zoiko SIM/eSIM line is switched ON."
      : device === "android"
        ? "Open Settings → Network & Internet (or Connections) → Mobile networks → toggle ON Data roaming and Mobile data."
        : "Open your phone's Cellular / Mobile Network settings and ensure both Mobile Data and Data Roaming are turned ON.";

  const zoneNote =
    destination === "eu-eea"
      ? "EU/EEA roaming allows eligible plans to use inclusive allowances subject to fair-use policies."
      : destination
        ? "In non-EU destinations, check destination rates or ensure your MyZoiko spend limit allows out-of-bundle usage."
        : "Verify your destination zone and roaming spend limit in MyZoiko.";

  if (issue === "no-signal") {
    return [
      "Toggle Airplane Mode ON for 15 seconds, then switch it OFF so your phone re-registers on a local partner mast.",
      device === "iphone"
        ? "Go to Settings → Mobile Service → Network Selection, turn Automatic OFF, wait 20 seconds and manually pick an available local partner."
        : "Go to Settings → Connections / Mobile networks → Network operators, disable Select automatically and pick a local partner network.",
      "Restart your handset if registration fails, and check your SIM tray or eSIM line is enabled.",
    ];
  }
  if (issue === "no-data") {
    return [
      deviceSteps,
      zoneNote,
      "Toggle Airplane Mode for 10 seconds to refresh your data session, then test a webpage over mobile data (turn Wi-Fi off).",
    ];
  }
  if (issue === "calls-texts") {
    return [
      "Always dial numbers in full international format (e.g. +44 7XXX XXXXXX for UK mobiles, dropping the leading 0).",
      "Confirm Wi-Fi / VoLTE settings and verify your MyZoiko account has no international call bar or zero spend cap.",
      "Re-register onto another partner network manually if calls fail repeatedly on the current local mast.",
    ];
  }
  if (issue === "slow-data") {
    return [
      device === "iphone"
        ? "Check Settings → Mobile Service → Mobile Data Options → Voice & Data is set to 5G Auto or 4G, and Low Data Mode is OFF."
        : "Check Preferred network type is set to 5G/4G/LTE (avoid 2G/3G only) and Data Saver is OFF.",
      "Disable VPN apps temporarily and switch manually to another local partner network in your destination.",
      "Check in MyZoiko whether high-speed inclusive EU fair-use data has been reached.",
    ];
  }
  if (issue === "unexpected-charges") {
    return [
      zoneNote,
      "Check whether your phone connected near a border, on a cruise ship, or during a flight (satellite networks carry high charges).",
      "Log in to MyZoiko to inspect itemised usage and lower or lock your roaming spend cap immediately.",
    ];
  }
  return [
    deviceSteps,
    "Toggle Airplane Mode ON for 15 seconds, then OFF to refresh local partner network registration.",
    zoneNote,
  ];
}

export default function RoamingHelp() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  // Troubleshooter wizard state
  const [issue, setIssue] = useState<IssueOption>("");
  const [device, setDevice] = useState<DeviceOption>("");
  const [destination, setDestination] = useState<DestinationOption>("");
  const [plan, setPlan] = useState<string>(ZOIKO_PLANS[0]);
  const [fixResult, setFixResult] = useState<string[] | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    () => BEFORE_TRAVEL_ITEMS.map(() => false)
  );

  // Modals & accordions
  const [activeWarning, setActiveWarning] = useState<TravelWarning | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const doneCount = checkedItems.filter(Boolean).length;

  const selectedFlag =
    DESTINATIONS.find((d) => d.value === destination)?.flag ?? "🌍";

  const handleGetFix = (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);
    if (!issue || !device || !destination) {
      setWizardError(
        "Please select an issue, your device, and where you are to get tailored troubleshooting steps."
      );
      return;
    }
    setFixResult(buildFixSteps(issue, device, destination));
  };

  const handleDownloadGuide = () => {
    const content = [
      "ZOIKO MOBILE UK — ROAMING TROUBLESHOOTING & TRAVEL GUIDE",
      "Guide reviewed: 24 Nov 2026",
      "----------------------------------------------------------",
      "",
      "QUICK FIX CHECKLIST:",
      "1. Toggle Airplane Mode ON for 15 seconds, then OFF.",
      "2. Turn ON Mobile Data AND Data Roaming in phone settings.",
      "3. Switch Network Selection to Manual if you have no signal and pick a local partner.",
      "4. Dial numbers in full international format (+country code, drop leading 0).",
      "5. Check roaming allowances & spend caps in MyZoiko.",
      "",
      "HIGH-COST NETWORK WARNINGS:",
      "- Cruises / Maritime: Switch ON Airplane Mode at sea; satellite networks aren't in plan.",
      "- Aircraft: Use inflight Wi-Fi; keep Airplane Mode ON.",
      "- Borders: Turn OFF Automatic Network Selection near international borders.",
      "",
      "SUPPORT (7 days a week):",
      "- Phone: 0333 004 0333",
      "- Email: help@zoikomobile.co.uk",
      "- Emergency in EU/EEA: 112 | US/Canada: 911",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zoiko-roaming-help-guide.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const goToMyZoiko = () => {
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login?next=/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-[#141a45]">
      {/* 1. RH-04 HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(100deg, #5c0a35 0%, #9e0d4c 30%, #c80f57 46%, #0f4733 100%)",
        }}
      >
        <Image
          src="/images/roaming-help/hero-bg.png"
          alt="Coastal travel destination backdrop"
          fill
          priority
          className="object-cover object-center opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(92,10,53,0.97) 0%, rgba(158,13,76,0.90) 36%, rgba(200,15,87,0.50) 58%, rgba(200,15,87,0.08) 82%, rgba(200,15,87,0) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10 lg:py-9">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_377px]">
            {/* Left Copy */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[1.68px] text-[#fde6ee]">
                Roaming help
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-1.2px] text-white sm:text-4xl lg:text-[52px] lg:leading-[54.6px] lg:tracking-[-1.56px]">
                Roaming trouble?
                <br />
                Let’s get you connected.
              </h1>
              <p className="mt-3 max-w-[560px] text-base font-semibold leading-[1.5] text-[#fde6ee] sm:text-[18.9px] sm:leading-[28.3px]">
                Step-by-step help to fix signal, data, calls and texts while you’re abroad.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="#wizard"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-white/90 bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-[22px] text-[15px] sm:text-[17px] font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(0,0,0,0.6)] transition hover:brightness-110"
                >
                  <Wrench className="h-[18px] w-[18px]" />
                  <span>Start a troubleshooting guide</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </a>
                <a
                  href="#before"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-white/85 bg-[#140a28]/30 px-[22px] text-[15px] sm:text-[17px] font-extrabold text-white backdrop-blur-sm transition hover:bg-[#140a28]/50"
                >
                  <Plane className="h-[18px] w-[18px]" />
                  <span>Get ready before you travel</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </a>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative mx-auto h-[210px] w-full max-w-[377px] sm:h-[251px]">
              <Image
                src="/images/roaming-help/hero-travel-graphic.png"
                alt="Smartphone, passport, luggage and map travel essentials"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TOPIC NAV STRIP */}
      <nav
        aria-label="Roaming help topics"
        className="border-b border-[#e5e7f0] bg-white"
      >
        <div className="mx-auto max-w-[1280px] px-4 py-2 sm:px-6 lg:px-10">
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
            {TOPIC_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={idx > 0 ? "lg:border-l lg:border-[#e5e7f0]" : ""}
                >
                  <a
                    href={item.href}
                    className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl px-2.5 py-2.5 text-center text-sm font-extrabold text-[#141a45] transition hover:bg-[#fff4f7] hover:text-[#c80f57]"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#c80f57]" />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* MAIN CONTENT CONTAINER */}
      <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-7 sm:px-6 lg:px-10">
        {/* 2. RH-06 WIZARD + ACCOUNT */}
        <section className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left: Roaming Troubleshooter */}
          <div
            id="wizard"
            className="overflow-hidden rounded-[22px] border border-[#fde6ee] bg-white shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            {/* Dark Green Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3.5 px-[22px] py-4"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #0b3a2a 0%, #0f4733 65%, #13573f 100%)",
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-[-0.38px] text-white sm:text-[25.6px] sm:leading-[29.4px]">
                    Roaming Troubleshooter
                  </h2>
                  <p className="text-xs text-[#d6e3dd] sm:text-sm">
                    Tell us what’s happening and we’ll give you the right steps to fix it.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/30 bg-white/12 px-3 py-1 text-xs font-bold text-white">
                Guide reviewed 24 Nov 2026
              </span>
            </div>

            {/* Form Body */}
            <form onSubmit={handleGetFix} className="space-y-4 p-[22px]">
              <div className="grid gap-3.5 md:grid-cols-3">
                {/* Step 1 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#141a45] sm:text-base">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ec156c] text-xs font-extrabold text-white">
                      1
                    </span>
                    <span>What’s the issue?</span>
                  </label>
                  <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-[#d3d6e4] bg-white px-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-[#c80f57]" />
                    <select
                      aria-label="What's the issue?"
                      value={issue}
                      onChange={(e) => setIssue(e.target.value as IssueOption)}
                      className="w-full bg-transparent py-2.5 text-[15px] font-bold text-[#141a45] focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose the issue…</option>
                      <option value="no-signal">No signal / network bars</option>
                      <option value="no-data">Mobile data not working</option>
                      <option value="calls-texts">Can’t make calls or texts</option>
                      <option value="slow-data">Slow data speed abroad</option>
                      <option value="unexpected-charges">Unexpected roaming charges</option>
                    </select>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#141a45] sm:text-base">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ec156c] text-xs font-extrabold text-white">
                      2
                    </span>
                    <span>Your device?</span>
                  </label>
                  <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-[#d3d6e4] bg-white px-3">
                    <Smartphone className="h-5 w-5 shrink-0 text-[#c80f57]" />
                    <select
                      aria-label="Your device?"
                      value={device}
                      onChange={(e) => setDevice(e.target.value as DeviceOption)}
                      className="w-full bg-transparent py-2.5 text-[15px] font-bold text-[#141a45] focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose your device…</option>
                      <option value="iphone">iPhone (iOS)</option>
                      <option value="android">Android (Samsung / Pixel / Other)</option>
                      <option value="other">Other phone / hotspot</option>
                    </select>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#141a45] sm:text-base">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ec156c] text-xs font-extrabold text-white">
                      3
                    </span>
                    <span>Where are you?</span>
                  </label>
                  <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-[#d3d6e4] bg-white px-3">
                    <span aria-hidden="true" className="text-lg leading-none">
                      {selectedFlag}
                    </span>
                    <select
                      aria-label="Where are you?"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value as DestinationOption)}
                      className="w-full bg-transparent py-2.5 text-[15px] font-bold text-[#141a45] focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose where you are…</option>
                      {DESTINATIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Plan + CTA */}
              <div className="grid items-end gap-3.5 md:grid-cols-3">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-bold text-[#141a45] sm:text-base">
                    Your Zoiko plan{" "}
                    <span className="font-semibold text-[#565c7e]">
                      (optional — helps with allowance checks)
                    </span>
                  </label>
                  <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-[#d3d6e4] bg-white px-3">
                    <Layers className="h-5 w-5 shrink-0 text-[#c80f57]" />
                    <select
                      aria-label="Your Zoiko plan"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full bg-transparent py-2.5 text-[15px] font-bold text-[#141a45] focus:outline-none cursor-pointer"
                    >
                      {ZOIKO_PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-6 text-[16px] font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110 cursor-pointer"
                >
                  <span>Get my fix</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {wizardError && (
                <p className="text-xs font-semibold text-[#c80f57]">{wizardError}</p>
              )}

              {/* Dashed info / dynamic fix output box */}
              <div className="rounded-2xl border border-dashed border-[#fde6ee] bg-[#fcfcfe] p-3.5">
                {fixResult ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-[#141a45]">
                        Recommended steps for your{" "}
                        {device === "iphone"
                          ? "iPhone"
                          : device === "android"
                            ? "Android phone"
                            : "device"}
                        {plan !== ZOIKO_PLANS[0] ? ` (${plan})` : ""}:
                      </p>
                      <button
                        type="button"
                        onClick={() => setFixResult(null)}
                        className="text-xs font-bold text-[#c80f57] hover:underline cursor-pointer"
                      >
                        Reset guide
                      </button>
                    </div>
                    <ol className="space-y-2 text-sm text-[#2d3361]">
                      {fixResult.map((step, i) => (
                        <li key={step} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff4f7] text-xs font-extrabold text-[#c80f57]">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <p className="text-sm leading-[21px] text-[#2d3361]">
                      Choose the issue, your device and where you are, then select{" "}
                      <strong className="font-bold">Get my fix</strong>. You don’t need to sign
                      in, and we’ll never ask for passwords, codes or card details.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right: Your roaming at a glance */}
          <aside
            id="account"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Your roaming at a glance
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Sign in to MyZoiko to see your personalised roaming details and controls.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 pb-2.5">
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Roaming eligibility</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <Layers className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Included allowance</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <Activity className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Data used abroad</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5 rounded-[14px] border border-[#e5e7f0] bg-white px-3 py-2.5">
                <Percent className="h-5 w-5 shrink-0 text-[#565c7e]" />
                <div>
                  <p className="text-sm font-bold text-[#2d3361]">Roaming spend limit</p>
                  <p className="text-xs font-semibold text-[#565c7e]">Sign in to see</p>
                </div>
              </li>
            </ul>

            <button
              type="button"
              onClick={goToMyZoiko}
              className="mt-2 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-6 text-[17px] font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110 cursor-pointer"
            >
              <User className="h-5 w-5" />
              <span>{loggedIn ? "Manage in MyZoiko" : "Sign in to MyZoiko"}</span>
              <ChevronRight className="h-5 w-5" />
            </button>

            <p className="mt-2.5 text-center text-sm text-[#565c7e]">
              You can use the troubleshooter without signing in.
            </p>
          </aside>
        </section>

        {/* 3. RH-07 MORE WAYS WE CAN HELP */}
        <section
          id="more-ways"
          className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-6 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
              <Plane className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
              More ways we can help
            </h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {/* Tile 1 - Pink */}
            <Link
              href="/roaming-included-in-plans"
              className="flex flex-col gap-1.5 rounded-[18px] border border-[#fde6ee] p-3.5 transition hover:shadow-md"
              style={{
                backgroundImage: "linear-gradient(160deg, #fff4f7 0%, #ffffff 70%)",
              }}
            >
              <Layers className="mb-1 h-7 w-7 text-[#c80f57]" />
              <span className="text-base font-bold leading-tight text-[#141a45]">
                Roaming in my plan
              </span>
              <span className="text-xs leading-[16.2px] text-[#2d3361]">
                See what’s included abroad.
              </span>
            </Link>

            {/* Tile 2 - Mint */}
            <Link
              href="/roaming-and-coverage"
              className="flex flex-col gap-1.5 rounded-[18px] border border-[#bfe3cb] p-3.5 transition hover:shadow-md"
              style={{
                backgroundImage: "linear-gradient(160deg, #f0f9f3 0%, #ffffff 70%)",
              }}
            >
              <Globe className="mb-1 h-7 w-7 text-[#1f8c44]" />
              <span className="text-base font-bold leading-tight text-[#141a45]">
                Roaming &amp; overage rates
              </span>
              <span className="text-xs leading-[16.2px] text-[#2d3361]">
                Check charges for any destination.
              </span>
            </Link>

            {/* Tile 3 - Pink */}
            <button
              type="button"
              onClick={goToMyZoiko}
              className="flex flex-col gap-1.5 rounded-[18px] border border-[#fde6ee] p-3.5 text-left transition hover:shadow-md cursor-pointer"
              style={{
                backgroundImage: "linear-gradient(160deg, #fff4f7 0%, #ffffff 70%)",
              }}
            >
              <ShieldCheck className="mb-1 h-7 w-7 text-[#c80f57]" />
              <span className="text-base font-bold leading-tight text-[#141a45]">
                Control my spend
              </span>
              <span className="text-xs leading-[16.2px] text-[#2d3361]">
                Set a roaming spending limit in MyZoiko.
              </span>
            </button>

            {/* Tile 4 - Mint */}
            <Link
              href="/international-calling"
              className="flex flex-col gap-1.5 rounded-[18px] border border-[#bfe3cb] p-3.5 transition hover:shadow-md"
              style={{
                backgroundImage: "linear-gradient(160deg, #f0f9f3 0%, #ffffff 70%)",
              }}
            >
              <PhoneCall className="mb-1 h-7 w-7 text-[#1f8c44]" />
              <span className="text-base font-bold leading-tight text-[#141a45]">
                International calling
              </span>
              <span className="text-xs leading-[16.2px] text-[#2d3361]">
                Call from the UK or while abroad.
              </span>
            </Link>

            {/* Tile 5 - Pink */}
            <a
              href="#travel"
              className="flex flex-col gap-1.5 rounded-[18px] border border-[#fde6ee] p-3.5 transition hover:shadow-md"
              style={{
                backgroundImage: "linear-gradient(160deg, #fff4f7 0%, #ffffff 70%)",
              }}
            >
              <BookOpen className="mb-1 h-7 w-7 text-[#c80f57]" />
              <span className="text-base font-bold leading-tight text-[#141a45]">
                Travel guidance
              </span>
              <span className="text-xs leading-[16.2px] text-[#2d3361]">
                Cruises, aircraft, border networks and useful tips.
              </span>
            </a>

            {/* Tile 6 - Mint */}
            <button
              type="button"
              onClick={handleDownloadGuide}
              className="flex flex-col gap-1.5 rounded-[18px] border border-[#bfe3cb] p-3.5 text-left transition hover:shadow-md cursor-pointer"
              style={{
                backgroundImage: "linear-gradient(160deg, #f0f9f3 0%, #ffffff 70%)",
              }}
            >
              <Download className="mb-1 h-7 w-7 text-[#1f8c44]" />
              <span className="text-base font-bold leading-tight text-[#141a45]">
                Download guides
              </span>
              <span className="text-xs leading-[16.2px] text-[#2d3361]">
                Save a step-by-step guide for offline use (text file).
              </span>
            </button>
          </div>
        </section>

        {/* 4. RH-08 THREE COLUMNS */}
        <section className="grid items-start gap-[18px] lg:grid-cols-3">
          {/* Col 1: Before you travel */}
          <div
            id="before"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Before you travel
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  A quick checklist to help you stay connected abroad.
                </p>
              </div>
            </div>

            <ul className="divide-y divide-[#e5e7f0]">
              {BEFORE_TRAVEL_ITEMS.map((label, idx) => (
                <li key={label} className="py-2.5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checkedItems[idx]}
                      onChange={() =>
                        setCheckedItems((prev) =>
                          prev.map((val, i) => (i === idx ? !val : val))
                        )
                      }
                      className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-[2.5px] border border-[#767676] accent-[#c80f57] cursor-pointer"
                    />
                    <span className="text-sm leading-[21px] text-[#2d3361]">{label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs leading-[18px] text-[#565c7e]">
              {doneCount} of 5 done · this checklist doesn’t change your account settings
            </p>
          </div>

          {/* Col 2: Important travel information */}
          <div
            id="travel"
            className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff8e6] text-[#d97706]">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Important travel information
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Some networks cost much more than normal roaming.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {TRAVEL_WARNINGS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveWarning(item)}
                    className="group flex w-full items-center gap-3 rounded-[14px] border border-[#e5e7f0] bg-white p-3 text-left transition hover:border-[#c80f57]/40 hover:bg-[#fff4f7]/40 cursor-pointer"
                  >
                    <Icon className={`h-6 w-6 shrink-0 ${item.badgeClass}`} />
                    <span className="w-[84px] shrink-0 text-sm font-bold text-[#141a45]">
                      {item.title}
                    </span>
                    <span className="flex-1 text-xs leading-[16.2px] text-[#2d3361]">
                      {item.shortText}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#c80f57] transition group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 3: Frequently asked questions */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Frequently asked questions
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  Quick answers to common roaming questions.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {ROAMING_FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-xl border border-[#e5e7f0] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2.5 text-left cursor-pointer"
                    >
                      <span className="text-[13px] font-extrabold leading-[19.5px] text-[#2d3361]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#565c7e] transition-transform ${
                          isOpen ? "rotate-180 text-[#c80f57]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="border-t border-[#e5e7f0] px-3 py-2.5 text-xs leading-[18px] text-[#565c7e]">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. RH-09 STILL NEED HELP STRIP */}
        <section id="help-strip" className="pb-6">
          <div
            className="flex flex-wrap items-center gap-4 rounded-[22px] px-6 py-[18px] text-white"
            style={{
              backgroundImage: "linear-gradient(90deg, #0b3a2a 0%, #0f4733 100%)",
            }}
          >
            <Headphones className="h-[38px] w-[38px] shrink-0 text-white" />
            <h2 className="border-white/30 pr-4 text-xl font-extrabold tracking-[-0.3px] sm:border-r">
              Still need help?
            </h2>
            <p className="min-w-[220px] flex-1 text-sm leading-[21px] text-[#d6e3dd]">
              Our UK-based support team is here to get you connected, wherever you are in the
              world.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={openChat}
                className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border-2 border-white bg-white px-[18px] text-[16px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7] cursor-pointer"
              >
                <MessageSquare className="h-[18px] w-[18px]" />
                <span>Chat with Zovie</span>
              </button>
              <a
                href="tel:03330040333"
                className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border-2 border-white bg-white px-[18px] text-[16px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7]"
              >
                <Phone className="h-[18px] w-[18px]" />
                <span>Call support</span>
              </a>
              <a
                href="mailto:help@zoikomobile.co.uk"
                className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border-2 border-white bg-white px-[18px] text-[16px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7]"
              >
                <Mail className="h-[18px] w-[18px]" />
                <span>Email us</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* TRAVEL WARNING MODAL */}
      {activeWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="travel-warning-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e7f0] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8e6] text-[#c80f57]">
                  <activeWarning.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="travel-warning-title"
                    className="text-lg font-extrabold text-[#141a45]"
                  >
                    {activeWarning.title} — Travel Guidance
                  </h3>
                  <p className="text-xs text-[#565c7e]">Avoiding high roaming charges</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveWarning(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#141a45] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {activeWarning.details.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-[#2d3361]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c80f57]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                href="/roaming-and-coverage"
                className="rounded-full bg-[#c80f57] px-5 py-2.5 text-xs font-bold text-white hover:brightness-110"
              >
                Check zone rates ›
              </Link>
              <button
                type="button"
                onClick={() => setActiveWarning(null)}
                className="rounded-full border border-[#d3d6e4] px-5 py-2.5 text-xs font-bold text-[#141a45] hover:bg-slate-50 cursor-pointer"
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

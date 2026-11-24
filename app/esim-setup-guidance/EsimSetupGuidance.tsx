"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wifi,
  Settings,
  PlusSquare,
  Signal,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  FileText,
  Wrench,
  HelpCircle,
  Lock,
  Info,
  Clock,
  Check,
  X,
  Search,
  ChevronRight,
  ArrowRight,
  Plane,
  Bluetooth,
  Link2,
  BatteryCharging,
} from "lucide-react";

type DeviceType = "iphone" | "samsung" | "android";
type ScenarioType = "new" | "replace";

interface StepItem {
  title: string;
  description: string;
  icon: "wifi" | "settings" | "add" | "signal";
}

interface PhoneScreenData {
  time: string;
  caption: string;
  type: "settings" | "submenu" | "qr" | "done";
  settingsTitle?: string;
  highlightedRow?: string;
  submenuTitle?: string;
  submenuSubtitle?: string;
  submenuItem1?: string;
  submenuItem2?: string;
  submenuHighlight?: string;
  qrTitle?: string;
  qrSubtitle?: string;
  qrPrimaryBtn?: string;
  qrSecondaryBtn?: string;
  doneTitle?: string;
  doneSubtitle?: string;
}

interface GuideContent {
  heading: string;
  subtitle: string;
  steps: StepItem[];
  screens: PhoneScreenData[];
}

const GUIDE_CONTENT: Record<DeviceType, Record<ScenarioType, GuideContent>> = {
  iphone: {
    new: {
      heading: "Set up your eSIM on iPhone",
      subtitle: "Follow these steps to install your Zoiko Mobile eSIM.",
      steps: [
        {
          title: "Connect to Wi-Fi",
          description: "Use a stable Wi-Fi connection.",
          icon: "wifi",
        },
        {
          title: "Open Settings",
          description: "Tap Settings, then Mobile Service.",
          icon: "settings",
        },
        {
          title: "Add eSIM",
          description:
            "Tap Add eSIM and choose Use QR Code or Enter Details Manually.",
          icon: "add",
        },
        {
          title: "Install and activate",
          description:
            "Follow the on-screen steps, then wait for activation (see status below).",
          icon: "signal",
        },
      ],
      screens: [
        {
          time: "10:47",
          type: "settings",
          settingsTitle: "Settings",
          highlightedRow: "Mobile Service",
          caption: "Open Settings and tap Mobile Service",
        },
        {
          time: "10:51",
          type: "submenu",
          submenuTitle: "Mobile Service",
          submenuSubtitle: "Manage your mobile data, SIMs and eSIMs.",
          submenuItem1: "Mobile Data",
          submenuItem2: "Personal Hotspot",
          submenuHighlight: "Add eSIM",
          caption: "Tap Add eSIM",
        },
        {
          time: "10:53",
          type: "qr",
          qrTitle: "Set Up Mobile Service",
          qrSubtitle:
            "You can transfer a number from a nearby phone, or use a QR code from your network provider.",
          qrPrimaryBtn: "Use QR Code",
          qrSecondaryBtn: "Enter Details Manually",
          caption: "Choose Use QR Code or Enter Details Manually",
        },
        {
          time: "11:44",
          type: "done",
          doneTitle: "eSIM Added",
          doneSubtitle: "Your Zoiko Mobile eSIM is installed.",
          caption: "Follow the instructions and complete set-up",
        },
      ],
    },
    replace: {
      heading: "Move or replace your eSIM on iPhone",
      subtitle:
        "Use a replacement eSIM from your MyZoiko dashboard before deleting your old profile.",
      steps: [
        {
          title: "Request a replacement eSIM",
          description:
            "Get your new QR code in MyZoiko before removing your old eSIM.",
          icon: "wifi",
        },
        {
          title: "Open Settings on your new iPhone",
          description: "Connect to Wi-Fi and tap Settings, then Mobile Service.",
          icon: "settings",
        },
        {
          title: "Scan your new QR code",
          description:
            "Tap Add eSIM, choose Use QR Code, or enter the activation details manually.",
          icon: "add",
        },
        {
          title: "Complete transfer & activate",
          description:
            "Wait for signal on your new iPhone, then remove the old eSIM if needed.",
          icon: "signal",
        },
      ],
      screens: [
        {
          time: "10:47",
          type: "settings",
          settingsTitle: "Settings",
          highlightedRow: "Mobile Service",
          caption: "Open Settings and tap Mobile Service",
        },
        {
          time: "10:51",
          type: "submenu",
          submenuTitle: "Mobile Service",
          submenuSubtitle: "Manage your mobile data, SIMs and eSIMs.",
          submenuItem1: "Mobile Data",
          submenuItem2: "Personal Hotspot",
          submenuHighlight: "Add eSIM",
          caption: "Tap Add eSIM on your new iPhone",
        },
        {
          time: "10:53",
          type: "qr",
          qrTitle: "Set Up Mobile Service",
          qrSubtitle:
            "Scan the new eSIM QR code from your MyZoiko account or confirmation email.",
          qrPrimaryBtn: "Use QR Code",
          qrSecondaryBtn: "Enter Details Manually",
          caption: "Scan your new QR code or enter details",
        },
        {
          time: "11:44",
          type: "done",
          doneTitle: "eSIM Transferred",
          doneSubtitle: "Your Zoiko Mobile eSIM is ready on this iPhone.",
          caption: "Confirm set-up and wait for network signal",
        },
      ],
    },
  },
  samsung: {
    new: {
      heading: "Set up your eSIM on Samsung Galaxy",
      subtitle: "Follow these steps to install your Zoiko Mobile eSIM.",
      steps: [
        {
          title: "Connect to Wi-Fi",
          description: "Make sure your Samsung Galaxy has a stable Wi-Fi connection.",
          icon: "wifi",
        },
        {
          title: "Open Connections",
          description: "Open Settings, tap Connections, then tap SIM manager.",
          icon: "settings",
        },
        {
          title: "Add eSIM",
          description:
            "Tap Add eSIM and choose Scan QR code from service provider.",
          icon: "add",
        },
        {
          title: "Download and activate",
          description:
            "Tap Add when prompted, then wait for your Zoiko Mobile line to activate.",
          icon: "signal",
        },
      ],
      screens: [
        {
          time: "10:47",
          type: "settings",
          settingsTitle: "Connections",
          highlightedRow: "SIM manager",
          caption: "Open Settings > Connections > SIM manager",
        },
        {
          time: "10:51",
          type: "submenu",
          submenuTitle: "SIM manager",
          submenuSubtitle: "Manage your physical SIMs and eSIM profiles.",
          submenuItem1: "Calls & messages",
          submenuItem2: "Mobile data",
          submenuHighlight: "Add eSIM",
          caption: "Tap Add eSIM under eSIMs",
        },
        {
          time: "10:53",
          type: "qr",
          qrTitle: "Add eSIM",
          qrSubtitle:
            "Scan the QR code from Zoiko Mobile or enter your activation code manually.",
          qrPrimaryBtn: "Scan QR code",
          qrSecondaryBtn: "Enter activation code",
          caption: "Scan your QR code or enter code manually",
        },
        {
          time: "11:44",
          type: "done",
          doneTitle: "eSIM Added",
          doneSubtitle: "Zoiko Mobile eSIM added to SIM manager.",
          caption: "Tap Add and complete activation",
        },
      ],
    },
    replace: {
      heading: "Move or replace your eSIM on Samsung Galaxy",
      subtitle:
        "Install your replacement Zoiko Mobile eSIM on your Samsung Galaxy.",
      steps: [
        {
          title: "Get your replacement QR code",
          description:
            "Generate a new eSIM in MyZoiko before removing the old one.",
          icon: "wifi",
        },
        {
          title: "Open SIM manager",
          description: "On your Samsung phone, go to Settings > Connections > SIM manager.",
          icon: "settings",
        },
        {
          title: "Add replacement eSIM",
          description:
            "Tap Add eSIM and scan your replacement QR code or enter details.",
          icon: "add",
        },
        {
          title: "Confirm & test signal",
          description:
            "Set Zoiko Mobile for calls, texts and mobile data once active.",
          icon: "signal",
        },
      ],
      screens: [
        {
          time: "10:47",
          type: "settings",
          settingsTitle: "Connections",
          highlightedRow: "SIM manager",
          caption: "Open Connections > SIM manager",
        },
        {
          time: "10:51",
          type: "submenu",
          submenuTitle: "SIM manager",
          submenuSubtitle: "Manage your physical SIMs and eSIM profiles.",
          submenuItem1: "Calls & messages",
          submenuItem2: "Mobile data",
          submenuHighlight: "Add eSIM",
          caption: "Tap Add eSIM on your new device",
        },
        {
          time: "10:53",
          type: "qr",
          qrTitle: "Add eSIM",
          qrSubtitle:
            "Scan your replacement QR code from MyZoiko or your email.",
          qrPrimaryBtn: "Scan QR code",
          qrSecondaryBtn: "Enter activation code",
          caption: "Scan replacement QR code",
        },
        {
          time: "11:44",
          type: "done",
          doneTitle: "eSIM Active",
          doneSubtitle: "Your replacement Zoiko eSIM is installed.",
          caption: "Complete set-up and check mobile data",
        },
      ],
    },
  },
  android: {
    new: {
      heading: "Set up your eSIM on Android",
      subtitle:
        "Follow these steps to install your Zoiko Mobile eSIM on Pixel and other Android phones.",
      steps: [
        {
          title: "Connect to Wi-Fi",
          description: "Ensure your Android device is connected to Wi-Fi.",
          icon: "wifi",
        },
        {
          title: "Open Network & internet",
          description: "Go to Settings > Network & internet > SIMs.",
          icon: "settings",
        },
        {
          title: "Download your SIM",
          description:
            "Tap Add SIM (+), choose Download a SIM instead?, then scan your QR code.",
          icon: "add",
        },
        {
          title: "Turn on & activate",
          description:
            "Confirm download, turn on Use SIM, and wait a few minutes for signal.",
          icon: "signal",
        },
      ],
      screens: [
        {
          time: "10:47",
          type: "settings",
          settingsTitle: "Network & internet",
          highlightedRow: "SIMs",
          caption: "Open Settings > Network & internet > SIMs",
        },
        {
          time: "10:51",
          type: "submenu",
          submenuTitle: "SIMs",
          submenuSubtitle: "Manage mobile networks and eSIM downloads.",
          submenuItem1: "Mobile network",
          submenuItem2: "Calls & SMS",
          submenuHighlight: "Add SIM",
          caption: "Tap Add SIM (+) and Download a SIM",
        },
        {
          time: "10:53",
          type: "qr",
          qrTitle: "Scan QR code",
          qrSubtitle:
            "Position your Zoiko Mobile eSIM QR code inside the camera frame.",
          qrPrimaryBtn: "Use QR Code",
          qrSecondaryBtn: "Need help? Enter code",
          caption: "Scan your QR code or enter activation code",
        },
        {
          time: "11:44",
          type: "done",
          doneTitle: "eSIM Downloaded",
          doneSubtitle: "Turn on Use SIM in settings to connect.",
          caption: "Complete download and enable your SIM",
        },
      ],
    },
    replace: {
      heading: "Move or replace your eSIM on Android",
      subtitle:
        "Install your new Zoiko Mobile eSIM on Google Pixel or another Android device.",
      steps: [
        {
          title: "Request a replacement eSIM",
          description:
            "Generate your new QR code in MyZoiko before wiping your old phone.",
          icon: "wifi",
        },
        {
          title: "Open SIM settings",
          description: "Go to Settings > Network & internet > SIMs on the new phone.",
          icon: "settings",
        },
        {
          title: "Download replacement eSIM",
          description:
            "Tap Add SIM (+), choose Download a SIM, and scan your new QR code.",
          icon: "add",
        },
        {
          title: "Enable your line",
          description:
            "Switch on Use SIM and confirm your mobile data and call preferences.",
          icon: "signal",
        },
      ],
      screens: [
        {
          time: "10:47",
          type: "settings",
          settingsTitle: "Network & internet",
          highlightedRow: "SIMs",
          caption: "Open Network & internet > SIMs",
        },
        {
          time: "10:51",
          type: "submenu",
          submenuTitle: "SIMs",
          submenuSubtitle: "Manage mobile networks and eSIM downloads.",
          submenuItem1: "Mobile network",
          submenuItem2: "Calls & SMS",
          submenuHighlight: "Add SIM",
          caption: "Tap Add SIM on your new phone",
        },
        {
          time: "10:53",
          type: "qr",
          qrTitle: "Scan QR code",
          qrSubtitle:
            "Scan the new eSIM QR code issued from your MyZoiko account.",
          qrPrimaryBtn: "Use QR Code",
          qrSecondaryBtn: "Need help? Enter code",
          caption: "Scan your replacement QR code",
        },
        {
          time: "11:44",
          type: "done",
          doneTitle: "eSIM Ready",
          doneSubtitle: "Your replacement Zoiko eSIM is ready to use.",
          caption: "Turn on Use SIM and wait for network bars",
        },
      ],
    },
  },
};

const COMPATIBLE_DEVICES: { brand: string; models: string[] }[] = [
  {
    brand: "Apple iPhone",
    models: [
      "iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max",
      "iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max",
      "iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max",
      "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
      "iPhone 12 / 12 mini / 12 Pro / 12 Pro Max",
      "iPhone 11 / 11 Pro / 11 Pro Max",
      "iPhone XS / XS Max / XR / SE (2nd & 3rd gen)",
    ],
  },
  {
    brand: "Samsung Galaxy",
    models: [
      "Galaxy S25 / S25+ / S25 Ultra",
      "Galaxy S24 / S24+ / S24 Ultra / S24 FE",
      "Galaxy S23 / S23+ / S23 Ultra / S23 FE",
      "Galaxy S22 / S21 / S20 series",
      "Galaxy Z Fold & Z Flip (3, 4, 5, 6)",
      "Galaxy A55 / A54 (UK unlocked variants)",
    ],
  },
  {
    brand: "Google Pixel & Other Android",
    models: [
      "Google Pixel 9 / 9 Pro / 9 Pro XL / 9 Pro Fold",
      "Google Pixel 8 / 8 Pro / 8a",
      "Google Pixel 7 / 7 Pro / 7a",
      "Google Pixel 6 / 5 / 4 series",
      "Motorola Razr (2022+) & Edge 40 / 50 series",
      "OnePlus 12 / 13 & Sony Xperia 10 IV / V / 1 V",
    ],
  },
];

const TROUBLESHOOT_ITEMS = [
  {
    title: "QR code won't scan or says invalid",
    fix: "Make sure you are connected to Wi-Fi, increase screen brightness if scanning from another screen, and check the code hasn't already been installed on another phone. You can also choose 'Enter Details Manually' using the SM-DP+ address and activation code from your email.",
  },
  {
    title: "Stuck on 'Activation pending' for over 15 minutes",
    fix: "Restart your handset and toggle Airplane Mode on for 15 seconds, then off. Ensure your new Zoiko eSIM line is toggled ON in Mobile Service / SIM manager.",
  },
  {
    title: "No signal or mobile data after installation",
    fix: "Open Mobile Service / SIM manager, select your Zoiko Mobile eSIM as the active Mobile Data line, and make sure Data Roaming is enabled if you are travelling outside the UK.",
  },
  {
    title: "Deleted my eSIM by mistake",
    fix: "An eSIM QR code can normally only be installed once. Visit Replace your eSIM in MyZoiko to request a fresh QR code safely without losing your number.",
  },
];

function StepIcon({ kind }: { kind: StepItem["icon"] }) {
  switch (kind) {
    case "wifi":
      return <Wifi className="w-4 h-4" aria-hidden="true" />;
    case "settings":
      return <Settings className="w-4 h-4" aria-hidden="true" />;
    case "add":
      return <PlusSquare className="w-4 h-4" aria-hidden="true" />;
    case "signal":
      return <Signal className="w-4 h-4" aria-hidden="true" />;
  }
}

function PhoneMockup({
  stepNumber,
  screen,
}: {
  stepNumber: number;
  screen: PhoneScreenData;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[178px] rounded-[24px] p-1.5 bg-gray-900 shadow-[0px_10px_26px_0px_rgba(15,23,42,0.11)]">
        <div
          className={`h-[288px] rounded-[18px] overflow-hidden flex flex-col ${
            screen.type === "qr" || screen.type === "done"
              ? "bg-white"
              : "bg-gray-100"
          }`}
        >
          {/* Phone status bar */}
          <div className="px-3 pt-1.5 pb-1 flex items-center justify-between text-[9px] font-semibold text-slate-900">
            <span>{screen.time}</span>
            <span className="w-11 h-2.5 bg-slate-900 rounded-full" />
            <span>5G</span>
          </div>

          {screen.type === "settings" && (
            <>
              <div className="px-3 pt-2 pb-1.5">
                <span className="text-[15px] font-bold text-slate-900">
                  {screen.settingsTitle}
                </span>
              </div>
              <div className="px-2 pb-2 flex-1">
                <div className="bg-white rounded-[10px] px-2 py-2 flex flex-col gap-2.5 text-[9.5px] text-slate-700">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="w-3.5 h-3.5 rounded bg-orange-500 text-white flex items-center justify-center shrink-0">
                      <Plane className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span>Airplane Mode</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Wifi className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span>Wi-Fi</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="w-3.5 h-3.5 rounded bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Bluetooth className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span>Bluetooth</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 py-1 bg-green-50 rounded-md ring-[1.5px] ring-green-600 text-slate-900 font-semibold">
                    <span className="w-3.5 h-3.5 rounded bg-green-600 text-white flex items-center justify-center shrink-0">
                      <Signal className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span className="truncate">{screen.highlightedRow}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="w-3.5 h-3.5 rounded bg-green-600 text-white flex items-center justify-center shrink-0">
                      <Link2 className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span>Personal Hotspot</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="w-3.5 h-3.5 rounded bg-green-500 text-white flex items-center justify-center shrink-0">
                      <BatteryCharging className="w-2.5 h-2.5" aria-hidden="true" />
                    </span>
                    <span>Battery</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {screen.type === "submenu" && (
            <div className="px-2.5 pt-4 pb-3 flex-1 flex flex-col justify-between">
              <div className="flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center mb-1.5">
                  <Signal className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div className="text-[11px] font-bold text-slate-900">
                  {screen.submenuTitle}
                </div>
                <p className="text-[8px] text-slate-500 leading-tight mt-0.5">
                  {screen.submenuSubtitle}
                </p>
              </div>

              <div className="bg-white rounded-[10px] p-2 flex flex-col gap-2 text-[9.5px]">
                <div className="flex items-center justify-between text-slate-700 font-semibold px-1">
                  <span>{screen.submenuItem1}</span>
                  <span>›</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 font-semibold px-1">
                  <span>{screen.submenuItem2}</span>
                  <span className="text-slate-400">Off ›</span>
                </div>
                <div className="flex items-center justify-between px-1.5 py-1 rounded-md bg-[#FDF2F6] ring-[1.5px] ring-[#C8104E] text-slate-900 font-bold">
                  <span>{screen.submenuHighlight}</span>
                  <span className="text-[#C8104E]">›</span>
                </div>
              </div>
            </div>
          )}

          {screen.type === "qr" && (
            <div className="px-3 pt-4 pb-3 flex-1 flex flex-col justify-between text-center">
              <div className="flex flex-col items-center">
                <Signal className="w-5 h-5 text-blue-600 mb-1.5" aria-hidden="true" />
                <div className="text-[11px] font-bold text-slate-900">
                  {screen.qrTitle}
                </div>
                <p className="text-[8px] text-slate-500 leading-[10.5px] mt-1">
                  {screen.qrSubtitle}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-full py-1.5 px-2 rounded-md bg-blue-600 text-white text-[9px] font-bold">
                  {screen.qrPrimaryBtn}
                </div>
                <div className="w-full py-1 px-2 text-blue-600 text-[8.5px] font-bold">
                  {screen.qrSecondaryBtn}
                </div>
              </div>
            </div>
          )}

          {screen.type === "done" && (
            <div className="px-3 pt-10 pb-3 flex-1 flex flex-col justify-between text-center">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full ring-2 ring-green-600 text-green-600 flex items-center justify-center mb-2.5">
                  <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </div>
                <div className="text-[11.5px] font-bold text-slate-900">
                  {screen.doneTitle}
                </div>
                <p className="text-[8.5px] text-slate-500 leading-tight mt-1">
                  {screen.doneSubtitle}
                </p>
              </div>

              <div className="w-full py-1.5 rounded-md bg-blue-600 text-white text-[9.5px] font-bold">
                Done
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <div className="w-full max-w-[178px] pt-3 flex items-start gap-2">
        <span className="w-5 h-5 rounded-full bg-[#C8104E] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
          {stepNumber}
        </span>
        <span className="text-slate-900 text-xs font-bold leading-4">
          {screen.caption}
        </span>
      </div>
    </div>
  );
}

export default function EsimSetupGuidance() {
  const [device, setDevice] = useState<DeviceType>("iphone");
  const [scenario, setScenario] = useState<ScenarioType>("new");
  const [compatOpen, setCompatOpen] = useState(false);
  const [compatQuery, setCompatQuery] = useState("");
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);

  const guide = GUIDE_CONTENT[device][scenario];

  const scrollToSetup = () => {
    const el = document.getElementById("choose-device");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!compatOpen && !troubleshootOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCompatOpen(false);
        setTroubleshootOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compatOpen, troubleshootOpen]);

  const filteredDevices = COMPATIBLE_DEVICES.map((group) => ({
    ...group,
    models: group.models.filter((m) =>
      m.toLowerCase().includes(compatQuery.trim().toLowerCase())
    ),
  })).filter((g) => g.models.length > 0);

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* ── Section 1: Hero Banner ── */}
      <section className="relative min-h-[320px] flex items-center overflow-hidden bg-[#5A002B]">
        <Image
          src="/images/Section (1).png"
          alt="Set up your Zoiko Mobile eSIM"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] lg:object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#4A0022]/85 via-[#4A0022]/45 to-transparent lg:from-[#4A0022]/30 lg:via-transparent"
        />

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-7 py-10">
          <div className="max-w-[540px]">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
              Set up your eSIM.
              <br />
              Stay connected.
            </h1>
            <p className="mt-3.5 max-w-[470px] text-base font-medium text-white/95 leading-6">
              A simple, step-by-step guide to installing, activating and
              managing your Zoiko Mobile eSIM.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={scrollToSetup}
                className="min-h-11 px-6 py-2.5 bg-[#C8104E] hover:bg-[#a80c41] text-white text-sm font-bold rounded-full shadow-[0px_6px_18px_0px_rgba(0,0,0,0.22)] ring-[1.5px] ring-white/90 inline-flex items-center gap-2 transition cursor-pointer"
              >
                <span>Start set-up</span>
                <span aria-hidden="true">›</span>
              </button>
              <button
                type="button"
                onClick={() => setCompatOpen(true)}
                className="min-h-11 px-6 py-2.5 bg-cyan-950/35 hover:bg-cyan-950/55 text-white text-sm font-bold rounded-full ring-[1.5px] ring-white/85 backdrop-blur-[6px] inline-flex items-center gap-2 transition cursor-pointer"
              >
                <span>Check device compatibility</span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: 4-Item Trust Strip ── */}
      <section className="bg-white border-b border-slate-200 py-3.5">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200">
            <div className="px-3 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-slate-900 text-sm font-bold leading-5">
                No physical SIM
              </span>
            </div>

            <div className="px-3 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-slate-900 text-sm font-bold leading-5">
                Quick and secure set-up
              </span>
            </div>

            <div className="px-3 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <Signal className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-slate-900 text-sm font-bold leading-5">
                Keep your number
              </span>
            </div>

            <div className="px-3 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-slate-900 text-sm font-bold leading-5">
                Switch or move easily
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-7 pt-5 pb-12 space-y-5">
        {/* ── Section 3: Choose your device Card ── */}
        <section
          id="choose-device"
          className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] p-5 sm:p-6"
        >
          <div>
            <h2 className="text-slate-900 text-xl font-extrabold leading-6">
              Choose your device
            </h2>
            <p className="text-slate-600 text-xs mt-1 leading-5">
              Get the right set-up steps for your phone.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Device Tabs */}
            <div
              className="flex flex-wrap items-center gap-2.5"
              role="group"
              aria-label="Choose your device"
            >
              <button
                type="button"
                aria-pressed={device === "iphone"}
                onClick={() => setDevice("iphone")}
                className={`min-h-11 px-4 py-2 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 border-[1.5px] transition cursor-pointer ${
                  device === "iphone"
                    ? "bg-[#C8104E] text-white border-[#C8104E] shadow-[0px_4px_12px_0px_rgba(200,16,78,0.25)]"
                    : "bg-white text-slate-900 border-slate-300 hover:border-slate-400"
                }`}
              >
                <svg
                  className="w-4 h-4 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
                </svg>
                <span>iPhone</span>
              </button>

              <button
                type="button"
                aria-pressed={device === "samsung"}
                onClick={() => setDevice("samsung")}
                className={`min-h-11 px-4 py-2 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 border-[1.5px] transition cursor-pointer ${
                  device === "samsung"
                    ? "bg-[#C8104E] text-white border-[#C8104E] shadow-[0px_4px_12px_0px_rgba(200,16,78,0.25)]"
                    : "bg-white text-slate-900 border-slate-300 hover:border-slate-400"
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-tight ${
                    device === "samsung"
                      ? "bg-white text-[#C8104E]"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  SAMSUNG
                </span>
                <span>Samsung Galaxy</span>
              </button>

              <button
                type="button"
                aria-pressed={device === "android"}
                onClick={() => setDevice("android")}
                className={`min-h-11 px-4 py-2 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 border-[1.5px] transition cursor-pointer ${
                  device === "android"
                    ? "bg-[#C8104E] text-white border-[#C8104E] shadow-[0px_4px_12px_0px_rgba(200,16,78,0.25)]"
                    : "bg-white text-slate-900 border-slate-300 hover:border-slate-400"
                }`}
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${
                    device === "android" ? "fill-white" : "fill-green-600"
                  }`}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
                </svg>
                <span>Other Android</span>
              </button>
            </div>

            <div
              aria-hidden="true"
              className="hidden lg:block w-px h-7 bg-slate-300 mx-1"
            />

            {/* Scenario Tabs */}
            <div
              className="flex flex-wrap items-center gap-2.5"
              role="group"
              aria-label="Set-up scenario"
            >
              <span className="text-slate-700 text-sm font-bold mr-1">
                I&apos;m...
              </span>
              <button
                type="button"
                aria-pressed={scenario === "new"}
                onClick={() => setScenario("new")}
                className={`min-h-11 px-4 py-2 rounded-[10px] text-xs font-bold border-[1.5px] transition cursor-pointer ${
                  scenario === "new"
                    ? "bg-[#C8104E] text-white border-[#C8104E]"
                    : "bg-white text-slate-900 border-slate-300 hover:border-slate-400"
                }`}
              >
                Setting up a new eSIM
              </button>
              <button
                type="button"
                aria-pressed={scenario === "replace"}
                onClick={() => setScenario("replace")}
                className={`min-h-11 px-4 py-2 rounded-[10px] text-xs font-bold border-[1.5px] transition cursor-pointer ${
                  scenario === "replace"
                    ? "bg-[#C8104E] text-white border-[#C8104E]"
                    : "bg-white text-slate-900 border-slate-300 hover:border-slate-400"
                }`}
              >
                Replacing or moving my eSIM
              </button>
            </div>
          </div>
        </section>

        {/* ── Section 4: Step-by-Step Guide & Phone Mockups ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] p-5 sm:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
            {/* Left Column: Text Steps */}
            <div className="xl:col-span-4">
              <h2 className="text-slate-900 text-2xl font-extrabold leading-7">
                {guide.heading}
              </h2>
              <p className="mt-1 text-slate-600 text-sm leading-5">
                {guide.subtitle}
              </p>

              <ol className="mt-5 space-y-4">
                {guide.steps.map((step, idx) => (
                  <li key={step.title} className="flex items-start gap-3">
                    <span className="mt-1.5 w-6 h-6 rounded-full bg-[#C8104E] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-[10px] bg-teal-50 border border-emerald-100 text-cyan-900 flex items-center justify-center shrink-0">
                      <StepIcon kind={step.icon} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-slate-900 text-base font-extrabold leading-5">
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-slate-600 text-xs leading-5">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Right Column: 4 Visual Phone Screens */}
            <div className="xl:col-span-8 bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4 items-start">
                {guide.screens.map((screen, idx) => (
                  <div key={screen.caption} className="relative">
                    <PhoneMockup stepNumber={idx + 1} screen={screen} />
                    {idx < guide.screens.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="hidden lg:block absolute -right-3 top-[138px] text-[#C8104E] text-base font-extrabold select-none"
                      >
                        ›
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: What happens next? Card ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] px-5 py-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            <div className="flex items-start gap-3 xl:w-[270px] shrink-0">
              <div className="w-8 h-8 rounded-full ring-2 ring-cyan-900 text-cyan-900 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-slate-900 text-base font-extrabold leading-6">
                  What happens next?
                </h2>
                <p className="text-slate-600 text-xs leading-4 mt-0.5">
                  There are two stages — installation and network activation.
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              <div className="flex-1 px-3.5 py-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-cyan-900 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    eSIM installed
                  </div>
                  <div className="text-slate-600 text-xs leading-4">
                    The eSIM profile is on your device.
                  </div>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="flex justify-center text-slate-500 text-base font-extrabold px-1"
              >
                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
              </div>

              <div className="flex-1 px-3.5 py-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-[#C8104E] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    Activation pending
                  </div>
                  <div className="text-slate-600 text-xs leading-4">
                    We&apos;re activating your plan on our network (usually
                    within minutes).
                  </div>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="flex justify-center text-slate-500 text-base font-extrabold px-1"
              >
                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
              </div>

              <div className="flex-1 px-3.5 py-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    Service active
                  </div>
                  <div className="text-slate-600 text-xs leading-4">
                    You&apos;re connected and ready to use calls, texts and
                    data.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: 4 Quick-Help Action Cards ── */}
        <section aria-label="Additional eSIM help">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => {
                setScenario("replace");
                scrollToSetup();
              }}
              className="text-left p-4 bg-white hover:border-[#C8104E]/40 rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] flex items-center justify-between gap-3 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    Move your eSIM to a new phone
                  </div>
                  <div className="text-slate-600 text-xs leading-4 mt-0.5">
                    Transfer your Zoiko Mobile eSIM safely to another device.
                  </div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-[#C8104E] shrink-0"
                aria-hidden="true"
              />
            </button>

            <Link
              href="/dashboard/sim-and-esim/replace"
              className="p-4 bg-white hover:border-[#C8104E]/40 rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    Replace your eSIM
                  </div>
                  <div className="text-slate-600 text-xs leading-4 mt-0.5">
                    Get a new eSIM if your phone was lost, stolen or replaced.
                  </div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-[#C8104E] shrink-0"
                aria-hidden="true"
              />
            </Link>

            <button
              type="button"
              onClick={() => setTroubleshootOpen(true)}
              className="text-left p-4 bg-white hover:border-[#C8104E]/40 rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] flex items-center justify-between gap-3 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    Troubleshoot eSIM issues
                  </div>
                  <div className="text-slate-600 text-xs leading-4 mt-0.5">
                    Fix common problems, such as a failed download or no signal.
                  </div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-[#C8104E] shrink-0"
                aria-hidden="true"
              />
            </button>

            <Link
              href="/faqs"
              className="p-4 bg-white hover:border-[#C8104E]/40 rounded-2xl border border-slate-200 shadow-[0px_4px_18px_0px_rgba(7,56,66,0.06)] flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold leading-5">
                    Frequently asked questions
                  </div>
                  <div className="text-slate-600 text-xs leading-4 mt-0.5">
                    Answers to common eSIM set-up and activation queries.
                  </div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-[#C8104E] shrink-0"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        {/* ── Section 7: Security Notice Banner ── */}
        <section className="px-5 py-3.5 bg-[#FDF2F6] rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-[#C8104E]">
            <Lock className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-base font-extrabold leading-6">
              Keep your eSIM details secure
            </span>
          </div>
          <div
            aria-hidden="true"
            className="hidden sm:block w-px h-5 bg-rose-300"
          />
          <p className="text-slate-900 text-sm font-semibold leading-5">
            Your QR code and activation details are personal to you. Don&apos;t
            share them with anyone.
          </p>
        </section>
      </div>

      {/* ── Device Compatibility Modal ── */}
      {compatOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compat-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3
                  id="compat-modal-title"
                  className="text-lg font-extrabold text-slate-900"
                >
                  Check device compatibility
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your phone must also be unlocked from any previous network.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setCompatOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-teal-50 border border-emerald-200 text-xs text-cyan-950">
                <span className="font-bold">Quick phone check:</span> Dial{" "}
                <code className="px-1.5 py-0.5 rounded bg-white font-mono font-bold">
                  *#06#
                </code>{" "}
                on your handset. If an <span className="font-bold">EID</span>{" "}
                number appears, your phone supports eSIM.
              </div>

              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={compatQuery}
                  onChange={(e) => setCompatQuery(e.target.value)}
                  placeholder="Search model (e.g. iPhone 15, Galaxy S24, Pixel 8)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#C8104E]"
                />
              </div>

              <div className="space-y-3">
                {filteredDevices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No matching model found in this quick list. Dial{" "}
                    <span className="font-semibold">*#06#</span> on your device
                    to verify EID support.
                  </p>
                ) : (
                  filteredDevices.map((group) => (
                    <div
                      key={group.brand}
                      className="rounded-2xl border border-slate-200 p-3.5"
                    >
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#C8104E] mb-2">
                        {group.brand}
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {group.models.map((model) => (
                          <li key={model} className="flex items-center gap-2">
                            <Check
                              className="w-3.5 h-3.5 text-green-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{model}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href="/devices"
                  className="text-xs font-bold text-[#C8104E] hover:underline"
                >
                  Browse compatible devices ›
                </Link>
                <button
                  type="button"
                  onClick={() => setCompatOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Troubleshoot eSIM Issues Modal ── */}
      {troubleshootOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="troubleshoot-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3
                  id="troubleshoot-modal-title"
                  className="text-lg font-extrabold text-slate-900"
                >
                  Troubleshoot eSIM issues
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Quick fixes for common installation and activation problems.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setTroubleshootOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {TROUBLESHOOT_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
                >
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-5 mt-1">
                    {item.fix}
                  </p>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href="/contact-us"
                  className="text-xs font-bold text-[#C8104E] hover:underline"
                >
                  Still stuck? Contact our UK team ›
                </Link>
                <button
                  type="button"
                  onClick={() => setTroubleshootOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

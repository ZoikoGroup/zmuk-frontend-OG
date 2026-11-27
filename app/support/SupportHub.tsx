"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Zap,
  Users,
  Award,
  User,
  Check,
  ChevronRight,
  Smartphone,
  CreditCard,
  Radio,
  Globe,
  RefreshCw,
  Cpu,
  Layers,
  Package,
  AlertTriangle,
  Lock,
  FileWarning,
  MessageSquare,
  Phone,
  Mail,
  Wrench,
  Headphones,
  X,
} from "lucide-react";
import { CopyEmailButton, supportGmailHref } from "../components/EmailSupport";

import { openChat } from "../components/ChatbotWidget";
import { isLoggedIn as checkIsLoggedIn } from "../utils/auth";

interface SupportTopicItem {
  title: string;
  description: string;
  href: string;
  highlight?: boolean;
  icon: "sim" | "billing" | "network" | "roaming" | "orders" | "account";
  keywords: string;
}

interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  variant: "pink" | "teal";
  icon: "sim" | "esim" | "topup" | "track";
  keywords: string;
}

interface SearchItem {
  title: string;
  description: string;
  category: string;
  href: string;
  keywords: string;
}

const POPULAR_SEARCHES = [
  { label: "Activate my SIM", href: "/activate-your-sim" },
  { label: "eSIM set-up", href: "/esim-setup-guidance" },
  { label: "Check coverage", href: "/coverage-checker" },
  { label: "Switch to Zoiko", href: "/switch-and-save" },
];

const SUPPORT_TOPICS: SupportTopicItem[] = [
  {
    title: "SIM & eSIM",
    description: "Activate, set up, replace or fix your SIM.",
    href: "/esim-setup-guidance",
    highlight: true,
    icon: "sim",
    keywords: "sim esim qr code activate replace lost stolen",
  },
  {
    title: "Billing & payments",
    description: "Bills, charges, payments and refunds.",
    href: "/dashboard/bills-and-payments",
    icon: "billing",
    keywords: "bill billing invoice payment card direct debit refund charge",
  },
  {
    title: "Network & coverage",
    description: "Signal, coverage, outages and service updates.",
    href: "/coverage-checker",
    icon: "network",
    keywords: "signal 5g 4g coverage outage network status data not working",
  },
  {
    title: "Roaming & calls",
    description: "Use your plan in the UK and abroad.",
    href: "/roaming-and-coverage",
    icon: "roaming",
    keywords: "roaming abroad eu travel international calls data pass",
  },
  {
    title: "Orders & switching",
    description: "Track orders, delivery, PAC code and switching.",
    href: "/switch-and-save",
    icon: "orders",
    keywords: "pac stac switch keep number order delivery tracking",
  },
  {
    title: "Account & plans",
    description: "Update your details, manage your plan and extras.",
    href: "/dashboard",
    icon: "account",
    keywords: "account profile password change plan upgrade allowance booster",
  },
];

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: "Activate your SIM",
    description: "Get set up and start using your plan.",
    href: "/activate-your-sim",
    variant: "pink",
    icon: "sim",
    keywords: "activate my sim iccid start plan",
  },
  {
    title: "eSIM set-up",
    description: "A step-by-step guide to install and activate eSIM.",
    href: "/esim-setup-guidance",
    variant: "pink",
    icon: "esim",
    keywords: "esim setup iphone samsung android qr code",
  },
  {
    title: "Top up your plan",
    description: "Add credit or a data bundle to your account.",
    href: "/recharge",
    variant: "teal",
    icon: "topup",
    keywords: "top up recharge credit data booster bundle",
  },
  {
    title: "Track an order",
    description: "Check the status of your device or SIM order.",
    href: "/dashboard/orders",
    variant: "pink",
    icon: "track",
    keywords: "track order delivery dispatch sim device",
  },
];

const EXTRA_SEARCH_ITEMS: SearchItem[] = [
  {
    title: "Change or upgrade your plan",
    description: "Compare eligible monthly plans for your Zoiko line.",
    category: "Account & plans",
    href: "/dashboard/compare-plans",
    keywords: "change plan upgrade downgrade compare tariff",
  },
  {
    title: "Check data not working / troubleshooting",
    description: "Fix common eSIM download, APN, and mobile signal issues.",
    category: "Help & guides",
    href: "/esim-setup-guidance",
    keywords: "data not working no signal apn troubleshoot fix",
  },
  {
    title: "Lost or stolen SIM replacement",
    description: "Secure your number and order a replacement SIM or eSIM.",
    category: "Urgent help",
    href: "/dashboard/sim-and-esim/replace",
    keywords: "lost stolen sim lock block replace",
  },
  {
    title: "Plan FAQs & general help",
    description: "Answers to common questions on plans, SIMs, and roaming.",
    category: "FAQs",
    href: "/faqs",
    keywords: "faq questions help answers",
  },
];

function TopicIcon({ kind }: { kind: SupportTopicItem["icon"] }) {
  switch (kind) {
    case "sim":
      return <Smartphone className="w-5 h-5" aria-hidden="true" />;
    case "billing":
      return <CreditCard className="w-5 h-5" aria-hidden="true" />;
    case "network":
      return <Radio className="w-5 h-5" aria-hidden="true" />;
    case "roaming":
      return <Globe className="w-5 h-5" aria-hidden="true" />;
    case "orders":
      return <RefreshCw className="w-5 h-5" aria-hidden="true" />;
    case "account":
      return <User className="w-5 h-5" aria-hidden="true" />;
  }
}

function ActionIcon({ kind }: { kind: QuickActionItem["icon"] }) {
  switch (kind) {
    case "sim":
      return <Smartphone className="w-5 h-5" aria-hidden="true" />;
    case "esim":
      return <Cpu className="w-5 h-5" aria-hidden="true" />;
    case "topup":
      return <Layers className="w-5 h-5" aria-hidden="true" />;
    case "track":
      return <Package className="w-5 h-5" aria-hidden="true" />;
  }
}

export function SupportHub() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoggedIn(checkIsLoggedIn());
  }, []);

  const activeQuery = (submittedQuery || searchInput).trim();

  const searchIndex = useMemo<SearchItem[]>(() => {
    return [
      ...SUPPORT_TOPICS.map((t) => ({
        title: t.title,
        description: t.description,
        category: "Support topic",
        href: t.href,
        keywords: t.keywords,
      })),
      ...QUICK_ACTIONS.map((a) => ({
        title: a.title,
        description: a.description,
        category: "Quick action",
        href: a.href,
        keywords: a.keywords,
      })),
      ...EXTRA_SEARCH_ITEMS,
    ];
  }, []);

  const searchResults = useMemo(() => {
    if (!activeQuery) return [];
    const terms = activeQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return searchIndex.filter((item) => {
      const haystack =
        `${item.title} ${item.description} ${item.category} ${item.keywords}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [activeQuery, searchIndex]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSubmittedQuery("");
  };

  const focusSearch = () => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => searchInputRef.current?.focus(), 250);
  };

  return (
    <div className="bg-slate-100 text-slate-900">
      {/* ── Section 1: Hero Banner ── */}
      <section className="relative min-h-[320px] flex items-center overflow-hidden bg-[#5A002B]">
        <Image
          src="/images/Section (1).png"
          alt="Zoiko Mobile UK Support Hub"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] lg:object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#4A0022]/85 via-[#4A0022]/45 to-transparent lg:from-[#4A0022]/30 lg:via-transparent"
        />

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-7 py-8 sm:py-10">
          <p className="text-white/90 text-base font-bold leading-5">
            Zoiko Mobile UK
          </p>
          <h1 className="mt-1 text-4xl sm:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
            Support Hub
          </h1>
          <p className="mt-3 max-w-[520px] text-base font-medium text-white/95 leading-6">
            Find answers, fix issues, manage your service and get the help you
            need — quickly and easily.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 max-w-[660px]"
            role="search"
            aria-label="Search Support Hub"
          >
            <div className="min-h-12 pl-4 pr-1.5 py-[5px] bg-white rounded-full shadow-[0px_10px_28px_0px_rgba(0,0,0,0.22)] flex items-center gap-2.5">
              <Search
                className="w-5 h-5 text-slate-500 shrink-0"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (!e.target.value.trim()) setSubmittedQuery("");
                }}
                placeholder='Search for help, e.g. "activate my SIM", "data not working" or "change plan"'
                className="flex-1 min-w-0 h-10 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-500 focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={clearSearch}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="min-h-10 px-6 py-2 bg-[#C8104E] hover:bg-[#a80c41] text-white text-sm font-bold rounded-full transition cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="text-white text-sm font-bold leading-5">
              Popular searches:
            </span>
            {POPULAR_SEARCHES.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="min-h-8 px-3.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-950/60 rounded-full ring-1 ring-white/70 backdrop-blur-[6px] inline-flex items-center gap-1.5 text-white text-xs font-semibold transition"
              >
                <span>{item.label}</span>
                <span aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: 4-Item Trust Strip ── */}
      <section className="bg-white border-b border-slate-200 py-3.5">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200">
            <div className="px-2.5 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-slate-900 text-sm font-extrabold leading-4">
                  Get help fast
                </div>
                <div className="text-slate-600 text-xs leading-4 mt-0.5">
                  Answers and guided fixes
                </div>
              </div>
            </div>

            <div className="px-2.5 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-slate-900 text-sm font-extrabold leading-4">
                  Self-service 24/7
                </div>
                <div className="text-slate-600 text-xs leading-4 mt-0.5">
                  Manage your service online
                </div>
              </div>
            </div>

            <div className="px-2.5 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-slate-900 text-sm font-extrabold leading-4">
                  Talk to our team
                </div>
                <div className="text-slate-600 text-xs leading-4 mt-0.5">
                  When you need extra help
                </div>
              </div>
            </div>

            <div className="px-2.5 py-2 flex items-center justify-start lg:justify-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-slate-900 text-sm font-extrabold leading-4">
                  Trusted UK support
                </div>
                <div className="text-slate-600 text-xs leading-4 mt-0.5">
                  Real people, here for you
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-7 pt-6 pb-12 space-y-5">
        {/* Search Results Panel (shown when user searches) */}
        {activeQuery && (
          <section
            aria-live="polite"
            className="bg-white rounded-2xl border border-[#C8104E]/25 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] p-5"
          >
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Search results for &ldquo;{activeQuery}&rdquo;
                </h2>
                <p className="text-xs text-slate-600">
                  {searchResults.length}{" "}
                  {searchResults.length === 1 ? "match" : "matches"} found
                </p>
              </div>
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs font-bold text-[#C8104E] hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  No exact help topics matched &ldquo;{activeQuery}&rdquo;. Try
                  asking Zovie for instant answers or browse topics below.
                </p>
                <button
                  type="button"
                  onClick={openChat}
                  className="px-4 py-2 rounded-full bg-[#C8104E] text-white text-xs font-bold hover:bg-[#a80c41] cursor-pointer shrink-0"
                >
                  Ask Zovie ›
                </button>
              </div>
            ) : (
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((res) => (
                  <Link
                    key={`${res.category}-${res.title}`}
                    href={res.href}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-[#FDF2F6]/60 border border-slate-200 hover:border-[#C8104E]/40 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8104E]">
                        {res.category}
                      </span>
                      <div className="text-sm font-extrabold text-slate-900">
                        {res.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {res.description}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 text-[#C8104E] shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Section 3: 2-Column Main Hub (MyZoiko Sidebar + Topics & Actions) ── */}
        <section className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column: MyZoiko Account Card */}
          <aside className="w-full lg:w-[300px] xl:w-[316px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] overflow-hidden">
            <div className="px-5 py-4 bg-cyan-950 flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full ring-[1.5px] ring-white/75 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-base font-extrabold leading-5">
                Your Zoiko account
                <br />
                (MyZoiko)
              </h2>
            </div>

            <div className="px-5 pt-4 pb-5">
              <p className="text-slate-700 text-sm leading-5">
                Sign in to manage your plan, usage, bills, orders and support
                requests.
              </p>

              <div className="mt-4">
                <Link
                  href={loggedIn ? "/dashboard" : "/login"}
                  className="w-full min-h-11 px-4 py-2.5 bg-[#C8104E] hover:bg-[#a80c41] text-white text-sm font-bold rounded-full inline-flex items-center justify-center gap-2 transition"
                >
                  <span>
                    {loggedIn ? "Go to MyZoiko" : "Sign in to MyZoiko"}
                  </span>
                  <span aria-hidden="true">›</span>
                </Link>
              </div>

              <ul className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                {[
                  {
                    label: "Check your usage & allowances",
                    href: "/dashboard/usage-and-allowances",
                  },
                  {
                    label: "View and pay your bills",
                    href: "/dashboard/bills-and-payments",
                  },
                  {
                    label: "Manage or change your plan",
                    href: "/dashboard/compare-plans",
                  },
                  {
                    label: "Track orders and deliveries",
                    href: "/dashboard/orders",
                  },
                  {
                    label: "See your support requests",
                    href: "/dashboard/support",
                  },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-2.5 text-slate-900 hover:text-[#C8104E] text-sm font-bold leading-5 transition"
                    >
                      <span className="w-5 h-5 rounded-full bg-cyan-900 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right Column: Support by Topic + Popular Help & Quick Actions */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-slate-900 text-2xl font-extrabold leading-9">
                Get support by topic
              </h2>
              <Link
                href="/faqs"
                className="text-[#C8104E] hover:underline text-sm font-bold inline-flex items-center gap-1"
              >
                <span>View all help topics</span>
                <span aria-hidden="true">›</span>
              </Link>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {SUPPORT_TOPICS.map((topic) => (
                <Link
                  key={topic.title}
                  href={topic.href}
                  className="p-4 bg-white hover:border-[#C8104E]/40 rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        topic.highlight
                          ? "bg-[#FDF2F6] text-[#C8104E]"
                          : "bg-teal-50 text-cyan-900"
                      }`}
                    >
                      <TopicIcon kind={topic.icon} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-slate-900 text-base font-extrabold leading-5">
                        {topic.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-4 mt-0.5">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-[#C8104E] shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-slate-900 text-xl font-extrabold leading-8">
                Popular help &amp; quick actions
              </h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="p-3.5 bg-white hover:border-[#C8104E]/40 rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] flex items-center justify-between gap-2.5 transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          action.variant === "pink"
                            ? "bg-[#FDF2F6] text-[#C8104E]"
                            : "bg-teal-50 text-cyan-900"
                        }`}
                      >
                        <ActionIcon kind={action.icon} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-slate-900 text-sm font-extrabold leading-5">
                          {action.title}
                        </h3>
                        <p className="text-slate-600 text-xs leading-4 mt-0.5">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 text-[#C8104E] shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Need Urgent Help? Banner ── */}
        <section className="px-5 py-4 bg-gradient-to-r from-rose-100 to-rose-50 rounded-2xl border border-rose-200 flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex items-center gap-3.5 xl:w-[300px] shrink-0">
            <div className="w-11 h-11 bg-white rounded-xl shadow-[0px_3px_10px_0px_rgba(200,16,78,0.12)] flex items-center justify-center text-[#C8104E] shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-[#C8104E] text-lg font-extrabold leading-6">
                Need urgent help?
              </h2>
              <p className="text-slate-900 text-xs leading-4 mt-0.5">
                If your phone, SIM or account may be at risk, get help right
                away.
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/dashboard/sim-and-esim/replace"
              className="px-4 py-3 bg-white hover:border-[#C8104E]/50 rounded-xl shadow-[0px_2px_8px_0px_rgba(200,16,78,0.06)] border border-rose-200 flex items-center justify-between gap-2.5 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 bg-[#FDF2F6] text-[#C8104E] rounded-xl flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold">
                    Lost or stolen SIM
                  </div>
                  <div className="text-slate-600 text-xs">
                    Secure your number
                  </div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-[#C8104E] shrink-0"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/contact-us"
              className="px-4 py-3 bg-white hover:border-[#C8104E]/50 rounded-xl shadow-[0px_2px_8px_0px_rgba(200,16,78,0.06)] border border-rose-200 flex items-center justify-between gap-2.5 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 bg-[#FDF2F6] text-[#C8104E] rounded-xl flex items-center justify-center shrink-0">
                  <FileWarning className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold">
                    Report suspected fraud
                  </div>
                  <div className="text-slate-600 text-xs">
                    Tell us about a potential scam
                  </div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-[#C8104E] shrink-0"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/coverage-checker"
              className="px-4 py-3 bg-white hover:border-[#C8104E]/50 rounded-xl shadow-[0px_2px_8px_0px_rgba(200,16,78,0.06)] border border-rose-200 flex items-center justify-between gap-2.5 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 bg-[#FDF2F6] text-[#C8104E] rounded-xl flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 text-sm font-extrabold">
                    Check network status
                  </div>
                  <div className="text-slate-600 text-xs">
                    See live updates and outages
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

        {/* ── Section 5: How to get the help you need ── */}
        <section className="px-5 py-5 bg-white rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)]">
          <div className="flex flex-col xl:flex-row xl:items-center gap-6">
            <div className="xl:w-[270px] shrink-0">
              <h2 className="text-slate-900 text-lg font-extrabold leading-6">
                How to get the help you need
              </h2>
              <p className="text-slate-600 text-xs leading-5 mt-1">
                A simple way to find an answer or get support.
              </p>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Step 1 */}
              <div className="relative flex items-start gap-2.5">
                <span className="mt-2 w-6 h-6 rounded-full bg-[#C8104E] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                  1
                </span>
                <button
                  type="button"
                  onClick={focusSearch}
                  className="flex-1 text-center flex flex-col items-center hover:opacity-80 transition cursor-pointer"
                >
                  <Search
                    className="w-5 h-5 text-slate-900 mb-1"
                    aria-hidden="true"
                  />
                  <span className="text-slate-900 text-sm font-extrabold leading-5">
                    Find an answer
                  </span>
                  <span className="text-slate-600 text-xs leading-4 mt-0.5">
                    Search our help articles and guides.
                  </span>
                </button>
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute -right-3 top-5 text-[#C8104E] text-lg font-extrabold"
                >
                  ›
                </span>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-2.5">
                <span className="mt-2 w-6 h-6 rounded-full bg-[#C8104E] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                  2
                </span>
                <Link
                  href="/esim-setup-guidance"
                  className="flex-1 text-center flex flex-col items-center hover:opacity-80 transition"
                >
                  <Wrench
                    className="w-5 h-5 text-slate-900 mb-1"
                    aria-hidden="true"
                  />
                  <span className="text-slate-900 text-sm font-extrabold leading-5">
                    Try a quick fix
                  </span>
                  <span className="text-slate-600 text-xs leading-4 mt-0.5">
                    Follow step-by-step troubleshooting.
                  </span>
                </Link>
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute -right-3 top-5 text-[#C8104E] text-lg font-extrabold"
                >
                  ›
                </span>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-2.5">
                <span className="mt-2 w-6 h-6 rounded-full bg-[#C8104E] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                  3
                </span>
                <button
                  type="button"
                  onClick={openChat}
                  className="flex-1 text-center flex flex-col items-center hover:opacity-80 transition cursor-pointer"
                >
                  <MessageSquare
                    className="w-5 h-5 text-slate-900 mb-1"
                    aria-hidden="true"
                  />
                  <span className="text-slate-900 text-sm font-extrabold leading-5">
                    Ask Zovie
                  </span>
                  <span className="text-slate-600 text-xs leading-4 mt-0.5">
                    Get instant help from our virtual assistant.
                  </span>
                </button>
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute -right-3 top-5 text-[#C8104E] text-lg font-extrabold"
                >
                  ›
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-2.5">
                <span className="mt-2 w-6 h-6 rounded-full bg-[#C8104E] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                  4
                </span>
                <Link
                  href="/contact-us"
                  className="flex-1 text-center flex flex-col items-center hover:opacity-80 transition"
                >
                  <Headphones
                    className="w-5 h-5 text-slate-900 mb-1"
                    aria-hidden="true"
                  />
                  <span className="text-slate-900 text-sm font-extrabold leading-5">
                    Talk to our team
                  </span>
                  <span className="text-slate-600 text-xs leading-4 mt-0.5">
                    Get expert support from our UK team.
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: 3 Contact Channel Cards ── */}
        <section
          aria-label="Contact options"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Card 1: Chat with Zovie */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-slate-900 text-base font-extrabold leading-6">
                  Chat with Zovie
                </h3>
                <span className="px-2.5 py-[3px] bg-cyan-900 text-white text-xs font-bold rounded-full leading-4">
                  Available 24/7
                </span>
              </div>
              <p className="mt-1 text-slate-700 text-xs leading-5">
                Get quick answers and guided support from our virtual assistant.
              </p>
              <button
                type="button"
                onClick={openChat}
                className="mt-3 w-full min-h-10 bg-white hover:bg-[#FDF2F6] rounded-full ring-[1.5px] ring-[#C8104E] text-[#C8104E] text-sm font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Start chat</span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>

          {/* Card 2: Call us */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 text-base font-extrabold leading-6">
                Call us
              </h3>
              <p className="mt-1 text-slate-700 text-xs leading-5">
                Mon–Fri, 8am–8pm &nbsp;|&nbsp; Sat–Sun, 9am–6pm
              </p>
              <a
                href="tel:03330040333"
                className="mt-1 inline-block text-[#C8104E] hover:underline text-xl font-extrabold leading-7"
              >
                0333 004 0333
              </a>
            </div>
          </div>

          {/* Card 3: Email us */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-[0px_3px_14px_0px_rgba(7,56,66,0.05)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF2F6] text-[#C8104E] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 text-base font-extrabold leading-6">
                Email us
              </h3>
              {/* PREVIOUS: href="mailto:help@zoikomobile.co.uk" (does nothing without a mail app) */}
              <a
                href={supportGmailHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[#C8104E] hover:underline text-base font-extrabold leading-5 break-all"
              >
                help@zoikomobile.co.uk
              </a>
              <p className="mt-1 text-slate-600 text-xs leading-5">
                We&apos;ll usually reply within 24 hours.
              </p>
              <CopyEmailButton className="mt-2" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SupportHub;

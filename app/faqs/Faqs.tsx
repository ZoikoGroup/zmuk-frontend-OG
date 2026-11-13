"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

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

const IconSearch = () => (
  <Svg className="h-5 w-5 text-[#141A45]">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </Svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <Svg
    className={`h-5 w-5 shrink-0 text-[#C80F57] transition-transform duration-200 ${
      open ? "rotate-180" : ""
    }`}
  >
    <path d="M6 9l6 6 6-6" strokeWidth="2.2" />
  </Svg>
);

const IconContract = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </Svg>
);

const IconBill = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M7 15h2M15 15h2" />
  </Svg>
);

const IconSim = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M9 13v5M15 13v5M9 13h6" />
  </Svg>
);

const IconSwitch = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />
  </Svg>
);

const IconGlobe = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

const IconTag = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Svg>
);

const IconBriefcase = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Svg>
);

const IconWrench = () => (
  <Svg className="h-4 w-4 text-[#C80F57]">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </Svg>
);

const IconChat = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
);

const IconPhone = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const IconComplaint = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M12 18h.01M12 11v4" />
  </Svg>
);

const IconAccessibility = () => (
  <Svg className="h-6 w-6 text-[#C80F57]">
    <circle cx="12" cy="4" r="2" />
    <path d="M4 8h16M12 8v13M8 21l4-7 4 7" />
  </Svg>
);

// ─── FAQ Data Structures ──────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  isBusiness?: boolean;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "basics",
    title: "Plan basics and contract terms",
    icon: <IconContract />,
    items: [
      {
        id: "basics-1",
        q: "What contract lengths can I choose?",
        a: "We offer 24-month, 12-month, and flexible 30-day rolling plans across our SIM-only range. Your contract duration is clearly displayed on every plan card before you join.",
      },
      {
        id: "basics-2",
        q: "How do 30-day plans work?",
        a: "A 30-day plan gives you the flexibility of no long-term commitment. It renews automatically every 30 days until you choose to cancel, pause, or switch to another plan.",
      },
      {
        id: "basics-3",
        q: "What does “unlimited” mean on a plan?",
        a: "Unlimited calls and texts mean no capped minute or message limits for standard UK personal usage, subject to our standard fair usage policy. Unlimited data plans let you browse, stream, and download without a monthly data allowance cap.",
      },
      {
        id: "basics-4",
        q: "When does my allowance reset?",
        a: "Your data, minutes, and text allowances reset on the same day each month, corresponding to the date your plan first activated.",
      },
      {
        id: "basics-5",
        q: "How do I choose the right plan?",
        a: "Consider how you use your phone each day. Light browsing and messaging suit 1GB–5GB, regular streaming and social media suit 10GB–30GB, while heavy video streaming, tethering, or gaming benefit from 50GB to Unlimited data.",
      },
    ],
  },
  {
    id: "costs",
    title: "Costs, bills and payment",
    icon: <IconBill />,
    items: [
      {
        id: "costs-1",
        q: "What will I pay each month?",
        a: "You will pay the fixed monthly price shown for your chosen plan and contract length. All consumer personal plans show prices inclusive of VAT.",
      },
      {
        id: "costs-2",
        q: "Are there any other charges?",
        a: "There are no surprise administrative fees. Out-of-bundle activity (such as premium rate numbers, non-inclusive international calls, or roaming outside standard destinations) is billed according to our published rates.",
      },
      {
        id: "costs-3",
        q: "Can my price change during my contract?",
        a: "Any terms regarding price changes or CPI adjustments will be clearly outlined in your pre-contract summary before you agree to sign up.",
      },
      {
        id: "costs-4",
        q: "Do prices include VAT?",
        a: "Consumer plans display prices including VAT. For business plans, both ex-VAT and inc-VAT rates are displayed per line.",
      },
    ],
  },
  {
    id: "sim",
    title: "SIM, eSIM and activation",
    icon: <IconSim />,
    items: [
      {
        id: "sim-1",
        q: "Should I choose eSIM or a physical SIM?",
        a: "eSIM activates digitally within minutes if your handset supports eSIM technology. If your phone takes a physical SIM card or does not support eSIM, choose a free triple-format physical SIM (standard, micro, and nano).",
      },
      {
        id: "sim-2",
        q: "How do I activate my SIM?",
        a: "For physical SIMs, pop the SIM into your phone and visit zoikomobile.co.uk/activate-your-sim. For eSIMs, scan the activation QR code sent to your confirmation email.",
      },
      {
        id: "sim-3",
        q: "Do I get 5G?",
        a: "Yes! All Zoiko plans include 5G connectivity at no additional charge, wherever 5G coverage is available and with a 5G-ready device.",
      },
    ],
  },
  {
    id: "switching",
    title: "Switching and keeping your number",
    icon: <IconSwitch />,
    items: [
      {
        id: "switching-1",
        q: "Can I keep my number?",
        a: "Yes, transferring your number is completely free. Simply text “PAC” to 65075 from your old mobile network, then enter your 9-digit code during checkout or anytime after receiving your SIM.",
      },
      {
        id: "switching-2",
        q: "What’s the difference between a PAC and a STAC?",
        a: "A PAC (Porting Authorisation Code) lets you transfer your existing phone number over to Zoiko. A STAC (Service Termination Authorisation Code) terminates your old number and assigns you a fresh new Zoiko number.",
      },
      {
        id: "switching-3",
        q: "Do I pay when I submit a Switch & Save request?",
        a: "No, submitting a Switch & Save quote request is free with no upfront cost or obligation until you review and confirm your selected deal.",
      },
      {
        id: "switching-4",
        q: "How long does switching take?",
        a: "Number transfers usually complete within one working day once your PAC code is submitted before the network cut-off time (5pm Monday–Friday).",
      },
    ],
  },
  {
    id: "roaming",
    title: "Roaming and international calls",
    icon: <IconGlobe />,
    items: [
      {
        id: "roaming-1",
        q: "What’s the difference between roaming and international calls?",
        a: "Roaming is using your phone while you are physically outside the UK. International calling means making calls from within the UK to foreign phone numbers.",
      },
      {
        id: "roaming-2",
        q: "Can I use my plan in the EU?",
        a: "Yes, EU roaming is available across eligible plans subject to fair usage limits and supported roaming destination zones.",
      },
      {
        id: "roaming-3",
        q: "Are international calls included?",
        a: "Standard UK plans do not include international calls from the UK by default, but you can add flexible international call bundles anytime.",
      },
    ],
  },
  {
    id: "offers",
    title: "Offers and eligibility",
    icon: <IconTag />,
    items: [
      {
        id: "offers-1",
        q: "Who can get a student plan?",
        a: "Students currently enrolled in an accredited UK college or university with a verified .ac.uk email address or valid student card qualify for student discounts.",
      },
      {
        id: "offers-2",
        q: "Who qualifies for the public sector offer?",
        a: "NHS workers, emergency personnel, civil servants, and teachers with an official public sector email address or ID qualify for our exclusive public sector plan rates.",
      },
      {
        id: "offers-3",
        q: "Can I combine offers?",
        a: "Generally, promotional vouchers and sector discounts cannot be combined on a single line unless explicitly stated in the offer details.",
      },
    ],
  },
  {
    id: "business",
    title: "Business and multi-line",
    icon: <IconBriefcase />,
    isBusiness: true,
    items: [
      {
        id: "business-1",
        q: "How are business prices shown?",
        a: "Every business plan displays prices both excluding VAT and including VAT per line, making expense filing and cashflow budgeting easy.",
      },
      {
        id: "business-2",
        q: "Can I order several business lines?",
        a: "Yes! You can order multiple lines for employees and sole-trader teams under a consolidated account. Contact our business sales team for customized volume quotes.",
      },
      {
        id: "business-3",
        q: "Do business data SIMs include calls?",
        a: "Standard Business SIM-only plans include unlimited voice calls and texts. Dedicated data-only SIMs for laptops, tablets, or routers do not include call allowances.",
      },
    ],
  },
  {
    id: "account",
    title: "Account, top-up and troubleshooting",
    icon: <IconWrench />,
    items: [
      {
        id: "account-1",
        q: "How do I top up?",
        a: "You can top up your balance online via the Top-up page or directly within your My Zoiko portal using any major credit/debit card.",
      },
      {
        id: "account-2",
        q: "Where can I see my usage and bills?",
        a: "Log in to your My Zoiko dashboard to view remaining data allowances, download monthly VAT statements, and view call history in real time.",
      },
      {
        id: "account-3",
        q: "I’ve lost signal — what should I do?",
        a: "First, restart your device or toggle Flight Mode on and off for 10 seconds. Check the Zoiko coverage checker for any local mast maintenance, and confirm your SIM card is firmly seated.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Faqs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "basics-1": true, // start with first question open for immediate preview
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter categories and questions based on category selection & search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return FAQ_CATEGORIES.map((cat) => {
      // Check if category is selected
      if (selectedCategory !== "all" && cat.id !== selectedCategory) {
        return null;
      }

      if (!q) {
        return cat;
      }

      // Filter items within category matching query
      const matchingItems = cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
      );

      if (matchingItems.length === 0) return null;

      return {
        ...cat,
        items: matchingItems,
      };
    }).filter(Boolean) as FAQCategory[];
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full bg-[#f8f9fa] font-sans text-[#141A45]">
      {/* ── Section 1: Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#f7f8f9] via-[#fafbfc] to-white pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[860px] flex-col items-center text-center">
            
            {/* Tagline / Overline */}
            <div className="flex flex-col items-center gap-2.5">
              <span className="text-sm font-extrabold uppercase tracking-[4.07px] text-[#141A45] sm:text-base">
                Help with plans
              </span>
              <div className="h-1 w-28 rounded-full bg-[#FA2268] sm:w-32" />
            </div>

            {/* Main Heading */}
            <div className="pt-4 sm:pt-5">
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[60px]">
                <span className="block text-[#0D382D]">Plan</span>
                <span className="block text-[#C80F57]">questions, answered</span>
              </h1>
            </div>

            {/* Subheading */}
            <div className="pt-3 sm:pt-4">
              <p className="text-lg font-bold leading-snug text-[#141A45] sm:text-2xl">
                Find out what you’re buying, what it costs and what to do next.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mt-6 w-full max-w-[720px] sm:mt-8">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative flex w-full items-center rounded-full border border-gray-200 bg-white p-2 shadow-[0px_18px_40px_-24px_rgba(20,26,69,0.30)] transition-all focus-within:border-[#C80F57] focus-within:ring-2 focus-within:ring-[#C80F57]/20 sm:p-2.5"
              >
                <div className="flex items-center pl-3 sm:pl-4">
                  <IconSearch />
                  <div className="mx-2.5 h-6 w-px bg-gray-200 sm:mx-3" />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search, e.g. keep my number, eSIM, 30-day"
                  aria-label="Search FAQs"
                  className="w-full flex-1 bg-transparent text-sm text-[#141A45] placeholder-[#7a7f96] outline-none sm:text-base"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mr-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}

                <button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] px-6 py-3 text-sm font-extrabold text-white shadow-[0px_10px_20px_-12px_rgba(200,15,87,0.70)] transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-7 sm:py-3.5 sm:text-base"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Helper link under search */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1 text-center text-xs text-[#4E5A8A] sm:text-sm">
              <span>Questions about your own line or bill?</span>
              <Link
                href="/login"
                className="font-bold text-[#C80F57] hover:underline"
              >
                Sign in to My Zoiko
              </Link>
              <span>— don’t enter account details here.</span>
            </div>

          </div>
        </div>

        {/* Bottom subtle divider ribbon */}
        <div className="relative mt-8 w-full overflow-hidden pointer-events-none sm:mt-12">
          <div className="h-1 w-full bg-gradient-to-r from-[#FA2268] via-[#C80F57] to-[#FA2268] opacity-75 sm:h-1.5" />
        </div>
      </section>

      {/* ── Section 2: Filter Pills & FAQ Accordions ── */}
      <section className="bg-gradient-to-b from-white to-[#fafbfc] px-4 pt-8 pb-20 sm:px-6 sm:pt-10 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          
          {/* Topic Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pb-10 sm:gap-3 sm:pb-12">
            {/* "All topics" pill */}
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-[#FA2268] to-[#C80F57] text-white shadow-md shadow-rose-500/20"
                  : "border border-gray-200 bg-white text-[#141A45] hover:border-[#FA2268] hover:text-[#C80F57]"
              }`}
            >
              All topics
            </button>

            {/* Category pills */}
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? "border-transparent bg-gradient-to-r from-[#FA2268] to-[#C80F57] text-white shadow-md shadow-rose-500/20"
                    : "border-gray-200 bg-white text-[#141A45] hover:border-[#FA2268] hover:text-[#C80F57]"
                }`}
              >
                <span className={selectedCategory === cat.id ? "text-white" : ""}>
                  {cat.icon}
                </span>
                <span>{cat.title}</span>
              </button>
            ))}
          </div>

          {/* Accordion Categories Container */}
          <div className="mx-auto max-w-[920px] space-y-10 sm:space-y-12">
            {filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <p className="text-lg font-bold text-[#141A45]">
                  No plan questions found matching “{searchQuery}”.
                </p>
                <p className="mt-2 text-sm text-[#4E5A8A]">
                  Try searching for another topic or clear the search filter above.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-5 inline-flex items-center rounded-full bg-gradient-to-r from-[#FA2268] to-[#C80F57] px-6 py-2.5 text-sm font-bold text-white shadow-md"
                >
                  Show all questions
                </button>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="flex flex-col gap-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fdf1f5] text-[#C80F57] shadow-sm">
                      {category.icon}
                    </div>
                    <h2 className="text-xl font-extrabold text-[#0D382D] sm:text-2xl">
                      {category.title}
                    </h2>
                  </div>

                  {/* Accordion items */}
                  <div className="flex flex-col gap-3">
                    {category.items.map((item) => {
                      const isOpen = !!openItems[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`overflow-hidden rounded-2xl bg-white shadow-[0px_10px_24px_-22px_rgba(20,26,69,0.30)] transition-all duration-200 ${
                            category.isBusiness
                              ? "border-l-[5px] border-r border-t border-b border-[#0D382D]"
                              : "border border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors sm:px-6 sm:py-4.5"
                          >
                            <span className="text-base font-extrabold text-[#141A45] sm:text-[17px]">
                              {item.q}
                            </span>
                            <IconChevron open={isOpen} />
                          </button>

                          {isOpen && (
                            <div className="border-t border-gray-100 px-4 pt-3 pb-5 text-sm leading-relaxed text-[#4E5A8A] sm:px-6 sm:text-base">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* ── Section 3: "Still need help? Talk to us" ── */}
      <section className="bg-gradient-to-b from-[#fafbfc] to-white px-4 pt-12 pb-20 sm:px-6 sm:pt-16 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col items-center text-center">
            
            {/* Tagline */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#C80F57] sm:text-sm">
                Still need help?
              </span>
              <div className="h-1 w-16 rounded-full bg-[#FA2268]" />
            </div>

            {/* Heading */}
            <div className="pt-3">
              <h2 className="text-4xl font-extrabold text-[#0D382D] sm:text-5xl">
                Talk to us
              </h2>
            </div>

            {/* Contact Pill Bar Container */}
            <div className="mt-8 w-full max-w-[960px]">
              <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-gray-200 bg-[#f7f8f9] p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                
                {/* 1. Chat with Zovie */}
                <button
                  type="button"
                  onClick={() => {
                    // Trigger chatbot widget if present on page
                    const chatBtn = document.querySelector<HTMLElement>("[aria-label*='chat' i], [data-chat-toggle]");
                    if (chatBtn) chatBtn.click();
                  }}
                  className="group flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:shadow-sm"
                >
                  <IconChat />
                  <span className="text-base font-extrabold text-[#141A45] group-hover:text-[#C80F57] sm:text-lg">
                    Chat with Zovie
                  </span>
                </button>

                {/* 2. Phone 020 7164 6399 */}
                <a
                  href="tel:02071646399"
                  className="group relative flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="hidden h-8 w-px bg-rose-200 lg:absolute lg:left-0 lg:block" />
                  <IconPhone />
                  <span className="text-base font-extrabold text-[#141A45] group-hover:text-[#C80F57] sm:text-lg">
                    020 7164 6399
                  </span>
                </a>

                {/* 3. Complaints */}
                <Link
                  href="/contact-us"
                  className="group relative flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="hidden h-8 w-px bg-rose-200 lg:absolute lg:left-0 lg:block" />
                  <IconComplaint />
                  <span className="text-base font-extrabold text-[#141A45] group-hover:text-[#C80F57] sm:text-lg">
                    Complaints
                  </span>
                </Link>

                {/* 4. Accessibility */}
                <Link
                  href="/vulnerability-policy"
                  className="group relative flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="hidden h-8 w-px bg-rose-200 lg:absolute lg:left-0 lg:block" />
                  <IconAccessibility />
                  <span className="text-base font-extrabold text-[#141A45] group-hover:text-[#C80F57] sm:text-lg">
                    Accessibility
                  </span>
                </Link>

              </div>
            </div>

            {/* Note text below contact options */}
            <p className="mt-5 max-w-2xl text-xs text-[#4E5A8A] sm:text-sm">
              Zovie is our virtual assistant, available 24/7. Phone number and human support hours: [to be verified].
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}

export { Faqs };

/*
// =============================================================================
// PREVIOUS FAQS IMPLEMENTATION (COMMENTED OUT FOR REFERENCE)
// =============================================================================

// const quickCategories = [
//   { name: "Billing & Payments", blurb: "Questions about bills, charges, and payment methods", count: 8 },
//   { name: "Plans & Services", blurb: "Information about mobile plans, data, and features", count: 6 },
//   { name: "Technical Support", blurb: "Network issues, device setup, and troubleshooting", count: 5 },
//   { name: "Account Management", blurb: "SIM registration, account details, and security", count: 4 },
// ];

// const faqGroups = [
//   {
//     title: "Billing & Payments",
//     items: [
//       { q: "How can I receive texts with Zoiko Mobile offers and promotions?", a: "Our offers and promotions are regularly updated on our website and communicated to our customers by emails and SMS." },
//       { q: "Why have I been charged for internet access when I use WiFi?", a: "Please note that some handsets switch from WiFi to Mobile Internet depending on signal strength. To avoid these issues, please deactivate the data option on your mobile phone while using WiFi." },
//       { q: "How can I get a copy of my itemised bill?", a: "To get a copy of your itemised billing, please log in to your account using the link that was sent to you after purchasing your Zoiko Mobile plan and follow the prompts. Alternatively, you may log in to your Zoiko Mobile account at MyBill" },
//       { q: "How can I check my billing details?", a: "To check your billing details, log in to your Zoiko Mobile account at MyBill and view or update your billing details." },
//     ],
//   },
//   {
//     title: "Plans & Services",
//     items: [
//       { q: "Is it mandatory to register my details to use Zoiko Mobile services?", a: "While it is not mandatory to register your details, to use our paid monthly plan we would strongly recommend you do. However, you will be required to register all your details to use our contract plans." },
//       { q: "Do you provide locked or unlocked handsets?", a: "Yes, provide a FREE SIM card as well as new and refurbished handsets." },
//       { q: "Do you offer contract services?", a: "Yes, Zoiko Mobile offers a variety of SIM Only deals with contract options spanning 30 days and 24 months." },
//     ],
//   },
// ];
*/

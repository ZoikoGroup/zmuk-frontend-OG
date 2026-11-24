"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

const Svg = ({
  className = "h-5 w-5",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconChevronRight = ({ className = "h-4 w-4" }: { className?: string }) => (
  <Svg className={className}>
    <path d="M9 18l6-6-6-6" strokeWidth="2.2" />
  </Svg>
);

const IconCheck = ({ className = "h-4 w-4" }: { className?: string }) => (
  <Svg className={className}>
    <path d="M20 6L9 17l-5-5" strokeWidth="2.4" />
  </Svg>
);

const IconMusicNote = () => (
  <Svg className="h-4 w-4 text-white">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Svg>
);

const IconBook = () => (
  <Svg className="h-5 w-5 text-[#C80F55]">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

const IconEye = () => (
  <Svg className="h-5 w-5 text-[#C80F55]">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

const IconHeartOutline = () => (
  <Svg className="h-5 w-5 text-[#C80F55]">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

const IconHelpCircle = () => (
  <Svg className="h-5 w-5 text-[#C80F55]">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const IconSimCardLarge = () => (
  <Svg className="h-16 w-16 text-[#C80F55]">
    <path
      d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      strokeWidth="2.2"
    />
    <rect x="8" y="11" width="8" height="7" rx="1.5" strokeWidth="2.2" />
  </Svg>
);

const IconPaw = () => (
  <Svg className="h-6 w-6 text-[#C80F55]">
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="20" cy="16" r="2" />
    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
  </Svg>
);

const IconHeadphonesAmber = () => (
  <Svg className="h-6 w-6 text-[#D97706]">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);

const IconUsersTeal = () => (
  <Svg className="h-6 w-6 text-[#0A382D]">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

const IconInfo = () => (
  <Svg className="h-4 w-4 shrink-0 text-[#475872]">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Svg>
);

// ─── Data Arrays ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    title: "Our story",
    subtitle: "Where Zoiko began",
    href: "#our-story",
    icon: <IconBook />,
  },
  {
    title: "Vision & mission",
    subtitle: "What drives us",
    href: "#vision-mission",
    icon: <IconEye />,
  },
  {
    title: "What we stand for",
    subtitle: "Values & how it works",
    href: "#values",
    icon: <IconHeartOutline />,
  },
  {
    title: "Helpful answers",
    subtitle: "Before you choose",
    href: "#helpful-answers",
    icon: <IconHelpCircle />,
  },
];

const PROBLEMS_WE_SOLVE = [
  {
    quote: "“I cannot tell what I will really pay.”",
    response:
      "present understandable plans, contract lengths, allowances and relevant charges; make the full details accessible before anyone commits.",
  },
  {
    quote: "“Every plan feels the same.”",
    response:
      "offer a range of eligible SIM-only choices, including different contract periods and plans for different use cases, from personal to business.",
  },
  {
    quote: "“Switching sounds complicated.”",
    response:
      "explain keeping a number, getting a new number and what happens next; make status and follow-up clear. A request is not itself a completed switch.",
  },
  {
    quote: "“Roaming is hard to predict.”",
    response:
      "make destination information easy to find and show customer-specific charges only when verified against the applicable plan and tariff.",
  },
  {
    quote: "“I need help when something goes wrong.”",
    response:
      "make contact routes and next steps visible, and distinguish automated assistance from human support.",
  },
  {
    quote: "“Mobile brands do not reflect my community.”",
    response:
      "build a brand that welcomes different people and ways of life, with room for music, creativity, animal welfare and community participation.",
  },
];

const AUDIENCE_PILLS = [
  "Students",
  "Parents",
  "Small-business owners",
  "Creators",
  "Anyone who wants it simple",
];

const CHOICES_CARDS = [
  {
    title: "SIM-only plans",
    description:
      "Compare the options, allowances, contract periods and current prices in one place.",
    cta: "Compare plans",
    href: "/plans",
    image: "/images/about-us/A desk with a laptop, smartphone, watch and calendar.png",
  },
  {
    title: "Flexible 30-day options",
    description: "Select them where offered for the plan that suits you.",
    cta: "See 30-day plans",
    href: "/30-day-plan",
    image: "/images/about-us/A young woman on a sofa using a laptop.png",
  },
  {
    title: "Business mobile",
    description: "Discover mobile options designed for business requirements.",
    cta: "Explore business plans",
    href: "/business-deals_sim-only-plans",
    image: "/images/about-us/A businesswoman working at her laptop.png",
  },
  {
    title: "Keep your number",
    description:
      "Understand the PAC process and follow an approved switching journey.",
    cta: "How switching works",
    href: "/switch-and-save",
    image: "/images/about-us/A man working on a laptop in a café with his phone beside him.png",
  },
  {
    title: "eSIM and physical SIM",
    description:
      "See available fulfilment and compatibility information for your chosen service.",
    cta: "Check compatibility",
    href: "/activate-your-sim",
    image: null,
  },
  {
    title: "Roaming and international calls",
    description:
      "Check the relevant destinations, plan inclusions and charges before use.",
    cta: "Check destinations",
    href: "/roaming-and-coverage",
    image: "/images/about-us/Friends reading a paper map while sightseeing in a city.png",
  },
];

const VALUES_LIST = [
  {
    title: "People before complexity",
    description: "Clear explanations, considerate design and practical help.",
    icon: (
      <Svg className="h-5 w-5 text-white">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </Svg>
    ),
  },
  {
    title: "Transparency by default",
    description: "Visible terms, accurate prices and no confusing success claims.",
    icon: (
      <Svg className="h-5 w-5 text-white">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8" />
      </Svg>
    ),
  },
  {
    title: "Flexibility with integrity",
    description:
      "Choice that reflects real eligibility, contract terms and service availability.",
    icon: (
      <Svg className="h-5 w-5 text-white">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </Svg>
    ),
  },
  {
    title: "Respect for life and creativity",
    description:
      "A brand inspired by animals, music and the communities behind them.",
    icon: <IconMusicNote />,
  },
  {
    title: "Continuous improvement",
    description: "We listen to feedback, own problems and improve the experience.",
    icon: (
      <Svg className="h-5 w-5 text-white">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </Svg>
    ),
  },
  {
    title: "Responsible connectivity",
    description:
      "We take privacy, security, accessibility and truthful communication seriously.",
    icon: (
      <Svg className="h-5 w-5 text-white">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </Svg>
    ),
  },
];

const CUSTOMER_PROMISES = [
  {
    title: "Know what you are choosing",
    description:
      "Review plan details, charges, contract information and eligibility.",
  },
  {
    title: "Move with confidence",
    description:
      "Understand switching, fulfilment and activation as separate stages.",
  },
  {
    title: "Stay informed",
    description:
      "Find trustworthy usage, roaming, account and support information as those features are available.",
  },
  {
    title: "Get the right help",
    description:
      "Use published contact routes and clear complaint or escalation options.",
  },
  {
    title: "Use services inclusively",
    description:
      "Read and navigate the site across devices and assistive technologies.",
  },
];

const ABOUT_FAQS = [
  {
    q: "What does Zoiko mean?",
    a: "Zoiko is a coined name inspired by ancient Greek words relating to living beings and animals. It represents a belief in connection, respect for life and community.",
  },
  {
    q: "Is Zoiko Mobile UK a network operator?",
    a: "Zoiko Mobile UK is a mobile virtual network operator (MVNO). We provide mobile services using established telecommunications supply arrangements; coverage and service availability depend on your plan, device and location.",
  },
  {
    q: "Can I keep my existing mobile number?",
    a: "You can request to keep your number through the relevant switching process. We explain the required steps and will confirm what happens after your request is received.",
  },
  {
    q: "How do I check the right plan for me?",
    a: "Start with our current SIM-only plans and coverage checker. Compare allowances, contract periods and any applicable extras before choosing.",
  },
  {
    q: "Where can I get support?",
    a: "Visit Help & Support for our current contact channels, opening hours, service information and complaints process.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Aboutus() {
  return (
    <main className="w-full bg-white font-sans text-[#0A382D]">
      
      {/* ── Section 1: Hero ── */}
      <section className="relative bg-[#F6F8F7] pt-10 pb-28 sm:pt-14 sm:pb-32 lg:pt-16 lg:pb-36">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            
            {/* Left Column */}
            <div className="flex flex-col items-start lg:col-span-6">
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                  About Zoiko Mobile UK
                </span>
                <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
              </div>

              <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-[62px]">
                <span className="block text-[#0A382D]">Connecting</span>
                <span className="block text-[#C80F55]">Every Possibility</span>
              </h1>

              <p className="mt-4 text-xl font-bold leading-snug text-[#0A382D] sm:text-2xl">
                A mobile network inspired by life. Built around you.
              </p>

              <p className="mt-4 max-w-[540px] text-base leading-relaxed text-[#2C4259] sm:text-lg">
                At Zoiko Mobile UK, we believe a mobile connection should do more than keep a device online. It should help people stay close, discover opportunities, express themselves and move confidently through everyday life.
              </p>

              <p className="mt-3 max-w-[540px] text-sm leading-relaxed text-[#2C4259] sm:text-base">
                We bring a people-first approach to mobile services, combining flexible choices with a distinctive commitment to creativity, community and the world around us. Because when connectivity is easier to understand and manage, more of life becomes possible.
              </p>

              {/* CTA Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href="/plans"
                  className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#E81D62] to-[#C80F55] px-7 text-base font-bold text-white shadow-[0px_10px_24px_-10px_rgba(200,15,85,0.70)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explore SIM-only plans</span>
                  <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/coverage-checker"
                  className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full border-2 border-[#E01C5B] bg-white px-7 text-base font-bold text-[#C80F55] transition-all hover:bg-rose-50/60 active:scale-[0.98]"
                >
                  <span>Check coverage</span>
                  <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Layered Photo Collage */}
            <div className="relative mx-auto w-full max-w-[540px] lg:col-span-6">
              <div className="relative h-[480px] sm:h-[550px]">
                
                {/* Main Photo Card */}
                <div className="relative ml-auto h-[410px] w-[84%] overflow-hidden rounded-[32px] bg-white shadow-[0px_30px_60px_-30px_rgba(10,56,45,0.55)] sm:h-[470px]">
                  <Image
                    src="/images/about-us/A smiling man chatting on his mobile phone in a warmly lit café.png"
                    alt="Customer chatting on mobile phone"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 440px"
                    className="object-cover"
                  />
                </div>

                {/* Top-Left Floating Pill Badge */}
                <div className="absolute left-0 top-10 z-10 inline-flex items-center gap-3 rounded-full bg-white py-2.5 pl-2.5 pr-5 shadow-[0px_16px_30px_-16px_rgba(10,56,45,0.45)] sm:left-4 sm:top-12">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E01C5B]">
                    <IconMusicNote />
                  </div>
                  <span className="text-xs font-bold text-[#0A382D] sm:text-sm">
                    The Animal &amp; Music Loving Network
                  </span>
                </div>

                {/* Bottom-Left Circular Dog Image */}
                <div className="absolute bottom-2 left-0 z-10 h-40 w-40 overflow-hidden rounded-full border-8 border-white bg-amber-400 shadow-[0px_20px_40px_-20px_rgba(10,56,45,0.50)] sm:h-48 sm:w-48">
                  <Image
                    src="/images/about-us/A black pug wearing a knitted jumper.png"
                    alt="A black pug wearing a knitted jumper"
                    fill
                    sizes="196px"
                    className="object-cover"
                  />
                </div>

                {/* Bottom-Right Rounded Concert Image */}
                <div className="absolute bottom-0 right-2 z-10 h-32 w-52 overflow-hidden rounded-3xl border-[6px] border-white bg-slate-900 shadow-[0px_20px_40px_-20px_rgba(10,56,45,0.50)] sm:right-4 sm:h-36 sm:w-60">
                  <Image
                    src="/images/about-us/A crowd with hands raised at a live music concert.png"
                    alt="Live music concert crowd"
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Slanted Rose Divider */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-r from-[#F4A3BF] via-[#E81D62] to-[#D81B60]"
            style={{
              clipPath: "polygon(0 55%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16 bg-white"
            style={{
              clipPath: "polygon(0 65%, 100% 15%, 100% 100%, 0% 100%)",
            }}
          />
        </div>

        {/* Overlapping 4-Item Quick Navigation Bar */}
        <div className="relative z-20 mx-auto -mb-44 mt-10 max-w-[1136px] px-4 sm:px-6 lg:px-0">
          <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[20px] border border-gray-200/90 bg-white shadow-[0px_18px_40px_-24px_rgba(10,56,45,0.45)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {QUICK_LINKS.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group flex items-center justify-between gap-3.5 px-5 py-5 transition-colors hover:bg-rose-50/40"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCEEF3]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#0A382D] group-hover:text-[#C80F55]">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#475872]">{item.subtitle}</div>
                  </div>
                </div>
                <IconChevronRight className="h-4 w-4 shrink-0 text-[#C80F55] transition-transform group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Our Story ("Where Zoiko began") ── */}
      <section
        id="our-story"
        className="scroll-mt-24 bg-white pt-28 pb-20 sm:pt-32 sm:pb-24"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-12">
            
            {/* Left Story Narrative */}
            <div className="flex flex-col items-start lg:col-span-6">
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                  Our story
                </span>
                <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
              </div>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A382D] sm:text-5xl">
                Where Zoiko began
              </h2>

              {/* Drop-cap first paragraph */}
              <p className="mt-6 text-base leading-8 text-[#2C4259] sm:text-lg">
                <span className="float-left mr-3 mt-1 font-serif text-5xl font-normal leading-none text-[#2C4259] sm:text-6xl">
                  T
                </span>
                he Zoiko idea began in 2008 with a simple question: what if a mobile network could stand for more than minutes, data and signal? Its founder wanted to connect the practical power of telecommunications with something more enduring: a respect for living things, an appreciation of music and a belief in the value of human relationships.
              </p>

              <p className="mt-5 text-base leading-8 text-[#2C4259] sm:text-lg">
                His thinking was shaped by an unusual combination of interests. The study of theology introduced him to ancient Greek; mathematics inspired a fascination with how ideas could be brought together; music revealed how expression can connect people across differences. Years of work on Vodafone projects also introduced him to the mobile virtual network operator model and its potential to create a different kind of customer experience.
              </p>

              <p className="mt-5 text-base leading-8 text-[#2C4259] sm:text-lg">
                The vision was reignited in 2022 and developed into the wider Zoiko mobile proposition. Today, Zoiko Mobile UK serves that vision in the British market: practical mobile choices, presented with a clear sense of purpose and a commitment to keep improving how customers connect.
              </p>
            </div>

            {/* Right Image + Timeline Card */}
            <div className="flex flex-col items-center lg:col-span-6">
              <div className="relative h-72 w-full overflow-hidden rounded-3xl sm:h-96">
                <Image
                  src="/images/about-us/Hands resting on the keys of a vintage typewriter on a wooden desk.png"
                  alt="Where Zoiko began"
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover"
                />
              </div>

              {/* Overlapping Timeline Card */}
              <div className="relative z-10 -mt-12 w-[92%] max-w-[465px] rounded-3xl border border-gray-200 bg-white p-6 shadow-[0px_14px_34px_-22px_rgba(10,56,45,0.35)] sm:p-7">
                <div className="relative space-y-7">
                  {/* Vertical connecting line */}
                  <div
                    className="absolute left-7 top-4 bottom-8 w-0.5 bg-gradient-to-b from-rose-300 via-rose-200 to-transparent"
                    aria-hidden="true"
                  />

                  {/* 2008 */}
                  <div className="relative flex items-start gap-5">
                    <span className="relative z-10 inline-flex h-8 w-14 shrink-0 items-center justify-center rounded-full bg-[#E01C5B] text-sm font-extrabold text-white">
                      2008
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0A382D]">
                        The idea
                      </h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-[#475872] sm:text-base">
                        A founder asks what a mobile network could stand for beyond minutes, data and signal.
                      </p>
                    </div>
                  </div>

                  {/* 2022 */}
                  <div className="relative flex items-start gap-5">
                    <span className="relative z-10 inline-flex h-8 w-14 shrink-0 items-center justify-center rounded-full bg-[#E01C5B] text-sm font-extrabold text-white">
                      2022
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0A382D]">
                        The vision, reignited
                      </h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-[#475872] sm:text-base">
                        The idea is renewed and developed into the wider Zoiko mobile proposition.
                      </p>
                    </div>
                  </div>

                  {/* 2025 */}
                  <div className="relative flex items-start gap-5">
                    <span className="relative z-10 inline-flex h-8 w-14 shrink-0 items-center justify-center rounded-full bg-[#0A382D] text-sm font-extrabold text-white">
                      2023                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0A382D]">
                        Zoiko Mobile UK
                      </h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-[#475872] sm:text-base">
                        ZOIKO MOBILE UK LTD is incorporated in England and Wales to serve the British market.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 3: The Name ("Why the name Zoiko matters") ── */}
      <section className="relative overflow-hidden bg-[#06211A] py-20 text-white sm:py-24">
        {/* Giant subtle "Z" watermark */}
        <div
          className="pointer-events-none absolute -top-20 right-4 select-none text-[420px] font-black leading-none text-white/[0.035] sm:text-[560px]"
          aria-hidden="true"
        >
          Z
        </div>

        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          {/* Header Row */}
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F472B6]">
                  The name
                </span>
                <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
                Why the name Zoiko
                <br />
                matters
              </h2>
            </div>

            <div className="lg:col-span-6">
              <p className="text-base leading-8 text-[#B7E4D4] sm:text-lg">
                Zoiko is a name created for the brand, inspired by two words from ancient Greek. Its founder combined “zoi” from the first with “ko” from the second to create something original.
              </p>
            </div>
          </div>

          {/* Etymology Equation Cards */}
          <div className="mt-12 grid grid-cols-1 items-center gap-4 lg:mt-16 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {/* Card 1: zōion */}
            <div className="flex h-full flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.03] px-6 py-7">
              <div>
                <div className="text-4xl font-extrabold sm:text-5xl">
                  <span className="text-[#EC4899]">ζῷ</span>
                  <span className="text-white">ον</span>
                </div>
                <div className="mt-2 text-base text-[#6EE7B7]">zōion</div>
              </div>
              <div className="mt-4 border-t border-white/15 pt-3.5 text-base text-gray-200">
                A living being or animal
              </div>
            </div>

            {/* Plus */}
            <div className="flex justify-center text-4xl font-extrabold text-[#F472B6] sm:text-5xl">
              +
            </div>

            {/* Card 2: zōiologikós */}
            <div className="flex h-full flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.03] px-6 py-7">
              <div>
                <div className="text-4xl font-extrabold sm:text-5xl">
                  <span className="text-white">ζῳολογ</span>
                  <span className="text-[#EC4899]">κ</span>
                  <span className="text-white">ός</span>
                </div>
                <div className="mt-2 text-base text-[#6EE7B7]">zōiologikós</div>
              </div>
              <div className="mt-4 border-t border-white/15 pt-3.5 text-base text-gray-200">
                Pertaining to animals
              </div>
            </div>

            {/* Equals */}
            <div className="flex justify-center text-4xl font-extrabold text-[#F472B6] sm:text-5xl">
              =
            </div>

            {/* Card 3: Zoiko */}
            <div className="flex h-full flex-col justify-between rounded-3xl bg-[#E01C5B] px-6 py-7 shadow-lg">
              <div className="text-6xl font-black leading-none text-white sm:text-7xl">
                Zoiko
              </div>
              <div className="mt-5 border-t border-white/35 pt-3.5 text-base text-white">
                A coined name, not a direct Greek translation
              </div>
            </div>
          </div>

          {/* Bottom Explanation + 2 Staggered Photos */}
          <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:mt-16 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <p className="text-base leading-7 text-[#B7E4D4]">
                The name is not a direct Greek translation. It is an expression of an idea: that technology can serve life and help connect people, communities and the living world with care and imagination.
              </p>
              <p className="text-base leading-7 text-[#B7E4D4]">
                That philosophy also explains a distinctive part of our identity:{" "}
                <strong className="font-bold text-white">
                  The Animal &amp; Music Loving Network.
                </strong>{" "}
                Animals remind us that connection comes with responsibility. Music reminds us that connection can also carry creativity, emotion and joy. Together, they give Zoiko a character that goes beyond conventional mobile branding.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-5">
              {/* Respect for life */}
              <div className="relative h-64 overflow-hidden rounded-3xl">
                <Image
                  src="/images/about-us/A tabby cat looking upwards against a blue background.png"
                  alt="Respect for life"
                  fill
                  sizes="240px"
                  className="object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-[#06211A]/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  Respect for life
                </span>
              </div>

              {/* Joy of music (staggered down) */}
              <div className="relative mt-8 h-64 overflow-hidden rounded-3xl sm:mt-11">
                <Image
                  src="/images/about-us/Silhouetted audience under bright stage lights at a concert.png"
                  alt="Joy of music"
                  fill
                  sizes="240px"
                  className="object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-[#06211A]/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  Joy of music
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Direction ("Our vision and mission") ── */}
      <section
        id="vision-mission"
        className="scroll-mt-24 bg-[#F6F8F7] py-20 sm:py-24"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
              Direction
            </span>
            <div className="mt-2.5 h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A382D] sm:text-5xl">
              Our vision and mission
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: Our vision */}
            <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0px_14px_34px_-22px_rgba(10,56,45,0.35)]">
              <div className="relative h-56 w-full">
                <Image
                  src="/images/about-us/A man with a backpack looking out across a calm sea.png"
                  alt="Our vision"
                  fill
                  sizes="(max-width: 768px) 100vw, 365px"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0A382D] shadow-sm">
                  Where we’re heading
                </span>
              </div>
              <div className="flex-1 p-7">
                <h3 className="text-2xl font-extrabold text-[#0A382D]">
                  Our vision
                </h3>
                <p className="mt-3 text-base leading-7 text-[#2C4259]">
                  A more connected and inclusive world where dependable, accessible mobile services help people, communities and businesses participate, create and thrive.
                </p>
              </div>
            </div>

            {/* Card 2: Our mission (Dark Green) */}
            <div className="flex flex-col overflow-hidden rounded-3xl border border-[#0A382D] bg-[#0A382D] text-white shadow-[0px_14px_34px_-22px_rgba(10,56,45,0.35)]">
              <div className="relative h-56 w-full">
                <Image
                  src="/images/student-deals/Students studying together around a table.png"
                  alt="Our mission"
                  fill
                  sizes="(max-width: 768px) 100vw, 365px"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0A382D] shadow-sm">
                  What we do every day
                </span>
              </div>
              <div className="flex-1 p-7">
                <h3 className="text-2xl font-extrabold text-white">
                  Our mission
                </h3>
                <p className="mt-3 text-base leading-7 text-[#C6EFE0]">
                  To make mobile connectivity simpler, clearer and more meaningful—through flexible choices, transparent information, helpful support and a customer experience that respects people’s time, needs and individuality.
                </p>
              </div>
            </div>

            {/* Card 3: Our purpose */}
            <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0px_14px_34px_-22px_rgba(10,56,45,0.35)]">
              <div className="relative h-56 w-full">
                <Image
                  src="/images/about-us/City lights across the Earth seen from space at night.png"
                  alt="Our purpose"
                  fill
                  sizes="(max-width: 768px) 100vw, 365px"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0A382D] shadow-sm">
                  Why we exist
                </span>
              </div>
              <div className="flex-1 p-7">
                <h3 className="text-2xl font-extrabold text-[#0A382D]">
                  Our purpose
                </h3>
                <p className="mt-3 text-base leading-7 text-[#2C4259]">
                  To power the connections that enable life to thrive — bringing the digital and physical worlds closer together, and turning everyday access to communication into greater opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Relevance ("The problems we are here to solve") ── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
            
            {/* Left Intro + Image */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <div className="flex flex-col items-start gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                    Relevance
                  </span>
                  <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
                </div>

                <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#0A382D] sm:text-5xl">
                  The problems we
                  <br />
                  are here to solve
                </h2>

                <p className="mt-4 text-base leading-8 text-[#2C4259] sm:text-lg">
                  Mobile services should make life easier, yet too often customers face confusing plans, hard-to-compare charges, switching anxiety and services that do not reflect how they actually live. Our approach starts with those frustrations and works backwards from the customer.
                </p>
              </div>

              <div className="relative mt-6 h-80 w-full overflow-hidden rounded-3xl sm:h-96">
                <Image
                  src="/images/about-us/A young woman relaxing on a sofa while using her laptop.png"
                  alt="Customer reviewing mobile plans"
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right 2x3 Problem / Response Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7">
              {PROBLEMS_WE_SOLVE.map((item) => (
                <div
                  key={item.quote}
                  className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-[0px_14px_34px_-22px_rgba(10,56,45,0.35)]"
                >
                  <h3 className="text-xl font-extrabold leading-snug text-[#C80F55]">
                    {item.quote}
                  </h3>

                  <div className="mt-4 flex items-start gap-3 border-t border-rose-200/80 pt-4">
                    <span className="mt-1 shrink-0 text-[#0A382D]">
                      <IconCheck className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-6 text-[#2C4259] sm:text-base">
                      <strong className="font-bold text-[#0A382D]">
                        Our response:
                      </strong>{" "}
                      {item.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 6: Choices ("Mobile made for real life") ── */}
      <section className="bg-[#F6F8F7] py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-[760px]">
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                Choices
              </span>
              <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A382D] sm:text-5xl">
              Mobile made for real life
            </h2>

            <p className="mt-4 text-base leading-8 text-[#2C4259] sm:text-lg">
              There is no single way to live, work or stay in touch. Whether you are a student, a parent, a small-business owner, a creator or someone who simply wants straightforward mobile service, your plan should fit your needs — not the other way round.
            </p>

            {/* Audience Pills */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              {AUDIENCE_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-[#0A382D]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <h3 className="mt-12 text-xl font-extrabold text-[#0A382D]">
            The choices available to you
          </h3>

          {/* 3x2 Cards Grid */}
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CHOICES_CARDS.map((card) => (
              <div
                key={card.title}
                className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0px_14px_34px_-22px_rgba(10,56,45,0.35)] transition-all hover:-translate-y-0.5"
              >
                {card.image ? (
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 365px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-[#FCEEF3]">
                    <IconSimCardLarge />
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h4 className="text-xl font-extrabold text-[#0A382D]">
                      {card.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[#475872] sm:text-base">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={card.href}
                      className="inline-flex items-center gap-1.5 text-base font-bold text-[#C80F55] hover:underline"
                    >
                      <span>{card.cta}</span>
                      <IconChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <div className="mt-8 flex items-center gap-2.5 text-xs text-[#475872] sm:text-sm">
            <IconInfo />
            <span>
              Products, allowances and availability depend on the selected plan, device, location and current terms. Review the latest plan details for what is included.
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 7: The Zoiko Philosophy ("Life, music and community") ── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
            
            {/* Left Asymmetric 2x2 Photo Grid */}
            <div className="space-y-4 lg:col-span-6">
              {/* Top Row: 2/3 + 1/3 */}
              <div className="grid grid-cols-12 gap-4">
                <div className="relative col-span-8 h-64 overflow-hidden rounded-[20px] sm:h-80">
                  <Image
                    src="/images/about-us/People sharing food around a long communal table.png"
                    alt="Friends connected together"
                    fill
                    sizes="(max-width: 768px) 65vw, 380px"
                    className="object-cover"
                  />
                </div>
                <div className="relative col-span-4 h-64 overflow-hidden rounded-[20px] sm:h-80">
                  <Image
                    src="/images/about-us/A black pug in a knitted jumper.png"
                    alt="Woman with her dog"
                    fill
                    sizes="(max-width: 768px) 35vw, 185px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Bottom Row: 1/3 + 2/3 */}
              <div className="grid grid-cols-12 gap-4">
                <div className="relative col-span-4 h-36 overflow-hidden rounded-[20px] sm:h-40">
                  <Image
                    src="/images/about-us/Concert crowd with hands in the air.png"
                    alt="Concert crowd"
                    fill
                    sizes="(max-width: 768px) 35vw, 185px"
                    className="object-cover"
                  />
                </div>
                <div className="relative col-span-8 h-36 overflow-hidden rounded-[20px] sm:h-40">
                  <Image
                    src="/images/about-us/Friends raising their glasses together at dinner.png"
                    alt="Man cycling with dog"
                    fill
                    sizes="(max-width: 768px) 65vw, 380px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6">
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                  The Zoiko philosophy
                </span>
                <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
              </div>

              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#0A382D] sm:text-5xl">
                Life, music and
                <br />
                community
              </h2>

              <p className="mt-4 text-base leading-8 text-[#2C4259] sm:text-lg">
                Our inspiration comes from the connections we share with one another and with the wider world. That is why our identity celebrates animals and music as more than decorative themes. They reflect compassion, creative expression and the belief that different communities deserve to be seen and heard.
              </p>

              <div className="mt-7 space-y-6">
                {/* Item 1: A love of animals */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCEEF3]">
                    <IconPaw />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0A382D]">
                      A love of animals
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-[#2C4259] sm:text-base">
                      Respect for living things is part of the story behind our name. We believe businesses can make more thoughtful choices and encourage a culture of care. As our community activities develop, we intend to describe them openly and report tangible outcomes rather than make promises that cannot be evidenced.
                    </p>
                  </div>
                </div>

                {/* Item 2: A love of music */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                    <IconHeadphonesAmber />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0A382D]">
                      A love of music
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-[#2C4259] sm:text-base">
                      Music crosses generations, languages and borders. It helps people feel close even when they are apart. That spirit of belonging and self-expression informs how we think about connectivity and the communities we hope to bring together.
                    </p>
                  </div>
                </div>

                {/* Item 3: A commitment to community */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F0EC]">
                    <IconUsersTeal />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0A382D]">
                      A commitment to community
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-[#2C4259] sm:text-base">
                      Our ambition is to make people feel included — not simply connected. We want to listen to the customers we serve, recognise their different needs and create opportunities for participation wherever our services and partnerships make that possible.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 8: Values ("What we stand for") + "How our mobile service works" ── */}
      <section
        id="values"
        className="scroll-mt-24 bg-[#F6F8F7] py-20 sm:py-24"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-[760px]">
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                Values
              </span>
              <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A382D] sm:text-5xl">
              What we stand for
            </h2>
          </div>

          {/* 3x2 Values Grid */}
          <div className="mt-10 grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES_LIST.map((val, idx) => (
              <div
                key={val.title}
                className={`flex flex-col items-start gap-2 border-b border-gray-200 py-7 ${
                  idx % 3 !== 0 ? "lg:border-l lg:pl-7" : "lg:pr-7"
                } ${idx % 3 === 1 ? "lg:pr-7" : ""}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A382D]">
                  {val.icon}
                </div>
                <h3 className="pt-2 text-xl font-extrabold text-[#0A382D]">
                  {val.title}
                </h3>
                <p className="text-base leading-6 text-[#475872]">
                  {val.description}
                </p>
              </div>
            ))}
          </div>

          {/* Dark Green "How our mobile service works" Card */}
          <div className="relative mt-14 overflow-hidden rounded-[34px] bg-[#06211A] text-white shadow-xl">
            <Image
              src="/images/about-us/cbda3526-587c-4720-8cab-7d5ff52e7862.png"
              alt="Highland landscape"
              fill
              sizes="1136px"
              className="object-cover opacity-35"
            />
            <div className="relative z-10 bg-gradient-to-r from-[#06211A]/95 via-[#06211A]/85 to-[#06211A]/50 p-8 sm:p-12 lg:px-14 lg:py-16">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
                
                {/* Left MVNO Explanation */}
                <div className="lg:col-span-6">
                  <div className="flex flex-col items-start gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#F472B6]">
                      How it works
                    </span>
                    <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
                  </div>

                  <h3 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
                    How our mobile
                    <br />
                    service works
                  </h3>

                  <p className="mt-5 text-base leading-7 text-[#C6EFE0]">
                    Zoiko Mobile UK is a mobile virtual network operator, or MVNO. That means we provide customer-facing mobile services through established telecommunications supply arrangements rather than claiming to own a nationwide radio network.
                  </p>

                  <p className="mt-4 text-base leading-7 text-[#C6EFE0]">
                    For customers, what matters is straightforward: choose an eligible plan, check coverage and device compatibility, understand the terms, and use our support and account services to manage your relationship with us. Network performance and availability depend on a range of factors, including your location, device and the applicable service arrangements.
                  </p>
                </div>

                {/* Right 3-Tier Flow Diagram */}
                <div className="flex flex-col gap-3 lg:col-span-6">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3.5 rounded-2xl bg-white/95 px-5 py-4 text-[#0A382D]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F0EC] text-[#0A382D]">
                      <Svg className="h-5 w-5">
                        <path d="M2 12a10 10 0 0 1 20 0M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <path d="M12 13v8M9 21h6" />
                      </Svg>
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#0A382D]">
                        Established network supply
                      </div>
                      <div className="text-sm text-[#475872]">
                        Mobile access through telecommunications supply arrangements
                      </div>
                    </div>
                  </div>

                  {/* Down Arrow */}
                  <div className="flex justify-center text-[#F472B6]">
                    <Svg className="h-5 w-5">
                      <path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2.2" />
                    </Svg>
                  </div>

                  {/* Step 2 (Rose) */}
                  <div className="flex items-center gap-3.5 rounded-2xl bg-[#E01C5B] px-5 py-4 text-white shadow-md">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#C80F55]">
                      <Svg className="h-5 w-5">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M7 15h4M15 15h2" />
                      </Svg>
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">
                        Zoiko Mobile UK
                      </div>
                      <div className="text-sm text-white/95">
                        Plans, SIMs, account services and customer support
                      </div>
                    </div>
                  </div>

                  {/* Down Arrow */}
                  <div className="flex justify-center text-[#F472B6]">
                    <Svg className="h-5 w-5">
                      <path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2.2" />
                    </Svg>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3.5 rounded-2xl bg-white/95 px-5 py-4 text-[#0A382D]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F0EC] text-[#0A382D]">
                      <Svg className="h-5 w-5">
                        <rect x="5" y="2" width="14" height="20" rx="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </Svg>
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#0A382D]">
                        You
                      </div>
                      <div className="text-sm text-[#475872]">
                        Choose a plan, check coverage and compatibility, manage it with us
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 9: Trust ("Our promise to customers") ── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
            
            {/* Left Image with Quote Card */}
            <div className="relative h-[460px] w-full overflow-hidden rounded-[30px] sm:h-[540px] lg:col-span-5">
              <Image
                src="/images/about-us/A handwritten thank-you card beside a cup of coffee.png"
                alt="Customers looking at smartphone together"
                fill
                sizes="(max-width: 1024px) 100vw, 485px"
                className="object-cover"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-[20px] bg-white px-6 py-5 shadow-lg">
                <p className="text-lg font-bold text-[#0A382D]">
                  Trust is earned through the small details.
                </p>
              </div>
            </div>

            {/* Right Promise Checklist */}
            <div className="lg:col-span-7">
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                  Trust
                </span>
                <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
              </div>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A382D] sm:text-5xl">
                Our promise to customers
              </h2>

              <p className="mt-4 text-base leading-8 text-[#2C4259] sm:text-lg">
                We believe trust is earned through the small details: accurate information, an understandable bill, a clear next step and a helpful response when something needs attention. Our commitment is to keep those details at the centre of the mobile experience.
              </p>

              <div className="mt-7 space-y-3">
                {CUSTOMER_PROMISES.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E01C5B] text-white">
                      <IconCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0A382D]">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-sm leading-6 text-[#475872] sm:text-base">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 10: CTA Banner ("Your next connection starts here") ── */}
      <section className="bg-white pb-20 sm:pb-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#E81D62] via-[#C80F55] to-[#9E0B42] text-white shadow-xl">
            <div className="grid grid-cols-1 items-center lg:grid-cols-12">
              
              {/* Left Text & Buttons */}
              <div className="relative z-10 p-8 sm:p-12 lg:col-span-7 lg:px-14 lg:py-16">
                <h2 className="text-3xl font-black leading-tight sm:text-5xl">
                  Your next connection
                  <br />
                  starts here
                </h2>

                <p className="mt-4 max-w-[560px] text-base leading-7 text-rose-50 sm:text-lg">
                  Whatever brings you to Zoiko Mobile—better control, greater flexibility, work, family, travel or simply a network whose values resonate with you—we would be pleased to help you find a suitable way forward.
                </p>

                <p className="mt-3 max-w-[560px] text-base leading-7 text-rose-50 sm:text-lg">
                  Explore your options, check availability and find the information you need to make a confident choice.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/plans"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-bold text-[#C80F55] shadow-md transition-all hover:scale-[1.02]"
                  >
                    <span>Explore SIM-only plans</span>
                    <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    href="/coverage-checker"
                    className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/75 px-6 text-base font-bold text-white transition-colors hover:bg-white/15"
                  >
                    Check coverage
                  </Link>

                  <Link
                    href="/switch-and-save"
                    className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/75 px-6 text-base font-bold text-white transition-colors hover:bg-white/15"
                  >
                    Switch &amp; Save
                  </Link>

                  <Link
                    href="/support"
                    className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/75 px-6 text-base font-bold text-white transition-colors hover:bg-white/15"
                  >
                    Get help
                  </Link>
                </div>
              </div>

              {/* Right Blended Image */}
              <div className="relative h-80 w-full lg:col-span-5 lg:h-full lg:min-h-[540px]">
                <Image
                  src="/images/about-us/Friends toasting together around a restaurant table.png"
                  alt="Friends smiling with their phones"
                  fill
                  sizes="(max-width: 1024px) 100vw, 460px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#C80F55] via-[#C80F55]/20 to-transparent lg:bg-gradient-to-r lg:from-[#C80F55] lg:via-[#C80F55]/30 lg:to-transparent" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Section 11: Questions ("Helpful answers before you choose") ── */}
      <section
        id="helpful-answers"
        className="scroll-mt-24 bg-[#F6F8F7] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-12">
            
            {/* Left Heading + Help Box */}
            <div className="lg:col-span-5">
              <div className="flex flex-col items-start gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C80F55]">
                  Questions
                </span>
                <div className="h-[3px] w-14 rounded-[3px] bg-[#E01C5B]" />
              </div>

              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#0A382D] sm:text-5xl">
                Helpful answers
                <br />
                before you choose
              </h2>

              <div className="mt-8 rounded-3xl bg-[#FCEEF3] p-7">
                <h3 className="text-xl font-extrabold text-[#0A382D]">
                  Still have a question?
                </h3>
                <p className="mt-2 text-base leading-6 text-[#2C4259]">
                  Help &amp; Support lists our current contact channels, opening hours, service information and complaints process.
                </p>
                <div className="mt-4">
                  <Link
                    href="/support"
                    className="inline-flex items-center gap-1.5 text-base font-bold text-[#C80F55] hover:underline"
                  >
                    <span>Visit Help &amp; Support</span>
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Q&A List + Company Details */}
            <div className="lg:col-span-7">
              <div className="divide-y divide-gray-200">
                {ABOUT_FAQS.map((faq, idx) => (
                  <div
                    key={faq.q}
                    className={`${idx === 0 ? "pb-6" : "py-6"}`}
                  >
                    <h3 className="text-xl font-extrabold text-[#0A382D]">
                      {faq.q}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-[#2C4259]">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>

              {/* Company Details Card */}
              <div className="mt-6 rounded-[20px] border border-gray-200 bg-[#F6F8F7] p-6">
                <h4 className="text-base font-bold text-[#0A382D]">
                  Company details
                </h4>
                <p className="mt-1.5 text-sm leading-6 text-[#2C4259]">
                  ZOIKO MOBILE UK LTD is registered in England and Wales under company number 16564980.
                  <br />
                  Registered office: 167–169 Great Portland Street, 5th Floor, London W1W 5PF.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}

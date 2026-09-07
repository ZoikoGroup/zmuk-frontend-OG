"use client";

import { useRouter } from "next/navigation";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable bits
// ─────────────────────────────────────────────────────────────────────────────

const Check = ({ className = "h-5 w-5 text-green-600" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
  </svg>
);

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">{children}</h2>
      <span className="mt-3 inline-block h-1 w-16 rounded bg-green-500" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

// Replace these with your real image paths (put files in /public).
const HERO_IMAGES = [
  { src: "/images/Mask group.png", alt: "Public sector worker" },
  { src: "/images/studio-portrait-of-smiling-young-female-police-off-2024-10-19-14-03-02-utc 1.png", alt: "Police officer" },
  { src: "/images/Mask group (1).png", alt: "Firefighters" },
  { src: "/images/happy-soldier-military-and-portrait-of-people-in-2025-04-06-10-08-19-utc 1.png", alt: "Armed forces" },
];

const STEPS = [
  { n: 1, title: "Choose Your Plan", text: "Browse our range of SIM-only plans and select the perfect option for your needs." },
  { n: 2, title: "Sign Up with Your Work Email", text: "Register for a Zoiko Mobile account using your official work email address." },
  { n: 3, title: "Verify Your Status", text: "Provide a valid work ID to confirm your public sector employment status." },
  { n: 4, title: "Nominate Family and Friends", text: "Add up to 5 nominated family and friends to receive a 20% lifetime discount on their SIM-only plans." },
  { n: 5, title: "Get Your Discount", text: "Enjoy 30% off your chosen plan for as long as you remain a Zoiko Mobile customer, and 20% off for your nominated family and friends." },
];

const TERMS = [
  { title: "30% Discount", text: "Applies to any Zoiko Mobile SIM-only plan for as long as you remain a customer." },
  { title: "20% Discount for Family and Friends", text: "Applies to up to 5 nominated family and friends for as long as they remain Zoiko Mobile customers." },
  { title: "Valid Work ID", text: "You must provide a valid work ID to confirm your public sector work status." },
  { title: "Eligibility", text: "This offer is available to new public sector workers customers only." },
  { title: "Fair Usage Policy", text: "Applies to all plans, including unlimited calls & texts and EU roaming." },
  { title: "5G Coverage", text: "Available in selected areas only." },
  { title: "Wi-Fi Calling", text: "Requires compatible handset and network coverage." },
  { title: "EU Roaming", text: "For use in EU countries only. This offer can be used in conjunction with other promotional offers from Zoiko Mobile." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function Publicsectordeals() {
  const router = useRouter();
  return (
    <div className="bg-white dark:bg-gray-900">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
              Exclusive Offer for UK Public Sector Workers
            </span>

            <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Honoring Your Service with Exclusive Savings
            </h1>

            <p className="mb-8 max-w-xl text-sm leading-relaxed text-white/90">
              At Zoiko Mobile, we appreciate the hard work and dedication of our public sector workers. As a token
              of gratitude, we are offering an{" "}
              <span className="font-semibold text-yellow-300">exclusive 30% lifetime discount</span> on any of our
              SIM-only plans for the public sector workers, and{" "}
              <span className="font-semibold text-yellow-300">20% lifetime discount for up to 5 nominated family and friends.</span>
            </p>

            <button onClick={()=>router.push("/student-discount-application")} className="cursor-pointer rounded-md bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-300">
              Register Now
            </button>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-4">
            {HERO_IMAGES.map((img) => (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt}
                className="h-44 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How to get discount ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHead>How to Get Your Discount</SectionHead>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.slice(0, 3).map((s) => (
              <StepCard key={s.n} {...s} />
            ))}
          </div>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            {STEPS.slice(3).map((s) => (
              <StepCard key={s.n} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Don't Miss Out ── */}
      <section className="bg-gray-100 px-4 py-16 dark:bg-gray-800">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-5 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">Don&rsquo;t Miss Out</h2>
            <p className="mb-8 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Take advantage of this exclusive offer and enjoy significant savings on your mobile plan. Browse our
              plans today and start saving with Zoiko Mobile.
            </p>
            <button onClick={()=>router.push("/plans")} className="rounded-md cursor-pointer border border-green-600 px-6 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
              Browse Plans Now
            </button>
          </div>

          {/* 30% OFF card */}
          <div className="mx-auto flex h-44 w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-[#e6007e] text-white shadow-md">
            <div className="text-5xl font-extrabold">30%</div>
            <div className="text-lg font-semibold">OFF</div>
            <div className="mt-1 text-xs text-white/90">Lifetime Discount</div>
          </div>
        </div>
      </section>

      {/* ── Thank You ── */}
      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-5 text-2xl font-bold text-[#e6007e] sm:text-3xl">Thank You for Your Service</h2>
            <p className="max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              At <span className="font-semibold text-green-600">Zoiko Mobile</span>, we are proud to support our
              public sector workers and their loved ones. We look forward to providing you with the best network
              experience at an unbeatable price.
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <svg className="h-5 w-5 text-[#e6007e]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.6-10-9.3C.6 8.6 2 5 5.2 5c1.9 0 3.2 1 3.8 2 .6-1 1.9-2 3.8-2C16 5 17.4 8.6 16 11.7 13.5 16.4 12 21 12 21z" />
            </svg>
            <span className="text-sm font-semibold">We Appreciate You</span>
          </div>
        </div>
      </section>

      {/* ── Terms & Conditions ── */}
      <section className="bg-gray-100 px-4 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl">
          <SectionHead>Terms &amp; Conditions</SectionHead>

          <div className="space-y-4">
            {TERMS.map((t, i) => (
              <div key={i} className="rounded-lg bg-white px-5 py-4 shadow-sm dark:bg-gray-900">
                <h3 className="mb-1 text-sm font-bold text-green-700 dark:text-green-400">{t.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border-2 border-yellow-300 bg-white px-5 py-4 text-center dark:bg-gray-900">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              This offer can be used in conjunction with other promotional offers from Zoiko Mobile.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button onClick={()=>router.push("/student-discount-application")} className="cursor-pointer rounded-md bg-[#e6007e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
              Join Now
            </button>
            <button onClick={()=>router.push("/switch-and-save")} className="cursor-pointer rounded-md border border-green-600 px-6 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
              Switch &amp; Save
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

function StepCard({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">
        {n}
      </div>
      <h3 className="mb-2 font-bold text-gray-800 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

export default Publicsectordeals;
export { Publicsectordeals };
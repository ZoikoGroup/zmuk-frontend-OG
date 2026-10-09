"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable bits
// ─────────────────────────────────────────────────────────────────────────────

// Dashed placeholder (house style) for photos / mockups
function Img({ className = "", label = "Image" }: { className?: string; label?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-white/40 bg-white/10 text-xs text-white/70 ${className}`}
    >
      {label}
    </div>
  );
}

const Check = ({ className = "h-4 w-4 text-green-600" }: { className?: string }) => (
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

// Feature icons (simple inline SVGs)
const IconWifi = () => (
  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5a10 10 0 0114 0M8 16a5 5 0 018 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconSave = () => (
  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 11a6 6 0 016-6h4a6 6 0 016 6v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3z" />
    <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconPhone = () => (
  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path strokeLinecap="round" d="M11 18h2" />
  </svg>
);
const IconCap = () => (
  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-4 9 4-9 4-9-4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11v4c0 1 2 2 5 2s5-1 5-2v-4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, title: "Choose Your Plan", text: "Browse our range of SIM-only plans and select the one that best suits your needs." },
  { n: 2, title: "Sign Up with Student Email", text: "Register for a Zoiko Mobile account using your student email address." },
  { n: 3, title: "Verify Student Status", text: "Fill out the form and submit your student ID or proof of enrollment to confirm your eligibility for the discount." },
  { n: 4, title: "Get Verification", text: "After successful registration and verification, we will share a promotional code with you via email or through the registered account." },
  { n: 5, title: "Apply Promotional Code", text: "Apply the promotional code during the checkout process to receive a 20% discount on your chosen plan." },
];

const PERKS = [
  { icon: <IconWifi />, label: "Stay Connected" },
  { icon: <IconSave />, label: "Save Money" },
  { icon: <IconPhone />, label: "Easy Switch" },
  { icon: <IconCap />, label: "Focus on Studies" },
];

const SIM_POINTS = ["Keep Your Number", "Easy Network Switch", "No Setup Fees"];

const TERMS = [
  "The student discount and free SIM card offer are available exclusively to registered students at recognized UK educational institutions.",
  "The discount is applicable to the specified monthly plans and contract durations as mentioned earlier.",
  "The free SIM card is available to students switching networks to Zoiko Mobile, as well as to new customers.",
  "Renew your student discount with updated proof of enrollment upon contract expiration.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function Studentdeal() {
  const router = useRouter();
  return (
    <div className="bg-white dark:bg-gray-900">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
                Zoiko Mobile Student Discount Programme
              </span>
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-yellow-300">
                20% OFF
              </span>
            </div>

            <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Stay Connected, Study Smart, Save More
            </h1>

            <p className="mb-8 max-w-xl text-sm leading-relaxed text-white/90">
              Zoiko Mobile is delighted to introduce a{" "}
              <span className="font-semibold text-yellow-300">comprehensive student discount programme</span>{" "}
              with student SIM only deals UK that not only offers{" "}
              <span className="font-semibold text-yellow-300">significant savings on our monthly price plans</span>{" "}
              but also provides a <span className="font-semibold text-yellow-300">free SIM card</span> to students
              looking to switch networks within the UK. We recognise the importance of staying connected while
              managing a tight budget, and we are here to help students make the most of their mobile services,
              including a <span className="font-semibold text-yellow-300">hassle-free network switch.</span>
            </p>
          <Link href="/student-discount-application">
            <button className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-300">
              Register Now
            </button>
          </Link>
          </div>

          {/* Photo grid */}
       <div className="grid grid-cols-2 gap-4">
  <img src="/images/student.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
  <img src="/images/Rectangle 877.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
  <img src="/images/Rectangle 880.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
  <img src="/images/Rectangle 878.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
</div>
        </div>
      </section>

      {/* ── How to get discount ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHead>How to Get Your Discount - Student SIM only Deals UK</SectionHead>

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
              Zoiko Mobile is dedicated to helping students stay connected, save money, and make network switching
              in the UK a seamless process. Join us today to experience affordable, high-quality mobile services
              while focusing on your studies and social life. Stay connected, stay smart, and stay within your
              budget with Zoiko Mobile.
            </p>
            <button onClick={()=>router.push("/plans")} className="cursor-pointer rounded-md border border-green-600 px-6 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
              Browse Plans Now
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PERKS.map((p) => (
              <div key={p.label} className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900">
                {p.icon}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free SIM Card ── */}
      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-5 text-2xl font-bold text-[#e6007e] sm:text-3xl">Free SIM Card and Network Switching</h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              As part of our student discount programme, you will also receive a{" "}
              <span className="font-semibold text-green-600">free SIM card</span> when you join Zoiko Mobile to
              switch from another network. Switching networks within the UK is a straightforward process, and you
              can keep your existing number. By making this switch or joining as a new user, you gain access to our
              discounted student plans, ensuring{" "}
              <span className="font-semibold text-green-600">flexibility and savings.</span>
            </p>
          </div>

          <div>
            {/* SIM card mockup */}
            <div className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-br from-green-600 to-teal-500 p-6 text-white shadow-md">
              <div className="h-10 w-14 rounded-md border-2 border-dashed border-white/50 bg-white/20" />
              <div className="text-right">
                <div className="text-lg font-bold">Zoiko</div>
                <div className="text-xs text-white/90">FREE for Students</div>
              </div>
            </div>

            <div className="space-y-3">
              {SIM_POINTS.map((pt) => (
                <div key={pt} className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
                  <Check />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Terms & Conditions ── */}
      <section className="bg-gray-100 px-4 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl">
          <SectionHead>Terms &amp; Conditions</SectionHead>

          <div className="space-y-4">
            {TERMS.map((t, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-white px-5 py-4 shadow-sm dark:bg-gray-900">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <p className="text-sm text-gray-600 dark:text-gray-300">{t}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border-2 border-yellow-300 bg-white px-5 py-4 text-center dark:bg-gray-900">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              This offer can be used in conjunction with other promotional offers from Zoiko Mobile.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            {/* <Link href="/student-discount-application"> */}
            <button onClick={()=>router.push("/student-discount-application")} className="cursor-pointer rounded-md bg-[#e6007e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
              Join Now
            </button>
            {/* </Link> */}
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

export default Studentdeal;
export { Studentdeal };
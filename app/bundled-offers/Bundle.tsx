
"use client";

import Image from "next/image";
import { useState } from "react";



type Row = { feature: string; cost: string; costFree?: boolean; included: "yes" | "no" | "na" };

const pricingRows: Row[] = [
  { feature: "Calls to UK landlines starting with 01, 02, 03", cost: "£0.22/min", included: "yes" },
  { feature: "Calls to UK mobiles (any network)", cost: "£0.25/min", included: "yes" },
  { feature: "Customer service 500", cost: "FREE", costFree: true, included: "yes" },
  { feature: "Voicemail 555", cost: "FREE", costFree: true, included: "na" },
  { feature: "999, 112, NHS 111", cost: "FREE", costFree: true, included: "na" },
  { feature: "Non-emergency 101", cost: "£0.15/CALL", included: "no" },
  { feature: "0800/0500/0808", cost: "FREE", costFree: true, included: "na" },
  { feature: "UK SMS", cost: "£0.07/SMS", included: "yes" },
  { feature: "UK MMS", cost: "£0.25/MMS", included: "yes" },
  { feature: "UK DATA", cost: "£0.08/MB", included: "yes" },
];

const bundleAccordion: { q: string; a: string }[] = [
  { q: "Pro-rata Charges", a: "Pro-rata charges are applied during the first billing period from the date of Bundle activation until the next bill- cycle date. No pro-rata balance is refunded upon Bundle de-activation the last month is fully billed." },
  { q: "Allowance Information", a: "Voice and Text Bundles come with an Allowance of Minutes and SMS. If you exceed the allowances, Zoiko Mobile will apply the Out-of-Bundle Charge for each additional Minute/SMS used outside the defined Bundle Allowance." },
  { q: "SIP Mobile Services - Voice Allowance", a: "For subscribers using SIP Mobile Services, the Voice Allowance includes National Calls on the Underlying Mobile Network and while roaming in Zone 1 (to comply with RLAH regulation), to be routed to the Zoiko Mobile Platform. Please note that for voice calls delivered to the Service Provider Platform, the Service Provider is responsible for the costs associated with the termination of calls through its own interconnect agreements. Voice Calls from the Service Provider network (Mobile Call Termination SIP Service) are also included." },
  { q: "SIP Mobile Services - Bundle Details", a: "For subscribers using SIP Mobile Services, the Voice Allowance includes National Calls on the Underlying Mobile Network and while roaming in Zone 1 (to comply with RLAH regulation), to be routed to the Zoiko Mobile Platform. Zoiko Mobile offers affordable bundle SIM plans and cheap bundle deals. Please note that for voice calls delivered to the Service Provider Platform, the Service Provider is responsible for the costs associated with the termination of calls through its own interconnect agreements. Voice Calls from the Service Provider network (Mobile Call Termination SIP Service) are also included." },
  { q: "Call Duration & Limits", a: "The maximum call duration is set to 2 hours. Beyond this duration, Zoiko Mobile reserves the right to bill the extra usage at the Out-of-Bundle Charge. All Voice and Texts Bundles are limited to a maximum of 99 distinct destination numbers from each mobile Subscriber per month. Exceeding this limit, Zoiko Mobile reserves the right to bill the extra usage at the Out-of-Bundle Charge." },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

function ImageSlot({ src, alt, className }: { src: string; alt: string; className: string }) {
  return src ? (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width:1024px) 100vw, 72rem" className="object-cover" />
    </div>
  ) : (
    <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-xs uppercase tracking-widest text-gray-400 dark:border-gray-600 dark:bg-gray-700 ${className}`}>
      Image
    </div>
  );
}

function IncludedCell({ v }: { v: Row["included"] }) {
  if (v === "yes") return <span className="font-bold text-[#0e8f74] dark:text-[#34d39e]">YES*</span>;
  if (v === "no") return <span className="font-bold text-red-500">NO</span>;
  return <span className="italic text-gray-400">N/A</span>;
}



export default function Bundle() {
  const [tab, setTab] = useState<"pricing" | "bundles">("pricing");
  const [open, setOpen] = useState<number | null>(3); 
  return (
    <main className="bg-[#f7f8fa] font-sans text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Cost Saving Bundled Plans</h1>
        <p className="mt-3 text-sm text-white/90 sm:text-base">Affordable bundles with transparent pricing</p>
      </section>

      <section className="px-4 py-12 sm:px-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Tabs */}
          <div className="mb-8 grid grid-cols-2 gap-3 rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
            {([["pricing", "Pricing Table"], ["bundles", "Voice & Text Bundles"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg py-3 text-sm font-semibold transition-colors ${tab === key ? "bg-[#0e8f74] text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ─── PRICING TABLE TAB ─── */}
          {tab === "pricing" && (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <ImageSlot src="/images/Bundled Plans.png" alt="Bundled plans overview" className="aspect-[21/6] w-full rounded-none" />

              <div className="p-6 sm:p-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#0e8f74] text-white">
                        <th className="rounded-l-md px-4 py-3 font-semibold">Features</th>
                        <th className="px-4 py-3 font-semibold">Cost</th>
                        <th className="rounded-r-md px-4 py-3 font-semibold">Included</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRows.map((r) => (
                        <tr key={r.feature} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="px-4 py-3.5 text-gray-700 dark:text-gray-200">{r.feature}</td>
                          <td className={`px-4 py-3.5 font-bold ${r.costFree ? "text-[#0e8f74] dark:text-[#34d39e]" : "text-[#0e8f74] dark:text-[#34d39e]"}`}>{r.cost}</td>
                          <td className="px-4 py-3.5"><IncludedCell v={r.included} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Important note */}
                <div className="mt-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-5 text-sm leading-relaxed text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                  <span className="font-bold">Important:</span> Usage will be charged at the Out-Of-Bundle rate for
                  affordable bundle calls and data bundle deals. Subscriptions for SIM and Data Packages are charged
                  upfront for the upcoming month. Pro-rata charges apply during the first billing period from the date of
                  bundle activation until the next bill-cycle date.
                </div>
              </div>
            </div>
          )}

          {/* ─── VOICE & TEXT BUNDLES TAB ─── */}
          {tab === "bundles" && (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
              <ImageSlot src="/images/Bundled-Plans-1.webp" alt="Voice and text bundles" className="aspect-[21/6] w-full rounded-none" />

              <div className="p-6 sm:p-8">
                {/* Bundle Coverage */}
                <div className="rounded-lg border-l-4 border-[#0e8f74] bg-[#e8f1ec] p-5 dark:bg-[#34d39e]/10">
                  <h3 className="text-base font-bold text-[#0e8f74] dark:text-[#34d39e]">Bundle Coverage</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    Zoiko Mobile offers Voice and Text Bundles for <span className="font-semibold">National Calls and National SMS</span> within the
                    Underlying Mobile Network and Value Member Packages while roaming in <span className="font-semibold">Zone 1</span> (to comply with RLAH regulation).
                  </p>
                  <div className="mt-4 rounded-md bg-white p-4 text-sm leading-relaxed text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                    <span className="font-bold">Note:</span> These bundles do not cover Calls and SMS while roaming outside the EU, to any international destination, to any Premium or Special numbers or Services, or incoming Calls and SMS. <span className="font-semibold">Please note that only one Voice and Texts can be subscribed to per SIM card at a time.</span>
                  </div>
                </div>

                {/* Zone pill */}
                <div className="mt-6">
                  <span className="inline-block rounded-full bg-[#0e8f74] px-5 py-2 text-sm font-semibold text-white">
                    Zone 1 - Ireland, Guernsey, Jersey, Isle of Man
                  </span>
                </div>

                {/* Accordion */}
                <div className="mt-6 space-y-3">
                  {bundleAccordion.map((item, i) => {
                    const isOpen = open === i;
                    return (
                      <div key={item.q} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setOpen(isOpen ? null : i)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.q}</span>
                          <span className="text-lg leading-none text-[#0e8f74] dark:text-[#34d39e]">{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <p className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-400">
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}



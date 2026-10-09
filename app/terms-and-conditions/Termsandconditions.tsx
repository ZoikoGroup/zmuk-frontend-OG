"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── DATA ────────────────────────────────────────────────────────────────────

type Subsection = { label: string; text: string };
type Section = {
  id: string;
  num: number;
  title: string;
  navLabel: string;
  intro?: string;
  subsections?: Subsection[];
};

const sections: Section[] = [
  {
    id: "introduction",
    num: 1,
    title: "Introduction",
    navLabel: "Introduction",
    intro:
      "Welcome to Zoiko Mobile. By accessing and using our website, you agree to abide by these Terms and Conditions. Please read this document carefully as it contains important information about your rights and responsibilities.",
  },
  {
    id: "user-responsibilities",
    num: 2,
    title: "User Responsibilities",
    navLabel: "User Responsibilities",
    subsections: [
      {
        label: "2.1 Compliance",
        text: "When using our website, you agree to comply with all applicable laws and regulations, both local and international. You are responsible for ensuring that your use of the site does not violate any legal requirements.",
      },
      {
        label: "2.2 Accuracy of Information",
        text: "You are responsible for the accuracy and truthfulness of the information you provide on our website. Any information you submit should not be misleading, false, or fraudulent.",
      },
      {
        label: "2.3 Security",
        text: "You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.",
      },
    ],
  },
  {
    id: "intellectual-property-rights",
    num: 3,
    title: "Intellectual Property Rights",
    navLabel: "Intellectual Property Rights",
    subsections: [
      {
        label: "3.1 Content Ownership",
        text: "All content on this website, including but not limited to text, images, graphics, logos, and software, is the property of Zoiko Mobile or its content suppliers and is protected by intellectual property laws. You may not use, reproduce, or distribute our content without express written permission.",
      },
      {
        label: "3.2 User-Generated Content",
        text: "If you submit content to our website, such as comments, reviews, or other user-generated material, you grant Zoiko Mobile a non-exclusive, royalty-free, worldwide, and perpetual license to use, modify, reproduce, and distribute that content for any purpose.",
      },
    ],
  },
  {
    id: "prohibited-activities",
    num: 4,
    title: "Prohibited Activities",
    navLabel: "Prohibited Activities",
    subsections: [
      {
        label: "4.1 Unauthorized Access",
        text: "You may not attempt to gain unauthorized access to our website or any part of it. This includes circumventing any security measures, hacking, or using any automated tools for data extraction.",
      },
      {
        label: "4.2 Malicious Use",
        text: "You may not use our website for any malicious purposes, such as spreading malware, conducting phishing attacks, or engaging in any other harmful activities.",
      },
      {
        label: "4.3 Infringement",
        text: "You may not use our website to infringe on the intellectual property rights of others, engage in defamation, or violate any laws related to the content you publish.",
      },
    ],
  },
  {
    id: "limitation-of-liability",
    num: 5,
    title: "Limitation of Liability",
    navLabel: "Limitation of Liability",
    subsections: [
      {
        label: "5.1 Disclaimer",
        text: "Zoiko Mobile is not responsible for any indirect, incidental, special, or consequential damages that result from your use of our website. We provide our services \u201cas is\u201d without any warranties.",
      },
      {
        label: "5.2 Third-Party Links",
        text: "Our website may contain links to third-party websites. We are not responsible for the content, reliability, or privacy practices of these external sites.",
      },
    ],
  },
  {
    id: "dispute-resolution",
    num: 6,
    title: "Dispute Resolution",
    navLabel: "Dispute Resolution",
    intro:
      "In the event of any disputes or claims related to your use of our website, you agree to attempt to resolve them through negotiation and good faith communication. If a resolution cannot be reached through negotiation, the dispute will be subject to the exclusive jurisdiction of the courts in England and Wales.",
  },
  {
    id: "updates-to-terms",
    num: 7,
    title: "Updates to the Terms and Conditions",
    navLabel: "Updates to Terms",
    intro:
      "We may update these Terms and Conditions from time to time to reflect changes in our services or for other operational, legal, or regulatory reasons. The date of the latest revision will be indicated at the top of the document.",
  },
  {
    id: "contact-information",
    num: 8,
    title: "Contact Information",
    navLabel: "Contact Information",
    intro:
      "If you have any questions or concerns about these Terms and Conditions, please contact us at the following address:",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function NumberBadge({ num }: { num: number }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1f9d6b] text-sm font-bold text-white">
      {num}
    </span>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function TermsAndConditions() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("zoiko_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleAccountButton = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
        <p className="text-xs text-white/80">
          <a href="/" className="hover:text-white">Home</a> / Terms and Conditions
        </p>
        <h1 className="mt-3 font-extrabold text-[clamp(1.9rem,5vw,2.75rem)]">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-white/80">Last updated: October 2025</p>
      </section>

      {/* ─── Content ─── */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Quick navigation */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Quick Navigation</p>
            <ul className="mt-4 space-y-2.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block text-sm text-gray-600 transition-colors hover:text-[#0e8f74] dark:text-gray-300">
                    {s.navLabel}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="flex items-center gap-3">
                <NumberBadge num={s.num} />
                <h2 className="text-lg font-bold text-gray-800 sm:text-xl dark:text-white">{s.title}</h2>
              </div>

              {s.intro && (
                <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-300">{s.intro}</p>
              )}

              {s.subsections && (
                <div className="mt-5 space-y-5">
                  {s.subsections.map((sub) => (
                    <div key={sub.label} className="border-l-4 border-[#1f9d6b] pl-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{sub.label}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{sub.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact box for section 8 */}
              {s.id === "contact-information" && (
                <div className="mt-5 rounded-xl bg-gray-50 p-5 ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-700">
                  <p className="font-bold text-gray-800 dark:text-white">Zoiko Mobile</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Berkeley Suite, 35 Berkeley Square,</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mayfair, London W1J 5BF</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Email:</span>{" "}
                    <a href="mailto:info@zoikomobile.co.uk" className="text-[#e6007e] hover:underline">
                      info@zoikomobile.co.uk
                    </a>
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Telephone:</span> +44 7071 646 399
                  </p>
                </div>
              )}
            </section>
          ))}

          {/* Closing note */}
          <div className="rounded-2xl bg-gradient-to-br from-[#eef0fb] to-[#f3eefb] p-8 text-center ring-1 ring-gray-100 dark:from-gray-800 dark:to-gray-800 dark:ring-gray-700">
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              By using Zoiko Mobile&rsquo;s website, you agree to these Terms and Conditions. Thank you
              for choosing Zoiko Mobile as your online destination. We value your compliance with
              these guidelines to ensure a secure and enjoyable online experience.
            </p>
            <button
              onClick={handleAccountButton}
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-7 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              {isLoggedIn ? "Back to My Account" : "Log In"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

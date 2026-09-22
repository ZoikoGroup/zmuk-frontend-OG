"use client";

import React from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_NAV = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-your-information", label: "How We Use Your Information" },
  { id: "cookie-policy", label: "Cookie Policy" },
  { id: "data-retention", label: "Data Retention" },
  { id: "user-rights", label: "User Rights" },
  { id: "security-measures", label: "Security Measures" },
  { id: "disclosure-of-information", label: "Disclosure of Information" },
  { id: "third-party-links", label: "Third-Party Links" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "updates-to-privacy-policy", label: "Updates to the Privacy Policy" },
  { id: "contact-information", label: "Contact Information" },
];

const USE_CARDS = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    ),
    title: "Service Delivery",
    body: "Process orders and provide customer support",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-teal-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ),
    title: "Analytics",
    body: "Improve website functionality and user experience",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    ),
    title: "Security",
    body: "Protect against fraud and abuse",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ),
    title: "Communications",
    body: "Send updates and promotional materials",
  },
];

const USER_RIGHTS = [
  { no: "5.1", title: "Access", body: "You have the right to request a copy of the personal information we hold about you." },
  { no: "5.2", title: "Rectification", body: "You have the right to request that we correct any inaccurate or incomplete personal information." },
  { no: "5.3", title: "Deletion", body: "You have the right to request the deletion of your personal information under certain circumstances." },
  { no: "5.4", title: "Restriction", body: "You have the right to request the restriction of processing of your personal information under certain circumstances." },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6 pt-8">
      <div className="w-8 h-8 shrink-0 rounded-full bg-[#49a873] flex items-center justify-center text-white font-bold text-sm shadow-sm">
        {num}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

function Callout({
  variant = "gray",
  title,
  children,
}: {
  variant?: "gray" | "red" | "blue" | "pink" | "solidGreen";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    gray: "bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    red: "bg-[#fdf3f3] border border-red-100 text-gray-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-gray-300",
    blue: "bg-[#f0f7ff] border border-blue-100 text-gray-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-gray-300",
    pink: "bg-[#fdf0f5] border border-pink-100 text-gray-700 dark:bg-pink-950/20 dark:border-pink-900/30 dark:text-gray-300",
    solidGreen: "bg-[#259b76] border border-[#259b76] text-white",
  };

  return (
    <div className={`p-5 rounded-lg ${styles[variant]} my-6`}>
      {title && (
        <h4 className={`text-[15px] font-bold mb-2 ${variant === "solidGreen" ? "text-white" : "text-gray-900 dark:text-white"}`}>
          {title}
        </h4>
      )}
      <div className={`text-[14px] leading-relaxed ${variant === "solidGreen" ? "text-white/90" : ""}`}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#0a0a0a] py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-10 items-start">
        
        {/* ── Sidebar ── */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-8">
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-wider">
              Quick Navigation
            </h3>
            <ul className="space-y-4">
              {QUICK_NAV.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`#${item.id}`}
                    className="text-[14px] text-gray-500 hover:text-[#49a873] dark:text-gray-400 dark:hover:text-[#49a873] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-8 md:p-12">
          
          {/* Intro Text */}
          <div className="pb-8 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
              At Zoiko Mobile, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information. By using our website, you consent to the practices described in this policy.
            </p>
          </div>

          {/* 1. Information We Collect */}
          <section id="information-we-collect">
            <SectionHeading num={1} title="Information We Collect" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              At Zoiko Mobile, we may collect the following types of information:
            </p>
            <SubSection title="1.1 Personal Information">
              We may collect personal information, such as your name, email address, phone number, or other identifying information when you voluntarily provide it to us through our website, forms, or other interactions.
            </SubSection>
            <SubSection title="1.2 Device Information">
              We may also collect information about the device you use to access our website, including your IP address, browser type, operating system, and other technical details.
            </SubSection>
            <Callout title="What This Means:">
              We only collect information necessary to provide you with our services and improve your experience.
            </Callout>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 2. How We Use Your Information */}
          <section id="how-we-use-your-information">
            <SectionHeading num={2} title="How We Use Your Information" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              We may use the information we collect for various purposes, including but not limited to:
            </p>
            <SubSection title="2.1 Providing Services">
              To provide you with the services and products you request, process transactions, and deliver customer support.
            </SubSection>
            <SubSection title="2.2 Improving Our Website">
              To enhance and optimise our website's functionality, user experience, and content.
            </SubSection>
            <SubSection title="2.3 Marketing and Communications">
              To send you promotional materials, updates, and notifications about our products and services, subject to your consent where required by law.
            </SubSection>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {USE_CARDS.map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="mb-4">{card.icon}</div>
                  <h4 className="font-bold text-[15px] text-gray-900 dark:text-white mb-2">{card.title}</h4>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 3. Cookie Policy */}
          <section id="cookie-policy">
            <SectionHeading num={3} title="Cookie Policy" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              Please refer to our Cookie Policy for detailed information about the use of cookies, including types of cookies used and instructions on how to manage your cookie preferences.
            </p>
            <Callout title="Understanding Cookies">
              Cookies are small text files that are placed on your device to help us provide a better service. You can manage your cookie preferences through your browser settings.
            </Callout>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 4. Data Retention */}
          <section id="data-retention">
            <SectionHeading num={4} title="Data Retention" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              We will retain your personal information only for as long as necessary for the purposes set out in this Privacy Policy unless a longer retention period is required or permitted by law.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-[18px] h-[18px] shrink-0 rounded-full bg-[#49a873] mt-1"></div>
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Active Account</h4>
                  <p className="text-[14px] text-gray-600 dark:text-gray-400">Data retained while your account is active</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-[18px] h-[18px] shrink-0 rounded-full bg-[#49a873] mt-1"></div>
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Post-Closure</h4>
                  <p className="text-[14px] text-gray-600 dark:text-gray-400">Up to 7 years for legal and tax purposes</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-[18px] h-[18px] shrink-0 rounded-full bg-[#49a873] mt-1"></div>
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Deletion</h4>
                  <p className="text-[14px] text-gray-600 dark:text-gray-400">Securely deleted after retention period</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 5. User Rights */}
          <section id="user-rights">
            <SectionHeading num={5} title="User Rights" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              Under the General Data Protection Regulation (GDPR), you have certain rights regarding your personal information. These rights include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {USER_RIGHTS.map((r, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-6">
                  <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">
                    {r.no} {r.title}
                  </h4>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">{r.body}</p>
                </div>
              ))}
            </div>
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-6 flex flex-col items-start gap-4">
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">Exercise Your Rights</h4>
                <p className="text-[14px] text-gray-600 dark:text-gray-400">
                  To exercise any of these rights, please contact our Data Protection Officer using the contact details provided at the end of this policy.
                </p>
              </div>
              <button className="bg-[#49a873] hover:bg-[#3d9162] text-white px-6 py-2.5 rounded-full text-[13px] font-bold transition-colors">
                Contact Us
              </button>
            </div>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 6. Security Measures */}
          <section id="security-measures">
            <SectionHeading num={6} title="Security Measures" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              We implement appropriate technical and organisational measures to protect your personal information. However, no method of transmission over the internet or electronic storage is entirely secure, and we cannot guarantee absolute security.
            </p>
            <div className="space-y-5">
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Encryption</h4>
                <p className="text-[14px] text-gray-600 dark:text-gray-400">All data transmitted is encrypted using SSL/TLS technology</p>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Access Control</h4>
                <p className="text-[14px] text-gray-600 dark:text-gray-400">Strict access controls limit who can view your information</p>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Monitoring</h4>
                <p className="text-[14px] text-gray-600 dark:text-gray-400">Continuous monitoring for security threats and breaches</p>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">Compliance</h4>
                <p className="text-[14px] text-gray-600 dark:text-gray-400">Regular audits to ensure compliance with data protection laws</p>
              </div>
            </div>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 7. Disclosure of Information */}
          <section id="disclosure-of-information">
            <SectionHeading num={7} title="Disclosure of Information" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              We may disclose your personal information to third parties in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-3 text-[14px] text-gray-600 dark:text-gray-400 mb-6 ml-2 marker:text-gray-400">
              <li><strong className="text-gray-900 dark:text-white">With your explicit consent:</strong> When you have given us permission to share your information.</li>
              <li><strong className="text-gray-900 dark:text-white">To comply with legal obligations:</strong> When required by law or legal process.</li>
              <li><strong className="text-gray-900 dark:text-white">To protect our rights, privacy, safety, or property:</strong> When necessary to protect our legitimate interests.</li>
              <li><strong className="text-gray-900 dark:text-white">In connection with a sale, merger, or acquisition:</strong> If all or part of our company is involved in a business transaction.</li>
            </ul>
            <Callout variant="red" title="Important:">
              We will never sell your personal information to third parties for marketing purposes without your explicit consent.
            </Callout>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 8. Third-Party Links */}
          <section id="third-party-links">
            <SectionHeading num={8} title="Third-Party Links" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to read the privacy policies of these third-party sites.
            </p>
            <Callout variant="blue" title="External Links:">
              When you click on third-party links, you leave our website and are subject to the privacy policies of those external sites.
            </Callout>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 9. Children's Privacy */}
          <section id="childrens-privacy">
            <SectionHeading num={9} title="Children's Privacy" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              Our website is not intended for children under the age of 13. We do not knowingly collect or maintain personal information from children under 13 years of age. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us, and we will take appropriate action to remove the information.
            </p>
            <Callout variant="pink" title="Protection of Minors">
              We are committed to protecting children's privacy online. If we become aware that we have collected personal information from a child under 13, we will delete it immediately.
            </Callout>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 10. Updates to the Privacy Policy */}
          <section id="updates-to-privacy-policy">
            <SectionHeading num={10} title="Updates to the Privacy Policy" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. The date of the latest revision will be indicated at the top of the policy.
            </p>
            <Callout variant="gray" title="Stay Informed">
              <p className="mb-4">We recommend reviewing this policy periodically. Continued use of our services after changes constitutes your acceptance of the updated policy.</p>
              <p className="text-gray-400 dark:text-gray-500 italic text-[13px]">Last Updated: January 2025</p>
            </Callout>
          </section>

          <hr className="border-gray-100 dark:border-gray-800 my-8" />

          {/* 11. Contact Information */}
          <section id="contact-information">
            <SectionHeading num={11} title="Contact Information" />
            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-6">
              If you have any questions or concerns about these Terms of Use for Mobile Apps, please contact us at the following address:
            </p>
            
            <Callout variant="gray" title="Zoiko Mobile">
              <div className="space-y-4">
                <p>Berkeley Suite, 35 Berkeley Square,<br/>Mayfair, London W1J 5BF</p>
                <p><strong>Email:</strong> <a href="mailto:info@zoikomobile.co.uk" className="text-[#49a873] hover:underline">info@zoikomobile.co.uk</a></p>
                <p><strong>Telephone:</strong> +44 7071 646 399</p>
              </div>
            </Callout>

            <Callout variant="solidGreen" title="Data Protection Officer">
              For specific privacy-related inquiries, you can contact our dedicated Data Protection Officer who will assist you with any concerns regarding your personal data.
            </Callout>
          </section>

          {/* Footer Action */}
          <div className="mt-16 text-center">
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
              By using the App, you agree to these Terms. Thank you for choosing Zoiko Mobile and for adhering to these guidelines for app usage.
            </p>
            <button className="bg-[#49a873] hover:bg-[#3d9162] text-white px-8 py-2.5 rounded-full text-[14px] font-bold transition-colors">
              View Plans
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}
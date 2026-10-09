// ─── DATA ────────────────────────────────────────────────────────────────────

const navItems = [
  { id: "introduction", label: "Introduction" },
  { id: "policy-statement", label: "Policy Statement" },
  { id: "organizational-responsibility", label: "Organizational Responsibility" },
  { id: "supply-chain", label: "Supply Chain" },
  { id: "training", label: "Training and Awareness" },
  { id: "reporting", label: "Reporting and Whistleblowing" },
  { id: "transparency", label: "Transparency" },
  { id: "contact-information", label: "Contact Information" },
];

const supplyChain = [
  {
    label: "4.1",
    title: "Supplier Engagement",
    desc: "Zoiko Mobile works with suppliers who share our commitment to preventing modern slavery and human trafficking. We require our suppliers to adhere to this policy and to demonstrate their compliance.",
  },
  {
    label: "4.2",
    title: "Due Diligence:",
    desc: "We conduct due diligence to assess and address risks within our supply chain. We strive to identify and mitigate risks of modern slavery and human trafficking, with a focus on high-risk areas.",
  },
  {
    label: "4.3",
    title: "Audits and Monitoring:",
    desc: "Periodic audits and monitoring of our supply chain are conducted to ensure compliance with this policy and the law.",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Numbered badge — plain text on a green circle. */
function NumberBadge({ num }: { num: number }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1f9d6b] text-sm font-bold text-white">
      {num}
    </span>
  );
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <NumberBadge num={num} />
      <h2 className="text-lg font-bold leading-snug text-gray-800 dark:text-gray-100 sm:text-xl">{title}</h2>
    </div>
  );
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-[#1f9d6b] pl-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</h3>
      <div className="mt-1.5 space-y-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{children}</div>
    </div>
  );
}

function sectionCx(extra = "") {
  return `scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 sm:p-8 ${extra}`;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function modern() {
  return (
    <main className="bg-gray-50 font-sans text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
        <p className="text-xs text-white/80">
          <a href="/" className="hover:text-white">Home</a> / Modern Slavery Policy
        </p>
        <h1 className="mt-3 font-extrabold text-[clamp(1.9rem,5vw,2.75rem)]">Modern Slavery Policy</h1>
        <p className="mt-2 text-sm text-white/80">Our commitment to ethical business practices</p>
      </section>

      {/* ─── Content ─── */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Quick navigation */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Quick Navigation</p>
            <ul className="mt-4 space-y-2.5">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="block text-sm text-gray-600 transition-colors hover:text-[#0e8f74] dark:text-gray-300 dark:hover:text-emerald-400">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Sections */}
        <div className="space-y-6">
          {/* 1. Introduction */}
          <section id="introduction" className={sectionCx()}>
            <SectionHeader num={1} title="Introduction" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Zoiko Mobile is committed to combating modern slavery and human trafficking in all its
              forms. This Modern Slavery Policy outlines our commitment to taking proactive measures to
              prevent such practices within our organization and supply chains.
            </p>
          </section>

          {/* 2. Policy Statement */}
          <section id="policy-statement" className={sectionCx()}>
            <SectionHeader num={2} title="Policy Statement" />
            <div className="mt-5 space-y-5">
              <Subsection label="2.1 Our Commitment:">
                <p>
                  Zoiko Mobile is dedicated to ensuring that modern slavery and human trafficking have
                  no place in our business operations. We uphold the principles of transparency,
                  accountability, and ethical conduct in our approach to business.
                </p>
              </Subsection>
              <Subsection label="2.2 Compliance:">
                <p>
                  We are committed to complying with the provisions of the Modern Slavery Act 2015 and
                  all relevant legislation, taking necessary steps to prevent slavery and human
                  trafficking within our operations.
                </p>
              </Subsection>
            </div>
          </section>

          {/* 3. Organizational Responsibility */}
          <section id="organizational-responsibility" className={sectionCx()}>
            <SectionHeader num={3} title="Organizational Responsibility" />
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border-l-4 border-[#1f9d6b] bg-[#eef9f3] p-5 dark:bg-emerald-900/20">
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  Responsibility for combating modern slavery and human trafficking is upheld at all
                  levels of the organization.
                </p>
              </div>
              <Subsection label="3.2 Employees:">
                <p>
                  All employees of Zoiko Mobile are expected to act in accordance with this policy and
                  report any concerns related to modern slavery or human trafficking through our
                  confidential reporting channels.
                </p>
              </Subsection>
            </div>
          </section>

          {/* 4. Supply Chain */}
          <section id="supply-chain" className={sectionCx()}>
            <SectionHeader num={4} title="Supply Chain" />
            <div className="mt-5 space-y-4">
              {supplyChain.map((c) => (
                <div key={c.label} className="flex items-start gap-3 rounded-xl bg-gray-50 p-5 ring-1 ring-gray-100 dark:bg-gray-900/40 dark:ring-gray-700">
                  <span className="flex h-8 min-w-[2rem] flex-shrink-0 items-center justify-center rounded-lg bg-[#1f9d6b] px-1.5 text-xs font-bold text-white">
                    {c.label}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Training and Awareness */}
          <section id="training" className={sectionCx()}>
            <SectionHeader num={5} title="Training and Awareness" />
            <div className="mt-5">
              <Subsection label="5.1 Training:">
                <p>
                  We provide training to our employees and suppliers to raise awareness of modern
                  slavery and human trafficking risks and to equip them with the knowledge and tools
                  necessary to identify and address such risks.
                </p>
              </Subsection>
            </div>
          </section>

          {/* 6. Reporting and Whistleblowing */}
          <section id="reporting" className={sectionCx()}>
            <SectionHeader num={6} title="Reporting and Whistleblowing" />
            <div className="mt-5">
              <Subsection label="6.1 Reporting Channels:">
                <p>
                  Zoiko Mobile maintains confidential reporting channels for employees, suppliers, and
                  other stakeholders to report concerns related to modern slavery or human trafficking.
                </p>
                <p>
                  Reports are thoroughly investigated, and appropriate actions are taken in response to
                  concerns or allegations of modern slavery or human trafficking.
                </p>
              </Subsection>
            </div>
          </section>

          {/* 7. Transparency */}
          <section id="transparency" className={sectionCx()}>
            <SectionHeader num={7} title="Transparency" />
            <div className="mt-5">
              <Subsection label="7.1 Transparency in Reporting:">
                <p>
                  Zoiko Mobile commits to providing annual transparency reports in compliance with the
                  Modern Slavery Act 2015, outlining the steps taken to prevent modern slavery and human
                  trafficking within our organisation and supply chain.
                </p>
              </Subsection>
            </div>
          </section>

          {/* 8. Contact Information */}
          <section id="contact-information" className={sectionCx()}>
            <SectionHeader num={8} title="Contact Information" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              If you have any questions or require further information about our Modern Slavery Policy,
              please contact us at the following address:
            </p>
            <div className="mt-5 rounded-xl border border-[#cdeede] bg-[#eef9f3] p-5 dark:border-emerald-800/50 dark:bg-emerald-900/20">
              <p className="font-bold text-gray-800 dark:text-gray-100">Zoiko Mobile</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Berkeley Suite,</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">35 Berkeley Square, Mayfair,</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">London W1J 5BF</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Email:</span>{" "}
                <a href="mailto:info@zoikomobile.co.uk" className="text-[#e6007e] hover:underline">
                  info@zoikomobile.co.uk
                </a>
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Telephone:</span> +44 2071 646 399
              </p>
            </div>
          </section>

          {/* Closing note */}
          <div className="rounded-2xl bg-gradient-to-b from-[#eef9f3] to-[#f6fbf8] p-8 text-center ring-1 ring-gray-100 dark:from-emerald-900/20 dark:to-gray-800 dark:ring-gray-700">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1f9d6b] text-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5-9 5-9-5 9-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 5 9-5M3 16l9 5 9-5" />
              </svg>
            </span>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Zoiko Mobile is unwavering in its commitment to the eradication of modern slavery and
              human trafficking. We believe in a world where every individual is treated with dignity,
              respect, and fairness. Thank you for choosing Zoiko Mobile and for supporting our mission
              to end modern slavery.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
import Image from "next/image";

// ─── DATA ────────────────────────────────────────────────────────────────────
//
// Each card's `img` is the full colored icon graphic (the rounded square is part
// of the image). Drop real assets at these paths in /public, or rename to match.

const navItems = [
  { id: "intro-esg", label: "Introduction of ESG Policy" },
  { id: "environmental", label: "Environmental Responsibility" },
  { id: "social", label: "Social Responsibility" },
  { id: "governance", label: "Governance and Ethics" },
  { id: "reporting", label: "Reporting and Continuous Improvement" },
  { id: "compliance", label: "Compliance" },
  { id: "continuous-enhancement", label: "Continuous Enhancement" },
  { id: "conclusion", label: "Conclusion" },
];

type Card = { img: string; title: string; desc: string };

const environmental: Card[] = [
  { img: "/images/bg7.png", title: "Compliance", desc: "Zoiko Mobile is committed to strict compliance with all relevant environmental laws and regulations, ensuring that our operations adhere to the highest environmental standards." },
  { img: "/images/bg13.png", title: "Resource Efficiency", desc: "We will actively work to minimize resource consumption and reduce our carbon footprint by embracing energy-efficient practices and waste reduction." },
  { img: "/images/bg14.png", title: "Innovation for Sustainability", desc: "Zoiko Mobile will drive innovation in the development of environmentally friendly and energy-efficient products and services, contributing to a more sustainable environment." },
];

const social: Card[] = [
  { img: "/images/s-shaped.png", title: "Fair Labour Practices", desc: "Zoiko Mobile is committed to maintaining fair labour practices, which include providing fair wages, ensuring safe and healthy working conditions, and respecting workers' rights." },
  { img: "/images/s-shaped.png", title: "Community Engagement", desc: "We actively engage with the communities where we operate, supporting social development, philanthropy, and volunteerism to make a positive impact on society." },
  { img: "/images/s-shaped.png", title: "Customer Focus", desc: "Our top priority is customer satisfaction. We achieve this by delivering high-quality products and services, maintaining transparency, and conducting our business with the utmost integrity." },
];

const governance: Card[] = [
  { img: "/images/bg8.png", title: "Ethical Conduct", desc: "Zoiko Mobile conducts its business with the highest ethical standards, guided by a robust code of conduct that applies to all employees and stakeholders." },
  { img: "/images/bg9.png", title: "Board Diversity", desc: "Our board of directors strives to be diverse in terms of expertise, gender, and background, encouraging a broader range of perspectives in our decision-making processes." },
  { img: "/images/bg10.png", title: "Transparency and Accountability", desc: "We are committed to maintaining transparency in financial reporting, corporate governance, and decision-making processes, while adhering to legal and regulatory requirements." },
  { img: "/images/bg11.png", title: "Risk Management", desc: "Zoiko Mobile actively assesses and manages risks to the business, including those related to ESG issues, to safeguard the long-term interests of our stakeholders." },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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
      <h2 className="text-lg font-bold leading-snug text-gray-800 dark:text-white sm:text-xl">{title}</h2>
    </div>
  );
}

/** Card icon — image slot. The colored rounded square is part of the asset. */
function CardIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      className="h-12 w-12 flex-shrink-0 object-contain"
    />
  );
}

/** Vertical icon card (used for Environmental + Governance). */
function IconCard({ card }: { card: Card }) {
  return (
    <div className="rounded-xl bg-gray-50 p-5 ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-700">
      <CardIcon src={card.img} alt={card.title} />
      <h3 className="mt-4 text-sm font-bold text-gray-700 dark:text-white">{card.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{card.desc}</p>
    </div>
  );
}

/** Full-width row card (used for Social). */
function RowCard({ card }: { card: Card }) {
  return (
    <div className="rounded-xl bg-gray-50 p-5 ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-700">
      <div className="flex items-center gap-3">
        <CardIcon src={card.img} alt={card.title} />
        <h3 className="text-sm font-bold text-gray-700 dark:text-white">{card.title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{card.desc}</p>
    </div>
  );
}

function sectionCx(extra = "") {
  return `scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 sm:p-8 ${extra}`;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function ESGPolicy() {
  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
        <p className="text-xs text-white/80">
          <a href="/" className="hover:text-white">Home</a> / ESG Policy
        </p>
        <h1 className="mt-3 font-extrabold text-[clamp(1.6rem,4.5vw,2.5rem)]">
          Environmental, Social, and Governance (ESG) Policy
        </h1>
        <p className="mt-2 text-sm text-white/80">
          Our commitment to responsible corporate citizenship and sustainability
        </p>
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
                  <a href={`#${item.id}`} className="block text-sm text-gray-600 transition-colors hover:text-[#0e8f74] dark:text-gray-300 dark:hover:text-[#34d39e]">
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
          <section id="intro-esg" className={sectionCx()}>
            <SectionHeader num={1} title="Introduction of ESG Policy" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Zoiko Mobile, a registered trademark of Zoiko Telecom Ltd, establishes this
              Environmental, Social, and Governance (ESG) Policy to formalize our commitment to
              responsible corporate citizenship and sustainability. This policy outlines our core
              principles and dedication to ESG principles.
            </p>
          </section>

          {/* 2. Environmental Responsibility */}
          <section id="environmental" className={sectionCx()}>
            <SectionHeader num={2} title="Environmental Responsibility" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {environmental.map((c) => (
                <IconCard key={c.title} card={c} />
              ))}
            </div>
          </section>

          {/* 3. Social Responsibility */}
          <section id="social" className={sectionCx()}>
            <SectionHeader num={3} title="Social Responsibility" />
            <div className="mt-5 space-y-4">
              {social.map((c) => (
                <RowCard key={c.title} card={c} />
              ))}
            </div>
          </section>

          {/* 4. Governance and Ethics */}
          <section id="governance" className={sectionCx()}>
            <SectionHeader num={4} title="Governance and Ethics" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {governance.map((c) => (
                <IconCard key={c.title} card={c} />
              ))}
            </div>
          </section>

          {/* 5. Reporting and Continuous Improvement */}
          <section id="reporting" className={sectionCx()}>
            <SectionHeader num={5} title="Reporting and Continuous Improvement" />
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              <p>
                Zoiko Mobile is committed to regularly assessing and reporting on our ESG performance
                to ensure transparency and accountability to our stakeholders.
              </p>
              <p>
                We actively seek feedback from stakeholders and engage with them to align our ESG
                initiatives with their expectations.
              </p>
            </div>
          </section>

          {/* 6. Compliance */}
          <section id="compliance" className={sectionCx()}>
            <SectionHeader num={6} title="Compliance" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-100">Zoiko Mobile</span> commits to full
              compliance with all relevant laws, regulations, and industry standards pertaining to ESG
              issues.
            </p>
          </section>

          {/* 7. Continuous Enhancement */}
          <section id="continuous-enhancement" className={sectionCx()}>
            <SectionHeader num={7} title="Continuous Enhancement" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              We continuously review and enhance our ESG practices, setting increasingly higher
              standards and achieving better performance in environmental, social, and governance
              matters.
            </p>
          </section>

          {/* 8. Conclusion */}
          <section id="conclusion" className={sectionCx()}>
            <SectionHeader num={8} title="Conclusion" />
            <div className="mt-5 rounded-2xl bg-gradient-to-b from-[#eef9f3] to-[#f6fbf8] p-8 text-center ring-1 ring-[#cdeede] dark:from-[#0e8f74]/10 dark:to-[#0e8f74]/5 dark:ring-[#0e8f74]/30">
              {/* Conclusion icon — image slot */}
              <Image
                src="/images/bg12.png"
                alt="ESG commitment"
                width={80}
                height={80}
                className="mx-auto h-16 w-16 object-contain"
              />
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                This ESG Policy underscores Zoiko Mobile&rsquo;s unwavering commitment to sustainable
                and responsible business practices, focusing on environmental conservation, social
                responsibility, and sound governance. Our aim is to be a leader in ESG initiatives,
                providing value to our stakeholders and contributing to a more sustainable and
                inclusive world.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default ESGPolicy;
export { ESGPolicy };
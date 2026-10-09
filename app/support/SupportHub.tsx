import Link from "next/link";

// ─── ICONS ─────────────────────────────────────────────────────────────────

const Arrow = () => (
  <svg className="h-4 w-4 flex-shrink-0 text-[#0e8f74] transition-transform group-hover:translate-x-0.5 dark:text-[#34d39e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" /></svg>
);

// ─── DATA ────────────────────────────────────────────────────────────────────
//
// Each card's `href` is left empty ("") for you to fill with the real route;
// it falls back to "#" until then.

type Card = { title: string; desc: string; href: string };

const customerSupport: Card[] = [
  { title: "Help & Support", desc: "Browse our comprehensive help center with answers to common questions", href: "/help-support" },
  { title: "Reasons to Love Zoiko", desc: "Discover what makes Zoiko Mobile special and why customers choose us", href: "/reasons-to-love-zoiko" },
  { title: "Check Network Coverage", desc: "Find out about network coverage in your area with our coverage checker", href: "https://ee.co.uk/help/mobile-coverage-checker" },
  { title: "FAQs", desc: "Quick answers to the most frequently asked questions", href: "/faqs" },
  { title: "How to Activate SIM Cards", desc: "Step-by-step guide to activate your new Zoiko Mobile SIM card", href: "/how-to-activate-sim-cards" },
];

const getStarted: Card[] = [
  { title: "Switch & Save", desc: "Make the switch to Zoiko Mobile and start saving on your mobile bills", href: "/switch-and-save" },
  { title: "Join Zoiko Family", desc: "Bring your family together with our family plans and shared benefits", href: "/login" },
  { title: "Free Delivery", desc: "Get your SIM card and devices delivered to your door at no extra cost", href: "/free-delivery" },
  { title: "Refurbished Smartphones", desc: "Explore our range of quality refurbished smartphones at great prices", href: "/devices" },
  { title: "Return Policy", desc: "Learn about our hassle-free return policy and process", href: "/return-policy" },
];

const tariffs: Card[] = [
  { title: "Roaming Charges", desc: "Find out about charges for using your phone when traveling abroad", href: "/roaming-and-coverage" },
  { title: "Bundled Offers", desc: "Discover our money-saving bundle deals for calls, texts, and data", href: "/bundled-offers" },
  { title: "Free International Calls", desc: "Learn about destinations included in your free international calling", href: "/international-calling" },
  { title: "Out-of-Bundle Rates", desc: "Standard charges for calls, texts, and data outside your plan", href: "/out-of-bundle-rates" },
  { title: "Public Sector Lifetime Deals", desc: "Special pricing and offers for public sector employees", href: "/civilservants" },
];

const whatsIncluded: Card[] = [
  { title: "5G Speed", desc: "Experience lightning-fast 5G speeds across our network coverage", href: "/superfast-5g-data" },
  // { title: "Wi-Fi Calling", desc: "Make calls and send texts over Wi-Fi when mobile signal is weak", href: "/wifi-calling" },
  { title: "EU Roaming", desc: "Use your UK allowances when traveling in the European Union", href: "/roaming-and-coverage" },
  { title: "International Calls", desc: "Stay connected with friends and family around the world", href: "/international-calling" },
  { title: "eSIM", desc: "Get connected instantly with our digital eSIM technology", href: "/activate-your-sim" },
];

const contactCards = [
  { title: "Phone Support", lines: ["333 (from Zoiko mobile)", "0333 004 0333 (other networks)"], badge: "24/7 Available", href: "tel:03330040333" },
  { title: "Live Chat", lines: ["Get instant help from our support team"], badge: "Available now", href: "" },
  // { title: "WhatsApp", lines: ["Message us on WhatsApp for quick support"], badge: "Business hours", href: "" },
  { title: "Email Support", lines: ["help@zoikomobile.co.uk"], badge: "Response within 24 hours", href: "mailto:help@zoikomobile.co.uk" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function LinkCard({ title, desc, href }: Card) {
  return (
    <Link
      href={href || "#"}
      className="group flex flex-col rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white">{title}</h3>
        <Arrow />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
    </Link>
  );
}

function Section({ title, subtitle, cards }: { title: string; subtitle: string; cards: Card[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <LinkCard key={c.title} {...c} />
        ))}
      </div>
    </section>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function SupportHub() {
  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
        <h1 className="font-extrabold text-[clamp(1.9rem,5vw,2.75rem)]">Support Hub</h1>
        <p className="mt-3 font-semibold">Everything You Need to Get Started &amp; Stay Connected</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/85">
          Find answers, get help, and discover all the amazing features of your Zoiko Mobile service
        </p>

        <div className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md dark:bg-gray-800">
          <span className="text-gray-400 dark:text-gray-500"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search for help articles, guides, or FAQs..."
            className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
      </section>

      {/* ─── Sections ─── */}
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6 md:px-8">
        <Section title="Customer Support" subtitle="Get help when you need it most" cards={customerSupport} />

        <Section title="Get Started" subtitle="Everything you need to begin your journey" cards={getStarted} />

        {/* Customer Dashboard */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Customer Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account and services</p>
          <Link
            href="/login"
            className="group mt-6 flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#1ba36b] to-[#0e8f74] p-5 text-white transition-opacity hover:opacity-95"
          >
            <div>
             <p className="font-bold">Login</p>
              <p className="mt-1 text-sm text-white/90">Access your MyZoiko account to manage your services and billing</p>
            </div>
            <svg className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </section>

        <Section title="Tariffs & Prices" subtitle="Transparent pricing for all our services" cards={tariffs} />

        <Section title="What's Included" subtitle="Discover all the features and benefits" cards={whatsIncluded} />

        {/* ─── Still Need Help? ─── */}
        <section className="rounded-2xl bg-gradient-to-br from-[#f4845f] via-[#ee5f86] to-[#e6007e] p-6 text-center text-white sm:p-10">
          <h2 className="font-extrabold text-[clamp(1.4rem,4vw,2rem)]">Still Need Help?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/90">
            Our friendly support team is here to help you with any questions or issues.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {contactCards.map((c) => (
              <a
                key={c.title}
                href={c.href || "#"}
                className="rounded-xl bg-white/15 p-5 transition-colors hover:bg-white/20"
              >
                <p className="font-bold text-white">{c.title}</p>
                {c.lines.map((line) => (
                  <p key={line} className="mt-1 text-sm text-white/90">{line}</p>
                ))}
                <span className="mt-3 inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white">
                  {c.badge}
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default SupportHub;
export { SupportHub };
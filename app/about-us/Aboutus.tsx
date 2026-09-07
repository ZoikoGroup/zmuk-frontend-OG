import Image from "next/image";

// ─── DATA ────────────────────────────────────────────────────────────────────
//
// Each `img` is the full icon graphic (circle included). Drop your real assets
// at these paths in /public, or rename to match your files.

const reasons = [
  { img: "/images/aboutus/1.png", title: "Free International Calls", desc: "Stay connected worldwide with complimentary international calling" },
  { img: "/images/aboutus/2.png", title: "No Credit Check", desc: "Simple activation process without credit verification requirements" },
  { img: "/images/aboutus/3.png", title: "Pocket Friendly", desc: "Affordable plans designed to fit every budget without compromise" },
  { img: "/images/aboutus/4.png", title: "Switch to Zoiko Mobile and keep your current number", desc: "Seamless transition while retaining your existing phone number" },
  { img: "/images/aboutus/5.png", title: "No.1 Network in the UK", desc: "Premium coverage and reliability across the United Kingdom" },
  { img: "/images/aboutus/6.png", title: "Free 5G Roam", desc: "Experience high-speed 5G connectivity wherever you travel" },
];

const coreValues = [
  { img: "/images/aboutus/7.png", title: "Affordable and Reliable Mobile Solutions", desc: "Zoiko Mobile offers budget-friendly SIM Plans and Refurbished Phone Plans, ensuring affordability without compromising on reliability." },
  { img: "/images/aboutus/8.png", title: "Environmental Commitment", desc: "Embrace sustainability with Zoiko Mobile's eco-conscious initiatives, providing environmentally friendly SIM plans and refurbished devices to contribute to a greener future." },
  { img: "/images/aboutus/9.png", title: "Our Story and Customer Focus", desc: "Explore Zoiko Mobile's journey, values, and dedication to transparency. Our customer-centric approach ensures a top-notch mobile experience through SIM Plans and Refurbished Phone Deals designed to meet and exceed your expectations." },
];

const regretCards = [
  { img: "/images/aboutus/Background.png", title: "UK's Best Network", desc: "99% UK coverage powered by UK's No.1 Network with 4G and 5G coverage" },
  { img: "/images/aboutus/Background (1).png", title: "Fantastic Features", desc: "Inclusive EU Roam, Data rollover, Bundled offers, Wi-Fi calling & Customised Plans" },
  { img: "/images/aboutus/Background (2).png", title: "Roam Free", desc: "Travel hassle-free with Zoiko Mobile. Enjoy crystal-clear calls, Lightning-fast data" },
  { img: "/images/aboutus/Background (3).png", title: "Amazing Value", desc: "Stay ahead with the latest phones or SIM only plans, we've got the very best of the fantastic deals" },
  { img: "/images/aboutus/Background (4).png", title: "Help With Support", desc: "Get the support you deserve! 24/7 with SMS & Customer Care Support" },
  { img: "/images/aboutus/Background (5).png", title: "Switch With a Text!", desc: "Switch to Zoiko Mobile with a simple Text. Set up your new mobile connectivity everywhere!" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Icon slot — the colored circle is part of the image asset. */
function IconImage({ src, alt, size }: { src: string; alt: string; size: number }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function Underline() {
  return <span className="mx-auto mt-3 block h-1 w-20 rounded-full bg-[#f5c518]" />;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function aboutusus() {
  return (
    <main className="bg-white font-sans dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-12 text-center text-white sm:px-6 md:px-8">
        <h1 className="font-extrabold text-[clamp(1.8rem,5vw,2.75rem)]">The Zoiko Philosophy</h1>
      </section>

      {/* ─── Chronicle ─── */}
      <section className="bg-white px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-extrabold text-[#0e8f74] text-[clamp(1.5rem,4vw,2rem)] dark:text-[#34d39e]">
              The Zoiko Mobile Chronicle
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-300">
              Welcome to <strong className="font-semibold text-gray-800 dark:text-white">Zoiko Mobile</strong>, the
              premier provider of free SIM. Together, they embarked on a{" "}
              <strong className="font-semibold text-gray-800 dark:text-white">mission to reshape the world of mobile technology.</strong>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-300">
              Our tagline,{" "}
              <strong className="font-semibold text-[#0e8f74] dark:text-[#34d39e]">&ldquo;Connecting Every Possibility&rdquo;</strong>{" "}
              encapsulates the heart and soul of Zoiko Mobile, and we are excited to share this inspiring journey with you.
            </p>
          </div>

          {/* Z logo — image slot */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative aspect-[4/3] w-full max-w-sm">
              <Image src="/images/aboutus/image 273.png" alt="Zoiko Mobile" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Reasons to Love Zoiko ─── */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-extrabold text-[#e6007e] text-[clamp(1.5rem,4vw,2.25rem)]">
              Reasons to Love Zoiko - Free SIM Card with SIM only deals UK
            </h2>
            <Underline />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((r) => (
              <div key={r.title} className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-800">
                <div className="flex justify-center">
                  <IconImage src={r.img} alt={r.title} size={56} />
                </div>
                <h3 className="mt-4 font-bold text-gray-800 dark:text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Core Values ─── */}
      <section className="bg-white px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-extrabold text-[#e6007e] text-[clamp(1.5rem,4vw,2.25rem)]">Our Core Values</h2>
            <Underline />
          </div>

          <div className="mt-10 space-y-5">
            {coreValues.map((v) => (
              <div key={v.title} className="flex items-start gap-4 rounded-xl border-l-4 border-[#1f9d6b] bg-gray-50 p-5 dark:bg-gray-800">
                <IconImage src={v.img} alt={v.title} size={40} />
                <div>
                  <h3 className="font-bold text-[#0e8f74] dark:text-[#34d39e]">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── You will never regret ─── */}
      <section className="bg-[#0e8f74] px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-[#0b6e5a]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-extrabold text-white text-[clamp(1.5rem,4vw,2.25rem)]">
              You will never regret choosing Zoiko Mobile
            </h2>
            <span className="mx-auto mt-3 block h-1 w-20 rounded-full bg-[#f5c518]" />
            <p className="mt-5 font-bold text-[#f5c518]">SIM only deals UK with Unlimited Data</p>
            <p className="text-sm italic text-white/90">You&rsquo;ll just love it...!</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {regretCards.map((c) => (
              <div key={c.title} className="rounded-xl bg-white/10 p-5 ring-1 ring-white/15">
                <div className="flex items-center gap-3">
                  <IconImage src={c.img} alt={c.title} size={40} />
                  <h3 className="font-bold text-white">{c.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
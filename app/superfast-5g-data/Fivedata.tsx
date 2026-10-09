import Image from "next/image";

// ─── DATA ──────────────────────────────────────────────────────────────────

const features: { icon: string; title: string }[] = [
  { icon: "bolt", title: "9X Faster" },
  { icon: "signal", title: "Better Connectivity" },
  { icon: "target", title: "Super Smooth" },
];

// ─── ICONS ──────────────────────────────────────────────────────────────────

function FeatureIcon({ kind }: { kind: string }) {
  const cx = "h-8 w-8";
  if (kind === "bolt")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={`${cx} text-amber-400`}>
        <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />
      </svg>
    );
  if (kind === "signal")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${cx} text-[#0e8f74] dark:text-[#34d39e]`}>
        <path d="M4.5 15a9 9 0 0113 0M2 11.5a13 13 0 0118 0M7 18.5a5 5 0 018 0" />
        <circle cx="11" cy="21" r="1" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${cx} text-red-500`}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Fivedata() {
  return (
    <main className="bg-[#f7f8fa] font-sans text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Superfast 5G Data</h1>
      </section>

      <section className="px-4 py-12 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">

          {/* Top banner: cream panel + image */}
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center bg-[#fdf6e3] px-8 py-12 dark:bg-gray-900 sm:px-10">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#e6007e] sm:text-4xl">SUPERFAST 5G DATA</h2>
              <p className="mt-3 text-base font-bold text-[#0e8f74] dark:text-[#34d39e]">
                Another Reason To Love Zoiko Mobile: Speed &amp; Agility!
              </p>
            </div>
            {/* image slot */}
            <div className="relative min-h-[280px] w-full bg-gray-100 dark:bg-gray-700">
              <Image src="/images/5G Speed (1).png" alt="Superfast 5G data in action" fill sizes="(max-width:768px) 100vw, 36rem" className="object-cover" />
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-10 sm:px-10">
            <p className="max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Get ready to supercharge your mobile experience with our ultra-fast 5G speed! It's not just fast; it's
              instant. Stream, game, download, and browse at speeds that keep up with your lifestyle. Whether you're
              streaming your favourite series in ultra-HD, battling it out in the latest online game, or downloading big
              files in a flash, our 5G has you covered.
            </p>

            {/* Feature tiles */}
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="flex flex-col items-center justify-center rounded-xl bg-gray-100 px-6 py-10 text-center dark:bg-gray-900">
                  <FeatureIcon kind={f.icon} />
                  <h3 className="mt-4 text-base font-bold text-[#0e8f74] dark:text-[#34d39e]">{f.title}</h3>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Not only does it enhance your day-to-day mobile interactions, but 5G also opens up new possibilities for
              advanced mobile technologies like augmented reality and next-generation IoT devices. This is more than just
              speed; it's a gateway to future tech, right in your pocket!
            </p>

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Embrace the fast lane with 5G and never look back. It's not just an upgrade; it's a transformation to the
              way you connect, create, and explore online. Stay ahead of the curve —{" "}
              <span className="font-bold text-[#0e8f74] dark:text-[#34d39e]">join the 5G revolution today!</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}



import Image from "next/image";
import Link from "next/link";

// ─── DATA ────────────────────────────────────────────────────────────────────

const topReasons = [
  { badge: "Reason 1", lead: "Zoikie says,", quote: "With Zoiko Mobile, I can stay connected even on the longest walks!" },
  { badge: "Reason 2", lead: "Zoikie exclaims,", quote: "Zoiko's lightning-fast data keeps me streaming my favourite dog videos all day long!" },
  { badge: "Reason 3", lead: "Zoikie remarks,", quote: "My humans love Zoiko's competitive pricing - more treats for me, please!" },
];

const bottomReasons = [
  { num: 4, title: "Tail-Wagging Customer Support", lead: "Zoikie assures,", quote: "Zoiko's customer support team is always there to lend a helping paw when I need it!" },
  { num: 5, title: "Fetching Rewards and Perks", lead: "Zoikie says,", quote: "Zoiko's rewards programme is the pick of the litter - I get exclusive discounts and perks galore!" },
  { num: 6, title: "Flexible Plans to Suit Your Lifestyle", lead: "Zoikie says,", quote: "Whether I'm going on a short stroll or a long hike, Zoiko's flexible plans mean my humans can choose the perfect fit for our adventures, together!" },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ReasonsToLoveZoiko() {
  return (
    <main className="bg-white font-sans dark:bg-gray-900">
      {/* ─── Hero band ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-8 text-center text-white sm:px-6 md:px-8">
        <h1 className="font-extrabold text-[clamp(1.6rem,4vw,2.25rem)]">Reasons to Love Zoiko</h1>
      </section>

      {/* ─── Intro ─── */}
      <section className="bg-gradient-to-b from-[#dff3e6] to-[#eef9f3] px-4 py-12 sm:px-6 md:px-8 lg:py-16 dark:from-gray-800 dark:to-gray-800">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Image slot + speech bubble */}
          <div className="relative">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl bg-gray-300 dark:bg-gray-700">
              <Image src="/images/Group 1597883567.png" alt="Zoikie the Labrador" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
        
          </div>

          {/* Copy */}
          <div>
            <h2 className="font-extrabold text-[#e6007e] text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
              Zoikie The Labrador Shares Why Zoiko Mobile Is The Top Dog In Town!
            </h2>
            <p className="mt-5 text-sm font-bold text-gray-700 dark:text-gray-200">Zoikie gives Zoiko Mobile two paws up!</p>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Join the pack and experience the love for yourself!</p>

            <Link
              href="/plans"
              className="mt-7 inline-block rounded-full bg-gradient-to-r from-[#f0568f] to-[#e6007e] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              Join Our Network Today!
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Reasons grid ─── */}
      <section className="bg-white px-4 py-14 sm:px-6 md:px-8 lg:py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Top row — pink-badge cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topReasons.map((r) => (
              <div key={r.badge} className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <span className="inline-block rounded-full bg-gradient-to-r from-[#f0568f] to-[#e6007e] px-4 py-1.5 text-xs font-bold text-white">
                  {r.badge}
                </span>
                <p className="mt-5 text-sm text-gray-600 dark:text-gray-300">{r.lead}</p>
                <p className="mt-2 text-sm italic leading-relaxed text-gray-700 dark:text-gray-200">&ldquo;{r.quote}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Bottom row — green-bordered cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bottomReasons.map((r) => (
              <div
                key={r.num}
                className="rounded-2xl border-2 border-[#1f9d6b]/40 bg-[#f0fbf6] p-6 dark:border-[#1f9d6b]/40 dark:bg-[#0e8f74]/10"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ba36b] to-[#0e8f74] text-sm font-bold text-white">
                  {r.num}
                </span>
                <h3 className="mt-4 font-bold text-[#0e8f74] dark:text-[#34d39e]">{r.title}</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{r.lead}</p>
                <p className="mt-2 text-sm italic leading-relaxed text-gray-700 dark:text-gray-200">&ldquo;{r.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


export { ReasonsToLoveZoiko };
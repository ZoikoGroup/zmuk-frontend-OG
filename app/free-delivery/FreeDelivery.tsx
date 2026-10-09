import Image from "next/image";

// ─── DATA ──────────────────────────────────────────────────────────────────
// Each section: number + title + body paragraphs. Optional `subs` for
// sub-headings (e.g. 3.1 / 3.2) and optional `image` slot.

type Sub = { title: string; body: string };
type Section = {
  n: string;
  title: string;
  body?: string[];
  subs?: Sub[];
  image?: string; // leave "" for a dashed placeholder
};

const sections: Section[] = [
  {
    n: "1",
    title: "Introduction",
    body: [
      "At Zoiko Mobile, we are pleased to offer free delivery on all our products, including SIM cards and devices, exclusively to our customers within the UK. This policy details the terms and conditions of our free delivery service to ensure you receive your products conveniently and at no additional cost.",
    ],
  },
  {
    n: "2",
    title: "Delivery Areas",
    body: [
      "Free delivery is available to all addresses within the UK, encompassing mainland and non-mainland areas such as the Scottish Highlands, Northern Ireland, and other remote regions. Please note that delivery times may vary depending on the location.",
    ],
  },
  {
    n: "3",
    title: "Delivery Times",
    subs: [
      { title: "3.1 Standard Delivery", body: "Our standard delivery times are typically 3-5 working days for mainland UK. For non-mainland and remote areas, delivery times may extend to 5-7 working days." },
      { title: "3.2 Expedited Delivery", body: "While our standard delivery service is free, expedited delivery options are available for an additional charge. Please contact our customer service for more information and availability." },
    ],
  },
  {
    n: "4",
    title: "Processing Times",
    body: [
      "Orders are generally processed within 24 hours of order confirmation. Orders placed over weekends or public holidays will be processed on the next working day.",
    ],
  },
  {
    n: "5",
    title: "Delivery Partners",
    image: "/images/Delivery Partners.png",
    body: [
      "We utilise reliable delivery services to ensure your products are delivered safely and on time. Our delivery partners are selected based on their proven track record of efficiency and quality service.",
    ],
  },
  {
    n: "6",
    title: "Tracking Your Delivery",
    body: [
      "Upon dispatch of your order, you will receive a tracking number via email. This number allows you to track the status of your delivery via the courier's website.",
    ],
  },
  {
    n: "7",
    title: "Missed Deliveries",
    body: [
      "If you are unavailable to receive your delivery, our delivery partners will leave a card with instructions on how to rearrange delivery or collect your package from a local depot.",
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

function SectionCard({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`rounded-xl p-6 shadow-sm ring-1 ring-black/5 sm:p-8 ${muted ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-800"} dark:ring-white/10`}>
      {children}
    </div>
  );
}

function Heading({ n, title }: { n: string; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-bold text-[#0e8f74] dark:text-[#34d39e]">
      <span className="inline-block h-6 w-1 rounded-full bg-[#0e8f74] dark:bg-[#34d39e]" />
      {n}. {title}
    </h2>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function FreeDelivery() {
  return (
    <main className="bg-[#f7f8fa] font-sans text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">ALL FREE DELIVERIES!</h1>
        <p className="mt-3 text-sm text-white/90 sm:text-base">Another Reason To Love Zoiko Mobile</p>
      </section>

      {/* ─── Sections ─── */}
      <section className="px-4 py-14 sm:px-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {sections.map((s) => (
            <SectionCard key={s.n}>
              <Heading n={s.n} title={s.title} />

              {/* image slot (Delivery Partners) */}
              {s.image !== undefined && (
                s.image ? (
                  <div className="relative mt-5 aspect-[16/9] w-full max-w-md overflow-hidden rounded-lg">
                    <Image src={s.image} alt={s.title} fill sizes="(max-width:768px) 100vw, 28rem" className="object-cover" />
                  </div>
                ) : (
                  <div className="mt-5 flex aspect-[16/9] w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-xs uppercase tracking-widest text-gray-400 dark:border-gray-600 dark:bg-gray-700">
                    Image
                  </div>
                )
              )}

              {/* paragraphs */}
              {s.body?.map((p, i) => (
                <p key={i} className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{p}</p>
              ))}

              {/* sub-sections */}
              {s.subs?.map((sub) => (
                <div key={sub.title} className="mt-5 first:mt-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{sub.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{sub.body}</p>
                </div>
              ))}
            </SectionCard>
          ))}

          {/* ─── Section 8: Contact Us ─── */}
          <SectionCard muted>
            <Heading n="8" title="Contact Us" />
            <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
              For any queries regarding our free delivery service or for help with a delivery issue, please contact us at:
            </p>
            <div className="mt-5 rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
              <h3 className="text-base font-bold text-[#0e8f74] dark:text-[#34d39e]">Zoiko Mobile Customer Service</h3>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-gray-800 dark:text-gray-100">Email:</span>{" "}
                <a href="mailto:support@zoikomobile.co.uk" className="text-[#0e8f74] hover:underline dark:text-[#34d39e]">support@zoikomobile.co.uk</a>
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-gray-800 dark:text-gray-100">Telephone:</span>{" "}
                <a href="tel:+442071646399" className="hover:underline">+44 2071 646 399</a>
              </p>
            </div>
            <p className="mt-6 text-sm italic leading-relaxed text-gray-500 dark:text-gray-400">
              We are committed to providing our UK customers with efficient and cost-effective delivery solutions. Thank
              you for choosing Zoiko Mobile, where we strive to deliver not only our products but also exceptional service
              and support.
            </p>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}

// Exported both ways so either default or named import works.


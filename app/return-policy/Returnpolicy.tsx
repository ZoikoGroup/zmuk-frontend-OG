import Image from "next/image";

// ─── Small helpers ────────────────────────────────────────────────────────────

function Heading({ n, title, onDark = false }: { n: string; title: string; onDark?: boolean }) {
  return (
    <h2 className={`flex items-center gap-3 text-xl font-bold ${onDark ? "text-white" : "text-[#0e8f74] dark:text-[#34d39e]"}`}>
      <span className={`inline-block h-6 w-1 rounded-full ${onDark ? "bg-white" : "bg-[#0e8f74] dark:bg-[#34d39e]"}`} />
      {n}. {title}
    </h2>
  );
}

function Card({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`rounded-xl p-6 shadow-sm ring-1 ring-black/5 sm:p-8 ${muted ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-800"} dark:ring-white/10`}>
      {children}
    </div>
  );
}

// green tick
function Tick() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-[#0e8f74] dark:text-[#34d39e]" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}
function TickLight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-white/90" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}

function ImageSlot({ src, alt, className }: { src: string; alt: string; className: string }) {
  return src ? (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width:768px) 100vw, 40rem" className="object-cover" />
    </div>
  ) : (
    <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-xs uppercase tracking-widest text-gray-400 dark:border-gray-600 dark:bg-gray-700 ${className}`}>
      Image
    </div>
  );
}

// ─── DATA ──────────────────────────────────────────────────────────────────

const eligibility = [
  { icon: "sim", title: "2.1 SIM Cards", points: [
    "Returns of SIM cards are accepted only if they are in their original, unopened packaging.",
    "Returns must be initiated within 14 days of receipt, in line with your statutory rights under the Consumer Contracts Regulations.",
  ]},
  { icon: "device", title: "2.2 Mobile Phones and Other Devices", points: [
    "Returns of mobile phones and other devices are accepted if they are in their original condition, with all accessories, manuals, and packaging.",
    "Items must be returned within 14 days of receipt, which also aligns with the Consumer Contracts Regulations allowing consumers to change their minds.",
  ]},
];

const process = [
  { title: "Contact Us", body: "To begin the return process, please contact our customer support team via email at accounts@zoikomobile.co.uk or by phone at +44 2071 646 399." },
  { title: "Provide Details", body: "You will need to provide your order details and a reason for the return, although a reason is not necessary under the Consumer Contracts Regulations if you are acting within the 14-day cooling-off period." },
  { title: "Get Instructions", body: "Following approval, we will provide instructions and a return address." },
  { title: "Ship the Product", body: "You are responsible for the return shipping costs, which is standard, but in cases of faulty or misdescribed items, Zoiko Mobile will cover the return shipping costs." },
];

const processing = [
  "We will inspect returned items to confirm they meet the return conditions.",
  "Refunds or exchanges will be processed within 14 days of receiving the returned item, in compliance with UK consumer law.",
  "Refunds will be issued to the original payment method used during purchase.",
];

const nonReturnable = [
  "Activated SIM cards and any associated prepaid credit are non-returnable once activated.",
  "Devices that have been damaged or modified by the customer are not eligible for a return.",
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default  function ReturnPolicy() {
  return (
    <main className="bg-[#f7f8fa] font-sans text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Return Policy</h1>
        <p className="mt-3 text-sm text-white/90 sm:text-base">Customer satisfaction is our priority</p>
      </section>

      <section className="px-4 py-14 sm:px-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* 1. Introduction */}
          <Card muted>
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <Heading n="1" title="Introduction" />
                <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  At Zoiko Mobile, we aim to ensure that all our customers are completely satisfied with their purchases.
                  This returns policy sets out the conditions under which you can return purchased items.
                </p>
              </div>
              <ImageSlot src="/images/Return Policy (1).png" alt="Customer returning a product in store" className="aspect-[16/10] w-full" />
            </div>
          </Card>

          {/* 2. Returns Eligibility */}
          <Card>
            <Heading n="2" title="Returns Eligibility" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {eligibility.map((e) => (
                <div key={e.title} className="rounded-lg border-l-4 border-[#0e8f74] bg-gray-50 p-5 dark:bg-gray-900">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f1ec] text-[#0e8f74] dark:bg-[#34d39e]/15 dark:text-[#34d39e]">
                    {e.icon === "sim" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M9 7h6M9 11h6" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
                    )}
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-gray-800 dark:text-gray-100">{e.title}</h3>
                  <ul className="mt-3 space-y-3">
                    {e.points.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400"><Tick /> <span>{p}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Returning the Products */}
          <Card>
            <Heading n="3" title="Returning the Products" />
            <div className="mt-6 space-y-4">
              {process.map((step, i) => (
                <div key={step.title} className="flex gap-4 rounded-lg bg-gray-50 p-5 dark:bg-gray-900">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0e8f74] text-sm font-bold text-white dark:bg-[#34d39e] dark:text-gray-900">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Processing Returns (full teal block) */}
          <div className="overflow-hidden rounded-xl bg-[#0e8f74] p-6 text-white shadow-sm sm:p-8">
            <Heading n="4" title="Processing Returns" onDark />
            <div className="mt-6 grid items-center gap-6 md:grid-cols-2">
              <ImageSlot src="/images/Processing.png" alt="Team processing returns" className="aspect-[16/10] w-full" />
              <ul className="space-y-4">
                {processing.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-white/90"><TickLight /> <span>{p}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. Non-Returnable Items (yellow warning) */}
          <Card>
            <Heading n="5" title="Non-Returnable Items" />
            <div className="mt-5 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-5 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500"><path d="M12 9v4M12 17h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3.1l-8-14a2 2 0 00-3.4 0z" /></svg>
                <ul className="space-y-2">
                  {nonReturnable.map((n, i) => (
                    <li key={i} className="text-sm leading-relaxed text-yellow-800 dark:text-yellow-200">{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* 6. Defective or Damaged Products (blue callout) */}
          <Card>
            <Heading n="6" title="Defective or Damaged Products" />
            <div className="mt-5 rounded-lg border-l-4 border-sky-400 bg-sky-50 p-5 text-sm leading-relaxed text-sky-900 dark:bg-sky-900/20 dark:text-sky-200">
              If you receive a defective product, please inform us within 14 days of receipt for a prompt return or
              exchange, in accordance with your rights under the Consumer Rights Act 2015.
            </div>
          </Card>

          {/* 7. Contact Us */}
          <Card muted>
            <Heading n="7" title="Contact Us" />
            <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
              For further assistance or queries regarding our returns policy, please contact us at:
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
                <h3 className="text-base font-bold text-[#0e8f74] dark:text-[#34d39e]">Zoiko Mobile</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Berkeley Suite, 35 Berkeley Square, Mayfair, London W1J 5BF</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-800 dark:text-gray-100">Email</span><br />
                  <a href="mailto:accounts@zoikomobile.co.uk" className="text-[#0e8f74] hover:underline dark:text-[#34d39e]">accounts@zoikomobile.co.uk</a>
                </p>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-800 dark:text-gray-100">Telephone</span><br />
                  <a href="tel:+442071646399" className="hover:underline">+44 2071 646 399</a>
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm italic leading-relaxed text-gray-500 dark:text-gray-400">
              We are committed to complying with UK consumer law and ensuring a transparent and straightforward returns
              process. Thank you for choosing Zoiko Mobile.
            </p>
          </Card>

        </div>
      </section>
    </main>
  );
}




import Image from "next/image";
import Link from "next/link";

// ─── DATA ────────────────────────────────────────────────────────────────────

const expertSteps = [
  { label: "Step 1:", text: "Enter your details." },
  { label: "Step 2:", text: "Enter OTP & SIM Serial Number." },
  { label: "Step 3:", text: "Enter the 8-digit OTP then your 19-digit SIM serial number." },
];

const steps = [
  {
    title: "1. PURCHASE SIM AND BUNDLE:",
    points: [
      "Order your SIM and chosen bundle via the Zoiko Mobile website or mobile app.",
      "During the order process, you'll be prompted to register on \u201cMy Login\u201d",
      "Fill in your details meticulously and create a secure password.",
    ],
  },
  {
    title: "2. OTP SENT VIA EMAIL:",
    points: [
      "Upon completing your purchase, you will receive an email containing an 8-digit OTP. It's crucial to keep this OTP safe.",
    ],
  },
  {
    title: "3. SIM SENT IN POST:",
    points: ["Zoiko Mobile will dispatch your SIM card to the address you have provided."],
  },
  {
    title: "4. CUSTOMER RECEIVES SIM VIA POST:",
    points: ["Await the arrival of your Zoiko Mobile SIM card through the post."],
  },
  {
    title: "5. INSERT SIM INTO PHONE:",
    points: [
      "Before logging into your 'My Login' account, please ensure you insert your SIM card into your mobile phone. Follow the instructions provided in your SIM pack and insert the SIM correctly.",
    ],
  },
  {
    title: "6. CUSTOMER LOGS IN TO MY LOGIN:",
    points: ["With your SIM inserted, log into your 'My Login' account to proceed with the activation."],
  },
  {
    title: "7. CUSTOMER ACTIVATES SIM USING OTP AND SIM SERIAL NUMBER:",
    points: [
      "Proceed with the activation by inputting the 8-digit OTP and the 19-digit Serial Number located above the barcode and above your mobile number on your SIM card.",
    ],
  },
  {
    title: "8. ACTIVATION COMPLETE:",
    points: [
      "Once activated, a confirmation email will be sent to you.",
      "Your Zoiko Mobile services are now ready for use!",
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Bullet() {
  return <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e6007e]" />;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function ActivateGuide() {
  return (
    <main className="bg-white font-sans dark:bg-gray-900">
      {/* ─── Hero band ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-8 text-center text-white sm:px-6 md:px-8">
        <h1 className="font-extrabold text-[clamp(1.5rem,4vw,2.25rem)]">Activate Your SIM with Tech Guru Ollie</h1>
      </section>

      {/* ─── Intro: image + expert steps ─── */}
      <section className="bg-white px-4 py-12 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-2">
          {/* Image slot — Tech Guru Ollie */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-300 dark:bg-gray-700">
            <Image src="/images/image 292.png" alt="Tech Guru Ollie" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>

          {/* Steps + CTAs */}
          <div>
            <h2 className="font-extrabold text-[#e6007e] text-[clamp(1.3rem,3vw,1.6rem)]">
              Follow Tech Guru Ollie&rsquo;s Expert Steps:
            </h2>

            <div className="mt-5 space-y-3">
              {expertSteps.map((s) => (
                <p key={s.label} className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-bold text-[#e6007e]">{s.label}</span> {s.text}
                </p>
              ))}
            </div>

            {/* Get connected box */}
            <div className="mt-6 rounded-xl border border-[#1f9d6b]/30 bg-[#f0fbf6] p-5 dark:border-[#1f9d6b]/40 dark:bg-[#0e8f74]/10">
              <p className="font-bold text-[#1f9d6b] dark:text-[#34d39e]">Activate SIM &amp; Get Connected!</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Click &ldquo;Activate SIM&rdquo; to start enjoying Zoiko Mobile services!
              </p>
            </div>

            {/* Need help box */}
            <div className="mt-4 rounded-r-xl border-l-4 border-[#e6007e] bg-gray-50 p-5 dark:bg-gray-800">
              <p className="font-bold text-gray-800 dark:text-white">Need Help?</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Call us on{" "}
                <a href="tel:+442071646399" className="font-bold text-[#e6007e] hover:underline">+44 (0) 2071 646 399</a>{" "}
                or visit our{" "}
                <Link href="/help-support" className="font-semibold text-[#e6007e] hover:underline">Help &amp; Support page</Link>.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/activate-your-sim"
              className="mt-6 block rounded-full bg-gradient-to-r from-[#f0568f] to-[#e6007e] py-3.5 text-center text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              Activate Your SIM
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Step-by-step cards ─── */}
      <section className="bg-gray-50 px-4 py-12 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl space-y-5">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-r-2xl border-l-4 border-[#e6007e] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-7 dark:bg-gray-800 dark:ring-gray-700"
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#e6007e]">{step.title}</h3>
              <ul className="mt-3 space-y-2">
                {step.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    <Bullet />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Security reminders */}
          <div className="rounded-2xl border-2 border-[#f5c518] bg-gradient-to-b from-[#fff7e6] to-[#ffeecc] p-7 text-center dark:border-amber-500/40 dark:from-amber-500/10 dark:to-amber-500/10">
            <h3 className="font-bold uppercase tracking-wide text-[#d97706] dark:text-amber-300">Important Security Reminders:</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-700 dark:text-gray-200">
              Your OTP is confidential; do not share it with anyone, including representatives from Zoiko Mobile.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-700 dark:text-gray-200">
              Ensure your &lsquo;My Login&rsquo; account password is strong to secure your account.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default ActivateGuide;
export { ActivateGuide };
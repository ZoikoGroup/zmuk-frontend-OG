"use client";

import { useState } from "react";

// ─── ICONS (inline SVG) ────────────────────────────────────────────────────────

const si = "h-4 w-4";
const CopyIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>);
const WhatsAppIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.4 5 5.1-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 01-1.9-1.2 7.3 7.3 0 01-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c.6.3 1.1.4 1.5.5a3.6 3.6 0 001.6.1 2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.2-1.2c-.1-.1-.3-.2-.5-.3z" /></svg>);
const FacebookIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z" /></svg>);
const TwitterIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 001.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 00-6.8 3.6A11.4 11.4 0 013 4.8a4 4 0 001.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 003.2 4 4 4 0 01-1.8.1 4 4 0 003.7 2.8A8 8 0 012 18.3a11.3 11.3 0 006.1 1.8c7.3 0 11.4-6.1 11.4-11.4v-.5A8 8 0 0022 5.9z" /></svg>);
const LinkedInIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 002.5 6a2.5 2.5 0 005 0 2.5 2.5 0 00-2.52-2.5zM3 8.98h4v12H3v-12zM9.5 8.98h3.8v1.6h.1a4.2 4.2 0 013.8-2.1c4 0 4.8 2.6 4.8 6v6.5h-4v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.9h-4v-12z" /></svg>);
const MailIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></svg>);
const SmsIcon = () => (<svg className={si} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinejoin="round" d="M4 5h16v11H8l-4 4V5z" /></svg>);

const ArrowIcon = () => (<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>);
const DocIcon = () => (<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinejoin="round" d="M7 3h7l4 4v14H7z" /><path strokeLinecap="round" d="M14 3v4h4M9 12h6M9 16h6" /></svg>);
const PoundIcon = () => (<span className="text-xl font-bold">£</span>);

// ─── DATA ────────────────────────────────────────────────────────────────────

// Replace REFERRAL_LINK with the real link, and fill each share `href`.
const REFERRAL_LINK = "https://zoikomobile.co.uk/refer/YOUR-UNIQUE-CODE";

const shareButtons = [
  { label: "WhatsApp", Icon: WhatsAppIcon, color: "bg-[#25D366] hover:bg-[#1ebe5a]", href: "https://wa.me/?text=Check%20out%20this%20great%20offer!%20Use%20my%20referral%20link:%20" + REFERRAL_LINK },
  { label: "Facebook", Icon: FacebookIcon, color: "bg-[#1877F2] hover:bg-[#1568d6]", href: "https://www.facebook.com/sharer/sharer.php?u=" + REFERRAL_LINK },
  { label: "Twitter", Icon: TwitterIcon, color: "bg-[#1DA1F2] hover:bg-[#1a90d8]", href: "https://twitter.com/intent/tweet?text=Check%20out%20this%20great%20offer!%20Use%20my%20referral%20link:%20" + REFERRAL_LINK },
  { label: "LinkedIn", Icon: LinkedInIcon, color: "bg-[#0A66C2] hover:bg-[#0958a8]", href: "https://www.linkedin.com/shareArticle?mini=true&url=" + REFERRAL_LINK },
  { label: "Email", Icon: MailIcon, color: "bg-[#e23b2e] hover:bg-[#c8362a]", href: "mailto:?subject=Check out this great offer!&body=Use my referral link: " + REFERRAL_LINK },
  { label: "SMS", Icon: SmsIcon, color: "bg-[#f59e0b] hover:bg-[#d98c09]", href: "sms:?body=Check%20out%20this%20great%20offer!%20Use%20my%20referral%20link:%20" + REFERRAL_LINK },
];

const steps = [
  { Icon: ArrowIcon, title: "Refer a Friend", desc: "Share your unique referral link with friends and family to Zoiko Mobile" },
  { Icon: DocIcon, title: "Friend Activates", desc: "Your friend signs up and activates a Zoiko Mobile plan" },
  { Icon: PoundIcon, title: "Both Get £20!", desc: "You and your friend both receive a £20 credit to use on your accounts" },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function Referafriend() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no-op
    }
  };

  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-12 text-center text-white sm:px-6 md:px-8">
        <h1 className="font-extrabold text-[clamp(1.8rem,5vw,2.75rem)]">Refer &amp; Earn with Zoiko Mobile</h1>
        <p className="mt-2 text-white/90">Share the love, earn together!</p>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 md:px-8">
        {/* ─── Share Your Referral Link ─── */}
        <div>
          <h2 className="text-center text-2xl font-extrabold text-gray-800 dark:text-white">Share Your Referral Link</h2>

          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row">
            <input
              type="text"
              readOnly
              value={REFERRAL_LINK}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1f9d6b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#188257]"
            >
              <CopyIcon /> {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Share directly */}
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">Or share directly on:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {shareButtons.map((b) => (
              <a
                key={b.label}
                href={b.href || "#"}
                className={`inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white transition-colors ${b.color}`}
              >
                <b.Icon /> {b.label}
              </a>
            ))}
          </div>
        </div>

        {/* ─── Buster banner ─── */}
        <div className="rounded-2xl bg-[#e6007e] p-8 text-center text-white sm:p-10">
          <h2 className="font-extrabold text-[clamp(1.3rem,3.5vw,1.8rem)]">Refer a friend to Zoiko Mobile and share the benefits!</h2>
          <p className="mt-3 text-white/90">
            Our cheerful budgie, <strong className="font-bold">Buster</strong>, is excited to thank you for spreading
            the love. Here&rsquo;s how it works:
          </p>
        </div>

        {/* ─── How It Works ─── */}
        <div>
          <h2 className="text-center text-2xl font-extrabold text-gray-800 dark:text-white">How It Works</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f6d9] text-[#5a8a23]">
                  <s.Icon />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── £20 deal ─── */}
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl sm:grid-cols-[200px_minmax(0,1fr)]">
          <div className="flex items-center justify-center bg-[#0f172a] p-8 text-4xl font-extrabold text-white">£20</div>
          <div className="bg-[#f5c518] p-8">
            <h3 className="text-xl font-extrabold text-gray-900">It&rsquo;s a fantastic deal, if we do say so ourselves!</h3>
            <p className="mt-3 text-sm text-gray-800">So, don&rsquo;t be shy - start sharing the love and get rewarded today!</p>
            <p className="mt-4 text-sm font-semibold italic text-gray-900">
              Remember, when you refer a friend, you&rsquo;ll both be flying high with Zoiko Mobile!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default Referafriend;

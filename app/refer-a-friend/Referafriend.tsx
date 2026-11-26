"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gift,
  Link2,
  Share2,
  Users,
  Clock,
  CreditCard,
  FileText,
  Copy,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  User,
  Info,
  HelpCircle,
  Bot,
  MessageSquare,
  Phone,
  TrendingUp,
  ListChecks,
  X,
  Check,
  Mail,
} from "lucide-react";
import { isLoggedIn } from "../utils/auth";
import { openChat } from "../components/ChatbotWidget";

const SAMPLE_REFERRAL_URL = "https://zoikomobile.co.uk/refer/ZOIKO20";

const HIGHLIGHTS = [
  { label: "£20 account credit each", icon: Gift },
  { label: "Simple to share", icon: Share2 },
  { label: "Track your referrals", icon: TrendingUp },
  { label: "Credit applied to your account", icon: CreditCard },
  { label: "Secure & fair", icon: ShieldCheck },
];

const JOURNEY_STAGES = [
  { num: 1, title: "Link shared", desc: "You send your link" },
  { num: 2, title: "Registered", desc: "They sign up with it" },
  { num: 3, title: "Activated", desc: "Their plan is live" },
  { num: 4, title: "Eligibility check", desc: "We check the terms are met" },
  { num: 5, title: "Reward approved", desc: "Credit is confirmed" },
  { num: 6, title: "Credit applied", desc: "It’s on your account" },
];

const CREDIT_POINTS = [
  "£20 account credit for you and your friend, once eligible.",
  "Added to your Zoiko Mobile account — you’ll see it in MyZoiko.",
  "Used towards your plan and eligible charges.",
  "Not a cash payment and can’t be withdrawn.",
  "Any expiry or reversal conditions are set out in the terms.",
];

const ELIGIBILITY_POINTS = [
  "For Zoiko Mobile customers with an active account in good standing.",
  "Your friend must sign up using your referral link.",
  "They must activate an eligible Zoiko Mobile plan within the qualifying period.",
  "You and your friend each receive £20 account credit once all conditions are met.",
];

const GOOD_TO_KNOW_POINTS = [
  "How many friends you can refer is set out in the programme terms.",
  "Cancelled or returned orders may not qualify.",
  "We use checks to prevent abuse, including self-referrals and duplicate accounts.",
  "We never share your friend’s personal details with you, or yours with them.",
  "Full details are in the Refer & Earn terms.",
];

const FAQS = [
  {
    q: "Who is eligible to refer a friend?",
    a: "Existing Zoiko Mobile UK customers with an active plan in good standing can generate a referral link in MyZoiko and invite new customers.",
  },
  {
    q: "Which plans and activations qualify?",
    a: "Your friend must sign up as a new Zoiko Mobile UK customer via your unique link and activate an eligible monthly SIM-only or device plan within the qualifying period.",
  },
  {
    q: "How do I get and share my referral link?",
    a: "Sign in to MyZoiko or click “Sign in to get my link” above to access your personal URL, then share it directly by WhatsApp, email, SMS, or QR code.",
  },
  {
    q: "What if my friend didn’t use my link?",
    a: "Referrals are tracked automatically at checkout through your unique link. Unfortunately, sign-ups completed without using your referral link cannot be linked retrospectively.",
  },
  {
    q: "How can I track a referral?",
    a: "Once signed in, open the My Referrals panel or visit your MyZoiko dashboard to follow every invite from Registered through to Credit applied.",
  },
  {
    q: "When is credit applied, and what can it pay for?",
    a: "Once the qualifying period and eligibility checks finish, £20 credit is applied automatically to each eligible Zoiko account and can go towards monthly bills and eligible charges.",
  },
  {
    q: "What happens after a cancellation or refund?",
    a: "If a referred order is cancelled, returned, or fails payment during the cooling-off or qualifying period, the referral reward will not be approved.",
  },
  {
    q: "What if my referral is marked not eligible?",
    a: "This usually means the referred person already held a Zoiko account, cancelled within the cooling-off period, or didn't activate an eligible plan.",
  },
  {
    q: "Can I refer more than one friend?",
    a: "Yes — you can invite multiple friends to join Zoiko Mobile UK, subject to the fair-use and annual referral limits in our terms.",
  },
  {
    q: "How do I raise a reward dispute?",
    a: "If a friend activated using your link and your status looks wrong after the qualifying period, contact our UK support team with your referral reference.",
  },
];

function Referafriend() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_REFERRAL_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleSignInForLink = () => {
    if (!loggedIn) {
      router.push("/login?next=/refer-a-friend");
    }
  };

  const handleMyZoiko = () => {
    if (loggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login?next=/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-[#141a45]">
      {/* 1. R02 · HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(100deg, #5c0a35 0%, #9e0d4c 30%, #c80f57 50%, #6a1450 72%, #0f4733 100%)",
        }}
      >
        <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 lg:px-10">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
            {/* Left Copy */}
            <div>
              <span className="inline-flex items-center rounded-full border border-white/80 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[1.44px] text-white">
                Refer &amp; Earn
              </span>
              <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-[-1.1px] text-white sm:text-4xl lg:text-[48px] lg:leading-[50.4px] lg:tracking-[-1.44px]">
                Share Zoiko. You both get £20.
              </h1>
              <p className="mt-3 max-w-[590px] text-base font-semibold leading-[1.5] text-[#fde6ee] sm:text-[18.9px] sm:leading-[28.3px]">
                Invite a friend to join Zoiko Mobile and you could both receive{" "}
                <strong className="font-black text-white">£20 account credit</strong> when they
                activate an eligible plan.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="#refer"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-white/90 bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-[22px] text-[15px] sm:text-[17px] font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(0,0,0,0.6)] transition hover:brightness-110"
                >
                  <Link2 className="h-[18px] w-[18px]" />
                  <span>Get my referral link</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </a>
                <a
                  href="#eligibility"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border-2 border-white/85 bg-[#140a28]/30 px-[22px] text-[15px] sm:text-[17px] font-extrabold text-white backdrop-blur-sm transition hover:bg-[#140a28]/50"
                >
                  <span>View eligibility</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </a>
              </div>
            </div>

            {/* Right Visual Card */}
            <div
              className="relative h-[220px] sm:h-[240px] w-full overflow-hidden rounded-[24px]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)",
              }}
            >
              <Image
                src="/images/refer-a-friend/hero-friends.png"
                alt="Friends smiling together at the coast"
                fill
                priority
                className="object-cover object-center"
              />
              {/* Floating Credit Badges */}
              <div className="absolute left-4 top-4 rounded-[18px] border-2 border-white bg-[#0b3a2a]/88 px-4 py-2 text-center text-white shadow-[0_12px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xs">
                <p className="text-[28px] sm:text-[32px] font-black leading-[1.1]">£20</p>
                <p className="text-xs sm:text-[13px] font-bold leading-tight">credit for you</p>
              </div>
              <div className="absolute right-4 top-10 rounded-[18px] border-2 border-white bg-[#c80f57]/90 px-4 py-2 text-center text-white shadow-[0_12px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xs">
                <p className="text-[28px] sm:text-[32px] font-black leading-[1.1]">£20</p>
                <p className="text-xs sm:text-[13px] font-bold leading-tight">
                  credit for your friend
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMME HIGHLIGHTS STRIP */}
      <div className="border-b border-[#e5e7f0] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-2.5 sm:px-6 lg:px-10">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={`flex min-h-[44px] items-center justify-center gap-2.5 px-2.5 py-2 text-center text-sm font-extrabold text-[#141a45] ${
                    idx > 0 ? "lg:border-l lg:border-[#e5e7f0]" : ""
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-[#c80f57]" />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-7 sm:px-6 lg:px-10">
        {/* 2. R03/R04 · YOUR REFERRAL LINK + MY REFERRALS */}
        <section className="grid items-stretch gap-[18px] lg:grid-cols-2">
          {/* Left: Your referral link */}
          <div
            id="refer"
            className="flex flex-col justify-between rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div>
              <div className="flex items-center gap-3.5">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-white">
                  <Link2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                    Your referral link
                  </h2>
                  <p className="text-sm leading-[21px] text-[#2d3361]">
                    Sign in to MyZoiko to get your unique referral link, share it and start earning.
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-sm leading-[20.3px] text-[#2d3361]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Get a link that’s unique to your account</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Share it by WhatsApp, email, text or QR code</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>Track each referral in MyZoiko</span>
                </li>
              </ul>

              {loggedIn ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={SAMPLE_REFERRAL_URL}
                      className="flex-1 rounded-full border border-[#d3d6e4] bg-[#fafafc] px-4 py-3 text-sm font-semibold text-[#141a45] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-6 text-sm font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110 cursor-pointer"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? "Copied!" : "Copy link"}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Join Zoiko Mobile UK using my link and we both get £20 credit: ${SAMPLE_REFERRAL_URL}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d3d6e4] bg-white px-4 py-2 text-xs font-bold text-[#141a45] hover:bg-[#fff4f7]"
                    >
                      <Share2 className="h-3.5 w-3.5 text-[#1f8c44]" />
                      <span>Share on WhatsApp</span>
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(
                        "Get £20 account credit with Zoiko Mobile UK"
                      )}&body=${encodeURIComponent(
                        `Join Zoiko Mobile UK using my referral link and we both get £20 account credit: ${SAMPLE_REFERRAL_URL}`
                      )}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d3d6e4] bg-white px-4 py-2 text-xs font-bold text-[#141a45] hover:bg-[#fff4f7]"
                    >
                      <Mail className="h-3.5 w-3.5 text-[#c80f57]" />
                      <span>Share by email</span>
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSignInForLink}
                    className="mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-6 text-[17px] font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(200,15,87,0.7)] transition hover:brightness-110 cursor-pointer"
                  >
                    <User className="h-5 w-5" />
                    <span>Sign in to get my link</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <p className="mt-2.5 text-[13px] leading-[19.5px] text-[#565c7e]">
                    New to Zoiko? Ask a friend who’s a customer for their link.
                  </p>
                </>
              )}
            </div>

            <div className="mt-3.5 flex items-start gap-2.5 rounded-[14px] border border-[#fde6ee] bg-[#fff4f7] px-3.5 py-2.5">
              <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#c80f57]" />
              <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                Only share your link with people you know who are happy to hear about Zoiko Mobile.
                We never read your contacts or send messages for you.
              </p>
            </div>
          </div>

          {/* Right: My Referrals */}
          <div className="overflow-hidden rounded-[22px] border border-[#fde6ee] bg-white shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div
              className="flex items-center gap-3.5 px-[22px] py-4 text-white"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #0b3a2a 0%, #0f4733 65%, #13573f 100%)",
              }}
            >
              <Users className="h-[30px] w-[30px] shrink-0" />
              <h2 className="text-xl font-extrabold tracking-[-0.3px]">My Referrals</h2>
            </div>

            <div className="px-[22px] pb-[22px] pt-[18px]">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7f0] bg-[#fafafc] px-3.5 py-3">
                  <Users className="h-7 w-7 shrink-0 text-[#565c7e]" />
                  <div>
                    <p className="text-[24px] font-black leading-tight text-[#141a45]">
                      {loggedIn ? "0" : "—"}
                    </p>
                    <p className="text-[13px] text-[#2d3361]">Registered referrals</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7f0] bg-[#fafafc] px-3.5 py-3">
                  <Clock className="h-7 w-7 shrink-0 text-[#565c7e]" />
                  <div>
                    <p className="text-[24px] font-black leading-tight text-[#141a45]">
                      {loggedIn ? "£0" : "—"}
                    </p>
                    <p className="text-[13px] text-[#2d3361]">Pending reward</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7f0] bg-[#fafafc] px-3.5 py-3">
                  <Gift className="h-7 w-7 shrink-0 text-[#565c7e]" />
                  <div>
                    <p className="text-[24px] font-black leading-tight text-[#141a45]">
                      {loggedIn ? "£0" : "—"}
                    </p>
                    <p className="text-[13px] text-[#2d3361]">Rewards credited</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7f0] bg-[#fafafc] px-3.5 py-3">
                  <CreditCard className="h-7 w-7 shrink-0 text-[#565c7e]" />
                  <div>
                    <p className="text-[24px] font-black leading-tight text-[#141a45]">
                      {loggedIn ? "£0" : "—"}
                    </p>
                    <p className="text-[13px] text-[#2d3361]">Available credit</p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[13px] leading-[19.5px] text-[#565c7e]">
                {loggedIn
                  ? "Your referral activity updates automatically as friends register and activate eligible plans."
                  : "Sign in to see your referrals and credit. We never show figures until we know it’s you."}
              </p>

              <button
                type="button"
                onClick={handleMyZoiko}
                className="mt-3 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full border border-[#ec156c] bg-white px-6 text-[17px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7] cursor-pointer"
              >
                <User className="h-5 w-5" />
                <span>{loggedIn ? "Open MyZoiko" : "Sign in to MyZoiko"}</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* 3. R05/R06 · HOW REFER & EARN WORKS + REFERRAL JOURNEY */}
        <section className="grid items-stretch gap-[18px] lg:grid-cols-2">
          {/* Left: How Refer & Earn works */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <ListChecks className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  How Refer &amp; Earn works
                </h2>
                <p className="text-sm leading-[21px] text-[#2d3361]">
                  It’s quick and easy to invite a friend.
                </p>
              </div>
            </div>

            <ol className="grid gap-2.5 sm:grid-cols-3">
              <li className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#fde6ee] bg-[#fff4f7] px-3 py-4 text-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-sm font-extrabold text-white">
                  1
                </span>
                <Link2 className="my-1 h-8 w-8 text-[#c80f57]" />
                <p className="text-base font-bold text-[#141a45]">Share your link</p>
                <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                  Send your unique link to someone who’d like to hear about Zoiko.
                </p>
              </li>

              <li className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#fde6ee] bg-[#fff4f7] px-3 py-4 text-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-sm font-extrabold text-white">
                  2
                </span>
                <Users className="my-1 h-8 w-8 text-[#c80f57]" />
                <p className="text-base font-bold text-[#141a45]">They join Zoiko</p>
                <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                  They use your link and activate an eligible plan.
                </p>
              </li>

              <li className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#fde6ee] bg-[#fff4f7] px-3 py-4 text-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-[#e2105c] to-[#c80f57] text-sm font-extrabold text-white">
                  3
                </span>
                <Gift className="my-1 h-8 w-8 text-[#c80f57]" />
                <p className="text-base font-bold text-[#141a45]">You could both get £20</p>
                <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                  Once all conditions are met, each eligible account receives the credit.
                </p>
              </li>
            </ol>
          </div>

          {/* Right: Referral journey & status */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div>
              <div className="flex items-center gap-3.5 pb-4">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                    Referral journey &amp; status
                  </h2>
                  <p className="text-sm leading-[21px] text-[#2d3361]">
                    The stages each referral goes through, from sharing to credit.
                  </p>
                </div>
              </div>

              {/* 6-Stage Stepper */}
              <div className="relative pt-2 pb-4">
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute left-[8%] right-[8%] top-[23px] h-[3px]"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #1f8c44 0%, #ec156c 100%)",
                  }}
                />
                <ol className="relative grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-1">
                  {JOURNEY_STAGES.map((stage) => (
                    <li
                      key={stage.num}
                      className="flex flex-col items-center gap-1 px-0.5 text-center"
                    >
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ec156c] bg-white text-[13px] font-extrabold text-[#c80f57]">
                        {stage.num}
                      </span>
                      <span className="text-[13px] font-bold leading-tight text-[#141a45]">
                        {stage.title}
                      </span>
                      <span className="text-[11px] leading-[13.75px] text-[#565c7e]">
                        {stage.desc}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-[14px] border border-[#fde6ee] bg-[#fff4f7] px-3.5 py-2.5">
              <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#c80f57]" />
              <p className="text-[13px] leading-[19.5px] text-[#2d3361]">
                Sharing a link doesn’t mean someone has received it. Your referral history shows the
                real status of each referral.
              </p>
            </div>
          </div>
        </section>

        {/* 4. R07/R08 · CREDIT, ELIGIBILITY, GOOD TO KNOW */}
        <section className="grid items-stretch gap-[18px] lg:grid-cols-3">
          {/* Col 1: Your £20 account credit */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Gift className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                Your £20 account credit
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <ul className="flex-1 space-y-2 text-sm leading-[20.3px] text-[#2d3361]">
                {CREDIT_POINTS.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              {/* Mini tilted ZOIKO £20 credit card/phone graphic matching Figma */}
              <div
                aria-hidden="true"
                className="hidden sm:flex h-[200px] w-[112px] shrink-0 rotate-6 flex-col items-center justify-between rounded-[20px] border-4 border-[#141a45] bg-gradient-to-b from-[#0f4733] via-[#9e0d4c] to-[#c80f57] p-3 text-white shadow-[0_14px_20px_rgba(20,26,69,0.3)]"
              >
                <div className="h-1.5 w-8 rounded-full bg-white/30" />
                <div className="text-center">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-white/90">
                    ZOIKO
                  </p>
                  <div className="mt-2 rounded-xl border border-white/30 bg-white/10 px-2.5 py-3">
                    <p className="text-2xl font-black leading-none">£20</p>
                    <p className="mt-1 text-[9px] font-bold text-[#d6e3dd]">Account credit</p>
                  </div>
                </div>
                <div className="h-1 w-6 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* Col 2: Eligibility at a glance */}
          <div
            id="eligibility"
            className="flex flex-col justify-between rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]"
          >
            <div>
              <div className="flex items-center gap-3.5 pb-3.5">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                  Eligibility at a glance
                </h2>
              </div>

              <ul className="space-y-2 text-sm leading-[20.3px] text-[#2d3361]">
                {ELIGIBILITY_POINTS.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="mt-4 inline-flex min-h-[54px] w-full items-center justify-between gap-3 rounded-full border border-[#ec156c] bg-white px-5 py-2 text-center text-[16px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7] cursor-pointer"
            >
              <FileText className="h-5 w-5 shrink-0" />
              <span>View full eligibility and terms</span>
              <ChevronRight className="h-5 w-5 shrink-0" />
            </button>
          </div>

          {/* Col 3: Good to know */}
          <div className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-5 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
            <div className="flex items-center gap-3.5 pb-3.5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
                <Info className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                Good to know
              </h2>
            </div>

            <ul className="space-y-2 text-sm leading-[20.3px] text-[#2d3361]">
              {GOOD_TO_KNOW_POINTS.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8c44]" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. R09 · FAQS */}
        <section className="rounded-[22px] border border-[#fde6ee] bg-white px-6 py-6 shadow-[0_14px_30px_-26px_rgba(20,26,69,0.4)]">
          <div className="flex items-center gap-3.5 pb-4">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#fff4f7] text-[#c80f57]">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.3px] text-[#141a45]">
                Refer &amp; Earn questions
              </h2>
              <p className="text-sm leading-[21px] text-[#2d3361]">
                Answers to common questions about the programme.
              </p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="self-start rounded-[14px] border border-[#e5e7f0] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3.5 py-3 text-left cursor-pointer"
                  >
                    <span className="text-sm font-extrabold leading-snug text-[#141a45]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-[18px] w-[18px] shrink-0 text-[#565c7e] transition-transform ${
                        isOpen ? "rotate-180 text-[#c80f57]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="border-t border-[#e5e7f0] px-3.5 py-3 text-xs leading-[19px] text-[#565c7e] sm:text-sm">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. R09 · ZOVIE STRIP */}
        <section className="pb-6">
          <div
            className="flex flex-wrap items-center gap-4 rounded-[22px] px-6 py-[18px] text-white"
            style={{
              backgroundImage:
                "linear-gradient(100deg, #0b3a2a 0%, #0f4733 40%, #9e0d4c 100%)",
            }}
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Bot className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-extrabold tracking-[-0.3px]">Chat with Zovie</h2>
            <p className="min-w-[240px] flex-1 text-sm leading-[21px] text-[#f2e6ec]">
              Got a question about Refer &amp; Earn? Zovie, our virtual assistant, can explain how
              the programme works. For anything about your account, ask to speak to our team.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={openChat}
                className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border-2 border-white bg-gradient-to-b from-[#e2105c] to-[#c80f57] px-[18px] text-[16px] font-extrabold text-white transition hover:brightness-110 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat with Zovie</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                href="/contact-us"
                className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full border-2 border-white bg-white px-[18px] text-[16px] font-extrabold text-[#c80f57] transition hover:bg-[#fff4f7]"
              >
                <Phone className="h-4 w-4" />
                <span>Contact support</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* FULL ELIGIBILITY & TERMS MODAL */}
      {termsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refer-terms-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e7f0] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f7] text-[#c80f57]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="refer-terms-title" className="text-lg font-extrabold text-[#141a45]">
                    Refer &amp; Earn — Full Eligibility &amp; Terms
                  </h3>
                  <p className="text-xs text-[#565c7e]">Zoiko Mobile UK Referral Programme</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#141a45] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#2d3361]">
              <div>
                <h4 className="font-bold text-[#141a45]">1. Referrer Eligibility</h4>
                <p className="mt-1 text-xs sm:text-sm">
                  You must be an existing Zoiko Mobile UK customer with an active account in good
                  standing and no overdue balance.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#141a45]">2. Qualifying Referred Friends</h4>
                <p className="mt-1 text-xs sm:text-sm">
                  Your friend must be a new Zoiko Mobile UK customer, sign up directly through your
                  unique referral link, and activate an eligible plan within the qualifying period.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#141a45]">3. £20 Account Credit Rules</h4>
                <p className="mt-1 text-xs sm:text-sm">
                  Once eligibility checks pass, £20 credit is applied to each qualifying Zoiko
                  Mobile account. Credit applies towards plan renewals and eligible charges, holds no
                  cash value, and is reversed if the qualifying order is cancelled or refunded.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#141a45]">4. Fair Use &amp; Privacy</h4>
                <p className="mt-1 text-xs sm:text-sm">
                  Self-referrals, duplicate accounts, and commercial spam are prohibited. Personal
                  account information is never shared between referrer and friend.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#e5e7f0] pt-4">
              <button
                type="button"
                onClick={() => {
                  setTermsOpen(false);
                  handleSignInForLink();
                }}
                className="rounded-full bg-[#c80f57] px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 cursor-pointer"
              >
                {loggedIn ? "Done" : "Sign in to get my link ›"}
              </button>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="rounded-full border border-[#d3d6e4] px-5 py-2.5 text-xs font-bold text-[#141a45] hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Referafriend;
export { Referafriend };

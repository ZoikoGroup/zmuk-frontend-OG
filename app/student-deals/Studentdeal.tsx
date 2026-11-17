"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown, ChevronRight, FileText, Info, Lock, Mail, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";
import {
  getStudentPlans,
  getStudentStatus,
  getToken,
  StudentApiError,
  type StudentMyStatus,
  type StudentPlan,
  type StudentPlansResponse,
  type StudentStatus,
} from "./studentApi";

const PAGE_PATH = "/student-deals";
const FORM_PATH = "/student-discount-application";
const LOGIN_HREF = `/login?next=${encodeURIComponent(PAGE_PATH)}`;
const IMG = "/images/student-deals";

type Term = "24-months" | "12-months" | "30-days";

const TERMS: { key: Term; label: string; days: number; short: string }[] = [
  { key: "24-months", label: "24 months", days: 730, short: "24-month contract" },
  { key: "12-months", label: "12 months", days: 365, short: "12-month contract" },
  { key: "30-days", label: "30 days", days: 30, short: "30-day plan" },
];

const HERO_PHOTOS = [
  { src: `${IMG}/A student working on a laptop.png`, alt: "A student working on a laptop", label: "Study" },
  { src: `${IMG}/A university building on a sunny day.png`, alt: "A university building on a sunny day", label: "Campus" },
  { src: `${IMG}/Friends laughing together outdoors.png`, alt: "Friends laughing together outdoors", label: "Life" },
];

const QUALIFY_STEPS = [
  { title: "Choose a plan", desc: "Compare data and contract length. No details needed yet." },
  { title: "Sign in or register", desc: "Your verification is linked to your own account, so it can't be shared or reused." },
  { title: "Confirm you're a student", desc: "Use your study email, our approved verification service, or another accepted way." },
  { title: "See your student price", desc: "Once verified, you'll see your exact price, VAT, contract length and what you'll pay when the student benefit ends." },
];

const GOOD_TO_KNOW = [
  { img: `${IMG}/Students studying together around a table.png`, alt: "Students studying together around a table", title: "Check coverage", desc: "See predicted 4G and 5G coverage at home, on campus and in halls before you choose.", cta: "Check a postcode", href: "/coverage-checker" },
  { img: `${IMG}/A smartphone on a desk.png`, alt: "A smartphone on a desk", title: "Keep your number", desc: "Text PAC to 65075 from your current phone and bring your number with you.", cta: "How switching works", href: "/switch-and-save" },
  { img: `${IMG}/A person holding a smartphone.png`, alt: "A person holding a smartphone", title: "eSIM or physical SIM", desc: "Get connected on a compatible, unlocked phone with eSIM, or choose a physical SIM.", cta: "Which suits me?", href: "/plans" },
];

const FAQS = [
  { q: "Who is eligible?", a: "Students who can confirm their status with a study email, our approved verification service, or another accepted way reviewed by our team. We confirm your eligibility before your student price applies." },
  { q: "I don't have a .ac.uk email. Can I still qualify?", a: "Yes. Not every institution uses .ac.uk. If you don't have a study email, you can use another accepted way and our team reviews it securely." },
  { q: "I'm an international student and haven't arrived yet", a: "If you haven't arrived in the UK yet, our team can review accepted evidence securely in your account. Contact verification help and we'll guide you." },
  { q: "When does my student price end?", a: "Your approval runs until the graduation date you give us. After that your verification ends, and you'll be asked to verify again to keep student prices." },
  { q: "What happens when my plan renews?", a: "Your price and contract length are shown clearly before you agree, including what you'll pay when the student benefit ends." },
  { q: "Can I keep my number?", a: "Yes. Text PAC to 65075 from your current phone to get your code, and use it at checkout or later from your dashboard." },
  { q: "I'm 16 or 17. Can I get a student plan?", a: "Contracts for under-18s follow a separate, approved process. We'll explain your options before you go any further." },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function termPrice(plan: StudentPlan, term: Term): string {
  const raw = term === "24-months" ? plan.price_24 : term === "12-months" ? plan.price_12 : plan.price_30;
  const n = Number(raw ?? plan.final_price ?? plan.price);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function planBullets(plan: StudentPlan): string[] {
  if (plan.features?.length) return plan.features.map((f) => f.title);
  if (plan.short_description) {
    return plan.short_description
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export function Studentdeal() {
  const router = useRouter();
  const { addPlanToCart } = useCart();

  const [loggedIn, setLoggedIn] = useState(false);
  const [status, setStatus] = useState<StudentStatus>("none");
  const [application, setApplication] = useState<StudentMyStatus["application"]>(null);
  const [plansData, setPlansData] = useState<StudentPlansResponse | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [term, setTerm] = useState<Term>("24-months");
  const [simTypePlan, setSimTypePlan] = useState<StudentPlan | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const canPurchase = !!plansData?.can_purchase && status === "approved";
  // none, rejected and expired students can (re)apply; pending and approved cannot.
  const canApply = status === "none" || status === "rejected" || status === "expired";
  const verifyHref = loggedIn ? FORM_PATH : LOGIN_HREF;

  const load = useCallback(async () => {
    const token = getToken();
    setLoggedIn(!!token);

    let me: StudentMyStatus | null = null;
    if (token) {
      try {
        me = await getStudentStatus();
      } catch (e) {
        if (e instanceof StudentApiError && e.status === 401) setLoggedIn(false);
      }
    }
    if (me) {
      setStatus(me.status);
      setApplication(me.application);
    } else {
      setStatus("none");
      setApplication(null);
    }

    setPlansLoading(true);
    setPlansError(null);
    try {
      const p = await getStudentPlans();
      setPlansData(p);
      if (!me) setStatus(p.status);
    } catch (e) {
      setPlansData(null);
      setPlansError(e instanceof Error ? e.message : "We couldn't load the plans.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const planAction = (plan: StudentPlan) => {
    if (canPurchase) {
      setSimTypePlan(plan);
      return;
    }
    if (!loggedIn) {
      router.push(LOGIN_HREF);
      return;
    }
    if (canApply) router.push(FORM_PATH);
  };

  const planButton = (): { label: string; disabled: boolean } => {
    if (canPurchase) return { label: "Choose this plan", disabled: false };
    if (!loggedIn) return { label: "Log in to verify", disabled: false };
    if (status === "pending") return { label: "Verification in progress", disabled: true };
    if (status === "expired") return { label: "Verify again", disabled: false };
    return { label: "Verify to unlock", disabled: false };
  };

  // Same hand-off as the All Plans page: SIM type popup, cart, checkout.
  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(
      simTypePlan as never,
      simType,
      term === "24-months" ? "24M" : term === "12-months" ? "12M" : "30D",
    );
    setSimTypePlan(null);
    router.push("/checkout");
  };

  const plans = plansData?.plans ?? [];

  return (
    <main className="min-h-screen bg-[#F7F7FB] font-['Figtree',sans-serif] text-[#0D1935]">
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

      {/* 1. HERO */}
      <section className="bg-gradient-to-b from-[#FFF1F5] to-[#F7F7FB]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]">For students across the UK</p>
            <span className="mt-2 block h-0.5 w-10 bg-[#D6075A]" />
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#0B4D2F] sm:text-5xl">
              Student
              <br />
              <span className="text-[#D6075A]">SIM-Only Plans</span>
            </h1>
            <p className="mt-5 text-lg font-semibold">A mobile plan that fits student life.</p>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Compare your data options and contract duration, then check whether you qualify for a student offer.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:w-64">
              <a href="#plans" className="flex items-center justify-center gap-1 rounded-full bg-[#D6075A] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#B80650]">
                Compare student plans <ChevronRight size={16} />
              </a>
              <a href="#qualify" className="flex items-center justify-center gap-1 rounded-full border border-[#D6075A] bg-white px-6 py-3 text-sm font-bold text-[#D6075A] hover:bg-[#FFF1F5]">
                Check eligibility <ChevronRight size={16} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-2 gap-3">
            <div className="relative row-span-2 min-h-[260px] overflow-hidden rounded-2xl">
              <Image src={HERO_PHOTOS[0].src} alt={HERO_PHOTOS[0].alt} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
              <span className="absolute bottom-3 left-3 rounded-full bg-[#D6075A] px-3 py-1 text-[10px] font-bold text-white">{HERO_PHOTOS[0].label}</span>
            </div>
            {HERO_PHOTOS.slice(1).map((p) => (
              <div key={p.src} className="relative min-h-[124px] overflow-hidden rounded-2xl">
                <Image src={p.src} alt={p.alt} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
                <span className="absolute bottom-3 left-3 rounded-full bg-[#D6075A] px-3 py-1 text-[10px] font-bold text-white">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CHOOSE YOUR STUDENT PLAN */}
      <section id="plans" className="bg-gradient-to-b from-[#FFF1F5] to-[#F7F7FB] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-extrabold text-[#0B4D2F]">Choose your student plan</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Plans built for study, travel home and everything in between.
          </p>

          <StatusBanner loggedIn={loggedIn} status={status} application={application} verifyHref={verifyHref} canApply={canApply} />

          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-between gap-3 rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-gray-100 sm:flex-row">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Calendar size={16} className="text-[#D6075A]" /> Choose your contract length
            </span>
            <div className="flex gap-1 rounded-full bg-gray-100 p-1">
              {TERMS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTerm(t.key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${term === t.key ? "bg-[#D6075A] text-white" : "text-gray-600 hover:text-[#D6075A]"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {plansLoading ? (
            <p className="mt-10 text-center text-sm text-gray-500">Loading plans...</p>
          ) : plansError ? (
            <div className="mx-auto mt-10 max-w-md rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-gray-600">{plansError}</p>
              <button type="button" onClick={load} className="mt-4 rounded-full bg-[#D6075A] px-5 py-2 text-xs font-bold text-white">
                Try again
              </button>
            </div>
          ) : plans.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">No student plans are available right now.</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {plans.map((plan) => {
                const btn = planButton();
                const bullets = planBullets(plan);
                const t = TERMS.find((x) => x.key === term)!;
                return (
                  <div key={plan.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-[#D6075A]">
                      <span className="flex items-center gap-2"><FileText size={14} />{plan.name}</span>
                      {plan.is_popular && <span className="rounded-full bg-[#FFF1F5] px-2 py-0.5 text-[10px]">Popular</span>}
                    </div>
                    <p className="mt-4 text-center text-3xl font-extrabold text-[#0B4D2F]">{plan.data_allowance || plan.name}</p>
                    <p className="mt-1 text-center text-3xl font-extrabold text-[#D6075A]">
                      £{termPrice(plan, term)}
                      <span className="text-sm font-semibold text-gray-500">/month</span>
                    </p>
                    <p className="mt-1 text-center text-[11px] text-gray-500">
                      {canPurchase ? "Your student price" : "Standard price"} · incl. VAT · {t.short}
                    </p>
                    {!canPurchase && (
                      <p className="mx-auto mt-3 flex items-center gap-1 rounded-full bg-[#FFF1F5] px-3 py-1 text-[11px] font-semibold text-[#D6075A]">
                        <Lock size={11} /> Check eligibility to see your student price
                      </p>
                    )}
                    {bullets.length > 0 && (
                      <ul className="mt-4 flex-1 space-y-2 text-xs text-gray-700">
                        {bullets.map((b, i) => (
                          <li key={`${plan.id}-${i}`} className="flex items-start gap-2">
                            <Check size={14} className="mt-0.5 shrink-0 text-[#D6075A]" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      disabled={btn.disabled}
                      onClick={() => planAction(plan)}
                      className="mt-5 flex items-center justify-center gap-1 rounded-full bg-[#D6075A] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#B80650] disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {btn.label} {!btn.disabled && <ChevronRight size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-gray-500">
            Standard prices are shown until you&apos;ve confirmed your student status in your account. Your student price is confirmed before checkout.
          </p>
          <div className="mt-4 text-center">
            <Link href="/plans" className="inline-flex items-center gap-1 rounded-full border border-[#D6075A] bg-white px-6 py-2.5 text-sm font-bold text-[#D6075A] hover:bg-[#FFF1F5]">
              Explore all SIM-only plans <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. CHECK IF YOU QUALIFY */}
      <section id="qualify" className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Eligibility</p>
          <span className="mt-2 block h-0.5 w-10 bg-[#D6075A]" />
          <h2 className="mt-3 text-3xl font-extrabold text-[#0B4D2F]">Check if you qualify</h2>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Browse plans freely. When you&apos;re ready, confirm your student status in your Zoiko account. We only ask for what we need.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ol className="space-y-5">
              {QUALIFY_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D6075A] text-xs font-bold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-bold">{s.title}</p>
                    <p className="text-xs text-gray-600">{s.desc}</p>
                  </div>
                </li>
              ))}
              <li>
                {canApply || !loggedIn ? (
                  <Link href={verifyHref} className="inline-flex items-center gap-1 rounded-full bg-[#D6075A] px-6 py-3 text-sm font-bold text-white hover:bg-[#B80650]">
                    {status === "expired" ? "Verify again" : "Check eligibility"} <ChevronRight size={14} />
                  </Link>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-200 px-6 py-3 text-sm font-bold text-gray-600">
                    {status === "approved" ? "You're verified" : "Verification in progress"}
                  </span>
                )}
              </li>
            </ol>

            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="flex items-center gap-2 font-bold"><Mail size={16} className="text-[#D6075A]" />Study email</p>
                <p className="mt-1 text-xs text-gray-600">We send a one-time link to your college or university email. Not every institution uses .ac.uk. We check against the approved list.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="flex items-center gap-2 font-bold"><ShieldCheck size={16} className="text-[#D6075A]" />Student verification service</p>
                <p className="mt-1 text-xs text-gray-600">Confirm your status through our approved verification partner, without uploading documents.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="flex items-center gap-2 font-bold"><FileText size={16} className="text-[#D6075A]" />Another accepted way</p>
                <p className="mt-1 text-xs text-gray-600">No study email yet, for example if you haven&apos;t arrived in the UK? Our team can review accepted evidence securely in your account.</p>
                <Link href="/dashboard/support" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#D6075A]">
                  Get verification help <ChevronRight size={12} />
                </Link>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-gray-700">
                <p className="flex items-center gap-2 font-bold"><Info size={14} className="text-amber-600" />Aged 16 or 17?</p>
                <p className="mt-1">Contracts for under-18s follow a separate, approved process. We&apos;ll explain your options before you go any further.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GOOD TO KNOW */}
      <section className="bg-gradient-to-b from-[#F7F7FB] to-[#FFF1F5] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#D6075A]">Before you choose</p>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-[#0B4D2F]">Good to know</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {GOOD_TO_KNOW.map((g) => (
              <div key={g.title} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="relative h-40">
                  <Image src={g.img} alt={g.alt} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <span className="block h-0.5 w-8 bg-[#D6075A]" />
                  <p className="mt-2 font-bold">{g.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{g.desc}</p>
                  <Link href={g.href} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#D6075A]">
                    {g.cta} <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0B4D2F]">Student plan questions</h2>
            <p className="mt-2 text-xs text-gray-500">Information updated 11 November 2026.</p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            {FAQS.map((f, i) => (
              <div key={f.q} className="border-b border-gray-100 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-bold"
                >
                  {f.q}
                  <ChevronDown size={16} className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-xs text-gray-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── STATUS BANNER ───────────────────────────────────────────────────────────

function StatusBanner({
  loggedIn,
  status,
  application,
  verifyHref,
  canApply,
}: {
  loggedIn: boolean;
  status: StudentStatus;
  application: StudentMyStatus["application"];
  verifyHref: string;
  canApply: boolean;
}) {
  let tone = "bg-[#EEF1FB] ring-[#DCE2F5]";
  let title = "Check your eligibility to see any student price.";
  let body = "Standard prices are shown until you've confirmed your student status in your account.";
  let cta = "Check eligibility";

  if (!loggedIn) {
    cta = "Log in to verify";
  } else if (status === "pending") {
    tone = "bg-amber-50 ring-amber-100";
    title = "We're checking your details.";
    body = `We'll email you once it's been reviewed.${application?.submitted_at ? ` Submitted ${fmtDate(application.submitted_at)}.` : ""}`;
  } else if (status === "approved") {
    tone = "bg-green-50 ring-green-100";
    title = "You're verified.";
    body = application?.valid_until
      ? `Your student status is verified until ${fmtDate(application.valid_until)}. Choose a plan below.`
      : "Your student plans are unlocked. Choose a plan below.";
  } else if (status === "rejected") {
    tone = "bg-red-50 ring-red-100";
    title = "We couldn't verify your student status.";
    body = application?.rejection_reason ? `${application.rejection_reason} You can apply again.` : "You can apply again.";
    cta = "Apply again";
  } else if (status === "expired") {
    tone = "bg-red-50 ring-red-100";
    title = "Your student verification has ended.";
    body = `Your student verification ended${application?.valid_until ? ` on ${fmtDate(application.valid_until)}` : ""}. Verify again to keep student prices.`;
    cta = "Verify again";
  }

  const showCta = !loggedIn || canApply;

  return (
    <div className={`mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl p-4 ring-1 ${tone}`}>
      <Info size={18} className="mt-0.5 shrink-0 text-[#4A5BA8]" />
      <div className="text-sm">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-gray-600">{body}</p>
        {showCta && (
          <Link href={verifyHref} className="mt-2 inline-block rounded-full border border-[#D6075A] bg-white px-4 py-1.5 text-xs font-bold text-[#D6075A] hover:bg-[#FFF1F5]">
            {cta}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── PREVIOUS DESIGN (kept for reference, not rendered) ──────────────────────
// "use client";
// 
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import React from "react";
// 
// // ─────────────────────────────────────────────────────────────────────────────
// // Small reusable bits
// // ─────────────────────────────────────────────────────────────────────────────
// 
// // Dashed placeholder (house style) for photos / mockups
// function Img({ className = "", label = "Image" }: { className?: string; label?: string }) {
//   return (
//     <div
//       className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-white/40 bg-white/10 text-xs text-white/70 ${className}`}
//     >
//       {label}
//     </div>
//   );
// }
// 
// const Check = ({ className = "h-4 w-4 text-green-600" }: { className?: string }) => (
//   <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
//     <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
//   </svg>
// );
// 
// function SectionHead({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="mb-12 text-center">
//       <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">{children}</h2>
//       <span className="mt-3 inline-block h-1 w-16 rounded bg-green-500" />
//     </div>
//   );
// }
// 
// // Feature icons (simple inline SVGs)
// const IconWifi = () => (
//   <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5a10 10 0 0114 0M8 16a5 5 0 018 0" />
//     <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
//   </svg>
// );
// const IconSave = () => (
//   <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M3 11a6 6 0 016-6h4a6 6 0 016 6v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3z" />
//     <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
//   </svg>
// );
// const IconPhone = () => (
//   <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <rect x="7" y="3" width="10" height="18" rx="2" />
//     <path strokeLinecap="round" d="M11 18h2" />
//   </svg>
// );
// const IconCap = () => (
//   <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-4 9 4-9 4-9-4z" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M7 11v4c0 1 2 2 5 2s5-1 5-2v-4" />
//   </svg>
// );
// 
// // ─────────────────────────────────────────────────────────────────────────────
// // Data
// // ─────────────────────────────────────────────────────────────────────────────
// 
// const STEPS = [
//   { n: 1, title: "Choose Your Plan", text: "Browse our range of SIM-only plans and select the one that best suits your needs." },
//   { n: 2, title: "Sign Up with Student Email", text: "Register for a Zoiko Mobile account using your student email address." },
//   { n: 3, title: "Verify Student Status", text: "Fill out the form and submit your student ID or proof of enrollment to confirm your eligibility for the discount." },
//   { n: 4, title: "Get Verification", text: "After successful registration and verification, we will share a promotional code with you via email or through the registered account." },
//   { n: 5, title: "Apply Promotional Code", text: "Apply the promotional code during the checkout process to receive a 20% discount on your chosen plan." },
// ];
// 
// const PERKS = [
//   { icon: <IconWifi />, label: "Stay Connected" },
//   { icon: <IconSave />, label: "Save Money" },
//   { icon: <IconPhone />, label: "Easy Switch" },
//   { icon: <IconCap />, label: "Focus on Studies" },
// ];
// 
// const SIM_POINTS = ["Keep Your Number", "Easy Network Switch", "No Setup Fees"];
// 
// const TERMS = [
//   "The student discount and free SIM card offer are available exclusively to registered students at recognized UK educational institutions.",
//   "The discount is applicable to the specified monthly plans and contract durations as mentioned earlier.",
//   "The free SIM card is available to students switching networks to Zoiko Mobile, as well as to new customers.",
//   "Renew your student discount with updated proof of enrollment upon contract expiration.",
// ];
// 
// // ─────────────────────────────────────────────────────────────────────────────
// // Page
// // ─────────────────────────────────────────────────────────────────────────────
// 
// function Studentdeal() {
//   const router = useRouter();
//   return (
//     <div className="bg-white dark:bg-gray-900">
// 
//       {/* ── Hero ── */}
//       <section className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-16">
//         <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
//           <div>
//             <div className="mb-5 flex flex-wrap items-center gap-3">
//               <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
//                 Zoiko Mobile Student Discount Programme
//               </span>
//               <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-yellow-300">
//                 20% OFF
//               </span>
//             </div>
// 
//             <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
//               Stay Connected, Study Smart, Save More
//             </h1>
// 
//             <p className="mb-8 max-w-xl text-sm leading-relaxed text-white/90">
//               Zoiko Mobile is delighted to introduce a{" "}
//               <span className="font-semibold text-yellow-300">comprehensive student discount programme</span>{" "}
//               with student SIM only deals UK that not only offers{" "}
//               <span className="font-semibold text-yellow-300">significant savings on our monthly price plans</span>{" "}
//               but also provides a <span className="font-semibold text-yellow-300">free SIM card</span> to students
//               looking to switch networks within the UK. We recognise the importance of staying connected while
//               managing a tight budget, and we are here to help students make the most of their mobile services,
//               including a <span className="font-semibold text-yellow-300">hassle-free network switch.</span>
//             </p>
//           <Link href="/student-discount-application">
//             <button className="rounded-md bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-300">
//               Register Now
//             </button>
//           </Link>
//           </div>
// 
//           {/* Photo grid */}
//        <div className="grid grid-cols-2 gap-4">
//   <img src="/images/student.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
//   <img src="/images/Rectangle 877.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
//   <img src="/images/Rectangle 880.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
//   <img src="/images/Rectangle 878.png" alt="Student" className="h-60 w-full rounded-2xl object-cover" />
// </div>
//         </div>
//       </section>
// 
//       {/* ── How to get discount ── */}
//       <section className="px-4 py-16">
//         <div className="mx-auto max-w-6xl">
//           <SectionHead>How to Get Your Discount - Student SIM only Deals UK</SectionHead>
// 
//           <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
//             {STEPS.slice(0, 3).map((s) => (
//               <StepCard key={s.n} {...s} />
//             ))}
//           </div>
//           <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
//             {STEPS.slice(3).map((s) => (
//               <StepCard key={s.n} {...s} />
//             ))}
//           </div>
//         </div>
//       </section>
// 
//       {/* ── Don't Miss Out ── */}
//       <section className="bg-gray-100 px-4 py-16 dark:bg-gray-800">
//         <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
//           <div>
//             <h2 className="mb-5 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">Don&rsquo;t Miss Out</h2>
//             <p className="mb-8 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
//               Zoiko Mobile is dedicated to helping students stay connected, save money, and make network switching
//               in the UK a seamless process. Join us today to experience affordable, high-quality mobile services
//               while focusing on your studies and social life. Stay connected, stay smart, and stay within your
//               budget with Zoiko Mobile.
//             </p>
//             <button onClick={()=>router.push("/plans")} className="cursor-pointer rounded-md border border-green-600 px-6 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
//               Browse Plans Now
//             </button>
//           </div>
// 
//           <div className="grid grid-cols-2 gap-4">
//             {PERKS.map((p) => (
//               <div key={p.label} className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900">
//                 {p.icon}
//                 <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{p.label}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
// 
//       {/* ── Free SIM Card ── */}
//       <section className="px-4 py-16">
//         <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
//           <div>
//             <h2 className="mb-5 text-2xl font-bold text-[#e6007e] sm:text-3xl">Free SIM Card and Network Switching</h2>
//             <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
//               As part of our student discount programme, you will also receive a{" "}
//               <span className="font-semibold text-green-600">free SIM card</span> when you join Zoiko Mobile to
//               switch from another network. Switching networks within the UK is a straightforward process, and you
//               can keep your existing number. By making this switch or joining as a new user, you gain access to our
//               discounted student plans, ensuring{" "}
//               <span className="font-semibold text-green-600">flexibility and savings.</span>
//             </p>
//           </div>
// 
//           <div>
//             {/* SIM card mockup */}
//             <div className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-br from-green-600 to-teal-500 p-6 text-white shadow-md">
//               <div className="h-10 w-14 rounded-md border-2 border-dashed border-white/50 bg-white/20" />
//               <div className="text-right">
//                 <div className="text-lg font-bold">Zoiko</div>
//                 <div className="text-xs text-white/90">FREE for Students</div>
//               </div>
//             </div>
// 
//             <div className="space-y-3">
//               {SIM_POINTS.map((pt) => (
//                 <div key={pt} className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
//                   <Check />
//                   <span className="text-sm text-gray-700 dark:text-gray-200">{pt}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>
// 
//       {/* ── Terms & Conditions ── */}
//       <section className="bg-gray-100 px-4 py-16 dark:bg-gray-800">
//         <div className="mx-auto max-w-4xl">
//           <SectionHead>Terms &amp; Conditions</SectionHead>
// 
//           <div className="space-y-4">
//             {TERMS.map((t, i) => (
//               <div key={i} className="flex items-start gap-3 rounded-lg bg-white px-5 py-4 shadow-sm dark:bg-gray-900">
//                 <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
//                 <p className="text-sm text-gray-600 dark:text-gray-300">{t}</p>
//               </div>
//             ))}
//           </div>
// 
//           <div className="mt-6 rounded-lg border-2 border-yellow-300 bg-white px-5 py-4 text-center dark:bg-gray-900">
//             <p className="text-sm text-gray-700 dark:text-gray-200">
//               This offer can be used in conjunction with other promotional offers from Zoiko Mobile.
//             </p>
//           </div>
// 
//           <div className="mt-8 flex justify-center gap-4">
//             {/* <Link href="/student-discount-application"> */}
//             <button onClick={()=>router.push("/student-discount-application")} className="cursor-pointer rounded-md bg-[#e6007e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
//               Join Now
//             </button>
//             {/* </Link> */}
//             <button onClick={()=>router.push("/switch-and-save")} className="cursor-pointer rounded-md border border-green-600 px-6 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
//               Switch &amp; Save
//             </button>
//           </div>
//         </div>
//       </section>
// 
//     </div>
//   );
// }
// 
// function StepCard({ n, title, text }: { n: number; title: string; text: string }) {
//   return (
//     <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
//       <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">
//         {n}
//       </div>
//       <h3 className="mb-2 font-bold text-gray-800 dark:text-white">{title}</h3>
//       <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{text}</p>
//     </div>
//   );
// }
// 
// export default Studentdeal;
// export { Studentdeal };
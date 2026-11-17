"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Calendar,
  FileText,
  Info,
  Lock,
  Mail,
  ShieldCheck,
  Users,
  Wifi,
  Repeat,
  Smartphone,
  Globe,
  LifeBuoy,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";
import {
  addNominee,
  getMyStatus,
  getNominees,
  getPlans,
  getToken,
  PsApiError,
  type MyStatus,
  type NomineesResponse,
  type PlansResponse,
  type PublicSectorPlan,
  type VerificationStatus,
} from "./publicSectorApi";

const OFFER_PATH = "/civilservants";
const FORM_PATH = "/public-sector-workers-form";
const LOGIN_HREF = `/login?next=${encodeURIComponent(OFFER_PATH)}`;

type Term = "24-months" | "12-months" | "30-days";

const TERMS: { key: Term; label: string; days: number; short: string }[] = [
  { key: "24-months", label: "24 months", days: 730, short: "24-month contract" },
  { key: "12-months", label: "12 months", days: 365, short: "12-month contract" },
  { key: "30-days", label: "30 days", days: 30, short: "30-day plan" },
];

const HERO_PHOTOS = [
  { src: "/images/public-sector-plans/A healthcare professional at work.png", alt: "A healthcare professional at work", label: "Healthcare" },
  { src: "/images/public-sector-plans/A teacher with pupils in a classroom.png", alt: "A teacher with pupils in a classroom", label: "Education" },
  { src: "/images/public-sector-plans/Colleagues shaking hands in an office.png", alt: "Colleagues shaking hands in an office", label: "Public service" },
];

const QUALIFY_STEPS = [
  { title: "Explore", desc: "Compare plans and plan lengths. No ID or personal details needed." },
  { title: "Sign in or register", desc: "Tell us which type of organisation you work for." },
  { title: "Verify", desc: "Use your work email or, if you don't have one, an approved secure alternative reviewed by our team." },
  { title: "Get your decision", desc: "We'll tell you if you're verified, if we need more information, or if we can't confirm eligibility, with a way to ask for a review." },
  { title: "See your price", desc: "Return to your chosen plan with your exact saving, VAT and final monthly charge." },
];

const INFO_TABS = [
  { key: "coverage", label: "Check coverage", icon: Wifi, text: "5G and 4G coverage depends on where you live and work. Check coverage for your postcode before you choose a plan." },
  { key: "number", label: "Keep your number", icon: Repeat, text: "You can bring your existing number with a PAC or STAC code from your current provider, at checkout or later from your dashboard." },
  { key: "sim", label: "eSIM or physical SIM", icon: Smartphone, text: "You choose eSIM or a physical SIM when you pick your plan. eSIM needs a compatible handset." },
  { key: "roaming", label: "Roaming & fair use", icon: Globe, text: "Roaming allowances and the fair usage policy are set out in each plan's details and in your contract summary." },
];

const FAQS = [
  { q: "Who qualifies?", a: "The offer is for eligible public sector workers, for example in healthcare, education and public service. We confirm your eligibility before your public sector price applies." },
  { q: "What proof is accepted?", a: "A work email is preferred: we send a secure link to it. If you don't have one, you can use another approved option that our team reviews, or ask our team for help." },
  { q: "What does “lifetime” mean?", a: "Your saving applies for as long as you remain a Zoiko Mobile customer and stay eligible under the offer terms." },
  { q: "Can I nominate friends or family? How many?", a: "Yes. Once you've applied you can add up to 5 people. Each person's eligibility is checked separately." },
  { q: "Is the 30-day plan eligible?", a: "Use the plan length selector above to see the prices available for each plan length." },
  { q: "Can I use it with other promotions?", a: "Offer terms apply. Your exact price is confirmed in your account and again at checkout." },
  { q: "Will my price change?", a: "Your price is shown clearly before checkout and any change is communicated to you in advance." },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function termPrice(plan: PublicSectorPlan, term: Term): string {
  const raw = term === "24-months" ? plan.price_24 : term === "12-months" ? plan.price_12 : plan.price_30;
  const n = Number(raw ?? plan.final_price ?? plan.price);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function planBullets(plan: PublicSectorPlan): string[] {
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
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Publicsectordeals() {
  const router = useRouter();
  const { addPlanToCart } = useCart();

  const [loggedIn, setLoggedIn] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>("none");
  const [application, setApplication] = useState<MyStatus["application"]>(null);
  const [plansData, setPlansData] = useState<PlansResponse | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [nominees, setNominees] = useState<NomineesResponse | null>(null);

  const [term, setTerm] = useState<Term>("24-months");
  const [simTypePlan, setSimTypePlan] = useState<PublicSectorPlan | null>(null);
  const [infoTab, setInfoTab] = useState(INFO_TABS[0].key);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const canPurchase = !!plansData?.can_purchase && status === "approved";

  const load = useCallback(async () => {
    const token = getToken();
    setLoggedIn(!!token);

    // Status first, so an expired token is noticed before plans are asked for.
    let me: MyStatus | null = null;
    if (token) {
      try {
        me = await getMyStatus();
      } catch (e) {
        if (e instanceof PsApiError && e.status === 401) {
          setLoggedIn(false);
        }
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
      const p = await getPlans();
      setPlansData(p);
      if (!me) setStatus(p.status);
    } catch (e) {
      setPlansData(null);
      setPlansError(e instanceof Error ? e.message : "We couldn't load the plans.");
    } finally {
      setPlansLoading(false);
    }

    if (me && me.status !== "none") {
      try {
        setNominees(await getNominees());
      } catch {
        setNominees(null);
      }
    } else {
      setNominees(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const verifyHref = loggedIn ? FORM_PATH : LOGIN_HREF;
  const canApply = status === "none" || status === "rejected";

  /** What the plan button does for the current user. */
  const planAction = (plan: PublicSectorPlan) => {
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

  const sortedPlans = useMemo(() => plansData?.plans ?? [], [plansData]);

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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0D1935]">
              For the people who support our communities
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#0B4D2F] sm:text-5xl">
              Public Sector
              <br />
              <span className="text-[#D6075A]">SIM-Only Plans</span>
            </h1>
            <p className="mt-5 text-lg font-semibold">
              A little more for the people who support our communities.
            </p>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Explore flexible SIM-only plans and find out whether you qualify for our public sector offer.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:w-72">
              <a
                href="#plans"
                className="flex items-center justify-center gap-1 rounded-full bg-[#D6075A] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#B80650]"
              >
                Compare public sector plans <ChevronRight size={16} />
              </a>
              <a
                href="#qualify"
                className="flex items-center justify-center gap-1 rounded-full border border-[#D6075A] bg-white px-6 py-3 text-sm font-bold text-[#D6075A] transition-colors hover:bg-[#FFF1F5]"
              >
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

      {/* 2. TWO WAYS THE OFFER CAN HELP */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#D6075A]">Our public sector offer</p>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-[#0B4D2F]">Two ways the offer can help</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-600">
            Eligibility and offer terms apply. We confirm your price only after we&apos;ve verified your eligibility.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="flex gap-4 rounded-2xl bg-[#FFF1F5] p-6 shadow-sm ring-1 ring-pink-100">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-[#D6075A] text-white">
                <span className="text-lg font-extrabold leading-none">30%</span>
                <span className="text-[9px] font-bold">OFF</span>
              </div>
              <div>
                <h3 className="font-bold">For eligible new public sector workers</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Zoiko currently advertises 30% off SIM-only plans for eligible new public sector customers. Your exact saving, VAT and final monthly charge are shown before you agree.
                </p>
                <ul className="mt-3 space-y-1 text-xs">
                  {["New customers only", "Eligible plans and plan lengths confirmed in your quote", "Verified securely, never by job title alone"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><Check size={14} className="text-[#D6075A]" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl bg-[#EEF8F2] p-6 shadow-sm ring-1 ring-green-100">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-[#138A4B] text-white">
                <span className="text-lg font-extrabold leading-none">20%</span>
                <span className="text-[9px] font-bold">OFF</span>
              </div>
              <div>
                <h3 className="font-bold">For up to five friends or family</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Once you&apos;re verified, you can invite up to five people. Each person accepts their own invitation and receives their own price and contract. You never share their account.
                </p>
                <ul className="mt-3 space-y-1 text-xs">
                  {["Up to 5 nomination places", "Consent-based invitations", "Each person's eligibility checked separately"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><Check size={14} className="text-[#138A4B]" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CHOOSE YOUR PLAN */}
      <section id="plans" className="bg-gradient-to-b from-[#FFF1F5] to-[#F7F7FB] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl font-extrabold text-[#0B4D2F]">Choose your plan</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            The same SIM-only plans as our main range, with your public sector price once you&apos;re verified.
          </p>

          <StatusBanner
            loggedIn={loggedIn}
            status={status}
            application={application}
            verifyHref={verifyHref}
            canApply={canApply}
          />

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
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    term === t.key ? "bg-[#D6075A] text-white" : "text-gray-600 hover:text-[#D6075A]"
                  }`}
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
          ) : sortedPlans.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">No public sector plans are available right now.</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPlans.map((plan) => {
                const btn = planButton();
                const bullets = planBullets(plan);
                const t = TERMS.find((x) => x.key === term)!;
                return (
                  <div key={plan.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-[#D6075A]">
                      <span className="flex items-center gap-2"><FileText size={14} />{plan.name}</span>
                      {plan.is_popular && <span className="rounded-full bg-[#FFF1F5] px-2 py-0.5 text-[10px]">Popular</span>}
                    </div>
                    <p className="mt-4 text-center text-3xl font-extrabold text-[#0B4D2F]">
                      {plan.data_allowance || plan.name}
                    </p>
                    <p className="mt-1 text-center text-3xl font-extrabold text-[#D6075A]">
                      £{termPrice(plan, term)}
                      <span className="text-sm font-semibold text-gray-500">/month</span>
                    </p>
                    <p className="mt-1 text-center text-[11px] text-gray-500">
                      {canPurchase ? "Your verified price" : "Standard price"} · incl. VAT · {t.short}
                    </p>
                    {!canPurchase && (
                      <p className="mx-auto mt-3 flex items-center gap-1 rounded-full bg-[#FFF1F5] px-3 py-1 text-[11px] font-semibold text-[#D6075A]">
                        <Lock size={11} /> Verify your status to see your price
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

          <div className="mt-8 text-center">
            <Link
              href="/plans"
              className="inline-flex items-center gap-1 rounded-full border border-[#D6075A] bg-white px-6 py-2.5 text-sm font-bold text-[#D6075A] hover:bg-[#FFF1F5]"
            >
              Explore all SIM-only plans <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CHECK IF YOU QUALIFY */}
      <section id="qualify" className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D6075A]">Eligibility</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#0B4D2F]">Check if you qualify</h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            You can browse plans without sharing any details. When you&apos;re ready, verify your eligibility securely in your Zoiko account.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ol className="space-y-5">
              {QUALIFY_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D6075A] text-xs font-bold text-[#D6075A]">
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
                  <Link
                    href={verifyHref}
                    className="inline-flex items-center gap-1 rounded-full bg-[#D6075A] px-6 py-3 text-sm font-bold text-white hover:bg-[#B80650]"
                  >
                    Start verification <ChevronRight size={14} />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-6 py-3 text-sm font-bold text-gray-600">
                    {status === "approved" ? "You're verified" : "Verification in progress"}
                  </span>
                )}
              </li>
            </ol>

            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="flex items-center gap-2 font-bold text-[#D6075A]"><Mail size={16} />Work email <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] text-green-700">Preferred</span></p>
                <p className="mt-1 text-xs text-gray-600">We send a secure link to your work email. A work email doesn&apos;t confirm eligibility on its own. It&apos;s one approved part of the check.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="flex items-center gap-2 font-bold text-[#D6075A]"><ShieldCheck size={16} />Secure ID review</p>
                <p className="mt-1 text-xs text-gray-600">Upload proof only inside your signed-in account, through an encrypted upload. Never send ID by email or another account. We&apos;ll tell you which details you can cover up.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <p className="flex items-center gap-2 font-bold text-[#D6075A]"><LifeBuoy size={16} />Need another way?</p>
                <p className="mt-1 text-xs text-gray-600">If you can&apos;t use either option, our team can help you verify another way. We only ask for the minimum we need.</p>
                <Link href="/dashboard/support" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#D6075A]">
                  Get verification help <ChevronRight size={12} />
                </Link>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-[#F1F3FB] p-4 text-xs text-gray-600">
                <Lock size={14} className="mt-0.5 shrink-0 text-[#4A5BA8]" />
                We never publish your employer, role, department or ID details, and we don&apos;t share them with anyone you nominate.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SHARE THE BENEFIT */}
      <NomineesSection
        loggedIn={loggedIn}
        status={status}
        nominees={nominees}
        verifyHref={verifyHref}
        onChanged={setNominees}
      />

      {/* 6. EVERYTHING ELSE */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#D6075A]">Before you choose</p>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-[#0B4D2F]">Everything else you need to know</h2>

          <div className="mt-6 flex flex-wrap justify-center gap-2 rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-100">
            {INFO_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setInfoTab(t.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                    infoTab === t.key ? "bg-[#FFF1F5] text-[#D6075A]" : "text-gray-600"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-gray-600">
            {INFO_TABS.find((t) => t.key === infoTab)?.text}
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-3xl font-extrabold text-[#0B4D2F]">Public sector offer questions</h3>
              <p className="mt-2 text-xs text-gray-500">Offer information updated 11 November 2026.</p>
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
  status: VerificationStatus;
  application: MyStatus["application"];
  verifyHref: string;
  canApply: boolean;
}) {
  let tone = "bg-[#EEF1FB] ring-[#DCE2F5]";
  let title = "Verify your public sector eligibility to see any available savings.";
  let body = "You can browse standard plans now. Verification happens securely in your account.";
  let cta = "Check eligibility";

  if (loggedIn && status === "pending") {
    tone = "bg-amber-50 ring-amber-100";
    title = "We're checking your details.";
    body = `We'll email you once it's been reviewed.${application?.submitted_at ? ` Submitted ${fmtDate(application.submitted_at)}.` : ""}`;
  } else if (loggedIn && status === "approved") {
    tone = "bg-green-50 ring-green-100";
    title = "You're verified.";
    body = "Your public sector plans are unlocked. Choose a plan below.";
  } else if (loggedIn && status === "rejected") {
    tone = "bg-red-50 ring-red-100";
    title = "We couldn't verify your eligibility.";
    body = application?.rejection_reason
      ? `${application.rejection_reason} You can apply again.`
      : "You can apply again.";
    cta = "Apply again";
  } else if (!loggedIn) {
    cta = "Log in to verify";
  }

  const showCta = !loggedIn || canApply;

  return (
    <div className={`mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl p-4 ring-1 ${tone}`}>
      <Info size={18} className="mt-0.5 shrink-0 text-[#4A5BA8]" />
      <div className="text-sm">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-gray-600">{body}</p>
        {showCta && (
          <Link
            href={verifyHref}
            className="mt-2 inline-block rounded-full border border-[#D6075A] bg-white px-4 py-1.5 text-xs font-bold text-[#D6075A] hover:bg-[#FFF1F5]"
          >
            {cta}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── NOMINEES ────────────────────────────────────────────────────────────────

function NomineesSection({
  loggedIn,
  status,
  nominees,
  verifyHref,
  onChanged,
}: {
  loggedIn: boolean;
  status: VerificationStatus;
  nominees: NomineesResponse | null;
  verifyHref: string;
  onChanged: (n: NomineesResponse) => void;
}) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", relationship: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const used = nominees?.used ?? 0;
  const limit = nominees?.limit ?? 5;
  const hasApplication = loggedIn && status !== "none";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const res = await addNominee({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        relationship: form.relationship.trim(),
      });
      onChanged(res);
      setForm({ full_name: "", email: "", phone: "", relationship: "" });
      setMessage({ ok: true, text: "Nominee added." });
    } catch (err) {
      if (err instanceof PsApiError && err.errors) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.errors)) {
          const first = Array.isArray(v) ? v[0] : v;
          if (typeof first === "string") next[k] = first;
        }
        setErrors(next);
      }
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not add the nominee." });
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#D6075A]";

  return (
    <section className="bg-gradient-to-b from-[#FFF1F5] to-[#F7F7FB] px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D6075A]">Friends &amp; family</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#0B4D2F]">Share the benefit with up to five people</h2>
          <p className="mt-2 text-sm text-gray-600">
            Once you&apos;re verified, invite people close to you. They accept privately, get their own 20% price and contract, and their account stays theirs.
          </p>

          <div className="mt-5 flex items-center gap-2">
            {Array.from({ length: limit }).map((_, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                  i < used ? "border-[#D6075A] bg-[#D6075A] text-white" : "border-pink-200 text-pink-300"
                }`}
              >
                <Users size={13} />
              </span>
            ))}
            <span className="ml-2 text-xs font-semibold text-gray-600">{used} of {limit} places used</span>
          </div>

          {!hasApplication ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F1F3FB] p-4 text-xs text-gray-600">
              <Lock size={14} className="mt-0.5 shrink-0 text-[#4A5BA8]" />
              <span>
                Available once you&apos;ve verified. You can manage nominations after you&apos;ve signed in and your public sector eligibility is confirmed.
              </span>
            </div>
          ) : (
            <>
              {nominees && nominees.nominees.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {nominees.nominees.map((n) => (
                    <li key={n.id} className="rounded-lg bg-white px-4 py-2 text-xs shadow-sm ring-1 ring-gray-100">
                      <span className="font-bold">{n.full_name}</span> · {n.relationship}
                    </li>
                  ))}
                </ul>
              )}

              {nominees?.can_add ? (
                <form onSubmit={submit} className="mt-5 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:grid-cols-2">
                  {(
                    [
                      ["full_name", "Full name"],
                      ["relationship", "Relationship"],
                      ["email", "Email"],
                      ["phone", "Phone"],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="text-xs font-semibold">
                      {label}
                      <input
                        className={input}
                        value={form[k]}
                        onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                        required
                      />
                      {errors[k] && <span className="text-[11px] font-normal text-red-600">{errors[k]}</span>}
                    </label>
                  ))}
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-[#D6075A] px-5 py-2 text-xs font-bold text-white disabled:bg-gray-300"
                    >
                      {saving ? "Adding..." : "Add nominee"}
                    </button>
                    {message && (
                      <span className={`ml-3 text-xs ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</span>
                    )}
                  </div>
                </form>
              ) : (
                nominees && (
                  <p className="mt-4 text-xs text-gray-600">
                    {status === "rejected"
                      ? "Nominations are closed because your registration wasn't approved."
                      : "You've used all your places."}
                  </p>
                )
              )}
              <p className="mt-3 text-[11px] text-gray-500">
                Nominees are recorded against your registration. They can&apos;t be edited or removed here.
              </p>
            </>
          )}

          {!loggedIn && (
            <Link
              href={verifyHref}
              className="mt-5 inline-flex items-center gap-1 rounded-full border border-[#D6075A] bg-white px-6 py-2.5 text-sm font-bold text-[#D6075A] hover:bg-[#FFF1F5]"
            >
              Check eligibility <ChevronRight size={14} />
            </Link>
          )}
        </div>

        <div className="relative min-h-[260px] overflow-hidden rounded-3xl">
          <Image
            src="/images/public-sector-plans/11.png"
            alt="Friends and family together"
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

// ─── PREVIOUS DESIGN (civil servants page, kept for reference, not rendered) ────────────────────────
// "use client";
// 
// import { useRouter } from "next/navigation";
// import React from "react";
// 
// // ─────────────────────────────────────────────────────────────────────────────
// // Small reusable bits
// // ─────────────────────────────────────────────────────────────────────────────
// 
// const Check = ({ className = "h-5 w-5 text-green-600" }: { className?: string }) => (
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
// // ─────────────────────────────────────────────────────────────────────────────
// // Data
// // ─────────────────────────────────────────────────────────────────────────────
// 
// // Replace these with your real image paths (put files in /public).
// const HERO_IMAGES = [
//   { src: "/images/Mask group.png", alt: "Public sector worker" },
//   { src: "/images/studio-portrait-of-smiling-young-female-police-off-2024-10-19-14-03-02-utc 1.png", alt: "Police officer" },
//   { src: "/images/Mask group (1).png", alt: "Firefighters" },
//   { src: "/images/happy-soldier-military-and-portrait-of-people-in-2025-04-06-10-08-19-utc 1.png", alt: "Armed forces" },
// ];
// 
// const STEPS = [
//   { n: 1, title: "Choose Your Plan", text: "Browse our range of SIM-only plans and select the perfect option for your needs." },
//   { n: 2, title: "Sign Up with Your Work Email", text: "Register for a Zoiko Mobile account using your official work email address." },
//   { n: 3, title: "Verify Your Status", text: "Provide a valid work ID to confirm your public sector employment status." },
//   { n: 4, title: "Nominate Family and Friends", text: "Add up to 5 nominated family and friends to receive a 20% lifetime discount on their SIM-only plans." },
//   { n: 5, title: "Get Your Discount", text: "Enjoy 30% off your chosen plan for as long as you remain a Zoiko Mobile customer, and 20% off for your nominated family and friends." },
// ];
// 
// const TERMS = [
//   { title: "30% Discount", text: "Applies to any Zoiko Mobile SIM-only plan for as long as you remain a customer." },
//   { title: "20% Discount for Family and Friends", text: "Applies to up to 5 nominated family and friends for as long as they remain Zoiko Mobile customers." },
//   { title: "Valid Work ID", text: "You must provide a valid work ID to confirm your public sector work status." },
//   { title: "Eligibility", text: "This offer is available to new public sector workers customers only." },
//   { title: "Fair Usage Policy", text: "Applies to all plans, including unlimited calls & texts and EU roaming." },
//   { title: "5G Coverage", text: "Available in selected areas only." },
//   { title: "Wi-Fi Calling", text: "Requires compatible handset and network coverage." },
//   { title: "EU Roaming", text: "For use in EU countries only. This offer can be used in conjunction with other promotional offers from Zoiko Mobile." },
// ];
// 
// // ─────────────────────────────────────────────────────────────────────────────
// // Page
// // ─────────────────────────────────────────────────────────────────────────────
// 
// function Publicsectordeals() {
//   const router = useRouter();
//   return (
//     <div className="bg-white dark:bg-gray-900">
// 
//       {/* ── Hero ── */}
//       <section className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-16">
//         <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
//           <div>
//             <span className="mb-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
//               Exclusive Offer for UK Public Sector Workers
//             </span>
// 
//             <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
//               Honoring Your Service with Exclusive Savings
//             </h1>
// 
//             <p className="mb-8 max-w-xl text-sm leading-relaxed text-white/90">
//               At Zoiko Mobile, we appreciate the hard work and dedication of our public sector workers. As a token
//               of gratitude, we are offering an{" "}
//               <span className="font-semibold text-yellow-300">exclusive 30% lifetime discount</span> on any of our
//               SIM-only plans for the public sector workers, and{" "}
//               <span className="font-semibold text-yellow-300">20% lifetime discount for up to 5 nominated family and friends.</span>
//             </p>
// 
//             <button onClick={()=>router.push("/public-sector-workers-form")} className="cursor-pointer rounded-md bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-300">
//               Register Now
//             </button>
//           </div>
// 
//           {/* Photo grid */}
//           <div className="grid grid-cols-2 gap-4">
//             {HERO_IMAGES.map((img) => (
//               <img
//                 key={img.src}
//                 src={img.src}
//                 alt={img.alt}
//                 className="h-44 w-full rounded-2xl object-cover"
//               />
//             ))}
//           </div>
//         </div>
//       </section>
// 
//       {/* ── How to get discount ── */}
//       <section className="px-4 py-16">
//         <div className="mx-auto max-w-6xl">
//           <SectionHead>How to Get Your Discount</SectionHead>
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
//               Take advantage of this exclusive offer and enjoy significant savings on your mobile plan. Browse our
//               plans today and start saving with Zoiko Mobile.
//             </p>
//             <button onClick={()=>router.push("/plans")} className="rounded-md cursor-pointer border border-green-600 px-6 py-2.5 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-gray-700">
//               Browse Plans Now
//             </button>
//           </div>
// 
//           {/* 30% OFF card */}
//           <div className="mx-auto flex h-44 w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-[#e6007e] text-white shadow-md">
//             <div className="text-5xl font-extrabold">30%</div>
//             <div className="text-lg font-semibold">OFF</div>
//             <div className="mt-1 text-xs text-white/90">Lifetime Discount</div>
//           </div>
//         </div>
//       </section>
// 
//       {/* ── Thank You ── */}
//       <section className="px-4 py-16">
//         <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
//           <div>
//             <h2 className="mb-5 text-2xl font-bold text-[#e6007e] sm:text-3xl">Thank You for Your Service</h2>
//             <p className="max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
//               At <span className="font-semibold text-green-600">Zoiko Mobile</span>, we are proud to support our
//               public sector workers and their loved ones. We look forward to providing you with the best network
//               experience at an unbeatable price.
//             </p>
//           </div>
//           <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
//             <svg className="h-5 w-5 text-[#e6007e]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
//               <path d="M12 21s-7.5-4.6-10-9.3C.6 8.6 2 5 5.2 5c1.9 0 3.2 1 3.8 2 .6-1 1.9-2 3.8-2C16 5 17.4 8.6 16 11.7 13.5 16.4 12 21 12 21z" />
//             </svg>
//             <span className="text-sm font-semibold">We Appreciate You</span>
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
//               <div key={i} className="rounded-lg bg-white px-5 py-4 shadow-sm dark:bg-gray-900">
//                 <h3 className="mb-1 text-sm font-bold text-green-700 dark:text-green-400">{t.title}</h3>
//                 <p className="text-sm text-gray-600 dark:text-gray-300">{t.text}</p>
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
//             <button onClick={()=>router.push("/student-discount-application")} className="cursor-pointer rounded-md bg-[#e6007e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]">
//               Join Now
//             </button>
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
// export default Publicsectordeals;
// export { Publicsectordeals };
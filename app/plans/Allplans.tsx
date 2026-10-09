"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Category slugs
const SIM_SLUG = "sim-only-plans";
const BUSINESS_SLUG = "zoiko-sim-only-business-deals";
const ROAMING_SLUG = "zoiko-roaming-deals";

type Duration = "24 Month Plan" | "12 Month Plan" | "30 Day Plan";
const DURATIONS: Duration[] = ["24 Month Plan", "12 Month Plan", "30 Day Plan"];

interface Feature {
  id: number;
  title: string;
}
interface Category {
  id: number;
  name: string;
  slug: string;
}
interface Plan {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: string;
  price_24: string | null;
  price_12: string | null;
  price_30: string | null;
  data_allowance: string | null;
  tier_label: string | null;
  is_popular: boolean;
  category: Category | null;
  features: Feature[];
  transatelID: string | null;
  final_price: string;
  duration_days: number;
}



function priceFor(plan: Plan, duration: Duration): string {
  const raw =
    duration === "24 Month Plan" ? plan.price_24 :
      duration === "12 Month Plan" ? plan.price_12 :
        plan.price_30;
  return Number(raw ?? plan.price).toFixed(2);
}

function bullets(plan: Plan): string[] {
  if (plan.features.length > 0) return plan.features.map((f) => f.title);
  if (!plan.short_description) return [];
  return plan.short_description.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

const Check = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
  </svg>
);

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white">{children}</h2>
      <span className="mt-2 inline-block h-1 w-16 rounded bg-green-500" />
    </div>
  );
}

function DurationToggle({ duration, setDuration }: { duration: Duration; setDuration: (d: Duration) => void }) {
  return (
    <div className="mb-10 flex justify-center">
      <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDuration(d)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${duration === d
                ? "bg-yellow-400 text-gray-900"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

const BuyButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="mt-auto w-full rounded-md bg-[#e6007e] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]"
  >
    Buy this plan
  </button>
);

// ── Slider card (SIM-only) ──────────────────────────────────────────────────
function SliderCard({ plan, duration, onBuyNow }: { plan: Plan; duration: Duration; onBuyNow: (plan: Plan) => void }) {
  return (
    <div
      className={`relative flex w-[320px] shrink-0 snap-center flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${plan.is_popular ? "border-2 border-teal-400 lg:scale-105" : "border border-gray-100 dark:border-gray-700"
        }`}
    >
      <div className="flex min-h-[64px] flex-col items-center justify-center text-center">
        {plan.is_popular && (
          <span className="mb-1 inline-block rounded-full bg-[#e6007e] px-3 py-0.5 text-xs font-semibold text-white">
            Most Popular
          </span>
        )}
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{plan.name}</h3>
      </div>

      <div className="my-5 flex min-h-[150px] flex-col justify-center rounded-xl bg-gray-50 py-6 text-center dark:bg-gray-900">
        {plan.data_allowance && (
          <>
            <div className="text-4xl font-extrabold text-green-600">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-3 text-2xl font-bold text-gray-800 dark:text-white">
          £{priceFor(plan, duration)}
          <span className="ml-0.5 text-sm font-normal text-gray-400">/month</span>
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {bullets(plan).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check /><span>{f}</span>
          </li>
        ))}
      </ul>

      <BuyButton onClick={() => onBuyNow(plan)} />
    </div>
  );
}

// ── Business grid card ──────────────────────────────────────────────────────
function BusinessCard({ plan, duration, onBuyNow }: { plan: Plan; duration: Duration; onBuyNow: (plan: Plan) => void }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800 ${plan.is_popular ? "border-2 border-teal-400" : "border border-gray-100 dark:border-gray-700"
        }`}
    >
      <h3 className="min-h-[32px] text-center text-lg font-bold text-gray-800 dark:text-white">{plan.name}</h3>

      <div className="my-5 flex min-h-[150px] flex-col justify-center rounded-xl bg-gray-50 py-6 text-center dark:bg-gray-900">
        {plan.data_allowance && (
          <>
            <div className="text-4xl font-extrabold text-green-600">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-3 text-2xl font-bold text-gray-800 dark:text-white">
          £{priceFor(plan, duration)}
          <span className="ml-0.5 text-sm font-normal text-gray-400">/month</span>
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {bullets(plan).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check /><span>{f}</span>
          </li>
        ))}
      </ul>

      <BuyButton onClick={() => onBuyNow(plan)} />
    </div>
  );
}

// ── Roaming card ────────────────────────────────────────────────────────────
function RoamingCard({ plan, onBuyNow }: { plan: Plan; onBuyNow: (plan: Plan) => void }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-center text-lg font-semibold text-gray-700 dark:text-gray-200">{plan.name}</h3>

      <div className="mb-5 flex min-h-[150px] flex-col justify-center rounded-xl bg-yellow-50 py-6 text-center dark:bg-yellow-900/20">
        {plan.data_allowance && (
          <>
            <div className="text-4xl font-extrabold text-green-600">{plan.data_allowance}</div>
            <div className="text-xs tracking-wide text-gray-400">DATA</div>
          </>
        )}
        <div className="mt-3 text-2xl font-bold text-gray-800 dark:text-white">£{Number(plan.price).toFixed(2)}</div>
        <div className="text-xs text-gray-400">per day</div>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {bullets(plan).map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check /><span>{f}</span>
          </li>
        ))}
      </ul>

      <BuyButton onClick={() => onBuyNow(plan)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

function Allplans() {
  // const { addToCart } = useCart();
  const { addPlanToCart } = useCart();
  const router = useRouter();
  const [simDuration, setSimDuration] = useState<Duration>("24 Month Plan");
  const [bizDuration, setBizDuration] = useState<Duration>("24 Month Plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (!res.ok) throw new Error("Failed to load plans");
        setPlans(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const simPlans = useMemo(() => plans.filter((p) => p.category?.slug === SIM_SLUG), [plans]);
  const businessPlans = useMemo(() => plans.filter((p) => p.category?.slug === BUSINESS_SLUG), [plans]);
  const roamingPlans = useMemo(() => plans.filter((p) => p.category?.slug === ROAMING_SLUG), [plans]);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 344, behavior: "smooth" });
  };

  // "Buy this plan" now opens the Choose SIM Type modal first (eSIM / pSIM),
  // matching the old WordPress flow. The chosen type is stored on the cart item.
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

  const handleBuyNow = (plan: Plan) => {
    setSimTypePlan(plan);
  };

  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(simTypePlan, simType);
    setSimTypePlan(null);
    router.push("/checkout");
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Choose SIM Type modal (eSIM / pSIM) */}
      {simTypePlan && (
        <ChooseSimTypeModal
          planName={simTypePlan.name}
          onConfirm={confirmSimType}
          onClose={() => setSimTypePlan(null)}
        />
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Choose Your SIM Only Plan &amp; Duration Below
        </h1>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* SIM duration toggle */}
        <DurationToggle duration={simDuration} setDuration={setSimDuration} />

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* ── SIM Only slider ── */}
            {simPlans.length > 0 && (
              <div className="relative mb-20">
                <button
                  type="button"
                  onClick={() => scrollBy(-1)}
                  aria-label="Previous"
                  className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 md:flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  &#8249;
                </button>

                <div
                  ref={scroller}
                  className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-4 pt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {simPlans.map((plan) => (
                    <SliderCard key={plan.id} plan={plan} duration={simDuration} onBuyNow={handleBuyNow} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollBy(1)}
                  aria-label="Next"
                  className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 md:flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  &#8250;
                </button>
              </div>
            )}

            {/* ── Business Deals ── */}
            {businessPlans.length > 0 && (
              <section className="mb-20">
                <SectionHeading>Zoiko SIM Only Business Deals</SectionHeading>
                <DurationToggle duration={bizDuration} setDuration={setBizDuration} />
                <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
                  {businessPlans.map((plan) => (
                    <BusinessCard key={plan.id} plan={plan} duration={bizDuration} onBuyNow={handleBuyNow} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Roaming Deals ── */}
            {roamingPlans.length > 0 && (
              <section className="mb-10">
                <SectionHeading>Zoiko Roaming Deals</SectionHeading>
                <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
                  {roamingPlans.map((plan) => (
                    <RoamingCard key={plan.id} plan={plan} onBuyNow={handleBuyNow} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Testimonial */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
            Choose Zoiko Mobile for Your Best SIM - Only Plans!
          </h3>
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Zoiko Mobile has exceeded my expectations. Not only do they offer great value-for-money deals,
            but their service is top-notch. Setting up and changing tariffs has never been easier — a few
            simple steps and you&rsquo;re good to go. What truly sets Zoiko Mobile apart is the inclusion of
            free international calls in most of their plans.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-yellow-400">★★★★★</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Great</span>
            <span className="text-gray-400">Based on over 3,000 reviews</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Allplans;
export { Allplans };
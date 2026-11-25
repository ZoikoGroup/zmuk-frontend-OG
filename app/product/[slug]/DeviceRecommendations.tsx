"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Signal, Smartphone, Sparkles } from "lucide-react";
import { useCart } from "../../context/CartContext";
import ChooseSimTypeModal from "../../components/ChooseSimTypeModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const absUrl = (u: string | null | undefined) => (u && u.startsWith("/") ? `${API_BASE}${u}` : u ?? "");

// ── Recently viewed (per-browser convenience, stored in localStorage) ──
const RECENT_KEY = "zoiko-recently-viewed-devices";
const RECENT_MAX = 8;

export interface RecentDevice {
  slug: string;
  name: string;
  brand: string;
  image: string;
  priceFrom: number | null;
}

function readRecent(): RecentDevice[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberViewedDevice(d: RecentDevice) {
  try {
    const list = [d, ...readRecent().filter((x) => x.slug !== d.slug)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable – ignore */
  }
}

// ── API shapes ──
interface PlanFeature { id: number; title: string }
interface Plan {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  price: string;
  price_30: string | null;
  data_allowance: string | null;
  tier_label: string | null;
  is_popular: boolean;
  category: { id: number; name: string; slug: string } | null;
  features: PlanFeature[];
}
interface ListProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price_min: string | number | null;
  primary_image: string | null;
}

const isThirtyDay = (p: Plan) => {
  const hay = `${p.category?.name ?? ""} ${p.category?.slug ?? ""}`.toLowerCase();
  return ["no contract", "no-contract", "30-day"].some((k) => hay.includes(k));
};
const planPrice30 = (p: Plan) => Number(p.price_30 ?? p.price);
const planBullets = (p: Plan) =>
  (p.features?.length ? p.features.map((f) => f.title) : (p.short_description ?? "").split(/\r?\n/))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

// ── Shared device card ──
function DeviceCard({ d }: { d: RecentDevice }) {
  return (
    <Link
      href={`/product/${d.slug}`}
      className="group flex w-56 shrink-0 snap-start flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-[0_16px_40px_rgba(230,0,126,0.12)] sm:w-auto"
    >
      <div className="flex h-40 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFF5FA] to-white">
        {d.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.image} alt={d.name} className="h-32 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <Smartphone className="h-12 w-12 text-gray-200" />
        )}
      </div>
      {d.brand && <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-[#e6007e]">{d.brand}</p>}
      <p className="mt-0.5 line-clamp-2 font-bold text-gray-900">{d.name}</p>
      <div className="mt-auto flex items-end justify-between pt-3">
        {d.priceFrom !== null ? (
          <p className="text-sm text-gray-500">
            From <span className="text-lg font-black text-gray-900">£{d.priceFrom.toFixed(2)}</span>
          </p>
        ) : (
          <span />
        )}
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e6007e]/10 text-[#e6007e] transition group-hover:bg-[#e6007e] group-hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function SectionHeader({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e6007e]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-bold text-[#e6007e] hover:underline sm:inline-flex">
          {linkText} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function DeviceRecommendations({ currentSlug, brand, price }: { currentSlug: string; brand: string; price: number | null }) {
  const router = useRouter();
  const { addPlanToCart } = useCart();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<ListProduct[]>([]);
  const [recent, setRecent] = useState<RecentDevice[]>([]);
  const [simTypePlan, setSimTypePlan] = useState<Plan | null>(null);

  // SIM plans + other devices
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (res.ok) {
          const data = await res.json();
          if (alive && Array.isArray(data)) setPlans(data);
        }
      } catch {
        /* section just hides */
      }
    })();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/`);
        if (res.ok) {
          const data = await res.json();
          const list: ListProduct[] = Array.isArray(data) ? data : data?.results ?? [];
          if (alive) setProducts(list);
        }
      } catch {
        /* section just hides */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Recently viewed (read after mount; excludes the current device)
  useEffect(() => {
    const id = window.setTimeout(() => setRecent(readRecent().filter((d) => d.slug !== currentSlug).slice(0, 4)), 0);
    return () => window.clearTimeout(id);
  }, [currentSlug]);

  const simOffers = useMemo(() => {
    const thirty = plans.filter(isThirtyDay);
    const pool = thirty.length ? thirty : plans.filter((p) => p.price_30);
    return [...pool].sort((a, b) => planPrice30(a) - planPrice30(b)).slice(0, 3);
  }, [plans]);

  // Similar devices: same brand first, then closest in price
  const similar = useMemo(() => {
    return products
      .filter((p) => p.slug !== currentSlug)
      .map((p) => ({
        p,
        score:
          (p.brand && brand && p.brand.toLowerCase() === brand.toLowerCase() ? 0 : 1_000_000) +
          (price !== null && p.price_min != null ? Math.abs(Number(p.price_min) - price) : 500_000),
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
      .map(({ p }) => ({
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        image: absUrl(p.primary_image),
        priceFrom: p.price_min != null ? Number(p.price_min) : null,
      }));
  }, [products, currentSlug, brand, price]);

  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(simTypePlan, simType, "30D");
    setSimTypePlan(null);
    router.push("/checkout");
  };

  if (!simOffers.length && !similar.length && !recent.length) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 pb-16 pt-6">
      {/* ── SIM offers ── */}
      {simOffers.length > 0 && (
        <section
          className="relative overflow-hidden rounded-[32px] p-6 text-white sm:p-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 90% 10%, rgba(230,0,126,0.55) 0%, rgba(230,0,126,0) 70%), linear-gradient(135deg, #12041A 0%, #2A0A3C 55%, #4A1268 100%)",
          }}
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFD60A] px-3 py-1 text-[11px] font-black tracking-widest text-[#2A1E00]">
                <Sparkles className="h-3.5 w-3.5 text-[#A3157A]" /> COMPLETE YOUR SETUP
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Pair your phone with a 30-day SIM</h2>
              <p className="mt-1 text-sm text-pink-100/80">No contract, cancel anytime. Pick a plan and get connected from day one.</p>
            </div>
            <Link href="/30-day-plan" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#FF8CC6] hover:text-white">
              See all 30-day plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {simOffers.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-3xl bg-white p-5 text-gray-900 transition hover:-translate-y-1 ${
                  p.is_popular ? "ring-4 ring-[#FFD60A]" : ""
                }`}
              >
                {p.is_popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#FFD60A] px-3 py-1 text-[10px] font-black tracking-widest text-[#2A1E00]">
                    MOST POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#e6007e] to-[#A3157A] text-white">
                    <Signal className="h-5 w-5" />
                  </span>
                  <span className="text-right">
                    <span className="text-3xl font-black">£{planPrice30(p).toFixed(2)}</span>
                    <span className="text-xs font-semibold text-gray-500">/30 days</span>
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black text-[#e6007e]">{p.data_allowance ?? p.name}</p>
                <p className="text-sm font-semibold text-gray-500">{p.tier_label ?? p.name}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {planBullets(p).map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} />
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSimTypePlan(p)}
                  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e6007e] to-[#A3157A] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(230,0,126,0.3)] transition hover:scale-[1.02]"
                >
                  Add SIM plan <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Similar devices ── */}
      {similar.length > 0 && (
        <section>
          <SectionHeader eyebrow="You may also like" title="More devices for you" href="/devices" linkText="View all devices" />
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {similar.map((d) => (
              <DeviceCard key={d.slug} d={d} />
            ))}
          </div>
        </section>
      )}

      {/* ── Recently viewed ── */}
      {recent.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#e6007e]" />
            <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">Recently viewed</h2>
          </div>
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {recent.map((d) => (
              <DeviceCard key={d.slug} d={d} />
            ))}
          </div>
        </section>
      )}

      {simTypePlan && (
        <ChooseSimTypeModal planName={simTypePlan.name} onConfirm={confirmSimType} onClose={() => setSimTypePlan(null)} />
      )}
    </div>
  );
}

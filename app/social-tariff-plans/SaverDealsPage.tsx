"use client";

// Zoiko Saver Deals, built from the saver-deals.html wireframe (v4.0, 19 Nov 2026).
// The previous page is kept in ./Saverdeals.tsx for reference.
//
// Plans and prices come from the backend plans API (see saverDealsData.ts).
// Buying follows the same flow as the other plan pages: "Choose" opens the eSIM / physical SIM
// choice, adds the plan to the cart with its term, then goes to /checkout. There are no
// eligibility, postcode, request or call-back forms on this page.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Headphones,
  Heart,
  Info,
  Layers,
  Phone,
  RadioTower,
  Router,
  ShieldCheck,
  CardSim,
  Tag,
  Voicemail,
  Wifi,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import ChooseSimTypeModal from "../components/ChooseSimTypeModal";
import { TERM, gbp, loadSaverPlans, type Kind, type Term, type UiPlan } from "./saverDealsData";

// ── styling ─────────────────────────────────────────────────────────────────
const GREEN = "text-[#0f4a33]";
const PINK = "text-[#c80f57]";
const BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#e2105c] via-[#e92f51] to-[#f0663f] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(226,16,92,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";
const BTN_OL =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#c80f57] bg-white px-6 py-3 text-sm font-bold text-[#c80f57] transition hover:bg-[#fff4f7] disabled:opacity-50 cursor-pointer";
const BTN_SM = "!px-5 !py-2.5";
const CARD = "rounded-3xl border border-[#f4d9e3] bg-white shadow-[0_14px_34px_-22px_rgba(20,26,69,0.35)]";
const NOTE_INFO = "flex gap-3 rounded-2xl border border-[#dfe5f7] bg-[#f2f5fb] p-4";

type ModalState =
  | null
  | { k: "details"; id: string }
  | { k: "info"; which: "terms" | "fairuse" };

// ── small UI pieces ─────────────────────────────────────────────────────────

function Kick({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#141a45]">{children}</p>
      <span className={`mt-2 block h-[3px] w-14 rounded-full bg-[#ec156c] ${center ? "mx-auto" : ""}`} />
    </div>
  );
}

function SecHead({ kick, title, sub, id }: { kick: string; title: string; sub: string; id: string }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <Kick center>{kick}</Kick>
      <h2 id={id} className={`mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl ${GREEN}`}>{title}</h2>
      <p className="mt-3 text-lg text-[#2d3361]">{sub}</p>
    </div>
  );
}

function CardHead({ name, icon, label }: { name: string; icon: React.ReactNode; label?: string }) {
  return (
    <header className="relative flex items-center gap-3 overflow-hidden rounded-t-3xl bg-gradient-to-r from-[#fff0f5] to-[#fdebef] px-5 py-3.5">
      <span className={PINK} aria-hidden="true">{icon}</span>
      <span className="h-5 w-px bg-[#f1c4d4]" />
      <h3 className={`text-sm font-extrabold ${PINK}`}>{name}</h3>
      {label && <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#c80f57] shadow-sm">{label}</span>}
      <span className="pointer-events-none absolute -right-4 top-1 h-1.5 w-24 rotate-[-30deg] rounded-full bg-gradient-to-r from-[#f6a23a] to-[#e2105c] opacity-80" aria-hidden="true" />
    </header>
  );
}

function Price({ pence, qual, extra }: { pence: number; qual: string; extra?: React.ReactNode }) {
  return (
    <>
      <p className="mt-4 text-center">
        <span className={`text-5xl font-extrabold tabular-nums ${PINK}`}>{gbp(pence)}</span>
        <span className="text-base font-bold text-[#141a45]"> /month</span>
      </p>
      <p className="mt-1 text-center text-xs text-[#565c7e]">{qual} · VAT status from approved tariff</p>
      {extra}
    </>
  );
}

function PlanState({ state, count, onRetry }: { state: "loading" | "ready" | "error"; count: number; onRetry: () => void }) {
  if (state === "loading") return <p role="status" className="mx-auto mt-10 max-w-xl text-center text-sm text-[#565c7e]">Loading plans…</p>;
  if (state === "error")
    return (
      <div role="alert" className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#f6dda4] bg-[#fff8ea] p-5 text-center">
        <p className="text-sm font-bold">We couldn’t load these plans just now.</p>
        <button type="button" onClick={onRetry} className={`${BTN_OL} ${BTN_SM} mt-3`}>Try again</button>
      </div>
    );
  if (count === 0)
    return (
      <p className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#e5e7f0] bg-white p-5 text-center text-sm text-[#565c7e]">
        No plans to show here right now. <Link href="/contact-us" className={`font-bold underline ${PINK}`}>Contact us</Link> and we’ll help.
      </p>
    );
  return null;
}

function Tick({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] text-[#141a45]">
      {icon ?? <Check className={`mt-0.5 h-4 w-4 shrink-0 ${PINK}`} aria-hidden="true" />}
      <span>{children}</span>
    </li>
  );
}

function Kv({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-[#eceef5] text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5">
          <dt className="font-bold text-[#565c7e]">{k}</dt>
          <dd className="text-[#141a45]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="sv-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border-0 bg-white p-0 text-[#141a45] shadow-2xl backdrop:bg-[#141a45]/55"
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-[#eceef5] px-6 py-4">
            <h2 id="sv-modal-title" className={`text-lg font-extrabold ${GREEN}`}>{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-[#565c7e] hover:bg-[#f2f3f8] cursor-pointer">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          <div className="flex justify-end border-t border-[#eceef5] px-6 py-4">
            <button type="button" className={`${BTN_OL} ${BTN_SM}`} onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </dialog>
  );
}

const FAQS: [string, string][] = [
  ["Who can apply for Zoiko Saver Deals?", "Saver Deals are for customers on a low income or who receive certain qualifying benefits. [Approved criteria — Legal and Product]"],
  ["What’s the difference between the 12-month and 30-day SIM plans?", "Both have the same allowances. The 12-month plan has a lower monthly price and a 12-month minimum term. The 30-day plan costs a little more but rolls every 30 days. Notice periods are in your contract summary."],
  ["What happens if my circumstances change after joining?", "We’ll explain what to do and what happens to your plan in the Saver terms before you apply. [Change-of-circumstances policy — Legal]"],
  ["Can I keep my mobile number?", "Yes. Text PAC to 65075 from your current phone to get your code, and give it to us when you apply. Number transfers normally complete within one working day once a valid order has been processed."],
  ["Is Saver broadband available at my address?", "Broadband availability and speed depend on where you live. Contact us and we’ll confirm what’s available at your address."],
  ["Are there installation charges or other one-off costs?", "Saver broadband and Saver Bundles have a one-off installation charge. It is shown next to the price on the plan card and again before you agree. [Charge applicability — Broadband Operations]"],
  ["Can I apply if I can’t complete an online check?", "Yes. Contact our team and they will take you through it by phone. You don’t need to explain why."],
  ["Can I cancel or change my Saver plan?", "How and when you can cancel or change is set out in your contract summary before you agree. [Contract policy — Legal]"],
];

// ── page ────────────────────────────────────────────────────────────────────

export default function SaverDealsPage() {
  const router = useRouter();
  const { addPlanToCart } = useCart();

  const [term, setTerm] = useState<Term>("12m");
  const [plans, setPlans] = useState<UiPlan[]>([]);
  const [plansState, setPlansState] = useState<"loading" | "ready" | "error">("loading");
  const [modal, setModal] = useState<ModalState>(null);
  const [active, setActive] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openBun, setOpenBun] = useState<number | null>(null);

  // Buy flow (same as the other plan pages): choose SIM type, add to cart with the term, go to checkout.
  const [simTypePlan, setSimTypePlan] = useState<UiPlan | null>(null);
  const [buyTerm, setBuyTerm] = useState<"12M" | "30D">("12M");

  const handleBuyNow = (plan: UiPlan, t: "12M" | "30D") => {
    setBuyTerm(t);
    setSimTypePlan(plan);
  };
  const confirmSimType = (simType: "esim" | "psim") => {
    if (!simTypePlan) return;
    addPlanToCart(simTypePlan.raw, simType, buyTerm);
    setSimTypePlan(null);
    router.push("/checkout");
  };

  const loadPlans = () => {
    setPlansState("loading");
    loadSaverPlans()
      .then((l) => { setPlans(l); setPlansState("ready"); })
      .catch(() => setPlansState("error"));
  };
  useEffect(loadPlans, []);

  const byKind = (k: Kind) => plans.filter((x) => x.kind === k);
  const simPlans = byKind("sim");
  const bbPlans = byKind("bb");
  const phPlans = byKind("ph");
  const bunPlans = byKind("bun");

  // active section in the sticky links
  useEffect(() => {
    const ids = ["sim", "broadband", "phone", "bundles"];
    const on = () => {
      const y = window.scrollY + 200;
      let cur = "";
      ids.forEach((id) => { const el = document.getElementById(id); if (el && el.offsetTop <= y) cur = id; });
      setActive(cur);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  const closeModal = () => setModal(null);

  const detailsPlan = modal?.k === "details" ? plans.find((p) => p.id === modal.id) : undefined;
  const detailRows = (x: UiPlan): [string, React.ReactNode][] => {
    const rows: [string, React.ReactNode][] = [];
    if (x.headline) rows.push([x.kind === "ph" ? "Calls" : x.kind === "bb" ? "Speed" : "Data", `${x.headline}${x.headlineUnit ? ` ${x.headlineUnit}` : ""}${x.kind === "bb" ? " — not a guaranteed minimum" : " a month"}`]);
    if (x.subs) { rows.push(["UK minutes", x.subs.mins]); rows.push(["UK texts", x.subs.texts]); }
    if (x.kind === "sim") {
      if (x.price["12m"] !== null) rows.push(["12-month plan", `${gbp(x.price["12m"])}/month`]);
      if (x.price["30d"] !== null) rows.push(["30-day plan", `${gbp(x.price["30d"])}/month`]);
    } else if (x.price["12m"] !== null) {
      rows.push(["Monthly price", `${gbp(x.price["12m"])}/month`]);
      rows.push(["Contract", "12 months"]);
    }
    if (x.setup) rows.push(["Installation", `${gbp(x.setup)} one-off`]);
    if (x.includes.length) rows.push(["Includes", x.includes.join(" · ")]);
    if (x.bullets.length) rows.push(["Features", x.bullets.join(" · ")]);
    if (x.kind === "sim") rows.push(["Not included", "International calls, roaming allowances, eSIM, 5G and Wi-Fi Calling — unless shown on the plan"]);
    return rows;
  };

  return (
    <div className="bg-white text-[#141a45]">
      {simTypePlan && (
        <ChooseSimTypeModal planName={simTypePlan.name} onConfirm={confirmSimType} onClose={() => setSimTypePlan(null)} />
      )}

      <Modal
        open={!!modal}
        title={modal?.k === "details" ? (detailsPlan?.name ?? "Plan details") : modal?.k === "info" ? (modal.which === "terms" ? "Saver Deals terms" : "Fair use") : ""}
        onClose={closeModal}
      >
        {modal?.k === "details" && (detailsPlan ? <Kv rows={detailRows(detailsPlan)} /> : <p className="text-sm">We couldn’t load this plan. Please try again.</p>)}
        {modal?.k === "info" && modal.which === "terms" && (
          <>
            <p className="text-sm">The Saver terms explain who qualifies, how long each plan lasts, what happens if your circumstances change, how to cancel, and any one-off charges. You’ll see your contract information and contract summary before you agree to anything.</p>
            <p className="mt-3 rounded-2xl border border-dashed border-[#d3d6e4] bg-[#f7f7fb] p-4 text-sm text-[#565c7e]">[Approved Saver terms — Legal and Product]</p>
          </>
        )}
        {modal?.k === "info" && modal.which === "fairuse" && (
          <p className="text-sm">Unlimited UK minutes and texts are for normal personal use in the UK. [Fair-use policy — Legal]</p>
        )}
      </Modal>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff4f7] via-white to-white px-4 pb-28 pt-6 sm:px-6" aria-labelledby="sv-h1">
        <div className="mx-auto max-w-6xl">
          
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Kick>Affordable connectivity</Kick>
              <h1 id="sv-h1" className="mt-8 text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight">
                <span className={GREEN}>Zoiko</span><br /><span className="text-[#c80f57]">Saver Deals</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#2d3361]">
                Simple, lower-cost ways to stay connected. Explore eligible mobile, broadband and digital phone plans, with clear prices and straightforward support.
              </p>
              <div className="mt-7 flex flex-col items-start gap-3">
                <button type="button" onClick={() => goTo("sim")} className={BTN}>Explore Saver plans <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
              </div>
              <p className="mt-4 text-xs text-[#565c7e]">Eligibility applies. Availability, contract terms and one-off charges vary by plan.</p>
              <ul className="mt-4 space-y-2 text-sm text-[#2d3361]">
                <li className="flex items-center gap-2.5"><Tag className={`h-4 w-4 ${PINK}`} aria-hidden="true" />Clear monthly prices and one-off costs on every plan</li>
                <li className="flex items-center gap-2.5"><FileText className={`h-4 w-4 ${PINK}`} aria-hidden="true" />No documents needed to browse or compare</li>
                <li className="flex items-center gap-2.5"><Headphones className={`h-4 w-4 ${PINK}`} aria-hidden="true" />Help applying by phone if you prefer</li>
              </ul>
            </div>
            <figure className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/zoiko-saver-deals/A%20family%20sharing%20a%20relaxed%20moment%20together%20at%20home.png"
                alt="A family standing together holding hands on a beach at sunset"
                width={900}
                height={675}
                className="h-72 w-full rounded-3xl object-cover shadow-[0_24px_50px_-20px_rgba(20,26,69,0.45)] sm:h-[26rem]"
              />
              <figcaption className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-[#0f4a33] shadow-md">
                <Heart className={`h-4 w-4 ${PINK}`} aria-hidden="true" /> Stay connected for less
              </figcaption>
            </figure>
          </div>
        </div>
        <svg className="pointer-events-none absolute bottom-0 left-0 h-24 w-full" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sw1" x1="0" x2="1"><stop offset="0" stopColor="#F7B9D1" stopOpacity=".6" /><stop offset=".55" stopColor="#E2105C" /><stop offset="1" stopColor="#EC156C" /></linearGradient>
            <linearGradient id="sw2" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".6" stopColor="#F6A23A" /><stop offset="1" stopColor="#FFCE55" /></linearGradient>
          </defs>
          <path d="M0 112 C 300 128, 620 120, 900 96 C 1120 78, 1300 40, 1440 18 L1440 70 C 1300 92, 1100 118, 860 128 C 600 140, 300 140, 0 132 Z" fill="url(#sw1)" />
          <path d="M520 132 C 820 124, 1120 104, 1440 70 L1440 92 C 1160 120, 860 136, 560 140 Z" fill="url(#sw2)" />
          <path d="M0 132 C 300 140, 600 140, 860 128 C 1100 118, 1300 92, 1440 70 L1440 140 L0 140 Z" fill="#fff" />
        </svg>
      </section>

      {/* ── Sticky category links ── */}
      <nav aria-label="Saver Deals sections" className="sticky top-20 z-30 border-y border-[#f1e3e9] bg-white/95 backdrop-blur">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {([
            ["sim", "SIM-only", CardSim], ["broadband", "Broadband", Wifi], ["phone", "Digital phone", Phone], ["bundles", "Bundles", Layers],
          ] as const).map(([id, label, Icon]) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => goTo(id)}
                aria-current={active === id ? "location" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold cursor-pointer ${active === id ? "bg-[#fff0f5] text-[#c80f57]" : "text-[#2d3361] hover:text-[#c80f57]"}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />{label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── SIM-only ── */}
      <section id="sim" tabIndex={-1} aria-labelledby="sim-h" className="bg-[#fffafb] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SecHead id="sim-h" kick="SIM-only" title="Saver SIM-only plans" sub="Three simple mobile plans. Choose a 12-month or 30-day plan — the same three plans update below." />
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <span id="term-lbl" className="inline-flex items-center gap-3 text-base font-extrabold"><CalendarDays className={`h-6 w-6 ${PINK}`} aria-hidden="true" />Choose your plan length</span>
            <div role="radiogroup" aria-labelledby="term-lbl" className="inline-flex rounded-full border border-[#e6e8f0] bg-white p-1 shadow-sm">
              {(["12m", "30d"] as Term[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={term === k} onClick={() => setTerm(k)} className={`rounded-full px-6 py-2.5 text-sm font-extrabold transition cursor-pointer ${term === k ? "bg-gradient-to-r from-[#e2105c] to-[#f0663f] text-white shadow" : "text-[#141a45] hover:text-[#c80f57]"}`}>
                  {TERM[k].l}
                </button>
              ))}
            </div>
          </div>
          <PlanState state={plansState} count={simPlans.length} onRetry={loadPlans} />
          <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
            {simPlans.map((p, idx) => {
              const price = p.price[term];
              const label = p.raw.is_popular
                ? "Most popular"
                : idx === simPlans.length - 1 && simPlans.length > 1 && p.subs?.mins.toLowerCase() === "unlimited"
                  ? "Most included data"
                  : undefined;
              return (
                <article key={p.id} aria-labelledby={`h-${p.id}`} className={`${CARD} flex flex-col`}>
                  <CardHead name={p.name} icon={<CardSim className="h-5 w-5" />} label={label} />
                  <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                    <p className={`text-center text-5xl font-extrabold ${GREEN}`}>{p.headline} <span className="text-sm font-bold text-[#565c7e]">{p.headlineUnit}</span></p>
                    {p.subs && (
                      <dl className="mt-4 grid grid-cols-2 gap-2.5">
                        {[["UK minutes", p.subs.mins], ["UK texts", p.subs.texts]].map(([k, v]) => (
                          <div key={k} className="rounded-xl border border-[#e8eaf3] bg-[#f8f9fc] py-2.5 text-center">
                            <dt className="text-[10px] font-extrabold uppercase tracking-widest text-[#565c7e]">{k}</dt>
                            <dd className="text-base font-extrabold">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {price !== null ? <Price pence={price} qual={TERM[term].l} /> : <p className="mt-4 text-center text-sm text-[#565c7e]">Price shown at checkout</p>}
                    <ul className="mt-5 space-y-3 border-b border-[#eceef5] pb-4">{p.bullets.map((x) => <Tick key={x}>{x}</Tick>)}</ul>
                    {p.subs?.mins.toLowerCase() === "unlimited" && (
                      <p className="mt-3 text-center text-[11px] text-[#565c7e]">Unlimited UK minutes and texts are for personal use — <button type="button" onClick={() => setModal({ k: "info", which: "fairuse" })} className={`font-bold underline ${PINK} cursor-pointer`}>fair use</button> applies.</p>
                    )}
                    <div className="mt-auto space-y-2.5 pt-6">
                      <button type="button" onClick={() => handleBuyNow(p, term === "12m" ? "12M" : "30D")} className={`${BTN} w-full`}>Choose {p.name} <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
                      <button type="button" onClick={() => setModal({ k: "details", id: p.id })} className={`${BTN_OL} w-full`}>View plan details <ChevronRight className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> for {p.name}</span></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mx-auto mt-8 max-w-5xl text-center text-xs leading-relaxed text-[#2d3361]">
            † Family-plan discount amount and conditions, and what priority support includes, are confirmed by our team before you apply. [Operations]<br />
            There’s no 24-month Saver plan. Features of our standard plans — such as international calls, roaming allowances, eSIM, 5G and Wi-Fi Calling — aren’t included unless shown on the card.
          </p>
        </div>
      </section>

      {/* ── Broadband ── */}
      <section id="broadband" tabIndex={-1} aria-labelledby="bb-h" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SecHead id="bb-h" kick="Broadband" title="Saver broadband" sub="Broadband availability and speed depend on where you live." />
          <PlanState state={plansState} count={bbPlans.length} onRetry={loadPlans} />
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {bbPlans.map((p) => (
              <article key={p.id} aria-labelledby={`h-${p.id}`} className={`${CARD} flex flex-col`}>
                <CardHead name={p.name} icon={<Wifi className="h-5 w-5" />} />
                <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                  <p className={`text-center text-5xl font-extrabold ${GREEN}`}>{p.headline} <span className="text-sm font-bold text-[#565c7e]">{p.headlineUnit}</span></p>
                  {p.price["12m"] !== null && <Price pence={p.price["12m"]} qual="12-month plan" extra={p.setup ? <p className="mt-2 text-center text-sm font-extrabold">+ {gbp(p.setup)} one-off installation</p> : undefined} />}
                  <ul className="mt-5 space-y-3 border-b border-[#eceef5] pb-4">
                    {p.bullets.map((x) => (
                      <Tick key={x} icon={/router/i.test(x) ? <Router className={`mt-0.5 h-4 w-4 shrink-0 ${PINK}`} aria-hidden="true" /> : /support/i.test(x) ? <Headphones className={`mt-0.5 h-4 w-4 shrink-0 ${PINK}`} aria-hidden="true" /> : undefined}>{x}</Tick>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-2.5 pt-6">
                    <button type="button" onClick={() => handleBuyNow(p, "12M")} className={`${BTN} w-full`}>Choose {p.name} <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => setModal({ k: "details", id: p.id })} className={`${BTN_OL} w-full`}>View plan details <ChevronRight className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> for {p.name}</span></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-5xl text-center text-xs text-[#2d3361]">“Up to” speeds are the maximum available on the plan, not a guaranteed minimum. Your estimated speed appears once we’ve checked your address. Installation dates and charges are confirmed in your quote.</p>
        </div>
      </section>

      {/* ── Digital phone ── */}
      <section id="phone" tabIndex={-1} aria-labelledby="ph-h" className="bg-[#fffafb] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SecHead id="ph-h" kick="Digital phone" title="Saver digital phone lines" sub="A home phone line with calling minutes and essential features." />
          <PlanState state={plansState} count={phPlans.length} onRetry={loadPlans} />
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {phPlans.map((p) => (
              <article key={p.id} aria-labelledby={`h-${p.id}`} className={`${CARD} flex flex-col`}>
                <CardHead name={p.name} icon={<Phone className="h-5 w-5" />} />
                <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                  <p className={`text-center text-5xl font-extrabold ${GREEN}`}>{p.headline} <span className="text-sm font-bold text-[#565c7e]">{p.headlineUnit}</span></p>
                  <p className="text-center text-sm text-[#565c7e]">Local and national calls each month</p>
                  {p.price["12m"] !== null && <Price pence={p.price["12m"]} qual="12-month plan" />}
                  <ul className="mt-5 space-y-3 border-b border-[#eceef5] pb-4">
                    {p.bullets.map((f) => <Tick key={f} icon={/voicemail/i.test(f) ? <Voicemail className={`mt-0.5 h-4 w-4 shrink-0 ${PINK}`} aria-hidden="true" /> : undefined}>{f}</Tick>)}
                  </ul>
                  <div className="mt-auto space-y-2.5 pt-6">
                    <button type="button" onClick={() => handleBuyNow(p, "12M")} className={`${BTN} w-full`}>Choose {p.name} <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => setModal({ k: "details", id: p.id })} className={`${BTN_OL} w-full`}>View plan details <ChevronRight className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> for {p.name}</span></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className={`${NOTE_INFO} mx-auto mt-6 max-w-4xl`}>
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#3156b5]" aria-hidden="true" />
            <p className="text-sm text-[#2d3361]"><b className="block">Before you choose a digital phone line</b>We’ll explain whether you can keep your number, what equipment you need, and how calls work in a power cut — including emergency calls — before you apply. [Service details — Telecoms Operations]</p>
          </div>
        </div>
      </section>

      {/* ── Bundles ── */}
      <section id="bundles" tabIndex={-1} aria-labelledby="bn-h" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SecHead id="bn-h" kick="Bundles" title="Saver Bundles" sub="Mobile, broadband and digital phone together — every included service is listed, and the one-off setup cost is shown next to the price." />
          <PlanState state={plansState} count={bunPlans.length} onRetry={loadPlans} />
          <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
            {bunPlans.map((b, i) => (
              <article key={b.id} aria-labelledby={`h-${b.id}`} className={`${CARD} flex flex-col`}>
                <CardHead name={b.name} icon={<Layers className="h-5 w-5" />} />
                <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                  {b.price["12m"] !== null && (
                    <p className="text-center"><span className={`text-5xl font-extrabold tabular-nums ${PINK}`}>{gbp(b.price["12m"])}</span><span className="text-base font-bold"> /month</span></p>
                  )}
                  {b.setup ? <p className="mt-3 text-center text-sm font-extrabold">+ {gbp(b.setup)} one-off installation</p> : null}
                  <p className="mt-1 text-center text-xs text-[#565c7e]">Package total · 12-month plan · term confirmed in your package summary</p>
                  <p className="mt-5 text-[11px] font-extrabold uppercase tracking-widest text-[#565c7e]">Includes</p>
                  <ul className="mt-2 space-y-2.5">
                    {b.includes.map((name) => (
                      <li key={name} className="flex items-center gap-3 rounded-2xl border border-[#e8eaf3] bg-[#f8f9fc] p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffeaf1]">
                          {/broadband/i.test(name) ? <Wifi className={`h-5 w-5 ${PINK}`} aria-hidden="true" /> : /phone/i.test(name) ? <Phone className={`h-5 w-5 ${PINK}`} aria-hidden="true" /> : <CardSim className={`h-5 w-5 ${PINK}`} aria-hidden="true" />}
                        </span>
                        <b className="text-sm">{name}</b>
                      </li>
                    ))}
                  </ul>
                  {b.bullets.length > 0 && (
                    <>
                      <button type="button" onClick={() => setOpenBun(openBun === i ? null : i)} aria-expanded={openBun === i} className="mt-3 flex items-center justify-between rounded-xl border border-[#f1c4d4] bg-white px-4 py-3 text-left text-xs font-extrabold text-[#c80f57] cursor-pointer">
                        Compare what’s included<ChevronDown className={`h-4 w-4 transition-transform ${openBun === i ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                      {openBun === i && (
                        <div className="mt-2 rounded-xl bg-[#f8f9fc] p-3 text-xs text-[#2d3361]">
                          <p className="mb-1 font-extrabold">Additional features</p>
                          <ul className="space-y-1">{b.bullets.map((x) => <li key={x}>{x}</li>)}</ul>
                          <p className="mt-2 text-[#565c7e]">For information only — not a savings claim.</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-auto space-y-2.5 pt-6">
                    <button type="button" onClick={() => handleBuyNow(b, "12M")} className={`${BTN} w-full`}>Choose {b.name} <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button>
                    <button type="button" onClick={() => setModal({ k: "info", which: "terms" })} className={`${BTN_OL} w-full`}>Terms and package summary <ChevronRight className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> for {b.name}</span></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-5xl text-center text-xs text-[#2d3361]">Bundle terms, whether each service has its own contract, and how setup charges and cancellation work are confirmed in your package summary before you apply. [Bundle terms — Product and Finance]. We don’t show a “saving” figure unless it compares like-for-like plans we currently offer.</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section aria-labelledby="how-h" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className={`text-xs font-extrabold uppercase tracking-[0.3em] ${PINK}`}>How it works</p>
            <span className="mx-auto mt-2 block h-[3px] w-14 rounded-full bg-[#ec156c]" />
            <h2 id="how-h" className={`mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl ${GREEN}`}>Three simple steps</h2>
            <p className="mt-3 text-lg text-[#2d3361]">You can stop at any point — nothing is binding until you’ve read your contract summary and agreed.</p>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {([
              [Layers, "Choose a plan", "SIM-only, broadband, digital phone or a bundle."],
              [RadioTower, "Check availability", "For broadband and digital phone, we check your address."],
              [FileText, "Review and apply", "See every cost and your contract summary before you agree."],
            ] as const).map(([Icon, t, d], i) => (
              <li key={t} className={`${CARD} relative p-5`}>
                <span aria-hidden="true" className="absolute right-4 top-3 text-2xl font-extrabold text-[#fbd9e4]">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffeaf1]"><Icon className={`h-6 w-6 ${PINK}`} aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-extrabold">{t}</h3>
                <p className="mt-1.5 text-sm text-[#565c7e]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Everything else + FAQ + help ── */}
      <section aria-labelledby="conf-h" className="bg-gradient-to-b from-[#fff8fb] to-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className={`text-xs font-extrabold uppercase tracking-[0.3em] ${PINK}`}>Before you choose</p>
            <span className="mx-auto mt-2 block h-[3px] w-14 rounded-full bg-[#ec156c]" />
            <h2 id="conf-h" className={`mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl ${GREEN}`}>Everything else you need to know</h2>
          </div>

          <div className="mt-8 grid gap-2 rounded-3xl border border-[#f4d9e3] bg-[#fff1f5] px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/coverage-checker" className="flex items-center justify-center gap-2.5 py-2 text-sm font-extrabold hover:text-[#c80f57]"><RadioTower className={`h-5 w-5 ${PINK}`} aria-hidden="true" />Check mobile coverage</Link>
            <Link href="/switch-and-save" className="flex items-center justify-center gap-2.5 py-2 text-sm font-extrabold hover:text-[#c80f57]"><ArrowLeftRight className={`h-5 w-5 ${PINK}`} aria-hidden="true" />Keep your mobile number</Link>
            <Link href="/contact-us" className="flex items-center justify-center gap-2.5 py-2 text-sm font-extrabold hover:text-[#c80f57]"><Headphones className={`h-5 w-5 ${PINK}`} aria-hidden="true" />Help applying</Link>
            <button type="button" onClick={() => setModal({ k: "info", which: "terms" })} className="flex items-center justify-center gap-2.5 py-2 text-sm font-extrabold hover:text-[#c80f57] cursor-pointer"><FileText className={`h-5 w-5 ${PINK}`} aria-hidden="true" />Saver terms</button>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <h2 id="faq-h" className={`text-4xl font-extrabold tracking-tight ${GREEN}`}>Saver Deals questions</h2>
              <p className="mt-3 text-lg text-[#2d3361]">Information updated 19 November 2026.</p>
            </div>
            <div className={`${CARD} px-6 py-2`}>
              {FAQS.map(([q, a], i) => (
                <div key={q} className={i > 0 ? "border-t border-[#eceef5]" : ""}>
                  <h3>
                    <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-extrabold cursor-pointer">
                      {q}<ChevronDown className={`h-4 w-4 shrink-0 text-[#c80f57] transition-transform ${openFaq === i ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                  </h3>
                  {openFaq === i && <p className="pb-4 text-sm leading-relaxed text-[#565c7e]">{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

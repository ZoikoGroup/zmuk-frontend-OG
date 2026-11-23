"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Smartphone,
  Calendar,
  FileText,
  Radio,
  ShieldCheck,
  Tag,
  Headphones,
  Info,
  RefreshCw,
} from "lucide-react";


export type FlowTerm = "30D" | "12M" | "24M";

export interface FlowPlan {
  id: string;
  name: string;
  dataAllowance: string;
  calls: string;
  texts: string;
  roaming: string;
  price: number;
  price30: number | null;
  price12: number | null;
  price24: number | null;
}

export interface FlowLine {
  id: string;
  number: string;
  planId: string;
  planName: string;
  renewDate: string;
  simType: string;
  status: string; // "Active" | "Pending" | "Suspended"
  term: string; // "30D" | "12M" | "24M" | ""
  price: number | null; // what the line pays now, if the backend sent it
}

export interface FlowSubmitResult {
  ok: boolean;
  reference?: string;
  error?: string;
}

interface Props {
  userName: string;
  lines: FlowLine[];
  plans: FlowPlan[];
  initialLineId?: string;
  initialPlanId?: string;
  initialStep?: 1 | 2 | 3;
  onClose: () => void;
  onSubmit: (line: FlowLine, plan: FlowPlan, term: FlowTerm, price: number) => Promise<FlowSubmitResult>;
  onContactSupport: () => void;
}

const TERM_LABEL: Record<FlowTerm, string> = {
  "30D": "30-day rolling",
  "12M": "12 months",
  "24M": "24 months",
};

function termText(t: string): string {
  if (t === "30D") return "30-day plan";
  if (t === "12M") return "12-month contract";
  if (t === "24M") return "24-month contract";
  return "Contract not confirmed";
}

function priceFor(p: FlowPlan, t: FlowTerm): number | null {
  if (t === "30D") return p.price30;
  if (t === "12M") return p.price12;
  return p.price24;
}

function money(n: number | null | undefined): string {
  return n == null ? "—" : `£${n.toFixed(2)}`;
}

const STEPS = ["Choose line", "Compare plans", "Confirm impact", "Change status"];

function Hero({ title, sub, chips }: { title: string; sub: string; chips: { icon: React.ReactNode; text: string }[] }) {
  return (
    <section className="relative overflow-hidden bg-[#0A261E] text-white">
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <img
          src="/images/customer-journey/image (11).png"
          alt="London skyline at night"
          className="h-full w-full object-cover object-right"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#08291F] to-[#0B3A2B] max-lg:opacity-85 lg:[clip-path:polygon(0_0,62%_0,44%_100%,0_100%)]" />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-10 py-10 sm:py-12">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold leading-[1.1] tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-[#E1E8E5]">{sub}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold">
                {c.icon}
                {c.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="bg-white border-b border-slate-200">
      <ol className="max-w-5xl mx-auto px-5 sm:px-10 py-4 grid grid-cols-4 gap-2 text-xs">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li key={s} className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  done ? "bg-emerald-600 text-white" : current ? "bg-[#D6125A] text-white" : "border border-slate-300 text-slate-500"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </span>
              <span className={`truncate font-semibold ${current ? "text-[#D6125A]" : "text-slate-600"}`}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function HelpCard({ onContactSupport }: { onContactSupport: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-[#FDE8F1] text-[#D6125A] flex items-center justify-center shrink-0">
        <Headphones className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-[#0B3D2E]">Need help switching?</div>
        <div className="text-xs text-slate-500">Our UK team can help with your plan change.</div>
        <button
          type="button"
          onClick={onContactSupport}
          className="mt-2 px-3 py-1.5 rounded-full border border-[#D6125A] text-[#D6125A] text-xs font-semibold hover:bg-[#FDE8F1] cursor-pointer"
        >
          Contact support
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ title, rows, children }: { title: string; rows: [string, string][]; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-[#0B3D2E] to-[#B4144B] text-white text-sm font-bold">{title}</div>
      <dl className="p-4 space-y-2.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-semibold text-[#0B3D2E] text-right">{v}</dd>
          </div>
        ))}
        {children}
      </dl>
    </div>
  );
}

export default function ChangePlanFlow({
  userName,
  lines,
  plans,
  initialLineId,
  initialPlanId,
  initialStep = 1,
  onClose,
  onSubmit,
  onContactSupport,
}: Props) {
  const firstName = (userName || "").trim().split(/\s+/)[0] || "";
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const [lineId, setLineId] = useState<string>(initialLineId || "");
  const [planId, setPlanId] = useState<string>(initialPlanId || "");
  const [term, setTerm] = useState<FlowTerm | "">("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FlowSubmitResult | null>(null);

  const line = lines.find((l) => l.id === lineId) || null;
  const currentPlan = line ? plans.find((p) => p.id === line.planId || p.name.toLowerCase() === line.planName.toLowerCase()) : null;
  const currentPrice = line?.price ?? currentPlan?.price30 ?? currentPlan?.price ?? null;
  const targetPlan = plans.find((p) => p.id === planId) || null;
  const changeable = (l: FlowLine) => l.status === "Active";

  // contract lengths that at least one plan can be bought on
  const availableTerms = useMemo<FlowTerm[]>(() => {
    const t: FlowTerm[] = [];
    if (plans.some((p) => p.price30 != null)) t.push("30D");
    if (plans.some((p) => p.price12 != null)) t.push("12M");
    if (plans.some((p) => p.price24 != null)) t.push("24M");
    return t;
  }, [plans]);

  const activeTerm: FlowTerm | "" =
    term && availableTerms.includes(term)
      ? term
      : ((line?.term as FlowTerm) && availableTerms.includes(line?.term as FlowTerm) ? (line?.term as FlowTerm) : availableTerms[0] || "");

  const targetPrice = targetPlan && activeTerm ? priceFor(targetPlan, activeTerm) : null;
  const diff = targetPrice != null && currentPrice != null ? targetPrice - currentPrice : null;

  const shownPlans = plans.filter((p) => activeTerm && priceFor(p, activeTerm) != null && p.id !== currentPlan?.id);

  const goStep2 = () => {
    setError("");
    setStep(2);
  };

  const submit = async () => {
    if (!line || !targetPlan || !activeTerm || targetPrice == null || !agreed || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const r = await onSubmit(line, targetPlan, activeTerm, targetPrice);
      if (r.ok) {
        setResult(r);
        setStep(4);
      } else {
        setError(r.error || "We couldn't send your request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const footerStrip = (
    <div className="max-w-5xl mx-auto px-5 sm:px-10 pb-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {[
          [<ShieldCheck key="a" className="w-4 h-4" />, "Clear impact", "Before and after, side by side"],
          [<Calendar key="b" className="w-4 h-4" />, "Dated change", "Start date confirmed by us"],
          [<Tag key="c" className="w-4 h-4" />, "No hidden fees", "Any charge shown first"],
          [<Headphones key="d" className="w-4 h-4" />, "UK-based support", "Here when you need us"],
        ].map(([icon, t, s], i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#FDE8F1] text-[#D6125A] flex items-center justify-center shrink-0">{icon as React.ReactNode}</span>
            <div>
              <div className="font-bold text-[#0B3D2E]">{t as string}</div>
              <div className="text-slate-500">{s as string}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#F6F4F8] text-[#0B3D2E]">
      {/* ─────────── STEP 1: choose line ─────────── */}
      {step === 1 && (
        <>
          <Hero
            title="Change or upgrade your plan"
            sub="Choose a line to see which plans it can move to. You'll see exactly what changes before you confirm."
            chips={[
              { icon: <Layers className="w-3.5 h-3.5" />, text: "Compare side by side" },
              { icon: <FileText className="w-3.5 h-3.5" />, text: "See the impact first" },
            ]}
          />
          <Stepper step={step} />
          <div className="max-w-5xl mx-auto px-5 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-[#0B3D2E] to-[#B4144B] text-white p-4">
                <div className="text-lg font-bold">{firstName ? `Hello, ${firstName}` : "Hello"}</div>
                <div className="text-xs text-white/85">
                  {lines.length} line{lines.length === 1 ? "" : "s"} on your account · {lines.filter(changeable).length} can change plan now
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Changing plan can affect your contract. We&apos;ll show exactly what changes before you confirm.</span>
              </div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#D6125A]" />
                Which line would you like to change?
              </h2>

              {lines.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                  We couldn&apos;t find a Zoiko line on your account yet, so there is nothing to change.
                </div>
              )}

              <div className="space-y-3">
                {lines.map((l) => {
                  const selected = l.id === lineId;
                  const ok = changeable(l);
                  const planRow = plans.find((p) => p.id === l.planId || p.name.toLowerCase() === l.planName.toLowerCase());
                  const price = l.price ?? planRow?.price30 ?? planRow?.price ?? null;
                  return (
                    <div
                      key={l.id}
                      className={`rounded-2xl border p-4 ${selected ? "border-[#D6125A] ring-2 ring-[#D6125A]/20" : "border-slate-200"} ${ok ? "bg-white" : "bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold">{l.number}</div>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ok ? "Can change plan" : l.status === "Pending" ? "Setting up" : "Line suspended"}
                        </span>
                      </div>
                      <div className="mt-3 rounded-xl bg-[#FDF2F6] p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500">Current plan</div>
                          <div className="text-sm font-bold">{l.planName || "Plan not confirmed"}</div>
                          <div className="text-[11px] text-slate-500">{planRow ? `${planRow.dataAllowance} data` : l.simType}</div>
                        </div>
                        <div className="text-right text-[#D6125A] font-extrabold text-lg">{price != null ? money(price) : ""}</div>
                      </div>
                      <div className="mt-3 text-[11px] text-slate-500">
                        Contract: <span className="font-semibold text-[#0B3D2E]">{termText(l.term)}</span>
                      </div>
                      {ok ? (
                        <button
                          type="button"
                          onClick={() => setLineId(l.id)}
                          className={`mt-3 px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                            selected ? "bg-[#D6125A] text-white" : "border border-[#D6125A] text-[#D6125A] hover:bg-[#FDE8F1]"
                          }`}
                        >
                          {selected ? "✓ Selected" : "Change plan"}
                        </button>
                      ) : (
                        <div className="mt-3 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                          {l.status === "Pending"
                            ? "This line is still being set up. You can change its plan once it is active."
                            : "This line is suspended, so its plan can't be changed. Talk to us to reactivate it."}
                          <button
                            type="button"
                            onClick={onContactSupport}
                            className="ml-2 font-semibold text-[#D6125A] underline cursor-pointer"
                          >
                            Talk to us
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#D6125A] text-[#D6125A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  disabled={!line}
                  onClick={goStep2}
                  className="px-5 py-2.5 rounded-full bg-[#D6125A] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  See eligible plans <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SummaryCard
                title="Selected line"
                rows={
                  line
                    ? [
                        ["Line", line.number],
                        ["Current plan", line.planName || "—"],
                        ["UK data", currentPlan?.dataAllowance || "—"],
                        ["UK calls", currentPlan?.calls || "—"],
                        ["Contract", termText(line.term)],
                      ]
                    : [["Line", "Choose a line"]]
                }
              />
              <HelpCard onContactSupport={onContactSupport} />
            </div>
          </div>
        </>
      )}

      {/* ─────────── STEP 2: compare plans ─────────── */}
      {step === 2 && line && (
        <>
          <Hero
            title="Compare your plan"
            sub={`Line ${line.number} is on ${line.planName || "its current plan"}. Here are the plans it can move to.`}
            chips={[
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Eligible plans only" },
              { icon: <Layers className="w-3.5 h-3.5" />, text: "Side by side" },
            ]}
          />
          <Stepper step={step} />
          <div className="max-w-5xl mx-auto px-5 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D6125A]" /> Choose a new plan
              </h2>

              {availableTerms.length > 1 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold">Contract length</span>
                  <div className="inline-flex rounded-full border border-slate-200 overflow-hidden">
                    {availableTerms.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTerm(t);
                          setPlanId("");
                        }}
                        className={`px-4 py-2 text-xs font-bold cursor-pointer ${
                          activeTerm === t ? "bg-[#D6125A] text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        {TERM_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs font-bold text-slate-500">Plans available for this line</div>
              {shownPlans.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                  No other plans are available on this contract length right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {shownPlans.map((p) => {
                    const pr = priceFor(p, activeTerm as FlowTerm) as number;
                    const d = currentPrice != null ? pr - currentPrice : null;
                    const sel = planId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlanId(p.id)}
                        className={`text-center rounded-2xl border p-4 cursor-pointer transition ${
                          sel ? "border-[#D6125A] ring-2 ring-[#D6125A]/20 bg-[#FDF2F6]" : "border-slate-200 hover:border-[#D6125A]/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-semibold text-slate-600 text-left">{p.name}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${sel ? "bg-[#D6125A] border-[#D6125A] text-white" : "border-slate-300"}`}>
                            {sel && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                        <div className="mt-2 text-2xl font-extrabold">{p.dataAllowance}</div>
                        <div className="mt-1 text-sm font-bold text-[#D6125A]">
                          {money(pr)}
                          <span className="text-[11px] text-slate-500 font-medium">/mo</span>
                        </div>
                        {d != null && d !== 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {d > 0 ? `+${money(d)}` : `-${money(Math.abs(d))}`} vs now
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {targetPlan && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                  <div className="grid grid-cols-3 bg-slate-50 font-bold px-3 py-2">
                    <span />
                    <span>Now</span>
                    <span className="text-[#D6125A]">{targetPlan.name}</span>
                  </div>
                  {[
                    ["Plan", line.planName || "—", targetPlan.name],
                    ["UK data", currentPlan?.dataAllowance || "—", targetPlan.dataAllowance],
                    ["UK calls", currentPlan?.calls || "—", targetPlan.calls],
                    ["UK texts", currentPlan?.texts || "—", targetPlan.texts],
                    ["Roaming", currentPlan?.roaming || "—", targetPlan.roaming],
                    ["Price", currentPrice != null ? `${money(currentPrice)} a month` : "—", targetPrice != null ? `${money(targetPrice)} a month` : "—"],
                  ].map(([k, a, b]) => (
                    <div key={k} className="grid grid-cols-3 px-3 py-2 border-t border-slate-100">
                      <span className="text-slate-500">{k}</span>
                      <span>{a}</span>
                      <span className="font-semibold">{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-full border border-[#D6125A] text-[#D6125A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Choose another line
                </button>
                <button
                  type="button"
                  disabled={!targetPlan || targetPrice == null}
                  onClick={() => {
                    setAgreed(false);
                    setError("");
                    setStep(3);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#D6125A] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  Review change <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SummaryCard
                title="Your change"
                rows={[
                  ["Line", line.number],
                  ["Current plan", line.planName || "—"],
                  ["Current price", currentPrice != null ? money(currentPrice) : "—"],
                ]}
              >
                <div className="pt-2 text-xs text-slate-500">
                  {targetPlan ? (
                    <span className="font-semibold text-[#0B3D2E]">
                      New plan: {targetPlan.name}
                      {diff != null && diff !== 0 ? ` (${diff > 0 ? "+" : "-"}${money(Math.abs(diff))} a month)` : ""}
                    </span>
                  ) : (
                    "Pick a plan to see the difference."
                  )}
                </div>
              </SummaryCard>
              <HelpCard onContactSupport={onContactSupport} />
            </div>
          </div>
        </>
      )}

      {/* ─────────── STEP 3: confirm impact ─────────── */}
      {step === 3 && line && targetPlan && activeTerm && (
        <>
          <Hero
            title="Confirm your plan change"
            sub={`Moving ${line.number} from ${line.planName || "your current plan"} to ${targetPlan.name}.`}
            chips={[
              { icon: <Calendar className="w-3.5 h-3.5" />, text: "Start date confirmed by our team" },
              { icon: <FileText className="w-3.5 h-3.5" />, text: TERM_LABEL[activeTerm] },
              { icon: <Tag className="w-3.5 h-3.5" />, text: "Nothing to pay today" },
            ]}
          />
          <Stepper step={step} />
          <div className="max-w-5xl mx-auto px-5 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D6125A]" /> What changes
                </h2>
                <p className="text-xs text-slate-500">Read the before and after carefully. Nothing changes until our team confirms.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold mb-3">1. Before and after</h3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
                  <div className="rounded-xl border border-slate-200 p-3 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Now</div>
                    <div className="text-sm font-bold">{line.planName || "Current plan"}</div>
                    <div className="text-slate-500">Price</div>
                    <div className="font-semibold">{currentPrice != null ? `${money(currentPrice)} a month` : "—"}</div>
                    <div className="text-slate-500">Allowances</div>
                    <div className="font-semibold">{currentPlan ? `${currentPlan.dataAllowance} data · ${currentPlan.calls}` : "—"}</div>
                    <div className="text-slate-500">Contract</div>
                    <div className="font-semibold">{termText(line.term)}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#D6125A] self-center hidden sm:block" />
                  <div className="rounded-xl border border-[#D6125A] p-3 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-[#D6125A] font-bold">New</div>
                    <div className="text-sm font-bold">{targetPlan.name}</div>
                    <div className="text-slate-500">Price</div>
                    <div className="font-semibold">{targetPrice != null ? `${money(targetPrice)} a month` : "—"}</div>
                    <div className="text-slate-500">Allowances</div>
                    <div className="font-semibold">{`${targetPlan.dataAllowance} data · ${targetPlan.calls}`}</div>
                    <div className="text-slate-500">Contract</div>
                    <div className="font-semibold">{TERM_LABEL[activeTerm]}</div>
                  </div>
                </div>
                {termText(line.term) !== termText(activeTerm) && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-slate-700">
                    <span className="font-bold">Your contract length changes.</span> You&apos;re moving from {termText(line.term).toLowerCase()} to{" "}
                    {TERM_LABEL[activeTerm].toLowerCase()}. Our team will confirm the new term dates.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 text-xs">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#D6125A]" /> 2. Charges
                </h3>
                {[
                  ["To pay today", "£0.00"],
                  ["Early exit charge or part-month charge", "We'll confirm any charge before the change goes ahead"],
                  ["Your next bill", `New price from ${line.renewDate}, confirmed by our team`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2 border-t border-slate-100 first:border-t-0">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-right">{v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 text-xs">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D6125A]" /> 3. Agree
                </h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#D6125A]" />
                  <span>
                    I understand this is a request. Our team will confirm the start date, price and contract before my plan changes.
                  </span>
                </label>
                <div className="mt-3 text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> No payment details are needed. There is nothing to pay today.
                </div>
              </div>

              {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{error}</div>}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-full border border-[#D6125A] text-[#D6125A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to compare
                </button>
                <button
                  type="button"
                  disabled={!agreed || submitting}
                  onClick={submit}
                  className="px-5 py-2.5 rounded-full bg-[#D6125A] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Sending…" : "Confirm change"} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SummaryCard
                title="Your change"
                rows={[
                  ["Line", line.number],
                  ["From", line.planName || "—"],
                  ["To", targetPlan.name],
                  ["Contract", TERM_LABEL[activeTerm]],
                  ["New price", targetPrice != null ? money(targetPrice) : "—"],
                ]}
              >
                <div className="flex justify-between pt-2 text-sm font-bold text-[#D6125A] bg-[#FDF2F6] -mx-4 px-4 py-2 mt-2">
                  <span>To pay today</span>
                  <span>£0.00</span>
                </div>
                <button type="button" onClick={() => setStep(2)} className="text-[#D6125A] font-semibold underline cursor-pointer pt-1 text-left">
                  Choose a different plan
                </button>
              </SummaryCard>
              <HelpCard onContactSupport={onContactSupport} />
            </div>
          </div>
        </>
      )}

      {/* ─────────── STEP 4: change status ─────────── */}
      {step === 4 && line && targetPlan && activeTerm && (
        <>
          <Hero
            title="Change requested"
            sub={`${result?.reference ? `Request ${result.reference} · ` : ""}line ${line.number} · ${line.planName || "current plan"} → ${targetPlan.name}`}
            chips={[
              { icon: <Clock className="w-3.5 h-3.5" />, text: "We'll confirm the start date" },
              { icon: <Radio className="w-3.5 h-3.5" />, text: "Checked by our team" },
            ]}
          />
          <Stepper step={step} />
          <div className="max-w-5xl mx-auto px-5 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <div>
                  <div className="text-lg font-bold">Change requested</div>
                  <div className="text-xs text-slate-600">We&apos;ve received your request to move to {targetPlan.name}.</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#D6125A]" /> Progress
                </h3>
                <ol className="space-y-3 text-xs">
                  {[
                    ["Change requested", result?.reference ? `We've recorded your request (${result.reference}).` : "We've recorded your request.", true],
                    ["Our team checks it", "We'll email you once it's reviewed.", false],
                    ["Start date confirmed", "Not started", false],
                    ["Effective", "Not started", false],
                  ].map(([t, s, done], i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          done ? "bg-[#D6125A] text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-bold">{t as string}</div>
                        <div className="text-slate-500">{s as string}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5" /> Your current plan and allowances stay in place until the change takes effect.
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onContactSupport}
                  className="px-4 py-2 rounded-full border border-[#D6125A] text-[#D6125A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Ask about this change
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full bg-[#D6125A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  Back to MyZoiko <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SummaryCard
                title="Your bill"
                rows={[
                  ["Now", `${line.planName || "Current plan"} · ${currentPrice != null ? money(currentPrice) : "—"}`],
                  ["Requested", `${targetPlan.name} · ${targetPrice != null ? money(targetPrice) : "—"}`],
                  ["Contract", TERM_LABEL[activeTerm]],
                  ["Change per month", diff != null ? `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${money(Math.abs(diff))}` : "—"],
                ]}
              >
                <div className="pt-2 text-[11px] text-slate-500">Your bill shows the exact amounts once the change is confirmed.</div>
              </SummaryCard>
              <HelpCard onContactSupport={onContactSupport} />
            </div>
          </div>
        </>
      )}

      {footerStrip}
    </div>
  );
}

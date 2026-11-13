"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { validateUkMobile, validateEmail, validateName, validateUkPostcode } from "../utils/validators";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── DATA ────────────────────────────────────────────────────────────────────

const stepNames = ["Your Details", "Current Service", "Select Plan"];

const providers = ["EE", "O2", "Vodafone", "Three", "BT Mobile", "Sky Mobile", "Tesco Mobile", "giffgaff", "Other"];

const plans = [
  { price: "£29.5/month", name: "Zoiko Unlimited Data" },
  { price: "£28.34/month", name: "Zoiko Elite 100GB" },
  { price: "£16.99/month", name: "Zoiko Max 30GB" },
  { price: "£12.14/month", name: "Zoiko Standard 10GB" },
  { price: "£5.66/month", name: "Zoiko Plus 3GB" },
  { price: "£4.04/month", name: "Zoiko Connect 1GB" },
];

const authItems = [
  { key: "transfer", title: "Transfer Authorisation", desc: "I confirm I am authorised to request this number transfer." },
  { key: "timeline", title: "Switch Timeline", desc: "I understand my PAC/STAC code is valid for 30 days, and Zoiko Mobile will complete my switch within 1 working day of processing." },
  { key: "terms", title: "Terms & Privacy", desc: "I agree to Zoiko Mobile Privacy Policy and Terms & Conditions." },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const inputCx =
  "mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-[#0e8f74] focus:outline-none focus:ring-1 focus:ring-[#0e8f74] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelCx = "block text-sm font-bold text-gray-800 dark:text-gray-100";

function StepBadge({ label }: { label: string }) {
  return (
    <span className="mx-auto block w-fit rounded-full bg-[#e6007e] px-4 py-1 text-xs font-bold tracking-wide text-white">
      {label}
    </span>
  );
}

function Note({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" }) {
  const border = tone === "blue" ? "border-[#3b82f6]" : "border-[#0e8f74]";
  return (
    <div className={`mt-6 rounded-md border-l-4 ${border} bg-[#f3f8ee] px-4 py-3 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300`}>
      {children}
    </div>
  );
}

// ─── STEPPER ─────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mx-auto flex max-w-2xl items-center">
        {stepNames.map((name, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          const circle = done || active ? "bg-[#0e8f74] text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
          const label = done || active ? "text-[#0e8f74] dark:text-[#34d39e]" : "text-gray-500 dark:text-gray-400";
          return (
            <div key={name} className={`flex items-center ${i < stepNames.length - 1 ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${circle}`}>{n}</span>
                <span className={`mt-1.5 whitespace-nowrap text-xs font-semibold ${label}`}>{name}</span>
              </div>
              {i < stepNames.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 ${n < step ? "bg-[#0e8f74]" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  postcode: string;
  provider: string;
  planCost: string;
  dataAllowance: string;
  selectedPlan: string;
  transfer: boolean;
  timeline: boolean;
  terms: boolean;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  postcode: "",
  provider: "",
  planCost: "",
  dataAllowance: "",
  selectedPlan: "",
  transfer: false,
  timeline: false,
  terms: false,
};

function Switch() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const errors: Record<string, string> = {};
      const fCheck = validateName(form.firstName, "First name");
      if (!fCheck.isValid) errors.firstName = fCheck.error!;
      const lCheck = validateName(form.lastName, "Last name");
      if (!lCheck.isValid) errors.lastName = lCheck.error!;
      const eCheck = validateEmail(form.email);
      if (!eCheck.isValid) errors.email = eCheck.error!;
      const mCheck = validateUkMobile(form.mobile);
      if (!mCheck.isValid) errors.mobile = mCheck.error!;
      const pCheck = validateUkPostcode(form.postcode);
      if (!pCheck.isValid) errors.postcode = pCheck.error!;

      if (Object.keys(errors).length > 0) {
        setStepErrors(errors);
        return;
      }
      setStepErrors({});
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const allAgreed = form.transfer && form.timeline && form.terms;
  const canComplete = allAgreed && form.selectedPlan !== "";

  // Flatten DRF's { field: ["msg", ...] } error shape into a single readable line.
  const formatApiErrors = (data: unknown): string => {
    if (data && typeof data === "object") {
      const parts: string[] = [];
      for (const [, val] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(val)) parts.push(...val.map(String));
        else if (typeof val === "string") parts.push(val);
      }
      if (parts.length) return parts.join(" ");
    }
    return "Something went wrong. Please check your details and try again.";
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    if (!canComplete || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_BASE}/api/switch-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          mobile: form.mobile,
          postcode: form.postcode,
          current_provider: form.provider,
          current_plan_cost: form.planCost || null,
          current_data_allowance: form.dataAllowance || null,
          selected_plan: form.selectedPlan,
          transfer_authorised: form.transfer,
          timeline_acknowledged: form.timeline,
          terms_accepted: form.terms,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubmitError(formatApiErrors(data));
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-10 text-center text-white sm:px-6">
        <h1 className="font-extrabold text-[clamp(1.6rem,4vw,2.25rem)]">Switch to Zoiko Mobile</h1>
        <p className="mt-1 text-sm text-white/90">Keep your number and switch in just 1 working day</p>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        {submitted ? (
          /* ─── Success screen ─── */
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0e8f74] text-3xl text-white">
              ✓
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-gray-800 dark:text-white">Switch request received</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Thanks {form.firstName || "there"} — we&rsquo;ve received your request to switch to{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{form.selectedPlan}</span>.
              We&rsquo;ll be in touch within 1 working day.
            </p>
          </div>
        ) : (
          <>
            <Stepper step={step} />

            {/* ─── Step panel ─── */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10 dark:bg-gray-800">
              {/* STEP 1 — Your Details */}
              {step === 1 && (
                <form onSubmit={next}>
                  <StepBadge label="STEP 1" />
                  <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-800 dark:text-white">Your Details</h2>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className={labelCx}>First Name <span className="text-[#e6007e]">*</span></label>
                      <input id="firstName" name="firstName" required value={form.firstName} onChange={update} className={inputCx} />
                      {stepErrors.firstName && <p className="text-red-500 text-xs mt-1">{stepErrors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelCx}>Last Name <span className="text-[#e6007e]">*</span></label>
                      <input id="lastName" name="lastName" required value={form.lastName} onChange={update} className={inputCx} />
                      {stepErrors.lastName && <p className="text-red-500 text-xs mt-1">{stepErrors.lastName}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className={labelCx}>Email <span className="text-[#e6007e]">*</span></label>
                      <input id="email" name="email" type="email" required value={form.email} onChange={update} className={inputCx} />
                      {stepErrors.email && <p className="text-red-500 text-xs mt-1">{stepErrors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="mobile" className={labelCx}>Mobile <span className="text-[#e6007e]">*</span></label>
                      <input id="mobile" name="mobile" type="tel" required value={form.mobile} onChange={update} className={inputCx} />
                      {stepErrors.mobile && <p className="text-red-500 text-xs mt-1">{stepErrors.mobile}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="postcode" className={labelCx}>Billing Address / Postcode <span className="text-[#e6007e]">*</span></label>
                      <input id="postcode" name="postcode" required value={form.postcode} onChange={update} className={inputCx} />
                      {stepErrors.postcode && <p className="text-red-500 text-xs mt-1">{stepErrors.postcode}</p>}
                    </div>
                  </div>

                  <Note>
                    <span aria-hidden="true">🔒 </span>We use this to securely process your switch in line with Ofcom rules.
                  </Note>

                  <div className="mt-8 flex justify-center">
                    <button type="submit" className="rounded-md bg-[#0e8f74] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b7460]">
                      Next Step
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2 — Current Service */}
              {step === 2 && (
                <form onSubmit={next}>
                  <StepBadge label="STEP 2" />
                  <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-800 dark:text-white">Your Current Mobile Service</h2>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="provider" className={labelCx}>Current Provider</label>
                      <select id="provider" name="provider" value={form.provider} onChange={update} className={`${inputCx} bg-white dark:bg-gray-900`}>
                        <option value="">Select</option>
                        {providers.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="planCost" className={labelCx}>Current Plan Cost (£)</label>
                      <input id="planCost" name="planCost" type="number" inputMode="decimal" value={form.planCost} onChange={update} className={inputCx} />
                    </div>
                    <div>
                      <label htmlFor="dataAllowance" className={labelCx}>Current Data Allowance (GB)</label>
                      <input id="dataAllowance" name="dataAllowance" type="number" inputMode="decimal" value={form.dataAllowance} onChange={update} className={inputCx} />
                    </div>
                  </div>

                  <Note tone="blue">
                    <span aria-hidden="true">ℹ️ </span>Optional: These details help us recommend the right plan, but are not required.
                  </Note>

                  <div className="mt-8 flex justify-center gap-3">
                    <button type="button" onClick={back} className="rounded-md bg-gray-200 px-7 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Back
                    </button>
                    <button type="submit" className="rounded-md bg-[#0e8f74] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b7460]">
                      Next Step
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3 — Select Plan */}
              {step === 3 && (
                <form onSubmit={handleComplete}>
                  <StepBadge label="STEP 3" />
                  <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-800 dark:text-white">Select Your New Plan</h2>

                  {/* Plans */}
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((p) => {
                      const selected = form.selectedPlan === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, selectedPlan: p.name }))}
                          className={`rounded-xl border-2 p-5 text-center transition-colors ${
                            selected
                              ? "border-[#0e8f74] bg-[#f0fbf6] dark:bg-[#0e8f74]/10"
                              : "border-gray-200 bg-white hover:border-[#0e8f74]/50 dark:border-gray-700 dark:bg-gray-900"
                          }`}
                        >
                          <p className="text-lg font-extrabold text-gray-800 dark:text-white">{p.price}</p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{p.name}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Authorisation */}
                  <h3 className="mt-10 text-lg font-bold text-gray-800 dark:text-white">Authorisation Required</h3>
                  <div className="mt-4 space-y-3">
                    {authItems.map((a) => (
                      <label
                        key={a.key}
                        htmlFor={a.key}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <input
                          id={a.key}
                          name={a.key}
                          type="checkbox"
                          checked={form[a.key as "transfer" | "timeline" | "terms"]}
                          onChange={update}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0e8f74] focus:ring-[#0e8f74]"
                        />
                        <span>
                          <span className="block text-sm font-bold text-gray-800 dark:text-white">{a.title}</span>
                          <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{a.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Submit error */}
                  {submitError && (
                    <div className="mt-6 rounded-md border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      {submitError}
                    </div>
                  )}

                  <div className="mt-8 flex justify-center gap-3">
                    <button type="button" onClick={back} disabled={submitting} className="rounded-md bg-gray-200 px-7 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!canComplete || submitting}
                      className={`rounded-md px-7 py-2.5 text-sm font-semibold transition-colors ${
                        canComplete && !submitting
                          ? "bg-[#0e8f74] text-white hover:bg-[#0b7460]"
                          : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                      }`}
                    >
                      {submitting ? "Submitting…" : "Complete Switch"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default Switch;
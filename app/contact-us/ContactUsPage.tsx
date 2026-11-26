"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Accessibility,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Coins,
  CreditCard,
  FileText,
  Headphones,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plane,
  Repeat,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wifi,
  XCircle,
  Package,
  type LucideIcon,
} from "lucide-react";
import { openChat } from "../components/ChatbotWidget";
import {
  DEFAULT_ENQUIRY_ID,
  ENQUIRY_TYPES,
  HELPFUL_LINKS,
  MESSAGE_MAX,
  PHONE_HOURS,
  isPhoneOpenNow,
  type EnquiryType,
} from "./contactConfig";

// ─── STYLE TOKENS ────────────────────────────────────────────────────────────
const CRIMSON = "bg-[#a30f45] hover:bg-[#8a0c3a]";
const INK = "text-[#0b3b36] dark:text-white";
const field =
  "w-full rounded-lg border bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a30f45]/25 dark:bg-gray-900 dark:text-white";

const ICONS: Record<EnquiryType["icon"], LucideIcon> = {
  sim: Smartphone,
  billing: CreditCard,
  network: Wifi,
  roaming: Plane,
  orders: Repeat,
  business: Building2,
  complaint: MessageSquare,
  access: Accessibility,
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Values = Record<string, string>;
type Errors = Record<string, string>;
type Notice = { kind: "success" | "error"; title: string; text: string } | null;

// ─── VALIDATION ──────────────────────────────────────────────────────────────
function validateCore(v: Values): Errors {
  const e: Errors = {};
  const name = (v.name ?? "").trim();
  if (!name) e.name = "Full name is required.";
  else if (name.length < 2) e.name = "Name must be at least 2 characters.";
  else if (!/^[\p{L}\s'’.\-]+$/u.test(name)) e.name = "Name can only contain letters, spaces, hyphens and apostrophes.";

  const email = (v.email ?? "").trim();
  if (!email) e.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Enter a valid email address.";

  const phone = (v.phone ?? "").trim();
  if (phone && !/^[+\d\s\-()]{7,20}$/.test(phone)) e.phone = "Enter a valid phone number.";

  const msg = (v.message ?? "").trim();
  if (!msg) e.message = "Please tell us how we can help.";
  else if (msg.length < 10) e.message = "Please give us a little more detail (10+ characters).";
  else if (msg.length > MESSAGE_MAX) e.message = `Message cannot exceed ${MESSAGE_MAX} characters.`;
  return e;
}

function validateExtras(type: EnquiryType, v: Values): Errors {
  const e: Errors = {};
  for (const f of type.extraFields) {
    const val = (v[f.name] ?? "").trim();
    if (f.required && !val) e[f.name] = `${f.label} is required.`;
    else if (val && f.pattern && !f.pattern.test(val.replace(/\s/g, ""))) e[f.name] = f.patternMessage ?? "Invalid value.";
  }
  return e;
}

// ─── SMALL PIECES ────────────────────────────────────────────────────────────
function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-600">
      {msg}
    </p>
  );
}

function Label({ htmlFor, children, required, optional }: { htmlFor: string; children: ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-[#0b3b36] dark:text-gray-200">
      {children}
      {required && <span className="ml-0.5 text-[#a30f45]" aria-hidden="true">*</span>}
      {optional && <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>}
    </label>
  );
}

const scrollToForm = () =>
  document.getElementById("send-message")?.scrollIntoView({ behavior: "smooth", block: "start" });

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ContactUsPage() {
  const [typeId, setTypeId] = useState(DEFAULT_ENQUIRY_ID);
  const [values, setValues] = useState<Values>({ name: "", email: "", phone: "", message: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [open, setOpen] = useState<boolean | null>(null); // null until mounted (avoids SSR mismatch)

  const type = useMemo(() => ENQUIRY_TYPES.find((t) => t.id === typeId) ?? ENQUIRY_TYPES[0], [typeId]);

  // Live "Currently open / closed" for the phone line.
  useEffect(() => {
    const tick = () => setOpen(isPhoneOpenNow());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Allow deep links like /contact-us?type=billing (and #send-message).
  useEffect(() => {
    const apply = () => {
      const t = new URLSearchParams(window.location.search).get("type");
      if (t && ENQUIRY_TYPES.some((e) => e.id === t)) setTypeId(t);
    };
    apply();
  }, []);

  const errors: Errors = useMemo(
    () => ({ ...validateCore(values), ...validateExtras(type, values), ...serverErrors }),
    [values, type, serverErrors]
  );
  const show = (n: string) => (touched[n] ? errors[n] : undefined);

  const set = (n: string, v: string) => {
    setValues((p) => ({ ...p, [n]: v }));
    if (serverErrors[n]) setServerErrors((p) => { const c = { ...p }; delete c[n]; return c; });
  };
  const blur = (n: string) => setTouched((p) => ({ ...p, [n]: true }));

  const chooseType = (id: string, scroll = false) => {
    setTypeId(id);
    setNotice(null);
    setServerErrors({});
    if (scroll) scrollToForm();
  };

  const cls = (n: string) => `${field} ${show(n) ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const all: Record<string, boolean> = { name: true, email: true, phone: true, message: true };
    type.extraFields.forEach((f) => (all[f.name] = true));
    setTouched(all);
    const fresh = { ...validateCore(values), ...validateExtras(type, values) };
    if (Object.keys(fresh).length > 0) {
      setServerErrors({});
      setNotice({ kind: "error", title: "Check your details", text: "Please fix the highlighted fields before sending." });
      return;
    }

    // The backend has fixed columns (name/email/phone/subject/message), so the
    // enquiry type and its dynamic fields are folded into the message body.
    const extras = type.extraFields
      .map((f) => [f.label, (values[f.name] ?? "").trim()] as const)
      .filter(([, v]) => v)
      .map(([l, v]) => `${l}: ${v}`);
    const message = [`Enquiry type: ${type.label}`, ...extras, "", values.message.trim()].join("\n");

    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact-us/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || "Not provided", // backend requires a value
          subject: type.subject,
          message,
          savePref: false,
          newsletter: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setValues({ name: "", email: "", phone: "", message: "" });
        setTouched({});
        setNotice({
          kind: "success",
          title: "Message sent",
          text: "Thanks — we've received your enquiry and emailed you a confirmation. We'll reply within 24 hours.",
        });
      } else {
        // DRF returns { field: ["msg"] }
        const se: Errors = {};
        if (data && typeof data === "object") {
          for (const [k, v] of Object.entries(data)) {
            if (["name", "email", "phone", "message"].includes(k)) se[k] = Array.isArray(v) ? String(v[0]) : String(v);
          }
        }
        setServerErrors(se);
        setNotice({ kind: "error", title: "Couldn't send your message", text: "Please review the form and try again." });
      }
    } catch {
      setNotice({ kind: "error", title: "Connection problem", text: "We couldn't reach our servers. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const cards = ENQUIRY_TYPES.filter((t) => t.card);
  const extraCards = ENQUIRY_TYPES.filter((t) => t.id === "complaint" || t.id === "accessibility");

  return (
    <main className="bg-white font-sans text-gray-700 dark:bg-gray-950 dark:text-gray-300">
      {/* ─── Hero ─── */}
      <section className="relative isolate overflow-hidden bg-[#eaf6f4] dark:bg-gray-900">
        <Image
          src="/images/Frame 64.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[75%_top] max-md:opacity-30"
        />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 sm:px-6 md:pt-14 lg:grid-cols-2">
          <div className="max-w-md pb-4 lg:pb-24">
            <h1 className={`text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.1] ${INK}`}>
              We’re here to help. Let’s get you connected.
            </h1>
            <p className="mt-5 text-base text-gray-600 dark:text-gray-300">
              Need help with your SIM, mobile plan, billing, roaming or business account? We’ll help you find the right support.
            </p>
            <div className="mt-6 h-0.5 w-14 bg-[#a30f45]" />
          </div>
          <div className="lg:justify-self-end">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 dark:bg-gray-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3f3f0] text-[#0b3b36]">
                <UserRound className="h-5 w-5" />
              </span>
              <h2 className={`mt-4 text-lg font-bold ${INK}`}>Already a customer?</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Manage your plan, billing, usage and more in MyZoiko.</p>
              <Link
                href="/dashboard"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-[#a30f45] py-2.5 text-sm font-semibold text-[#a30f45] transition-colors hover:bg-[#a30f45] hover:text-white"
              >
                Manage my account <ChevronRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs text-gray-500">You can also contact us without signing in.</p>
            </div>
          </div>
        </div>

        {/* Emergency strip */}
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-6 lg:pt-0">
          <div className="flex flex-col gap-3 rounded-xl bg-[#fbe4ea] px-5 py-4 md:flex-row md:items-center md:gap-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#a30f45]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#a30f45]">Lost your phone or SIM?</p>
                <p className="text-xs text-gray-600">Protect your number.</p>
              </div>
            </div>
            <ul className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2 md:border-l md:border-[#a30f45]/20 md:pl-8">
              {[
                { Icon: Smartphone, text: "Lost or stolen", onClick: () => chooseType("other", true) },
                { Icon: AlertTriangle, text: "Report suspected fraud", onClick: () => chooseType("complaint", true) },
                { Icon: Wifi, text: "Check network issues", onClick: () => chooseType("network", true) },
              ].map(({ Icon, text, onClick }) => (
                <li key={text}>
                  <button type="button" onClick={onClick} className="inline-flex items-center gap-2 text-sm font-semibold text-[#a30f45] underline underline-offset-2">
                    <Icon className="h-4 w-4" /> {text} <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── What do you need help with? ─── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className={`text-xl font-extrabold ${INK}`}>What do you need help with?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = ICONS[c.icon];
            const active = c.id === typeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => chooseType(c.id, true)}
                aria-pressed={active}
                className={`group flex items-center gap-4 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-gray-900 ${
                  active ? "border-[#a30f45]" : "border-gray-100 dark:border-gray-800"
                }`}
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#e3f3f0] text-[#0b6b5d]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className={`block text-sm font-bold ${INK}`}>{c.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-600 dark:text-gray-400">{c.desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#a30f45]" />
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          Something else?{" "}
          <button type="button" onClick={() => chooseType("other", true)} className="font-semibold text-[#a30f45] underline underline-offset-2">
            Contact us about another query <ChevronRight className="inline h-3.5 w-3.5" />
          </button>
        </p>
      </section>

      {/* ─── Choose how you'd like to get help ─── */}
      <section className="bg-[#fdf6f7] py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className={`text-xl font-extrabold ${INK}`}>Choose how you’d like to get help</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {/* Chat */}
            <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fbe4ea] text-[#a30f45]"><MessageSquare className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold text-[#0b6b5d]">Virtual assistant</p>
                  <h3 className={`text-lg font-bold ${INK}`}>Chat with Zovie</h3>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-300">Ask our virtual assistant about common questions.</p>
              <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fbe4ea] px-2.5 py-1 text-[11px] font-semibold text-[#a30f45]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a30f45]" /> Automated · hours may differ
              </span>
              <button type="button" onClick={openChat} className={`mt-4 inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-colors ${CRIMSON}`}>
                Start chat <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Call */}
            <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fbe4ea] text-[#a30f45]"><Phone className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold text-[#0b6b5d]">Human support</p>
                  <h3 className={`text-lg font-bold ${INK}`}>Call our team</h3>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-300">
                {PHONE_HOURS.display} · {PHONE_HOURS.text}
              </p>
              {open !== null && (
                <span
                  className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    open ? "bg-emerald-50 text-emerald-700" : "bg-[#fbe4ea] text-[#a30f45]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-600" : "bg-[#a30f45]"}`} />
                  {open ? "Currently open" : "Currently closed"}
                </span>
              )}
              <a href={`tel:${PHONE_HOURS.tel}`} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[#a30f45] py-3 text-sm font-semibold text-[#a30f45] transition-colors hover:bg-[#a30f45] hover:text-white">
                View call options <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            {/* Message */}
            <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fbe4ea] text-[#a30f45]"><Mail className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-semibold text-[#0b6b5d]">Online form</p>
                  <h3 className={`text-lg font-bold ${INK}`}>Send us a message</h3>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-300">Tell us what you need and we’ll reply by email.</p>
              <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Available anytime
              </span>
              <button type="button" onClick={() => scrollToForm()} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[#a30f45] py-3 text-sm font-semibold text-[#a30f45] transition-colors hover:bg-[#a30f45] hover:text-white">
                Send a message <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Form + helpful links ─── */}
        <div className="mx-auto mt-8 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.45fr_1fr]">
          <section id="send-message" className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
            <h2 className={`text-2xl font-extrabold ${INK}`}>Send us a message</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">We’ll email your reference once we’ve received your enquiry.</p>

            {notice && (
              <div
                role={notice.kind === "error" ? "alert" : "status"}
                className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
                  notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {notice.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />}
                <div>
                  <p className="text-sm font-semibold">{notice.title}</p>
                  <p className="text-xs">{notice.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
              <div>
                <Label htmlFor="enquiry" required>Enquiry type</Label>
                <select id="enquiry" value={typeId} onChange={(e) => chooseType(e.target.value)} className={`${field} rounded-xl! border-gray-200 dark:border-gray-600`}>
                  {ENQUIRY_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" required>Full name</Label>
                  <input id="name" name="name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} placeholder="Enter your full name" className={cls("name")} aria-invalid={!!show("name")} aria-describedby={show("name") ? "name-err" : undefined} />
                  <FieldError id="name-err" msg={show("name")} />
                </div>
                <div>
                  <Label htmlFor="email" required>Email address</Label>
                  <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} placeholder="Enter your email address" className={cls("email")} aria-invalid={!!show("email")} aria-describedby={show("email") ? "email-err" : undefined} />
                  <FieldError id="email-err" msg={show("email")} />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" optional>Mobile number</Label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => blur("phone")} placeholder="e.g. 07XXX XXXXXX" className={cls("phone")} aria-invalid={!!show("phone")} aria-describedby={show("phone") ? "phone-err" : undefined} />
                <FieldError id="phone-err" msg={show("phone")} />
              </div>

              {/* Dynamic fields for the chosen enquiry type */}
              {type.extraFields.length > 0 && (
                <div key={type.id} className="grid gap-5 sm:grid-cols-2">
                  {type.extraFields.map((f) => (
                    <div key={f.name}>
                      <Label htmlFor={`x-${f.name}`} required={f.required} optional={!f.required}>{f.label}</Label>
                      {f.type === "select" ? (
                        <select id={`x-${f.name}`} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} onBlur={() => blur(f.name)} className={`${cls(f.name)} rounded-xl!`}>
                          <option value="">Select…</option>
                          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input id={`x-${f.name}`} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} onBlur={() => blur(f.name)} placeholder={f.placeholder} className={cls(f.name)} aria-invalid={!!show(f.name)} aria-describedby={show(f.name) ? `x-${f.name}-err` : undefined} />
                      )}
                      <FieldError id={`x-${f.name}-err`} msg={show(f.name)} />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label htmlFor="message" required>How can we help?</Label>
                <textarea id="message" name="message" rows={4} value={values.message} onChange={(e) => set("message", e.target.value)} onBlur={() => blur("message")} placeholder={type.messagePlaceholder} maxLength={MESSAGE_MAX + 200} className={cls("message")} aria-invalid={!!show("message")} aria-describedby={show("message") ? "message-err" : undefined} />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div><FieldError id="message-err" msg={show("message")} /></div>
                  <span className={`text-xs ${values.message.length > MESSAGE_MAX ? "text-red-600" : "text-gray-500"}`}>{values.message.length}/{MESSAGE_MAX}</span>
                </div>
              </div>

              <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-[#0b6b5d]" /> Please don’t include passwords, card details or one-time codes.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                We’ll use your information only to deal with your enquiry, in line with our{" "}
                <Link href="/privacy-policy" className="font-medium text-[#a30f45] underline">Privacy Policy</Link>.
              </p>

              <button type="submit" disabled={submitting} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${CRIMSON}`}>
                {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : (<>Send message <ChevronRight className="h-4 w-4" /></>)}
              </button>
            </form>
          </section>

          {/* Helpful links */}
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className={`text-xl font-extrabold ${INK}`}>Helpful links</h2>
            <div className="mt-2 h-0.5 w-10 bg-[#a30f45]" />
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
              {HELPFUL_LINKS.map((l, i) => {
                const Icon = [FileText, UserRound, Coins, Plane, Package][i] ?? Headphones;
                return (
                  <li key={l.title}>
                    <Link href={l.href} className="group flex items-center gap-3 py-4">
                      <Icon className="h-4 w-4 flex-shrink-0 text-[#0b6b5d]" />
                      <span className="flex-1">
                        <span className={`block text-sm font-bold ${INK}`}>{l.title}</span>
                        <span className="block text-xs text-gray-600 dark:text-gray-400">{l.desc}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CircleHelp className="h-4 w-4" /> Prefer another way?{" "}
              <Link href="/support" className="inline-flex items-center gap-1 font-semibold text-[#a30f45] underline underline-offset-2">
                See all support options <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </aside>
        </div>
      </section>

      {/* ─── Complaint / accessibility / business ─── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {extraCards.map((c) => {
            const Icon = ICONS[c.icon];
            return (
              <button key={c.id} type="button" onClick={() => chooseType(c.id, true)} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#fbe4ea] text-[#a30f45]"><Icon className="h-5 w-5" /></span>
                <span className="flex-1">
                  <span className={`block text-sm font-bold ${INK}`}>{c.id === "accessibility" ? "Accessibility and additional support" : c.label}</span>
                  <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">{c.desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#a30f45]" />
              </button>
            );
          })}
          <button type="button" onClick={() => chooseType("business", true)} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#fbe4ea] text-[#a30f45]"><Building2 className="h-5 w-5" /></span>
            <span className="flex-1">
              <span className={`block text-sm font-bold ${INK}`}>Business enquiries and support</span>
              <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">Get in touch about business plans, accounts and partnership opportunities.</span>
            </span>
            <ChevronRight className="h-4 w-4 text-[#a30f45]" />
          </button>
        </div>
      </section>
    </main>
  );
}

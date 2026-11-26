"use client";

// Activate your SIM: 3 steps (Verify your details > Confirm your SIM > Activate & track).
// The OTP works exactly as before: the customer types the 6-digit code and we check it with /api/otp/verify/.
// The final request still goes to /api/activate/. Things the backend can't tell us yet are shown as
// "we'll confirm" (nothing is made up). See BACKEND_REQUEST_Activate-your-SIM.md for what is needed.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Zap,
  Radio,
  Info,
} from "lucide-react";
// Client-side helper that calls OUR OWN /api/transatel/* routes (never Transatel directly).
import { fetchSubscriber } from "@/lib/useTransatel";
import { getLines } from "@/app/dashboard/add-new-number/addLineApi";
import { fetchMySwitchRequests, TERMINAL_STATUSES } from "@/app/switch-and-save/switchApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const titleOptions = ["Mr", "Mrs", "Ms", "Miss", "Dr"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ActivationType = "new_sim" | "esim" | "replacement";
const TYPE_OPTIONS: { key: ActivationType; title: string; text: string; label: string }[] = [
  { key: "new_sim", title: "New SIM", text: "Activate your new Zoiko Mobile SIM.", label: "New SIM" },
  { key: "esim", title: "eSIM", text: "Activate an eSIM on a compatible device.", label: "eSIM" },
  {
    key: "replacement",
    title: "Replacement SIM",
    text: "Activate a replacement SIM (for example lost, stolen or damaged).",
    label: "Replacement SIM",
  },
];

type FormState = {
  email: string;
  orderNumber: string;
  dob: string;
  postcode: string;
  otp: string;
  simSerial: string;
  title: string;
  firstName: string;
  lastName: string;
  zoikoPackage: string;
  country: string;
  city: string;
  address: string;
};
type Errors = Partial<Record<keyof FormState | "confirm", string>>;

const initialForm: FormState = {
  email: "",
  orderNumber: "",
  dob: "",
  postcode: "",
  otp: "",
  simSerial: "",
  title: "Mr",
  firstName: "",
  lastName: "",
  zoikoPackage: "",
  country: "United Kingdom",
  city: "",
  address: "",
};

type OtpPhase = "idle" | "verifying" | "verified";
type SimCheck = "idle" | "checking" | "found" | "notfound" | "error";

function ageOf(dobStr: string): number {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const inputCls = (err?: boolean, off?: boolean) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#0D1935] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100 ${
    err ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#E01C5B]/40 dark:border-gray-600"
  } ${off ? "opacity-60 cursor-not-allowed" : ""}`;

function FieldBox({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-[#0D1935] dark:text-gray-200">
        {label}
        {required && <span className="text-[#E01C5B]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, t: "Verify your details", s: "Confirm your identity" },
    { n: 2, t: "Confirm your SIM", s: "Add SIM or eSIM details" },
    { n: 3, t: "Activate & track", s: "Submit and see your activation status" },
  ];
  return (
    <ol className="relative z-10 -mt-12 mx-auto max-w-6xl rounded-3xl bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgba(18,27,52,0.10)] px-5 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((it) => {
        const done = step > it.n;
        const active = step === it.n;
        return (
          <li key={it.n} className="flex items-center gap-3">
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                done ? "bg-emerald-600" : active ? "bg-[#E01C5B]" : "bg-slate-400"
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : it.n}
            </span>
            <div className="min-w-0">
              <div className={`text-sm font-bold ${active ? "text-[#E01C5B]" : "text-[#0D1935] dark:text-white"}`}>{it.t}</div>
              <div className="text-xs text-gray-500">{it.s}</div>
            </div>
            {it.n < 3 && <ChevronRight className="hidden md:block w-4 h-4 text-[#E01C5B] ml-auto shrink-0" />}
          </li>
        );
      })}
    </ol>
  );
}

function TypePanel({
  value,
  onChange,
  disabled,
}: {
  value: ActivationType;
  onChange: (v: ActivationType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-base font-bold text-[#0B3D2E] dark:text-white mb-3">Choose what you want to activate</h3>
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="What do you want to activate">
        {TYPE_OPTIONS.map((o) => (
          <label
            key={o.key}
            className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${
              disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer"
            } ${value === o.key ? "border-[#E01C5B] bg-[#E01C5B]/5" : "border-gray-200 dark:border-gray-600"}`}
          >
            <input
              type="radio"
              name="activation-type"
              checked={value === o.key}
              disabled={disabled}
              onChange={() => onChange(o.key)}
              className="mt-1 accent-[#E01C5B]"
            />
            <span className="mt-0.5 text-[#E01C5B]">{o.key === "esim" ? <Smartphone className="w-4 h-4" /> : o.key === "replacement" ? <RefreshCw className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}</span>
            <span>
              <span className="block text-sm font-bold text-[#0D1935] dark:text-white">{o.title}</span>
              <span className="block text-xs text-gray-500">{o.text}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function HelpPanel() {
  const openChat = () => window.dispatchEvent(new Event("zoiko-open-chat"));
  return (
    <div className="rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-base font-bold text-[#0B3D2E] dark:text-white mb-2">Need help?</h3>
      <button type="button" onClick={openChat} className="w-full flex items-center gap-3 py-3 text-left cursor-pointer">
        <MessageCircle className="w-5 h-5 text-[#0B3D2E]" />
        <span className="flex-1">
          <span className="block text-sm font-bold text-[#0D1935] dark:text-white">Chat with Zovie</span>
          <span className="block text-xs text-gray-500">Get instant help from our assistant, 24/7.</span>
        </span>
        <ChevronRight className="w-4 h-4 text-[#E01C5B]" />
      </button>
      <a href="tel:03330040333" className="flex items-center gap-3 py-3 border-t border-gray-100 dark:border-gray-700">
        <Phone className="w-5 h-5 text-[#0B3D2E]" />
        <span className="flex-1">
          <span className="block text-sm font-bold text-[#0D1935] dark:text-white">Call us</span>
          <span className="block text-sm font-semibold text-[#0D1935] dark:text-white">0333 004 0333</span>
          <span className="block text-xs text-gray-500">Mon–Fri, 8am–8pm | Sat–Sun, 9am–6pm</span>
        </span>
        <ChevronRight className="w-4 h-4 text-[#E01C5B]" />
      </a>
      <a href="mailto:help@zoikomobile.co.uk" className="flex items-center gap-3 py-3 border-t border-gray-100 dark:border-gray-700">
        <Mail className="w-5 h-5 text-[#0B3D2E]" />
        <span className="flex-1">
          <span className="block text-sm font-bold text-[#0D1935] dark:text-white">Email us</span>
          <span className="block text-sm font-semibold text-[#0D1935] dark:text-white">help@zoikomobile.co.uk</span>
          <span className="block text-xs text-gray-500">We&apos;ll usually reply within 24 hours.</span>
        </span>
        <ChevronRight className="w-4 h-4 text-[#E01C5B]" />
      </a>
    </div>
  );
}

function InfoCards() {
  const cards = [
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: "Where to find your SIM number (ICCID)",
      text: "It's usually a 19–20 digit number on your SIM card and the card it came in.",
      link: "View example",
      href: "/how-to-activate-sim-cards",
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Activating an eSIM?",
      text: "Once your order is verified, you'll get your eSIM details securely in MyZoiko, never by email.",
      link: "Learn about eSIM",
      href: "/esim-setup-guidance",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "How long does it take?",
      text: "Most activations complete quickly, but some take longer. We'll show your live progress here.",
      link: "Check activation times",
      href: "/how-to-activate-sim-cards",
    },
  ];
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.title} className="rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex gap-3">
          <span className="w-10 h-10 rounded-full bg-[#E01C5B]/10 text-[#E01C5B] flex items-center justify-center shrink-0">{c.icon}</span>
          <div>
            <div className="text-sm font-bold text-[#0D1935] dark:text-white">{c.title}</div>
            <p className="mt-1 text-xs text-gray-500">{c.text}</p>
            <Link href={c.href} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#E01C5B] hover:underline">
              {c.link} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: <Zap className="w-5 h-5" />, t: "Quick activation", s: "Set up in a few steps" },
    { icon: <RefreshCw className="w-5 h-5" />, t: "Keep your number", s: "Switch easily to Zoiko" },
    { icon: <Radio className="w-5 h-5" />, t: "UK network coverage", s: "Check coverage where you live" },
    { icon: <ShieldCheck className="w-5 h-5" />, t: "A secure & trusted network", s: "Your account protected" },
  ];
  return (
    <div className="mt-8 bg-[#0B3D2E] text-white">
      <div className="max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((i) => (
          <div key={i.t} className="flex items-center gap-3">
            {i.icon}
            <div>
              <div className="text-sm font-bold">{i.t}</div>
              <div className="text-xs text-white/70">{i.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Activateform() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<ActivationType>("new_sim");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmed, setConfirmed] = useState(false);

  // OTP: same as before. The customer types the 6-digit code and we verify it.
  const [otpPhase, setOtpPhase] = useState<OtpPhase>("idle");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const otpVerified = otpPhase === "verified";

  const [simCheck, setSimCheck] = useState<SimCheck>("idle");
  const [simMsg, setSimMsg] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string>("");

  // The plan the customer chose in "Add a new number" or "Switch & Save" (logged-in customers)
  const [orderPlan, setOrderPlan] = useState<{ name: string; detail: string; source: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoggedIn(!!localStorage.getItem("zoiko_token")), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    const termWords = (t: string) => (t === "30D" ? "30-day plan" : t === "12M" ? "12-month plan" : t === "24M" ? "24-month plan" : "");
    const money = (v: unknown) => (v != null && v !== "" && Number.isFinite(Number(v)) ? `£${Number(v).toFixed(2)} a month` : "");
    (async () => {
      let found: { name: string; detail: string; source: string } | null = null;
      try {
        const res = await getLines();
        const line = res.lines.find((l) => l.status === "pending_activation" && l.plan);
        if (line?.plan) {
          found = {
            name: line.plan.name,
            detail: [termWords(line.term), money(line.plan.price)].filter(Boolean).join(" · "),
            source: "Add a new number",
          };
        } else if (res.pending_orders?.[0]?.quote?.plan) {
          const q = res.pending_orders[0].quote;
          found = {
            name: q.plan.name,
            detail: [q.term_label || termWords(q.term), money(q.monthly_price)].filter(Boolean).join(" · "),
            source: "Add a new number",
          };
        }
      } catch {
        /* no add-line order: try Switch & Save */
      }
      if (!found) {
        try {
          const mine = await fetchMySwitchRequests();
          const sw = mine.find((m) => m.plan?.name && !TERMINAL_STATUSES.includes(String(m.status)));
          if (sw?.plan) found = { name: sw.plan.name, detail: "", source: "Switch & Save" };
        } catch {
          /* leave the plan list */
        }
      }
      if (cancelled || !found) return;
      setOrderPlan(found);
      setForm((f) => ({ ...f, zoikoPackage: found!.name }));
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const set = (name: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };
  const onText = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(e.target.name as keyof FormState, e.target.value);

  // ── Step 1: verify the code (unchanged behaviour) ──
  const verifyOtp = async () => {
    setOtpMessage(null);
    const otp = form.otp.trim();
    if (!EMAIL_RE.test(form.email.trim())) {
      setErrors((p) => ({ ...p, email: "Enter a valid email address." }));
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setErrors((p) => ({ ...p, otp: "OTP must be exactly 6 digits." }));
      return;
    }
    setOtpPhase("verifying");
    try {
      const res = await fetch(`${API_BASE}/api/otp/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), otp }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.verified) {
        setOtpPhase("verified");
        setOtpMessage("OTP verified successfully.");
        setErrors((p) => ({ ...p, otp: undefined }));
      } else {
        setOtpPhase("idle");
        setOtpMessage((data && data.detail) || "Incorrect code. Please try again.");
      }
    } catch {
      setOtpPhase("idle");
      setOtpMessage("Could not reach the server. Please try again.");
    }
  };

  const goStep2 = () => {
    const e: Errors = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (!form.dob) e.dob = "Date of birth is required.";
    else if (new Date(form.dob) > new Date()) e.dob = "Date of birth cannot be in the future.";
    else if (ageOf(form.dob) < 18) e.dob = "You must be at least 18 to activate a SIM.";
    if (!form.postcode.trim()) e.postcode = "Postcode is required.";
    if (!form.otp.trim()) e.otp = "OTP is required.";
    else if (!/^\d{6}$/.test(form.otp.trim())) e.otp = "OTP must be exactly 6 digits.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!otpVerified) {
      setServerError("Please verify your OTP to continue.");
      return;
    }
    setServerError(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Live Transatel ICCID check (unchanged)
  const runSimCheck = async (raw: string) => {
    const serial = raw.replace(/\s+/g, "");
    if (!/^\d{13,20}$/.test(serial)) {
      setSimCheck("idle");
      setSimMsg(null);
      return;
    }
    setSimCheck("checking");
    setSimMsg("Checking this SIM with Transatel…");
    try {
      const res = await fetchSubscriber(serial);
      if (res.found) {
        setSimCheck("found");
        setSimMsg("SIM recognised by Transatel.");
      } else if (res.error) {
        setSimCheck("error");
        setSimMsg(res.error);
      } else {
        setSimCheck("notfound");
        setSimMsg("This SIM isn't recognised yet. Double-check the number, or it may not be provisioned.");
      }
    } catch {
      setSimCheck("error");
      setSimMsg("Couldn't reach the SIM lookup service. You can still submit.");
    }
  };

  const submit = async () => {
    setServerError(null);
    const e: Errors = {};
    const serial = form.simSerial.replace(/\s+/g, "");
    if (!serial) e.simSerial = "SIM serial number is required.";
    else if (!/^\d{18,22}$/.test(serial)) e.simSerial = "SIM serial (ICCID) must be 18–22 digits.";
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.country.trim()) e.country = "Country is required.";
    if (!confirmed) e.confirm = "Please confirm that these details are correct.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/activate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // the fields the backend accepts today
          username: form.email.trim().split("@")[0],
          email: form.email.trim(),
          otp: form.otp.trim(),
          simSerial: form.simSerial,
          title: form.title,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dob: form.dob,
          // The plan always comes from the customer's order (it can't be chosen here).
          zoikoPackage: orderPlan?.name || "From your order",
          country: form.country.trim(),
          postcode: form.postcode.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          // sent for the backend to start using (ignored today)
          activationType: type,
          orderNumber: form.orderNumber.trim(),
        }),
      });
      if (res.ok) {
        setSubmittedAt(
          new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/London" })
        );
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object") {
        const fe: Errors = {};
        for (const key of Object.keys(data)) {
          if (key in initialForm) {
            const msg = (data as Record<string, unknown>)[key];
            fe[key as keyof FormState] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          }
        }
        setErrors(fe);
        if (typeof data.detail === "string") setServerError(data.detail);
        else if (Object.keys(fe).length === 0) setServerError("Something went wrong. Please check your details and try again.");
      } else {
        setServerError(`Request failed (status ${res.status}). Please try again.`);
      }
    } catch {
      setServerError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startAgain = () => {
    setForm(initialForm);
    setErrors({});
    setConfirmed(false);
    setOtpPhase("idle");
    setOtpMessage(null);
    setSimCheck("idle");
    setSimMsg(null);
    setType("new_sim");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const typeLabel = TYPE_OPTIONS.find((o) => o.key === type)?.label ?? "";
  const serialDigits = form.simSerial.replace(/\s+/g, "");
  const simEnding = serialDigits.length >= 4 ? `•••• ${serialDigits.slice(-4)}` : "—";
  const maskedEmail = form.email.replace(/^(.).*(@.*)$/, "$1••••$2");

  const card = "rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-7";
  const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#E01C5B] hover:bg-[#c8164f] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-6 py-3 transition cursor-pointer";
  const btnOutline =
    "inline-flex items-center justify-center gap-2 rounded-full border border-[#E01C5B] text-[#E01C5B] hover:bg-[#E01C5B]/5 text-sm font-bold px-6 py-3 transition cursor-pointer";

  return (
    <div className="bg-[#F6F7FB] dark:bg-gray-900 dark:text-white">
      {/* Hero: London skyline + Zoiko phone (matches the Figma design) */}
      <section className="relative min-h-[360px] flex items-center overflow-hidden bg-[#5A002B]">
        <Image
          src="/images/D · Hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#6B0F52]/95 via-[#6B0F52]/60 to-transparent to-65%" />
        {/* Phone */}
        <div className="hidden md:block absolute right-[5%] lg:right-[9%] top-6 w-[250px] lg:w-[320px] z-10 pointer-events-none">
          <Image src="/images/div.as-phone_margin.png" alt="Zoiko Mobile SIM" width={450} height={430} priority className="w-full h-auto" />
        </div>
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-7 pt-10 pb-20">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">Activate Your SIM</h1>
          <p className="mt-2 text-lg font-semibold text-white">Set up your SIM in a few simple steps.</p>
          <p className="mt-3 max-w-[520px] text-sm text-white/90 leading-6">
            Activate a new SIM, a replacement SIM or your eSIM, and start using your Zoiko Mobile plan across the UK. Your service
            starts once we&apos;ve confirmed your activation.
          </p>
          <div className="mt-4 h-[3px] w-14 rounded bg-[#E01C5B]" />
        </div>
      </section>

      <div className="px-4 sm:px-6">
        <Stepper step={step} />

        <div className="mx-auto max-w-6xl mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ───────── Main column ───────── */}
          <div className={card}>
            {serverError && (
              <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {serverError}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#E01C5B] text-white font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0B3D2E] dark:text-white leading-tight">Verify your details</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">We need a few details to find your order and keep your account secure.</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                  <FieldBox label="Email address" htmlFor="email" required error={errors.email}>
                    <input id="email" name="email" type="email" value={form.email} onChange={onText} disabled={otpVerified} placeholder="e.g. you@example.com" className={inputCls(!!errors.email, otpVerified)} />
                  </FieldBox>
                  <FieldBox label="Order number (optional)" htmlFor="orderNumber">
                    <input id="orderNumber" name="orderNumber" value={form.orderNumber} onChange={onText} placeholder="e.g. ZM123456789" className={inputCls()} />
                  </FieldBox>
                  <FieldBox label="Date of birth" htmlFor="dob" required error={errors.dob}>
                    <input id="dob" name="dob" type="date" value={form.dob} onChange={onText} className={inputCls(!!errors.dob)} />
                  </FieldBox>
                  <FieldBox label="Postcode" htmlFor="postcode" required error={errors.postcode}>
                    <input id="postcode" name="postcode" value={form.postcode} onChange={onText} placeholder="e.g. SW1A 1AA" className={inputCls(!!errors.postcode)} />
                  </FieldBox>
                </div>

                {/* OTP: same as before */}
                <div className="mt-5">
                  <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-[#0D1935] dark:text-gray-200">
                    OTP Code<span className="text-[#E01C5B]"> *</span>
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="otp"
                      name="otp"
                      value={form.otp}
                      onChange={onText}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      disabled={otpVerified}
                      aria-invalid={errors.otp ? true : undefined}
                      className={`${inputCls(!!errors.otp, otpVerified)} flex-1 border-dashed`}
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={otpPhase === "verifying" || otpVerified}
                      className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpPhase === "verifying" ? "Verifying…" : otpVerified ? "Verified" : "Verify OTP"}
                    </button>
                  </div>
                  <div className="mt-2.5 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                    <strong>Note:</strong> You will receive your OTP via email for eSIMs, or you can find your OTP printed directly on your
                    physical SIM package.
                  </div>
                  {errors.otp && <p className="mt-1 text-xs text-red-600">{errors.otp}</p>}
                  {otpMessage && (
                    <p className={`mt-2 text-sm ${otpVerified ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>{otpMessage}</p>
                  )}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <ShieldCheck className="w-6 h-6 text-[#0B3D2E] shrink-0" />
                  <div className="text-xs text-gray-700 flex-1">
                    <div className="text-sm font-bold text-[#0B3D2E]">Your details are secure</div>
                    We only use these details to find your order and confirm it&apos;s you. They&apos;re never shown in links or shared with
                    analytics.{" "}
                    <Link href="/privacy-policy" className="font-bold text-[#E01C5B] hover:underline">
                      How we use your information
                    </Link>
                  </div>
                  <Lock className="w-5 h-5 text-[#0B3D2E] shrink-0" />
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={goStep2} className={btnPrimary}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#E01C5B] text-white font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0B3D2E] dark:text-white leading-tight">Confirm your SIM</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Check your details, then enter the number printed on your SIM.</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0B3D2E]">Details verified</div>
                      <div className="text-xs text-gray-600 truncate">Confirmed with a code sent to {maskedEmail}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-[#E01C5B] hover:underline cursor-pointer shrink-0">
                    Change
                  </button>
                </div>

                {/* Your details (still needed by the activation request) */}
                <div className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-[#0D1935] dark:text-white mb-4">Your details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    <FieldBox label="Title" htmlFor="title" error={errors.title}>
                      <select id="title" name="title" value={form.title} onChange={onText} className={inputCls(!!errors.title)}>
                        {titleOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </FieldBox>
                    <div className="sm:col-span-2 rounded-2xl border border-[#E01C5B]/20 bg-[#E01C5B]/5 p-4">
                      <div className="text-[11px] font-bold tracking-wider text-gray-500">YOUR PLAN</div>
                      {orderPlan ? (
                        <>
                          <div className="text-lg font-extrabold text-[#0B3D2E] dark:text-white">{orderPlan.name}</div>
                          {orderPlan.detail && <div className="text-xs text-gray-600 dark:text-gray-300">{orderPlan.detail}</div>}
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#E01C5B]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#E01C5B]">
                            <Lock className="w-3 h-3" /> Linked to your order ({orderPlan.source})
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-[#0B3D2E] dark:text-white">Matched to your order</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Your plan comes from the order you placed. It can&apos;t be changed here. We&apos;ll confirm it when we activate your SIM.
                          </div>
                        </>
                      )}
                    </div>
                    <FieldBox label="First name" htmlFor="firstName" required error={errors.firstName}>
                      <input id="firstName" name="firstName" value={form.firstName} onChange={onText} className={inputCls(!!errors.firstName)} />
                    </FieldBox>
                    <FieldBox label="Last name" htmlFor="lastName" required error={errors.lastName}>
                      <input id="lastName" name="lastName" value={form.lastName} onChange={onText} className={inputCls(!!errors.lastName)} />
                    </FieldBox>
                    <div className="sm:col-span-2">
                      <FieldBox label="Address" htmlFor="address" required error={errors.address}>
                        <input id="address" name="address" value={form.address} onChange={onText} className={inputCls(!!errors.address)} />
                      </FieldBox>
                    </div>
                    <FieldBox label="City" htmlFor="city" required error={errors.city}>
                      <input id="city" name="city" value={form.city} onChange={onText} className={inputCls(!!errors.city)} />
                    </FieldBox>
                    <FieldBox label="Country" htmlFor="country" required error={errors.country}>
                      <input id="country" name="country" value={form.country} onChange={onText} className={inputCls(!!errors.country)} />
                    </FieldBox>
                  </div>
                </div>

                {/* SIM number */}
                <div className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-[#0D1935] dark:text-white">Enter your SIM number</h3>
                  <div className="mt-3">
                    <FieldBox
                      label="SIM number (ICCID)"
                      htmlFor="simSerial"
                      required
                      error={errors.simSerial}
                      hint="It's usually 19 or 20 digits and starts with 89."
                    >
                      <input
                        id="simSerial"
                        name="simSerial"
                        value={form.simSerial}
                        onChange={onText}
                        onBlur={(e) => runSimCheck(e.target.value)}
                        inputMode="numeric"
                        placeholder="8944 1234 5678 9012 345"
                        className={inputCls(!!errors.simSerial)}
                      />
                    </FieldBox>
                    {simMsg && (
                      <p
                        className={`mt-1 text-xs ${
                          simCheck === "found" ? "text-green-700" : simCheck === "notfound" || simCheck === "error" ? "text-amber-600" : "text-gray-500"
                        }`}
                      >
                        {simMsg}
                      </p>
                    )}
                    <Link href="/how-to-activate-sim-cards" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#E01C5B] hover:underline">
                      <CreditCard className="w-3.5 h-3.5" /> Where to find it
                    </Link>
                  </div>
                </div>

                {/* Review */}
                <div className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-[#0D1935] dark:text-white mb-2 inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#E01C5B]" /> Review &amp; confirm
                  </h3>
                  <dl className="text-sm">
                    {(
                      [
                        ["Activating", typeLabel],
                        ["SIM ending", simEnding],
                        ["Line", "New number: we'll confirm at activation"],
                        ["Plan", orderPlan?.name || "From your order"],
                        ["Service", "Starts once we confirm activation"],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-2.5 border-t border-gray-100 dark:border-gray-700 first:border-t-0">
                        <dt className="text-gray-500">{k}</dt>
                        <dd className="font-semibold text-[#0D1935] dark:text-white text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <label className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-3.5 py-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 accent-[#E01C5B]" />
                    I confirm these details are correct.
                  </label>
                  {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className={btnOutline}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={submit} disabled={submitting} className={btnPrimary}>
                    {submitting ? "Submitting…" : "Submit activation request"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#E01C5B] text-white font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0B3D2E] dark:text-white leading-tight">Activate &amp; track</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">We&apos;ll keep you updated by email. You can safely leave this page.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#E01C5B]/20 bg-[#E01C5B]/5 p-5 flex gap-4">
                  <span className="w-12 h-12 rounded-full bg-[#E01C5B] text-white flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold tracking-wider text-gray-500">REQUEST RECEIVED</div>
                    <div className="text-xl font-extrabold text-[#0D1935] dark:text-white">Your activation request has been received</div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      We&apos;ve received your request. We&apos;ll be in touch shortly, and we&apos;ll email you at {maskedEmail} when your service is active.
                    </p>
                  </div>
                </div>

                <ol className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                  {[
                    { t: "Request received", s: submittedAt || "", done: true },
                    { t: "Details matched", s: "We'll confirm", done: false },
                    { t: "Processing with our network partner", s: "Not yet", done: false },
                    { t: "Service active", s: "Not yet", done: false },
                  ].map((p, i) => (
                    <li key={p.t} className="flex flex-col items-center gap-1.5">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${p.done ? "bg-emerald-600 text-white" : "border-2 border-slate-300 text-slate-400"}`}>
                        {p.done ? <Check className="w-4 h-4" /> : i + 1}
                      </span>
                      <span className="font-bold text-[#0D1935] dark:text-white">{p.t}</span>
                      <span className="text-gray-500">{p.s}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-[#0D1935] dark:text-white mb-2">Request details</h3>
                  <dl className="text-sm">
                    {(
                      [
                        ["Activating", typeLabel],
                        ["SIM ending", simEnding],
                        ["Line", "New number: we'll confirm at activation"],
                        ["Plan", orderPlan?.name || "From your order"],
                        ["Submitted", submittedAt ? `${submittedAt} (UK time)` : "—"],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-2.5 border-t border-gray-100 dark:border-gray-700 first:border-t-0">
                        <dt className="text-gray-500">{k}</dt>
                        <dd className="font-semibold text-[#0D1935] dark:text-white text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                  <button type="button" onClick={startAgain} className={btnOutline}>
                    <RefreshCw className="w-4 h-4" /> Activate another SIM
                  </button>
                  <button type="button" onClick={() => router.push(isLoggedIn ? "/dashboard" : "/")} className={btnOutline}>
                    {isLoggedIn ? "Back to My Account" : "Back to home"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ───────── Side column ───────── */}
          <div className="flex flex-col gap-5">
            <TypePanel value={type} onChange={setType} disabled={step === 3} />
            <HelpPanel />
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <InfoCards />
        </div>
      </div>

      <TrustStrip />
      {!isLoggedIn && step === 1 && (
        <p className="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Already a customer?{" "}
          <Link href="/login" className="font-bold text-[#E01C5B] hover:underline">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}

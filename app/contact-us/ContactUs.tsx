"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, type ChangeEvent, type FocusEvent, type FormEvent } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS = [
  "General Enquiry",
  "Billing",
  "Technical Support",
  "Roaming & International",
  "Complaints",
  "Other",
] as const;

type SubjectOption = (typeof SUBJECT_OPTIONS)[number] | "";

const emergencies = [
  { title: "Lost or Stolen Phone", desc: "Call 333 immediately to suspend your service" },
  { title: "Network Emergency", desc: "Report critical network issues 24/7" },
  { title: "Fraud Alert", desc: "Report suspicious activity immediately" },
];

const responseTimes = [
  { label: "Phone Support", value: "Immediate" },
  { label: "Live Chat", value: "< 2 minutes" },
  { label: "Email", value: "< 24 hours" },
  { label: "Social Media", value: "< 4 hours" },
];

const offices = [
  {
    badge: null as string | null,
    name: "London Head Office",
    img: "/images/Contact form/Mask group.png",
    address: ["35 Berkeley Square, Mayfair", "London W1J 5BF"],
    phone: "+44 (0)207 646 399",
    email: "info@zoikomobile.co.uk",
    hours: "Mon-Fri 9AM-6PM",
  },
  {
    badge: "Regional Office",
    name: "Glasgow Office",
    img: "/images/Contact form/office.png",
    address: ["Suite 2G, 2nd Floor 48 West", "George Street, Glasgow G2 1BP"],
    phone: "+44 141 530 1560",
    email: "glasgow@zoikomobile.co.uk",
    hours: "Mon-Fri 9AM-5PM",
  },
  {
    badge: "Regional Office",
    name: "Cardiff Office",
    img: "/images/Contact form/cardiff.png",
    address: ["Portland House, 113-116 Blue", "Street, Cardiff CF10 5EQ"],
    phone: "+44 292 000 1374",
    email: "cardiff@zoikomobile.co.uk",
    hours: "Mon-Fri 9AM-5PM",
  },
];

const topics = [
  { icon: "/images/Contact form/💳.png", title: "Account & Billing", desc: "Payment methods, billing queries, and account management" },
  { icon: "/images/Contact form/📶.png", title: "Network & Coverage", desc: "Signal issues, network coverage, and connectivity problems" },
  { icon: "/images/Contact form/🌍.png", title: "Roaming & International", desc: "International calls, roaming setup, and data charges abroad" },
  { icon: "/images/Contact form/📞.png", title: "Call & Text Charges", desc: "Call rates, international charges, and premium services" },
  { icon: "/images/Contact form/📅.png", title: "Plans & Packages", desc: "Day pass options, roaming plans, and service upgrades" },
  { icon: "/images/Contact form/📱.png", title: "SIM & Device Setup", desc: "SIM activation, device configuration, and technical support" },
];

// ─── ICONS ───────────────────────────────────────────────────────────────────

const ic = "h-4 w-4 flex-shrink-0";
const Phone = () => (
  <svg className={`${ic} text-[#0e8f74]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.6a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2L7.5 9.5a12 12 0 007 7l1.3-1.7a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2A16 16 0 013 5z" />
  </svg>
);
const Chat = () => (
  <svg className={`${ic} text-[#0e8f74]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 01-11.3 7.3L4 21l1.7-5.7A8 8 0 1121 12z" />
  </svg>
);
const Mail = () => (
  <svg className={`${ic} text-[#0e8f74]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0l9 6 9-6" />
  </svg>
);
const Pin = () => (
  <svg className={`${ic} text-[#e6007e]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const Star = () => (
  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XCircleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const AlertIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

// ─── VALIDATION ───────────────────────────────────────────────────────────────

type FormFields = "name" | "email" | "phone" | "subject" | "message";

const validators: Record<FormFields, (v: string) => string | null> = {
  name: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Name is required.";
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    if (!/^[a-zA-Z\s'\-]+$/.test(trimmed)) return "Name can only contain letters, spaces, hyphens, and apostrophes.";
    return null;
  },
  email: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return "Enter a valid email address (e.g. you@example.com).";
    return null;
  },
  phone: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Phone number is required.";
    if (!/^[\+\d\s\-\(\)]{7,20}$/.test(trimmed)) return "Enter a valid phone number (7–20 digits, can include +, spaces, or dashes).";
    return null;
  },
  subject: (v) => {
    if (!v || !(SUBJECT_OPTIONS as readonly string[]).includes(v)) return "Please select a subject from the list.";
    return null;
  },
  message: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Message is required.";
    if (trimmed.length < 10) return "Message must be at least 10 characters.";
    if (trimmed.length > 2000) return "Message cannot exceed 2000 characters.";
    return null;
  },
};

// ─── TOAST ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | null;

type ToastState = {
  type: ToastType;
  title: string;
  description: string;
  visible: boolean;
};

const Toast = ({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) => {
  if (!toast.visible || !toast.type) return null;

  const styles: Record<Exclude<ToastType, null>, { bg: string; border: string; icon: string; iconBg: string; bar: string }> = {
    success: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: "text-emerald-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950",
      bar: "bg-emerald-500",
    },
    error: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-500",
      iconBg: "bg-red-50 dark:bg-red-950",
      bar: "bg-red-500",
    },
    warning: {
      bg: "bg-white dark:bg-gray-900",
      border: "border-amber-200 dark:border-amber-800",
      icon: "text-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-950",
      bar: "bg-amber-500",
    },
  };

  const s = styles[toast.type];
  const IconComponent = toast.type === "success" ? CheckCircleIcon : toast.type === "error" ? XCircleIcon : AlertIcon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-5 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border shadow-xl overflow-hidden
        ${s.bg} ${s.border}
        animate-[slideIn_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]`}
      style={{ animation: "slideIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards" }}
    >
      <style>{`
        @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
      `}</style>
      <div className="flex items-start gap-3 p-4">
        <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${s.iconBg} ${s.icon}`}>
          <IconComponent />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{toast.description}</p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-1 flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Auto-dismiss progress bar */}
      <div
        className={`h-0.5 ${s.bar}`}
        style={{ animation: "shrinkBar 4.5s linear forwards" }}
        aria-hidden="true"
      />
    </div>
  );
};

// ─── FORM STATE ───────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: SubjectOption;
  message: string;
  savePref: boolean;
  newsletter: boolean;
};

type FormErrors = Partial<Record<FormFields, string>>;
type TouchedFields = Partial<Record<FormFields, boolean>>;

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  savePref: false,
  newsletter: false,
};

const inputBase =
  "w-full rounded-lg border px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e8f74]/30 transition-colors dark:bg-gray-800 dark:text-white";

const inputValid = "border-gray-200 dark:border-gray-600";
const inputError = "border-red-400 focus:ring-red-300 dark:border-red-500";

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function ContactUs() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    type: null,
    title: "",
    description: "",
    visible: false,
  });

  const showToast = useCallback((type: Exclude<ToastType, null>, title: string, description: string) => {
    setToast({ type, title, description, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4800);
  }, []);

  const validateField = useCallback((field: FormFields, value: string): string | null => {
    return validators[field](value);
  }, []);

  const validateAll = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    const textFields: FormFields[] = ["name", "email", "phone", "subject", "message"];
    textFields.forEach((field) => {
      const err = validateField(field, form[field] as string);
      if (err) newErrors[field] = err;
    });
    return newErrors;
  }, [form, validateField]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    const name = target.name as FormFields;

    setForm((f) => ({ ...f, [name]: value }));

    // Clear error as user types (only if field was already touched)
    if (touched[name] && typeof value === "string") {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err ?? undefined }));
    }
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as FormFields;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, form[name] as string);
    setErrors((prev) => ({ ...prev, [name]: err ?? undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields touched
    const allTouched: TouchedFields = { name: true, email: true, phone: true, subject: true, message: true };
    setTouched(allTouched);

    const newErrors = validateAll();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast("warning", "Check your details", "Please fix the highlighted fields before sending.");
      return;
    }

    setIsSubmitting(true);

    // Build a clean, type-safe payload
    const payload = {
      name: form.name.trim(),           // string
      email: form.email.trim(),         // string (valid email)
      phone: form.phone.trim(),         // string (validated format)
      subject: form.subject as Exclude<SubjectOption, "">, // one of the enum values
      message: form.message.trim(),     // string (min 10 chars)
      savePref: form.savePref,          // boolean
      newsletter: form.newsletter,      // boolean
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact-us/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setForm(initialForm);
        setErrors({});
        setTouched({});
        showToast("success", "Message sent!", "We've received your message and will get back to you within 24 hours.");
      } else {
        // Handle structured backend validation errors
        if (data.errors && typeof data.errors === "object") {
          const backendErrors: FormErrors = {};
          Object.entries(data.errors).forEach(([key, msg]) => {
            if (key in validators) backendErrors[key as FormFields] = String(msg);
          });
          setErrors(backendErrors);
          showToast("error", "Submission failed", data.message || "Some fields are invalid. Please review and try again.");
        } else {
          showToast("error", "Submission failed", data.message || "Something went wrong. Please try again.");
        }
      }
    } catch {
      showToast("error", "Connection error", "We couldn't reach our servers. Check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClass = (field: FormFields) =>
    `${inputBase} ${touched[field] && errors[field] ? inputError : inputValid}`;

  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-800 dark:text-white">
      {/* Toast */}
      <Toast toast={toast} onDismiss={() => setToast((t) => ({ ...t, visible: false }))} />

      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
        <h1 className="font-extrabold text-[clamp(1.6rem,4.5vw,2.25rem)]">Have You Got Any Questions?</h1>
        <p className="mt-2 text-sm font-medium text-white/90">At Zoiko Mobile We Offer Solutions!</p>
        <p className="mt-1 text-sm text-white/80">
          We pride ourselves on providing tailored solutions within the shortest possible time
        </p>
      </section>

      {/* ─── Form + Sidebar ─── */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:px-8 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 dark:bg-gray-800 dark:text-white ring-gray-100 sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Get In Touch With Us</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            If you have any questions, at Zoiko Mobile we pride ourselves in providing tailored
            solutions within the shortest possible time.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Name <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="name" name="name" autoComplete="name"
                value={form.name} onChange={handleChange} onBlur={handleBlur}
                placeholder="Enter your full name"
                className={getFieldClass("name")}
                aria-invalid={!!(touched.name && errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {touched.name && errors.name && (
                <p id="name-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500" role="alert">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z"/></svg>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Email <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={form.email} onChange={handleChange} onBlur={handleBlur}
                placeholder="you@example.com"
                className={getFieldClass("email")}
                aria-invalid={!!(touched.email && errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {touched.email && errors.email && (
                <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500" role="alert">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z"/></svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Phone Number <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="phone" name="phone" type="tel" autoComplete="tel"
                value={form.phone} onChange={handleChange} onBlur={handleBlur}
                placeholder="+44 7700 900123"
                className={getFieldClass("phone")}
                aria-invalid={!!(touched.phone && errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {touched.phone && errors.phone && (
                <p id="phone-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500" role="alert">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z"/></svg>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <select
                id="subject" name="subject"
                value={form.subject} onChange={handleChange} onBlur={handleBlur}
                className={getFieldClass("subject")}
                aria-invalid={!!(touched.subject && errors.subject)}
                aria-describedby={errors.subject ? "subject-error" : undefined}
              >
                <option value="" disabled>Select a topic</option>
                {SUBJECT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {touched.subject && errors.subject && (
                <p id="subject-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500" role="alert">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z"/></svg>
                  {errors.subject}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Message <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <textarea
                id="message" name="message"
                value={form.message} onChange={handleChange} onBlur={handleBlur}
                placeholder="Describe your question or issue in detail..."
                rows={4}
                className={getFieldClass("message")}
                aria-invalid={!!(touched.message && errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
              />
              <div className="mt-1 flex items-start justify-between">
                {touched.message && errors.message ? (
                  <p id="message-error" className="flex items-center gap-1.5 text-xs text-red-500" role="alert">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 16z"/></svg>
                    {errors.message}
                  </p>
                ) : <span />}
                <span className={`text-xs ${form.message.length > 1800 ? "text-amber-500" : "text-gray-400"}`}>
                  {form.message.length}/2000
                </span>
              </div>
            </div>

            {/* Checkboxes */}
            <label className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <input
                type="checkbox" name="savePref" checked={form.savePref} onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#e6007e] focus:ring-[#e6007e]"
              />
              <span>Save my name, email, and website in this browser for future use</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <input
                type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#e6007e] focus:ring-[#e6007e]"
              />
              <span>Subscribe to our newsletter for updates and exclusive offers</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#e6007e] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Sending…
                </>
              ) : "Send Message"}
            </button>
          </form>
        </div>

        {/* Sidebar — unchanged */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 dark:bg-gray-800 dark:text-white ring-gray-100">
            <h3 className="border-b-2 border-[#1f9d6b] pb-3 text-base font-bold text-gray-800 dark:text-white">Quick Contact</h3>
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex items-center gap-2"><Phone /><p className="text-sm font-bold text-gray-800 dark:text-white">Call Us Now</p></div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400"><strong className="font-semibold">333</strong> (from Zoiko mobile)</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong className="font-semibold">0333 004 0333</strong> (other networks)</p>
                <span className="mt-2 inline-block rounded-full border border-[#1f9d6b]/40 px-3 py-1 text-xs font-medium text-[#0e8f74]">Available 24/7</span>
              </div>
              <div>
                <div className="flex items-center gap-2"><Chat /><p className="text-sm font-bold text-gray-800 dark:text-white">Live Chat</p></div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Instant support online</p>
                <span className="mt-2 inline-block rounded-full border border-[#1f9d6b]/40 px-3 py-1 text-xs font-medium text-[#0e8f74]">Available 24/7</span>
              </div>
              <div>
                <div className="flex items-center gap-2"><Mail /><p className="text-sm font-bold text-gray-800 dark:text-white">Email Support</p></div>
                <a href="mailto:help@zoikomobile.co.uk" className="mt-1 block text-sm text-gray-600 dark:text-gray-400 hover:text-[#0e8f74]">help@zoikomobile.co.uk</a>
                <span className="mt-2 inline-block rounded-full border border-[#1f9d6b]/40 px-3 py-1 text-xs font-medium text-[#0e8f74]">Response within 24 hours</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 dark:bg-gray-800 dark:text-white ring-gray-100">
            <h3 className="border-b-2 border-[#1f9d6b] pb-3 text-base font-bold text-gray-800 dark:text-white">Emergency Support</h3>
            <div className="mt-4 space-y-4">
              {emergencies.map((e) => (
                <div key={e.title} className="border-l-4 border-red-500 pl-3">
                  <p className="text-sm font-bold text-red-600">{e.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 dark:bg-gray-800 dark:text-white ring-gray-100">
            <h3 className="border-b-2 border-[#1f9d6b] pb-3 text-base font-bold text-gray-800 dark:text-white">Response Times</h3>
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
              {responseTimes.map((r) => (
                <div key={r.label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{r.label}</span>
                  <span className="text-sm font-bold text-[#0e8f74]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Office Locations ─── */}
      <section className="bg-white dark:bg-gray-800 dark:text-white px-4 py-14 sm:px-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.4rem,3.5vw,2rem)]">Our Office Locations</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {offices.map((o) => (
              <div key={o.name} className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-100">
                <div className="relative aspect-[16/9] w-full bg-gray-100">
                  <Image src={o.img} alt={o.name} fill sizes="(max-width: 500px) 100px, 33vw" className="object-cover" />
                  {o.badge && (
                    <span className="absolute left-3 top-3 rounded-md bg-[#1f9d6b] px-2.5 py-1 text-xs font-semibold text-white">
                      {o.badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">{o.name}</h3>
                  <div className="mt-3 flex items-start gap-2"><span className="mt-0.5"><Pin /></span><p className="text-sm text-gray-500">{o.address.join(", ")}</p></div>
                  <div className="mt-2 flex items-center gap-2"><Phone /><p className="text-sm text-gray-600 dark:text-gray-400">{o.phone}</p></div>
                  <div className="mt-2 flex items-center gap-2"><Mail /><a href={`mailto:${o.email}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#0e8f74]">{o.email}</a></div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400"><strong className="font-semibold">Hours:</strong> {o.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Most Asked Questions ─── */}
      <section className="bg-gray-50 dark:bg-gray-800 dark:text-white px-4 py-14 sm:px-6 md:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-extrabold text-gray-800 dark:text-white text-[clamp(1.4rem,3.5vw,2rem)]">Most Asked Questions</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Quick answers to common questions - get instant help!</p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <div key={t.title} className="flex flex-col items-center rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-sm ring-1 ring-gray-100">
                <Image src={t.icon} alt={t.title} width={40} height={40} className="h-10 w-10 object-contain" />
                <h3 className="mt-4 text-base font-bold text-gray-800 dark:text-white">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{t.desc}</p>
                <Link href="#" className="mt-4 text-sm font-semibold text-[#0e8f74] hover:underline">View Questions &rarr;</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─── */}
      <section className="bg-gray-50 dark:bg-gray-800 px-4 pb-16 sm:px-6 md:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm ring-1 ring-gray-100">
          <svg className="h-8 w-8 text-[#1f9d6b]/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 7H4a4 4 0 00-.5 8H7V7zm10 0h-3a4 4 0 00-.5 8H17V7z" />
          </svg>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Zoiko Mobile has completely changed the way I use my phone. With their exceptional data plans, I never have to worry about exceeding my usage limits. Their network coverage is also surprisingly reliable, allowing me to stay connected wherever I go. I highly recommend Zoiko Mobile to anyone seeking a hassle-free mobile experience without compromising on network quality.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="relative block h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
              <Image src="/images/Contact form/Zing C.png" alt="Zing C." fill sizes="44px" className="object-cover" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Zing C.</p>
              <p className="text-xs text-gray-400">Satisfied Customer</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <div className="flex gap-1">{[0,1,2,3,4].map((i) => <Star key={i} />)}</div>
            <p className="mt-2 text-xs text-gray-400">5.0 out of 5 stars</p>
          </div>
        </div>
      </section>
    </main>
  );
}
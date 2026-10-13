"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Nominee = {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    relationship: string;
};

type FormState = {
    fullName: string;
    email: string;
    phone: string;
    dob: string;
    employerName: string;
    jobTitle: string;
    workEmail: string;
    department: string;
    agreeTerms: "" | "yes" | "no";
    confirmPublicSector: "" | "yes" | "no";
    confirmAccurate: boolean;
};

type MainField = keyof FormState;
type NomineeField = Exclude<keyof Nominee, "id">;
type MainErrors = Partial<Record<MainField, string>>;
type NomineeErrors = Record<number, Partial<Record<NomineeField, string>>>;

type ToastState = { msg: string; type: "success" | "error" } | null;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MAX_NOMINEES = 5;
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public-sector-workers/`;

const initialForm: FormState = {
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    employerName: "",
    jobTitle: "",
    workEmail: "",
    department: "",
    agreeTerms: "",
    confirmPublicSector: "",
    confirmAccurate: false,
};

let nomineeIdCounter = 1;
const newNominee = (): Nominee => ({
    id: nomineeIdCounter++,
    fullName: "",
    email: "",
    phone: "",
    relationship: "",
});

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const NAME_RE = /^[a-zA-Z\s'\-.]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;

const digitCount = (v: string) => v.replace(/\D/g, "").length;

const validateName = (v: string, label = "Full name") => {
    const t = v.trim();
    if (!t) return `${label} is required.`;
    if (t.length < 2) return `${label} must be at least 2 characters.`;
    if (t.length > 100) return `${label} cannot exceed 100 characters.`;
    if (!NAME_RE.test(t)) return `${label} can only contain letters, spaces, hyphens, and apostrophes.`;
    return null;
};

const validateEmail = (v: string, label = "Email address") => {
    const t = v.trim();
    if (!t) return `${label} is required.`;
    if (!EMAIL_RE.test(t)) return `Enter a valid ${label.toLowerCase()} (e.g. you@example.com).`;
    return null;
};

const validatePhone = (v: string) => {
    const t = v.trim();
    if (!t) return "Phone number is required.";
    if (!PHONE_RE.test(t)) return "Phone number can only contain digits, spaces, +, - and brackets.";
    const d = digitCount(t);
    if (d < 10 || d > 14) return "Phone number must contain 10 to 14 digits.";
    return null;
};

const validateRequiredText = (v: string, label: string, max = 100) => {
    const t = v.trim();
    if (!t) return `${label} is required.`;
    if (t.length < 2) return `${label} must be at least 2 characters.`;
    if (t.length > max) return `${label} cannot exceed ${max} characters.`;
    return null;
};

const validateDob = (v: string) => {
    if (!v) return "Date of birth is required.";
    const dob = new Date(v);
    if (Number.isNaN(dob.getTime())) return "Enter a valid date of birth.";
    const today = new Date();
    if (dob > today) return "Date of birth cannot be in the future.";
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) return "You must be at least 18 years old to register.";
    if (age > 100) return "Enter a valid date of birth.";
    return null;
};

const validateMainField = (field: MainField, form: FormState): string | null => {
    switch (field) {
        case "fullName":
            return validateName(form.fullName);
        case "email":
            return validateEmail(form.email);
        case "phone":
            return validatePhone(form.phone);
        case "dob":
            return validateDob(form.dob);
        case "employerName":
            return validateRequiredText(form.employerName, "Employer's name");
        case "jobTitle":
            return validateRequiredText(form.jobTitle, "Job title");
        case "workEmail": {
            const err = validateEmail(form.workEmail, "Work email address");
            if (err) return err;
            if (form.workEmail.trim().toLowerCase() === form.email.trim().toLowerCase())
                return "Work email must be different from your personal email.";
            return null;
        }
        case "department":
            return validateRequiredText(form.department, "Department name");
        case "agreeTerms":
            if (form.agreeTerms !== "yes") return "You must agree to the terms and conditions to register.";
            return null;
        case "confirmPublicSector":
            if (form.confirmPublicSector !== "yes") return "This offer is only available to public sector workers.";
            return null;
        case "confirmAccurate":
            if (!form.confirmAccurate) return "Please confirm that the information provided is accurate.";
            return null;
    }
};

const isNomineeEmpty = (n: Nominee) =>
    !n.fullName.trim() && !n.email.trim() && !n.phone.trim() && !n.relationship.trim();

/** Empty nominee blocks are skipped. A partially filled block needs every field. */
const validateNominee = (
    n: Nominee,
    all: Nominee[],
    form: FormState,
): Partial<Record<NomineeField, string>> => {
    if (isNomineeEmpty(n)) return {};
    const errs: Partial<Record<NomineeField, string>> = {};

    const nameErr = validateName(n.fullName);
    if (nameErr) errs.fullName = nameErr;

    const emailErr = validateEmail(n.email);
    if (emailErr) errs.email = emailErr;
    else {
        const e = n.email.trim().toLowerCase();
        if (e === form.email.trim().toLowerCase() || e === form.workEmail.trim().toLowerCase())
            errs.email = "A nominee's email can't be the same as your own.";
        else if (all.some((o) => o.id !== n.id && o.email.trim().toLowerCase() === e))
            errs.email = "This email has already been added for another nominee.";
    }

    const phoneErr = validatePhone(n.phone);
    if (phoneErr) errs.phone = phoneErr;
    else {
        const p = n.phone.replace(/\D/g, "");
        if (p === form.phone.replace(/\D/g, ""))
            errs.phone = "A nominee's phone number can't be the same as your own.";
        else if (all.some((o) => o.id !== n.id && o.phone.replace(/\D/g, "") === p))
            errs.phone = "This phone number has already been added for another nominee.";
    }

    const relErr = validateRequiredText(n.relationship, "Relationship", 50);
    if (relErr) errs.relationship = relErr;

    return errs;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const inputBase =
    "w-full rounded-md border-2 bg-white px-3 py-2 text-sm text-gray-800 transition-colors focus:outline-none focus:border-[#17a589] focus:ring-2 focus:ring-[#17a589]/20 dark:bg-gray-800 dark:text-white";
const inputOk = "border-gray-200 dark:border-gray-600";
const inputBad = "border-red-400 focus:border-red-400 focus:ring-red-200";
const labelCls = "mb-1.5 block text-sm text-gray-700 dark:text-gray-300";
const sectionTitle =
    "border-b-2 border-[#17a589] pb-2.5 text-lg font-bold text-[#17a589] sm:text-xl";

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const FieldError = ({ id, msg }: { id: string; msg?: string }) =>
    msg ? (
        <p id={id} role="alert" className="mt-1 text-xs text-red-500">
            {msg}
        </p>
    ) : null;

type InputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    error?: string;
    type?: string;
    autoComplete?: string;
    inputMode?: "text" | "email" | "tel";
    max?: string;
    extraClass?: string;
};

const TextField = ({
    id,
    label,
    value,
    onChange,
    onBlur,
    error,
    type = "text",
    autoComplete,
    inputMode,
    max,
    extraClass = "",
}: InputProps) => (
    <div>
        <label htmlFor={id} className={labelCls}>
            {label}
        </label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            autoComplete={autoComplete}
            inputMode={inputMode}
            max={max}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`${inputBase} ${error ? inputBad : inputOk} ${extraClass}`}
        />
        <FieldError id={`${id}-error`} msg={error} />
    </div>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PublicSectorWorkersForm() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [nominees, setNominees] = useState<Nominee[]>(() => [newNominee()]);
    const [errors, setErrors] = useState<MainErrors>({});
    const [nomineeErrors, setNomineeErrors] = useState<NomineeErrors>({});
    const [touched, setTouched] = useState<Partial<Record<MainField, boolean>>>({});
    const [nomineeTouched, setNomineeTouched] = useState<Record<number, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const todayISO = new Date().toISOString().split("T")[0];

    useEffect(
        () => () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        },
        [],
    );

    const showToast = (msg: string, type: "success" | "error") => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 4500);
    };

    // ── Main fields ──

    const updateField = <K extends MainField>(field: K, value: FormState[K]) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            // Re-validate live once a field has been touched
            if (touched[field]) {
                setErrors((e) => ({ ...e, [field]: validateMainField(field, next) ?? undefined }));
            }
            // Work email depends on personal email
            if (field === "email" && touched.workEmail) {
                setErrors((e) => ({ ...e, workEmail: validateMainField("workEmail", next) ?? undefined }));
            }
            return next;
        });
    };

    const touchField = (field: MainField) => {
        setTouched((t) => ({ ...t, [field]: true }));
        setErrors((e) => ({ ...e, [field]: validateMainField(field, form) ?? undefined }));
    };

    // ── Nominees ──

    const updateNominee = (id: number, field: NomineeField, value: string) => {
        setNominees((prev) => {
            const next = prev.map((n) => (n.id === id ? { ...n, [field]: value } : n));
            if (nomineeTouched[id]) {
                const target = next.find((n) => n.id === id)!;
                setNomineeErrors((e) => ({ ...e, [id]: validateNominee(target, next, form) }));
            }
            return next;
        });
    };

    const touchNominee = (id: number) => {
        setNomineeTouched((t) => ({ ...t, [id]: true }));
        const target = nominees.find((n) => n.id === id);
        if (target) setNomineeErrors((e) => ({ ...e, [id]: validateNominee(target, nominees, form) }));
    };

    const addNominee = () => {
        if (nominees.length >= MAX_NOMINEES) return;
        setNominees((prev) => [...prev, newNominee()]);
    };

    const removeNominee = (id: number) => {
        setNominees((prev) => prev.filter((n) => n.id !== id));
        setNomineeErrors((e) => {
            const { [id]: _, ...rest } = e;
            return rest;
        });
        setNomineeTouched((t) => {
            const { [id]: _, ...rest } = t;
            return rest;
        });
    };

    // ── Submit ──

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const fields = Object.keys(initialForm) as MainField[];
        const newErrors: MainErrors = {};
        fields.forEach((f) => {
            const err = validateMainField(f, form);
            if (err) newErrors[f] = err;
        });

        const newNomineeErrors: NomineeErrors = {};
        nominees.forEach((n) => {
            const errs = validateNominee(n, nominees, form);
            if (Object.keys(errs).length) newNomineeErrors[n.id] = errs;
        });

        setTouched(Object.fromEntries(fields.map((f) => [f, true])));
        setNomineeTouched(Object.fromEntries(nominees.map((n) => [n.id, true])));
        setErrors(newErrors);
        setNomineeErrors(newNomineeErrors);

        if (Object.keys(newErrors).length || Object.keys(newNomineeErrors).length) {
            showToast("Please fix the highlighted fields before submitting.", "error");
            // Move focus to the first invalid field
            requestAnimationFrame(() => {
                const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
                firstInvalid?.focus();
                firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            return;
        }

        const payload = {
            full_name: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            date_of_birth: form.dob,
            employer_name: form.employerName.trim(),
            job_title: form.jobTitle.trim(),
            work_email: form.workEmail.trim().toLowerCase(),
            department: form.department.trim(),
            agree_terms: true,
            is_public_sector_worker: true,
            confirm_accurate: true,
            nominees: nominees
                .filter((n) => !isNomineeEmpty(n))
                .map((n) => ({
                    full_name: n.fullName.trim(),
                    email: n.email.trim().toLowerCase(),
                    phone: n.phone.trim(),
                    relationship: n.relationship.trim(),
                })),
        };

        // TODO: Backend endpoint not ready yet. Remove this block and
        // uncomment the fetch below once the API is available.
        console.log("Public sector registration payload:", payload);
        alert("Thank you! Your registration has been submitted successfully.");

        setForm(initialForm);
        setNominees([newNominee()]);
        setErrors({});
        setNomineeErrors({});
        setTouched({});
        setNomineeTouched({});
        window.scrollTo({ top: 0, behavior: "smooth" });

        // setIsSubmitting(true);
        // try {
        //     const res = await fetch(API_URL, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(payload),
        //     });
        //     const data = await res.json().catch(() => ({}));

        //     if (res.ok) {
        //         setForm(initialForm);
        //         setNominees([newNominee()]);
        //         setErrors({});
        //         setNomineeErrors({});
        //         setTouched({});
        //         setNomineeTouched({});
        //         window.scrollTo({ top: 0, behavior: "smooth" });
        //         showToast("Registration submitted. We'll email you once it's been reviewed.", "success");
        //         alert("Registration submitted. We'll email you once it's been reviewed.");
        //     } else {
        //         showToast(
        //             data.message || data.error || `Registration failed (error ${res.status}). Please try again.`,
        //             "error",
        //         );
        //         alert(`Registration failed (error ${res.status}). Please try again.`);
        //     }
        // } catch {
        //     showToast("We couldn't reach our servers. Check your connection and try again.", "error");
        //     alert("We couldn't reach our servers. Check your connection and try again.");
        // } finally {
        //     setIsSubmitting(false);
        // }
    };

    const err = (f: MainField) => (touched[f] ? errors[f] : undefined);
    const nErr = (id: number, f: NomineeField) =>
        nomineeTouched[id] ? nomineeErrors[id]?.[f] : undefined;

    // ── Render ──

    return (
        <main className="min-h-screen bg-[#f7f9fb] px-3 py-8 font-sans sm:px-6 sm:py-12 dark:bg-gray-900">
            {/* Toast */}
            {toast && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className={`fixed right-4 top-4 z-[9999] flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === "success"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-red-300 bg-red-50 text-red-700"
                        }`}
                >
                    <span className="flex-1">{toast.msg}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        aria-label="Dismiss notification"
                        className="opacity-60 hover:opacity-100"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="mx-auto max-w-[850px] overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:bg-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2aa36f] to-[#1f8489] px-5 py-6 text-center sm:py-8">
                    <h1 className="text-xl font-bold leading-snug text-white sm:text-2xl md:text-[28px]">
                        Zoiko Mobile Public Sector Worker&apos;s Registration Form
                    </h1>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-10 px-4 py-6 sm:px-9 sm:py-8">
                    {/* ── Personal Details ── */}
                    <section>
                        <h2 className={sectionTitle}>Personal Details</h2>
                        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                            <TextField
                                id="fullName"
                                label="Full Name"
                                autoComplete="name"
                                value={form.fullName}
                                onChange={(e) => updateField("fullName", e.target.value)}
                                onBlur={() => touchField("fullName")}
                                error={err("fullName")}
                            />
                            <TextField
                                id="email"
                                label="Email Address"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                onBlur={() => touchField("email")}
                                error={err("email")}
                            />
                            <TextField
                                id="phone"
                                label="Phone Number"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={form.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                onBlur={() => touchField("phone")}
                                error={err("phone")}
                            />
                            <TextField
                                id="dob"
                                label="Date of Birth"
                                type="date"
                                autoComplete="bday"
                                max={todayISO}
                                value={form.dob}
                                onChange={(e) => updateField("dob", e.target.value)}
                                onBlur={() => touchField("dob")}
                                error={err("dob")}
                                extraClass="bg-[#f0f4f8] text-gray-500 dark:bg-gray-700"
                            />
                        </div>
                    </section>

                    {/* ── Employment Details ── */}
                    <section>
                        <h2 className={sectionTitle}>Your Employment Details</h2>
                        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                            <TextField
                                id="employerName"
                                label="Employer’s Name"
                                autoComplete="organization"
                                value={form.employerName}
                                onChange={(e) => updateField("employerName", e.target.value)}
                                onBlur={() => touchField("employerName")}
                                error={err("employerName")}
                            />
                            <TextField
                                id="jobTitle"
                                label="Job Title"
                                autoComplete="organization-title"
                                value={form.jobTitle}
                                onChange={(e) => updateField("jobTitle", e.target.value)}
                                onBlur={() => touchField("jobTitle")}
                                error={err("jobTitle")}
                            />
                            <TextField
                                id="workEmail"
                                label="Your Work Email Address"
                                type="email"
                                inputMode="email"
                                value={form.workEmail}
                                onChange={(e) => updateField("workEmail", e.target.value)}
                                onBlur={() => touchField("workEmail")}
                                error={err("workEmail")}
                            />
                            <TextField
                                id="department"
                                label="Name of Your Department"
                                value={form.department}
                                onChange={(e) => updateField("department", e.target.value)}
                                onBlur={() => touchField("department")}
                                error={err("department")}
                            />
                        </div>
                    </section>

                    {/* ── Nominated Family and Friends ── */}
                    <section>
                        <h2 className={sectionTitle}>Nominated Family and Friends (up to {MAX_NOMINEES})</h2>

                        <div className="mt-4 space-y-4">
                            {nominees.map((n, index) => (
                                <fieldset
                                    key={n.id}
                                    className="relative rounded-md border-l-4 border-[#17a589] bg-[#f7f7f7] px-4 pb-4 pt-5 dark:bg-gray-700/50"
                                    onBlur={(e) => {
                                        // Validate the block once focus leaves it entirely
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) touchNominee(n.id);
                                    }}
                                >
                                    <legend className="sr-only">Nominee {index + 1}</legend>

                                    {nominees.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeNominee(n.id)}
                                            aria-label={`Remove nominee ${index + 1}`}
                                            className="absolute right-2 top-1.5 rounded px-1.5 text-lg leading-none text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                                        <TextField
                                            id={`nominee-${n.id}-fullName`}
                                            label="Full Name"
                                            value={n.fullName}
                                            onChange={(e) => updateNominee(n.id, "fullName", e.target.value)}
                                            onBlur={() => { }}
                                            error={nErr(n.id, "fullName")}
                                        />
                                        <TextField
                                            id={`nominee-${n.id}-email`}
                                            label="Email Address"
                                            type="email"
                                            inputMode="email"
                                            value={n.email}
                                            onChange={(e) => updateNominee(n.id, "email", e.target.value)}
                                            onBlur={() => { }}
                                            error={nErr(n.id, "email")}
                                        />
                                        <TextField
                                            id={`nominee-${n.id}-phone`}
                                            label="Phone Number"
                                            type="tel"
                                            inputMode="tel"
                                            value={n.phone}
                                            onChange={(e) => updateNominee(n.id, "phone", e.target.value)}
                                            onBlur={() => { }}
                                            error={nErr(n.id, "phone")}
                                        />
                                        <TextField
                                            id={`nominee-${n.id}-relationship`}
                                            label="Relationship to You"
                                            value={n.relationship}
                                            onChange={(e) => updateNominee(n.id, "relationship", e.target.value)}
                                            onBlur={() => { }}
                                            error={nErr(n.id, "relationship")}
                                        />
                                    </div>
                                </fieldset>
                            ))}
                        </div>

                        {nominees.length < MAX_NOMINEES ? (
                            <button
                                type="button"
                                onClick={addNominee}
                                className="mt-4 w-full rounded-md border border-[#17a589] bg-white py-1.5 text-sm font-bold text-[#17a589] transition-colors hover:bg-[#17a589] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#17a589]/30 dark:bg-transparent"
                            >
                                + Add More
                            </button>
                        ) : (
                            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                You&apos;ve added the maximum of {MAX_NOMINEES} nominees.
                            </p>
                        )}
                    </section>

                    {/* ── Terms and Conditions ── */}
                    <section>
                        <h2 className={sectionTitle}>Terms and Conditions</h2>
                        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="agreeTerms" className={labelCls}>
                                    I agree to the terms and conditions of this offer
                                </label>
                                <select
                                    id="agreeTerms"
                                    value={form.agreeTerms}
                                    onChange={(e) => updateField("agreeTerms", e.target.value as FormState["agreeTerms"])}
                                    onBlur={() => touchField("agreeTerms")}
                                    aria-invalid={!!err("agreeTerms")}
                                    aria-describedby={err("agreeTerms") ? "agreeTerms-error" : undefined}
                                    className={`${inputBase} ${err("agreeTerms") ? inputBad : inputOk}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                                <FieldError id="agreeTerms-error" msg={err("agreeTerms")} />
                            </div>

                            <div>
                                <label htmlFor="confirmPublicSector" className={labelCls}>
                                    I confirm that I am a public sector worker
                                </label>
                                <select
                                    id="confirmPublicSector"
                                    value={form.confirmPublicSector}
                                    onChange={(e) =>
                                        updateField("confirmPublicSector", e.target.value as FormState["confirmPublicSector"])
                                    }
                                    onBlur={() => touchField("confirmPublicSector")}
                                    aria-invalid={!!err("confirmPublicSector")}
                                    aria-describedby={err("confirmPublicSector") ? "confirmPublicSector-error" : undefined}
                                    className={`${inputBase} ${err("confirmPublicSector") ? inputBad : inputOk}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                                <FieldError id="confirmPublicSector-error" msg={err("confirmPublicSector")} />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 sm:items-start">
                            <label
                                htmlFor="confirmAccurate"
                                className="flex cursor-pointer flex-col items-center gap-2 text-sm text-gray-700 sm:items-start dark:text-gray-300"
                            >
                                <input
                                    id="confirmAccurate"
                                    type="checkbox"
                                    checked={form.confirmAccurate}
                                    onChange={(e) => {
                                        updateField("confirmAccurate", e.target.checked);
                                        setTouched((t) => ({ ...t, confirmAccurate: true }));
                                        setErrors((er) => ({
                                            ...er,
                                            confirmAccurate: e.target.checked
                                                ? undefined
                                                : "Please confirm that the information provided is accurate.",
                                        }));
                                    }}
                                    aria-invalid={!!err("confirmAccurate")}
                                    aria-describedby={err("confirmAccurate") ? "confirmAccurate-error" : undefined}
                                    className={`h-4 w-4 cursor-pointer rounded accent-[#17a589] ${err("confirmAccurate") ? "outline outline-2 outline-red-400" : ""
                                        }`}
                                />
                                <span className="text-center sm:text-left">
                                    By submitting this form, I confirm that the information provided is accurate.
                                </span>
                            </label>
                            <FieldError id="confirmAccurate-error" msg={err("confirmAccurate")} />
                        </div>
                    </section>

                    {/* ── Submit ── */}
                    <div className="px-0 sm:px-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#c2185b] to-[#e91e63] py-2.5 text-base text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting && (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            )}
                            {isSubmitting ? "Submitting..." : "Submit Your Registration"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
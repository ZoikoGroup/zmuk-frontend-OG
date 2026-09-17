"use client";

import { useState } from "react";

type FormData = {
    fullName: string;
    dob: string;
    email: string;
    mobile: string;

    institution: string;
    studentId: string;
    enrolmentStatus: string;
    graduationDate: string;

    plan: string;
    contractDuration: string;

    roaming: boolean;
    wifiCalling: boolean;
    esim: boolean;

    studentCard: File | null;

    term1: boolean;
    term2: boolean;
    term3: boolean;
    term4: boolean;
    term5: boolean;

    declaration: boolean;

    signature: string;
    declarationDate: string;
};

type Errors = {
    [key: string]: string;
};

const API_URL = "http://127.0.0.1:8000";

// ── Validation helpers (pure, module-scope) ──────────────────────────────────

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_MOBILE_RX = /^(\+44|0)7\d{9}$/;
const NAME_RX = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/; // letters (incl. accents), spaces, . ' -

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const ALLOWED_FILE_EXT = /\.(jpe?g|png|pdf)$/i;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Strip spaces/dashes/brackets so "+44 7438 848851" validates the same as
// "+447438848851" (the UK mobile regex expects no separators).
const cleanMobile = (value: string) => value.replace(/[\s()-]/g, "");

// Local-timezone YYYY-MM-DD (avoids the UTC off-by-one you get from toISOString).
const toISODate = (d: Date) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
};
const todayISO = () => toISODate(new Date());
const tomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODate(d);
};

const ageFrom = (dobISO: string) => {
    const dob = new Date(dobISO);
    const t = new Date();
    let age = t.getFullYear() - dob.getFullYear();
    const m = t.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < dob.getDate())) age--;
    return age;
};

function validateFile(file: File | null): string {
    if (!file) return "Please upload your student ID.";
    const typeOk =
        ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_FILE_EXT.test(file.name);
    if (!typeOk) return "Only JPG, PNG or PDF files are allowed.";
    if (file.size > MAX_FILE_BYTES) return "Maximum file size is 5MB.";
    return "";
}

// One rule per field — used for BOTH live (on-blur) checks and final submit,
// so the two can never disagree. Rules mirror the Django serializer.
function validateField(name: string, fd: FormData): string {
    switch (name) {
        case "fullName": {
            const v = fd.fullName.trim();
            if (!v) return "Please enter your full name.";
            if (v.length < 2) return "Name looks too short.";
            if (!NAME_RX.test(v))
                return "Name can only contain letters, spaces, apostrophes and hyphens.";
            return "";
        }
        case "dob": {
            if (!fd.dob) return "Please select your date of birth.";
            if (Number.isNaN(new Date(fd.dob).getTime()))
                return "Please enter a valid date.";
            if (fd.dob > todayISO()) return "Date of birth cannot be in the future.";
            const age = ageFrom(fd.dob);
            if (age < 16) return "Applicant must be at least 16 years old.";
            if (age > 100) return "Please double-check your date of birth.";
            return "";
        }
        case "email": {
            const v = fd.email.trim();
            if (!v) return "Email is required.";
            if (!EMAIL_RX.test(v)) return "Please enter a valid email address.";
            return "";
        }
        case "mobile": {
            const v = fd.mobile.trim();
            if (!v) return "Mobile number is required.";
            if (!UK_MOBILE_RX.test(cleanMobile(v)))
                return "Enter a valid UK mobile, e.g. +44 7123 456789 or 07123 456789.";
            return "";
        }
        case "institution": {
            const v = fd.institution.trim();
            if (!v) return "Institution name is required.";
            if (v.length < 2) return "Please enter a valid institution name.";
            return "";
        }
        case "studentId": {
            const v = fd.studentId.trim();
            if (!v) return "Student ID number is required.";
            if (v.length < 3) return "Student ID looks too short.";
            return "";
        }
        case "enrolmentStatus": {
            if (!fd.enrolmentStatus.trim())
                return "Please select your enrolment status.";
            return "";
        }
        case "graduationDate": {
            if (!fd.graduationDate) return "Expected graduation date is required.";
            // Serializer rejects a past date; require a future one for clarity.
            if (fd.graduationDate <= todayISO())
                return "Graduation date must be in the future.";
            return "";
        }
        case "plan": {
            if (!fd.plan) return "Please select a plan.";
            return "";
        }
        case "contractDuration": {
            if (!fd.contractDuration) return "Please select a contract duration.";
            return "";
        }
        case "studentCard":
            return validateFile(fd.studentCard);
        case "signature": {
            const v = fd.signature.trim();
            if (!v) return "Signature is required.";
            if (v.length < 2) return "Please type your full name to sign.";
            return "";
        }
        case "declarationDate": {
            if (!fd.declarationDate) return "Please select today's date.";
            if (fd.declarationDate > todayISO())
                return "Date cannot be in the future.";
            return "";
        }
        default:
            return "";
    }
}

// Order used to scroll to / focus the first invalid field. `focus` is the
// `name` of the element to jump to for that error key.
const FIELD_ORDER: { err: string; focus: string }[] = [
    { err: "fullName", focus: "fullName" },
    { err: "dob", focus: "dob" },
    { err: "email", focus: "email" },
    { err: "mobile", focus: "mobile" },
    { err: "institution", focus: "institution" },
    { err: "studentId", focus: "studentId" },
    { err: "enrolmentStatus", focus: "enrolmentStatus" },
    { err: "graduationDate", focus: "graduationDate" },
    { err: "plan", focus: "plan" },
    { err: "contractDuration", focus: "contractDuration" },
    { err: "studentCard", focus: "studentCard" },
    { err: "terms", focus: "term1" },
    { err: "declaration", focus: "declaration" },
    { err: "signature", focus: "signature" },
    { err: "declarationDate", focus: "declarationDate" },
];

export default function StudentDiscountApplication() {
    const initialFormData: FormData = {
        fullName: "",
        dob: "",
        email: "",
        mobile: "",

        institution: "",
        studentId: "",
        enrolmentStatus: "",
        graduationDate: "",

        plan: "",
        contractDuration: "",

        roaming: false,
        wifiCalling: false,
        esim: false,

        studentCard: null,

        term1: false,
        term2: false,
        term3: false,
        term4: false,
        term5: false,

        declaration: false,

        signature: "",
        declarationDate: todayISO(), // sensible default: today
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked =
            e.target instanceof HTMLInputElement ? e.target.checked : false;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        // Clear this field's error as the user edits. Terms share one error key.
        setErrors((prev) => ({
            ...prev,
            [name]: "",
            ...(name.startsWith("term") ? { terms: "" } : {}),
        }));
    };

    // Validate a single field when the user leaves it (live feedback).
    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name } = e.target;
        const msg = validateField(name, formData);
        setErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setFormData((prev) => ({ ...prev, studentCard: file }));
        setErrors((prev) => ({ ...prev, studentCard: validateFile(file) }));
    };

    const focusFirstError = (errs: Errors) => {
        const first = FIELD_ORDER.find((f) => errs[f.err]);
        if (!first) return;
        const el = document.querySelector<HTMLElement>(`[name="${first.focus}"]`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            // focus after the smooth scroll settles
            setTimeout(() => el.focus({ preventScroll: true }), 300);
        }
    };

    const validate = () => {
        const newErrors: Errors = {};

        [
            "fullName", "dob", "email", "mobile",
            "institution", "studentId", "enrolmentStatus", "graduationDate",
            "plan", "contractDuration", "studentCard",
            "signature", "declarationDate",
        ].forEach((name) => {
            const msg = validateField(name, formData);
            if (msg) newErrors[name] = msg;
        });

        if (
            !formData.term1 || !formData.term2 || !formData.term3 ||
            !formData.term4 || !formData.term5
        ) {
            newErrors.terms = "Please accept all terms and conditions.";
        }

        if (!formData.declaration) {
            newErrors.declaration = "Please accept the declaration.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            focusFirstError(newErrors);
            return false;
        }
        return true;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        try {
            const form = new FormData();

            form.append("full_name", formData.fullName.trim());
            form.append("dob", formData.dob);
            form.append("email", formData.email.trim());
            form.append("mobile", cleanMobile(formData.mobile)); // normalized, no spaces

            form.append("institution", formData.institution.trim());
            form.append("student_id_number", formData.studentId.trim());
            form.append("enrolment_status", formData.enrolmentStatus);
            form.append("graduation_date", formData.graduationDate);

            form.append("selected_plan", formData.plan);
            form.append("contract_duration", formData.contractDuration);

            form.append("roaming", String(formData.roaming));
            form.append("wifi_calling", String(formData.wifiCalling));
            form.append("esim", String(formData.esim));

            form.append("signature", formData.signature.trim());
            form.append("declaration_date", formData.declarationDate);

            if (formData.studentCard) {
                form.append("student_id_document", formData.studentCard);
            }

            const response = await fetch(`${API_URL}/api/student-discount/`, {
                method: "POST",
                body: form,
            });

            // Read as text first so a non-JSON page (404/500 HTML) doesn't blow up
            // JSON.parse and hide the real status.
            const rawBody = await response.text();
            let data: unknown = null;
            try {
                data = rawBody ? JSON.parse(rawBody) : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                // Map backend (snake_case) field errors back onto our fields.
                const fieldMap: Record<string, string> = {
                    full_name: "fullName",
                    student_id_number: "studentId",
                    enrolment_status: "enrolmentStatus",
                    graduation_date: "graduationDate",
                    selected_plan: "plan",
                    contract_duration: "contractDuration",
                    student_id_document: "studentCard",
                    declaration_date: "declarationDate",
                };

                if (data && typeof data === "object") {
                    const backendErrors: Errors = {};
                    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
                        const msg = Array.isArray(val) ? String(val[0]) : String(val);
                        backendErrors[fieldMap[key] ?? key] = msg;
                    }
                    setErrors((prev) => ({ ...prev, ...backendErrors }));
                    focusFirstError(backendErrors);
                    console.error("Backend rejected the application:", data);
                    alert("The server rejected the form. Please review the highlighted fields.");
                } else {
                    console.error(`HTTP ${response.status}`, rawBody);
                    alert(
                        `Submission failed (HTTP ${response.status}). ` +
                        "The endpoint may be wrong or the server errored — check the server logs."
                    );
                }
                return;
            }

            alert("Your application has been submitted successfully!");
            setFormData(initialFormData);
            setErrors({});
        } catch (error) {
            // Never reached the server (server down, DNS, or CORS blocking localhost:3001).
            console.error("Request failed before a response:", error);
            alert(
                "Could not reach the server. Check that the backend is running and that " +
                "CORS allows http://localhost:3001."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputBase =
        "w-full rounded-lg border bg-white dark:bg-zinc-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 transition";
    const inputClass = (field?: string) =>
        `${inputBase} ${errors[field ?? ""]
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-300 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
        }`;

    const ErrorText = ({ id, msg }: { id: string; msg?: string }) =>
        msg ? (
            <p id={id} className="mt-1 text-sm text-red-500">
                {msg}
            </p>
        ) : null;

    return (
        <>
            <main className="bg-gray-100 dark:bg-zinc-950 py-12 px-4">
                <div className="mx-auto max-w-6xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 py-8 text-center">
                        <h1 className="text-2xl md:text-4xl font-bold text-white">
                            Zoiko Mobile Student Discount Application
                        </h1>
                    </div>

                    <form onSubmit={onSubmit} noValidate className="p-6 md:p-10 space-y-14">

                        {/* PERSONAL */}
                        <section>
                            <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="font-semibold" htmlFor="fullName">Full Name *</label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={255}
                                        autoComplete="name"
                                        aria-invalid={!!errors.fullName}
                                        aria-describedby="err-fullName"
                                        className={inputClass("fullName")}
                                    />
                                    <ErrorText id="err-fullName" msg={errors.fullName} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="dob">DOB *</label>
                                    <input
                                        type="date"
                                        id="dob"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        max={todayISO()}
                                        aria-invalid={!!errors.dob}
                                        aria-describedby="err-dob"
                                        className={inputClass("dob")}
                                    />
                                    <ErrorText id="err-dob" msg={errors.dob} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="email">Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        autoComplete="email"
                                        aria-invalid={!!errors.email}
                                        aria-describedby="err-email"
                                        className={inputClass("email")}
                                    />
                                    <ErrorText id="err-email" msg={errors.email} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="mobile">Mobile Number *</label>
                                    <input
                                        id="mobile"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        inputMode="tel"
                                        maxLength={20}
                                        autoComplete="tel"
                                        placeholder="+44 **** ****1"
                                        aria-invalid={!!errors.mobile}
                                        aria-describedby="err-mobile"
                                        className={inputClass("mobile")}
                                    />
                                    <ErrorText id="err-mobile" msg={errors.mobile} />
                                </div>
                            </div>
                        </section>

                        {/* EDUCATION */}
                        <section>
                            <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
                                Education Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="font-semibold" htmlFor="institution">
                                        Name of Educational Institution *
                                    </label>
                                    <input
                                        id="institution"
                                        name="institution"
                                        value={formData.institution}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={255}
                                        aria-invalid={!!errors.institution}
                                        aria-describedby="err-institution"
                                        className={inputClass("institution")}
                                    />
                                    <ErrorText id="err-institution" msg={errors.institution} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="studentId">Student ID Number *</label>
                                    <input
                                        id="studentId"
                                        name="studentId"
                                        value={formData.studentId}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={100}
                                        aria-invalid={!!errors.studentId}
                                        aria-describedby="err-studentId"
                                        className={inputClass("studentId")}
                                    />
                                    <ErrorText id="err-studentId" msg={errors.studentId} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="enrolmentStatus">Enrolment Status *</label>
                                    <select
                                        id="enrolmentStatus"
                                        name="enrolmentStatus"
                                        value={formData.enrolmentStatus}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        aria-invalid={!!errors.enrolmentStatus}
                                        aria-describedby="err-enrolmentStatus"
                                        className={inputClass("enrolmentStatus")}
                                    >
                                        <option value="">Select enrolment status</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Distance / Online">Distance / Online</option>
                                        <option value="Foundation Year">Foundation Year</option>
                                        <option value="Postgraduate">Postgraduate</option>
                                    </select>
                                    <ErrorText id="err-enrolmentStatus" msg={errors.enrolmentStatus} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="graduationDate">
                                        Expected Graduation Date *
                                    </label>
                                    <input
                                        type="date"
                                        id="graduationDate"
                                        name="graduationDate"
                                        value={formData.graduationDate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min={tomorrowISO()}
                                        aria-invalid={!!errors.graduationDate}
                                        aria-describedby="err-graduationDate"
                                        className={inputClass("graduationDate")}
                                    />
                                    <ErrorText id="err-graduationDate" msg={errors.graduationDate} />
                                </div>
                            </div>
                        </section>

                        {/* PLAN SELECTION */}
                        <section>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* LEFT */}
                                <div>
                                    <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
                                        Plan Selection
                                    </h2>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="font-semibold" htmlFor="plan">
                                                Please select the desired Zoiko Mobile monthly plan *
                                            </label>
                                            <select
                                                id="plan"
                                                name="plan"
                                                value={formData.plan}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                aria-invalid={!!errors.plan}
                                                aria-describedby="err-plan"
                                                className={inputClass("plan")}
                                            >
                                                <option value="">Select Plan</option>
                                                <option value="1GB">Essence 1GB</option>
                                                <option value="3GB">Everyday+ 3GB</option>
                                                <option value="10GB">Freestyle 10GB</option>
                                                <option value="Business Booster">Business Booster</option>
                                            </select>
                                            <ErrorText id="err-plan" msg={errors.plan} />
                                        </div>

                                        <div>
                                            <label className="font-semibold block mb-4">
                                                Please indicate if you would like to include any additional features
                                            </label>

                                            <div className="space-y-3">
                                                <label className="flex items-center gap-3">
                                                    <input type="checkbox" name="roaming" checked={formData.roaming} onChange={handleChange} />
                                                    <span>Roaming Data (if available)</span>
                                                </label>

                                                <label className="flex items-center gap-3">
                                                    <input type="checkbox" name="wifiCalling" checked={formData.wifiCalling} onChange={handleChange} />
                                                    <span>WiFi Calling</span>
                                                </label>

                                                <label className="flex items-center gap-3">
                                                    <input type="checkbox" name="esim" checked={formData.esim} onChange={handleChange} />
                                                    <span>E-SIM (if available)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div>
                                    <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
                                        Contract Duration
                                    </h2>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="font-semibold" htmlFor="contractDuration">
                                                Select your preferred contract duration for the selected plan *
                                            </label>
                                            <select
                                                id="contractDuration"
                                                name="contractDuration"
                                                value={formData.contractDuration}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                aria-invalid={!!errors.contractDuration}
                                                aria-describedby="err-contractDuration"
                                                className={inputClass("contractDuration")}
                                            >
                                                <option value="">Select Contract Duration</option>
                                                <option value="12">12 Months</option>
                                                <option value="24">24 Months</option>
                                                <option value="30">30 Days</option>
                                            </select>
                                            <ErrorText id="err-contractDuration" msg={errors.contractDuration} />
                                        </div>

                                        <div>
                                            <label className="font-semibold" htmlFor="studentCard">
                                                Please upload a scanned or clear photo of your student ID card *
                                            </label>
                                            <input
                                                type="file"
                                                id="studentCard"
                                                name="studentCard"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={handleFileChange}
                                                aria-invalid={!!errors.studentCard}
                                                aria-describedby="err-studentCard"
                                                className={`${inputClass("studentCard")} file:mr-4 file:rounded-md file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-700`}
                                            />
                                            <p className="mt-1 text-xs text-gray-400">JPG, PNG or PDF · max 5MB</p>

                                            {formData.studentCard && !errors.studentCard && (
                                                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                                                    Selected: {formData.studentCard.name}
                                                </p>
                                            )}

                                            <ErrorText id="err-studentCard" msg={errors.studentCard} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* TERMS */}
                        <section>
                            <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
                                Terms and Conditions
                            </h2>

                            <div className="space-y-4">
                                <label className="flex gap-3 items-start">
                                    <input type="checkbox" name="term1" checked={formData.term1} onChange={handleChange} className="mt-1" />
                                    <span>The student discount is available only to registered students aged 16 or over at recognised educational institutions in the UK.</span>
                                </label>

                                <label className="flex gap-3 items-start">
                                    <input type="checkbox" name="term2" checked={formData.term2} onChange={handleChange} className="mt-1" />
                                    <span>I hereby declare that the information provided in this form is accurate and complete to the best of my knowledge.</span>
                                </label>

                                <label className="flex gap-3 items-start">
                                    <input type="checkbox" name="term3" checked={formData.term3} onChange={handleChange} className="mt-1" />
                                    <span>The discount is applicable to the specified monthly plans and contract durations.</span>
                                </label>

                                <label className="flex gap-3 items-start">
                                    <input type="checkbox" name="term4" checked={formData.term4} onChange={handleChange} className="mt-1" />
                                    <span>I will provide valid proof of enrolment or a student ID when requested.</span>
                                </label>

                                <label className="flex gap-3 items-start">
                                    <input type="checkbox" name="term5" checked={formData.term5} onChange={handleChange} className="mt-1" />
                                    <span>The discount will be applied for the duration of the selected contract.</span>
                                </label>
                            </div>

                            <ErrorText id="err-terms" msg={errors.terms} />
                        </section>

                        {/* Declaration */}
                        <section>
                            <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
                                Declaration
                            </h2>

                            <label className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    name="declaration"
                                    checked={formData.declaration}
                                    onChange={handleChange}
                                    className="mt-1"
                                />
                                <span className="leading-7 text-gray-700 dark:text-gray-300">
                                    I confirm that the information provided in this application is true and
                                    complete. I understand that Zoiko Mobile may request additional
                                    documentation to verify my student status and that providing false
                                    information may result in the cancellation of the student discount.
                                </span>
                            </label>

                            <ErrorText id="err-declaration" msg={errors.declaration} />
                        </section>

                        {/* Signature */}
                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="font-semibold" htmlFor="signature">Signature *</label>
                                    <input
                                        id="signature"
                                        name="signature"
                                        value={formData.signature}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        maxLength={255}
                                        placeholder="Type your full name"
                                        aria-invalid={!!errors.signature}
                                        aria-describedby="err-signature"
                                        className={inputClass("signature")}
                                    />
                                    <ErrorText id="err-signature" msg={errors.signature} />
                                </div>

                                <div>
                                    <label className="font-semibold" htmlFor="declarationDate">Date *</label>
                                    <input
                                        type="date"
                                        id="declarationDate"
                                        name="declarationDate"
                                        value={formData.declarationDate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        max={todayISO()}
                                        aria-invalid={!!errors.declarationDate}
                                        aria-describedby="err-declarationDate"
                                        className={inputClass("declarationDate")}
                                    />
                                    <ErrorText id="err-declarationDate" msg={errors.declarationDate} />
                                </div>
                            </div>
                        </section>

                        {/* Submit */}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-[#DA1658] text-sm md:text-base px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Submitting..." : "Submit Your Registration"}
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-700 dark:bg-emerald-900/20">
                            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Need Help?</h3>
                            <p className="mt-3 text-gray-600 dark:text-gray-300">
                                If you have any questions regarding your application or require assistance,
                                please contact the Zoiko Mobile Support Team.
                            </p>
                            <p className="mt-2 font-semibold text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                                Email: support@zoikomobile.co.uk
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ─── ICONS ─────────────────────────────────────────────────────────────────

const Eye = () => (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>);
const EyeOff = () => (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.2A9.5 9.5 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4M6.1 6.1A17 17 0 002 12s3.5 7 10 7a9.6 9.6 0 004-.9" /></svg>);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Pull a readable message out of a DRF error response (handles field errors + non_field_errors).
function parseError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.detail === "string") return obj.detail;
  if (Array.isArray(obj.non_field_errors)) return String(obj.non_field_errors[0]);
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length) return String(v[0]);
    if (typeof v === "string") return v;
  }
  return fallback;
}

const inputCx =
  "w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-[#e6007e] focus:outline-none focus:ring-1 focus:ring-[#e6007e] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelCx = "mb-1.5 block text-sm font-semibold text-[#0e8f74] dark:text-[#34d39e]";

function Alert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  if (!children) return null;
  const styles =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  return <div className={`mt-4 rounded-md border px-3 py-2 text-sm ${styles}`}>{children}</div>;
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
// Route: app/reset-password/[uid]/[token]/page.tsx
// Matches the link the backend emails out:
//   {frontend_origin}/reset-password/{uid}/{token}

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ uid: string; token: string }>();
  const uid = params?.uid;
  const token = params?.token;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const invalidLink = !uid || !token;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (invalidLink) {
      setError("This reset link is invalid. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/accounts/reset-password/${uid}/${token}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, password2: confirm }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "This reset link is invalid or has expired."));
        return;
      }
      setSuccess("Password reset successful. Redirecting to login…");
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10 dark:bg-gray-800">
        <div className="flex justify-center">
          <span className="relative block h-12 w-40">
            <Image src="/images/logo.png" alt="Zoiko Mobile" fill sizes="160px" className="object-contain" />
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-bold text-gray-800 dark:text-white">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a new password for your account.
        </p>

        {invalidLink ? (
          <Alert kind="error">
            This reset link is invalid. Please request a new one from the login page.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            <div>
              <label htmlFor="new-pass" className={labelCx}>New Password</label>
              <div className="relative">
                <input
                  id="new-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCx} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="confirm-pass" className={labelCx}>Confirm Password</label>
              <input
                id="confirm-pass"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCx}
                required
              />
            </div>

            <Alert kind="error">{error}</Alert>
            <Alert kind="success">{success}</Alert>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-md bg-[#e6007e] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a] disabled:opacity-60"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-semibold text-[#0e8f74] hover:underline dark:text-[#34d39e]"
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  );
}
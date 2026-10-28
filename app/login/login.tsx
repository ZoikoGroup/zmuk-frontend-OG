"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { validateEmail, validatePassword, validateName } from "../utils/validators";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, ShieldCheck, Heart, Radio } from "lucide-react";

// ─── CONFIG (PRESERVED ORIGINAL) ─────────────────────────────────────────────
// In .env.local:
//   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const AFTER_LOGIN = "/dashboard";

// Return to the page the user originally wanted (only same-site paths, to prevent open redirects)
function getRedirectPath(): string {
  if (typeof window === "undefined") return AFTER_LOGIN;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : AFTER_LOGIN;
}

// ─── AUTH HELPERS (PRESERVED ORIGINAL) ───────────────────────────────────────

type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bq_enrollment_id: string | null;
};

function setSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("zoiko_token", token);
  localStorage.setItem("zoiko_user", JSON.stringify(user));
  localStorage.removeItem("zoiko_logged_out");
  window.dispatchEvent(new Event("zoiko-auth"));
}

// Pull a readable message out of a DRF error response (handles field errors + non_field_errors).
function parseError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;
  if (Array.isArray(obj.non_field_errors)) return String(obj.non_field_errors[0]);
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length) return String(v[0]);
    if (typeof v === "string") return v;
  }
  return fallback;
}

// Read the user's details (email, name) from Google's ID token.
// The backend still verifies the token itself.
function decodeGoogleIdToken(token: string): { email?: string; given_name?: string; family_name?: string } {
  try {
    let base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    base64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ─── GOOGLE SIGN-IN COMPONENT (PRESERVED EXACT ORIGINAL) ─────────────────────

function GoogleSignIn({
  text,
  onSuccess,
  onError,
}: {
  text: "signin_with" | "signup_with";
  onSuccess: (res: CredentialResponse) => void;
  onError: () => void;
}) {
  if (!GOOGLE_CLIENT_ID) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Google sign-in isn&apos;t configured yet.</p>;
  }
  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      text={text}
      theme="outline"
      shape="rectangular"
      size="large"
      width="350"
      logo_alignment="center"
    />
  );
}

const GoogleG = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 16.8 35.5 11 29.7 11 22.5S16.8 9.5 24 9.5c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.6 3.6 29.6 1.5 24 1.5 12.4 1.5 3 10.9 3 22.5S12.4 43.5 24 43.5c11 0 20.5-8 20.5-21 0-1.4-.2-2.8-.9-4z"
    />
    <path
      fill="#FF3D00"
      d="M5.3 13.1l6.6 4.8C13.6 13.9 18.4 11 24 11c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.6 5.1 29.6 3 24 3 15.8 3 8.7 7.6 5.3 13.1z"
    />
    <path
      fill="#4CAF50"
      d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 36.1 26.7 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 40.4 16.2 45 24 45z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C41.8 35.7 45 30.4 45 24c0-1.4-.2-2.8-.9-3.5z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-5 w-5 fill-current text-black" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.77 1.05-1.84.93-2.92-.93.04-2.02.63-2.66 1.39-.57.65-1.06 1.74-.93 2.78 1.03.08 2.05-.53 2.66-1.25z" />
  </svg>
);

const tabs = ["Login", "Register", "Reset Password"] as const;
type Tab = (typeof tabs)[number];

// ─── PAGE (inner — must live under GoogleOAuthProvider) ─────────────────────────

function LoginInner() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Reset field
  const [resetEmail, setResetEmail] = useState("");

  // Show a banner when the user arrives from the email verification link (/login?verified=1)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setSuccess("Email verified — you can now log in.");
    }
  }, []);

  // Reset messages whenever the user switches tabs
  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setSuccess("");
  };

  // ─── GOOGLE SIGN-IN (PRESERVED ORIGINAL) ───
  // GoogleLogin returns a Google-signed ID token (JWT) as `credential`.
  // The backend verifies it against GOOGLE_CLIENT_ID and returns our own token.
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    const profile = decodeGoogleIdToken(idToken);
    if (!profile.email) {
      setError("Could not read your Google account email. Please try again.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/social-user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: idToken,
          email: profile.email,
          first_name: profile.given_name ?? "",
          last_name: profile.family_name ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseError(data, "Google login failed."));
        return;
      }
      setSession(data.token, data.user);
      router.push(getRedirectPath());
    } catch {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => setError("Google sign-in was cancelled or failed.");

  // ─── LOGIN (PRESERVED ORIGINAL) ───
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailCheck = validateEmail(loginEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid email address.");
      return;
    }
    if (!loginPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "Login failed. Check your credentials."));
        return;
      }
      setSession(data.token, data.user);
      router.push(getRedirectPath());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER (PRESERVED ORIGINAL) ───
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nameCheck = validateName(regName, "Full name");
    if (!nameCheck.isValid) {
      setError(nameCheck.error || "Please enter your full name.");
      return;
    }

    const emailCheck = validateEmail(regEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    const passCheck = validatePassword(regPassword);
    if (!passCheck.isValid) {
      setError(passCheck.error || "Password does not meet complexity requirements.");
      return;
    }

    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }

    // Split "Full Name" into first/last; use the email as the username.
    const parts = regName.trim().split(/\s+/);
    const firstName = parts.shift() ?? "";
    const lastName = parts.join(" ");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Used by the backend to build the verification link back to this site
          "X-Frontend-Origin": window.location.origin,
        },
        body: JSON.stringify({
          username: regEmail,
          email: regEmail,
          password: regPassword,
          password2: regConfirm,
          first_name: firstName,
          last_name: lastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "Registration failed."));
        return;
      }
      setSuccess("Account created. Check your email to verify your account before logging in.");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── RESET (FORGOT PASSWORD) (PRESERVED ORIGINAL) ───
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailCheck = validateEmail(resetEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Origin": window.location.origin,
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "Could not send reset link."));
        return;
      }
      setSuccess("If that email exists, a reset link has been sent.");
      setResetEmail("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-900 overflow-x-hidden font-sans">
      {/* ─── FULL BACKGROUND LIFESTYLE IMAGE ─── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/new home and header/Login.png"
          alt="Zoiko Mobile - Stay connected to what moves you"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Soft overlay on mobile screens for readability */}
        <div className="absolute inset-0 bg-black/20 lg:bg-transparent" />
      </div>

      {/* ─── MAIN CONTENT CONTAINER (1440px max) ─── */}
      <div className="relative z-10 max-w-[1440px] mx-auto min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12">
        {/* Top Header Row on Mobile/Tablet */}
        <div className="w-full flex items-center justify-between">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Image
              src="/images/zmuk-logo.png"
              alt="Zoiko Mobile Logo"
              width={220}
              height={70}
              className="h-10 sm:h-14 w-auto object-contain drop-shadow"
            />
          </Link>

          {/* Quick link back on small devices */}
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white/90 text-rose-600 px-3 py-1.5 rounded-full shadow border border-rose-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Website</span>
          </Link>
        </div>

        {/* ─── CENTRAL TWO-COLUMN GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8">
          {/* ─── LEFT COLUMN: BRAND HEADINGS & FLOATING CARDS ─── */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight leading-[1.15]">
              Stay connected to <br />
              <span className="text-[#e2175e]">what moves you.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 text-base sm:text-lg md:text-xl text-black/80 font-normal leading-relaxed max-w-lg">
              A wireless network for life, music, and the moments that matter.
            </p>

            {/* Floating Feature Pills */}
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row lg:flex-col gap-4">
              {/* Card 1: Made for life on the move */}
              <div className="w-full sm:w-80 h-20 bg-white rounded-3xl shadow-[0px_4px_16px_rgba(0,0,0,0.12)] p-3 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
                <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 text-[#e2175e] shadow-sm">
                  <Radio className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <span className="text-black text-lg sm:text-xl font-medium leading-tight">
                    Made for life on
                  </span>
                  <span className="text-black text-lg sm:text-xl font-medium leading-tight">
                    the move
                  </span>
                </div>
              </div>

              {/* Card 2: Rooted in music & animal love */}
              <div className="w-full sm:w-80 h-20 bg-white rounded-3xl shadow-[0px_4px_16px_rgba(0,0,0,0.12)] p-3 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 shadow-sm">
                  <Heart className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <span className="text-black text-lg sm:text-xl font-medium leading-tight">
                    Rooted in music &amp;
                  </span>
                  <span className="text-black text-lg sm:text-xl font-medium leading-tight">
                    animal love
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: FLOATING AUTH CARD & BACK BUTTON ─── */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center lg:items-end justify-center">
            {/* The Login Card */}
            <div className="w-full max-w-[513px] bg-white rounded-2xl shadow-[0px_10px_35px_rgba(0,0,0,0.18)] border border-black/5 overflow-hidden flex flex-col">
              {/* Card Header: Tabs */}
              <div className="w-full h-12 border-b border-black/10 grid grid-cols-3 relative">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTab(t)}
                    className={`h-full text-center text-sm sm:text-base font-medium transition-colors relative flex items-center justify-center cursor-pointer ${
                      tab === t ? "text-[#e2175e]" : "text-black/60 hover:text-black"
                    }`}
                  >
                    {t}
                    {tab === t && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-[#e2175e] rounded-sm" />
                    )}
                  </button>
                ))}
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 flex flex-col">
                {/* ─── LOGIN TAB ─── */}
                {tab === "Login" && (
                  <form onSubmit={handleLogin} className="flex flex-col" noValidate>
                    <h2 className="text-xl sm:text-2xl font-semibold text-black text-center">
                      Welcome back.
                    </h2>
                    <p className="text-sm sm:text-base text-black/80 text-center mt-1">
                      Sign in to your Zoiko Mobile account.
                    </p>

                    {/* Two Social Buttons: Google & Apple */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                      {/* Continue with Google (triggers Google OAuth popup) */}
                      <div className="relative h-11 w-full rounded-xl shadow-sm border border-black/10 bg-white hover:bg-neutral-50 flex items-center justify-center gap-2.5 px-3 transition-colors cursor-pointer overflow-hidden">
                        <div className="flex items-center gap-2.5 pointer-events-none">
                          <GoogleG />
                          <span className="text-black text-xs sm:text-sm font-normal">
                            Continue with Google
                          </span>
                        </div>

                        {GOOGLE_CLIENT_ID ? (
                          <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center scale-150">
                            <GoogleLogin
                              onSuccess={handleGoogleSuccess}
                              onError={handleGoogleError}
                              text="signin_with"
                              width="250"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setError("Google sign-in isn't configured yet.")}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Continue with Google"
                          />
                        )}
                      </div>

                      {/* Continue with Apple */}
                      <button
                        type="button"
                        onClick={() => {
                          setError("Coming soon");
                        }}
                        className="h-11 w-full rounded-xl shadow-sm border border-black/10 bg-white hover:bg-neutral-50 flex items-center justify-center gap-2.5 px-3 transition-colors cursor-pointer"
                      >
                        <AppleIcon />
                        <span className="text-black text-xs sm:text-sm font-normal">
                          Continue with Apple
                        </span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center my-5">
                      <div className="flex-1 border-t border-black/10" />
                      <span className="px-3 text-black/60 text-xs font-normal">
                        or sign in with email
                      </span>
                      <div className="flex-1 border-t border-black/10" />
                    </div>

                    {/* Alerts */}
                    {error && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                        {success}
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-email" className="text-black text-sm font-medium">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-11 pl-11 pr-4 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] focus:border-transparent transition-all placeholder:text-black/40"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col gap-1.5 mt-4">
                      <label htmlFor="login-pass" className="text-black text-sm font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="login-pass"
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full h-11 pl-11 pr-11 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] focus:border-transparent transition-all placeholder:text-black/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40 hover:text-black/70 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="w-4 h-4 rounded border-black/20 text-[#e2175e] focus:ring-[#e2175e]"
                        />
                        <span className="text-black/60 text-xs font-medium">
                          Remember me
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => switchTab("Reset Password")}
                        className="text-xs text-[#e2175e] hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 mt-5 bg-[#e2175e] hover:bg-[#c91250] text-white font-semibold text-base rounded-xl shadow-[0px_4px_12px_rgba(226,23,94,0.3)] transition-all cursor-pointer disabled:opacity-70"
                    >
                      {loading ? "Logging in..." : "Log In"}
                    </button>

                    {/* Security Footer Note */}
                    <div className="flex items-center justify-center gap-2 mt-4 text-black/60 text-xs font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Secure to Zoiko Mobile</span>
                    </div>
                  </form>
                )}

                {/* ─── REGISTER TAB (PRESERVED ORIGINAL FUNCTIONALITY) ─── */}
                {tab === "Register" && (
                  <form onSubmit={handleRegister} className="flex flex-col" noValidate>
                    <h2 className="text-xl sm:text-2xl font-semibold text-black text-center">
                      Create your account
                    </h2>
                    <p className="text-sm sm:text-base text-black/80 text-center mt-1">
                      Sign up to get started with Zoiko Mobile.
                    </p>

                    {/* Two Social Buttons: Google & Apple */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {/* Continue with Google */}
                      <div className="relative h-11 w-full rounded-xl shadow-sm border border-black/10 bg-white hover:bg-neutral-50 flex items-center justify-center gap-2.5 px-3 transition-colors cursor-pointer overflow-hidden">
                        <div className="flex items-center gap-2.5 pointer-events-none">
                          <GoogleG />
                          <span className="text-black text-xs sm:text-sm font-normal">
                            Continue with Google
                          </span>
                        </div>

                        {GOOGLE_CLIENT_ID ? (
                          <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center scale-150">
                            <GoogleLogin
                              onSuccess={handleGoogleSuccess}
                              onError={handleGoogleError}
                              text="signup_with"
                              width="250"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setError("Google sign-in isn't configured yet.")}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Continue with Google"
                          />
                        )}
                      </div>

                      {/* Continue with Apple */}
                      <button
                        type="button"
                        onClick={() => {
                          setError("Coming soon");
                        }}
                        className="h-11 w-full rounded-xl shadow-sm border border-black/10 bg-white hover:bg-neutral-50 flex items-center justify-center gap-2.5 px-3 transition-colors cursor-pointer"
                      >
                        <AppleIcon />
                        <span className="text-black text-xs sm:text-sm font-normal">
                          Continue with Apple
                        </span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-black/10" />
                      <span className="px-3 text-black/60 text-xs font-normal">
                        or register with email
                      </span>
                      <div className="flex-1 border-t border-black/10" />
                    </div>

                    {/* Alerts */}
                    {error && (
                      <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                        {success}
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label htmlFor="reg-name" className="text-black text-sm font-medium">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <User className="w-5 h-5" />
                        </div>
                        <input
                          id="reg-name"
                          type="text"
                          autoComplete="name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full h-11 pl-11 pr-4 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] placeholder:text-black/40"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5 mt-3">
                      <label htmlFor="reg-email" className="text-black text-sm font-medium">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          id="reg-email"
                          type="email"
                          autoComplete="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-11 pl-11 pr-4 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] placeholder:text-black/40"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5 mt-3">
                      <label htmlFor="reg-pass" className="text-black text-sm font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="reg-pass"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full h-11 pl-11 pr-11 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] placeholder:text-black/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40 hover:text-black/70 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5 mt-3">
                      <label htmlFor="reg-confirm" className="text-black text-sm font-medium">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="reg-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full h-11 pl-11 pr-11 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] placeholder:text-black/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40 hover:text-black/70 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Register Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 mt-5 bg-[#e2175e] hover:bg-[#c91250] text-white font-semibold text-base rounded-xl shadow-[0px_4px_12px_rgba(226,23,94,0.3)] transition-all cursor-pointer disabled:opacity-70"
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="mt-4 text-center text-xs text-black/60">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchTab("Login")}
                        className="text-[#e2175e] font-medium hover:underline cursor-pointer"
                      >
                        Log in
                      </button>
                    </p>
                  </form>
                )}

                {/* ─── RESET PASSWORD TAB (PRESERVED ORIGINAL FUNCTIONALITY) ─── */}
                {tab === "Reset Password" && (
                  <form onSubmit={handleReset} className="flex flex-col" noValidate>
                    <h2 className="text-xl sm:text-2xl font-semibold text-black text-center">
                      Reset your password
                    </h2>
                    <p className="text-sm sm:text-base text-black/80 text-center mt-1">
                      Enter your email and we&rsquo;ll send you a reset link.
                    </p>

                    {/* Alerts */}
                    {error && (
                      <div className="my-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="my-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                        {success}
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="flex flex-col gap-1.5 mt-4">
                      <label htmlFor="reset-email" className="text-black text-sm font-medium">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          id="reset-email"
                          type="email"
                          autoComplete="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-11 pl-11 pr-4 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#e2175e] placeholder:text-black/40"
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 mt-6 bg-[#e2175e] hover:bg-[#c91250] text-white font-semibold text-base rounded-xl shadow-[0px_4px_12px_rgba(226,23,94,0.3)] transition-all cursor-pointer disabled:opacity-70"
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <p className="mt-4 text-center text-xs text-black/60">
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => switchTab("Login")}
                        className="text-[#e2175e] font-medium hover:underline cursor-pointer"
                      >
                        Log in
                      </button>
                    </p>
                  </form>
                )}
              </div>

              {/* Card Footer: Policy Links & Copyright */}
              <div className="w-full h-11 bg-neutral-100/90 border-t border-black/5 px-4 sm:px-6 flex items-center justify-between text-[11px] sm:text-xs text-black/60">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link href="/privacy-policy" className="hover:text-black transition-colors">
                    Privacy
                  </Link>
                  <span>|</span>
                  <Link href="/terms-and-conditions" className="hover:text-black transition-colors">
                    Terms
                  </Link>
                  <span>|</span>
                  <Link href="/accessibility" className="hover:text-black transition-colors">
                    Accessibility
                  </Link>
                  <span>|</span>
                  <Link href="/faqs" className="hover:text-black transition-colors">
                    Help
                  </Link>
                </div>
                <span>&copy; 2026 Zoiko Mobile UK Inc.</span>
              </div>
            </div>

            {/* ─── "BACK TO WEBSITE" PILL BUTTON (BELOW CARD) ─── */}
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-44 h-10 bg-white/90 hover:bg-white text-[#e2175e] text-sm font-medium rounded-3xl shadow-[0px_4px_12px_rgba(0,0,0,0.15)] border border-[#e2175e] transition-all hover:scale-[1.02]"
              >
                Back to website
              </Link>
            </div>
          </div>
        </div>

        {/* Empty bottom spacer for balance */}
        <div className="hidden lg:block h-2" />
      </div>
    </div>
  );
}

// ─── LOGIN PROVIDER WRAPPER ──────────────────────────────────────────────────

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "not-configured"}>
      <LoginInner />
    </GoogleOAuthProvider>
  );
}

export { Login };

/* ─── PREVIOUS LOGIN IMPLEMENTATION (PRESERVED AS COMMENT) ─────────────────────
function PreviousLoginInner() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setSuccess("Email verified — you can now log in.");
    }
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setSuccess("");
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    const profile = decodeGoogleIdToken(idToken);
    if (!profile.email) {
      setError("Could not read your Google account email. Please try again.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/social-user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: idToken,
          email: profile.email,
          first_name: profile.given_name ?? "",
          last_name: profile.family_name ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(parseError(data, "Google login failed."));
        return;
      }
      setSession(data.token, data.user);
      router.push(getRedirectPath());
    } catch {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => setError("Google sign-in was cancelled or failed.");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailCheck = validateEmail(loginEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid email address.");
      return;
    }
    if (!loginPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "Login failed. Check your credentials."));
        return;
      }
      setSession(data.token, data.user);
      router.push(getRedirectPath());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nameCheck = validateName(regName, "Full name");
    if (!nameCheck.isValid) {
      setError(nameCheck.error || "Please enter your full name.");
      return;
    }

    const emailCheck = validateEmail(regEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    const passCheck = validatePassword(regPassword);
    if (!passCheck.isValid) {
      setError(passCheck.error || "Password does not meet complexity requirements.");
      return;
    }

    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }

    const parts = regName.trim().split(/\s+/);
    const firstName = parts.shift() ?? "";
    const lastName = parts.join(" ");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Origin": window.location.origin,
        },
        body: JSON.stringify({
          username: regEmail,
          email: regEmail,
          password: regPassword,
          password2: regConfirm,
          first_name: firstName,
          last_name: lastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "Registration failed."));
        return;
      }
      setSuccess("Account created. Check your email to verify your account before logging in.");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailCheck = validateEmail(resetEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/forgot-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Origin": window.location.origin,
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(parseError(data, "Could not send reset link."));
        return;
      }
      setSuccess("If that email exists, a reset link has been sent.");
      setResetEmail("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
}
────────────────────────────────────────────────────────────────────────────── */

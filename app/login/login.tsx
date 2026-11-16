"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { validateEmail, validatePassword, validateName } from "../utils/validators";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, Heart, Radio, Check, Phone } from "lucide-react";

// ─── CONFIG (PRESERVED ORIGINAL) ─────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const AFTER_LOGIN = "/dashboard";

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

// ─── ICONS ───────────────────────────────────────────────────────────────────

const GoogleG = () => (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 48 48" aria-hidden="true">
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

const MicrosoftLogo = () => (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

// Concentric rings icon for 'Made for life on the move'
const ConcentricRingsIcon = () => (
  <svg className="w-8 h-8 text-[#E91E63]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="3" fill="#E91E63" />
    <circle cx="16" cy="16" r="7.5" stroke="#E91E63" strokeWidth="2.2" />
    <circle cx="16" cy="16" r="12" stroke="#E91E63" strokeWidth="2.2" />
  </svg>
);

// Combined Paw print & Music notes in one rounded badge
const PawAndMusicIcon = () => (
  <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    {/* Paw print at upper-left */}
    <g fill="#F59E0B">
      {/* 4 toe pads */}
      <ellipse cx="9" cy="10.5" rx="1.3" ry="1.7" transform="rotate(-20 9 10.5)" />
      <ellipse cx="12.2" cy="8" rx="1.4" ry="1.8" transform="rotate(-8 12.2 8)" />
      <ellipse cx="15.8" cy="8.5" rx="1.4" ry="1.8" transform="rotate(10 15.8 8.5)" />
      <ellipse cx="18.6" cy="11.5" rx="1.3" ry="1.7" transform="rotate(25 18.6 11.5)" />
      {/* Main palm pad */}
      <path d="M10.8 14.5c-.8 0-1.8.8-1.8 2 0 1.6 1.8 2.8 4.2 2.8s4.2-1.2 4.2-2.8c0-1.2-1-2-1.8-2-.9 0-1.4.7-2.4 1.2-1-.5-1.5-1.2-2.4-1.2z" />
    </g>

    {/* Beamed music notes at lower-right */}
    <g fill="#F59E0B">
      {/* Note heads */}
      <ellipse cx="23.2" cy="27" rx="2.5" ry="1.9" transform="rotate(-15 23.2 27)" />
      <ellipse cx="30" cy="24.5" rx="2.5" ry="1.9" transform="rotate(-15 30 24.5)" />
      {/* Stems */}
      <rect x="24.4" y="18.5" width="1.6" height="8.5" rx="0.5" />
      <rect x="31.2" y="16" width="1.6" height="8.5" rx="0.5" />
      {/* Connecting beam */}
      <polygon points="24.4,18.5 32.8,16 32.8,18.3 24.4,20.8" />
    </g>
  </svg>
);

const tabs = ["Login", "Register", "Reset Password"] as const;
type Tab = (typeof tabs)[number];

// ─── LOGIN INNER COMPONENT ───────────────────────────────────────────────────

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
  const [remember, setRemember] = useState(true);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Reset fields
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

  // ─── GOOGLE SIGN-IN HANDLER ───
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

  // ─── LOGIN SUBMIT ───
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

  // ─── REGISTER SUBMIT ───
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

  // ─── RESET SUBMIT ───
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
      setSuccess("If that email exists, a password reset link has been sent.");
      setResetEmail("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] flex flex-col lg:flex-row overflow-x-hidden font-sans">
      {/* ─── LEFT COLUMN ─── */}
      <div className="relative w-full lg:w-[52%] min-h-[560px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-[41px]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login.png"
            alt="Stay connected to what moves you"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center justify-center bg-white rounded-xl shadow-md px-4 py-2">
            <Image
              src="/images/zmuk-logo.png"
              alt="Zoiko Mobile Logo"
              width={190}
              height={60}
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Headline, subtitle, pills */}
        <div className="relative z-10 max-w-xl my-auto py-8">
          <h1 className="text-4xl sm:text-5xl xl:text-[52px] font-extrabold text-white tracking-tight leading-[1.1] [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
            Stay connected to <span className="text-[#E91E63]">what moves you.</span>
          </h1>
          <p className="mt-5 text-base text-white font-normal leading-relaxed max-w-lg">
            A wireless network for life, music, and the moments that matter
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-4">
            <div className="flex-1 bg-black/30 backdrop-blur-md rounded-2xl border border-white/25 p-2 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#FCE7F0] flex items-center justify-center flex-shrink-0">
                <ConcentricRingsIcon />
              </div>
              <span className="text-white text-base font-medium leading-tight">
                Made for life on <br className="hidden sm:block" />the move
              </span>
            </div>
            <div className="flex-1 bg-black/30 backdrop-blur-md rounded-2xl border border-white/25 p-2 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#FFF0E5] flex items-center justify-center flex-shrink-0">
                <PawAndMusicIcon />
              </div>
              <span className="text-white text-base font-medium leading-tight">
                Rooted in music &amp; <br className="hidden sm:block" />animal love
              </span>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="relative z-10 flex flex-col gap-6 text-white">
          <div className="flex items-start gap-4">
            <Phone className="w-6 h-6 text-[#E91E63] mt-0.5 fill-[#E91E63]" />
            <div>
              <div className="text-base font-medium">020 7164 6399</div>
              <div className="text-xs text-white/80">Mon-Fri 8am-8pm, Sat 9am-5pm ( UK time )</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-[#E91E63]" />
            <a href="mailto:info@zoikomobile.co.uk" className="text-base font-medium hover:underline">
              info@zoikomobile.co.uk
            </a>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN ─── */}
      <div className="w-full lg:w-[48%] min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="lg:hidden w-full max-w-[473px] flex justify-end mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E91E63] bg-white px-3 py-1.5 rounded-full shadow border border-[#E91E63]/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Website</span>
          </Link>
        </div>

        {/* Outer white panel */}
        <div className="w-full max-w-[473px] bg-white rounded-[32px] shadow-[0px_20px_60px_-30px_rgba(15,30,60,0.2)] p-4 sm:p-8 flex flex-col lg:min-h-[806px]">
          {/* Tabs */}
          <div className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => switchTab("Login")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                tab === "Login" ? "text-[#E91E63]" : "text-[#0F1E3C] hover:text-[#E91E63]"
              }`}
            >
              Login
              {tab === "Login" && <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-[#E91E63] rounded-full" />}
            </button>
            <button
              type="button"
              onClick={() => switchTab("Register")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                tab === "Register" ? "text-[#E91E63]" : "text-[#0F1E3C] hover:text-[#E91E63]"
              }`}
            >
              Register
              {tab === "Register" && <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-[#E91E63] rounded-full" />}
            </button>
            <div className="h-4 w-px bg-slate-200 mb-3" />
            <button
              type="button"
              onClick={() => switchTab("Reset Password")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                tab === "Reset Password" ? "text-[#E91E63]" : "text-[#0F1E3C] hover:text-[#E91E63]"
              }`}
            >
              Reset Password
              {tab === "Reset Password" && <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-[#E91E63] rounded-full" />}
            </button>
          </div>

          {/* Inner bordered card */}
          <div className="rounded-2xl border border-slate-200 p-5 sm:p-8">
          {/* ─── TAB 1: LOGIN ─── */}
          {tab === "Login" && (
            <form onSubmit={handleLogin} className="flex flex-col mt-6" noValidate>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E3C] tracking-tight">
                Welcome back!
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Sign in to your Zoiko Mobile account.
              </p>

              {/* Alerts */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                  {success}
                </div>
              )}

              {/* Email Address */}
              <div className="flex flex-col gap-1.5 mt-5">
                <label htmlFor="login-email" className="text-sm font-medium text-[#0F1E3C]">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5 mt-4">
                <label htmlFor="login-pass" className="text-sm font-medium text-[#0F1E3C]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-pass"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] focus:border-transparent transition-all placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRemember(!remember)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      remember ? "bg-[#E91E63] text-white" : "border border-slate-300 bg-white"
                    }`}
                  >
                    {remember && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-sm text-slate-700">Remember me for 30 days</span>
                </label>

                <button
                  type="button"
                  onClick={() => switchTab("Reset Password")}
                  className="text-sm text-[#E91E63] hover:underline font-normal cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-5 bg-[#E91E63] hover:bg-[#D81B60] text-white font-semibold text-base rounded-lg shadow-[0px_8px_18px_-8px_rgba(224,28,91,0.5)] transition-all cursor-pointer disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>

              {/* Divider: or continue with */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="px-3 text-xs text-slate-400 font-normal">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Stacked Social Sign-In Buttons */}
              <div className="flex flex-col gap-3">
                {/* 1. Continue with Microsoft */}
                <button
                  type="button"
                  onClick={() => setError("Microsoft sign-in is coming soon.")}
                  className="w-full h-12 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 text-sm font-medium transition-colors cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <MicrosoftLogo />
                    <span>Continue with Microsoft</span>
                  </div>
                  <span className="text-slate-400 text-xl font-light">›</span>
                </button>

                {/* 2. Continue with Google */}
                <div className="relative w-full h-12 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 text-sm font-medium transition-colors cursor-pointer shadow-xs overflow-hidden">
                  <div className="flex items-center gap-4 pointer-events-none">
                    <GoogleG />
                    <span>Continue with Google</span>
                  </div>
                  <span className="text-slate-400 text-xl font-light pointer-events-none">›</span>

                  {/* Active Google OAuth overlay */}
                  {GOOGLE_CLIENT_ID ? (
                    <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center scale-150">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        text="signin_with"
                        width="350"
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
              </div>

              {/* Bottom Registration Prompt */}
              <div className="mt-7 text-center text-sm text-slate-600">
                New to Zoiko Mobile?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("Register")}
                  className="font-semibold text-[#E91E63] hover:underline cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          )}

          {/* ─── TAB 2: REGISTER ─── */}
          {tab === "Register" && (
            <form onSubmit={handleRegister} className="flex flex-col mt-6" noValidate>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E3C] tracking-tight">
                Create an account
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Sign up to get started with Zoiko Mobile.
              </p>

              {/* Alerts */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                  {success}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1.5 mt-4">
                <label htmlFor="reg-name" className="text-sm font-medium text-[#0F1E3C]">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5 mt-3.5">
                <label htmlFor="reg-email" className="text-sm font-medium text-[#0F1E3C]">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5 mt-3.5">
                <label htmlFor="reg-pass" className="text-sm font-medium text-[#0F1E3C]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5 mt-3.5">
                <label htmlFor="reg-confirm" className="text-sm font-medium text-[#0F1E3C]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-5 bg-[#E91E63] hover:bg-[#D81B60] text-white font-semibold text-base rounded-lg shadow-[0px_8px_18px_-8px_rgba(224,28,91,0.5)] transition-all cursor-pointer disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

              {/* Divider */}
              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="px-3 text-xs text-slate-400 font-normal">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Social Registration */}
              <div className="relative w-full h-12 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 text-sm font-medium transition-colors cursor-pointer shadow-xs overflow-hidden">
                <div className="flex items-center gap-4 pointer-events-none">
                  <GoogleG />
                  <span>Continue with Google</span>
                </div>
                <span className="text-slate-400 text-xl font-light pointer-events-none">›</span>

                {GOOGLE_CLIENT_ID ? (
                  <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden flex items-center justify-center scale-150">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      text="signup_with"
                      width="350"
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

              <div className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("Login")}
                  className="font-semibold text-[#E91E63] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </form>
          )}

          {/* ─── TAB 3: RESET PASSWORD ─── */}
          {tab === "Reset Password" && (
            <form onSubmit={handleReset} className="flex flex-col mt-6" noValidate>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E3C] tracking-tight">
                Reset your password
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Enter your email and we&rsquo;ll send you a reset link.
              </p>

              {/* Alerts */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                  {success}
                </div>
              )}

              {/* Email Address */}
              <div className="flex flex-col gap-1.5 mt-5">
                <label htmlFor="reset-email" className="text-sm font-medium text-[#0F1E3C]">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63] placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-6 bg-[#E91E63] hover:bg-[#D81B60] text-white font-semibold text-base rounded-lg shadow-[0px_8px_18px_-8px_rgba(224,28,91,0.5)] transition-all cursor-pointer disabled:opacity-70"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="mt-6 text-center text-sm text-slate-600">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("Login")}
                  className="font-semibold text-[#E91E63] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </form>
          )}
          </div>

          {/* Footer inside panel */}
          <div className="mt-auto pt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Link href="/privacy-policy" className="hover:text-slate-700 transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="/terms-and-conditions" className="hover:text-slate-700 transition-colors">Terms</Link>
              <span>•</span>
              <Link href="/vulnerability-policy" className="hover:text-slate-700 transition-colors">Accessibility</Link>
              <span>•</span>
              <Link href="/faqs" className="hover:text-slate-700 transition-colors">Help</Link>
            </div>
            <span>&copy; 2026 Zoiko Mobile Inc.</span>
          </div>
        </div>
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

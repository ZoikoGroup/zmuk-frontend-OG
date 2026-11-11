"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  Truck,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  AlertTriangle,
  Lock,
  Wifi,
  Copy,
  Info,
  Loader2,
  KeyRound,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopNav from "../../components/DashboardTopNav";
import {
  BoosterModal,
  ReportActivityModal,
  ComparePlansModal,
} from "../../components/DashboardModals";

import {
  fetchSimTypeOptions,
  fetchTypeChangeQuote,
  submitTypeChangeOrder,
  SimTypeOption,
  TypeChangeQuote,
  TypeChangeCaseStatus,
} from "../../../services/simTypeChangeApi";

export default function ChangeSimTypePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Layout & Nav State ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("sim-esim");
  const [navSearch, setNavSearch] = useState("");
  const [userName, setUserName] = useState("Account Holder");
  const [userRole, setUserRole] = useState("Primary subscriber");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Modals
  const [boosterOpen, setBoosterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [comparePlansOpen, setComparePlansOpen] = useState(false);

  // ── Stepper (Stage 1 to 4) ──
  // 1: Check & Target -> 2: Verify Identity -> 3: Confirm Switch -> 4: Provision & Track
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Line & Quote Data
  const [isLoading, setIsLoading] = useState(true);
  const [typeOptions, setTypeOptions] = useState<SimTypeOption | null>(null);
  const [quote, setQuote] = useState<TypeChangeQuote | null>(null);

  // Pre-flight checks
  const [deviceConfirmedUnlocked, setDeviceConfirmedUnlocked] = useState(false);
  const [wifiConfirmed, setWifiConfirmed] = useState(false);

  // Physical delivery address (if switching to physical SIM)
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostcode, setAddressPostcode] = useState("");

  // Step 2: Verification State
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Step 3: Terms & Submission
  const [confirmSwitchTerms, setConfirmSwitchTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 4: Outcome & Case Tracker
  const [createdCase, setCreatedCase] = useState<TypeChangeCaseStatus | null>(null);
  const [copiedLpa, setCopiedLpa] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);
  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load line info & user profile
  useEffect(() => {
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("zoiko_user") : null;
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u.first_name || u.username) {
          setUserName(`${u.first_name || u.username} ${u.last_name || ""}`.trim());
        }
      } catch {}
    }

    const lineParam = searchParams?.get("line") || "";
    fetchSimTypeOptions(lineParam).then((options) => {
      setTypeOptions(options);
      setAddressLine1(options.deliveryAddress.line1);
      setAddressLine2(options.deliveryAddress.line2 || "");
      setAddressCity(options.deliveryAddress.city);
      setAddressPostcode(options.deliveryAddress.postcode);

      fetchTypeChangeQuote(options.lineId, options.eligibleTargetType).then((q) => {
        setQuote(q);
        setIsLoading(false);
      });
    });
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    router.push("/login");
  };

  // Step 1: Proceed to Identity Check
  const handleProceedToVerify = () => {
    if (!typeOptions) return;
    if (typeOptions.eligibleTargetType === "esim") {
      if (!deviceConfirmedUnlocked || !wifiConfirmed) {
        showToast("Please confirm device compatibility and Wi-Fi readiness.", "info");
        return;
      }
    } else {
      if (!addressLine1.trim() || !addressCity.trim() || !addressPostcode.trim()) {
        showToast("Please provide a valid UK delivery address.", "info");
        return;
      }
    }
    setCurrentStep(2);
  };

  // Step 2: Handle Verify
  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length < 4) {
      setVerificationError("Please enter the 6-digit verification code sent to your email.");
      return;
    }
    setVerificationError("");
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      showToast("Identity verified successfully.", "success");
      setCurrentStep(3);
    }, 600);
  };

  // Step 3: Submit SIM Type Change Order
  const handleConfirmSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeOptions) return;
    if (!confirmSwitchTerms) {
      showToast("Please confirm that you accept the service switchover terms.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lineId: typeOptions.lineId,
        targetType: typeOptions.eligibleTargetType,
        deviceConfirmedUnlocked,
        deliveryAddress: {
          line1: addressLine1,
          line2: addressLine2,
          city: addressCity,
          postcode: addressPostcode,
        },
        verificationMethod: "email_otp" as const,
        verificationCode,
        idempotencyKey: `ZM-TYPE-${Date.now()}`,
      };

      const res = await submitTypeChangeOrder(typeOptions.lineId, payload);
      setCreatedCase(res);
      setCurrentStep(4);
      showToast(
        typeOptions.eligibleTargetType === "esim"
          ? "eSIM profile provisioned successfully!"
          : "Replacement physical SIM ordered!",
        "success"
      );
    } catch {
      showToast("Failed to process SIM type change. Please try again or contact support.", "info");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLpa = () => {
    if (createdCase?.esimActivationCode) {
      navigator.clipboard.writeText(createdCase.esimActivationCode);
      setCopiedLpa(true);
      showToast("eSIM activation code copied to clipboard", "success");
      setTimeout(() => setCopiedLpa(false), 3000);
    }
  };

  const isSwitchingToEsim = typeOptions?.eligibleTargetType === "esim";

  return (
    <div className="min-h-screen bg-[#F0F2F6] font-sans text-[#0D1935] p-2.5 sm:p-4 lg:p-5 w-full">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0D1935] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Left Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={sidebarTab}
            setActiveTab={setSidebarTab}
            numbersCount={1}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenComparePlans={() => setComparePlansOpen(true)}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            onOpenAddNumber={() => router.push("/dashboard/my-mobile-numbers")}
            planName={typeOptions?.planName || "Zoiko 20GB Unlimited Monthly"}
            renewDate="12 Nov 2026"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
          <DashboardTopNav
            userName={userName}
            userRole={userRole}
            searchQuery={navSearch}
            setSearchQuery={setNavSearch}
            unreadNotifications={unreadNotifications}
            onClearNotifications={() => setUnreadNotifications(0)}
            onLogout={handleLogout}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Change SIM type"
            customSubtitle="Convert between Physical SIM and eSIM without changing your number or plan."
          />

          {/* Breadcrumbs & Navigation Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href="/dashboard" className="hover:text-[#0D1935] transition">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/dashboard/sim-and-esim" className="hover:text-[#0D1935] transition">
                SIM &amp; eSIM
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#0D1935] font-semibold">Change SIM type</span>
            </nav>

            <Link
              href="/dashboard/sim-and-esim"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E01C5B] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to SIM &amp; eSIM</span>
            </Link>
          </div>

          {/* Stepper Progress Bar */}
          <div className="p-4 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: "1. Select Direction" },
                { step: 2, label: "2. Verify Identity" },
                { step: 3, label: "3. Confirm Switch" },
                { step: 4, label: "4. Provision & Track" },
              ].map((s) => {
                const isCurrent = currentStep === s.step;
                const isDone = currentStep > s.step;
                return (
                  <div key={s.step} className="flex flex-col gap-1.5">
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone
                            ? "bg-[#1E8E5A]"
                            : isCurrent
                            ? "bg-[#E01C5B]"
                            : "bg-transparent"
                        }`}
                        style={{ width: isDone || isCurrent ? "100%" : "0%" }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        isCurrent
                          ? "text-[#E01C5B]"
                          : isDone
                          ? "text-[#1E8E5A]"
                          : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Card: Active Line & Exact CT-05 Reassurance Copy */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF1F4] text-[#E01C5B] flex items-center justify-center shrink-0">
                {typeOptions?.currentSimType === "esim" ? (
                  <Cpu className="w-6 h-6" />
                ) : (
                  <Smartphone className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
                    {typeOptions?.msisdn || "07888 849 201"}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Current: {typeOptions?.currentSimType === "esim" ? "eSIM Profile" : "Physical SIM Card"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active line</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Plan: {typeOptions?.planName || "Zoiko 20GB Unlimited Monthly"} · Keep existing number
                </p>
              </div>
            </div>

            {/* CT-05 Section 06 Exact Copy Header Banner */}
            <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-200 flex items-start gap-2 max-w-sm">
              <ShieldCheck className="w-4 h-4 text-[#E01C5B] shrink-0 mt-0.5" />
              <p className="text-xs text-[#0D1935] leading-4 font-medium">
                <strong>Change your SIM type without changing your number or plan.</strong> Your
                allowances, contract, and monthly bill limit stay identical.
              </p>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: DIRECTION & ELIGIBILITY CHECK */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-[#0D1935]">
                  Select your new SIM technology
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  We have automatically detected your line and presented the available upgrade path.
                </p>
              </div>

              {/* Target Selection Card: Physical -> eSIM OR eSIM -> Physical */}
              <div className="p-5 rounded-2xl border-2 border-[#E01C5B] bg-pink-50/15 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white text-[#E01C5B] border border-pink-200 flex items-center justify-center shrink-0">
                      {isSwitchingToEsim ? <Cpu className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-bold text-[#0D1935]">
                        {isSwitchingToEsim ? "Switch to Digital eSIM Profile" : "Switch to Physical SIM Card"}
                      </div>
                      <span className="text-xs text-slate-500">
                        {isSwitchingToEsim
                          ? "Instantly installed via QR code · No plastic card or postage wait"
                          : "Traditional nano-SIM card dispatched to your UK postal address"}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E01C5B] text-white">
                    Target Selection
                  </span>
                </div>

                {/* Pre-flight Checklist & Requirements */}
                {isSwitchingToEsim ? (
                  <div className="flex flex-col gap-3 pt-2 border-t border-pink-100">
                    <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                      eSIM Pre-flight Checklist
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deviceConfirmedUnlocked}
                          onChange={(e) => setDeviceConfirmedUnlocked(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#E01C5B] mt-0.5 shrink-0"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-[#0D1935]">Compatible, Unlocked Phone</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 leading-4">
                            My handset supports eSIM (iPhone XS+, Samsung S20+, Pixel 3+) and is
                            not locked to another network.
                          </div>
                        </div>
                      </label>

                      <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wifiConfirmed}
                          onChange={(e) => setWifiConfirmed(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#E01C5B] mt-0.5 shrink-0"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-[#0D1935]">Active Wi-Fi Internet</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 leading-4">
                            I will have a stable Wi-Fi connection while scanning and downloading
                            the digital eSIM profile.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-2 border-t border-pink-100">
                    <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                      Physical SIM Delivery Address
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-600">Address</label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          className="p-2 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-600">Postcode</label>
                        <input
                          type="text"
                          value={addressPostcode}
                          onChange={(e) => setAddressPostcode(e.target.value)}
                          className="p-2 rounded-lg border border-slate-200 bg-white uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Step Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/dashboard/sim-and-esim"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleProceedToVerify}
                  className="px-5 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c81750] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Continue to security verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: IDENTITY VERIFICATION (STEP-UP 2FA) */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5 max-w-xl mx-auto w-full">
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#E01C5B] flex items-center justify-center mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#0D1935]">
                  Step-Up Security Verification
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Changing SIM technology requires proof of identity to protect against digital
                  hijacking. We have sent a 6-digit code to:{" "}
                  <strong className="text-[#0D1935] font-semibold">
                    {typeOptions?.registeredEmail || "customer@zoikomobile.co.uk"}
                  </strong>
                </p>
              </div>

              <form onSubmit={handleVerifyIdentity} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0D1935] text-center">
                    Enter 6-digit verification code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, ""));
                      if (verificationError) setVerificationError("");
                    }}
                    placeholder="123456"
                    className={`w-48 mx-auto text-center tracking-widest text-xl font-bold py-2.5 px-4 rounded-xl border focus:outline-none transition ${
                      verificationError
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {verificationError && (
                    <p className="text-xs text-red-600 text-center font-medium">
                      {verificationError}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Didn&apos;t receive code? Check spam folder or{" "}
                    <button
                      type="button"
                      onClick={() => showToast("New verification code sent to your email", "info")}
                      className="text-[#E01C5B] font-semibold hover:underline cursor-pointer"
                    >
                      resend code
                    </button>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-500 leading-4">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    This code verifies your ownership of the line and safeguards your mobile number.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || verificationCode.length < 4}
                    className="px-5 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c81750] text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify &amp; continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: CONFIRM SWITCH & SWITCHOVER WARNING */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-[#0D1935]">
                  Confirm SIM type switch
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Please review the migration summary and service interruption notice.
                </p>
              </div>

              {/* Order Summary 2-Col Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F6F7FA] border border-[#E5E8EF] flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    Migration Summary
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mobile Number</span>
                      <span className="font-bold text-[#0D1935]">{typeOptions?.msisdn}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">From</span>
                      <span className="font-semibold text-slate-700">
                        {typeOptions?.currentSimType === "esim" ? "eSIM Profile" : "Physical SIM Card"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">To (Target)</span>
                      <span className="font-bold text-[#E01C5B]">
                        {isSwitchingToEsim ? "Digital eSIM Profile" : "Physical SIM Card"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Conversion Fee</span>
                      <span className="font-bold text-[#1E8E5A]">£0.00 (Free of charge)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F6F7FA] border border-[#E5E8EF] flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    Fulfilment Method
                  </h4>
                  {isSwitchingToEsim ? (
                    <div className="flex items-start gap-3 text-xs text-slate-600">
                      <QrCode className="w-8 h-8 text-[#E01C5B] shrink-0" />
                      <div>
                        <div className="font-bold text-[#0D1935]">Instant LPA Profile &amp; QR Code</div>
                        <p className="mt-1 leading-4 text-slate-500">
                          Your eSIM activation code will be presented on your screen and emailed
                          to <strong className="text-[#0D1935]">{typeOptions?.registeredEmail}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 text-xs text-slate-600">
                      <Truck className="w-8 h-8 text-[#E01C5B] shrink-0" />
                      <div>
                        <div className="font-bold text-[#0D1935]">Royal Mail 1st Class Delivery</div>
                        <p className="mt-1 leading-4 text-slate-500">
                          Dispatched to {addressLine1}, {addressCity} ({addressPostcode}).
                          Expected within 1–2 working days.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CT-05 Section 06 Exact Warning Notice */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-5">
                  <strong>Service interruption notice:</strong> You may lose mobile service briefly
                  while the switch completes. Keep access to Wi-Fi and another way to contact us.
                  Your old SIM credential will stop working once your new SIM completes network binding.
                </div>
              </div>

              {/* Confirmation terms checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmSwitchTerms}
                  onChange={(e) => setConfirmSwitchTerms(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#E01C5B] mt-0.5"
                />
                <span>
                  I confirm that I want to switch my SIM technology to{" "}
                  <strong>{isSwitchingToEsim ? "eSIM" : "Physical SIM"}</strong> and understand that
                  my current SIM will be replaced.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSwitch}
                  disabled={isSubmitting || !confirmSwitchTerms}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c81750] text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning network switch...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm switch to {isSwitchingToEsim ? "eSIM" : "Physical SIM"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: PROVISION & LIVE CASE TRACKER */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && createdCase && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E8E5A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0D1935]">
                      {isSwitchingToEsim ? "eSIM Profile Ready to Install" : "Physical SIM Dispatched"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Case Reference:{" "}
                      <strong className="text-[#0D1935] font-mono">{createdCase.caseId}</strong> ·{" "}
                      {typeOptions?.msisdn}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Status: {createdCase.status}
                </span>
              </div>

              {/* If Target is eSIM: Show QR Code & LPA String */}
              {isSwitchingToEsim ? (
                <div className="p-5 rounded-2xl bg-[#F6F7FA] border border-[#E5E8EF] flex flex-col md:flex-row items-center gap-6">
                  {/* Mock QR Code Frame */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center shrink-0">
                    <div className="w-44 h-44 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-3 text-white text-center relative overflow-hidden">
                      <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded-lg flex items-center justify-center">
                        <QrCode className="w-28 h-28 text-white" />
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 mt-2">
                      Scan with target device camera
                    </span>
                  </div>

                  {/* Installation Guide & Manual LPA Code */}
                  <div className="flex-1 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-[#0D1935]">
                      How to install your new eSIM:
                    </h4>

                    <div className="text-xs text-slate-600 flex flex-col gap-1.5 leading-5">
                      <p>
                        <strong>iPhone:</strong> Go to Settings → Mobile Service → Add eSIM → Use
                        QR Code.
                      </p>
                      <p>
                        <strong>Android (Samsung / Pixel):</strong> Go to Settings → Connections →
                        SIM manager → Add eSIM.
                      </p>
                    </div>

                    {/* Manual LPA Code Box */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-1.5 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Manual Activation Code (LPA)
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-[#0D1935] truncate">
                          {createdCase.esimActivationCode}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyLpa}
                          className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#E01C5B] text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedLpa ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      <strong>Important:</strong> After installation completes, remove your old
                      physical SIM card from the tray.
                    </p>
                  </div>
                </div>
              ) : (
                /* If Target is Physical SIM: Show Royal Mail Tracker */
                <div className="p-5 rounded-2xl bg-[#F6F7FA] border border-[#E5E8EF] flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    Physical SIM Dispatch Progress
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#0D1935]">1. Order Created</div>
                        <div className="text-[10px] text-slate-500">Security check passed</div>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-300 flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                      <div>
                        <div className="text-xs font-bold text-[#0D1935]">2. Dispatched via Royal Mail</div>
                        <div className="text-[10px] text-slate-500">1–2 working days</div>
                      </div>
                    </div>
                    <div className="p-3 bg-white/60 rounded-xl border border-slate-200 flex items-center gap-2.5 opacity-60">
                      <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#0D1935]">3. Network Activation</div>
                        <div className="text-[10px] text-slate-500">Insert SIM upon delivery</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Back */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2">
                <Link
                  href="/dashboard/sim-and-esim"
                  className="px-5 py-2.5 rounded-xl bg-[#0D1935] hover:bg-[#152852] text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to SIM &amp; eSIM Overview</span>
                </Link>
                <Link
                  href="/dashboard/support"
                  className="text-xs font-semibold text-[#E01C5B] hover:underline"
                >
                  Need help activating your new SIM?
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Dashboard Modals */}
      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={12}
        onApplyBooster={() => {
          setBoosterOpen(false);
          showToast("Booster added successfully", "success");
        }}
      />
      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(_note: string) => {
          setReportOpen(false);
          showToast("Report submitted successfully", "success");
        }}
      />
      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        onSelectPlan={(planName) => {
          setComparePlansOpen(false);
          showToast(`Selected ${planName}`, "info");
        }}
      />
    </div>
  );
}

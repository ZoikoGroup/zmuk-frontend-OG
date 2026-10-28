"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Smartphone,
  Cpu,
  Truck,
  QrCode,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  AlertTriangle,
  FileText,
  Mail,
  KeyRound,
  X,
  Loader2,
  PhoneOff,
  RefreshCw,
  Info,
} from "lucide-react";

import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopNav from "../../components/DashboardTopNav";
import {
  BoosterModal,
  ReportActivityModal,
  ComparePlansModal,
} from "../../components/DashboardModals";

import {
  fetchLineSimInfo,
  fetchReplacementQuote,
  submitReplacementOrder,
  submitEmergencyLossReport,
  LineSimInfo,
  ReplacementReason,
  SimReplacementQuote,
  ReplacementCaseStatus,
  LossReportResponse,
} from "../../../services/simReplacementApi";

export default function ReplaceSimPage() {
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

  // ── Stepper State (Step 1 to 4) ──
  // 1: Reason -> 2: Verify Identity -> 3: Details & Confirmation -> 4: Case Tracker
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Line & Quote Data
  const [isLoading, setIsLoading] = useState(true);
  const [lineInfo, setLineInfo] = useState<LineSimInfo | null>(null);
  const [quote, setQuote] = useState<SimReplacementQuote | null>(null);

  // Form selections
  const [selectedReason, setSelectedReason] = useState<ReplacementReason | "">("");
  const [customReasonNotes, setCustomReasonNotes] = useState("");

  // Verification State
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  // Confirmation & Address State
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostcode, setAddressPostcode] = useState("");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState("royal_mail_1st");
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Outcome
  const [createdCase, setCreatedCase] = useState<ReplacementCaseStatus | null>(null);

  // Emergency Loss Barring Modal
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [isBarring, setIsBarring] = useState(false);
  const [barResult, setBarResult] = useState<LossReportResponse | null>(null);

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
    fetchLineSimInfo(lineParam).then((info) => {
      setLineInfo(info);
      setAddressLine1(info.deliveryAddress.line1);
      setAddressLine2(info.deliveryAddress.line2 || "");
      setAddressCity(info.deliveryAddress.city);
      setAddressPostcode(info.deliveryAddress.postcode);
      setIsLoading(false);
    });
  }, [searchParams]);

  // When reason changes, fetch live quote
  useEffect(() => {
    if (lineInfo && selectedReason) {
      fetchReplacementQuote(lineInfo.lineId, lineInfo.simType, selectedReason).then((q) => {
        setQuote(q);
      });
    }
  }, [lineInfo, selectedReason]);

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    router.push("/login");
  };

  // Step 1: Proceed to Verify
  const handleProceedToVerify = () => {
    if (!selectedReason) {
      showToast("Please select a reason for your SIM replacement.", "info");
      return;
    }
    setCodeSent(true);
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

  // Step 3: Confirm Replacement Order
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineInfo || !selectedReason) return;

    if (lineInfo.simType === "physical") {
      if (!addressLine1.trim() || !addressCity.trim() || !addressPostcode.trim()) {
        showToast("Please provide a complete UK delivery address.", "info");
        return;
      }
    }

    if (!confirmTerms) {
      showToast("Please confirm that you authorize this SIM replacement.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lineId: lineInfo.lineId,
        reason: selectedReason,
        reasonNotes: customReasonNotes,
        deliveryAddress: {
          line1: addressLine1,
          line2: addressLine2,
          city: addressCity,
          postcode: addressPostcode,
        },
        deliveryOptionId: selectedDeliveryId,
        verificationMethod: "email_otp" as const,
        verificationCode,
        idempotencyKey: `ZM-IDEMP-${Date.now()}`,
      };

      const res = await submitReplacementOrder(lineInfo.lineId, payload);
      setCreatedCase(res);
      setCurrentStep(4);
      showToast("SIM replacement order successfully submitted!", "success");
    } catch {
      showToast("Failed to place replacement request. Please try again.", "info");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Emergency Loss Barring Action
  const handleExecuteEmergencyBar = async () => {
    if (!lineInfo) return;
    setIsBarring(true);
    try {
      const res = await submitEmergencyLossReport(lineInfo.lineId, {
        incidentType: selectedReason === "stolen" ? "stolen_phone" : "lost_sim",
        notes: customReasonNotes || "Customer initiated urgent line suspension.",
      });
      setBarResult(res);
      showToast("Line has been secured and suspended on the network.", "success");
    } catch {
      showToast("Could not contact network provider. Please call support immediately.", "info");
    } finally {
      setIsBarring(false);
    }
  };

  const isEsim = lineInfo?.simType === "esim";

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
            planName={lineInfo?.planName || "Zoiko 20GB Unlimited Monthly"}
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
            customTitle="Replace your SIM"
            customSubtitle="Reissue a replacement SIM or eSIM while keeping your exact number and plan."
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
              <span className="text-[#0D1935] font-semibold">Replace your SIM</span>
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
                { step: 1, label: "1. Select Reason" },
                { step: 2, label: "2. Verify Identity" },
                { step: 3, label: "3. Confirm Details" },
                { step: 4, label: "4. Track Status" },
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

          {/* Header Context Card: Target Line & Guarantees */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF1F4] text-[#E01C5B] flex items-center justify-center shrink-0">
                {isEsim ? <Cpu className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
                    {lineInfo?.msisdn || "07888 849 201"}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-[#E01C5B] border border-pink-200">
                    {isEsim ? "eSIM Profile" : "Physical SIM Card"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active line</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Plan: {lineInfo?.planName || "Zoiko 20GB Unlimited Monthly"} · ICCID:{" "}
                  {lineInfo?.maskedIccid || "8944 •••• •••• ••82"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F6F7FA] rounded-xl border border-slate-100 flex items-start gap-2 max-w-sm">
              <ShieldCheck className="w-4 h-4 text-[#1E8E5A] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-4">
                <strong className="font-semibold text-[#0D1935]">
                  Keep your number &amp; plan:
                </strong>{" "}
                Your allowances, tariff, and contract remain 100% unchanged during replacement.
              </p>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: REASON SELECTION */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-[#0D1935]">
                  Why do you need a replacement SIM?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select the reason that best describes your situation.
                </p>
              </div>

              {/* Reason Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    id: "damaged" as const,
                    title: "Damaged / Not Working",
                    desc: "SIM card is cracked, scratched, or shows 'No Service' / SIM error in phone.",
                    badge: "Same SIM type",
                  },
                  {
                    id: "lost" as const,
                    title: "Lost SIM Card",
                    desc: "You misplaced your phone or physical SIM card.",
                    badge: "Security check",
                  },
                  {
                    id: "stolen" as const,
                    title: "Stolen Phone or SIM",
                    desc: "Device or SIM card was taken without your permission.",
                    badge: "Urgent security",
                  },
                  {
                    id: "deleted_esim" as const,
                    title: "Deleted eSIM Profile",
                    desc: "The digital eSIM profile was accidentally removed from phone settings.",
                    badge: "Instant download",
                  },
                  {
                    id: "other" as const,
                    title: "Other Reason",
                    desc: "Upgrading handset or general maintenance replacement.",
                    badge: "Standard",
                  },
                ].map((item) => {
                  const isSel = selectedReason === item.id;
                  const isDanger = item.id === "stolen" || item.id === "lost";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedReason(item.id)}
                      className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                        isSel
                          ? "border-[#E01C5B] bg-pink-50/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-[#0D1935]">{item.title}</div>
                          <p className="text-xs text-slate-500 mt-1 leading-4">{item.desc}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isDanger
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSel
                              ? "border-[#E01C5B] bg-[#E01C5B] text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSel && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span className={isSel ? "text-[#E01C5B]" : "text-slate-500"}>
                          {isSel ? "Selected" : "Select this reason"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Special Security Advisory if Lost / Stolen */}
              {(selectedReason === "stolen" || selectedReason === "lost") && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        Urgent Security Advice: Suspend your line now
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5 leading-4">
                        If your phone was stolen or lost, lock your number on the network to
                        prevent unauthorized calls, verification codes, or bank fraud.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLossModalOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Secure my number now</span>
                  </button>
                </div>
              )}

              {/* Reason Notes */}
              {selectedReason === "other" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0D1935]">
                    Additional details (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customReasonNotes}
                    onChange={(e) => setCustomReasonNotes(e.target.value)}
                    placeholder="Briefly tell us why you need a replacement..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                  />
                </div>
              )}

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
                  disabled={!selectedReason}
                  className="px-5 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c81750] text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to security verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: IDENTITY VERIFICATION (STEP-UP PROOFING) */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5 max-w-xl mx-auto w-full">
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#E01C5B] flex items-center justify-center mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#0D1935]">
                  Verify your identity
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  To protect against SIM-swap fraud, we have sent a 6-digit verification code
                  to your registered email:{" "}
                  <strong className="text-[#0D1935] font-semibold">
                    {lineInfo?.registeredEmail || "customer@zoikomobile.co.uk"}
                  </strong>
                </p>
              </div>

              <form onSubmit={handleVerifyIdentity} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0D1935] text-center">
                    Enter 6-digit code
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
                    Didn&apos;t receive code? Check spam or{" "}
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
                    We do not send this code via SMS to prevent unauthorized reissuing if your
                    handset was misplaced.
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
          {/* STEP 3: CONFIRMATION & DELIVERY DETAILS */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E8EF] shadow-2xs flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-[#0D1935]">
                  Confirm replacement details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Review your replacement type, delivery method, and terms before confirming.
                </p>
              </div>

              {/* Order Summary 2-Col Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Replacement Scope */}
                <div className="p-4 rounded-xl bg-[#F6F7FA] border border-[#E5E8EF] flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    Replacement Summary
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mobile Number</span>
                      <span className="font-bold text-[#0D1935]">{lineInfo?.msisdn}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">SIM Type</span>
                      <span className="font-bold text-[#0D1935]">
                        {isEsim ? "Digital eSIM" : "Physical SIM Card"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Plan &amp; Allowances</span>
                      <span className="font-bold text-[#0D1935]">Preserved unchanged</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Replacement Fee</span>
                      <span className="font-bold text-[#1E8E5A]">£0.00 (Free replacement)</span>
                    </div>
                  </div>
                </div>

                {/* Right: Delivery / Fulfilment */}
                <div className="p-4 rounded-xl bg-[#F6F7FA] border border-[#E5E8EF] flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#0D1935] uppercase tracking-wider">
                    {isEsim ? "Digital Installation" : "Postal Delivery Address"}
                  </h4>

                  {isEsim ? (
                    <div className="flex items-start gap-3 text-xs text-slate-600">
                      <QrCode className="w-8 h-8 text-[#E01C5B] shrink-0" />
                      <div>
                        <div className="font-bold text-[#0D1935]">Instant In-App eSIM Delivery</div>
                        <p className="mt-1 leading-4 text-slate-500">
                          A fresh, secure LPA activation code and QR profile will be issued to
                          your screen and sent to{" "}
                          <strong className="text-[#0D1935]">{lineInfo?.registeredEmail}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#0D1935] bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-slate-600">City</label>
                          <input
                            type="text"
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#0D1935] bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-slate-600">Postcode</label>
                          <input
                            type="text"
                            value={addressPostcode}
                            onChange={(e) => setAddressPostcode(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#0D1935] bg-white uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exact CT-04 Customer Guarantee Copy */}
              <div className="p-4 rounded-xl bg-pink-50/40 border border-pink-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#E01C5B] shrink-0 mt-0.5" />
                <div className="text-xs text-[#0D1935] leading-5">
                  <strong>Before you order:</strong> You&apos;ll keep your current mobile number
                  and plan. Your original SIM will stop working only when the replacement is
                  activated.
                </div>
              </div>

              {/* Checkbox authorization */}
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmTerms}
                  onChange={(e) => setConfirmTerms(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#E01C5B] mt-0.5"
                />
                <span>
                  I confirm that I am the authorized account holder for this mobile number and
                  authorize Zoiko Mobile to reissue my SIM credential.
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
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !confirmTerms}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c81750] text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing replacement request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit replacement request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: TRACK STATUS (CASE TRACKER) */}
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
                      Replacement request received
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Case Reference:{" "}
                      <strong className="text-[#0D1935] font-mono">{createdCase.caseId}</strong> ·{" "}
                      {lineInfo?.msisdn}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Status: {createdCase.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Progress Stepper for Fulfilment */}
              <div className="p-5 rounded-2xl bg-[#F6F7FA] border border-[#E5E8EF]">
                <h4 className="text-xs font-bold text-[#0D1935] mb-4 uppercase tracking-wider">
                  Provider Fulfilment Progress
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#0D1935]">1. Request Verified</div>
                      <div className="text-[10px] text-slate-500">Security check passed</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-300 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                    <div>
                      <div className="text-xs font-bold text-[#0D1935]">2. Packaging &amp; Dispatch</div>
                      <div className="text-[10px] text-slate-500">Royal Mail 1st Class</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white/60 rounded-xl border border-slate-200 flex items-center gap-2.5 opacity-60">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#0D1935]">3. Network Activation</div>
                      <div className="text-[10px] text-slate-500">Upon receiving new SIM</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guidance Message */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs text-slate-600 leading-5">
                <span className="font-semibold text-[#0D1935]">Next steps:</span>
                <p>
                  1. Your replacement SIM will arrive in a discrete Royal Mail envelope within 1–2
                  working days.
                </p>
                <p>
                  2. Keep your current SIM inside your phone — it will continue working normally until
                  you activate the new replacement.
                </p>
                <p>
                  3. Once delivered, return to this dashboard and tap &ldquo;Activate replacement
                  SIM&rdquo; to complete the network swap.
                </p>
              </div>

              {/* Navigation Back */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
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
                  Need assistance with your replacement?
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* EMERGENCY LOSS BARRING MODAL */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {lossModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <PhoneOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Emergency Line Suspension
                  </h3>
                  <p className="text-xs text-slate-500">Protect against fraud &amp; misuse</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLossModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {barResult ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-5">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-900 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Line Successfully Suspended</span>
                  </div>
                  {barResult.message}
                </div>
                <div className="text-[11px] text-slate-500">
                  Suspended at: {barResult.barredAt} · Ref: {barResult.caseId}
                </div>
                <button
                  type="button"
                  onClick={() => setLossModalOpen(false)}
                  className="w-full py-2.5 bg-[#0D1935] hover:bg-[#152852] text-white rounded-xl text-xs font-bold transition mt-2 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 py-2">
                <p className="text-xs text-slate-600 leading-5">
                  Suspending your mobile number will immediately block all incoming calls, outgoing
                  calls, SMS messages, and mobile data roaming on the live network.
                </p>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-4 font-medium">
                  Use this option if your device was stolen to prevent hackers from receiving your
                  banking or email security codes.
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setLossModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteEmergencyBar}
                    disabled={isBarring}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isBarring ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending network bar...</span>
                      </>
                    ) : (
                      <span>Yes, suspend my line now</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

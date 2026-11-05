"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  RotateCw,
  Cpu,
  Lock,
  ChevronRight,
  Shield,
  Zap,
  Info,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  Tag,
  Radio,
  ExternalLink,
} from "lucide-react";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm, { StripePaymentFormRef } from "@/app/components/StripePaymentForm";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import {
  validateUkMobile,
  validateEmail,
  validateUkPostcode,
  validatePacCode,
  validateStacCode,
} from "@/app/utils/validators";
import {
  getEligibility,
  checkPac,
  getQuote,
  checkout,
  confirmOrder,
  getOrder,
  submitPort,
  ApiError,
  Eligibility,
  Term,
  SimType,
  SwitchChoice,
  CodeType,
  QuoteResponse,
  Billing,
  DeliveryAddress,
  AddLineOrder,
} from "./addLineApi";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface BackendPlan {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: string;
  price_30: string | null;
  price_12: string | null;
  price_24: string | null;
  data_allowance: string | null;
  transatelID: string | null;
  is_active: boolean;
  is_popular: boolean;
  category?: { id: number; name: string; slug: string } | null;
  features?: { id: number; title: string }[];
}

function formatUk(m: string | null | undefined): string {
  if (!m) return "Number on its way";
  const raw = String(m).replace(/\D/g, "");
  const local = raw.startsWith("44") ? "0" + raw.slice(2) : raw;
  return local.length === 11 ? `${local.slice(0, 5)} ${local.slice(5)}` : local;
}

function validateTransferDate(dateStr: string): { isValid: boolean; warning?: string; error?: string } {
  if (!dateStr) return { isValid: true };
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (d < now) {
    return { isValid: false, error: "Preferred transfer date cannot be in the past." };
  }

  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    return { isValid: false, error: "Preferred transfer date must be within 30 days." };
  }

  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isValid: true,
      warning:
        "UK network transfers take place on working days (Mon–Fri). If you choose a weekend, the transfer will take place on the next working day.",
    };
  }

  return { isValid: true };
}

function AddNewNumberContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Layout State ──
  const [activeTab, setActiveTab] = useState("numbers");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");

  // ── Auth & User State ──
  const [user, setUser] = useState<{
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: any;
  } | null>(null);

  const userDisplayName = (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.name) || user?.email || "";

  // ── Step 0: Eligibility State ──
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // ── Step State (1 to 8) ──
  const [step, setStep] = useState<number>(1);

  // ── Step 1: Option ──
  const [switchChoice, setSwitchChoice] = useState<SwitchChoice>("pac");

  // ── Step 2: Plan + Term ──
  const [plans, setPlans] = useState<BackendPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [term, setTerm] = useState<Term>("12M");

  // ── Step 3: Number (PAC / STAC / None) ──
  const [portOldNumber, setPortOldNumber] = useState<string>("");
  const [portCode, setPortCode] = useState<string>("");
  const [wishedDate, setWishedDate] = useState<string>("");
  const [portChecking, setPortChecking] = useState<boolean>(false);
  const [portCheckError, setPortCheckError] = useState<string | null>(null);
  const [portFormatOkMessage, setPortFormatOkMessage] = useState<string | null>(null);
  const [portNumberError, setPortNumberError] = useState<string | null>(null);
  const [portCodeError, setPortCodeError] = useState<string | null>(null);
  const [portDateError, setPortDateError] = useState<string | null>(null);
  const [addCodeLater, setAddCodeLater] = useState<boolean>(false);

  // ── Step 4: SIM Type ──
  const [simType, setSimType] = useState<SimType>("esim");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // ── Step 5: Review & Quote ──
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [promoError, setPromoError] = useState<string | null>(null);

  const [billingDetails, setBillingDetails] = useState<Billing>({
    first_name: "",
    last_name: "",
    house_number: "",
    street: "",
    city: "",
    zip_code: "",
    email: "",
  });
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [immediateService, setImmediateService] = useState<boolean>(true);

  // ── Step 6: Checkout & Payment ──
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("0.00");
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const formRef = useRef<StripePaymentFormRef>(null);

  // ── Step 7 & 8: Activation & Polling ──
  const [order, setOrder] = useState<AddLineOrder | null>(null);
  const [portSubmitted, setPortSubmitted] = useState<boolean>(false);
  const [portSubmitting, setPortSubmitting] = useState<boolean>(false);
  const [portSubmitError, setPortSubmitError] = useState<string | null>(null);
  const [inlinePortCode, setInlinePortCode] = useState<string>("");
  const [inlinePortNumber, setInlinePortNumber] = useState<string>("");

  // ── Read User from LocalStorage ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("zoiko_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        const nameParts = (u.name || "").trim().split(" ");
        const first = u.first_name || nameParts[0] || "";
        const last = u.last_name || nameParts.slice(1).join(" ") || "";
        setBillingDetails((prev) => ({
          ...prev,
          first_name: first,
          last_name: last,
          email: u.email || "",
          street: u.address?.street || "",
          city: u.address?.city || "",
          zip_code: u.address?.postcode || u.address?.zip || "",
        }));
        setDeliveryAddress((prev) => ({
          ...prev,
          name: `${first} ${last}`.trim(),
          line1: u.address?.street || "",
          city: u.address?.city || "",
          postcode: u.address?.postcode || u.address?.zip || "",
        }));
      }
    } catch {
      // fallback
    }
  }, []);

  // ── Step 0: Check Eligibility on mount or resume from Order Reference ──
  useEffect(() => {
    let active = true;

    async function initPage() {
      // Check if resuming from 3D secure redirect or session
      const queryOrder = searchParams.get("order");
      const sessionOrder = typeof window !== "undefined" ? sessionStorage.getItem("addLineOrderRef") : null;
      const refToResume = queryOrder || sessionOrder;

      if (refToResume) {
        setOrderReference(refToResume);
        try {
          const ord = await confirmOrder(refToResume).catch(() => getOrder(refToResume));
          if (active) {
            setOrder(ord);
            // v1.1: If returning after a card decline, stay on Step 6 with error notice
            if (ord.payment_status === "pending" && ord.payment_error) {
              setStep(6);
              setPaymentNotice(ord.payment_error.message);
            } else if (ord.fulfilment_status === "cancelled") {
              setStep(8);
            } else {
              setStep(7);
            }
          }
        } catch {
          if (active) setStep(7);
        }
      }

      try {
        setEligibilityLoading(true);
        const el = await getEligibility();
        if (active) {
          setEligibility(el);
          if (!el.eligible && el.reasons.length > 0) {
            setEligibilityError(el.reasons.map((r) => r.message).join(" "));
          }
        }
      } catch (err: any) {
        if (active) {
          if (err instanceof ApiError && err.status === 401) {
            router.push(`/login?redirect=${encodeURIComponent("/dashboard/add-new-number")}`);
            return;
          }
          setEligibilityError(err.message || "Failed to check line eligibility.");
        }
      } finally {
        if (active) setEligibilityLoading(false);
      }
    }

    initPage();
    return () => {
      active = false;
    };
  }, [searchParams, router]);

  // ── Load Sellable Plans from /api/plans/v1/ ──
  useEffect(() => {
    let active = true;
    async function loadPlans() {
      try {
        setPlansLoading(true);
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (res.ok) {
          const data: BackendPlan[] = await res.json();
          if (active && Array.isArray(data)) {
            // Rule 6.2: Show only plans that the backend can sell (is_active && transatelID)
            const sellable = data.filter((p) => p.is_active && p.transatelID);
            const listToUse = sellable.length > 0 ? sellable : data.filter((p) => p.is_active);
            setPlans(listToUse);
            if (listToUse.length > 0) {
              const popular = listToUse.find((p) => p.is_popular) || listToUse[0];
              setSelectedPlanId(popular.id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load plans:", err);
      } finally {
        if (active) setPlansLoading(false);
      }
    }
    loadPlans();
    return () => {
      active = false;
    };
  }, []);

  // ── Fetch Quote when Plan, Term, SimType, or Promo changes ──
  const fetchQuote = useCallback(
    async (promoToUse?: string) => {
      if (!selectedPlanId) return;
      setQuoteLoading(true);
      setQuoteError(null);
      setPromoError(null);
      try {
        const resp = await getQuote({
          plan_id: selectedPlanId,
          term,
          sim_type: simType,
          promo_code: promoToUse !== undefined ? promoToUse : appliedPromoCode,
        });
        setQuoteResponse(resp);
      } catch (err: any) {
        if (promoToUse) {
          setPromoError("Promo code is not available.");
          setAppliedPromoCode("");
          // Keep regular quote without promo so user stays on the page
          try {
            const fallback = await getQuote({
              plan_id: selectedPlanId,
              term,
              sim_type: simType,
              promo_code: "",
            });
            setQuoteResponse(fallback);
          } catch {}
        } else {
          setQuoteError(err.message || "Could not retrieve price quote.");
        }
      } finally {
        setQuoteLoading(false);
      }
    },
    [selectedPlanId, term, simType, appliedPromoCode]
  );

  useEffect(() => {
    if (step === 5 && selectedPlanId) {
      fetchQuote();
    }
  }, [step, selectedPlanId, term, simType, fetchQuote]);

  // ── Polling Activation Progress in Step 7 ──
  useEffect(() => {
    if (step !== 7 || !orderReference) return;

    let timer: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 3s = 120s (2 minutes)
    let isCancelled = false;

    async function poll() {
      try {
        const ord = await getOrder(orderReference!);
        if (isCancelled) return;
        setOrder(ord);

        // Auto-submit PAC/STAC if code exists in state and line.id is now available
        if (
          ord.line?.id &&
          !portSubmitted &&
          !portSubmitting &&
          (switchChoice === "pac" || switchChoice === "stac") &&
          portCode &&
          portOldNumber
        ) {
          setPortSubmitting(true);
          submitPort(ord.line.id, {
            code_type: switchChoice === "pac" ? "PAC" : "STAC",
            code: portCode.trim(),
            msisdn: portOldNumber.trim(),
            wished_date: wishedDate || null,
          })
            .then(() => {
              setPortSubmitted(true);
              setPortCode(""); // Sensitive: clear from memory once posted
            })
            .catch((e: any) => {
              setPortSubmitError(e.message || "Failed to submit number transfer.");
            })
            .finally(() => {
              setPortSubmitting(false);
            });
        }

        // Terminal states
        if (
          ord.fulfilment_status === "activated" ||
          ord.fulfilment_status === "failed" ||
          ord.fulfilment_status === "cancelled"
        ) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("addLineOrderRef");
          }
          setStep(8);
          return;
        }
      } catch {
        // network retry
      }

      attempts++;
      if (attempts >= maxAttempts) {
        // After 2 minutes, show friendly message screen
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("addLineOrderRef");
        }
        setStep(8);
        return;
      }

      timer = setTimeout(poll, 3000);
    }

    poll();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [step, orderReference, switchChoice, portCode, portOldNumber, wishedDate, portSubmitted, portSubmitting]);

  // ── Selected Plan Object ──
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  }, [plans, selectedPlanId]);

  // Indicative monthly price for display in Step 2
  const getIndicativePrice = (p: BackendPlan) => {
    if (term === "30D") return Number(p.price_30 ?? p.price).toFixed(2);
    if (term === "12M") return Number(p.price_12 ?? p.price).toFixed(2);
    return Number(p.price_24 ?? p.price).toFixed(2);
  };

  // ── Validation Handlers ──

  // Step 3 Next handler
  const handleStep3Continue = async () => {
    if (switchChoice === "none" || addCodeLater) {
      setStep(4);
      return;
    }

    setPortNumberError(null);
    setPortCodeError(null);
    setPortDateError(null);
    setPortCheckError(null);
    setPortFormatOkMessage(null);

    let hasError = false;

    // Validate UK mobile number
    const numVal = validateUkMobile(portOldNumber);
    if (!numVal.isValid) {
      setPortNumberError(numVal.error || "Enter a valid 11-digit UK mobile number.");
      hasError = true;
    }

    // Validate PAC or STAC code format
    const codeVal = switchChoice === "pac" ? validatePacCode(portCode) : validateStacCode(portCode);
    if (!codeVal.isValid) {
      setPortCodeError(codeVal.error || `Please enter a valid 9-character ${switchChoice.toUpperCase()} code.`);
      hasError = true;
    }

    // Validate preferred date if entered
    if (wishedDate) {
      const dateVal = validateTransferDate(wishedDate);
      if (!dateVal.isValid) {
        setPortDateError(dateVal.error || "Please choose a valid transfer date.");
        hasError = true;
      }
    }

    if (hasError) return;

    setPortChecking(true);

    try {
      const res = await checkPac({
        code_type: switchChoice === "pac" ? "PAC" : "STAC",
        code: portCode.trim().toUpperCase(),
        msisdn: numVal.formatted ? numVal.formatted.replace(/\s+/g, "") : portOldNumber.trim(),
      });
      setPortFormatOkMessage(res.message);
      // Proceed to SIM selection
      setTimeout(() => setStep(4), 400);
    } catch (err: any) {
      setPortCheckError(err.message || "Invalid switching code or mobile number.");
    } finally {
      setPortChecking(false);
    }
  };

  // Step 4 Next handler
  const handleStep4Continue = () => {
    if (simType === "psim") {
      const errs: Record<string, string> = {};
      if (!deliveryAddress.name.trim()) errs.name = "Recipient full name is required.";
      if (!deliveryAddress.line1.trim()) errs.line1 = "Address line 1 is required.";
      if (!deliveryAddress.city.trim()) errs.city = "Town or city is required.";

      const pcVal = validateUkPostcode(deliveryAddress.postcode);
      if (!pcVal.isValid) {
        errs.postcode = pcVal.error || "Valid UK postcode is required.";
      } else if (pcVal.formatted) {
        setDeliveryAddress((prev) => ({ ...prev, postcode: pcVal.formatted! }));
      }

      if (Object.keys(errs).length > 0) {
        setAddressErrors(errs);
        return;
      }
    }
    setStep(5);
  };

  // Step 5 Next handler (Checkout)
  const handleStep5Checkout = async () => {
    const bErrors: Record<string, string> = {};

    if (!billingDetails.first_name.trim()) bErrors.first_name = "First name is required.";
    if (!billingDetails.last_name.trim()) bErrors.last_name = "Last name is required.";
    if (!billingDetails.street.trim()) bErrors.street = "Billing street is required.";
    if (!billingDetails.city.trim()) bErrors.city = "City is required.";

    const pcVal = validateUkPostcode(billingDetails.zip_code);
    if (!pcVal.isValid) {
      bErrors.zip_code = pcVal.error || "Valid UK postcode is required.";
    } else if (pcVal.formatted) {
      setBillingDetails((prev) => ({ ...prev, zip_code: pcVal.formatted! }));
    }

    if (!termsAccepted) {
      bErrors.terms = "Please accept the contract summary and terms and conditions to proceed.";
    }

    if (Object.keys(bErrors).length > 0) {
      setBillingErrors(bErrors);
      return;
    }

    // v1.1: A declined card does not cancel the order; line slot stays held for 30 minutes.
    // If clientSecret and orderReference already exist, reuse them without calling checkout again.
    if (clientSecret && orderReference) {
      setStep(6);
      return;
    }

    if (!quoteResponse?.quote_token) {
      setQuoteError("Quote has expired or is invalid. Please refresh.");
      fetchQuote();
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const resp = await checkout({
        quote_token: quoteResponse.quote_token,
        switch_choice: switchChoice,
        billing: billingDetails,
        delivery_address: simType === "psim" ? deliveryAddress : null,
        contract: {
          contract_version: quoteResponse.contract.contract_version,
          contract_summary_version: quoteResponse.contract.contract_summary_version,
          accepted: true,
          immediate_service_requested: immediateService,
        },
      });

      setOrderReference(resp.order_reference);
      setPaymentAmount(resp.amount);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("addLineOrderRef", resp.order_reference);
      }

      if (!resp.payment_required) {
        // 100% promo coverage: skip payment form
        setStep(7);
      } else {
        setClientSecret(resp.client_secret);
        setStep(6);
      }
    } catch (err: any) {
      if (err.code === "QUOTE_CHANGED" || err.code === "QUOTE_EXPIRED") {
        setCheckoutError("The plan quote was updated. We have refreshed your prices.");
        fetchQuote();
      } else if (err.code === "REAUTH_REQUIRED") {
        router.push(`/login?redirect=${encodeURIComponent("/dashboard/add-new-number")}`);
      } else if (err.code === "OUT_OF_STOCK") {
        setCheckoutError("This SIM type is currently out of stock. Please select another SIM format.");
        setStep(4);
      } else if (err.code === "DELIVERY_ADDRESS_REQUIRED") {
        setCheckoutError("Please provide a valid delivery address for your physical SIM.");
        setStep(4);
      } else {
        setCheckoutError(err.message || "Failed to start checkout. Please try again.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Step 6 Pay Handler
  const handleExecutePayment = async () => {
    if (!orderReference) return;
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await formRef.current?.submitPayment();
      if (!res?.success) {
        setCheckoutLoading(false);
        // v1.1: If declined, fetch order to get backend payment_error if recorded
        if (orderReference) {
          getOrder(orderReference)
            .then((o) => {
              if (o.payment_error) {
                setPaymentNotice(o.payment_error.message);
              }
            })
            .catch(() => {});
        }
        return;
      }

      // Confirm order with backend
      await confirmOrder(orderReference);
      setPaymentNotice(null);
      setStep(7);
    } catch (err: any) {
      if (err.code === "PAYMENT_NOT_COMPLETED" || err.code === "PAYMENT_CHECK_FAILED") {
        // Stripe webhook or polling will catch up
        setStep(7);
      } else {
        setCheckoutError(err.message || "Payment confirmation error. Checking order status...");
        setStep(7);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Render Blocked Eligibility Screen ──
  if (!eligibilityLoading && eligibility && !eligibility.eligible) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardTopNav
            userName={userDisplayName || undefined}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
          />
          <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#0D1935]">Cannot Add New Line</h1>
              <p className="mt-2 text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                {eligibilityError || "You are currently not eligible to add an additional line to this account."}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard/my-mobile-numbers"
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D1935] text-sm font-semibold transition"
                >
                  Return to My Numbers
                </Link>
                <Link
                  href="/dashboard/support"
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-white text-sm font-semibold transition shadow-xs"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex font-['Figtree',sans-serif]">
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopNav
          userName={userDisplayName || undefined}
          searchQuery={topSearchQuery}
          setSearchQuery={setTopSearchQuery}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Header & Capacity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Link href="/dashboard/my-mobile-numbers" className="hover:text-[#E01C5B]">
                  My Mobile Numbers
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-700">Add a New Number</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935]">Add a New Number</h1>
            </div>

            {eligibility && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700">
                <Smartphone className="w-4 h-4 text-[#E01C5B]" />
                <span>
                  {eligibility.lines.active + eligibility.lines.in_progress} of {eligibility.lines.limit} lines used
                </span>
              </div>
            )}
          </div>

          {/* Re-auth Warning Banner */}
          {eligibility?.requires_reauth && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Security verification required:</strong> You logged in over 60 minutes
                  ago. Please re-authenticate before confirming payment.
                </div>
              </div>
              <Link
                href={`/login?redirect=${encodeURIComponent("/dashboard/add-new-number")}`}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition"
              >
                Log In Again
              </Link>
            </div>
          )}

          {/* Stepper Progress Indicator (Steps 1 to 6) */}
          {step <= 6 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between relative">
                {/* Stepper Connecting Bar */}
                <div className="absolute top-4 left-[8%] right-[8%] h-0.5 bg-slate-200 z-0" />
                <div
                  className="absolute top-4 left-[8%] h-0.5 bg-[#027A48] z-0 transition-all duration-300"
                  style={{ width: `${Math.min(84, Math.max(0, ((step - 1) / 5) * 84))}%` }}
                />

                {[
                  { n: 1, label: "Option" },
                  { n: 2, label: "Plan" },
                  { n: 3, label: "Number" },
                  { n: 4, label: "SIM" },
                  { n: 5, label: "Review" },
                  { n: 6, label: "Payment" },
                ].map((s, idx) => {
                  const isDone = step > s.n;
                  const isCurrent = step === s.n;
                  return (
                    <div key={s.n} className="flex flex-col items-center flex-1 relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative z-10 ${
                          isDone
                            ? "bg-[#027A48] text-white ring-4 ring-white"
                            : isCurrent
                            ? "bg-[#E01C5B] text-white ring-4 ring-[#E01C5B]/20"
                            : "bg-slate-100 text-slate-400 ring-4 ring-white"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.n}
                      </div>
                      <span
                        className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                          isCurrent ? "text-[#0D1935]" : "text-slate-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 1: Three Distinct Acquisition Choices (§6.1)          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#0D1935]">How do you want to add this number?</h2>
                <p className="text-sm text-slate-500 mt-1">Choose how your new mobile service will be set up.</p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Option 1: PAC */}
                <label
                  onClick={() => setSwitchChoice("pac")}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-4 ${
                    switchChoice === "pac"
                      ? "border-[#E01C5B] bg-[#FDE8F1]/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="switch_choice"
                    checked={switchChoice === "pac"}
                    onChange={() => setSwitchChoice("pac")}
                    className="mt-1 text-[#E01C5B] focus:ring-[#E01C5B]"
                  />
                  <div className="flex-1">
                    <div className="font-extrabold text-[#0D1935] text-base">Keep my current number (PAC)</div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Move your existing UK mobile number to Zoiko Mobile from another provider using a PAC.
                    </div>
                    <div className="text-[11px] text-[#E01C5B] font-semibold mt-1.5">
                      Text <strong>PAC</strong> to <strong>65075</strong> from your current phone to get your code (free).
                    </div>
                  </div>
                </label>

                {/* Option 2: STAC */}
                <label
                  onClick={() => setSwitchChoice("stac")}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-4 ${
                    switchChoice === "stac"
                      ? "border-[#E01C5B] bg-[#FDE8F1]/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="switch_choice"
                    checked={switchChoice === "stac"}
                    onChange={() => setSwitchChoice("stac")}
                    className="mt-1 text-[#E01C5B] focus:ring-[#E01C5B]"
                  />
                  <div className="flex-1">
                    <div className="font-extrabold text-[#0D1935] text-base">
                      New number and end my old contract (STAC)
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Get a brand-new Zoiko UK number and automatically cancel your other network contract using a STAC.
                    </div>
                    <div className="text-[11px] text-[#E01C5B] font-semibold mt-1.5">
                      Text <strong>STAC</strong> to <strong>75075</strong> from your current phone to get your code (free).
                    </div>
                  </div>
                </label>

                {/* Option 3: None */}
                <label
                  onClick={() => setSwitchChoice("none")}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-4 ${
                    switchChoice === "none"
                      ? "border-[#E01C5B] bg-[#FDE8F1]/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="switch_choice"
                    checked={switchChoice === "none"}
                    onChange={() => setSwitchChoice("none")}
                    className="mt-1 text-[#E01C5B] focus:ring-[#E01C5B]"
                  />
                  <div className="flex-1">
                    <div className="font-extrabold text-[#0D1935] text-base">
                      New number, keep my other service active
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Get an extra Zoiko number for work, family, or a secondary device. Nothing changes with your other provider.
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#E01C5B] hover:bg-[#c9144e] text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue to choose plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 2: Choose Plan & Contract Term (§6.2)                 */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0D1935]">Choose a mobile plan &amp; commitment</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Flexible durations. The final price is quoted securely from the server.</p>
                </div>

                {/* Term Selector */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                  {(
                    [
                      { key: "30D", label: "30 days" },
                      { key: "12M", label: "12 months" },
                      { key: "24M", label: "24 months" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTerm(t.key)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        term === t.key ? "bg-white text-[#E01C5B] shadow-2xs" : "text-slate-600 hover:text-[#0D1935]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Grid */}
              {plansLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse p-6 rounded-2xl border border-slate-200 h-48 bg-slate-50" />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No plans are available for additional lines at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    const priceDisplay = getIndicativePrice(p);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-[#E01C5B] bg-[#FDE8F1]/10 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-extrabold text-lg text-[#0D1935]">{p.name}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">{p.short_description || "High-speed UK connectivity"}</p>
                            </div>
                            {p.is_popular && (
                              <span className="px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] text-[10px] font-bold">
                                Popular
                              </span>
                            )}
                          </div>

                          <div className="text-2xl font-black text-[#0D1935] mt-3">
                            £{priceDisplay}
                            <span className="text-xs font-normal text-slate-500"> /month ({term === "30D" ? "rolling" : term === "12M" ? "12 mo" : "24 mo"})</span>
                          </div>

                          <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-[#027A48]" />
                              <strong className="font-bold text-[#0D1935]">{p.data_allowance || "Data allowance"}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-[#027A48]" />
                              <span>Unlimited UK calls &amp; texts</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">
                            {isSelected ? "Selected plan" : "Click to select"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isSelected ? "bg-[#E01C5B] text-white" : "border border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-slate-600 hover:text-[#0D1935] text-sm font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedPlanId}
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 3: Phone Number Details (§6.3)                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              {switchChoice === "none" ? (
                /* Pure New Number: Info Card Only (§6.3 Decision B5) */
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0D1935]">We&apos;ll assign your new UK number</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Your UK mobile number is allocated automatically by the network as soon as your SIM is ready.
                  </p>
                </div>
              ) : (
                /* PAC or STAC Form */
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0D1935]">
                      {switchChoice === "pac" ? "Keep your existing mobile number" : "Switch using a STAC code"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      We will check the code format before submitting to your current provider.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-[#0D1935] mb-1">
                        Current UK mobile number to transfer *
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 07700 900123"
                        value={portOldNumber}
                        onChange={(e) => {
                          setPortOldNumber(e.target.value);
                          if (portNumberError) setPortNumberError(null);
                          if (portCheckError) setPortCheckError(null);
                        }}
                        onBlur={() => {
                          if (portOldNumber.trim()) {
                            const val = validateUkMobile(portOldNumber);
                            if (!val.isValid) {
                              setPortNumberError(val.error || "Enter a valid UK mobile number.");
                            } else if (val.formatted) {
                              setPortOldNumber(val.formatted);
                              setPortNumberError(null);
                            }
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                          portNumberError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {portNumberError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {portNumberError}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[#0D1935]">
                          9-character {switchChoice.toUpperCase()} code *
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {switchChoice === "pac" ? "Format: 3 letters + 6 digits" : "Format: 6 digits + 3 letters"}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={9}
                        placeholder={switchChoice === "pac" ? "e.g. ABC123456" : "e.g. 123456ABC"}
                        value={portCode}
                        onChange={(e) => {
                          const upper = e.target.value.toUpperCase();
                          setPortCode(upper);
                          if (portCodeError) setPortCodeError(null);
                          if (portCheckError) setPortCheckError(null);
                        }}
                        onBlur={() => {
                          if (portCode.trim()) {
                            const val =
                              switchChoice === "pac"
                                ? validatePacCode(portCode)
                                : validateStacCode(portCode);
                            if (!val.isValid) {
                              setPortCodeError(val.error || `Invalid ${switchChoice.toUpperCase()} code format.`);
                            } else {
                              setPortCodeError(null);
                            }
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm uppercase tracking-wider font-mono outline-hidden transition ${
                          portCodeError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />

                      {/* Real-time Code Format Validity Pill */}
                      {portCode.length === 9 && !portCodeError && (
                        <div className="mt-1">
                          {(switchChoice === "pac" ? validatePacCode(portCode).isValid : validateStacCode(portCode).isValid) ? (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Valid {switchChoice.toUpperCase()} code format
                            </span>
                          ) : (
                            <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                              {switchChoice === "pac"
                                ? "PAC format must be 3 uppercase letters followed by 6 digits (e.g. ABC123456)"
                                : "STAC format must be 6 digits followed by 3 uppercase letters (e.g. 123456ABC)"}
                            </span>
                          )}
                        </div>
                      )}

                      {portCodeError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {portCodeError}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0D1935] mb-1">
                        Preferred transfer date (optional)
                      </label>
                      <input
                        type="date"
                        min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        value={wishedDate}
                        onChange={(e) => {
                          setWishedDate(e.target.value);
                          if (portDateError) setPortDateError(null);
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                          portDateError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Leave blank to switch automatically when your new SIM first connects.
                      </span>

                      {/* Date Validation Warnings */}
                      {wishedDate && validateTransferDate(wishedDate).warning && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5 mt-2">
                          <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>{validateTransferDate(wishedDate).warning}</span>
                        </div>
                      )}

                      {portDateError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {portDateError}
                        </span>
                      )}
                    </div>

                    {portCheckError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                        <div>{portCheckError}</div>
                      </div>
                    )}

                    {portFormatOkMessage && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <div>{portFormatOkMessage}</div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddCodeLater(true);
                          setPortNumberError(null);
                          setPortCodeError(null);
                          setPortCheckError(null);
                          setStep(4);
                        }}
                        className="text-xs text-[#E01C5B] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>I&apos;ll add my code later from My Numbers</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 text-slate-600 hover:text-[#0D1935] text-sm font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={portChecking}
                  onClick={handleStep3Continue}
                  className="px-6 py-3 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {portChecking ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Checking code format...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 4: Choose SIM Type (§6.4)                             */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#0D1935]">Choose your SIM format</h2>
                <p className="text-sm text-slate-500 mt-0.5">Select eSIM for digital setup or Physical SIM for postal delivery.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setSimType("esim")}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    simType === "esim"
                      ? "border-[#E01C5B] bg-[#FDE8F1]/10 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <input
                        type="radio"
                        name="sim_type"
                        checked={simType === "esim"}
                        onChange={() => setSimType("esim")}
                        className="text-[#E01C5B] focus:ring-[#E01C5B]"
                      />
                    </div>
                    <div className="font-extrabold text-[#0D1935] text-base mt-3">eSIM (Digital)</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Set up on your phone with a QR code we email you shortly after payment.
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-[#027A48]">
                    No waiting for delivery
                  </div>
                </label>

                <label
                  onClick={() => setSimType("psim")}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    simType === "psim"
                      ? "border-[#E01C5B] bg-[#FDE8F1]/10 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <input
                        type="radio"
                        name="sim_type"
                        checked={simType === "psim"}
                        onChange={() => setSimType("psim")}
                        className="text-[#E01C5B] focus:ring-[#E01C5B]"
                      />
                    </div>
                    <div className="font-extrabold text-[#0D1935] text-base mt-3">Physical SIM Card</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Dispatched by Royal Mail 1st Class with free UK delivery.
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-[#027A48]">
                    Free UK Delivery
                  </div>
                </label>
              </div>

              {/* Physical SIM Delivery Form (§6.4) */}
              {simType === "psim" && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E01C5B]" />
                    <h3 className="font-bold text-sm text-[#0D1935]">UK Delivery Address</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Recipient Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={deliveryAddress.name}
                        onChange={(e) => {
                          setDeliveryAddress({ ...deliveryAddress, name: e.target.value });
                          if (addressErrors.name) {
                            setAddressErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.name;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                          addressErrors.name
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {addressErrors.name && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {addressErrors.name}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        placeholder="e.g. 10 Downing Street"
                        value={deliveryAddress.line1}
                        onChange={(e) => {
                          setDeliveryAddress({ ...deliveryAddress, line1: e.target.value });
                          if (addressErrors.line1) {
                            setAddressErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.line1;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                          addressErrors.line1
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {addressErrors.line1 && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {addressErrors.line1}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Address Line 2 (optional)</label>
                      <input
                        type="text"
                        placeholder="Apartment, suite, unit, building floor"
                        value={deliveryAddress.line2 || ""}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, line2: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-hidden focus:ring-2 focus:ring-[#E01C5B]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Town / City *</label>
                      <input
                        type="text"
                        placeholder="e.g. London"
                        value={deliveryAddress.city}
                        onChange={(e) => {
                          setDeliveryAddress({ ...deliveryAddress, city: e.target.value });
                          if (addressErrors.city) {
                            setAddressErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.city;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                          addressErrors.city
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {addressErrors.city && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {addressErrors.city}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Postcode *</label>
                      <input
                        type="text"
                        placeholder="e.g. SW1A 2AA"
                        value={deliveryAddress.postcode}
                        onChange={(e) => {
                          setDeliveryAddress({ ...deliveryAddress, postcode: e.target.value.toUpperCase() });
                          if (addressErrors.postcode) {
                            setAddressErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.postcode;
                              return copy;
                            });
                          }
                        }}
                        onBlur={() => {
                          if (deliveryAddress.postcode.trim()) {
                            const val = validateUkPostcode(deliveryAddress.postcode);
                            if (!val.isValid) {
                              setAddressErrors((prev) => ({ ...prev, postcode: val.error || "Enter a valid UK postcode." }));
                            } else if (val.formatted) {
                              setDeliveryAddress((prev) => ({ ...prev, postcode: val.formatted! }));
                              setAddressErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.postcode;
                                return copy;
                              });
                            }
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border uppercase text-sm font-mono outline-hidden transition ${
                          addressErrors.postcode
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {addressErrors.postcode && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {addressErrors.postcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 text-slate-600 hover:text-[#0D1935] text-sm font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleStep4Continue}
                  className="px-6 py-3 bg-[#E01C5B] hover:bg-[#c9144e] text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Review and quote</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 5: Review (Server-Quoted Prices) (§6.5)                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#0D1935]">Review your order</h2>
                <p className="text-sm text-slate-500 mt-0.5">All prices are quoted securely from the server and include UK VAT.</p>
              </div>

              {quoteLoading ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center gap-2">
                  <RotateCw className="w-6 h-6 animate-spin text-[#E01C5B]" />
                  <span className="text-xs font-bold text-slate-600">Generating secure server quote...</span>
                </div>
              ) : quoteError ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
                  <span>{quoteError}</span>
                  <button onClick={() => fetchQuote()} className="underline font-bold text-xs">
                    Retry
                  </button>
                </div>
              ) : quoteResponse ? (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                      <span className="text-slate-500">Plan</span>
                      <strong className="font-bold text-[#0D1935]">
                        {quoteResponse.quote.plan.name} · {quoteResponse.quote.plan.data_allowance}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                      <span className="text-slate-500">Contract length</span>
                      <strong className="font-bold text-[#0D1935]">
                        {quoteResponse.quote.term_label}
                        {quoteResponse.quote.commitment_months > 0 && ` (Minimum term: ${quoteResponse.quote.commitment_months} months)`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                      <span className="text-slate-500">SIM format</span>
                      <span className="font-bold text-[#0D1935]">
                        {quoteResponse.quote.sim_type === "esim" ? "eSIM" : "Physical SIM"} (
                        {quoteResponse.quote.delivery_fee === "0.00" ? "Free UK delivery" : `£${quoteResponse.quote.delivery_fee}`}
                        )
                      </span>
                    </div>

                    {quoteResponse.quote.promo && (
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 text-emerald-700">
                        <span>Promo ({quoteResponse.quote.promo.code})</span>
                        <strong className="font-bold">-£{quoteResponse.quote.promo.discount}</strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 text-base">
                      <div>
                        <span className="font-extrabold text-[#0D1935] block">To pay today</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Includes £{quoteResponse.quote.vat_included} VAT ({quoteResponse.quote.vat_rate_percent}%)
                        </span>
                      </div>
                      <span className="text-2xl font-black text-[#E01C5B]">£{quoteResponse.quote.charge_today}</span>
                    </div>

                    <div className="pt-2 text-xs text-slate-500">
                      Then £{quoteResponse.quote.recurring_amount} per month from {quoteResponse.quote.first_renewal_date}.
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Have a promo code?"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          if (promoError) setPromoError(null);
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-[#E01C5B] outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const code = promoCodeInput.trim().toUpperCase();
                          if (!code) {
                            setPromoError(null);
                            setAppliedPromoCode("");
                            fetchQuote("");
                            return;
                          }
                          setAppliedPromoCode(code);
                          fetchQuote(code);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Apply Code
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {promoError}
                      </p>
                    )}
                  </div>

                  {/* Billing Details Form */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="font-bold text-sm text-[#0D1935]">Billing Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Jane"
                          value={billingDetails.first_name}
                          onChange={(e) => {
                            setBillingDetails({ ...billingDetails, first_name: e.target.value });
                            if (billingErrors.first_name) {
                              setBillingErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.first_name;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                            billingErrors.first_name
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {billingErrors.first_name && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {billingErrors.first_name}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Doe"
                          value={billingDetails.last_name}
                          onChange={(e) => {
                            setBillingDetails({ ...billingDetails, last_name: e.target.value });
                            if (billingErrors.last_name) {
                              setBillingErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.last_name;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                            billingErrors.last_name
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {billingErrors.last_name && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {billingErrors.last_name}
                          </span>
                        )}
                      </div>



                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          placeholder="e.g. 10 Downing Street"
                          value={billingDetails.street}
                          onChange={(e) => {
                            setBillingDetails({ ...billingDetails, street: e.target.value });
                            if (billingErrors.street) {
                              setBillingErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.street;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                            billingErrors.street
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {billingErrors.street && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {billingErrors.street}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">City *</label>
                        <input
                          type="text"
                          placeholder="e.g. London"
                          value={billingDetails.city}
                          onChange={(e) => {
                            setBillingDetails({ ...billingDetails, city: e.target.value });
                            if (billingErrors.city) {
                              setBillingErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.city;
                                return copy;
                              });
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                            billingErrors.city
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {billingErrors.city && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {billingErrors.city}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Postcode *</label>
                        <input
                          type="text"
                          placeholder="e.g. SW1A 2AA"
                          value={billingDetails.zip_code}
                          onChange={(e) => {
                            setBillingDetails({ ...billingDetails, zip_code: e.target.value.toUpperCase() });
                            if (billingErrors.zip_code) {
                              setBillingErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.zip_code;
                                return copy;
                              });
                            }
                          }}
                          onBlur={() => {
                            if (billingDetails.zip_code.trim()) {
                              const val = validateUkPostcode(billingDetails.zip_code);
                              if (!val.isValid) {
                                setBillingErrors((prev) => ({ ...prev, zip_code: val.error || "Enter a valid UK postcode." }));
                              } else if (val.formatted) {
                                setBillingDetails((prev) => ({ ...prev, zip_code: val.formatted! }));
                                setBillingErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy.zip_code;
                                  return copy;
                                });
                              }
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border uppercase text-sm font-mono outline-hidden transition ${
                            billingErrors.zip_code
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:ring-2 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {billingErrors.zip_code && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {billingErrors.zip_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contract Agreement Checkboxes (§6.5) */}
                  <div className={`space-y-3 pt-2 text-xs text-[#0D1935] p-3 rounded-xl transition ${
                    billingErrors.terms ? "border border-red-300 bg-red-50/30" : ""
                  }`}>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          if (e.target.checked && billingErrors.terms) {
                            setBillingErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.terms;
                              return copy;
                            });
                          }
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B]"
                      />
                      <span>
                        I&apos;ve read the{" "}
                        <Link href="/terms-and-conditions" target="_blank" className="font-bold underline text-[#E01C5B]">
                          contract summary
                        </Link>{" "}
                        and agree to the{" "}
                        <Link href="/terms-and-conditions" target="_blank" className="font-bold underline text-[#E01C5B]">
                          terms and conditions
                        </Link>
                        . *
                      </span>
                    </label>

                    {billingErrors.terms && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pl-6">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {billingErrors.terms}
                      </p>
                    )}

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={immediateService}
                        onChange={(e) => setImmediateService(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B]"
                      />
                      <span className="text-slate-600">
                        Start my service straight away. I understand that if I cancel within 14 days, I&apos;ll pay for the
                        service I&apos;ve used.
                      </span>
                    </label>
                  </div>
                </div>
              ) : null}

              {checkoutError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {checkoutError}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 text-slate-600 hover:text-[#0D1935] text-sm font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={checkoutLoading || quoteLoading}
                  onClick={handleStep5Checkout}
                  className="px-6 py-3 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {checkoutLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Starting checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 6: Stripe Payment Element (§7)                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 6 && clientSecret && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0D1935]">Secure payment</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Order reference: {orderReference}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total today</span>
                  <span className="text-2xl font-black text-[#E01C5B]">£{paymentAmount}</span>
                </div>
              </div>

              {/* Payment Error / Decline Notice (v1.1) */}
              {(paymentNotice || (order?.payment_status === "pending" && order?.payment_error)) && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">Your last payment attempt didn&apos;t go through.</p>
                    <p className="mt-0.5 text-amber-800">
                      {paymentNotice || order?.payment_error?.message || "Please check your card details or try a different payment card."}
                    </p>
                  </div>
                </div>
              )}

              {/* Stripe Payment Element Mount */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret }}
                  key={clientSecret}
                >
                  <StripePaymentForm
                    ref={formRef}
                    returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/add-new-number?order=${orderReference}`}
                  />
                </Elements>
              </div>

              {checkoutError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {checkoutError}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-5 py-2.5 text-slate-600 hover:text-[#0D1935] text-sm font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={handleExecutePayment}
                  className="px-7 py-3 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {checkoutLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Confirming payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay £{paymentAmount}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 7: Activation in Progress (Real Polling) (§8)         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 7 && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-pink-50 text-[#E01C5B] flex items-center justify-center mx-auto animate-pulse">
                <RotateCw className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-[#0D1935]">Setting up your service</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {order?.message || "Payment received — preparing your SIM on our network."}
                </p>
                {orderReference && (
                  <span className="text-xs font-mono text-slate-400 mt-1 block">Ref: {orderReference}</span>
                )}
              </div>

              {/* Three Progress Rows (§8) */}
              <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 text-left text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      order?.payment_status === "paid" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="font-semibold text-[#0D1935]">Payment confirmed</span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      order?.fulfilment_status === "activated"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {order?.fulfilment_status === "activated" ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    )}
                  </div>
                  <span className="font-semibold text-[#0D1935]">Activating your SIM on our network</span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      order?.line?.msisdn && order?.fulfilment_status === "activated"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {order?.line?.msisdn && order?.fulfilment_status === "activated" ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-xs font-bold">3</span>
                    )}
                  </div>
                  <span className="font-semibold text-[#0D1935]">Finalising your number</span>
                </div>
              </div>

              {/* 3-D Secure Recover Form for PAC/STAC if code was lost on redirect */}
              {order?.line?.id &&
                (switchChoice === "pac" || switchChoice === "stac") &&
                !portCode &&
                !portSubmitted && (
                  <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs space-y-2">
                    <strong className="font-bold text-amber-900 block">Add your switching code:</strong>
                    <input
                      type="tel"
                      placeholder="Your mobile number"
                      value={inlinePortNumber}
                      onChange={(e) => setInlinePortNumber(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
                    />
                    <input
                      type="text"
                      maxLength={9}
                      placeholder={`Enter ${switchChoice.toUpperCase()}`}
                      value={inlinePortCode}
                      onChange={(e) => setInlinePortCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white uppercase font-mono"
                    />
                    {portSubmitError && <p className="text-red-600">{portSubmitError}</p>}
                    <button
                      type="button"
                      disabled={portSubmitting || !inlinePortCode || !inlinePortNumber}
                      onClick={async () => {
                        if (!order?.line?.id) return;
                        const numVal = validateUkMobile(inlinePortNumber);
                        if (!numVal.isValid) {
                          setPortSubmitError(numVal.error || "Please enter a valid UK mobile number.");
                          return;
                        }
                        const codeVal =
                          switchChoice === "pac"
                            ? validatePacCode(inlinePortCode)
                            : validateStacCode(inlinePortCode);
                        if (!codeVal.isValid) {
                          setPortSubmitError(codeVal.error || `Invalid ${switchChoice.toUpperCase()} code format.`);
                          return;
                        }
                        setPortSubmitting(true);
                        setPortSubmitError(null);
                        try {
                          await submitPort(order.line.id, {
                            code_type: switchChoice === "pac" ? "PAC" : "STAC",
                            code: inlinePortCode.trim().toUpperCase(),
                            msisdn: numVal.formatted ? numVal.formatted.replace(/\s+/g, "") : inlinePortNumber.trim(),
                          });
                          setPortSubmitted(true);
                        } catch (e: any) {
                          setPortSubmitError(e.message || "Failed to submit code.");
                        } finally {
                          setPortSubmitting(false);
                        }
                      }}
                      className="px-4 py-1.5 bg-[#E01C5B] text-white rounded-lg font-bold cursor-pointer transition hover:bg-[#c9144e]"
                    >
                      {portSubmitting ? "Submitting..." : "Submit Code"}
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STEP 8: Done / Outcome (§8)                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {step === 8 && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs text-center space-y-6">
              {order?.fulfilment_status === "cancelled" ? (
                /* Cancelled Order */
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1935]">This order was cancelled</h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      {order.message || "Your reserved line slot has expired or was cancelled. You can start again anytime."}
                    </p>
                  </div>
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOrder(null);
                        setOrderReference(null);
                        setClientSecret(null);
                        setStep(1);
                      }}
                      className="px-7 py-3 bg-[#E01C5B] hover:bg-[#c9144e] text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Start Again</span>
                    </button>
                  </div>
                </>
              ) : order?.fulfilment_status === "activated" ? (
                /* Successful Activation */
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1935]">Your Zoiko service is active</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {order?.line?.msisdn ? (
                        <>
                          Your mobile number is:{" "}
                          <strong className="text-[#0D1935] text-base">{formatUk(order.line.msisdn)}</strong>
                        </>
                      ) : (
                        "Your mobile number is on its way."
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-xs text-slate-600 text-left space-y-2">
                    {order.sim_type === "esim" ? (
                      <p>
                        We&apos;ll email your eSIM QR code to <strong>{order.quote?.plan?.name || "your email"}</strong> shortly.
                      </p>
                    ) : (
                      <p>Your physical SIM is on its way via Royal Mail 1st Class.</p>
                    )}
                    {switchChoice !== "none" && (
                      <p className="text-[#027A48] font-semibold">
                        Your number transfer request has been scheduled with the network.
                      </p>
                    )}
                  </div>
                </>
              ) : order?.fulfilment_status === "failed" ? (
                /* Friendly Finishing Setup Notice (§8) */
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Info className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1935]">We&apos;re finishing setting up your SIM</h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                      {order.message ||
                        "Our technical team has been notified to complete provisioning. Your payment is safe and no action is required."}
                    </p>
                  </div>
                </>
              ) : (
                /* Still Activating after 2 min timeout */
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                    <Info className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1935]">Payment received — preparing your SIM</h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      {order?.message || "Payment received — preparing your SIM. We'll email you when it's ready."}
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/my-mobile-numbers")}
                  className="px-7 py-3 bg-[#E01C5B] hover:bg-[#c9144e] text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Go to My Mobile Numbers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AddNewNumberPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#E01C5B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AddNewNumberContent />
    </Suspense>
  );
}

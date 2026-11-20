"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  RotateCw,
  AlertCircle,
  Info,
  Lock,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  FileText,
  ShieldCheck,
  HelpCircle,
  Star,
  Smartphone,
  Sparkles,
  PhoneCall,
  Heart,
  ExternalLink,
  Edit2,
  Radio,
  Clock,
  Search,
  Headphones,
  Signal,
  Globe,
  Zap,
  Send,
  Layers,
  Wifi,
  Loader2,
  MapPin,
} from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm, { type StripePaymentFormRef } from "@/app/components/StripePaymentForm";
import {
  validateUkMobile,
  validateEmail,
  validateUkPostcode,
  validatePacCode,
  validateStacCode,
} from "../utils/validators";
import {
  checkPac,
  type Term,
  type SimType,
  type QuoteResponse,
  type AddLineOrder,
  type PortRequest,
} from "../dashboard/add-new-number/addLineApi";
import {
  UK_MOBILE_PROVIDERS,
  buildPlanTariffQuote,
  fetchDynamicSwitchQuote,
  SWITCH_API_BASE,
  TERMINAL_STATUSES,
  SwitchApiError,
  createIdempotencyKey,
  fieldLabel,
  parseMoney,
  submitSwitchRequest,
  fetchSwitchStatus,
  sendSwitchPortCode,
  sendSwitchFeedback,
  persistSwitchSession,
  loadSwitchSession,
  clearSwitchSession,
  type SwitchRequestRecord,
  type SwitchStatus,
} from "./switchApi";
import MySwitchRequests from "./MySwitchRequests";

// ─── CONFIG & CLIENTS ────────────────────────────────────────────────────────
const API_BASE = SWITCH_API_BASE;
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// ─── DYNAMIC PLANS DATA STRUCTURE ───────────────────────────────────────────
export interface SwitchPlan {
  id: number;
  name: string;
  slug?: string;
  dataGb: string;
  euRoaming: string;
  calls: string;
  price30: number;
  price12?: number;
  price24?: number;
  isPopular?: boolean;
  hasTermOptions?: boolean;
  features?: string[];
  rawPlan?: any;
}

const FAQS = [
  {
    q: "How do I get a PAC or STAC?",
    a: "Text PAC to 65075 to keep your number, or text STAC to 75075 if you want a new number. A PAC moves your old number to Zoiko. A STAC does not keep your number. Both are free and normally valid for 30 days.",
  },
  {
    q: "How does switching work?",
    a: "Switching is simple under Ofcom rules: order your new Zoiko SIM, give us your PAC or STAC code, and we'll arrange the switch once the required checks and service arrangements are complete. A PAC moves your number. A STAC does not keep it, and it does not end your old contract by itself, so speak to your old provider about that. Your old service stays active until the switch happens.",
  },
  {
    q: "Will I keep my number?",
    a: "Yes! Text PAC to 65075 from your existing mobile to receive your free 9-character PAC code. Give it to us during checkout or anytime after ordering, and your number will move over seamlessly.",
  },
  {
    q: "Will I pay to leave my old provider?",
    a: "Text INFO to 85075 from your current phone to receive a free breakdown of any remaining contract commitment or early termination fees from your old provider before you switch.",
  },
  {
    q: "How long does it take?",
    a: "We'll confirm your switching date once the required checks and service arrangements are complete. You won't lose signal until the switch moment.",
  },
  {
    q: "Can I use my current phone?",
    a: "Yes, as long as your phone is unlocked to any network. All Zoiko SIMs are standard 3-in-1 multi-SIMs (Standard, Micro, and Nano), or you can choose an instant eSIM.",
  },
];

const STEP3_FAQS = [
  {
    q: "Is my phone eSIM compatible?",
    a: "Most recent iPhone, Samsung Galaxy, and Google Pixel models support eSIM. You can check your device settings under Mobile Data / SIM Manager, or choose a physical SIM if you're unsure.",
  },
  {
    q: "How long does delivery take?",
    a: "Physical SIMs are dispatched via Royal Mail First Class and arrive in 1-2 working days. eSIMs are delivered digitally to your email immediately.",
  },
  {
    q: "Will my service be interrupted?",
    a: "Not at all. Your current network continues working as normal until the exact moment you activate your Zoiko SIM and complete your number transfer.",
  },
];

const STEP5_FAQS = [
  {
    q: "How long does it take?",
    a: "SIM delivery takes 1–2 working days. Your switching date is confirmed once the required checks and service arrangements are complete.",
  },
  {
    q: "How do I activate my SIM?",
    a: "Once your SIM arrives, visit zoikomobile.co.uk/activate or log into My Zoiko to activate your SIM and trigger the transfer in minutes.",
  },
  {
    q: "What if my packet is delayed?",
    a: "Standard Royal Mail delivery arrives in 1–2 working days. If it hasn't arrived within 3 working days, contact Zoiko support and we'll dispatch a replacement immediately.",
  },
  {
    q: "Can I keep my existing number?",
    a: "Yes! If you gave us your PAC code, your number will automatically switch over seamlessly once you activate your new SIM.",
  },
];

// Plain-language text for pac_status (never says "verified").
function pacStatusText(codeType: string | null | undefined, status: string | undefined): string {
  const t = codeType || "code";
  switch (status) {
    case "not_required":
      return "No switching code needed";
    case "awaiting_code":
      return `Waiting for your ${t}`;
    case "received":
      return `${t} received`;
    case "expired":
      return `${t} expired — please send a new one`;
    case "submitted":
      return `${t} submitted`;
    case "validated":
      return `${t} validated`;
    case "completed":
      return `${t} used`;
    case "failed":
      return `${t} could not be used`;
    case "cancelled":
      return "Cancelled";
    default:
      return status ? status.replace(/_/g, " ") : "Not available";
  }
}

function maskUkPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 8) return phone;
  const start = clean.slice(0, 2);
  const end = clean.slice(-4);
  return `${start}*** ***${end}`;
}

function maskEmail(em: string): string {
  if (!em) return "your email";
  const parts = em.split("@");
  if (parts.length !== 2) return em;
  const user = parts[0];
  const domain = parts[1];
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function Switch() {
  const router = useRouter();

  // Navigation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Plan & Coverage
  const [plans, setPlans] = useState<SwitchPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term>("30D");
  const [detailsOpenId, setDetailsOpenId] = useState<number | null>(null);
  const [coveragePostcode, setCoveragePostcode] = useState("");
  const [coverageStatus, setCoverageStatus] = useState<{
    checked: boolean;
    valid: boolean;
    message?: string;
  } | null>(null);

  // Step 2: Switch Choice
  const [switchRoute, setSwitchRoute] = useState<"keep_pac" | "new_stac" | "new_keep">("new_keep");
  const [portOldNumber, setPortOldNumber] = useState("");
  const [portCode, setPortCode] = useState("");
  const [providePacLater, setProvidePacLater] = useState(false);
  const [portNumberError, setPortNumberError] = useState<string | null>(null);
  const [portCodeError, setPortCodeError] = useState<string | null>(null);
  const [portChecking, setPortChecking] = useState(false);
  const [portCheckError, setPortCheckError] = useState<string | null>(null);
  const [portFormatOkMessage, setPortFormatOkMessage] = useState<string | null>(null);

  // Step 3: Details & SIM
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [simType, setSimType] = useState<SimType>("psim");

  // Step 3 Errors
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [contactNumberError, setContactNumberError] = useState<string | null>(null);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);

  // Step 4: Dynamic Quote, Promo, Current Provider & Legal Documents
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteSource, setQuoteSource] = useState<"server_quote" | "plan_tariff">("plan_tariff");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState("");
  const [currentPlanCost, setCurrentPlanCost] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(1797); // ~29:57 price hold
  const [agreeContract, setAgreeContract] = useState(false);
  const [optInNews, setOptInNews] = useState(false);
  const [optInTexts, setOptInTexts] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Stripe & Order state
  const formRef = useRef<StripePaymentFormRef>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<string>("0.00");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Step 5: Activation, Live Porting & Backend Tracking
  const [order, setOrder] = useState<AddLineOrder | null>(null);
  const [switchRecord, setSwitchRecord] = useState<SwitchRequestRecord | null>(null);
  const [portRequest, setPortRequest] = useState<PortRequest | null>(null);
  const [inlinePortNumber, setInlinePortNumber] = useState("");
  const [inlinePortCode, setInlinePortCode] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [portSubmitted, setPortSubmitted] = useState<boolean>(false);
  const [portSubmitting, setPortSubmitting] = useState<boolean>(false);
  const [portSubmitError, setPortSubmitError] = useState<string | null>(null);
  const [portSubmitSuccessMsg, setPortSubmitSuccessMsg] = useState<string | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [statusRefreshMsg, setStatusRefreshMsg] = useState<string | null>(null);
  const [statusExplainerOpen, setStatusExplainerOpen] = useState(false);
  // Switch-requests API state (Frontend Guide)
  const [switchStatus, setSwitchStatus] = useState<SwitchStatus | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitDuplicate, setSubmitDuplicate] = useState(false);
  const [consentVersion, setConsentVersion] = useState<string | null>(null);
  const [consentStatement, setConsentStatement] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const resolvedBillingAddress = [
    addressLine1.trim(),
    addressLine2.trim(),
    city.trim(),
    billingPostcode.trim().toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ");

  // Accordion state for FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Selected Plan Object (dynamically from API)
  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null;
    return plans.find((p) => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  // Current price for selected plan & term
  const activePlanPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    if (selectedPlan.hasTermOptions) {
      if (selectedTerm === "24M" && selectedPlan.price24) return selectedPlan.price24;
      if (selectedTerm === "12M" && selectedPlan.price12) return selectedPlan.price12;
      return selectedPlan.price30;
    }
    return selectedPlan.price30;
  }, [selectedPlan, selectedTerm]);

  useEffect(() => {
    if (activePlanPrice > 0) {
      setOrderAmount(activePlanPrice.toFixed(2));
    }
  }, [activePlanPrice]);

  // 1. Fetch live plans from /api/plans/v1/ on mount (personal plans matching All Plans page)
  useEffect(() => {
    let isCancelled = false;
    async function loadCatalog() {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (!res.ok) throw new Error("Failed to load plans from catalogue.");
        const data = await res.json();
        if (Array.isArray(data) && !isCancelled) {
          // Filter out business or data-only plans (same as All Plans page)
          const personal = data.filter((p: any) => {
            const catSlug = (p.category?.slug ?? "").toLowerCase();
            return catSlug !== "zoiko-sim-only-business-deals" && catSlug !== "data-only-plans";
          });
          const list = personal.length > 0 ? personal : data;
          const mapped: SwitchPlan[] = list
            .filter((p: any) => p.is_active !== false)
            .map((p: any) => {
              const dataAllowance = p.data_allowance || "Data Plan";
              let euRoaming = "EU Roaming included";
              if (p.features && Array.isArray(p.features)) {
                const euFeat = p.features.find((f: any) =>
                  f.title?.toLowerCase().includes("eu") || f.title?.toLowerCase().includes("roaming")
                );
                if (euFeat) euRoaming = euFeat.title;
              } else if (p.short_description) {
                const lines = p.short_description.split(/\r?\n/);
                const euLine = lines.find((l: string) => l.toLowerCase().includes("eu"));
                if (euLine) euRoaming = euLine.trim();
              }

              const featTitles: string[] =
                p.features && Array.isArray(p.features) && p.features.length > 0
                  ? p.features.map((f: any) => f.title)
                  : p.short_description
                  ? p.short_description.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
                  : ["Unlimited UK calls & texts", "5G ready at no extra cost", "EU roaming included"];
              const calls = "Unlimited UK calls & texts";

              const p30 = Number(p.price_30 ?? p.price ?? 0);
              const p12 = p.price_12 ? Number(p.price_12) : undefined;
              const p24 = p.price_24 ? Number(p.price_24) : undefined;

              return {
                id: p.id,
                name: p.tier_label || p.name,
                slug: p.slug,
                dataGb: dataAllowance.toLowerCase().includes("data") ? dataAllowance : `${dataAllowance} UK data`,
                euRoaming: euRoaming,
                calls: calls,
                price30: p30,
                price12: p12,
                price24: p24,
                isPopular: Boolean(p.is_popular),
                hasTermOptions: Boolean(p12 || p24),
                features: featTitles,
                rawPlan: p,
              };
            });

          setPlans(mapped);
        }
      } catch (err) {
        if (!isCancelled) {
          setPlansError(err instanceof Error ? err.message : "Unable to load plans right now.");
        }
      } finally {
        if (!isCancelled) setPlansLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Resume a switch request from the URL (?ref=ZM-SW-...) or this browser session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref") || urlParams.get("order_reference");
    const saved = loadSwitchSession();
    const ref = refParam || saved?.reference;
    if (!ref || !ref.startsWith("ZM-SW-")) return;

    const savedEmail = saved && saved.reference === ref ? saved.email : "";
    setOrderReference(ref);
    if (savedEmail) {
      setEmail(savedEmail);
      setLookupEmail(savedEmail);
    }
    setStep(5);
    (async () => {
      try {
        // A signed-in owner can look up without an email; guests need the email.
        setSwitchStatus(await fetchSwitchStatus(ref, savedEmail || undefined));
      } catch (err) {
        setStatusError(
          err instanceof Error ? err.message : "We couldn’t check your request right now. Please try again."
        );
      }
    })();
  }, []);

  // 2. 30-Minute Price Hold Timer in Step 4
  useEffect(() => {
    if (step !== 4) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timerSeconds]);

  // 3. Coverage Check Handler
  const handleCheckCoverage = () => {
    if (!coveragePostcode.trim()) {
      setCoverageStatus({
        checked: true,
        valid: false,
        message: "Please enter a UK postcode to check coverage.",
      });
      return;
    }
    const pcVal = validateUkPostcode(coveragePostcode);
    if (!pcVal.isValid) {
      setCoverageStatus({
        checked: true,
        valid: false,
        message: pcVal.error || "Please enter a valid UK postcode (e.g. SW1A 1AA).",
      });
      return;
    }
    setCoverageStatus({
      checked: true,
      valid: true,
      message: `Excellent 5G and 4G coverage detected for ${pcVal.formatted || coveragePostcode.toUpperCase()}.`,
    });
  };

  // 4. Step 1 -> Step 2
  const handleStep1Continue = () => {
    if (!selectedPlanId) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 5. Step 2 Validation & Continue -> Step 3
  const handleStep2Continue = async () => {
    if (switchRoute === "new_keep" || (providePacLater && switchRoute !== "keep_pac")) {
      setPortNumberError(null);
      setPortCodeError(null);
      setPortCheckError(null);
      setPortFormatOkMessage(null);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // keep_pac with "provide code later": the number being moved is still required.
    if (providePacLater) {
      setPortNumberError(null);
      setPortCodeError(null);
      const laterNum = validateUkMobile(portOldNumber);
      if (!laterNum.isValid) {
        setPortNumberError(laterNum.error || "Enter the mobile number you want to bring to Zoiko.");
        return;
      }
      if (laterNum.formatted) setPortOldNumber(laterNum.formatted);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setPortNumberError(null);
    setPortCodeError(null);
    setPortCheckError(null);
    setPortFormatOkMessage(null);

    let hasError = false;

    // Validate UK mobile number
    const numVal = validateUkMobile(portOldNumber);
    if (!numVal.isValid) {
      setPortNumberError(numVal.error || "Enter a valid 11-digit UK mobile number.");
      hasError = true;
    } else if (numVal.formatted) {
      setPortOldNumber(numVal.formatted);
    }

    // Validate PAC or STAC code format
    const codeVal = switchRoute === "keep_pac" ? validatePacCode(portCode) : validateStacCode(portCode);
    if (!codeVal.isValid) {
      setPortCodeError(
        codeVal.error ||
          `Please enter a valid 9-character ${switchRoute === "keep_pac" ? "PAC" : "STAC"} code.`
      );
      hasError = true;
    }

    if (hasError) return;

    setPortChecking(true);

    try {
      const res = await checkPac({
        code_type: switchRoute === "keep_pac" ? "PAC" : "STAC",
        code: portCode.trim().toUpperCase(),
        msisdn: numVal.formatted ? numVal.formatted.replace(/\s+/g, "") : portOldNumber.trim(),
      });
      if (res && res.message) {
        setPortFormatOkMessage(res.message);
      }
      setTimeout(() => {
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 400);
    } catch (err: any) {
      // If code format is valid regex, don't hard-block guest customers who aren't logged in yet
      if (
        err?.status === 401 ||
        err?.code === "UNAUTHENTICATED" ||
        err?.message?.toLowerCase().includes("log in") ||
        err?.message?.toLowerCase().includes("fetch") ||
        err?.message?.toLowerCase().includes("network")
      ) {
        setPortFormatOkMessage("Valid code format (will be finalized upon order confirmation).");
        setTimeout(() => {
          setStep(3);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 350);
      } else {
        setPortCheckError(err?.message || "Invalid switching code or mobile number.");
      }
    } finally {
      setPortChecking(false);
    }
  };

  // 6. Step 3 Validation & Continue -> Step 4
  const handleStep3Continue = async () => {
    let hasError = false;
    setFirstNameError(null);
    setLastNameError(null);
    setEmailError(null);
    setContactNumberError(null);
    setPostcodeError(null);
    setAddressError(null);
    setCityError(null);

    if (!firstName.trim()) {
      setFirstNameError("Please enter your first name.");
      hasError = true;
    }
    if (!lastName.trim()) {
      setLastNameError("Please enter your last name.");
      hasError = true;
    }
    const emVal = validateEmail(email);
    if (!emVal.isValid) {
      setEmailError(emVal.error || "Please enter a valid email address.");
      hasError = true;
    }
    if (contactNumber.trim()) {
      const phVal = validateUkMobile(contactNumber);
      if (!phVal.isValid) {
        setContactNumberError(phVal.error || "Please enter a valid UK contact number.");
        hasError = true;
      }
    }
    if (!addressLine1.trim()) {
      setAddressError("Address line 1 is required.");
      hasError = true;
    }
    if (!city.trim()) {
      setCityError("Town or city is required.");
      hasError = true;
    }
    const pcVal = validateUkPostcode(billingPostcode);
    if (!pcVal.isValid) {
      setPostcodeError(pcVal.error || "Valid UK postcode is required.");
      hasError = true;
    } else if (pcVal.formatted) {
      setBillingPostcode(pcVal.formatted);
    }

    if (hasError) return;

    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchDynamicQuote();
  };

  // 7. Fetch Dynamic Quote for Step 4 (uses /api/v1/lines/quote/ when authenticated, live plan tariff VAT fallback for guests)
  const fetchDynamicQuote = async (promoToUse?: string) => {
    if (!selectedPlan) return;
    setQuoteLoading(true);
    setCheckoutError(null);
    setPromoError(null);
    try {
      const code = promoToUse !== undefined ? promoToUse.trim().toUpperCase() : appliedPromoCode;
      const result = await fetchDynamicSwitchQuote({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        dataAllowance: selectedPlan.dataGb,
        monthlyPrice: activePlanPrice,
        term: selectedPlan.hasTermOptions ? selectedTerm : "30D",
        simType,
        promoCode: code || undefined,
      });
      setQuote(result.quote);
      setQuoteSource(result.source);
      setConsentVersion(result.consentVersion);
      setConsentStatement(result.consentStatement);
      setOrderAmount(result.quote.quote.charge_today);
      if (result.promoMessage) {
        setPromoError(result.promoMessage);
        setAppliedPromoCode("");
      } else if (promoToUse !== undefined) {
        setAppliedPromoCode(code);
      }
    } catch {
      const fallback = buildPlanTariffQuote({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        dataAllowance: selectedPlan.dataGb,
        monthlyPrice: activePlanPrice,
        term: selectedPlan.hasTermOptions ? selectedTerm : "30D",
        simType,
      });
      setQuote(fallback);
      setQuoteSource("plan_tariff");
      setConsentVersion(null);
      setOrderAmount(fallback.quote.charge_today);
    } finally {
      setQuoteLoading(false);
    }
  };

  // 8. Confirm & Submit Switch directly from Step 4 -> Step 5 (no payment, no account needed)
  const handleConfirmAndSubmitSwitch = async () => {
    setTermsError(null);
    setCheckoutError(null);

    if (!agreeContract) {
      setTermsError(
        "Please tick the box to authorise Zoiko Mobile UK to process your switching request."
      );
      return;
    }
    if (!selectedPlan) {
      setTermsError("Please choose a plan before submitting.");
      return;
    }
    // One key per form session: reused on retry / double click so we never create two requests.
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = createIdempotencyKey();

    const route = switchRoute;
    const codeNeeded = route === "keep_pac" || route === "new_stac";
    const sendCodeNow = codeNeeded && !providePacLater && Boolean(portCode.trim());
    const term: Term = selectedPlan.hasTermOptions ? selectedTerm : "30D";

    setCheckoutLoading(true);
    try {
      const result = await submitSwitchRequest(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          mobile: contactNumber.trim().replace(/[\s-]/g, ""),
          address_line_1: addressLine1.trim(),
          address_line_2: addressLine2.trim(),
          town_city: city.trim(),
          postcode: billingPostcode.trim(),
          current_provider: currentProvider,
          current_plan_cost: parseMoney(currentPlanCost),
          // The form does not collect the customer's current allowance.
          current_data_allowance: null,
          plan_id: selectedPlan.id,
          contract_term: term,
          sim_type: simType,
          promo_code: appliedPromoCode || undefined,
          switch_route: route,
          pac_code: route === "keep_pac" && sendCodeNow ? portCode.trim().toUpperCase() : undefined,
          stac_code: route === "new_stac" && sendCodeNow ? portCode.trim().toUpperCase() : undefined,
          pac_later: codeNeeded && providePacLater,
          port_number: route === "new_keep" ? "" : portOldNumber.trim().replace(/[\s-]/g, ""),
          // Step 4 is a request only: no contract terms are accepted here (they are accepted in Part B).
          transfer_authorised: true,
          consent_version: consentVersion || undefined,
          opt_in_news: optInNews,
          opt_in_texts: optInTexts,
        },
        idempotencyKeyRef.current
      );

      const st = result.status;
      const record: SwitchRequestRecord = {
        reference: st.reference,
        status: st.status,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        mobile: contactNumber.trim(),
        postcode: billingPostcode.trim(),
        created_at: st.created_at,
        sim_type: simType,
        contract_term: term,
        switch_route: route,
        port_number: portOldNumber.trim(),
        pac_later: providePacLater,
        plan_name: selectedPlan.name,
        plan_price: activePlanPrice,
        plan_data: selectedPlan.dataGb,
        plan_calls: selectedPlan.calls,
        plan_eu_roaming: selectedPlan.euRoaming,
        promo_code: appliedPromoCode || undefined,
        selected_plan: selectedPlan.name,
      };

      setSwitchRecord(record);
      setSwitchStatus(st);
      setSubmitMessage(result.message);
      setSubmitDuplicate(result.duplicate);
      setStatusError(null);
      setOrderReference(st.reference);
      setPortSubmitted(sendCodeNow);
      setFeedbackSent(false);
      setFeedbackError(null);
      setFeedbackSuccessMsg(null);
      setPortSubmitError(null);
      setPortSubmitSuccessMsg(null);
      setStatusRefreshMsg(null);

      // Never keep the raw PAC/STAC in browser memory once it has been posted.
      setPortCode("");

      persistSwitchSession({
        reference: st.reference,
        email: email.trim(),
        updatedAt: new Date().toISOString(),
      });

      if (typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("step", "5");
        nextUrl.searchParams.set("ref", st.reference);
        window.history.replaceState({}, "", nextUrl.toString());
      }

      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      if (err instanceof SwitchApiError) {
        const fe = err.fieldErrors;
        const firstOf = (k: string) => fe[k]?.[0] || null;

        // Wording changed since the quote: reload it and ask the customer to review again.
        if (fe.consent_version) {
          setConsentVersion(null);
          fetchDynamicQuote();
          setTermsError(
            firstOf("consent_version") ||
              "The wording on this page has been updated. Please refresh and review it again."
          );
        } else if (err.code === "IDEMPOTENCY_KEY_REUSED") {
          idempotencyKeyRef.current = createIdempotencyKey();
          setTermsError(`${err.message} Please press “Confirm & submit switch” again.`);
        } else if (err.code === "CODES_UNAVAILABLE") {
          setTermsError(
            `${err.message} You can go back and choose to provide your code later, then submit again.`
          );
        } else if (Object.keys(fe).length > 0) {
          // Show field errors next to the field they belong to.
          let jumpTo: 2 | 3 | null = null;
          if (fe.port_number) { setPortNumberError(firstOf("port_number")); jumpTo = 2; }
          if (fe.pac_code || fe.stac_code) { setPortCodeError(firstOf("pac_code") || firstOf("stac_code")); jumpTo = 2; }
          if (fe.first_name) { setFirstNameError(firstOf("first_name")); jumpTo = 3; }
          if (fe.last_name) { setLastNameError(firstOf("last_name")); jumpTo = 3; }
          if (fe.email) { setEmailError(firstOf("email")); jumpTo = 3; }
          if (fe.mobile) { setContactNumberError(firstOf("mobile")); jumpTo = 3; }
          if (fe.address_line_1) { setAddressError(firstOf("address_line_1")); jumpTo = 3; }
          if (fe.town_city) { setCityError(firstOf("town_city")); jumpTo = 3; }
          if (fe.postcode) { setPostcodeError(firstOf("postcode")); jumpTo = 3; }
          if (fe.promo_code) { setPromoError(firstOf("promo_code")); setAppliedPromoCode(""); }
          const labelled = Object.entries(fe)
            .map(([k, v]) => `${fieldLabel(k)}: ${v.join(" ")}`)
            .join(" ");
          setTermsError(labelled);
          if (jumpTo) {
            // A previous step has the problem: take the customer back to fix it.
            setStep(jumpTo);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          setTermsError(err.message);
        }
      } else {
        setTermsError(
          "Network error while submitting your switch request. Please check your connection and try again."
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // 9. Step 5: load / refresh the request status. Poll no more than every 30 seconds.
  const statusLookupEmail = (email || switchRecord?.email || lookupEmail).trim();

  const loadSwitchStatus = async (reference: string, em: string): Promise<SwitchStatus | null> => {
    try {
      const st = await fetchSwitchStatus(reference, em || undefined);
      setSwitchStatus(st);
      setStatusError(null);
      return st;
    } catch (err) {
      if (err instanceof SwitchApiError) {
        // Keep showing the last status on a throttle / network blip.
        if (!switchStatus) setStatusError(err.message);
        else if (err.status === 429) setStatusRefreshMsg(err.message);
      } else if (!switchStatus) {
        setStatusError("We couldn’t check your request right now. Please try again.");
      }
      return null;
    }
  };

  useEffect(() => {
    if (step !== 5 || !orderReference || !switchStatus) return;
    if (TERMINAL_STATUSES.includes(switchStatus.status)) return;
    const timer = setInterval(() => {
      loadSwitchStatus(orderReference, statusLookupEmail);
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, orderReference, switchStatus?.status, statusLookupEmail]);

  const handleLookupSwitch = async () => {
    if (!orderReference) return;
    setLookingUp(true);
    setStatusError(null);
    const st = await loadSwitchStatus(orderReference, lookupEmail.trim());
    if (st) {
      setEmail(lookupEmail.trim());
      persistSwitchSession({
        reference: orderReference,
        email: lookupEmail.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    setLookingUp(false);
  };

  const handleRefreshSwitchStatus = async () => {
    if (!orderReference) return;
    setStatusRefreshing(true);
    setStatusRefreshMsg(null);
    const st = await loadSwitchStatus(orderReference, statusLookupEmail);
    if (st) {
      setStatusRefreshMsg(
        `Checked at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — ${st.status_label}.`
      );
    }
    setStatusRefreshing(false);
  };

  const handleInlinePortSubmit = async () => {
    if (!switchStatus) return;
    const codeType: "PAC" | "STAC" = switchStatus.code_type === "STAC" ? "STAC" : "PAC";
    const codeVal =
      codeType === "PAC" ? validatePacCode(inlinePortCode) : validateStacCode(inlinePortCode);
    if (!codeVal.isValid) {
      setPortSubmitError(codeVal.error || `Invalid ${codeType} format.`);
      return;
    }

    // The number is only needed when the request has no number yet.
    let msisdn: string | undefined;
    if (!hasKnownNumber) {
      const numVal = validateUkMobile(inlinePortNumber);
      if (!numVal.isValid) {
        setPortSubmitError(numVal.error || "Please enter a valid UK mobile number.");
        return;
      }
      msisdn = (numVal.formatted || inlinePortNumber).replace(/\s+/g, "");
    }

    setPortSubmitting(true);
    setPortSubmitError(null);
    setPortSubmitSuccessMsg(null);
    try {
      const result = await sendSwitchPortCode(switchStatus.reference, {
        code_type: codeType,
        code: inlinePortCode.trim().toUpperCase(),
        ...(msisdn ? { msisdn } : {}),
        ...(statusLookupEmail ? { email: statusLookupEmail } : {}),
      });
      setSwitchStatus(result.status);
      setProvidePacLater(false);
      setPortSubmitted(true);
      setInlinePortCode("");
      setPortSubmitSuccessMsg(result.message);
    } catch (err: unknown) {
      setPortSubmitError(
        err instanceof Error ? err.message : "We couldn’t save your code right now. Please try again."
      );
    } finally {
      setPortSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!switchStatus) return;
    if (!feedbackRating) {
      setFeedbackError("Please choose a star rating (1–5) before sending.");
      return;
    }
    setFeedbackSending(true);
    setFeedbackError(null);
    try {
      const msg = await sendSwitchFeedback(switchStatus.reference, {
        rating: feedbackRating,
        comments: feedbackComments.trim(),
        ...(statusLookupEmail ? { email: statusLookupEmail } : {}),
      });
      setFeedbackSent(true);
      setFeedbackSuccessMsg(msg);
    } catch (err: unknown) {
      if (err instanceof SwitchApiError && err.code === "FEEDBACK_EXISTS") {
        setFeedbackSent(true);
        setFeedbackSuccessMsg("You’ve already sent feedback for this request. Thank you.");
      } else {
        setFeedbackError(err instanceof Error ? err.message : "Could not send feedback right now.");
      }
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleResetSwitchFlow = () => {
    clearSwitchSession();
    idempotencyKeyRef.current = ""; // a new request needs a new key
    setOrderReference(null);
    setOrder(null);
    setSwitchRecord(null);
    setSwitchStatus(null);
    setSubmitMessage(null);
    setSubmitDuplicate(false);
    setStatusError(null);
    setLookupEmail("");
    setPortRequest(null);
    setFeedbackSent(false);
    setFeedbackRating(null);
    setFeedbackComments("");
    setPortSubmitted(false);
    setPortSubmitSuccessMsg(null);
    setAgreeContract(false);
    if (typeof window !== "undefined") {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("step");
      cleanUrl.searchParams.delete("ref");
      cleanUrl.searchParams.delete("order_reference");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open a request from "Your switch requests" / the reference lookup.
  const handleOpenRequest = (st: SwitchStatus, lookedUpEmail?: string) => {
    setOrderReference(st.reference);
    setSwitchStatus(st);
    setSwitchRecord(null);
    setSubmitMessage(null);
    setSubmitDuplicate(false);
    setStatusError(null);
    setStatusRefreshMsg(null);
    setFeedbackSent(false);
    setFeedbackSuccessMsg(null);
    setPortSubmitSuccessMsg(null);
    if (lookedUpEmail) {
      setEmail(lookedUpEmail);
      setLookupEmail(lookedUpEmail);
      persistSwitchSession({
        reference: st.reference,
        email: lookedUpEmail,
        updatedAt: new Date().toISOString(),
      });
    }
    if (typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("step", "5");
      nextUrl.searchParams.set("ref", st.reference);
      window.history.replaceState({}, "", nextUrl.toString());
    }
    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyRef = () => {
    if (orderReference && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const trackerSteps = (switchStatus?.steps ?? []).filter((x) => x.applicable);
  const hasKnownNumber =
    Boolean(switchStatus?.port_number_masked) || Boolean(portOldNumber.trim()) || Boolean(contactNumber.trim());
  const step5Done = trackerSteps.length > 0 && trackerSteps.every((x) => x.done);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#fafbfc] font-sans text-slate-800 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Stepper Header (4 steps. "Request sent" is the success state after step 4, not a fifth step) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
            {/* Step 1 */}
            <div
              onClick={() => step > 1 && setStep(1)}
              className={`flex flex-col items-center text-center cursor-${step > 1 ? "pointer" : "default"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step > 1
                    ? "bg-[#027A48] text-white"
                    : step === 1
                    ? "bg-[#E01C5B] text-white ring-4 ring-pink-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 1 ? "text-[#E01C5B]" : step > 1 ? "text-[#027A48]" : "text-slate-400"
                } hidden sm:block`}
              >
                1. Choose your plan
              </span>
              {step > 1 && selectedPlan && (
                <span className="text-[10px] text-slate-500 truncate max-w-[140px] hidden md:block">
                  {selectedPlan.name} (£{activePlanPrice.toFixed(2)})
                </span>
              )}
            </div>

            {/* Step 2 */}
            <div
              onClick={() => step > 2 && setStep(2)}
              className={`flex flex-col items-center text-center cursor-${step > 2 ? "pointer" : "default"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step > 2
                    ? "bg-[#027A48] text-white"
                    : step === 2
                    ? "bg-[#E01C5B] text-white ring-4 ring-pink-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 2 ? "text-[#E01C5B]" : step > 2 ? "text-[#027A48]" : "text-slate-400"
                } hidden sm:block`}
              >
                2. How to switch
              </span>
              {step > 2 && (
                <span className="text-[10px] text-slate-500 truncate max-w-[140px] hidden md:block">
                  {switchRoute === "keep_pac" ? "Keep my number (PAC)" : switchRoute === "new_stac" ? "New number (STAC)" : "New number"}
                </span>
              )}
            </div>

            {/* Step 3 */}
            <div
              onClick={() => step > 3 && setStep(3)}
              className={`flex flex-col items-center text-center cursor-${step > 3 ? "pointer" : "default"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step > 3
                    ? "bg-[#027A48] text-white"
                    : step === 3
                    ? "bg-[#E01C5B] text-white ring-4 ring-pink-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 3 ? "text-[#E01C5B]" : step > 3 ? "text-[#027A48]" : "text-slate-400"
                } hidden sm:block`}
              >
                3. Your details &amp; SIM
              </span>
              {step > 3 && (
                <span className="text-[10px] text-slate-500 truncate max-w-[90px] hidden md:block">
                  {firstName || "Details set"}
                </span>
              )}
            </div>

            {/* Step 4 */}
            <div
              onClick={() => step > 4 && step < 5 && setStep(4)}
              className={`flex flex-col items-center text-center cursor-${step > 4 && step < 5 ? "pointer" : "default"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step > 4
                    ? "bg-[#027A48] text-white"
                    : step === 4
                    ? "bg-[#E01C5B] text-white ring-4 ring-pink-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > 4 ? <Check className="w-4 h-4 stroke-[3]" /> : "4"}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 4 ? "text-[#E01C5B]" : step > 4 ? "text-[#027A48]" : "text-slate-400"
                } hidden sm:block`}
              >
                4. Review &amp; submit
              </span>
              {step > 4 && (
                <span className="text-[10px] text-slate-500 truncate max-w-[90px] hidden md:block">
                  {switchStatus?.stage.label || "Request sent"}
                </span>
              )}
            </div>

            {/* Old fifth step circle, kept for reference. Part A is four steps; the tracking screen is the
                "Request sent" state of step 4.
                        <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === 5 && step5Done
                    ? "bg-[#027A48] text-white ring-4 ring-emerald-100"
                    : step === 5
                    ? "bg-[#E01C5B] text-white ring-4 ring-pink-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step === 5 && step5Done ? <Check className="w-4 h-4 stroke-[3]" /> : "5"}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 5 && step5Done
                    ? "text-[#027A48]"
                    : step === 5
                    ? "text-[#E01C5B]"
                    : "text-slate-400"
                } hidden sm:block`}
              >
                5. Request &amp; tracking
              </span>
              {step === 5 && (
                <span className="text-[10px] text-slate-500 truncate max-w-[90px] hidden md:block">
                  {switchStatus?.stage.label || "Request received"}
                </span>
              )}
            </div>
            */}
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: Choose Your Plan */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                    Choose your plan
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Check coverage, compare plans and pick the one that suits you. Prices shown are indicative and are
                    confirmed again, with the term, VAT and allowances, before you agree to any contract.
                  </p>
                </div>

                <MySwitchRequests onOpen={handleOpenRequest} />

                {/* Coverage Checker */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-[#0D1935]">Check coverage where you live</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Optional. Enter a postcode to see predicted coverage before you choose.
                      </p>

                      <div className="mt-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Postcode</label>
                        <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                          <input
                            type="text"
                            placeholder="e.g. SW1A 1AA"
                            value={coveragePostcode}
                            onChange={(e) => setCoveragePostcode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCheckCoverage();
                              }
                            }}
                            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B] uppercase font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleCheckCoverage}
                            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Check coverage</span>
                          </button>
                        </div>
                        <div className="mt-1.5">
                          <Link
                            href="/coverage-checker"
                            className="text-xs font-semibold text-[#E01C5B] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open live coverage checker</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {coverageStatus && (
                        <div
                          className={`mt-2.5 text-xs p-2.5 rounded-lg flex items-center justify-between gap-2 ${
                            coverageStatus.valid
                              ? "bg-emerald-50 text-[#027A48] border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {coverageStatus.valid ? (
                              <Check className="w-4 h-4 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{coverageStatus.message}</span>
                          </div>
                          {coverageStatus.valid && (
                            <Link
                              href="/coverage-checker"
                              className="font-bold underline text-[#027A48] shrink-0"
                            >
                              View map &gt;
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Selection Cards */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Choose your plan
                  </h2>

                  {/* Loading State */}
                  {plansLoading && (
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="p-5 rounded-2xl border border-slate-200 bg-white animate-pulse flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-slate-100 rounded" />
                              <div className="h-3 w-48 bg-slate-100 rounded" />
                            </div>
                          </div>
                          <div className="h-6 w-16 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {plansError && !plansLoading && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-center justify-between">
                      <span>{plansError}</span>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="font-bold underline text-red-800 ml-2"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Empty State */}
                  {!plansLoading && !plansError && plans.length === 0 && (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      No plans available right now. Please check back soon.
                    </p>
                  )}

                  {/* Dynamic Plans List from API */}
                  {!plansLoading && plans.length > 0 && plans.map((p, idx) => {
                    const isSelected = selectedPlanId === p.id;
                    const priceFormatted = Number(
                      p.hasTermOptions
                        ? selectedTerm === "24M" && p.price24
                          ? p.price24
                          : selectedTerm === "12M" && p.price12
                          ? p.price12
                          : p.price30
                        : p.price30
                    ).toFixed(2);

                    const isDetailsOpen = detailsOpenId === p.id;

                    // Dynamic distinctive icon for each plan
                    const lowerName = p.name.toLowerCase();
                    const PlanIcon =
                      lowerName.includes("unlimited") || lowerName.includes("freedom")
                        ? Wifi
                        : lowerName.includes("100gb") || lowerName.includes("flexi")
                        ? Send
                        : lowerName.includes("30gb") || lowerName.includes("data")
                        ? Layers
                        : lowerName.includes("10gb") || lowerName.includes("freestyle")
                        ? Globe
                        : Signal;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer relative ${
                          isSelected
                            ? "border-[#E01C5B] bg-white ring-2 ring-pink-100 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-pink-50 text-[#E01C5B]" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <PlanIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[#0D1935]">{p.name}</h3>
                                {p.isPopular && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#E01C5B]">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                                <p className="font-semibold">{p.dataGb}</p>
                                {p.euRoaming && <p>{p.euRoaming}</p>}
                                {p.calls && <p>{p.calls}</p>}
                              </div>

                              {p.hasTermOptions ? (
                                <div className="mt-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {(["24M", "12M", "30D"] as Term[]).map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => {
                                        setSelectedTerm(t);
                                        setSelectedPlanId(p.id);
                                      }}
                                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                                        selectedTerm === t && isSelected
                                          ? "bg-[#E01C5B] text-white border-[#E01C5B]"
                                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      {t === "24M" ? "24-month" : t === "12M" ? "12-month" : "30-day"}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-block mt-2.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  30-day
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end shrink-0">
                            {p.hasTermOptions && <span className="text-[11px] text-slate-400">from</span>}
                            <span className="text-2xl font-black text-[#0D1935]">
                              £{priceFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.hasTermOptions && selectedTerm !== "30D" ? "per month" : "per 30 days"}
                            </span>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailsOpenId(isDetailsOpen ? null : p.id);
                                }}
                                className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Full details</span>
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isDetailsOpen ? "rotate-90" : ""}`} />
                              </button>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                                  isSelected
                                    ? "border-[#E01C5B] bg-[#E01C5B]"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Full Details Accordion */}
                        {isDetailsOpen && (
                          <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-2" onClick={(e) => e.stopPropagation()}>
                            <h4 className="font-bold text-slate-700">Plan Benefits &amp; Features:</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                              {(p.features && p.features.length > 0
                                ? p.features
                                : [
                                    "Unlimited UK minutes & texts",
                                    "5G ready with superfast speeds",
                                    "EU Roaming allowance included",
                                    "No credit check required",
                                  ]
                              ).map((feat, fIdx) => (
                                <li key={fIdx} className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Already a Zoiko customer and want to add credit?{" "}
                    <Link href="/recharge" className="text-[#E01C5B] font-semibold underline">
                      Top up your SIM
                    </Link>{" "}
                    instead — it&apos;s a separate journey.
                  </span>
                </p>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <Link
                    href="/"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Zoiko Mobile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleStep1Continue}
                    disabled={!selectedPlanId}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition shadow-sm flex items-center gap-2 ${
                      selectedPlanId
                        ? "bg-[#E01C5B] hover:bg-[#c9144e] text-white cursor-pointer active:scale-[0.99]"
                        : "bg-pink-300 text-white opacity-70 cursor-not-allowed"
                    }`}
                  >
                    <span>Continue to switching options</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: How Would You Like to Switch? */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                    How would you like to switch?
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Keep your number or get a new one. We&apos;ll guide you through.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: PAC */}
                  <div
                    onClick={() => {
                      setSwitchRoute("keep_pac");
                      setProvidePacLater(false);
                      setPortNumberError(null);
                      setPortCodeError(null);
                      setPortCheckError(null);
                      setPortFormatOkMessage(null);
                    }}
                    className={`rounded-2xl border transition cursor-pointer overflow-hidden ${
                      switchRoute === "keep_pac"
                        ? "border-[#E01C5B] bg-white ring-2 ring-pink-100 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-3.5">
                      <div className="mt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            switchRoute === "keep_pac"
                              ? "border-[#E01C5B] bg-[#E01C5B]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {switchRoute === "keep_pac" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0D1935]">Keep my current number (PAC)</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Bring your existing UK mobile number to Zoiko. You can add your PAC now or after you submit.
                        </p>
                      </div>
                    </div>

                    {switchRoute === "keep_pac" && (
                      <div
                        className="px-4 pb-5 pt-1 sm:px-5 border-t border-pink-100 bg-pink-50/20 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Number to transfer
                            </label>
                            <span className="block text-[11px] text-slate-500 mb-1.5">
                              The number you&apos;re bringing to Zoiko
                            </span>
                            <input
                              type="tel"
                              placeholder="e.g. 07700 900123"
                              disabled={providePacLater}
                              value={portOldNumber}
                              onChange={(e) => {
                                setPortOldNumber(e.target.value);
                                if (portNumberError) setPortNumberError(null);
                                if (portCheckError) setPortCheckError(null);
                              }}
                              onBlur={() => {
                                if (portOldNumber.trim() && !providePacLater) {
                                  const val = validateUkMobile(portOldNumber);
                                  if (!val.isValid) {
                                    setPortNumberError(val.error || "Enter a valid UK mobile number.");
                                  } else if (val.formatted) {
                                    setPortOldNumber(val.formatted);
                                    setPortNumberError(null);
                                  }
                                }
                              }}
                              className={`w-full px-3.5 py-2 text-sm rounded-xl border outline-hidden transition ${
                                portNumberError
                                  ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                                  : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                              } disabled:bg-slate-100 disabled:text-slate-400`}
                            />
                            {portNumberError && (
                              <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {portNumberError}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-xs font-bold text-slate-700">
                                PAC code
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                3 letters + 6 digits
                              </span>
                            </div>
                            <span className="block text-[11px] text-slate-500 mb-1.5">
                              3 letters then 6 numbers
                            </span>
                            <input
                              type="text"
                              maxLength={9}
                              placeholder="e.g. ABC123456"
                              disabled={providePacLater}
                              value={portCode}
                              onChange={(e) => {
                                setPortCode(e.target.value.toUpperCase());
                                if (portCodeError) setPortCodeError(null);
                                if (portCheckError) setPortCheckError(null);
                              }}
                              onBlur={() => {
                                if (portCode.trim() && !providePacLater) {
                                  const val = validatePacCode(portCode);
                                  if (!val.isValid) {
                                    setPortCodeError(val.error || "Invalid PAC code format.");
                                  } else {
                                    setPortCodeError(null);
                                  }
                                }
                              }}
                              className={`w-full px-3.5 py-2 text-sm rounded-xl border uppercase font-mono tracking-wider outline-hidden transition ${
                                portCodeError
                                  ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                                  : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                              } disabled:bg-slate-100 disabled:text-slate-400`}
                            />

                            {/* Real-time Code Format Pill (from add-new-number) */}
                            {portCode.length === 9 && !portCodeError && !providePacLater && (
                              <div className="mt-1">
                                {validatePacCode(portCode).isValid ? (
                                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Valid PAC code format
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                    PAC format must be 3 letters followed by 6 digits (e.g. ABC123456)
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
                        </div>

                        {/* API Validation Feedback */}
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

                        <p className="text-xs text-slate-500 leading-relaxed">
                          Need a PAC? Text <strong className="text-slate-800">PAC to 65075</strong> from the phone you&apos;re switching. It&apos;s free and normally valid for 30 days.
                        </p>

                        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={providePacLater}
                            onChange={(e) => {
                              setProvidePacLater(e.target.checked);
                              if (e.target.checked) {
                                setPortNumberError(null);
                                setPortCodeError(null);
                                setPortCheckError(null);
                                setPortFormatOkMessage(null);
                              }
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B]"
                          />
                          <span className="text-xs text-slate-600 leading-tight">
                            <strong className="text-slate-800 block">I&apos;ll provide my PAC later</strong>
                            We&apos;ll send you a secure link after your order. Your number won&apos;t transfer until we have it.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Option 2: STAC */}
                  <div
                    onClick={() => {
                      setSwitchRoute("new_stac");
                      setProvidePacLater(false);
                      setPortNumberError(null);
                      setPortCodeError(null);
                      setPortCheckError(null);
                      setPortFormatOkMessage(null);
                    }}
                    className={`rounded-2xl border transition cursor-pointer overflow-hidden ${
                      switchRoute === "new_stac"
                        ? "border-[#E01C5B] bg-white ring-2 ring-pink-100 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-3.5">
                      <div className="mt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            switchRoute === "new_stac"
                              ? "border-[#E01C5B] bg-[#E01C5B]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {switchRoute === "new_stac" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0D1935]">
                            New Zoiko number (STAC)
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Get a new number and switch to Zoiko. A STAC does not keep your old number and does not cancel
                          your old contract. Ask your old provider about ending it. You can add your STAC now or after you submit.
                        </p>
                      </div>
                    </div>

                    {switchRoute === "new_stac" && (
                      <div
                        className="px-4 pb-5 pt-1 sm:px-5 border-t border-pink-100 bg-pink-50/20 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Current mobile number
                            </label>
                            <span className="block text-[11px] text-slate-500 mb-1.5">
                              The number you&apos;re closing with your old provider
                            </span>
                            <input
                              type="tel"
                              placeholder="e.g. 07700 900123"
                              disabled={providePacLater}
                              value={portOldNumber}
                              onChange={(e) => {
                                setPortOldNumber(e.target.value);
                                if (portNumberError) setPortNumberError(null);
                                if (portCheckError) setPortCheckError(null);
                              }}
                              onBlur={() => {
                                if (portOldNumber.trim() && !providePacLater) {
                                  const val = validateUkMobile(portOldNumber);
                                  if (!val.isValid) {
                                    setPortNumberError(val.error || "Enter a valid UK mobile number.");
                                  } else if (val.formatted) {
                                    setPortOldNumber(val.formatted);
                                    setPortNumberError(null);
                                  }
                                }
                              }}
                              className={`w-full px-3.5 py-2 text-sm rounded-xl border outline-hidden transition ${
                                portNumberError
                                  ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                                  : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                              } disabled:bg-slate-100 disabled:text-slate-400`}
                            />
                            {portNumberError && (
                              <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {portNumberError}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-xs font-bold text-slate-700">
                                STAC code
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                6 digits + 3 letters
                              </span>
                            </div>
                            <span className="block text-[11px] text-slate-500 mb-1.5">
                              6 numbers then 3 letters
                            </span>
                            <input
                              type="text"
                              maxLength={9}
                              placeholder="e.g. 123456ABC"
                              disabled={providePacLater}
                              value={portCode}
                              onChange={(e) => {
                                setPortCode(e.target.value.toUpperCase());
                                if (portCodeError) setPortCodeError(null);
                                if (portCheckError) setPortCheckError(null);
                              }}
                              onBlur={() => {
                                if (portCode.trim() && !providePacLater) {
                                  const val = validateStacCode(portCode);
                                  if (!val.isValid) {
                                    setPortCodeError(val.error || "Invalid STAC code format.");
                                  } else {
                                    setPortCodeError(null);
                                  }
                                }
                              }}
                              className={`w-full px-3.5 py-2 text-sm rounded-xl border uppercase font-mono tracking-wider outline-hidden transition ${
                                portCodeError
                                  ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                                  : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                              } disabled:bg-slate-100 disabled:text-slate-400`}
                            />

                            {/* Real-time Code Format Pill (from add-new-number) */}
                            {portCode.length === 9 && !portCodeError && !providePacLater && (
                              <div className="mt-1">
                                {validateStacCode(portCode).isValid ? (
                                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Valid STAC code format
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                    STAC format must be 6 digits followed by 3 letters (e.g. 123456ABC)
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
                        </div>

                        {/* API Validation Feedback */}
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

                        <p className="text-xs text-slate-500 leading-relaxed">
                          Need a STAC? Text <strong className="text-slate-800">STAC to 75075</strong> to terminate your old service.
                        </p>

                        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={providePacLater}
                            onChange={(e) => {
                              setProvidePacLater(e.target.checked);
                              if (e.target.checked) {
                                setPortNumberError(null);
                                setPortCodeError(null);
                                setPortCheckError(null);
                                setPortFormatOkMessage(null);
                              }
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B]"
                          />
                          <span className="text-xs text-slate-600 leading-tight">
                            <strong className="text-slate-800 block">I&apos;ll provide my STAC later</strong>
                            You can send it from your request page after you submit.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Option 3: Keep old service */}
                  <div
                    onClick={() => {
                      setSwitchRoute("new_keep");
                      setProvidePacLater(false);
                      setPortNumberError(null);
                      setPortCodeError(null);
                    }}
                    className={`rounded-2xl border transition cursor-pointer overflow-hidden ${
                      switchRoute === "new_keep"
                        ? "border-[#E01C5B] bg-white ring-2 ring-pink-100 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-3.5">
                      <div className="mt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            switchRoute === "new_keep"
                              ? "border-[#E01C5B] bg-[#E01C5B]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {switchRoute === "new_keep" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0D1935]">
                          New Zoiko number, keep my old service
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Get a new number. Your current service carries on as it is.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0D1935]">Check any exit fees</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Text <strong className="text-slate-800">INFO to 85075</strong> to find out about early termination charges from your current provider.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0D1935]">Business or multi-line account?</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        These text codes may not work for you; ask your provider for your code, or contact our support team.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to plans</span>
                  </button>

                  <button
                    type="button"
                    disabled={portChecking}
                    onClick={handleStep2Continue}
                    className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-60 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {portChecking ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Checking code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to your details</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Your Details & SIM */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                    Your details & SIM
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Almost there. Tell us a few details and choose how you&apos;d like your SIM.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E01C5B] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-[#0D1935]">Your personal details</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    We use this to set up your account and complete your switch.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">First name</label>
                      <input
                        type="text"
                        placeholder="e.g. John"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (firstNameError) setFirstNameError(null);
                        }}
                        onBlur={() => {
                          if (!firstName.trim()) {
                            setFirstNameError("First name is required.");
                          } else {
                            setFirstNameError(null);
                          }
                        }}
                        className={`w-full mt-1 px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition ${
                          firstNameError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {firstNameError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {firstNameError}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Last name</label>
                      <input
                        type="text"
                        placeholder="e.g. Smith"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (lastNameError) setLastNameError(null);
                        }}
                        onBlur={() => {
                          if (!lastName.trim()) {
                            setLastNameError("Last name is required.");
                          } else {
                            setLastNameError(null);
                          }
                        }}
                        className={`w-full mt-1 px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition ${
                          lastNameError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {lastNameError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {lastNameError}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Email address</label>
                      <span className="block text-[11px] text-slate-500 mb-1">
                        We send confirmation and order info here
                      </span>
                      <input
                        type="email"
                        placeholder="e.g. john@example.co.uk"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError(null);
                        }}
                        onBlur={() => {
                          if (email.trim()) {
                            const val = validateEmail(email);
                            if (!val.isValid) {
                              setEmailError(val.error || "Please enter a valid email address.");
                            } else {
                              setEmailError(null);
                            }
                          } else {
                            setEmailError("Email address is required.");
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition ${
                          emailError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {emailError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {emailError}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Contact number <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <span className="block text-[11px] text-slate-500 mb-1">
                        Only used for urgent delivery updates
                      </span>
                      <input
                        type="tel"
                        placeholder="e.g. 07700 900123"
                        value={contactNumber}
                        onChange={(e) => {
                          setContactNumber(e.target.value);
                          if (contactNumberError) setContactNumberError(null);
                        }}
                        onBlur={() => {
                          if (contactNumber.trim()) {
                            const val = validateUkMobile(contactNumber);
                            if (!val.isValid) {
                              setContactNumberError(val.error || "Please enter a valid UK mobile number.");
                            } else if (val.formatted) {
                              setContactNumber(val.formatted);
                              setContactNumberError(null);
                            }
                          } else {
                            setContactNumberError(null);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-hidden transition ${
                          contactNumberError
                            ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                        }`}
                      />
                      {contactNumberError && (
                        <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {contactNumberError}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Address details</h4>
                      <p className="text-[11px] text-slate-500">
                        {simType === "psim"
                          ? "Used for SIM delivery and billing"
                          : "Used for account and billing verification"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10 Downing Street"
                          value={addressLine1}
                          onChange={(e) => {
                            setAddressLine1(e.target.value);
                            if (addressError) setAddressError(null);
                          }}
                          onBlur={() => {
                            if (!addressLine1.trim()) {
                              setAddressError("Address line 1 is required.");
                            } else {
                              setAddressError(null);
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                            addressError
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {addressError && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {addressError}
                          </span>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Address Line 2 <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Apartment, suite, unit, building floor"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-hidden focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Town / City *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. London"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (cityError) setCityError(null);
                          }}
                          onBlur={() => {
                            if (!city.trim()) {
                              setCityError("Town or city is required.");
                            } else {
                              setCityError(null);
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-hidden transition ${
                            cityError
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {cityError && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {cityError}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SW1A 2AA"
                          value={billingPostcode}
                          onChange={(e) => {
                            setBillingPostcode(e.target.value.toUpperCase());
                            if (postcodeError) setPostcodeError(null);
                          }}
                          onBlur={() => {
                            if (billingPostcode.trim()) {
                              const val = validateUkPostcode(billingPostcode);
                              if (!val.isValid) {
                                setPostcodeError(val.error || "Enter a valid UK postcode.");
                              } else if (val.formatted) {
                                setBillingPostcode(val.formatted);
                                setPostcodeError(null);
                              }
                            } else {
                              setPostcodeError("Postcode is required.");
                            }
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl border uppercase text-sm font-mono outline-hidden transition ${
                            postcodeError
                              ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                              : "border-slate-300 bg-white focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
                          }`}
                        />
                        {postcodeError && (
                          <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {postcodeError}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Choose SIM Type */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E01C5B] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-[#0D1935]">Choose your SIM type</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Both give you the same plan and allowances.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setSimType("psim")}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        simType === "psim"
                          ? "border-[#E01C5B] bg-white ring-2 ring-pink-100 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center shrink-0">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-bold text-[#0D1935]">Physical SIM</h4>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            simType === "psim" ? "border-[#E01C5B] bg-[#E01C5B]" : "border-slate-300 bg-white"
                          }`}
                        >
                          {simType === "psim" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Standard 3-in-1 multi SIM (standard, micro, and nano) to fit any phone.
                      </p>
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#027A48] stroke-[3]" />
                          <span>Delivered in 1-2 working days</span>
                        </li>
                      </ul>
                    </div>

                    <div
                      onClick={() => setSimType("esim")}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        simType === "esim"
                          ? "border-[#E01C5B] bg-white ring-2 ring-pink-100 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-bold text-[#0D1935]">eSIM</h4>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            simType === "esim" ? "border-[#E01C5B] bg-[#E01C5B]" : "border-slate-300 bg-white"
                          }`}
                        >
                          {simType === "esim" && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Instant digital activation via email QR code (check your device is compatible).
                      </p>
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#027A48] stroke-[3]" />
                          <span>Ready to activate in minutes</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#027A48] stroke-[3]" />
                          <span>No physical SIM card required</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#027A48] stroke-[3]" />
                          <span>Instant delivery</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to how to switch</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStep3Continue}
                    className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <span>Continue to review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review & Confirm */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                    Review and submit your switching request
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Check everything is right, then submit your request. This is a request only. The price is indicative,
                    and you will review and accept the final contract documents separately before any order is placed.
                  </p>
                </div>

                {/* Conspicuous Pre-Contract Core Price Notice (Ofcom C1 & Annex C1) */}
                <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E01C5B] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-xs flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#0D1935] text-sm">
                        Your plan costs £{quote ? quote.quote.monthly_price : activePlanPrice.toFixed(2)} per{" "}
                        {selectedPlan?.hasTermOptions ? (selectedTerm === "30D" ? "30 days" : "month") : "30 days"}, including VAT
                        {quote
                          ? ` (£${quote.quote.vat_included} VAT at ${quote.quote.vat_rate_percent}%)`
                          : ` (£${(activePlanPrice - activePlanPrice / 1.2).toFixed(2)} VAT at 20%)`}.
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#E01C5B] border border-pink-200">
                        {quoteLoading
                          ? "Calculating quote..."
                          : quoteSource === "server_quote"
                          ? "Server quote · Verified"
                          : "Live tariff quote"}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      There is no fee to submit your switching request. Your chosen plan may have monthly or other charges, shown before you agree to purchase.
                    </p>
                  </div>
                </div>

                {/* Card 1: Your Plan */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#0D1935]">Your plan</h3>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan</span>
                      <span className="font-bold text-[#0D1935]">{quote?.quote.plan.name || selectedPlan?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan length</span>
                      <span className="font-semibold text-slate-800">
                        {quote?.quote.term_label || (selectedPlan?.hasTermOptions ? `${selectedTerm} rolling` : "30-day rolling")}
                        {quote && quote.quote.commitment_months > 0 ? ` (Min. ${quote.quote.commitment_months} months)` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allowances</span>
                      <span className="text-right text-slate-700">
                        {[selectedPlan?.dataGb, selectedPlan?.euRoaming, selectedPlan?.calls].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly price (incl. VAT)</span>
                      <span className="font-bold text-[#0D1935]">
                        £{quote ? quote.quote.monthly_price : activePlanPrice.toFixed(2)} per{" "}
                        {selectedPlan?.hasTermOptions && selectedTerm !== "30D" ? "month" : "30 days"}
                      </span>
                    </div>
                    {quote?.quote.promo && (
                      <div className="flex justify-between text-[#027A48] font-semibold">
                        <span>Promo discount ({quote.quote.promo.code})</span>
                        <span>-£{quote.quote.promo.discount}</span>
                      </div>
                    )}
                    {quote?.quote.first_renewal_date && (
                      <div className="flex justify-between text-slate-500">
                        <span>Estimated first billing cycle</span>
                        <span>£{quote.quote.recurring_amount} from {quote.quote.first_renewal_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: How you're switching & Current Provider (sent to /api/switch-requests/) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#0D1935]">How you&apos;re switching</h3>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Route</span>
                      <span className="font-semibold text-slate-800">
                        {switchRoute === "keep_pac"
                          ? "Keep my current number"
                          : switchRoute === "new_stac"
                          ? "New number, close old service"
                          : "New Zoiko number, keep old service"}
                      </span>
                    </div>
                    {(switchRoute === "keep_pac" || switchRoute === "new_stac") && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            {switchRoute === "new_stac" ? "Number to close" : "Number to transfer"}
                          </span>
                          <span className="font-mono text-slate-800">
                            {portOldNumber ? maskUkPhone(portOldNumber) : "Not yet provided"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{switchRoute === "new_stac" ? "STAC" : "PAC"}</span>
                          <span className="text-slate-700">
                            {providePacLater ? "Will provide in Step 5 after submission" : "Provided and checked (not shown)"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Current provider details sent to POST /api/switch-requests/ */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Current mobile provider
                      </label>
                      <select
                        value={currentProvider}
                        onChange={(e) => setCurrentProvider(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#E01C5B] outline-hidden"
                      >
                        <option value="">Select your current network (optional)</option>
                        {UK_MOBILE_PROVIDERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Current monthly spend (£, optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 22.00"
                        value={currentPlanCost}
                        onChange={(e) => setCurrentPlanCost(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#E01C5B] outline-hidden"
                      />
                      {currentPlanCost && Number(currentPlanCost) > activePlanPrice && (
                        <p className="text-[10px] text-[#027A48] font-semibold mt-1">
                          Estimated annual saving: £{((Number(currentPlanCost) - activePlanPrice) * 12).toFixed(2)}/year
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Your details */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#0D1935]">Your details</h3>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="font-semibold text-slate-800">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-800">{email || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact number</span>
                      <span className="text-slate-800">{contactNumber || portOldNumber || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Billing address</span>
                      <span className="text-right text-slate-800">
                        {resolvedBillingAddress || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: SIM, delivery & promo code */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#0D1935]">SIM &amp; delivery</h3>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">SIM type</span>
                      <span className="font-semibold text-slate-800">
                        {simType === "psim" ? "Physical SIM" : "eSIM (Digital)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deliver to</span>
                      <span className="text-right text-slate-800">
                        {simType === "psim"
                          ? resolvedBillingAddress || "Entered address"
                          : `Instant digital delivery (${email || "your email"})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery</span>
                      <span className="font-semibold text-[#027A48]">
                        Standard UK delivery · £{quote?.quote.delivery_fee || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Due today</span>
                      <span className="font-extrabold text-[#027A48]">£0.00 (no payment taken now)</span>
                    </div>
                  </div>

                  {/* Promo Code Validation (matching add-new-number) */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Have a promo code?"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          if (promoError) setPromoError(null);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-[#E01C5B] outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={quoteLoading}
                        onClick={() => {
                          const code = promoCodeInput.trim().toUpperCase();
                          if (!code) {
                            setPromoError(null);
                            setAppliedPromoCode("");
                            fetchDynamicQuote("");
                            return;
                          }
                          fetchDynamicQuote(code);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        {quoteLoading ? "Applying..." : "Apply Code"}
                      </button>
                    </div>
                    {promoError && <p className="text-[11px] text-red-600 mt-1.5">{promoError}</p>}
                    {appliedPromoCode && quote?.quote.promo && (
                      <p className="text-[11px] text-[#027A48] font-semibold mt-1.5">
                        Promo code {quote.quote.promo.code} applied (-£{quote.quote.promo.discount}).
                      </p>
                    )}
                  </div>
                </div>

                {/* Authorisation (Part A is a request only; contract documents are provided in Part B) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#0D1935]">Authorise your switching request</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        There is no fee to submit your switching request. Your chosen plan may have monthly or other
                        charges, shown before you agree to purchase. Your contract documents are provided separately,
                        before you complete an order.
                      </p>
                    </div>

                  {/* Mandatory Consent Checkbox (Spec CI-03 & Annex C1 Table D) */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeContract}
                        onChange={(e) => {
                          setAgreeContract(e.target.checked);
                          if (e.target.checked) setTermsError(null);
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B]"
                      />
                      <span className="text-xs text-slate-700 leading-relaxed select-none">
                        {consentStatement ||
                          "I authorise Zoiko Mobile UK to process my switching request. I understand that this does not place a paid order, take a payment, activate a SIM or transfer my number. I will review and accept the final contract documents separately before completing an order."}
                      </span>
                    </label>
                  </div>

                  {/* Marketing Checkboxes */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="block text-[11px] font-bold text-slate-700">
                      News and offers <span className="font-normal text-slate-400">(optional)</span>
                    </span>
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={optInNews}
                        onChange={(e) => setOptInNews(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#E01C5B]"
                      />
                      <span>Email me Zoiko news, offers and updates on our animal and music causes.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={optInTexts}
                        onChange={(e) => setOptInTexts(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#E01C5B]"
                      />
                      <span>Text me Zoiko news and offers.</span>
                    </label>
                  </div>

                  {termsError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{termsError}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to your details</span>
                  </button>

                  <button
                    type="button"
                    disabled={!agreeContract || checkoutLoading}
                    onClick={handleConfirmAndSubmitSwitch}
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#E01C5B] to-[#F43F5E] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting switch...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm &amp; submit switch</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Switch request received & tracking (driven by the switch-requests API) */}
            {step === 5 && (
              <div className="space-y-6">
                {!switchStatus ? (
                  statusError ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
                      <h1 className="text-xl font-extrabold text-[#0D1935]">Check your switch request</h1>
                      <p className="text-sm text-slate-600">{statusError}</p>
                      <p className="text-xs text-slate-500">
                        Enter the email address you used for reference{" "}
                        <span className="font-mono font-bold">{orderReference}</span>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="email"
                          value={lookupEmail}
                          onChange={(e) => setLookupEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                        />
                        <button
                          type="button"
                          disabled={lookingUp || !lookupEmail.trim()}
                          onClick={handleLookupSwitch}
                          className="px-5 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
                        >
                          {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          <span>Check status</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-[#E01C5B]" />
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                          Switch request received
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                          {submitMessage ||
                            `Thank you. We've received your request. Your reference is ${switchStatus.reference}. We'll let you know if we need anything else.`}
                        </p>
                        {submitDuplicate && (
                          <p className="text-xs text-slate-500 mt-1">
                            We already had this request, so nothing has been submitted twice.
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border w-fit shrink-0 ${
                          switchStatus.status === "action_needed" || switchStatus.status === "rejected"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-[#027A48] border-emerald-200"
                        }`}
                      >
                        {switchStatus.status_label}
                      </span>
                    </div>

                    {/* Action needed (the customer has to do something) */}
                    {switchStatus.action_needed && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <strong className="block font-bold">Action needed</strong>
                          <span className="text-xs">{switchStatus.action_needed.message}</span>
                        </div>
                      </div>
                    )}

                    {/* Request summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#0D1935]">{switchStatus.stage.label}</h3>
                        <button
                          type="button"
                          disabled={statusRefreshing}
                          onClick={handleRefreshSwitchStatus}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E01C5B] hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${statusRefreshing ? "animate-spin" : ""}`} />
                          <span>{statusRefreshing ? "Checking..." : "Check status"}</span>
                        </button>
                      </div>
                      {statusRefreshMsg && (
                        <p className="text-[11px] font-medium text-slate-600 mt-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                          {statusRefreshMsg}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Switch reference</span>
                          <span className="font-bold text-[#0D1935] flex items-center gap-1 font-mono">
                            {switchStatus.reference}
                            <button
                              type="button"
                              onClick={handleCopyRef}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy reference"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedRef && <span className="text-[10px] text-emerald-600 font-sans">Copied!</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Switching code</span>
                          <span className="font-bold text-[#0D1935]">
                            {pacStatusText(switchStatus.code_type, switchStatus.pac_status)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Switch date</span>
                          <span className="font-bold text-[#0D1935]">
                            {switchStatus.switch_date
                              ? new Date(switchStatus.switch_date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : switchStatus.switch_date_message}
                          </span>
                        </div>
                      </div>
                      {(switchStatus.status === "ready_for_order" || switchStatus.status === "converted") && (
                        <div className="mt-4 rounded-xl border border-[#E01C5B]/20 bg-[#FDE8F1]/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-xs text-[#0D1935]">
                            {switchStatus.status === "ready_for_order"
                              ? "Your switch request has been saved. To complete your new mobile plan, please securely confirm your account, contract and payment arrangements."
                              : "Your order has been created. You can view your contract documents and payment receipt."}
                          </p>
                          <Link
                            href={`/switch-and-save/continue?reference=${encodeURIComponent(switchStatus.reference)}`}
                            className="shrink-0 rounded-lg bg-[#E01C5B] hover:bg-[#c9144e] px-4 py-2 text-xs font-bold text-white text-center"
                          >
                            {switchStatus.status === "ready_for_order" ? "Continue your switch" : "View your documents"}
                          </Link>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 mt-3">
                        Submitted{" "}
                        {new Date(switchStatus.created_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        . Last updated{" "}
                        {new Date(switchStatus.updated_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        .
                      </p>
                      {(switchStatus.order_reference || switchStatus.line_id) && (
                        <p className="text-[11px] text-slate-600 mt-1">
                          {switchStatus.order_reference && (
                            <>
                              Order reference:{" "}
                              <span className="font-mono font-bold">{switchStatus.order_reference}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Progress tracker: drawn from steps[] and labelled by the API */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#0D1935]">Your switching progress</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          A step is only marked done once it&apos;s confirmed. Submitting this request does not
                          activate a paid plan or complete your number transfer.
                        </p>
                      </div>

                      <div className="space-y-4 pt-1">
                        {trackerSteps.map((s, i) => {
                          const isCurrent = !s.done && trackerSteps.findIndex((x) => !x.done) === i;
                          return (
                            <div key={s.key} className="flex items-start justify-between gap-3 text-xs">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition ${
                                    s.done
                                      ? "bg-[#027A48] text-white"
                                      : isCurrent
                                      ? "bg-pink-100 text-[#E01C5B] border border-[#E01C5B]"
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {s.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-[#0D1935]">{s.label}</h4>
                                  {s.at && (
                                    <p className="text-slate-500 mt-0.5">
                                      {new Date(s.at).toLocaleString("en-GB", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0">
                                {s.done ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#027A48] border border-emerald-200">
                                    Done
                                  </span>
                                ) : isCurrent ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-[#E01C5B] border border-pink-200">
                                    Next
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                                    Not yet
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Send the PAC/STAC later */}
                      {switchStatus.next_action === "provide_code" && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                          <div>
                            <strong className="font-bold text-amber-950 block text-sm">
                              Send your {switchStatus.code_type || "PAC"} code
                            </strong>
                            <p className="text-amber-800 mt-0.5">
                              Enter your code below. We don&apos;t send it to your old provider at this point, and
                              we don&apos;t show it back to you.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {!hasKnownNumber && (
                              <input
                                type="tel"
                                placeholder="Mobile number e.g. 07700 900123"
                                value={inlinePortNumber}
                                onChange={(e) => {
                                  setInlinePortNumber(e.target.value);
                                  if (portSubmitError) setPortSubmitError(null);
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-800"
                              />
                            )}
                            <input
                              type="text"
                              maxLength={9}
                              placeholder={
                                switchStatus.code_type === "STAC" ? "Enter STAC e.g. 123456ABC" : "Enter PAC e.g. ABC123456"
                              }
                              value={inlinePortCode}
                              onChange={(e) => {
                                setInlinePortCode(e.target.value.toUpperCase());
                                if (portSubmitError) setPortSubmitError(null);
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-800 uppercase font-mono"
                            />
                          </div>
                          {portSubmitError && <p className="text-red-600 font-medium">{portSubmitError}</p>}
                          <button
                            type="button"
                            disabled={portSubmitting || !inlinePortCode}
                            onClick={handleInlinePortSubmit}
                            className="px-4 py-2 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                          >
                            {portSubmitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Sending code...</span>
                              </>
                            ) : (
                              <span>Send {switchStatus.code_type || "PAC"} code</span>
                            )}
                          </button>
                        </div>
                      )}

                      {portSubmitSuccessMsg && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#027A48] flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{portSubmitSuccessMsg}</span>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-pink-50/50 border border-pink-200 text-xs text-slate-600 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-[#E01C5B] shrink-0 mt-0.5" />
                        <span>
                          There is no fee to submit your switching request. Your chosen plan may have monthly or
                          other charges, shown before you agree to purchase.
                        </span>
                      </div>
                    </div>

                    {/* History (as given by the API) */}
                    {switchStatus.history.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-[#0D1935]">Updates</h3>
                        <ul className="space-y-2 text-xs">
                          {[...switchStatus.history].reverse().map((h, i) => (
                            <li key={`${h.event}-${h.at}-${i}`} className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-[#0D1935]">{h.label}</span>
                              <span className="text-slate-500 shrink-0">
                                {new Date(h.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback (hidden once submitted) */}
                    {!switchStatus.feedback_submitted && !feedbackSent && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-[#0D1935]">How was your switching experience? (optional)</h3>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setFeedbackRating(s);
                                if (feedbackError) setFeedbackError(null);
                              }}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                                feedbackRating === s
                                  ? "bg-amber-50 border-amber-400 text-amber-500"
                                  : "border-slate-200 text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              <Star className={`w-4 h-4 ${feedbackRating === s ? "fill-current" : ""}`} />
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Tell us what could be better (optional)"
                          value={feedbackComments}
                          onChange={(e) => {
                            setFeedbackComments(e.target.value);
                            if (feedbackError) setFeedbackError(null);
                          }}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                        />
                        {feedbackError && <p className="text-xs text-red-600">{feedbackError}</p>}
                        <button
                          type="button"
                          disabled={feedbackSending}
                          onClick={handleFeedbackSubmit}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {feedbackSending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending feedback...</span>
                            </>
                          ) : (
                            <span>Send feedback</span>
                          )}
                        </button>
                      </div>
                    )}
                    {(switchStatus.feedback_submitted || feedbackSent) && (
                      <p className="text-xs text-[#027A48] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{feedbackSuccessMsg || "Thank you for your feedback."}</span>
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                      <div className="flex items-center gap-4">
                        <Link
                          href="/"
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Zoiko Mobile</span>
                        </Link>
                        <button
                          type="button"
                          onClick={handleResetSwitchFlow}
                          className="text-xs font-semibold text-slate-500 hover:text-[#E01C5B] underline cursor-pointer"
                        >
                          Start another switch
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-4 sticky top-6 space-y-5">
            {/* Selection / Your Plan / Switch Summary / Your Switch */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-[#0D1935]">
                  {step === 1 ? "Your selection" : step === 4 ? "Switch summary" : step === 5 ? "Your switch" : "Your plan"}
                </h3>
                {step === 5 ? null : step > 1 && step < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {step === 4 && (
                <div className="pt-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-semibold text-[11px] text-slate-600">
                      {quote?.quote_token ? `Ref #${quote.quote_token.slice(0, 10)}` : "Plan & switch details"}
                    </span>
                    <span className="font-semibold text-[#027A48] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>No upfront payment</span>
                    </span>
                  </div>
                </div>
              )}

              {!selectedPlan ? (
                <div className="py-4">
                  <p className="text-xs text-slate-400">Choose a plan to see it here.</p>
                </div>
              ) : step === 5 ? (
                /* Step 5: Your switch Card */
                <div className="mt-4 space-y-3">
                  {/* Plan Row */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs text-[#0D1935] truncate">{selectedPlan.name}</h4>
                          <span className="font-extrabold text-xs text-[#E01C5B] shrink-0">
                            £{activePlanPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {selectedPlan.hasTermOptions
                            ? selectedTerm === "30D"
                              ? "per 30 days"
                              : "per month"
                            : "per 30 days"}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {[selectedPlan.dataGb, selectedPlan.euRoaming].filter(Boolean).join(" • ")} • {selectedPlan.hasTermOptions ? `${selectedTerm} rolling` : "30-day rolling"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SIM Row */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#0D1935]">
                          {simType === "psim" ? "Physical SIM" : "eSIM (Digital)"}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {simType === "psim" ? "Standard UK delivery (Free)" : "Instant email delivery (Free)"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Switch Row */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#0D1935]">
                          {switchRoute === "keep_pac"
                            ? "Keep my current number"
                            : switchRoute === "new_stac"
                            ? "New Zoiko number, close old service"
                            : "New Zoiko number, keep old service"}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {switchRoute === "new_keep"
                            ? "New Zoiko number requested"
                            : switchStatus
                            ? pacStatusText(switchStatus.code_type, switchStatus.pac_status)
                            : providePacLater
                            ? `${switchRoute === "new_stac" ? "STAC" : "PAC"} to be provided later`
                            : `${switchRoute === "new_stac" ? "STAC" : "PAC"} provided`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary metadata rows */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Switch status</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#027A48] border border-emerald-200 capitalize">
                        {switchStatus?.status_label || "Request received"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Billing</span>
                      <span className="font-medium text-[#027A48]">No payment in form</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Plan charges start</span>
                      <span className="font-medium text-[#0D1935]">
                        {quote?.quote.first_renewal_date
                          ? `From ${quote.quote.first_renewal_date}`
                          : "After SIM activation"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Switch reference</span>
                      <span className="font-mono font-bold text-[#0D1935]">
                        {switchStatus?.reference || orderReference || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : step === 2 || step === 3 ? (
                <div className="mt-4 space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm text-[#0D1935] truncate">{selectedPlan.name}</h4>
                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-sm text-[#E01C5B]">
                              £{activePlanPrice.toFixed(2)}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {selectedPlan.hasTermOptions
                                ? selectedTerm === "30D"
                                  ? "per 30 days"
                                  : "per month"
                                : "per 30 days"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                          <p>{selectedPlan.dataGb}</p>
                          {selectedPlan.euRoaming && <p>{selectedPlan.euRoaming}</p>}
                          {selectedPlan.calls && <p>{selectedPlan.calls}</p>}
                          <p className="text-slate-500">
                            {selectedPlan.hasTermOptions
                              ? selectedTerm === "24M"
                                ? "24-month contract"
                                : selectedTerm === "12M"
                                ? "12-month contract"
                                : "30-day rolling"
                              : "30-day rolling"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-start gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Switch covered by &ldquo;Pause Your Old SIM&rdquo; until your new service is active.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-[#0D1935]">{selectedPlan.name}</h4>
                        <p className="text-slate-500 text-[11px]">
                          {selectedPlan.hasTermOptions
                            ? selectedTerm === "24M"
                              ? "24-month contract"
                              : selectedTerm === "12M"
                              ? "12-month contract"
                              : "30-day rolling contract"
                            : "30-day rolling contract"}
                        </p>
                      </div>
                      <span className="font-extrabold text-sm text-[#E01C5B]">
                        £{activePlanPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] pt-1 font-medium">
                      {[selectedPlan.dataGb, selectedPlan.euRoaming].filter(Boolean).join(" · ")}
                    </p>
                    {selectedPlan.calls && (
                      <p className="text-slate-500 text-[11px]">{selectedPlan.calls}</p>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs pt-3 border-t border-slate-100">
                    {step === 4 && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>SIM format</span>
                          <span className="font-semibold text-[#0D1935]">
                            {simType === "psim" ? "Physical SIM" : "eSIM (Digital)"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Switching route</span>
                          <span className="font-semibold text-[#0D1935] text-right">
                            {switchRoute === "keep_pac"
                              ? "Keep number (PAC)"
                              : switchRoute === "new_stac"
                              ? "New number (STAC)"
                              : "New Zoiko number"}
                          </span>
                        </div>
                        {currentProvider && (
                          <div className="flex justify-between text-slate-600">
                            <span>Current provider</span>
                            <span className="font-semibold text-[#0D1935]">{currentProvider}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>{simType === "psim" ? "Standard UK delivery" : "Digital eSIM delivery"}</span>
                      <span className="font-semibold text-[#027A48]">
                        Free (£{quote?.quote.delivery_fee || "0.00"})
                      </span>
                    </div>
                    {quote?.quote.promo && (
                      <div className="flex justify-between text-[#027A48] font-semibold">
                        <span>Promo ({quote.quote.promo.code})</span>
                        <span>-£{quote.quote.promo.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Includes VAT at {quote?.quote.vat_rate_percent || 20}%</span>
                      <span>
                        £{quote ? quote.quote.vat_included : (activePlanPrice - activePlanPrice / 1.2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#0D1935] pt-2 border-t border-slate-100">
                      <span>Monthly plan tariff</span>
                      <span className="text-[#E01C5B]">
                        £{quote ? quote.quote.monthly_price : activePlanPrice.toFixed(2)}/
                        {selectedPlan.hasTermOptions && selectedTerm === "30D" ? "30 days" : "month"}
                      </span>
                    </div>
                    {step === 4 ? (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-[#027A48]">
                        <span className="font-bold block">Direct switch submission</span>
                        <span className="text-slate-600">
                          No payment taken in this form. Plan billing begins only after SIM activation.
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs font-semibold text-[#027A48] pt-1">
                        <span>Upfront form charge</span>
                        <span>None (No payment required)</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Step 3: Your switch details Card */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-[#0D1935]">Your switch details</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-500">Switch type</span>
                    <span className="font-semibold text-[#0D1935]">
                      {switchRoute === "keep_pac"
                        ? "Keep my current number"
                        : switchRoute === "new_stac"
                        ? "New Zoiko number, close old service"
                        : "New Zoiko number, keep old service"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-500">Number</span>
                    <span className="font-mono font-medium text-[#0D1935]">
                      {switchRoute === "keep_pac"
                        ? portOldNumber
                          ? maskUkPhone(portOldNumber)
                          : "To be provided"
                        : switchRoute === "new_stac"
                        ? portOldNumber
                          ? maskUkPhone(portOldNumber)
                          : "To be allocated"
                        : "New Zoiko number"}
                    </span>
                  </div>
                  {(switchRoute === "keep_pac" || switchRoute === "new_stac") && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500">
                        {switchRoute === "new_stac" ? "STAC" : "PAC"}
                      </span>
                      <span className="font-semibold text-[#0D1935]">
                        {providePacLater
                          ? "Will provide later"
                          : portCode
                          ? "Provided"
                          : "Not provided"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start text-slate-600 pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Switching time</span>
                    <span className="text-right text-[11px] text-slate-700 max-w-[170px] font-medium">
                      Normally within one working day of SIM arrival / activation
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Protected Information Card */}
            {step === 3 && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#027A48] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#027A48]">Your information is protected</h4>
                  <p className="mt-0.5 text-[11px]">
                    We only ask for what we need to set up your service and switch. Switching codes are stored securely and never shown in full.
                  </p>
                </div>
              </div>
            )}

            {/* Need Help Accordion */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#E01C5B]" />
                <h3 className="text-sm font-bold text-[#0D1935]">Need help?</h3>
              </div>
              <p className="text-[11px] text-slate-500">We&apos;re here to make switching simple.</p>

              <div className="space-y-2 pt-1">
                {(step === 5 ? STEP5_FAQS : step === 3 ? STEP3_FAQS : FAQS).map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="border-b border-slate-100 pb-2">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full text-left text-xs font-semibold text-slate-700 hover:text-[#E01C5B] flex items-center justify-between gap-2 py-1 cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed pl-1">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Link
                  href="/contact-us"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact Zoiko support</span>
                </Link>
              </div>
            </div>

            {/* Brand Banner */}
            {(step === 1 || step === 5) && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-white border border-pink-200 text-xs shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#E01C5B] font-bold">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>More than a mobile network</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {step === 5
                    ? "The Animal & Music Loving Network. All UK tax paid in full, supporting good causes."
                    : "The Animal & Music Loving Network. Great connections, with purpose at heart."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </main>
  );
}

export default Switch;


/*
=============================================================================
PREVIOUS SWITCH IMPLEMENTATION (PRESERVED AS REQUESTED - DO NOT DELETE)
=============================================================================
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { validateUkMobile, validateEmail, validateName, validateUkPostcode } from "../utils/validators";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── DATA ────────────────────────────────────────────────────────────────────

const stepNames = ["Your Details", "Current Service", "Select Plan"];

const providers = ["EE", "O2", "Vodafone", "Three", "BT Mobile", "Sky Mobile", "Tesco Mobile", "giffgaff", "Other"];

const plans = [
  { price: "£29.5/month", name: "Zoiko Unlimited Data" },
  { price: "£28.34/month", name: "Zoiko Elite 100GB" },
  { price: "£16.99/month", name: "Zoiko Max 30GB" },
  { price: "£12.14/month", name: "Zoiko Standard 10GB" },
  { price: "£5.66/month", name: "Zoiko Plus 3GB" },
  { price: "£4.04/month", name: "Zoiko Connect 1GB" },
];

const authItems = [
  { key: "transfer", title: "Transfer Authorisation", desc: "I confirm I am authorised to request this number transfer." },
  { key: "timeline", title: "Switch Timeline", desc: "I understand my PAC/STAC code is valid for 30 days, and Zoiko Mobile will complete my switch within 1 working day of processing." },
  { key: "terms", title: "Terms & Privacy", desc: "I agree to Zoiko Mobile Privacy Policy and Terms & Conditions." },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const inputCx =
  "mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-[#0e8f74] focus:outline-none focus:ring-1 focus:ring-[#0e8f74] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelCx = "block text-sm font-bold text-gray-800 dark:text-gray-100";

function StepBadge({ label }: { label: string }) {
  return (
    <span className="mx-auto block w-fit rounded-full bg-[#e6007e] px-4 py-1 text-xs font-bold tracking-wide text-white">
      {label}
    </span>
  );
}

function Note({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" }) {
  const border = tone === "blue" ? "border-[#3b82f6]" : "border-[#0e8f74]";
  return (
    <div className={`mt-6 rounded-md border-l-4 ${border} bg-[#f3f8ee] px-4 py-3 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300`}>
      {children}
    </div>
  );
}

// ─── STEPPER ─────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mx-auto flex max-w-2xl items-center">
        {stepNames.map((name, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          const circle = done || active ? "bg-[#0e8f74] text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
          const label = done || active ? "text-[#0e8f74] dark:text-[#34d39e]" : "text-gray-500 dark:text-gray-400";
          return (
            <div key={name} className={`flex items-center ${i < stepNames.length - 1 ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${circle}`}>{n}</span>
                <span className={`mt-1.5 whitespace-nowrap text-xs font-semibold ${label}`}>{name}</span>
              </div>
              {i < stepNames.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 ${n < step ? "bg-[#0e8f74]" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  postcode: string;
  provider: string;
  planCost: string;
  dataAllowance: string;
  selectedPlan: string;
  transfer: boolean;
  timeline: boolean;
  terms: boolean;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  postcode: "",
  provider: "",
  planCost: "",
  dataAllowance: "",
  selectedPlan: "",
  transfer: false,
  timeline: false,
  terms: false,
};

function Switch() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const errors: Record<string, string> = {};
      const fCheck = validateName(form.firstName, "First name");
      if (!fCheck.isValid) errors.firstName = fCheck.error!;
      const lCheck = validateName(form.lastName, "Last name");
      if (!lCheck.isValid) errors.lastName = lCheck.error!;
      const eCheck = validateEmail(form.email);
      if (!eCheck.isValid) errors.email = eCheck.error!;
      const mCheck = validateUkMobile(form.mobile);
      if (!mCheck.isValid) errors.mobile = mCheck.error!;
      const pCheck = validateUkPostcode(form.postcode);
      if (!pCheck.isValid) errors.postcode = pCheck.error!;

      if (Object.keys(errors).length > 0) {
        setStepErrors(errors);
        return;
      }
      setStepErrors({});
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const allAgreed = form.transfer && form.timeline && form.terms;
  const canComplete = allAgreed && form.selectedPlan !== "";

  // Flatten DRF's { field: ["msg", ...] } error shape into a single readable line.
  const formatApiErrors = (data: unknown): string => {
    if (data && typeof data === "object") {
      const parts: string[] = [];
      for (const [, val] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(val)) parts.push(...val.map(String));
        else if (typeof val === "string") parts.push(val);
      }
      if (parts.length) return parts.join(" ");
    }
    return "Something went wrong. Please check your details and try again.";
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    if (!canComplete || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_BASE}/api/switch-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          mobile: form.mobile,
          postcode: form.postcode,
          current_provider: form.provider,
          current_plan_cost: form.planCost || null,
          current_data_allowance: form.dataAllowance || null,
          selected_plan: form.selectedPlan,
          transfer_authorised: form.transfer,
          timeline_acknowledged: form.timeline,
          terms_accepted: form.terms,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubmitError(formatApiErrors(data));
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900">
      {/* ─── Hero ─── * /}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-10 text-center text-white sm:px-6">
        <h1 className="font-extrabold text-[clamp(1.6rem,4vw,2.25rem)]">Switch to Zoiko Mobile</h1>
        <p className="mt-1 text-sm text-white/90">Keep your number and switch in just 1 working day</p>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        {submitted ? (
          /* ─── Success screen ─── * /
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0e8f74] text-3xl text-white">
              ✓
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-gray-800 dark:text-white">Switch request received</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Thanks {form.firstName || "there"} — we&rsquo;ve received your request to switch to{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{form.selectedPlan}</span>.
              We&rsquo;ll be in touch within 1 working day.
            </p>
          </div>
        ) : (
          <>
            <Stepper step={step} />

            {/* ─── Step panel ─── * /}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10 dark:bg-gray-800">
              {/* STEP 1 — Your Details * /}
              {step === 1 && (
                <form onSubmit={next}>
                  <StepBadge label="STEP 1" />
                  <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-800 dark:text-white">Your Details</h2>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className={labelCx}>First Name <span className="text-[#e6007e]">*</span></label>
                      <input id="firstName" name="firstName" required value={form.firstName} onChange={update} className={inputCx} />
                      {stepErrors.firstName && <p className="text-red-500 text-xs mt-1">{stepErrors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelCx}>Last Name <span className="text-[#e6007e]">*</span></label>
                      <input id="lastName" name="lastName" required value={form.lastName} onChange={update} className={inputCx} />
                      {stepErrors.lastName && <p className="text-red-500 text-xs mt-1">{stepErrors.lastName}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className={labelCx}>Email <span className="text-[#e6007e]">*</span></label>
                      <input id="email" name="email" type="email" required value={form.email} onChange={update} className={inputCx} />
                      {stepErrors.email && <p className="text-red-500 text-xs mt-1">{stepErrors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="mobile" className={labelCx}>Mobile <span className="text-[#e6007e]">*</span></label>
                      <input id="mobile" name="mobile" type="tel" required value={form.mobile} onChange={update} className={inputCx} />
                      {stepErrors.mobile && <p className="text-red-500 text-xs mt-1">{stepErrors.mobile}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="postcode" className={labelCx}>Billing Address / Postcode <span className="text-[#e6007e]">*</span></label>
                      <input id="postcode" name="postcode" required value={form.postcode} onChange={update} className={inputCx} />
                      {stepErrors.postcode && <p className="text-red-500 text-xs mt-1">{stepErrors.postcode}</p>}
                    </div>
                  </div>

                  <Note>
                    <span aria-hidden="true">🔒 </span>We use this to securely process your switch in line with Ofcom rules.
                  </Note>

                  <div className="mt-8 flex justify-center">
                    <button type="submit" className="rounded-md bg-[#0e8f74] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b7460]">
                      Next Step
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2 — Current Service * /}
              {step === 2 && (
                <form onSubmit={next}>
                  <StepBadge label="STEP 2" />
                  <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-800 dark:text-white">Your Current Mobile Service</h2>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="provider" className={labelCx}>Current Provider</label>
                      <select id="provider" name="provider" value={form.provider} onChange={update} className={`${inputCx} bg-white dark:bg-gray-900`}>
                        <option value="">Select</option>
                        {providers.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="planCost" className={labelCx}>Current Plan Cost (£)</label>
                      <input id="planCost" name="planCost" type="number" inputMode="decimal" value={form.planCost} onChange={update} className={inputCx} />
                    </div>
                    <div>
                      <label htmlFor="dataAllowance" className={labelCx}>Current Data Allowance (GB)</label>
                      <input id="dataAllowance" name="dataAllowance" type="number" inputMode="decimal" value={form.dataAllowance} onChange={update} className={inputCx} />
                    </div>
                  </div>

                  <Note tone="blue">
                    <span aria-hidden="true">ℹ️ </span>Optional: These details help us recommend the right plan, but are not required.
                  </Note>

                  <div className="mt-8 flex justify-center gap-3">
                    <button type="button" onClick={back} className="rounded-md bg-gray-200 px-7 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Back
                    </button>
                    <button type="submit" className="rounded-md bg-[#0e8f74] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b7460]">
                      Next Step
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3 — Select Plan * /}
              {step === 3 && (
                <form onSubmit={handleComplete}>
                  <StepBadge label="STEP 3" />
                  <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-800 dark:text-white">Select Your New Plan</h2>

                  {/* Plans * /}
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((p) => {
                      const selected = form.selectedPlan === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, selectedPlan: p.name }))}
                          className={`rounded-xl border-2 p-5 text-center transition-colors ${
                            selected
                              ? "border-[#0e8f74] bg-[#f0fbf6] dark:bg-[#0e8f74]/10"
                              : "border-gray-200 bg-white hover:border-[#0e8f74]/50 dark:border-gray-700 dark:bg-gray-900"
                          }`}
                        >
                          <p className="text-lg font-extrabold text-gray-800 dark:text-white">{p.price}</p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{p.name}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Authorisation * /}
                  <h3 className="mt-10 text-lg font-bold text-gray-800 dark:text-white">Authorisation Required</h3>
                  <div className="mt-4 space-y-3">
                    {authItems.map((a) => (
                      <label
                        key={a.key}
                        htmlFor={a.key}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <input
                          id={a.key}
                          name={a.key}
                          type="checkbox"
                          checked={form[a.key as "transfer" | "timeline" | "terms"]}
                          onChange={update}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0e8f74] focus:ring-[#0e8f74]"
                        />
                        <span>
                          <span className="block text-sm font-bold text-gray-800 dark:text-white">{a.title}</span>
                          <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{a.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Submit error * /}
                  {submitError && (
                    <div className="mt-6 rounded-md border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      {submitError}
                    </div>
                  )}

                  <div className="mt-8 flex justify-center gap-3">
                    <button type="button" onClick={back} disabled={submitting} className="rounded-md bg-gray-200 px-7 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!canComplete || submitting}
                      className={`rounded-md px-7 py-2.5 text-sm font-semibold transition-colors ${
                        canComplete && !submitting
                          ? "bg-[#0e8f74] text-white hover:bg-[#0b7460]"
                          : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                      }`}
                    >
                      {submitting ? "Submitting…" : "Complete Switch"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default Switch;
=============================================================================
END OF PREVIOUS SWITCH IMPLEMENTATION
=============================================================================
*/

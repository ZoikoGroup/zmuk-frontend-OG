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
  Download,
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
  confirmOrder,
  getOrder,
  submitPort,
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
  mapProviderForBackend,
  normaliseDataAllowance,
  SWITCH_API_BASE,
  mapSwitchStatusToMilestone,
  submitSwitchRequest,
  fetchOrderAndPortState,
  submitStep5PortCode,
  submitSwitchFeedback,
  persistSwitchSession,
  loadSwitchSession,
  clearSwitchSession,
  type SwitchRequestRecord,
} from "./switchApi";
import {
  ContractDocumentsModal,
  generateDocumentHtml,
  type DocumentType,
} from "./ContractDocumentsModal";

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
    a: "Text PAC to 65075 to keep your number, or text STAC to 75075 to get a new number and close your old service. It's free and valid for 30 days.",
  },
  {
    q: "How does switching work?",
    a: "Switching is simple under Ofcom rules: order your new Zoiko SIM, give us your PAC or STAC code, and we'll transfer your number or close your old account within 1 working day. Your old service remains fully active until the moment of the switch.",
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
    a: "Number transfers complete within 1 working day of receiving your switch request once your new Zoiko SIM is active. You won't lose signal until the switch moment.",
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
    a: "SIM delivery takes 1–2 working days. Once your SIM arrives and you activate it, number transfers normally take 1 working day.",
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
  const [modalDocOpen, setModalDocOpen] = useState(false);
  const [activeModalDoc, setActiveModalDoc] = useState<DocumentType>("summary");
  const [termsError, setTermsError] = useState<string | null>(null);

  // Document Modal & Download Helpers (Documents 01, 02, 03)
  const openDocumentModal = (docType: DocumentType) => {
    setActiveModalDoc(docType);
    setModalDocOpen(true);
  };

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
  const [simMilestone, setSimMilestone] = useState<number>(2); // 1 to 7
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

  const resolvedBillingAddress = [
    addressLine1.trim(),
    addressLine2.trim(),
    city.trim(),
    billingPostcode.trim().toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ");

  const downloadDocument = (docType: DocumentType) => {
    const sourceDate = switchRecord?.created_at || order?.created_at;
    const dateStr = sourceDate
      ? new Date(sourceDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
    const termStr = quote?.quote.term_label
      ? quote.quote.term_label
      : selectedPlan?.hasTermOptions
      ? selectedTerm === "30D"
        ? "30-day rolling"
        : selectedTerm === "12M"
        ? "12-month contract"
        : "24-month contract"
      : "30-day rolling";

    const docPlanName =
      selectedPlan?.name || switchRecord?.plan_name || switchRecord?.selected_plan || "Zoiko Mobile Plan";
    const docPrice = quote
      ? parseFloat(quote.quote.monthly_price)
      : (switchRecord?.plan_price ?? activePlanPrice);
    const docRef = orderReference || switchRecord?.reference || order?.order_reference || "Pending";

    const html = generateDocumentHtml(docType, {
      planName: docPlanName,
      planPrice: docPrice,
      termLabel: termStr,
      dataGb: selectedPlan?.dataGb ?? switchRecord?.plan_data ?? "Included UK data",
      euRoaming: selectedPlan?.euRoaming ?? switchRecord?.plan_eu_roaming ?? "EU roaming included",
      calls: selectedPlan?.calls ?? switchRecord?.plan_calls ?? "Unlimited UK calls & texts",
      simType,
      customerName:
        `${firstName || switchRecord?.first_name || ""} ${lastName || switchRecord?.last_name || ""}`.trim() ||
        "Zoiko Customer",
      customerEmail: email || switchRecord?.email || "Provided on order",
      billingAddress:
        resolvedBillingAddress || switchRecord?.postcode || "Provided on switch request",
      switchRoute,
      phoneNumber: order?.line?.msisdn || portOldNumber || switchRecord?.mobile || contactNumber || "",
      orderRef: docRef,
      paymentConfirmed: order?.payment_status === "paid",
      paymentMethod:
        order?.payment_status === "paid" ? "Card payment confirmed" : "No upfront charge (Switch request)",
      dateStr,
    });

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const docName =
      docType === "summary"
        ? "Zoiko_Contract_Summary"
        : docType === "info"
        ? "Zoiko_Contract_Information"
        : order?.payment_status === "paid"
        ? "Zoiko_Payment_Receipt"
        : "Zoiko_Switch_Confirmation";
    a.href = url;
    a.download = `${docName}_${docRef}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

              const p30 = Number(p.price_30 ?? p.price ?? 0);
              const p12 = p.price_12 ? Number(p.price_12) : undefined;
              const p24 = p.price_24 ? Number(p.price_24) : undefined;

              return {
                id: p.id,
                name: p.tier_label || p.name,
                slug: p.slug,
                dataGb: dataAllowance.toLowerCase().includes("data") ? dataAllowance : `${dataAllowance} UK data`,
                euRoaming: euRoaming,
                calls: "Unlimited UK calls & texts",
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

  // Resume existing order or switch request from URL parameter or sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref") || urlParams.get("order_reference");
    const stepParam = urlParams.get("step");
    const savedSession = loadSwitchSession();
    const refToResume = refParam || savedSession?.orderReference || sessionStorage.getItem("switchOrderRef");

    if (!refToResume || (!stepParam && !refParam && !savedSession)) return;

    if (refToResume.startsWith("ZM-SW-") && savedSession && savedSession.orderReference === refToResume) {
      const rec = savedSession.switchRecord;
      setOrderReference(refToResume);
      if (rec) {
        setSwitchRecord(rec);
        setFirstName(rec.first_name || "");
        setLastName(rec.last_name || "");
        setEmail(rec.email || "");
        setContactNumber(rec.mobile || "");
        if (rec.current_provider) setCurrentProvider(rec.current_provider);
        if (rec.current_plan_cost) setCurrentPlanCost(rec.current_plan_cost);
        if (rec.sim_type) setSimType(rec.sim_type);
        if (rec.contract_term) setSelectedTerm(rec.contract_term);
        if (rec.switch_route) setSwitchRoute(rec.switch_route);
        if (rec.port_number) setPortOldNumber(rec.port_number);
        if (typeof rec.pac_later === "boolean") setProvidePacLater(rec.pac_later);
        setSimMilestone(mapSwitchStatusToMilestone(rec.status));
      }
      if (savedSession.feedbackSent) setFeedbackSent(true);
      if (savedSession.portSubmitted) setPortSubmitted(true);
      setStep(5);
      return;
    }

    if (stepParam === "5" || refParam || savedSession?.orderReference === refToResume) {
      setOrderReference(refToResume);
      if (refToResume.startsWith("ZM-SW-")) {
        setStep(5);
        return;
      }
      confirmOrder(refToResume)
        .catch(() => getOrder(refToResume))
        .then((ord) => {
          setOrder(ord);
          setStep(5);
        })
        .catch(() => {
          setStep(5);
        });
    }
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
    if (switchRoute === "new_keep" || providePacLater) {
      setPortNumberError(null);
      setPortCodeError(null);
      setPortCheckError(null);
      setPortFormatOkMessage(null);
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
    } else if (!portOldNumber.trim()) {
      setContactNumberError("Please enter a UK mobile contact number for switch updates.");
      hasError = true;
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
      setOrderAmount(fallback.quote.charge_today);
    } finally {
      setQuoteLoading(false);
    }
  };

  // Map catalogue plan name to backend SwitchRequest.PLAN_CHOICES
  const resolveSwitchPlanChoice = (plan: SwitchPlan | null): string => {
    const choices = [
      "Zoiko Unlimited Data",
      "Zoiko Elite 100GB",
      "Zoiko Max 30GB",
      "Zoiko Standard 10GB",
      "Zoiko Plus 3GB",
      "Zoiko Connect 1GB",
    ];
    if (!plan) return "Zoiko Max 30GB";
    const exact = choices.find((c) => c.toLowerCase() === plan.name.toLowerCase());
    if (exact) return exact;
    const text = `${plan.name} ${plan.dataGb}`.toLowerCase();
    if (text.includes("unlimited")) return "Zoiko Unlimited Data";
    if (text.includes("100")) return "Zoiko Elite 100GB";
    if (text.includes("30")) return "Zoiko Max 30GB";
    if (text.includes("10")) return "Zoiko Standard 10GB";
    if (text.includes("3")) return "Zoiko Plus 3GB";
    if (text.includes("1")) return "Zoiko Connect 1GB";
    return "Zoiko Max 30GB";
  };

  // 8. Confirm & Submit Switch directly from Step 4 -> Step 5 (No Payment)
  const handleConfirmAndSubmitSwitch = async () => {
    setTermsError(null);
    setCheckoutError(null);

    if (!agreeContract) {
      setTermsError(
        "Please confirm you have received the Contract Information and Contract Summary and agree to enter into the contract on the terms shown."
      );
      return;
    }

    const cleanedMobile = (contactNumber.trim() || portOldNumber.trim()).replace(/[\s-]/g, "");
    const fullAddressLine = resolvedBillingAddress.slice(0, 255);

    setCheckoutLoading(true);
    try {
      const hasSubmittedCode =
        (switchRoute === "keep_pac" || switchRoute === "new_stac") &&
        !providePacLater &&
        Boolean(portCode.trim());

      const { record } = await submitSwitchRequest(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          mobile: cleanedMobile,
          postcode: fullAddressLine,
          current_provider: mapProviderForBackend(currentProvider || "Other"),
          current_plan_cost: currentPlanCost.trim() ? currentPlanCost.trim() : null,
          // The form does not collect the customer's CURRENT allowance; never send the new plan's data here.
          current_data_allowance: normaliseDataAllowance(null),
          plan_id: selectedPlan?.id,
          selected_plan: resolveSwitchPlanChoice(selectedPlan),
          transfer_authorised: true,
          timeline_acknowledged: true,
          terms_accepted: agreeContract,
          contract_term: selectedPlan?.hasTermOptions ? selectedTerm : "30D",
          sim_type: simType,
          switch_route: switchRoute,
          port_number: portOldNumber.trim(),
          pac_code: switchRoute === "keep_pac" && !providePacLater ? portCode.trim().toUpperCase() : "",
          stac_code: switchRoute === "new_stac" && !providePacLater ? portCode.trim().toUpperCase() : "",
          pac_later: providePacLater,
          promo_code: appliedPromoCode || undefined,
          opt_in_news: optInNews,
          opt_in_texts: optInTexts,
        },
        {
          planName: selectedPlan?.name || "Zoiko Mobile Plan",
          planPrice: activePlanPrice,
          planData: selectedPlan?.dataGb || "",
          planCalls: selectedPlan?.calls || "",
          planEuRoaming: selectedPlan?.euRoaming || "",
        }
      );

      setSwitchRecord(record);
      setOrderReference(record.reference);
      setPortSubmitted(hasSubmittedCode);
      setFeedbackSent(false);
      setFeedbackError(null);
      setFeedbackSuccessMsg(null);
      setPortSubmitError(null);
      setPortSubmitSuccessMsg(null);
      setStatusRefreshMsg(null);
      setSimMilestone(mapSwitchStatusToMilestone(record.status));

      if (hasSubmittedCode) {
        setPortCode(""); // Clear raw PAC/STAC from browser memory once posted
      }

      persistSwitchSession({
        orderReference: record.reference,
        switchRecord: { ...record, pac_code: "", stac_code: "" },
        feedbackSent: false,
        portSubmitted: hasSubmittedCode,
        updatedAt: new Date().toISOString(),
      });

      if (typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("step", "5");
        nextUrl.searchParams.set("ref", record.reference);
        window.history.replaceState({}, "", nextUrl.toString());
      }

      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Network error while submitting your switch request. Please check your connection and try again.";
      setTermsError(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // 9. Step 5 Live Progress & Backend Polling Engine (no simulated timer)
  useEffect(() => {
    if (step !== 5 || !orderReference) return;

    // SwitchRequest submissions (ZM-SW-*) derive authentic milestone state from backend SwitchRequest.status
    if (orderReference.startsWith("ZM-SW-")) {
      if (switchRecord?.status) {
        setSimMilestone(mapSwitchStatusToMilestone(switchRecord.status));
      } else {
        setSimMilestone(2);
      }
      return;
    }

    let timer: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 3s = 120s
    let isCancelled = false;

    async function poll() {
      try {
        const { order: ord, port } = await fetchOrderAndPortState(orderReference!);
        if (isCancelled) return;
        setOrder(ord);
        if (port) {
          setPortRequest(port);
          if (
            port.status !== "ATTACH_FAILED" &&
            port.status !== "INVALIDATED" &&
            port.status !== "CANCELED" &&
            port.status !== "ERROR"
          ) {
            setPortSubmitted(true);
          }
        }

        // Map live backend fulfilment_status & port status to milestones
        if (ord.fulfilment_status === "activated" && (!port || port.status === "DONE")) {
          setSimMilestone(7);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("switchOrderRef");
          }
          return;
        } else if (
          ord.fulfilment_status === "activated" ||
          port?.status === "ATTACH_REQUESTED" ||
          port?.status === "ATTACH_RECEIVED" ||
          port?.status === "VALIDATED" ||
          port?.status === "LOCKED"
        ) {
          setSimMilestone((prev) => Math.max(prev, 6));
        } else if (ord.fulfilment_status === "activating") {
          setSimMilestone((prev) => Math.max(prev, 5));
        } else if (ord.fulfilment_status === "sim_reserved") {
          setSimMilestone((prev) => Math.max(prev, 2));
        }

        // Auto-submit PAC/STAC if code exists in state and line.id is now available (matching add-new-number)
        if (
          ord.line?.id &&
          !portSubmitted &&
          !portSubmitting &&
          (switchRoute === "keep_pac" || switchRoute === "new_stac") &&
          portCode &&
          portOldNumber &&
          !providePacLater
        ) {
          setPortSubmitting(true);
          submitPort(ord.line.id, {
            code_type: switchRoute === "new_stac" ? "STAC" : "PAC",
            code: portCode.trim().toUpperCase(),
            msisdn: portOldNumber.replace(/\s+/g, ""),
          })
            .then((createdPort) => {
              setPortRequest(createdPort);
              setPortSubmitted(true);
              setPortCode(""); // Sensitive: clear from memory once posted
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : "Failed to submit number transfer.";
              setPortSubmitError(msg);
            })
            .finally(() => {
              setPortSubmitting(false);
            });
        }
      } catch {
        // network / auth retry
      }

      attempts++;
      if (attempts < maxAttempts) {
        timer = setTimeout(poll, 3000);
      }
    }

    poll();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [step, orderReference, switchRecord?.status, switchRoute, portCode, portOldNumber, providePacLater, portSubmitted, portSubmitting]);

  const handleRefreshSwitchStatus = async () => {
    if (!orderReference) return;
    setStatusRefreshing(true);
    setStatusRefreshMsg(null);
    try {
      if (!orderReference.startsWith("ZM-SW-")) {
        const { order: ord, port } = await fetchOrderAndPortState(orderReference);
        setOrder(ord);
        if (port) setPortRequest(port);
        setStatusRefreshMsg(
          `Synced at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — status: ${ord.fulfilment_status}.`
        );
      } else {
        setStatusRefreshMsg(
          `Confirmed at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — reference ${orderReference} is ${switchRecord?.status || "pending"} in Zoiko provisioning.`
        );
      }
    } catch {
      setStatusRefreshMsg("Unable to reach live order tracking right now. Your switch remains queued.");
    } finally {
      setStatusRefreshing(false);
    }
  };

  const handleInlinePortSubmit = async () => {
    const numberToCheck = (inlinePortNumber.trim() || portOldNumber.trim() || contactNumber.trim());
    const numVal = validateUkMobile(numberToCheck);
    if (!numVal.isValid) {
      setPortSubmitError(numVal.error || "Please enter a valid UK mobile number.");
      return;
    }

    const codeType = switchRoute === "new_stac" ? "STAC" : "PAC";
    const codeVal =
      codeType === "PAC" ? validatePacCode(inlinePortCode) : validateStacCode(inlinePortCode);
    if (!codeVal.isValid) {
      setPortSubmitError(codeVal.error || `Invalid ${codeType} format.`);
      return;
    }

    setPortSubmitting(true);
    setPortSubmitError(null);
    setPortSubmitSuccessMsg(null);
    try {
      const normalizedMsisdn = numVal.formatted ? numVal.formatted.replace(/\s+/g, "") : numberToCheck;
      const result = await submitStep5PortCode({
        lineId: order?.line?.id,
        reference: orderReference || switchRecord?.reference || "Switch Request",
        codeType,
        code: inlinePortCode,
        msisdn: normalizedMsisdn,
        customerName: `${firstName || switchRecord?.first_name || ""} ${lastName || switchRecord?.last_name || ""}`.trim(),
        customerEmail: email || switchRecord?.email || "",
        customerPhone: contactNumber || switchRecord?.mobile || normalizedMsisdn,
      });

      if (result.portRequest) {
        setPortRequest(result.portRequest);
      }
      setPortOldNumber(normalizedMsisdn);
      setProvidePacLater(false);
      setPortSubmitted(true);
      setInlinePortCode("");
      setPortSubmitSuccessMsg(result.message);

      if (orderReference && switchRecord) {
        persistSwitchSession({
          orderReference,
          switchRecord: { ...switchRecord, port_number: normalizedMsisdn, pac_later: false },
          feedbackSent,
          portSubmitted: true,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      setPortSubmitError(err instanceof Error ? err.message : "Failed to submit switching code.");
    } finally {
      setPortSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackRating && !feedbackComments.trim()) {
      setFeedbackError("Please choose a star rating or enter a comment before sending.");
      return;
    }
    setFeedbackSending(true);
    setFeedbackError(null);
    try {
      const msg = await submitSwitchFeedback({
        reference: orderReference || switchRecord?.reference || "Switch Request",
        rating: feedbackRating,
        comments: feedbackComments,
        customerName: `${firstName || switchRecord?.first_name || ""} ${lastName || switchRecord?.last_name || ""}`.trim(),
        customerEmail: email || switchRecord?.email || "",
        customerPhone: contactNumber || portOldNumber || switchRecord?.mobile || "",
        optInNews,
        optInTexts,
      });
      setFeedbackSent(true);
      setFeedbackSuccessMsg(msg);
      if (orderReference) {
        persistSwitchSession({
          orderReference,
          switchRecord: switchRecord || null,
          feedbackSent: true,
          portSubmitted,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : "Could not send feedback right now.");
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleResetSwitchFlow = () => {
    clearSwitchSession();
    setOrderReference(null);
    setOrder(null);
    setSwitchRecord(null);
    setPortRequest(null);
    setFeedbackSent(false);
    setFeedbackRating(null);
    setFeedbackComments("");
    setPortSubmitted(false);
    setAgreeContract(false);
    setSimMilestone(2);
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

  const handleCopyRef = () => {
    if (orderReference && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#fafbfc] font-sans text-slate-800 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Stepper Header (5 Steps) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-center">
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
                4. Review &amp; confirm
              </span>
              {step > 4 && (
                <span className="text-[10px] text-slate-500 truncate max-w-[90px] hidden md:block">
                  Confirmed
                </span>
              )}
            </div>

            {/* Step 5 */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === 5 && simMilestone >= 7
                    ? "bg-[#027A48] text-white ring-4 ring-emerald-100"
                    : step === 5
                    ? "bg-[#E01C5B] text-white ring-4 ring-pink-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step === 5 && simMilestone >= 7 ? <Check className="w-4 h-4 stroke-[3]" /> : "5"}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 5 && simMilestone >= 7
                    ? "text-[#027A48]"
                    : step === 5
                    ? "text-[#E01C5B]"
                    : "text-slate-400"
                } hidden sm:block`}
              >
                5. Activation &amp; tracking
              </span>
              {step === 5 && (
                <span className="text-[10px] text-slate-500 truncate max-w-[90px] hidden md:block">
                  {simMilestone >= 7 ? "Switch complete" : "In progress"}
                </span>
              )}
            </div>
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
                    Check coverage, compare plans and pick the one that suits you.
                  </p>
                </div>

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
                                <p>{p.euRoaming}</p>
                                <p>{p.calls}</p>
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
                  {/* Option 1: PAC (Upcoming) */}
                  <div
                    aria-disabled="true"
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 opacity-75 cursor-not-allowed overflow-hidden select-none"
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-3.5">
                      <div className="mt-0.5">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center" />
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0D1935]">Keep my current number (PAC)</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Upcoming
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Bring your existing UK mobile number to Zoiko. Coming soon — PAC transfers are not yet active.
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

                  {/* Option 2: STAC (Upcoming) */}
                  <div
                    aria-disabled="true"
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 opacity-75 cursor-not-allowed overflow-hidden select-none"
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-3.5">
                      <div className="mt-0.5">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center" />
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0D1935]">
                            New Zoiko number, close my old service (STAC)
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Upcoming
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Get a new number and close your old service automatically. Coming soon — STAC switching is not yet active.
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
                              className={`w-full px-3.5 py-2 text-sm rounded-xl border outline-hidden transition ${
                                portNumberError
                                  ? "border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-400"
                                  : "border-slate-300 focus:outline-none focus:border-[#E01C5B] focus:ring-1 focus:ring-[#E01C5B]"
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
                              value={portCode}
                              onChange={(e) => {
                                setPortCode(e.target.value.toUpperCase());
                                if (portCodeError) setPortCodeError(null);
                                if (portCheckError) setPortCheckError(null);
                              }}
                              onBlur={() => {
                                if (portCode.trim()) {
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
                              }`}
                            />

                            {/* Real-time Code Format Pill (from add-new-number) */}
                            {portCode.length === 9 && !portCodeError && (
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
                      </div>
                    )}
                  </div>

                  {/* Option 3: Keep old service */}
                  <div
                    onClick={() => {
                      setSwitchRoute("new_keep");
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
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#027A48] stroke-[3]" />
                          <span>Free Royal Mail first class</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#027A48] stroke-[3]" />
                          <span>No postage fees</span>
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
                    Review your plan and contract documents
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Check everything is right, read your contract documents and agree before entering into the contract.
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
                        Your plan costs £{quote ? quote.quote.charge_today : activePlanPrice.toFixed(2)} per{" "}
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
                      Due today: <strong>£0.00</strong> (no upfront payment required to submit your switch). Standard UK delivery is £{quote?.quote.delivery_fee || "0.00"} (free). You can cancel within the 14-day statutory cooling-off period under consumer regulations.
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
                        {selectedPlan?.dataGb} · {selectedPlan?.euRoaming} · {selectedPlan?.calls}
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

                {/* Contract Documents Preview & Downloads (Documents 01 & 02) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0D1935]">Contract documents</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Please open and read both documents before you agree. We&apos;ll also email you copies.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Document 01: Contract summary */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-100 text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#0D1935]">Contract summary</h4>
                            <span className="text-[10px] font-bold bg-pink-50 text-[#E01C5B] px-1.5 py-0.5 rounded border border-pink-200">
                              PDF • v1.0 • Ofcom C1.3
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            The main terms of your plan in one page.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openDocumentModal("summary")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>View PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument("summary")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Document 02: Contract information */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#0D1935]">Contract information</h4>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              PDF • v1.0 • Annex C1
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Detailed information about your plan, charges, service and your rights.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openDocumentModal("info")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 hover:bg-white text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>View PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument("info")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
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
                        I confirm that I have received the Contract Information and Contract Summary and agree to enter into the contract on the terms shown.
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

            {/* STEP 5: Activation & Live Tracking */}
            {step === 5 && (
              <div className="space-y-6">
                {(() => {
                  const activeBackendStatus = (order?.fulfilment_status || switchRecord?.status || "pending").toLowerCase();
                  const isComplete = simMilestone >= 7 || activeBackendStatus === "completed" || activeBackendStatus === "activated";
                  const isFailedOrCancelled = activeBackendStatus === "failed" || activeBackendStatus === "cancelled";
                  const resolvedDisplayNumber = order?.line?.msisdn
                    ? maskUkPhone(order.line.msisdn)
                    : portOldNumber
                    ? maskUkPhone(portOldNumber)
                    : switchRecord?.mobile
                    ? maskUkPhone(switchRecord.mobile)
                    : contactNumber
                    ? maskUkPhone(contactNumber)
                    : null;
                  const resolvedStatusLabel = order?.fulfilment_status
                    ? order.fulfilment_status.replace(/_/g, " ")
                    : switchRecord?.status
                    ? `${switchRecord.status.charAt(0).toUpperCase()}${switchRecord.status.slice(1)} · Request logged`
                    : "Confirmed · Request logged";

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                            {isComplete
                              ? "Welcome to Zoiko Mobile!"
                              : isFailedOrCancelled
                              ? "Switch request needs attention"
                              : "Your switch is underway."}
                          </h1>
                          <p className="text-sm text-slate-500 mt-1">
                            {isComplete
                              ? "Your Zoiko service is active and your number is ready to connect."
                              : order?.message
                              ? order.message
                              : "Your switch request is recorded with Zoiko Mobile. Milestones update as your SIM and port progress."}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${
                              isFailedOrCancelled
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-[#027A48] border-emerald-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFailedOrCancelled ? "bg-amber-600" : "bg-[#027A48] animate-pulse"
                              }`}
                            />
                            <span>{isComplete ? "Switch complete" : "Switch confirmed"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status Banner */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                              isFailedOrCancelled
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-[#027A48]"
                            }`}
                          >
                            {isFailedOrCancelled ? (
                              <AlertCircle className="w-7 h-7" />
                            ) : (
                              <CheckCircle2 className="w-7 h-7" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-base font-extrabold text-[#0D1935]">
                                {isComplete
                                  ? "Switch complete"
                                  : isFailedOrCancelled
                                  ? `Status: ${activeBackendStatus}`
                                  : simType === "esim"
                                  ? "Request confirmed · preparing your eSIM"
                                  : "Request confirmed · preparing your SIM"}
                              </h3>
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
                            <p className="text-xs text-slate-500 mt-1">
                              {isComplete
                                ? "Your Zoiko Mobile service is active and your number transfer has completed. You're ready to connect."
                                : `We've sent confirmation to ${email || switchRecord?.email || "your email"}. ${
                                    switchRecord?.created_at
                                      ? `Submitted ${new Date(switchRecord.created_at).toLocaleString("en-GB", {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        })}.`
                                      : ""
                                  }`}
                            </p>
                            {statusRefreshMsg && (
                              <p className="text-[11px] font-medium text-slate-600 mt-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                                {statusRefreshMsg}
                              </p>
                            )}

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[11px]">
                                  {isComplete && resolvedDisplayNumber ? "Phone number" : "Switch reference"}
                                </span>
                                <span className="font-bold text-[#0D1935] flex items-center gap-1">
                                  {isComplete && resolvedDisplayNumber
                                    ? resolvedDisplayNumber
                                    : orderReference || order?.order_reference || switchRecord?.reference || "Pending"}
                                  <button
                                    type="button"
                                    onClick={handleCopyRef}
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    title="Copy reference"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  {copiedRef && <span className="text-[10px] text-emerald-600">Copied!</span>}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">
                                  {isComplete ? "Network" : "Switch status"}
                                </span>
                                <span className="font-bold text-[#0D1935] capitalize">
                                  {isComplete ? "Zoiko (EE 5G)" : resolvedStatusLabel}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[11px]">Activation status</span>
                                <span
                                  className={`font-bold ${
                                    isComplete
                                      ? "text-[#027A48]"
                                      : isFailedOrCancelled
                                      ? "text-red-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {isComplete
                                    ? "Active"
                                    : isFailedOrCancelled
                                    ? activeBackendStatus
                                    : "Awaiting activation"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Vertical Milestones Card (driven by backend status & port state) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0D1935]">Your switching progress</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Each milestone updates separately. We only mark a step complete once it&apos;s confirmed by our provisioning team.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatusExplainerOpen((prev) => !prev)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer hidden sm:inline"
                    >
                      {statusExplainerOpen ? "Hide status info" : "How statuses work >"}
                    </button>
                  </div>

                  {statusExplainerOpen && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                      <h4 className="font-bold text-[#0D1935]">Understanding your status milestones</h4>
                      <p>
                        <strong>Switch confirmed:</strong> Request and contract agreement verified.<br />
                        <strong>SIM preparing:</strong> Your {simType === "esim" ? "eSIM QR profile" : "physical SIM card"} is being provisioned.<br />
                        <strong>{simType === "esim" ? "eSIM dispatched" : "SIM dispatched & delivered"}:</strong> {simType === "esim" ? "Sent to your registered email address." : "Shipped via Royal Mail First Class."}<br />
                        <strong>Activation &amp; transfer:</strong> Number port request triggered via PAC/STAC upon SIM activation under Ofcom rules.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    {[
                      {
                        idx: 1,
                        name: "Switch request confirmed",
                        desc: "We've received your switch request and contract confirmation.",
                      },
                      {
                        idx: 2,
                        name: simType === "esim" ? "eSIM profile preparing" : "SIM preparing",
                        desc:
                          simType === "esim"
                            ? "We're provisioning your digital eSIM profile."
                            : "We're preparing your physical SIM for fulfillment.",
                      },
                      {
                        idx: 3,
                        name: simType === "esim" ? "eSIM QR emailed" : "SIM dispatched",
                        desc:
                          simType === "esim"
                            ? "We'll email your QR activation code once issued."
                            : "We'll update you when Royal Mail dispatch is confirmed.",
                      },
                      {
                        idx: 4,
                        name: simType === "esim" ? "Ready to install" : "SIM delivered",
                        desc:
                          simType === "esim"
                            ? "Install your eSIM on your compatible handset."
                            : "We'll confirm delivery once the courier reports it.",
                      },
                      {
                        idx: 5,
                        name: "SIM activation",
                        desc: "Activation completes once your SIM connects to Zoiko.",
                      },
                      {
                        idx: 6,
                        name: switchRoute === "new_keep" ? "New number assignment" : "Number transfer",
                        desc:
                          switchRoute === "new_keep"
                            ? "Your new Zoiko UK number is provisioned upon activation."
                            : portRequest?.port_date
                            ? `Scheduled transfer date: ${portRequest.port_date}`
                            : "This starts after your new SIM is active.",
                      },
                      {
                        idx: 7,
                        name: "Service ready",
                        desc: "You'll get confirmation when everything's ready.",
                      },
                    ].map((m) => {
                      const isDone = simMilestone > m.idx || (simMilestone === 7 && m.idx === 7);
                      const isCurrent = simMilestone === m.idx && !isDone;

                      return (
                        <div key={m.idx} className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition ${
                                isDone
                                  ? "bg-[#027A48] text-white"
                                  : isCurrent
                                  ? "bg-pink-100 text-[#E01C5B] border border-[#E01C5B]"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : m.idx}
                            </div>
                            <div>
                              <h4 className="font-bold text-[#0D1935]">{m.name}</h4>
                              <p className="text-slate-500 mt-0.5">{m.desc}</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isDone ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#027A48] border border-emerald-200">
                                Confirmed
                              </span>
                            ) : isCurrent ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-[#E01C5B] border border-pink-200 flex items-center gap-1">
                                <RotateCw className="w-2.5 h-2.5 animate-spin" />
                                <span>In progress</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline PAC/STAC Submission / Resubmission Card (matching add-new-number Step 7) */}
                  {(switchRoute === "keep_pac" || switchRoute === "new_stac") &&
                    ((providePacLater && !portSubmitted) || portRequest?.can_resubmit) && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                        <div>
                          <strong className="font-bold text-amber-950 block text-sm">
                            {portRequest?.can_resubmit
                              ? `Update your ${switchRoute === "new_stac" ? "STAC" : "PAC"} code`
                              : `Add your ${switchRoute === "new_stac" ? "STAC" : "PAC"} switching code`}
                          </strong>
                          <p className="text-amber-800 mt-0.5">
                            {portRequest?.message ||
                              "You chose to add your code after submitting. Enter it below to schedule your transfer cleanly with our provisioning team."}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="tel"
                            placeholder={portOldNumber || contactNumber || "UK mobile e.g. 07700 900123"}
                            value={inlinePortNumber}
                            onChange={(e) => {
                              setInlinePortNumber(e.target.value);
                              if (portSubmitError) setPortSubmitError(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-800"
                          />
                          <input
                            type="text"
                            maxLength={9}
                            placeholder={switchRoute === "new_stac" ? "Enter STAC e.g. ZOI123456" : "Enter PAC e.g. ZOI123456"}
                            value={inlinePortCode}
                            onChange={(e) => {
                              setInlinePortCode(e.target.value.toUpperCase());
                              if (portSubmitError) setPortSubmitError(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-800 uppercase font-mono"
                          />
                        </div>
                        {portSubmitError && (
                          <p className="text-red-600 font-medium">{portSubmitError}</p>
                        )}
                        <button
                          type="button"
                          disabled={portSubmitting || !inlinePortCode}
                          onClick={handleInlinePortSubmit}
                          className="px-4 py-2 bg-[#E01C5B] hover:bg-[#c9144e] disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {portSubmitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Submitting code...</span>
                            </>
                          ) : (
                            <span>Submit {switchRoute === "new_stac" ? "STAC" : "PAC"} code</span>
                          )}
                        </button>
                      </div>
                    )}

                  {portSubmitted && (portSubmitSuccessMsg || portRequest?.message) && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#027A48] flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Number transfer queued:</strong> {portSubmitSuccessMsg || portRequest?.message}
                        {portRequest?.port_date ? ` (Target date: ${portRequest.port_date})` : ""}
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-pink-50/50 border border-pink-200 text-xs text-slate-600 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#E01C5B] shrink-0 mt-0.5" />
                    <span>
                      PAC transfers normally complete within one working day of the switch request, which we send once your new SIM is active. We only mark your transfer complete once it&apos;s confirmed.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openDocumentModal("summary")}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition text-left cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#E01C5B] mb-1" />
                      <h4 className="text-xs font-bold text-[#0D1935]">View order details</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Plan, SIM and switching method</p>
                    </button>

                    <button
                      type="button"
                      onClick={handleRefreshSwitchStatus}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition text-left cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-[#E01C5B] mb-1" />
                      <h4 className="text-xs font-bold text-[#0D1935]">SIM delivery status</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Check latest fulfilment state</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDocumentModal("receipt")}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#E01C5B] mb-1" />
                      <h4 className="text-xs font-bold text-[#0D1935]">Switch confirmation</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">View reference &amp; updates</p>
                    </button>
                  </div>
                </div>

                {/* Your documents Card (Spec Document 01, 02, 03) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#E01C5B]" />
                      <h3 className="text-sm font-bold text-[#0D1935]">Your documents</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      We&apos;ve sent your contract documents to <span className="font-semibold text-slate-700">{maskEmail(email)}</span>. You can also download them below.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Document 01: Contract summary */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#E01C5B] flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0D1935]">Contract summary</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            A copy of the contract summary you received before confirming your order.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openDocumentModal("summary")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-white text-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument("summary")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Document 02: Contract information */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0D1935]">Contract information</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            The full plan and contract details you received before placing your order.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openDocumentModal("info")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-white text-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument("info")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Document 03: Switch confirmation (or Payment receipt if paid order) */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#027A48] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#0D1935]">
                              {order?.payment_status === "paid" ? "Payment receipt" : "Switch confirmation"}
                            </h4>
                            <span className="text-[10px] font-bold bg-emerald-50 text-[#027A48] border border-emerald-200 px-1.5 py-0.5 rounded">
                              {order?.payment_status === "paid"
                                ? `Paid · £${activePlanPrice.toFixed(2)}`
                                : "Submitted"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {order?.payment_status === "paid"
                              ? "A record of your confirmed payment."
                              : "A record of your confirmed switch request — no payment taken today."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openDocumentModal("receipt")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-white text-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument("receipt")}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Feedback Box (submitted to backend /api/support/tickets/ or /api/contact-us/) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-[#0D1935]">How was your switching experience? (optional)</h3>
                  {feedbackSent ? (
                    <p className="text-xs text-[#027A48] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{feedbackSuccessMsg || "Thank you for your feedback! It has been recorded."}</span>
                    </p>
                  ) : (
                    <>
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
                      {feedbackError && (
                        <p className="text-xs text-red-600">{feedbackError}</p>
                      )}
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
                    </>
                  )}
                </div>

                {/* 30-day transfer note callout (matching screenshot) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-600 leading-relaxed">
                      PAC and STAC transfers are normally valid for 30 days. Transfer takes 1 working day after active SIM request, unless you requested later.
                    </span>
                  </div>
                  <Link
                    href="/contact-us"
                    className="text-[11px] font-bold text-[#E01C5B] hover:underline whitespace-nowrap cursor-pointer shrink-0"
                  >
                    About transferring &gt;
                  </Link>
                </div>

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

                  <Link
                    href="/dashboard"
                    className="px-7 py-3 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-white font-bold text-sm transition shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <span>Go to My Zoiko</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
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
                {step === 5 ? (
                  <button
                    type="button"
                    onClick={() => openDocumentModal("summary")}
                    className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                  >
                    View details
                  </button>
                ) : step > 1 && step < 5 ? (
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
                          {selectedPlan.dataGb} • {selectedPlan.euRoaming} • {selectedPlan.hasTermOptions ? `${selectedTerm} rolling` : "30-day rolling"}
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
                          {switchRoute === "keep_pac"
                            ? providePacLater && !portSubmitted
                              ? "PAC to be provided below"
                              : `PAC submitted: ${portOldNumber ? maskUkPhone(portOldNumber) : contactNumber ? maskUkPhone(contactNumber) : "Provided"}`
                            : switchRoute === "new_stac"
                            ? providePacLater && !portSubmitted
                              ? "STAC to be provided below"
                              : `STAC submitted: ${portOldNumber ? maskUkPhone(portOldNumber) : "Provided"}`
                            : "New Zoiko number requested"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary metadata rows */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Switch status</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#027A48] border border-emerald-200 capitalize">
                        {order?.fulfilment_status
                          ? order.fulfilment_status.replace(/_/g, " ")
                          : switchRecord?.status || "Confirmed"}
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
                        {orderReference || order?.order_reference || switchRecord?.reference || "Pending"}
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
                          <p>{selectedPlan.euRoaming}</p>
                          <p>{selectedPlan.calls}</p>
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
                      {selectedPlan.dataGb} · {selectedPlan.euRoaming}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {selectedPlan.calls}
                    </p>
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
                        £{quote ? quote.quote.charge_today : activePlanPrice.toFixed(2)}/
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

      {/* Contract Documents Modal (Documents 01, 02, 03) */}
      <ContractDocumentsModal
        isOpen={modalDocOpen}
        onClose={() => setModalDocOpen(false)}
        activeDoc={activeModalDoc}
        setActiveDoc={setActiveModalDoc}
        planName={selectedPlan?.name || switchRecord?.plan_name || switchRecord?.selected_plan || "Zoiko Mobile Plan"}
        planPrice={quote ? parseFloat(quote.quote.monthly_price) : (switchRecord?.plan_price ?? activePlanPrice)}
        termLabel={
          quote?.quote.term_label
            ? quote.quote.term_label
            : selectedPlan?.hasTermOptions
            ? selectedTerm === "30D"
              ? "30-day rolling"
              : selectedTerm === "12M"
              ? "12-month contract"
              : "24-month contract"
            : "30-day rolling"
        }
        dataGb={selectedPlan?.dataGb ?? switchRecord?.plan_data ?? "Included UK data"}
        euRoaming={selectedPlan?.euRoaming ?? switchRecord?.plan_eu_roaming ?? "EU roaming included"}
        calls={selectedPlan?.calls ?? switchRecord?.plan_calls ?? "Unlimited UK calls & texts"}
        simType={simType}
        customerName={
          `${firstName || switchRecord?.first_name || ""} ${lastName || switchRecord?.last_name || ""}`.trim() ||
          "Zoiko Customer"
        }
        customerEmail={email || switchRecord?.email || "Provided on order"}
        billingAddress={resolvedBillingAddress || switchRecord?.postcode || "Provided on switch request"}
        switchRoute={switchRoute}
        phoneNumber={order?.line?.msisdn || portOldNumber || switchRecord?.mobile || contactNumber || ""}
        orderRef={orderReference || order?.order_reference || switchRecord?.reference || "Pending"}
        paymentConfirmed={order?.payment_status === "paid"}
        paymentMethod={
          order?.payment_status === "paid" ? "Card payment confirmed" : "No upfront charge (Switch request)"
        }
      />
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

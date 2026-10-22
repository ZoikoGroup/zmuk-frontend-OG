"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  RefreshCw,
  Cpu,
  CreditCard,
  Lock,
  ChevronRight,
  Shield,
  Zap,
  Info,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import {
  validateUkMobile,
  validateCardNumber,
  validateCardExpiry,
  validateCardCvv,
  validateName,
  validatePacCode,
  validateStacCode,
} from "../../utils/validators";

// ── Plans Configuration matching Screen 3 ──
interface PlanItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  dataAllowance: string;
  calls: string;
  texts: string;
  roaming: string;
  isPopular?: boolean;
  category: "monthly" | "payg" | "data" | "family" | "roaming";
}

const ALL_PLANS: PlanItem[] = [
  // Monthly plans (Shown in Screen 3)
  {
    id: "plan-lite",
    name: "Zoiko Lite",
    subtitle: "Great for everyday use",
    price: 7.5,
    dataAllowance: "10GB data (5G)",
    calls: "Unlimited calls",
    texts: "Unlimited texts",
    roaming: "EU roaming up to 5GB",
    category: "monthly",
  },
  {
    id: "plan-max",
    name: "Zoiko Max",
    subtitle: "Perfect balance",
    price: 12.5,
    dataAllowance: "30GB data (5G)",
    calls: "Unlimited calls",
    texts: "Unlimited texts",
    roaming: "EU roaming up to 20GB",
    isPopular: true,
    category: "monthly",
  },
  {
    id: "plan-unlimited",
    name: "Zoiko Unlimited",
    subtitle: "For heavy data users",
    price: 20.0,
    dataAllowance: "Unlimited data (5G)",
    calls: "Unlimited calls",
    texts: "Unlimited texts",
    roaming: "EU roaming up to 25GB",
    category: "monthly",
  },
  {
    id: "plan-travel",
    name: "Zoiko Travel",
    subtitle: "Stay connected worldwide",
    price: 25.0,
    dataAllowance: "50GB data (5G)",
    calls: "Unlimited calls",
    texts: "Unlimited texts",
    roaming: "Global roaming 30GB across 75+ countries",
    category: "monthly",
  },

  // Pay as you go
  {
    id: "payg-starter",
    name: "Zoiko PAYG Starter",
    subtitle: "No commitment top-up",
    price: 5.0,
    dataAllowance: "3GB data (4G/5G)",
    calls: "500 UK mins",
    texts: "500 UK texts",
    roaming: "Standard EU rates",
    category: "payg",
  },
  {
    id: "payg-plus",
    name: "Zoiko PAYG Boost",
    subtitle: "Flexibility whenever needed",
    price: 10.0,
    dataAllowance: "15GB data (5G)",
    calls: "Unlimited calls",
    texts: "Unlimited texts",
    roaming: "EU roaming included",
    category: "payg",
  },

  // Data only
  {
    id: "data-25gb",
    name: "Zoiko Data 25GB",
    subtitle: "Ideal for iPads & tablets",
    price: 9.0,
    dataAllowance: "25GB 5G High-Speed Data",
    calls: "Data Only",
    texts: "Data Only",
    roaming: "10GB EU Roaming",
    category: "data",
  },
  {
    id: "data-unlimited",
    name: "Zoiko Data Unlimited",
    subtitle: "For 5G mobile hotspots",
    price: 22.0,
    dataAllowance: "Unlimited 5G Data",
    calls: "Data Only",
    texts: "Data Only",
    roaming: "25GB EU Roaming",
    category: "data",
  },

  // Family plans
  {
    id: "fam-2line",
    name: "Zoiko Family Duo",
    subtitle: "2 shared lines on 1 bill",
    price: 18.0,
    dataAllowance: "50GB shared data",
    calls: "Unlimited calls each",
    texts: "Unlimited texts each",
    roaming: "EU roaming included",
    category: "family",
  },
  {
    id: "fam-4line",
    name: "Zoiko Family Quad",
    subtitle: "4 shared family lines",
    price: 34.0,
    dataAllowance: "120GB shared data",
    calls: "Unlimited calls each",
    texts: "Unlimited texts each",
    roaming: "EU roaming included",
    category: "family",
  },

  // Roaming plans
  {
    id: "roam-eu",
    name: "Zoiko Euro Pass",
    subtitle: "Frequent European travel",
    price: 14.0,
    dataAllowance: "35GB data (5G in 45 countries)",
    calls: "Unlimited UK & EU calls",
    texts: "Unlimited texts",
    roaming: "Full EU roaming included",
    category: "roaming",
  },
  {
    id: "roam-global",
    name: "Zoiko Global Passport",
    subtitle: "Worldwide roaming freedom",
    price: 28.0,
    dataAllowance: "40GB worldwide data",
    calls: "Unlimited UK & 80 countries",
    texts: "Unlimited texts",
    roaming: "Valid in USA, UAE, India, EU & more",
    category: "roaming",
  },
];

// Suggested Numbers Pool
const SEED_NUMBERS = [
  "07398 451 227",
  "07411 982 340",
  "07562 118 764",
  "07734 220 099",
  "07890 558 312",
  "07912 304 551",
  "07700 900 843",
  "07823 419 802",
  "07945 612 033",
  "07341 889 021",
];

export default function AddNewNumberPage() {
  const router = useRouter();

  // ── Step management (Screens 2 to 9) ──
  // 1: Option (New number vs Bring existing)
  // 2: Choose plan
  // 3: Choose number
  // 4: Choose SIM type
  // 5: Review & checkout
  // 6: Payment
  // 7: Activation in progress
  // 8: Success
  const [step, setStep] = useState<number>(1);

  // ── Dynamic Plans State from Backend ──
  const [plans, setPlans] = useState<PlanItem[]>(ALL_PLANS);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);

  // ── Form State ──
  // Step 1: Option
  const [numberOption, setNumberOption] = useState<"new" | "existing">("new");

  // Step 2: Plan
  const [planCategory, setPlanCategory] = useState<"monthly" | "payg" | "data" | "family" | "roaming">("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-max");

  // Step 3: Choose Number
  const [suggestedNumbers, setSuggestedNumbers] = useState<string[]>(SEED_NUMBERS.slice(0, 5));
  const [selectedNumber, setSelectedNumber] = useState<string>("07398 451 227");
  const [numberTab, setNumberTab] = useState<"suggested" | "area_code" | "type">("suggested");
  const [areaCodeQuery, setAreaCodeQuery] = useState<string>("");
  const [isLoadingNumbers, setIsLoadingNumbers] = useState<boolean>(false);

  // Step 3 (alternative): Bring existing number
  const [portOldNumber, setPortOldNumber] = useState<string>("");
  const [portCode, setPortCode] = useState<string>("");
  const [portErrors, setPortErrors] = useState<{ number?: string; code?: string }>({});

  // Step 4: SIM Type
  const [simType, setSimType] = useState<"eSIM" | "Physical SIM">("eSIM");

  // Step 6: Payment
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "apple_pay">("card");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [cardName, setCardName] = useState<string>("Alex Morgan");
  const [cardErrors, setCardErrors] = useState<{ number?: string; expiry?: string; cvv?: string; name?: string }>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Step 7: Activation progress steps
  const [activationProgress, setActivationProgress] = useState<{
    paymentConfirmed: boolean;
    networkActive: boolean;
    finalised: boolean;
  }>({
    paymentConfirmed: false,
    networkActive: false,
    finalised: false,
  });

  // Load Dynamic Plans from Backend
  useEffect(() => {
    async function loadBackendPlans() {
      try {
        setIsLoadingPlans(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${API_BASE}/api/plans/v1/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: PlanItem[] = data.map((p: any) => {
              const catSlug = p.category?.slug?.toLowerCase() || "";
              let category: "monthly" | "payg" | "data" | "family" | "roaming" = "monthly";
              if (catSlug.includes("payg")) category = "payg";
              else if (catSlug.includes("data")) category = "data";
              else if (catSlug.includes("fam")) category = "family";
              else if (catSlug.includes("roam") || catSlug.includes("travel")) category = "roaming";

              return {
                id: String(p.id || p.slug),
                name: p.name,
                subtitle: p.short_description || "High-speed 5G network connectivity",
                price: Number(p.final_price || p.sale_price || p.price || 12.5),
                dataAllowance: p.data_allowance ? `${p.data_allowance} (5G)` : "30GB data (5G)",
                calls: "Unlimited calls",
                texts: "Unlimited texts",
                roaming: "EU roaming included",
                isPopular: p.is_popular || p.slug?.includes("max"),
                category,
              };
            });
            // Merge with ALL_PLANS so all categories remain fully populated
            setPlans((prev) => {
              const existingNames = new Set(mapped.map((m) => m.name.toLowerCase()));
              const preserved = prev.filter((p) => !existingNames.has(p.name.toLowerCase()));
              return [...mapped, ...preserved];
            });
            if (mapped[0]) setSelectedPlanId(mapped[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load backend plans:", err);
      } finally {
        setIsLoadingPlans(false);
      }
    }
    loadBackendPlans();
  }, []);

  // Load Real In-Stock Numbers from Backend SIM Park
  const handleRefreshNumbers = async () => {
    try {
      setIsLoadingNumbers(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE}/api/v1/sims/availability/latest/?esim=5&psim=5`);
      if (res.ok) {
        const data = await res.json();
        const simsList = [
          ...(data.sims?.esim || []),
          ...(data.sims?.psim || []),
        ];
        const numbers = simsList
          .map((s: any) => {
            let m = String(s.msisdn || "").replace(/\D/g, "");
            if (m.startsWith("44")) m = "0" + m.slice(2);
            if (m.length === 11 && m.startsWith("0")) {
              return `${m.slice(0, 5)} ${m.slice(5)}`;
            }
            return m;
          })
          .filter((n: string) => n && n.startsWith("07"));

        if (numbers.length > 0) {
          const unique = Array.from(new Set(numbers)) as string[];
          setSuggestedNumbers(unique);
          if (!unique.includes(selectedNumber)) {
            setSelectedNumber(unique[0]);
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch SIM inventory availability:", e);
    } finally {
      setIsLoadingNumbers(false);
    }

    // Fallback shuffle if backend is offline or empty inventory
    const shuffled = [...SEED_NUMBERS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setSuggestedNumbers(shuffled);
    if (!shuffled.includes(selectedNumber)) {
      setSelectedNumber(shuffled[0]);
    }
  };

  useEffect(() => {
    handleRefreshNumbers();
  }, []);

  // Current selected plan object
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || ALL_PLANS[1];

  // ── Validation for Bring Existing Number ──
  const validatePortIn = (): boolean => {
    const errors: { number?: string; code?: string } = {};
    const phoneCheck = validateUkMobile(portOldNumber);
    if (!phoneCheck.isValid) {
      errors.number = phoneCheck.error || "Please enter a valid UK mobile number.";
    }
    const isPac = validatePacCode(portCode);
    const isStac = validateStacCode(portCode);
    if (!isPac.isValid && !isStac.isValid) {
      errors.code = "Enter a valid 9-character PAC (e.g. ABC123456) or STAC (e.g. 123456ABC).";
    }

    setPortErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Validation for Payment Card ──
  const validateCardDetails = (): boolean => {
    const errors: { number?: string; expiry?: string; cvv?: string; name?: string } = {};

    const numCheck = validateCardNumber(cardNumber);
    if (!numCheck.isValid) {
      errors.number = numCheck.error || "Please enter a valid 16-digit card number.";
    }

    const expCheck = validateCardExpiry(cardExpiry);
    if (!expCheck.isValid) {
      errors.expiry = expCheck.error || "Enter a valid expiry date (MM/YY).";
    }

    const isAmex = numCheck.brand === "Amex";
    const cvvCheck = validateCardCvv(cardCvv, isAmex);
    if (!cvvCheck.isValid) {
      errors.cvv = cvvCheck.error || "Enter a valid security code (CVV).";
    }

    const nameCheck = validateName(cardName, "Cardholder name");
    if (!nameCheck.isValid) {
      errors.name = nameCheck.error || "Please enter the name on your card.";
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Format Card input with spaces
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(" ") : raw);
    if (cardErrors.number) setCardErrors((prev) => ({ ...prev, number: undefined }));
  };

  // Format Expiry MM / YY
  const handleExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length > 2) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardExpiry(clean);
    if (cardErrors.expiry) setCardErrors((prev) => ({ ...prev, expiry: undefined }));
  };

  // ── Handle Payment & Trigger Activation Sequence ──
  const handlePayAndActivate = async () => {
    if (paymentMethod === "card") {
      const isValid = validateCardDetails();
      if (!isValid) return;
    }

    setIsProcessingPayment(true);

    // If bringing an existing number, submit the port request to Django switch app
    if (numberOption === "existing" && portOldNumber) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const rawUser = localStorage.getItem("zoiko_user");
        const userData = rawUser ? JSON.parse(rawUser) : null;
        const [firstName, ...lastParts] = (cardName || "Alex Morgan").split(" ");
        await fetch(`${API_BASE}/api/switch-requests/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName || "Customer",
            last_name: lastParts.join(" ") || "Account",
            email: userData?.email || "customer@zoikomobile.co.uk",
            mobile: portOldNumber,
            postcode: "SW1A 1AA",
            selected_plan: currentPlan.name,
            current_provider: "Other",
            transfer_authorised: true,
            timeline_acknowledged: true,
            terms_accepted: true,
          }),
        });
      } catch (err) {
        console.warn("Could not submit switch request to backend:", err);
      }
    }

    // Call backend checkout intent creation
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const rawUser = localStorage.getItem("zoiko_user");
      const userData = rawUser ? JSON.parse(rawUser) : null;
      const email = userData?.email || "customer@zoikomobile.co.uk";
      const [firstName, ...lastParts] = (cardName || "Alex Morgan").split(" ");

      await fetch(`${API_BASE}/api/v1/checkout/create-intent/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: currentPlan.price,
          subtotal: currentPlan.price,
          discountAmount: 0,
          cart: [
            {
              id: currentPlan.id,
              title: currentPlan.name,
              price: currentPlan.price,
              quantity: 1,
              category: "SIM Only Plans",
              metadata: {
                simType: simType.toLowerCase() === "esim" ? "esim" : "psim",
                msisdn: numberOption === "new" ? selectedNumber : portOldNumber,
              },
            },
          ],
          billingAddress: {
            firstName: firstName || "Customer",
            lastName: lastParts.join(" ") || "User",
            email: email,
            phone: numberOption === "new" ? selectedNumber : portOldNumber,
          },
        }),
      });
    } catch (err) {
      console.warn("Could not create checkout payment intent:", err);
    }

    setStep(7); // Activation in progress
  };

  // Trigger step 7 automatic progression sequence
  useEffect(() => {
    if (step === 7) {
      setActivationProgress({ paymentConfirmed: false, networkActive: false, finalised: false });

      const t1 = setTimeout(() => {
        setActivationProgress((p) => ({ ...p, paymentConfirmed: true }));
      }, 900);

      const t2 = setTimeout(() => {
        setActivationProgress((p) => ({ ...p, networkActive: true }));
      }, 2100);

      const t3 = setTimeout(() => {
        setActivationProgress((p) => ({ ...p, finalised: true }));
      }, 3200);

      const t4 = setTimeout(() => {
        setIsProcessingPayment(false);
        setStep(8); // Success
      }, 4000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [step]);

  // ── Save Dynamic Line to localStorage and redirect back to My Numbers ──
  const handleCompleteAndGoToDashboard = () => {
    try {
      const finalNumber = numberOption === "new" ? selectedNumber : portOldNumber || "07398 451 227";
      const newLineId = `line-${Date.now()}`;

      // Extract GB from plan
      let planGb = 30;
      const match = currentPlan.dataAllowance.match(/(\d+)\s*GB/i);
      if (match) planGb = parseInt(match[1], 10);
      else if (currentPlan.name.toLowerCase().includes("unlimited")) planGb = 100;

      const newLine = {
        id: newLineId,
        number: finalNumber,
        planName: `${currentPlan.name} ${planGb}GB`,
        simType: simType,
        status: "Active",
        renewDate: "Monthly rolling",
        activationDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        contractType: "Monthly rolling",
        networkTechnology: "5G & 4G LTE",
        price: currentPlan.price,
        planGb: planGb,
        isPrimary: false,
        isUnlimited: currentPlan.name.toLowerCase().includes("unlimited"),
        callsLabel: currentPlan.calls,
        textsLabel: currentPlan.texts,
        roamingIncluded: true,
      };

      const existingStored = localStorage.getItem("zoiko_added_lines");
      const currentList = existingStored ? JSON.parse(existingStored) : [];
      currentList.push(newLine);
      localStorage.setItem("zoiko_added_lines", JSON.stringify(currentList));

      // Notify any listening components
      window.dispatchEvent(new Event("zoiko-lines-updated"));
    } catch (e) {
      console.error("Error saving new line:", e);
    }

    router.push("/dashboard/my-mobile-numbers");
  };

  // Redirect to full checkout page if requested by user
  const handleProceedViaOldCheckout = () => {
    try {
      const finalNumber = numberOption === "new" ? selectedNumber : portOldNumber || "07398 451 227";
      const cartItem = {
        id: currentPlan.id,
        name: currentPlan.name,
        price: currentPlan.price,
        quantity: 1,
        category: "SIM Only Plans",
        metadata: {
          simType: simType.toLowerCase() === "esim" ? "esim" : "psim",
          duration: 30,
          dataAllowance: currentPlan.dataAllowance,
          mobileNumber: finalNumber,
        },
      };
      localStorage.setItem("cart", JSON.stringify([cartItem]));
      window.dispatchEvent(new Event("cart-updated"));
    } catch {}
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#F0F2F6] text-[#0D1935] flex justify-center p-3 sm:p-5 font-sans antialiased">
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sidebar */}
        <DashboardSidebar
          activeTab="my-numbers"
          setActiveTab={(t) => {
            if (t === "my-numbers") router.push("/dashboard/my-mobile-numbers");
          }}
          planName={currentPlan.name}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full flex flex-col gap-5 min-w-0">
          <DashboardTopNav
            customTitle="Add a new number"
            customSubtitle="Choose how you'd like to add your number."
            searchQuery=""
            setSearchQuery={() => {}}
            unreadNotifications={1}
            userName="Alex Morgan"
            userRole="Account holder"
            hideDemoBadgeInHeader={true}
          />

          {/* ── BREADCRUMBS ── */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-1">
            <Link href="/dashboard" className="hover:text-slate-800 transition">
              My Account
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              href="/dashboard/my-mobile-numbers"
              className="hover:text-slate-800 transition"
            >
              Add a new number
            </Link>

            {step === 2 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Choose a plan</span>
              </>
            )}
            {step === 3 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Choose a number</span>
              </>
            )}
            {step === 4 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Choose SIM type</span>
              </>
            )}
            {step === 5 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Review &amp; checkout</span>
              </>
            )}
            {step === 6 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Payment</span>
              </>
            )}
            {step === 7 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Activation</span>
              </>
            )}
            {step === 8 && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0D1935] font-bold">Complete</span>
              </>
            )}
          </div>

          {/* ── STEP 1: CHOOSE OPTION (Screen 2 in design) ── */}
          {step === 1 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col gap-6 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  Add a new number
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Choose how you&apos;d like to add your number.
                </p>
              </div>

              {/* Two Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Option A: Get a new UK number */}
                <div
                  onClick={() => setNumberOption("new")}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col items-center text-center gap-3.5 ${
                    numberOption === "new"
                      ? "border-[#E01C5B] bg-pink-50/25 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`absolute right-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      numberOption === "new" ? "border-[#E01C5B]" : "border-slate-300"
                    }`}
                  >
                    {numberOption === "new" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />
                    )}
                  </div>
                  <div className="w-14 h-14 rounded-2xl border border-pink-200/80 bg-pink-50 text-[#E01C5B] flex items-center justify-center mt-2">
                    <Smartphone className="w-7 h-7 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0D1935]">
                      Get a new UK number
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Choose a new mobile number with a Zoiko plan.
                    </p>
                  </div>
                </div>

                {/* Option B: Bring my existing number */}
                <div
                  onClick={() => setNumberOption("existing")}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col items-center text-center gap-3.5 ${
                    numberOption === "existing"
                      ? "border-[#E01C5B] bg-pink-50/25 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`absolute right-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      numberOption === "existing" ? "border-[#E01C5B]" : "border-slate-300"
                    }`}
                  >
                    {numberOption === "existing" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />
                    )}
                  </div>
                  <div className="w-14 h-14 rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-700 flex items-center justify-center mt-2">
                    <RefreshCw className="w-7 h-7 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0D1935]">
                      Bring my existing number
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Transfer your number from another UK provider using a PAC.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Link
                  href="/dashboard/my-mobile-numbers"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: CHOOSE A PLAN (Screen 3 in design) ── */}
          {step === 2 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col gap-6 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  Choose a plan
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Select a plan for your new number.
                </p>
              </div>

              {/* Plan Category Pills */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {[
                  { id: "monthly", label: "Monthly plans" },
                  { id: "payg", label: "Pay as you go" },
                  { id: "data", label: "Data only" },
                  { id: "family", label: "Family plans" },
                  { id: "roaming", label: "Roaming plans" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setPlanCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                      planCategory === cat.id
                        ? "bg-[#E01C5B] text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 5G Coverage Banner */}
              <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-100 flex items-center gap-2.5 text-xs text-slate-700">
                <span className="px-2 py-0.5 rounded-md bg-[#E01C5B] text-white font-extrabold text-[10px]">
                  5G
                </span>
                <span>
                  All plans include 5G, UK coverage and EU roaming on selected plans.
                </span>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {plans.filter((p) => p.category === planCategory).map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? "border-[#E01C5B] bg-pink-50/20 shadow-sm"
                          : "border-slate-200/80 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#E01C5B] text-white text-[10px] font-bold shadow-xs">
                          Most popular
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-[#0D1935]">
                            {plan.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {plan.subtitle}
                          </p>
                        </div>

                        <div>
                          <div className="text-2xl font-extrabold text-[#0D1935]">
                            £{plan.price.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-slate-400">/month</div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2 font-medium">
                            <Check className="w-3.5 h-3.5 text-[#E01C5B] flex-shrink-0" />
                            <span>{plan.dataAllowance}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#E01C5B] flex-shrink-0" />
                            <span>{plan.calls}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#E01C5B] flex-shrink-0" />
                            <span>{plan.texts}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#E01C5B] flex-shrink-0" />
                            <span>{plan.roaming}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-2">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                            isSelected
                              ? "bg-[#E01C5B] text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-white" : "border-slate-400"
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          <span>{isSelected ? "Selected plan" : "Select plan"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CHOOSE YOUR NUMBER (Screen 4 in design) ── */}
          {step === 3 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col gap-6 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  {numberOption === "new" ? "Choose your new number" : "Bring your existing number"}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {numberOption === "new"
                    ? "Pick a number or let us suggest one."
                    : "Enter your current UK mobile number and PAC/STAC switching code."}
                </p>
              </div>

              {numberOption === "new" ? (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setNumberTab("suggested")}
                      className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                        numberTab === "suggested"
                          ? "bg-[#E01C5B] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      Suggested for you
                    </button>
                    <button
                      type="button"
                      onClick={() => setNumberTab("area_code")}
                      className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                        numberTab === "area_code"
                          ? "bg-[#E01C5B] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      Search by area code
                    </button>
                    <button
                      type="button"
                      onClick={() => setNumberTab("type")}
                      className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                        numberTab === "type"
                          ? "bg-[#E01C5B] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      Choose a type
                    </button>
                  </div>

                  {numberTab === "area_code" && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Search area code (e.g. 020, 0161, 07)"
                        value={areaCodeQuery}
                        onChange={(e) => setAreaCodeQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#0D1935] font-semibold focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Number Selection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {/* Left: List of numbers */}
                    <div className="md:col-span-2 space-y-2.5">
                      {suggestedNumbers.map((num, idx) => {
                        const isSelected = selectedNumber === num;
                        return (
                          <div
                            key={num}
                            onClick={() => setSelectedNumber(num)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[#E01C5B] bg-pink-50/25 shadow-xs"
                                : "border-slate-200/80 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? "border-[#E01C5B]" : "border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />
                                )}
                              </div>
                              <span className="font-mono font-bold text-sm text-[#0D1935] tracking-wide">
                                {num}
                              </span>
                            </div>

                            {idx === 0 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                Recommended number
                              </span>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        disabled={isLoadingNumbers}
                        onClick={handleRefreshNumbers}
                        className="pt-2 text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNumbers ? "animate-spin" : ""}`} />
                        <span>{isLoadingNumbers ? "Fetching live numbers..." : "Refresh numbers"}</span>
                      </button>
                    </div>

                    {/* Right: "Why this number?" card */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 flex flex-col gap-3 h-fit">
                      <h4 className="font-bold text-sm text-[#0D1935]">
                        Why this number?
                      </h4>
                      <div className="space-y-2.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Easy to remember</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Available now</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Works with eSIM or SIM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Fully supported on 5G</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Bring existing number input form */
                <div className="max-w-lg space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#0D1935] mb-1.5">
                      Your current UK mobile number
                    </label>
                    <input
                      type="tel"
                      value={portOldNumber}
                      onChange={(e) => {
                        setPortOldNumber(e.target.value);
                        if (portErrors.number) {
                          setPortErrors((prev) => ({ ...prev, number: undefined }));
                        }
                      }}
                      placeholder="e.g. 07700 900555"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
                        portErrors.number
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-200 focus:border-[#E01C5B]"
                      }`}
                    />
                    {portErrors.number && (
                      <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{portErrors.number}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D1935] mb-1.5">
                      PAC or STAC switching code from your old network
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={portCode}
                      onChange={(e) => {
                        setPortCode(e.target.value.toUpperCase());
                        if (portErrors.code) {
                          setPortErrors((prev) => ({ ...prev, code: undefined }));
                        }
                      }}
                      placeholder="e.g. ABC123456"
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase tracking-wider text-sm text-[#0D1935] focus:outline-none transition ${
                        portErrors.code
                          ? "border-red-500 focus:border-red-500"
                          : "border-slate-200 focus:border-[#E01C5B]"
                      }`}
                    />
                    {portErrors.code && (
                      <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{portErrors.code}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Text PAC to 65075 on your old SIM for free to get your code.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (numberOption === "existing") {
                      if (!validatePortIn()) return;
                    }
                    setStep(4);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: CHOOSE SIM TYPE (Screen 5 in design) ── */}
          {step === 4 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col gap-6 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  How would you like to connect?
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Choose a SIM type for{" "}
                  <span className="font-bold text-[#0D1935]">
                    {numberOption === "new" ? selectedNumber : portOldNumber || "your number"}
                  </span>
                  .
                </p>
              </div>

              {/* SIM Type Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* eSIM Card */}
                <div
                  onClick={() => setSimType("eSIM")}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    simType === "eSIM"
                      ? "border-[#E01C5B] bg-pink-50/20 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#E01C5B] text-white text-[10px] font-bold shadow-xs">
                    Recommended
                  </div>
                  <div
                    className={`absolute right-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      simType === "eSIM" ? "border-[#E01C5B]" : "border-slate-300"
                    }`}
                  >
                    {simType === "eSIM" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center gap-3 pt-2">
                    <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200/80 text-[#E01C5B] flex items-center justify-center">
                      <Cpu className="w-7 h-7 stroke-[1.75]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0D1935]">eSIM</h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                        Activate instantly directly on your device.
                      </p>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Instant activation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>No delivery required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Ideal for most modern devices</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Physical SIM Card */}
                <div
                  onClick={() => setSimType("Physical SIM")}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    simType === "Physical SIM"
                      ? "border-[#E01C5B] bg-pink-50/20 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`absolute right-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      simType === "Physical SIM" ? "border-[#E01C5B]" : "border-slate-300"
                    }`}
                  >
                    {simType === "Physical SIM" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E01C5B]" />
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center gap-3 pt-2">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center">
                      <CreditCard className="w-7 h-7 stroke-[1.75]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0D1935]">
                        Physical SIM
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                        We&apos;ll deliver your SIM to your address.
                      </p>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Free UK delivery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Usually arrives in 1-2 days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Works with any SIM device</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: REVIEW & CHECKOUT (Screen 6 in design) ── */}
          {step === 5 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col gap-6 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  Review your order
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Check your details before continuing.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Left 2 Cols: Order Item Details */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 p-5 divide-y divide-slate-100 text-xs">
                  {/* Row 1: Plan */}
                  <div className="pb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Plan</div>
                        <div className="text-sm font-bold text-[#0D1935]">
                          {currentPlan.name}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          £{currentPlan.price.toFixed(2)} / month · {currentPlan.dataAllowance}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Row 2: Number */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Number</div>
                        <div className="text-sm font-bold text-[#0D1935]">
                          {numberOption === "new" ? selectedNumber : portOldNumber}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {numberOption === "new"
                            ? "New UK Mobile Number"
                            : "Transferring via PAC"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Row 3: SIM Type */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">SIM type</div>
                        <div className="text-sm font-bold text-[#0D1935]">
                          {simType}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {simType === "eSIM"
                            ? "Instant digital activation"
                            : "Free UK royal mail delivery"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Right 1 Col: Summary & What happens next */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Monthly cost</div>
                    <div className="text-2xl font-extrabold text-[#0D1935] mt-1">
                      £{currentPlan.price.toFixed(2)}
                      <span className="text-xs font-normal text-slate-500"> /month</span>
                    </div>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                      <div>• No upfront cost</div>
                      <div>• No long contracts</div>
                      <div>• Price includes VAT</div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2 text-xs">
                      <div className="font-bold text-[#0D1935]">What happens next?</div>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px]">
                        <li>Complete your payment</li>
                        <li>We&apos;ll activate your number instantly</li>
                        <li>You&apos;ll receive a confirmation by email</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="px-6 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: PAYMENT (Screen 7 in design) ── */}
          {step === 6 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col gap-6 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  Payment details
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Choose your payment method.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Left: Payment Method Selection */}
                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "card"
                        ? "border-[#E01C5B] bg-pink-50/30 shadow-xs"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "card" ? "border-[#E01C5B]" : "border-slate-300"
                        }`}
                      >
                        {paymentMethod === "card" && (
                          <span className="w-2 h-2 rounded-full bg-[#E01C5B]" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#0D1935]">
                          Debit or credit card
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Visa, Mastercard, Amex
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("paypal")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "paypal"
                        ? "border-[#E01C5B] bg-pink-50/30 shadow-xs"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "paypal" ? "border-[#E01C5B]" : "border-slate-300"
                        }`}
                      >
                        {paymentMethod === "paypal" && (
                          <span className="w-2 h-2 rounded-full bg-[#E01C5B]" />
                        )}
                      </div>
                      <div className="font-bold text-xs text-[#0D1935]">PayPal</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("apple_pay")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "apple_pay"
                        ? "border-[#E01C5B] bg-pink-50/30 shadow-xs"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "apple_pay" ? "border-[#E01C5B]" : "border-slate-300"
                        }`}
                      >
                        {paymentMethod === "apple_pay" && (
                          <span className="w-2 h-2 rounded-full bg-[#E01C5B]" />
                        )}
                      </div>
                      <div className="font-bold text-xs text-[#0D1935]">Apple Pay</div>
                    </div>
                  </div>

                  {/* Optional: Route to existing /checkout page if preferred */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleProceedViaOldCheckout}
                      className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-700">
                          Use Full Checkout Page
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Pay via /checkout with Stripe
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Right: Payment Form */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
                  {paymentMethod === "card" ? (
                    <>
                      {/* Card Number */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-[#0D1935]">
                            Card number
                          </label>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-blue-700">
                              VISA
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-orange-600">
                              MC
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-sky-600">
                              AMEX
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider text-[#0D1935] focus:outline-none transition ${
                            cardErrors.number
                              ? "border-red-500 focus:border-red-500"
                              : "border-slate-200 focus:border-[#E01C5B]"
                          }`}
                        />
                        {cardErrors.number && (
                          <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{cardErrors.number}</span>
                          </p>
                        )}
                      </div>

                      {/* Expiry & CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#0D1935] mb-1.5">
                            Expiry date
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            placeholder="MM / YY"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-[#0D1935] focus:outline-none transition ${
                              cardErrors.expiry
                                ? "border-red-500 focus:border-red-500"
                                : "border-slate-200 focus:border-[#E01C5B]"
                            }`}
                          />
                          {cardErrors.expiry && (
                            <p className="text-red-500 text-[11px] mt-1 font-medium">
                              {cardErrors.expiry}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0D1935] mb-1.5">
                            Security code
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => {
                              setCardCvv(e.target.value.replace(/\D/g, ""));
                              if (cardErrors.cvv) {
                                setCardErrors((prev) => ({ ...prev, cvv: undefined }));
                              }
                            }}
                            placeholder="123"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-[#0D1935] focus:outline-none transition ${
                              cardErrors.cvv
                                ? "border-red-500 focus:border-red-500"
                                : "border-slate-200 focus:border-[#E01C5B]"
                            }`}
                          />
                          {cardErrors.cvv && (
                            <p className="text-red-500 text-[11px] mt-1 font-medium">
                              {cardErrors.cvv}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Cardholder name */}
                      <div>
                        <label className="block text-xs font-bold text-[#0D1935] mb-1.5">
                          Cardholder name
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => {
                            setCardName(e.target.value);
                            if (cardErrors.name) {
                              setCardErrors((prev) => ({ ...prev, name: undefined }));
                            }
                          }}
                          placeholder="e.g. Alex Morgan"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
                            cardErrors.name
                              ? "border-red-500 focus:border-red-500"
                              : "border-slate-200 focus:border-[#E01C5B]"
                          }`}
                        />
                        {cardErrors.name && (
                          <p className="text-red-500 text-[11px] mt-1 font-medium">
                            {cardErrors.name}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                      <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                      <p>
                        You will be redirected securely to authenticate your{" "}
                        <span className="font-bold text-[#0D1935]">
                          {paymentMethod === "paypal" ? "PayPal" : "Apple Pay"}
                        </span>{" "}
                        account.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handlePayAndActivate}
                      className="px-6 py-3 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>Pay and activate</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 7: ACTIVATION IN PROGRESS (Screen 8 in design) ── */}
          {step === 7 && (
            <div className="rounded-3xl bg-white p-8 sm:p-14 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center gap-6 animate-in fade-in">
              {/* Spinner icon */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-pink-100 border-t-[#E01C5B] animate-spin" />
                <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-[#E01C5B]">
                  <Smartphone className="w-8 h-8 stroke-[1.75] animate-pulse" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  Activating your new number
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  We&apos;re setting up{" "}
                  <span className="font-bold text-[#0D1935]">
                    {numberOption === "new" ? selectedNumber : portOldNumber || "your line"}
                  </span>{" "}
                  on your Zoiko plan.
                </p>
              </div>

              {/* Dynamic Step Progress */}
              <div className="w-full max-w-sm rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-3.5 text-xs text-left">
                <div className="flex items-center gap-3">
                  {activationProgress.paymentConfirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 animate-in zoom-in-50" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={
                      activationProgress.paymentConfirmed
                        ? "text-[#0D1935] font-semibold"
                        : "text-slate-400"
                    }
                  >
                    Payment confirmed
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {activationProgress.networkActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 animate-in zoom-in-50" />
                  ) : activationProgress.paymentConfirmed ? (
                    <RefreshCw className="w-4 h-4 text-[#E01C5B] animate-spin flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={
                      activationProgress.networkActive
                        ? "text-[#0D1935] font-semibold"
                        : activationProgress.paymentConfirmed
                        ? "text-[#E01C5B] font-bold"
                        : "text-slate-400"
                    }
                  >
                    Activating {simType} on our network
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {activationProgress.finalised ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 animate-in zoom-in-50" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={
                      activationProgress.finalised
                        ? "text-[#0D1935] font-semibold"
                        : "text-slate-400"
                    }
                  >
                    Finalising your number
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                We&apos;ll notify you when it&apos;s ready
              </p>
            </div>
          )}

          {/* ── STEP 8: SUCCESS (Screen 9 in design) ── */}
          {step === 8 && (
            <div className="rounded-3xl bg-white p-8 sm:p-14 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center gap-6 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-[#0D1935]">
                  Your new number is ready!
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-bold text-[#0D1935]">
                    {numberOption === "new" ? selectedNumber : portOldNumber || "Your number"}
                  </span>{" "}
                  is now active on {currentPlan.name}.
                </p>
              </div>

              {/* What's next info card */}
              <div className="w-full max-w-md rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-2.5 text-xs text-left">
                <div className="font-bold text-[#0D1935]">What&apos;s next?</div>
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>You can now use your new number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Manage it anytime in My numbers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Download your eSIM guide if needed</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteAndGoToDashboard}
                className="px-8 py-3 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition flex items-center gap-2 cursor-pointer"
              >
                <span>Go to my numbers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm, { StripePaymentFormRef } from "../components/StripePaymentForm";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { isLoggedIn as checkIsLoggedIn, getUser, getToken } from "../utils/auth";
import { useCart } from "../context/CartContext";
import { getActivePromotion, type Promotion } from "../config/promotions";
import { BadgeCheck, CalendarDays, Check, CreditCard, Lock, Mail, Minus, Plus, QrCode, ShieldCheck, ShoppingBag, Signal, Smartphone, Ticket, Trash2, Truck, UserRound } from "lucide-react";
import { listSavedCards, cardBrandLabel, cardExpiryLabel, type SavedCardsList } from "../utils/savedCardsApi";


// Initialize Stripe ONCE outside the component — calling loadStripe()
// inside the component causes it to re-initialize on every render which
// causes browser performance issues and the "called many times" warning.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");


interface RawCartItem {
  cartKey?: string;
  id: string | number;
  type?: string;                 // always "plan"
  name?: string;
  slug?: string;
  image?: string;
  category?: string;             // e.g. "SIM Only Plans"
  price?: number | string;
  quantity?: number;
  metadata?: {
    simType?: string;            // "esim" | "psim"
    duration?: number | string;  // billing period in days, e.g. 30
    dataAllowance?: string;      // e.g. "3GB"
    transatelID?: string;        // Transatel package/product code, e.g. "TSL_UK_DATA_1GB"
    tier?: string | null;
  };
  [key: string]: unknown;
}

/** Normalised shape used throughout the component */
interface CartItem {
  cartKey: string;
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
  /** Display casing: "eSIM" | "pSIM" */
  simType: string;
  /** Lowercase key used for logic + API: "esim" | "psim" */
  simTypeKey: "esim" | "psim";
  duration: number | null;
  dataAllowance: string;
  transatelID: string;
  tier: string | null;
  _raw: RawCartItem;
}

interface Address {
  firstName: string;
  lastName: string;
  companyName: string;
  region: string;
  state: string;
  city: string;
  street: string;
  houseNumber: string;
  zip: string;
  phone: string;
  email: string;
}

interface DiscountData {
  type: "percentage" | "flat";
  discount: string | number;
}

/** Problem reported by create-intent (guide section 6.3) that the customer must act on. */
interface CheckoutIssue {
  code: string;
  message: string;
  /** cartKey of the line the problem is about (PLAN_NOT_AVAILABLE, PLAN_NOT_ELIGIBLE ...) */
  item?: string;
  /** Server prices for PRICE_CHANGED */
  lines?: { cartKey: string; unit_price: string }[];
  serverDiscount?: number;
  serverTotal?: number;
}

interface FormErrors {
  [key: string]: string;
}

// ── Normalise a raw localStorage item into CartItem ───────────────────────────

function normalizeCartItem(raw: RawCartItem, index: number): CartItem {
  const meta = raw.metadata ?? {};

  const rawPrice = raw.price ?? 0;
  const price =
    typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice)) || 0;

  const quantity = Math.max(1, Math.floor(Number(raw.quantity ?? 1) || 1));

  const simTypeKey: "esim" | "psim" =
    String(meta.simType ?? "").toLowerCase() === "esim" ? "esim" : "psim";
  const simType = simTypeKey === "esim" ? "eSIM" : "pSIM";

  const durationRaw = meta.duration;
  const duration =
    durationRaw === undefined || durationRaw === null || durationRaw === ""
      ? null
      : Number(durationRaw) || null;

  return {
    cartKey: raw.cartKey ?? `${raw.id}-${index}`,
    id: raw.id,
    title: raw.name ?? "SIM Plan",
    price,
    quantity,
    category: raw.category ?? "SIM Only Plans",
    image: raw.image ?? "",
    simType,
    simTypeKey,
    duration,
    dataAllowance: meta.dataAllowance ?? "",
    transatelID: meta.transatelID ?? "",
    tier: meta.tier ?? null,
    _raw: raw,
  };
}

/** "30" → "30 days"; passes through anything already labelled. */
function formatDuration(duration: number | null): string {
  if (!duration) return "";
  return `${duration} day${duration === 1 ? "" : "s"}`;
}

// ── Small reusable components ─────────────────────────────────────────────────

const InputField = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
      {label}
      {required && <span className="ml-0.5 text-[#e6007e]">*</span>}
    </label>
    {children}
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const inputClass = (error?: string) =>
  `h-12 w-full rounded-xl border-2 px-3.5 text-sm font-medium text-gray-900 outline-none transition
   placeholder:font-normal placeholder:text-gray-400
   focus:border-[#e6007e] focus:ring-4 focus:ring-[#e6007e]/10 disabled:bg-gray-50 disabled:text-gray-500
   ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`;

// ── Address Form ──────────────────────────────────────────────────────────────

const billingFieldMeta: Record<string, { label: string; placeholder: string; disabled?: boolean }> = {
  firstName:   { label: "First Name",       placeholder: "Enter your first name" },
  lastName:    { label: "Last Name",        placeholder: "Enter your last name" },
  companyName: { label: "Company Name",     placeholder: "Company name (optional)" },
  region:      { label: "Country / Region", placeholder: "United Kingdom (UK)" },
  state:       { label: "County",           placeholder: "Enter your county" },
  city:        { label: "City / Town",      placeholder: "Enter your city or town" },
  street:      { label: "Street Address",   placeholder: "Enter your street address" },
  houseNumber: { label: "Flat / House No.", placeholder: "Flat or house number" },
  zip:         { label: "Postcode (max 12 characters)", placeholder: "Enter postcode" },
  phone:       { label: "Phone Number",     placeholder: "Enter phone number" },
  email:       { label: "Email Address",    placeholder: "Enter email address" },
};

const requiredBillingFields = ["firstName", "lastName", "city", "houseNumber", "zip", "email", "phone"];

const AddressForm = ({
  address,
  setAddress,
  prefix,
  errors,
  loading,
  includeShipping = false,
  onValidateField,
}: {
  address: Address;
  setAddress: (a: Address) => void;
  prefix: string;
  errors: FormErrors;
  loading: boolean;
  includeShipping?: boolean;
  onValidateField: (errKey: string, value: string, filterMsg?: string) => void;
}) => (
  <div className="grid grid-cols-1 gap-4 text-gray-700 sm:grid-cols-2">
    {(Object.keys(address) as Array<keyof Address>).map((key) => {
      const meta = billingFieldMeta[key] || { label: key, placeholder: key };
      const errKey = `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
      const isRequired =
        requiredBillingFields.includes(key) ||
        (includeShipping &&
          ["firstName", "lastName", "city", "houseNumber", "zip", "email"].includes(key));

      const isPhone = key === "phone";
      const isZip = key === "zip";

      const handleChange = (raw: string) => {
        let value = raw;
        let filterMsg = "";

        if (isPhone) {
          const digitsOnly = raw.replace(/\D/g, "");
          value = digitsOnly.slice(0, 15);

          if (digitsOnly !== raw) {
            filterMsg = "Only numbers are allowed";
          } else if (digitsOnly.length > 15) {
            filterMsg = "Phone number cannot exceed 15 digits";
          }
        } else if (isZip) {
          value = raw.slice(0, 12);
          if (raw.length > 12) {
            filterMsg = "Postcode cannot exceed 12 characters";
          }
        }

        setAddress({ ...address, [key]: value });
        onValidateField?.(errKey, value, filterMsg);
      };

      return (
        <InputField key={key} label={meta.label} required={isRequired} error={errors[errKey]}>
          <input
            type="text"
            inputMode={isPhone ? "numeric" : undefined}
            className={inputClass(errors[errKey])}
            placeholder={meta.placeholder}
            value={address[key]}
            disabled={meta.disabled || loading}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => onValidateField?.(errKey, e.target.value)}
          />
        </InputField>
      );
    })}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({
  show,
  onClose,
  title,
  children,
}: {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0210]/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(30,0,40,0.35)]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-black text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const stripeFormRef = useRef<StripePaymentFormRef>(null);
  const [showOrderErrorPopup, setShowOrderErrorPopup] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  // The cart lives in CartContext (single source of truth). Never read or
  // write localStorage["cart"] directly here — CartContext would overwrite it
  // with its own (stale) copy on the next add-to-cart.
  const {
    cart: contextCart,
    hydrated: cartHydrated,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateLinePrices,
    hasPublicSectorDiscount,
  } = useCart();
  // Snapshot of the paid order. The cart is cleared once payment is confirmed,
  // but the page (and the thank-you modal) must keep showing what was bought.
  const [paidCart, setPaidCart] = useState<CartItem[] | null>(null);
  const liveCart = useMemo<CartItem[]>(
    () =>
      contextCart.map((item, index) =>
        normalizeCartItem(item as unknown as RawCartItem, index)
      ),
    [contextCart]
  );
  const cart = paidCart ?? liveCart;
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [discountData, setDiscountData] = useState<DiscountData | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  // Live site-wide promotion whose code was pre-filled into the coupon box.
  const [prefilledPromo, setPrefilledPromo] = useState<Promotion | null>(null);
  const promoPrefillDone = useRef(false);
  const [checkoutIssue, setCheckoutIssue] = useState<CheckoutIssue | null>(null);
  // Discount confirmed by the customer after the server recalculated it (409 PRICE_CHANGED).
  const [serverDiscount, setServerDiscount] = useState<number | null>(null);
  // How much the public sector discount saved on this order (from create-intent totals).
  const [psSaving, setPsSaving] = useState(0);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<"coupon" | "order">("order");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Saved cards (backend). null = not loaded yet. Guests and "feature off" both give enabled:false.
  const [savedList, setSavedList] = useState<SavedCardsList | null>(null);
  /** a saved card id, or "new" for a new card */
  const [payChoice, setPayChoice] = useState<string>("new");
  const [saveCardTick, setSaveCardTick] = useState(false);
  /** bump to ask for a fresh payment intent (after a declined saved card) */
  const [intentNonce, setIntentNonce] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);

  // Stripe's cross-origin iframe can't inherit page dark styling; it only obeys
  // the `appearance` object handed to it. So we detect dark mode by MEASURING
  // the actual payment card background and match Stripe to it.
  const paymentCardRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);


  useEffect(() => {
    const compute = () => {
      let el: HTMLElement | null = paymentCardRef.current;
      let bg = "";
      while (el) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== "transparent" && !c.startsWith("rgba(0, 0, 0, 0")) {
          bg = c;
          break;
        }
        el = el.parentElement;
      }
      if (!bg) bg = getComputedStyle(document.body).backgroundColor;

      const rgb = bg.match(/\d+/g);
      setIsDark(
        rgb ? Number(rgb[0]) + Number(rgb[1]) + Number(rgb[2]) < 384 : false,
      );
    };

    compute();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", compute);
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    return () => {
      mq.removeEventListener("change", compute);
      observer.disconnect();
    };
  }, []);

  const stripeOptions: StripeElementsOptions = useMemo(() => {
    return {
      clientSecret,
      appearance: {
        theme: isDark ? "night" : "stripe",
        variables: {
          colorPrimary: "#ef4444",
          colorBackground: isDark ? "#1f2937" : "#ffffff",
          colorText: isDark ? "#f9fafb" : "#111827",
          colorDanger: "#ef4444",
          colorTextPlaceholder: isDark ? "#9ca3af" : "#6b7280",
          borderRadius: "12px",
          fontFamily: "Inter, sans-serif",
        },
        rules: {
          ".Input": {
            backgroundColor: isDark ? "#111827" : "#ffffff",
            border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
            boxShadow: "none",
          },
          ".Input:focus": {
            border: "1px solid #ef4444",
            boxShadow: "0 0 0 1px #ef4444",
          },
          ".Tab": {
            backgroundColor: isDark ? "#111827" : "#f9fafb",
            border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
          },
          ".Tab--selected": {
            border: "1px solid #ef4444",
            boxShadow: "0 0 0 1px #ef4444",
          },
          ".Label": {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
      },
    };
  }, [clientSecret, isDark]);

  const emptyAddress: Address = {
    firstName: "",
    lastName: "",
    companyName: "",
    region: "United Kingdom (UK)",
    state: "",
    city: "",
    street: "",
    houseNumber: "",
    zip: "",
    phone: "",
    email: "",
  };

  const [billingAddress, setBillingAddress] = useState<Address>(emptyAddress);
  const [shippingAddress, setShippingAddress] = useState<Address>(emptyAddress);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Login state & address prefill (cart itself comes from CartContext) ───
  useEffect(() => {
    try {
      if (checkIsLoggedIn()) {
        setIsLoggedIn(true);

        // Prefill from the account so the order is saved against the logged-in
        // user — "My Orders" matches on this email server-side.
        const user = getUser();
        if (user) {
          setBillingAddress((prev) => ({
            ...prev,
            firstName: prev.firstName || user.first_name || user.firstName || "",
            lastName: prev.lastName || user.last_name || user.lastName || "",
            email: user.email || prev.email,
          }));
        }
      } else {
        setLoginPromptReason("order");
        setShowLoginPopup(true);
      }

      // Prefill switch & save details if arriving from /switch-and-save
      try {
        const switchAddrRaw = typeof window !== "undefined" ? sessionStorage.getItem("switch_checkout_address") : null;
        if (switchAddrRaw) {
          const s = JSON.parse(switchAddrRaw);
          if (s && typeof s === "object") {
            setBillingAddress((prev) => ({
              ...prev,
              firstName: s.firstName || prev.firstName || "",
              lastName: s.lastName || prev.lastName || "",
              email: s.email || prev.email || "",
              phone: s.phone || prev.phone || "",
              street: s.street || prev.street || "",
              houseNumber: s.houseNumber || prev.houseNumber || "",
              city: s.city || prev.city || "",
              zip: s.zip || prev.zip || "",
              region: s.region || prev.region || "United Kingdom (UK)",
            }));
            setShippingAddress((prev) => ({
              ...prev,
              firstName: s.firstName || prev.firstName || "",
              lastName: s.lastName || prev.lastName || "",
              email: s.email || prev.email || "",
              phone: s.phone || prev.phone || "",
              street: s.street || prev.street || "",
              houseNumber: s.houseNumber || prev.houseNumber || "",
              city: s.city || prev.city || "",
              zip: s.zip || prev.zip || "",
              region: s.region || prev.region || "United Kingdom (UK)",
            }));
          }
        }
      } catch {}
    } catch {
      /* ignore — auth/session storage unavailable */
    }
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────

  /**
   * Physical (pSIM) items are shipped, so they require a shipping address.
   * eSIMs are delivered by email and need none.
   */
  const hasPhysicalSim = cart.some((item) => item.simTypeKey === "psim");

  const isSwitchOrder = useMemo(() => {
    return (
      cart.some((item) => (item._raw?.metadata as any)?.isSwitchAndSave) ||
      (typeof window !== "undefined" && sessionStorage.getItem("is_switch_and_save") === "true")
    );
  }, [cart]);

  // ── Cart mutations ────────────────────────────────────────────────────────

  // All mutations go through CartContext, which persists to localStorage and
  // updates the header badge. Items are addressed by cartKey, not array index.

  const handleRemove = (cartKey: string) => {
    removeFromCart(cartKey);
  };

  const handleQuantityChange = (cartKey: string, nextQty: number) => {
    const qty = Math.max(1, Math.floor(nextQty) || 1);
    updateQuantity(cartKey, qty);
  };

  // ── Coupon ────────────────────────────────────────────────────────────────

  // Pre-fill the live promotion's code (e.g. BLACKFRI30) once per visit. The
  // date check runs in the browser, so it never depends on when the page was
  // built. Waits for the cart so public sector / student orders (which can't
  // take coupons) are skipped, and never overwrites or re-adds a code after
  // the customer edits or removes it.
  useEffect(() => {
    if (!cartHydrated || promoPrefillDone.current) return;
    promoPrefillDone.current = true;
    if (hasPublicSectorDiscount) return;
    const promo = getActivePromotion();
    if (!promo) return;
    setCoupon((current) => (current.trim() ? current : promo.code));
    setPrefilledPromo(promo);
  }, [cartHydrated, hasPublicSectorDiscount]);

  // Hint stays visible only while the promo code sits in the box, not yet applied.
  const showPromoHint =
    !!prefilledPromo &&
    !discountData &&
    !couponMessage &&
    coupon.trim().toUpperCase() === prefilledPromo.code;

  const handleApplyCoupon = async () => {
    const user = JSON.parse(localStorage.getItem("zoiko_user") ?? "null");
    if (!user) {
      setLoginPromptReason("coupon");
      setShowLoginPopup(true);
      return;
    }
    if (!coupon) {
      setCouponMessage("Please enter a coupon code");
      return;
    }
    setLoading(true);
    setCouponMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/apply-coupon/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ user_id: user.id, email: user.email, coupon_code: coupon }),
      });
      const data = await res.json();
      if (data.success) {
        setServerDiscount(null);
        setDiscountData(data.data);
        const num = parseFloat(data.data.discount);
        const clean = Number.isInteger(num) ? num.toString() : num.toFixed(2);
        setCouponMessage(
          `Coupon applied! Discount: ${
            data.data.type === "percentage" ? clean + "%" : "£" + clean + " flat"
          }`
        );
      } else {
        setDiscountData(null);
        setCouponMessage(data.message || "Invalid coupon code");
      }
    } catch {
      setDiscountData(null);
      setCouponMessage("Something went wrong, please try again.");
    }
    setLoading(false);
  };

  const handleCancelCoupon = () => {
    setCoupon("");
    setDiscountData(null);
    setServerDiscount(null);
    setCouponMessage("Coupon cancelled.");
  };

  // ── Totals ────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((acc, item) => {
    return acc + (item.price || 0) * item.quantity;
  }, 0);

  // A coupon can't be combined with the public sector discount, so it is ignored while any line has it.
  const couponActive = !!discountData && !hasPublicSectorDiscount;

  const computedDiscount = discountData && couponActive
    ? discountData.type === "percentage"
      ? (subtotal * Number(discountData.discount)) / 100
      : Number(discountData.discount)
    : 0;
  const discountAmount = couponActive && serverDiscount !== null ? serverDiscount : computedDiscount;

  const total = Math.max(subtotal - (discountAmount || 0), 0);

  // ── Saved cards ───────────────────────────────────────────────────────────
  const applySavedList = (l: SavedCardsList) => {
    setSavedList(l);
    const d = l.payment_methods.find((c) => c.is_default && !c.expired) || l.payment_methods.find((c) => !c.expired);
    setPayChoice((cur) =>
      cur !== "new" && l.payment_methods.some((c) => c.id === cur && !c.expired) ? cur : d ? d.id : "new"
    );
    if (!l.can_add) setSaveCardTick(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    listSavedCards().then((l) => {
      if (!cancelled) applySavedList(l);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const savedEnabled = isLoggedIn && !!savedList?.enabled;
  const usingSavedId = savedEnabled && payChoice !== "new" ? payChoice : "";
  const saveForLater = savedEnabled && !usingSavedId && saveCardTick && !!savedList?.can_add && !!savedList?.consent;
  // Wait for the card list before creating the intent, so we don't create one for the wrong choice.
  const savedReady = !isLoggedIn || savedList !== null;

  // ── Create Stripe payment intent ──────────────────────────────────────────

  // The server prices the cart itself and refuses a total that differs from the one
  // the customer sees (409 PRICE_CHANGED). Prices are never retried automatically.
  const appliedCoupon = couponActive ? coupon.trim() : "";

  useEffect(() => {
    if (!(total > 0 && cart.length > 0)) return;
    if (!savedReady) return;
    let cancelled = false;
    const token = getToken();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/checkout/create-intent/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify({
        total: Number(total.toFixed(2)),
        subtotal,
        discountAmount,
        couponCode: appliedCoupon,
        cart,
        billingAddress,
        shippingAddress,
        // Saved cards: pay with a saved card, or save the new card after paying (never both)
        ...(usingSavedId ? { paymentMethodId: usingSavedId } : {}),
        ...(saveForLater ? { saveCard: true, saveCardConsentVersion: savedList?.consent?.version } : {}),
      }),
    })
      .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
      .then(({ status, body }) => {
        if (cancelled) return;

        if (body.clientSecret) {
          setClientSecret(body.clientSecret);
          setOrderRef(body.order_ref || "");
          setPsSaving(
            (Number(body.totals?.public_sector_discount) || 0) + (Number(body.totals?.student_discount) || 0),
          );
          setCheckoutIssue(null);
          return;
        }

        // Anything else: don't leave a payment form open for an old total.
        setClientSecret("");
        const code: string = body.code || "";
        const message: string =
          body.message || body.error || "We couldn't prepare your payment. Please try again.";

        if (
          code === "PAYMENT_METHOD_NOT_FOUND" ||
          code === "CONSENT_OUTDATED" ||
          code === "LIMIT_REACHED" ||
          code === "SAVED_CARDS_UNAVAILABLE"
        ) {
          // The saved-card list changed: reload it and let the customer choose again
          setSaveCardTick(false);
          setPayChoice("new");
          listSavedCards().then((l) => {
            if (!cancelled) applySavedList(l);
          });
          setCheckoutIssue({ code, message });
        } else if (code === "LOGIN_REQUIRED" || status === 401) {
          setLoginPromptReason("order");
          setShowLoginPopup(true);
          setCheckoutIssue({ code: "LOGIN_REQUIRED", message: "Please log in to continue with this order." });
        } else if (code === "COUPON_INVALID" || code === "COUPON_NOT_COMBINABLE") {
          setCouponMessage(message);
          setDiscountData(null);
          setServerDiscount(null);
          setCoupon("");
          setCheckoutIssue(null);
        } else if (code === "PRICE_CHANGED") {
          const t = body.totals ?? {};
          setCheckoutIssue({
            code,
            message,
            lines: Array.isArray(body.lines)
              ? body.lines.map((l: { cartKey: string; unit_price: string }) => ({
                  cartKey: l.cartKey,
                  unit_price: l.unit_price,
                }))
              : [],
            serverDiscount: t.discount !== undefined ? Number(t.discount) : undefined,
            serverTotal: t.total !== undefined ? Number(t.total) : undefined,
          });
        } else {
          setCheckoutIssue({ code: code || "ERROR", message, item: body.item });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, subtotal, discountAmount, cart, appliedCoupon, isLoggedIn, savedReady, usingSavedId, saveForLater, intentNonce]);

  /** The customer confirms the server's prices; the next create-intent call then succeeds. */
  const acceptServerPrices = () => {
    if (!checkoutIssue || checkoutIssue.code !== "PRICE_CHANGED") return;
    const prices: Record<string, number> = {};
    (checkoutIssue.lines ?? []).forEach((l) => {
      prices[l.cartKey] = Number(l.unit_price);
    });
    updateLinePrices(prices);
    if (discountData && checkoutIssue.serverDiscount !== undefined) {
      setServerDiscount(checkoutIssue.serverDiscount);
    }
    setCheckoutIssue(null);
  };


  // ── field validators ──────────────────────────────
  const validateZip = (zip: string) => {
    const v = zip.trim();
    if (!v) return "Required";
    if (v.length > 12) return "Postcode cannot exceed 12 characters";
    return "";
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "Required";
    if (digits.length < 10) return "Phone number must be at least 10 digits";
    if (digits.length > 15) return "Phone number cannot exceed 15 digits";
    return "";
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateFields = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    newErrors.billingFirstName = billingAddress.firstName ? "" : "Required";
    newErrors.billingLastName = billingAddress.lastName ? "" : "Required";
    newErrors.billingCity = billingAddress.city ? "" : "Required";
    newErrors.billingHouseNumber = billingAddress.houseNumber ? "" : "Required";
    newErrors.billingZip = validateZip(billingAddress.zip);
    newErrors.billingEmail = emailRx.test(billingAddress.email) ? "" : "Invalid email";
    newErrors.billingPhone = validatePhone(billingAddress.phone);

    // Shipping is required only when the cart contains a physical SIM.
    if (hasPhysicalSim) {
      newErrors.shippingFirstName = shippingAddress.firstName ? "" : "Required";
      newErrors.shippingLastName = shippingAddress.lastName ? "" : "Required";
      newErrors.shippingCity = shippingAddress.city ? "" : "Required";
      newErrors.shippingHouseNumber = shippingAddress.houseNumber ? "" : "Required";
      newErrors.shippingZip = validateZip(shippingAddress.zip);
      newErrors.shippingEmail = emailRx.test(shippingAddress.email) ? "" : "Invalid email";
      newErrors.shippingPhone = validatePhone(shippingAddress.phone);
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e.length > 0);
  };

  // Validate a single field live (used on blur from AddressForm)
  const validateOneField = (errKey: string, value: string, filterMsg?: string) => {
    if (filterMsg) {
      setErrors((prev) => ({ ...prev, [errKey]: filterMsg }));
      return;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let msg = "";

    if (errKey.endsWith("Zip")) {
      msg = validateZip(value);
    } else if (errKey.endsWith("Phone")) {
      msg = validatePhone(value);
    } else if (errKey.endsWith("Email")) {
      msg = emailRx.test(value) ? "" : "Invalid email";
    } else if (errKey.endsWith("CompanyName") || errKey.endsWith("State") || errKey.endsWith("Street")) {
      msg = ""; // optional fields — never error
    } else {
      msg = value.trim() ? "" : "Required";
    }

    setErrors((prev) => ({ ...prev, [errKey]: msg }));
  };

  // Build the order line items. transatelID + simType drive server-side SIM
  // reservation (matched against the Transatel SIM inventory by type_of_sim).
  const buildItems = () =>
    cart.map((item) => {
      const unitPrice = Number(item.price ?? 0);
      return {
        id: item.id,
        cartKey: item.cartKey,
        name: item.title,
        category: item.category,
        pricePerUnit: unitPrice,
        quantity: item.quantity,
        totalPrice: unitPrice * item.quantity,
        simType: item.simTypeKey,       // "esim" | "psim"
        duration: item.duration,
        dataAllowance: item.dataAllowance,
        transatelID: item.transatelID,  // Transatel package/product code
        tier: item.tier,
      };
    });

  // ── Place Order – Stripe ──────────────────────────────────────────────────

  const handlePlaceOrderStripe = async () => {
    if (!checkIsLoggedIn()) {
      setLoginPromptReason("order");
      setShowLoginPopup(true);
      return;
    }
    if (!agreeTerms) { setShowTermsPopup(true); return; }
    if (!validateFields()) return;

    try {
      setLoading(true);

      // 1️⃣ Stripe payment
      if (usingSavedId) {
        // Saved card: no form. The backend attached the card, so the browser only confirms it
        // (the bank's 3-D Secure pop-up may appear).
        const stripe = await stripePromise;
        if (!stripe || !clientSecret) {
          setOrderError("Payment is not ready yet. Please try again.");
          setShowOrderErrorPopup(true);
          return;
        }
        const { error: cardError } = await stripe.confirmCardPayment(clientSecret);
        if (cardError) {
          // Declined or 3-D Secure abandoned: the old intent is tied to this card, so ask for a new one.
          setOrderError(cardError.message || "Your payment didn't go through. Please choose another card.");
          setShowOrderErrorPopup(true);
          setClientSecret("");
          setIntentNonce((n) => n + 1);
          return;
        }
      } else if (stripeFormRef.current) {
        const result = await stripeFormRef.current.submitPayment();
        console.log("✅ Stripe result:", result);
        if (!result.success) {
          setOrderError(result.error || "Payment failed.");
          setShowOrderErrorPopup(true);
          return;
        }
      }

      // 2️⃣ Payment succeeded. Confirm directly with Django — no webhook needed.
      if (!orderRef) {
        setOrderError("Payment succeeded but order reference missing. Contact support — you will not be charged twice.");
        setShowOrderErrorPopup(true);
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
      let confirmed = false;

      try {
        // Step 1: Get the payment intent ID stored on the order
        const statusRes = await fetch(`${API_BASE}/api/v1/checkout/order-status/${orderRef}/`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();

          if (statusData.processed) {
            confirmed = true;
          } else if (statusData.stripe_payment_intent_id) {
            // Step 2: Confirm directly via Stripe API — no CLI or webhook needed
            const confirmRes = await fetch(`${API_BASE}/api/v1/checkout/confirm/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_ref: orderRef,
                payment_intent_id: statusData.stripe_payment_intent_id,
              }),
            });
            if (confirmRes.ok) {
              const confirmData = await confirmRes.json();
              if (confirmData.success) confirmed = true;
            }
          }
        }
      } catch { /* fall through to polling */ }

      // Fallback — poll for webhook confirmation
      if (!confirmed) {
        for (let i = 0; i < 8; i++) {
          try {
            const res = await fetch(`${API_BASE}/api/v1/checkout/order-status/${orderRef}/`);
            if (res.ok) {
              const d = await res.json();
              if (d.processed) { confirmed = true; break; }
              if (d.status === "failed") break;
            }
          } catch { /* keep retrying */ }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (!confirmed) {
        setOrderError(`Payment succeeded (ref: ${orderRef}) but order still confirming. Check your email or contact support with this reference.`);
        setShowOrderErrorPopup(true);
        return;
      }

      // Order confirmed — freeze what was bought for the thank-you modal,
      // then empty the real cart (localStorage + header badge via context).
      setPaidCart(cart);
      clearCart();

      if (isSwitchOrder && orderRef) {
        try {
          sessionStorage.setItem("switchOrderRef", orderRef);
        } catch {}
      }

      setShowThankYou(true);
    } catch (err: unknown) {
      console.error("❌ caught error:", err);
      setOrderError(err instanceof Error ? err.message : "Something went wrong.");
      setShowOrderErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDiscount = (value: string | number) => {
    const n = parseFloat(String(value));
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  };

  // ── Waiting for CartContext to load from localStorage ─────────────────────
  // (avoids flashing "Your cart is empty" on a hard refresh of /checkout)
  if (!cartHydrated && !paidCart) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FFF5FA] to-gray-50">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-[#e6007e] border-t-transparent"
          role="status"
        >
          <span className="sr-only">Loading cart...</span>
        </div>
      </div>
    );
  }

  // ── Empty Cart ────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFF5FA] to-gray-50 px-4 py-16 text-center">
        <div className="mb-6 flex h-36 w-36 items-center justify-center rounded-full bg-[#e6007e]/10 ring-8 ring-[#e6007e]/5">
          <svg className="h-16 w-16 text-[#e6007e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-3xl font-black text-gray-900">Your cart is empty</h2>
        <p className="mb-8 text-gray-500">Looks like you haven&apos;t added a plan yet.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/plans"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e6007e] to-[#A3157A] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(230,0,126,0.3)] transition hover:scale-[1.02]"
          >
            Browse SIM plans
          </a>
          <a
            href="/devices"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:border-[#e6007e]/40"
          >
            Shop devices
          </a>
        </div>
      </div>
    );
  }

  // ── Main Checkout ─────────────────────────────────────────────────────────
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5FA] via-gray-50 to-gray-50 text-gray-900">
      {/* ── Page header ── */}
      <div className="border-b border-pink-100/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#e6007e]">
              <Lock className="h-3.5 w-3.5" /> Secure checkout
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Complete your order</h1>
          </div>
          <ol className="flex items-center gap-2 text-xs font-bold sm:text-sm" aria-label="Checkout steps">
            {["Cart", "Details", "Payment"].map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full ${
                    i === 0 ? "bg-emerald-500 text-white" : "bg-[#e6007e] text-white"
                  }`}
                >
                  {i === 0 ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="text-gray-700">{step}</span>
                {i < 2 && <span className="mx-1 h-px w-6 bg-gray-300 sm:w-10" />}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">

          {/* ── Left Column ── */}
          <div className="min-w-0 flex-1 space-y-6">

            {/* Cart Items */}
            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(17,24,39,0.05)]">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                <h2 className="flex items-center gap-3 text-lg font-black">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e6007e]/10 text-[#e6007e]">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  Your items
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const isDevice = item._raw?.type === "product";
                  return (
                    <div key={item.cartKey} className="flex gap-4 px-5 py-5 sm:px-6">
                      {/* Thumbnail */}
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF0F8] to-white ring-1 ring-pink-100 sm:h-20 sm:w-20">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" className="h-full w-full object-contain p-1.5" />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#e6007e] to-[#A3157A] text-white shadow">
                            {isDevice ? <Smartphone className="h-5 w-5" /> : <Signal className="h-5 w-5" />}
                          </span>
                        )}
                      </div>

                      {/* Plan / device information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base font-black leading-tight sm:text-lg">{item.title}</p>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black">£{(item.price * item.quantity).toFixed(2)}</p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-500">£{item.price.toFixed(2)} × {item.quantity}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {item.category && !isDevice && (
                            <span className="rounded-full bg-[#e6007e]/10 px-2.5 py-1 text-[11px] font-bold text-[#C4006B]">
                              {item.category}
                            </span>
                          )}
                          {!isDevice && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                              {item.simTypeKey === "esim" ? <QrCode className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                              {item.simType}
                            </span>
                          )}
                          {item.dataAllowance && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                              {item.dataAllowance}
                            </span>
                          )}
                          {item.duration && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                              <CalendarDays className="h-3 w-3" />
                              {formatDuration(item.duration)}
                            </span>
                          )}
                        </div>

                        {/* Delivery method note */}
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                          {item.simTypeKey === "esim" && !isDevice ? (
                            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                          ) : (
                            <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                          )}
                          {isDevice
                            ? "Shipped to your address."
                            : item.simTypeKey === "esim"
                              ? "eSIM — activation instructions sent by email after purchase."
                              : "Physical SIM — shipped to your address."}
                        </p>

                        {(item._raw?.metadata as any)?.isSwitchAndSave && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-xs text-[#E01C5B]">
                            <span className="font-bold">Switch request:</span>
                            <span>
                              {(item._raw?.metadata as any)?.switchRoute === "keep_pac"
                                ? `Keep number ${(item._raw?.metadata as any)?.portOldNumber || ""}`
                                : (item._raw?.metadata as any)?.switchRoute === "new_stac"
                                ? "New number, close old provider"
                                : "New Zoiko number"}
                            </span>
                          </div>
                        )}

                        {/* Quantity + remove */}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex h-9 items-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.cartKey, item.quantity - 1)}
                              disabled={loading || item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="grid h-full w-9 place-items-center text-gray-600 transition hover:text-[#e6007e] disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              disabled={loading}
                              aria-label="Quantity"
                              onChange={(e) => handleQuantityChange(item.cartKey, parseInt(e.target.value, 10))}
                              className="w-9 bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.cartKey, item.quantity + 1)}
                              disabled={loading}
                              aria-label="Increase quantity"
                              className="grid h-full w-9 place-items-center text-gray-600 transition hover:text-[#e6007e] disabled:text-gray-300"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.cartKey)}
                            disabled={loading || !!paidCart}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Coupon (not available with the public sector discount) */}
            {hasPublicSectorDiscount ? (
              <section className="flex items-start gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-black text-emerald-900">Your verified discount is applied</h2>
                  <p className="mt-1 text-sm text-emerald-800">
                    Coupons can&apos;t be used together with your public sector / student discount.
                  </p>
                </div>
              </section>
            ) : (
            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_10px_40px_rgba(17,24,39,0.05)] sm:p-6">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-black">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e6007e]/10 text-[#e6007e]">
                  <Ticket className="h-4 w-4" />
                </span>
                Have a coupon?
              </h2>
              {showPromoHint && prefilledPromo && (
                <div
                  role="status"
                  className="mb-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                >
                  <span aria-hidden="true">🎉</span>
                  <span>{prefilledPromo.hint}</span>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className={`h-12 w-full rounded-xl border-2 pl-10 pr-3 text-sm font-semibold uppercase tracking-wider outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-[#e6007e] focus:ring-4 focus:ring-[#e6007e]/10 ${
                      discountData
                        ? "border-emerald-400 bg-emerald-50/50"
                        : showPromoHint
                          ? "border-green-400"
                          : "border-gray-200"
                    }`}
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={loading}
                  className="h-12 rounded-xl bg-gray-900 px-6 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? "Applying…" : "Apply"}
                </button>
                {discountData && (
                  <button
                    onClick={handleCancelCoupon}
                    disabled={loading}
                    className="h-12 rounded-xl border-2 border-red-200 px-5 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              {couponMessage && (
                <p
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                    discountData ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {discountData && <Check className="h-4 w-4" strokeWidth={3} />}
                  {couponMessage}
                </p>
              )}
              {!isLoggedIn && (
                <p className="mt-2 text-xs text-gray-500">
                  You need to be logged in to apply a coupon.
                </p>
              )}
            </section>
            )}

            {/* Billing Address */}
            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_10px_40px_rgba(17,24,39,0.05)] sm:p-6">
              <h2 className="mb-5 flex items-center gap-3 text-lg font-black">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e6007e]/10 text-[#e6007e]">
                  <UserRound className="h-4 w-4" />
                </span>
                Billing details
              </h2>
              <AddressForm
                address={billingAddress}
                setAddress={setBillingAddress}
                prefix="billing"
                errors={errors}
                loading={loading}
                onValidateField={validateOneField}
              />

              {/* Shipping is required for physical SIMs, hidden for eSIM-only carts. */}
              {hasPhysicalSim ? (
                <div className="mt-6 border-t border-dashed border-gray-200 pt-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <h3 className="flex items-center gap-2 font-black text-gray-900">
                      <Truck className="h-5 w-5 text-[#e6007e]" /> Shipping address
                    </h3>
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
                      Required for physical SIM
                    </span>
                  </div>
                  <AddressForm
                    address={shippingAddress}
                    setAddress={setShippingAddress}
                    prefix="shipping"
                    errors={errors}
                    loading={loading}
                    includeShipping
                    onValidateField={validateOneField}
                  />
                </div>
              ) : (
                <p className="mt-6 flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
                  <Mail className="h-4 w-4 shrink-0" />
                  Your eSIM will be delivered by email — no shipping address needed.
                </p>
              )}
            </section>
          </div>

          {/* ── Right Column ── */}
          <div className="w-full space-y-6 lg:sticky lg:top-6 lg:w-[400px] lg:self-start">

            {/* Order Summary */}
            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(17,24,39,0.06)]">
              <div className="bg-gradient-to-br from-[#12041A] via-[#3A0E52] to-[#e6007e] px-6 py-5 text-white">
                <h2 className="text-lg font-black">Order summary</h2>
                <p className="text-xs text-pink-100/80">{itemCount} item{itemCount !== 1 ? "s" : ""} in your order</p>
              </div>

              <div className="space-y-3 p-6">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.title}</p>
                      <span className="block text-xs font-medium text-gray-500">
                        {item._raw?.type === "product" ? "Device" : item.simType}
                        {item.dataAllowance ? ` · ${item.dataAllowance}` : ""}
                        {item.duration ? ` · ${formatDuration(item.duration)}` : ""}
                        {item.quantity > 1 ? ` · £${item.price.toFixed(2)} × ${item.quantity}` : ""}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="space-y-2 border-t border-dashed border-gray-200 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">£{subtotal.toFixed(2)}</span>
                  </div>

                  {hasPublicSectorDiscount && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">Verified discount (included in prices above)</span>
                      {psSaving > 0 && (
                        <span className="shrink-0 font-semibold text-emerald-600">You save £{psSaving.toFixed(2)}</span>
                      )}
                    </div>
                  )}

                  {couponActive && discountData && (
                    <div className="flex justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-gray-500">
                        <Ticket className="h-3.5 w-3.5 text-emerald-600" />
                        Discount (
                        {discountData.type === "percentage"
                          ? formatDiscount(discountData.discount) + "%"
                          : "£" + formatDiscount(discountData.discount)}
                        )
                      </span>
                      <span className="font-semibold text-emerald-600">
                        −£{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between rounded-2xl bg-[#FFF5FA] px-4 py-3">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-black text-[#e6007e]">£{total.toFixed(2)}</span>
                </div>
                <p className="text-center text-[11px] text-gray-400">Prices include VAT</p>
              </div>
            </section>

            {/* Checkout problems reported by the server (prices, eligibility, availability) */}
            {checkoutIssue && checkoutIssue.code !== "LOGIN_REQUIRED" && (
              <div
                role="alert"
                className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
              >
                <p className="font-semibold">{checkoutIssue.message}</p>

                {checkoutIssue.code === "PRICE_CHANGED" && (
                  <div className="mt-2">
                    {checkoutIssue.serverTotal !== undefined && (
                      <p className="mb-2">New total: £{checkoutIssue.serverTotal.toFixed(2)}</p>
                    )}
                    <button
                      type="button"
                      onClick={acceptServerPrices}
                      className="rounded-xl bg-[#e6007e] px-4 py-2 text-xs font-bold text-white hover:bg-[#C4006B]"
                    >
                      Update my order and continue
                    </button>
                  </div>
                )}

                {(checkoutIssue.code === "PLAN_NOT_AVAILABLE" || checkoutIssue.code === "PRODUCT_NOT_AVAILABLE") &&
                  checkoutIssue.item && (
                    <button
                      type="button"
                      onClick={() => handleRemove(checkoutIssue.item!)}
                      className="mt-2 rounded-xl bg-[#e6007e] px-4 py-2 text-xs font-bold text-white hover:bg-[#C4006B]"
                    >
                      Remove this item
                    </button>
                  )}
              </div>
            )}

            {/* Payment */}
            <section
              ref={paymentCardRef}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_rgba(17,24,39,0.06)]"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-lg font-black">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e6007e]/10 text-[#e6007e]">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  Payment
                </h2>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Stripe Secure 256-bit</span>
                </div>
              </div>

              {savedEnabled && savedList && savedList.payment_methods.length > 0 && (
                <div className="mb-4 flex flex-col gap-2" role="radiogroup" aria-label="Choose how to pay">
                  {savedList.payment_methods.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-sm transition ${
                        c.expired ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      } ${
                        payChoice === c.id
                          ? "border-[#e6007e] bg-[#FFF0F8]"
                          : "border-gray-200 hover:border-pink-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay-choice"
                        checked={payChoice === c.id}
                        disabled={c.expired || loading}
                        onChange={() => {
                          setClientSecret("");
                          setPayChoice(c.id);
                        }}
                        className="accent-[#e6007e]"
                      />
                      <span className="font-semibold">
                        {cardBrandLabel(c.brand)} •••• {c.last4}
                      </span>
                      <span className="text-xs text-gray-500">Expires {cardExpiryLabel(c)}</span>
                      {c.is_default && <span className="ml-auto text-[11px] font-semibold text-emerald-600">Default</span>}
                      {c.expired && <span className="ml-auto text-[11px] font-semibold text-red-500">Expired</span>}
                    </label>
                  ))}
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-sm transition ${
                      payChoice === "new" ? "border-[#e6007e] bg-[#FFF0F8]" : "border-gray-200 hover:border-pink-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay-choice"
                      checked={payChoice === "new"}
                      disabled={loading}
                      onChange={() => {
                        setClientSecret("");
                        setPayChoice("new");
                      }}
                      className="accent-[#e6007e]"
                    />
                    <span className="font-semibold">Use a new card</span>
                  </label>
                </div>
              )}

              {usingSavedId ? (
                clientSecret ? (
                  <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                    Your saved card will be charged £{total.toFixed(2)} when you press Pay. Your bank may ask you to confirm.
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">Preparing your payment…</div>
                )
              ) : clientSecret ? (
                <Elements
                  key={`${clientSecret}-${isDark ? "dark" : "light"}`}
                  stripe={stripePromise}
                  options={stripeOptions}
                >
                  <StripePaymentForm ref={stripeFormRef} />
                </Elements>
              ) : (
                <div className="space-y-3 py-2" aria-label="Loading payment form">
                  <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                  </div>
                  <p className="text-center text-xs text-gray-400">Loading secure payment form…</p>
                </div>
              )}

              {savedEnabled && !usingSavedId && savedList?.can_add && savedList.consent && (
                <label className="mt-4 flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={saveCardTick}
                    onChange={(e) => {
                      setClientSecret("");
                      setSaveCardTick(e.target.checked);
                    }}
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 accent-[#e6007e]"
                  />
                  <span className="text-sm text-gray-600">{savedList.consent.text}</span>
                </label>
              )}

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-2xl bg-gray-50 p-3.5">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 accent-[#e6007e]"
                />
                <span className="text-sm text-gray-600">
                  I have read and agree to the website{" "}
                  <a href="/terms-and-conditions" className="font-semibold text-[#e6007e] hover:underline">
                    terms and conditions
                  </a>
                  .
                </span>
              </label>

              {!isLoggedIn && (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  You need to be logged in to place an order.{" "}
                  <a
                    href={`/login?redirect=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.href : "/checkout"
                    )}`}
                    className="font-bold text-[#e6007e] hover:underline"
                  >
                    Log in
                  </a>
                </p>
              )}

              <button
                onClick={handlePlaceOrderStripe}
                disabled={loading || !clientSecret}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e6007e] to-[#A3157A] text-base font-extrabold text-white shadow-[0_12px_28px_rgba(230,0,126,0.35)] transition hover:scale-[1.01] hover:shadow-[0_16px_34px_rgba(230,0,126,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    {`Pay £${total.toFixed(2)}`}
                  </>
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <Lock className="h-3 w-3" /> Payments are encrypted and processed securely by Stripe
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal
        show={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        title="Login Required"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-5 text-sm">
            {loginPromptReason === "order"
              ? "You need to log in before you can place an order. Your cart will be waiting for you when you come back."
              : "You need to log in to apply a coupon code."}
          </p>
          <a
            href={`/login?next=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout"
            )}`}
            className="block w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors mb-2"
          >
            Go to Login
          </a>
          <button
            onClick={() => setShowLoginPopup(false)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        show={showTermsPopup}
        onClose={() => setShowTermsPopup(false)}
        title="Terms & Conditions Required"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-5 text-sm">
            You must agree to the{" "}
            <a href="/terms-and-conditions" className="text-red-500 hover:underline">
              terms and conditions
            </a>{" "}
            before placing your order.
          </p>
          <button
            onClick={() => setShowTermsPopup(false)}
            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
          >
            OK, I understand
          </button>
        </div>
      </Modal>

      <Modal
        show={showThankYou}
        onClose={() => {
          setShowThankYou(false);
          if (isSwitchOrder && orderRef) {
            window.location.href = `/switch-and-save?step=5&ref=${orderRef}`;
          } else {
            window.location.href = "/dashboard";
          }
        }}
        title=""
      >
        <div className="text-center py-4">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Placed! 🎉</h2>
          <p className="text-sm font-medium text-green-600 mb-4">Payment successful</p>

          <div className="border-t border-gray-100 my-4" />

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-800">£{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold text-green-600">−£{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
              <span className="text-gray-900">Total Paid</span>
              <span className="text-red-500">£{total.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-5">
            A confirmation email has been sent to{" "}
            <span className="font-medium text-gray-600">{billingAddress.email}</span>
          </p>

          <button
            onClick={() => {
              setShowThankYou(false);
              if (isSwitchOrder && orderRef) {
                window.location.href = `/switch-and-save?step=5&ref=${orderRef}`;
              } else {
                window.location.href = "/dashboard";
              }
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg mb-2"
          >
            {isSwitchOrder ? "Track Your Switch & SIM →" : "Go to Dashboard →"}
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </Modal>

      <Modal
        show={showOrderErrorPopup}
        onClose={() => setShowOrderErrorPopup(false)}
        title="Order Failed"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-5 text-sm">{orderError}</p>
          <button
            onClick={() => setShowOrderErrorPopup(false)}
            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  );
}
"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm, { StripePaymentFormRef } from "../components/StripePaymentForm";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { isLoggedIn as checkIsLoggedIn, getUser } from "../utils/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Raw shape written to localStorage["cart"] by the plan-selection page.
 * Every line is a Transatel SIM plan — there are no other product types.
 *
 * Example:
 * {
 *   "cartKey": "plan-10-30-psim",
 *   "id": 10,
 *   "type": "plan",
 *   "name": "Zoiko Saver Plus",
 *   "slug": "zoiko-saver-plus",
 *   "image": "",
 *   "category": "SIM Only Plans",
 *   "price": 4.5,
 *   "quantity": 1,
 *   "metadata": {
 *     "simType": "psim",
 *     "duration": 30,
 *     "dataAllowance": "3GB",
 *     "transatelID": "TSL_UK_DATA_1GB",
 *     "tier": null
 *   }
 * }
 */
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
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const inputClass = (error?: string) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors
   focus:ring-2 focus:ring-red-300 focus:border-red-400 
   ${error ? "border-red-400 bg-red-50 dark:bg-red-900" : "border-gray-200 bg-white dark:bg-gray-800 "}`;

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
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [discountData, setDiscountData] = useState<DiscountData | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<"coupon" | "order">("order");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  // ── Load & normalise cart ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const storedCart = JSON.parse(
        localStorage.getItem("cart") ?? "[]"
      ) as RawCartItem[];
      const normalized: CartItem[] = (Array.isArray(storedCart) ? storedCart : []).map(
        normalizeCartItem
      );
      setCart(normalized);

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
    } catch {
      setCart([]);
    }
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────

  /**
   * Physical (pSIM) items are shipped, so they require a shipping address.
   * eSIMs are delivered by email and need none.
   */
  const hasPhysicalSim = cart.some((item) => item.simTypeKey === "psim");

  // ── Cart mutations ────────────────────────────────────────────────────────

  const persistCart = (next: CartItem[]) => {
    try {
      localStorage.setItem("cart", JSON.stringify(next.map((i) => i._raw)));
      // Notify the header CartIcon (same-tab "storage" doesn't fire).
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      /* ignore storage errors */
    }
  };

  const handleRemove = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    persistCart(newCart);
  };

  const handleQuantityChange = (index: number, nextQty: number) => {
    const qty = Math.max(1, Math.floor(nextQty) || 1);
    setCart((prev) => {
      const next = prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          quantity: qty,
          _raw: { ...item._raw, quantity: qty },
        };
      });
      persistCart(next);
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cart-updated"));
  };

  // ── Coupon ────────────────────────────────────────────────────────────────

  const handleApplyCoupon = async () => {
    const user = JSON.parse(localStorage.getItem("user") ?? "null");
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
    setCouponMessage("Coupon cancelled.");
  };

  // ── Totals ────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((acc, item) => {
    return acc + (item.price || 0) * item.quantity;
  }, 0);

  const discountAmount = discountData
    ? discountData.type === "percentage"
      ? (subtotal * Number(discountData.discount)) / 100
      : Number(discountData.discount)
    : 0;

  const total = Math.max(subtotal - (discountAmount || 0), 0);

  // ── Create Stripe payment intent ──────────────────────────────────────────

  useEffect(() => {
    if (total > 0 && cart.length > 0) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          subtotal,
          discountAmount,
          cart,
          billingAddress,
          shippingAddress,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, subtotal, discountAmount, cart]);

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
      if (stripeFormRef.current) {
        const result = await stripeFormRef.current.submitPayment();
        console.log("✅ Stripe result:", result);
        if (!result.success) {
          setOrderError(result.error || "Payment failed.");
          setShowOrderErrorPopup(true);
          return;
        }
      }

      // 2️⃣ Build the SIM-plan order and save it to Django. The backend reserves
      //    a matching SIM from the Transatel inventory per line (by simType +
      //    transatelID) and sends the activation / dispatch email.
      const user = getUser();
      const orderPayload = {
        user_id: user?.id ?? null,
        email: billingAddress.email || user?.email || "",
        country_code: "UK",
        billingAddress,
        shippingAddress: hasPhysicalSim ? shippingAddress : billingAddress,
        coupon: discountData ? { ...discountData } : null,
        items: buildItems(),
        totals: { subtotal, discount: discountAmount, total },
        agreedToTerms: agreeTerms,
        paymentMethod: "stripe",
        createdAt: new Date().toISOString(),
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.token) headers.Authorization = `Bearer ${user.token}`;

      // Transatel SIM order: the backend reserves a SIM per line (matched by
      // simType), assigns it to this order, and activates it via the Transatel
      // API using the plan's transatelID as the package code.
      const orderRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sim-orders/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(orderPayload),
        },
      );
      const orderResData = await orderRes.json().catch(() => ({}));
      console.log(
        "✅ Django response ok:", orderRes.ok,
        "status:", orderRes.status, "data:", orderResData,
      );

      if (!orderRes.ok || !orderResData?.success) {
        setOrderError(orderResData?.message || "Order could not be saved.");
        setShowOrderErrorPopup(true);
        return;
      }

      // Order saved — clear the cart so it isn't re-submitted.
      try {
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cart-updated"));
      } catch {
        /* ignore storage errors */
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

  // ── Empty Cart ────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-screen dark:bg-gray-900 bg-gray-50 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-40 h-40 bg-red-50 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
          <svg className="w-20 h-20 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven&apos;t added a plan yet.</p>
      </div>
    );
  }

  // ── Main Checkout ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left Column ── */}
          <div className="flex-1 space-y-6">

            {/* Cart Items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Your Items</h2>
                <span className="text-xs text-gray-400 font-medium">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {cart.map((item, idx) => (
                  <div key={item.cartKey} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      {/* 📦 Plan Information */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">
                          {item.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          {/* 🏷️ Category */}
                          {item.category && (
                            <span className="bg-[#c61b7f]/10 text-[#c61b7f] text-xs font-bold px-2.5 py-1 rounded-md">
                              {item.category}
                            </span>
                          )}
                          {/* 📶 SIM Type (eSIM / pSIM) */}
                          <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 3h6l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13h6m-6 4h6m-6-8h2" />
                            </svg>
                            {item.simType}
                          </span>
                          {/* 📊 Data allowance */}
                          {item.dataAllowance && (
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
                              {item.dataAllowance}
                            </span>
                          )}
                          {/* 🗓️ Duration */}
                          {item.duration && (
                            <span className="text-xs text-gray-500 font-medium">
                              {formatDuration(item.duration)}
                            </span>
                          )}
                        </div>

                        {/* Delivery method note */}
                        <p className="text-xs text-gray-400 flex items-start gap-1">
                          <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {item.simTypeKey === "esim"
                            ? "eSIM — activation instructions sent by email after purchase."
                            : "Physical SIM — shipped to your address."}
                        </p>
                      </div>

                      {/* 💰 Price Display */}
                      <div className="text-right shrink-0">
                        <p className="font-bold dark:text-white text-lg">
                          £{(item.price * item.quantity).toFixed(2)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            £{item.price.toFixed(2)} × {item.quantity}
                          </p>
                        )}
                        {/* 🔢 Quantity stepper */}
                        <div className="mt-2 inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                            disabled={loading || item.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="px-2.5 py-1 text-base leading-none text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            disabled={loading}
                            onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10))}
                            className="w-10 py-1 text-center text-sm font-semibold bg-transparent text-gray-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                            disabled={loading}
                            aria-label="Increase quantity"
                            className="px-2.5 py-1 text-base leading-none text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div>
                          <button
                            onClick={() => handleRemove(idx)}
                            className="text-xs text-red-500 hover:underline mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Have a Coupon?</h2>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  disabled={loading}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={loading}
                  className="px-4 flex-row md:flex-col py-2.5 rounded-lg bg-[#10446c] hover:bg-[#0d3a5a] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Applying…" : "Apply"}
                </button>
                {discountData && (
                  <button
                    onClick={handleCancelCoupon}
                    disabled={loading}
                    className="px-4 flex-row md:flex-col py-2.5 rounded-lg border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              {couponMessage && (
                <p className={`mt-2 text-sm ${discountData ? "text-green-600" : "text-red-500"}`}>
                  {couponMessage}
                </p>
              )}
              {!isLoggedIn && (
                <p className="mt-2 text-xs text-[#10446c] dark:text-gray-400">
                  You need to be logged in to apply a coupon.
                </p>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-5">Billing Details</h2>
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
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Shipping Address</h3>
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded">
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
                <p className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Your eSIM will be delivered by email — no shipping address needed.
                </p>
              )}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="w-full lg:w-96 space-y-6">

            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                      {item.quantity > 1 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          £{item.price.toFixed(2)} × {item.quantity}
                        </span>
                      )}
                      <span className="block text-xs text-teal-600 dark:text-teal-400 font-medium">
                        {item.simType}
                        {item.dataAllowance ? ` · ${item.dataAllowance}` : ""}
                        {item.duration ? ` · ${formatDuration(item.duration)}` : ""}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {discountData && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">
                    Discount (
                    {discountData.type === "percentage"
                      ? formatDiscount(discountData.discount) + "%"
                      : "£" + formatDiscount(discountData.discount)}
                    )
                  </span>
                  <span className="font-medium text-green-600">
                    −£{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-base mt-4 pt-4 border-t border-gray-100">
                <span>Total</span>
                <span className="text-red-500">£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment */}
            <div
              ref={paymentCardRef}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Payment</h2>

              {clientSecret ? (
                <Elements
                  key={`${clientSecret}-${isDark ? "dark" : "light"}`}
                  stripe={stripePromise}
                  options={stripeOptions}
                >
                  <StripePaymentForm ref={stripeFormRef} />
                </Elements>
              ) : (
                <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading payment form…
                </div>
              )}

              <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 mt-0.5 accent-red-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I have read and agree to the website{" "}
                  <a href="/terms-and-conditions" className="text-red-500 hover:underline">
                    terms and conditions
                  </a>
                  .
                </span>
              </label>

              {!isLoggedIn && (
                <p className="mt-4 text-xs text-center text-[#10446c] dark:text-gray-400">
                  You need to be logged in to place an order.{" "}
                  <a
                    href={`/login?redirect=${encodeURIComponent(
                      typeof window !== "undefined" ? window.location.href : "/checkout"
                    )}`}
                    className="text-red-500 hover:underline font-semibold"
                  >
                    Log in
                  </a>
                </p>
              )}

              <button
                onClick={handlePlaceOrderStripe}
                disabled={loading || !clientSecret}
                className="w-full mt-5 py-3.5 rounded-xl bg-[#10446c] hover:bg-[#0d3a5a] text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing payment…
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
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
            href={`/login?redirect=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.href : "/"
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
          setCart([]);
          window.location.href = "/dashboard";
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
              setCart([]);
              window.location.href = "/dashboard";
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg mb-2"
          >
            Go to Dashboard →
          </button>
          <button
            onClick={() => {
              setCart([]);
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
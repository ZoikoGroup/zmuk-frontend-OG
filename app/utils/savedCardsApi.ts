// Saved payment methods API (guide: Saved_Payment_Methods_Frontend_Guide.md)
// Card details never touch our code: they go from the browser to Stripe.
// Never log or store a client_secret.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface SavedCard {
  id: string;
  type: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  expired: boolean;
  is_default: boolean;
  created_at?: string;
}

export interface SavedCardsList {
  enabled: boolean;
  limit: number;
  can_add: boolean;
  password_required: boolean;
  payment_methods: SavedCard[];
  consent: { version: string; text: string } | null;
}

export interface SavedCardsResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

/** Shown when the feature is off, the customer is a guest or the request fails: nothing saved-card related is shown. */
export const SAVED_CARDS_OFF: SavedCardsList = {
  enabled: false,
  limit: 0,
  can_add: false,
  password_required: false,
  payment_methods: [],
  consent: null,
};

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token");
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(path: string, body?: object): Promise<SavedCardsResult<any>> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/api/v1/payment-methods/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { code: "NETWORK", message: "Network error. Please try again." } };
  }
}

/** GET list. Guests, errors and "feature off" all return the "off" shape so the UI hides itself. */
export async function listSavedCards(): Promise<SavedCardsList> {
  if (!getAuthToken()) return SAVED_CARDS_OFF;
  const r = await call("");
  if (!r.ok || !r.data || r.data.enabled !== true) return SAVED_CARDS_OFF;
  return {
    enabled: true,
    limit: Number(r.data.limit) || 3,
    can_add: r.data.can_add === true,
    password_required: r.data.password_required === true,
    payment_methods: Array.isArray(r.data.payment_methods) ? r.data.payment_methods : [],
    consent: r.data.consent || null,
  };
}

/** Customer-facing message for an error response. Branch on `code`, show `message`. */
export function cardErrorMessage(r: SavedCardsResult<{ message?: string; code?: string }>): string {
  if (r.status === 429) return "Please try again later.";
  if (r.data?.message) return r.data.message;
  return "We couldn't save your card. No payment has been taken. Please try again or use another card.";
}

export const startCardSetup = (consentVersion: string) =>
  call("setup-intent/", { consent: true, consent_version: consentVersion });

export const confirmCardSetup = (setupIntentId: string) =>
  call("setup-intent/confirm/", { setup_intent_id: setupIntentId });

export const setDefaultCard = (id: string, password?: string) =>
  call(`${id}/default/`, password ? { password } : {});

export const removeCard = (id: string, password?: string) =>
  call(`${id}/remove/`, password ? { password } : {});

export function cardExpiryLabel(c: Pick<SavedCard, "exp_month" | "exp_year">): string {
  return `${String(c.exp_month).padStart(2, "0")}/${String(c.exp_year).slice(-2)}`;
}

export function cardBrandLabel(brand: string): string {
  const b = (brand || "").toLowerCase();
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    diners: "Diners",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return map[b] || (brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Card");
}

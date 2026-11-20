import type { Term, SimType, QuoteResponse } from "@/app/dashboard/add-new-number/addLineApi";

// Same default as the dashboard pages so a missing env var never posts to the frontend origin.
export const SWITCH_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SWITCH_SESSION_KEY = "zoiko_switch_session_v2";
const SWITCH_REF_KEY = "switchOrderRef";

// Accepted by the backend (Frontend Guide §4.1). "Other" is also accepted.
export const UK_MOBILE_PROVIDERS = [
  "EE",
  "O2",
  "Vodafone",
  "Three",
  "Sky Mobile",
  "giffgaff",
  "Tesco Mobile",
  "iD Mobile",
  "VOXI",
  "SMARTY",
  "Lebara",
  "Lycamobile",
  "BT Mobile",
  "Virgin Mobile",
  "Other UK Provider",
] as const;

/** Backend field is numeric (GB). Returns e.g. 10 from "10GB", or null for blank/"Unlimited"/non-numeric. */
export function normaliseDataAllowance(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

/** Parses "£12.50" / "12.5" into a number, or null when blank / not a number. */
export function parseMoney(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && String(value).trim() !== "" ? n : null;
}

// ─── Status types (Frontend Guide §4.2) ──────────────────────────────────────
export type SwitchRequestStatus =
  | "received"
  | "validating"
  | "action_needed"
  | "ready_for_order"
  | "converted"
  | "cancelled"
  | "expired"
  | "rejected";

export interface SwitchStep {
  key: "request_received" | "order_placed" | "sim_ready" | "switch_scheduled" | "number_transferred" | string;
  label: string;
  applicable: boolean;
  done: boolean;
  at: string | null;
}

export interface SwitchHistoryItem {
  event: string;
  status: string;
  label: string;
  at: string;
}

export interface SwitchStatus {
  reference: string;
  status: SwitchRequestStatus | string;
  status_label: string;
  stage: { key: string; label: string };
  steps: SwitchStep[];
  action_needed: { reason: string; message: string } | null;
  next_action: "none" | "provide_code" | "await_contact" | string;
  switch_route: "keep_pac" | "new_stac" | "new_keep" | string;
  code_type: "PAC" | "STAC" | null | string;
  pac_status: string;
  switch_date: string | null;
  switch_date_message: string;
  history: SwitchHistoryItem[];
  feedback_submitted: boolean;
  created_at: string;
  updated_at: string;
  // Owner view only
  id?: number;
  first_name?: string;
  plan?: { id: number; name: string } | null;
  contract_term?: Term;
  sim_type?: SimType;
  port_number_masked?: string | null;
  pac_later?: boolean;
  order_reference?: string | null;
  line_id?: string | number | null;
}

/** Statuses after which nothing more will change from the request side. */
export const TERMINAL_STATUSES = ["converted", "cancelled", "expired", "rejected"];

// ─── Errors ──────────────────────────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  mobile: "Contact number",
  address_line_1: "Address",
  address_line_2: "Address line 2",
  town_city: "Town or city",
  postcode: "Postcode",
  current_provider: "Current provider",
  current_plan_cost: "Current plan cost",
  current_data_allowance: "Current data allowance",
  plan_id: "Plan",
  contract_term: "Contract length",
  sim_type: "SIM type",
  promo_code: "Promo code",
  switch_route: "Switch route",
  port_number: "Number to switch",
  transfer_authorised: "Authorisation",
  timeline_acknowledged: "Authorisation",
  terms_accepted: "Authorisation",
  pac_code: "PAC code",
  stac_code: "STAC code",
  consent_version: "Wording",
  idempotency_key: "Request",
  code: "Code",
  code_type: "Code type",
  msisdn: "Mobile number",
  rating: "Rating",
};

/** Error carrying the HTTP status, API `code` and DRF field errors so the UI can react. */
export class SwitchApiError extends Error {
  status: number;
  code: string | null;
  fieldErrors: Record<string, string[]>;
  constructor(message: string, status = 0, code: string | null = null, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "SwitchApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function failFromResponse(res: Response, data: unknown, fallback: string): Promise<never> {
  const body = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;

  if (res.status === 429) {
    throw new SwitchApiError(
      (typeof body.detail === "string" && body.detail) || "Too many requests. Please wait a moment and try again.",
      429,
      "THROTTLED"
    );
  }

  // 404 / 409 / 503 use { success:false, code, message }
  if (typeof body.code === "string" && typeof body.message === "string") {
    throw new SwitchApiError(body.message, res.status, body.code);
  }

  // 400 validation errors: { field: ["message"] }
  const fieldErrors: Record<string, string[]> = {};
  const msgs: string[] = [];
  for (const [key, val] of Object.entries(body)) {
    const list = Array.isArray(val) ? val.map(String) : typeof val === "string" ? [val] : [];
    if (!list.length) continue;
    fieldErrors[key] = list;
    msgs.push(list.join(" "));
  }
  if (msgs.length > 0) {
    throw new SwitchApiError(msgs.join(" "), res.status, "VALIDATION", fieldErrors);
  }
  throw new SwitchApiError(fallback, res.status);
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] || key;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("zoiko_token") || localStorage.getItem("access_token");
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...extra,
  };
}

/** One random value per form session, reused for retries / double clicks (guide rule 5). */
export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function formatNextRenewalDate(term: Term): string {
  const now = new Date();
  if (term === "30D") {
    now.setDate(now.getDate() + 30);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Quote (POST /api/v1/switch/quote/) ──────────────────────────────────────
export interface SwitchQuoteResult {
  quote: QuoteResponse;
  source: "server_quote" | "plan_tariff";
  promoMessage?: string | null;
  /** Wording version to send back on submit. null when the quote came from the tariff fallback. */
  consentVersion: string | null;
  /** The exact Step 4 sentence to show beside the authorisation box (from the backend). */
  consentStatement: string | null;
}

export function buildPlanTariffQuote(params: {
  planId: number;
  planName: string;
  dataAllowance: string;
  monthlyPrice: number;
  term: Term;
  simType: SimType;
}): QuoteResponse {
  const { planId, planName, dataAllowance, monthlyPrice, term, simType } = params;
  const normalizedPrice = Number.isFinite(monthlyPrice) && monthlyPrice > 0 ? monthlyPrice : 0;
  const vatIncluded = normalizedPrice - normalizedPrice / 1.2;
  const termLabel =
    term === "24M" ? "24-month contract" : term === "12M" ? "12-month contract" : "30-day rolling";
  const commitmentMonths = term === "24M" ? 24 : term === "12M" ? 12 : 0;

  return {
    quote: {
      plan: { id: planId, name: planName, data_allowance: dataAllowance },
      term,
      term_label: termLabel,
      commitment_months: commitmentMonths,
      sim_type: simType,
      monthly_price: normalizedPrice.toFixed(2),
      promo: null,
      delivery_fee: "0.00",
      charge_today: normalizedPrice.toFixed(2),
      vat_included: vatIncluded.toFixed(2),
      vat_rate_percent: "20",
      recurring_amount: normalizedPrice.toFixed(2),
      currency: "GBP",
      first_renewal_date: formatNextRenewalDate(term),
    },
    quote_token: "",
    expires_in_seconds: 1800,
    contract: { contract_version: "1.0", contract_summary_version: "1.0" },
  };
}

/**
 * Public quote from POST /api/v1/switch/quote/ (no login needed, new-customer promos accepted).
 * Returns `consent_version`, which must be sent back on submit. If the endpoint is unreachable the
 * page still works from the plan tariff, but `consentVersion` is null in that case.
 */
export async function fetchDynamicSwitchQuote(params: {
  planId: number;
  planName: string;
  dataAllowance: string;
  monthlyPrice: number;
  term: Term;
  simType: SimType;
  promoCode?: string;
}): Promise<SwitchQuoteResult> {
  const { planId, planName, dataAllowance, monthlyPrice, term, simType, promoCode } = params;

  const fallback = () =>
    buildPlanTariffQuote({ planId, planName, dataAllowance, monthlyPrice, term, simType });

  try {
    const res = await fetch(`${SWITCH_API_BASE}/api/v1/switch/quote/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        plan_id: planId,
        term,
        sim_type: simType,
        ...(promoCode ? { promo_code: promoCode } : {}),
      }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.quote) {
      return {
        quote: data as QuoteResponse,
        source: "server_quote",
        promoMessage: null,
        consentVersion: typeof data.consent_version === "string" ? data.consent_version : null,
        consentStatement: typeof data.consent_statement === "string" ? data.consent_statement : null,
      };
    }

    // PROMO_NOT_FOUND / PROMO_INVALID / PLAN_NOT_AVAILABLE
    const message =
      (data && typeof data.message === "string" && data.message) ||
      (data && Array.isArray(data.promo_code) && String(data.promo_code[0])) ||
      null;

    if (promoCode && (data?.code === "PROMO_NOT_FOUND" || data?.code === "PROMO_INVALID" || data?.field === "promo_code")) {
      // Promo rejected: show the backend's message and re-quote without it.
      const plain = await fetchDynamicSwitchQuote({ ...params, promoCode: undefined });
      return { ...plain, promoMessage: message || "That promo code can’t be used for this plan." };
    }

    return {
      quote: fallback(),
      source: "plan_tariff",
      promoMessage: promoCode ? message || "Promo code is not available for this plan." : null,
      consentVersion: null,
      consentStatement: null,
    };
  } catch {
    return {
      quote: fallback(),
      source: "plan_tariff",
      promoMessage: promoCode ? "We couldn’t check that promo code right now." : null,
      consentVersion: null,
      consentStatement: null,
    };
  }
}

// ─── Submit (POST /api/switch-requests/) ─────────────────────────────────────
export interface SwitchRequestPayload {
  first_name: string;
  last_name: string;
  email: string;
  /** Optional contact number; send "" when blank. */
  mobile: string;
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  /** Postcode only. */
  postcode: string;
  current_provider: string;
  current_plan_cost: number | null;
  current_data_allowance: number | null;
  plan_id: number;
  contract_term: Term;
  sim_type: SimType;
  promo_code?: string;
  switch_route: "keep_pac" | "new_stac" | "new_keep";
  pac_code?: string;
  stac_code?: string;
  pac_later: boolean;
  /** The number being moved (step 2). */
  port_number: string;
  transfer_authorised: boolean;
  /** Not required any more (guide, 20 Nov): Step 4 is a request, contract acceptance happens in Part B. */
  timeline_acknowledged?: boolean;
  terms_accepted?: boolean;
  consent_version?: string;
  opt_in_news: boolean;
  opt_in_texts: boolean;
}

export interface SwitchSubmitResult {
  message: string;
  /** true = this was a retry; `status` is the original request. */
  duplicate: boolean;
  status: SwitchStatus;
}

export async function submitSwitchRequest(
  payload: SwitchRequestPayload,
  idempotencyKey: string
): Promise<SwitchSubmitResult> {
  const res = await fetch(`${SWITCH_API_BASE}/api/switch-requests/`, {
    method: "POST",
    headers: authHeaders({ "Idempotency-Key": idempotencyKey }),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    await failFromResponse(res, data, "Could not submit your switch request. Please check your details and try again.");
  }

  const status = data?.data as SwitchStatus | undefined;
  if (!status || typeof status.reference !== "string" || !status.reference) {
    throw new SwitchApiError(
      "Your request was sent but we did not receive a reference. Please contact support before submitting again.",
      res.status
    );
  }

  return {
    message:
      (typeof data?.message === "string" && data.message) ||
      `Thank you. We've received your request. Your reference is ${status.reference}. We'll let you know if we need anything else.`,
    duplicate: Boolean(data?.duplicate),
    status,
  };
}

/**
 * What the customer entered/selected at submit time. Kept on the client only (never the PAC/STAC)
 * so the page can still show plan details and build the document copies. Not an API object.
 */
export interface SwitchRequestRecord {
  reference: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  postcode: string;
  created_at: string;
  sim_type?: SimType;
  contract_term?: Term;
  switch_route?: "keep_pac" | "new_stac" | "new_keep";
  port_number?: string;
  pac_later?: boolean;
  plan_name?: string;
  plan_price?: number;
  plan_data?: string;
  plan_calls?: string;
  plan_eu_roaming?: string;
  promo_code?: string;
  selected_plan?: string;
}

// ─── Lookups ─────────────────────────────────────────────────────────────────
/** GET /api/switch-requests/by-reference/<reference>/?email=<email> */
export async function fetchSwitchStatus(reference: string, email?: string): Promise<SwitchStatus> {
  const qs = email ? `?email=${encodeURIComponent(email)}` : "";
  const res = await fetch(
    `${SWITCH_API_BASE}/api/switch-requests/by-reference/${encodeURIComponent(reference)}/${qs}`,
    { headers: authHeaders() }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) await failFromResponse(res, data, "We couldn’t check your request right now.");
  return data.data as SwitchStatus;
}

/** GET /api/switch-requests/mine/ (signed in only) */
export async function fetchMySwitchRequests(): Promise<SwitchStatus[]> {
  const res = await fetch(`${SWITCH_API_BASE}/api/switch-requests/mine/`, { headers: authHeaders() });
  const data = await res.json().catch(() => null);
  if (!res.ok) await failFromResponse(res, data, "We couldn’t load your switch requests.");
  return (data?.data ?? []) as SwitchStatus[];
}

// ─── Send the code later (POST /api/switch-requests/<reference>/port-code/) ──
export async function sendSwitchPortCode(
  reference: string,
  body: { code_type: "PAC" | "STAC"; code: string; msisdn?: string; email?: string }
): Promise<{ message: string; status: SwitchStatus }> {
  const res = await fetch(
    `${SWITCH_API_BASE}/api/switch-requests/${encodeURIComponent(reference)}/port-code/`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) await failFromResponse(res, data, "We couldn’t save your code right now.");
  return { message: data?.message || "Thank you. We've saved your code.", status: data.data as SwitchStatus };
}

// ─── Feedback (POST /api/switch-requests/<reference>/feedback/) ──────────────
export async function sendSwitchFeedback(
  reference: string,
  body: { rating: number; comments: string; email?: string }
): Promise<string> {
  const res = await fetch(
    `${SWITCH_API_BASE}/api/switch-requests/${encodeURIComponent(reference)}/feedback/`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) await failFromResponse(res, data, "Could not send feedback right now.");
  return (typeof data?.message === "string" && data.message) || "Thank you — your feedback has been recorded.";
}

// ─── Session (reference + email only; never PAC/STAC) ────────────────────────
export interface SwitchSessionSnapshot {
  reference: string;
  email: string;
  updatedAt: string;
}

export function persistSwitchSession(snapshot: SwitchSessionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SWITCH_REF_KEY, snapshot.reference);
    sessionStorage.setItem(SWITCH_SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSwitchSession(): SwitchSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SWITCH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SwitchSessionSnapshot;
  } catch {
    return null;
  }
}

export function clearSwitchSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SWITCH_REF_KEY);
    sessionStorage.removeItem(SWITCH_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ─── Milestone 4: completing the order (Frontend Guide §7) ───────────────────
// Everything below returns 404 NOT_AVAILABLE until the backend flag is on.

async function m4<T>(path: string, init: RequestInit = {}, fallback = "Something went wrong. Please try again."): Promise<T> {
  const res = await fetch(`${SWITCH_API_BASE}${path}`, { ...init, headers: authHeaders(init.headers as Record<string, string>) });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) await failFromResponse(res, data, fallback);
  return (data && typeof data === "object" && "data" in data ? data.data : data) as T;
}

export function hasSwitchSession(): boolean {
  return Boolean(getStoredAccessToken());
}

export interface ContinueCheck {
  reference: string;
  plan: { id: number; name: string } | null;
  email_masked: string;
  claimed: boolean;
  sign_in_required: boolean;
}

/** B1: POST /api/switch-requests/continue/check/ */
export const checkContinueLink = (token: string) =>
  m4<ContinueCheck>("/api/switch-requests/continue/check/", { method: "POST", body: JSON.stringify({ token }) });

/** B1: POST /api/switch-requests/continue/claim/ (signed in) */
export const claimContinueLink = (token: string) =>
  m4<SwitchStatus>("/api/switch-requests/continue/claim/", { method: "POST", body: JSON.stringify({ token }) });

/** B1: POST /api/switch-requests/continue/resend/ — always 200 with the same message. */
export async function resendContinueLink(reference: string, email: string): Promise<string> {
  const res = await fetch(`${SWITCH_API_BASE}/api/switch-requests/continue/resend/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reference, email }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) await failFromResponse(res, data, "We couldn’t send a new link right now.");
  return (
    (typeof data?.message === "string" && data.message) ||
    "If those details match a request that is ready, we've sent a new link."
  );
}

export interface ContractDocument {
  id: string;
  kind: string;
  title: string;
  filename: string;
  content_type: string;
  size: number;
  sha256: string;
  template_version: string;
  download_url: string;
}

export interface DocumentPack {
  id: string;
  contract_reference: string;
  quote: QuoteResponse["quote"];
  offer_valid_until: string;
  email_status: "sent" | "failed" | "pending" | string;
  consented?: boolean;
  documents: ContractDocument[];
}

export interface OrderReview {
  reference: string;
  plan: { id: number; name: string; data_allowance: string };
  contract_term: Term;
  sim_type: SimType;
  switch_route: string;
  port_number_masked: string | null;
  pac_status: string;
  billing_address: { address_line_1: string; address_line_2: string; town_city: string; postcode: string };
  quote: QuoteResponse["quote"];
  price_changed: boolean;
  submitted_price: QuoteResponse["quote"] | null;
  documents_available: boolean;
  documents: DocumentPack | null;
}

const refPath = (ref: string) => `/api/switch-requests/${encodeURIComponent(ref)}`;

/** B2: GET /<ref>/order/ */
export const fetchOrderReview = (ref: string) => m4<OrderReview>(`${refPath(ref)}/order/`);
/** B2: POST /<ref>/documents/ — freezes the price, returns the same pack while valid. */
export const createDocumentPack = (ref: string) => m4<DocumentPack>(`${refPath(ref)}/documents/`, { method: "POST" });
/** B2: GET /<ref>/documents/ — current pack or null. */
export const fetchDocumentPack = (ref: string) => m4<DocumentPack | null>(`${refPath(ref)}/documents/`);

/** B3: POST /<ref>/documents/consent/ — send back exactly the documents that were shown. */
export const consentToDocuments = (ref: string, pack: DocumentPack) =>
  m4<DocumentPack>(`${refPath(ref)}/documents/consent/`, {
    method: "POST",
    body: JSON.stringify({
      pack_id: pack.id,
      documents: pack.documents.map((d) => ({ id: d.id, sha256: d.sha256 })),
      accepted: true,
      immediate_service_requested: false,
    }),
  });

export interface SwitchCheckout {
  order_reference: string;
  client_secret: string | null;
  payment_required: boolean;
  amount: string;
  currency: string;
  confirm_url: string;
}

/** B3: POST /<ref>/checkout/ — same order/client_secret if a payment is already open. */
export const startSwitchCheckout = (ref: string) => m4<SwitchCheckout>(`${refPath(ref)}/checkout/`, { method: "POST" });

/** B3: POST confirm_url after Stripe succeeds (the webhook also confirms on its own). */
export const confirmSwitchPayment = (confirmUrl: string) =>
  m4<unknown>(confirmUrl, { method: "POST" }, "We couldn’t confirm your payment yet.");

export interface OrderDocumentRow {
  kind: "contract_summary" | "contract_information" | "payment_receipt" | string;
  title: string;
  description?: string;
  download_url: string;
  sha256?: string;
  filename?: string;
  receipt_number?: string;
  email_status?: "sent" | "not_sent" | string;
}

export interface OrderDocuments {
  reference: string;
  order_reference: string;
  payment: { state: string; message: string };
  documents: OrderDocumentRow[];
  contract_email_status: "sent" | "failed" | "pending" | string;
  email_masked: string;
}

/** B4: GET /<ref>/order-documents/ */
export const fetchOrderDocuments = (ref: string) => m4<OrderDocuments>(`${refPath(ref)}/order-documents/`);

/** PDFs need the auth token, so fetch → Blob → open/save (a plain <a href> would not send it). */
export async function fetchDocumentBlob(downloadUrl: string): Promise<Blob> {
  const url = downloadUrl.startsWith("http") ? downloadUrl : `${SWITCH_API_BASE}${downloadUrl}`;
  const token = getStoredAccessToken();
  const res = await fetch(url, { headers: token ? { Authorization: `Token ${token}` } : {} });
  if (!res.ok) throw new SwitchApiError("We couldn’t open that document. Please try again.", res.status);
  return res.blob();
}

export async function openDocument(downloadUrl: string): Promise<void> {
  const blob = await fetchDocumentBlob(downloadUrl);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadDocument(downloadUrl: string, filename: string): Promise<void> {
  const blob = await fetchDocumentBlob(downloadUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

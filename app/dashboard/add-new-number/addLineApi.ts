// app/dashboard/add-new-number/addLineApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${API_BASE}/api/v1/lines/${cleanPath}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(401, "UNAUTHENTICATED", "Please log in again.");
    }
    if (body.code) {
      throw new ApiError(res.status, body.code, body.message || "An error occurred.");
    }
    if (body.detail) {
      throw new ApiError(res.status, "ERROR", body.detail);
    }
    throw new ApiError(res.status, "VALIDATION", "Please check the highlighted fields.", body);
  }
  return body as T;
}

// ── Types from Section 14 ──

export type Term = "30D" | "12M" | "24M";
export type SimType = "esim" | "psim";
export type SwitchChoice = "pac" | "stac" | "none";
export type CodeType = "PAC" | "STAC";

export interface Eligibility {
  eligible: boolean;
  reasons: { code: "EMAIL_NOT_VERIFIED" | "LINE_LIMIT_REACHED"; message: string }[];
  requires_reauth: boolean;
  lines: { active: number; in_progress: number; limit: number; remaining: number };
}

export interface Quote {
  plan: { id: number; name: string; data_allowance: string };
  term: Term;
  term_label: string;
  commitment_months: number;
  sim_type: SimType;
  currency: "GBP";
  monthly_price: string;
  promo: { code: string; discount: string } | null;
  delivery_fee: string;
  charge_today: string;
  vat_included: string;
  vat_rate_percent: string;
  recurring_amount: string;
  first_renewal_date: string; // YYYY-MM-DD
}

export interface QuoteResponse {
  quote: Quote;
  quote_token: string;
  expires_in_seconds: number;
  contract: { contract_version: string; contract_summary_version: string };
}

export interface Billing {
  first_name: string;
  last_name: string;
  house_number?: string;
  street: string;
  city: string;
  zip_code: string;
  email?: string;
}

export interface DeliveryAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

export interface CheckoutRequest {
  quote_token: string;
  switch_choice: SwitchChoice;
  billing: Billing;
  delivery_address: DeliveryAddress | null;
  contract: {
    contract_version: string;
    contract_summary_version: string;
    documents_hash?: string;
    accepted: true;
    immediate_service_requested: boolean;
  };
}

export interface CheckoutResponse {
  order_reference: string;
  client_secret: string | null;
  payment_required: boolean;
  amount: string;
  currency: "GBP";
}

export type LineStatus = "pending_activation" | "active" | "suspended" | "terminated" | "cancelled";

export interface OrderLine {
  id: string;
  status: LineStatus;
  msisdn: string | null;
}

export interface AddLineOrder {
  order_reference: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  fulfilment_status: "not_started" | "sim_reserved" | "activating" | "activated" | "failed" | "cancelled";
  message: string;
  sim_type: SimType;
  switch_choice: SwitchChoice;
  term: Term;
  quote: Quote;
  total_gross: string;
  vat_amount: string;
  currency: "GBP";
  line: OrderLine | null;
  created_at: string;
  paid_at: string | null;
}

export type PortStatus =
  | "AWAITING_ACTIVATION"
  | "PENDING"
  | "ATTACH_REQUESTED"
  | "ATTACH_RECEIVED"
  | "ATTACH_FAILED"
  | "VALIDATED"
  | "INVALIDATED"
  | "LOCKED"
  | "DONE"
  | "CANCELING"
  | "CANCELED"
  | "ERROR";

export interface PortRequest {
  id: string;
  code_type: CodeType;
  msisdn: string;
  status: PortStatus;
  message: string;
  wished_date: string | null;
  port_date: string | null;
  can_resubmit: boolean;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Line {
  id: string;
  msisdn: string | null;
  status: LineStatus;
  source: "add_line" | "legacy_claim";
  plan: { id: number; name: string; data_allowance: string; price?: number } | null;
  term: Term | "";
  sim: { type: SimType; iccid_last4: string } | null;
  order_reference: string | null;
  port_request: PortRequest | null;
  activated_at: string | null;
  created_at: string;
}

export interface LinesResponse {
  lines: Line[];
  pending_orders: AddLineOrder[];
  capacity: { used: number; limit: number; remaining: number };
}

export interface LineClaim {
  id: number;
  status: "submitted" | "approved" | "rejected";
  message: string;
  line_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface PacCheckResponse {
  format_ok: boolean;
  msisdn: string;
  message: string;
}

// ── API Functions ──

export async function getEligibility(): Promise<Eligibility> {
  return api<Eligibility>("eligibility/");
}

export async function checkPac(payload: {
  code_type: CodeType;
  code: string;
  msisdn: string;
}): Promise<PacCheckResponse> {
  return api<PacCheckResponse>("pac/check/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getQuote(payload: {
  plan_id: number;
  term: Term;
  sim_type: SimType;
  promo_code?: string;
}): Promise<QuoteResponse> {
  return api<QuoteResponse>("quote/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function checkout(payload: CheckoutRequest): Promise<CheckoutResponse> {
  return api<CheckoutResponse>("checkout/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmOrder(orderReference: string): Promise<AddLineOrder> {
  return api<AddLineOrder>(`orders/${encodeURIComponent(orderReference)}/confirm/`, {
    method: "POST",
  });
}

export async function getOrder(orderReference: string): Promise<AddLineOrder> {
  return api<AddLineOrder>(`orders/${encodeURIComponent(orderReference)}/`);
}

export async function submitPort(
  lineId: string,
  payload: {
    code_type: CodeType;
    code: string;
    msisdn: string;
    wished_date?: string | null;
  }
): Promise<PortRequest> {
  return api<PortRequest>(`${encodeURIComponent(lineId)}/port/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPort(lineId: string): Promise<{ port_request: PortRequest | null }> {
  return api<{ port_request: PortRequest | null }>(`${encodeURIComponent(lineId)}/port/`);
}

export async function getLines(): Promise<LinesResponse> {
  return api<LinesResponse>("");
}

export async function submitClaim(payload: {
  iccid?: string;
  msisdn?: string;
  order_reference?: string;
}): Promise<LineClaim> {
  return api<LineClaim>("claims/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getClaims(): Promise<LineClaim[]> {
  return api<LineClaim[]>("claims/");
}

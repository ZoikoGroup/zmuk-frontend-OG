// Client for the Public Sector verification API.
// Guide: FRONTEND_GUIDE_Public-sector-and-student-verification.md (section 3)

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const BASE = `${API_BASE}/api/public-sector-workers`;

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface MyStatus {
  status: VerificationStatus;
  application: {
    id: number;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string;
  } | null;
}

export interface PublicSectorPlan {
  id: number;
  name: string;
  slug: string;
  transatelID?: string | null;
  short_description: string | null;
  price: string;
  sale_price?: string | null;
  price_24: string | null;
  price_12: string | null;
  price_30: string | null;
  final_price?: string;
  data_allowance: string | null;
  tier_label: string | null;
  duration_days?: number;
  is_popular: boolean;
  category: { id: number; name: string; slug: string } | null;
  features: { id: number; title: string }[];
}

export interface PlansResponse {
  status: VerificationStatus;
  can_purchase: boolean;
  plans: PublicSectorPlan[];
}

export interface Nominee {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  relationship: string;
  created_at: string;
}

export interface NomineesResponse {
  used: number;
  limit: number;
  remaining: number;
  can_add: boolean;
  nominees: Nominee[];
}

export class PsApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PsApiError";
  }
}

export function getToken(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
  } catch {
    return null;
  }
}

async function call<T>(path: string, init: RequestInit = {}, token = getToken()): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PsApiError(
      res.status,
      body.code || (res.status === 401 ? "UNAUTHENTICATED" : "ERROR"),
      body.message || body.detail || "Something went wrong. Please try again.",
      body.errors,
    );
  }
  // Responses are { success, data } (message sits beside data on writes).
  return (body.data ?? body) as T;
}

export const getMyStatus = () => call<MyStatus>("/me/");

/** Public. The token is sent only when the user is logged in; on 401 retry without it. */
export async function getPlans(): Promise<PlansResponse> {
  const token = getToken();
  try {
    return await call<PlansResponse>("/plans/", {}, token);
  } catch (e) {
    if (token && e instanceof PsApiError && e.status === 401) {
      return call<PlansResponse>("/plans/", {}, null);
    }
    throw e;
  }
}

export const getNominees = () => call<NomineesResponse>("/me/nominees/");

export const addNominee = (payload: {
  full_name: string;
  email: string;
  phone: string;
  relationship: string;
}) => call<NomineesResponse>("/me/nominees/", { method: "POST", body: JSON.stringify(payload) });

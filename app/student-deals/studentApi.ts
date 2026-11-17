// Client for the Student verification API.
// Guide: FRONTEND_GUIDE_Public-sector-and-student-verification.md (section 4)

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const BASE = `${API_BASE}/api/student-discount`;

export type StudentStatus = "none" | "pending" | "approved" | "rejected" | "expired";

export interface StudentMyStatus {
  status: StudentStatus;
  application: {
    id: number;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string;
    valid_until: string | null;
  } | null;
}

export interface StudentPlan {
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

export interface StudentPlansResponse {
  status: StudentStatus;
  can_purchase: boolean;
  plans: StudentPlan[];
}

export class StudentApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudentApiError";
  }
}

export function getToken(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
  } catch {
    return null;
  }
}

async function call<T>(path: string, token = getToken()): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new StudentApiError(
      res.status,
      body.code || (res.status === 401 ? "UNAUTHENTICATED" : "ERROR"),
      body.message || body.detail || "Something went wrong. Please try again.",
    );
  }
  return (body.data ?? body) as T;
}

export const getStudentStatus = () => call<StudentMyStatus>("/me/");

/** Public. The token is sent only when logged in; on 401 retry without it. */
export async function getStudentPlans(): Promise<StudentPlansResponse> {
  const token = getToken();
  try {
    return await call<StudentPlansResponse>("/plans/", token);
  } catch (e) {
    if (token && e instanceof StudentApiError && e.status === 401) {
      return call<StudentPlansResponse>("/plans/", null);
    }
    throw e;
  }
}

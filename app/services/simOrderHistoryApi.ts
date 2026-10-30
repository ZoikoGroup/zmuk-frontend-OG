/**
 * SIM Order History Service
 * Implements "SIM Order History – Frontend Guide"
 * Endpoint: GET /api/v1/sims/my-orders/
 */

export interface SimOrderItem {
  name: string;
  sim_type: "esim" | "psim" | string;
  quantity: number;
  data_allowance?: string;
  duration?: number;
}

export interface SimEvent {
  type: "ordered" | "activated" | "qr_ready" | "qr_sent" | "last_update" | string;
  label: string;
  at: string; // UTC ISO string
}

export interface SimEsimDetails {
  ready: boolean;
  qr_image_url?: string;
  lpa?: string;
  smdp_address?: string;
  activation_code?: string;
  status?: string;
}

export interface SimDetail {
  iccid: string;
  msisdn: string;
  sim_type: "esim" | "psim" | string;
  network_status: string;
  activated_at?: string | null;
  first_activation_date?: string | null;
  last_action_date?: string | null;
  esim?: SimEsimDetails | null;
  events?: SimEvent[];
}

export interface SimOrder {
  order_reference: string;
  status: "received" | "completed" | "partial" | "failed" | string;
  status_label: string;
  placed_at: string | null;
  items: SimOrderItem[];
  sims: SimDetail[];
}

export interface SimOrdersResponse {
  success: boolean;
  count: number;
  orders: SimOrder[];
}

/**
 * Format timestamps in UK London time as per guide:
 * new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" })
 */
export function formatUkDateTime(at: string | null | undefined): string {
  if (!at) return "—";
  try {
    const d = new Date(at);
    if (isNaN(d.getTime())) return at;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return at;
  }
}

/**
 * Mask ICCID to show only the last 4 digits (e.g. •••• •••• •••• 6294)
 */
export function maskIccid4(iccid?: string | number): string {
  if (!iccid) return "•••• •••• •••• —";
  const clean = String(iccid).replace(/\D/g, "");
  if (clean.length >= 4) {
    return `•••• •••• •••• ${clean.slice(-4)}`;
  }
  return `•••• •••• •••• ${clean}`;
}

/**
 * Clean phone numbers to digits for robust comparison between international and UK local formats
 */
export function normalizeMsisdn(raw?: string | number): string {
  if (!raw) return "";
  let s = String(raw).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  return s;
}

/**
 * Find matching SIM events for a specific line by MSISDN or ICCID
 */
export function findSimForLine(
  orders: SimOrder[],
  lineMsisdn?: string,
  lineIccid?: string
): SimDetail | null {
  const targetNum = normalizeMsisdn(lineMsisdn);
  const targetIccidDigits = String(lineIccid || "").replace(/\D/g, "");

  for (const ord of orders) {
    if (!Array.isArray(ord.sims)) continue;
    for (const sim of ord.sims) {
      if (targetNum && normalizeMsisdn(sim.msisdn) === targetNum) {
        return sim;
      }
      if (
        targetIccidDigits &&
        sim.iccid &&
        (sim.iccid.endsWith(targetIccidDigits) ||
          targetIccidDigits.endsWith(sim.iccid.slice(-4)))
      ) {
        return sim;
      }
    }
  }
  return null;
}

/**
 * Fetch customer SIM orders from backend
 * Endpoint: GET /api/v1/sims/my-orders/
 * Authorization: Token <zoiko_token>
 * 
 * Rules:
 * - Uses token decide user (never sends email)
 * - If 401: Clears session and redirects to /login
 * - Does not log response (contains eSIM activation credentials)
 */
export async function getMySimOrders(): Promise<SimOrder[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
  if (!token) {
    throw new Error("NOT_LOGGED_IN");
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const res = await fetch(`${API_BASE}/api/v1/sims/my-orders/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zoiko_token");
      localStorage.removeItem("zoiko_user");
      window.location.href = "/login";
    }
    throw new Error("NOT_LOGGED_IN");
  }

  if (!res.ok) {
    throw new Error("FAILED");
  }

  const data: SimOrdersResponse = await res.json();
  return Array.isArray(data.orders) ? data.orders : [];
}

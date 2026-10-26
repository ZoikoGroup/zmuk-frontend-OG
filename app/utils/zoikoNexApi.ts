/**
 * ZoikoNex Telecom & Billing Integration Service
 * 
 * Provides dynamic hooks and interfaces for ZoikoNex CDR (Call Detail Record)
 * usage and the ZoikoNex Billing Engine.
 * 
 * Once ZoikoNex is integrated, configure NEXT_PUBLIC_ZOIKONEX_API_URL
 * or update ZOIKONEX_CONFIG.API_BASE below.
 */

export const ZOIKONEX_CONFIG = {
  API_BASE: process.env.NEXT_PUBLIC_ZOIKONEX_API_URL || "",
  IS_CONNECTED: Boolean(process.env.NEXT_PUBLIC_ZOIKONEX_API_URL),
};

export interface ZoikoNexDailyUsageItem {
  date: string;
  dayNumber: number;
  ukDataGb: number;
  roamingDataGb: number;
  callsMins: number;
  textsCount: number;
  status: "completed" | "today" | "future";
}

export interface ZoikoNexCycleUsage {
  cycleId: string;
  cycleName: string;
  ukDataGb: number;
  roamingDataGb: number;
  callsMinutes: number;
  textsCount: number;
  days?: ZoikoNexDailyUsageItem[];
}

export interface ZoikoNexBillItem {
  id: string;
  reference: string;
  billDate?: string;
  issuedDate?: string;
  dueDate?: string;
  dueShort?: string;
  dueWeekday?: string;
  period?: string;
  periodLabel?: string;
  monthShort?: string;
  amount: number;
  status: "Settled" | "Paid" | "Pending" | "Upcoming" | "Issued" | "Estimate";
  pdfUrl?: string;
  isUpcoming?: boolean;
}

/**
 * Fetch daily usage breakdown from ZoikoNex CDR API
 */
export async function fetchZoikoNexDailyUsage(
  lineMsisdn: string,
  cycleStartDate?: string,
  token?: string
): Promise<ZoikoNexDailyUsageItem[] | null> {
  if (!ZOIKONEX_CONFIG.API_BASE) {
    // ZoikoNex API not yet connected — returns null so UI renders dynamic "Coming Soon" state
    return null;
  }
  try {
    const res = await fetch(
      `${ZOIKONEX_CONFIG.API_BASE}/api/v1/usage/daily/?msisdn=${encodeURIComponent(lineMsisdn)}${
        cycleStartDate ? `&cycle_start=${encodeURIComponent(cycleStartDate)}` : ""
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : data?.results || data?.days || null;
  } catch (err) {
    console.warn("ZoikoNex daily usage fetch error:", err);
    return null;
  }
}

/**
 * Fetch monthly historical usage cycles from ZoikoNex CDR API
 */
export async function fetchZoikoNexMonthlyUsage(
  lineMsisdn: string,
  token?: string
): Promise<ZoikoNexCycleUsage[] | null> {
  if (!ZOIKONEX_CONFIG.API_BASE) {
    // ZoikoNex API not yet connected — returns null so UI renders dynamic "Coming Soon" state
    return null;
  }
  try {
    const res = await fetch(
      `${ZOIKONEX_CONFIG.API_BASE}/api/v1/usage/cycles/?msisdn=${encodeURIComponent(lineMsisdn)}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : data?.results || data?.cycles || null;
  } catch (err) {
    console.warn("ZoikoNex monthly usage fetch error:", err);
    return null;
  }
}

/**
 * Fetch itemised telecom bills & PDF statements from ZoikoNex Billing Engine
 */
export async function fetchZoikoNexBills(
  subscriberIdOrEmail?: string | number,
  token?: string
): Promise<ZoikoNexBillItem[] | null> {
  if (!ZOIKONEX_CONFIG.API_BASE || !subscriberIdOrEmail) {
    // ZoikoNex API not yet connected — returns null so UI renders dynamic "Coming Soon" state
    return null;
  }
  try {
    const res = await fetch(
      `${ZOIKONEX_CONFIG.API_BASE}/api/v1/bills/?account=${encodeURIComponent(String(subscriberIdOrEmail))}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : data?.results || data?.bills || null;
  } catch (err) {
    console.warn("ZoikoNex bills fetch error:", err);
    return null;
  }
}

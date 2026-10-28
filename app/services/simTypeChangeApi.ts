/**
 * SIM Type Change API Service
 * Implements Closing Task 05 (ZMUK-CT-005): Physical SIM <-> eSIM Migration
 * 
 * NOTE: Live Django API endpoint calls are documented in comments.
 * Once backend routes are deployed, uncomment the fetch blocks.
 */

export interface SimTypeOption {
  lineId: string;
  msisdn: string;
  planName: string;
  currentSimType: "physical" | "esim";
  eligibleTargetType: "physical" | "esim";
  status: "Active" | "Suspended" | "Pending";
  hasPendingCase: boolean;
  registeredName: string;
  registeredEmail: string;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
}

export interface TypeChangeQuote {
  targetType: "physical" | "esim";
  feeGbp: number;
  vatPct: number;
  deliveryMethod: string;
  estimatedTime: string;
  serviceInterruptionNotice: string;
  keepNumberPlanReassurance: string;
}

export interface TypeChangePayload {
  lineId: string;
  targetType: "physical" | "esim";
  deviceConfirmedUnlocked?: boolean;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  deliveryOptionId?: string;
  verificationMethod: "email_otp";
  verificationCode: string;
  idempotencyKey: string;
}

export type TypeChangeLifecycle =
  | "ORDERED"
  | "READY"
  | "ACTIVATING"
  | "ACTIVE"
  | "FAILED";

export interface TypeChangeCaseStatus {
  caseId: string;
  lineId: string;
  msisdn: string;
  targetType: "physical" | "esim";
  status: TypeChangeLifecycle;
  createdAt: string;
  esimActivationCode?: string;
  esimMatchingId?: string;
  esimSmdpAddress?: string;
  carrier?: string;
  dispatchTrackingNumber?: string;
  customerMessage: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * 1. Fetch current line SIM type options & eligibility
 * Backend Route: GET /api/v1/me/lines/{line_id}/sim-type-options
 */
export async function fetchSimTypeOptions(
  lineId: string,
  msisdnFallback?: string
): Promise<SimTypeOption> {
  const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;

  /*
  // --- LIVE BACKEND FETCH BLOCK (Uncomment once deployed) ---
  if (token && API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me/lines/${lineId}/sim-type-options`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("fetchSimTypeOptions failed, using fallback", err);
    }
  }
  */

  let userEmail = "customer@zoikomobile.co.uk";
  let userName = "Zoiko Customer";
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("zoiko_user") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email) userEmail = parsed.email;
      if (parsed.first_name || parsed.username) {
        userName = `${parsed.first_name || parsed.username} ${parsed.last_name || ""}`.trim();
      }
    }
  } catch {}

  const isCurrentEsim = msisdnFallback?.includes("eSIM") || false;
  const num = msisdnFallback || "07888 849 201";

  return {
    lineId: lineId || "primary_07888849201",
    msisdn: num,
    planName: "Zoiko 20GB Unlimited Monthly",
    currentSimType: isCurrentEsim ? "esim" : "physical",
    eligibleTargetType: isCurrentEsim ? "physical" : "esim",
    status: "Active",
    hasPendingCase: false,
    registeredName: userName,
    registeredEmail: userEmail,
    deliveryAddress: {
      line1: "14 Commercial Road",
      line2: "Flat 4B",
      city: "London",
      postcode: "E1 6LP",
    },
  };
}

/**
 * 2. Get Type Change Quote
 * Backend Route: POST /api/v1/me/lines/{line_id}/sim-type-changes/quote
 */
export async function fetchTypeChangeQuote(
  lineId: string,
  targetType: "physical" | "esim"
): Promise<TypeChangeQuote> {
  const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;

  /*
  // --- LIVE BACKEND FETCH BLOCK (Uncomment once deployed) ---
  if (token && API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me/lines/${lineId}/sim-type-changes/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_type: targetType }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("fetchTypeChangeQuote failed, using fallback", err);
    }
  }
  */

  if (targetType === "esim") {
    return {
      targetType: "esim",
      feeGbp: 0.0,
      vatPct: 20.0,
      deliveryMethod: "Instant Secure In-App QR & Email",
      estimatedTime: "Ready immediately upon confirmation",
      serviceInterruptionNotice:
        "You may lose mobile service briefly while the switch completes. Keep access to Wi-Fi and another way to contact us.",
      keepNumberPlanReassurance:
        "Your mobile number (MSISDN), monthly plan, and remaining allowances remain unchanged.",
    };
  }

  return {
    targetType: "physical",
    feeGbp: 0.0,
    vatPct: 20.0,
    deliveryMethod: "Royal Mail 1st Class Delivery",
    estimatedTime: "1–2 working days",
    serviceInterruptionNotice:
      "Your current eSIM remains active until your new physical SIM is received and activated.",
    keepNumberPlanReassurance:
      "Your mobile number (MSISDN), contract, and UK/EU allowances carry over seamlessly.",
  };
}

/**
 * 3. Submit SIM Type Change Order
 * Backend Route: POST /api/v1/me/lines/{line_id}/sim-type-changes
 */
export async function submitTypeChangeOrder(
  lineId: string,
  payload: TypeChangePayload
): Promise<TypeChangeCaseStatus> {
  const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;

  /*
  // --- LIVE BACKEND FETCH BLOCK (Uncomment once deployed) ---
  if (token && API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me/lines/${lineId}/sim-type-changes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": payload.idempotencyKey || `ZM-TYPE-${Date.now()}`,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("submitTypeChangeOrder failed, using local simulation", err);
    }
  }
  */

  // Support audit ticket
  if (token && API_BASE_URL) {
    fetch(`${API_BASE_URL}/api/support/tickets/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        category: "sim_type_change",
        subject: `SIM Type Change (${payload.targetType.toUpperCase()}) for line ${lineId}`,
        message: `Customer initiated SIM type change to ${payload.targetType}.\nIdempotency Key: ${payload.idempotencyKey}`,
      }),
    }).catch(() => {});
  }

  const caseId = `ZM-TYPE-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  let caseStatus: TypeChangeCaseStatus;

  if (payload.targetType === "esim") {
    caseStatus = {
      caseId,
      lineId,
      msisdn: "07888 849 201",
      targetType: "esim",
      status: "READY",
      createdAt: now,
      esimActivationCode: `LPA:1$smdp.transatel.com$ZMUK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      esimMatchingId: `ZMUK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      esimSmdpAddress: "smdp.transatel.com",
      customerMessage:
        "Your new eSIM profile is provisioned and ready to install. Scan the QR code or use the manual LPA code below.",
    };
  } else {
    caseStatus = {
      caseId,
      lineId,
      msisdn: "07888 849 201",
      targetType: "physical",
      status: "ORDERED",
      createdAt: now,
      carrier: "Royal Mail",
      dispatchTrackingNumber: `GB${Math.floor(100000000 + Math.random() * 900000000)}RM`,
      customerMessage:
        "Your replacement physical SIM card is ordered and will dispatch via Royal Mail 1st Class.",
    };
  }

  try {
    localStorage.setItem(`zoiko_type_case_${caseId}`, JSON.stringify(caseStatus));
    localStorage.setItem("zoiko_last_type_case", caseId);
  } catch {}

  return caseStatus;
}

/**
 * 4. Fetch Type Change Case Status
 * Backend Route: GET /api/v1/me/sim-type-changes/{case_id}
 */
export async function fetchTypeChangeCaseStatus(
  caseId: string
): Promise<TypeChangeCaseStatus | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;

  /*
  // --- LIVE BACKEND FETCH BLOCK (Uncomment once deployed) ---
  if (token && API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me/sim-type-changes/${caseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("fetchTypeChangeCaseStatus failed, reading cache", err);
    }
  }
  */

  try {
    const cached = localStorage.getItem(`zoiko_type_case_${caseId}`);
    if (cached) return JSON.parse(cached);
  } catch {}

  return null;
}

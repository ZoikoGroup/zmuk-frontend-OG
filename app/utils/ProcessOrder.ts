// utils/ProcessOrder.ts
//
// Runs the checkout's SIM activation flow from the browser, in three steps:
//
//   1. Ask the backend how many SIMs the order needs and get the matching
//      ICCIDs   (POST /api/transatel/sim/availability).  ← inventory pre-check
//   2. Normalise the billing address into a Transatel "subscriber" contact
//      block (title / name / address / zip / city / email).
//   3. Place the order (POST /api/transatel/sim-orders → Django), which per
//      line item: reserves a SIM, assigns it to the order, checks the
//      subscriber status by serial (MSISDN), activates it attaching the plan
//      by its `transatelID`, and pushes the contact info to /contact-info.
//
// All Transatel credentials stay server-side (Django + the Next route proxies).
// Returns a fetch-like result ({ ok, status, data }) so the caller can read
// the outcome without calling .json() (the body is already parsed).

export interface AddressLike {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  region?: string;
  state?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  phone?: string;
  email?: string;
}

export interface ProcessOrderInput {
  billingAddress: AddressLike;
  shippingAddress: AddressLike;
  coupon: { type: string; discount: string | number } | null;
  cart?: unknown;
  items?: unknown;
  totals: { subtotal: number; discount: number; total: number };
  agreedToTerms: boolean;
  paymentMethod: string;
  createdAt: string;
  email?: string;
  user_id?: string | number | null;
  order_reference?: string;
  country_code?: string;
  [key: string]: unknown;
}

interface AvailabilitySim {
  iccid: string;
  msisdn?: string;
  serial_number?: string;
  type_of_sim?: string;
  sim_type?: "esim" | "psim";
  provisioning_status?: string;
}

interface AvailabilityResponse {
  success?: boolean;
  sufficient?: boolean;
  message?: string;
  requested?: Record<string, number>;
  returned?: Record<string, number>;
  shortfall?: Record<string, number>;
  sims?: { esim?: AvailabilitySim[]; psim?: AvailabilitySim[] };
  [key: string]: unknown;
}

/** One activated line the backend hands back. */
export interface AssignedSim {
  iccid: string;
  msisdn: string;
  sim_type: "esim" | "psim";
  transatelID: string;
  transaction_id?: string;
  prior_status?: string;
  already_active?: boolean;
  contact_updated?: boolean;
}

interface SimOrderResponse {
  success?: boolean;
  message?: string;
  order_reference?: string;
  assigned?: AssignedSim[];
  errors?: string[];
  [key: string]: unknown;
}

export interface ProcessOrderResult {
  ok: boolean;
  status: number;
  data: {
    success: boolean;
    message?: string;
    availability?: AvailabilityResponse;
    order?: SimOrderResponse;
    order_reference?: string;
    assigned?: AssignedSim[];
    errors?: string[];
    [key: string]: unknown;
  };
}

/** Normalised /contact-info block sent to Transatel via Django. */
interface SubscriberInfo {
  title: string;
  first_name: string;
  last_name: string;
  address: string;
  zip_code: string;
  city: string;
  country: string; // ISO alpha-3
  email: string;
}

/** Map a checkout address into the Transatel contact-info shape. */
function buildSubscriberInfo(
  address: AddressLike | undefined,
  fallbackEmail: string,
): SubscriberInfo {
  const a = address ?? {};
  const street = String(a.street ?? "").trim();
  const house = String(a.houseNumber ?? "").trim();
  return {
    title: "Mr",
    first_name: String(a.firstName ?? "").trim(),
    last_name: String(a.lastName ?? "").trim(),
    address: [house, street].filter(Boolean).join(" "),
    zip_code: String(a.zip ?? "").trim(),
    city: String(a.city ?? "").trim(),
    country: "GBR",
    email: String(a.email ?? fallbackEmail ?? "").trim(),
  };
}

export async function processOrder(
  orderData: ProcessOrderInput,
  headers?: Record<string, string>,
): Promise<ProcessOrderResult> {
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers ?? {}),
  };

  const items = orderData.items ?? orderData.cart ?? [];

  // ── Step 1: inventory pre-check ─────────────────────────────────────────
  let availRes: Response;
  let availability: AvailabilityResponse;
  try {
    availRes = await fetch("/api/transatel/sim/availability", {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({ items }),
    });
    availability = (await availRes.json().catch(() => ({}))) as AvailabilityResponse;
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: err instanceof Error ? err.message : "Could not reach the SIM service.",
      },
    };
  }

  // Bail out if there isn't enough stock (Django sends success/sufficient=false).
  if (!availRes.ok || availability.success === false) {
    return {
      ok: false,
      status: availRes.status,
      data: {
        success: false,
        message: availability.message || "Not enough SIMs available for this order.",
        availability,
      },
    };
  }

  // ── Step 2: build the subscriber contact block from the billing address ──
  const email = orderData.email || orderData.billingAddress?.email || "";
  const subscriber = buildSubscriberInfo(orderData.billingAddress, email);

  // ── Step 3: place the order — reserve → check subscriber → activate ─────
  const orderBody = {
    email,
    user_id: orderData.user_id ?? null,
    order_reference: orderData.order_reference,
    country_code: orderData.country_code || "UK",
    items,
    subscriber,
  };

  let orderRes: Response;
  let order: SimOrderResponse;
  try {
    orderRes = await fetch("/api/transatel/sim-orders", {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(orderBody),
    });
    order = (await orderRes.json().catch(() => ({}))) as SimOrderResponse;
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: err instanceof Error ? err.message : "Could not place the SIM order.",
        availability,
      },
    };
  }

  const success = orderRes.ok && order.success === true;
  return {
    ok: success,
    status: orderRes.status,
    data: {
      success,
      message: order.message,
      availability,
      order,
      order_reference: order.order_reference,
      assigned: order.assigned,
      errors: order.errors,
    },
  };
}
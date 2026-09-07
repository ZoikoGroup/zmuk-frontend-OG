/**
 * Recharge API client — calls the Django backend.
 *
 * Uses your existing NEXT_PUBLIC_API_URL from .env.local
 * Falls back to http://localhost:8000 for local dev
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class RechargeAPIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "RechargeAPIError";
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, body = null) {
  const url = `${API_BASE}/api/recharge${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.detail ||
      data?.message ||
      data?.phone_number?.[0] ||
      `Request failed (${res.status})`;
    throw new RechargeAPIError(msg, res.status, data);
  }
  return data;
}

// ── Step 1: Validate phone number ────────────────────────────────────────

export async function validatePhone(phoneNumber) {
  return request("POST", "/validate-phone/", { phone_number: phoneNumber });
}

// ── Step 2: Get recharge plans ───────────────────────────────────────────

export async function getProducts(module = "recharge") {
  return request("GET", `/products/?module=${module}`);
}

// ── Step 3: Create order + get Stripe checkout URL ───────────────────────

export async function createRechargeOrder({
  msisdn,
  productId,
  simSerial,
  simIccid,
  customerName,
  customerEmail,
  module = "recharge",
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return request("POST", "/create/", {
    msisdn,
    product_id: productId,
    sim_serial: simSerial || "",
    sim_iccid: simIccid || "",
    customer_name: customerName || "",
    customer_email: customerEmail || "",
    module,
    success_url: `${origin}/recharge/success`,
    cancel_url: `${origin}/recharge`,
  });
}

// ── Step 5: Get order status ─────────────────────────────────────────────

export async function getOrderStatus(orderRef) {
  return request("GET", `/orders/${orderRef}/`);
}

export { RechargeAPIError };

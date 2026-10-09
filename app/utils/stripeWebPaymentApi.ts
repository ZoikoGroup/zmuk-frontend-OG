// app/utils/stripeWebPaymentApi.ts
//
// A single checkout cart can mix product families (broadband + EE mobile +
// landline). This splits the cart and produces ONE order per family/item:
//
//   • broadband items  → placed with BT via /api/BritishTelecom/process-order,
//                         then saved as a "broadband" order.
//   • ee_mobile items  → NOT placed with BT. Saved as "ee_mobile" orders;
//                         Django emails orders@zoikotelecom.com.
//   • landline items   → NOT placed with BT. Saved as "landline" orders;
//                         Django emails orders@zoikotelecom.com.
//
// Returns { status, orders } where `orders` is an array of payloads. The
// checkout POSTs each one to /api/v1/bqorders/ (each becomes its own row in
// the matching admin section).

// import type { Plan, FormattedAddress } from "@/app/context/CartContext";

type Plan = any;

type FormattedAddress = {
  id?: string;
  [key: string]: any;
};

type CartRow = Plan & {
  planType?: string;
  dataAllowance?: string;
  simType?: string;
  finalPrice?: number | string;
  salePrice?: number | string;
  pricePerUnit?: number | string;
  qty?: number;
  quantity?: number;
  [key: string]: unknown;
};

type OrderType = "broadband" | "ee_mobile" | "landline" | "business_landline" | "accessories" | "phone_equipment";

function readCart(): CartRow[] {
  try {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("cart");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as CartRow[]) : [];
  } catch {
    return [];
  }
}

/** Classify a single cart row by its planType (with a BT fallback). */
function orderTypeOf(item: CartRow): OrderType {
  const t = String(item.planType ?? "").toLowerCase();
  if (t === "ee_mobile" || t === "ee_mobile_manual") return "ee_mobile";
  if (t === "landline" || t === "landline_manual") return "landline";
  if (t === "business_landline" || t === "business-landline") return "business_landline";
  if (t === "accessories" || t === "accessory") return "accessories";
  if (t === "phone_equipment" || t === "phone-equipment") return "phone_equipment";
  if (t === "broadband") return "broadband";
  const cat = String(item.category ?? "").toLowerCase();
  if (cat === "business-landline" || cat === "business_landline") return "business_landline";
  if (cat === "accessories") return "accessories";
  if (cat === "phone-equipment" || cat === "phone_equipment") return "phone_equipment";
  if (item.productOfferingQualificationItem) return "broadband";
  return "broadband";
}

function priceOf(item: CartRow): number {
  return Number(
    item.finalPrice ?? item.salePrice ?? item.price ?? item.pricePerUnit ?? 0,
  ) || 0;
}

function qtyOf(item: CartRow): number {
  return Number(item.qty ?? item.quantity ?? 1) || 1;
}

function sumTotals(items: CartRow[]) {
  const subtotal = items.reduce((s, it) => s + priceOf(it) * qtyOf(it), 0);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: 0,
    total: Number(subtotal.toFixed(2)),
  };
}

/** WC-{timestamp}-{nnnnn} external id Django expects. Unique per order. */
let _seq = 0;
function generateExternalId(): string {
  _seq += 1;
  const n = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `WC-${Date.now()}-${_seq}-${n}`;
}

/** Build a non-BT order payload (EE mobile / landline) for one cart item. */
function buildSimpleOrder(
  orderType: OrderType,
  item: CartRow,
  orderData: ProcessOrderInput,
) {
  return {
    orderType,
    externalId: generateExternalId(),
    billingAddress: orderData.billingAddress,
    shippingAddress: orderData.shippingAddress,
    cart: [item],
    totals: sumTotals([item]),
    coupon: null,
    paymentMethod: orderData.paymentMethod,
    createdAt: orderData.createdAt,
    agreedToTerms: orderData.agreedToTerms,
  };
}

export interface ProcessOrderInput {
  billingAddress: object;
  shippingAddress: object;
  coupon: { type: string; discount: string | number } | null;
  cart?: unknown;
  totals: { subtotal: number; discount: number; total: number };
  agreedToTerms: boolean;
  paymentMethod: string;
  createdAt: string;
  [key: string]: unknown;
}

export async function processOrderStripe(orderData: ProcessOrderInput) {
  try {
    const rawCart = readCart();
    if (!rawCart.length) {
      return { status: false, message: "Your cart is empty." };
    }

    const broadbandItems = rawCart.filter((i) => orderTypeOf(i) === "broadband");
    const eeItems        = rawCart.filter((i) => orderTypeOf(i) === "ee_mobile");
    const landlineItems  = rawCart.filter((i) => orderTypeOf(i) === "landline");
    const bizLandlineItems = rawCart.filter((i) => orderTypeOf(i) === "business_landline");
    const accessoryItems = rawCart.filter((i) => orderTypeOf(i) === "accessories");
    const phoneEquipItems = rawCart.filter((i) => orderTypeOf(i) === "phone_equipment");

    const orders: Record<string, unknown>[] = [];

    // ── 1) Broadband → BT (one order for all broadband items) ───────────────
    if (broadbandItems.length) {
      const serviceAddress =
        (broadbandItems[0].address as FormattedAddress | undefined) ?? null;

      if (!serviceAddress?.id) {
        return {
          status: false,
          message:
            "No service address found for the broadband plan. Please re-select your address.",
        };
      }
      if (!broadbandItems[0].productOfferingQualificationItem) {
        return {
          status: false,
          message:
            "Broadband item is missing BT product details. Please re-select your broadband plan.",
        };
      }

      const response = await fetch("/api/BritishTelecom/process-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderData,
          cart: broadbandItems, // only broadband goes to BT
          serviceAddress,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        return {
          status: false,
          message: result?.message ?? "BT order processing failed.",
        };
      }

      orders.push({
        orderType: "broadband",
        btOrderId: result.btOrderId,
        externalId: result.externalId,
        appointmentId: result.appointmentId,
        appointmentStart: result.appointmentStart,
        appointmentEnd: result.appointmentEnd,
        btStatus: result.status,
        btData: result.data,
        billingAddress: orderData.billingAddress,
        shippingAddress: orderData.shippingAddress,
        cart: broadbandItems,
        totals: sumTotals(broadbandItems),
        coupon: orderData.coupon ?? null,
        paymentMethod: orderData.paymentMethod,
        createdAt: orderData.createdAt,
        agreedToTerms: orderData.agreedToTerms,
        serviceAddress,
      });
    }

    // ── 2) EE mobile + landline + accessories → save only (no BT) ───────────
    for (const item of eeItems) orders.push(buildSimpleOrder("ee_mobile", item, orderData));
    for (const item of landlineItems) orders.push(buildSimpleOrder("landline", item, orderData));
    for (const item of bizLandlineItems) orders.push(buildSimpleOrder("business_landline", item, orderData));
    for (const item of accessoryItems) orders.push(buildSimpleOrder("accessories", item, orderData));
    for (const item of phoneEquipItems) orders.push(buildSimpleOrder("phone_equipment", item, orderData));

    if (!orders.length) {
      return { status: false, message: "No valid items to order." };
    }

    return { status: true, orders };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { status: false, message };
  }
}
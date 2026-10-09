import Stripe from "stripe";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Initialized inside the handler — not at module level — so Next.js build
  // doesn't try to evaluate it without the env var present.
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("❌ STRIPE_SECRET_KEY is not set");
    return NextResponse.json(
      { error: "Payment is not configured on this server." },
      { status: 503 }
    );
  }
  const stripe = new Stripe(stripeKey);

  try {
    const body = await req.json();

    const {
      cart = [],
      billingAddress = {},
      shippingAddress = {},
      subtotal = 0,
      shippingFee = 0,
      discountAmount = 0,
      total,
    } = body;

    /* ------------------------------
       VALIDATION
    ------------------------------ */
    const amount = Number(total);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    /* ------------------------------
       BUILD METADATA (traceable)
    ------------------------------ */
    const email = billingAddress?.email || "";
    const customerName = [billingAddress?.firstName, billingAddress?.lastName]
      .filter(Boolean)
      .join(" ");

    // Summarise cart items for metadata (Stripe limits values to 500 chars)
    const cartSummary = cart
      .map((item: any) => item.name || item.title || item.id)
      .join(", ")
      .slice(0, 490);

    /* ------------------------------
       CREATE PAYMENT INTENT
    ------------------------------ */
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "gbp",

      automatic_payment_methods: {
        enabled: true,
      },

      ...(email ? { receipt_email: email } : {}),

      metadata: {
        source: "zoiko_checkout",
        items: cart.length.toString(),
        cart_summary: cartSummary,
        customer_email: email,
        customer_name: customerName,
        subtotal: String(subtotal),
        shipping: String(shippingFee),
        discount: String(discountAmount),
        total: String(total),
      },
    });

    /* ------------------------------
       RESPONSE (SAFE)
    ------------------------------ */
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error("❌ Stripe PI Error:", err);

    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}
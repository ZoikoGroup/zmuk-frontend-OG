import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/transatel/sim-orders
 *
 * Places the SIM order with Django, which runs the full activation flow:
 *   reserve a SIM per line → assign to the order → check subscriber status →
 *   activate (or /modify) attaching the plan by its `transatelID` →
 *   push the customer's contact info to Transatel's /contact-info.
 *
 * This is a thin server-side proxy so the browser talks to a same-origin route
 * and the Django base URL / any auth header stays server-side.
 *
 * Request body (SimOrderSerializer shape):
 *   {
 *     email?, user_id?, order_reference?, country_code?,
 *     items: [ { simType, transatelID, quantity, cartKey?, ... } ],
 *     // EITHER a normalised contact block…
 *     subscriber?: { first_name, last_name, address, zip_code, city, country, email, ... },
 *     // …OR the raw billing address (Django will normalise it):
 *     billing?: { firstName, lastName, street, houseNumber, zip, city, email, ... }
 *   }
 *
 * Response: Django's body + status passed straight through
 *   200 { success: true, order_reference, assigned: [ { iccid, msisdn, ... } ], errors }
 *   409 { success: false, message, errors }
 *   503 { success: false, message }              — Transatel not configured
 */

// Match the availability route's env resolution so no new env var is needed.
const DJANGO_API_BASE_URL =
  process.env.API_URL ||
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!DJANGO_API_BASE_URL) {
    return NextResponse.json(
      { success: false, message: "Backend API URL is not configured." },
      { status: 500 },
    );
  }

  const body = await request.text(); // pass through verbatim
  const upstreamUrl = new URL("/api/v1/sims/sim-orders/", DJANGO_API_BASE_URL);

  // Forward the caller's auth header (DRF token / bearer) if present.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const auth = request.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });

    const data = await upstreamRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    console.error("❌ /api/transatel/sim-orders upstream error:", err);
    return NextResponse.json(
      { success: false, message: "Could not reach the SIM ordering service." },
      { status: 502 },
    );
  }
}
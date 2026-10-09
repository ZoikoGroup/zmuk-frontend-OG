import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/transatel/sim/availability
 *
 * Proxies to the Django backend and hands back a single available SIM's
 * ICCID. This is a read-only lookup (it does NOT reserve the SIM) — the
 * checkout flow still calls POST /api/v1/sim/sims/reserve/ or
 * POST /api/v1/sim/sim-orders/ on the Django side to actually hold/assign one.
 *
 * Query params (optional):
 *   sim_type = "esim" | "psim"   — restrict to a delivery type
 *
 * Response:
 *   200 { success: true, iccid, msisdn, sim_type, provisioning_status }
 *   404 { success: false, message: "No available SIMs in stock." }
 *   502 { success: false, message: "..." }  — backend unreachable / bad response
 */

// Prefer a server-only base URL if one is configured; fall back to the
// NEXT_PUBLIC_ one already used elsewhere in the app (see page.tsx) so this
// route works out of the box without adding a new env var.
const DJANGO_API_BASE_URL =
  process.env.API_URL ||
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  if (!DJANGO_API_BASE_URL) {
    return NextResponse.json(
      { success: false, message: "Backend API URL is not configured." },
      { status: 500 },
    );
  }

  const simType = request.nextUrl.searchParams.get("sim_type");
  if (simType && simType !== "esim" && simType !== "psim") {
    return NextResponse.json(
      { success: false, message: "sim_type must be 'esim' or 'psim'." },
      { status: 400 },
    );
  }

  const upstreamUrl = new URL(
    "/api/v1/sim/sims/availability/latest/",
    DJANGO_API_BASE_URL,
  );
  if (simType) upstreamUrl.searchParams.set("sim_type", simType);

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      // Availability changes constantly — never cache this route.
      cache: "no-store",
    });

    const data = await upstreamRes.json().catch(() => ({}));

    // Pass through Django's status code (200 / 404 / etc.) and body as-is.
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    console.error("❌ /api/transatel/sim/availability upstream error:", err);
    return NextResponse.json(
      { success: false, message: "Could not reach the SIM inventory service." },
      { status: 502 },
    );
  }
}

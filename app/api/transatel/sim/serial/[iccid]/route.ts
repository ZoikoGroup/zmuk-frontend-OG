// app/api/transatel/sim/serial/[iccid]/route.ts
//
// GET /api/transatel/sim/serial/{iccid}
//
// Server-side proxy to Transatel's SIM-by-serial lookup:
//   https://api.transatel.com/sim-management/sims/api/esims/sim-serial/{iccid}
//
// Uses the shared @/lib/transatel helper (client-credentials token, cached) —
// same source the catch-all and esim/[serial] routes use — so credentials stay
// on the server and there's a single token cache across all Transatel routes.

import { NextResponse } from "next/server";
import { getTransatelToken, TRANSATEL_BASE } from "@/lib/transatel";

export const runtime = "nodejs";        // Buffer + in-memory token cache need Node, not Edge
export const dynamic = "force-dynamic"; // never cache a live lookup

async function lookupSim(iccid: string, token: string): Promise<Response> {
  const target = `${TRANSATEL_BASE}/sim-management/sims/api/esims/sim-serial/${encodeURIComponent(iccid)}`;
  return fetch(target, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ iccid: string }> },
) {
  const { iccid } = await params;
  if (!iccid) {
    return NextResponse.json({ success: false, message: "ICCID is required." }, { status: 400 });
  }

  try {
    let upstream = await lookupSim(iccid, await getTransatelToken());

    // Token stale/revoked between cache and call — force refresh once and retry.
    if (upstream.status === 401) {
      upstream = await lookupSim(iccid, await getTransatelToken(true));
    }

    const detail = await upstream.json().catch(() => ({}));
    return NextResponse.json({ success: upstream.ok, iccid, detail }, { status: upstream.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not reach Transatel.";
   console.error("❌ sim-serial lookup failed for", iccid, ":", e);
    return NextResponse.json({ success: false, iccid, message }, { status: 502 });
  }
}
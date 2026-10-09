// app/api/transatel/subscriber/[serial]/route.ts
import { NextResponse } from "next/server";
import { getSubscriberDetails, validSerial, TransatelError } from "@/lib/transatel";

export const runtime = "nodejs";        // Buffer + in-memory token cache need Node, not Edge
export const dynamic = "force-dynamic"; // never cache a live lookup

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  if (!validSerial(serial)) {
    return NextResponse.json({ detail: "Invalid SIM serial." }, { status: 400 });
  }
  try {
    const data = await getSubscriberDetails(serial);
    return NextResponse.json(data);
  } catch (e) {
    const err = e as TransatelError;
    const status = err.status === 404 || err.status === 400 ? err.status : 502;
    return NextResponse.json({ detail: err.message, upstream: err.payload ?? null }, { status });
  }
}
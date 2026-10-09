// app/api/transatel/esim/[serial]/route.ts
import { NextResponse } from "next/server";
import { getEsimDetails, validSerial, TransatelError } from "@/lib/transatel";

export const runtime = "nodejs";        // Buffer + in-memory token cache need Node, not Edge
export const dynamic = "force-dynamic"; // never cache a live lookup

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  if (!validSerial(serial)) {
    return NextResponse.json({ detail: "Invalid SIM serial." }, { status: 400 });
  }
  const history = new URL(req.url).searchParams.get("history") !== "false";
  try {
    const data = await getEsimDetails(serial, history);
    return NextResponse.json(data);
  } catch (e) {
    const err = e as TransatelError;
    const status = err.status === 404 || err.status === 400 ? err.status : 502;
    return NextResponse.json({ detail: err.message, upstream: err.payload ?? null }, { status });
  }
}
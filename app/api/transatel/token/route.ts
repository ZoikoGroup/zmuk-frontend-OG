import { NextResponse } from "next/server";
import { getTransatelToken } from "@/lib/transatel";

export const runtime = "nodejs";        // Buffer + in-memory cache need Node, not Edge
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getTransatelToken();
    return NextResponse.json({ success: true, access_token: token });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
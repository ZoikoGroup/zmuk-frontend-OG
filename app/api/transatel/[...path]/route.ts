// app/api/transatel/[...path]/route.ts
// Generic authenticated proxy for any Transatel path NOT already handled by a
// specific route (e.g. subscriber/, esim/). It attaches a Bearer token server-side
// so the browser never sees credentials.
//
//   browser GET /api/transatel/<path>?q  ->  GET https://api.transatel.com/<path>?q
//
// SECURITY: this can reach WRITE endpoints (activate/modify) too. It only enforces
// whatever auth your app already applies to /api/transatel/*. Add a session/role check
// here before production if these routes are reachable by end users.
import { NextRequest, NextResponse } from "next/server";
import { getTransatelToken, TRANSATEL_BASE } from "@/lib/transatel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(req: NextRequest, path: string[]) {
  const target = `${TRANSATEL_BASE}/${path.join("/")}${req.nextUrl.search}`;

  const build = async (token: string): Promise<RequestInit> => {
    const init: RequestInit = {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    };
    if (!["GET", "HEAD"].includes(req.method)) {
      init.body = await req.text();
    }
    return init;
  };

  let upstream = await fetch(target, await build(await getTransatelToken()));
  if (upstream.status === 401) {
    // token stale — force refresh once and retry
    upstream = await fetch(target, await build(await getTransatelToken(true)));
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

// Next.js 15/16: params is a Promise.
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx)    { return proxy(req, (await params).path); }
export async function POST(req: NextRequest, { params }: Ctx)   { return proxy(req, (await params).path); }
export async function PUT(req: NextRequest, { params }: Ctx)    { return proxy(req, (await params).path); }
export async function PATCH(req: NextRequest, { params }: Ctx)  { return proxy(req, (await params).path); }
export async function DELETE(req: NextRequest, { params }: Ctx) { return proxy(req, (await params).path); }
"use client";
// Client-side helpers that call YOUR OWN Next.js API routes (never Transatel directly).

export interface SimLookup {
  found: boolean;
  data?: unknown;
  error?: string;
}

// Transatel reports "unknown SIM / not one of your SIMs" as a 400 (not a 404),
// with the message inside `upstream.detail`. Treat that specific case as "found: false"
// rather than a hard error, so a not-yet-activated SIM reads cleanly in the UI.
async function readNotFoundOrError(res: Response): Promise<SimLookup> {
  const d = await res.json().catch(() => ({} as Record<string, unknown>));
  const upstream = (d as { upstream?: { detail?: string } }).upstream;
  const detail = (d as { detail?: string }).detail;
  const msg = String(upstream?.detail ?? detail ?? "").toLowerCase();

  if (msg.includes("doesn't belong") || msg.includes("does not belong") || msg.includes("invalid sim serial")) {
    return { found: false }; // valid format, just not a registered subscriber
  }
  return { found: false, error: detail ?? "Lookup failed" };
}

// eSIM details (Endpoint 3)
export async function fetchEsim(serial: string, history = true): Promise<SimLookup> {
  const res = await fetch(`/api/transatel/esim/${serial}?history=${history}`);
  if (res.ok) return { found: true, data: await res.json() };
  if (res.status === 404) return { found: false };
  if (res.status === 400) return readNotFoundOrError(res);
  const d = await res.json().catch(() => ({} as { detail?: string }));
  return { found: false, error: (d as { detail?: string }).detail ?? "Lookup failed" };
}

// Subscriber details (Endpoint 2) — the "is this SIM active?" check
export async function fetchSubscriber(serial: string): Promise<SimLookup> {
  const res = await fetch(`/api/transatel/subscriber/${serial}`);
  if (res.ok) return { found: true, data: await res.json() };
  if (res.status === 404) return { found: false }; // fallback — Transatel usually uses 400
  if (res.status === 400) return readNotFoundOrError(res);
  const d = await res.json().catch(() => ({} as { detail?: string }));
  return { found: false, error: (d as { detail?: string }).detail ?? "Lookup failed" };
}
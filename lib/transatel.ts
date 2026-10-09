// lib/transatel.ts
// SERVER-ONLY Transatel client. Never import this into a Client Component.
// It reads the secret from server env vars and is only used by route handlers.
import "server-only";

const BASE = process.env.TRANSATEL_BASE ?? "https://api.transatel.com";
const CLIENT_ID = process.env.TRANSATEL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TRANSATEL_CLIENT_SECRET ?? "";

const TOKEN_URL = `${BASE}/authentication/api/token`;

// Base URL with any trailing slashes stripped — used by the catch-all proxy.
export const TRANSATEL_BASE = BASE.replace(/\/+$/, "");

// Simple in-memory token cache (per server instance).
let cachedToken: { value: string; expiresAt: number } | null = null;

export class TransatelError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status = 502, payload: unknown = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function basicAuthHeader(): string {
  const raw = `${CLIENT_ID}:${CLIENT_SECRET}`;
  return "Basic " + Buffer.from(raw, "utf-8").toString("base64");
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new TransatelError("Transatel credentials are not configured on the server.", 500);
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new TransatelError("Failed to obtain Transatel token.", res.status, await safeJson(res));
  }
  const data = await res.json();
  const token: string | undefined = data.access_token;
  const expiresIn = Number(data.expires_in ?? 3600);
  if (!token) throw new TransatelError("Token response missing access_token.", 502, data);

  // refresh 60s early
  cachedToken = { value: token, expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000 };
  return token;
}

// Public token getter — reused by the /token debug route and the [...path] proxy.
// Pass true to force a fresh token (e.g. after an upstream 401).
export function getTransatelToken(forceRefresh = false): Promise<string> {
  return getAccessToken(forceRefresh);
}

async function authedGet(url: string): Promise<unknown> {
  const doFetch = async () =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  let res = await doFetch();
  if (res.status === 401) {
    await getAccessToken(true); // token stale — refresh once and retry
    res = await doFetch();
  }
  // NOTE: Transatel returns 400 (not 404) for an unknown SIM, with a body like
  // { detail: "Invalid SIM serial / SIM card doesn't belong to customer" }.
  // We pass the real status + upstream body up; the client hook decides how to read it.
  if (res.status === 404) throw new TransatelError("Not found in Transatel.", 404, await safeJson(res));
  if (!res.ok) throw new TransatelError("Transatel request failed.", res.status, await safeJson(res));
  return res.json();
}

// Endpoint 3 — eSIM details by SIM serial (ICCID)
export function getEsimDetails(simSerial: string, history = true) {
  const url = `${BASE}/sim-management/sims/api/esims/sim-serial/${simSerial}${history ? "?history=true" : "?history=false"}`;
  return authedGet(url);
}

// Endpoint 2 — subscriber details by SIM serial (ICCID)
export function getSubscriberDetails(simSerial: string) {
  const url = `${BASE}/connectivity-management/subscribers/api/subscribers/sim-serial/${simSerial}`;
  return authedGet(url);
}

// Server-side rule from Transatel: simSerial must match [0-9]{13,20}
export function validSerial(s: string): boolean {
  return !!s && /^\d{13,20}$/.test(s);
}

async function safeJson(res: Response): Promise<unknown> {
  try { return await res.json(); } catch { return { raw: (await res.text()).slice(0, 500) }; }
}
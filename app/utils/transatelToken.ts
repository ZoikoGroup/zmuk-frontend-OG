// utils/transatelToken.ts
//
// SERVER-ONLY. Never import this from a "use client" file — it reads the
// Transatel client secret from the environment and uses Node's Buffer.
//
// OAuth2 client-credentials flow:
//   POST https://api.transatel.com/authentication/api/token
//   Authorization: Basic base64(client_id:client_secret)
//   Content-Type: application/x-www-form-urlencoded
//   body: grant_type=client_credentials
//
// The access token is cached in module scope until shortly before it expires,
// so `getTransatelToken()` can be called by every Transatel action cheaply.
// Pass `forceRefresh` (or let a 401 trigger it) to fetch a fresh token.

const BASE = process.env.TRANSATEL_API_BASE_URL || "https://api.transatel.com";
const CLIENT_ID = process.env.TRANSATEL_CLIENT_ID;
const CLIENT_SECRET = process.env.TRANSATEL_CLIENT_SECRET;

// Refresh this many ms before the real expiry to avoid using a token that
// expires mid-request.
const SAFETY_WINDOW_MS = 30_000;

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms, already minus the safety window
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

export class TransatelAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransatelAuthError";
  }
}

async function requestToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new TransatelAuthError(
      "Transatel credentials are not configured (TRANSATEL_CLIENT_ID / TRANSATEL_CLIENT_SECRET).",
    );
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const url = new URL("/authentication/api/token", BASE).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as TokenResponse;

  if (!res.ok || !data.access_token) {
    cached = null;
    throw new TransatelAuthError(
      data.error_description || data.error || `Token request failed (HTTP ${res.status}).`,
    );
  }

  const expiresInMs = (Number(data.expires_in) || 3600) * 1000;
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + expiresInMs - SAFETY_WINDOW_MS,
  };
  return cached.token;
}

/**
 * Returns a valid Transatel bearer token, reusing the cached one until it is
 * about to expire. Concurrent callers share a single in-flight request.
 */
export async function getTransatelToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) cached = null;

  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  if (!inFlight) {
    inFlight = requestToken().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
/**
 * Roaming & Travel API Client
 *
 * Implements the contract for apps/roaming (CT-001, ZMUK-ROAM-005 v2.0,
 * Engineering Decision v2):
 * - GET /api/v1/roaming/destinations/?q=
 * - GET /api/v1/roaming/destinations/<code>/?travel_date=YYYY-MM-DD
 * - GET /api/v1/lines/<line_id>/roaming-quote/?country=XX&travel_date=YYYY-MM-DD
 *
 * Golden rules enforced here:
 * - Backend decides all inclusion, pricing, VAT, and wording.
 * - Personalised quotes always use `cache: "no-store"` and are never cached in storage.
 * - `null` means unknown, never 0.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ROAMING_API = `${API_BASE}/api/v1`;

export type QuoteStatus =
  | "READY_PERSONALISED"
  | "LEGACY_LINE_UNLINKED"
  | "TARIFF_MAPPING_PENDING"
  | "STALE"
  | "PUBLIC_RATES_ONLY"
  | "LINE_NOT_ACTIVE";

export type QuoteOutcome =
  | "INCLUDED_WITH_LIMIT"
  | "STANDARD_CHARGES"
  | "NOT_SUPPORTED";

export type ActionKind =
  | "view_allowance"
  | "view_rates"
  | "contact_support"
  | "choose_line";

export interface Destination {
  code: string;
  name: string;
  kind: "country" | "territory" | "maritime" | "aircraft" | string;
  parent_code?: string;
  rating_zone: string | null;
}

export interface RateTile {
  amount: string; // decimal string, e.g. "0.1111" or "0.0000"
  unit: string; // "MB" | "minute" | "text" | "picture message"
  display: string; // e.g. "£0.1111 per MB"
}

export interface Rates {
  data: RateTile | null;
  voice_to_uk: RateTile | null;
  voice_local: RateTile | null;
  voice_incoming: RateTile | null;
  sms: RateTile | null;
  mms: RateTile | null;
}

export interface Charging {
  currency: string;
  vat_basis: "inclusive" | "exclusive" | null;
  units_rounding: string | null;
  exhaustion_action: "charge" | "block" | "customer_choice" | "unknown" | string;
  spend_control: string | null;
}

export interface CommercialBasis {
  register_version: string;
  plan_sku: string | null;
  plan_version: string | null;
  effective_from: string | null; // YYYY-MM-DD
  effective_to: string | null;
  validation_date: string | null; // YYYY-MM-DD
  source_system: string;
}

export interface RemainingBalance {
  status: "coming_soon" | string;
  data_mb: number | null;
  voice_minutes: number | null;
  sms: number | null;
  as_of: string | null;
}

export interface Entitlement {
  data_mb: number | null;
  voice_minutes: number | null;
  voice_unlimited: boolean;
  sms: number | null;
  sms_unlimited: boolean;
  fair_use_terms: string | null;
  remaining: RemainingBalance;
}

export interface QuoteWarning {
  code: string;
  message: string;
}

export interface QuoteBase {
  status: QuoteStatus;
  outcome: QuoteOutcome | null;
  destination: Destination;
  travel_date: string;
  warnings: QuoteWarning[];
  generated_at: string;
  message: string;
  action: { kind: ActionKind; label: string };
  commercial_basis: CommercialBasis | null;
  rates: Rates | null;
  charging: Charging | null;
}

export interface LineQuote extends QuoteBase {
  line: {
    id: string;
    msisdn_masked: string | null;
    plan: string | null;
    status: string;
  };
  entitlement: Entitlement | null;
  quote_id: string;
}

export interface PublicQuote extends QuoteBase {
  personalised: false;
}

export type RoamingQuoteResponse = LineQuote | PublicQuote;

export class RoamingApiError extends Error {
  constructor(
    public httpStatus: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "RoamingApiError";
  }
}

function authHeaders(token?: string | null): HeadersInit {
  return token ? { Authorization: `Token ${token}` } : {};
}

async function parseErrorResponse(res: Response): Promise<RoamingApiError> {
  const body = await res.json().catch(() => ({}));

  if (res.status === 429) {
    return new RoamingApiError(
      429,
      "THROTTLED",
      "Please try again shortly."
    );
  }
  if (res.status === 401) {
    return new RoamingApiError(
      401,
      "UNAUTHENTICATED",
      body?.detail || "Authentication required."
    );
  }
  if (body?.code && body?.message) {
    return new RoamingApiError(res.status, String(body.code), String(body.message));
  }
  if (body?.travel_date && Array.isArray(body.travel_date) && body.travel_date.length > 0) {
    return new RoamingApiError(
      res.status,
      "INVALID_TRAVEL_DATE",
      String(body.travel_date[0]),
      { travel_date: body.travel_date.map(String) }
    );
  }
  if (body?.country && Array.isArray(body.country) && body.country.length > 0) {
    return new RoamingApiError(
      res.status,
      "INVALID_COUNTRY",
      String(body.country[0]),
      { country: body.country.map(String) }
    );
  }
  if (body?.detail) {
    return new RoamingApiError(res.status, "ERROR", String(body.detail));
  }
  return new RoamingApiError(
    res.status,
    "UNKNOWN_ERROR",
    "Could not load roaming details right now. Please try again."
  );
}

/**
 * Search destinations (no auth required). GB is never returned by the backend.
 */
export async function searchDestinations(
  q: string,
  signal?: AbortSignal
): Promise<Destination[]> {
  const query = q.trim();
  const url = query
    ? `${ROAMING_API}/roaming/destinations/?q=${encodeURIComponent(query)}`
    : `${ROAMING_API}/roaming/destinations/`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  const data = await res.json();
  return Array.isArray(data?.destinations) ? (data.destinations as Destination[]) : [];
}

/**
 * Fetch general published roaming rates for a destination (no auth required).
 * Always returns non-personalised output (`personalised: false`).
 */
export async function getPublicRates(
  code: string,
  travelDate?: string,
  signal?: AbortSignal
): Promise<PublicQuote> {
  const params = new URLSearchParams();
  if (travelDate) params.set("travel_date", travelDate);
  const qs = params.toString();
  const url = `${ROAMING_API}/roaming/destinations/${encodeURIComponent(code)}/${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  return (await res.json()) as PublicQuote;
}

/**
 * Fetch personalised roaming quote for one of the authenticated user's lines.
 * Always passes `cache: "no-store"`.
 */
export async function getLineQuote(
  token: string,
  lineId: string,
  country: string,
  travelDate?: string,
  signal?: AbortSignal
): Promise<LineQuote> {
  const params = new URLSearchParams({ country });
  if (travelDate) params.set("travel_date", travelDate);
  const url = `${ROAMING_API}/lines/${encodeURIComponent(lineId)}/roaming-quote/?${params.toString()}`;
  const res = await fetch(url, {
    headers: authHeaders(token),
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  return (await res.json()) as LineQuote;
}

/**
 * Type guard / rendering classifier from Section 10 of the guide.
 */
export function isLineQuote(q: RoamingQuoteResponse): q is LineQuote {
  return "line" in q;
}

export type QuoteViewKind = "included" | "charged" | "unsupported" | "public" | "info";

export function classifyQuoteView(q: RoamingQuoteResponse): QuoteViewKind {
  if (q.status === "READY_PERSONALISED") {
    switch (q.outcome) {
      case "INCLUDED_WITH_LIMIT":
        return "included";
      case "STANDARD_CHARGES":
        return "charged";
      case "NOT_SUPPORTED":
        return "unsupported";
    }
  }
  if (q.status === "PUBLIC_RATES_ONLY") return "public";
  return "info";
}

// ── Display Formatting Helpers (Section 7) ──

export function formatIsoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getTodayIso(): string {
  return formatIsoDateLocal(new Date());
}

export function getMinTravelDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return formatIsoDateLocal(d);
}

export function getMaxTravelDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  return formatIsoDateLocal(d);
}

export function formatDisplayDate(iso?: string | null): string | null {
  if (!iso) return null;
  const parts = iso.split("T")[0].split("-");
  if (parts.length !== 3) return iso;
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimestamp(iso?: string | null): string | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return null;
  return (
    dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    ", " +
    dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  );
}

/**
 * Formats MB allowance:
 * null -> "—", >= 1024 -> GB (e.g. 5120 -> "5 GB"), < 1024 -> "MB"
 */
export function formatAllowanceMb(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return "—";
  if (mb < 1024) return `${mb} MB`;
  const gb = mb / 1024;
  const rounded = Number(gb.toFixed(1));
  return `${rounded} GB`;
}

export function formatRateDisplay(tile: RateTile | null): string | null {
  if (!tile) return null;
  // Exact zero evidenced by backend ("0.0000") can be shown as Free
  if (/^0+(\.0+)?$/.test(tile.amount.trim())) {
    return "Free";
  }
  return tile.display;
}

export function getVatBasisLabel(vatBasis?: Charging["vat_basis"]): string | null {
  if (vatBasis === "inclusive") return "Prices include VAT";
  if (vatBasis === "exclusive") return "Prices exclude VAT";
  return null;
}

export function getExhaustionActionLabel(action?: string | null): string | null {
  switch (action) {
    case "charge":
      return "After your allowance, the rates above apply";
    case "block":
      return "Usage stops when your allowance runs out";
    case "customer_choice":
      return "You'll be asked before charges apply";
    default:
      return null;
  }
}

export const RATE_TILE_LABELS: { key: keyof Rates; label: string }[] = [
  { key: "data", label: "Data" },
  { key: "voice_to_uk", label: "Calls to the UK" },
  { key: "voice_local", label: "Local calls" },
  { key: "voice_incoming", label: "Receiving calls" },
  { key: "sms", label: "Texts" },
  { key: "mms", label: "Picture messages" },
];

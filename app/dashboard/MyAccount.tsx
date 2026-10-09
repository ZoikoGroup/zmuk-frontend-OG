"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, User, FileText, BarChart2, ShoppingBag, Repeat, CreditCard,
  Gift, Users, Tag, Download, Settings as SettingsIcon, HelpCircle, ScrollText,
  Shield, LogOut, Plus, ChevronDown, Pencil, Smartphone,
} from "lucide-react";
// npm i lucide-react  (if not already installed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import beQuick from "../utils/dasdbeQuickApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const PINK = "#C12172";
const NA = "Not available"; // shown wherever the backend has no data yet

// ---------- Types ----------
interface PlanDetails {
  current_plans?: { id: string | number; name: string }[];
  service_period?: { end_at?: string };
  usage_summary?: { data?: UsageBlock; international_data?: UsageBlock };
}
interface UsageBlock { total?: string | number; used?: string | number; remaining?: string | number; }
interface Device {
  id: string | number; label: string; note: string; status: string;
  mdn?: string; imei?: string; esim?: boolean; primary?: boolean;
}
interface Order {
  id?: string | number; order_id?: string | number; date?: string; created_at?: string;
  description?: string; amount?: string | number; total?: string | number;
}
interface BqLine {
  id: string | number; manufacturer?: string; model?: string; device_name?: string;
  imei?: string; mdn?: string; status?: string; primary?: boolean | string | number;
  is_esim?: boolean | string | number; sim_type?: string;
}
interface RawOrderEntry {
  order_db_id?: number; bequick_order_id?: string | number; subscriber_id?: string | number;
  total?: string | number; created_at?: string;
  cart?: { name?: string; plan_name?: string; title?: string; product_name?: string }[];
}
interface ByUserResponse { status?: boolean; logged_user?: string; groups?: Record<string, Record<string, RawOrderEntry[]>>; }

// ---------- Helpers ----------
function kbToGb(kb: number): number { return kb / 1024 / 1024; }
function formatDateAndRemaining(endAt?: string): { formatted: string; remainingDays: number | "N/A" } {
  if (!endAt) return { formatted: "N/A", remainingDays: "N/A" };
  const endDate = new Date(endAt);
  const diffTime = endDate.getTime() - Date.now();
  const remainingDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  const formatted = endDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  return { formatted, remainingDays };
}
function isEsim(line: BqLine): boolean {
  return line.is_esim === true || line.is_esim === "true" || line.is_esim === 1 || line.is_esim === "1" ||
    (typeof line.sim_type === "string" && line.sim_type.toLowerCase() === "esim");
}
function isPrimary(line: BqLine): boolean {
  return line.primary === true || line.primary === "true" || line.primary === 1 || line.primary === "1";
}
function deviceLabel(line: BqLine): string {
  if (line.manufacturer && line.model) return `${line.manufacturer} ${line.model}`;
  if (line.device_name) return line.device_name;
  if (line.imei) return `Device (${String(line.imei).slice(-4)})`;
  if (line.mdn) return `Device ${String(line.mdn).slice(-4)}`;
  return `Device #${line.id}`;
}
function niceStatus(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "active": return "Active";
    case "inactive": case "paused": case "suspended": return "Paused";
    case "cancelled": case "terminated": return "Inactive";
    case "draft": case "pending": return "Pending";
    default: return "Unknown";
  }
}
function describeCart(cart?: RawOrderEntry["cart"]): string {
  if (!cart || cart.length === 0) return "Plan Purchase";
  const names = cart.map((c) => c.name || c.plan_name || c.title || c.product_name).filter(Boolean) as string[];
  return names.length ? names.join(", ") : `${cart.length} item(s)`;
}
function maskPhone(mdn?: string): string {
  const last4 = mdn ? String(mdn).slice(-4) : "••••";
  return `+1 ••• ••• ${last4}`;
}
function maskImei(imei?: string): string {
  return `••• ••• ••• ${imei ? String(imei).slice(-4) : "••••"}`;
}
function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "U";
}

// ---------- Usage ring (pure SVG, no chart lib) ----------
function UsageRing({ pct }: { pct: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-gray-700" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke={PINK} strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: PINK }}>
        {pct}%
      </div>
    </div>
  );
}

// ---------- Sidebar nav ----------
type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; active?: boolean };

// ---------- Component ----------
export default function MyAccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Customer");
  const [accountEmail, setAccountEmail] = useState("");

  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);
  const [primaryLineId, setPrimaryLineId] = useState<string | number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [currentBill, setCurrentBill] = useState<{ total?: number; closed_at?: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // UI-only state for the layout
  const [autoPay, setAutoPay] = useState(false);
  const [contractOpen, setContractOpen] = useState(true);
  const [activeLineId, setActiveLineId] = useState<string | number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("zoiko_token");
        if (!token) { router.push("/login"); return; }
        const userData = JSON.parse(localStorage.getItem("zoiko_user") || "{}");
        const email: string = userData?.email || "";
        setUserName([userData?.first_name, userData?.last_name].filter(Boolean).join(" ").trim() || userData?.username || "Customer");
        setAccountEmail(email);

        let foundSubscriberId: string | number | null = null;
        try {
          const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
            body: JSON.stringify({ logged_user: email }),
          });
          const data: ByUserResponse = await res.json();
          const userGroups = data.groups?.[email] || {};
          const flatOrders: Order[] = [];
          for (const [orderId, entries] of Object.entries(userGroups)) {
            const entry = entries?.[0];
            if (!entry) continue;
            if (!foundSubscriberId && entry.subscriber_id) foundSubscriberId = entry.subscriber_id;
            flatOrders.push({
              id: entry.order_db_id ?? orderId,
              order_id: entry.bequick_order_id ?? orderId,
              created_at: entry.created_at, date: entry.created_at,
              amount: entry.total ?? 0, description: describeCart(entry.cart),
            });
          }
          setOrders(flatOrders);
          setSubscriberId(foundSubscriberId);
        } catch { /* no orders */ }

        if (foundSubscriberId) {
          try {
            const lines = (await beQuick.getUserLines(foundSubscriberId)) as BqLine[];
            const mapped: Device[] = (lines || []).map((line) => ({
              id: line.id,
              label: deviceLabel(line),
              note: `${isEsim(line) ? "eSIM" : "pSIM"} • ${isPrimary(line) ? "Primary Line" : "Secondary Line"}`,
              status: niceStatus(line.status),
              mdn: line.mdn, imei: line.imei, esim: isEsim(line), primary: isPrimary(line),
            }));
            setDevices(mapped);
            const primary = (lines || []).find(isPrimary) || (lines || [])[0];
            const pLineId = primary?.id ?? null;
            setPrimaryLineId(pLineId);
            setActiveLineId(pLineId);
            if (pLineId) {
              try { setPlanDetails((await beQuick.getPlanDetails(pLineId, true)) as PlanDetails); } catch { /* N/A */ }
            }
          } catch { /* no lines */ }
          try { setCurrentBill((await beQuick.getCurrentBill(foundSubscriberId)) as { total?: number; closed_at?: string } | null); } catch { /* ignore */ }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Derived ----------
  const billTotal = currentBill?.total || 0;
  const nextPayment = currentBill?.closed_at
    ? new Date(currentBill.closed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "-";

  const dom = planDetails?.usage_summary?.data || {};
  const domTotal = dom.total ? kbToGb(Number(dom.total)) : 0;
  const domUsed = dom.used ? kbToGb(Number(dom.used)) : 0;
  const domRemaining = dom.remaining !== undefined ? kbToGb(Number(dom.remaining)) : domTotal - domUsed;
  const dataRemainingPct = domTotal > 0 ? Math.round((domRemaining / domTotal) * 100) : 0;

  const { formatted: activeUntil } = formatDateAndRemaining(planDetails?.service_period?.end_at);
  const hasPlan = !!planDetails?.current_plans?.[0];
  const planName = planDetails?.current_plans?.[0]?.name || "Zoiko Essentials";
  const activeLine = devices.find((d) => d.id === activeLineId) || devices[0];

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Account Summary", href: "/dashboard", icon: User, active: true },
    { label: "View My Bill", href: subscriberId ? `/dashboard/billing-payment/${subscriberId}` : "#", icon: FileText },
    { label: "Usage History", href: primaryLineId ? `/dashboard/plan-usages/${primaryLineId}` : "#", icon: BarChart2 },
    { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { label: "Subscriptions", href: "#", icon: Repeat },
    { label: "Pay My Bill", href: subscriberId ? `/dashboard/billing-payment/${subscriberId}` : "#", icon: CreditCard },
    { label: "Rewards", href: "#", icon: Gift },
    { label: "Refer & Earn", href: "#", icon: Users },
    { label: "Latest Offers", href: "#", icon: Tag },
    { label: "Downloads", href: "#", icon: Download },
    { label: "Settings", href: "/dashboard/security", icon: SettingsIcon },
    { label: "Help & Support", href: "/dashboard/support", icon: HelpCircle },
    { label: "Terms and Conditions", href: "/terms-and-conditions", icon: ScrollText },
    { label: "Privacy Policy", href: "/privacy-policy", icon: Shield },
  ];

  function handleLogout() {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    router.push("/login");
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
      {/* welcome banner */}
      <div className="py-3 text-center font-semibold text-white" style={{ backgroundColor: PINK }}>
        Welcome to Your Account Summary with Zoiko Mobile!
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${PINK} transparent ${PINK} ${PINK}` }} />
        </div>
      )}
      {error && (
        <div className="mx-auto my-6 max-w-2xl rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
      )}

      {!loading && (
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">

          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-64">
            <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: PINK }}>
                  {initials(userName)}
                </div>
                <p className="mt-3 font-bold">{userName}</p>
                <button onClick={handleLogout} className="mt-2 flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </div>

              <nav className="mt-5 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.label} href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      item.active
                        ? "font-semibold text-white"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                    style={item.active ? { backgroundColor: PINK } : undefined}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold">
                Hello, <span style={{ color: PINK }}>{userName}!</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome to Your Account Summary</p>
            </div>

            {/* plan + payment */}
            <div className="grid gap-5 lg:grid-cols-2">
              {/* plan */}
              <div className="rounded-xl border p-5" style={{ backgroundColor: "#fdeef4", borderColor: "#f6cfe0" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{planName}</h3>
                      {hasPlan && (
                        <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">● Active</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: PINK }}>${Number(billTotal).toFixed(2)}<span className="text-xs font-normal text-gray-500">/mo</span></p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-800">{maskPhone(activeLine?.mdn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contract Valid Till</p>
                    <p className="font-medium text-gray-800">{activeUntil}</p>
                  </div>
                </div>
                <Link href="/plans" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: PINK }}>
                  Upgrade Plan →
                </Link>
              </div>

              {/* payment (no payment API yet, so values show as "Not available") */}
              <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">Payment Methods</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Change how you pay for your plan</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-12 items-center justify-center rounded bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-200">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">—</p>
                      <p className="text-xs text-gray-400">{NA}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-gray-700">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Enable AutoPay:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">OFF</span>
                    <button onClick={() => setAutoPay((v) => !v)} aria-label="Toggle AutoPay"
                      className={`relative h-6 w-11 rounded-full transition-colors ${autoPay ? "" : "bg-gray-300"}`}
                      style={autoPay ? { backgroundColor: PINK } : undefined}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoPay ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <span className="text-xs font-semibold" style={{ color: PINK }}>ON</span>
                  </div>
                </div>
              </div>
            </div>

            {/* users & active line details */}
            <div>
              <h3 className="mb-3 font-bold">Users &amp; Active Line Details</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {devices.slice(0, 2).map((d) => {
                  const selected = d.id === activeLineId;
                  return (
                    <button key={d.id} onClick={() => setActiveLineId(d.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                        selected ? "" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      }`}
                      style={selected ? { backgroundColor: "#fdeef4", borderColor: PINK } : undefined}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "" : "border-gray-300"}`} style={selected ? { borderColor: PINK } : undefined}>
                        {selected && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PINK }} />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                        <p className="text-xs text-gray-500">{maskPhone(d.mdn)}</p>
                      </div>
                    </button>
                  );
                })}
                <Link href="/dashboard/add-device"
                  className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-left hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700"><Plus className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Add Family &amp; Friends</p>
                    <p className="text-xs text-gray-500">Link numbers for discounts &amp; bill payments</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* contract + usage */}
            <div className="grid gap-5 lg:grid-cols-2">
              {/* contract status */}
              <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                  <Smartphone className="h-6 w-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Active Plan</p>
                    <p className="text-sm font-semibold">{planName}</p>
                  </div>
                  <Link href="/plans" className="text-xs font-semibold" style={{ color: PINK }}>+ Upgrade</Link>
                </div>

                <button onClick={() => setContractOpen((v) => !v)} className="flex w-full items-center justify-between py-1 text-left font-semibold">
                  Contract Status
                  <ChevronDown className={`h-4 w-4 transition-transform ${contractOpen ? "rotate-180" : ""}`} />
                </button>

                {contractOpen && (
                  <dl className="mt-2 divide-y divide-gray-100 text-sm dark:divide-gray-700">
                    {/* "—" = no live data source yet; the other rows are real */}
                    {[
                      ["Contract Duration", "—"],
                      ["Installments Left", "—"],
                      ["Next Bill Due on", `${nextPayment}  |  Amount: $${Number(billTotal).toFixed(2)}`],
                      ["Contract Validity Date", activeUntil],
                      ["IMEI & SIM Number", maskImei(activeLine?.imei)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2.5">
                        <dt className="text-gray-500">{k}</dt>
                        <dd className="font-medium text-gray-800 dark:text-gray-100">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* usage summary */}
              <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Usage Summary</h3>
                  <Link href={primaryLineId ? `/dashboard/plan-usages/${primaryLineId}` : "#"} className="text-xs font-semibold" style={{ color: PINK }}>
                    View Full Usage Report
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Data (real) */}
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">Data</p>
                      <p className="text-lg font-bold">{domRemaining.toFixed(1)}GB</p>
                      <p className="text-xs text-gray-400">Remaining</p>
                    </div>
                    <div className="ml-auto"><UsageRing pct={dataRemainingPct} /></div>
                  </div>
                  {/* Voice (no data source yet) */}
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">Voice</p>
                      <p className="text-lg font-bold">—</p>
                      <p className="text-xs text-gray-400">{NA}</p>
                    </div>
                    <div className="ml-auto"><UsageRing pct={0} /></div>
                  </div>
                  {/* Texts (no data source yet) */}
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">Texts</p>
                      <p className="text-lg font-bold">—</p>
                      <p className="text-xs text-gray-400">{NA}</p>
                    </div>
                    <div className="ml-auto"><UsageRing pct={0} /></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
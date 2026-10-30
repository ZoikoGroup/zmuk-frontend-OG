"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  RotateCw,
  KeyRound,
  ShieldCheck,
  Key,
  Lock,
  FileText,
  Mail,
  Monitor,
  ChevronRight,
  Check,
  AlertTriangle,
  Fingerprint,
  Smartphone,
  MessageSquare,
  Info,
  ArrowRight,
  User,
  Home,
  Globe,
  Accessibility,
  Bell,
  CreditCard,
  BarChart2,
  Tag,
  Eye,
  Cookie,
  Download,
  ArrowLeftRight,
  Trash2,
  Link2,
  AlertCircle,
  Settings,
  Cpu,
  Gauge,
  HelpCircle,
  MessageCircle,
  Headphones,
  X,
  Copy,
  CheckCircle2,
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import { getMySimOrders } from "../../services/simOrderHistoryApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SECURITY_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE}/api/security/`;

interface SessionItem {
  id: string;
  label: string;
  kind: "desktop" | "mobile";
  location: string;
  lastActive: string;
  signedIn: string;
  current: boolean;
}

const CARD =
  "bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E6E8EE] p-5 flex flex-col min-w-0";

// ── Helpers ──
const maskEmail = (email: string) => {
  if (!email || !email.includes("@")) return "Not added";
  const [user, domain] = email.split("@");
  return `${user.charAt(0)}•••••@${domain}`;
};

const formatMsisdn = (raw: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("44") ? "0" + digits.slice(2) : digits;
  return local.length === 11 ? `${local.slice(0, 5)} ${local.slice(5)}` : local;
};

const maskPhone = (phone: string) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 5)} •••${digits.slice(-3)}`;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const formatDateTime = (d: Date) =>
  `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

const detectBrowser = (): { label: string; kind: "desktop" | "mobile" } => {
  if (typeof navigator === "undefined") return { label: "This browser", kind: "desktop" };
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
    ? "Opera"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Browser";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
    ? "iPad"
    : /Android/.test(ua)
    ? "Android"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
    ? "Windows"
    : /Linux/.test(ua)
    ? "Linux"
    : "your device";
  const kind = /iPhone|Android|iPad/.test(ua) ? "mobile" : "desktop";
  return { label: `${browser} on ${os}`, kind };
};

const generateBackupCodes = () =>
  Array.from({ length: 10 }).map(() => {
    const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${part()}-${part()}`;
  });

// ── Small UI pieces ──
function CardHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-2.5">
      <div className="w-10 h-10 rounded-xl bg-[#FDF2F6] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#E01C5B]" />
      </div>
      <div className="min-w-0">
        <h3 className="text-base sm:text-lg font-bold text-[#0D1935] leading-6">{title}</h3>
        <p className="text-xs text-[#54617E] leading-5">{subtitle}</p>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  subtitle,
  right,
  onClick,
  first,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  first?: boolean;
}) {
  const content = (
    <>
      <div className="w-8 h-8 rounded-lg bg-[#F6F7FA] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#1E2D4D]" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-sm font-semibold text-[#0D1935] leading-5">{title}</div>
        <div className="text-xs text-[#54617E] leading-4 break-words">{subtitle}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {right}
        {onClick && <ChevronRight className="w-3.5 h-3.5 text-[#8A94A6]" />}
      </div>
    </>
  );
  const cls = `w-full pt-2 pb-2.5 flex items-center gap-3 ${first ? "" : "border-t border-[#EEF0F4]"}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:bg-slate-50/60 rounded-lg transition cursor-pointer`}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
}

function Pill({ tone, children }: { tone: "green" | "amber" | "grey"; children: React.ReactNode }) {
  const map = {
    green: "bg-[#E8F6EE] text-[#1E8E5A]",
    amber: "bg-[#FFF4E5] text-[#B45309]",
    grey: "bg-[#F6F7FA] text-[#3B4866]",
  };
  return (
    <span className={`h-6 px-2.5 rounded-full inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${map[tone]}`}>
      {children}
    </span>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`w-11 h-6 p-[3px] rounded-full flex items-center transition-colors shrink-0 cursor-pointer ${
        on ? "bg-[#E01C5B] justify-end" : "bg-[#C9CFDA] justify-start"
      }`}
    >
      <span className="w-[18px] h-[18px] bg-white rounded-full shadow-[0px_1px_3px_0px_rgba(0,0,0,0.20)]" />
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#0D1935]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const router = useRouter();

  // Layout state
  const [activeTab, setActiveTab] = useState("security");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");

  // Account data
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [planName, setPlanName] = useState("");
  const [numbersCount, setNumbersCount] = useState(0);
  const [checkedAt, setCheckedAt] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Security state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [smsBackupEnabled, setSmsBackupEnabled] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  // Preferences
  const [usageAlerts, setUsageAlerts] = useState(true);
  const [offerEmail, setOfferEmail] = useState(false);
  const [offerText, setOfferText] = useState(false);
  const [cookieChoice, setCookieChoice] = useState("Essential cookies only");
  const [billLimit, setBillLimit] = useState<number | null>(null);

  // UI
  const [modal, setModal] = useState<
    null | "backup" | "twofa" | "report" | "sessions" | "data" | "close" | "cookies"
  >(null);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [reportNote, setReportNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const persist = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const storedToken =
        localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token") || "";
      setToken(storedToken);

      let user: any = {};
      try {
        user = JSON.parse(localStorage.getItem("zoiko_user") || "{}");
      } catch {}

      // Fetch live user profile dynamically from backend
      if (storedToken) {
        try {
          const userRes = await fetch(`${API_BASE}/api/accounts/dashboard/`, {
            headers: { Authorization: `Token ${storedToken}` },
          });
          if (userRes.status === 401) {
            localStorage.removeItem("zoiko_token");
            localStorage.removeItem("zoiko_user");
            window.location.href = "/login";
            return;
          }
          if (userRes.ok) {
            const backendUser = await userRes.json();
            if (backendUser && (backendUser.email || backendUser.username)) {
              user = { ...user, ...backendUser };
              try {
                localStorage.setItem("zoiko_user", JSON.stringify(user));
              } catch {}
              if (backendUser.last_password_change || backendUser.password_changed_at) {
                setPasswordChangedAt(backendUser.last_password_change || backendUser.password_changed_at);
              }
              if (backendUser.last_login) {
                persist("zoiko_session_started", backendUser.last_login);
              }
            }
          }
        } catch {}
      }

      const userEmail: string = user?.email || "";
      const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
        user?.name ||
        user?.username ||
        (userEmail ? userEmail.split("@")[0] : "Customer");
      setUserName(fullName);
      setEmail(userEmail);

      // Persisted security preferences
      setTwoFAEnabled(localStorage.getItem("driverx_2fa") === "true");
      setPasswordChangedAt(localStorage.getItem("zoiko_password_changed_at") || "");
      try {
        setBackupCodes(JSON.parse(localStorage.getItem("zoiko_backup_codes") || "[]"));
      } catch {
        setBackupCodes([]);
      }
      setSmsBackupEnabled(localStorage.getItem("zoiko_sms_backup") !== "false");
      setUsageAlerts(localStorage.getItem("zoiko_usage_alerts") !== "false");
      setOfferEmail(localStorage.getItem("zmuk_offers_marketing_email") === "true");
      setOfferText(localStorage.getItem("zmuk_offers_marketing_text") === "true");
      setCookieChoice(localStorage.getItem("zoiko_cookie_choice") || "Essential cookies only");
      const limit = localStorage.getItem("zoiko_bill_limit");
      setBillLimit(limit && !isNaN(Number(limit)) ? Number(limit) : null);

      // Current browser session (real) + any revoked list
      const { label, kind } = detectBrowser();
      let signedInAt = localStorage.getItem("zoiko_session_started");
      if (!signedInAt) {
        signedInAt = new Date().toISOString();
        persist("zoiko_session_started", signedInAt);
      }
      let tz = "United Kingdom";
      try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace(/_/g, " ") || tz;
      } catch {}
      let otherSessions: SessionItem[] = [];
      try {
        otherSessions = JSON.parse(localStorage.getItem("zoiko_other_sessions") || "[]");
      } catch {}
      setSessions([
        {
          id: "current",
          label,
          kind,
          location: `${tz} (estimated)`,
          lastActive: "Active now",
          signedIn: formatDateTime(new Date(signedInAt)),
          current: true,
        },
        ...otherSessions,
      ]);

      // Lines / phone from Django orders
      if (userEmail && storedToken) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Token ${storedToken}` },
            body: JSON.stringify({ logged_user: userEmail }),
          });
          if (res.ok) {
            const data = await res.json();
            const groups = (data?.groups?.[userEmail] || {}) as Record<string, any[]>;
            const entries = Object.values(groups).map((g) => g?.[0]).filter(Boolean);
            setNumbersCount(entries.length);
            const withNumber = entries.find(
              (e: any) => e?.msisdn || e?.phone_number || e?.mobile_number
            );
            if (withNumber) {
              setPhone(
                formatMsisdn(withNumber.msisdn || withNumber.phone_number || withNumber.mobile_number)
              );
            }
            const withPlan = entries.find((e: any) => e?.plan_name);
            if (withPlan) setPlanName(withPlan.plan_name);
          }
        } catch {}
      }
      if (!phone && user?.phone) setPhone(formatMsisdn(user.phone));

      // Also check confirmed SIM orders from backend if numbersCount is still 0
      if (storedToken) {
        try {
          const simOrders = await getMySimOrders();
          if (Array.isArray(simOrders) && simOrders.length > 0) {
            let simCount = 0;
            let discoveredPhone = "";
            let discoveredPlan = "";
            for (const ord of simOrders) {
              if (Array.isArray(ord.sims)) {
                simCount += ord.sims.length;
                for (const s of ord.sims) {
                  if (!discoveredPhone && s.msisdn) {
                    discoveredPhone = formatMsisdn(s.msisdn);
                  }
                }
              }
              if (!discoveredPlan && ord.items?.[0]?.name) {
                discoveredPlan = ord.items[0].name;
              }
            }
            setNumbersCount((prev) => (prev > 0 ? prev : simCount));
            if (!phone && discoveredPhone) setPhone(discoveredPhone);
            if (!planName && discoveredPlan) setPlanName(discoveredPlan);
          }
        } catch {}
      }

      // 2FA - Two-factor authentication (Temporarily commented out)
      /*
      if (storedToken) {
        try {
          const r = await fetch(`${SECURITY_URL}two-fa/`, {
            headers: { Authorization: `Token ${storedToken}` },
          });
          if (r.ok) {
            const j = await r.json();
            if (typeof j?.enabled === "boolean") {
              setTwoFAEnabled(j.enabled);
              persist("driverx_2fa", String(j.enabled));
            }
          }
        } catch {}
      }
      */

      const now = new Date();
      setCheckedAt(
        `${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST, ${now.toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "short" }
        )}`
      );
      if (isRefresh) showToast("Security information refreshed.");
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // ── Actions ──
  const toggle2FA = async () => {
    const next = !twoFAEnabled;
    setTwoFAEnabled(next);
    persist("driverx_2fa", String(next));
    if (token) {
      fetch(`${SECURITY_URL}two-fa/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      }).catch(() => {});
    }
    setModal(null);
    showToast(next ? "Two-step verification turned on." : "Two-step verification turned off.");
  };

  const startBackupCodes = () => {
    setNewCodes(generateBackupCodes());
    setModal("backup");
  };

  const saveBackupCodes = () => {
    setBackupCodes(newCodes);
    persist("zoiko_backup_codes", JSON.stringify(newCodes));
    setModal(null);
    showToast("Backup codes saved. Keep them somewhere safe.");
  };

  const signOutSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    persist("zoiko_other_sessions", JSON.stringify(remaining.filter((s) => !s.current)));
    showToast("Session signed out.");
  };

  const signOutEverywhereElse = () => {
    const others = sessions.filter((s) => !s.current);
    if (others.length === 0) {
      showToast("You're only signed in on this browser.");
      return;
    }
    setSessions(sessions.filter((s) => s.current));
    persist("zoiko_other_sessions", "[]");
    if (token) {
      fetch(`${SECURITY_URL}sessions/revoke-others/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      }).catch(() => {});
    }
    showToast("Signed out of all other sessions.");
  };

  const toggleSmsBackup = () => {
    const next = !smsBackupEnabled;
    setSmsBackupEnabled(next);
    persist("zoiko_sms_backup", String(next));
    showToast(next ? "Text message codes added as a backup." : "Text message codes removed.");
  };

  const submitReport = async () => {
    const note = reportNote.trim();
    if (!note || note.length < 10) {
      showToast("Please provide at least 10 characters describing the issue.");
      return;
    }
    if (token) {
      await fetch(`${SECURITY_URL}report/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      }).catch(() => {});

      await fetch(`${API_BASE}/api/support/tickets/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "security",
          subject: "Suspicious Activity Report",
          message: note,
        }),
      }).catch(() => {});
    }
    setReportNote("");
    setModal(null);
    showToast("Report submitted. Our security team treats this as urgent.");
  };

  const twoFAStatus = twoFAEnabled;
  const hasBackup = backupCodes.length > 0;
  const contactLine = [maskEmail(email), phone ? maskPhone(phone) : ""].filter(Boolean).join(" · ");
  const otherSessionsCount = sessions.filter((s) => !s.current).length;

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-3 sm:p-5">
      {toast && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 bg-[#0D1935] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={numbersCount}
            planName={planName || "No active plan"}
            renewDate={planName ? "monthly" : "—"}
          />
        </div>

        {/* Main */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          <DashboardTopNav
            userName={userName}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Security & settings"
            customSubtitle="How you sign in, where you’re signed in, and how we contact you."
          />

          {/* Freshness */}
          <div className="flex items-center gap-2 text-xs text-[#54617E]">
            <Clock className="w-3.5 h-3.5" />
            <span>Security information checked {checkedAt || "just now"}</span>
            <button
              type="button"
              onClick={() => loadData(true)}
              title="Refresh"
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Backup banner - 2FA authenticator backup (Temporarily commented out)
          {!hasBackup && (
            <div className="relative overflow-hidden rounded-[20px] px-5 sm:px-6 py-5 bg-gradient-to-r from-[#0D1935] via-[#16224A] to-[#3A1D4F] flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="pointer-events-none absolute -right-6 -top-12 w-52 h-52 rounded-full bg-[#E01C5B]/20" />
              <ShieldCheck className="pointer-events-none hidden md:block absolute right-10 top-2 w-24 h-24 text-white/25" />
              <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] flex items-center justify-center shrink-0 relative z-10">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-7">
                  Add a backup way to sign in
                </h2>
                <p className="text-xs text-white/85 leading-5 max-w-[640px]">
                  If you lose the phone with your authenticator app, backup codes let you get back in without
                  relying on text messages.
                </p>
              </div>
              <button
                type="button"
                onClick={startBackupCodes}
                className="relative z-10 h-9 px-3.5 bg-white hover:bg-white/90 rounded-[10px] text-xs font-semibold text-[#0D1935] transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                Set up backup codes
              </button>
            </div>
          )}
          */}

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {/* Account security */}
            <div className={CARD}>
              <CardHeader icon={ShieldCheck} title="Account security" subtitle="Checked by our security service" />
              {/* 2FA - Two-step verification (Temporarily commented out)
              <Row
                first
                icon={Key}
                title="Two-step verification"
                subtitle={twoFAStatus ? "Required every time you sign in" : "Not turned on"}
                right={
                  twoFAStatus ? (
                    <Pill tone="green">
                      <Check className="w-3 h-3" /> On
                    </Pill>
                  ) : (
                    <Pill tone="amber">
                      <AlertTriangle className="w-3 h-3" /> Off
                    </Pill>
                  )
                }
                onClick={() => setModal("twofa")}
              />
              */}
              <Row
                first
                icon={Lock}
                title="Password"
                subtitle={
                  passwordChangedAt
                    ? `Last changed ${formatDate(new Date(passwordChangedAt))}`
                    : "Change it regularly to stay safe"
                }
                right={<span className="text-xs font-semibold text-[#0D1935]">Change</span>}
                onClick={() => router.push("/dashboard/edit-profile")}
              />
              <Row
                icon={FileText}
                title="Backup codes"
                subtitle={hasBackup ? `${backupCodes.length} codes saved` : "Not set up"}
                right={
                  hasBackup ? (
                    <Pill tone="green">
                      <Check className="w-3 h-3" /> Saved
                    </Pill>
                  ) : (
                    <Pill tone="amber">
                      <AlertTriangle className="w-3 h-3" /> Set up
                    </Pill>
                  )
                }
                onClick={startBackupCodes}
              />
              <Row
                icon={Mail}
                title="Recovery contacts"
                subtitle={contactLine || "Not added"}
                right={
                  email ? (
                    <Pill tone="green">
                      <Check className="w-3 h-3" /> Verified
                    </Pill>
                  ) : (
                    <Pill tone="amber">Add</Pill>
                  )
                }
                onClick={() => router.push("/dashboard/edit-profile")}
              />
              <Row
                icon={Monitor}
                title="Where you’re signed in"
                subtitle={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
                right={<span className="text-xs font-semibold text-[#0D1935]">Review</span>}
                onClick={() =>
                  document.getElementById("signed-in")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
            </div>

            {/* Sign-in methods */}
            <div className={CARD}>
              <CardHeader icon={Fingerprint} title="Sign-in methods" subtitle="How you prove it’s you" />
              {/* 2FA - Authenticator app (Temporarily commented out)
              <div
                className={`p-3 rounded-2xl border flex items-center gap-3 ${
                  twoFAStatus ? "bg-[#FDF2F6] border-[#F8C9D9]" : "border-[#E6E8EE]"
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-xl border border-[#E6E8EE] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#0D1935] leading-5">Authenticator app</div>
                  <div className="text-xs text-[#54617E] leading-4">
                    {twoFAStatus ? "Used for every sign-in" : "Not set up yet"}
                  </div>
                </div>
                {twoFAStatus ? (
                  <Pill tone="green">
                    <Check className="w-3 h-3" /> Main method
                  </Pill>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModal("twofa")}
                    className="h-9 px-3.5 rounded-[10px] bg-[#E01C5B] text-white text-xs font-semibold cursor-pointer"
                  >
                    Set up
                  </button>
                )}
              </div>
              <div className="flex justify-end pt-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => setModal("twofa")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#BA1248] hover:underline cursor-pointer"
                >
                  Manage authenticator <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              */}
              <div className="p-3 rounded-2xl border border-[#E6E8EE] flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl border border-[#E6E8EE] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#0D1935] leading-5">Text message codes</div>
                  <div className="text-xs text-[#54617E] leading-4">
                    {phone ? `${maskPhone(phone)} · ` : ""}
                    {smsBackupEnabled ? "backup only, not for big changes" : "Not in use"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSmsBackup}
                  className="h-9 px-3.5 rounded-[10px] bg-[#F6F7FA] hover:bg-slate-200 text-xs font-semibold text-[#0D1935] transition cursor-pointer shrink-0"
                >
                  {smsBackupEnabled ? "Remove" : "Add"}
                </button>
              </div>
              <div className="pt-2">
                <div className="p-3 rounded-2xl border border-[#E6E8EE] flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl border border-[#E6E8EE] flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5 text-[#E01C5B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0D1935] leading-5">Passkeys</div>
                    <div className="text-xs text-[#54617E] leading-4">Not available yet</div>
                  </div>
                  <Pill tone="grey">Coming later</Pill>
                </div>
              </div>
              <div className="pt-2.5 flex items-start gap-1.5 text-xs text-[#54617E]">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Face ID and fingerprint unlock passkeys on your own device. We never receive your biometrics.</span>
              </div>
            </div>

            {/* Account settings */}
            <div className={CARD}>
              <CardHeader icon={User} title="Account settings" subtitle="Your details and preferences" />
              <Row
                first
                icon={User}
                title="Personal details"
                subtitle={`${userName} · email${phone ? " and mobile" : ""}`}
                onClick={() => router.push("/dashboard/edit-profile")}
              />
              <Row
                icon={Home}
                title="Billing address"
                subtitle="Managed in Bills & payments"
                onClick={() => router.push("/dashboard/bills-and-payments")}
              />
              <Row
                icon={Mail}
                title="Marketing choices"
                subtitle={
                  offerEmail || offerText
                    ? `Marketing by ${[offerEmail && "email", offerText && "text"].filter(Boolean).join(" and ")}`
                    : "No marketing messages"
                }
                onClick={() =>
                  document.getElementById("notifications")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
              <Row icon={Globe} title="Language and region" subtitle="English (UK) · United Kingdom" />
              <Row icon={Accessibility} title="Accessibility" subtitle="Default display" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {/* Where you're signed in */}
            <div id="signed-in" className={CARD}>
              <CardHeader
                icon={Monitor}
                title="Where you’re signed in"
                subtitle="Sign-ins to your account, not your phones or SIMs"
              />
              {sessions.map((s, idx) => (
                <div
                  key={s.id}
                  className={`py-2.5 flex items-center gap-3 ${idx === 0 ? "" : "border-t border-[#EEF0F4]"}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F6F7FA] flex items-center justify-center shrink-0">
                    {s.kind === "mobile" ? (
                      <Smartphone className="w-5 h-5 text-[#1E2D4D]" />
                    ) : (
                      <Monitor className="w-5 h-5 text-[#1E2D4D]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0D1935] leading-5">
                      {s.label}
                      {s.current ? " · this browser" : ""}
                    </div>
                    <div className="text-xs text-[#54617E] leading-4">
                      {s.location} · {s.lastActive}
                    </div>
                    <div className="text-xs text-[#54617E] leading-4">Signed in {s.signedIn}</div>
                  </div>
                  {s.current ? (
                    <Pill tone="green">This browser</Pill>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signOutSession(s.id)}
                      className="h-9 px-3.5 rounded-[10px] bg-white border border-[#F8C9D9] text-xs font-semibold text-[#BA1248] hover:bg-[#FDF2F6] cursor-pointer shrink-0"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))}
              <div className="pt-3.5 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={signOutEverywhereElse}
                  disabled={otherSessionsCount === 0}
                  className="h-9 px-3.5 rounded-[10px] bg-[#F6F7FA] hover:bg-slate-200 text-xs font-semibold text-[#0D1935] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign out everywhere else
                </button>
                <Link
                  href="/dashboard/sim-and-esim"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#BA1248] hover:underline"
                >
                  SIMs and eSIMs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="pt-2 flex items-start gap-1.5 text-xs text-[#54617E]">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Locations are estimates. Signing out ends the session; it doesn’t lock a phone.</span>
              </div>
            </div>

            {/* Notifications */}
            <div id="notifications" className={CARD}>
              <CardHeader icon={Bell} title="Notifications" subtitle="Essential messages stay on" />
              <Row
                first
                icon={ShieldCheck}
                title="Security alerts"
                subtitle="New sign-ins, password and method changes · email and text"
                right={
                  <Pill tone="grey">
                    <Lock className="w-3 h-3" /> Always on
                  </Pill>
                }
              />
              <Row
                icon={CreditCard}
                title="Bills and service"
                subtitle="Bills, payments and network notices · email"
                right={
                  <Pill tone="grey">
                    <Lock className="w-3 h-3" /> Always on
                  </Pill>
                }
              />
              <Row
                icon={BarChart2}
                title="Usage alerts"
                subtitle="At 80% of your data · optional"
                right={
                  <Toggle
                    label="Usage alerts"
                    on={usageAlerts}
                    onChange={() => {
                      const next = !usageAlerts;
                      setUsageAlerts(next);
                      persist("zoiko_usage_alerts", String(next));
                      showToast(next ? "Usage alerts on." : "Usage alerts off.");
                    }}
                  />
                }
              />
              <div className="pt-2 pb-1 border-t border-[#EEF0F4] flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F6F7FA] flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-[#1E2D4D]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0D1935] leading-5">Offers and promotions</div>
                    <div className="text-xs text-[#54617E] leading-4">Marketing · only if you choose</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-11">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#3B4866]">
                    Email
                    <Toggle
                      label="Offer emails"
                      on={offerEmail}
                      onChange={() => {
                        const next = !offerEmail;
                        setOfferEmail(next);
                        persist("zmuk_offers_marketing_email", String(next));
                      }}
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#3B4866]">
                    Text
                    <Toggle
                      label="Offer texts"
                      on={offerText}
                      onChange={() => {
                        const next = !offerText;
                        setOfferText(next);
                        persist("zmuk_offers_marketing_text", String(next));
                      }}
                    />
                  </label>
                </div>
                <div className="pl-11 text-xs font-semibold text-[#54617E]">App · not available</div>
              </div>
            </div>

            {/* Privacy */}
            <div className={CARD}>
              <CardHeader icon={Eye} title="Privacy and your data" subtitle="Your rights and choices" />
              <Row
                first
                icon={FileText}
                title="Privacy notice"
                subtitle="How we use your information"
                onClick={() => router.push("/privacy-policy")}
              />
              <Row icon={Cookie} title="Cookie choices" subtitle={cookieChoice} onClick={() => setModal("cookies")} />
              <Row
                icon={Download}
                title="Get a copy of your data"
                subtitle="We’ll open a request and reply within a month"
                onClick={() => setModal("data")}
              />
              <Row
                icon={ArrowLeftRight}
                title="Correct or object"
                subtitle="Fix your details or object to a use"
                onClick={() => router.push("/dashboard/support")}
              />
              {/* PREVIOUS CODE (PRESERVED AS COMMENTS):
              <Row
                icon={Trash2}
                title="Close your account"
                subtitle="Options for your service, login and data"
                onClick={() => setModal("close")}
              />
              */}
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {/* Connected sign-ins */}
            <div className={CARD}>
              <CardHeader icon={Link2} title="Connected sign-ins" subtitle="Other accounts you can sign in with" />
              <div className="py-1.5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDF2F6] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-[#E01C5B]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0D1935] leading-5">Not available</div>
                  <div className="text-xs text-[#54617E] leading-5">
                    Signing in with Apple, Google or Microsoft isn’t offered. You sign in with your Zoiko email,
                    password{twoFAStatus ? " and authenticator app" : ""}.
                  </div>
                </div>
              </div>
              <Row icon={Link2} title="Apps with access to your account" subtitle="None" />
            </div>

            {/* Account tools */}
            <div className={CARD}>
              <CardHeader icon={Settings} title="Account tools" subtitle="These open their own secure steps" />
              <div className="flex flex-col gap-2">
                {[
                  {
                    icon: ArrowLeftRight,
                    title: "Leave Zoiko (PAC or STAC)",
                    sub: "Keep or end your number",
                    href: "/dashboard/support",
                  },
                  {
                    icon: Cpu,
                    title: "Manage SIM or eSIM",
                    sub: "Replace, swap or suspend",
                    href: "/dashboard/sim-and-esim",
                  },
                  {
                    icon: Gauge,
                    title: "Mobile bill limit",
                    sub: billLimit !== null ? `Currently £${billLimit.toFixed(2)}` : "No limit set",
                    href: "/dashboard/bills-and-payments",
                  },
                  {
                    icon: Smartphone,
                    title: "Change my number",
                    sub: "Through support",
                    href: "/dashboard/support",
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <Link
                      key={t.title}
                      href={t.href}
                      className="p-3 bg-[#FDF2F6] hover:bg-[#FBE5EE] rounded-xl flex items-center gap-2.5 transition"
                    >
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#E01C5B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#0D1935] leading-5">{t.title}</div>
                        <div className="text-xs font-medium text-[#54617E] leading-4">{t.sub}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8A94A6] shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Help */}
            <div className={CARD}>
              <CardHeader icon={HelpCircle} title="Help with security" subtitle="Guides and urgent support" />
              <Row
                first
                icon={MessageCircle}
                title="Security guides"
                subtitle="Spotting scams and SIM-swap warning signs"
                onClick={() => router.push("/dashboard/support")}
              />
              <Row
                icon={AlertTriangle}
                title="Report suspicious activity"
                subtitle="We treat these as urgent"
                onClick={() => setModal("report")}
              />
              <Row
                icon={Headphones}
                title="Contact support"
                subtitle="We’ll never ask for your password or codes"
                onClick={() => router.push("/dashboard/support")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "backup" && (
        <Modal title="Your backup codes" onClose={() => setModal(null)}>
          <p className="text-xs text-[#54617E] mb-3">
            Each code works once. Save them somewhere safe — they’re shown only now.
          </p>
          <div className="grid grid-cols-2 gap-2 p-3 bg-[#F6F7FA] rounded-2xl font-mono text-sm text-[#0D1935]">
            {newCodes.map((c) => (
              <span key={c} className="text-center py-1">
                {c}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(newCodes.join("\n")).catch(() => {});
                showToast("Codes copied to clipboard.");
              }}
              className="h-9 px-3.5 rounded-[10px] border border-[#E6E8EE] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              type="button"
              onClick={saveBackupCodes}
              className="h-9 px-4 rounded-[10px] bg-[#E01C5B] hover:bg-[#C81650] text-white text-xs font-semibold cursor-pointer"
            >
              I’ve saved them
            </button>
          </div>
        </Modal>
      )}

      {/* 2FA - Two-step verification modal (Temporarily commented out)
      {modal === "twofa" && (
        <Modal title="Two-step verification" onClose={() => setModal(null)}>
          <p className="text-xs text-[#54617E] mb-4">
            {twoFAStatus
              ? "Two-step verification is on. Turning it off makes your account easier to break into."
              : "Use an authenticator app to add a code to every sign-in. This is the strongest protection for your account."}
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="h-9 px-3.5 rounded-[10px] border border-[#E6E8EE] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={toggle2FA}
              className={`h-9 px-4 rounded-[10px] text-white text-xs font-semibold cursor-pointer ${
                twoFAStatus ? "bg-red-600 hover:bg-red-700" : "bg-[#E01C5B] hover:bg-[#C81650]"
              }`}
            >
              {twoFAStatus ? "Turn off" : "Turn on"}
            </button>
          </div>
        </Modal>
      )}
      */}

      {modal === "report" && (
        <Modal title="Report suspicious activity" onClose={() => setModal(null)}>
          <textarea
            rows={4}
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Describe what looked off (minimum 10 characters: unfamiliar sign-in, unexpected SIM change)…"
            className="w-full px-3.5 py-2.5 bg-[#F6F7FA] border border-[#E6E8EE] rounded-xl text-sm outline-none focus:border-[#E01C5B] focus:bg-white resize-none"
          />
          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="h-9 px-3.5 rounded-[10px] border border-[#E6E8EE] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={reportNote.trim().length < 10}
              className="h-9 px-4 rounded-[10px] bg-[#E01C5B] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              Submit report
            </button>
          </div>
        </Modal>
      )}

      {modal === "data" && (
        <Modal title="Get a copy of your data" onClose={() => setModal(null)}>
          <p className="text-xs text-[#54617E] mb-4">
            We’ll open a formal GDPR request for {email || "your account"} and send a secure archive to your email.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="h-9 px-3.5 rounded-[10px] border border-[#E6E8EE] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (token) {
                  await fetch(`${API_BASE}/api/support/tickets/`, {
                    method: "POST",
                    headers: {
                      Authorization: `Token ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      category: "privacy",
                      subject: "GDPR Data Copy Request",
                      message: `Customer requested a complete copy of personal and account data for ${email || "user"}.`,
                    }),
                  }).catch(() => {});
                }
                setModal(null);
                showToast("Data request opened. We’ll email you within a month.");
              }}
              className="h-9 px-4 rounded-[10px] bg-[#E01C5B] text-white text-xs font-semibold cursor-pointer"
            >
              Open request
            </button>
          </div>
        </Modal>
      )}

      {modal === "cookies" && (
        <Modal title="Cookie choices" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-2">
            {["Essential cookies only", "Essential and analytics", "All cookies"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setCookieChoice(opt);
                  persist("zoiko_cookie_choice", opt);
                  setModal(null);
                  showToast(`Cookie choice saved: ${opt}.`);
                }}
                className={`p-3 rounded-xl border text-left text-sm font-semibold flex items-center justify-between cursor-pointer ${
                  cookieChoice === opt ? "border-[#E01C5B] bg-[#FDF2F6] text-[#E01C5B]" : "border-[#E6E8EE]"
                }`}
              >
                {opt}
                {cookieChoice === opt && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* PREVIOUS CODE (PRESERVED AS COMMENTS):
      {modal === "close" && (
        <Modal title="Close your account" onClose={() => setModal(null)}>
          <p className="text-xs text-[#54617E] mb-4">
            Closing your account ends your login. If you want to keep your number, request a PAC code first. Our
            support team will walk you through the options for your service and data.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="h-9 px-3.5 rounded-[10px] border border-[#E6E8EE] text-xs font-semibold cursor-pointer"
            >
              Keep my account
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/support")}
              className="h-9 px-4 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
            >
              Contact support
            </button>
          </div>
        </Modal>
      )}
      */}
    </div>
  );
}

/* ============================================================================
 * OLD CODE (previous version, kept for reference — not used)
 * ============================================================================

"use client";

import { useEffect, useState } from "react";
import {
  FaShieldAlt,
  FaKey,
  FaHistory,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/security/`;

interface Toast {
  msg: string;
  type: "success" | "error" | "";
}

interface LoginEntry {
  id: number;
  device: string;
  location: string;
  time: string;
}

export default function SecurityPage() {
  const [token, setToken] = useState<string>("");
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(false);
  const [twoFALoading, setTwoFALoading] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportNote, setReportNote] = useState<string>("");
  const [toast, setToast] = useState<Toast>({ msg: "", type: "" });

  // Demo login history — replace with API result when ready.
  const loginHistory: LoginEntry[] = [
    { id: 1, device: "Chrome on Windows 11", location: "Bangalore, IN", time: "Today, 09:42" },
    { id: 2, device: "Safari on iPhone", location: "Bangalore, IN", time: "Yesterday, 21:18" },
    { id: 3, device: "Firefox on macOS", location: "Mumbai, IN", time: "12 May, 14:05" },
  ];

  // ── Load token (optional — auth gating disabled) ──
  useEffect(() => {
    const storedToken =
      localStorage.getItem("zoiko_token") ||
      localStorage.getItem("driverx_token") ||
      "";
    setToken(storedToken);

    const stored2FA = localStorage.getItem("driverx_2fa") === "true";
    setTwoFAEnabled(stored2FA);
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Toggle 2FA ──
  const toggle2FA = async () => {
    setTwoFALoading(true);
    try {
      const res = await fetch(`${BASE_URL}two-fa/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: !twoFAEnabled }),
      });

      if (res.ok) {
        const next = !twoFAEnabled;
        setTwoFAEnabled(next);
        localStorage.setItem("driverx_2fa", String(next));
        showToast(
          next
            ? "Two-factor authentication enabled."
            : "Two-factor authentication disabled.",
          "success"
        );
      } else {
        // Optimistic UI fallback so the page still feels responsive in dev.
        const next = !twoFAEnabled;
        setTwoFAEnabled(next);
        localStorage.setItem("driverx_2fa", String(next));
        showToast(
          next ? "2FA enabled (local)." : "2FA disabled (local).",
          "success"
        );
      }
    } catch {
      // Same optimistic fallback for network errors during development.
      const next = !twoFAEnabled;
      setTwoFAEnabled(next);
      localStorage.setItem("driverx_2fa", String(next));
      showToast(
        next ? "2FA enabled (offline)." : "2FA disabled (offline).",
        "success"
      );
    }
    setTwoFALoading(false);
  };

  // ── Report suspicious activity ──
  const submitReport = async () => {
    if (!reportNote.trim()) {
      showToast("Please describe the suspicious activity first.", "error");
      alert("Please describe the suspicious activity first.");
      return;
    }
    setReportLoading(true);
    try {
      const res = await fetch(`${BASE_URL}report/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: reportNote }),
      });

      if (res.ok) {
        showToast("Report submitted. Our team will review it shortly.", "success");
        alert("Report submitted. Our team will review it shortly.");
        setReportNote("");
      } else {
        showToast("Report received. We'll follow up by email.", "success");
        alert("Report received. We'll follow up by email.");
        setReportNote("");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
      alert("Network error. Please try again.");
    }
    setReportLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Page Header *\/}
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold">Security</h4>
          </div>

          {/* Toast *\/}
          {toast.msg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded mb-6 border text-sm ${
              toast.type === "success"
                ? "bg-green-50 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}>
              {toast.type === "success"
                ? <FaCheckCircle className="text-green-500" />
                : <FaExclamationCircle className="text-red-500" />
              }
              {toast.msg}
            </div>
          )}

          {/* Two-Factor Authentication *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaShieldAlt />
              </div>
              <h5 className="font-semibold text-base">Two-Factor Authentication</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Add an extra layer of protection by requiring a verification code
              in addition to your password when you sign in.
            </p>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
              <div>
                <p className="text-sm font-medium">
                  {twoFAEnabled ? "2FA is currently ON" : "2FA is currently OFF"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {twoFAEnabled
                    ? "You'll be asked for a verification code on new sign-ins."
                    : "We recommend enabling 2FA for better account security."}
                </p>
              </div>
              <button
                onClick={toggle2FA}
                disabled={twoFALoading}
                className={`px-4 py-1.5 text-sm rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  twoFAEnabled
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {twoFALoading
                  ? "Working..."
                  : twoFAEnabled
                  ? "Disable 2FA"
                  : "Enable 2FA"}
              </button>
            </div>
          </div>

          {/* Change Password CTA *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaKey />
              </div>
              <h5 className="font-semibold text-base">Change Password</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You can update your password from the Edit Profile page.
            </p>

            <div className="flex gap-3 flex-wrap">
              <a
                href="/dashboard/edit-profile"
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Edit Profile
              </a>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Login History *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaHistory />
              </div>
              <h5 className="font-semibold text-base">Login History</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Recent sign-in activity on your account.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 font-medium">Device</th>
                    <th className="py-2 font-medium">Location</th>
                    <th className="py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <td className="py-3">{entry.device}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{entry.location}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Suspicious Activity *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-red-500 text-xl">
                <FaExclamationTriangle />
              </div>
              <h5 className="font-semibold text-base">Report Suspicious Activity</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Noticed a login you don&apos;t recognise, or anything unusual? Tell
              us about it and our team will investigate.
            </p>

            <textarea
              rows={4}
              placeholder="Describe what looked off (e.g. unfamiliar device, unexpected password reset email)..."
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none mb-4"
            />

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={submitReport}
                disabled={reportLoading}
                className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>
              <button
                onClick={() => setReportNote("")}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

*/

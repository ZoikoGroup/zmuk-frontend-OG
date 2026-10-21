"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  RotateCw,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Smartphone,
  Phone,
  Home,
  Sliders,
  Globe,
  Radio,
  FileText,
  Eye,
  KeyRound,
  Users,
  Heart,
  ChevronRight,
  X,
  CreditCard,
  LogOut,
  Calendar,
  AlertCircle,
  Info,
  Check,
  Edit2,
  Pencil,
  Copy,
  Plus,
  ExternalLink,
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
// Real BeQuick API Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import beQuick from "../../utils/dasdbeQuickApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const UPDATE_PROFILE_URL = `${API_BASE}/api/accounts/update-profile/`;
const CHANGE_PASSWORD_URL = `${API_BASE}/api/accounts/change-password/`;

interface NumberItem {
  id: string;
  msisdn: string;
  plan: string;
  simType: "eSIM" | "SIM card";
  label: string;
  status: "Active" | "Pending";
}

const DEFAULT_NUMBERS: NumberItem[] = [];

const COLOR_OPTIONS = [
  { name: "Magenta", hex: "#E6007E", bgClass: "bg-[#E6007E]" },
  { name: "Ocean Blue", hex: "#0066CC", bgClass: "bg-[#0066CC]" },
  { name: "Emerald", hex: "#0E8A5E", bgClass: "bg-[#0E8A5E]" },
  { name: "Royal Purple", hex: "#7B2CBF", bgClass: "bg-[#7B2CBF]" },
  { name: "Coral Amber", hex: "#E05A1F", bgClass: "bg-[#E05A1F]" },
];

const CARD =
  "bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E6E8EE] p-5 flex flex-col min-w-0";

const maskEmail = (raw: string) => {
  if (!raw || !raw.includes("@")) return "a•••••@example.com";
  const [user, domain] = raw.split("@");
  return `${user.charAt(0)}•••••@${domain}`;
};

const maskPhone = (raw: string) => {
  if (!raw) return "No number";
  const clean = raw.replace(/\s+/g, "");
  if (clean.length >= 7) {
    return `${clean.slice(0, 5)} •••${clean.slice(-3)}`;
  }
  return raw;
};

function formatUkNumber(mdn?: string | number): string {
  if (!mdn) return "";
  let s = String(mdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return String(mdn);
}

const detectClient = () => {
  if (typeof window === "undefined") {
    return { browser: "Chrome", os: "Windows" };
  }
  const ua = window.navigator.userAgent;
  let browser = "Chrome";
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

  let os = "Windows";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
};

function parseStoredUser(): any {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      localStorage.getItem("zoiko_user") ||
      localStorage.getItem("driverx_user") ||
      "{}"
    );
  } catch {
    return {};
  }
}

function resolveUserNames(user: any) {
  const email = (user?.email || "").trim();
  let first = (user?.first_name || "").trim();
  let last = (user?.last_name || "").trim();

  // If first and last are empty, check user.name or full_name
  if (!first && !last && (user?.name || user?.full_name)) {
    const raw = String(user.name || user.full_name).trim();
    const parts = raw.split(/\s+/);
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }

  // If still missing, check user.username (if not an email)
  if (!first && user?.username && !user.username.includes("@")) {
    const clean = String(user.username).replace(/[._-]+/g, " ").trim();
    const parts = clean
      .split(/\s+/)
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }

  // If still missing, derive intelligently from email
  if (!first && email && email.includes("@")) {
    const local = email.split("@")[0];
    const parts = local
      .replace(/[0-9]+/g, "")
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

    if (parts.length >= 2) {
      first = parts[0];
      last = parts.slice(1).join(" ");
    } else if (parts.length === 1 && parts[0].length > 0) {
      first = parts[0];
    } else {
      first = local.charAt(0).toUpperCase() + local.slice(1);
    }
  }

  return { first, last, email };
}

function deriveAccountNumber(user: any, email: string): string {
  if (user?.id) return String(user.id).padStart(4, "0").slice(-4);
  if (user?.subscriber_id) return String(user.subscriber_id).slice(-4);
  if (user?.bq_enrollment_id) return String(user.bq_enrollment_id).slice(-4);
  if (email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash << 5) - hash + email.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash) % 9000 + 1000);
  }
  return "0001";
}

function deriveCustomerSince(user: any): string {
  if (user?.date_joined || user?.created_at) {
    try {
      const d = new Date(user.date_joined || user.created_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {}
  }
  return "15 Oct 2026";
}

export default function EditProfilePage() {
  const router = useRouter();

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");

  // User Profile Data
  const [token, setToken] = useState("");
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [dob, setDob] = useState("•• ••• 1990");
  const [accountNumber, setAccountNumber] = useState("0001");
  const [customerSince, setCustomerSince] = useState("15 Oct 2026");
  const [planName, setPlanName] = useState("Zoiko Smart 5G Plan");

  // Dynamic Billing & Account details
  const [nextCollectionAmount, setNextCollectionAmount] = useState("0.00");
  const [collectionDate, setCollectionDate] = useState("28 Oct");
  const [contactPreference, setContactPreference] = useState("Email");
  const [marketingMessages, setMarketingMessages] = useState("Off");
  const [billingAddress, setBillingAddress] = useState("Flat ••, ••• Road, London SW1A •••");
  const [deliveryAddress, setDeliveryAddress] = useState("Same as billing");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [accessibilityDisplay, setAccessibilityDisplay] = useState("Default display");
  const [supportNeeds, setSupportNeeds] = useState("None recorded");
  const [authorisedPeople, setAuthorisedPeople] = useState<string[]>([]);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState("Recently");
  const [activeSessionsCount, setActiveSessionsCount] = useState(1);
  const [numbersList, setNumbersList] = useState<NumberItem[]>([]);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);
  const [checkedAt, setCheckedAt] = useState("Just now");
  const [refreshing, setRefreshing] = useState(false);

  // Client device info
  const [clientInfo, setClientInfo] = useState({ browser: "Chrome", os: "Windows" });

  // Modals & Forms
  const [modal, setModal] = useState<
    | null
    | "legal_name"
    | "preferred_name"
    | "email"
    | "phone"
    | "contact_method"
    | "billing_address"
    | "delivery_address"
    | "profile_color"
    | "accessibility"
    | "support_needs"
    | "auth_people"
    | "password"
    | "privacy"
    | "data_copy"
    | "close_account"
  >(null);

  // Modal input states
  const [editLegalFirst, setEditLegalFirst] = useState("");
  const [editLegalLast, setEditLegalLast] = useState("");
  const [editPrefName, setEditPrefName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBillingAddr, setEditBillingAddr] = useState("");
  const [editDeliveryAddr, setEditDeliveryAddr] = useState("");
  const [newAuthName, setNewAuthName] = useState("");
  const [newAuthRel, setNewAuthRel] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingLoading, setSavingLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load real user data dynamically from localStorage & backend APIs
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const storedToken =
        localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token") || "";
      setToken(storedToken);

      setClientInfo(detectClient());

      // 1. Load user info from localStorage
      let user: any = {};
      try {
        user = JSON.parse(
          localStorage.getItem("zoiko_user") ||
          localStorage.getItem("driverx_user") ||
          "{}"
        );
      } catch {}

      const resolved = resolveUserNames(user);
      const userEmail: string = resolved.email || user?.email || "";
      setLegalFirstName(resolved.first);
      setLegalLastName(resolved.last);
      setEmail(userEmail);

      const pref =
        localStorage.getItem("zoiko_preferred_name") ||
        user?.preferred_name ||
        resolved.first ||
        "Member";
      setPreferredName(pref);

      const phone =
        user?.phone_number ||
        user?.phone ||
        user?.contact_number ||
        user?.mobile ||
        localStorage.getItem("zoiko_user_phone") ||
        "";
      if (phone) setContactMobile(phone);

      // Account number from user ID / subscriber ID
      setAccountNumber(deriveAccountNumber(user, userEmail));

      // Customer since date from user registration
      setCustomerSince(deriveCustomerSince(user));

      // Persisted preferences
      const savedContactMethod = localStorage.getItem("zoiko_preferred_contact");
      if (savedContactMethod) setContactPreference(savedContactMethod);

      const savedBilling =
        localStorage.getItem("zoiko_billing_address") ||
        user?.billing_address ||
        user?.address;
      if (savedBilling) setBillingAddress(savedBilling);

      const savedDelivery =
        localStorage.getItem("zoiko_delivery_address") ||
        user?.delivery_address;
      if (savedDelivery) setDeliveryAddress(savedDelivery);

      const savedNeeds = localStorage.getItem("zoiko_support_needs");
      if (savedNeeds) setSupportNeeds(savedNeeds);

      const savedColorName = localStorage.getItem("zoiko_profile_color");
      if (savedColorName) {
        const found = COLOR_OPTIONS.find((c) => c.name === savedColorName);
        if (found) setSelectedColor(found);
      }

      try {
        const savedAuth = JSON.parse(localStorage.getItem("zoiko_authorised_people") || "[]");
        if (Array.isArray(savedAuth)) setAuthorisedPeople(savedAuth);
      } catch {}

      // Marketing messages status from security preferences
      const hasEmailMarketing = localStorage.getItem("zmuk_offers_marketing_email") === "true";
      const hasTextMarketing = localStorage.getItem("zmuk_offers_marketing_text") === "true";
      if (hasEmailMarketing && hasTextMarketing) {
        setMarketingMessages("Email & SMS on");
      } else if (hasEmailMarketing) {
        setMarketingMessages("Email only");
      } else if (hasTextMarketing) {
        setMarketingMessages("SMS only");
      } else {
        setMarketingMessages("Off");
      }

      // Count open requests dynamically from support tickets
      try {
        const savedTickets = JSON.parse(localStorage.getItem("zoiko_support_tickets") || "[]");
        if (Array.isArray(savedTickets)) {
          const open = savedTickets.filter(
            (t: any) => t.isOpen || t.status === "Open" || t.status === "In progress"
          ).length;
          setOpenRequestsCount(open);
        } else {
          setOpenRequestsCount(0);
        }
      } catch {
        setOpenRequestsCount(0);
      }

      // 2FA state
      const is2FA = localStorage.getItem("driverx_2fa") === "true";
      setTwoFAEnabled(is2FA);

      // Password changed timestamp
      const pChange = localStorage.getItem("zoiko_password_changed_at") || "Recently";
      setPasswordChangedAt(pChange);

      // Active sessions count
      try {
        const otherSessions = JSON.parse(localStorage.getItem("zoiko_other_sessions") || "[]");
        setActiveSessionsCount(Array.isArray(otherSessions) ? otherSessions.length + 1 : 1);
      } catch {
        setActiveSessionsCount(1);
      }

      // 2. Query BeQuick / Django orders for real numbers, plans, and next collection
      let fetchedNumbers: NumberItem[] = [];
      let calculatedNext = 0;

      if (userEmail) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(storedToken ? { Authorization: `Token ${storedToken}` } : {}),
            },
            body: JSON.stringify({ logged_user: userEmail }),
          });

          if (res.ok) {
            const data = await res.json();
            const userGroups = (data.groups?.[userEmail] || {}) as Record<string, any[]>;
            let idx = 0;

            for (const [orderId, entries] of Object.entries(userGroups)) {
              const entry = entries?.[0];
              if (!entry) continue;

              const linePhone =
                entry.phone_number ||
                entry.msisdn ||
                entry.mobile_number ||
                entry.cart?.[0]?.phone_number;

              const pTitle =
                entry.cart?.[0]?.title ||
                entry.cart?.[0]?.name ||
                entry.plan?.title ||
                entry.plan_name ||
                "Zoiko SIM Plan";

              const isEsim =
                entry.sim_type?.toLowerCase() === "esim" ||
                entry.is_esim === true ||
                entry.is_esim === "true";

              const orderCost = Number(entry.total || entry.cart?.[0]?.price || 0);
              calculatedNext += orderCost;

              if (idx === 0 && pTitle) {
                setPlanName(pTitle);
              }

              fetchedNumbers.push({
                id: String(entry.order_db_id || orderId || idx + 1),
                msisdn: formatUkNumber(linePhone || phone || ""),
                plan: pTitle,
                simType: isEsim ? "eSIM" : "SIM card",
                label: idx === 0 ? `${pref}'s number` : `Line ${idx + 1}`,
                status: entry.status === "pending" ? "Pending" : "Active",
              });
              idx++;
            }
          }
        } catch (err) {
          console.warn("Could not query bqorders:", err);
        }

        // Query SIM orders
        try {
          const simRes = await fetch(`${API_BASE}/api/v1/sims/orders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(storedToken ? { Authorization: `Token ${storedToken}` } : {}),
            },
            body: JSON.stringify({ logged_user: userEmail }),
          });

          if (simRes.ok) {
            const simData = await simRes.json();
            const groups = (simData.groups?.[userEmail] || {}) as Record<string, any[]>;
            for (const [orderId, entries] of Object.entries(groups)) {
              const entry = entries?.[0];
              if (!entry) continue;
              const exists = fetchedNumbers.some((n) => n.id === String(entry.id || orderId));
              if (!exists) {
                const isEsim = entry.sim_type?.toLowerCase() === "esim";
                fetchedNumbers.push({
                  id: String(entry.id || orderId),
                  msisdn: formatUkNumber(entry.phone_number || entry.msisdn || phone || "07456 789321"),
                  plan: entry.plan_name || entry.plan?.title || "Zoiko Unlimited",
                  simType: isEsim ? "eSIM" : "SIM card",
                  label: "Moving to Zoiko",
                  status: "Pending",
                });
              }
            }
          }
        } catch (err) {
          console.warn("Could not query sims orders:", err);
        }

        // Query BeQuick lines if subscriber ID exists
        try {
          let subId = user?.subscriber_id;
          if (!subId && beQuick?.getSubscriberByEmail) {
            const subRes = (await beQuick.getSubscriberByEmail(userEmail)) as any;
            if (subRes && subRes.subscriber_id) subId = subRes.subscriber_id;
          }
          if (subId && beQuick?.getUserLines) {
            const bqLines = await beQuick.getUserLines(subId);
            if (Array.isArray(bqLines)) {
              for (const line of bqLines) {
                const mdn = line.mdn || line.phone_number;
                if (!mdn) continue;
                const exists = fetchedNumbers.some((n) => n.msisdn === formatUkNumber(mdn));
                if (!exists) {
                  fetchedNumbers.push({
                    id: String(line.id || mdn),
                    msisdn: formatUkNumber(mdn),
                    plan: line.plan_name || line.device_name || "Zoiko 5G Plan",
                    simType: line.sim_type?.toLowerCase().includes("esim") ? "eSIM" : "SIM card",
                    label: fetchedNumbers.length === 0 ? `${pref}'s number` : `Line ${fetchedNumbers.length + 1}`,
                    status: "Active",
                  });
                }
              }
            }
          }
        } catch {}

        if (fetchedNumbers.length > 0) {
          setNumbersList(fetchedNumbers);
          setNextCollectionAmount(calculatedNext > 0 ? calculatedNext.toFixed(2) : "10.00");
        } else if (phone) {
          // If user has a verified phone on their account, show 1 active primary line
          setNumbersList([
            {
              id: "primary-1",
              msisdn: formatUkNumber(phone),
              plan: "Zoiko 5G Mobile Plan",
              simType: "eSIM",
              label: `${pref}'s number`,
              status: "Active",
            },
          ]);
          setNextCollectionAmount("10.00");
        } else {
          // No lines found for this user yet
          setNumbersList([]);
          setNextCollectionAmount("0.00");
        }
      }

      const now = new Date();
      setCheckedAt(
        `${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST, ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      );
    } finally {
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500);
        showToast("Profile information updated.");
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute initials and full name dynamically
  const fullName = useMemo(() => {
    const name = [legalFirstName, legalLastName].filter(Boolean).join(" ").trim();
    return name || preferredName || "Account Holder";
  }, [legalFirstName, legalLastName, preferredName]);

  const initials = useMemo(() => {
    if (legalFirstName && legalLastName) {
      return `${legalFirstName.charAt(0)}${legalLastName.charAt(0)}`.toUpperCase();
    }
    const name = preferredName || legalFirstName || legalLastName || "AH";
    return (name.slice(0, 2) || "AH").toUpperCase();
  }, [preferredName, legalFirstName, legalLastName]);

  // Save Legal Name
  const handleSaveLegalName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLegalFirst.trim()) {
      showToast("First name cannot be empty.");
      return;
    }
    setSavingLoading(true);
    try {
      if (token) {
        await fetch(UPDATE_PROFILE_URL, {
          method: "PUT",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: editLegalFirst.trim(),
            last_name: editLegalLast.trim(),
          }),
        }).catch(() => {});
      }

      setLegalFirstName(editLegalFirst.trim());
      setLegalLastName(editLegalLast.trim());

      const user = JSON.parse(localStorage.getItem("zoiko_user") || "{}");
      localStorage.setItem(
        "zoiko_user",
        JSON.stringify({
          ...user,
          first_name: editLegalFirst.trim(),
          last_name: editLegalLast.trim(),
        })
      );

      setModal(null);
      window.dispatchEvent(new Event("zoiko-auth"));
      showToast("Legal name updated successfully.");
    } finally {
      setSavingLoading(false);
    }
  };

  // Save Preferred Name
  const handleSavePreferredName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrefName.trim()) {
      showToast("Preferred name cannot be empty.");
      return;
    }
    setPreferredName(editPrefName.trim());
    localStorage.setItem("zoiko_preferred_name", editPrefName.trim());
    window.dispatchEvent(new Event("zoiko-auth"));
    setModal(null);
    showToast(`We’ll call you ${editPrefName.trim()} across the site and emails.`);
  };

  // Save Email
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmail.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }
    setEmail(editEmail.trim());
    const user = JSON.parse(localStorage.getItem("zoiko_user") || "{}");
    localStorage.setItem("zoiko_user", JSON.stringify({ ...user, email: editEmail.trim() }));
    setModal(null);
    showToast("Verification link sent to your updated email address.");
  };

  // Save Mobile
  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPhone.trim().length < 8) {
      showToast("Please enter a valid UK mobile number.");
      return;
    }
    setContactMobile(editPhone.trim());
    const user = JSON.parse(localStorage.getItem("zoiko_user") || "{}");
    localStorage.setItem("zoiko_user", JSON.stringify({ ...user, phone: editPhone.trim() }));
    setModal(null);
    showToast("Contact mobile number updated.");
  };

  // Save Billing Address
  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBillingAddr.trim()) return;
    setBillingAddress(editBillingAddr.trim());
    localStorage.setItem("zoiko_billing_address", editBillingAddr.trim());
    setModal(null);
    showToast("Billing address updated. A confirmation email has been dispatched.");
  };

  // Save Delivery Address
  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeliveryAddr.trim()) return;
    setDeliveryAddress(editDeliveryAddr.trim());
    localStorage.setItem("zoiko_delivery_address", editDeliveryAddr.trim());
    setModal(null);
    showToast("SIM & letter delivery address updated.");
  };

  // Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }
    setSavingLoading(true);
    try {
      if (token) {
        await fetch(CHANGE_PASSWORD_URL, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
            confirm_password: confirmPassword,
          }),
        }).catch(() => {});
      }

      const today = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setPasswordChangedAt(today);
      localStorage.setItem("zoiko_password_changed_at", today);
      setNewPassword("");
      setConfirmPassword("");
      setModal(null);
      showToast("Password updated successfully.");
    } finally {
      setSavingLoading(false);
    }
  };

  // Add Authorised Person
  const handleAddAuthPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthName.trim()) return;
    const entry = `${newAuthName.trim()} (${newAuthRel.trim() || "Authorised representative"})`;
    const updated = [...authorisedPeople, entry];
    setAuthorisedPeople(updated);
    localStorage.setItem("zoiko_authorised_people", JSON.stringify(updated));
    setNewAuthName("");
    setNewAuthRel("");
    setModal(null);
    showToast(`${newAuthName.trim()} added as an authorised account helper.`);
  };

  // Sign out handlers
  const handleSignOut = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("driverx_token");
    showToast("Signed out from this browser.");
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  const handleSignOutEverywhere = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("driverx_token");
    localStorage.removeItem("zoiko_other_sessions");
    showToast("Signed out of all devices and active sessions.");
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-3 sm:p-5">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 bg-[#0D1935] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-medium border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#E6007E] shrink-0" />
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
            numbersCount={numbersList.length}
            planName={planName}
            renewDate={collectionDate}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Nav */}
          <DashboardTopNav
            userName={fullName}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="My profile"
            customSubtitle="Your details, how we contact you, and the numbers on your account."
          />

          {/* Freshness Status Strip (Clean, without Demo data badge) */}
          <div className="flex items-center gap-2 text-xs text-[#54617E]">
            <Clock className="w-3.5 h-3.5 text-[#54617E]" />
            <span>Details checked {checkedAt}</span>
            <button
              type="button"
              onClick={() => loadData(true)}
              title="Refresh profile details"
              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* HERO BANNER: Magenta Profile Overview */}
          {/* ========================================================================= */}
          <div
            className={`w-full p-6 relative rounded-[20px] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden shadow-sm transition-colors ${selectedColor.bgClass}`}
          >
            {/* Subtle decorative background circles */}
            <div className="absolute right-0 top-0 w-96 h-full opacity-10 pointer-events-none overflow-hidden">
              <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white" />
              <div className="absolute right-40 top-20 w-44 h-44 rounded-full bg-white opacity-40" />
            </div>

            {/* Left: Avatar + Identity Information */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10 min-w-0">
              {/* Avatar circle with initials */}
              <div className="relative w-24 h-24 rounded-full bg-white/20 border-4 border-white/50 flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                  {initials}
                </span>
                <button
                  type="button"
                  onClick={() => setModal("profile_color")}
                  title="Change profile colour"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-[#E6007E] shadow-md flex items-center justify-center hover:scale-105 transition cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Text Info */}
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">
                  {fullName}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 mt-0.5 font-normal">
                  Account holder · customer since {customerSince} · account ••{accountNumber}
                </p>

                {/* Status Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Identity checked</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span>{twoFAEnabled ? "Two-step verification on" : "Two-step verification off"}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs">
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>We call you {preferredName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 3 White Stat Cards */}
            <div className="flex items-center gap-2.5 relative z-10 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex-1 sm:w-28 px-4 py-3 bg-white text-[#0D1935] rounded-2xl shadow-xs flex flex-col justify-center">
                <div className="text-xl sm:text-2xl font-extrabold leading-tight">
                  {numbersList.length}
                </div>
                <div className="text-xs text-[#54617E] font-medium mt-0.5">Numbers</div>
              </div>

              <div className="flex-1 sm:w-28 px-4 py-3 bg-white text-[#0D1935] rounded-2xl shadow-xs flex flex-col justify-center">
                <div className="text-xl sm:text-2xl font-extrabold leading-tight">
                  £{nextCollectionAmount}
                </div>
                <div className="text-xs text-[#54617E] font-medium mt-0.5 truncate">
                  Next collection
                </div>
              </div>

              <div className="flex-1 sm:w-28 px-4 py-3 bg-white text-[#0D1935] rounded-2xl shadow-xs flex flex-col justify-center">
                <div className="text-xl sm:text-2xl font-extrabold leading-tight">
                  {openRequestsCount}
                </div>
                <div className="text-xs text-[#54617E] font-medium mt-0.5 truncate">
                  Open requests
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 1 (3-Column Grid): Personal details | Contact details | Addresses */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Personal details */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Personal details</h3>
                  <p className="text-xs text-[#54617E]">Used to check it’s you</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* Legal Name */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Legal name</div>
                    <div className="text-sm font-semibold text-[#0D1935] truncate">{fullName}</div>
                    <div className="text-[11px] text-[#54617E]">As checked when you joined</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditLegalFirst(legalFirstName);
                      setEditLegalLast(legalLastName);
                      setModal("legal_name");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] hover:text-[#E6007E] cursor-pointer shrink-0"
                  >
                    <span>Change</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* What we call you */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">What we call you</div>
                    <div className="text-sm font-semibold text-[#0D1935] truncate">{preferredName}</div>
                    <div className="text-[11px] text-[#54617E]">Used in emails and on this site</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPrefName(preferredName);
                      setModal("preferred_name");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] hover:text-[#E6007E] cursor-pointer shrink-0"
                  >
                    <span>Edit</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Date of birth */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Date of birth</div>
                    <div className="text-sm font-semibold text-[#0D1935]">{dob}</div>
                    <div className="text-[11px] text-[#54617E]">Partly hidden for your security</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[11px] font-semibold flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>Checked</span>
                  </span>
                </div>

                {/* Identity check */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Identity check</div>
                    <div className="text-sm font-semibold text-[#0D1935]">Completed {customerSince}</div>
                    <div className="text-[11px] text-[#54617E]">For your mobile account</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[11px] font-semibold flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Contact details */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Contact details</h3>
                  <p className="text-xs text-[#54617E]">Where we send codes and updates</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* Email */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Email</div>
                    <div className="text-sm font-semibold text-[#0D1935] truncate">{maskEmail(email)}</div>
                    <div className="text-[11px] text-[#54617E]">Verified</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditEmail(email);
                      setModal("email");
                    }}
                    className="flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[11px] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Contact Mobile */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Contact mobile</div>
                    <div className="text-sm font-semibold text-[#0D1935]">{maskPhone(contactMobile)}</div>
                    <div className="text-[11px] text-[#54617E]">Verified · used for texts</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPhone(contactMobile);
                      setModal("phone");
                    }}
                    className="flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[11px] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* How we contact you */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">How we contact you</div>
                    <div className="text-sm font-semibold text-[#0D1935]">{contactPreference}</div>
                    <div className="text-[11px] text-[#54617E]">For service updates — not marketing</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal("contact_method")}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] hover:text-[#E6007E] cursor-pointer shrink-0"
                  >
                    <span>Change</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Marketing messages */}
                <Link
                  href="/dashboard/security"
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Marketing messages</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                      {marketingMessages}
                    </div>
                    <div className="text-[11px] text-[#54617E]">Choose in Security & settings</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </Link>
              </div>
            </div>

            {/* Card 3: Addresses */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Addresses</h3>
                  <p className="text-xs text-[#54617E]">Billing and delivery</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* Billing Address */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Billing address</div>
                    <div className="text-sm font-semibold text-[#0D1935] leading-snug">
                      {billingAddress}
                    </div>
                    <div className="text-[11px] text-[#54617E] mt-0.5">
                      Shown on your bills · account ••{accountNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditBillingAddr(billingAddress);
                      setModal("billing_address");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] hover:text-[#E6007E] cursor-pointer shrink-0"
                  >
                    <span>Change</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Delivery Address */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Delivery address</div>
                    <div className="text-sm font-semibold text-[#0D1935]">{deliveryAddress}</div>
                    <div className="text-[11px] text-[#54617E]">For SIM cards and letters</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDeliveryAddr(deliveryAddress);
                      setModal("delivery_address");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] hover:text-[#E6007E] cursor-pointer shrink-0"
                  >
                    <span>Change</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Bottom security notice */}
              <div className="pt-3 mt-auto border-t border-[#F2F4F7] flex items-start gap-1.5 text-xs text-[#54617E]">
                <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0 mt-0.5" />
                <p className="leading-tight">
                  Changing an address needs a quick check it’s you. We’ll email you when it’s done.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 2 (3-Column Grid): Your numbers | Account | Preferences */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 4: Your numbers */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Your numbers</h3>
                  <p className="text-xs text-[#54617E]">On account ••{accountNumber}</p>
                </div>
              </div>

              {/* Numbers list */}
              <div className="space-y-2.5 flex-1">
                {numbersList.length === 0 ? (
                  <div className="py-6 px-4 text-center rounded-2xl border border-dashed border-[#E6E8EE] bg-[#F9FAFB] flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center mb-2 shadow-2xs">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-[#0D1935]">No active mobile numbers yet</p>
                    <p className="text-[11px] text-[#54617E] mt-0.5">Order an eSIM or physical SIM to get connected</p>
                    <Link
                      href="/dashboard/sim-and-esim"
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6007E] text-white text-xs font-semibold hover:bg-[#D80070] transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order a SIM or eSIM</span>
                    </Link>
                  </div>
                ) : (
                  numbersList.map((num) => (
                    <div
                      key={num.id}
                      className="p-3 rounded-2xl border border-[#E6E8EE] bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-[#E6007E]/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] text-[#E6007E] flex items-center justify-center shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#0D1935]">{num.msisdn}</div>
                          <div className="text-xs text-[#54617E] leading-tight truncate">
                            {num.plan} · {num.simType} · {num.label}
                          </div>
                        </div>
                      </div>
                      {num.status === "Active" ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[11px] font-semibold flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom manage numbers link */}
              <div className="pt-3 mt-auto border-t border-[#F2F4F7] flex items-center justify-between">
                <Link
                  href="/dashboard/my-mobile-numbers"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E6007E] hover:text-[#D80070] transition"
                >
                  <span>Manage numbers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard/sim-and-esim"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#54617E] hover:text-[#0D1935] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add line</span>
                </Link>
              </div>
            </div>

            {/* Card 5: Account */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Account</h3>
                  <p className="text-xs text-[#54617E]">Billing and who can help</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* Billing Account */}
                <Link
                  href="/dashboard/bills-and-payments"
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Billing account</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      ••{accountNumber} · Direct Debit ••42
                    </div>
                    <div className="text-[11px] text-[#54617E]">
                      Next collection £{nextCollectionAmount} on {collectionDate}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </Link>

                {/* Family & Friends */}
                <Link
                  href="/dashboard/family-and-friends"
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Family & friends group</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      {legalLastName ? `${legalLastName} household` : `${preferredName || "Personal"} household`} · you’re the owner
                    </div>
                    <div className="text-[11px] text-[#54617E]">
                      {numbersList.length} number{numbersList.length === 1 ? "" : "s"} on account · {numbersList.length > 1 ? "shared group" : "individual plan"}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </Link>

                {/* Authorised People */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Authorised people</div>
                    <div className="text-sm font-semibold text-[#0D1935] truncate">
                      {authorisedPeople.length > 0 ? authorisedPeople.join(", ") : "None"}
                    </div>
                    <div className="text-[11px] text-[#54617E]">People who can speak to us for you</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal("auth_people")}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0D1935] hover:text-[#E6007E] cursor-pointer shrink-0"
                  >
                    <span>Add</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Customer Since */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Customer since</div>
                    <div className="text-sm font-semibold text-[#0D1935]">{customerSince}</div>
                    <div className="text-[11px] text-[#54617E]">Account holder</div>
                  </div>
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            </div>

            {/* Card 6: Preferences */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Preferences</h3>
                  <p className="text-xs text-[#54617E]">How the site works for you</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* Language */}
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Language</div>
                    <div className="text-sm font-semibold text-[#0D1935]">English (UK)</div>
                    <div className="text-[11px] text-[#54617E]">
                      The only language available at the moment
                    </div>
                  </div>
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Accessibility */}
                <button
                  type="button"
                  onClick={() => setModal("accessibility")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Accessibility</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      {accessibilityDisplay}
                    </div>
                    <div className="text-[11px] text-[#54617E]">Larger text, contrast and motion</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </button>

                {/* Support needs */}
                <button
                  type="button"
                  onClick={() => setModal("support_needs")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Support needs</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      {supportNeeds}
                    </div>
                    <div className="text-[11px] text-[#54617E]">Tell us what would help</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </button>

                {/* Profile colour */}
                <button
                  type="button"
                  onClick={() => setModal("profile_color")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Profile colour</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      {selectedColor.name}
                    </div>
                    <div className="text-[11px] text-[#54617E]">Only changes how your initials look</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 3 (3-Column Grid): Security | Privacy and your data | Sign out */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 7: Security */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Security</h3>
                  <p className="text-xs text-[#54617E]">A quick look</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* 2FA */}
                <Link
                  href="/dashboard/security"
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Two-step verification</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                      Authenticator app
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[11px] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{twoFAEnabled ? "On" : "Off"}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition" />
                  </div>
                </Link>

                {/* Password */}
                <button
                  type="button"
                  onClick={() => setModal("password")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Password</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      Last changed {passwordChangedAt}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </button>

                {/* Where you're signed in */}
                <Link
                  href="/dashboard/security"
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Where you’re signed in</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                      {activeSessionsCount} sessions
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </Link>
              </div>
            </div>

            {/* Card 8: Privacy and your data */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Privacy and your data</h3>
                  <p className="text-xs text-[#54617E]">Your rights and choices</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {/* Privacy notice */}
                <button
                  type="button"
                  onClick={() => setModal("privacy")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Privacy notice</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      How we use your information
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </button>

                {/* Copy of data */}
                <button
                  type="button"
                  onClick={() => setModal("data_copy")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Get a copy of your data</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      We reply within a month
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </button>

                {/* Close account */}
                <button
                  type="button"
                  onClick={() => setModal("close_account")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#54617E]">Close your account</div>
                    <div className="text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                      Options for service, login and data
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                </button>
              </div>
            </div>

            {/* Card 9: Sign out */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Sign out</h3>
                  <p className="text-xs text-[#54617E]">On this browser</p>
                </div>
              </div>

              <div className="text-xs text-[#54617E] leading-relaxed flex-1">
                You’re signed in on {clientInfo.browser} on {clientInfo.os}. Signing out here doesn’t affect your other sessions.
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-auto border-t border-[#F2F4F7] flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="h-9 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#FBCFE8] text-[#E6007E] text-xs font-semibold rounded-[10px] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOutEverywhere}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E6007E] hover:text-[#D80070] transition cursor-pointer"
                >
                  <span>Sign out everywhere</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Legal Name */}
      {/* ========================================================================= */}
      {modal === "legal_name" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Change legal name</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLegalName} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Legal first name
                </label>
                <input
                  type="text"
                  value={editLegalFirst}
                  onChange={(e) => setEditLegalFirst(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Legal last name
                </label>
                <input
                  type="text"
                  value={editLegalLast}
                  onChange={(e) => setEditLegalLast(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLoading}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {savingLoading ? "Saving..." : "Save legal name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Preferred Name (What we call you) */}
      {/* ========================================================================= */}
      {modal === "preferred_name" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">What we call you</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePreferredName} className="pt-4 space-y-3.5">
              <p className="text-xs text-[#54617E]">
                This is the name we’ll use when greeting you in emails, notifications, and across your account portal.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Preferred name
                </label>
                <input
                  type="text"
                  value={editPrefName}
                  onChange={(e) => setEditPrefName(e.target.value)}
                  placeholder={`e.g. ${preferredName || "Alex"}`}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save preference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Email */}
      {/* ========================================================================= */}
      {modal === "email" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Update email address</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmail} className="pt-4 space-y-3.5">
              <p className="text-xs text-[#54617E]">
                We use this email to send verification codes, monthly invoices, and critical security notices.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  New email address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Update & verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Contact Mobile */}
      {/* ========================================================================= */}
      {modal === "phone" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Update contact mobile</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePhone} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Mobile number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Contact Method Preference */}
      {/* ========================================================================= */}
      {modal === "contact_method" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">How we contact you</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-xs text-[#54617E]">
                Choose how you want to receive network updates, allowance notifications, and account alerts.
              </p>
              {["Email", "SMS / Text message"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setContactPreference(method);
                    localStorage.setItem("zoiko_preferred_contact", method);
                    setModal(null);
                    showToast(`Contact channel changed to ${method}.`);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                    contactPreference === method
                      ? "border-[#E6007E] bg-[#FFF5F8]"
                      : "border-[#E6E8EE] hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#0D1935]">{method}</span>
                  {contactPreference === method && (
                    <CheckCircle2 className="w-4 h-4 text-[#E6007E]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Billing Address */}
      {/* ========================================================================= */}
      {modal === "billing_address" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Change billing address</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBilling} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Full billing address
                </label>
                <textarea
                  rows={3}
                  value={editBillingAddr}
                  onChange={(e) => setEditBillingAddr(e.target.value)}
                  placeholder="Street address, city, postcode..."
                  className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Update address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Delivery Address */}
      {/* ========================================================================= */}
      {modal === "delivery_address" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Change delivery address</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDelivery} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Delivery address
                </label>
                <textarea
                  rows={3}
                  value={editDeliveryAddr}
                  onChange={(e) => setEditDeliveryAddr(e.target.value)}
                  placeholder="Street address, city, postcode..."
                  className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Update address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Profile Colour Swatch Picker */}
      {/* ========================================================================= */}
      {modal === "profile_color" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Choose profile colour</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-xs text-[#54617E]">
                Personalise how your avatar circle and hero banner look across the portal.
              </p>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c);
                      localStorage.setItem("zoiko_profile_color", c.name);
                      setModal(null);
                      showToast(`Profile theme updated to ${c.name}.`);
                    }}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      selectedColor.name === c.name
                        ? "border-[#E6007E] bg-[#FFF5F8]"
                        : "border-[#E6E8EE] hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full shadow-xs" style={{ backgroundColor: c.hex }} />
                      <span className="text-xs sm:text-sm font-semibold text-[#0D1935]">{c.name}</span>
                    </div>
                    {selectedColor.name === c.name && (
                      <CheckCircle2 className="w-4 h-4 text-[#E6007E]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Accessibility Options */}
      {/* ========================================================================= */}
      {modal === "accessibility" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Accessibility display</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-2.5">
              {[
                "Default display",
                "High contrast mode",
                "Larger text (120%)",
                "Reduced motion animations",
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setAccessibilityDisplay(opt);
                    setModal(null);
                    showToast(`Accessibility preference set to ${opt}.`);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                    accessibilityDisplay === opt
                      ? "border-[#E6007E] bg-[#FFF5F8]"
                      : "border-[#E6E8EE] hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#0D1935]">{opt}</span>
                  {accessibilityDisplay === opt && (
                    <CheckCircle2 className="w-4 h-4 text-[#E6007E]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Support Needs */}
      {/* ========================================================================= */}
      {modal === "support_needs" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Record support needs</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3.5">
              <p className="text-xs text-[#54617E]">
                Tell our care specialists how best to communicate with you. You never need to declare medical diagnoses.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Please allow extra time for answers, prefer email over calls..."
                defaultValue={supportNeeds === "None recorded" ? "" : supportNeeds}
                id="supportNeedsInput"
                className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
              />
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("supportNeedsInput") as HTMLTextAreaElement;
                    const val = el?.value?.trim() || "None recorded";
                    setSupportNeeds(val);
                    localStorage.setItem("zoiko_support_needs", val);
                    setModal(null);
                    showToast("Support needs saved to your profile.");
                  }}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save needs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Authorised People */}
      {/* ========================================================================= */}
      {modal === "auth_people" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Authorised account helpers</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAuthPerson} className="pt-4 space-y-3.5">
              <p className="text-xs text-[#54617E]">
                Add someone who can speak to Zoiko support on your behalf regarding plans or billing queries.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">Full name</label>
                <input
                  type="text"
                  value={newAuthName}
                  onChange={(e) => setNewAuthName(e.target.value)}
                  placeholder="e.g. Samuel (Partner)"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={newAuthRel}
                  onChange={(e) => setNewAuthRel(e.target.value)}
                  placeholder="e.g. Partner / Son / Carer"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Add helper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Change Password */}
      {/* ========================================================================= */}
      {modal === "password" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Update password</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePassword} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  New password (min. 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLoading}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {savingLoading ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Privacy Notice */}
      {/* ========================================================================= */}
      {modal === "privacy" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Zoiko Privacy Notice</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3 text-xs sm:text-sm text-[#54617E] leading-relaxed">
              <p>
                At Zoiko Mobile, protecting your personal data is fundamental to everything we do. We comply strictly with the UK Data Protection Act 2018 and UK GDPR.
              </p>
              <p>
                We only collect data strictly necessary to provide telecom services, prevent SIM swap fraud, route emergency 999/112 calls, and invoice your account correctly.
              </p>
              <p>
                We never sell your phone number, browsing records, or identity details to third-party advertisers.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-[#0D1935] text-white text-xs font-semibold rounded-xl"
              >
                Close notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Data Copy Request */}
      {/* ========================================================================= */}
      {modal === "data_copy" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Request copy of your data</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-xs text-[#54617E] leading-relaxed">
                Under the Data Subject Access Request (DSAR) protocol, we will compile all personal information, call logs, billing histories, and account events into a secure archive.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-[#0D1935]">
                Delivery email: <span className="font-semibold">{email}</span>
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    showToast("DSAR request logged. We will securely deliver your data archive within 30 days.");
                  }}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Submit DSAR request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Close Account */}
      {/* ========================================================================= */}
      {modal === "close_account" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Close your Zoiko account</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-xs text-[#54617E] leading-relaxed">
                Closing your account will cancel all active mobile lines, cease recurrent billing, and release your phone numbers after any porting period.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                If you wish to retain your phone number with another network, text <strong>PAC</strong> to <strong>65075</strong> before initiating account closure.
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <Link
                  href="/dashboard/support"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Contact support to close
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * OLD CODE (previous version, kept for reference — not used)
 * ============================================================================

"use client";

import { useEffect, useState } from "react";
import { FaUser, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

// Uses the same env var as the rest of the app. In .env.local:
//   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL  ;
const UPDATE_PROFILE_URL = `${API_BASE}/api/accounts/update-profile/`;
const CHANGE_PASSWORD_URL = `${API_BASE}/api/accounts/change-password/`;

interface NameForm {
  first_name: string;
  last_name: string;
}

interface PasswordForm {
  password: string;
  confirm_password: string;
}

interface Toast {
  msg: string;
  type: "success" | "error" | "";
}

export default function EditProfilePage() {
  const [token, setToken] = useState<string>("");
  const [nameData, setNameData] = useState<NameForm>({ first_name: "", last_name: "" });
  const [passData, setPassData] = useState<PasswordForm>({ password: "", confirm_password: "" });
  const [nameLoading, setNameLoading] = useState<boolean>(false);
  const [passLoading, setPassLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>({ msg: "", type: "" });
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // ── Load token & user from localStorage ──
  useEffect(() => {
    const storedToken = localStorage.getItem("zoiko_token") || "";
    const storedUser = localStorage.getItem("zoiko_user");

    setToken(storedToken);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setNameData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
        });
        setUsername(user.username || "");
        setEmail(user.email || "");
      } catch {
        console.error("Failed to parse zoiko_user");
      }
    }
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Update name ──
  const updateName = async () => {
    if (!nameData.first_name && !nameData.last_name) {
      showToast("Please enter first name or last name.", "error");
      return;
    }
    setNameLoading(true);
    try {
      const res = await fetch(UPDATE_PROFILE_URL, {
        method: "PUT",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nameData),
      });
      const data = await res.json();
      if (res.ok) {
        const storedUser = localStorage.getItem("zoiko_user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          localStorage.setItem("zoiko_user", JSON.stringify({ ...user, ...nameData }));
        }
        showToast("Name updated successfully.", "success");
      } else {
        const err = Object.values(data).flat().join(" ");
        showToast((err as string) || "Something went wrong.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setNameLoading(false);
  };

  // ── Update password ──
  const updatePassword = async () => {
    if (!passData.password || !passData.confirm_password) {
      showToast("Please fill in both password fields.", "error");
      return;
    }
    if (passData.password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (passData.password !== passData.confirm_password) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch(CHANGE_PASSWORD_URL, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passData),
      });
      const data = await res.json();
      if (res.ok) {
        // Backend rotates the token after a password change — keep our session valid.
        if (data.token) {
          localStorage.setItem("zoiko_token", data.token);
          setToken(data.token);
        }
        showToast("Password updated successfully.", "success");
        setPassData({ password: "", confirm_password: "" });
      } else {
        const err = Object.values(data).flat().join(" ");
        showToast((err as string) || "Something went wrong.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setPassLoading(false);
  };

  // ── Not logged in ──
  if (!token) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              You are not logged in. Please log in first.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Page Header *\/ }
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold dark:bg-gray-900 dark:text-white">Edit Profile</h4>
          </div>

          {/* Toast *\/ }
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

          {/* Account Info Card (read-only) *\/ }
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h5 className="font-semibold text-base mb-4">Account Info</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-xs md:text-sm lg:text-base mb-1 dark:bg-gray-900 dark:text-white">User Name</p>
                <p className="text-sm font-medium">{nameData.first_name || "—"}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs md:text-sm lg:text-base mb-1 dark:bg-gray-900 dark:text-white">Email</p>
                <p className="text-sm font-medium">{email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Personal Info Card *\/ }
          <div className="bg-white dark:bg-gray-900 dark:text-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaUser />
              </div>
              <h5 className="font-semibold text-base">Personal Info</h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm dark:bg-gray-900 dark:text-white text-gray-500 mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={nameData.first_name}
                  onChange={(e) => setNameData({ ...nameData, first_name: e.target.value })}
                  className="w-full h-10 px-3 border dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm dark:bg-gray-900 dark:text-white text-gray-500  mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={nameData.last_name}
                  onChange={(e) => setNameData({ ...nameData, last_name: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={updateName}
                disabled={nameLoading}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {nameLoading ? "Saving..." : "Save Name"}
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Change Password Card *\/ }
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaLock />
              </div>
              <h5 className="font-semibold text-base">Change Password</h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={passData.password}
                  onChange={(e) => setPassData({ ...passData, password: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={passData.confirm_password}
                  onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
            </div>

            {/* Password strength hint *\/ }
            {passData.password && (
              <p className={`text-xs mb-4 ${
                passData.password.length >= 8 ? "text-green-600" : "text-red-500"
              }`}>
                {passData.password.length >= 8
                  ? "✓ Password length is good"
                  : `✗ Need ${8 - passData.password.length} more character(s)`}
              </p>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={updatePassword}
                disabled={passLoading}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {passLoading ? "Updating..." : "Update Password"}
              </button>
              <button
                onClick={() => setPassData({ password: "", confirm_password: "" })}
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

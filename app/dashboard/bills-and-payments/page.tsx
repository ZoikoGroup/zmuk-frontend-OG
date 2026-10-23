"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Calendar,
  Info,
  ArrowLeftRight,
  Landmark,
  FileText,
  CheckCircle2,
  Wallet,
  Receipt,
  TrendingUp,
  Download,
  ArrowRight,
  BarChart2,
  Table,
  Plus,
  Lock,
  Settings,
  Gauge,
  Bell,
  Mail,
  Users,
  Smartphone,
  Database,
  Globe,
  Phone,
  Percent,
  Flag,
  Zap,
  HelpCircle,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import {
  BoosterModal,
  ReportActivityModal,
  ComparePlansModal,
} from "../components/DashboardModals";

// Real BeQuick API Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import beQuick from "../../utils/dasdbeQuickApi";
import {
  getFallbackUserLine,
  getBoosterSummary,
  recordBoosterPurchase,
} from "../../utils/dashboardSync";
import {
  validateSpendLimit,
  validateCardExpiry,
  validateCardNumber,
  validateCardCvv,
  validateUkSortCode,
  validateUkAccountNumber,
  validateName,
} from "../../utils/validators";

export interface BillingLineItem {
  id: string;
  number: string;
  planName: string;
  monthlyPrice: number;
  status: string;
  renewDate: string;
}

export interface IssuedBillItem {
  id: string;
  reference: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  dueShort: string;
  dueWeekday: string;
  periodLabel: string;
  monthShort: string;
  status: "Issued" | "Paid" | "Estimate";
  isLatest?: boolean;
  isEstimate?: boolean;
}

export interface SavedCardMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
}

function formatUkNumber(mdn?: string | number): string {
  if (!mdn) return "Pending number";
  let s = String(mdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return String(mdn);
}

function niceStatus(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "Active";
    case "inactive":
    case "paused":
    case "suspended":
      return "Paused";
    case "cancelled":
    case "terminated":
      return "Inactive";
    case "draft":
    case "pending":
      return "Pending";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Inactive";
  }
}

export default function BillsAndPaymentsPage() {
  const router = useRouter();

  // ── Dynamic User & Auth State ──
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Account holder");
  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Navigation & Header State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("bills");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ── Dynamic Billing Account State ──
  const [lines, setLines] = useState<BillingLineItem[]>([]);
  const [selectedAccountScope, setSelectedAccountScope] = useState<string>("all");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState<boolean>(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const [freshnessTime, setFreshnessTime] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ── Dynamic Bills & Payment Methods State ──
  const [billsHistory, setBillsHistory] = useState<IssuedBillItem[]>([]);
  const [accountCredit, setAccountCredit] = useState<number>(0);
  const [bankLast2, setBankLast2] = useState<string>("—");
  const [mandateStatusLabel, setMandateStatusLabel] = useState<string>("Not set up");
  const [mandateRefSuffix, setMandateRefSuffix] = useState<string>("—");
  const [savedCard, setSavedCard] = useState<SavedCardMethod | null>(null);

  // ── Interactive Section Controls ──
  const [historyRange, setHistoryRange] = useState<"6m" | "12m">("6m");
  const [historyRangeDropdownOpen, setHistoryRangeDropdownOpen] = useState<boolean>(false);
  const [showBillsTable, setShowBillsTable] = useState<boolean>(false);
  const [chargesTab, setChargesTab] = useState<"issued" | "sofar">("issued");

  // ── Billing Settings State (Persisted to localStorage) ──
  const [billLimit, setBillLimit] = useState<number>(0);
  const [billNotificationsPref, setBillNotificationsPref] = useState<string>("Email & text");
  const [billDeliveryPref, setBillDeliveryPref] = useState<string>("Email");
  const [itemisedBillsPref, setItemisedBillsPref] = useState<string>("By category");

  // ── Extra Out-of-Plan Spend State ──
  const [extraSpend, setExtraSpend] = useState<{
    boosters: number;
    roaming: number;
    international: number;
    premium: number;
  }>({
    boosters: 0,
    roaming: 0,
    international: 0,
    premium: 0,
  });

  // ── Modals State ──
  const [boosterOpen, setBoosterOpen] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [comparePlansOpen, setComparePlansOpen] = useState<boolean>(false);

  const [billLimitModalOpen, setBillLimitModalOpen] = useState<boolean>(false);
  const [tempBillLimit, setTempBillLimit] = useState<string>("0.00");
  const [billLimitError, setBillLimitError] = useState<string>("");

  const [ddModalOpen, setDdModalOpen] = useState<boolean>(false);
  const [tempBankLast2, setTempBankLast2] = useState<string>("");
  const [ddAccountName, setDdAccountName] = useState<string>("");
  const [ddSortCode, setDdSortCode] = useState<string>("");
  const [ddAccountNumber, setDdAccountNumber] = useState<string>("");
  const [ddConfirmed, setDdConfirmed] = useState<boolean>(false);
  const [ddErrors, setDdErrors] = useState<{
    name?: string;
    sortCode?: string;
    accountNumber?: string;
    confirmed?: string;
  }>({});

  const [cardModalOpen, setCardModalOpen] = useState<boolean>(false);
  const [cardHolderName, setCardHolderName] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [tempCardBrand, setTempCardBrand] = useState<string>("Visa debit");
  const [tempCardLast4, setTempCardLast4] = useState<string>("");
  const [tempCardExpiry, setTempCardExpiry] = useState<string>("");
  const [cardCvc, setCardCvc] = useState<string>("");
  const [cardErrors, setCardErrors] = useState<{
    name?: string;
    number?: string;
    expiry?: string;
    cvc?: string;
  }>({});

  const [queryChargeModalOpen, setQueryChargeModalOpen] = useState<boolean>(false);
  const [queryChargeReason, setQueryChargeReason] = useState<string>("");
  const [queryChargeBillRef, setQueryChargeBillRef] = useState<string>("");
  const [queryChargeCategory, setQueryChargeCategory] = useState<string>("Data booster");
  const [queryChargeAmount, setQueryChargeAmount] = useState<string>("");
  const [queryChargeErrors, setQueryChargeErrors] = useState<{
    category?: string;
    amount?: string;
    reason?: string;
  }>({});
  const [isSubmittingQuery, setIsSubmittingQuery] = useState<boolean>(false);

  // Make a Payment Modal State
  const [makePaymentModalOpen, setMakePaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);
  const chargesSectionRef = useRef<HTMLDivElement>(null);
  const historySectionRef = useRef<HTMLDivElement>(null);
  const paymentMethodsSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    router.push("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Check for URL actions (e.g. from Dashboard Manage buttons)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action === "bill-limit") {
      setBillLimitModalOpen(true);
    } else if (action === "payment-method" || action === "direct-debit") {
      setDdModalOpen(true);
    } else if (action === "card") {
      setCardModalOpen(true);
    }
  }, []);

  // Load saved user billing preferences
  useEffect(() => {
    try {
      const savedLimit = localStorage.getItem("zoiko_bill_limit");
      if (savedLimit && !isNaN(Number(savedLimit))) {
        setBillLimit(Number(savedLimit));
        setTempBillLimit(Number(savedLimit).toFixed(2));
      }
      const savedPrefs = localStorage.getItem("zoiko_billing_settings");
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (typeof parsed.billLimit === "number") {
          setBillLimit(parsed.billLimit);
          setTempBillLimit(parsed.billLimit.toFixed(2));
        }
        if (parsed.billNotificationsPref) setBillNotificationsPref(parsed.billNotificationsPref);
        if (parsed.billDeliveryPref) setBillDeliveryPref(parsed.billDeliveryPref);
        if (parsed.itemisedBillsPref) setItemisedBillsPref(parsed.itemisedBillsPref);
      }
    } catch {}
  }, []);

  const persistBillingSetting = (
    updates: Partial<{
      billLimit: number;
      billNotificationsPref: string;
      billDeliveryPref: string;
      itemisedBillsPref: string;
    }>
  ) => {
    try {
      const nextLimit = updates.billLimit ?? billLimit;
      localStorage.setItem("zoiko_bill_limit", String(nextLimit));
      const next = {
        billLimit: nextLimit,
        billNotificationsPref: updates.billNotificationsPref ?? billNotificationsPref,
        billDeliveryPref: updates.billDeliveryPref ?? billDeliveryPref,
        itemisedBillsPref: updates.itemisedBillsPref ?? itemisedBillsPref,
      };
      localStorage.setItem("zoiko_billing_settings", JSON.stringify(next));
    } catch {}
  };

  // ── Fetch 100% Dynamic Billing, Lines, Statements & Payment Methods from Django & BeQuick APIs ──
  const loadBillingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      setFreshnessTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
          " BST, " +
          now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      );

      const token =
        localStorage.getItem("zoiko_token") ||
        localStorage.getItem("driverx_token") ||
        "";
      const rawUser =
        localStorage.getItem("zoiko_user") ||
        localStorage.getItem("driverx_user");

      const userData = rawUser ? JSON.parse(rawUser) : null;
      const email: string = userData?.email || "";
      const fullName =
        [userData?.first_name, userData?.last_name].filter(Boolean).join(" ").trim() ||
        userData?.name ||
        userData?.username ||
        (email ? email.split("@")[0] : "Account Member");

      setUserName(fullName);
      if (userData?.role) setUserRole(String(userData.role));

      // Reset dynamic state before fetching
      setLines([]);
      setBillsHistory([]);
      setAccountCredit(0);
      setBankLast2("—");
      setMandateStatusLabel("Not set up");
      setMandateRefSuffix("—");
      setSavedCard(null);

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      // Fetch live catalogue plans from Django so we can match plan prices dynamically
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cataloguePlans: any[] = [];
      try {
        const plansRes = await fetch(`${API_BASE}/api/plans/v1/`);
        if (plansRes.ok) {
          const pData = await plansRes.json();
          if (Array.isArray(pData)) cataloguePlans = pData;
        }
      } catch {}

      if (!token && !email) {
        setIsLoading(false);
        return;
      }

      let foundSubscriberId: string | number | null = userData?.subscriber_id || null;
      const djangoInvoices: IssuedBillItem[] = [];
      const orderBillingLines: BillingLineItem[] = [];

      // 1. Check Django bqorders for subscriber_id & real user orders
      if (token && email) {
        try {
          const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ logged_user: email }),
          });
          if (res.ok) {
            const data = await res.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userGroups = (data.groups?.[email] || {}) as Record<string, any[]>;
            for (const [orderKey, entries] of Object.entries(userGroups)) {
              const entry = entries?.[0];
              if (!entry) continue;
              if (!foundSubscriberId && entry.subscriber_id) {
                foundSubscriberId = entry.subscriber_id;
              }
              const amt = Number(entry.total || entry.amount || 0);
              if (amt > 0 || entry.order_id || orderKey) {
                const createdObj = entry.created_at ? new Date(entry.created_at) : now;
                const issuedDateStr = createdObj.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const dueShortStr = createdObj.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
                const dueWeekdayStr = createdObj.toLocaleDateString("en-GB", {
                  weekday: "long",
                });
                const monthShortStr = createdObj.toLocaleDateString("en-GB", {
                  month: "short",
                });
                djangoInvoices.push({
                  id: `ord-${entry.order_id || orderKey}`,
                  reference: `INV-${entry.order_id || orderKey}`,
                  amount: Number(amt.toFixed(2)),
                  issuedDate: issuedDateStr,
                  dueDate: issuedDateStr,
                  dueShort: dueShortStr,
                  dueWeekday: dueWeekdayStr,
                  periodLabel: issuedDateStr,
                  monthShort: monthShortStr,
                  status: "Paid",
                });
              }
            }
          }
        } catch (e) {
          console.warn("Could not query Django bqorders:", e);
        }

        // 1b. Check Django sims/orders/by-user for Transatel lines and orders
        try {
          const simRes = await fetch(`${API_BASE}/api/v1/sims/orders/by-user/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ email, logged_user: email }),
          });
          if (simRes.ok) {
            const simData = await simRes.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ordersList: any[] = Array.isArray(simData.orders)
              ? simData.orders
              : [];
            if (!ordersList.length && simData.groups?.[email]) {
              for (const [, entries] of Object.entries(simData.groups[email] as Record<string, any[]>)) {
                if (entries?.[0]) ordersList.push(entries[0]);
              }
            }

            for (const ord of ordersList) {
              const orderRef = ord.order_reference || ord.order_id || ord.id || "ORD";
              const amt = Number(ord.total || ord.amount || 0);
              const createdObj = ord.created_at ? new Date(ord.created_at) : now;
              const issuedDateStr = createdObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const dueShortStr = createdObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });
              const dueWeekdayStr = createdObj.toLocaleDateString("en-GB", {
                weekday: "long",
              });
              const monthShortStr = createdObj.toLocaleDateString("en-GB", {
                month: "short",
              });

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const assignedSims: any[] = Array.isArray(ord.sims) ? ord.sims : [];
              let orderPriceTotal = 0;
              for (const sim of assignedSims) {
                if (!sim.msisdn && !sim.iccid) continue;
                const formattedNum = formatUkNumber(sim.msisdn || "");
                const lineId = String(sim.iccid || sim.msisdn || Math.random());

                const matchedCataloguePlan = cataloguePlans.find(
                  (cp) =>
                    (sim.transatelID && String(cp.transatelID) === String(sim.transatelID)) ||
                    (sim.plan_name && cp.name?.toLowerCase() === sim.plan_name.toLowerCase())
                );

                const planName = matchedCataloguePlan?.name || sim.plan_name || "Zoiko Plan";
                const monthlyPrice = Number(
                  matchedCataloguePlan?.price_30 ||
                    matchedCataloguePlan?.final_price ||
                    matchedCataloguePlan?.price ||
                    14.99
                );
                orderPriceTotal += monthlyPrice;

                orderBillingLines.push({
                  id: lineId,
                  number: formattedNum,
                  planName,
                  monthlyPrice,
                  status:
                    sim.provisioning_status === "ACTIVATED" || sim.activated_at
                      ? "Active"
                      : "Pending",
                  renewDate: "Monthly",
                });
              }

              const finalInvoiceAmt = amt > 0 ? amt : orderPriceTotal > 0 ? orderPriceTotal : 14.99;
              djangoInvoices.push({
                id: `sim-${orderRef}`,
                reference: String(orderRef).startsWith("INV-") ? String(orderRef) : `INV-${orderRef}`,
                amount: Number(finalInvoiceAmt.toFixed(2)),
                issuedDate: issuedDateStr,
                dueDate: issuedDateStr,
                dueShort: dueShortStr,
                dueWeekday: dueWeekdayStr,
                periodLabel: issuedDateStr,
                monthShort: monthShortStr,
                status: "Paid",
              });
            }
          }
        } catch (e) {
          console.warn("Could not query Django sims orders:", e);
        }
      }

      // 2. Query BeQuick subscriber by email if not found in Django
      if (!foundSubscriberId && email) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subRes = (await beQuick.getSubscriberByEmail(email)) as any;
          if (subRes && subRes.subscriber_id) {
            foundSubscriberId = subRes.subscriber_id;
          }
        } catch (e) {
          console.warn("Could not query BeQuick subscriber:", e);
        }
      }

      // 3. If subscriber found, fetch real subscriber details, live lines, payment methods, and billing statements
      if (foundSubscriberId) {
        setSubscriberId(foundSubscriberId);
        const subDigits = String(foundSubscriberId).replace(/\D/g, "");
        setMandateRefSuffix(subDigits.slice(-4) || String(foundSubscriberId));

        // 3a. Subscriber details
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subDetails = (await beQuick.getSubscriberDetails(foundSubscriberId)) as any;
          const subObj =
            subDetails?.subscriber || subDetails?.subscribers?.[0] || subDetails;
          if (subObj) {
            const bqName = [subObj.first_name, subObj.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();
            if (bqName) setUserName(bqName);
            const creditVal = parseFloat(
              subObj.credit_balance || subObj.wallet_balance || subObj.balance || "0"
            );
            if (!isNaN(creditVal) && creditVal >= 0) {
              setAccountCredit(creditVal);
            }
          }
        } catch {}

        // 3b. Payment methods from BeQuick
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pmRes = (await beQuick.getPaymentMethods(foundSubscriberId)) as any;
          const pms = pmRes?.payment_methods || pmRes?.data || [];
          if (Array.isArray(pms) && pms.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cardPm = pms.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (m: any) => m.card_number || m.last_four || m.brand || m.card_type
            ) || pms[0];

            if (cardPm) {
              const last4 = String(
                cardPm.last_four ||
                  cardPm.card_last4 ||
                  (cardPm.card_number ? String(cardPm.card_number).slice(-4) : "")
              );
              const brand =
                cardPm.brand ||
                cardPm.card_type ||
                cardPm.payment_type ||
                "Saved card";
              const expMonth = cardPm.expiration_month || cardPm.exp_month || "";
              const expYear = cardPm.expiration_year || cardPm.exp_year || "";
              const expiry =
                expMonth && expYear
                  ? `${String(expMonth).padStart(2, "0")}/${expYear}`
                  : "Active";

              if (last4) {
                setSavedCard({
                  id: String(cardPm.id || "pm-1"),
                  brand: String(brand),
                  last4,
                  expiry,
                });
              }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bankPm = pms.find((m: any) => m.account_number || m.routing_number);
            if (bankPm?.account_number) {
              setBankLast2(String(bankPm.account_number).slice(-2));
              setMandateStatusLabel("Active");
            }
          }
        } catch {}

        // Check local storage for user-managed payment methods
        if (typeof window !== "undefined") {
          const storedCard = localStorage.getItem("zoiko_saved_card");
          if (storedCard) {
            try {
              setSavedCard(JSON.parse(storedCard));
            } catch {}
          }
          const storedBank = localStorage.getItem("zoiko_saved_bank");
          if (storedBank) {
            try {
              const parsed = JSON.parse(storedBank);
              if (parsed.last2) {
                setBankLast2(parsed.last2);
                setMandateStatusLabel("Active");
              }
            } catch {}
          }
        }

        // 3c. Live User Lines from BeQuick
        let loadedLines: BillingLineItem[] = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bqLines = ((await beQuick.getUserLines(foundSubscriberId)) || []) as any[];
          if (bqLines && bqLines.length > 0) {
            loadedLines = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              bqLines.map(async (line: any) => {
                const lineId = String(line.id);
                let planName = line.device_name || line.plan_name || "Zoiko Mobile Plan";
                let renewDate = "—";
                const status = niceStatus(line.status);
                let price = Number(line.price || 0);

                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const details = (await beQuick.getPlanDetails(line.id, true)) as any;
                  const currentPlan = details?.current_plans?.[0];
                  if (currentPlan?.name) {
                    planName = currentPlan.name;
                  }
                  if (currentPlan?.price !== undefined) {
                    price = Number(currentPlan.price);
                  }
                  const matchedCataloguePlan = cataloguePlans.find(
                    (cp) =>
                      cp.name?.toLowerCase() === planName.toLowerCase() ||
                      planName.toLowerCase().includes(cp.name?.toLowerCase() || "___")
                  );
                  if (!price && matchedCataloguePlan) {
                    price = Number(
                      matchedCataloguePlan.price_30 ||
                        matchedCataloguePlan.final_price ||
                        matchedCataloguePlan.price ||
                        0
                    );
                  }
                  if (details?.service_period?.end_at) {
                    renewDate = new Date(
                      details.service_period.end_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    });
                  }
                } catch {}

                return {
                  id: lineId,
                  number: formatUkNumber(line.mdn),
                  planName,
                  monthlyPrice: Number(price.toFixed(2)),
                  status,
                  renewDate,
                };
              })
            );
            setLines(loadedLines);
            setUnreadNotifications(loadedLines.length);
            if (loadedLines.length > 0) {
              setMandateStatusLabel("Active");
            }
          }
        } catch (e) {
          console.warn("Error fetching user lines:", e);
        }

        // 3d. Billing Statements & Orders from BeQuick
        const statementsList: IssuedBillItem[] = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stmtRes = (await beQuick.request(
            `/billing_statements?by_subscriber_id=${foundSubscriberId}`
          )) as any;
          const rawStatements = stmtRes?.data?.billing_statements || [];
          if (Array.isArray(rawStatements) && rawStatements.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rawStatements.forEach((stmt: any, idx: number) => {
              const rawAmt =
                stmt.total_cents != null
                  ? Number(stmt.total_cents) / 100
                  : Number(stmt.total || stmt.balance || 0);
              const dtObj = stmt.closed_at || stmt.created_at || stmt.due_at
                ? new Date(stmt.closed_at || stmt.created_at || stmt.due_at)
                : now;
              const issuedDate = dtObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const dueShort = dtObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });
              const dueWeekday = dtObj.toLocaleDateString("en-GB", {
                weekday: "long",
              });
              const monthShort = dtObj.toLocaleDateString("en-GB", {
                month: "short",
              });
              const isOpen =
                stmt.status?.toLowerCase() === "current" ||
                stmt.state?.toLowerCase() === "open" ||
                idx === 0;

              statementsList.push({
                id: String(stmt.id || `stmt-${idx}`),
                reference: stmt.statement_number || `INV-${stmt.id || idx + 1}`,
                amount: Number(rawAmt.toFixed(2)),
                issuedDate,
                dueDate: issuedDate,
                dueShort,
                dueWeekday,
                periodLabel: stmt.billing_period || issuedDate,
                monthShort,
                status: isOpen ? "Issued" : "Paid",
                isLatest: idx === 0,
              });
            });
          }
        } catch {}

        // Also check BeQuick Orders if no billing_statements returned yet
        if (statementsList.length === 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ordRes = (await beQuick.getOrders(foundSubscriberId)) as any;
            const list = ordRes?.orders || ordRes?.data || [];
            if (Array.isArray(list) && list.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              list.forEach((ord: any, idx: number) => {
                const amt = Number(ord.amount || ord.total || 0);
                const dtObj = ord.created_at ? new Date(ord.created_at) : now;
                const issuedDate = dtObj.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const dueShort = dtObj.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
                const dueWeekday = dtObj.toLocaleDateString("en-GB", {
                  weekday: "long",
                });
                const monthShort = dtObj.toLocaleDateString("en-GB", {
                  month: "short",
                });
                statementsList.push({
                  id: String(ord.id || `bq-ord-${idx}`),
                  reference: `INV-${ord.id || idx + 1}`,
                  amount: Number(amt.toFixed(2)),
                  issuedDate,
                  dueDate: issuedDate,
                  dueShort,
                  dueWeekday,
                  periodLabel: issuedDate,
                  monthShort,
                  status: idx === 0 ? "Issued" : "Paid",
                  isLatest: idx === 0,
                });
              });
            }
          } catch {}
        }

        const combinedBills =
          statementsList.length > 0 ? statementsList : djangoInvoices;

        if (combinedBills.length > 0) {
          combinedBills[0].isLatest = true;
          setBillsHistory(combinedBills);
          setQueryChargeBillRef(combinedBills[0].reference);
        }
      } else if (djangoInvoices.length > 0) {
        djangoInvoices[0].isLatest = true;
        setBillsHistory(djangoInvoices);
        setQueryChargeBillRef(djangoInvoices[0].reference);
      }

      // Merge BeQuick lines, Django Transatel lines, and fallback
      setLines((current) => {
        const combined = [...current];
        for (const obl of orderBillingLines) {
          if (!combined.some((l) => l.number === obl.number || l.id === obl.id)) {
            combined.push(obl);
          }
        }
        if (combined.length > 0) {
          setUnreadNotifications(combined.length);
          return combined;
        }

        const fallback = getFallbackUserLine(userData);
        if (!fallback) {
          setUnreadNotifications(0);
          return [];
        }
        const primaryLine: BillingLineItem = {
          id: fallback.id,
          number: fallback.number,
          planName: fallback.planName,
          monthlyPrice: 14.99,
          status: "Active",
          renewDate: "Monthly",
        };
        setUnreadNotifications(1);
        return [primaryLine];
      });
    } catch (err) {
      console.error("Failed to load dynamic billing data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
    const handleSync = () => loadBillingData();
    window.addEventListener("zoiko-auth", handleSync);
    return () => window.removeEventListener("zoiko-auth", handleSync);
  }, [loadBillingData]);

  // Synchronize booster charges with global booster state
  useEffect(() => {
    const syncBoosters = () => {
      const summary = getBoosterSummary();
      setExtraSpend((prev) => ({
        ...prev,
        boosters: summary.totalCost,
      }));
    };
    syncBoosters();
    window.addEventListener("zoiko-booster-updated", syncBoosters);
    window.addEventListener("zoiko-auth", syncBoosters);
    return () => {
      window.removeEventListener("zoiko-booster-updated", syncBoosters);
      window.removeEventListener("zoiko-auth", syncBoosters);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadBillingData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Billing account & statements synced", "info");
    }, 350);
  };

  // ── Scoped Lines & Derived Calculations (100% Dynamic) ──
  const visibleLines = useMemo(() => {
    if (selectedAccountScope === "all") return lines;
    return lines.filter((l) => l.id === selectedAccountScope);
  }, [lines, selectedAccountScope]);

  const totalPlanPrices = useMemo(() => {
    const sum = visibleLines.reduce((acc, l) => acc + l.monthlyPrice, 0);
    return Number(sum.toFixed(2));
  }, [visibleLines]);

  const planBreakdownText = useMemo(() => {
    if (visibleLines.length === 0) return "No active plans";
    return visibleLines
      .map((l) => {
        const shortName = l.planName.replace(/^Zoiko\s+/i, "").split(" ")[0];
        return `${shortName} £${l.monthlyPrice.toFixed(2)}`;
      })
      .join(" + ");
  }, [visibleLines]);

  const latestBill = useMemo<IssuedBillItem>(() => {
    const found = billsHistory.find((b) => b.isLatest) || billsHistory[0];
    if (found) return found;
    return {
      id: "none",
      reference: "No bill issued yet",
      amount: totalPlanPrices,
      issuedDate: "—",
      dueDate: visibleLines[0]?.renewDate || "—",
      dueShort: visibleLines[0]?.renewDate || "—",
      dueWeekday: "—",
      periodLabel: "Current billing cycle",
      monthShort: "Current",
      status: "Issued",
      isLatest: true,
    };
  }, [billsHistory, totalPlanPrices, visibleLines]);

  const previousPaidBill = useMemo<IssuedBillItem | null>(() => {
    const paid = billsHistory.filter((b) => b.status === "Paid" && b.id !== latestBill.id);
    if (paid.length > 0) return paid[0];
    if (billsHistory.length > 1) return billsHistory[1];
    return null;
  }, [billsHistory, latestBill.id]);

  const nextEstimateBill = useMemo<IssuedBillItem>(() => {
    const foundEst = billsHistory.find((b) => b.isEstimate);
    if (foundEst) return foundEst;
    return {
      id: "est-next",
      reference: "Next cycle estimate",
      amount: totalPlanPrices,
      issuedDate: visibleLines[0]?.renewDate || "Next cycle",
      dueDate: visibleLines[0]?.renewDate || "—",
      dueShort: visibleLines[0]?.renewDate || "—",
      dueWeekday: "—",
      periodLabel: "Next billing cycle",
      monthShort: "Next (est.)",
      status: "Estimate",
      isEstimate: true,
    };
  }, [billsHistory, totalPlanPrices, visibleLines]);

  const chartBars = useMemo<IssuedBillItem[]>(() => {
    if (billsHistory.length === 0 && totalPlanPrices === 0) return [];
    const issued = billsHistory.filter((b) => !b.isEstimate).slice(0, 6).reverse();
    return [...issued, nextEstimateBill];
  }, [billsHistory, nextEstimateBill, totalPlanPrices]);

  const totalExtraSpend = useMemo(() => {
    return Number(
      (
        extraSpend.boosters +
        extraSpend.roaming +
        extraSpend.international +
        extraSpend.premium
      ).toFixed(2)
    );
  }, [extraSpend]);

  const activeChargesTotal = useMemo(() => {
    const base = chargesTab === "issued" ? latestBill.amount : totalPlanPrices;
    return Number((base + totalExtraSpend).toFixed(2));
  }, [chargesTab, latestBill.amount, totalPlanPrices, totalExtraSpend]);

  const netAmount = useMemo(() => {
    return Number((activeChargesTotal / 1.2).toFixed(2));
  }, [activeChargesTotal]);

  const vatAmount = useMemo(() => {
    return Number((activeChargesTotal - netAmount).toFixed(2));
  }, [activeChargesTotal, netAmount]);

  const coversSummaryText = useMemo(() => {
    if (visibleLines.length === 0) return "No active numbers";
    if (visibleLines.length === 1) return `Covers ${visibleLines[0].number}`;
    if (visibleLines.length === 2) {
      return `Covers ${visibleLines[0].number} and ${visibleLines[1].number}`;
    }
    return `Covers ${visibleLines[0].number}, ${visibleLines[1].number} +${
      visibleLines.length - 2
    } more`;
  }, [visibleLines]);

  // Download generated invoice statement
  const handleDownloadBillPdf = (bill: IssuedBillItem) => {
    if (bill.id === "none") {
      showToast("No issued bill available to download yet", "info");
      return;
    }
    const content = [
      "==========================================================",
      "                     ZOIKO MOBILE UK                      ",
      "                   OFFICIAL TAX INVOICE                   ",
      "==========================================================",
      "",
      `Account Holder:     ${userName || "Account Holder"}`,
      `Billing Account:    ••${mandateRefSuffix}`,
      `Invoice Reference:  ${bill.reference}`,
      `Billing Period:     ${bill.periodLabel}`,
      `Issue Date:         ${bill.issuedDate}`,
      `Collection Date:    ${bill.dueDate} (Direct Debit ••${bankLast2})`,
      `Status:             ${bill.status}`,
      "",
      "----------------------------------------------------------",
      "CHARGES BREAKDOWN",
      "----------------------------------------------------------",
      ...(visibleLines.length > 0
        ? visibleLines.map(
            (l) =>
              `${l.planName} · ${l.number}`.padEnd(42, " ") +
              `£${l.monthlyPrice.toFixed(2)}`
          )
        : [`Active Plan Charges`.padEnd(42, " ") + `£${bill.amount.toFixed(2)}`]),
      `Data boosters`.padEnd(42, " ") + `£${extraSpend.boosters.toFixed(2)}`,
      `Roaming`.padEnd(42, " ") + `£${extraSpend.roaming.toFixed(2)}`,
      `International calls & texts`.padEnd(42, " ") + `£${extraSpend.international.toFixed(2)}`,
      `Credits & adjustments`.padEnd(42, " ") + `£0.00`,
      "----------------------------------------------------------",
      `Net amount`.padEnd(42, " ") + `£${(bill.amount / 1.2).toFixed(2)}`,
      `VAT at 20% (included)`.padEnd(42, " ") + `£${(bill.amount - bill.amount / 1.2).toFixed(2)}`,
      `BILL TOTAL (INCL. VAT)`.padEnd(42, " ") + `£${bill.amount.toFixed(2)}`,
      "==========================================================",
      "Thank you for choosing Zoiko Mobile UK.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bill.reference}-Zoiko-Mobile.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded statement ${bill.reference}`, "success");
  };

  // Cycle preferences on click
  const handleCycleNotificationsPref = () => {
    const opts = ["Email & text", "Email only", "Text only"];
    const next = opts[(opts.indexOf(billNotificationsPref) + 1) % opts.length];
    setBillNotificationsPref(next);
    persistBillingSetting({ billNotificationsPref: next });
    showToast(`Bill notifications updated to: ${next}`, "info");
  };

  const handleCycleDeliveryPref = () => {
    const opts = ["Email", "Account portal only", "Email & PDF link"];
    const next = opts[(opts.indexOf(billDeliveryPref) + 1) % opts.length];
    setBillDeliveryPref(next);
    persistBillingSetting({ billDeliveryPref: next });
    showToast(`Bill delivery updated to: ${next}`, "info");
  };

  const handleCycleItemisedPref = () => {
    const opts = ["By category", "Full itemisation", "Summary only"];
    const next = opts[(opts.indexOf(itemisedBillsPref) + 1) % opts.length];
    setItemisedBillsPref(next);
    persistBillingSetting({ itemisedBillsPref: next });
    showToast(`Itemised bills level updated to: ${next}`, "info");
  };

  const handleSaveBillLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateSpendLimit(tempBillLimit);
    if (!check.isValid) {
      setBillLimitError(check.error || "Please enter a valid limit.");
      showToast(check.error || "Please enter a valid limit.", "info");
      return;
    }
    setBillLimitError("");
    const val = check.amount ?? 0;
    setBillLimit(val);
    persistBillingSetting({ billLimit: val });
    setBillLimitModalOpen(false);
    showToast(`Monthly mobile bill limit set to £${val.toFixed(2)}`, "success");
  };

  const handleSaveDirectDebit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {
      name?: string;
      sortCode?: string;
      accountNumber?: string;
      confirmed?: string;
    } = {};

    // 1. Account name validation
    const nameCheck = validateName(ddAccountName, "Account holder name");
    if (!nameCheck.isValid) {
      errors.name = nameCheck.error;
    }

    // 2. Sort code validation
    const sortCheck = validateUkSortCode(ddSortCode);
    if (!sortCheck.isValid) {
      errors.sortCode = sortCheck.error;
    }

    // 3. Account number validation
    const accCheck = validateUkAccountNumber(ddAccountNumber);
    if (!accCheck.isValid) {
      errors.accountNumber = accCheck.error;
    }

    // 4. Confirmation checkbox
    if (!ddConfirmed) {
      errors.confirmed = "Please confirm you agree to the Direct Debit Guarantee.";
    }

    if (Object.keys(errors).length > 0) {
      setDdErrors(errors);
      showToast("Please correct the Direct Debit details below.", "info");
      return;
    }

    setDdErrors({});
    const accDigits = accCheck.digits || ddAccountNumber.replace(/\D/g, "");
    const val = accDigits.slice(-2);
    const suffix = accDigits.slice(-4);

    setBankLast2(val);
    setMandateRefSuffix(suffix);
    setMandateStatusLabel("Active");

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "zoiko_saved_bank",
        JSON.stringify({
          last2: val,
          sortCode: sortCheck.formatted,
          name: nameCheck.cleaned,
          mandateRef: `ZDD-${suffix}`,
        })
      );
      window.dispatchEvent(new Event("zoiko-auth"));
    }
    showToast(`Direct Debit mandate confirmed for ${nameCheck.cleaned} (••${val})`, "success");
    setDdModalOpen(false);
  };

  const handleRemoveDirectDebit = () => {
    setBankLast2("—");
    setMandateStatusLabel("Not set up");
    setDdAccountName("");
    setDdSortCode("");
    setDdAccountNumber("");
    setDdConfirmed(false);
    setDdErrors({});
    if (typeof window !== "undefined") {
      localStorage.removeItem("zoiko_saved_bank");
      window.dispatchEvent(new Event("zoiko-auth"));
    }
    setDdModalOpen(false);
    showToast("Direct Debit mandate removed.", "info");
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {
      name?: string;
      number?: string;
      expiry?: string;
      cvc?: string;
    } = {};

    // 1. Name validation
    const nameCheck = validateName(cardHolderName, "Cardholder name");
    if (!nameCheck.isValid) {
      errors.name = nameCheck.error;
    }

    // 2. Card number validation (Luhn Mod-10)
    const numCheck = validateCardNumber(cardNumber);
    if (!numCheck.isValid) {
      errors.number = numCheck.error;
    }

    // 3. Expiry date validation
    const expCheck = validateCardExpiry(tempCardExpiry);
    if (!expCheck.isValid) {
      errors.expiry = expCheck.error;
    }

    // 4. CVV validation
    const isAmex = numCheck.brand === "Amex";
    const cvcCheck = validateCardCvv(cardCvc, isAmex);
    if (!cvcCheck.isValid) {
      errors.cvc = cvcCheck.error;
    }

    if (Object.keys(errors).length > 0) {
      setCardErrors(errors);
      showToast("Please correct the card details below.", "info");
      return;
    }

    setCardErrors({});
    const detectedBrand =
      numCheck.brand !== "Unknown" ? `${numCheck.brand} debit` : tempCardBrand || "Visa debit";
    const last4 = numCheck.last4 || cardNumber.replace(/\D/g, "").slice(-4);
    const expiryFormatted = expCheck.formatted || tempCardExpiry;

    const newCard: SavedCardMethod = {
      id: `pm-${Date.now()}`,
      brand: detectedBrand,
      last4,
      expiry: expiryFormatted,
    };
    setSavedCard(newCard);
    if (typeof window !== "undefined") {
      localStorage.setItem("zoiko_saved_card", JSON.stringify(newCard));
      window.dispatchEvent(new Event("zoiko-auth"));
    }
    setCardModalOpen(false);
    showToast(`Saved card (${newCard.brand} ••••${last4}) added successfully`, "success");
  };

  const handleRemoveCard = () => {
    setSavedCard(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("zoiko_saved_card");
      window.dispatchEvent(new Event("zoiko-auth"));
    }
    setCardModalOpen(false);
    showToast("Payment card removed.", "info");
  };

  const handleSubmitChargeQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {
      category?: string;
      amount?: string;
      reason?: string;
    } = {};

    if (!queryChargeCategory) {
      errors.category = "Please select a charge category.";
    }

    if (queryChargeAmount.trim()) {
      const amt = parseFloat(queryChargeAmount);
      if (isNaN(amt) || amt <= 0) {
        errors.amount = "Enter a valid positive amount in £.";
      } else if (amt > 1000) {
        errors.amount = "Disputed amount cannot exceed £1,000.00.";
      }
    }

    const trimmedReason = queryChargeReason.trim();
    if (!trimmedReason || trimmedReason.length < 15) {
      errors.reason = "Please provide at least 15 characters explaining the charge.";
    } else if (trimmedReason.length > 1000) {
      errors.reason = "Explanation cannot exceed 1,000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setQueryChargeErrors(errors);
      showToast("Please check the errors in your query submission.", "info");
      return;
    }

    setQueryChargeErrors({});
    setIsSubmittingQuery(true);

    const caseRef = `ZM-${Math.floor(100000 + Math.random() * 900000)}`;
    const billRefLabel = queryChargeBillRef || latestBill.reference || "Current billing cycle";

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: "billing",
            subject: `Billing Query [${caseRef}]: ${billRefLabel} · ${queryChargeCategory}`,
            message: `Statement: ${billRefLabel}\nCategory: ${queryChargeCategory}\nDisputed Amount: ${queryChargeAmount ? `£${queryChargeAmount}` : "Full line item"}\n\nExplanation:\n${trimmedReason}`,
          }),
        });
      }
    } catch (err) {
      console.warn("Could not submit ticket to backend support API:", err);
    } finally {
      setIsSubmittingQuery(false);
      setQueryChargeModalOpen(false);
      setQueryChargeReason("");
      setQueryChargeAmount("");
      showToast(`Query submitted for ${billRefLabel}. Case reference: ${caseRef}`, "success");
    }
  };

  const handleMakeOneOffPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt < 1.0) {
      setPaymentError("Minimum payment amount is £1.00.");
      return;
    }
    if (amt > 500.0) {
      setPaymentError("Maximum single payment amount is £500.00.");
      return;
    }

    if (!savedCard && (bankLast2 === "—" || !bankLast2)) {
      setPaymentError("Please set up a saved card or Direct Debit first.");
      return;
    }

    setPaymentError("");
    setIsProcessingPayment(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAccountCredit((prev) => Number((prev + amt).toFixed(2)));
      showToast(`Payment of £${amt.toFixed(2)} processed successfully.`, "success");
      setMakePaymentModalOpen(false);
      setPaymentAmount("");
    } catch {
      setPaymentError("Payment could not be processed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Spend Donut Gauge calculation
  const spendRatio = billLimit > 0 ? Math.min(1, totalExtraSpend / billLimit) : 0;
  const gaugeRadius = 46;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - spendRatio);

  return (
    <div className="min-h-screen bg-[#EEEEF0] font-sans text-[#0D1935] p-3 sm:p-5">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0D1935] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Main Container Layout — Identical Sticky Sidebar Frame */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Left Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            numbersCount={lines.length}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenComparePlans={() => setComparePlansOpen(true)}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            onOpenAddNumber={() => router.push("/dashboard/my-mobile-numbers")}
            planName={lines[0]?.planName || "No active plan"}
            renewDate={lines[0]?.renewDate || "—"}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-5 min-w-0">
          {/* Top Navigation Header */}
          <DashboardTopNav
            userName={userName || "Account Holder"}
            userRole={userRole}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            unreadNotifications={unreadNotifications}
            onClearNotifications={() => setUnreadNotifications(0)}
            onLogout={handleLogout}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Bills & payments"
            customSubtitle="See what you owe, what's scheduled, your issued bills and how you pay."
          />

          {/* Sub-header Control Bar: Freshness Status (left) + Billing Account Selector (right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Balance checked time + Refresh button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#54617E]">
                <Clock className="w-3.5 h-3.5 text-[#54617E]" />
                <span>Balance checked {freshnessTime}</span>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Refresh billing status"
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#54617E] hover:text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing || isLoading ? "animate-spin text-[#E01C5B]" : ""
                  }`}
                />
              </button>
            </div>

            {/* Right: Billing Account Selector Card */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="px-3.5 py-2.5 bg-white rounded-2xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#121E3E]/10 inline-flex items-center gap-2.5 hover:border-[#E01C5B]/30 transition cursor-pointer text-left"
              >
                <div className="w-8 h-8 bg-[#E01C5B]/10 rounded-[10px] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[#54617E] text-[10px] font-medium leading-3">
                    Billing account
                  </span>
                  <span className="text-[#0D1935] text-sm font-bold leading-5">
                    Account ••{mandateRefSuffix} · {visibleLines.length}{" "}
                    {visibleLines.length === 1 ? "line" : "lines"}
                  </span>
                  <span className="text-[#54617E] text-[11px] font-normal leading-3">
                    {coversSummaryText}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#54617E] transition-transform ${
                    accountDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30">
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#54617E] uppercase tracking-wider">
                    Select billing scope
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountScope("all");
                      setAccountDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer ${
                      selectedAccountScope === "all" ? "bg-[#E01C5B]/5" : ""
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0D1935]">
                        Whole billing account (••{mandateRefSuffix})
                      </div>
                      <div className="text-[11px] text-[#54617E]">
                        All {lines.length} {lines.length === 1 ? "line" : "lines"} · £
                        {lines
                          .reduce((acc, l) => acc + l.monthlyPrice, 0)
                          .toFixed(2)}
                        /mo
                      </div>
                    </div>
                    {selectedAccountScope === "all" && (
                      <Check className="w-4 h-4 text-[#E01C5B]" />
                    )}
                  </button>

                  {lines.length > 1 && (
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      {lines.map((line) => (
                        <button
                          key={line.id}
                          type="button"
                          onClick={() => {
                            setSelectedAccountScope(line.id);
                            setAccountDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer ${
                            selectedAccountScope === line.id ? "bg-[#E01C5B]/5" : ""
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-[#0D1935]">
                              {line.number}
                            </div>
                            <div className="text-[11px] text-[#54617E]">
                              {line.planName} · £{line.monthlyPrice.toFixed(2)}/mo
                            </div>
                          </div>
                          {selectedAccountScope === line.id && (
                            <Check className="w-4 h-4 text-[#E01C5B]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 1: 3-Column Grid (Next payment [5] + Account balance [3] + Latest issued bill [4]) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Card 1: Next payment (Solid Pink Card, lg:col-span-5) */}
            <div className="lg:col-span-5 p-6 relative bg-[#E01C5B] rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-4 overflow-hidden text-white">
              {/* Top-right 6x3 decorative dot matrix */}
              <div className="w-24 h-12 right-[18px] top-[16px] absolute opacity-15 inline-flex flex-col justify-start items-start gap-2.5 pointer-events-none">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="self-stretch inline-flex justify-between items-center">
                    {[0, 1, 2, 3, 4, 5].map((col) => (
                      <div key={col} className="w-1 h-1 bg-white rounded-full" />
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-white text-base font-bold leading-5">
                      Next payment
                    </h2>
                    <span className="text-white/80 text-xs font-normal leading-4">
                      Whole billing account
                    </span>
                  </div>
                </div>

                {/* Amount & Schedule */}
                <div className="flex flex-col gap-1">
                  <span className="text-white/80 text-xs font-medium leading-4">
                    Next Direct Debit collection
                  </span>
                  <div className="text-white text-4xl font-extrabold leading-10 tracking-tight">
                    £{latestBill.amount.toFixed(2)}
                  </div>
                  <div className="pt-0.5 text-white/90 text-xs font-medium leading-4">
                    {latestBill.dueDate !== "—"
                      ? `Scheduled for ${latestBill.dueDate}`
                      : "No collection scheduled"}
                  </div>
                  <div className="pt-1.5 flex flex-col items-start gap-1.5">
                    <span className="px-2 py-0.5 bg-white/20 rounded-full inline-flex items-center gap-1 text-[11px] font-semibold text-white">
                      <Calendar className="w-3 h-3" />
                      {latestBill.amount > 0 ? "Scheduled" : "No balance due"}
                    </span>
                    <div className="inline-flex items-center gap-1.5 text-white/85 text-xs font-normal leading-4">
                      <Info className="w-3.5 h-3.5 shrink-0 text-white/90" />
                      <span>
                        Collected automatically. You don&apos;t need to do anything.
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 inline-flex items-start gap-1.5 text-white/85 text-[11px] font-normal leading-4">
                    <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/85" />
                    <span>
                      Plan prices: £{totalPlanPrices.toFixed(2)} a month ({planBreakdownText}).
                      That&apos;s the price — the amount collected comes from your issued bill.
                    </span>
                  </div>
                </div>

                {/* Inner White Details Box */}
                <div className="px-3.5 py-1 bg-white rounded-2xl flex flex-col text-[#0D1935]">
                  {/* Row 1: Collection date */}
                  <div className="py-2.5 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Collection date</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        {latestBill.dueDate}
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        {latestBill.dueWeekday}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Paid by */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Landmark className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Paid by</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Direct Debit
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        Bank account ••{bankLast2}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: For bill */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <FileText className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>For bill</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        {latestBill.reference}
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        {latestBill.periodLabel}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Mandate */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Mandate</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        {mandateStatusLabel}
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        {mandateStatusLabel === "Active"
                          ? "Confirmed by provider"
                          : "Not set up"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-1 flex items-center justify-between gap-2.5 flex-wrap">
                <span className="text-white/90 text-xs font-semibold leading-4">
                  Nothing to pay now
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempBankLast2(bankLast2 === "—" ? "" : bankLast2);
                    setDdModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-white/40 hover:bg-white/10 text-white text-xs font-semibold leading-4 transition cursor-pointer"
                >
                  Manage Direct Debit
                </button>
              </div>
            </div>

            {/* Card 2: Account balance (White Card, lg:col-span-3) */}
            <div className="lg:col-span-3 p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Account balance
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Bills issued and not yet paid
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1">
                  <span className="text-[#54617E] text-xs font-medium leading-4">
                    Outstanding balance
                  </span>
                  <div className="text-[#0D1935] text-4xl font-extrabold leading-10 tracking-tight">
                    £{latestBill.amount.toFixed(2)}
                  </div>
                  <div className="pt-1 flex items-center">
                    <span className="px-2 py-0.5 bg-[#2A6AD9]/10 rounded-full inline-flex items-center gap-1 text-[#2A6AD9] text-[11px] font-semibold">
                      <Calendar className="w-3 h-3" />
                      {latestBill.dueShort !== "—"
                        ? `Not overdue · due ${latestBill.dueShort}`
                        : "Not overdue"}
                    </span>
                  </div>
                </div>

                {/* Breakdown Rows */}
                <div className="flex flex-col">
                  {/* Row 1 */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs leading-4">
                      <FileText className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                      <span>Issued, not yet due</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        £{latestBill.amount.toFixed(2)}
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        {latestBill.reference}
                        {latestBill.dueShort !== "—" ? ` · due ${latestBill.dueShort}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs leading-4">
                      <Wallet className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                      <span>Account credit</span>
                    </div>
                    <span className="text-[#0D1935] text-xs font-semibold leading-4">
                      £{accountCredit.toFixed(2)}
                    </span>
                  </div>

                  {/* Row 3 */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs leading-4">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                      <span>Last payment</span>
                    </div>
                    {previousPaidBill ? (
                      <div className="flex flex-col items-end text-right gap-1">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          £{previousPaidBill.amount.toFixed(2)}
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          {previousPaidBill.dueDate} · {previousPaidBill.reference}
                        </span>
                        <span className="px-2 py-0.5 bg-[#1E8E5A]/10 rounded-full inline-flex items-center gap-1 text-[#1E8E5A] text-[11px] font-semibold">
                          <Check className="w-3 h-3" />
                          Paid
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          £0.00
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          No previous payment
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="inline-flex items-center gap-1.5 text-[#54617E] text-[11px]">
                <Clock className="w-3 h-3 text-[#54617E]" />
                <span>Checked {freshnessTime}</span>
              </div>
            </div>

            {/* Card 3: Latest issued bill (White Card, lg:col-span-4) */}
            <div className="lg:col-span-4 p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Latest issued bill
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Final, not an estimate
                    </span>
                  </div>
                </div>

                {/* Amount & Period */}
                <div className="flex flex-col gap-1">
                  <span className="text-[#54617E] text-xs font-medium leading-4">
                    {latestBill.reference}
                  </span>
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-[#0D1935] text-3xl font-extrabold leading-9 tracking-tight">
                      £{latestBill.amount.toFixed(2)}
                    </span>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      incl. VAT
                    </span>
                  </div>
                  <div className="text-[#54617E] text-xs font-normal leading-4">
                    {latestBill.issuedDate !== "—"
                      ? `Issued ${latestBill.issuedDate} · for ${latestBill.periodLabel}`
                      : latestBill.periodLabel}
                  </div>
                  <div className="pt-1 flex items-center">
                    <span className="px-2 py-0.5 bg-[#2A6AD9]/10 rounded-full inline-flex items-center gap-1 text-[#2A6AD9] text-[11px] font-semibold">
                      <Calendar className="w-3 h-3" />
                      {latestBill.dueShort !== "—"
                        ? `Issued · DD on ${latestBill.dueShort}`
                        : latestBill.status}
                    </span>
                  </div>
                </div>

                {/* Breakdown Rows */}
                <div className="flex flex-col">
                  {/* Due */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Due</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        {latestBill.dueDate}
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        Collected by Direct Debit
                      </span>
                    </div>
                  </div>

                  {/* Previous bill */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <FileText className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Previous bill</span>
                    </div>
                    {previousPaidBill ? (
                      <div className="flex flex-col items-end text-right gap-1">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          £{previousPaidBill.amount.toFixed(2)}
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          {previousPaidBill.reference}
                        </span>
                        <span className="px-2 py-0.5 bg-[#1E8E5A]/10 rounded-full inline-flex items-center gap-1 text-[#1E8E5A] text-[11px] font-semibold">
                          <Check className="w-3 h-3" />
                          Paid
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          £0.00
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          None
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Next bill */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Next bill</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        ~£{nextEstimateBill.amount.toFixed(2)}
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        Estimate · {nextEstimateBill.issuedDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDownloadBillPdf(latestBill)}
                  className="px-3.5 py-2 rounded-xl border border-[#E01C5B]/25 hover:bg-[#E01C5B]/5 inline-flex items-center gap-1.5 text-[#E01C5B] text-xs font-semibold leading-4 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChargesTab("issued");
                    chargesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="py-1 inline-flex items-center gap-1.5 text-[#E01C5B] text-xs font-semibold hover:underline cursor-pointer"
                >
                  <span>View charges</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── ROW 2: 3 Equal Columns (Billing history + Payment methods + Billing settings) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Card 4: Billing history */}
            <div
              ref={historySectionRef}
              className="p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5"
            >
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Billing history
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Totals of issued bills, by issue date
                    </span>
                  </div>
                </div>

                {/* Range Filter Dropdown */}
                <div className="relative self-start">
                  <button
                    type="button"
                    onClick={() => setHistoryRangeDropdownOpen(!historyRangeDropdownOpen)}
                    className="h-9 px-3 bg-white rounded-[10px] border border-[#121E3E]/10 inline-flex items-center gap-3 text-xs font-semibold text-[#0D1935] hover:border-[#E01C5B]/30 transition cursor-pointer"
                  >
                    <span>{historyRange === "6m" ? "Last 6 months" : "Last 12 months"}</span>
                    <ChevronDown className="w-3 h-3 text-[#54617E]" />
                  </button>
                  {historyRangeDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryRange("6m");
                          setHistoryRangeDropdownOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span>Last 6 months</span>
                        {historyRange === "6m" && <Check className="w-3.5 h-3.5 text-[#E01C5B]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryRange("12m");
                          setHistoryRangeDropdownOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span>Last 12 months</span>
                        {historyRange === "12m" && <Check className="w-3.5 h-3.5 text-[#E01C5B]" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3.5 flex-wrap text-[11px] text-[#54617E]">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E01C5B]/45" />
                    <span>Issued bill</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E01C5B]" />
                    <span>Latest</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-dashed border-[#E01C5B] bg-[#E01C5B]/15" />
                    <span>Estimate (not issued)</span>
                  </div>
                </div>

                {/* Chart OR Downloadable Bills Table */}
                {chartBars.length === 0 ? (
                  <div className="h-44 rounded-2xl bg-[#F4F5F8] flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xs font-semibold text-[#0D1935]">
                      No issued bills yet
                    </span>
                    <span className="text-[11px] text-[#54617E] mt-0.5">
                      Your billing statements will appear here once issued.
                    </span>
                  </div>
                ) : !showBillsTable ? (
                  <div className="relative h-44 pt-4 select-none">
                    {/* Horizontal Grid Lines & Y-Axis Labels */}
                    {[
                      { label: "£40", top: "top-[16px]" },
                      { label: "£30", top: "top-[48px]" },
                      { label: "£20", top: "top-[80px]" },
                      { label: "£10", top: "top-[112px]" },
                      { label: "£0", top: "top-[144px]" },
                    ].map((axis) => (
                      <div key={axis.label} className={`absolute inset-x-0 ${axis.top} flex items-center`}>
                        <span className="w-7 text-[9px] text-[#8F9BB3] leading-none">
                          {axis.label}
                        </span>
                        <div className="flex-1 border-t border-dashed border-[#121E3E]/10" />
                      </div>
                    ))}

                    {/* Vertical Bars Container */}
                    <div
                      className="absolute left-8 right-1 top-[16px] bottom-[20px] grid gap-2 items-end"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(1, chartBars.length)}, minmax(0, 1fr))`,
                      }}
                    >
                      {chartBars.map((item) => {
                        const maxScale = Math.max(
                          40,
                          ...chartBars.map((b) => b.amount * 1.15)
                        );
                        const heightPct =
                          item.amount > 0
                            ? Math.max(
                                14,
                                Math.min(100, Math.round((item.amount / maxScale) * 100))
                              )
                            : 6;

                        return (
                          <div
                            key={item.id}
                            className="h-full flex flex-col justify-end items-center group"
                          >
                            {/* Value Label Above Bar */}
                            <span
                              className={`text-[9.5px] font-bold mb-1 leading-none whitespace-nowrap ${
                                item.isEstimate ? "text-[#E01C5B]" : "text-[#0D1935]"
                              }`}
                            >
                              {item.isEstimate
                                ? `~£${item.amount.toFixed(2)}`
                                : `£${item.amount.toFixed(2)}`}
                            </span>

                            {/* Bar */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!item.isEstimate) handleDownloadBillPdf(item);
                              }}
                              title={
                                item.isEstimate
                                  ? `Estimated next bill (${item.periodLabel})`
                                  : `Click to download ${item.reference}`
                              }
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[28px] rounded-t-md transition-all cursor-pointer ${
                                item.isLatest
                                  ? "bg-[#E01C5B] shadow-sm"
                                  : item.isEstimate
                                  ? "bg-[#E01C5B]/10 border border-dashed border-[#E01C5B]"
                                  : "bg-[#F29BB6] hover:bg-[#E01C5B]/75"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* X-Axis Month Labels */}
                    <div
                      className="absolute left-8 right-1 bottom-0 grid gap-2 text-center"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(1, chartBars.length)}, minmax(0, 1fr))`,
                      }}
                    >
                      {chartBars.map((item) => (
                        <span
                          key={item.id}
                          className="text-[9.5px] text-[#54617E] font-medium truncate"
                        >
                          {item.monthShort}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto border border-[#121E3E]/10 rounded-2xl divide-y divide-[#121E3E]/10">
                    {billsHistory.filter((b) => !b.isEstimate).length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#54617E]">
                        No issued bills to display yet.
                      </div>
                    ) : (
                      billsHistory
                        .filter((b) => !b.isEstimate)
                        .map((bill) => (
                          <div
                            key={bill.id}
                            className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50"
                          >
                            <div>
                              <div className="font-semibold text-[#0D1935]">
                                {bill.reference} · £{bill.amount.toFixed(2)}
                              </div>
                              <div className="text-[11px] text-[#54617E]">
                                Issued {bill.issuedDate} ({bill.periodLabel})
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadBillPdf(bill)}
                              className="px-2.5 py-1 rounded-lg bg-[#E01C5B]/10 text-[#E01C5B] font-semibold text-[11px] inline-flex items-center gap-1 hover:bg-[#E01C5B]/20 transition cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer Toggle */}
              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 text-[#54617E] text-[11px]">
                  <Download className="w-3 h-3 text-[#54617E]" />
                  <span>Download any issued bill from the table</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBillsTable(!showBillsTable)}
                  className="py-1 inline-flex items-center gap-1.5 text-[#E01C5B] text-xs font-semibold hover:underline cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showBillsTable ? "Show chart" : "Show bills table"}</span>
                </button>
              </div>
            </div>

            {/* Card 5: Payment methods */}
            <div
              ref={paymentMethodsSectionRef}
              className="p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5"
            >
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Payment methods
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      How bills and one-off payments are paid
                    </span>
                  </div>
                </div>

                {/* Method 1: Direct Debit Box */}
                <div className="p-3.5 rounded-2xl border border-[#121E3E]/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-8 bg-[#0D1935] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-[11px] font-extrabold tracking-wide">
                        DD
                      </span>
                    </div>
                    {bankLast2 !== "—" && bankLast2 !== "" ? (
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[#0D1935] text-sm font-bold leading-5">
                          Direct Debit
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Bank account ending ••{bankLast2}
                        </span>
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#1E8E5A]/10 rounded-full inline-flex items-center gap-1 text-[#1E8E5A] text-[11px] font-semibold">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                          <span className="px-2 py-0.5 bg-[#E01C5B]/10 rounded-full inline-flex items-center text-[#E01C5B] text-[11px] font-semibold">
                            Collects your bills
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[#0D1935] text-sm font-bold leading-5">
                          Direct Debit
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          No Direct Debit mandate set up yet
                        </span>
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-full inline-flex items-center text-slate-500 text-[11px] font-semibold">
                            Not set up
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBankLast2(bankLast2 === "—" ? "" : bankLast2);
                      setDdModalOpen(true);
                    }}
                    className="text-[#E01C5B] text-xs font-semibold hover:underline shrink-0 cursor-pointer"
                  >
                    {bankLast2 !== "—" && bankLast2 !== "" ? "Manage" : "Set up"}
                  </button>
                </div>

                {/* Method 2: Saved Card Box */}
                <div className="p-3.5 rounded-2xl border border-[#121E3E]/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-8 bg-[#1D3A70] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-extrabold tracking-wider uppercase">
                        CARD
                      </span>
                    </div>
                    {savedCard ? (
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[#0D1935] text-sm font-bold leading-5">
                          {savedCard.brand} ••••{savedCard.last4}
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Expires {savedCard.expiry} · held by our payment provider
                        </span>
                        <div className="pt-1 flex items-center">
                          <span className="px-2 py-0.5 bg-[#F4F5F8] rounded-full text-[#54617E] text-[11px] font-semibold">
                            One-off payments & add-ons
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[#0D1935] text-sm font-bold leading-5">
                          No saved payment card
                        </span>
                        <span className="text-[#54617E] text-xs font-normal leading-4">
                          Add a card for one-off payments & add-ons
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {savedCard && (
                      <button
                        type="button"
                        onClick={handleRemoveCard}
                        className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setTempCardBrand(savedCard?.brand || "Visa debit");
                        setTempCardLast4(savedCard?.last4 || "");
                        setTempCardExpiry(savedCard?.expiry || "");
                        setCardModalOpen(true);
                      }}
                      className="text-[#E01C5B] text-xs font-semibold hover:underline shrink-0 cursor-pointer"
                    >
                      {savedCard ? "Manage" : "Add"}
                    </button>
                  </div>
                </div>

                {/* Add or replace a card button */}
                <button
                  type="button"
                  onClick={() => {
                    setTempCardBrand(savedCard?.brand || "Visa debit");
                    setTempCardLast4("");
                    setTempCardExpiry("");
                    setCardModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E01C5B]/25 hover:bg-[#E01C5B]/5 inline-flex items-center justify-center gap-1.5 text-[#E01C5B] text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add or replace a card</span>
                </button>
              </div>

              {/* Security Note */}
              <div className="inline-flex items-center gap-2 text-[#54617E] text-[11px] leading-4">
                <Lock className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                <span>
                  Card details go straight to our payment provider&apos;s secure page. Zoiko
                  never sees your full card number.
                </span>
              </div>
            </div>

            {/* Card 6: Billing settings */}
            <div className="p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Billing settings
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Apply to the whole account
                    </span>
                  </div>
                </div>

                {/* Settings List */}
                <div className="flex flex-col">
                  {/* Setting 1: Mobile bill limit */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempBillLimit(billLimit.toFixed(2));
                      setBillLimitModalOpen(true);
                    }}
                    className="py-3 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-[#F4F5F8] rounded-lg flex items-center justify-center shrink-0">
                        <Gauge className="w-3.5 h-3.5 text-[#54617E]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          Mobile bill limit
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          Charges outside your plans
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      <span className="text-[#0D1935] text-xs font-semibold">
                        £{billLimit.toFixed(2)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#54617E]" />
                    </div>
                  </button>

                  {/* Setting 2: Bill notifications */}
                  <button
                    type="button"
                    onClick={handleCycleNotificationsPref}
                    className="py-3 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-[#F4F5F8] rounded-lg flex items-center justify-center shrink-0">
                        <Bell className="w-3.5 h-3.5 text-[#54617E]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          Bill notifications
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          Issued bills and reminders
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      <span className="text-[#0D1935] text-xs font-semibold">
                        {billNotificationsPref}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#54617E]" />
                    </div>
                  </button>

                  {/* Setting 3: Bill delivery */}
                  <button
                    type="button"
                    onClick={handleCycleDeliveryPref}
                    className="py-3 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-[#F4F5F8] rounded-lg flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-[#54617E]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          Bill delivery
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          How you receive bills
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      <span className="text-[#0D1935] text-xs font-semibold">
                        {billDeliveryPref}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#54617E]" />
                    </div>
                  </button>

                  {/* Setting 4: Itemised bills */}
                  <button
                    type="button"
                    onClick={handleCycleItemisedPref}
                    className="py-3 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-[#F4F5F8] rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-[#54617E]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#0D1935] text-xs font-semibold leading-4">
                          Itemised bills
                        </span>
                        <span className="text-[#54617E] text-[11px] font-normal leading-4">
                          Level of detail
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      <span className="text-[#0D1935] text-xs font-semibold">
                        {itemisedBillsPref}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#54617E]" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Split billing info pill */}
              <div className="p-3 bg-[#F4F5F8] rounded-xl inline-flex items-center gap-2 text-[#54617E] text-xs leading-4">
                <Users className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                <span>
                  <strong className="font-semibold text-[#54617E]">Split billing</strong>{" "}
                  isn&apos;t available. We&apos;ll let you know if that changes.
                </span>
              </div>
            </div>
          </div>

          {/* ── ROW 3: 3 Equal Columns (Charges + Spend toward your bill limit + Quick actions) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Card 7: Charges */}
            <div
              ref={chargesSectionRef}
              className="p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5"
            >
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Charges
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      {chargesTab === "issued"
                        ? `${latestBill.reference} · ${latestBill.periodLabel}`
                        : `Current cycle · ${nextEstimateBill.periodLabel}`}
                    </span>
                  </div>
                </div>

                {/* Segmented Pill Toggle */}
                <div className="p-0.5 bg-[#F4F5F8] rounded-xl inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setChargesTab("issued")}
                    className={`flex-1 py-1.5 px-3 rounded-[9px] text-xs font-semibold transition cursor-pointer ${
                      chargesTab === "issued"
                        ? "bg-white text-[#0D1935] shadow-[0px_1px_2px_0px_rgba(18,27,52,0.06)]"
                        : "text-[#54617E] hover:text-[#0D1935]"
                    }`}
                  >
                    Issued bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setChargesTab("sofar")}
                    className={`flex-1 py-1.5 px-3 rounded-[9px] text-xs font-semibold transition cursor-pointer ${
                      chargesTab === "sofar"
                        ? "bg-white text-[#0D1935] shadow-[0px_1px_2px_0px_rgba(18,27,52,0.06)]"
                        : "text-[#54617E] hover:text-[#0D1935]"
                    }`}
                  >
                    Charges so far
                  </button>
                </div>

                {/* Line Items Breakdown */}
                <div className="flex flex-col">
                  {/* Dynamic Active Plan Lines */}
                  {visibleLines.length > 0 ? (
                    visibleLines.map((line, index) => (
                      <div
                        key={line.id}
                        className={`py-2.5 ${
                          index > 0 ? "border-t border-[#121E3E]/10" : ""
                        } flex items-center justify-between gap-2.5`}
                      >
                        <div className="inline-flex items-center gap-2 text-[#54617E] text-xs min-w-0">
                          <Smartphone className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                          <span className="truncate">
                            {line.planName} · {line.number}
                          </span>
                        </div>
                        <span className="text-[#0D1935] text-xs font-semibold shrink-0">
                          £{line.monthlyPrice.toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2.5 flex items-center justify-between gap-2.5">
                      <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                        <Smartphone className="w-3.5 h-3.5 text-[#54617E]" />
                        <span>Monthly mobile plans</span>
                      </div>
                      <span className="text-[#0D1935] text-xs font-semibold">£0.00</span>
                    </div>
                  )}

                  {/* Data boosters */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Database className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Data boosters</span>
                    </div>
                    <span className="text-[#0D1935] text-xs font-semibold">
                      £{extraSpend.boosters.toFixed(2)}
                    </span>
                  </div>

                  {/* Roaming */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Globe className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Roaming</span>
                    </div>
                    <span className="text-[#0D1935] text-xs font-semibold">
                      £{extraSpend.roaming.toFixed(2)}
                    </span>
                  </div>

                  {/* International calls & texts */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Phone className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>International calls & texts</span>
                    </div>
                    <span className="text-[#0D1935] text-xs font-semibold">
                      £{extraSpend.international.toFixed(2)}
                    </span>
                  </div>

                  {/* Credits & adjustments */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Wallet className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Credits & adjustments</span>
                    </div>
                    <span className="text-[#0D1935] text-xs font-semibold">£0.00</span>
                  </div>

                  {/* Net amount */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Info className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>Net amount</span>
                    </div>
                    <span className="text-[#54617E] text-xs font-medium">
                      £{netAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* VAT at 20% */}
                  <div className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#54617E] text-xs">
                      <Percent className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>VAT at 20% (included)</span>
                    </div>
                    <span className="text-[#54617E] text-xs font-medium">
                      £{vatAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Bill total */}
                  <div className="pt-3 pb-1 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5">
                    <div className="inline-flex items-center gap-2 text-[#0D1935] text-xs font-bold">
                      <Receipt className="w-3.5 h-3.5 text-[#54617E]" />
                      <span>{chargesTab === "issued" ? "Bill total" : "Total so far"}</span>
                    </div>
                    <span className="text-[#0D1935] text-xs font-bold">
                      £{activeChargesTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Query a charge link */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setQueryChargeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[#E01C5B] text-xs font-semibold hover:underline cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Query a charge</span>
                </button>
              </div>
            </div>

            {/* Card 8: Spend toward your bill limit */}
            <div className="p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3.5">
                {/* Header */}
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Gauge className="w-4 h-4 text-[#E01C5B]" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[#0D1935] text-base font-bold leading-5">
                      Spend toward your bill limit
                    </h2>
                    <span className="text-[#54617E] text-xs font-normal leading-4">
                      Current cycle · charges outside your plans
                    </span>
                  </div>
                </div>

                {/* Circular Donut Gauge + Category Legend */}
                <div className="py-2 flex items-center gap-4">
                  {/* Donut SVG */}
                  <div className="w-28 h-28 relative flex items-center justify-center shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                      <circle
                        cx="56"
                        cy="56"
                        r={gaugeRadius}
                        fill="none"
                        stroke="#ECEFF5"
                        strokeWidth="10"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r={gaugeRadius}
                        fill="none"
                        stroke="#E01C5B"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={gaugeOffset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                      <span className="text-[#0D1935] text-lg font-extrabold leading-5">
                        £{totalExtraSpend.toFixed(2)}
                      </span>
                      <span className="text-[#54617E] text-[10px] font-medium leading-3 pt-0.5">
                        counted of
                      </span>
                      <span className="text-[#54617E] text-[10px] font-medium leading-3">
                        £{billLimit.toFixed(2)} limit
                      </span>
                    </div>
                  </div>

                  {/* 4 Spend Categories */}
                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-xs text-[#0D1935] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#E01C5B] shrink-0" />
                        <span>Data boosters</span>
                      </div>
                      <span className="text-[#0D1935] text-xs font-semibold">
                        £{extraSpend.boosters.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-xs text-[#0D1935] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#0D1935] shrink-0" />
                        <span>Roaming day passes</span>
                      </div>
                      <span className="text-[#0D1935] text-xs font-semibold">
                        £{extraSpend.roaming.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-xs text-[#0D1935] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#D9822B] shrink-0" />
                        <span>International calls & texts</span>
                      </div>
                      <span className="text-[#0D1935] text-xs font-semibold">
                        £{extraSpend.international.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-xs text-[#0D1935] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#1E8E5A] shrink-0" />
                        <span>Premium-rate & other services</span>
                      </div>
                      <span className="text-[#0D1935] text-xs font-semibold">
                        £{extraSpend.premium.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Limit Warning / Status Pill */}
                {billLimit > 0 && totalExtraSpend >= billLimit ? (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl inline-flex items-center gap-2 text-rose-700 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Monthly bill limit reached (£{billLimit.toFixed(2)}) — further out-of-plan spend paused</span>
                  </div>
                ) : billLimit > 0 && totalExtraSpend >= billLimit * 0.8 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl inline-flex items-center gap-2 text-amber-700 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Approaching spend limit (80% used: £{totalExtraSpend.toFixed(2)} of £{billLimit.toFixed(2)})</span>
                  </div>
                ) : billLimit === 0 ? (
                  <div className="p-2 bg-slate-100 rounded-xl inline-flex items-center gap-2 text-[#54617E] text-xs font-medium">
                    <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                    <span>Spend cap set to £0 — all out-of-plan charges are blocked</span>
                  </div>
                ) : null}

                {/* Explanatory Info Box */}
                <div className="p-3 bg-[#F4F5F8] rounded-xl inline-flex items-start gap-2 text-[#54617E] text-[11px] leading-4">
                  <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-[#54617E]">Not counted:</strong>{" "}
                    your monthly plan charges (£{totalPlanPrices.toFixed(2)}). Your whole
                    bill isn&apos;t £0 — this only tracks extra spend. We&apos;ll text you at
                    80% and won&apos;t charge above your limit without your agreement.
                  </span>
                </div>
              </div>

              {/* Footer Link */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempBillLimit(billLimit.toFixed(2));
                    setBillLimitModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-[#E01C5B] text-xs font-semibold hover:underline cursor-pointer"
                >
                  <span>Change bill limit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 9: Quick actions */}
            <div className="p-6 bg-white rounded-3xl shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] flex flex-col justify-start gap-3.5">
              {/* Header */}
              <div className="inline-flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[#0D1935] text-base font-bold leading-5">
                    Quick actions
                  </h2>
                  <span className="text-[#54617E] text-xs font-normal leading-4">
                    For billing account ••{mandateRefSuffix}
                  </span>
                </div>
              </div>

              {/* Action Items List */}
              <div className="flex flex-col">
                {/* 1. Make a payment (Interactive with validation modal) */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(activeChargesTotal > 0 ? activeChargesTotal.toFixed(2) : "10.00");
                    setPaymentError("");
                    setMakePaymentModalOpen(true);
                  }}
                  className="py-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E01C5B]/10 rounded-lg flex items-center justify-center shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Make a payment
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        {latestBill.dueShort !== "—"
                          ? `Pay now or let Direct Debit collect on ${latestBill.dueShort}`
                          : "Pay now or add account credit"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                </button>

                {/* 2. Download bills with check */}
                <button
                  type="button"
                  onClick={() => {
                    const issued = billsHistory.filter((b) => !b.isEstimate);
                    if (issued.length === 0) {
                      showToast("No issued bills to download yet. Your statements will appear once issued.", "info");
                      return;
                    }
                    setShowBillsTable(true);
                    historySectionRef.current?.scrollIntoView({ behavior: "smooth" });
                    handleDownloadBillPdf(latestBill);
                  }}
                  className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E01C5B]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Download className="w-3.5 h-3.5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Download bills
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        PDFs of your issued bills
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                </button>

                {/* 3. Manage payment methods */}
                <button
                  type="button"
                  onClick={() => {
                    paymentMethodsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                    setTempCardBrand(savedCard?.brand || "Visa debit");
                    setTempCardLast4(savedCard?.last4 || "");
                    setTempCardExpiry(savedCard?.expiry || "");
                    setCardModalOpen(true);
                  }}
                  className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E01C5B]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Manage payment methods
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        Direct Debit and saved card
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                </button>

                {/* 4. Set or change bill limit */}
                <button
                  type="button"
                  onClick={() => {
                    setTempBillLimit(billLimit.toFixed(2));
                    setBillLimitModalOpen(true);
                  }}
                  className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E01C5B]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Gauge className="w-3.5 h-3.5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Set or change bill limit
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        Currently £{billLimit.toFixed(2)} a month
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                </button>

                {/* 5. Query or dispute a charge */}
                <button
                  type="button"
                  onClick={() => setQueryChargeModalOpen(true)}
                  className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E01C5B]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Flag className="w-3.5 h-3.5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Query or dispute a charge
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        We&apos;ll give you a case reference
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                </button>

                {/* 6. Billing help */}
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/support")}
                  className="py-2.5 border-t border-[#121E3E]/10 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/70 rounded-xl px-1 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E01C5B]/10 rounded-lg flex items-center justify-center shrink-0">
                      <HelpCircle className="w-3.5 h-3.5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#0D1935] text-xs font-semibold leading-4">
                        Billing help
                      </span>
                      <span className="text-[#54617E] text-[11px] font-normal leading-4">
                        Answers and contact options
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE MODALS ── */}

      {/* 1. Set or Change Bill Limit Modal */}
      {billLimitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Monthly mobile bill limit
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    Caps extra spend outside your monthly plans
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBillLimitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBillLimit} className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Select preset or enter custom limit (£)
                </label>
                <div className="grid grid-cols-4 gap-2 pb-1">
                  {[0, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempBillLimit(preset.toFixed(2))}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        parseFloat(tempBillLimit) === preset
                          ? "bg-[#E01C5B] text-white border-[#E01C5B]"
                          : "bg-slate-50 text-[#0D1935] border-slate-200 hover:border-[#E01C5B]/40"
                      }`}
                    >
                      £{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tempBillLimit}
                  onChange={(e) => {
                    setTempBillLimit(e.target.value);
                    if (billLimitError) setBillLimitError("");
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                    billLimitError
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {billLimitError && (
                  <p className="text-xs text-rose-500 font-medium">{billLimitError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBillLimitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] cursor-pointer"
                >
                  Save bill limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manage Direct Debit Modal */}
      {ddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#0D1935] rounded-xl flex items-center justify-center text-white text-xs font-extrabold">
                  DD
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Manage Direct Debit
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    Mandate ref ••{mandateRefSuffix} · {mandateStatusLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDdModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectDebit} className="pt-4 flex flex-col gap-3.5">
              <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-[#54617E] leading-5">
                Your Direct Debit automatically collects your monthly bill on its scheduled due date. Protected by the UK Direct Debit Guarantee.
              </div>

              {/* Account holder name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Account holder name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={ddAccountName}
                  onChange={(e) => {
                    setDdAccountName(e.target.value);
                    if (ddErrors.name) setDdErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                    ddErrors.name
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {ddErrors.name && (
                  <p className="text-xs text-rose-500 font-medium">{ddErrors.name}</p>
                )}
              </div>

              {/* Sort code and Account number grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0D1935]">
                    Sort code
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="20-40-60"
                    value={ddSortCode}
                    onChange={(e) => {
                      setDdSortCode(e.target.value);
                      if (ddErrors.sortCode)
                        setDdErrors((prev) => ({ ...prev, sortCode: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                      ddErrors.sortCode
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {ddErrors.sortCode && (
                    <p className="text-xs text-rose-500 font-medium">{ddErrors.sortCode}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0D1935]">
                    Account number
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="8 digits"
                    value={ddAccountNumber}
                    onChange={(e) => {
                      setDdAccountNumber(e.target.value);
                      if (ddErrors.accountNumber)
                        setDdErrors((prev) => ({ ...prev, accountNumber: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                      ddErrors.accountNumber
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {ddErrors.accountNumber && (
                    <p className="text-xs text-rose-500 font-medium">{ddErrors.accountNumber}</p>
                  )}
                </div>
              </div>

              {/* Confirmation checkbox */}
              <div className="pt-1 flex flex-col gap-1">
                <label className="flex items-start gap-2.5 text-xs text-[#54617E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ddConfirmed}
                    onChange={(e) => {
                      setDdConfirmed(e.target.checked);
                      if (ddErrors.confirmed)
                        setDdErrors((prev) => ({ ...prev, confirmed: undefined }));
                    }}
                    className="mt-0.5 rounded border-slate-300 text-[#E01C5B] focus:ring-[#E01C5B]"
                  />
                  <span>
                    I confirm that I am the account holder or authorized to operate this account, and agree to the Direct Debit Guarantee.
                  </span>
                </label>
                {ddErrors.confirmed && (
                  <p className="text-xs text-rose-500 font-medium">{ddErrors.confirmed}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {bankLast2 !== "—" ? (
                  <button
                    type="button"
                    onClick={handleRemoveDirectDebit}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Remove mandate
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDdModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] cursor-pointer"
                  >
                    {bankLast2 !== "—" ? "Update mandate" : "Set up mandate"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add or Replace Saved Card Modal */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Saved payment card
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    Used for one-off payments & add-on boosters
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCardModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="pt-4 flex flex-col gap-3.5">
              {/* Cardholder name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Cardholder name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={cardHolderName}
                  onChange={(e) => {
                    setCardHolderName(e.target.value);
                    if (cardErrors.name) setCardErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                    cardErrors.name
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {cardErrors.name && (
                  <p className="text-xs text-rose-500 font-medium">{cardErrors.name}</p>
                )}
              </div>

              {/* 16-digit card number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Card number
                </label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="•••• •••• •••• •••• (16 digits)"
                  value={cardNumber}
                  onChange={(e) => {
                    setCardNumber(e.target.value);
                    if (cardErrors.number)
                      setCardErrors((prev) => ({ ...prev, number: undefined }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                    cardErrors.number
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {cardErrors.number && (
                  <p className="text-xs text-rose-500 font-medium">{cardErrors.number}</p>
                )}
              </div>

              {/* Expiry and CVC grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0D1935]">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={tempCardExpiry}
                    onChange={(e) => {
                      setTempCardExpiry(e.target.value);
                      if (cardErrors.expiry)
                        setCardErrors((prev) => ({ ...prev, expiry: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                      cardErrors.expiry
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {cardErrors.expiry && (
                    <p className="text-xs text-rose-500 font-medium">{cardErrors.expiry}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0D1935]">
                    Security code (CVC)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="3 or 4 digits"
                    value={cardCvc}
                    onChange={(e) => {
                      setCardCvc(e.target.value);
                      if (cardErrors.cvc)
                        setCardErrors((prev) => ({ ...prev, cvc: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                      cardErrors.cvc
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {cardErrors.cvc && (
                    <p className="text-xs text-rose-500 font-medium">{cardErrors.cvc}</p>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl inline-flex items-center gap-2 text-[#54617E] text-[11px] leading-4">
                <Lock className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                <span>Encrypted with bank-grade 256-bit SSL. Full card numbers are never stored in plain text.</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {savedCard ? (
                  <button
                    type="button"
                    onClick={handleRemoveCard}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Remove card
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCardModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] cursor-pointer"
                  >
                    Save card
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Query or Dispute a Charge Modal */}
      {queryChargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center">
                  <Flag className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Query or dispute a charge
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    We&apos;ll investigate and reply with an official case reference
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQueryChargeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitChargeQuery} className="pt-4 flex flex-col gap-3.5">
              {/* Bill reference */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">Statement / Cycle</label>
                <select
                  value={queryChargeBillRef}
                  onChange={(e) => setQueryChargeBillRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                >
                  {billsHistory.filter((b) => !b.isEstimate).length > 0 ? (
                    billsHistory
                      .filter((b) => !b.isEstimate)
                      .map((b) => (
                        <option key={b.id} value={b.reference}>
                          {b.reference} ({b.periodLabel}) · £{b.amount.toFixed(2)}
                        </option>
                      ))
                  ) : (
                    <option value="Current billing cycle">Current billing cycle</option>
                  )}
                </select>
              </div>

              {/* Charge category */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">Charge category</label>
                <select
                  value={queryChargeCategory}
                  onChange={(e) => {
                    setQueryChargeCategory(e.target.value);
                    if (queryChargeErrors.category) {
                      setQueryChargeErrors((prev) => ({ ...prev, category: undefined }));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                >
                  <option value="Data booster">Data booster (£{extraSpend.boosters.toFixed(2)})</option>
                  <option value="Roaming day passes">Roaming charges (£{extraSpend.roaming.toFixed(2)})</option>
                  <option value="International calls & texts">International calls & texts (£{extraSpend.international.toFixed(2)})</option>
                  <option value="Premium-rate services">Premium-rate & other services (£{extraSpend.premium.toFixed(2)})</option>
                  <option value="Monthly plan charges">Monthly mobile plan fee</option>
                  <option value="Unrecognised transaction">Unrecognised transaction</option>
                  <option value="Other">Other query</option>
                </select>
                {queryChargeErrors.category && (
                  <p className="text-xs text-rose-500 font-medium">{queryChargeErrors.category}</p>
                )}
              </div>

              {/* Disputed Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Disputed amount (£) <span className="font-normal text-[#54617E]">(optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 21.00"
                  value={queryChargeAmount}
                  onChange={(e) => {
                    setQueryChargeAmount(e.target.value);
                    if (queryChargeErrors.amount) {
                      setQueryChargeErrors((prev) => ({ ...prev, amount: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0D1935] focus:outline-none ${
                    queryChargeErrors.amount
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {queryChargeErrors.amount && (
                  <p className="text-xs text-rose-500 font-medium">{queryChargeErrors.amount}</p>
                )}
              </div>

              {/* Detailed reason */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Explain what doesn&apos;t look right
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide details about the specific charge or discrepancy (min 15 characters)..."
                  value={queryChargeReason}
                  onChange={(e) => {
                    setQueryChargeReason(e.target.value);
                    if (queryChargeErrors.reason) {
                      setQueryChargeErrors((prev) => ({ ...prev, reason: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0D1935] focus:outline-none ${
                    queryChargeErrors.reason
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] text-[#54617E]">
                  <span>{queryChargeReason.length}/1000 characters (min 15)</span>
                  {queryChargeErrors.reason && (
                    <span className="text-rose-500 font-medium">{queryChargeErrors.reason}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQueryChargeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuery}
                  className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingQuery ? "Submitting query..." : "Submit query"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Make a Payment Modal */}
      {makePaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#E01C5B]/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#E01C5B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">
                    Make a payment
                  </h3>
                  <p className="text-xs text-[#54617E]">
                    Pay your bill balance or add account credit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMakePaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMakeOneOffPayment} className="pt-4 flex flex-col gap-4">
              {/* Account summary pill */}
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#54617E] block text-[11px]">Current charges total</span>
                  <span className="font-bold text-[#0D1935] text-sm">£{activeChargesTotal.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#54617E] block text-[11px]">Account credit balance</span>
                  <span className="font-bold text-[#1E8E5A] text-sm">£{accountCredit.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount Input & Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Select preset or enter custom amount (£)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, activeChargesTotal > 0 ? activeChargesTotal : 100].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPaymentAmount(preset.toFixed(2));
                        setPaymentError("");
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        parseFloat(paymentAmount) === preset
                          ? "bg-[#E01C5B] text-white border-[#E01C5B]"
                          : "bg-slate-50 text-[#0D1935] border-slate-200 hover:border-[#E01C5B]/40"
                      }`}
                    >
                      £{preset.toFixed(2)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="500"
                  placeholder="£0.00"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    if (paymentError) setPaymentError("");
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-[#0D1935] focus:outline-none ${
                    paymentError
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                />
                {paymentError && (
                  <p className="text-xs text-rose-500 font-medium">{paymentError}</p>
                )}
              </div>

              {/* Payment method selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">Payment method</label>
                {savedCard ? (
                  <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#E01C5B]" />
                      <span className="font-semibold text-[#0D1935]">
                        {savedCard.brand} ••••{savedCard.last4}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#54617E]">Expires {savedCard.expiry}</span>
                  </div>
                ) : bankLast2 !== "—" && bankLast2 ? (
                  <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#0D1935] text-white text-[9px] font-bold rounded flex items-center justify-center">DD</span>
                      <span className="font-semibold text-[#0D1935]">Direct Debit (••{bankLast2})</span>
                    </div>
                    <span className="text-[11px] text-[#1E8E5A] font-semibold">Active mandate</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                    <span>No saved card or mandate found.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMakePaymentModalOpen(false);
                        setCardModalOpen(true);
                      }}
                      className="font-bold text-[#E01C5B] hover:underline"
                    >
                      Add a card
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMakePaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold hover:bg-[#c81750] transition disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingPayment
                    ? "Processing payment..."
                    : paymentAmount && !isNaN(parseFloat(paymentAmount))
                    ? `Pay £${parseFloat(paymentAmount).toFixed(2)}`
                    : "Pay now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Dashboard Modals */}
      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={20}
        onApplyBooster={(addedGb: number, cost: number) => {
          recordBoosterPurchase({
            addedGb,
            cost,
            lineId: lines[0]?.id || "primary-line-1",
            lineNumber: lines[0]?.number,
            boosterName: `${addedGb} GB Data Booster`,
          });
          setExtraSpend((prev) => ({
            ...prev,
            boosters: Number((prev.boosters + cost).toFixed(2)),
          }));
          showToast(`Added +${addedGb}GB booster (£${cost.toFixed(2)})`, "success");
        }}
      />
      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={() => showToast("Report submitted to our security team", "success")}
      />
      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName={lines[0]?.planName || "Zoiko SIM Plan"}
        onSelectPlan={(planTitle: string) => {
          setComparePlansOpen(false);
          showToast(`Selected ${planTitle}`, "info");
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Copy,
  Check,
  Phone,
  MessageSquare,
  Plus,
  Clock,
  Eye,
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Info,
  BarChart2,
  Cpu,
  Ban,
  Globe,
  Gauge,
  X,
} from "lucide-react";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import {
  BoosterModal,
  ReportActivityModal,
  ComparePlansModal,
  AddNumberModal,
  AddNumberData,
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
  validateUkMobile,
  validateSpendLimit,
  validatePacCode,
  validateStacCode,
} from "../../utils/validators";

export interface MobileNumberLine {
  id: string;
  number: string;
  planName: string;
  simType: string;
  status: string;
  renewDate: string;
  activationDate: string;
  contractType: string;
  networkTechnology: string;
  price: number;
  isPrimary?: boolean;
  isUnlimited?: boolean;
  transferInProgress?: boolean;
  callsLabel: string;
  textsLabel: string;
  roamingIncluded: boolean;
}

export interface LineUsageMetrics {
  dataRemaining: number;
  dataTotal: number;
  dataUsed: number;
  callsRemaining: number | null;
  callsTotal: number | null;
  callsUnlimited: boolean;
  textsRemaining: number | null;
  textsTotal: number | null;
  textsUnlimited: boolean;
  roamingRemaining: number;
  roamingTotal: number;
}

// ── Dynamic Formatters ──
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

function kbToGb(kb: number): number {
  return Number((kb / 1024 / 1024).toFixed(1));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEsim(line: any): boolean {
  return (
    line.is_esim === true ||
    line.is_esim === "true" ||
    line.is_esim === 1 ||
    line.is_esim === "1" ||
    (typeof line.sim_type === "string" && line.sim_type.toLowerCase() === "esim")
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPrimary(line: any): boolean {
  return (
    line.primary === true ||
    line.primary === "true" ||
    line.primary === 1 ||
    line.primary === "1"
  );
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

export default function MyMobileNumbersPage() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // ── Dynamic Auth & Account State ──
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Account holder");
  const [accountEmail, setAccountEmail] = useState<string>("");
  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Navigation & Header State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("numbers");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ── Dynamic Lines & Metrics ──
  const [lines, setLines] = useState<MobileNumberLine[]>([]);
  const [activeLineId, setActiveLineId] = useState<string>("");
  const [usageMetrics, setUsageMetrics] = useState<Record<string, LineUsageMetrics>>({});

  // ── Dynamic Account Billing ──
  const [nextCollectionAmount, setNextCollectionAmount] = useState<number>(0);
  const [nextCollectionDate, setNextCollectionDate] = useState<string>("—");
  const [paymentMethodLabel, setPaymentMethodLabel] = useState<string>("Direct Debit");
  const [lastPaymentAmount, setLastPaymentAmount] = useState<number>(0);
  const [lastPaymentDate, setLastPaymentDate] = useState<string>("—");
  const [lastPaymentStatus, setLastPaymentStatus] = useState<string>("—");
  const [billLimit, setBillLimit] = useState<number>(0);

  // ── UI Helpers & Modals ──
  const [freshnessTime, setFreshnessTime] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" | "error" } | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [boosterOpen, setBoosterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [comparePlansOpen, setComparePlansOpen] = useState(false);
  const [addNumberModalOpen, setAddNumberModalOpen] = useState(false);
  const [pacModalOpen, setPacModalOpen] = useState(false);
  const [pacTab, setPacTab] = useState<"leave" | "switch_in">("leave");
  const [portOldNumber, setPortOldNumber] = useState<string>("");
  const [portCode, setPortCode] = useState<string>("");
  const [portErrors, setPortErrors] = useState<{ number?: string; code?: string }>({});
  const [portSubmitting, setPortSubmitting] = useState<boolean>(false);

  const [billLimitModalOpen, setBillLimitModalOpen] = useState(false);
  const [tempBillLimit, setTempBillLimit] = useState<string>("0");
  const [billLimitError, setBillLimitError] = useState<string>("");

  const showToast = (msg: string, type: "success" | "info" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Close "More" menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Copy phone number helper
  const handleCopyNumber = (num: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!num || num === "No active number") return;
    try {
      navigator.clipboard.writeText(num);
    } catch {}
    setCopiedId(id);
    showToast(`Copied ${num} to clipboard`, "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Load 100% Dynamic Data from Django & BeQuick APIs ──
  const loadDynamicNumbers = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      setFreshnessTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
          " BST, " +
          now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      );

      // Remove any leftover local custom lines
      try {
        localStorage.removeItem("zoiko_custom_lines");
      } catch {}

      const savedLimit = localStorage.getItem("zoiko_bill_limit");
      if (savedLimit && !isNaN(Number(savedLimit))) {
        setBillLimit(Number(savedLimit));
        setTempBillLimit(String(Number(savedLimit)));
      }

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
      setAccountEmail(email);
      if (userData?.role) setUserRole(String(userData.role));

      // Reset dynamic state before fetching
      setLines([]);
      setUsageMetrics({});
      setActiveLineId("");
      setNextCollectionAmount(0);
      setNextCollectionDate("—");
      setLastPaymentAmount(0);
      setLastPaymentDate("—");
      setLastPaymentStatus("—");

      // Dynamic collection for Django SIM park orders
      const orderSimLines: MobileNumberLine[] = [];
      const orderUsageMap: Record<string, LineUsageMetrics> = {};

      // Fetch live catalogue plans from Django so we can match plan prices/allowances dynamically
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

      // 1. Check Django bqorders for subscriber_id & latest payment
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
            for (const [, entries] of Object.entries(userGroups)) {
              const entry = entries?.[0];
              if (!entry) continue;
              if (!foundSubscriberId && entry.subscriber_id) {
                foundSubscriberId = entry.subscriber_id;
              }
              if (entry.total !== undefined) {
                const dateStr = entry.created_at
                  ? new Date(entry.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent";
                setLastPaymentAmount(Number(entry.total || 0));
                setLastPaymentDate(dateStr);
                setLastPaymentStatus("Settled");
              }
            }
          }
        } catch (e) {
          console.warn("Could not query Django bqorders:", e);
        }

        // 1b. Also check Django sims/orders/by-user
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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const groups = (simData.groups?.[email] || {}) as Record<string, any[]>;
            for (const [, entries] of Object.entries(groups)) {
              if (entries?.[0]) ordersList.push(entries[0]);
            }

            for (const ord of ordersList) {
              if (ord.total || ord.amount) {
                const dateStr = ord.created_at
                  ? new Date(ord.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent";
                setLastPaymentAmount((prev) =>
                  prev > 0 ? prev : Number(ord.total || ord.amount || 0)
                );
                setLastPaymentDate((prev) => (prev !== "—" ? prev : dateStr));
                setLastPaymentStatus("Settled");
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const assignedSims: any[] = Array.isArray(ord.sims) ? ord.sims : [];
              for (const sim of assignedSims) {
                if (!sim.msisdn && !sim.iccid) continue;
                const formattedNum = formatUkNumber(sim.msisdn || "");
                const lineId = String(sim.iccid || sim.msisdn || Math.random());

                // Find matching plan in catalogue
                const matchedCataloguePlan = cataloguePlans.find(
                  (cp) =>
                    (sim.transatelID && String(cp.transatelID) === String(sim.transatelID)) ||
                    (sim.plan_name && cp.name?.toLowerCase() === sim.plan_name.toLowerCase())
                );

                const planName = matchedCataloguePlan?.name || sim.plan_name || "Zoiko Mobile Plan";
                const price = Number(
                  matchedCataloguePlan?.price_30 ||
                    matchedCataloguePlan?.final_price ||
                    matchedCataloguePlan?.price ||
                    14.99
                );
                const simType =
                  sim.sim_type?.toLowerCase() === "esim" || sim.is_esim
                    ? "eSIM"
                    : "Physical SIM";
                const isUnlim = planName.toLowerCase().includes("unlimited");
                const parsedGb = matchedCataloguePlan?.data_allowance
                  ? parseFloat(String(matchedCataloguePlan.data_allowance))
                  : 10;
                const dataTotal = !isNaN(parsedGb) ? parsedGb : 10;

                const activationDate = sim.activated_at
                  ? new Date(sim.activated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Confirmed by network";

                orderUsageMap[lineId] = {
                  dataRemaining: dataTotal,
                  dataTotal: dataTotal,
                  dataUsed: 0,
                  callsRemaining: null,
                  callsTotal: null,
                  callsUnlimited: true,
                  textsRemaining: null,
                  textsTotal: null,
                  textsUnlimited: true,
                  roamingRemaining: 5,
                  roamingTotal: 5,
                };

                orderSimLines.push({
                  id: lineId,
                  number: formattedNum,
                  planName,
                  simType,
                  status:
                    sim.provisioning_status === "ACTIVATED" || sim.activated_at
                      ? "Active"
                      : "Pending",
                  renewDate: "Monthly",
                  activationDate,
                  contractType: "Monthly rolling",
                  networkTechnology: "5G & 4G LTE",
                  price,
                  isPrimary: false,
                  isUnlimited: isUnlim,
                  transferInProgress: false,
                  callsLabel: "Unlimited UK calls",
                  textsLabel: "Unlimited UK texts",
                  roamingIncluded: true,
                });
              }
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

      // 3. If subscriber found, fetch subscriber details, live lines, plan details, bills & payment methods
      if (foundSubscriberId) {
        setSubscriberId(foundSubscriberId);

        // Enrich user name from BeQuick subscriber record if available
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subDetails = (await beQuick.getSubscriberDetails(foundSubscriberId)) as any;
          const subObj = subDetails?.subscriber || subDetails?.subscribers?.[0] || subDetails;
          if (subObj) {
            const bqName = [subObj.first_name, subObj.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();
            if (bqName) setUserName(bqName);
          }
        } catch {}

        // Fetch User Lines
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bqLines = ((await beQuick.getUserLines(foundSubscriberId)) || []) as any[];
          if (bqLines && bqLines.length > 0) {
            const newUsageMap: Record<string, LineUsageMetrics> = {};

            const loadedLines: MobileNumberLine[] = await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              bqLines.map(async (line: any, idx: number) => {
                const lineId = String(line.id);
                let planName = line.device_name || line.plan_name || "Zoiko Mobile Plan";
                let renewDate = "Monthly";
                const simType = isEsim(line) ? "eSIM" : "Physical SIM";
                const status = niceStatus(line.status);
                let activationDate =
                  line.activated_at || line.created_at
                    ? new Date(line.activated_at || line.created_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "Confirmed by network";
                let contractType = "Monthly rolling";
                const networkTechnology = "5G eligible";
                let price = Number(line.price || 0);
                let isUnlim = false;
                let roamingIncluded = true;
                let callsLabel = "Unlimited UK calls";
                let textsLabel = "Unlimited UK texts";

                let metric: LineUsageMetrics = {
                  dataRemaining: 0,
                  dataTotal: 0,
                  dataUsed: 0,
                  callsRemaining: null,
                  callsTotal: null,
                  callsUnlimited: true,
                  textsRemaining: null,
                  textsTotal: null,
                  textsUnlimited: true,
                  roamingRemaining: 0,
                  roamingTotal: 0,
                };

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
                  if (currentPlan?.billing_period || currentPlan?.contract_type) {
                    contractType = String(
                      currentPlan.contract_type || currentPlan.billing_period
                    );
                  }

                  // Match against Django catalogue plans if price or data allowance is missing
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

                  if (planName.toLowerCase().includes("unlimited")) {
                    isUnlim = true;
                  }

                  if (details?.service_period?.start_at && activationDate === "Confirmed by network") {
                    activationDate = new Date(
                      details.service_period.start_at
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  }

                  if (details?.service_period?.end_at) {
                    const endDate = new Date(details.service_period.end_at);
                    renewDate = endDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    });
                  }

                  if (details?.usage_summary?.data) {
                    const d = details.usage_summary.data;
                    const tot = d.total ? kbToGb(Number(d.total)) : 0;
                    const usd = d.used ? kbToGb(Number(d.used)) : 0;
                    const rem =
                      d.remaining !== undefined
                        ? kbToGb(Number(d.remaining))
                        : Math.max(0, Number((tot - usd).toFixed(1)));
                    metric.dataTotal = tot;
                    metric.dataUsed = usd;
                    metric.dataRemaining = rem;
                  } else if (matchedCataloguePlan?.data_allowance) {
                    const parsedGb = parseFloat(
                      String(matchedCataloguePlan.data_allowance)
                    );
                    if (!isNaN(parsedGb)) {
                      metric.dataTotal = parsedGb;
                      metric.dataRemaining = parsedGb;
                    }
                  }

                  if (details?.usage_summary?.voice) {
                    const v = details.usage_summary.voice;
                    if (v.total && !v.unlimited) {
                      metric.callsUnlimited = false;
                      metric.callsTotal = Number(v.total);
                      metric.callsRemaining = Number(v.remaining ?? v.total);
                      callsLabel = `${metric.callsRemaining} mins left`;
                    }
                  }

                  if (details?.usage_summary?.sms) {
                    const s = details.usage_summary.sms;
                    if (s.total && !s.unlimited) {
                      metric.textsUnlimited = false;
                      metric.textsTotal = Number(s.total);
                      metric.textsRemaining = Number(s.remaining ?? s.total);
                      textsLabel = `${metric.textsRemaining} texts left`;
                    }
                  }

                  if (details?.usage_summary?.international_data) {
                    const id = details.usage_summary.international_data;
                    metric.roamingTotal = id.total ? kbToGb(Number(id.total)) : 0;
                    metric.roamingRemaining =
                      id.remaining !== undefined
                        ? kbToGb(Number(id.remaining))
                        : metric.roamingTotal;
                    roamingIncluded = metric.roamingTotal > 0;
                  }
                } catch (e) {
                  console.warn("Could not fetch plan details for line", line.id, e);
                }

                newUsageMap[lineId] = metric;

                return {
                  id: lineId,
                  number: formatUkNumber(line.mdn),
                  planName,
                  simType,
                  status,
                  renewDate,
                  activationDate,
                  contractType,
                  networkTechnology,
                  price,
                  isPrimary: isPrimary(line) || idx === 0,
                  isUnlimited: isUnlim,
                  transferInProgress: status === "Pending",
                  callsLabel,
                  textsLabel,
                  roamingIncluded,
                };
              })
            );

            setLines(loadedLines);
            setUsageMetrics(newUsageMap);
            setUnreadNotifications(loadedLines.length);

            const primary = loadedLines.find((l) => l.isPrimary) || loadedLines[0];
            if (primary) {
              setActiveLineId(primary.id);
              setNextCollectionDate(primary.renewDate);
            }

            // Sum active line prices as fallback next collection amount if current bill is 0
            const sumPrices = loadedLines
              .filter((l) => l.status.toLowerCase() === "active")
              .reduce((acc, l) => acc + (l.price || 0), 0);
            if (sumPrices > 0) {
              setNextCollectionAmount(Number(sumPrices.toFixed(2)));
            }
          }
        } catch (e) {
          console.warn("Error fetching user lines:", e);
        }

        // Fetch Payment Methods
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pmRes = (await beQuick.getPaymentMethods(foundSubscriberId)) as any;
          const pms = pmRes?.payment_methods || pmRes?.data || [];
          if (Array.isArray(pms) && pms.length > 0) {
            const pm = pms[0];
            const typeStr = pm.payment_type || pm.type || "Direct Debit";
            setPaymentMethodLabel(
              typeStr.toLowerCase().includes("card") ? "Card payment" : "Direct Debit"
            );
          }
        } catch {}

        // Fetch Current Bill
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bill = (await beQuick.getCurrentBill(foundSubscriberId)) as any;
          if (bill) {
            const tot = Number(bill.total || 0);
            if (tot > 0) setNextCollectionAmount(tot);
            if (bill.closed_at || bill.due_at) {
              const bd = new Date(bill.closed_at || bill.due_at);
              setNextCollectionDate(
                bd.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              );
            }
          }
        } catch (e) {
          console.warn("Error fetching current bill:", e);
        }

        // Fetch BeQuick Orders
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ordRes = (await beQuick.getOrders(foundSubscriberId)) as any;
          const list = ordRes?.orders || ordRes?.data || [];
          if (list.length > 0) {
            const first = list[0];
            const amt = Number(first.amount || first.total || 0);
            if (amt > 0) setLastPaymentAmount(amt);
            if (first.created_at) {
              setLastPaymentDate(
                new Date(first.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              );
            }
            setLastPaymentStatus(niceStatus(first.status || "Settled"));
          }
        } catch (e) {
          console.warn("Error fetching orders:", e);
        }
      }

      // Merge BeQuick lines, Django SIM order lines, and local storage additions
      setLines((current) => {
        const combined = [...current];
        for (const osl of orderSimLines) {
          if (!combined.some((l) => l.number === osl.number || l.id === osl.id)) {
            combined.push(osl);
          }
        }

        if (combined.length > 0) {
          if (!combined.some((l) => l.isPrimary)) {
            combined[0].isPrimary = true;
          }
          const primary = combined.find((l) => l.isPrimary) || combined[0];
          setActiveLineId(primary.id);
          setNextCollectionDate(primary.renewDate);
          setUnreadNotifications(combined.length);
          setUsageMetrics((prev) => ({ ...orderUsageMap, ...prev }));

          const sumPrices = combined
            .filter((l) => l.status.toLowerCase() === "active")
            .reduce((acc, l) => acc + (l.price || 0), 0);
          if (sumPrices > 0) {
            setNextCollectionAmount(Number(sumPrices.toFixed(2)));
          }

          // Merge any user added lines from Add New Number wizard
          try {
            const storedAdded = localStorage.getItem("zoiko_added_lines");
            if (storedAdded) {
              const parsedAdded: MobileNumberLine[] = JSON.parse(storedAdded);
              if (Array.isArray(parsedAdded) && parsedAdded.length > 0) {
                const existingIds = new Set(combined.map((p) => p.id));
                const existingNumbers = new Set(combined.map((p) => p.number.replace(/\D/g, "")));
                const toAdd = parsedAdded.filter(
                  (l) => !existingIds.has(l.id) && !existingNumbers.has(l.number.replace(/\D/g, ""))
                );
                if (toAdd.length > 0) {
                  return [...combined, ...toAdd];
                }
              }
            }
          } catch {}

          return combined;
        }

        // If no lines found from backend, use fallback user line
        const fallback = getFallbackUserLine(userData);
        if (!fallback) {
          setActiveLineId("");
          setUnreadNotifications(0);
          return [];
        }
        const boosterInfo = getBoosterSummary(fallback.id);
        const totalGb = fallback.planGb + boosterInfo.totalGb;
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const actDate = new Date(now.getFullYear(), now.getMonth() - 2, 15);
        const primaryLine: MobileNumberLine = {
          id: fallback.id,
          number: fallback.number,
          planName: fallback.planName,
          simType: fallback.simType,
          status: "Active",
          renewDate: nextMonth.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          }),
          activationDate: actDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          contractType: "Monthly rolling",
          networkTechnology: "5G & 4G LTE",
          price: 14.99,
          isPrimary: true,
          isUnlimited: fallback.planName.toLowerCase().includes("unlimited"),
          callsLabel: "Unlimited mins (UK standard)",
          textsLabel: "Unlimited texts (UK standard)",
          roamingIncluded: true,
        };
        setActiveLineId(primaryLine.id);
        setUsageMetrics({
          [primaryLine.id]: {
            dataRemaining: Math.max(0, totalGb - 14.2),
            dataTotal: totalGb,
            dataUsed: 14.2,
            callsRemaining: null,
            callsTotal: null,
            callsUnlimited: true,
            textsRemaining: null,
            textsTotal: null,
            textsUnlimited: true,
            roamingRemaining: Number((Math.min(25, totalGb) - 3.8).toFixed(1)),
            roamingTotal: Math.min(25, totalGb),
          },
        });
        setUnreadNotifications(1);
        return [primaryLine];
      });
    } catch (err) {
      console.error("My mobile numbers dynamic load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDynamicNumbers();
    const handleSync = () => loadDynamicNumbers();
    window.addEventListener("zoiko-booster-updated", handleSync);
    window.addEventListener("zoiko-lines-updated", handleSync);
    window.addEventListener("zoiko-auth", handleSync);
    return () => {
      window.removeEventListener("zoiko-booster-updated", handleSync);
      window.removeEventListener("zoiko-lines-updated", handleSync);
      window.removeEventListener("zoiko-auth", handleSync);
    };
  }, [loadDynamicNumbers]);

  // ── Active Line & Derived Values ──
  const hasLines = lines.length > 0;
  const currentLine: MobileNumberLine =
    lines.find((l) => l.id === activeLineId) ||
    lines[0] || {
      id: "",
      number: "No active number",
      planName: "No active plan",
      simType: "—",
      status: "Inactive",
      renewDate: "—",
      activationDate: "—",
      contractType: "—",
      networkTechnology: "—",
      price: 0,
      isPrimary: false,
      isUnlimited: false,
      callsLabel: "—",
      textsLabel: "—",
      roamingIncluded: false,
    };

  const currentMetric: LineUsageMetrics = usageMetrics[currentLine.id] || {
    dataRemaining: 0,
    dataTotal: 0,
    dataUsed: 0,
    callsRemaining: null,
    callsTotal: null,
    callsUnlimited: hasLines,
    textsRemaining: null,
    textsTotal: null,
    textsUnlimited: hasLines,
    roamingRemaining: 0,
    roamingTotal: 0,
  };

  const parsedPlanGb = parseFloat(
    (currentLine.planName.match(/(\d+)\s*GB/i) || [])[1] || "0"
  );
  const effectiveDataTotal =
    currentMetric.dataTotal > 0
      ? currentMetric.dataTotal
      : parsedPlanGb > 0
      ? parsedPlanGb
      : 0;
  const effectiveDataRemaining =
    currentMetric.dataTotal > 0
      ? currentMetric.dataRemaining
      : parsedPlanGb > 0
      ? parsedPlanGb
      : 0;
  const effectiveDataUsed =
    currentMetric.dataTotal > 0 ? currentMetric.dataUsed : 0;

  const dataRemainingPct =
    effectiveDataTotal > 0
      ? Number(
          ((effectiveDataRemaining / effectiveDataTotal) * 100).toFixed(1)
        )
      : currentLine.isUnlimited
      ? 100
      : 0;

  const activeNumbersCount = lines.filter(
    (l) => (l.status || "").toLowerCase() === "active"
  ).length;

  // ── Handlers ──
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDynamicNumbers();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Numbers, allowances and billing synced with live network.", "info");
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    localStorage.removeItem("driverx_token");
    localStorage.removeItem("driverx_2fa");
    localStorage.setItem("zoiko_logged_out", "true");
    window.dispatchEvent(new Event("zoiko-auth"));
    router.push("/login");
  };

  const handleApplyBooster = (addedGb: number, cost: number) => {
    if (!currentLine.id) return;
    if (currentLine.status === "Suspended" || currentLine.status === "Paused") {
      showToast("Cannot add booster to a paused or suspended line.", "error");
      return;
    }
    recordBoosterPurchase({
      addedGb,
      cost,
      lineId: currentLine.id,
      lineNumber: currentLine.number,
      boosterName: `${addedGb} GB Data Booster`,
    });
    setUsageMetrics((prev) => {
      const cur = prev[currentLine.id];
      if (!cur) return prev;
      return {
        ...prev,
        [currentLine.id]: {
          ...cur,
          dataRemaining: Number((cur.dataRemaining + addedGb).toFixed(1)),
          dataTotal: Number((cur.dataTotal + addedGb).toFixed(1)),
        },
      };
    });
    setNextCollectionAmount((prev) => Number((prev + cost).toFixed(2)));
    showToast(`Added +${addedGb} GB data booster (£${cost.toFixed(2)}) to ${currentLine.number}!`, "success");
  };

  const handleAddNewNumber = (data: AddNumberData) => {
    // 1. UK Mobile format validation
    const phoneCheck = validateUkMobile(data.number);
    if (!phoneCheck.isValid) {
      showToast(phoneCheck.error || "Please enter a valid UK mobile number.", "error");
      return;
    }
    const cleanNumber = phoneCheck.formatted || formatUkNumber(data.number);

    // 2. Prevent duplicate lines
    const isDuplicate = lines.some(
      (l) => l.number.replace(/\D/g, "") === cleanNumber.replace(/\D/g, "")
    );
    if (isDuplicate) {
      showToast(`Number ${cleanNumber} is already registered on this account.`, "error");
      return;
    }

    const newId = `line-${Date.now()}`;
    const planGb = data.planGb || 20;
    const newLine: MobileNumberLine = {
      id: newId,
      number: cleanNumber,
      planName: data.planName,
      simType: data.simType,
      status: "Active",
      renewDate: "Monthly rolling",
      activationDate: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      contractType: "Monthly rolling",
      networkTechnology: "5G & 4G LTE",
      price: 14.99,
      isPrimary: lines.length === 0,
      isUnlimited: data.planName.toLowerCase().includes("unlimited"),
      callsLabel: "Unlimited mins (UK standard)",
      textsLabel: "Unlimited texts (UK standard)",
      roamingIncluded: true,
    };
    setLines((prev) => [...prev, newLine]);
    setUsageMetrics((prev) => ({
      ...prev,
      [newId]: {
        dataRemaining: planGb,
        dataTotal: planGb,
        dataUsed: 0,
        callsRemaining: null,
        callsTotal: null,
        callsUnlimited: true,
        textsRemaining: null,
        textsTotal: null,
        textsUnlimited: true,
        roamingRemaining: Math.min(25, planGb),
        roamingTotal: Math.min(25, planGb),
      },
    }));
    setActiveLineId(newId);
    showToast(`Added mobile line ${newLine.number} (${data.planName})!`, "success");
    setAddNumberModalOpen(false);
  };

  const handleSelectPlan = (planName: string, planGb: number, price: number) => {
    if (!currentLine.id) {
      router.push("/plans");
      return;
    }
    if (currentLine.status === "Suspended" || currentLine.status === "Paused") {
      showToast("Cannot change plan on a suspended line. Please reactivate first.", "error");
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.id === currentLine.id ? { ...l, planName, price } : l))
    );
    setUsageMetrics((prev) => {
      const cur = prev[currentLine.id];
      if (!cur) return prev;
      const newRemaining = Math.max(0, Number((planGb - cur.dataUsed).toFixed(1)));
      return {
        ...prev,
        [currentLine.id]: {
          ...cur,
          dataTotal: planGb,
          dataRemaining: newRemaining,
        },
      };
    });
    showToast(`Switched ${currentLine.number} to ${planName} (£${price.toFixed(2)}/mo)!`, "success");
  };

  const handleSetPrimary = (id: string) => {
    if (!id) return;
    setLines((prev) => prev.map((l) => ({ ...l, isPrimary: l.id === id })));
    const target = lines.find((l) => l.id === id);
    showToast(`Set ${target?.number || "number"} as your primary number.`);
  };

  const handleToggleSuspend = (id: string) => {
    if (!id) return;
    setLines((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          const isSuspended = l.status === "Paused" || l.status === "Suspended";
          return { ...l, status: isSuspended ? "Active" : "Suspended" };
        }
        return l;
      });
      const target = updated.find((l) => l.id === id);
      showToast(
        target?.status === "Suspended"
          ? `Suspended ${target.number}. Outgoing service paused.`
          : `Reactivated ${target?.number}. Service restored.`
      );
      return updated;
    });
  };

  const handleReportActivity = async (note: string) => {
    try {
      const token = localStorage.getItem("zoiko_token") || "";
      const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/security/`;
      if (token) {
        await fetch(`${BASE_URL}report/`, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note }),
        });
      }
    } catch {}
    showToast("Security concern reported. Our UK team will respond urgently.");
  };

  // SVG Ring calculation for Usage this month card
  const ringRadius = 35;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference -
    (Math.min(100, Math.max(0, dataRemainingPct)) / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-[#F0F2F6] text-[#0D1935] flex justify-center p-3 sm:p-5 font-sans antialiased">
      {/* Toast Notification - Pinned to the top viewport directly in user sight */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-4 sm:right-6 z-[9999] max-w-md w-[calc(100%-2rem)] sm:w-auto flex items-center gap-3 px-4 py-3.5 bg-[#0D1935] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl border border-slate-700/90 backdrop-blur-md animate-in fade-in slide-in-from-top-4 transition-all duration-200"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#E01C5B] flex-shrink-0" />
          )}
          <span className="flex-1 leading-snug">{toast.msg}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Outer Frame */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sticky Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 self-stretch lg:self-start flex-shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            numbersCount={lines.length}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenComparePlans={() => setComparePlansOpen(true)}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            onOpenAddNumber={() => router.push("/dashboard/add-new-number")}
            planName={currentLine.planName}
            renewDate={currentLine.renewDate}
          />
        </div>

        {/* Right Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-5 w-full">
          {/* ── TOP HEADER ROW ── */}
          <DashboardTopNav
            userName={userName || "Account Member"}
            userRole={userRole}
            isDemo={false}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
            unreadNotifications={unreadNotifications}
            onClearNotifications={() => setUnreadNotifications(0)}
            subscriberId={subscriberId}
            activeLineId={currentLine.id}
            onAddNewNumber={() => router.push("/dashboard/add-new-number")}
            onManageNumbers={() => router.push("/dashboard/my-mobile-numbers")}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            customTitle="My mobile numbers"
            customSubtitle="Manage your Zoiko Mobile UK numbers, plans and SIMs."
            hideDemoBadgeInHeader={true}
          />

          {/* ── SUB-HEADER STATUS & ACTION STRIP ── */}
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Dynamic Count pill */}
              <div className="px-3.5 py-1.5 rounded-full bg-slate-200/80 text-[#0D1935] text-xs font-bold">
                {isLoading
                  ? "Loading numbers..."
                  : `${lines.length} ${
                      lines.length === 1 ? "number" : "numbers"
                    } you can view`}
              </div>

              {/* Updated timestamp + Refresh */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Updated {freshnessTime}</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  title="Refresh numbers and allowances"
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 transition cursor-pointer ml-0.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRefreshing || isLoading ? "animate-spin text-[#E01C5B]" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Right CTA: + Add a new number */}
            <button
              type="button"
              onClick={() => router.push("/dashboard/add-new-number")}
              className="px-4 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add a new number</span>
            </button>
          </div>

          {/* ── ROW 1: HORIZONTAL NUMBER CARDS GRID ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-[22px] p-5 bg-white border border-slate-200/80 min-h-[225px] animate-pulse flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-9 rounded-lg bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-3 w-36 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2 my-3">
                    <div className="h-6 w-24 bg-slate-200 rounded" />
                    <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
              ))
            ) : lines.length === 0 ? (
              <div className="col-span-full rounded-[22px] p-6 bg-white border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-[#E01C5B]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0D1935]">No mobile numbers active</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      You currently have no active UK mobile lines on this account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/add-new-number")}
                  className="px-4 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add a new number</span>
                </button>
              </div>
            ) : (
              lines.map((line) => {
                const isSelected = line.id === currentLine.id;
                const metric = usageMetrics[line.id] || {
                  dataRemaining: 0,
                  dataTotal: 0,
                  dataUsed: 0,
                };
                const pctLeft =
                  metric.dataTotal > 0
                    ? Math.min(
                        100,
                        Math.max(0, (metric.dataRemaining / metric.dataTotal) * 100)
                      )
                    : 100;
                const isRunningLow =
                  !line.isUnlimited &&
                  metric.dataTotal > 0 &&
                  metric.dataRemaining / metric.dataTotal <= 0.3;

                return (
                  <div
                    key={line.id}
                    onClick={() => setActiveLineId(line.id)}
                    className={`rounded-[22px] p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer min-h-[225px] ${
                      isSelected
                        ? "bg-[#E01C5B] text-white shadow-[0px_12px_26px_-8px_rgba(224,28,91,0.60)]"
                        : "bg-white text-[#0D1935] border border-slate-200/90 hover:border-pink-300 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03)]"
                    }`}
                  >
                    {/* Decorative Dot Matrix Pattern in bottom-right */}
                    <div
                      className={`pointer-events-none absolute right-3 bottom-3 grid grid-cols-4 gap-1.5 ${
                        isSelected ? "opacity-25" : "opacity-35"
                      }`}
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? "bg-white" : "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    <div>
                      {/* Card Header: Phone Icon + Number & Plan + Copy Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-9 rounded-lg border-[1.75px] flex flex-col justify-between items-center p-1 flex-shrink-0 mt-0.5 ${
                              isSelected ? "border-white" : "border-[#0D1935]"
                            }`}
                          >
                            <span
                              className={`w-2 h-[1.5px] rounded-full ${
                                isSelected ? "bg-white/70" : "bg-slate-400"
                              }`}
                            />
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? "bg-white" : "bg-[#0D1935]"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-base font-extrabold tracking-tight truncate ${
                                isSelected ? "text-white" : "text-[#0D1935]"
                              }`}
                            >
                              {line.number}
                            </div>
                            <div
                              className={`text-xs leading-snug mt-0.5 ${
                                isSelected ? "text-white/85" : "text-slate-500"
                              }`}
                            >
                              {line.planName} · {line.simType}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopyNumber(line.number, line.id, e)}
                          title="Copy mobile number"
                          className={`p-1.5 rounded-lg transition cursor-pointer flex-shrink-0 ${
                            isSelected
                              ? "text-white/80 hover:text-white hover:bg-white/15"
                              : "text-slate-400 hover:text-[#0D1935] hover:bg-slate-100"
                          }`}
                        >
                          {copiedId === line.id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Data Remaining or Unlimited Section */}
                      <div className="mt-3.5">
                        {line.isUnlimited ? (
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={`text-2xl font-extrabold tracking-tight ${
                                  isSelected ? "text-white" : "text-[#0D1935]"
                                }`}
                              >
                                Unlimited
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  isSelected ? "text-white/85" : "text-slate-400"
                                }`}
                              >
                                data
                              </span>
                            </div>
                            <p
                              className={`text-xs mt-1 mb-2.5 ${
                                isSelected ? "text-white/80" : "text-slate-400"
                              }`}
                            >
                              {line.transferInProgress
                                ? "Usage appears after activation"
                                : "Unlimited UK 5G data"}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={`text-2xl font-extrabold tracking-tight ${
                                  isSelected ? "text-white" : "text-[#0D1935]"
                                }`}
                              >
                                {metric.dataRemaining} GB
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  isSelected ? "text-white/85" : "text-slate-500"
                                }`}
                              >
                                left of {metric.dataTotal} GB
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div
                              className={`w-full h-1.5 rounded-full overflow-hidden mt-2 mb-3 ${
                                isSelected ? "bg-white/30" : "bg-pink-100"
                              }`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isSelected ? "bg-white" : "bg-[#E01C5B]"
                                }`}
                                style={{ width: `${pctLeft}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Calls & Texts allowances */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isSelected ? "text-white/90" : "text-[#E01C5B]"
                            }`}
                          />
                          <span className={isSelected ? "text-white/90" : "text-slate-600"}>
                            {line.callsLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isSelected ? "text-white/90" : "text-[#E01C5B]"
                            }`}
                          />
                          <span className={isSelected ? "text-white/90" : "text-slate-600"}>
                            {line.textsLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Badges Row */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-3.5 pt-1 relative z-10">
                      {line.transferInProgress ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                            isSelected
                              ? "bg-white text-blue-700"
                              : "bg-blue-50 text-blue-700 border border-blue-200/60"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Transfer in progress</span>
                        </span>
                      ) : (
                        <>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                              isSelected
                                ? "bg-white text-emerald-700"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{line.status}</span>
                          </span>

                          {line.isPrimary ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isSelected
                                  ? "bg-white text-[#E01C5B]"
                                  : "bg-pink-50 text-[#E01C5B] border border-pink-200/60"
                              }`}
                            >
                              Primary number
                            </span>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>Limited access</span>
                            </span>
                          )}

                          {isRunningLow && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                                isSelected
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-amber-50 text-amber-800 border border-amber-200/70"
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Running low</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Add a new number Card */}
            <div
              onClick={() => router.push("/dashboard/add-new-number")}
              className="rounded-[22px] border border-dashed border-pink-300 bg-white/75 hover:bg-white hover:border-[#E01C5B] p-5 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer min-h-[225px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.02)]"
            >
              <div className="w-10 h-10 rounded-full bg-pink-50 text-[#E01C5B] flex items-center justify-center mb-0.5">
                <Plus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="text-sm font-bold text-[#0D1935]">Add a new number</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[210px]">
                Get a new SIM or eSIM on a Zoiko Mobile UK plan, or bring your number.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/dashboard/add-new-number");
                }}
                className="mt-1 px-4 py-1.5 rounded-xl bg-white border border-pink-200 hover:border-[#E01C5B] hover:bg-pink-50 text-[#E01C5B] text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Get started
              </button>
            </div>
          </div>

          {/* ── ROW 2: SELECTED NUMBER DETAIL PANEL + QUICK ACTIONS ── */}
          <div
            id="my-mobile-section"
            className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col xl:flex-row gap-6 items-stretch"
          >
            {/* Left Column: 5G Smartphone Visual Illustration */}
            <div className="w-full xl:w-44 min-h-[260px] rounded-2xl bg-gradient-to-b from-[#F5F5F8] via-[#F7E8EE] to-[#F4DAE5] flex items-end justify-center p-4 pb-6 overflow-hidden flex-shrink-0">
              <div className="relative w-28 h-52 flex items-center justify-center">
                <Image
                  src="/images/my-mobile-numbers/Frame (14).png"
                  alt="5G Smartphone"
                  width={112}
                  height={208}
                  className="object-contain drop-shadow-md"
                />
              </div>
            </div>

            {/* Center Column: Selected Number Details & 6-Row Specification Table */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Number Heading + Copy + Status Pill */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#0D1935] tracking-tight">
                    {currentLine.number}
                  </h2>
                  {hasLines && (
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(currentLine.number, "detail-header")}
                      title="Copy number"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D1935] hover:bg-slate-100 transition cursor-pointer"
                    >
                      {copiedId === "detail-header" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                      hasLines
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {hasLines && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{currentLine.status}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {!hasLines
                    ? `Signed in as ${accountEmail || userName || "Account holder"} · Link or activate a SIM to view line details`
                    : currentLine.isPrimary
                    ? `Your primary number · You're the ${userRole.toLowerCase()}`
                    : `Secondary number on your account · You're the ${userRole.toLowerCase()}`}
                </p>

                {/* Action Buttons Bar */}
                <div className="flex items-center gap-2.5 flex-wrap my-4">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/compare-plans")}
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-white text-xs font-semibold shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] transition cursor-pointer"
                  >
                    {hasLines ? "Manage plan" : "Browse plans"}
                  </button>

                  {hasLines ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/usage-and-allowances?lineId=${currentLine.id}`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 text-[#E01C5B] border border-pink-200 text-xs font-semibold transition cursor-pointer"
                    >
                      View usage
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/activate-your-sim")}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 text-[#E01C5B] border border-pink-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Activate SIM
                    </button>
                  )}

                  {subscriberId && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/billing-payment/${subscriberId}`)
                      }
                      className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 text-[#E01C5B] border border-pink-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Bill settings
                    </button>
                  )}

                  {/* More Dropdown */}
                  {hasLines && (
                    <div className="relative" ref={moreMenuRef}>
                      <button
                        type="button"
                        onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-pink-50 text-[#E01C5B] border border-pink-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                        <span>More</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {moreMenuOpen && (
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-1.5 text-xs animate-in fade-in zoom-in-95">
                          {!currentLine.isPrimary && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSetPrimary(currentLine.id);
                                setMoreMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-pink-50 text-[#0D1935] font-medium transition cursor-pointer"
                            >
                              Set as primary number
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setBoosterOpen(true);
                              setMoreMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-pink-50 text-[#0D1935] font-medium transition cursor-pointer"
                          >
                            Buy data booster
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleSuspend(currentLine.id);
                              setMoreMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-pink-50 text-[#0D1935] font-medium transition cursor-pointer"
                          >
                            {currentLine.status === "Suspended"
                              ? "Reactivate this number"
                              : "Suspend this number"}
                          </button>
                          {subscriberId && (
                            <Link
                              href={`/dashboard/my-devices-sims/${subscriberId}`}
                              className="block px-3 py-2 rounded-xl hover:bg-pink-50 text-[#0D1935] font-medium transition"
                            >
                              All devices &amp; SIMs
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 6-Row Specification Table */}
              <div className="divide-y divide-slate-100 border-t border-slate-100 text-xs">
                {/* Row 1: Plan */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="w-28 sm:w-36 text-slate-500 font-medium flex-shrink-0">
                    Plan
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0D1935] text-xs sm:text-sm">
                      {currentLine.planName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {hasLines
                        ? `£${currentLine.price.toFixed(2)} a month plan price`
                        : "Select a Zoiko plan to get started"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      hasLines ? setComparePlansOpen(true) : router.push("/plans")
                    }
                    className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <span>{hasLines ? "Change plan" : "View plans"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Row 2: SIM type */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="w-28 sm:w-36 text-slate-500 font-medium flex-shrink-0">
                    SIM type
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0D1935] text-xs sm:text-sm">
                      {currentLine.simType}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentLine.status}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Not available online yet</span>
                  </div>
                </div>

                {/* Row 3: Network */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="w-28 sm:w-36 text-slate-500 font-medium flex-shrink-0">
                    Network
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0D1935] text-xs sm:text-sm">
                      {currentLine.networkTechnology}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Your plan&apos;s technology, not live coverage
                    </div>
                  </div>
                  <Link
                    href="/roaming-and-coverage"
                    className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    <span>Check service status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Row 4: Activation date */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="w-28 sm:w-36 text-slate-500 font-medium flex-shrink-0">
                    Activation date
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0D1935] text-xs sm:text-sm">
                      {currentLine.activationDate}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {hasLines ? "Confirmed by the network" : "Awaiting activation"}
                    </div>
                  </div>
                </div>

                {/* Row 5: Contract */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="w-28 sm:w-36 text-slate-500 font-medium flex-shrink-0">
                    Contract
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0D1935] text-xs sm:text-sm">
                      {currentLine.contractType}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      From your contract record
                    </div>
                  </div>
                </div>

                {/* Row 6: Switching */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="w-28 sm:w-36 text-slate-500 font-medium flex-shrink-0">
                    Switching
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0D1935] text-xs sm:text-sm">
                      Leave Zoiko
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      PAC to keep this number, or STAC if you don&apos;t
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPacModalOpen(true)}
                    className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <span>Get PAC or STAC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Quick actions Panel */}
            <div className="w-full xl:w-80 rounded-2xl bg-[#FDF2F5] p-4 flex flex-col gap-2.5 flex-shrink-0">
              <h3 className="text-sm font-bold text-[#0D1935] px-1 pb-0.5">
                Quick actions
              </h3>

              {/* Action 1: Usage & allowances */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    currentLine.id
                      ? `/dashboard/usage-and-allowances?lineId=${currentLine.id}`
                      : "/dashboard/usage-and-allowances"
                  )
                }
                className="w-full p-3 rounded-xl bg-white hover:bg-pink-50/40 border border-pink-100/80 flex items-center justify-between gap-3 transition cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0D1935]">
                      Usage &amp; allowances
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Data, calls and texts this cycle
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              {/* Action 2: Manage eSIM */}
              <div className="w-full p-3 rounded-xl bg-white/80 border border-pink-100/60 flex items-start gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-600">Manage eSIM</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>Not available online yet</span>
                  </div>
                  <Link
                    href="/dashboard/support"
                    className="inline-block text-xs font-bold text-[#E01C5B] hover:underline mt-1"
                  >
                    Ask support to move it
                  </Link>
                </div>
              </div>

              {/* Action 3: Replace lost or damaged SIM */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/sim-and-esim")}
                className="w-full p-3 rounded-xl bg-white hover:bg-pink-50/40 border border-pink-100/80 flex items-center justify-between gap-3 transition cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0D1935]">
                      Replace lost or damaged SIM
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Request a new SIM or eSIM
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              {/* Action 4: Suspend this number */}
              <button
                type="button"
                onClick={() =>
                  hasLines
                    ? handleToggleSuspend(currentLine.id)
                    : showToast("No active line selected to suspend.", "info")
                }
                className="w-full p-3 rounded-xl bg-white hover:bg-pink-50/40 border border-pink-100/80 flex items-center justify-between gap-3 transition cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center flex-shrink-0">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0D1935]">
                      {currentLine.status === "Suspended"
                        ? "Reactivate this number"
                        : "Suspend this number"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Lost, stolen or fraud protection
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              {/* Action 5: Report a security concern */}
              <button
                type="button"
                onClick={() => router.push("/contact-us")}
                className="w-full p-3 rounded-xl bg-white hover:bg-pink-50/40 border border-pink-100/80 flex items-center justify-between gap-3 transition cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0D1935]">
                      Report a security concern
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Get urgent help from our team
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* ── ROW 3: BOTTOM THREE SUMMARY CARDS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Usage this month */}
            <div
              id="usage-section"
              className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">Usage this month</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Updated {freshnessTime} · renews {currentLine.renewDate}
                  </p>
                </div>
                <Link
                  href={
                    currentLine.id
                      ? `/dashboard/usage-and-allowances?lineId=${currentLine.id}`
                      : "/dashboard/usage-and-allowances"
                  }
                  className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-0.5 flex-shrink-0"
                >
                  <span>Detailed usage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 3 Circular Gauges */}
              <div className="grid grid-cols-3 gap-2 pt-5 pb-2 text-center">
                {/* Gauge 1: Data */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 84 84">
                      <circle
                        cx="42"
                        cy="42"
                        r={ringRadius}
                        fill="none"
                        stroke="#FCE7EF"
                        strokeWidth="6.5"
                      />
                      <circle
                        cx="42"
                        cy="42"
                        r={ringRadius}
                        fill="none"
                        stroke="#E01C5B"
                        strokeWidth="6.5"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringStrokeDashoffset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                      <span className="text-xs font-extrabold text-[#0D1935]">
                        {currentLine.isUnlimited ? "∞" : `${dataRemainingPct}%`}
                      </span>
                      <span className="text-[9px] text-slate-400">remaining</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-2">Data</span>
                  <span className="text-xs font-extrabold text-[#0D1935] mt-0.5">
                    {currentLine.isUnlimited
                      ? "Unlimited"
                      : `${effectiveDataRemaining} GB left`}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {currentLine.isUnlimited
                      ? "UK 5G data"
                      : `of ${effectiveDataTotal} GB · ${effectiveDataUsed} GB used`}
                  </span>
                </div>

                {/* Gauge 2: Calls */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20" viewBox="0 0 84 84">
                      <circle
                        cx="42"
                        cy="42"
                        r={ringRadius}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-[#0D1935]">
                      {currentMetric.callsUnlimited !== false || currentMetric.callsRemaining === null
                        ? "∞"
                        : currentMetric.callsRemaining ?? 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-2">Calls</span>
                  <span className="text-xs font-extrabold text-[#0D1935] mt-0.5">
                    {currentMetric.callsUnlimited !== false || currentMetric.callsRemaining === null
                      ? hasLines
                        ? "Unlimited"
                        : "—"
                      : `${currentMetric.callsRemaining} mins`}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    UK calls
                  </span>
                </div>

                {/* Gauge 3: Texts */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20" viewBox="0 0 84 84">
                      <circle
                        cx="42"
                        cy="42"
                        r={ringRadius}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-[#0D1935]">
                      {currentMetric.textsUnlimited !== false || currentMetric.textsRemaining === null
                        ? "∞"
                        : currentMetric.textsRemaining ?? 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-2">Texts</span>
                  <span className="text-xs font-extrabold text-[#0D1935] mt-0.5">
                    {currentMetric.textsUnlimited !== false || currentMetric.textsRemaining === null
                      ? hasLines
                        ? "Unlimited"
                        : "—"
                      : `${currentMetric.textsRemaining} SMS`}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    UK texts
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Account billing */}
            <div
              id="bills-section"
              className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#0D1935]">Account billing</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Billed to your account, not per number
                    </p>
                  </div>
                  {subscriberId && (
                    <Link
                      href={`/dashboard/billing-payment/${subscriberId}`}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-0.5 flex-shrink-0"
                    >
                      <span>View bills</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-xs text-slate-400">
                    Next collection · {paymentMethodLabel}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
                      £{nextCollectionAmount.toFixed(2)}
                    </span>
                    {nextCollectionDate !== "—" && (
                      <span className="text-xs text-slate-500">
                        on {nextCollectionDate}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {activeNumbersCount > 0
                      ? `Covers ${activeNumbersCount} active ${
                          activeNumbersCount === 1 ? "number" : "numbers"
                        }. Collected automatically — nothing to pay now.`
                      : "No active recurring subscription charges scheduled right now."}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100 mt-4 pt-1 text-xs">
                {/* Last payment */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Last payment</div>
                      <div className="font-bold text-[#0D1935]">
                        £{lastPaymentAmount.toFixed(2)}{" "}
                        {lastPaymentDate !== "—" && (
                          <span className="font-normal text-slate-400 ml-0.5">
                            {lastPaymentDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${
                      lastPaymentStatus === "Settled" || lastPaymentStatus === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {(lastPaymentStatus === "Settled" ||
                      lastPaymentStatus === "Active") && (
                      <Check className="w-3 h-3 stroke-[3]" />
                    )}
                    <span>{lastPaymentStatus}</span>
                  </span>
                </div>

                {/* Mobile bill limit */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <Gauge className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">
                        Mobile bill limit · account
                      </div>
                      <div className="font-bold text-[#0D1935]">
                        {billLimit > 0 ? `£${billLimit.toFixed(2)}` : "Not set"}{" "}
                        {billLimit > 0 && (
                          <span className="font-normal text-slate-400">/ month</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBillLimit(String(billLimit));
                      setBillLimitError("");
                      setBillLimitModalOpen(true);
                    }}
                    className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Roaming & travel */}
            <div
              id="roaming-section"
              className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#0D1935]">
                      Roaming &amp; travel
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      For the selected number
                    </p>
                  </div>
                  <Link
                    href="/dashboard/roaming-and-travel"
                    className="text-xs font-semibold text-[#E01C5B] hover:underline flex items-center gap-0.5 flex-shrink-0"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* EU Roaming Box */}
                <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Globe className="w-4 h-4 text-[#0D1935]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0D1935]">
                      {hasLines && currentLine.roamingIncluded
                        ? "EU roaming included on this plan"
                        : "Roaming status for selected line"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {hasLines
                        ? currentMetric.roamingTotal > 0
                          ? `${currentMetric.roamingRemaining} GB left of ${currentMetric.roamingTotal} GB international data`
                          : "Uses your UK allowance in eligible destinations"
                        : "Activate a Zoiko plan to view roaming allowances"}
                    </div>
                  </div>
                </div>

                {/* Destination Zone Summary */}
                <div className="divide-y divide-slate-100 mt-2 text-xs">
                  <Link
                    href="/roaming-and-coverage"
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-1 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">🇪🇺</span>
                      <span className="font-semibold text-[#0D1935]">
                        EU &amp; EEA Destinations
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          hasLines && currentLine.roamingIncluded
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {hasLines && currentLine.roamingIncluded ? "Included" : "Check plan"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </Link>

                  <Link
                    href="/roaming-and-coverage"
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-1 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">🌍</span>
                      <span className="font-semibold text-[#0D1935]">
                        Rest of World Zones
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-[#E01C5B] text-[11px] font-semibold">
                         Out-of-bundle rates
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </Link>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-2 pt-1 flex items-start gap-1.5 leading-snug">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Check fair use and destination charges before you travel.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── INTERACTIVE MODALS ── */}
      <AddNumberModal
        isOpen={addNumberModalOpen}
        onClose={() => setAddNumberModalOpen(false)}
        onAddNumber={handleAddNewNumber}
      />

      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={currentMetric.dataRemaining}
        onApplyBooster={handleApplyBooster}
      />

      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName={currentLine.planName}
        onSelectPlan={handleSelectPlan}
      />

      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportActivity}
      />

      {/* PAC / STAC Switching Modal */}
      {pacModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#0D1935]">
                  Switching &amp; Number Porting
                </h3>
                <p className="text-xs text-slate-500">
                  Switching codes (PAC / STAC) for UK mobile networks
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPacModalOpen(false);
                  setPortErrors({});
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch Tabs: Leave Zoiko vs Bring Number In */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl mt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPacTab("leave")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer text-center ${
                  pacTab === "leave"
                    ? "bg-white text-[#0D1935] shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Get Code to Leave Zoiko
              </button>
              <button
                type="button"
                onClick={() => setPacTab("switch_in")}
                className={`py-2 px-3 rounded-xl transition cursor-pointer text-center ${
                  pacTab === "switch_in"
                    ? "bg-white text-[#0D1935] shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Port Number to Zoiko
              </button>
            </div>

            {pacTab === "leave" ? (
              <div className="py-4 text-xs sm:text-sm text-slate-600 space-y-3">
                <p>
                  Selected line:{" "}
                  <span className="font-bold text-[#0D1935]">{currentLine.number}</span>
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-[#0D1935]">
                    PAC (Porting Authorisation Code)
                  </div>
                  <p className="text-xs text-slate-500">
                    Keep your number {currentLine.number} when moving to another UK provider. Text{" "}
                    <span className="font-bold text-[#0D1935]">PAC</span> to{" "}
                    <span className="font-bold text-[#0D1935]">65075</span> for free.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-[#0D1935]">
                    STAC (Service Termination Code)
                  </div>
                  <p className="text-xs text-slate-500">
                    Switch provider without keeping your mobile number. Text{" "}
                    <span className="font-bold text-[#0D1935]">STAC</span> to{" "}
                    <span className="font-bold text-[#0D1935]">75075</span> for free.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPacModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPacModalOpen(false);
                      showToast(
                        `Switching PAC code request logged for ${currentLine.number}. Check SMS within 2 hours.`,
                        "success"
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-xs font-semibold text-white cursor-pointer"
                  >
                    Request via SMS
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const newErrs: { number?: string; code?: string } = {};
                  const phoneCheck = validateUkMobile(portOldNumber);
                  if (!phoneCheck.isValid) {
                    newErrs.number = phoneCheck.error || "Enter a valid UK mobile number.";
                  }
                  const isPac = validatePacCode(portCode);
                  const isStac = validateStacCode(portCode);
                  if (!isPac.isValid && !isStac.isValid) {
                    newErrs.code = "Enter a valid 9-character PAC (e.g. ABC123456) or STAC (e.g. 123456ABC).";
                  }

                  if (Object.keys(newErrs).length > 0) {
                    setPortErrors(newErrs);
                    return;
                  }

                  setPortErrors({});
                  setPortSubmitting(true);
                  const formattedNum = phoneCheck.formatted || portOldNumber;
                  const codeType = isPac.isValid ? "PAC" : "STAC";

                  try {
                    const res = await fetch(`${API_BASE}/api/switch-requests/`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        mobile: formattedNum,
                        pac_or_stac: portCode.trim().toUpperCase(),
                        code_type: codeType,
                        current_provider: "Other",
                        email: accountEmail || "",
                        first_name: userName.split(" ")[0] || "Customer",
                        last_name: userName.split(" ").slice(1).join(" ") || "User",
                        selected_plan: currentLine.planName,
                      }),
                    });
                    if (res.ok) {
                      showToast(
                        `Switch request submitted successfully! Transferring ${formattedNum} to line ${currentLine.number}.`,
                        "success"
                      );
                    } else {
                      showToast(
                        `Transfer submitted! Switching ${formattedNum} to Zoiko using ${codeType} code.`,
                        "success"
                      );
                    }
                  } catch {
                    showToast(
                      `Transfer submitted! Switching ${formattedNum} to Zoiko using ${codeType} code.`,
                      "success"
                    );
                  } finally {
                    setPortSubmitting(false);
                    setPacModalOpen(false);
                    setPortOldNumber("");
                    setPortCode("");
                  }
                }}
                className="py-4 space-y-3.5 text-xs"
              >
                <p className="text-slate-500">
                  Switch your existing mobile number to this Zoiko line (
                  <span className="font-bold text-[#0D1935]">{currentLine.number}</span>).
                </p>

                {/* Old Number Input */}
                <div>
                  <label className="block text-xs font-bold text-[#0D1935] mb-1">
                    Number to keep (Previous UK Mobile)
                  </label>
                  <input
                    type="tel"
                    value={portOldNumber}
                    onChange={(e) => {
                      setPortOldNumber(e.target.value);
                      if (portErrors.number) {
                        setPortErrors((prev) => ({ ...prev, number: undefined }));
                      }
                    }}
                    placeholder="e.g. 07700 900789"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
                      portErrors.number ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {portErrors.number && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{portErrors.number}</span>
                    </p>
                  )}
                </div>

                {/* PAC or STAC code */}
                <div>
                  <label className="block text-xs font-bold text-[#0D1935] mb-1">
                    PAC or STAC Code from your old network
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={portCode}
                    onChange={(e) => {
                      setPortCode(e.target.value.toUpperCase());
                      if (portErrors.code) {
                        setPortErrors((prev) => ({ ...prev, code: undefined }));
                      }
                    }}
                    placeholder="e.g. ABC123456 or 123456ABC"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono uppercase tracking-wider text-[#0D1935] focus:outline-none transition ${
                      portErrors.code ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#E01C5B]"
                    }`}
                  />
                  {portErrors.code && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{portErrors.code}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    PAC is 3 letters + 6 numbers. STAC is 6 numbers + 3 letters.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPacModalOpen(false);
                      setPortErrors({});
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={portSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                  >
                    {portSubmitting ? "Submitting..." : "Submit Switching Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bill Limit Modal */}
      {billLimitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#0D1935]">
                Manage mobile bill limit
              </h3>
              <button
                type="button"
                onClick={() => {
                  setBillLimitModalOpen(false);
                  setBillLimitError("");
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Set a monthly cap for out-of-plan charges across your Zoiko Mobile UK account (£0 to £100).
              </p>
              <div>
                <label className="block text-xs font-bold text-[#0D1935] mb-1.5">
                  Monthly limit (£)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={tempBillLimit}
                  onChange={(e) => {
                    setTempBillLimit(e.target.value);
                    if (billLimitError) setBillLimitError("");
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold text-[#0D1935] focus:outline-none transition ${
                    billLimitError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#E01C5B]"
                  }`}
                  placeholder="e.g. 15"
                />
                {billLimitError && (
                  <p className="text-red-500 text-[11px] mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{billLimitError}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBillLimitModalOpen(false);
                  setBillLimitError("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const check = validateSpendLimit(tempBillLimit);
                  if (!check.isValid) {
                    setBillLimitError(check.error || "Please enter a valid monetary amount (£0 - £100).");
                    return;
                  }
                  const val = check.amount ?? 0;
                  setBillLimit(val);
                  try {
                    localStorage.setItem("zoiko_bill_limit", String(val));
                  } catch {}
                  setBillLimitModalOpen(false);
                  setBillLimitError("");
                  showToast(`Updated monthly mobile bill limit to £${val.toFixed(2)}`, "success");
                }}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c9144e] text-xs font-semibold text-white cursor-pointer"
              >
                Save limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

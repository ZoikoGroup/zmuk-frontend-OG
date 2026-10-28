"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, RefreshCw, Smartphone, ShieldCheck } from "lucide-react";

// Modular Dashboard Components
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardTopNav from "./components/DashboardTopNav";
import QuickStatusStrip, { LineOption } from "./components/QuickStatusStrip";
import StatCardsGrid from "./components/StatCardsGrid";
import UsageDonutCard from "./components/UsageDonutCard";
import DataUsageHistoryCard from "./components/DataUsageHistoryCard";
import RoamingTravelCard from "./components/RoamingTravelCard";
import QuickActionsRow from "./components/QuickActionsRow";
import BillsPaymentsCard, { BillItem } from "./components/BillsPaymentsCard";
import BottomThreeCards from "./components/BottomThreeCards";
import SupportBanner from "./components/SupportBanner";
import {
  BoosterModal,
  AddNumberModal,
  AddNumberData,
  ManageSingleLineModal,
  ManageAllNumbersModal,
  ReportActivityModal,
  ComparePlansModal,
} from "./components/DashboardModals";

// Real BeQuick API Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import beQuick from "../utils/dasdbeQuickApi";
import {
  getFallbackUserLine,
  getBoosterSummary,
  recordBoosterPurchase,
} from "../utils/dashboardSync";

// ── Helpers ──
function formatUkNumber(mdn?: string | number): string {
  if (!mdn) return "No active number";
  let s = String(mdn).replace(/\D/g, "");
  if (!s) return "No active number";
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
      return "Active";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeCart(cart?: any[]): string {
  if (!cart || cart.length === 0) return "Zoiko Plan";
  const names = cart
    .map((c) => c.name || c.plan_name || c.title || c.product_name)
    .filter(Boolean) as string[];
  return names.length ? names.join(", ") : `${cart.length} item(s)`;
}

export default function DashboardPage() {
  const router = useRouter();

  // ── Authentication & User Profile ──
  const [userName, setUserName] = useState("Account holder");
  const [userRole, setUserRole] = useState("Account holder");
  const [accountEmail, setAccountEmail] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [subscriberId, setSubscriberId] = useState<string | number | null>(null);

  // ── Search & Navigation ──
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ── Dynamic Lines / Mobile Numbers ──
  const [lines, setLines] = useState<LineOption[]>([]);
  const [activeLineId, setActiveLineId] = useState<string>("");

  // ── Usage metrics for lines ──
  const [dataMetrics, setDataMetrics] = useState<
    Record<string, { remaining: number; total: number; used: number }>
  >({});
  const [roamingMetrics, setRoamingMetrics] = useState<
    Record<string, { remaining: number; total: number; used: number }>
  >({});

  // ── Dynamic Billing State ──
  const [billsList, setBillsList] = useState<BillItem[]>([]);
  const [nextCollectionAmount, setNextCollectionAmount] = useState<number>(0);
  const [nextCollectionDate, setNextCollectionDate] = useState<string>("—");
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [monthlyPlanCharges, setMonthlyPlanCharges] = useState<number>(0);
  const [cycleDaysLeft, setCycleDaysLeft] = useState<number>(0);
  const [lastPaymentAmount, setLastPaymentAmount] = useState<number>(0);
  const [lastPaymentDate, setLastPaymentDate] = useState<string>("—");
  const [paymentMethodInfo, setPaymentMethodInfo] = useState<{
    method: string;
    note: string;
    hasMandate: boolean;
  }>({
    method: "No payment method",
    note: "linked yet",
    hasMandate: false,
  });

  // ── Security & 2FA ──
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(true);

  // ── UI / State Helpers ──
  const [freshnessTime, setFreshnessTime] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storedBillLimit, setStoredBillLimit] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null);

  // ── Modals State ──
  const [boosterOpen, setBoosterOpen] = useState(false);
  const [addNumberOpen, setAddNumberOpen] = useState(false);
  const [manageMobileOpen, setManageMobileOpen] = useState(false);
  const [manageNumbersOpen, setManageNumbersOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [comparePlansOpen, setComparePlansOpen] = useState(false);

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch session & Live BeQuick Data ──
  const loadDynamicDashboard = useCallback(async () => {
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
        userData?.username ||
        (email ? email.split("@")[0] : "");

      if (fullName) setUserName(fullName);
      if (email) setAccountEmail(email);

      // Check stored 2FA
      const stored2FA = localStorage.getItem("driverx_2fa") === "true";
      setTwoFAEnabled(stored2FA);

      // Clear any leftover local custom lines
      try {
        localStorage.removeItem("zoiko_custom_lines");
      } catch {}

      // If no auth token, redirect to login immediately
      if (!token || !email) {
        /* OLD CODE (Returned without redirect):
        setIsDemo(false);
        setLines([]);
        ...
        return;
        */
        setIsDemo(false);
        setLines([]);
        setDataMetrics({});
        setActiveLineId("");
        setNextCollectionAmount(0);
        setNextCollectionDate("—");
        setMonthlyPlanCharges(0);
        setCycleDaysLeft(0);
        setLastPaymentAmount(0);
        setLastPaymentDate("—");
        router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setIsDemo(false);
      setLines([]);
      setDataMetrics({});
      setRoamingMetrics({});
      setActiveLineId("");
      setNextCollectionAmount(0);
      setNextCollectionDate("—");
      setMonthlyPlanCharges(0);
      setCycleDaysLeft(0);
      setLastPaymentAmount(0);
      setLastPaymentDate("—");

      let foundSubscriberId: string | number | null = null;
      let fetchedOrders: BillItem[] = [];

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      // 1. Check Django bqorders
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
          for (const [orderId, entries] of Object.entries(userGroups)) {
            const entry = entries?.[0];
            if (!entry) continue;
            if (!foundSubscriberId && entry.subscriber_id) {
              foundSubscriberId = entry.subscriber_id;
            }
            const dateStr = entry.created_at
              ? new Date(entry.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Recent";
            fetchedOrders.push({
              id: String(entry.order_db_id ?? orderId),
              billDate: dateStr,
              period: dateStr,
              amount: Number(entry.total || 0),
              status: "Settled",
              subNote: describeCart(entry.cart),
            });
          }
        }
      } catch (e) {
        console.warn("Could not query Django bqorders:", e);
      }

      // 1b. Check Django sims orders
      try {
        const simRes = await fetch(`${API_BASE}/api/v1/sims/orders/by-user/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ logged_user: email }),
        });
        if (simRes.ok) {
          const simData = await simRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const groups = (simData.groups?.[email] || {}) as Record<string, any[]>;
          for (const [orderId, entries] of Object.entries(groups)) {
            const entry = entries?.[0];
            if (!entry) continue;
            const dateStr = entry.created_at
              ? new Date(entry.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Recent";
            if (!fetchedOrders.some((o) => o.id === String(entry.id || orderId))) {
              fetchedOrders.push({
                id: String(entry.id || orderId),
                billDate: dateStr,
                period: dateStr,
                amount: Number(entry.total || entry.amount || 0),
                status: "Settled",
                subNote: describeCart(entry.cart),
              });
            }
          }
        }
      } catch (e) {
        console.warn("Could not query Django sims orders:", e);
      }

      if (fetchedOrders.length > 0) {
        setBillsList(fetchedOrders);
        setLastPaymentAmount(fetchedOrders[0].amount);
        setLastPaymentDate(fetchedOrders[0].billDate);
      }

      // 2. Query BeQuick subscriber by email if not found in Django
      if (!foundSubscriberId) {
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

      // 3. If subscriber found, fetch live lines & details
      if (foundSubscriberId) {
        setSubscriberId(foundSubscriberId);

        // Fetch User Lines
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bqLines = ((await beQuick.getUserLines(foundSubscriberId)) || []) as any[];
          if (bqLines && bqLines.length > 0) {
            const newMetrics: Record<string, { remaining: number; total: number; used: number }> = {};
            const newRoaming: Record<string, { remaining: number; total: number; used: number }> = {};

            const loadedLines: LineOption[] = await Promise.all(
              bqLines.map(async (line: any, idx: number) => {
                const lineId = String(line.id);
                let planName = line.device_name || "Zoiko SIM Plan";
                let renewDate = "Monthly";
                const simType = isEsim(line) ? "eSIM" : "SIM card";
                const status = niceStatus(line.status);
                let lineMetric = { remaining: 15, total: 30, used: 15 };
                let roamingMetric = { remaining: 5, total: 5, used: 0 };

                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const details = (await beQuick.getPlanDetails(line.id, true)) as any;
                  if (details?.current_plans?.[0]?.name) {
                    planName = details.current_plans[0].name;
                  }
                  if (details?.service_period?.end_at) {
                    const endDate = new Date(details.service_period.end_at);
                    renewDate = endDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    });
                    const diffDays = Math.ceil(
                      (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    setCycleDaysLeft(Math.max(0, diffDays));
                  }

                  if (details?.usage_summary?.data) {
                    const d = details.usage_summary.data;
                    const tot = d.total ? kbToGb(Number(d.total)) : 30;
                    const usd = d.used ? kbToGb(Number(d.used)) : 0;
                    const rem =
                      d.remaining !== undefined
                        ? kbToGb(Number(d.remaining))
                        : Math.max(0, tot - usd);
                    lineMetric = {
                      remaining: rem,
                      total: tot || 30,
                      used: usd,
                    };
                  }

                  if (details?.usage_summary?.international_data) {
                    const id = details.usage_summary.international_data;
                    const tot = id.total ? kbToGb(Number(id.total)) : 5;
                    const usd = id.used ? kbToGb(Number(id.used)) : 0;
                    const rem =
                      id.remaining !== undefined
                        ? kbToGb(Number(id.remaining))
                        : Math.max(0, tot - usd);
                    roamingMetric = {
                      remaining: rem,
                      total: tot || 5,
                      used: usd,
                    };
                  }
                } catch (e) {
                  console.warn("Could not fetch plan details for line", line.id, e);
                }

                // Synchronize stored boosters for this line
                const boosterInfo = getBoosterSummary(lineId);
                if (boosterInfo.count > 0) {
                  lineMetric.total = Number(
                    (lineMetric.total + boosterInfo.totalGb).toFixed(1)
                  );
                  lineMetric.remaining = Number(
                    (lineMetric.remaining + boosterInfo.totalGb).toFixed(1)
                  );
                }

                newMetrics[lineId] = lineMetric;
                newRoaming[lineId] = roamingMetric;

                return {
                  id: lineId,
                  number: formatUkNumber(line.mdn),
                  planName,
                  simType,
                  status,
                  renewDate,
                  isPrimary: isPrimary(line) || idx === 0,
                };
              })
            );

            setLines(loadedLines);
            setDataMetrics(newMetrics);
            setRoamingMetrics(newRoaming);

            const primary = loadedLines.find((l) => l.isPrimary) || loadedLines[0];
            if (primary) {
              setActiveLineId(primary.id);
            }
          }
        } catch (e) {
          console.warn("Error fetching user lines:", e);
        }

        // Fetch Current Bill
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bill = (await beQuick.getCurrentBill(foundSubscriberId)) as any;
          if (bill) {
            const tot = Number(bill.total || 0);
            setNextCollectionAmount(tot);
            setMonthlyPlanCharges(tot);
            if (bill.closed_at || bill.due_at) {
              const bd = new Date(bill.closed_at || bill.due_at);
              setNextCollectionDate(
                bd.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              );
            }
            if (bill.past_due && tot > 0) {
              setOutstandingBalance(tot);
            }
          }
        } catch (e) {
          console.warn("Error fetching current bill:", e);
        }

        // Fetch Orders
        if (fetchedOrders.length === 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ordRes = (await beQuick.getOrders(foundSubscriberId)) as any;
            const list = ordRes?.orders || ordRes?.data || [];
            if (list.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fetchedOrders = list.map((o: any) => ({
                id: String(o.id || o.order_id),
                billDate: o.created_at
                  ? new Date(o.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent",
                period: "Monthly cycle",
                amount: Number(o.amount || o.total || 0),
                status: (o.status || "Settled") as "Settled" | "Refunded" | "Pending",
                subNote: o.description || "Zoiko Subscription",
              }));
            }
          } catch (e) {
            console.warn("Error fetching orders:", e);
          }
        }

        if (fetchedOrders.length > 0) {
          setBillsList(fetchedOrders);
          setLastPaymentAmount(fetchedOrders[0].amount);
          setLastPaymentDate(fetchedOrders[0].billDate);
        }
      }

      // If no BeQuick telecom lines were returned yet, check if dynamic primary line exists
      setLines((current) => {
        if (current.length === 0) {
          const fallback = getFallbackUserLine(userData);
          if (!fallback) {
            setActiveLineId("");
            return [];
          }
          const boosterInfo = getBoosterSummary(fallback.id);
          const baseGb = fallback.planGb;
          const storedRemaining =
            typeof window !== "undefined"
              ? localStorage.getItem("zoiko_data_remaining")
              : null;
          const remainingGb =
            storedRemaining && !isNaN(Number(storedRemaining))
              ? Number(storedRemaining)
              : Number(Math.max(0, baseGb - 14.2 + boosterInfo.totalGb).toFixed(1));
          const totalGb = Number((baseGb + boosterInfo.totalGb).toFixed(1));

          const primaryLine: LineOption = {
            id: fallback.id,
            number: fallback.number,
            planName: fallback.planName,
            status: "Active",
            simType: fallback.simType,
            renewDate: "Monthly rolling",
            isPrimary: true,
          };

          setDataMetrics({
            [primaryLine.id]: {
              total: totalGb,
              remaining: remainingGb,
              used: Number(Math.max(0, totalGb - remainingGb).toFixed(1)),
            },
          });

          setRoamingMetrics({
            [primaryLine.id]: {
              total: Math.min(25, baseGb),
              remaining: Number((Math.min(25, baseGb) - 3.8).toFixed(1)),
              used: 3.8,
            },
          });

          setActiveLineId(primaryLine.id);

          return [primaryLine];
        }

        // Merge any user added lines from Add New Number wizard
        try {
          const storedAdded = localStorage.getItem("zoiko_added_lines");
          if (storedAdded) {
            const parsedAdded = JSON.parse(storedAdded);
            if (Array.isArray(parsedAdded) && parsedAdded.length > 0) {
              const existingIds = new Set(current.map((p) => p.id));
              const existingNumbers = new Set(current.map((p) => p.number.replace(/\D/g, "")));
              const toAdd = parsedAdded.filter(
                (l: any) => !existingIds.has(l.id) && !existingNumbers.has(l.number.replace(/\D/g, ""))
              );
              if (toAdd.length > 0) {
                setDataMetrics((prevMetrics) => {
                  const updated = { ...prevMetrics };
                  toAdd.forEach((line: any) => {
                    if (!updated[line.id]) {
                      const gb = line.planGb || (line.planName.toLowerCase().includes("unlimited") ? 100 : 30);
                      updated[line.id] = {
                        total: gb,
                        remaining: gb,
                        used: 0,
                      };
                    }
                  });
                  return updated;
                });
                return [...current, ...toAdd];
              }
            }
          }
        } catch {}

        return current;
      });

      // Dynamically resolve payment method without any hardcoded card or bank numbers
      let pmType = "No payment method";
      let pmNote = "linked yet";
      let mandateActive = false;

      if (typeof window !== "undefined") {
        const storedBank = localStorage.getItem("zoiko_saved_bank");
        const storedCard = localStorage.getItem("zoiko_saved_card");

        if (storedBank) {
          try {
            const b = JSON.parse(storedBank);
            if (b.last2) {
              pmType = "Direct Debit";
              pmNote = `account ending ••${b.last2}`;
              mandateActive = true;
            }
          } catch {}
        } else if (storedCard) {
          try {
            const c = JSON.parse(storedCard);
            if (c.last4) {
              pmType = c.brand || "Debit card";
              pmNote = `ending ••${c.last4}`;
              mandateActive = false;
            }
          } catch {}
        }
      }

      setPaymentMethodInfo({
        method: pmType,
        note: pmNote,
        hasMandate: mandateActive,
      });

      const storedLimit = typeof window !== "undefined" ? localStorage.getItem("zoiko_bill_limit") : null;
      setStoredBillLimit(storedLimit || null);
    } catch (err) {
      console.error("Dashboard dynamic load error:", err);
    }
  }, []);

  // Initial data load on mount & live cross-tab/page synchronization
  useEffect(() => {
    loadDynamicDashboard();
    const handleSync = () => loadDynamicDashboard();
    window.addEventListener("zoiko-booster-updated", handleSync);
    window.addEventListener("zoiko-lines-updated", handleSync);
    window.addEventListener("zoiko-auth", handleSync);
    return () => {
      window.removeEventListener("zoiko-booster-updated", handleSync);
      window.removeEventListener("zoiko-lines-updated", handleSync);
      window.removeEventListener("zoiko-auth", handleSync);
    };
  }, [loadDynamicDashboard]);

  // ── Current Active Line Info ──
  const displayLines = lines;
  const currentLine: LineOption =
    displayLines.find((l) => l.id === activeLineId) ||
    displayLines[0] || {
      id: "",
      number: "No SIM active",
      planName: "No active plan",
      simType: "—",
      status: "Inactive",
      renewDate: "—",
    };

  const currentMetric =
    dataMetrics[currentLine.id] || { remaining: 0, total: 0, used: 0 };

  const currentRoaming =
    roamingMetrics[currentLine.id] || { remaining: 0, total: 0, used: 0 };

  const displayNextAmount = nextCollectionAmount;
  const displayNextDate = nextCollectionDate;
  const displayCycleDaysLeft = cycleDaysLeft;
  const displayOutstanding = outstandingBalance;
  const displayMonthlyCharges = monthlyPlanCharges;

  const dataRemainingPct =
    currentMetric.total > 0
      ? Math.round((currentMetric.remaining / currentMetric.total) * 100)
      : 0;

  // ── Line switching handler ──
  const handleSelectLine = (id: string) => {
    setActiveLineId(id);
    const selected = lines.find((l) => l.id === id);
    if (selected) {
      showToast(`Switched active line to ${selected.number}`, "info");
    }
  };

  // ── Booster purchase handler ──
  const handleApplyBooster = (addedGb: number, cost: number) => {
    const targetId = currentLine.id || "primary-line-1";
    recordBoosterPurchase({
      addedGb,
      cost,
      lineId: targetId,
      lineNumber: currentLine.number,
      boosterName: `${addedGb} GB Data Booster`,
    });
    setDataMetrics((prev) => {
      const cur = prev[targetId] || { remaining: 18.4, total: 30, used: 11.6 };
      return {
        ...prev,
        [targetId]: {
          ...cur,
          remaining: Number((cur.remaining + addedGb).toFixed(1)),
          total: Number((cur.total + addedGb).toFixed(1)),
        },
      };
    });
    setNextCollectionAmount((prev) => Number((prev + cost).toFixed(2)));
    showToast(`Successfully added +${addedGb} GB booster to ${currentLine.number}!`);
  };

  // ── Add new number handler ──
  const handleAddNumber = (newNum: AddNumberData) => {
    const newId = `line-${Date.now()}`;
    const planGb = newNum.planGb || 20;
    const formattedNum = formatUkNumber(newNum.number);
    const newLine: LineOption = {
      id: newId,
      number: formattedNum,
      planName: newNum.planName,
      simType: newNum.simType,
      status: "Active",
      renewDate: "Monthly",
      isPrimary: lines.length === 0,
    };
    const updated = [...lines, newLine];
    setLines(updated);

    if (subscriberId) {
      try {
        beQuick
          .createDeviceLine({
            subscriber_id: subscriberId,
            mdn: formattedNum.replace(/\s+/g, ""),
            device_name: newNum.planName,
            is_esim: newNum.simType.toLowerCase().includes("esim"),
            status: "active",
          })
          .catch(() => {});
      } catch {}
    }

    setDataMetrics((prev) => ({
      ...prev,
      [newId]: { remaining: planGb, total: planGb, used: 0 },
    }));
    setRoamingMetrics((prev) => ({
      ...prev,
      [newId]: { remaining: 5, total: 5, used: 0 },
    }));
    setActiveLineId(newId);
    showToast(`Added new line ${formattedNum} successfully!`);
  };

  // ── Switch / upgrade plan handler ──
  const handleSelectPlan = (planName: string, planGb: number, price: number) => {
    if (!currentLine.id) {
      router.push("/plans");
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.id === currentLine.id ? { ...l, planName } : l))
    );
    setDataMetrics((prev) => {
      const cur = prev[currentLine.id] || { remaining: 0, total: 0, used: 0 };
      const newRemaining = Math.max(0, Number((planGb - cur.used).toFixed(1)));
      return {
        ...prev,
        [currentLine.id]: {
          ...cur,
          total: planGb,
          remaining: newRemaining,
        },
      };
    });
    setMonthlyPlanCharges(price);
    setNextCollectionAmount(price);
    showToast(`Switched ${currentLine.number} to ${planName} (£${price.toFixed(2)}/mo)!`);
  };

  // ── Toggle pause / resume line ──
  const handleTogglePauseLine = (id: string) => {
    setLines((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          const isPaused = (l.status || "").toLowerCase() === "paused";
          return { ...l, status: isPaused ? "Active" : "Paused" };
        }
        return l;
      });
      const target = updated.find((l) => l.id === id);
      showToast(
        target?.status === "Paused"
          ? `Paused line ${target?.number}. Service temporarily disabled.`
          : `Resumed line ${target?.number}. Service active.`
      );
      return updated;
    });
  };

  // ── Set primary line ──
  const handleSetPrimaryLine = (id: string) => {
    setLines((prev) => {
      const updated = prev.map((l) => ({ ...l, isPrimary: l.id === id }));
      const target = updated.find((l) => l.id === id);
      showToast(`Set ${target?.number} as primary account line.`);
      return updated;
    });
  };

  // ── Delete / unlink line ──
  const handleDeleteLine = (id: string) => {
    setLines((prev) => {
      const target = prev.find((l) => l.id === id);
      const updated = prev.filter((l) => l.id !== id);
      if (activeLineId === id && updated.length > 0) {
        setActiveLineId(updated[0].id);
      }
      showToast(`Unlinked ${target?.number || "line"} from account.`, "info");
      return updated;
    });
  };

  // ── 2FA Toggle ──
  const handleToggle2FA = async () => {
    try {
      const next = !twoFAEnabled;
      setTwoFAEnabled(next);
      localStorage.setItem("driverx_2fa", String(next));

      const token =
        localStorage.getItem("zoiko_token") ||
        localStorage.getItem("driverx_token") ||
        "";
      if (token) {
        const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/security/`;
        await fetch(`${BASE_URL}two-fa/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled: next }),
        }).catch(() => {});
      }
      showToast(
        next
          ? "Two-factor authentication enabled."
          : "Two-factor authentication disabled.",
        "success"
      );
    } catch {
      showToast("Updated 2FA status.", "info");
    }
  };

  // ── Report suspicious activity ──
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
    } catch {
      // Offline fallback
    }
    showToast("Report submitted. Our UK team will investigate shortly.");
  };

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    localStorage.removeItem("driverx_token");
    localStorage.removeItem("driverx_2fa");
    localStorage.setItem("zoiko_logged_out", "true");
    window.dispatchEvent(new Event("zoiko-auth"));
    router.push("/login");
  };

  // ── Refresh data ──
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDynamicDashboard();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Allowances, line statuses, and billing synced with live network.", "info");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F6] text-[#0D1935] flex justify-center p-3 sm:p-5 font-sans antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0D1935] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#E01C5B] flex-shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Outer Dashboard Frame */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sticky/Fixed Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 self-stretch lg:self-start flex-shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            numbersCount={displayLines.length}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenComparePlans={() => setComparePlansOpen(true)}
            onOpenBoosterModal={() => setBoosterOpen(true)}
            onOpenAddNumber={() => router.push("/dashboard/my-mobile-numbers")}
            planName={currentLine.planName}
            renewDate={currentLine.renewDate}
          />
        </div>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-5 w-full">
          {/* ── TOP NAV ── */}
          <DashboardTopNav
            userName={userName}
            userRole={userRole}
            isDemo={isDemo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
            unreadNotifications={unreadNotifications}
            onClearNotifications={() => setUnreadNotifications(0)}
            subscriberId={subscriberId}
            activeLineId={currentLine.id}
            onAddNewNumber={() => router.push("/dashboard/add-device")}
            onManageNumbers={() => router.push("/dashboard/my-mobile-numbers")}
            onOpenBoosterModal={() => setBoosterOpen(true)}
          />

          {/* If logged in but no active BeQuick lines */}
          {!isDemo && lines.length === 0 && (
            <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Welcome to Zoiko Mobile! No active SIM lines linked yet.</span>
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Logged in as {accountEmail || userName}. You currently have 0 active lines. Activate an eSIM or order a physical SIM to start tracking your dynamic allowances and billing.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => router.push("/activate-your-sim")}
                  className="px-3.5 py-1.5 bg-[#E01C5B] text-white text-xs font-semibold rounded-xl hover:bg-[#c9144e] transition cursor-pointer"
                >
                  Activate SIM
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/30-day-plan")}
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-semibold rounded-xl hover:bg-amber-100 transition cursor-pointer"
                >
                  Browse Plans
                </button>
              </div>
            </div>
          )}

          {/* ── QUICK STATUS STRIP ── */}
          <QuickStatusStrip
            lines={displayLines}
            activeLineId={activeLineId || displayLines[0]?.id || ""}
            onSelectLine={handleSelectLine}
            lastUpdated={freshnessTime}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onManagePlan={() => router.push("/dashboard/compare-plans")}
            onAddNewNumber={() => router.push("/dashboard/add-new-number")}
            onManageNumbers={() => router.push("/dashboard/my-mobile-numbers")}
          />

          {/* ── ROW 1: 4 STAT CARDS (2x2) + USAGE DONUT CARD (RIGHT) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: 2x2 Stat Cards */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <StatCardsGrid
                dataRemainingGb={currentMetric.remaining}
                dataTotalGb={currentMetric.total}
                dataRemainingPct={dataRemainingPct}
                nextCollectionAmount={displayNextAmount}
                nextCollectionDate={displayNextDate}
                linesCount={displayLines.length}
                cycleDaysLeft={displayCycleDaysLeft}
                renewDate={currentLine.renewDate}
                lineStatus={currentLine.status}
                simType={currentLine.simType}
              />
            </div>

            {/* Right: Circular Donut Gauge Card */}
            <div className="lg:col-span-5 flex flex-col">
              <UsageDonutCard
                dataRemainingGb={currentMetric.remaining}
                dataTotalGb={currentMetric.total}
                dataUsedGb={currentMetric.used}
                dataRemainingPct={dataRemainingPct}
                updatedTime={freshnessTime}
                onOpenBoosterModal={() => setBoosterOpen(true)}
                onOpenDetails={() => {
                  const el = document.getElementById("usage-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          </div>

          {/* ── ROW 2: DATA USAGE HISTORY + ROAMING & TRAVEL ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: Data Usage Chart */}
            <div className="lg:col-span-7 flex flex-col">
              <DataUsageHistoryCard
                currentUsedGb={currentMetric.used}
                currentTotalGb={currentMetric.total}
                roamingUsedGb={currentRoaming.used}
                linesCount={displayLines.length}
                activeLineId={currentLine.id}
              />
            </div>

            {/* Right: Roaming & Travel */}
            <div className="lg:col-span-5 flex flex-col">
              <RoamingTravelCard
                hasActivePlan={displayLines.length > 0}
                roamingAllowanceGb={currentRoaming.total}
              />
            </div>
          </div>

          {/* ── ROW 3: QUICK ACTIONS (5 TILES) ── */}
          <QuickActionsRow
            onAddData={() => router.push("/dashboard/addons-and-boosters")}
            onManageSim={() => router.push("/dashboard/sim-and-esim")}
            onTransferNumber={() => router.push("/switch-and-save")}
            onRoamingSettings={() => router.push("/dashboard/roaming-and-travel")}
            onLatestOffers={() => router.push("/dashboard/latest-offers")}
          />

          {/* ── ROW 4: BILLS & PAYMENTS (SPLIT CARD) ── */}
          <BillsPaymentsCard
            bills={billsList}
            linesCount={displayLines.length}
            outstandingBalance={displayOutstanding}
            monthlyPlanCharges={displayMonthlyCharges}
            monthlyBreakdownNote={displayLines.map((l) => l.planName).filter(Boolean).join(" · ")}
            nextCollectionAmount={displayNextAmount}
            nextCollectionDate={displayNextDate}
            lastPaymentAmount={lastPaymentAmount}
            lastPaymentDate={lastPaymentDate}
            paymentMethod={paymentMethodInfo.method}
            paymentMethodNote={paymentMethodInfo.note}
            mobileBillLimit={
              storedBillLimit
                ? `£${Number(storedBillLimit).toFixed(2)}`
                : "Not set"
            }
            mobileBillLimitNote={
              storedBillLimit
                ? "/ month · safety spend cap"
                : "· Set a spend limit"
            }
            hasMandate={paymentMethodInfo.hasMandate}
            isLoading={isRefreshing}
            onManagePaymentMethod={() =>
              router.push("/dashboard/bills-and-payments?action=payment-method")
            }
            onManageBillLimit={() =>
              router.push("/dashboard/bills-and-payments?action=bill-limit")
            }
            onViewAllBills={() => router.push("/dashboard/bills-and-payments")}
            onDownloadBill={(id) => showToast(`Invoice downloaded for billing cycle #${id}.`)}
          />

          {/* ── ROW 5: 3-COLUMN CARDS (My mobile, My numbers, Account security) ── */}
          <BottomThreeCards
            lines={displayLines}
            activeLineId={activeLineId || displayLines[0]?.id || ""}
            onSelectLine={handleSelectLine}
            onAddNewNumber={() => router.push("/dashboard/add-new-number")}
            onManageMobile={() => router.push("/dashboard/sim-and-esim")}
            onManageNumbers={() => router.push("/dashboard/my-mobile-numbers")}
            onSwapSim={() => router.push("/dashboard/sim-and-esim")}
            onReportSuspicious={() => setReportOpen(true)}
            onToggle2FA={handleToggle2FA}
            twoFAEnabled={twoFAEnabled}
          />

          {/* ── ROW 6: SUPPORT FOOTER BANNER ── */}
          <SupportBanner />
        </main>
      </div>

      {/* ── INTERACTIVE MODALS ── */}
      <BoosterModal
        isOpen={boosterOpen}
        onClose={() => setBoosterOpen(false)}
        currentRemainingGb={currentMetric.remaining}
        onApplyBooster={handleApplyBooster}
      />

      <AddNumberModal
        isOpen={addNumberOpen}
        onClose={() => setAddNumberOpen(false)}
        onAddNumber={handleAddNumber}
      />

      <ManageSingleLineModal
        isOpen={manageMobileOpen}
        onClose={() => setManageMobileOpen(false)}
        line={currentLine}
        metrics={currentMetric}
        onTogglePauseLine={handleTogglePauseLine}
        onAddBooster={() => setBoosterOpen(true)}
        onSwapSim={() => router.push("/sim-check")}
      />

      <ManageAllNumbersModal
        isOpen={manageNumbersOpen}
        onClose={() => setManageNumbersOpen(false)}
        lines={displayLines}
        activeLineId={activeLineId || displayLines[0]?.id || ""}
        subscriberId={subscriberId}
        onSelectLine={handleSelectLine}
        onSetPrimaryLine={handleSetPrimaryLine}
        onTogglePauseLine={handleTogglePauseLine}
        onDeleteLine={handleDeleteLine}
        onAddNewNumber={() => router.push("/dashboard/add-device")}
      />

      <ReportActivityModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportActivity}
      />

      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName={currentLine.planName}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}

/*
================================================================================
PREVIOUS DASHBOARD IMPLEMENTATION 
================================================================================

import React, { useEffect, useState } from "react";
import {
  Share2,
  Tag,
  HelpCircle,
  ShieldCheck,
  LogOut,
  UserPlus,
  ChevronUp,
  Key,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

export function SecurityPageOld() {
  const [user,setUser] = useState("User");
  const [activeTab, setActiveTab] = useState("Security");
  const router = useRouter();

  // ── Backend-connected state ──
  const [token, setToken] = useState<string>("");
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(false);
  const [twoFALoading, setTwoFALoading] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportNote, setReportNote] = useState<string>("");
  const [toast, setToast] = useState<Toast>({ msg: "", type: "" });

  // ── Hide/Show toggle state for Recent Activity ──
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);

  // Demo login history
  const loginHistory: LoginEntry[] = [
    {
      id: 1,
      device: "Chrome on Windows 11",
      location: "Bangalore, IN",
      time: "Today, 09:42",
    },
    {
      id: 2,
      device: "Safari on iPhone",
      location: "Bangalore, IN",
      time: "Yesterday, 21:18",
    },
    {
      id: 3,
      device: "Firefox on macOS",
      location: "Mumbai, IN",
      time: "12 May, 14:05",
    },
  ];

  const navigationItems = [
    { label: "Security", icon: ShieldCheck, href: "dashboard/security" },
    { label: "Refer & Earn", icon: Share2, href: "/refer-a-friend" },
    { label: "Latest Offers", icon: Tag, href: "/bundled-offers" },
  ];

  const dummyPageLinks = [
    { label: "Manage Devices", href: "/devices" },
    { label: "Roaming & Add-ons", href: "/recharge" },
    { label: "Data Boosters", href: "/data-only-plans" },
    { label: "SIM Swap Request", href: "/sim-check" },
  ];

  const bottomNavItems = [
    { label: "Help & Support", icon: HelpCircle, href: "/help-support" },
    {
      label: "Terms and Conditions",
      icon: ShieldCheck,
      href: "/terms-and-conditions",
    },
  ];

  useEffect(() => {
    const storedToken =
      localStorage.getItem("zoiko_token") ||
      localStorage.getItem("driverx_token") ||
      "";
    setToken(storedToken);

    const stored2FA = localStorage.getItem("driverx_2fa") === "true";
    setTwoFAEnabled(stored2FA);
  }, []);

  // ── Logout Procedure ──
  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    localStorage.removeItem("driverx_token");
    localStorage.removeItem("driverx_2fa");
    window.dispatchEvent(new Event("zoiko-auth"));
    router.push("/login");
    router.refresh();
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

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
          "success",
        );
      } else {
        const next = !twoFAEnabled;
        setTwoFAEnabled(next);
        localStorage.setItem("driverx_2fa", String(next));
        showToast(
          next ? "2FA enabled (local)." : "2FA disabled (local).",
          "success",
        );
      }
    } catch {
      const next = !twoFAEnabled;
      setTwoFAEnabled(next);
      localStorage.setItem("driverx_2fa", String(next));
      showToast(
        next ? "2FA enabled (offline)." : "2FA disabled (offline).",
        "success",
      );
    }
    setTwoFALoading(false);
  };

  const submitReport = async () => {
    if (!reportNote.trim()) {
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
        alert("Report submitted. Our team will review it shortly.");
        setReportNote("");
      } else {
        alert("Report received. We'll follow up by email.");
        setReportNote("");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setReportLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans antialiased text-[#222222]">
      <header className="w-full bg-gradient-to-r from-[#E5125A] via-[#E5127D] to-[#E5125A] py-3 text-center text-white font-semibold text-sm sm:text-base shadow-sm">
        Welcome to Your Account Summary with Zoiko Mobile!
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 bg-white rounded-xl shadow-sm py-5 px-0 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col items-center text-center px-4 mb-5">
              <div className="relative inline-block">
                <img
                  src="/images/DefaultPfp.jpg"
                  alt="profile image"
                  className="w-16 h-16 rounded-full object-cover shadow-sm"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-[#0080FF] text-white p-1 rounded-full shadow hover:bg-blue-600 transition flex items-center justify-center w-5 h-5 text-[10px] cursor-pointer hover:scale-110 active:scale-95"
                >
                  <Edit3Icon className="w-3 h-3" />
                </button>
              </div>
              <h2 className="text-base font-bold text-gray-900 mt-2.5">
                {user}
              </h2>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 text-xs font-medium text-[#555555] border border-gray-300 rounded-md px-3 py-1 flex items-center gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.label;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(item.label);
                      router.push(item.href);
                    }}
                    className={`w-full flex items-center gap-3 px-5 py-2 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-[#E5125A] text-white shadow-sm"
                        : "text-[#555555] hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? "bg-white text-[#E5125A]"
                          : "bg-[#E5125A] text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <span className="block px-5 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                More Pages
              </span>
              <nav className="space-y-1">
                {dummyPageLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="w-full flex items-center gap-3 px-5 py-2 text-xs font-semibold text-[#555555] hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="w-full flex items-center gap-3 px-5 py-2 text-xs font-semibold text-[#555555] hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E5125A] text-white flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </aside>

        <main className="lg:col-span-9 bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, <span className="text-[#7B7B7B]">{user}!</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Welcome to Your Account Summary
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-6 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E5125A] text-white flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Change Password
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  You can update your password from the Edit Profile page.
                </p>

                <div className="mt-4 border border-gray-200 rounded-xl p-3 flex items-center justify-between bg-white">
                  <div className="text-[13px]">
                    <div className="font-bold text-gray-900">Password</div>
                    <div className="text-gray-500 text-xs">
                      Last changed: —
                    </div>
                  </div>
                  <a
                    href="/dashboard/edit-profile"
                    className="bg-[#1A1A1A] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-800 active:scale-95 transition cursor-pointer"
                  >
                    Edit
                  </a>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="text-[#E5125A] text-xs font-bold hover:underline hover:text-[#c90f4c] transition cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="bg-[#FFF0F4] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#E5125A] text-white flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">
                  Report Suspicious Activity
                </h4>
              </div>

              <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
                Noticed a login you don&apos;t recognise, or anything unusual?
                Tell us about it and our team will investigate.
              </p>

              <textarea
                rows={4}
                placeholder="Describe what looked off (e.g. unfamiliar device, unexpected password reset email)..."
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-xl text-xs outline-none focus:border-[#E5125A] focus:ring-2 focus:ring-[#FBD5E1] transition resize-none mb-4"
              />

              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={submitReport}
                  disabled={reportLoading}
                  className="px-4 py-1.5 bg-[#E5125A] text-white text-sm font-semibold rounded-lg hover:bg-[#c90f4c] hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {reportLoading ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setReportNote("")}
                  className="px-6 py-1.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 active:scale-95 transition-all bg-white cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/refer-a-friend")}
            className="border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-none hover:shadow-sm cursor-pointer transition active:scale-[0.99]"
          >
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-gray-900">
                Add Family &amp; Friends
              </div>
              <p className="text-[9px] text-gray-400 leading-tight mt-0.5">
                Link Numbers of your Family and Friends for Discounts &amp; Bill
                Payments. 
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
*/
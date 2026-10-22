"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import beQuick from "../../utils/dasdbeQuickApi";
import {
  Gift,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  RotateCw,
  Info,
  Tag,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Smartphone,
  Mail,
  Globe,
  Lock,
  Users,
  Eye,
  X,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Database,
  Zap,
  History,
  CheckCircle2,
  User,
  Plus,
} from "lucide-react";

type ReferralStatusType =
  | "Rewarded"
  | "In review"
  | "Being checked"
  | "Didn’t qualify"
  | "Adjusted";

interface ReferralRecord {
  id: string;
  refCodeMasked: string;
  subtitle: string;
  dateUsed: string;
  status: ReferralStatusType;
  rewardAmount: number;
  adjustedAmount?: number;
  potentialAmount?: number;
  notes?: string;
}

interface QualifyingPlanCard {
  id: string;
  title: string;
  description: string;
  price: number;
  rewardAmount: number;
}

function generateDeterministicReferralCode(seed: string): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let hash1 = 5381;
  let hash2 = 52711;
  const cleanSeed = String(seed || "zoiko-member").toLowerCase();
  for (let i = 0; i < cleanSeed.length; i++) {
    const code = cleanSeed.charCodeAt(i);
    hash1 = (hash1 * 33) ^ code;
    hash2 = (hash2 * 31) ^ (code * (i + 1));
  }
  const abs1 = Math.abs(hash1);
  const abs2 = Math.abs(hash2);
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars[(abs1 >> (i * 4)) % chars.length];
    part2 += chars[(abs2 >> (i * 4)) % chars.length];
  }
  return `ZM-${part1}-${part2}`;
}

export default function ReferAndEarnPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("refer");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [freshnessLabel, setFreshnessLabel] = useState("");

  // User & Account State
  const [userName, setUserName] = useState("Member");
  const [userEmail, setUserEmail] = useState("");
  const [accountSuffix, setAccountSuffix] = useState("");
  const [numbersCount, setNumbersCount] = useState(0);
  const [primaryPlanName, setPrimaryPlanName] = useState("Zoiko Mobile");
  const [primaryRenewDate, setPrimaryRenewDate] = useState("28 Oct");
  const [referralCode, setReferralCode] = useState("ZM-7Q4K-2D9R");
  const [copiedCode, setCopiedCode] = useState(false);

  // Referrals & Credits State
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [usedCredit, setUsedCredit] = useState<number>(0);
  const [selectedCreditStep, setSelectedCreditStep] = useState<number>(5);
  const [referralFilter, setReferralFilter] = useState<
    "All" | "Rewarded" | "Being checked" | "Other"
  >("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Qualifying Plans from Catalog
  const [qualifyingPlans, setQualifyingPlans] = useState<QualifyingPlanCard[]>([
    {
      id: "lite-10gb",
      title: "Zoiko Lite 10GB",
      description: "10 GB data · unlimited UK calls and texts",
      price: 9.99,
      rewardAmount: 5.0,
    },
    {
      id: "max-30gb",
      title: "Zoiko Max 30GB",
      description: "30 GB data · unlimited UK calls and texts · EU roaming",
      price: 19.99,
      rewardAmount: 10.0,
    },
  ]);

  // Modals
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [reviewCreditModalOpen, setReviewCreditModalOpen] = useState(false);
  const [selectedReferralDetail, setSelectedReferralDetail] =
    useState<ReferralRecord | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportRefId, setSupportRefId] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [trackReferralModalOpen, setTrackReferralModalOpen] = useState(false);
  const [newRefSuffix, setNewRefSuffix] = useState("");
  const [newRefPlanTier, setNewRefPlanTier] = useState<"lite" | "max">("max");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const howItWorksRef = useRef<HTMLDivElement | null>(null);
  const useCreditRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      showToast(`Referral code ${referralCode} copied to clipboard`);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast(`Your referral code is ${referralCode}`);
    }
  };

  const fetchReferData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      setFreshnessLabel(`${timeStr} BST, ${dateStr}`);

      let email = "";
      let name = "Member";
      let token = "";

      if (typeof window !== "undefined") {
        token = localStorage.getItem("zoiko_token") || "";
        const userStr = localStorage.getItem("zoiko_user");
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            email = parsed.email || "";
            name =
              [parsed.first_name, parsed.last_name].filter(Boolean).join(" ") ||
              parsed.name ||
              (email ? email.split("@")[0] : "Member");
          } catch {
            // ignore
          }
        }
      }

      setUserEmail(email);
      setUserName(name);

      const storageKeySuffix = email || "default";

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      let djangoOrders: any[] = [];
      let catalogPlans: any[] = [];

      if (token && email) {
        const [ordersRes, plansRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ logged_user: email }),
          }).catch(() => null),
          fetch(`${API_BASE}/api/plans/v1/`).catch(() => null),
        ]);

        if (ordersRes && ordersRes.ok) {
          const data = await ordersRes.json();
          if (data?.orders && Array.isArray(data.orders)) {
            djangoOrders = data.orders;
          } else if (Array.isArray(data)) {
            djangoOrders = data;
          }
        }
        if (plansRes && plansRes.ok) {
          const pData = await plansRes.json();
          catalogPlans = Array.isArray(pData) ? pData : pData?.results || [];
        }
      } else {
        const plansRes = await fetch(`${API_BASE}/api/plans/v1/`).catch(
          () => null
        );
        if (plansRes && plansRes.ok) {
          const pData = await plansRes.json();
          catalogPlans = Array.isArray(pData) ? pData : pData?.results || [];
        }
      }

      // Dynamically map plans from catalog if available
      if (catalogPlans.length >= 2) {
        const sortedPlans = [...catalogPlans]
          .filter((p) => Number(p.price) > 0)
          .sort((a, b) => Number(a.price) - Number(b.price));

        if (sortedPlans.length >= 2) {
          const litePlan = sortedPlans[0];
          const maxPlan =
            sortedPlans.find((p) => Number(p.price) >= 15) ||
            sortedPlans[sortedPlans.length - 1];

          setQualifyingPlans([
            {
              id: String(litePlan.id || "lite"),
              title: litePlan.title || "Zoiko Lite 10GB",
              description: `${
                litePlan.data_allowance || "10 GB"
              } data · unlimited UK calls and texts`,
              price: Number(litePlan.price) || 9.99,
              rewardAmount: 5.0,
            },
            {
              id: String(maxPlan.id || "max"),
              title: maxPlan.title || "Zoiko Max 30GB",
              description: `${
                maxPlan.data_allowance || "30 GB"
              } data · unlimited UK calls and texts · EU roaming`,
              price: Number(maxPlan.price) || 19.99,
              rewardAmount: 10.0,
            },
          ]);
        }
      }

      let subscriberId: string | number | null = null;
      let bqLines: any[] = [];
      let bqDetails: any = null;

      if (email) {
        const subLookup = await beQuick.getSubscriberByEmail(email);
        subscriberId =
          subLookup && subLookup.subscriber_id ? subLookup.subscriber_id : null;

        if (subscriberId) {
          const [detailsRes, linesRes] = await Promise.all([
            beQuick.getSubscriberDetails(subscriberId),
            beQuick.getUserLines(subscriberId),
          ]);
          bqDetails = detailsRes;
          bqLines = Array.isArray(linesRes)
            ? linesRes
            : linesRes?.lines || detailsRes?.subscribers?.[0]?.lines || [];
        }
      }

      const subObj = bqDetails?.subscribers?.[0];
      if (subObj) {
        const fullName = [subObj.first_name, subObj.last_name]
          .filter(Boolean)
          .join(" ");
        if (fullName) setUserName(fullName);
      }

      const firstOrder = djangoOrders[0];
      const suffix = subscriberId
        ? String(subscriberId).slice(-4)
        : firstOrder?.id
        ? String(firstOrder.id).slice(-4)
        : "";
      setAccountSuffix(suffix);

      const totalLinesCount =
        bqLines.length > 0 ? bqLines.length : djangoOrders.length;
      setNumbersCount(totalLinesCount);

      if (bqLines[0]?.plan_name) {
        setPrimaryPlanName(bqLines[0].plan_name);
      } else if (firstOrder?.plan_title || firstOrder?.plan?.title) {
        setPrimaryPlanName(firstOrder.plan_title || firstOrder.plan.title);
      }

      // Generate deterministic unique referral code for this subscriber/email (never containing name/number)
      const generatedCode = generateDeterministicReferralCode(
        subscriberId ? `sub-${subscriberId}-${email}` : email || "zoiko-user"
      );
      setReferralCode(generatedCode);

      // Load persisted referrals & used credit for this user
      if (typeof window !== "undefined") {
        const savedReferrals = localStorage.getItem(
          `zoiko_referrals_${storageKeySuffix}`
        );
        if (savedReferrals) {
          try {
            setReferrals(JSON.parse(savedReferrals));
          } catch {
            // ignore
          }
        }
        const savedUsedCredit = localStorage.getItem(
          `zoiko_used_referral_credit_${storageKeySuffix}`
        );
        if (savedUsedCredit && !isNaN(Number(savedUsedCredit))) {
          setUsedCredit(Number(savedUsedCredit));
        }
      }
    } catch (err) {
      console.error("Failed to load Refer & earn data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReferData(false);
  }, [fetchReferData]);

  // Derived reward totals
  const totalEarned = referrals.reduce((sum, r) => {
    if (r.status === "Rewarded") return sum + r.rewardAmount;
    if (r.status === "Adjusted") return sum + (r.adjustedAmount || 0);
    return sum;
  }, 0);

  const adjustedAmount = referrals.reduce((sum, r) => {
    if (r.status === "Adjusted") return sum + (r.adjustedAmount || 0);
    return sum;
  }, 0);

  const availableCredit = Math.max(
    0,
    totalEarned - adjustedAmount - usedCredit
  );

  const rewardedCount = referrals.filter((r) => r.status === "Rewarded").length;
  const beingCheckedCount = referrals.filter(
    (r) => r.status === "In review" || r.status === "Being checked"
  ).length;
  const otherCount = referrals.filter(
    (r) => r.status === "Didn’t qualify" || r.status === "Adjusted"
  ).length;

  // Keep selected credit step within available credit
  useEffect(() => {
    if (availableCredit >= 5) {
      setSelectedCreditStep((prev) =>
        prev <= availableCredit ? prev : Math.floor(availableCredit / 5) * 5
      );
    } else {
      setSelectedCreditStep(5);
    }
  }, [availableCredit]);

  // Filtered & Paginated Referrals
  const filteredReferrals = referrals.filter((r) => {
    if (referralFilter === "All") return true;
    if (referralFilter === "Rewarded") return r.status === "Rewarded";
    if (referralFilter === "Being checked")
      return r.status === "In review" || r.status === "Being checked";
    return r.status === "Didn’t qualify" || r.status === "Adjusted";
  });

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReferrals.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedReferrals = filteredReferrals.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const storageKeySuffix = userEmail || "default";

  const handleApplyCredit = () => {
    if (availableCredit < 5 || selectedCreditStep > availableCredit) return;
    const nextUsed = usedCredit + selectedCreditStep;
    setUsedCredit(nextUsed);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_used_referral_credit_${storageKeySuffix}`,
        String(nextUsed)
      );
    }
    setReviewCreditModalOpen(false);
    showToast(
      `£${selectedCreditStep.toFixed(2)} bill credit scheduled for your next bill.`
    );
  };

  const handleRegisterReferralCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSuffix =
      newRefSuffix
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(-3) ||
      Math.random().toString(36).substring(2, 5).toUpperCase();

    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const newItem: ReferralRecord = {
      id: `ref-${Date.now()}`,
      refCodeMasked: `REF-•••${cleanSuffix}`,
      subtitle: "Someone you referred",
      dateUsed: todayStr,
      status: "In review",
      rewardAmount: 0,
      potentialAmount: newRefPlanTier === "max" ? 10.0 : 5.0,
      notes:
        "Submitted for 30-day qualification check after first bill payment.",
    };

    const updated = [newItem, ...referrals];
    setReferrals(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_referrals_${storageKeySuffix}`,
        JSON.stringify(updated)
      );
    }
    setNewRefSuffix("");
    setTrackReferralModalOpen(false);
    showToast(`Referral ${newItem.refCodeMasked} logged for verification.`);
  };

  const handleSubmitSupportCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim() || supportMessage.trim().length < 10) {
      showToast("Please provide at least 10 characters explaining your question.");
      return;
    }
    setSupportModalOpen(false);
    setSupportRefId("");
    setSupportMessage("");
    showToast(
      "Support case opened. Our team will update you within 1–2 working days."
    );
  };

  const creditSteps: number[] = [];
  for (let step = 5; step <= Math.max(5, availableCredit); step += 5) {
    creditSteps.push(step);
  }

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-4 md:p-5">
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={numbersCount}
            planName={primaryPlanName}
            renewDate={primaryRenewDate}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Navigation Bar */}
          <DashboardTopNav
            userName={userName}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Refer & earn"
            customSubtitle="Refer someone you know and earn a bill credit when they join and qualify."
          />

          {/* Sub-header Freshness Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#4C566A]">
              <Clock className="w-3.5 h-3.5 text-[#4C566A]" />
              <span>Rewards checked {freshnessLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchReferData(true)}
              disabled={refreshing}
              title="Refresh referral rewards"
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {toastMessage && (
            <div className="bg-[#0D1935] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9F6E]" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="h-44 rounded-[20px] bg-white/70 animate-pulse" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="h-64 rounded-[20px] bg-white/70 animate-pulse" />
                <div className="h-64 rounded-[20px] bg-white/70 animate-pulse" />
                <div className="h-64 rounded-[20px] bg-white/70 animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {/* HERO BANNER: Know someone who'd like Zoiko? */}
              <div className="relative rounded-[20px] px-6 py-5 bg-gradient-to-r from-[#0D1935] via-[#18294F] to-[#3B183E] text-white overflow-hidden">
                {/* Right Decorative Graphic Circles */}
                <div className="hidden md:block absolute right-0 top-0 w-[580px] h-full pointer-events-none overflow-hidden z-0">
                  <div className="w-80 h-80 rounded-full bg-[#E01C5B]/20 absolute left-[311px] top-[-67px]" />
                  <div className="w-48 h-48 rounded-full bg-[#F59E0B]/10 absolute left-[486px] top-[-80px]" />
                  {/* Connected nodes */}
                  <svg
                    className="w-40 h-28 absolute left-[295px] top-[52px]"
                    viewBox="0 0 160 110"
                    fill="none"
                  >
                    <line
                      x1="15"
                      y1="40"
                      x2="110"
                      y2="16"
                      stroke="rgba(255,255,255,0.55)"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                    <line
                      x1="15"
                      y1="40"
                      x2="92"
                      y2="82"
                      stroke="rgba(255,255,255,0.55)"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                  </svg>
                  <div className="w-14 h-14 rounded-full bg-white/90 absolute left-[281px] top-[64px]" />
                  <div className="w-11 h-11 rounded-full bg-[#F59E0B] absolute left-[383px] top-[45px]" />
                  <div className="w-9 h-9 rounded-full bg-[#E01C5B] absolute left-[366px] top-[115px]" />
                </div>

                <div className="relative z-10 flex flex-col gap-2.5 w-full">
                  <h2 className="text-xl font-extrabold text-white leading-8">
                    Know someone who’d like Zoiko?
                  </h2>
                  <p className="text-sm text-white/82 max-w-[560px] leading-5">
                    Refer them with your code. If they join and qualify under
                    the programme terms, we’ll add a bill credit to your
                    account.
                  </p>

                  {/* 4 Feature Pills on Row 1 + Read full terms on Row 2 */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="h-6 px-2.5 rounded-full bg-white/14 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                        <Gift className="w-3 h-3 text-white shrink-0" />
                        <span>Up to £10.00 bill credit per qualifying referral</span>
                      </span>
                      <span className="h-6 px-2.5 rounded-full bg-white/14 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                        <Calendar className="w-3 h-3 text-white shrink-0" />
                        <span>Up to 10 rewards a year</span>
                      </span>
                      <span className="h-6 px-2.5 rounded-full bg-white/14 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                        <Clock className="w-3 h-3 text-white shrink-0" />
                        <span>Credit expires 12 months after it’s added</span>
                      </span>
                      <span className="h-6 px-2.5 rounded-full bg-white/14 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                        <FileText className="w-3 h-3 text-white shrink-0" />
                        <span>Illustrative terms · version 3</span>
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setTermsModalOpen(true)}
                        className="h-6 px-2.5 rounded-full bg-white hover:bg-white/90 text-[#0D1935] inline-flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3 text-[#0D1935]" />
                        <span>Read full terms</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 1: Your rewards (Pink) + Your referral code + Send an invite */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Card 1: Your rewards (Solid Pink #E01C5B) */}
                <div className="relative bg-[#E01C5B] rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between gap-4 overflow-hidden text-white">
                  {/* Decorative Bottom-Right 6x3 White Dot Matrix */}
                  <div className="w-24 h-12 absolute right-4 bottom-3 opacity-10 pointer-events-none grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-white block"
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-3.5 relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/16 flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white leading-6">
                            Your rewards
                          </h2>
                          <p className="text-xs text-white/85 leading-5">
                            Bill credit, not cash
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHistoryModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline cursor-pointer"
                      >
                        <span>History</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total Earned */}
                    <div className="flex flex-col gap-1 pt-0.5">
                      <div className="text-4xl font-extrabold text-white leading-10">
                        £{totalEarned.toFixed(2)}
                      </div>
                      <div className="text-sm font-semibold text-white/90 leading-4">
                        Rewards earned in total
                      </div>
                    </div>

                    {/* 3 White Mini Stat Boxes */}
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      <div className="px-3 py-2.5 bg-white rounded-xl flex flex-col justify-start text-[#0D1935]">
                        <div className="text-base font-extrabold text-[#0D1935] leading-6">
                          £{availableCredit.toFixed(2)}
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4">
                          Available as bill credit
                        </div>
                      </div>

                      <div className="px-3 py-2.5 bg-white rounded-xl flex flex-col justify-start text-[#0D1935]">
                        <div className="text-base font-extrabold text-[#0D1935] leading-6">
                          {rewardedCount}
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4">
                          Rewarded referrals
                        </div>
                      </div>

                      <div className="px-3 py-2.5 bg-white rounded-xl flex flex-col justify-start text-[#0D1935]">
                        <div className="text-base font-extrabold text-[#0D1935] leading-6">
                          {beingCheckedCount}
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4">
                          Being checked · not earned yet
                        </div>
                      </div>
                    </div>

                    {/* Formula Explanation Note */}
                    <div className="flex items-start gap-1.5 text-xs text-white/88 leading-4 pt-1">
                      <Info className="w-3.5 h-3.5 text-white/88 shrink-0 mt-0.5" />
                      <span>
                        £{totalEarned.toFixed(2)} earned − £
                        {adjustedAmount.toFixed(2)} adjusted − £
                        {usedCredit.toFixed(2)} used = £
                        {availableCredit.toFixed(2)} available. Referrals being
                        checked aren’t counted until they qualify.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Your referral code */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-start gap-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Your referral code
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Give it to people you know
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        howItWorksRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                      }
                      className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      How it works
                    </button>
                  </div>

                  {/* Code Display Box */}
                  <div className="px-4 py-3.5 bg-[#FDF5F8] border border-[#E01C5B]/20 rounded-2xl flex items-center justify-between gap-3">
                    <div>
                      <div className="text-2xl font-extrabold text-[#0D1935] tracking-wider leading-9">
                        {referralCode}
                      </div>
                      <div className="text-xs text-[#4C566A] leading-4">
                        Doesn’t include your name or number
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      title="Copy referral code"
                      className="w-9 h-9 rounded-[10px] hover:bg-white/80 flex items-center justify-center text-[#0D1935] transition cursor-pointer shrink-0"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-[#0D9F6E]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#0D1935]" />
                      )}
                    </button>
                  </div>

                  {/* Full-width Copy Code Button */}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full h-11 bg-[#E01C5B] hover:bg-[#c8164f] text-white rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold transition cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy code</span>
                      </>
                    )}
                  </button>

                  {/* Footer Note */}
                  <div className="flex items-start gap-1.5 text-xs text-[#4C566A] leading-4">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0 mt-0.5" />
                    <span>
                      Only share it with people who’d welcome it. Please don’t
                      post it publicly. Referral links aren’t available yet.
                    </span>
                  </div>
                </div>

                {/* Card 3: Send an invite */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Share2 className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Send an invite
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          From your Zoiko account
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col divide-y divide-[#121B34]/8">
                      {[
                        { label: "WhatsApp", Icon: MessageCircle },
                        { label: "Text message", Icon: Smartphone },
                        { label: "Email", Icon: Mail },
                        { label: "Social media", Icon: Globe },
                      ].map(({ label, Icon }) => (
                        <div
                          key={label}
                          className="py-2 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-[#F6F7FA] flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-[#8E97A8]" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#3B4866] leading-5">
                                {label}
                              </div>
                              <div className="text-xs text-[#4C566A] leading-4">
                                Not available yet
                              </div>
                            </div>
                          </div>
                          <span className="h-6 px-2.5 rounded-full bg-[#F6F7FA] text-[#3B4866] inline-flex items-center gap-1 text-xs font-semibold">
                            <Lock className="w-3 h-3" />
                            <span>Off</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why can't I send invites here? */}
                  <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Info className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-bold text-[#0D1935] leading-5">
                        Why can’t I send invites here?
                      </div>
                      <p className="text-xs text-[#4C566A] leading-5">
                        Sending referral messages has legal rules. Until
                        they’re approved, tell people your code yourself — we
                        never ask for your contacts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: Your referrals (8 cols) + How it works (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left Column (8 cols): Your referrals */}
                <div className="lg:col-span-8 bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                            Your referrals
                          </h2>
                          <p className="text-xs text-[#4C566A] leading-5">
                            We don’t show who they are or what plan they chose
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTrackReferralModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log a referral check</span>
                      </button>
                    </div>

                    {/* 4 Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { label: "All", count: referrals.length },
                          { label: "Rewarded", count: rewardedCount },
                          { label: "Being checked", count: beingCheckedCount },
                          { label: "Other", count: otherCount },
                        ] as const
                      ).map((tab) => {
                        const isSelected = referralFilter === tab.label;
                        return (
                          <button
                            key={tab.label}
                            type="button"
                            onClick={() => {
                              setReferralFilter(tab.label);
                              setCurrentPage(1);
                            }}
                            className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                              isSelected
                                ? "bg-[#0D1935] border-[#0D1935] text-white"
                                : "bg-white border-[#121B34]/10 text-[#3B4866] hover:text-[#0D1935]"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-[#F6F7FA] text-[#3B4866]"
                              }`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Referrals Table or Empty State */}
                    {filteredReferrals.length === 0 ? (
                      <div className="p-8 bg-[#F6F7FA] rounded-2xl flex flex-col items-center justify-center text-center gap-2 my-2">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#E01C5B] shadow-2xs">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-[#0D1935]">
                          No referrals in this view yet
                        </div>
                        <p className="text-xs text-[#4C566A] max-w-sm">
                          Share your code <strong>{referralCode}</strong> with
                          someone new to Zoiko Mobile. Once they sign up with
                          your code, their referral status will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-xs font-semibold text-[#4C566A]">
                              <th className="pb-2 px-2 font-semibold">
                                Referral
                              </th>
                              <th className="pb-2 px-2 font-semibold">
                                Code used
                              </th>
                              <th className="pb-2 px-2 font-semibold">
                                Status
                              </th>
                              <th className="pb-2 px-2 font-semibold text-right">
                                Reward
                              </th>
                              <th className="pb-2 px-2 w-10 text-right" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#121B34]/8 text-xs">
                            {paginatedReferrals.map((refItem) => (
                              <tr
                                key={refItem.id}
                                onClick={() =>
                                  setSelectedReferralDetail(refItem)
                                }
                                className="hover:bg-slate-50/70 transition cursor-pointer"
                              >
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-2xl bg-[#F6F7FA] flex items-center justify-center shrink-0">
                                      <User className="w-4 h-4 text-[#3B4866]" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-[#0D1935] leading-5">
                                        {refItem.refCodeMasked}
                                      </div>
                                      <div className="text-xs text-[#4C566A] leading-4">
                                        {refItem.subtitle}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-2 align-middle text-[#0D1935]">
                                  {refItem.dateUsed}
                                </td>

                                <td className="py-3 px-2 align-middle">
                                  {refItem.status === "Rewarded" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0D9F6E]/12 text-[#0A7B56] text-xs font-semibold">
                                      <Check className="w-3 h-3" />
                                      <span>Rewarded</span>
                                    </span>
                                  )}
                                  {refItem.status === "In review" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-semibold">
                                      <Eye className="w-3 h-3" />
                                      <span>In review</span>
                                    </span>
                                  )}
                                  {refItem.status === "Being checked" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0E7FF] text-[#3730A3] text-xs font-semibold">
                                      <Clock className="w-3 h-3" />
                                      <span>Being checked</span>
                                    </span>
                                  )}
                                  {refItem.status === "Didn’t qualify" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F6F7FA] text-[#3B4866] text-xs font-semibold">
                                      <X className="w-3 h-3" />
                                      <span>Didn’t qualify</span>
                                    </span>
                                  )}
                                  {refItem.status === "Adjusted" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-semibold">
                                      <RefreshCw className="w-3 h-3" />
                                      <span>Adjusted</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-2 align-middle text-right">
                                  {refItem.status === "Rewarded" && (
                                    <div className="font-bold text-[#0D1935]">
                                      £{refItem.rewardAmount.toFixed(2)}
                                    </div>
                                  )}
                                  {(refItem.status === "In review" ||
                                    refItem.status === "Being checked") && (
                                    <div>
                                      <div className="text-[#0D1935]">
                                        Up to £
                                        {(
                                          refItem.potentialAmount || 10.0
                                        ).toFixed(2)}
                                      </div>
                                      <div className="text-[#4C566A]">
                                        not earned yet
                                      </div>
                                    </div>
                                  )}
                                  {refItem.status === "Didn’t qualify" && (
                                    <div className="text-[#0D1935]">—</div>
                                  )}
                                  {refItem.status === "Adjusted" && (
                                    <div>
                                      <div className="font-bold text-[#0D1935]">
                                        £0.00
                                      </div>
                                      <div className="text-[#4C566A]">
                                        £
                                        {(
                                          refItem.adjustedAmount || 5.0
                                        ).toFixed(2)}{" "}
                                        adjusted
                                      </div>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-2 align-middle text-right">
                                  <ChevronRight className="w-4 h-4 text-[#0D1935] inline-block" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Pagination Footer */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4C566A]">
                    <span>
                      {filteredReferrals.length === 0
                        ? "Showing 0 referrals"
                        : `Showing ${
                            (safePage - 1) * ITEMS_PER_PAGE + 1
                          }–${Math.min(
                            safePage * ITEMS_PER_PAGE,
                            filteredReferrals.length
                          )} of ${filteredReferrals.length} referrals`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className="h-8 w-8 rounded-lg border border-[#121B34]/10 bg-white flex items-center justify-center text-[#4C566A] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                              safePage === pageNum
                                ? "bg-[#0D1935] border-[#0D1935] text-white"
                                : "bg-white border-[#121B34]/10 text-[#4C566A]"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="h-8 w-8 rounded-lg border border-[#121B34]/10 bg-white flex items-center justify-center text-[#4C566A] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (4 cols): How it works */}
                <div
                  ref={howItWorksRef}
                  className="lg:col-span-4 bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-start gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          How it works
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Illustrative terms · version 3
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                    >
                      Full terms
                    </button>
                  </div>

                  {/* 4 Vertical Timeline Steps */}
                  <div className="flex flex-col">
                    {[
                      {
                        title: "Give someone your code",
                        desc: "Tell them yourself. Only people new to Zoiko can be referred.",
                      },
                      {
                        title: "They join with your code",
                        desc: "They enter it when they sign up, before their plan starts.",
                      },
                      {
                        title: "We check it",
                        desc: "After their first bill is paid and they’ve stayed 30 days, we check it against the terms.",
                      },
                      {
                        title: "You get a bill credit",
                        desc: "£5.00 for Lite or £10.00 for Max plans. Use it on a future bill within 12 months.",
                      },
                    ].map((step, idx, arr) => (
                      <div
                        key={step.title}
                        className="flex items-start gap-3.5 relative pb-5 last:pb-0"
                      >
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-2xl bg-[#E01C5B] text-white text-xs font-bold flex items-center justify-center relative z-10" />
                          {idx < arr.length - 1 && (
                            <div className="w-0.5 h-10 bg-[#ECEEF2] mt-1" />
                          )}
                        </div>
                        <div className="pt-0.5">
                          <div className="text-sm font-bold text-[#0D1935] leading-5">
                            {step.title}
                          </div>
                          <p className="text-xs text-[#4C566A] leading-4 mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROW 3: Use your credit + Plans they can join + Quick actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Card 1: Use your credit */}
                <div
                  ref={useCreditRef}
                  className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-3.5"
                >
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Use your credit
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Reduce a future bill on account{" "}
                          {accountSuffix ? `••${accountSuffix}` : "on file"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-3.5">
                      <div>
                        <div className="text-3xl font-extrabold text-[#0D1935] leading-10">
                          £{availableCredit.toFixed(2)}
                        </div>
                        <div className="text-xs text-[#4C566A] leading-4">
                          Available
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#4C566A]">Amount</label>
                        <div className="relative">
                          <select
                            aria-label="Select credit amount"
                            value={selectedCreditStep}
                            disabled={availableCredit < 5}
                            onChange={(e) =>
                              setSelectedCreditStep(Number(e.target.value))
                            }
                            className="w-full h-10 pl-4 pr-8 bg-white rounded-xl border border-[#121B34]/10 text-sm font-semibold text-[#0D1935] appearance-none focus:outline-none cursor-pointer disabled:opacity-60"
                          >
                            {availableCredit < 5 ? (
                              <option value={5}>
                                £5.00 minimum required
                              </option>
                            ) : (
                              creditSteps.map((amt) => (
                                <option key={amt} value={amt}>
                                  £{amt.toFixed(2)} off my next bill
                                </option>
                              ))
                            )}
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#4C566A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                          type="button"
                          disabled={availableCredit < 5}
                          onClick={() => setReviewCreditModalOpen(true)}
                          className="w-full h-11 mt-1 bg-[#E01C5B] hover:bg-[#c8164f] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                        >
                          Review credit
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-[#4C566A] leading-4">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0 mt-0.5" />
                    <span>
                      Credit is used in £5.00 steps. It can’t be exchanged for
                      cash.
                    </span>
                  </div>
                </div>

                {/* Card 2: Plans they can join */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Plans they can join
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Current plan prices · your possible reward
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {qualifyingPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="p-3.5 rounded-2xl border border-[#121B34]/10 flex flex-col items-start gap-1.5"
                        >
                          <div className="text-base font-bold text-[#0D1935] leading-5">
                            {plan.title}
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            {plan.description}
                          </div>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            <span className="text-lg font-extrabold text-[#0D1935] leading-7">
                              £{plan.price.toFixed(2)}
                            </span>
                            <span className="text-xs font-extrabold text-[#4C566A] leading-4">
                              a month incl. VAT
                            </span>
                          </div>
                          <span className="px-2.5 py-1.5 rounded-[10px] bg-[#FDF2F6] text-[#BA1248] inline-flex items-center gap-1.5 text-xs font-semibold">
                            <Gift className="w-3.5 h-3.5 text-[#BA1248]" />
                            <span>
                              You could earn £{plan.rewardAmount.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#4C566A] leading-4">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0" />
                    <span>
                      Only if they qualify. Illustrative campaign values.
                    </span>
                  </div>
                </div>

                {/* Card 3: Quick actions */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-start gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                      Quick actions
                    </h2>
                  </div>

                  <div className="flex flex-col divide-y divide-[#121B34]/8">
                    {/* 1. Copy my code */}
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <Copy className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Copy my code
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            {referralCode}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>

                    {/* 2. Reward history */}
                    <button
                      type="button"
                      onClick={() => setHistoryModalOpen(true)}
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <History className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Reward history
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Every credit and adjustment
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>

                    {/* 3. Check my balance */}
                    <button
                      type="button"
                      onClick={() =>
                        useCreditRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                      }
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <Database className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Check my balance
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Credit you can use
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>

                    {/* 4. Read the terms */}
                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Read the terms
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Illustrative version 3
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>

                    {/* 5. Question about a referral */}
                    <button
                      type="button"
                      onClick={() => setSupportModalOpen(true)}
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Question about a referral
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            We’ll open a support case
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full Programme Terms Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Refer &amp; earn programme terms
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Illustrative terms · version 3
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2.5 text-xs text-[#0D1935] leading-5 max-h-80 overflow-y-auto">
              <p>
                <strong>1. Eligibility:</strong> Only active Zoiko Mobile UK
                account holders in good standing may refer new customers. The
                person referred must be a new Zoiko Mobile customer.
              </p>
              <p>
                <strong>2. Qualifying period:</strong> The referred customer
                must enter your referral code ({referralCode}) during sign-up,
                pay their first monthly bill, and remain active for at least 30
                consecutive days.
              </p>
              <p>
                <strong>3. Reward amounts:</strong> £5.00 bill credit for
                qualifying Lite plans; £10.00 bill credit for qualifying Max
                plans. Maximum 10 qualifying rewards per calendar year.
              </p>
              <p>
                <strong>4. Using bill credit:</strong> Credits are redeemed in
                £5.00 steps against future monthly bills on your account, cannot
                be exchanged for cash, and expire 12 months after being added.
              </p>
              <p>
                <strong>5. Fair sharing:</strong> Referral codes are for
                personal contacts only and must not be posted on public coupon
                sites or paid advertisements.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Reward history
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Every referral credit, adjustment, and bill redemption
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Total rewards earned</span>
                <span className="font-bold text-[#0D1935]">
                  £{totalEarned.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Adjustments</span>
                <span className="font-bold text-[#0D1935]">
                  −£{adjustedAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Applied to bills</span>
                <span className="font-bold text-[#0D1935]">
                  −£{usedCredit.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#121B34]/10 flex justify-between">
                <span className="font-bold text-[#0D1935]">
                  Available bill credit
                </span>
                <span className="font-extrabold text-[#E01C5B]">
                  £{availableCredit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0D1935] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Apply Credit Modal */}
      {reviewCreditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Apply referral credit to next bill
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Account {accountSuffix ? `••${accountSuffix}` : "on file"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewCreditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Available credit</span>
                <span className="font-bold text-[#0D1935]">
                  £{availableCredit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Applying to next bill</span>
                <span className="font-bold text-[#E01C5B]">
                  £{selectedCreditStep.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Remaining credit after</span>
                <span className="font-bold text-[#0D1935]">
                  £{Math.max(0, availableCredit - selectedCreditStep).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReviewCreditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCredit}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Confirm £{selectedCreditStep.toFixed(2)} credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Detail Modal */}
      {selectedReferralDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  {selectedReferralDetail.refCodeMasked}
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Code used on {selectedReferralDetail.dateUsed}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReferralDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Status</span>
                <span className="font-bold text-[#0D1935]">
                  {selectedReferralDetail.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4C566A]">Reward</span>
                <span className="font-bold text-[#0D1935]">
                  {selectedReferralDetail.status === "Rewarded"
                    ? `£${selectedReferralDetail.rewardAmount.toFixed(2)}`
                    : selectedReferralDetail.potentialAmount
                    ? `Up to £${selectedReferralDetail.potentialAmount.toFixed(
                        2
                      )}`
                    : "—"}
                </span>
              </div>
              {selectedReferralDetail.notes && (
                <p className="text-[#4C566A] pt-1 border-t border-[#121B34]/10">
                  {selectedReferralDetail.notes}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const refCode = selectedReferralDetail.refCodeMasked;
                  setSelectedReferralDetail(null);
                  setSupportRefId(refCode);
                  setSupportModalOpen(true);
                }}
                className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
              >
                Ask a question about this referral
              </button>
              <button
                type="button"
                onClick={() => setSelectedReferralDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#0D1935] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log a Referral Check Modal */}
      {trackReferralModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRegisterReferralCheck}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Log a referral check
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Did someone use your code {referralCode}? Track its 30-day
                  review status here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackReferralModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Last 3 characters of their order/reference (optional)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={newRefSuffix}
                  onChange={(e) => setNewRefSuffix(e.target.value)}
                  placeholder="e.g. 3W1"
                  className="w-full h-10 px-3 rounded-xl border border-[#121B34]/15 text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Expected plan tier
                </label>
                <select
                  value={newRefPlanTier}
                  onChange={(e) =>
                    setNewRefPlanTier(e.target.value as "lite" | "max")
                  }
                  className="w-full h-10 px-3 rounded-xl border border-[#121B34]/15 text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                >
                  <option value="max">Zoiko Max (Up to £10.00 credit)</option>
                  <option value="lite">Zoiko Lite (Up to £5.00 credit)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTrackReferralModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Add to review list
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Question About a Referral Support Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitSupportCase}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Question about a referral
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  We’ll open a support case for your referral code{" "}
                  {referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Referral ID (optional)
                </label>
                <input
                  type="text"
                  value={supportRefId}
                  onChange={(e) => setSupportRefId(e.target.value)}
                  placeholder="e.g. REF-•••3W1"
                  className="w-full h-10 px-3 rounded-xl border border-[#121B34]/15 text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#0D1935]">
                  How can we help?
                </label>
                <textarea
                  rows={3}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Tell us what happened with your referral or reward credit…"
                  className="w-full p-3 rounded-xl border border-[#121B34]/15 text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Submit support case
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

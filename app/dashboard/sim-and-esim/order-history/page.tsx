"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cpu, Smartphone, Plus } from "lucide-react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopNav from "../../components/DashboardTopNav";
import SimOrderHistoryCard from "../../components/SimOrderHistoryCard";
import { ComparePlansModal } from "../../components/DashboardModals";
import {
  getMySimOrders,
  SimOrder,
} from "../../../services/simOrderHistoryApi";

export default function SimOrderHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sim");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");
  const [userName, setUserName] = useState("Customer");

  const [orders, setOrders] = useState<SimOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [comparePlansOpen, setComparePlansOpen] = useState(false);

  // Load user name for header
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("zoiko_user") || "{}";
      const u = JSON.parse(rawUser);
      const name =
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.name ||
        u.username ||
        "Customer";
      setUserName(name);
    } catch {}
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMySimOrders();
      setOrders(res);
    } catch (err: any) {
      if (err?.message !== "NOT_LOGGED_IN") {
        setError("Could not load your SIM orders. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0D1935] font-sans p-3 sm:p-5">
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          <DashboardTopNav
            userName={userName}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="SIM & eSIM order history"
            customSubtitle="View your SIM and eSIM orders, active profiles, and activation QR codes."
          />

          {/* Breadcrumb / Back button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href="/dashboard/sim-and-esim"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0D1935] hover:text-[#E01C5B] transition bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to SIM &amp; eSIM management</span>
            </Link>

            <Link
              href="/dashboard/my-mobile-numbers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#E01C5B] hover:bg-[#c8164f] px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Order new number / SIM</span>
            </Link>
          </div>

          {/* SIM Order History Card */}
          <SimOrderHistoryCard
            orders={orders}
            isLoading={isLoading}
            error={error}
            onRetry={loadOrders}
            onOpenComparePlans={() => setComparePlansOpen(true)}
          />
        </div>
      </div>

      <ComparePlansModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        currentPlanName=""
        onSelectPlan={(name) => {
          setComparePlansOpen(false);
          router.push("/dashboard/add-new-number");
        }}
      />
    </div>
  );
}

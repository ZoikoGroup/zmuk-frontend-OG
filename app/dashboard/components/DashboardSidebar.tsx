"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  Smartphone,
  BarChart2,
  Receipt,
  Cpu,
  Globe,
  Zap,
  Users,
  Gift,
  Tag,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ArrowRight,
  PanelLeftClose,
  PanelLeft,
  UserCheck,
  ShoppingBag,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  numbersCount?: number;
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
  onOpenComparePlans?: () => void;
  onOpenBoosterModal?: () => void;
  onOpenAddNumber?: () => void;
  planName?: string;
  renewDate?: string;
}

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  numbersCount = 1,
  collapsed = false,
  setCollapsed,
  onOpenComparePlans,
  onOpenBoosterModal,
  onOpenAddNumber,
  planName = "Zoiko Max 30GB",
  renewDate = "28 Oct",
}: SidebarProps) {
  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid, href: "/dashboard" },
    {
      id: "numbers",
      label: "My mobile numbers",
      icon: Smartphone,
      badge: numbersCount,
      href: "/dashboard/my-mobile-numbers",
    },
    { id: "usage", label: "Usage & allowances", icon: BarChart2, href: "/dashboard/usage-and-allowances" },
    { id: "bills", label: "Bills & payments", icon: Receipt, href: "/dashboard/bills-and-payments" },
    { id: "sim", label: "SIM & eSIM", icon: Cpu, href: "/dashboard/sim-and-esim" },
  ];

  const serviceItems = [
    { id: "roaming", label: "Roaming & travel", icon: Globe, href: "/dashboard/roaming-and-travel" },
    { id: "addons", label: "Add-ons & data boosters", icon: Zap, href: "/dashboard/addons-and-boosters" },
    { id: "family", label: "Family & friends", icon: Users, href: "/dashboard/add-device", action: onOpenAddNumber },
    { id: "refer", label: "Refer & earn", icon: Gift, href: "/refer-a-friend" },
    { id: "offers", label: "Latest offers", icon: Tag, href: "/bundled-offers" },
  ];

  const accountItems = [
    { id: "orders", label: "My orders", icon: ShoppingBag, href: "/dashboard/orders" },
    { id: "profile", label: "Edit profile", icon: UserCheck, href: "/dashboard/edit-profile" },
    { id: "security", label: "Security & settings", icon: ShieldCheck, href: "/dashboard/security" },
    { id: "support", label: "Help & support", icon: HelpCircle, href: "/dashboard/support" },
  ];

  return (
    <aside
      className={`bg-white rounded-3xl p-4 sm:p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col justify-between transition-all duration-300 ${
        collapsed ? "w-20" : "w-64 min-w-[256px]"
      }`}
    >
      <div className="flex flex-col gap-5">
        {/* Top Header: Logo + Collapse Button */}
        <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="relative w-28 h-9">
              <Image
                src="/images/logo.png"
                alt="Zoiko Mobile"
                fill
                priority
                sizes="112px"
                className="object-contain object-left"
              />
            </div>
          </Link>
          {setCollapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {/* Section: Menu */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Menu
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith("#")) {
                        e.preventDefault();
                        setActiveTab(item.id);
                        const target = document.querySelector(item.href);
                        if (target) {
                          target.scrollIntoView({ behavior: "smooth", block: "start" });
                        } else {
                          window.location.assign(`/dashboard${item.href}`);
                        }
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#E01C5B] text-white shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Section: Services */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Services
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {serviceItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      if (item.action) {
                        e.preventDefault();
                        setActiveTab(item.id);
                        item.action();
                        return;
                      }
                      if (item.href.startsWith("#")) {
                        e.preventDefault();
                        setActiveTab(item.id);
                        const target = document.querySelector(item.href);
                        if (target) {
                          target.scrollIntoView({ behavior: "smooth", block: "start" });
                        } else {
                          window.location.assign(`/dashboard${item.href}`);
                        }
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#E01C5B] text-white shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Section: Account */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Account
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {accountItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#E01C5B] text-white shadow-[0px_6px_14px_-6px_rgba(224,28,91,0.60)] font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Promo Card (Zoiko Max 30GB) */}
      {!collapsed && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="relative overflow-hidden rounded-2xl bg-[#0B1528] p-4 text-white shadow-md">
            {/* Background Decorative Blobs */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#E01C5B] opacity-25 blur-xl" />
            <div className="pointer-events-none absolute right-4 top-2 w-16 h-16 rounded-full bg-orange-500 opacity-20 blur-lg" />

            <div className="flex items-start justify-between relative z-10 mb-2">
              <div className="pr-2">
                <h4 className="text-base font-bold leading-tight text-white">{planName}</h4>
                <p className="text-xs text-white/70 mt-0.5">Your plan · renews {renewDate}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-orange-400" />
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenComparePlans || (() => window.location.assign("/plans"))}
              className="w-full mt-2.5 py-2 px-3 bg-[#E01C5B] hover:bg-[#c9144e] active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <span>Compare plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

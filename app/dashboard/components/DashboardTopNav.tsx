"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  Shield,
  LogOut,
  X,
  Smartphone,
  ShoppingBag,
  Plus,
  Zap,
  Globe,
  BarChart2,
  Receipt,
  ChevronRight,
} from "lucide-react";

interface TopNavProps {
  userName?: string;
  userRole?: string;
  isDemo?: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onLogout?: () => void;
  unreadNotifications?: number;
  onClearNotifications?: () => void;
  subscriberId?: string | number | null;
  activeLineId?: string;
  onAddNewNumber?: () => void;
  onManageNumbers?: () => void;
  onOpenBoosterModal?: () => void;
  customTitle?: string;
  customSubtitle?: string;
  hideDemoBadgeInHeader?: boolean;
}

export default function DashboardTopNav({
  userName = "Alex Morgan",
  userRole = "Account holder",
  isDemo = true,
  searchQuery,
  setSearchQuery,
  onLogout,
  unreadNotifications = 3,
  onClearNotifications,
  subscriberId,
  activeLineId,
  onAddNewNumber,
  onManageNumbers,
  onOpenBoosterModal,
  customTitle,
  customSubtitle,
  hideDemoBadgeInHeader = false,
}: TopNavProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [greeting, setGreeting] = useState("Good afternoon");
  const [formattedDate, setFormattedDate] = useState("Wednesday 14 October 2026");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    try {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
      setFormattedDate(formatted);
    } catch {}
  }, []);

  const firstName = userName.split(" ")[0] || "Alex";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "AM";

  const notifications = [
    {
      id: 1,
      title: "Bill statement available",
      desc: "Your bill for £29.98 has been generated.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      title: "Data usage alert",
      desc: "61.3% of your 30 GB monthly data remaining.",
      time: "5 hours ago",
      unread: true,
    },
    {
      id: 3,
      title: "eSIM activated",
      desc: "Line 07700 900123 active on this device.",
      time: "1 day ago",
      unread: true,
    },
  ];

  const subIdStr = subscriberId ? String(subscriberId) : "1";
  const lineIdStr = activeLineId || "1";

  const quickSearchItems = [
    {
      title: "Add a new number",
      desc: "Quickly link or register a new UK mobile line",
      keywords: "add number new line family sim esim phone",
      icon: Plus,
      action: onAddNewNumber,
      href: "#my-numbers",
    },
    {
      title: "Manage my mobile numbers",
      desc: "Switch primary line, pause or unlink numbers",
      keywords: "manage numbers lines devices primary pause",
      icon: Smartphone,
      action: onManageNumbers,
      href: `/dashboard/my-devices-sims/${subIdStr}`,
    },
    {
      title: "Add device & IMEI compatibility checker",
      desc: "Check 15-digit IMEI or 32-digit EID compatibility",
      keywords: "add device imei eid compatibility check smartphone tablet",
      icon: Smartphone,
      href: "/dashboard/add-device",
    },
    {
      title: "Activate a SIM or eSIM",
      desc: "Enter your Zoiko SIM activation code",
      keywords: "activate sim esim card code",
      icon: Smartphone,
      href: "/activate-your-sim",
    },
    {
      title: "Buy data booster",
      desc: "Add extra 5G data to your current cycle",
      keywords: "buy data booster addon topup",
      icon: Zap,
      action: onOpenBoosterModal,
      href: "#data-boosters",
    },
    {
      title: "Full usage & allowances breakdown",
      desc: "View domestic & international voice, SMS, and data",
      keywords: "usage allowances data calls texts minutes report",
      icon: BarChart2,
      href: `/dashboard/plan-usages/${lineIdStr}`,
    },
    {
      title: "Bills, statements & payments",
      desc: "Download PDF invoices and manage payment methods",
      keywords: "bills payments invoices statements direct debit",
      icon: Receipt,
      href: `/dashboard/billing-payment/${subIdStr}`,
    },
    {
      title: "My orders history",
      desc: "View all plan purchases and SIM orders",
      keywords: "orders history purchases transactions",
      icon: ShoppingBag,
      href: "/dashboard/orders",
    },
    {
      title: "Two-factor authentication & security",
      desc: "Manage 2FA, recent sign-ins, and suspicious activity",
      keywords: "security 2fa two factor authentication login history",
      icon: Shield,
      href: "/dashboard/security",
    },
    {
      title: "Edit profile & change password",
      desc: "Update your personal name and account password",
      keywords: "edit profile password name email account",
      icon: User,
      href: "/dashboard/edit-profile",
    },
    {
      title: "Roaming & travel destinations",
      desc: "Check EU and international roaming rates",
      keywords: "roaming travel abroad eu international",
      icon: Globe,
      href: "/roaming-and-coverage",
    },
  ];

  const matchingSearchItems = searchQuery.trim()
    ? quickSearchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quickSearchItems.slice(0, 5);

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
      {/* Left: Greeting & Date (or Custom Title & Subtitle) */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1935] tracking-tight">
          {customTitle || `${greeting}, ${firstName}`}
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm text-slate-500 font-normal">
            {customSubtitle || formattedDate}
          </span>
          {isDemo && !hideDemoBadgeInHeader && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Demo mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Search + Action Buttons + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Search Account Input + Quick Jump Dropdown */}
        <div className="relative w-full sm:w-64 md:w-72" ref={searchRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search your account..."
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            className="w-full pl-9 pr-8 py-2 bg-white text-xs sm:text-sm text-slate-800 rounded-full border border-slate-200 focus:outline-none focus:border-[#E01C5B] focus:ring-2 focus:ring-pink-100 transition shadow-sm placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Search Results Dropdown */}
          {searchFocused && (
            <div className="absolute right-0 left-0 sm:left-auto sm:w-80 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {searchQuery.trim() ? "Matching Account Actions" : "Quick Jump"}
              </div>
              <div className="flex flex-col gap-1 mt-1 max-h-72 overflow-y-auto">
                {matchingSearchItems.length > 0 ? (
                  matchingSearchItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => {
                          setSearchFocused(false);
                          setSearchQuery("");
                          if (item.action) {
                            e.preventDefault();
                            item.action();
                          } else if (item.href.startsWith("#")) {
                            e.preventDefault();
                            const el = document.querySelector(item.href);
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="p-2.5 rounded-xl hover:bg-pink-50/50 flex items-center justify-between gap-2.5 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-pink-50 text-[#E01C5B] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0D1935] group-hover:text-[#E01C5B] truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E01C5B] flex-shrink-0" />
                      </a>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No matching actions for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            className="relative w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#0D1935]" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#E01C5B] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                  {unreadNotifications > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#E01C5B] text-xs font-semibold">
                      {unreadNotifications} new
                    </span>
                  )}
                </div>
                {onClearNotifications && unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={onClearNotifications}
                    className="text-xs text-[#E01C5B] hover:underline font-medium cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2.5 mt-3 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-pink-50/40 border border-slate-100 transition flex items-start gap-2.5"
                  >
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#E01C5B] flex-shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <div className="text-slate-500 mt-0.5">{n.desc}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <Link
          href="/dashboard/support"
          title="Help & Support"
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#0D1935]" />
        </Link>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="h-10 pl-1 pr-3 py-1 bg-white rounded-full border border-slate-200 flex items-center gap-2.5 shadow-sm hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-pink-100 text-[#E01C5B] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-bold text-[#0D1935] truncate max-w-[110px]">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {userRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">{userName}</p>
                <p className="text-[11px] text-slate-500">{userRole}</p>
              </div>

              <Link
                href="/dashboard/edit-profile"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Edit Profile</span>
              </Link>

              <Link
                href={`/dashboard/my-devices-sims/${subIdStr}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span>My Devices &amp; SIMs</span>
              </Link>

              <Link
                href="/dashboard/orders"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>My Orders &amp; Bills</span>
              </Link>

              <Link
                href="/dashboard/security"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <Shield className="w-4 h-4 text-slate-500" />
                <span>Security Settings</span>
              </Link>

              <Link
                href="/dashboard/support"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Support &amp; Tickets</span>
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

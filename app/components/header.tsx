"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Smartphone,
  PhoneCall,
  Truck,
  Calendar,
  MapPin,
  Sparkles,
  HelpCircle,
  Check,
  Layers,
  Wifi,
  Globe,
  Building2,
  Briefcase,
  Users,
  Radio,
  Headphones,
  User,
  ShieldCheck,
  Plane,
  Gift,
  Music,
  Leaf,
  CreditCard,
  Wallet,
  BookOpen,
  Bot,
  Heart,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { openChat } from "./ChatbotWidget";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart();

  // Read auth state from localStorage on mount + keep it in sync
  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem("zoiko_token"));
    check();
    window.addEventListener("zoiko-auth", check);
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("zoiko-auth", check);
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    setIsLoggedIn(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/plans?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Function to open Zovie chatbot widget
  const handleOpenZovie = () => {
    setActiveDropdown(null);
    setMobileOpen(false);
    openChat();
  };

  // Hide on dashboard pages
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-sm" ref={dropdownRef}>
      {/* ─── 1. TOP UTILITY BAR (bg-zinc-100 h-11) ─── */}
      <div className="w-full bg-[#f4f4f5] dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700">
        <div className="mx-auto flex h-11 max-w-[1440px] items-center justify-between px-4 sm:px-8 text-[13px] md:text-[14px] text-black/80 dark:text-gray-200 font-normal">
          {/* Left features strip */}
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-1">
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center text-rose-600 dark:text-rose-400">
                <Smartphone className="h-3.5 w-3.5" />
              </span>
              <span>eSIM ready</span>
            </div>

            <div className="h-4 w-px bg-neutral-300 dark:bg-gray-700 hidden sm:block" />

            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center text-rose-600 dark:text-rose-400">
                <PhoneCall className="h-3.5 w-3.5" />
              </span>
              <span>Keep your number</span>
            </div>

            <div className="h-4 w-px bg-neutral-300 dark:bg-gray-700 hidden md:block" />

            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center text-rose-600 dark:text-rose-400">
                <Truck className="h-3.5 w-3.5" />
              </span>
              <span>Free UK delivery</span>
            </div>

            <div className="h-4 w-px bg-neutral-300 dark:bg-gray-700 hidden lg:block" />

            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex h-4 w-4 items-center justify-center text-rose-600 dark:text-rose-400">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <span>Flexible 30-day plans</span>
            </div>
          </div>

          {/* Right feature: Proudly UK based */}
          <div className="hidden sm:inline-flex items-center gap-2 whitespace-nowrap pl-4">
            <img
              src="/images/new%20home%20and%20header/Frame%2017.png"
              alt="UK Flag"
              className="h-4 w-6 rounded-sm object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            <span className="text-black/80 dark:text-gray-200">Proudly UK based</span>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN HEADER BAR (h-16 / h-20, bg-white) ─── */}
      <div className="relative w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex h-16 md:h-20 max-w-[1440px] items-center justify-between px-4 sm:px-8 gap-4">
          {/* Logo */}
          <Link href="/" className="flex flex-shrink-0 items-center">
            <span className="relative block h-10 md:h-12 w-[140px] md:w-[170px]">
              <Image
                src="/images/zmuk-logo.png"
                alt="Zoiko Mobile"
                fill
                priority
                sizes="170px"
                className="object-contain object-left"
              />
            </span>
          </Link>

          {/* Center-Right Actions */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 ml-auto">
            {/* Search Pill */}
            <form onSubmit={handleSearchSubmit} className="relative w-48 lg:w-72">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-black/40 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-4 pr-10 text-sm text-black dark:text-white placeholder-black/60 dark:placeholder-gray-400 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* My Zoiko Pill */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-rose-600/60 dark:border-rose-500/60 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <LayoutDashboard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-rose-600/60 dark:border-rose-500/60 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <User className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>My Zoiko</span>
                <ChevronDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              </Link>
            )}

            {/* Switch & Save Button */}
            <Link
              href="/switch-and-save"
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white shadow-[0px_0px_4px_2px_rgba(224,28,91,0.15)] transition-colors hover:bg-[#c8164f]"
            >
              <span>Switch &amp; Save</span>
              <ChevronRight className="h-4 w-4" />
            </Link>

            {/* Cart Icon */}
            <Link
              href="/checkout"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute 0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Right Bar: Cart & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/checkout"
              aria-label="Cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 dark:text-gray-300"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. SUB NAVIGATION BAR (h-12, bg-zinc-100) ─── */}
      <div className="hidden md:block relative w-full bg-[#f4f4f5] dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-center gap-8 lg:gap-14 px-4 text-sm font-bold text-gray-900/70 dark:text-gray-300">
          {/* 1. Plans & Pricing */}
          <button
            type="button"
            onMouseEnter={() => setActiveDropdown("plans")}
            onClick={() => setActiveDropdown(activeDropdown === "plans" ? null : "plans")}
            className={`flex items-center gap-1 transition-colors py-3 ${
              activeDropdown === "plans" ? "text-rose-600 dark:text-rose-400 font-bold" : "hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>Plans &amp; Pricing</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                activeDropdown === "plans" ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
              }`}
            />
          </button>

          {/* 2. Phones & Devices */}
          <button
            type="button"
            onMouseEnter={() => setActiveDropdown("devices")}
            onClick={() => setActiveDropdown(activeDropdown === "devices" ? null : "devices")}
            className={`flex items-center gap-1 transition-colors py-3 ${
              activeDropdown === "devices" ? "text-rose-600 dark:text-rose-400 font-bold" : "hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>Phones &amp; Devices</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                activeDropdown === "devices" ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
              }`}
            />
          </button>

          {/* 3. Roaming & Calls */}
          <button
            type="button"
            onMouseEnter={() => setActiveDropdown("roaming")}
            onClick={() => setActiveDropdown(activeDropdown === "roaming" ? null : "roaming")}
            className={`flex items-center gap-1 transition-colors py-3 ${
              activeDropdown === "roaming" ? "text-rose-600 dark:text-rose-400 font-bold" : "hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>Roaming &amp; Calls</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                activeDropdown === "roaming" ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
              }`}
            />
          </button>

          {/* 4. Business */}
          <button
            type="button"
            onMouseEnter={() => setActiveDropdown("business")}
            onClick={() => setActiveDropdown(activeDropdown === "business" ? null : "business")}
            className={`flex items-center gap-1 transition-colors py-3 ${
              activeDropdown === "business" ? "text-rose-600 dark:text-rose-400 font-bold" : "hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>Business</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                activeDropdown === "business" ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
              }`}
            />
          </button>

          {/* 5. Why Zoiko */}
          <button
            type="button"
            onMouseEnter={() => setActiveDropdown("why-zoiko")}
            onClick={() => setActiveDropdown(activeDropdown === "why-zoiko" ? null : "why-zoiko")}
            className={`flex items-center gap-1 transition-colors py-3 ${
              activeDropdown === "why-zoiko" ? "text-rose-600 dark:text-rose-400 font-bold" : "hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>Why Zoiko</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                activeDropdown === "why-zoiko" ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
              }`}
            />
          </button>

          {/* 6. Help & Support */}
          <button
            type="button"
            onMouseEnter={() => setActiveDropdown("help-support")}
            onClick={() => setActiveDropdown(activeDropdown === "help-support" ? null : "help-support")}
            className={`flex items-center gap-1 transition-colors py-3 ${
              activeDropdown === "help-support" ? "text-rose-600 dark:text-rose-400 font-bold" : "hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>Help &amp; Support</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                activeDropdown === "help-support" ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
              }`}
            />
          </button>
        </div>

        {/* ─── MEGA DROPDOWN 1: PLANS & PRICING ─── */}
        {activeDropdown === "plans" && (
          <div
            onMouseLeave={() => setActiveDropdown(null)}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-[1240px] max-w-[96vw] pt-2"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Choose Your Plan */}
                <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 pr-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                    Choose Your Plan
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Flexible plans for the way you live
                  </p>

                  <div className="mt-5 space-y-4">
                    <Link
                      href="/plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            All SIM-Only Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Browse all available allowances
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/activate-your-sim"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs">
                          eSIM
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            eSIM Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Compatible plans and activation
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/30-day-plan"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs">
                          30
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            30-Day Flexible Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Monthly flexibility
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/data-only-plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Wifi className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Data-Only Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            For connected devices
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/recharge"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Top Up
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Recharge your mobile plan
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 2: Plans for You */}
                <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 pr-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                    Plans for You
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tailored plans for different needs
                  </p>

                  <div className="mt-5 space-y-4">
                    <Link
                      href="/student-deals"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Student Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Eligibility applies
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/civilservants"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Public Sector Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Check qualifying roles
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/social-tariff-plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Zoiko Saver Deals
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Check offer eligibility
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-rose-400" />
                    </Link>

                    <Link
                      href="/business-deals_sim-only-plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Business SIM Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            For teams and businesses
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 3: Get Started */}
                <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 pr-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                    Get Started
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Everything you need to join Zoiko
                  </p>

                  <div className="mt-5 space-y-4">
                    <Link
                      href="/switch-and-save"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Switch &amp; Save
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Move your number
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <a
                      href="https://ee.co.uk/help/mobile-coverage-checker"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Check Coverage
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Availability in your area
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </a>

                    <Link
                      href="/plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Compare Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Compare like for like
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/faqs"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Plan FAQs
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Answers before choosing
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 4: Right Feature Card */}
                <div className="col-span-3 flex flex-col justify-between rounded-2xl bg-gradient-to-b from-pink-50/60 to-white dark:from-gray-800/80 dark:to-gray-900/90 p-4 border border-pink-100 dark:border-gray-800">
                  <div className="overflow-hidden rounded-xl bg-pink-100/50 dark:bg-gray-800 aspect-[4/3] relative">
                    <img
                      src="/images/new%20home%20and%20header/Frame%207.png"
                      alt="Find your next plan"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      Find your next plan
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Browse options with clear allowances and eligibility information.
                    </p>

                    <Link
                      href="/plans"
                      className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2.5 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#c8164f]"
                    >
                      <span>View All Plans</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <p className="mt-2.5 flex items-center justify-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <Check className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                      <span>No dynamic prices or unsupported claims</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MEGA DROPDOWN 2: PHONES & DEVICES ─── */}
        {activeDropdown === "devices" && (
          <div
            onMouseLeave={() => setActiveDropdown(null)}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-[1240px] max-w-[96vw] pt-2"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Browse Devices */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                    Browse Devices
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Find the right phone for you
                  </p>

                  <div className="mt-6 space-y-5">
                    <Link
                      href="/devices"
                      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Refurbished Smartphones
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Browse inspected pre-owned smartphones
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/devices"
                      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            All Available Devices
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Explore the full device catalogue
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/plans"
                      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <PhoneCall className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Pair with a SIM Plan
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Choose a SIM-only plan after your phone
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 2: Order & Aftercare */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                    Order &amp; Aftercare
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Delivery, returns and support
                  </p>

                  <div className="mt-6 space-y-5">
                    <Link
                      href="/support"
                      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Delivery Information
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            UK delivery areas, timings and fulfilment guidance
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/support"
                      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Returns &amp; Support
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Read the returns policy and get help
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800 my-2" />

                    <Link
                      href="/support"
                      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-orange-500 text-white font-bold text-base shadow-sm">
                          ?
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Need assistance?
                          </p>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                            Open Help &amp; Support
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 3: Right Feature Card */}
                <div className="col-span-4 flex flex-col justify-between rounded-2xl bg-gradient-to-b from-pink-50/60 to-white dark:from-gray-800/80 dark:to-gray-900/90 p-5 border border-pink-100 dark:border-gray-800">
                  <div className="overflow-hidden rounded-xl bg-pink-100/50 dark:bg-gray-800 aspect-[16/10] relative">
                    <img
                      src="/images/new%20home%20and%20header/Frame%208.png"
                      alt="Find your next phone"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      Find your next phone
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      Browse smartphones and pair them with the right plan.
                    </p>

                    <Link
                      href="/devices"
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-3 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#c8164f]"
                    >
                      <span>Browse Smartphones</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MEGA DROPDOWN 3: ROAMING & CALLS ─── */}
        {activeDropdown === "roaming" && (
          <div
            onMouseLeave={() => setActiveDropdown(null)}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-[1240px] max-w-[96vw] pt-2"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Roaming & Rates */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Roaming &amp; Rates
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Check charges and plan inclusions before you travel.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Link
                      href="dashboard/roaming-and-travel"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Roaming &amp; Overage Rates
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            View charges by roaming zone.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="dashboard/roaming-and-travel"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Plane className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Roaming Included in Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Check what your plan includes.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/support"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Roaming Help
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Setup and troubleshooting abroad.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 2: Calls & Allowances */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Calls &amp; Allowances
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        International calling and usage options.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Link
                      href="/international-calling"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            International Calling
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Calling from the UK to overseas.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <Link
                      href="/plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Check Plan Allowances
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Compare included data, calls &amp; texts.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <a
                      href="https://ee.co.uk/help/mobile-coverage-checker"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Network Coverage
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Check UK network availability.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </a>
                  </div>
                </div>

                {/* Column 3: Right Feature Card with background */}
                <div className="col-span-4 relative rounded-2xl overflow-hidden min-h-[300px] flex flex-col justify-between p-6 bg-rose-50 dark:bg-gray-800 border dark:border-gray-700">
                  <img
                    src="/images/new home and header/Vector (4).png"
                    alt="Travelling abroad"
                    className="absolute inset-0 h-full w-full object-cover dark:opacity-40"
                  />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                       ROAMING &amp; CALLS
                    </p>
                    <h4 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                      Travelling <br />
                      <span className="text-rose-600 dark:text-rose-400">abroad?</span>
                    </h4>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-gray-300">
                      Check your charges before you go.
                    </p>

                    <Link
                      href="dashboard/roaming-and-travel"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#c8164f]"
                    >
                      <span>VIEW ROAMING RATES</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Translucent bottom bar */}
                  <div className="relative z-10 mt-6 flex items-center justify-between rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                      <span>UK to Worldwide</span>
                    </div>
                    <div className="h-3.5 w-px bg-gray-400 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <PhoneCall className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                      <span>Data &amp; Calls</span>
                    </div>
                    <div className="h-3.5 w-px bg-gray-400 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <Radio className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                      <span>Network Info</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MEGA DROPDOWN 4: BUSINESS ─── */}
        {activeDropdown === "business" && (
          <div
            onMouseLeave={() => setActiveDropdown(null)}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-[1240px] max-w-[96vw] pt-2"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Explore Business */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Explore Business
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mobile solutions for your business
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Link
                      href="/business-deals_sim-only-plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Business SIM-Only Plans
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            Browse business mobile plans for teams and organisations.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/data-only-plans"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Wifi className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Business Data Options
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            Explore data-only connectivity for business devices.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/international-calling"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            International Calling for Business
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            View international call options and rates for business use.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 2: Business Assistance */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Headphones className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Business Assistance
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get support and access your account
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Link
                      href="/contact-us"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Headphones className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Contact Business Support
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            Talk to our support team about business enquiries.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/login"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Existing Customer Login
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            Sign in to your Zoiko business account.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="rounded-xl bg-rose-50 dark:bg-gray-800/90 border border-transparent dark:border-gray-700/80 p-3 mt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            Need help choosing?
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Talk to our team about the right plan for your business.
                          </p>
                        </div>
                        <Link
                          href="/contact-us"
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0 ml-2"
                        >
                          Talk to team
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Right Feature Card */}
                <div className="col-span-4 relative rounded-2xl overflow-hidden min-h-[300px] flex flex-col justify-between p-6 bg-rose-50 dark:bg-gray-800 border dark:border-gray-700">
                  <img
                    src="/images/new%20home%20and%20header/Vector%20(1).png"
                    alt="Keep your business connected"
                    className="absolute inset-0 h-full w-full object-cover dark:opacity-40"
                  />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                      BUSINESS
                    </p>
                    <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      Keep your <br />
                      <span className="text-rose-600 dark:text-rose-400">business</span> connected.
                    </h4>
                    <p className="mt-2 text-xs text-zinc-700 dark:text-gray-300 leading-relaxed">
                      Flexible business SIM plans and data options for teams, anywhere in the UK and abroad.
                    </p>

                    <Link
                      href="/business-deals_sim-only-plans"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#c8164f]"
                    >
                      <span>VIEW BUSINESS PLANS</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Translucent bottom bar */}
                  <div className="relative z-10 mt-6 flex items-center justify-between rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>For teams</span>
                    </div>
                    <div className="h-3.5 w-px bg-neutral-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Global calling</span>
                    </div>
                    <div className="h-3.5 w-px bg-neutral-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Reliable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MEGA DROPDOWN 5: WHY ZOIKO ─── */}
        {activeDropdown === "why-zoiko" && (
          <div
            onMouseLeave={() => setActiveDropdown(null)}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-[1240px] max-w-[96vw] pt-2"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Discover Zoiko */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Discover Zoiko
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Our network, purpose and switching made simple.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Link
                      href="/about-us"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            About Zoiko Mobile
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Our story and purpose.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <a
                      href="https://ee.co.uk/help/mobile-coverage-checker"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Network &amp; Coverage
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Understand available coverage across the UK.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </a>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/switch-and-save"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <RefreshCw className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Switch &amp; Save
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            See how switching works.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 2: Community & Rewards */}
                <div className="col-span-4 border-r border-gray-200 dark:border-gray-800 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Community &amp; Rewards
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        More ways to be part of Zoiko.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Link
                      href="/refer-a-friend"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Refer a Friend
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Learn about referral rewards.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/animals-and-music"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Music className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Animals &amp; Music
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Explore our community channel.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/faqs"
                      className="group flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            FAQs
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Answers to common questions.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 3: Right Feature Card with Frame/Vector */}
                <div className="col-span-4 relative rounded-2xl overflow-hidden min-h-[300px] flex flex-col justify-between p-6 bg-rose-50 dark:bg-gray-800 border dark:border-gray-700">
                  <img
                    src="/images/new home and header/Vector (2).png"
                    alt="More than mobile"
                    className="absolute inset-0 h-full w-full object-cover dark:opacity-40"
                  />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                      WHY ZOIKO
                    </p>
                    <h4 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                      More than <br />
                      <span className="text-rose-600 dark:text-rose-400">mobile.</span>
                    </h4>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-gray-300">
                      Discover a connected community and our story.
                    </p>

                    <Link
                      href="/about-us"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#c8164f]"
                    >
                      <span>DISCOVER OUR STORY</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Translucent bottom bar */}
                  <div className="relative z-10 mt-6 flex items-center justify-between rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Trusted network</span>
                    </div>
                    <div className="h-3.5 w-px bg-neutral-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>A connected community</span>
                    </div>
                    <div className="h-3.5 w-px bg-neutral-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>A more sustainable future</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MEGA DROPDOWN 6: HELP & SUPPORT ─── */}
        {activeDropdown === "help-support" && (
          <div
            onMouseLeave={() => setActiveDropdown(null)}
            className="absolute left-1/2 top-full -translate-x-1/2 z-50 w-[1240px] max-w-[96vw] pt-2"
          >
            <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-12 gap-5">
                {/* Column 1: Get connected */}
                <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Get connected
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Activate, set up &amp; keep number.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    <Link
                      href="/activate-your-sim"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Activate Your SIM
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Set up your new SIM.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/activate-your-sim"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Wifi className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            eSIM Setup Guidance
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Install and activate eSIM.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/switch-and-save"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Keep Your Number
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Transfer existing number.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 2: Manage & resolve */}
                <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Manage &amp; resolve
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Top up &amp; find answers.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    <Link
                      href="/recharge"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Top Up
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Recharge your mobile plan.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/login"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            My Zoiko
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Sign in &amp; manage account.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/faqs"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            FAQs
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Answers to common questions.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>
                  </div>
                </div>

                {/* Column 3: Contact & help */}
                <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Headphones className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-['Figtree',sans-serif]">
                        Contact &amp; help
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Guides &amp; live assistance.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    <Link
                      href="/support"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Support Hub
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Explore guides &amp; support.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <Link
                      href="/contact-us"
                      className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Contact Us
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Speak to the right team.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </Link>

                    <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

                    <button
                      type="button"
                      onClick={handleOpenZovie}
                      className="group flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-rose-50/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            Zovie AI Assistance
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Start a guided conversation.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </button>
                  </div>
                </div>

                {/* Column 4: Right Feature Card with Zovie Robot Image */}
                <div className="col-span-3 relative rounded-2xl overflow-hidden min-h-[300px] flex flex-col justify-between p-5 bg-rose-50 dark:bg-gray-800 border dark:border-gray-700">
                  <img
                    src="/images/new%20home%20and%20header/Vector%20(3).png"
                    alt="Need a hand?"
                    className="absolute inset-0 h-full w-full object-cover dark:opacity-40"
                  />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                      HELP &amp; SUPPORT
                    </p>
                    <h4 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                      Need a <br />
                      <span className="text-rose-600 dark:text-rose-400">hand?</span>
                    </h4>
                    <p className="mt-2 text-xs text-zinc-700 dark:text-gray-300 leading-relaxed">
                      Find an answer or open Zovie for general help.
                    </p>

                    <button
                      type="button"
                      onClick={handleOpenZovie}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#c8164f]"
                    >
                      <span>OPEN ZOVIE</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Translucent bottom bar */}
                  <div className="relative z-10 mt-5 flex items-center justify-between rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-2.5 py-2 text-[10px] font-medium text-gray-900 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                      <span>Instant guidance</span>
                    </div>
                    <div className="h-3 w-px bg-neutral-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                      <span>Support for all</span>
                    </div>
                    <div className="h-3 w-px bg-neutral-300 dark:bg-gray-600" />
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                      <span>Here for you</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. MOBILE DRAWER MENU ─── */}
      {mobileOpen && (
        <nav className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden max-h-[85vh] overflow-y-auto px-4 py-5 shadow-xl">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative mb-5">
            <input
              type="text"
              placeholder="Search plans or devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2.5 pl-4 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-rose-600 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-6">
            <Link
              href="/switch-and-save"
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-sm"
            >
              Switch &amp; Save
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-full border border-rose-600 dark:border-rose-500 px-4 py-2.5 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-full border border-rose-600 dark:border-rose-500 px-4 py-2.5 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                My Zoiko (Login)
              </Link>
            )}
          </div>

          {/* Accordion Sections for all 6 menus */}
          <div className="space-y-3">
            {/* 1. Plans & Pricing */}
            <details className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-900 dark:text-white">
                <span>Plans &amp; Pricing</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-gray-200/60 dark:border-gray-700 pt-2 text-sm">
                <Link
                  href="/plans"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  All SIM-Only Plans
                </Link>
                <Link
                  href="/activate-your-sim"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  eSIM Plans
                </Link>
                <Link
                  href="/30-day-plan"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  30-Day Flexible Plans
                </Link>
                <Link
                  href="/data-only-plans"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Data-Only Plans
                </Link>
                <Link
                  href="/recharge"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
                >
                  Top Up
                </Link>
                <Link
                  href="/student-deals"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Student Plans
                </Link>
                <Link
                  href="/civilservants"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Public Sector Plans
                </Link>
                <Link
                  href="/social-tariff-plans"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Zoiko Saver Deals
                </Link>
                <Link
                  href="/business-deals_sim-only-plans"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Business SIM Plans
                </Link>
              </div>
            </details>

            {/* 2. Phones & Devices */}
            <details className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-900 dark:text-white">
                <span>Phones &amp; Devices</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-gray-200/60 dark:border-gray-700 pt-2 text-sm">
                <Link
                  href="/devices"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Refurbished Smartphones
                </Link>
                <Link
                  href="/devices"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  All Available Devices
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Delivery Information
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Returns &amp; Support
                </Link>
              </div>
            </details>

            {/* 3. Roaming & Calls */}
            <details className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-900 dark:text-white">
                <span>Roaming &amp; Calls</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-gray-200/60 dark:border-gray-700 pt-2 text-sm">
                <Link
                  href="dashboard/roaming-and-travel"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Roaming &amp; Overage Rates
                </Link>
                <Link
                  href="/international-calling"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  International Calling
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Roaming Help
                </Link>
              </div>
            </details>

            {/* 4. Business */}
            <details className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-900 dark:text-white">
                <span>Business</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-gray-200/60 dark:border-gray-700 pt-2 text-sm">
                <Link
                  href="/business-deals_sim-only-plans"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Business SIM-Only Plans
                </Link>
                <Link
                  href="/data-only-plans"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Business Data Options
                </Link>
                <Link
                  href="/contact-us"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Contact Business Support
                </Link>
              </div>
            </details>

            {/* 5. Why Zoiko */}
            <details className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-900 dark:text-white">
                <span>Why Zoiko</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-gray-200/60 dark:border-gray-700 pt-2 text-sm">
                <Link
                  href="/about-us"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  About Zoiko Mobile
                </Link>
                <a
                  href="https://ee.co.uk/help/mobile-coverage-checker"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Network &amp; Coverage
                </a>
                <Link
                  href="/switch-and-save"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Switch &amp; Save
                </Link>
                <Link
                  href="/refer-a-friend"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Refer a Friend
                </Link>
                <Link
                  href="/animals-and-music"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Animals &amp; Music
                </Link>
              </div>
            </details>

            {/* 6. Help & Support */}
            <details className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-900 dark:text-white">
                <span>Help &amp; Support</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-gray-500 dark:text-gray-400" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-gray-200/60 dark:border-gray-700 pt-2 text-sm">
                <Link
                  href="/activate-your-sim"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Activate Your SIM
                </Link>
                <Link
                  href="/recharge"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Top Up
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Support Hub &amp; FAQs
                </Link>
                <Link
                  href="/contact-us"
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Contact Us
                </Link>
                <button
                  type="button"
                  onClick={handleOpenZovie}
                  className="block w-full text-left py-1 text-rose-600 dark:text-rose-400 font-semibold"
                >
                  Open Zovie AI Assistance
                </button>
              </div>
            </details>
          </div>

          {/* Logout if logged in */}
          {isLoggedIn && (
            <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-600 dark:border-rose-500 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

// =========================================================================
// OLD HEADER IMPLEMENTATION (KEPT IN COMMENTS AS REQUESTED)
// =========================================================================
// const topLinksOld = [
//   { label: "Activate Your SIM", href: "/activate-your-sim", highlight: true },
//   { label: "Top Up", href: "/recharge" },
//   { label: "Switch & Save", href: "/switch-and-save" },
//   { label: "Contact Us", href: "/contact-us" },
//   { label: "Support", href: "/support" },
//   { label: "International Calls", href: "/international-calling" },
// ];
// ...
// =========================================================================

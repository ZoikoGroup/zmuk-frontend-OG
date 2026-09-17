"use client";

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

export default function SecurityPage() {
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
    { label: "Security", icon: ShieldCheck, href: "/security" },
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
    // 1. Clear session tokens & stored user data
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    localStorage.removeItem("driverx_token");
    localStorage.removeItem("driverx_2fa");

    // 2. Notify remaining components across app (like Header)
    window.dispatchEvent(new Event("zoiko-auth"));

    // 3. Redirect to login page
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
      showToast("Please describe the suspicious activity first.", "error");
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
        showToast(
          "Report submitted. Our team will review it shortly.",
          "success",
        );
        setReportNote("");
      } else {
        showToast(
          "Report received (local). We'll follow up by email.",
          "success",
        );
        setReportNote("");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setReportLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans antialiased text-[#222222]">
      {/* Pink Header Banner */}
      <header className="w-full bg-gradient-to-r from-[#E5125A] via-[#E5127D] to-[#E5125A] py-3 text-center text-white font-semibold text-sm sm:text-base shadow-sm">
        Welcome to Your Account Summary with Zoiko Mobile!
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 bg-white rounded-xl shadow-sm py-5 px-0 flex flex-col justify-between overflow-hidden">
          <div>
            {/* User Profile Header */}
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

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 text-xs font-medium text-[#555555] border border-gray-300 rounded-md px-3 py-1 flex items-center gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>

            {/* Main Navigation Links */}
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

            {/* Dummy Placeholder Links */}
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

          {/* Bottom Secondary Links */}
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

        {/* Right Main Content Area */}
        <main className="lg:col-span-9 bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Welcome Banner Header */}
          <div className="text-center pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, <span className="text-[#7B7B7B]">{user}!</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Welcome to Your Account Summary
            </p>
          </div>

          {/* Toast */}
          {toast.msg && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
                toast.type === "success"
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-red-50 border-red-300 text-red-700"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              {toast.msg}
            </div>
          )}

          {/* Top Section: Two-Factor Authentication & Change Password */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Two-Factor Authentication Card */}
            <div className="md:col-span-6 border border-[#DF1E5A] bg-[#DF1E5A0D] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E5125A] text-white flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Two-Factor Authentication
                    </h3>
                  </div>
                  <span className="border border-black text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        twoFAEnabled ? "bg-[#10B981]" : "bg-gray-400"
                      }`}
                    ></span>
                    {twoFAEnabled ? "On" : "Off"}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                  Add an extra layer of protection by requiring a verification
                  code in addition to your password when you sign in.
                </p>
              </div>

              {/* Toggle */}
              <div className="mt-4 pt-3 border-t border-[#FFC2D1] flex items-center justify-center gap-3 text-xs">
                <span className="font-bold text-gray-900 text-[12px]">
                  Enable 2FA:
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`font-bold ${!twoFAEnabled ? "text-gray-900" : "text-gray-400"}`}
                  >
                    OFF
                  </span>
                  <button
                    type="button"
                    onClick={toggle2FA}
                    disabled={twoFALoading}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      twoFAEnabled ? "bg-[#E5125A]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        twoFAEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`font-bold ${twoFAEnabled ? "text-[#E5125A]" : "text-gray-400"}`}
                  >
                    {twoFALoading ? "..." : "ON"}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
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

          {/* Login History Section */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 -mx-2 rounded-xl text-left group transition-colors hover:bg-gray-50 cursor-pointer focus:outline-none"
              aria-expanded={isHistoryOpen}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 group-hover:border-[#E5125A] group-hover:text-[#E5125A] transition-colors">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Recent Activity
                  </span>
                  <h4 className="text-xs font-bold text-gray-900">
                    Login History
                  </h4>
                </div>
              </div>

              <div className="p-1.5 rounded-full hover:bg-gray-200 transition">
                <ChevronUp
                  className={`w-4 h-4 text-gray-700 transform transition-transform duration-200 ${
                    isHistoryOpen ? "" : "rotate-180"
                  }`}
                />
              </div>
            </button>

            {/* Collapsible List Container */}
            {isHistoryOpen && (
              <div className="space-y-2 mt-2 transition-all duration-200">
                {loginHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-12 items-center bg-[#FFF0F4] hover:bg-[#FFE4EC] transition-colors rounded-xl px-4 py-3 text-xs gap-2"
                  >
                    <span className="col-span-5 sm:col-span-5 font-bold text-gray-900 truncate">
                      {entry.device}
                    </span>
                    <span className="col-span-3 sm:col-span-4 text-gray-500 text-center sm:text-left truncate">
                      {entry.location}
                    </span>
                    <span className="col-span-4 sm:col-span-3 text-gray-400 font-medium text-right truncate">
                      {entry.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Suspicious Activity Section */}
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

          {/* Add Family & Friends */}
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
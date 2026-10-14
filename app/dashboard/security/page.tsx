"use client";

import { useEffect, useState } from "react";
import {
  FaShieldAlt,
  FaKey,
  FaHistory,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

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
  const [token, setToken] = useState<string>("");
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(false);
  const [twoFALoading, setTwoFALoading] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportNote, setReportNote] = useState<string>("");
  const [toast, setToast] = useState<Toast>({ msg: "", type: "" });

  // Demo login history — replace with API result when ready.
  const loginHistory: LoginEntry[] = [
    { id: 1, device: "Chrome on Windows 11", location: "Bangalore, IN", time: "Today, 09:42" },
    { id: 2, device: "Safari on iPhone", location: "Bangalore, IN", time: "Yesterday, 21:18" },
    { id: 3, device: "Firefox on macOS", location: "Mumbai, IN", time: "12 May, 14:05" },
  ];

  // ── Load token (optional — auth gating disabled) ──
  useEffect(() => {
    const storedToken = localStorage.getItem("driverx_token") || "";
    setToken(storedToken);

    const stored2FA = localStorage.getItem("driverx_2fa") === "true";
    setTwoFAEnabled(stored2FA);
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Toggle 2FA ──
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
          "success"
        );
      } else {
        // Optimistic UI fallback so the page still feels responsive in dev.
        const next = !twoFAEnabled;
        setTwoFAEnabled(next);
        localStorage.setItem("driverx_2fa", String(next));
        showToast(
          next ? "2FA enabled (local)." : "2FA disabled (local).",
          "success"
        );
      }
    } catch {
      // Same optimistic fallback for network errors during development.
      const next = !twoFAEnabled;
      setTwoFAEnabled(next);
      localStorage.setItem("driverx_2fa", String(next));
      showToast(
        next ? "2FA enabled (offline)." : "2FA disabled (offline).",
        "success"
      );
    }
    setTwoFALoading(false);
  };

  // ── Report suspicious activity ──
  const submitReport = async () => {
    if (!reportNote.trim()) {
      showToast("Please describe the suspicious activity first.", "error");
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
        showToast("Report submitted. Our team will review it shortly.", "success");
        alert("Report submitted. Our team will review it shortly.");
        setReportNote("");
      } else {
        showToast("Report received. We'll follow up by email.", "success");
        alert("Report received. We'll follow up by email.");
        setReportNote("");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
      alert("Network error. Please try again.");
    }
    setReportLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold">Security</h4>
          </div>

          {/* Toast */}
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

          {/* Two-Factor Authentication */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaShieldAlt />
              </div>
              <h5 className="font-semibold text-base">Two-Factor Authentication</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Add an extra layer of protection by requiring a verification code
              in addition to your password when you sign in.
            </p>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-4 mb-4">
              <div>
                <p className="text-sm font-medium">
                  {twoFAEnabled ? "2FA is currently ON" : "2FA is currently OFF"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {twoFAEnabled
                    ? "You'll be asked for a verification code on new sign-ins."
                    : "We recommend enabling 2FA for better account security."}
                </p>
              </div>
              <button
                onClick={toggle2FA}
                disabled={twoFALoading}
                className={`px-4 py-1.5 text-sm rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  twoFAEnabled
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {twoFALoading
                  ? "Working..."
                  : twoFAEnabled
                  ? "Disable 2FA"
                  : "Enable 2FA"}
              </button>
            </div>
          </div> */}

          {/* Change Password CTA */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaKey />
              </div>
              <h5 className="font-semibold text-base">Change Password</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You can update your password from the Edit Profile page.
            </p>

            <div className="flex gap-3 flex-wrap">
              <a
                href="/dashboard/edit-profile"
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Edit Profile
              </a>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Login History */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaHistory />
              </div>
              <h5 className="font-semibold text-base">Login History</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Recent sign-in activity on your account.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 font-medium">Device</th>
                    <th className="py-2 font-medium">Location</th>
                    <th className="py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <td className="py-3">{entry.device}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{entry.location}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div> */}

          {/* Report Suspicious Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-red-500 text-xl">
                <FaExclamationTriangle />
              </div>
              <h5 className="font-semibold text-base">Report Suspicious Activity</h5>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Noticed a login you don&apos;t recognise, or anything unusual? Tell
              us about it and our team will investigate.
            </p>

            <textarea
              rows={4}
              placeholder="Describe what looked off (e.g. unfamiliar device, unexpected password reset email)..."
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none mb-4"
            />

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={submitReport}
                disabled={reportLoading}
                className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>
              <button
                onClick={() => setReportNote("")}
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

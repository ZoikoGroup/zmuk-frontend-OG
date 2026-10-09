"use client";

import { useEffect, useState } from "react";
import { FaUser, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

// Uses the same env var as the rest of the app. In .env.local:
//   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL  ;
const UPDATE_PROFILE_URL = `${API_BASE}/api/accounts/update-profile/`;
const CHANGE_PASSWORD_URL = `${API_BASE}/api/accounts/change-password/`;

interface NameForm {
  first_name: string;
  last_name: string;
}

interface PasswordForm {
  password: string;
  confirm_password: string;
}

interface Toast {
  msg: string;
  type: "success" | "error" | "";
}

export default function EditProfilePage() {
  const [token, setToken] = useState<string>("");
  const [nameData, setNameData] = useState<NameForm>({ first_name: "", last_name: "" });
  const [passData, setPassData] = useState<PasswordForm>({ password: "", confirm_password: "" });
  const [nameLoading, setNameLoading] = useState<boolean>(false);
  const [passLoading, setPassLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>({ msg: "", type: "" });
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // ── Load token & user from localStorage ──
  useEffect(() => {
    const storedToken = localStorage.getItem("zoiko_token") || "";
    const storedUser = localStorage.getItem("zoiko_user");

    setToken(storedToken);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setNameData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
        });
        setUsername(user.username || "");
        setEmail(user.email || "");
      } catch {
        console.error("Failed to parse zoiko_user");
      }
    }
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Update name ──
  const updateName = async () => {
    if (!nameData.first_name && !nameData.last_name) {
      showToast("Please enter first name or last name.", "error");
      return;
    }
    setNameLoading(true);
    try {
      const res = await fetch(UPDATE_PROFILE_URL, {
        method: "PUT",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nameData),
      });
      const data = await res.json();
      if (res.ok) {
        const storedUser = localStorage.getItem("zoiko_user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          localStorage.setItem("zoiko_user", JSON.stringify({ ...user, ...nameData }));
        }
        showToast("Name updated successfully.", "success");
      } else {
        const err = Object.values(data).flat().join(" ");
        showToast((err as string) || "Something went wrong.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setNameLoading(false);
  };

  // ── Update password ──
  const updatePassword = async () => {
    if (!passData.password || !passData.confirm_password) {
      showToast("Please fill in both password fields.", "error");
      return;
    }
    if (passData.password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (passData.password !== passData.confirm_password) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch(CHANGE_PASSWORD_URL, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passData),
      });
      const data = await res.json();
      if (res.ok) {
        // Backend rotates the token after a password change — keep our session valid.
        if (data.token) {
          localStorage.setItem("zoiko_token", data.token);
          setToken(data.token);
        }
        showToast("Password updated successfully.", "success");
        setPassData({ password: "", confirm_password: "" });
      } else {
        const err = Object.values(data).flat().join(" ");
        showToast((err as string) || "Something went wrong.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setPassLoading(false);
  };

  // ── Not logged in ──
  if (!token) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              You are not logged in. Please log in first.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold dark:bg-gray-900 dark:text-white">Edit Profile</h4>
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

          {/* Account Info Card (read-only) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h5 className="font-semibold text-base mb-4">Account Info</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-xs md:text-sm lg:text-base mb-1 dark:bg-gray-900 dark:text-white">User Name</p>
                <p className="text-sm font-medium">{nameData.first_name || "—"}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs md:text-sm lg:text-base mb-1 dark:bg-gray-900 dark:text-white">Email</p>
                <p className="text-sm font-medium">{email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white dark:bg-gray-900 dark:text-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaUser />
              </div>
              <h5 className="font-semibold text-base">Personal Info</h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm dark:bg-gray-900 dark:text-white text-gray-500 mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={nameData.first_name}
                  onChange={(e) => setNameData({ ...nameData, first_name: e.target.value })}
                  className="w-full h-10 px-3 border dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm dark:bg-gray-900 dark:text-white text-gray-500  mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={nameData.last_name}
                  onChange={(e) => setNameData({ ...nameData, last_name: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={updateName}
                disabled={nameLoading}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {nameLoading ? "Saving..." : "Save Name"}
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaLock />
              </div>
              <h5 className="font-semibold text-base">Change Password</h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={passData.password}
                  onChange={(e) => setPassData({ ...passData, password: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={passData.confirm_password}
                  onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
            </div>

            {/* Password strength hint */}
            {passData.password && (
              <p className={`text-xs mb-4 ${
                passData.password.length >= 8 ? "text-green-600" : "text-red-500"
              }`}>
                {passData.password.length >= 8
                  ? "✓ Password length is good"
                  : `✗ Need ${8 - passData.password.length} more character(s)`}
              </p>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={updatePassword}
                disabled={passLoading}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {passLoading ? "Updating..." : "Update Password"}
              </button>
              <button
                onClick={() => setPassData({ password: "", confirm_password: "" })}
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
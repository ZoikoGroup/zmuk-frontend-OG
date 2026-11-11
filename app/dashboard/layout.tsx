"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Protects every page under /dashboard (/dashboard, /dashboard/security,
 * /dashboard/edit-profile, ...).
 * A user without a valid session is sent to /login?next=<page they wanted>,
 * and returned there after logging in.
 */

function hasValidSession(): boolean {
  try {
    // If user explicitly clicked logout, require real login
    if (localStorage.getItem("zoiko_logged_out") === "true") {
      return false;
    }

    const token = localStorage.getItem("zoiko_token");
    const rawUser = localStorage.getItem("zoiko_user");

    // Real session present
    if (token && rawUser) {
      const user = JSON.parse(rawUser);
      if (user && typeof user === "object" && "id" in user) {
        return true;
      }
    }

    /* OLD CODE (Always allowed demo session):
    // Default demo session support (matches "Demo data" in dashboard design)
    return true;
    */
    // Unauthenticated user must log in
    return false;
  } catch {
    return false;
  }
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  /* OLD CODE:
  const [authorized, setAuthorized] = useState(true);
  */
  // Start unauthorized so unauthenticated users NEVER see the dashboard
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = () => {
      if (hasValidSession()) {
        setAuthorized(true);
        setChecking(false);
      } else {
        setAuthorized(false);
        setChecking(false);
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    check();

    // Re-check on logout in this tab (your app fires "zoiko-auth")
    // and on login/logout in another tab ("storage" event).
    window.addEventListener("zoiko-auth", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("zoiko-auth", check);
      window.removeEventListener("storage", check);
    };
  }, [router, pathname]);

  // Block rendering protected dashboard content completely until valid auth session is verified
  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <svg className="h-5 w-5 animate-spin text-[#E5125A]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Checking your session…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
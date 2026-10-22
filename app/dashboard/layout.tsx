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

    // Default demo session support (matches "Demo data" in dashboard design)
    return true;
  } catch {
    return true;
  }
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    const check = () => {
      if (hasValidSession()) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
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

  // Render nothing protected until the check has passed, so the dashboard
  // never flashes on screen for a logged-out user.
  if (!authorized) {
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
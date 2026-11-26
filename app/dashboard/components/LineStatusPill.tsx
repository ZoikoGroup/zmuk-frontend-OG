"use client";

import React from "react";

/**
 * One shared status label for a mobile line, used next to the number on every dashboard page.
 * It accepts any wording the pages use (backend values like "pending_activation", or labels like
 * "Pending", "Setting up", "Inactive") and turns it into one of:
 * Active · Waiting for activation · Waiting for porting · Order in progress · Paused · Ended.
 */
export function normalizeLineStatus(raw?: string | null): string {
  const v = (raw || "").trim().toLowerCase().replace(/_/g, " ");
  if (!v) return "";
  if (v === "active") return "Active";
  if (v === "pending activation" || v === "pending" || v === "setting up" || v === "draft" || v === "waiting for activation")
    return "Waiting for activation";
  if (v === "waiting for porting") return "Waiting for porting";
  if (v === "order in progress") return "Order in progress";
  if (v === "suspended" || v === "paused") return "Paused";
  if (v === "terminated" || v === "cancelled" || v === "closed" || v === "inactive" || v === "ended") return "Ended";
  return raw ? String(raw) : "";
}

function pillClass(label: string): string {
  switch (label) {
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Waiting for activation":
    case "Waiting for porting":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Order in progress":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Paused":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

export function StatusPill({ status }: { status?: string | null }) {
  const label = normalizeLineStatus(status);
  if (!label) return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap align-middle ${pillClass(label)}`}
    >
      {label}
    </span>
  );
}

export default StatusPill;

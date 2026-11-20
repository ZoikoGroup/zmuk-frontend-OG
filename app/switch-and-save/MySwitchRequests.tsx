"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import {
  fetchMySwitchRequests,
  fetchSwitchStatus,
  type SwitchStatus,
} from "./switchApi";

/**
 * "Your switch requests" for signed-in customers (GET /api/switch-requests/mine/)
 * plus a reference + email lookup for guests (GET /by-reference/<ref>/?email=).
 * Opening a request hands the status to the page, which shows it on the tracking step.
 */
export default function MySwitchRequests({
  onOpen,
}: {
  onOpen: (status: SwitchStatus, email?: string) => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<SwitchStatus[]>([]);
  const [mineError, setMineError] = useState<string | null>(null);

  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("zoiko_token") || localStorage.getItem("access_token");
    if (!token) return;
    setSignedIn(true);
    let alive = true;
    setLoading(true);
    fetchMySwitchRequests()
      .then((list) => {
        if (alive) setMine(list);
      })
      .catch((err: unknown) => {
        // 401 = token expired; just fall back to the lookup form.
        if (!alive) return;
        const status = (err as { status?: number })?.status;
        if (status === 401) setSignedIn(false);
        else setMineError(err instanceof Error ? err.message : "We couldn’t load your requests.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleLookup = async () => {
    const reference = ref.trim().toUpperCase();
    if (!reference || !email.trim()) {
      setLookupError("Enter your reference and the email you used.");
      return;
    }
    setLooking(true);
    setLookupError(null);
    try {
      const st = await fetchSwitchStatus(reference, email.trim());
      onOpen(st, email.trim());
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "We couldn’t check your request right now.");
    } finally {
      setLooking(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-pink-50 text-[#E01C5B] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#0D1935]">
              {signedIn ? "Your switch requests" : "Already sent a switch request?"}
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              {signedIn
                ? loading
                  ? "Loading…"
                  : mine.length > 0
                  ? `${mine.length} request${mine.length === 1 ? "" : "s"} on your account`
                  : "Track a request you’ve already made."
                : "Check where it is with your reference and email."}
            </span>
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-slate-100 pt-4">
          {signedIn && (
            <div className="space-y-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin text-[#E01C5B]" />}
              {mineError && <p className="text-xs text-red-600">{mineError}</p>}
              {!loading && !mineError && mine.length === 0 && (
                <p className="text-xs text-slate-500">You don’t have any switch requests on this account yet.</p>
              )}
              {mine.map((r) => (
                <button
                  key={r.reference}
                  type="button"
                  onClick={() => onOpen(r)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#E01C5B] text-left transition cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold font-mono text-[#0D1935]">{r.reference}</span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {r.plan?.name ? `${r.plan.name} · ` : ""}
                      {fmt(r.created_at)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.status === "action_needed" || r.status === "rejected"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-[#027A48] border-emerald-200"
                    }`}
                  >
                    {r.status_label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Guests (and anyone with a reference from an email) */}
          <div className="space-y-2.5">
            {signedIn && <p className="text-xs font-bold text-slate-700">Or look one up</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={ref}
                onChange={(e) => {
                  setRef(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                placeholder="Reference e.g. ZM-SW-7K3F9Q2X"
                className="px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono uppercase"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                placeholder="Email you used"
                className="px-3.5 py-2 text-sm rounded-xl border border-slate-300"
              />
            </div>
            {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}
            <button
              type="button"
              disabled={looking}
              onClick={handleLookup}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
            >
              {looking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Check status</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Clock,
  Check,
  CheckCircle2,
  Copy,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  QrCode,
  Smartphone,
  Cpu,
  Package,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from "lucide-react";
import {
  SimOrder,
  SimDetail,
  formatUkDateTime,
  maskIccid4,
} from "../../services/simOrderHistoryApi";

interface SimOrderHistoryProps {
  orders: SimOrder[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenComparePlans?: () => void;
}

function formatUkNumber(mdn?: string | number): string {
  if (!mdn) return "Number pending";
  let s = String(mdn).replace(/\D/g, "");
  if (s.startsWith("44")) s = "0" + s.slice(2);
  if (s.length === 10 && !s.startsWith("0")) s = "0" + s;
  if (s.length === 11 && s.startsWith("0")) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return String(mdn);
}

export default function SimOrderHistoryCard({
  orders,
  isLoading,
  error,
  onRetry,
  onOpenComparePlans,
}: SimOrderHistoryProps) {
  // Modal for showing eSIM QR Code
  const [selectedEsim, setSelectedEsim] = useState<{
    sim: SimDetail;
    orderRef: string;
  } | null>(null);

  // Toggle for revealing LPA string in modal (hidden by default)
  const [revealCode, setRevealCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Accordion toggle for order SIM details
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleOrderExpand = (orderRef: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderRef]: prev[orderRef] === undefined ? false : !prev[orderRef],
    }));
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div
      id="order-history"
      className="p-5 sm:p-6 bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E5E8EF] flex flex-col justify-start"
    >
      {/* Header */}
      <div className="pb-4 border-b border-[#F1F3F7] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FAF1F4] rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#E01C5B]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0D1935] leading-6">
              SIM &amp; eSIM order history
            </h2>
            <p className="text-xs text-[#5E6E8C] leading-5">
              Confirmed orders on your account · Newest first
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isLoading}
          className="h-8.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          title="Refresh orders"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#E01C5B]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── STATE 1: LOADING (Skeleton cards) ── */}
      {isLoading && (
        <div className="pt-4 space-y-4 animate-pulse">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-3 w-48 bg-slate-200 rounded" />
            <div className="h-20 bg-white rounded-xl border border-slate-100" />
          </div>
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-3 w-40 bg-slate-200 rounded" />
          </div>
        </div>
      )}

      {/* ── STATE 2: ERROR ── */}
      {!isLoading && error && (
        <div className="my-4 p-4 rounded-2xl bg-red-50/70 border border-red-200/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-900">Unable to load SIM orders</h4>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              We couldn&apos;t reach the order service right now. Please verify your connection or try again.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 3: EMPTY (No orders) ── */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-[#FAF1F4] rounded-3xl flex items-center justify-center text-[#E01C5B] mb-3">
            <Package className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-[#0D1935]">No SIM orders yet</h3>
          <p className="text-xs text-[#5E6E8C] max-w-sm mt-1 leading-5">
            You don&apos;t have any confirmed SIM or eSIM orders on this account yet. When you order a line, it will appear here with live setup instructions.
          </p>
          {onOpenComparePlans && (
            <button
              type="button"
              onClick={onOpenComparePlans}
              className="mt-4 px-4 py-2 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              Compare plans &amp; order &rarr;
            </button>
          )}
        </div>
      )}

      {/* ── STATE 4: ORDERS LIST ── */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="pt-4 space-y-4">
          {orders.map((ord) => {
            const isExpanded = expandedOrders[ord.order_reference] !== false; // expanded by default
            const simCount = Array.isArray(ord.sims) ? ord.sims.length : 0;

            // Status badge styling
            let statusBadge = (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {ord.status_label || ord.status}
              </span>
            );
            const st = (ord.status || "").toLowerCase();
            if (st === "completed") {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F6EE] text-[#15803D] border border-[#A6F4C5] flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>{ord.status_label || "Completed"}</span>
                </span>
              );
            } else if (st === "received") {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{ord.status_label || "Received"}</span>
                </span>
              );
            } else if (st === "partial") {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{ord.status_label || "Partial"}</span>
                </span>
              );
            } else if (st === "failed") {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{ord.status_label || "Failed"}</span>
                </span>
              );
            }

            return (
              <div
                key={ord.order_reference}
                className="rounded-2xl border border-[#E5E8EF] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#E01C5B]/30 transition"
              >
                {/* Order Summary Row */}
                <div className="flex items-start justify-between gap-3 flex-wrap pb-3.5 border-b border-[#F1F3F7]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-extrabold text-[#0D1935] tracking-tight">
                        {ord.order_reference}
                      </span>
                      {statusBadge}
                      <span className="text-xs text-[#5E6E8C]">
                        · {simCount} {simCount === 1 ? "SIM" : "SIMs"}
                      </span>
                    </div>
                    <div className="text-xs text-[#5E6E8C] mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>Ordered:</span>
                      <strong className="text-[#0D1935] font-semibold">
                        {formatUkDateTime(ord.placed_at)}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleOrderExpand(ord.order_reference)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition"
                    title={isExpanded ? "Collapse details" : "Expand details"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Items in this order */}
                {Array.isArray(ord.items) && ord.items.length > 0 && (
                  <div className="pt-3 flex items-center gap-2 flex-wrap">
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF1F4] border border-[#F5C2D3]/60 text-xs text-[#B8144A] font-medium"
                      >
                        <Sparkles className="w-3 h-3 text-[#E01C5B] shrink-0" />
                        <span>{it.name}</span>
                        {it.data_allowance && (
                          <span className="text-slate-500 font-normal">({it.data_allowance})</span>
                        )}
                        {it.quantity > 1 && (
                          <span className="font-bold text-[#E01C5B]">×{it.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SIMs Detail Container (Expandable) */}
                {isExpanded && Array.isArray(ord.sims) && ord.sims.length > 0 && (
                  <div className="mt-3.5 space-y-3 pt-1">
                    {ord.sims.map((sim, sIdx) => {
                      const isEsim =
                        sim.sim_type?.toLowerCase() === "esim" ||
                        Boolean(sim.esim);
                      const msisdnDisplay = formatUkNumber(sim.msisdn);
                      const isQrReady = Boolean(sim.esim && sim.esim.ready);

                      return (
                        <div
                          key={sim.iccid || sIdx}
                          className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            {/* SIM Identity */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-[#0D1935]">
                                {isEsim ? (
                                  <Smartphone className="w-4 h-4 text-[#E01C5B]" />
                                ) : (
                                  <Cpu className="w-4 h-4 text-[#0D1935]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-bold text-[#0D1935] flex items-center gap-2">
                                  <span>{msisdnDisplay}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase ${
                                      isEsim
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-slate-200 text-slate-800"
                                    }`}
                                  >
                                    {isEsim ? "eSIM" : "Physical SIM"}
                                  </span>
                                </div>
                                <div className="text-xs text-[#5E6E8C] mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span>ICCID:</span>
                                  <span className="font-mono text-[#0D1935]">
                                    {maskIccid4(sim.iccid)}
                                  </span>
                                  {sim.network_status && (
                                    <>
                                      <span>·</span>
                                      <span className="font-medium text-emerald-700">
                                        {sim.network_status}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* eSIM QR Code Button (Only if esim.ready === true) */}
                            {isEsim && isQrReady && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedEsim({
                                    sim,
                                    orderRef: ord.order_reference,
                                  })
                                }
                                className="h-8.5 px-3 bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Show QR code</span>
                              </button>
                            )}
                          </div>

                          {/* SIM Events Timeline (if available) */}
                          {Array.isArray(sim.events) && sim.events.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60 mt-1">
                              <div className="text-[11px] font-bold text-[#5E6E8C] uppercase tracking-wider mb-2">
                                Provisioning history
                              </div>
                              <div className="space-y-2">
                                {sim.events.map((ev, evIdx) => (
                                  <div
                                    key={evIdx}
                                    className="flex items-center gap-2.5 text-xs text-[#3B4A68]"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="font-medium text-[#0D1935]">{ev.label}</span>
                                    <span className="text-[#8B99B5]">·</span>
                                    <span className="text-[#5E6E8C]">
                                      {formatUkDateTime(ev.at)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── eSIM QR CODE MODAL ── */}
      {selectedEsim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF1F4] flex items-center justify-center text-[#E01C5B]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D1935]">eSIM activation</h3>
                  <p className="text-xs text-[#5E6E8C]">
                    Order {selectedEsim.orderRef} · {formatUkNumber(selectedEsim.sim.msisdn)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEsim(null);
                  setRevealCode(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* QR Image Box */}
              {selectedEsim.sim.esim?.qr_image_url ? (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="relative w-52 h-52 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <img
                      src={selectedEsim.sim.esim.qr_image_url}
                      alt="Zoiko eSIM QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#0D1935] mt-3">
                    Scan with your device camera
                  </p>
                  <p className="text-[11px] text-[#5E6E8C] text-center max-w-xs mt-0.5">
                    Connect your phone to Wi-Fi, go to Settings &rarr; Mobile Service &rarr; Add eSIM.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 text-center">
                  QR image is being prepared by the network. Use manual setup below or check your email.
                </div>
              )}

              {/* Manual Activation Code (Hidden by default for safety) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0D1935]">Activation details</span>
                  <button
                    type="button"
                    onClick={() => setRevealCode(!revealCode)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                  >
                    {revealCode ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide code</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reveal code</span>
                      </>
                    )}
                  </button>
                </div>

                {selectedEsim.sim.esim?.smdp_address && (
                  <div>
                    <div className="text-[11px] text-[#5E6E8C]">SM-DP+ Address:</div>
                    <div className="font-mono text-[#0D1935] font-medium break-all">
                      {selectedEsim.sim.esim.smdp_address}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] text-[#5E6E8C]">LPA / Activation Code:</div>
                  <div className="font-mono text-[#0D1935] font-medium break-all mt-0.5">
                    {revealCode
                      ? selectedEsim.sim.esim?.activation_code ||
                        selectedEsim.sim.esim?.lpa ||
                        "Available in confirmation email"
                      : "••••••••••••••••••••••••••••••••"}
                  </div>
                </div>

                {/* Copy button */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedEsim.sim.esim?.activation_code ||
                          selectedEsim.sim.esim?.lpa ||
                          "",
                        "esim-lpa"
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-[#0D1935] hover:bg-slate-100 transition cursor-pointer"
                  >
                    {copiedKey === "esim-lpa" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy LPA code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions summary */}
              <div className="text-[11px] text-[#5E6E8C] space-y-1">
                <p>
                  <strong>iPhone:</strong> Settings &rarr; Mobile Service &rarr; Add eSIM &rarr; Use QR Code.
                </p>
                <p>
                  <strong>Android:</strong> Settings &rarr; Connections &rarr; SIM Manager &rarr; Add eSIM.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedEsim(null);
                  setRevealCode(false);
                }}
                className="px-4 py-2 bg-[#0D1935] hover:bg-[#1E2D4D] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

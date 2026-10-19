"use client";

import React, { useState } from "react";
import {
  Receipt,
  ChevronRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  Sliders,
  Download,
  ArrowUpDown,
  Check,
} from "lucide-react";

export interface BillItem {
  id: string;
  billDate: string;
  subNote?: string;
  period: string;
  amount: number;
  status: "Settled" | "Refunded" | "Pending";
}

interface BillsPaymentsCardProps {
  bills?: BillItem[];
  linesCount?: number;
  outstandingBalance?: number;
  monthlyPlanCharges?: number;
  monthlyBreakdownNote?: string;
  nextCollectionAmount?: number;
  nextCollectionDate?: string;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  paymentMethod?: string;
  paymentMethodNote?: string;
  mobileBillLimit?: string;
  mobileBillLimitNote?: string;
  hasMandate?: boolean;
  isLoading?: boolean;
  onManagePaymentMethod?: () => void;
  onManageBillLimit?: () => void;
  onViewAllBills?: () => void;
  onDownloadBill?: (billId: string) => void;
}

export default function BillsPaymentsCard({
  bills,
  linesCount = 1,
  outstandingBalance = 0,
  monthlyPlanCharges,
  monthlyBreakdownNote,
  nextCollectionAmount = 0,
  nextCollectionDate = "—",
  lastPaymentAmount = 0,
  lastPaymentDate = "—",
  paymentMethod = "No payment method",
  paymentMethodNote = "linked yet",
  mobileBillLimit = "£0.00",
  mobileBillLimitNote = "· Set a spend limit",
  hasMandate = false,
  isLoading = false,
  onManagePaymentMethod,
  onManageBillLimit,
  onViewAllBills,
  onDownloadBill,
}: BillsPaymentsCardProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const activeBills = bills || [];

  const sortedBills = [...activeBills].sort((a, b) =>
    sortAsc ? a.amount - b.amount : b.amount - a.amount
  );

  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(sortedBills.length / itemsPerPage));
  const displayedBills = sortedBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownload = (id: string, date: string) => {
    if (onDownloadBill) {
      onDownloadBill(id);
    } else {
      setDownloadSuccess(`Downloaded invoice for ${date}`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  const calculatedMonthly = monthlyPlanCharges !== undefined ? monthlyPlanCharges : nextCollectionAmount;

  return (
    <div
      id="bills-section"
      className="w-full rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 text-[#E01C5B]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
              Bills &amp; payments
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Account-wide charges for {linesCount} {linesCount === 1 ? "line" : "lines"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAllBills || (() => window.location.assign("/dashboard/orders"))}
          className="text-xs font-semibold text-[#E01C5B] hover:text-[#c9144e] flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          <span>View all bills</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {downloadSuccess && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Main 2-Column Interior */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left Column: Balances & Settings */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Outstanding Balance Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-end justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Outstanding balance
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0D1935] mt-1">
                £{outstandingBalance.toFixed(2)}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {outstandingBalance === 0 ? "Nothing to pay right now" : "Payment required"}
              </span>
            </div>
            <div className={`px-2.5 py-1 rounded-full font-semibold text-xs flex items-center gap-1 border ${
              outstandingBalance === 0
                ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}>
              {outstandingBalance === 0 ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Up to date</span>
                </>
              ) : (
                <span>Action needed</span>
              )}
            </div>
          </div>

          {/* Details Rows */}
          <div className="flex flex-col divide-y divide-slate-100 text-xs">
            {/* Monthly Plan charges */}
            <div className="py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Receipt className="w-4 h-4 text-[#0D1935]" />
              </div>
              <div className="flex-1">
                <div className="text-slate-500">Monthly plan charges</div>
                <div className="text-sm font-bold text-[#0D1935] mt-0.5">
                  £{calculatedMonthly.toFixed(2)}{" "}
                  <span className="font-normal text-slate-500 text-xs">
                    {monthlyBreakdownNote ? `/ month · ${monthlyBreakdownNote}` : "/ month"}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Collection */}
            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="text-slate-500">Next collection</div>
                  <div className="text-sm font-bold text-[#0D1935] mt-0.5">
                    £{nextCollectionAmount.toFixed(2)}{" "}
                    <span className="font-normal text-slate-500 text-xs">
                      on {nextCollectionDate} · {paymentMethod}
                    </span>
                  </div>
                </div>
              </div>
              {hasMandate && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-200/60">
                  Mandate active
                </span>
              )}
            </div>

            {/* Last payment */}
            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="text-slate-500">Last payment</div>
                  <div className="text-sm font-bold text-[#0D1935] mt-0.5">
                    £{lastPaymentAmount.toFixed(2)}{" "}
                    <span className="font-normal text-slate-500 text-xs">
                      {lastPaymentAmount > 0 ? `on ${lastPaymentDate}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
              {lastPaymentAmount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-200/60 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Settled</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  None
                </span>
              )}
            </div>

            {/* Payment method */}
            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="text-slate-500">Payment method</div>
                  <div className="text-sm font-bold text-[#0D1935] mt-0.5">
                    {paymentMethod}{" "}
                    <span className="font-normal text-slate-500 text-xs">
                      {paymentMethodNote}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onManagePaymentMethod || (() => window.location.assign("/dashboard/billing-payment/current"))}
                className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {/* Mobile bill limit */}
            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sliders className="w-4 h-4 text-[#0D1935]" />
                </div>
                <div>
                  <div className="text-slate-500">Mobile bill limit</div>
                  <div className="text-sm font-bold text-[#0D1935] mt-0.5">
                    {mobileBillLimit}{" "}
                    <span className="font-normal text-slate-500 text-xs">
                      {mobileBillLimitNote}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onManageBillLimit || (() => window.location.assign("/dashboard/billing-payment/current"))}
                className="text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Bills Table */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h4 className="text-sm font-bold text-[#0D1935]">Bills</h4>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Generated monthly on the 28th
              </span>
            </div>

            {sortedBills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[240px] bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-2.5 shadow-xs">
                  <Receipt className="w-6 h-6 text-slate-400" />
                </div>
                <h5 className="text-sm font-bold text-[#0D1935]">No bills or statements yet</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Your monthly billing statements and itemised VAT receipts will be automatically generated and listed here.
                </p>
                <div className="mt-4">
                  <a
                    href="/30-day-plan"
                    className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white font-semibold text-xs hover:bg-[#c9144e] transition cursor-pointer shadow-xs inline-block"
                  >
                    Browse Plans
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3.5">
                            <button
                              type="button"
                              onClick={() => setSortAsc(!sortAsc)}
                              className="flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                            >
                              <span>Bill date</span>
                              <ArrowUpDown className="w-3 h-3 text-[#E01C5B]" />
                            </button>
                          </th>
                          <th className="py-3 px-3.5">Period</th>
                          <th className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSortAsc(!sortAsc)}
                              className="inline-flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                            >
                              <span>Amount</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </th>
                          <th className="py-3 px-3.5">Payment</th>
                          <th className="py-3 px-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedBills.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-3.5 font-bold text-[#0D1935]">
                              <div>{b.billDate}</div>
                              {b.subNote && (
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {b.subNote}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-600 font-normal">
                              {b.period}
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-bold text-[#0D1935]">
                              £{b.amount.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-3.5">
                              {b.status === "Settled" ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-200/60 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Settled</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-200/60">
                                  Refunded
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDownload(b.id, b.billDate)}
                                title="Download invoice PDF"
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center justify-center transition cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-[#0D1935]" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {sortedBills.length > itemsPerPage && (
                  <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Showing {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(currentPage * itemsPerPage, sortedBills.length)} of{" "}
                      {sortedBills.length} bills
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                      >
                        &lt;
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                            currentPage === idx + 1
                              ? "bg-[#0D1935] text-white"
                              : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Headphones, BookOpen, MessageSquare, Ticket } from "lucide-react";

export default function SupportBanner() {
  return (
    <div className="w-full rounded-[20px] bg-white p-5 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Icon + Content */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-6 h-6 text-[#E01C5B]" />
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-bold text-[#0D1935]">
            Need a hand?
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Find answers, raise a support ticket, or contact our UK support team.
          </p>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <Link
          href="/help-support"
          className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D1935] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span>Help articles</span>
        </Link>
        <Link
          href="/dashboard/support"
          className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D1935] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Ticket className="w-4 h-4 text-slate-600" />
          <span>Support tickets</span>
        </Link>
        <Link
          href="/contact-us"
          className="h-10 px-4 rounded-xl bg-white border border-[#E01C5B] text-[#E01C5B] hover:bg-pink-50 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-4 h-4 text-[#E01C5B]" />
          <span>Contact support</span>
        </Link>
      </div>
    </div>
  );
}

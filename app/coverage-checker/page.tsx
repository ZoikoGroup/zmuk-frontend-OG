"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, Radio } from "lucide-react";

export default function CoverageCheckerPage() {
  useEffect(() => {
    // Redirect to EE network coverage checker powered by Zoiko Mobile
    window.location.href = "https://ee.co.uk/help/mobile-coverage-checker";
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[#E01C5B] flex items-center justify-center mb-6">
        <Radio className="w-8 h-8 animate-pulse" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Redirecting to Coverage Checker...</h1>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        Zoiko Mobile operates on the UK&apos;s No.1 network. We are redirecting you to the live UK coverage map.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://ee.co.uk/help/mobile-coverage-checker"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-full bg-[#E01C5B] text-white font-bold text-sm hover:bg-[#c0154c] transition flex items-center justify-center gap-2"
        >
          <span>Open Coverage Map</span>
          <ExternalLink className="w-4 h-4" />
        </a>
        <Link
          href="/switch-and-save"
          className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Switch &amp; Save</span>
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Roaming from "./Roaming";

export const metadata: Metadata = {
  title: "Roaming & Overage Rates | Roaming & Calls | Zoiko Mobile UK",
  description:
    "Check charges, allowances and passes for any destination, with clear and transparent rates.",
};

export default function page() {
  return (
    <Suspense fallback={<div className="min-h-screen py-20 text-center">Loading roaming rates...</div>}>
      <Roaming />
    </Suspense>
  );
}

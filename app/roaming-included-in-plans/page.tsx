import type { Metadata } from "next";
import { Suspense } from "react";
import RoamingIncluded from "./RoamingIncluded";

export const metadata: Metadata = {
  title: "Roaming Included in Your Plan | Roaming & Calls | Zoiko Mobile UK",
  description:
    "See what roaming data, calls and texts are included in your Zoiko Mobile UK plan before you travel.",
};

export default function page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-20 text-center">
          Loading roaming inclusions...
        </div>
      }
    >
      <RoamingIncluded />
    </Suspense>
  );
}

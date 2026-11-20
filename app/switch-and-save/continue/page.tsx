import { Suspense } from "react";
import type { Metadata } from "next";
import ContinueSwitch from "./ContinueSwitch";

export const metadata: Metadata = {
  title: "Continue your switch | Zoiko Mobile",
  robots: { index: false, follow: false },
};

export default function ContinueSwitchPage() {
  return (
    <Suspense fallback={null}>
      <ContinueSwitch />
    </Suspense>
  );
}

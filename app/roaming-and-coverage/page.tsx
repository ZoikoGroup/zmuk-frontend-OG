import { Suspense } from "react";
import Roaming from "./Roaming";

export default function page() {
  return (
    <Suspense fallback={<div className="min-h-screen py-20 text-center">Loading roaming rates...</div>}>
      <Roaming />
    </Suspense>
  );
}

import type { Metadata } from "next";
import EsimSetupGuidance from "./EsimSetupGuidance";

export const metadata: Metadata = {
  title: "eSIM Setup Guidance | Zoiko Mobile UK",
  description:
    "A simple, step-by-step guide to installing, activating and managing your Zoiko Mobile eSIM.",
};

export default function EsimSetupGuidancePage() {
  return <EsimSetupGuidance />;
}

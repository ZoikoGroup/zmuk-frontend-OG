import type { Metadata } from "next";
import RoamingHelp from "./RoamingHelp";

export const metadata: Metadata = {
  title: "Roaming Help & Troubleshooting | Zoiko Mobile UK",
  description:
    "Step-by-step roaming troubleshooter, iPhone & Android setup guidance, travel warnings, and pre-travel checklist for Zoiko Mobile UK.",
};

export default function RoamingHelpPage() {
  return <RoamingHelp />;
}

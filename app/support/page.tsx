import type { Metadata } from "next";
import { SupportHub } from "./SupportHub";

export const metadata: Metadata = {
  title: "Support Hub | Zoiko Mobile UK",
  description:
    "Find answers, fix issues, manage your service and get the help you need — quickly and easily.",
};

export default function SupportPage() {
  return <SupportHub />;
}

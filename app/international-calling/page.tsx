import type { Metadata } from "next";
import Internationalcalls from "./Internationalcalls";

export const metadata: Metadata = {
  title: "International Calling Rates & Benefits | Zoiko Mobile UK",
  description:
    "Call friends, family and business contacts around the world from the UK. Check international rates for your Zoiko Mobile plan before you call.",
};

export default function InternationalCallingPage() {
  return <Internationalcalls />;
}

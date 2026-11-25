import type { Metadata } from "next";
import ReturnsRefundsRepairs from "./ReturnsRefundsRepairs";

export const metadata: Metadata = {
  title: "Returns, Refunds & Repairs | Zoiko Mobile UK",
  description:
    "A clear, simple way to return a device, get a refund, exchange or arrange a repair — with your UK consumer rights protected.",
};

export default function ReturnsRefundsRepairsPage() {
  return <ReturnsRefundsRepairs />;
}

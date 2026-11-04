import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Mobile Top-up Plans | Zoiko Mobile UK| Best Deals",
  description:
    "Looking for mobile top up plans? ZoiKo Mobile UK offers quick and the best deals for prepaid users. Stay connected with budget-friendly recharge solutions.",
  openGraph: {
    title: "Best Mobile Top-up Plans | Zoiko Mobile UK| Best Deals",
    description:
      "Looking for mobile top up plans? ZoiKo Mobile UK offers quick and the best deals for prepaid users. Stay connected with budget-friendly recharge solutions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Mobile Top-up Plans | Zoiko Mobile UK| Best Deals",
    description:
      "Looking for mobile top up plans? ZoiKo Mobile UK offers quick and the best deals for prepaid users. Stay connected with budget-friendly recharge solutions.",
  },
};

export default function RechargeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

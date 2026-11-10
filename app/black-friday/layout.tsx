import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Black Friday Sale & SIM Deals UK | Zoiko Mobile UK",
  description:
    "Save 30% with Zoiko Mobile’s Black Friday sale in the UK! Enjoy exclusive discounts on SIM-only plans and mobile deals. Shop now and save more.",
};

export default function BlackFridayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import SaverDealsPage from "./SaverDealsPage";
// Previous design kept for reference: import Saverdeals from "./Saverdeals";

export const metadata: Metadata = {
  title: "Zoiko Saver Deals | Zoiko Mobile",
  description:
    "Lower-cost mobile, broadband and digital phone plans for eligible customers, with clear prices and straightforward support.",
};

export default function page() {
  return (
    <>
      <SaverDealsPage />
      {/* <Saverdeals/> */}
    </>
  );
}

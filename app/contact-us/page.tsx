import type { Metadata } from "next";
import ContactUsPage from "./ContactUsPage";
// Previous design kept for reference: import ContactUs from "./ContactUs";

export const metadata: Metadata = {
  title: "Contact Us | Zoiko Mobile",
  description: "Get help with your SIM, plan, billing, roaming or business account. Chat, call or send us a message.",
};

export default function page() {
  return (
    <>
      <ContactUsPage />
      {/* <ContactUs/> */}
    </>
  );
}

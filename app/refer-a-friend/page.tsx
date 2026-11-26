import type { Metadata } from "next";
import Referafriend from "./Referafriend";

export const metadata: Metadata = {
  title: "Refer & Earn — Share Zoiko, Both Get £20 | Zoiko Mobile UK",
  description:
    "Invite a friend to join Zoiko Mobile UK and you could both receive £20 account credit when they activate an eligible plan.",
};

export default function ReferAFriendPage() {
  return <Referafriend />;
}

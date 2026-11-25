import type { Metadata } from "next";
import AnimalsAndMusic from "./Animalsandmusic";

export const metadata: Metadata = {
  title: "Animals & Music | Community & Rewards | Zoiko Mobile UK",
  description:
    "Watch, listen, learn and share heart-warming stories, music and moments from the animal world.",
};

export default function page() {
  return <AnimalsAndMusic />;
}

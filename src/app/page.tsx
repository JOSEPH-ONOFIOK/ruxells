import { Scene } from "@/components/checkpoint/Scene";

// The root layout already sets the title and the card for "/", so this page
// only narrows the description to what the room actually is.
export const metadata = {
  description:
    "One room, one guard, and a door behind him. Four steps and a wallet is the whole job.",
};

/**
 * The way in.
 *
 * A room you stand in rather than a page you scroll. The scrolling version
 * of the same story lives at /world, through the door the guard is holding.
 */
export default function Home() {
  return <Scene />;
}

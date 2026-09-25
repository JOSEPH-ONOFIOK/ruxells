import { Scene } from "@/components/checkpoint/Scene";

const DESCRIPTION =
  "One room, one guard, four things worth touching. The list is behind him.";

export const metadata = {
  title: "The checkpoint",
  description: DESCRIPTION,
  openGraph: {
    title: "The checkpoint · RUXXELLS",
    description: DESCRIPTION,
    url: "/checkpoint",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The checkpoint · RUXXELLS",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * A room you stand in rather than a page you scroll.
 *
 * It sits alongside the scrolling home page rather than replacing it: the
 * two answer the same question in different registers, and this one is the
 * version that rewards poking at things.
 */
export default function Checkpoint() {
  return <Scene />;
}

import { World } from "@/components/world/World";
import { countEntries } from "@/lib/allowlist-store";

const DESCRIPTION =
  "Four sectors, the collection, and the door. The long way round.";

export const metadata = {
  title: "The world",
  description: DESCRIPTION,
  openGraph: {
    title: "The world · RUXXELLS",
    description: DESCRIPTION,
    url: "/world",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The world · RUXXELLS",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * The world, at length.
 *
 * Everything the room at / gestures at, laid out to scroll: the banner, the
 * four sectors, the collection and the door. It renders on the server, so
 * the artwork and the copy are in the first response.
 *
 * The cleared count is read here so the page paints with a real figure
 * rather than counting up from a placeholder, and a store that is
 * unreachable degrades to no counter at all, never to a wrong one.
 */
async function clearedCount(): Promise<number | null> {
  try {
    return await countEntries();
  } catch {
    return null;
  }
}

export default async function WorldPage() {
  return <World cleared={await clearedCount()} />;
}

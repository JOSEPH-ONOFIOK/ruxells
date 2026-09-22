import { WorldStage } from "@/components/WorldStage";
import { countEntries } from "@/lib/allowlist-store";

/**
 * The map is the site.
 *
 * There is no scrolling page under it: the six rooms, the clock and the door
 * are all in one view, and the only navigation is flying between them. The
 * cleared count is read here on the server so the world paints with a real
 * figure rather than counting up from a placeholder — and a store that is
 * unreachable degrades to no counter at all, never to a wrong one.
 */
async function clearedCount(): Promise<number | null> {
  try {
    return await countEntries();
  } catch {
    return null;
  }
}

export default async function Home() {
  const cleared = await clearedCount();

  return (
    <main>
      <WorldStage cleared={cleared} />
    </main>
  );
}

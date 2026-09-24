import { World } from "@/components/world/World";
import { countEntries } from "@/lib/allowlist-store";

/**
 * The home page.
 *
 * It renders on the server now. The world used to be behind a `ssr: false`
 * dynamic import because WebGL cannot run there; with the 3D scene gone
 * there is nothing to defer, so the artwork and the copy are in the first
 * response rather than arriving after a JS chunk.
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

export default async function Home() {
  return <World cleared={await clearedCount()} />;
}

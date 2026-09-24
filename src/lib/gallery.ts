import { SECTORS } from "./sectors";

/**
 * Everything in the collection, as one list.
 *
 * The six rooms of the descent and the eighteen frames that didn't make it,
 * flattened so the gallery has a single thing to map over. The rooms keep
 * their names because they are named elsewhere on the site and it would read
 * as an oversight if the gallery called them "Frame 03"; the rest are
 * numbered, because inventing eighteen names for artwork nobody has written
 * a story for yet would be inventing lore, not describing it.
 */

export type Piece = {
  id: string;
  src: string;
  /** Square source, so the grid never has to guess an aspect ratio. */
  width: number;
  height: number;
  label: string;
  /** Named rooms carry their sector colour; loose frames stay neutral. */
  tint?: string;
  /** True for the rooms that appear in the sectors section. */
  featured: boolean;
  /**
   * The animated version, where one exists.
   *
   * Only three of the eighteen loose frames were ever animated — the rest
   * are stills in the source too — so the gallery mixes moving and still
   * pieces by necessity rather than choice.
   */
  gif?: string;
};

const ROOMS: Piece[] = SECTORS.map((sector) => ({
  id: sector.id,
  // The poster frame rather than the animation: a grid of twenty-two moving
  // GIFs is several megabytes and a lot of motion at once.
  src: sector.still,
  width: 480,
  height: 480,
  label: sector.name,
  tint: sector.tint,
  featured: true,
  gif: sector.gif,
}));

/** The loose frames with an animated source, built by `scripts/room-gifs.py`. */
const LIVE_FRAMES = new Set(["02", "05", "15"]);

const FRAMES: Piece[] = Array.from({ length: 18 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `frame-${n}`,
    src: `/recon/${n}.jpeg`,
    width: 1600,
    height: 1600,
    label: `Frame ${n}`,
    featured: false,
    gif: LIVE_FRAMES.has(n) ? `/recon-live/${n}.gif` : undefined,
  };
});

/** Rooms first: they are the ones the site has already introduced. */
export const PIECES: Piece[] = [...ROOMS, ...FRAMES];

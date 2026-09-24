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
  /** True for the six that appear in the descent. */
  featured: boolean;
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
}));

const FRAMES: Piece[] = Array.from({ length: 18 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `frame-${n}`,
    src: `/recon/${n}.jpeg`,
    width: 1600,
    height: 1600,
    label: `Frame ${n}`,
    featured: false,
  };
});

/** Rooms first: they are the ones the site has already introduced. */
export const PIECES: Piece[] = [...ROOMS, ...FRAMES];

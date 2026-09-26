import { SECTORS } from "./sectors";

/**
 * Everything in the collection, as one list.
 *
 * The four rooms and the eighteen frames beside them, flattened so the
 * gallery has a single thing to map over. The rooms keep their names because
 * they are named elsewhere on the site; the rest carry a token number, which
 * is what a piece in a collection is actually identified by and reads as a
 * catalogue rather than a folder listing.
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

/**
 * The order the frames are shown in.
 *
 * Not 01..18. Half the set is ice — nine of eighteen — and in file order
 * they arrived in blocks, so a row read as the same blue room four times.
 * Sorting by overall similarity did not fix it either: what registers from
 * across a page is the colour of the backdrop the artist painted, not how
 * alike two rooms are.
 *
 * So each frame is classified by the hue of its corners — ice, fire, sand,
 * green, violet, void — and the list is built by repeatedly taking whichever
 * faction has the most left that is not the one just placed. With ice at
 * half the set it has to appear every other slot, and it does: no two
 * neighbours share a faction anywhere in the eighteen.
 */
const FRAME_ORDER = [
  "03", "01", "05", "04", "07", "06", "08", "13", "09",
  "12", "10", "02", "14", "17", "15", "11", "16", "18",
];

const FRAMES: Piece[] = FRAME_ORDER.map((n) => {
  return {
    id: `frame-${n}`,
    src: `/recon/${n}.jpeg`,
    width: 1600,
    height: 1600,
    label: `#${n.padStart(4, "0")}`,
    featured: false,
    gif: LIVE_FRAMES.has(n) ? `/recon-live/${n}.gif` : undefined,
  };
});

/** Rooms first: they are the ones the site has already introduced. */
export const PIECES: Piece[] = [...ROOMS, ...FRAMES];

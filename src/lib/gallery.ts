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
 * Not 01..18: several of these are near-identical — two ice rooms, two lava
 * fields — and in file order they landed side by side, which reads as the
 * same picture printed twice. Ordered by repeatedly taking whichever frame
 * looks least like the one before it, which pushes the closest pair from a
 * difference of 8 to 29.
 */
const FRAME_ORDER = [
  "01", "10", "12", "15", "04", "16", "11", "09", "18",
  "08", "13", "02", "03", "06", "07", "17", "05", "14",
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

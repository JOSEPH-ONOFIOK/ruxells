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

/**
 * The worlds a piece can come from.
 *
 * Classified by the hue of the backdrop the artist painted behind each room
 * rather than by anything in the art itself, because that is what actually
 * separates them at a glance — and it is the same measure that decides the
 * running order below, so the filters and the spread agree.
 */
export type Faction =
  | "ice"
  | "fire"
  | "sand"
  | "green"
  | "violet"
  | "void";

export const FACTIONS: { id: Faction; name: string; tint: string }[] = [
  { id: "ice", name: "Ice", tint: "#7fd4e8" },
  { id: "fire", name: "Fire", tint: "#fe6458" },
  { id: "sand", name: "Sand", tint: "#d8a643" },
  { id: "green", name: "Overgrowth", tint: "#2cfe53" },
  { id: "violet", name: "Deep", tint: "#a93cfa" },
  { id: "void", name: "Void", tint: "#6f9ce0" },
];

/**
 * Which world each frame belongs to.
 *
 * Measured off the corners of every source image rather than assigned by
 * eye, so a frame cannot drift into the wrong group when the art is
 * regenerated.
 */
const FRAME_FACTION: Record<string, Faction> = {
  "01": "void", "02": "fire", "03": "ice", "04": "void", "05": "ice",
  "06": "sand", "07": "ice", "08": "ice", "09": "ice", "10": "ice",
  "11": "violet", "12": "void", "13": "green", "14": "ice", "15": "ice",
  "16": "ice", "17": "sand", "18": "green",
};

/** The same, for the four named rooms. */
const ROOM_FACTION: Record<string, Faction> = {
  holding: "ice",
  greenhouse: "fire",
  rig: "ice",
  tomb: "ice",
};

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
  /** Which world it comes from. */
  faction: Faction;
  /**
   * A slot in a world that has not been filled yet.
   *
   * Every world is meant to hold twelve, and most hold fewer — Deep has one.
   * Showing the gap rather than hiding it is what makes a world read as a
   * set being assembled instead of however many pieces happen to exist.
   */
  locked?: boolean;
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
  faction: ROOM_FACTION[sector.id] ?? "void",
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
    faction: FRAME_FACTION[n] ?? "void",
    gif: LIVE_FRAMES.has(n) ? `/recon-live/${n}.gif` : undefined,
  };
});

/** Rooms first: they are the ones the site has already introduced. */
export const PIECES: Piece[] = [...ROOMS, ...FRAMES];

/** How many pieces a world is meant to hold. */
export const FACTION_SIZE = 12;

/**
 * Everything, plus the empty slots each world is still short of.
 *
 * Built once rather than per render: the list never changes, and the token
 * numbers have to be stable — a slot that renumbered itself on every render
 * would not be a place in a catalogue.
 *
 * Numbered from 0901 upward so a placeholder can never be mistaken for one
 * of the real frames, which run 0001 to 0018.
 */
export const WITH_LOCKED: Piece[] = (() => {
  const out = [...PIECES];
  let n = 901;

  for (const f of FACTIONS) {
    const have = PIECES.filter((p) => p.faction === f.id).length;

    for (let i = have; i < FACTION_SIZE; i++) {
      out.push({
        id: `locked-${f.id}-${i}`,
        // The art is never shown for these, but a src keeps the type honest
        // and gives the grid something to size a cell against.
        src: "/brand/mark-lime.png",
        width: 334,
        height: 334,
        label: `#${String(n).padStart(4, "0")}`,
        featured: false,
        faction: f.id,
        tint: f.tint,
        locked: true,
      });
      n += 1;
    }
  }

  return out;
})();

/**
 * The world, as six sectors.
 *
 * One per room in the floating map. Each carries its own accent, read off the
 * artwork rather than invented, so a sector's panel and the tile beside it
 * agree.
 */

export type Sector = {
  id: string;
  /** Designation shown in the terminal readouts. */
  code: string;
  name: string;
  /**
   * The room, cut out of its background so it can float in the map.
   *
   * An animated sprite sheet, generated from the source artwork by
   * `scripts/cut-tiles.py`. The original diorama GIFs live in
   * `assets-source/` and are deliberately not shipped: six 1920px GIFs is
   * 69MB against about 2MB a sheet.
   */
  tile: string;

  /**
   * The same room, at phone size.
   *
   * A full sheet decodes to about 10MB of VRAM and six of those is more than
   * a mid-range phone hands a browser tab. This one is the same forty frames
   * at 112px a cell — 2MB decoded — so phones keep the animation instead of
   * being given a frozen frame.
   */
  tileSm: string;

  /** A single frame, for reduced-motion and as the poster. */
  still: string;
  /** Dominant colour of the artwork — drives the card's rim light. */
  tint: string;
  /** One line, in the briefing voice. */
  blurb: string;
};

/**
 * Drop facts.
 *
 * Supply and date are deliberately unannounced — the list is the only
 * commitment being made, and naming a number the drop might not hold is a
 * promise that gets broken in public.
 */
export const DROP = {
  supply: "TBA",
  price: "Free",
  date: "TBA",

  /**
   * When the allowlist closes, as an ISO instant in UTC — so the deadline is
   * the same moment for everyone, whatever timezone they open the page in,
   * and the countdown is a real figure rather than a fresh 24h per visitor.
   *
   * PLACEHOLDER. Set this to the real closing time before launch; every
   * countdown on the site reads from it and flips to "clearance closed" on
   * its own once it passes.
   */
  closesAt: "2026-10-01T20:00:00Z",
} as const;

/** The headline the drop is announced with. */
export const DROP_PITCH = {
  title: "The gate is open",
  line: "Free mint on Robinhood",
} as const;

/**
 * The chain, for the facts block.
 *
 * Robinhood Chain is EVM, which is why the wallet field validates a 0x
 * address — if this ever moves to a non-EVM chain, `ETH_ADDRESS_RE` in the
 * allowlist route and the clearance form both have to change with it.
 */
export const CHAIN = {
  name: "Robinhood",
  kind: "EVM",
} as const;

/**
 * Each entry describes the room that is actually in its artwork — the names
 * and colours are read off the tiles rather than invented, so a sector's
 * panel and the thing floating next to it agree.
 */
export const SECTORS: Sector[] = [
  {
    id: "holding",
    code: "SECTOR 01",
    name: "The Holding Bay",
    tile: "/sectors/01-tile.png",
    tileSm: "/sectors/01-tile-sm.png",
    still: "/sectors/01-still.png",
    tint: "#6f9ce0",
    blurb:
      "Concrete, chain-link and crates nobody will open. Everyone starts here.",
  },
  {
    id: "lab",
    code: "SECTOR 02",
    name: "The Cold Lab",
    tile: "/sectors/02-tile.png",
    tileSm: "/sectors/02-tile-sm.png",
    still: "/sectors/02-still.png",
    tint: "#3a2a6e",
    blurb: "Whatever they built in here is still humming, and still cold.",
  },
  {
    id: "pitch",
    code: "SECTOR 03",
    name: "The Pitch",
    tile: "/sectors/03-tile.png",
    tileSm: "/sectors/03-tile-sm.png",
    still: "/sectors/03-still.png",
    tint: "#429ba3",
    blurb: "Someone marked out a field down here. Both sides turned up.",
  },
  {
    id: "rig",
    code: "SECTOR 04",
    name: "The Deep Freeze",
    tile: "/sectors/04-tile.png",
    tileSm: "/sectors/04-tile-sm.png",
    still: "/sectors/04-still.png",
    tint: "#429ba3",
    blurb: "The rigs never stopped running. The bears moved in anyway.",
  },
  {
    id: "tomb",
    code: "SECTOR 05",
    name: "The Dig",
    tile: "/sectors/06-tile.png",
    tileSm: "/sectors/06-tile-sm.png",
    still: "/sectors/06-still.png",
    tint: "#a93cfa",
    blurb: "They found the pyramid first and the door underneath it second.",
  },
  {
    id: "canyon",
    code: "SECTOR 06",
    name: "The Red Canyon",
    tile: "/sectors/05-tile.png",
    tileSm: "/sectors/05-tile-sm.png",
    still: "/sectors/05-still.png",
    tint: "#2cfe53",
    blurb: "Open ground, high rocks, and one lamp that somebody keeps lit.",
  },
];

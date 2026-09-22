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
   * One frame of the same room, for phones.
   *
   * The sheets decode to roughly 10MB of VRAM each, and six of those is more
   * than a mid-range phone will give a browser tab without thrashing. The
   * still is 192px, which is 0.15MB decoded and still above what a phone
   * screen resolves at the size a tile is drawn.
   */
  still: string;
  /** Dominant colour of the artwork — drives the card's rim light. */
  tint: string;
  /** One line, in the briefing voice. */
  blurb: string;
  /** Rendered as a two-column readout under the blurb. */
  intel: [string, string][];
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
  line: "Free mint",
} as const;

/**
 * Each entry describes the room that is actually in its artwork — the names
 * and intel are read off the tiles, not invented, so a sector's panel and the
 * thing floating next to it agree.
 */
export const SECTORS: Sector[] = [
  {
    id: "holding",
    code: "SECTOR 01",
    name: "The Holding Bay",
    tile: "/sectors/01-tile.png",
    still: "/sectors/01-still.png",
    tint: "#8f9aa3",
    blurb:
      "Concrete, chain-link and crates nobody will open. Everyone starts here.",
    intel: [
      ["Status", "Open"],
      ["Light", "Failing"],
      ["Occupants", "Nine"],
    ],
  },
  {
    id: "vault",
    code: "SECTOR 02",
    name: "The Lava Vault",
    tile: "/sectors/02-tile.png",
    still: "/sectors/02-still.png",
    tint: "#ff6a2b",
    blurb:
      "Something green is sealed in the glass and the floor has cracked around it.",
    intel: [
      ["Status", "Unstable"],
      ["Containment", "Holding"],
      ["Occupants", "Eight"],
    ],
  },
  {
    id: "arcade",
    code: "SECTOR 03",
    name: "The Greenhouse",
    tile: "/sectors/03-tile.png",
    still: "/sectors/03-still.png",
    tint: "#7bc86c",
    blurb: "One working cabinet, still lit, halfway buried in vines.",
    intel: [
      ["Status", "Overgrown"],
      ["Power", "One socket"],
      ["Occupants", "Five"],
    ],
  },
  {
    id: "rig",
    code: "SECTOR 04",
    name: "Cold Storage",
    tile: "/sectors/04-tile.png",
    still: "/sectors/04-still.png",
    tint: "#7fd4e8",
    blurb: "The rigs never stopped running. The bears moved in anyway.",
    intel: [
      ["Status", "Running"],
      ["Temp", "Below"],
      ["Occupants", "Twelve"],
    ],
  },
  {
    id: "canyon",
    code: "SECTOR 05",
    name: "The Red Canyon",
    tile: "/sectors/05-tile.png",
    still: "/sectors/05-still.png",
    tint: "#c65f5f",
    blurb: "Open ground, high rocks, and one lamp that somebody keeps lit.",
    intel: [
      ["Status", "Exposed"],
      ["Cover", "Thin"],
      ["Occupants", "Ten"],
    ],
  },
  {
    id: "tomb",
    code: "SECTOR 06",
    name: "The Dig",
    tile: "/sectors/06-tile.png",
    still: "/sectors/06-still.png",
    tint: "#f5c344",
    blurb: "They found the pyramid first and the door underneath it second.",
    intel: [
      ["Status", "Restricted"],
      ["Depth", "Unlogged"],
      ["Occupants", "Seven"],
    ],
  },
];

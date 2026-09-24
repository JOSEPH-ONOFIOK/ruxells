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
  /** The room, cut out of its background. */
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
    still: "/sectors/01-still.png",
    tint: "#6f9ce0",
    blurb:
      "Concrete, chain-link and crates nobody will open. Everyone starts here.",
  },
  {
    id: "pitch",
    code: "SECTOR 02",
    name: "The Pitch",
    still: "/sectors/03-still.png",
    tint: "#429ba3",
    blurb: "Someone marked out a field down here. Both sides turned up.",
  },
  {
    id: "rig",
    code: "SECTOR 03",
    name: "The Deep Freeze",
    still: "/sectors/04-still.png",
    tint: "#7fd4e8",
    blurb: "The rigs never stopped running. The bears moved in anyway.",
  },
  {
    id: "tomb",
    code: "SECTOR 04",
    name: "The Dig",
    still: "/sectors/06-still.png",
    tint: "#a93cfa",
    blurb: "They found the pyramid first and the door underneath it second.",
  },
];

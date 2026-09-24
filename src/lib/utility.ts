/**
 * What a Ruxxell will do, once the grid is live.
 *
 * Everything here is deliberately presented as locked. None of it exists
 * yet, and a site that describes unbuilt features in the present tense is
 * making promises the drop has to keep — so each card names what unlocks it
 * rather than implying it is ready.
 *
 * The copy stays short and concrete for the same reason. Vague ambition
 * ("a whole ecosystem") ages worse than a plain sentence about one mechanic.
 */

export type Gate = "mint" | "grid";

export type Utility = {
  id: string;
  name: string;
  /** One line on what it is. */
  blurb: string;
  /** Which door it sits behind. */
  gate: Gate;
  /** A frame from the collection that suits it. */
  still: string;
  /** Read off the artwork, for the card's edge. */
  tint: string;
};

export const GATE_LABEL: Record<Gate, string> = {
  mint: "Unlocks after mint",
  grid: "Grid access required",
};

export const UTILITIES: Utility[] = [
  {
    id: "mining",
    name: "Mining",
    blurb:
      "Put a Ruxxell to work in a room and it earns while it sits there.",
    gate: "mint",
    still: "/recon/04.jpeg",
    tint: "#fe6458",
  },
  {
    id: "excavation",
    name: "Excavation",
    blurb: "Dig into a sector for what earlier crews left behind.",
    gate: "grid",
    still: "/recon/05.jpeg",
    tint: "#d8a643",
  },
  {
    id: "worldvault",
    name: "Worldvault",
    blurb: "Where everything pulled out of the grid is held and traded.",
    gate: "grid",
    still: "/recon/16.jpeg",
    tint: "#429ba3",
  },
  {
    id: "reconstruction",
    name: "Reconstruction",
    blurb: "Spend what you have dug up to rebuild a room into something else.",
    gate: "grid",
    still: "/recon/12.jpeg",
    tint: "#a93cfa",
  },
  {
    id: "leaderboards",
    name: "Leaderboards",
    blurb: "Who has dug deepest, mined longest, and brought the most people in.",
    gate: "mint",
    still: "/recon/17.jpeg",
    tint: "#2cfe53",
  },
];

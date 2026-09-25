/**
 * The checkpoint.
 *
 * A scene rather than a page: one room, a guard standing in the door, and a
 * few things in it worth touching. It answers the same question `/clearance`
 * does — are you on the list — but as somewhere you arrive rather than a form
 * you fill.
 *
 * Everything here is placement and copy. The room is a single plate and each
 * hotspot is a box positioned in plate coordinates, so a hotspot follows the
 * artwork at every window size instead of drifting off it.
 */

export type Hotspot = {
  id: string;
  /** What the cursor says it is. */
  label: string;
  /**
   * Where it sits, as a percentage of the plate.
   *
   * Percentages rather than pixels: the plate is shown with object-cover at
   * whatever size the window is, and a percentage box rides that scaling for
   * free where a pixel box would need recalculating on every resize.
   */
  box: { x: number; y: number; w: number; h: number };
  /** What happens when it is opened. */
  panel: Panel;

  /**
   * A nudge, shown only to someone who has stood still long enough to need
   * one. Short: it is a pointer at the thing, not a description of it.
   */
  hint: string;
};

export type Panel = {
  title: string;
  /** Line breaks are deliberate; rendered with `whitespace-pre-line`. */
  body: string;
  /** An optional way out of the panel and into the real flow. */
  action?: { label: string; href: string };
};

/**
 * The room's own furniture.
 *
 * Measured by drawing the boxes over the plate and looking, not estimated:
 * the first pass had the crates on bare floor and the noticeboard on a blank
 * stretch of wall. These sit on the graffiti, the crate stack, the figure in
 * red and the chain-link fence.
 */
export const HOTSPOTS: Hotspot[] = [
  {
    id: "guard",
    label: "The one in red",
    hint: "Ask her what it takes",
    box: { x: 31, y: 37, w: 11, h: 20 },
    panel: {
      title: "She does not talk much",
      body: "Four steps and a wallet. That is the whole job.\n\nShe has been in this bay a while and has heard every reason why someone should be let through without doing them.",
      action: { label: "Do the four steps", href: "/clearance" },
    },
  },
  {
    id: "crates",
    label: "The crates",
    hint: "Nobody has opened these",
    box: { x: 15, y: 36, w: 17, h: 18 },
    panel: {
      title: "Nobody will open them",
      body: "Stamped, stacked and addressed to a sector that does not take deliveries.\n\nSupply is still being decided. What is already out of the crates is worth a look.",
      action: { label: "See the collection", href: "/gallery" },
    },
  },
  {
    id: "board",
    label: "The wall",
    hint: "Somebody wrote on it",
    box: { x: 27, y: 22, w: 17, h: 12 },
    panel: {
      title: "Somebody wrote on it",
      body: "Four sectors, one collection, minting on Robinhood.\n\nPrice and supply are still TBA. The list is the only thing being promised, and it closes.",
    },
  },
  {
    id: "fence",
    label: "The fence",
    hint: "There is more past it",
    box: { x: 58, y: 50, w: 22, h: 22 },
    panel: {
      title: "The rest of the bay",
      body: "Past this is the same room again, and then three more like it.\n\nEvery Ruxxell comes out of one of the four.",
      action: { label: "The long way round", href: "/world" },
    },
  },
];

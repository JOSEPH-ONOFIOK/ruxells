"use client";

import { useSyncExternalStore } from "react";

/**
 * How much this device should be asked to draw.
 *
 * "lite" swaps the animated sprite sheets for single stills, drops the cloud
 * count and caps the pixel ratio. The sheets decode to roughly 10MB of VRAM
 * each and six of them is more than a mid-range phone hands a browser tab
 * without thrashing, which is felt as a permanently janky camera rather than
 * a slow load.
 *
 * The test is capability, not width. A narrow window on a desktop has a real
 * GPU behind it and should keep the animation; a large tablet on mobile
 * silicon should not. So it asks three things:
 *
 *   - coarse pointer, which separates touch hardware from a narrow window
 *   - core count, as the only proxy for device class the platform exposes
 *   - reduced motion, where holding still is the point
 *
 * Deliberately not `navigator.userAgent`: it lies, and it needs updating
 * every time a new device ships.
 */

export type Quality = "full" | "lite";

function detect(): Quality {
  if (typeof window === "undefined") return "full";

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Unknown reports as 0 on some browsers; treat that as "not many".
  const cores = navigator.hardwareConcurrency || 4;

  if (reduced) return "lite";
  // A touch device with 8+ cores is a recent flagship and copes; below that
  // the sheets cost more than the animation is worth.
  if (coarse && cores < 8) return "lite";
  return "full";
}

/**
 * Decided once and never updated.
 *
 * Quality is not something to change under someone mid-session: swapping
 * every texture on a rotation or a window resize would stutter far worse
 * than the setting it was correcting.
 *
 * The answer is cached because `getSnapshot` must return a referentially
 * stable value — recomputing it per call would make React see a changed
 * store on every render and loop.
 */
let cached: Quality | null = null;

const store = {
  subscribe: () => () => {},
  get: (): Quality => (cached ??= detect()),
  getServer: (): Quality => "full",
};

export function useQuality(): Quality {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * The room's sounds.
 *
 * Off until someone turns them on. A site that makes noise at a visitor is a
 * site they close, and browsers block autoplaying audio anyway — so the
 * choice is explicit rather than a thing to undo.
 *
 * The preference is remembered across visits, because being asked the same
 * question every time is its own kind of noise.
 */

export type Cue = "hover" | "open" | "close" | "door";

const KEY = "ruxxells.sound";

/**
 * Read through `useSyncExternalStore` so the server renders the off state and
 * the client decides on its first paint. Setting it from an effect would
 * flash the wrong icon.
 */
const listeners = new Set<() => void>();
let cached: boolean | null = null;

const store = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get() {
    if (cached === null) {
      try {
        cached = localStorage.getItem(KEY) === "on";
      } catch {
        // Private browsing and blocked storage both throw; silence is the
        // safe default either way.
        cached = false;
      }
    }
    return cached;
  },
  // Silent on the server: the icon must not claim sound is on before the
  // preference has been read.
  getServer: () => false,
};

function setStored(on: boolean) {
  cached = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  for (const fn of listeners) fn();
}

export function useSound() {
  const on = useSyncExternalStore(store.subscribe, store.get, store.getServer);
  const buffers = useRef<Map<Cue, HTMLAudioElement[]>>(new Map());

  // Loaded only once sound is actually wanted, so a visitor who never turns
  // it on never pays for four files. The ref is the record of whether they
  // exist — a state flag here would drive a second render that changes
  // nothing on screen.
  useEffect(() => {
    if (!on || buffers.current.size > 0) return;

    const cues: Cue[] = ["hover", "open", "close", "door"];
    const next = new Map<Cue, HTMLAudioElement[]>();

    for (const cue of cues) {
      // A small pool per cue: one element cannot overlap with itself, so
      // moving quickly between hotspots would cut the previous tick short.
      next.set(
        cue,
        Array.from({ length: cue === "hover" ? 3 : 2 }, () => {
          const a = new Audio(`/sound/${cue}.wav`);
          a.preload = "auto";
          return a;
        }),
      );
    }

    buffers.current = next;
  }, [on]);

  const play = useCallback(
    (cue: Cue) => {
      if (!on) return;
      const pool = buffers.current.get(cue);
      if (!pool) return;

      // The first element not already mid-sound, or the oldest one.
      const free = pool.find((a) => a.paused || a.ended) ?? pool[0];
      free.currentTime = 0;
      // A rejected play is a browser declining, not a fault worth surfacing.
      free.play().catch(() => {});
    },
    [on],
  );

  const toggle = useCallback(() => setStored(!on), [on]);

  return { on, play, toggle };
}

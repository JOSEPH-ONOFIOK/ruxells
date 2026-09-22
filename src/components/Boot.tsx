"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

/**
 * The boot screen.
 *
 * The world is about 11MB of sprite sheets, which on a phone is a real wait,
 * and a blank canvas during it reads as a broken page rather than a loading
 * one. So the wait gets a face: the eyes, a bar that tracks real progress,
 * and a line of the same terminal language the rest of the site speaks.
 *
 * Progress is the count of textures actually decoded, not a timer — a fake
 * bar that finishes before the content does is worse than no bar, because it
 * makes the remaining wait feel like a fault.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Boot({
  loaded,
  total,
  done,
}: {
  loaded: number;
  total: number;
  /** True once the scene is ready; the screen lifts rather than cuts. */
  done: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((loaded / total) * 100);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-void px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {/* The eyes, blinking awake. The mark is the one piece of the
              identity that works at this size with nothing around it. */}
          <motion.div
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/brand/mark-lime.png"
              alt=""
              aria-hidden
              width={334}
              height={334}
              className="pixelated h-7 w-auto sm:h-9"
              priority
            />
          </motion.div>

          {/* Real progress. Width is driven by decoded textures, so it only
              reaches the end when the world actually has. */}
          <div className="w-full max-w-[13rem]">
            <div className="h-0.5 overflow-hidden bg-line">
              <motion.div
                className="h-full bg-lime"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: total === 0 ? 0.08 : loaded / total }}
                style={{ originX: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="eyebrow text-ash/60">Waking the world</p>
              <p className="eyebrow text-lime tabular-nums">
                {String(pct).padStart(2, "0")}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

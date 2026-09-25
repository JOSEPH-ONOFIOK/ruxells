"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The way in.
 *
 * The wordmark on black, then it lifts. It exists because the page behind it
 * is a full-bleed banner and a row of stats arriving at once, and landing
 * straight on all of that gives the eye nowhere to start.
 *
 * It is deliberately short and it never waits on the network: the page is
 * server-rendered and ready underneath, so holding it back for a load event
 * would be inventing a wait rather than covering one. Anyone arriving a
 * second time skips it entirely.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** How long the mark holds before it lifts. */
const HOLD_MS = 1100;

/** Remembered for the session, not forever — a reload is a fresh visit the
    next day, and the intro is worth seeing once per sitting. */
const SEEN_KEY = "ruxxells.intro.seen";

/**
 * Whether this session has already seen it.
 *
 * Read through `useSyncExternalStore` rather than set from an effect: the
 * server has to render nothing, the client has to decide on its first paint,
 * and doing that with setState inside an effect costs a second render pass
 * before anything appears.
 */
const seenStore = {
  subscribe: () => () => {},
  get: () => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private browsing and blocked storage both throw. Showing the intro
      // is the harmless outcome.
      return false;
    }
  },
  // On the server there is no session, and the curtain must not be in the
  // HTML — it would flash for anyone who had already seen it.
  getServer: () => true,
};

export function Intro() {
  const reduced = useReducedMotion();
  const seen = useSyncExternalStore(
    seenStore.subscribe,
    seenStore.get,
    seenStore.getServer,
  );

  const [dismissed, setDismissed] = useState(false);
  const show = !seen && !reduced && !dismissed;

  useEffect(() => {
    if (!show) return;

    const t = setTimeout(() => {
      setDismissed(true);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, HOLD_MS);

    return () => clearTimeout(t);
  }, [show]);

  // The page must not scroll behind the curtain.
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-void"
          initial={{ opacity: 1 }}
          // Lifts rather than fades: the banner underneath is the same
          // artwork, so sliding the cover away reads as a reveal where a
          // crossfade would just look like a slow image.
          exit={{ y: "-100%", transition: { duration: 0.7, ease: EASE } }}
        >
          <motion.div
            className="px-8"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Image
              src="/brand/wordmark-lime.png"
              alt="RUXXELLS"
              width={866}
              height={245}
              priority
              className="pixelated h-auto w-[min(72vw,26rem)]"
            />

            <motion.div
              aria-hidden
              className="mt-5 h-0.5 origin-left bg-lime"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The clouds the rooms float in.
 *
 * Cut from the artwork itself rather than drawn fresh — the collection's own
 * frames have hand-painted cloud banks around every tile, with the same
 * chunky outline and highlight as the rooms. Anything I invented would sit
 * next to the art rather than belong to it.
 *
 * They live in the DOM over the canvas, not in the 3D scene. A cloud is a
 * flat pixel sprite that should stay pin-sharp and never take perspective,
 * which is exactly what a positioned image does for free and what a textured
 * quad has to be fought into.
 */

type Drifter = {
  src: string;
  /** Viewport width, so they scale with the page rather than the device. */
  width: string;
  top: string;
  /** Seconds for one crossing. Slower reads as further away. */
  duration: number;
  delay: number;
  opacity: number;
  /** Right to left, for the ones meant to read as nearer. */
  reverse?: boolean;
};

const DRIFTERS: Drifter[] = [
  { src: "/brand/clouds.png", width: "38vw", top: "12%", duration: 116, delay: 0, opacity: 0.16 },
  { src: "/brand/clouds-2.png", width: "52vw", top: "34%", duration: 84, delay: -30, opacity: 0.22, reverse: true },
  { src: "/brand/clouds-3.png", width: "30vw", top: "58%", duration: 140, delay: -70, opacity: 0.13 },
  { src: "/brand/clouds-2.png", width: "44vw", top: "78%", duration: 98, delay: -55, opacity: 0.18, reverse: true },
];

export function Clouds() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      // Between the canvas and the page content: the clouds pass in front of
      // the rooms, which is what puts the rooms *inside* the weather rather
      // than pasted on top of a backdrop.
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
    >
      {DRIFTERS.map((d, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: d.top, width: d.width, opacity: d.opacity }}
          initial={{ x: d.reverse ? "100vw" : "-60vw" }}
          animate={
            reduced
              ? // Held still rather than hidden: the clouds are part of the
                // composition, and removing them leaves the page emptier
                // than the preference asks for.
                { x: d.reverse ? "60vw" : "20vw" }
              : { x: d.reverse ? "-60vw" : "100vw" }
          }
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: d.duration,
                  delay: d.delay,
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        >
          <Image
            src={d.src}
            alt=""
            width={424}
            height={135}
            sizes="50vw"
            className="pixelated h-auto w-full"
          />
        </motion.div>
      ))}
    </div>
  );
}

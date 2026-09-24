"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * The rest of the collection.
 *
 * Eighteen frames the six rooms don't cover, as two rails that slide past
 * each other while the section scrolls. The point is the volume of it — that
 * there is more here than the floors you just came down — so they are shown
 * small, dense and without captions.
 *
 * The rails move in opposite directions because one long strip reads as a
 * single object sliding by, and two crossing ones read as a lot of material
 * going past. It costs nothing: the transform is the same either way.
 */

const SHOTS = Array.from({ length: 18 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

/** Split so neither rail repeats a frame. */
const TOP = SHOTS.slice(0, 9);
const BOTTOM = SHOTS.slice(9);

export function Gallery() {
  const section = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start end", "end start"],
  });

  // Scroll nudges the rails on top of their own drift, so they respond to
  // the page without depending on it — a rail that only moves while you
  // scroll looks frozen the moment you stop.
  const nudgeLeft = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const nudgeRight = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <section
      ref={section}
      className="relative flex flex-col justify-center overflow-hidden py-16 sm:min-h-[100svh] sm:py-20"
    >
      <div className="px-5 sm:px-8">
        <p className="eyebrow text-lime">The rest of it</p>
        <h2 className="wordmark mt-2 text-[clamp(1.6rem,6vw,2.6rem)] text-chalk">
          Eighteen more
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ash">
          Rooms that didn&rsquo;t make the descent. Nobody has explained the
          dragon yet.
        </p>

        <Link
          href="/gallery"
          className="pressable mt-5 inline-flex items-center gap-2 border-2 border-line px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors hover:border-lime hover:text-lime"
        >
          See all of them
          <FiArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-10 space-y-3">
        <Rail shots={TOP} nudge={nudgeLeft} duration={52} />
        <Rail shots={BOTTOM} nudge={nudgeRight} duration={64} reverse />
      </div>
    </section>
  );
}

/**
 * One rail of frames, drifting on its own.
 *
 * The strip is rendered twice end to end and animated exactly one copy's
 * width, so the moment it wraps the second copy is sitting where the first
 * began and the loop has no seam. Scroll adds a nudge on top, which is why
 * the drift lives on an inner element: two transforms on one node would
 * overwrite each other.
 */
function Rail({
  shots,
  nudge,
  duration,
  reverse = false,
}: {
  shots: string[];
  nudge: ReturnType<typeof useTransform<number, number>>;
  duration: number;
  reverse?: boolean;
}) {
  const reduced = useReducedMotion();
  const loop = [...shots, ...shots];

  return (
    <motion.div style={{ x: nudge }} className="will-change-transform">
      <motion.div
        className="flex w-max gap-3"
        animate={
          reduced ? {} : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }
        }
        transition={
          reduced ? undefined : { duration, repeat: Infinity, ease: "linear" }
        }
      >
        {loop.map((shot, i) => (
          <div
            key={`${shot}-${i}`}
            className="relative aspect-square w-32 shrink-0 overflow-hidden border-2 border-line sm:w-40"
          >
            <Image
              src={`/recon/${shot}.jpeg`}
              alt=""
              aria-hidden
              width={1600}
              height={1600}
              sizes="160px"
              className="pixelated h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

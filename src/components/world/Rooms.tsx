"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SECTORS, type Sector } from "@/lib/sectors";

/**
 * The rooms, animating.
 *
 * Each card carries the artist's own backdrop — lava under the greenhouse,
 * clouds under the bunker — rather than the cut-out silhouettes an earlier
 * 3D scene needed. That backdrop is most of what gives each room a place.
 *
 * The animations total about 6.5MB, which is far too much to force on
 * arrival, so a card shows its first frame until it is asked for: hovered on
 * a pointer device, tapped on a touch screen. On a phone the four sit in a
 * 2x2 grid and are all on screen together, so playing them on sight would
 * mean downloading every one at once.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Rooms() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow text-lime">The world</p>
        <h2 className="wordmark mt-2 text-[clamp(1.6rem,6vw,2.6rem)] text-chalk">
          {SECTORS.length} sectors
        </h2>
        {/* The section that used to sit under this one said what a Ruxxell
            would do, as five locked cards. The mechanics are not settled
            enough to describe in five parts, so what survives is the one
            sentence that was actually true. */}
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ash">
          Every Ruxxell comes out of one of these rooms, and the room it comes
          from is what it can do once the grid opens. None of that is live
          yet — holding one is what unlocks it when it is.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
          {SECTORS.map((sector, i) => (
            <Card key={sector.id} sector={sector} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ sector, index }: { sector: Sector; index: number }) {
  const [live, setLive] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.li
      className="panel panel-tint overflow-hidden"
      style={{ "--tint": sector.tint } as React.CSSProperties}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 3) * 0.06,
        ease: EASE,
      }}
      // Hover starts it on a pointer device. On touch it is a tap, not a
      // viewport enter: the cards are a 2x2 grid there, so all four are on
      // screen at once and auto-playing them would pull 6.5MB of GIF in one
      // go for artwork nobody has asked to see move.
      onHoverStart={() => !reduced && setLive(true)}
      onTapStart={() => !reduced && setLive((v) => !v)}
    >
      <div className="relative aspect-square overflow-hidden bg-void">
        {/* Both layers are stacked rather than swapped, so starting the
            animation never re-lays-out the card — only the top one appears. */}
        <Image
          src={sector.still}
          alt={sector.name}
          width={480}
          height={480}
          sizes="(max-width: 640px) 50vw, 50vw"
          quality={100}
          className="pixelated h-full w-full object-cover"
          loading={index < 2 ? "eager" : "lazy"}
        />

        {live && (
          <Image
            src={sector.gif}
            alt=""
            aria-hidden
            width={480}
            height={480}
            // Unoptimized is required, not a shortcut: next/image re-encodes
            // to a still WebP and an optimised GIF stops moving entirely.
            unoptimized
            className="pixelated absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* On a phone the cards are about 170px square, which is too small
            to carry a blurb underneath — so the name rides over the artwork
            instead and the description only appears where there is room. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/80 to-transparent px-3 pt-8 pb-2.5 sm:hidden">
          <p className="eyebrow" style={{ color: sector.tint }}>
            {sector.code}
          </p>
          <h3 className="wordmark mt-1 truncate text-sm text-chalk">
            {sector.name}
          </h3>
        </div>
      </div>

      <div className="hidden p-5 sm:block">
        <p className="eyebrow" style={{ color: sector.tint }}>
          {sector.code}
        </p>
        <h3 className="wordmark mt-2 text-xl text-chalk">{sector.name}</h3>
        <p className="mt-2.5 text-xs leading-relaxed text-ash">
          {sector.blurb}
        </p>
      </div>
    </motion.li>
  );
}

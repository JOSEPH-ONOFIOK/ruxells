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
 * arrival, so a card shows its first frame until it is both on screen and
 * wanted: hovered on a pointer device, in view on a touch screen where there
 * is no hover to wait for.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Rooms() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow text-lime">The world</p>
        <h2 className="wordmark mt-2 text-[clamp(1.6rem,6vw,2.6rem)] text-chalk">
          {SECTORS.length} sectors
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ash">
          Every Ruxxell comes out of one of these rooms.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
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
      // On touch there is no hover, so being properly on screen is the ask.
      onViewportEnter={() => {
        if (!reduced && window.matchMedia("(hover: none)").matches) {
          setLive(true);
        }
      }}
      onHoverStart={() => !reduced && setLive(true)}
    >
      <div className="relative aspect-square overflow-hidden bg-void">
        {/* Both layers are stacked rather than swapped, so starting the
            animation never re-lays-out the card — only the top one appears. */}
        <Image
          src={sector.still}
          alt={sector.name}
          width={480}
          height={480}
          sizes="(max-width: 640px) 100vw, 50vw"
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
      </div>

      <div className="p-5">
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { DROP, SECTORS } from "@/lib/sectors";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import { Utility } from "./Utility";

/**
 * The page.
 *
 * The banner is the hero and fills the screen; everything under it sits on a
 * CSS field rather than a 3D scene. The scroll-driven WebGL descent that used
 * to be here is gone — it carried three.js, six sprite sheets and a boot
 * screen to show four rooms, and the rooms read perfectly well as cards.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function World({ cleared }: { cleared: number | null }) {
  return (
    <div className="relative">
      {/* The backdrop for the whole page, behind every section. */}
      <div aria-hidden className="field" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="shrink-0 overflow-hidden border-2 border-line">
            <Image
              src="/brand/soldier.gif"
              alt=""
              aria-hidden
              width={1453}
              height={1455}
              className="pixelated block h-9 w-9 object-cover"
              unoptimized
              priority
            />
          </span>
          <Image
            src="/brand/wordmark-lime.png"
            alt="RUXXELLS"
            width={866}
            height={245}
            className="pixelated h-4 w-auto"
            priority
          />
        </Link>

        <Link
          href="/gallery"
          className="eyebrow px-1 text-ash transition-colors hover:text-lime"
        >
          Gallery
        </Link>
      </header>

      <main className="relative z-10">
        <Hero cleared={cleared} />

        {/* --- the rooms --------------------------------------------- */}
        <section className="px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow text-lime">The world</p>
            <h2 className="wordmark mt-2 text-[clamp(1.6rem,6vw,2.6rem)] text-chalk">
              {SECTORS.length} sectors
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ash">
              Every Ruxxell comes out of one of these rooms.
            </p>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {SECTORS.map((sector, i) => (
                <motion.li
                  key={sector.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(i, 3) * 0.06,
                    ease: EASE,
                  }}
                  className="panel panel-tint overflow-hidden"
                  style={{ "--tint": sector.tint } as React.CSSProperties}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-void">
                    <Image
                      src={sector.still}
                      alt={sector.name}
                      width={384}
                      height={384}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="pixelated h-full w-full object-cover"
                      loading={i < 2 ? "eager" : "lazy"}
                    />
                  </div>

                  <div className="p-5">
                    <p className="eyebrow" style={{ color: sector.tint }}>
                      {sector.code}
                    </p>
                    <h3 className="wordmark mt-2 text-xl text-chalk">
                      {sector.name}
                    </h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-ash">
                      {sector.blurb}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        <Utility />

        <Gallery />

        {/* --- the door ---------------------------------------------- */}
        <section className="px-5 py-24 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Image
              src="/brand/mark-lime.png"
              alt=""
              aria-hidden
              width={334}
              height={334}
              className="pixelated mx-auto h-9 w-auto"
            />
            <h2 className="wordmark mt-6 text-[clamp(2rem,8vw,3.6rem)] text-chalk">
              Get on the list
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ash">
              Four steps, then your wallet. {DROP.price} mint, supply{" "}
              {DROP.supply}.
            </p>

            <Link
              href="/clearance"
              className="group pressable mt-8 inline-flex items-center gap-2 border-2 border-lime bg-lime px-8 py-4 text-xs font-bold tracking-widest text-void uppercase shadow-[4px_4px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
            >
              Start
              <FiArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { DROP } from "@/lib/sectors";
import { Intro } from "../Intro";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import { Rooms } from "./Rooms";

/**
 * The page.
 *
 * The banner is the hero; everything under it sits on a CSS field rather than
 * a 3D scene.
 *
 * Hero, the rooms, the collection, then the door.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function World({ cleared }: { cleared: number | null }) {
  return (
    <div className="relative">
      <Intro />

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

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="eyebrow text-ash transition-colors hover:text-lime"
          >
            ← The bay
          </Link>
          <Link
            href="/gallery"
            className="eyebrow text-ash transition-colors hover:text-lime"
          >
            Gallery
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <Hero cleared={cleared} />

        <Rooms />

        <Gallery />

        {/* --- the door ---------------------------------------------- */}
        <section className="px-5 py-16 text-center sm:px-8 sm:py-24">
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
              Four steps, then your wallet. Price {DROP.price}, supply{" "}
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

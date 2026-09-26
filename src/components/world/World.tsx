"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { X_ACCOUNT } from "@/lib/quests";
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

export function World({
  cleared,
  board,
}: {
  cleared: number | null;
  /**
   * The trade board, rendered on the server and handed in.
   *
   * This component is a client one, so it cannot await the price feed
   * itself — taking the finished markup as a slot keeps the fetch off the
   * browser entirely.
   */
  board?: React.ReactNode;
}) {
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

        <Link
          href="/gallery"
          className="eyebrow px-1 text-ash transition-colors hover:text-lime"
        >
          Gallery
        </Link>
      </header>

      <main className="relative z-10">
        <Hero cleared={cleared} />

        <Rooms />

        {board}

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

        {/* The only place the account is linked outside the quests. Everything
            the drop announces goes out there, so a page that never points at
            it leaves people with nowhere to follow. */}
        <footer className="border-t-2 border-line px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <Image
              src="/brand/wordmark-lime.png"
              alt="RUXXELLS"
              width={866}
              height={245}
              className="pixelated h-4 w-auto opacity-70"
            />

            <a
              href={`https://x.com/${X_ACCOUNT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow inline-flex items-center gap-1.5 text-ash transition-colors hover:text-lime"
            >
              @{X_ACCOUNT}
              <FiArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

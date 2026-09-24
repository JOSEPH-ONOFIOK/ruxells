"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { CHAIN, DROP, DROP_PITCH } from "@/lib/sectors";
import { pad, useCountdown } from "../use-countdown";

/**
 * The hero.
 *
 * The banner is shown whole, filling the width, with the copy under it.
 *
 * It was a full-bleed background first, which meant scaling 3:1 artwork until
 * it covered a 16:9 screen: 2.16x on a desktop with 41% of the width cropped
 * off, and on a phone it kept so little that "RUXXELLS" read as "XXEL".
 * Fitting the width instead shows all of it at 1.28x — sharper and complete,
 * and the same layout works at every size.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero({ cleared }: { cleared: number | null }) {
  const { left, closed } = useCountdown(DROP.closesAt);

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {/* --- the banner, whole ---------------------------------------- */}
      {/* object-contain, not cover. Cover had to scale 3:1 artwork until it
          filled a 16:9 screen — 2.16x on a desktop, cropping 41% of the
          width away, which is both blurrier and less of the picture.
          Contain fits the width instead: the whole banner, at 1.28x. */}
      <div className="relative z-10 flex flex-1 items-center px-4 pt-24 pb-4 sm:px-6 sm:pt-20">
        <motion.div
          // On a phone the banner fitted to the width is a 120px strip in
          // the middle of an 850px screen. Scaling it well past the viewport
          // and letting the sides run off gives it a third of the screen and
          // keeps the cabinet and the crew at a size worth looking at: at
          // 240% the visible window is the middle 42%, which still holds the
          // whole wordmark.
          className="mx-auto w-[240%] max-w-none sm:w-full sm:max-w-[1500px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Image
            src="/brand/banner.png"
            alt="The Ruxxells crew"
            width={1500}
            height={500}
            priority
            // The intrinsic width is the ceiling worth requesting: the source
            // is 1500px, so asking next/image for 1920 or 3840 would upscale
            // on the server and ship a larger file with no more detail.
            sizes="(max-width: 1500px) 100vw, 1500px"
            quality={100}
            className="pixelated h-auto w-full"
          />
        </motion.div>
      </div>

      {/* --- the copy ------------------------------------------------- */}
      <div className="relative z-10 px-5 pb-12 sm:px-8 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        >
          <p className="eyebrow flex flex-wrap items-center gap-2 text-ash">
            <span className="text-lime">{DROP_PITCH.line}</span>
            {!closed && left && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums text-chalk">
                  {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
                </span>
              </>
            )}
            {closed && (
              <>
                <span aria-hidden>·</span>
                <span>Closed</span>
              </>
            )}
          </p>

          <h1 className="wordmark mt-3 max-w-2xl text-[clamp(2.2rem,9vw,5rem)] text-chalk">
            {DROP_PITCH.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/clearance"
              className="group pressable inline-flex items-center gap-2 border-2 border-lime bg-lime px-6 py-3.5 text-xs font-bold tracking-widest text-void uppercase shadow-[4px_4px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
            >
              Get cleared
              <FiArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/gallery"
              className="pressable inline-flex items-center border-2 border-line px-5 py-3.5 text-xs font-bold tracking-widest text-ash uppercase shadow-[3px_3px_0_0_rgba(0,0,0,0.5)] transition-colors hover:border-lime hover:text-lime"
            >
              The collection
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px border-2 border-line bg-line sm:grid-cols-4">
            {[
              ["Chain", CHAIN.name],
              ["Price", DROP.price],
              ["Supply", DROP.supply],
              ...(cleared !== null
                ? ([["In", cleared.toLocaleString()]] as [string, string][])
                : []),
            ].map(([key, value]) => (
              <div key={key} className="bg-panel px-4 py-3">
                <dt className="eyebrow text-lime-dim">{key}</dt>
                <dd className="wordmark mt-1.5 text-sm text-chalk tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}

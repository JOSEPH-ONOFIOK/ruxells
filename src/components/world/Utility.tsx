"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FiLock } from "react-icons/fi";
import { GATE_LABEL, UTILITIES } from "@/lib/utility";

/**
 * What a Ruxxell will do.
 *
 * The site showed four rooms and then asked for a wallet without ever saying
 * what anyone would own, which is the one thing a mint page has to answer.
 *
 * Every card is locked on purpose. None of this is built, and describing
 * unbuilt features in the present tense makes promises the drop then has to
 * keep — so each card names the door it sits behind instead. The lock is
 * styled as deliberate rather than broken: dimmed artwork, a visible gate
 * label, and no button that looks like it should work.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Utility() {
  return (
    <section className="relative px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow text-lime">In preparation</p>
        <h2 className="wordmark mt-2 text-[clamp(1.6rem,6vw,2.6rem)] text-chalk">
          What it does
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ash">
          None of this is live yet. Holding a Ruxxell is what opens it when it
          is.
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITIES.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.45,
                delay: Math.min(i, 4) * 0.06,
                ease: EASE,
              }}
              className="panel panel-tint flex flex-col overflow-hidden"
              style={{ "--tint": item.tint } as React.CSSProperties}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-void">
                <Image
                  src={item.still}
                  alt=""
                  aria-hidden
                  width={1600}
                  height={1600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  // Held back and desaturated: the artwork is a hint at what
                  // the feature is about, not a screenshot of a thing that
                  // runs.
                  className="pixelated h-full w-full object-cover opacity-35 saturate-50"
                />

                <span className="absolute inset-0 flex items-center justify-center">
                  <FiLock className="h-5 w-5 text-ash" />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="wordmark text-lg text-chalk">{item.name}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-ash">
                  {item.blurb}
                </p>

                <p
                  className="eyebrow mt-4 inline-flex items-center gap-1.5 self-start border border-line px-2 py-1.5"
                  style={{ color: item.tint }}
                >
                  <FiLock className="h-2.5 w-2.5" />
                  {GATE_LABEL[item.gate]}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

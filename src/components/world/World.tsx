"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { CHAIN, DROP, DROP_PITCH, SECTORS } from "@/lib/sectors";
import { pad, useCountdown } from "../use-countdown";
import { Boot } from "../Boot";
import { Clouds } from "./Clouds";
import { Gallery } from "./Gallery";
import { Shaft } from "./Shaft";
import { useQuality } from "./use-quality";
import { useSceneLoading } from "./use-scene-loading";

/**
 * The page.
 *
 * A tall scroll container drives a fixed 3D canvas: the rooms descend as you
 * go down, and each floor's caption is an ordinary block in the page flow
 * beside it.
 *
 * This replaced an orbiting field of floating tiles, which asked people to
 * work out that the tiles were clickable and that the camera could be steered
 * before anything happened at all. Scrolling is a thing everyone already
 * does, so the 3D is decoration over a document rather than an interface to
 * learn — and the scrollbar, keyboard, trackpad and screen readers all work
 * without anything being intercepted.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function World({ cleared }: { cleared: number | null }) {
  const page = useRef<HTMLDivElement>(null);
  const rooms = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const { left, closed } = useCountdown(DROP.closesAt);
  const quality = useQuality();
  // Both the phone tier and reduced-motion want the cheaper canvas.
  const lite = quality !== "full";

  const { loaded, total } = useSceneLoading(SECTORS.length);
  const [sceneReady, setSceneReady] = useState(false);
  const markReady = useCallback(() => setSceneReady(true), []);

  // A stalled texture would otherwise hold the boot screen forever.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGaveUp(true), 12000);
    return () => clearTimeout(t);
  }, []);
  const booted = sceneReady || gaveUp;

  /**
   * Scroll drives the descent, measured across the rooms only.
   *
   * Measuring the whole page put the hero, the gallery and the door into the
   * same 0..1 as the six rooms: nine screens of scrolling mapped onto five
   * floors, so a room centred every 1.8 screens and none of them ever lined
   * up with the caption beside it. Tracking the rooms' own container makes
   * one screen of scroll exactly one floor.
   *
   * It feeds a ref rather than state, because the 3D reads it every frame and
   * re-rendering the page on every scroll event would cost far more than the
   * animation it drives.
   */
  const { scrollYProgress } = useScroll({
    target: rooms,
    // The first room is centred when its section is, and the last when its
    // section is — so the track starts and ends half a screen inside the
    // container rather than at its edges.
    offset: ["start start", "end end"],
  });
  useEffect(
    () => scrollYProgress.on("change", (v) => (progress.current = v)),
    [scrollYProgress],
  );

  return (
    <div ref={page} className="relative">
      <Boot loaded={loaded} total={total} done={booted} />

      {/* --- the shaft, fixed behind the page ------------------------- */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Canvas
          dpr={lite ? 1 : [1, 2]}
          camera={{ fov: 40, position: [0, 0, 7.4], near: 0.1, far: 60 }}
          gl={{
            antialias: !lite,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <Ready onReady={markReady} />
            <Shaft progress={progress} />
          </Suspense>
        </Canvas>
      </div>

      {/* Weather, over the canvas and under the page. */}
      <Clouds />

      {/* --- the bar -------------------------------------------------- */}
      <motion.header
        className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 p-4 sm:p-6"
        initial={{ opacity: 0, y: -8 }}
        animate={booted ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="shrink-0 overflow-hidden border border-line/70">
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

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/gallery"
            className="eyebrow px-1 text-ash transition-colors hover:text-lime"
          >
            Gallery
          </Link>

          <Link
            href="/clearance"
            className="pressable border-2 border-lime bg-lime px-4 py-2.5 text-[11px] font-bold tracking-widest text-void uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
          >
            Get cleared
          </Link>
        </div>
      </motion.header>

      {/* --- the page ------------------------------------------------- */}
      <div className="relative z-10">
        <section className="flex min-h-[100svh] flex-col justify-end px-5 pt-24 pb-16 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={booted ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          >
            <p className="eyebrow flex flex-wrap items-center gap-2 text-ash/60">
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

            <h1 className="wordmark mt-3 max-w-2xl text-[clamp(2rem,9vw,4.5rem)] text-chalk">
              {DROP_PITCH.title}
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ash">
              Six rooms, one collection. Scroll down to go through them.
            </p>

            <LiveCount value={cleared} />
          </motion.div>
        </section>

        {/* One screen per room. The caption sits to one side so the artwork
            behind it is never covered by its own label, and this wrapper is
            what the shaft's scroll is measured against. */}
        <div ref={rooms}>
          {SECTORS.map((sector, i) => (
            <section
              key={sector.id}
              className="flex min-h-[100svh] items-end px-5 py-24 sm:items-center sm:px-8 sm:py-16"
            >
              <motion.div
                className="w-full max-w-xs sm:ml-auto"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {/* Three things, not six. The intel rows were invented
                    filler — a status and an occupant count nobody wrote a
                    story for — and they made every card read as a spec
                    sheet in front of the artwork it was describing. */}
                <div
                  className="panel panel-tint p-5"
                  style={{ "--tint": sector.tint } as React.CSSProperties}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="eyebrow" style={{ color: sector.tint }}>
                      {sector.code}
                    </p>
                    <span className="eyebrow text-ash tabular-nums">
                      {String(i + 1).padStart(2, "0")}/
                      {String(SECTORS.length).padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="wordmark mt-2.5 text-2xl text-chalk">
                    {sector.name}
                  </h2>
                  <p className="mt-3 text-xs leading-relaxed text-ash">
                    {sector.blurb}
                  </p>
                </div>
              </motion.div>
            </section>
          ))}
        </div>

        <Gallery />

        {/* The door. */}
        <section className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {/* The crew, at the bottom of the descent. It is the only place
                on the page the characters are seen at their own scale rather
                than as figures inside a room. */}
            <div className="panel ticked mx-auto mb-8 max-w-md overflow-hidden">
              <Image
                src="/brand/banner.png"
                alt="The Ruxxells crew"
                width={1500}
                height={500}
                sizes="(max-width: 640px) 100vw, 28rem"
                className="pixelated h-auto w-full"
              />
            </div>

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
              Four steps, then your wallet.
            </p>

            {/* The facts, as a readout rather than a sentence — a mint page
                is judged on chain, price and supply, and burying them in
                prose makes them look like something being downplayed. */}
            <dl className="mx-auto mt-7 grid max-w-sm grid-cols-3 gap-px border border-line bg-line">
              {[
                ["Chain", CHAIN.name],
                ["Price", DROP.price],
                ["Supply", DROP.supply],
              ].map(([key, value]) => (
                <div key={key} className="bg-panel px-3 py-3">
                  <dt className="eyebrow text-ash/50">{key}</dt>
                  <dd className="wordmark mt-1.5 text-sm text-chalk">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href="/clearance"
              className="group pressable mt-8 inline-flex items-center gap-2 border-2 border-lime bg-lime px-8 py-4 text-xs font-bold tracking-widest text-void uppercase shadow-[4px_4px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
            >
              Start
              <FiArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </section>
      </div>

      <ScrollHint show={booted} />
    </div>
  );
}

/**
 * The wallet count, as a live figure.
 *
 * It polls rather than sitting still, because the number people want from a
 * mint page is how fast the list is filling — a static count read once on
 * load says nothing about that. The dot pulses only when the figure actually
 * moves, so it reports rather than decorates.
 */
function LiveCount({ value }: { value: number | null }) {
  const [count, setCount] = useState(value);
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const read = async () => {
      try {
        const res = await fetch("/api/allowlist", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || typeof data.count !== "number") return;
        setCount((prev) => {
          if (prev !== null && data.count !== prev) setBumped(true);
          return data.count;
        });
      } catch {
        // A failed poll keeps the last good figure. A counter that blanks
        // out on one dropped request looks broken rather than honest.
      }
    };

    // Thirty seconds is often enough to feel live without hammering the
    // sheet, which is rate-limited upstream.
    const id = setInterval(read, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!bumped) return;
    const t = setTimeout(() => setBumped(false), 1200);
    return () => clearTimeout(t);
  }, [bumped]);

  if (count === null) return null;

  return (
    <div className="mt-6 inline-flex items-center gap-2.5 border border-line bg-panel/70 px-3.5 py-2.5 backdrop-blur-sm">
      <motion.span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 bg-lime"
        animate={bumped ? { scale: [1, 2.4, 1], opacity: [1, 0.4, 1] } : {}}
        transition={{ duration: 0.6 }}
      />
      <p className="wordmark text-lg text-lime tabular-nums">
        {count.toLocaleString()}
      </p>
      <p className="eyebrow text-ash/60">wallets in</p>
    </div>
  );
}

/** Reports that everything suspending inside the boundary has resolved. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

/**
 * Tells people the page scrolls, and stops as soon as they know.
 *
 * The canvas is fixed and full-bleed, so the first screen can read as a
 * static image on a device with no visible scrollbar.
 */
function ScrollHint({ show }: { show: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) setScrolled(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && !scrolled && (
        <motion.p
          className="eyebrow pointer-events-none fixed inset-x-0 bottom-5 z-30 text-center text-ash/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          Scroll
        </motion.p>
      )}
    </AnimatePresence>
  );
}

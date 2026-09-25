"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { FiArrowUpRight, FiVolume2, FiVolumeX, FiX } from "react-icons/fi";
import { HOTSPOTS, type Hotspot } from "@/lib/checkpoint";
import { useSound } from "./use-sound";

/**
 * The checkpoint, as a place.
 *
 * One room filling the screen, a guard in the doorway, and four things in it
 * that open. No scrolling: everything is in the frame, and the only way
 * deeper is to touch something.
 *
 * The hotspots are boxes in plate percentages rather than pixels, so they
 * ride the plate's object-cover scaling instead of needing recalculating on
 * every resize. Each one is a real button — the scene is navigable by
 * keyboard, which a canvas of click targets would not be.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene() {
  const [open, setOpen] = useState<Hotspot | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const sound = useSound();

  // How far the guard leans, in pixels. A motion value rather than state:
  // the pointer moves constantly, and re-rendering four hotspots and a panel
  // at pointer rate to shift one figure eight pixels is work for nothing.
  const lean = useMotionValue(0);
  const leanSpring = useSpring(lean, {
    stiffness: 90,
    damping: 18,
    mass: 0.4,
  });

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      const box = frame.current?.getBoundingClientRect();
      if (!box) return;
      const x = ((e.clientX - box.left) / box.width) * 2 - 1;
      lean.set(x * 8);
    },
    [reduced, lean],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /**
   * Hints, for anyone who has stood in the room a while without touching
   * anything.
   *
   * They arrive one at a time rather than all at once: four labels appearing
   * together would be the diagram the hover states were written to avoid.
   * The first is late enough to let someone find things on their own.
   */
  const [hint, setHint] = useState(-1);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) return;

    const first = setTimeout(() => setHint(0), 6000);
    const cycle = setInterval(
      () => setHint((h) => (h + 1) % HOTSPOTS.length),
      4200,
    );

    return () => {
      clearTimeout(first);
      clearInterval(cycle);
    };
  }, [touched]);

  return (
    <div
      ref={frame}
      onPointerMove={onMove}
      className="relative h-[100svh] w-full overflow-hidden bg-void"
    >
      {/* --- the room ------------------------------------------------- */}
      <Image
        src="/scene/bay.jpg"
        alt="The Holding Bay"
        fill
        priority
        sizes="100vw"
        quality={100}
        className="pixelated object-cover object-center"
      />

      {/* Pulls the edges down so the panels and the guard read against it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_30%,rgba(5,6,7,0.8)_100%)]"
      />

      {/* --- the guard, and the door he is holding -------------------- */}
      {/* He stands in the only way through, so the whole figure is the
          link rather than a button parked next to him. */}
      <motion.div
        className="group absolute bottom-[8%] left-1/2 w-[min(46vw,17rem)] -translate-x-1/2"
        // The centring lives on this element as a Tailwind class and the lean
        // on the child, because Framer writes the whole transform and would
        // drop the translate if both were here.
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        // He leans a little toward the cursor. Small: he is standing at a
        // post, not following anyone around the room.
      >
        <motion.div style={{ x: reduced ? 0 : leanSpring }}>
          <Link
            href="/world"
            aria-label="Through the door, into the world"
            onClick={() => sound.play("door")}
            onPointerEnter={() => sound.play("hover")}
          >
            <Image
              src="/scene/clerk.gif"
              alt="A Ruxxell holding the door"
              width={300}
              height={520}
              unoptimized
              priority
              className="pixelated h-auto w-full transition-[filter] duration-300 group-hover:brightness-110"
            />

            {/* The doorway lights from behind on approach: the art already has
              a dark frame around him, so warming it reads as the door being
              open rather than a rectangle being highlighted. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[18%] top-[4%] bottom-[10%] -z-10 bg-lime/0 blur-2xl transition-colors duration-500 group-hover:bg-lime/25"
            />

            <span className="eyebrow absolute inset-x-0 -bottom-7 text-center text-lime opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              Through the door
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* --- the hotspots --------------------------------------------- */}
      {HOTSPOTS.map((spot, i) => (
        <motion.button
          key={spot.id}
          type="button"
          onClick={() => {
            setOpen(spot);
            setTouched(true);
            sound.play("open");
          }}
          onPointerEnter={() => {
            setHovered(spot.id);
            sound.play("hover");
          }}
          onPointerLeave={() => setHovered(null)}
          onFocus={() => setHovered(spot.id)}
          onBlur={() => setHovered(null)}
          aria-label={spot.label}
          className="absolute cursor-pointer"
          style={{
            left: `${spot.box.x}%`,
            top: `${spot.box.y}%`,
            width: `${spot.box.w}%`,
            height: `${spot.box.h}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 + i * 0.08 }}
        >
          {/* Nothing is drawn until it is pointed at: the room is the
              picture, and outlining four boxes over it permanently would
              turn it into a diagram of itself. */}
          <span
            aria-hidden
            className={`absolute inset-0 border-2 transition-all duration-300 ${
              hovered === spot.id
                ? "border-lime bg-lime/10"
                : hint === i
                  ? "border-lime/45"
                  : "border-transparent"
            }`}
          />
          <span
            aria-hidden
            className={`eyebrow absolute -top-6 left-0 whitespace-nowrap transition-opacity duration-300 ${
              hovered === spot.id
                ? "text-lime opacity-100"
                : hint === i
                  ? "text-lime/70 opacity-100"
                  : "opacity-0"
            }`}
          >
            {hovered === spot.id ? spot.label : spot.hint}
          </span>
        </motion.button>
      ))}

      {/* --- chrome --------------------------------------------------- */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
        <Link href="/" className="pointer-events-auto">
          <Image
            src="/brand/wordmark-lime.png"
            alt="RUXXELLS"
            width={866}
            height={245}
            className="pixelated h-4 w-auto"
            priority
          />
        </Link>

        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              sound.toggle();
              // Plays on the way on, so turning it up demonstrates itself.
              if (!sound.on) setTimeout(() => sound.play("open"), 60);
            }}
            aria-label={sound.on ? "Turn sound off" : "Turn sound on"}
            aria-pressed={sound.on}
            className={`flex h-10 w-10 items-center justify-center border-2 transition-colors ${
              sound.on
                ? "border-lime text-lime"
                : "border-line text-ash hover:border-lime hover:text-lime"
            }`}
          >
            {sound.on ? (
              <FiVolume2 className="h-4 w-4" />
            ) : (
              <FiVolumeX className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/clearance"
            className="pressable border-2 border-lime bg-lime px-4 py-2.5 text-[11px] font-bold tracking-widest text-void uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
          >
            Get cleared
          </Link>
        </div>
      </header>

      <motion.p
        className="eyebrow pointer-events-none absolute inset-x-0 bottom-5 z-20 text-center text-ash"
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        Something in here opens
      </motion.p>

      <Panel
        spot={open}
        onClose={() => {
          setOpen(null);
          sound.play("close");
        }}
      />
    </div>
  );
}

function Panel({
  spot,
  onClose,
}: {
  spot: Hotspot | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {spot && (
        <motion.div
          className="absolute inset-0 z-30 flex items-end justify-center p-4 sm:items-center sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={spot.panel.title}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
          />

          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="panel ticked relative w-full max-w-sm p-6"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center text-ash transition-colors hover:text-lime"
            >
              <FiX className="h-4 w-4" />
            </button>

            <p className="eyebrow text-lime-dim">{spot.label}</p>
            <h2 className="wordmark mt-2.5 text-2xl text-chalk">
              {spot.panel.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ash">
              {spot.panel.body}
            </p>

            {spot.panel.action && (
              <Link
                href={spot.panel.action.href}
                className="pressable mt-6 inline-flex items-center gap-2 border-2 border-lime bg-lime px-5 py-3 text-[11px] font-bold tracking-widest text-void uppercase shadow-[3px_3px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
              >
                {spot.panel.action.label}
                <FiArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

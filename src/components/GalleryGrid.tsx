"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { PIECES, type Piece } from "@/lib/gallery";

/**
 * The collection, as a grid you can open.
 *
 * A mosaic: every fifth piece takes a double cell, so the eye has somewhere
 * to land rather than scanning a wall of identical squares. The rhythm comes
 * from the index rather than a random draw, so the layout is the same on
 * every visit and matches what the server rendered.
 *
 * Labels ride over the artwork on hover and sit permanently on touch, where
 * there is no hover to reveal them.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

type Filter = "all" | "rooms" | "frames";

const FILTERS: [Filter, string][] = [
  ["all", "Everything"],
  ["rooms", "The descent"],
  ["frames", "The rest"],
];

export function GalleryGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  const shown = PIECES.filter((p) =>
    filter === "all" ? true : filter === "rooms" ? p.featured : !p.featured,
  );

  // Dealt alternately rather than cut down the middle, so the two columns
  // hold a mix of rooms and frames instead of all the named pieces landing
  // on the left.
  const left = shown.filter((_, i) => i % 2 === 0);
  const right = shown.filter((_, i) => i % 2 === 1);

  // The columns know a piece, not its index in `shown`, so opening one has
  // to look the index back up.
  const onOpen = useCallback(
    (piece: Piece) => setOpen(shown.findIndex((p) => p.id === piece.id)),
    [shown],
  );

  // Paging wraps, so the arrows never dead-end on the first or last piece.
  const step = useCallback(
    (by: number) =>
      setOpen((i) =>
        i === null ? null : (i + by + shown.length) % shown.length,
      ),
    [shown.length],
  );

  /**
   * Warm the neighbours.
   *
   * These are 1600px frames, roughly 380KB each, and nothing was fetching
   * them until the arrow was pressed — so every step paid a full network
   * round trip before anything moved. Preloading the piece either side means
   * the common case is a swap between two images already in cache.
   *
   * The URL has to be the optimised one next/image will actually request:
   * warming the raw path would fill the cache with a file the lightbox never
   * asks for. Which width bucket it picks depends on the viewport and the
   * device pixel ratio, so both plausible ones are warmed — a second request
   * for an image already on its way costs nothing, a miss costs the whole
   * wait this is meant to remove.
   */
  useEffect(() => {
    if (open === null) return;

    for (const by of [1, -1]) {
      const neighbour = shown[(open + by + shown.length) % shown.length];
      if (!neighbour) continue;

      // A GIF is served straight from public/ because the lightbox marks it
      // unoptimized, so warming an /_next/image URL for it would fetch a
      // file the lightbox never asks for.
      if (neighbour.gif) {
        const img = new window.Image();
        img.src = neighbour.gif;
        continue;
      }

      for (const w of [640, 1080]) {
        const img = new window.Image();
        img.src = `/_next/image?url=${encodeURIComponent(neighbour.src)}&w=${w}&q=100`;
      }
    }
  }, [open, shown]);

  // Arrow keys and escape, because a lightbox that only answers to clicks is
  // the kind that traps someone on a laptop.
  useEffect(() => {
    if (open === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };

    window.addEventListener("keydown", onKey);
    // The page behind must not scroll while the overlay is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              // The open index refers to the old list, so it would point at
              // a different piece once the filter changes.
              setOpen(null);
            }}
            aria-pressed={filter === key}
            className={`pressable border-2 px-3.5 py-2 text-[11px] font-bold tracking-wider uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors ${
              filter === key
                ? "border-lime bg-lime text-void"
                : "border-line text-ash hover:border-lime hover:text-lime"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Two drifting columns on a phone, a mosaic from sm up. A 2x11 grid
          on a narrow screen is a very long scroll for artwork meant to be
          taken in at a glance; columns that move on their own show the same
          twenty-two while standing still. */}
      <div className="grid grid-cols-2 gap-3 overflow-hidden sm:hidden">
        <Column pieces={left} onOpen={onOpen} direction="up" />
        <Column pieces={right} onOpen={onOpen} direction="down" />
      </div>

      <motion.ul
        layout
        className="hidden auto-rows-auto gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-6"
      >
        {shown.map((piece, i) => (
          <motion.li
            key={piece.id}
            layout
            className={i % 5 === 0 ? "col-span-2 row-span-2" : "col-span-1"}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.min(i, 10) * 0.035,
              ease: EASE,
            }}
            whileHover={{ y: -4 }}
          >
            <Tile piece={piece} onOpen={() => setOpen(i)} eager={i < 8} />
          </motion.li>
        ))}
      </motion.ul>

      <Lightbox
        piece={open === null ? null : shown[open]}
        onClose={() => setOpen(null)}
        onStep={step}
        position={open === null ? "" : `${open + 1} / ${shown.length}`}
      />
    </>
  );
}

/**
 * One column of the phone layout, drifting on its own.
 *
 * The strip is rendered twice end to end and animated exactly one copy's
 * height, so the moment it wraps the second copy sits where the first began
 * and the loop has no seam.
 */
function Column({
  pieces,
  onOpen,
  direction,
}: {
  pieces: Piece[];
  onOpen: (piece: Piece) => void;
  direction: "up" | "down";
}) {
  const reduced = useReducedMotion();
  const loop = [...pieces, ...pieces];

  // Slow enough to read a tile as it passes; the two differ so the columns
  // never fall into step with each other.
  const duration = direction === "up" ? 46 : 54;

  return (
    // Tall enough to hold about five tiles: four whole and one part-shown at
    // the edge, which is what says the column continues rather than ending.
    // Five entire tiles is 912px, taller than a phone screen.
    <div className="h-[88svh] max-h-[46rem] overflow-hidden">
      <motion.div
        className="flex flex-col gap-3"
        animate={
          reduced
            ? {}
            : { y: direction === "up" ? ["0%", "-50%"] : ["-50%", "0%"] }
        }
        transition={
          reduced ? undefined : { duration, repeat: Infinity, ease: "linear" }
        }
      >
        {loop.map((piece, i) => (
          <Tile
            key={`${piece.id}-${i}`}
            piece={piece}
            onOpen={() => onOpen(piece)}
            eager={i < 4}
          />
        ))}
      </motion.div>
    </div>
  );
}

/** One piece, in either layout. */
function Tile({
  piece,
  onOpen,
  eager,
}: {
  piece: Piece;
  onOpen: () => void;
  eager: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group panel-sm pressable block w-full shrink-0 overflow-hidden text-left"
      style={
        piece.tint
          ? ({ borderColor: piece.tint } as React.CSSProperties)
          : undefined
      }
    >
      <div className="relative aspect-square overflow-hidden bg-void">
        <Image
          src={piece.src}
          alt={piece.label}
          width={piece.width}
          height={piece.height}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
          className="pixelated h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading={eager ? "eager" : "lazy"}
        />

        {/* The label rides over the artwork on hover instead of taking a
            permanent bar under it: twenty-two captions stacked under
            twenty-two images is most of what made the grid feel like a
            table. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/85 to-transparent px-2.5 pt-6 pb-2 transition-transform duration-300 [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-focus-visible:translate-y-0">
          <span className="block truncate text-[11px] font-bold text-chalk">
            {piece.label}
          </span>
        </div>

        {piece.featured && (
          <span
            aria-hidden
            className="absolute top-2 right-2 h-2 w-2"
            style={{ background: piece.tint }}
          />
        )}

        {/* Marks the ones that move when opened. The grid keeps its posters:
            twenty-two animations at once is several megabytes and far too
            much motion to read. */}
        {piece.gif && !piece.featured && (
          <span
            aria-hidden
            className="absolute top-2 right-2 h-2 w-2 bg-lime"
          />
        )}
      </div>
    </button>
  );
}

function Lightbox({
  piece,
  onClose,
  onStep,
  position,
}: {
  piece: Piece | null;
  onClose: () => void;
  onStep: (by: number) => void;
  position: string;
}) {
  return (
    <AnimatePresence>
      {piece && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/92 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={piece.label}
        >
          <motion.div
            // Clicking the artwork should not close what you opened to see.
            onClick={(e) => e.stopPropagation()}
            className="panel relative flex max-h-[88svh] w-full max-w-lg flex-col overflow-hidden"
            style={
              piece.tint
                ? ({ borderColor: piece.tint } as React.CSSProperties)
                : undefined
            }
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {/* min-h-0 lets this shrink inside the flex column; without it
                the image keeps its intrinsic height and pushes the caption
                and the arrows off a landscape phone. */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {/* Keyed on the piece so stepping crossfades rather than
                  leaving the old frame in place until the new one decodes.
                  Kept very short: this is feedback for a button press, not
                  a transition worth watching. */}
              <motion.div
                key={piece.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
                className="h-full w-full"
              >
                {/* The animation where there is one, the still otherwise.
                    Unoptimized is required for a GIF, not a shortcut:
                    next/image re-encodes it to a still WebP and it stops
                    moving. */}
                <Image
                  src={piece.gif ?? piece.src}
                  alt={piece.label}
                  width={piece.width}
                  height={piece.height}
                  sizes="(max-width: 640px) 92vw, 32rem"
                  className="pixelated h-full w-full object-contain"
                  unoptimized={Boolean(piece.gif)}
                  priority
                />
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t-2 border-line px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-chalk">
                  {piece.label}
                </p>
                <p className="eyebrow mt-0.5 text-lime-dim tabular-nums">
                  {position}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Arrow label="Previous" onClick={() => onStep(-1)}>
                  <FiChevronLeft className="h-4 w-4" />
                </Arrow>
                <Arrow label="Next" onClick={() => onStep(1)}>
                  <FiChevronRight className="h-4 w-4" />
                </Arrow>
              </div>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center border-2 border-line bg-panel text-ash transition-colors hover:border-lime hover:text-lime sm:top-6 sm:right-6"
          >
            <FiX className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Arrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pressable flex h-11 w-11 items-center justify-center border-2 border-line text-ash shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors hover:border-lime hover:text-lime"
    >
      {children}
    </button>
  );
}

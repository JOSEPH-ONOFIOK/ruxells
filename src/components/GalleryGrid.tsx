"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { PIECES, type Piece } from "@/lib/gallery";

/**
 * The collection, as a grid you can open.
 *
 * Deliberately a plain grid: the home page is already a scroll-driven 3D
 * descent, and a second clever layout would be a second thing to work out
 * rather than somewhere to look at the artwork. The only flourish is the
 * lightbox, which earns its place because these are 1600px frames shown at
 * a couple of hundred pixels in the grid.
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

  // Paging wraps, so the arrows never dead-end on the first or last piece.
  const step = useCallback(
    (by: number) =>
      setOpen((i) =>
        i === null ? null : (i + by + shown.length) % shown.length,
      ),
    [shown.length],
  );

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

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((piece, i) => (
          <motion.li
            key={piece.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: Math.min(i, 8) * 0.03,
              ease: EASE,
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group panel-sm pressable block w-full overflow-hidden text-left"
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
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="pixelated h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading={i < 8 ? "eager" : "lazy"}
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t-2 border-line px-2.5 py-2">
                <span className="truncate text-[11px] font-bold text-chalk">
                  {piece.label}
                </span>
                {piece.featured && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0"
                    style={{ background: piece.tint }}
                  />
                )}
              </div>
            </button>
          </motion.li>
        ))}
      </ul>

      <Lightbox
        piece={open === null ? null : shown[open]}
        onClose={() => setOpen(null)}
        onStep={step}
        position={open === null ? "" : `${open + 1} / ${shown.length}`}
      />
    </>
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
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={piece.label}
        >
          <motion.div
            // Clicking the artwork should not close what you opened to see.
            onClick={(e) => e.stopPropagation()}
            className="panel relative w-full max-w-lg overflow-hidden"
            style={
              piece.tint
                ? ({ borderColor: piece.tint } as React.CSSProperties)
                : undefined
            }
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <Image
              src={piece.src}
              alt={piece.label}
              width={piece.width}
              height={piece.height}
              sizes="(max-width: 640px) 92vw, 32rem"
              className="pixelated h-auto w-full"
              priority
            />

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
            className="absolute top-4 right-4 border-2 border-line bg-panel p-2 text-ash transition-colors hover:border-lime hover:text-lime sm:top-6 sm:right-6"
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
      className="pressable border-2 border-line p-2 text-ash shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors hover:border-lime hover:text-lime"
    >
      {children}
    </button>
  );
}

"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiX } from "react-icons/fi";
import { SECTORS } from "@/lib/sectors";
import { DROP, DROP_PITCH } from "@/lib/sectors";
import { pad, useCountdown } from "../use-countdown";
import { Boot } from "../Boot";
import { Clouds } from "./Clouds";
import { Rig } from "./Rig";
import { Tile } from "./Tile";
import { useQuality } from "./use-quality";
import { useSceneLoading } from "./use-scene-loading";

/**
 * The map.
 *
 * Six rooms floating in cloud, laid out as a ring you look into rather than a
 * grid you read across — the artwork is isometric and a grid would fight it.
 * Clicking one flies the camera in; the panel that opens is HTML over the
 * canvas rather than in-scene text, because it has to be selectable, linkable
 * and readable by a screen reader.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Where each tile sits.
 *
 * A ring with the y-offsets staggered, so the field has a top and a bottom
 * from every angle instead of reading as a carousel. Hand-placed rather than
 * generated: six is few enough that the arrangement is a composition.
 */
const LAYOUT: [number, number, number][] = [
  [-6.4, 1.1, -1.2],
  [-2.1, -1.4, 2.6],
  [2.2, 1.5, 1.4],
  [6.5, -0.6, -1.8],
  [1.4, -1.9, -4.8],
  [-3.6, 1.9, -5.4],
];

/**
 * Halves the frame rate.
 *
 * The camera drifts and the tiles bob, so there is always something to draw
 * and r3f's demand mode is not an option. Capping the loop instead is barely
 * visible at the speed this scene moves, and it is the difference between a
 * warm phone and a hot one the OS then throttles anyway.
 *
 * `renderPriority` 1 takes over the render loop, so this runs once for the
 * whole scene rather than per component.
 */
function Throttle() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const last = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t - last.current < 1 / 30) return;
    last.current = t;
    gl.render(scene, camera);
  }, 1);

  return null;
}

/** Reports that everything suspending inside the boundary has resolved. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

export function World({ cleared }: { cleared: number | null }) {
  const [focus, setFocus] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });
  const { left, closed } = useCountdown(DROP.closesAt);

  // One texture per tile, so that is what "loaded" counts up to.
  const quality = useQuality();
  const lite = quality === "lite";
  const { loaded, total } = useSceneLoading(SECTORS.length);
  const [sceneReady, setSceneReady] = useState(false);
  // Stable, so mounting Ready does not re-run its effect on every render.
  const markReady = useCallback(() => setSceneReady(true), []);

  // A stalled request would otherwise hold the boot screen forever. After
  // this the world is shown regardless — a half-populated map someone can
  // use beats a bar that never fills.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGaveUp(true), 12000);
    return () => clearTimeout(t);
  }, []);

  const booted = sceneReady || gaveUp;

  const active = focus === null ? null : SECTORS[focus];

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((e.clientX - box.left) / box.width) * 2 - 1,
      y: ((e.clientY - box.top) / box.height) * 2 - 1,
    };
  }, []);

  const target = useMemo(
    () => (focus === null ? null : LAYOUT[focus]),
    [focus],
  );

  return (
    <div
      className="relative h-[100svh] w-full overflow-hidden"
      onPointerMove={onPointerMove}
    >
      {/* --- the world ------------------------------------------------ */}
      <Canvas
        className={hovering ? "cursor-pointer" : "cursor-grab"}
        // The tiles are pixel art; anything above 2 spends fill rate on
        // detail the source doesn't have, and on a phone even 2 is more
        // pixels than the artwork can fill.
        dpr={lite ? 1 : [1, 2]}
        camera={{ fov: 42, position: [0, 2.2, 15.5], near: 0.1, far: 120 }}
        // Nothing in the scene has a diagonal edge that antialiasing would
        // help: every tile is a quad with a hard alpha cutout. On a phone it
        // is pure cost.
        gl={{ antialias: !lite, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => setFocus(null)}
      >
        <Suspense fallback={null}>
          {/* Mounted only once every texture inside this boundary has
              resolved, which is the signal the boot screen actually waits
              on. The loading manager drives the bar, but it cannot report
              readiness: on a warm cache it may finish before the subscribing
              effect runs, and no progress event would ever arrive. */}
          <Ready onReady={markReady} />
          {lite && <Throttle />}

          <Clouds dimmed={focus !== null} lite={lite} />

          {SECTORS.map((sector, i) => (
            <Tile
              key={sector.id}
              sector={sector}
              position={LAYOUT[i]}
              index={i}
              active={focus === i}
              focused={focus !== null}
              onSelect={() => setFocus(focus === i ? null : i)}
              onHover={setHovering}
            />
          ))}

          <Rig target={target} pointer={pointer} />
        </Suspense>
      </Canvas>

      <Boot loaded={loaded} total={total} done={booted} />

      {/* --- chrome --------------------------------------------------- */}
      <motion.header
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-7"
        initial={{ opacity: 0, y: -8 }}
        animate={booted ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
      >
        {/* The soldier stands watch over the map — the one figure at a human
            scale next to six rooms seen from above, which is what gives the
            tiles their size. He is the same character whose eyes are the
            logo mark. */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="panel relative shrink-0 overflow-hidden">
            <Image
              src="/brand/soldier.gif"
              alt="A Ruxxell in full kit, watching the door"
              width={1453}
              height={1455}
              className="pixelated h-11 w-11 object-cover sm:h-14 sm:w-14"
              unoptimized
              priority
            />
          </div>

          <Link href="/" className="pointer-events-auto">
            <Image
              src="/brand/wordmark-lime.png"
              alt="RUXXELLS"
              width={866}
              height={245}
              className="pixelated h-4 w-auto sm:h-6"
              priority
            />
          </Link>
        </div>

        <div className="shrink-0 text-right">
          <p className="eyebrow text-ash">{closed ? "Door" : "Closes in"}</p>
          <p className="wordmark mt-1 text-base tabular-nums text-chalk sm:text-lg">
            {closed ? (
              <span className="text-ash">Shut</span>
            ) : left ? (
              `${pad(left.hours)}:${pad(left.minutes)}:${pad(left.seconds)}`
            ) : (
              <span className="text-ash/40">--:--:--</span>
            )}
          </p>
        </div>
      </motion.header>

      {/* --- the pitch, while nothing is focused ---------------------- */}
      <AnimatePresence>
        {focus === null && booted && (
          <motion.div
            key="pitch"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* Six dots: the only way to reach a room on a touch screen where
                tapping a small tile at this camera distance is a coin flip.
                Hidden from `sm` up, where clicking the tile itself works. */}
            <div className="pointer-events-auto mb-4 flex items-center gap-1.5 sm:hidden">
              {SECTORS.map((sector, i) => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => setFocus(i)}
                  aria-label={`Look at ${sector.name}`}
                  className="h-7 flex-1 border border-line bg-panel/80 transition-colors active:border-lime"
                  style={{ borderBottomColor: sector.tint }}
                >
                  <span className="font-mono text-[10px] text-ash">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
              <div>
                <p className="eyebrow text-lime">{DROP_PITCH.line}</p>
                <h1 className="wordmark mt-2 text-[clamp(1.6rem,8vw,3.4rem)] text-chalk">
                  {DROP_PITCH.title}
                </h1>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-ash">
                  Six rooms, floating. Pick one to look inside, then take the
                  door.
                </p>
              </div>

              <div className="pointer-events-auto flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                {cleared !== null && (
                  <div className="sm:text-right">
                    <p className="eyebrow text-ash">Cleared</p>
                    <p className="wordmark mt-1 text-xl text-lime tabular-nums">
                      {cleared.toLocaleString()}
                    </p>
                  </div>
                )}
                <Link
                  href="/clearance"
                  className="group inline-flex items-center gap-2 border border-lime bg-lime px-5 py-3 text-xs font-bold tracking-widest text-void uppercase transition-colors hover:bg-transparent hover:text-lime"
                >
                  Get cleared
                  <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- the focused sector --------------------------------------- */}
      <AnimatePresence>
        {active && (
          <motion.aside
            key={active.id}
            // On a phone this is a bottom sheet — it rises from the edge and
            // leaves the top two thirds of the screen showing the room the
            // camera just flew to. From `sm` up it becomes the side panel,
            // where there is width to spare beside the world.
            className="absolute inset-x-0 bottom-0 z-20 p-4 sm:inset-y-0 sm:right-0 sm:left-auto sm:flex sm:w-[22rem] sm:flex-col sm:justify-center sm:p-7"
            initial={{ opacity: 0, y: 40, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 40, x: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="panel ticked relative p-5">
              <button
                type="button"
                onClick={() => setFocus(null)}
                aria-label="Back to the map"
                className="absolute top-3 right-3 text-ash transition-colors hover:text-lime"
              >
                <FiX className="h-4 w-4" />
              </button>

              <p className="eyebrow" style={{ color: active.tint }}>
                {active.code}
              </p>
              <h2 className="wordmark mt-2 text-2xl text-chalk">
                {active.name}
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-ash">
                {active.blurb}
              </p>

              <dl className="mt-5 space-y-1 border-t border-line pt-4">
                {active.intel.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-3 text-[11px]"
                  >
                    <dt className="uppercase tracking-wider text-ash/60">
                      {key}
                    </dt>
                    <dd className="font-bold text-chalk">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="eyebrow text-ash/50">
                  {String(focus! + 1).padStart(2, "0")} / 06
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFocus(((focus ?? 0) + 1) % SECTORS.length)
                  }
                  className="border border-line px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase text-ash transition-colors hover:border-lime hover:text-lime"
                >
                  Next room
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* A hint, only while nothing has been touched yet. */}
      <AnimatePresence>
        {focus === null && (
          <motion.p
            // Hidden on touch, where the dots above are the way in and a
            // "click" instruction would be wrong.
            className="eyebrow pointer-events-none absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 text-ash/40 sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            Click a room
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { TextureLoader, type Group, type Mesh } from "three";
import * as THREE from "three";
import { SECTORS } from "@/lib/sectors";
import { Ambience } from "./Ambience";
import { Dust } from "./Dust";
import { useQuality } from "./use-quality";

/**
 * The descent.
 *
 * Six rooms stacked on one vertical track, and scrolling lowers the camera
 * past them. It replaces an orbiting field of floating tiles, which asked
 * people to work out that the tiles were clickable and that the camera could
 * be steered before anything happened at all.
 *
 * This asks for one thing they already know how to do. The 3D is still real
 * — the rooms sit at true depths and pass with parallax — but the axis is a
 * scrollbar, so there is nothing to discover.
 */

/**
 * World units between one room and the next.
 *
 * Close enough that the outgoing room is still leaving as the next arrives.
 * Wider than about 6 and the two stop overlapping at all, which is what made
 * the descent feel like separate slides with nothing in between.
 */
const FLOOR_GAP = 5;

/** Reused by every room's distance read, rather than one Vector3 a frame. */
const scratch = new THREE.Vector3();
const ROOM_SIZE = 4.2;

export function Shaft({ progress }: { progress: React.RefObject<number> }) {
  const quality = useQuality();
  // Only reduced-motion gets a frozen frame; a phone gets the small sheet,
  // so the rooms stay alive on the devices most people are holding.
  const frozen = quality === "still";
  const rig = useRef<Group>(null);
  const size = useThree((s) => s.size);

  /**
   * How far the stack sits from the camera.
   *
   * A narrow viewport sees less across, so the rooms move back to stay framed
   * rather than cropped. This scales the stack instead of moving the camera:
   * the camera is shared scene state, and writing to it every frame is the
   * kind of mutation that makes a scene hard to reason about later.
   */
  const aspect = size.width / size.height;
  const depth = aspect < 1 ? -7.4 * (Math.min(1 / aspect, 1.7) - 1) : 0;

  useFrame((_, delta) => {
    if (!rig.current) return;

    // The stack slides up past a fixed camera rather than the camera flying
    // down it. Same picture, one moving object.
    //
    // The follow is frame-rate independent and much tighter than it was: at
    // 0.09 per frame the shaft lagged visibly behind a fast scroll, so the
    // artwork and the caption beside it were never in the same place at the
    // same time. This still smooths a jittery trackpad without trailing.
    const ease = 1 - Math.pow(0.001, delta);
    const target = progress.current * (SECTORS.length - 1) * FLOOR_GAP;
    rig.current.position.y += (target - rig.current.position.y) * ease;
    rig.current.position.z += (depth - rig.current.position.z) * ease;
  });

  return (
    <>
      {/* The light each room casts into the shaft, cross-faded between
          floors so the descent changes colour as it goes. */}
      <Ambience progress={progress} />

      {/* The shaft itself, outside the moving rig: it reads the scroll on its
          own so its layers can travel at their own speeds. */}
      <Dust progress={progress} lite={quality !== "full"} />

      <group ref={rig}>
        {SECTORS.map((sector, i) => (
          <Room
            key={sector.id}
            src={
              frozen
                ? sector.still
                : quality === "lite"
                  ? sector.tileSm
                  : sector.tile
            }
            y={-i * FLOOR_GAP}
            index={i}
            lite={frozen}
          />
        ))}
      </group>
    </>
  );
}

type SheetMeta = {
  frames: number;
  cols: number;
  rows: number;
  fps: number;
};

function Room({
  src,
  y,
  index,
  lite,
}: {
  src: string;
  y: number;
  index: number;
  lite: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const shared = useLoader(TextureLoader, src);
  const [meta, setMeta] = useState<SheetMeta | null>(null);

  /**
   * The sheet's grid, from the sidecar the build script writes.
   *
   * Without it the whole 8x5 sheet paints onto the quad and the room renders
   * as a grid of forty tiny copies of itself — which is exactly what it did
   * until this was restored.
   */
  useEffect(() => {
    if (lite) return;

    let cancelled = false;
    fetch(src.replace(/\.png$/, ".json"))
      .then((r) => r.json())
      .then((m: SheetMeta) => {
        if (!cancelled) setMeta(m);
      })
      // A missing sidecar means the file is a plain still, which is a fine
      // thing for it to be, so this failure is silent by design.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src, lite]);

  /**
   * Our own copy.
   *
   * `useLoader` caches by URL and hands every caller the same object, and
   * each room needs its own sampling state to write. Cloning shares the
   * uploaded GPU image while keeping those settings separate.
   */
  const texture = useMemo(() => {
    const own = shared.clone();
    own.magFilter = THREE.NearestFilter;
    own.minFilter = THREE.NearestFilter;
    own.generateMipmaps = false;
    own.colorSpace = THREE.SRGBColorSpace;
    // The sheet must not wrap: a frame sampled past its own cell would smear
    // its neighbour into the edge.
    own.wrapS = THREE.ClampToEdgeWrapping;
    own.wrapT = THREE.ClampToEdgeWrapping;
    own.needsUpdate = true;
    return own;
  }, [shared]);

  // Shrink the sampled window to one cell of the grid. Until this runs the
  // texture samples the entire sheet, so it has to happen before the first
  // frame is drawn rather than inside the render loop.
  useEffect(() => {
    if (!meta) return;
    texture.repeat.set(1 / meta.cols, 1 / meta.rows);
    texture.offset.set(0, 1 - 1 / meta.rows);
  }, [texture, meta]);

  // Each room starts elsewhere in its loop, so six of them do not pulse in
  // lockstep. Seeded from the index rather than Math.random(), so a
  // re-render never jumps the animation.
  const frame = useRef(index * 7);
  const elapsed = useRef(0);

  // A clone allocates its own GPU handle, so it has to be released.
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;

    // --- the animation ---------------------------------------------
    if (meta && meta.frames > 1) {
      elapsed.current += delta;
      const step = 1 / meta.fps;

      if (elapsed.current >= step) {
        const advance = Math.floor(elapsed.current / step);
        elapsed.current -= advance * step;
        frame.current = (frame.current + advance) % meta.frames;

        const col = frame.current % meta.cols;
        const row = Math.floor(frame.current / meta.cols);
        // Texture V runs bottom-up while the sheet is laid out top-down, so
        // the row is counted from the far end.
        texture.offset.set(col / meta.cols, 1 - (row + 1) / meta.rows);
      }
    }

    // A slow bob on its own phase, so the shaft breathes rather than sitting
    // rigid. Small: the scroll is the motion that matters here.
    mesh.current.position.y = y + (lite ? 0 : Math.sin(t * 0.5 + index) * 0.1);

    // A true crossfade.
    //
    // Opacity falls linearly to zero at exactly one floor, so the room
    // arriving and the one leaving always sum to 1 and the screen is never
    // empty between them. An eased curve looks better in isolation but two
    // eased curves sum to well under 1 at their midpoint, which read as a
    // gap with nothing in it — the thing that made the descent feel long.
    const dist = Math.abs(mesh.current.getWorldPosition(scratch).y);
    const material = mesh.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.max(0, 1 - dist / FLOOR_GAP);

    // A room that has faded out stops drawing entirely, so the GPU is not
    // blending four invisible quads on every frame.
    mesh.current.visible = material.opacity > 0.01;

    // With depth writing off, draw order decides what sits on top, so the
    // closer room is drawn later and blends over the one leaving.
    mesh.current.renderOrder = Math.round(-dist * 100);
  });

  return (
    <mesh ref={mesh} position={[0, y, 0]}>
      <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
      <meshBasicMaterial
        map={texture}
        transparent
        // No alphaTest: it discards any pixel under the threshold, which
        // during a crossfade means the whole room disappears the moment it
        // fades past it. depthWrite off instead, so the two overlapping
        // rooms blend rather than punching holes in each other.
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

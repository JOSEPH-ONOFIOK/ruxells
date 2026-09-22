"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, type Group, type Mesh } from "three";
import * as THREE from "three";
import type { Sector } from "@/lib/sectors";
import { useQuality } from "./use-quality";

/**
 * One sector, as an object in the world.
 *
 * The artwork is already drawn in isometric projection, so it stays a flat
 * billboard rather than becoming real geometry — rebuilding these rooms in 3D
 * would throw away the pixel art and replace it with something worse. What 3D
 * adds is where the tile *is*: it sits at a real point in space, catches the
 * camera's movement, and can be flown to.
 *
 * The animation is a sprite sheet stepped with UV offsets rather than a video
 * texture: one upload, no decoder, no autoplay permission, and it loops
 * seamlessly. `scripts/cut-tiles.py` builds the sheets.
 */

export const TILE_SIZE = 3.4;

type SheetMeta = {
  frames: number;
  cols: number;
  rows: number;
  size: number;
  fps: number;
};

export function Tile({
  sector,
  position,
  index,
  active,
  focused,
  onSelect,
  onHover,
}: {
  sector: Sector;
  position: [number, number, number];
  index: number;
  /** True when this tile is the one the camera has flown to. */
  active: boolean;
  /** True when any tile is focused — the others dim and settle. */
  focused: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}) {
  const group = useRef<Group>(null);
  const art = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [meta, setMeta] = useState<SheetMeta | null>(null);

  const quality = useQuality();
  const lite = quality === "lite";

  // On a phone this is one 192px frame instead of a 2048x1280 sheet: 0.15MB
  // of VRAM against 10MB, which is the difference between a camera that
  // moves and one that stutters.
  const shared = useLoader(TextureLoader, lite ? sector.still : sector.tile);

  /**
   * Our own copy of the texture.
   *
   * `useLoader` caches by URL and hands every caller the same object, but each
   * tile walks its own `offset` across the sprite sheet — mutating the shared
   * one would make all six show the same frame. Cloning shares the uploaded
   * GPU image while giving this tile its own sampling state to write.
   */
  const texture = useMemo(() => {
    const own = shared.clone();
    own.magFilter = THREE.NearestFilter;
    own.minFilter = THREE.NearestFilter;
    own.generateMipmaps = false;
    own.colorSpace = THREE.SRGBColorSpace;
    // The sheet must not wrap: a frame sampled past its own cell would smear
    // the neighbouring frame into its edge.
    own.wrapS = THREE.ClampToEdgeWrapping;
    own.wrapT = THREE.ClampToEdgeWrapping;
    own.needsUpdate = true;
    return own;
  }, [shared]);

  // A clone allocates its own GPU handle, so it has to be released when the
  // tile goes away.
  useEffect(() => () => texture.dispose(), [texture]);

  // The sheet's grid comes from a sidecar written by the same script, so the
  // frame count is never hard-coded against an image that may be rebuilt.
  useEffect(() => {
    if (lite) return;

    let cancelled = false;
    fetch(sector.tile.replace(/\.png$/, ".json"))
      .then((r) => r.json())
      .then((m: SheetMeta) => {
        if (!cancelled) setMeta(m);
      })
      // A missing sidecar means the tile is a plain still — which is a fine
      // thing for it to be, so this failure is silent by design.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sector.tile, lite]);

  // Show one cell of the sheet at a time. Setting repeat shrinks the sampled
  // window to a single frame; offset then walks it across the grid.
  useEffect(() => {
    if (!meta) return;
    // No `needsUpdate` here: repeat and offset are uniforms uploaded with
    // every draw, not image data, so flagging the texture would re-upload the
    // whole sheet to the GPU for a value that costs nothing to change.
    texture.repeat.set(1 / meta.cols, 1 / meta.rows);
    texture.offset.set(0, 1 - 1 / meta.rows);
  }, [texture, meta]);

  // Each tile starts somewhere else in its loop, so six rooms of similar
  // motion don't pulse in lockstep. Seeded once from the index rather than
  // Math.random(), so a re-render never jumps the animation.
  const frame = useRef(index * 7);
  const elapsed = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
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
        texture.offset.set(
          col / meta.cols,
          1 - (row + 1) / meta.rows,
        );
      }
    }

    // --- the float --------------------------------------------------
    // Each tile bobs on its own phase, so the field drifts instead of
    // pulsing in unison. A focused tile holds still to be looked at.
    const drift = focused ? 0 : Math.sin(t * 0.6 + index * 1.7) * 0.12;
    group.current.position.y = position[1] + drift;

    // Lift on hover — enough to feel picked up, not enough to break the
    // isometric read.
    const lift = hovered && !focused ? 0.28 : 0;
    group.current.position.y += lift;

    const targetTilt = focused ? 0 : Math.sin(t * 0.4 + index) * 0.04;
    group.current.rotation.z += (targetTilt - group.current.rotation.z) * 0.05;

    if (art.current) {
      const material = art.current.material as THREE.MeshBasicMaterial;
      // Unfocused tiles fade back so the chosen one carries the frame.
      const targetOpacity = !focused || active ? 1 : 0.18;
      material.opacity += (targetOpacity - material.opacity) * 0.08;
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh
        ref={art}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(false);
        }}
      >
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshBasicMaterial
          map={texture}
          transparent
          // The cutout has hard edges, so anything nearly-clear is discarded
          // outright. That keeps tiles from sorting against each other
          // through their own transparent corners.
          alphaTest={0.45}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The shadow the tile casts onto nothing — a soft ellipse under it
          that sells the float far more cheaply than a real shadow map. */}
      <mesh
        position={[0, -TILE_SIZE * 0.34, -0.01]}
        rotation={[-Math.PI / 2.6, 0, 0]}
      >
        <circleGeometry args={[TILE_SIZE * 0.3, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={focused && !active ? 0.04 : 0.16}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

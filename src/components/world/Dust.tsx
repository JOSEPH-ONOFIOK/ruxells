"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Points } from "three";

/**
 * The shaft the rooms hang in.
 *
 * Without it the rooms sit on flat black, and flat black gives the eye no way
 * to tell that anything is moving between one floor and the next — the
 * descent reads as a slideshow of images rather than travel through a space.
 *
 * Two layers of particles at different depths do that cheaply: the near ones
 * slide past fast, the far ones barely move, and the difference between them
 * is the only cue needed to read the gap between rooms as distance.
 *
 * Points rather than sprites or geometry: one draw call for the whole field,
 * and at this size a soft dot is all the detail that survives anyway.
 */

const NEAR_COUNT = 260;
const FAR_COUNT = 140;

/** How tall the field is, in world units. It wraps within this. */
const SPAN = 46;

export function Dust({
  progress,
  lite,
}: {
  progress: React.RefObject<number>;
  lite: boolean;
}) {
  return (
    <>
      <Layer
        progress={progress}
        count={lite ? Math.round(FAR_COUNT / 2) : FAR_COUNT}
        depth={-11}
        spread={26}
        speed={0.35}
        size={0.11}
        opacity={0.22}
      />
      {!lite && (
        <Layer
          progress={progress}
          count={NEAR_COUNT}
          depth={3.2}
          spread={15}
          speed={1.45}
          size={0.055}
          opacity={0.4}
        />
      )}
    </>
  );
}

function Layer({
  progress,
  count,
  depth,
  spread,
  speed,
  size,
  opacity,
}: {
  progress: React.RefObject<number>;
  count: number;
  /** Z position. Negative is behind the rooms, positive in front. */
  depth: number;
  spread: number;
  /** How much of the scroll this layer travels — the parallax itself. */
  speed: number;
  size: number;
  opacity: number;
}) {
  const points = useRef<Points>(null);

  const positions = useMemo(() => {
    const out = new Float32Array(count * 3);

    // A seeded generator rather than Math.random(): the field is derived
    // state and has to come out identical on every evaluation, or a
    // re-render deals a different shaft.
    let seed = 0x9e3779b9 ^ count;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };

    for (let i = 0; i < count; i++) {
      out[i * 3] = (rand() - 0.5) * spread;
      out[i * 3 + 1] = (rand() - 0.5) * SPAN;
      // A little depth within the layer, so it is a volume rather than a
      // sheet of dots at one distance.
      out[i * 3 + 2] = depth + (rand() - 0.5) * 4;
    }

    return out;
  }, [count, spread, depth]);

  const texture = useMemo(() => {
    // A soft round dot drawn once into a canvas — cheaper than shipping an
    // image, and it scales with whatever pixel ratio the device reports.
    const px = 32;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext("2d")!;

    const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(() => {
    if (!points.current) return;

    // Scroll moves the field, scaled by this layer's speed — that difference
    // between layers is the parallax. Wrapped into the span so the shaft is
    // endless without ever allocating more particles.
    const travelled = progress.current * SPAN * 2 * speed;
    points.current.position.y = ((travelled % SPAN) + SPAN) % SPAN;
  });

  return (
    <points ref={points} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        color="#ffffff"
      />
    </points>
  );
}

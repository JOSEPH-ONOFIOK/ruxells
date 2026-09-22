"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesh } from "three";
import { SECTORS } from "@/lib/sectors";

/**
 * The light each room casts into the shaft.
 *
 * Every sector already carries a colour read off its own artwork, and until
 * now that drove one small label on a card. Here it lights the space around
 * the room: the descent changes colour as it goes, so six floors feel like
 * six places rather than one black shaft with different pictures in it.
 *
 * One quad far behind everything, with its colour interpolated between the
 * two nearest rooms — cross-fading six separate meshes would cost six draws
 * to show what one can. It is kept dim and desaturated because the artwork
 * has to stay the brightest thing on screen.
 */

/**
 * How strongly a room's colour shows.
 *
 * The collection is drawn on bright candy backgrounds — coral, sky blue,
 * mint, gold — not on black, and a near-black shaft contradicted the
 * artwork it was carrying. This is high enough that the descent genuinely
 * changes colour while still leaving the rooms the brightest thing on
 * screen.
 */
const STRENGTH = 0.42;

export function Ambience({
  progress,
}: {
  progress: React.RefObject<number>;
}) {
  const mesh = useRef<Mesh>(null);

  const colours = useMemo(
    () => SECTORS.map((s) => new THREE.Color(s.tint)),
    [],
  );

  // Scratch instances, so the per-frame blend allocates nothing.
  const current = useMemo(() => new THREE.Color(), []);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!mesh.current) return;

    // Where the descent is, in floors. The fractional part is the blend
    // between this room's colour and the next.
    const at = progress.current * (SECTORS.length - 1);
    const i = Math.min(Math.floor(at), SECTORS.length - 2);
    const f = THREE.MathUtils.clamp(at - i, 0, 1);

    target.copy(colours[i]).lerp(colours[i + 1], f);
    // Multiplied down rather than faded with opacity: at low opacity an
    // additive quad still lifts the black toward grey, where scaling the
    // colour keeps the void black and only adds the hue.
    target.multiplyScalar(STRENGTH);

    // Eased toward rather than set, so a flung scroll does not strobe.
    current.lerp(target, 0.06);
    (mesh.current.material as THREE.MeshBasicMaterial).color.copy(current);
  });

  return (
    // Far behind the rooms and large enough to fill the frame at that depth.
    <mesh position={[0, 0, -26]} renderOrder={-100}>
      <planeGeometry args={[70, 70]} />
      <meshBasicMaterial
        color="#000000"
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

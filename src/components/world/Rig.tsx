"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The camera.
 *
 * Two modes, one rig. Free: the camera orbits the whole field, nudged by the
 * pointer, breathing slightly so it never feels parked. Focused: it flies to
 * a tile and holds there.
 *
 * Both are the same lerp toward a target that something else decides, which
 * is what keeps the transition between them continuous — there is no cut, no
 * separate tween to cancel, and interrupting a flight mid-way just changes
 * where it is heading.
 */

/** How far back the camera sits when looking at the whole field. */
const FREE_DISTANCE = 15.5;
/** How close it gets to a tile it has flown to. */
const FOCUS_DISTANCE = 4.6;

/**
 * A phone's viewport is tall and narrow, so the same camera distance that
 * frames the field on a desktop crops its sides off. Pulling back and raising
 * the focus distance fits the whole ring into the narrow axis instead.
 */
function fitFor(aspect: number) {
  if (aspect >= 1) return { free: FREE_DISTANCE, focus: FOCUS_DISTANCE };
  // Below square, widen by the shortfall — a 9:16 phone ends up around 1.6x
  // further out, which is what it takes to hold six tiles across.
  const widen = Math.min(1 / aspect, 1.9);
  return { free: FREE_DISTANCE * widen, focus: FOCUS_DISTANCE * widen * 0.82 };
}

export function Rig({
  target,
  pointer,
}: {
  /** World position of the focused tile, or null when free. */
  target: [number, number, number] | null;
  /**
   * -1…1 pointer position, for the free-look nudge.
   *
   * A ref rather than a value: the pointer changes on every mouse move, and
   * passing it as a prop would re-render the whole scene at pointer rate.
   * The frame loop reads the current value instead.
   */
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const desired = useRef(new THREE.Vector3());
  // Scratch vector for the lerp targets. Allocating one per frame would hand
  // the collector 60 short-lived objects a second for no reason.
  const scratch = useRef(new THREE.Vector3());

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const fit = fitFor(size.width / size.height);

    if (target) {
      // Straight out from the tile, slightly above it — the artwork is drawn
      // from above, so meeting it level would foreshorten the floor away.
      desired.current.set(
        target[0] + 0.15,
        target[1] + 1.15,
        target[2] + fit.focus,
      );
      look.current.lerp(
        scratch.current.set(target[0], target[1], target[2]),
        0.06,
      );
    } else {
      // A slow drift around the field, with the pointer leaning it a little.
      // The breathing amplitudes are small on purpose: this is a horizon
      // shifting, not a camera being swung.
      const { x, y } = pointer.current;
      const yaw = Math.sin(t * 0.09) * 0.5 + x * 0.55;
      const pitch = Math.sin(t * 0.07) * 0.18 - y * 0.4;

      desired.current.set(
        Math.sin(yaw) * fit.free,
        2.2 + pitch * 2.4,
        Math.cos(yaw) * fit.free,
      );
      look.current.lerp(scratch.current.set(0, 0, 0), 0.04);
    }

    // One easing for both modes. Slower into a focus than out of it, so
    // arriving settles and leaving feels released.
    camera.position.lerp(desired.current, target ? 0.055 : 0.03);
    camera.lookAt(look.current);
  });

  return null;
}

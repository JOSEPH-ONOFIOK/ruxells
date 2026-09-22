"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Points } from "three";

/**
 * The cloud field the tiles hang in.
 *
 * Points rather than sprites or geometry: a few hundred soft dots at varying
 * depth give the parallax that tells you the tiles are in a space, and they
 * cost one draw call. The artwork already carries its own painted clouds, so
 * this only has to suggest depth around them rather than compete.
 */

const COUNT = 420;
const SPREAD = 46;

export function Clouds({ dimmed }: { dimmed: boolean }) {
  const points = useRef<Points>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    // A seeded generator rather than Math.random(): the field is derived
    // state, so it has to come out identical on every evaluation. With
    // Math.random() a re-render would deal a different sky, and React is
    // free to re-run a memo whenever it likes.
    let seed = 0x9e3779b9;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };

    for (let i = 0; i < COUNT; i++) {
      // Biased toward the edges and the back, so the middle of the field —
      // where the tiles live — stays readable.
      const r = SPREAD * (0.35 + rand() * 0.65);
      const theta = rand() * Math.PI * 2;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (rand() - 0.5) * SPREAD * 0.7;
      positions[i * 3 + 2] = Math.sin(theta) * r - 10;

      sizes[i] = 0.4 + rand() * 2.6;
    }

    return { positions, sizes };
  }, []);

  const texture = useMemo(() => {
    // A soft round dot, drawn once into a canvas. Cheaper than shipping an
    // image and it scales with whatever the device pixel ratio turns out
    // to be.
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.5)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    // A slow yaw, so the field never reads as static even when nothing is
    // being touched. Frame-rate independent, or it doubles on a 120Hz screen.
    points.current.rotation.y += delta * 0.012;

    const material = points.current.material as THREE.PointsMaterial;
    const target = dimmed ? 0.1 : 0.32;
    material.opacity += (target - material.opacity) * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={2.4}
        sizeAttenuation
        transparent
        opacity={0.32}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

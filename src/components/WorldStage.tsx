"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

/**
 * Client boundary for the 3D map.
 *
 * WebGL can't render on the server, and three.js is the heaviest thing on the
 * page, so the whole world is loaded on the client only.
 *
 * There are two waits here, back to back: this chunk arriving, then the
 * world's textures. The fallback is deliberately the same eyes on the same
 * black as the boot screen that follows it, so the handover between them is
 * invisible and it reads as one wait rather than two.
 */
const World = dynamic(
  () => import("./world/World").then((m) => m.World),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] flex-col items-center justify-center gap-6 px-6">
        <Image
          src="/brand/mark-lime.png"
          alt=""
          aria-hidden
          width={334}
          height={334}
          className="pixelated h-7 w-auto animate-pulse sm:h-9"
          priority
        />
        <div className="w-full max-w-[13rem]">
          <div className="h-0.5 bg-line" />
          <div className="mt-3 flex items-center justify-between">
            <p className="eyebrow text-ash/60">Waking the world</p>
            <p className="eyebrow text-lime tabular-nums">00%</p>
          </div>
        </div>
      </div>
    ),
  },
);

export function WorldStage({ cleared }: { cleared: number | null }) {
  return <World cleared={cleared} />;
}

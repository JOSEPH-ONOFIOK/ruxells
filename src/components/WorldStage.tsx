"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

/**
 * Client boundary for the 3D map.
 *
 * WebGL can't render on the server, and three.js is the heaviest thing on the
 * page, so the whole world is loaded on the client only. The fallback is the
 * mark on black rather than a spinner — the site's first paint should look
 * like the site, not like it is broken.
 */
const World = dynamic(
  () => import("./world/World").then((m) => m.World),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] items-center justify-center">
        <Image
          src="/brand/mark-lime.png"
          alt=""
          aria-hidden
          width={334}
          height={334}
          className="pixelated h-8 w-auto animate-pulse"
        />
      </div>
    ),
  },
);

export function WorldStage({ cleared }: { cleared: number | null }) {
  return <World cleared={cleared} />;
}

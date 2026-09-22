import Image from "next/image";
import Link from "next/link";
import { GalleryGrid } from "@/components/GalleryGrid";
import { PIECES } from "@/lib/gallery";

const DESCRIPTION =
  "Every room in the collection, including the ones that didn't make the descent.";

export const metadata = {
  title: "Gallery",
  description: DESCRIPTION,
  openGraph: {
    title: "Gallery · RUXXELLS",
    description: DESCRIPTION,
    url: "/gallery",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Gallery · RUXXELLS",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function Gallery() {
  return (
    <main className="min-h-[100svh] px-5 py-6 sm:px-8 sm:py-8">
      <nav className="mb-10 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="shrink-0 overflow-hidden border-2 border-line">
            <Image
              src="/brand/soldier.gif"
              alt=""
              aria-hidden
              width={1453}
              height={1455}
              className="pixelated block h-9 w-9 object-cover"
              unoptimized
            />
          </span>
          <Image
            src="/brand/wordmark-lime.png"
            alt="RUXXELLS"
            width={866}
            height={245}
            className="pixelated h-4 w-auto"
          />
        </Link>

        <Link
          href="/clearance"
          className="pressable border-2 border-lime bg-lime px-4 py-2.5 text-[11px] font-bold tracking-widest text-void uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
        >
          Get cleared
        </Link>
      </nav>

      <header className="mb-8">
        <p className="eyebrow text-lime">
          {PIECES.length} pieces
        </p>
        <h1 className="wordmark mt-3 text-[clamp(2rem,8vw,3.6rem)] text-chalk">
          The collection
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">
          {DESCRIPTION}
        </p>
      </header>

      <GalleryGrid />

      <footer className="mt-16 border-t-2 border-line pt-8 text-center">
        <p className="text-sm leading-relaxed text-ash">
          Supply is still being decided. The list is the only way to be sure of
          a spot.
        </p>
        <Link
          href="/clearance"
          className="pressable mt-6 inline-block border-2 border-lime bg-lime px-8 py-4 text-xs font-bold tracking-widest text-void uppercase shadow-[4px_4px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
        >
          Get on the list
        </Link>
      </footer>
    </main>
  );
}

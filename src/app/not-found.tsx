import Image from "next/image";
import Link from "next/link";

/**
 * The 404.
 *
 * Next ships a bare white page by default, which on a site this dark reads as
 * something broken rather than a wrong address. It costs almost nothing to
 * make the miss look deliberate.
 */
export const metadata = {
  title: "Nothing here",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-5 text-center">
      <Image
        src="/brand/mark-lime.png"
        alt=""
        aria-hidden
        width={334}
        height={334}
        className="pixelated h-8 w-auto opacity-60"
      />

      <p className="eyebrow mt-6 text-lime-dim">404</p>
      <h1 className="wordmark mt-3 text-[clamp(1.8rem,7vw,3rem)] text-chalk">
        Wrong door
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-ash">
        Nothing is behind this one. The rooms are all back the other way.
      </p>

      <Link
        href="/"
        className="mt-8 border border-lime bg-lime px-6 py-3 text-xs font-bold tracking-widest text-void uppercase transition-colors hover:bg-transparent hover:text-lime"
      >
        Back to the top
      </Link>
    </main>
  );
}

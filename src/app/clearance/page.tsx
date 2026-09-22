import Image from "next/image";
import Link from "next/link";
import { ClearanceForm } from "@/components/ClearanceForm";
import { signupsOpen } from "@/lib/allowlist-status";
import { currentAccount } from "@/lib/x-session";
import { SECTORS } from "@/lib/sectors";

const DESCRIPTION =
  "Four channels and a wallet. The list is the only way to be sure of a spot on the free mint.";

export const metadata = {
  // The root layout's template turns this into "Clearance · RUXXELLS".
  title: "Clearance",
  description: DESCRIPTION,
  // The card is restated rather than inherited: a link to the door should
  // preview as the door, and openGraph on a child route replaces the
  // layout's block wholesale rather than merging into it.
  openGraph: {
    title: "Clearance · RUXXELLS",
    description: DESCRIPTION,
    url: "/clearance",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Clearance · RUXXELLS",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default async function Clearance({
  searchParams,
}: PageProps<"/clearance">) {
  // Reading the session here means the form renders already-connected on the
  // first paint after the OAuth round trip — no mount fetch, no flash.
  const [account, params] = await Promise.all([currentAccount(), searchParams]);

  const configured = Boolean(
    process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET,
  );
  const oauthStatus = typeof params.x === "string" ? params.x : null;

  return (
    <main className="relative min-h-[100svh]">
      {/* The door you are standing at: one room, held behind the terminal at
          low contrast, so the page sits inside the world rather than on a
          blank field the way a form page usually does. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <Image
          src={SECTORS[0].tile}
          alt=""
          width={512}
          height={512}
          className="pixelated absolute -right-[14%] bottom-[6%] w-[62vw] max-w-[36rem] opacity-[0.07]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/85 to-void/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-5 py-8 sm:py-12">
        {/* The same watch as the map's: the soldier standing at the door you
            are asking to be let through. Keeping the two headers identical is
            what makes /clearance read as the next room rather than a separate
            site. */}
        <nav className="mb-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="panel shrink-0 overflow-hidden">
              <Image
                src="/brand/soldier.gif"
                alt="A Ruxxell in full kit, watching the door"
                width={1453}
                height={1455}
                className="pixelated h-11 w-11 object-cover sm:h-14 sm:w-14"
                unoptimized
                priority
              />
            </div>

            <Link href="/">
              <Image
                src="/brand/wordmark-lime.png"
                alt="RUXXELLS"
                width={866}
                height={245}
                className="pixelated h-4 w-auto sm:h-5"
                priority
              />
            </Link>
          </div>

          <Link
            href="/"
            className="eyebrow shrink-0 text-ash transition-colors hover:text-lime"
          >
            ← The map
          </Link>
        </nav>

        {/* The crew, as a reminder of what the list is for. Sits above the
            terminal so the first thing on the page is the collection rather
            than a form. */}
        <div className="panel ticked mb-8 overflow-hidden">
          <Image
            src="/brand/banner.png"
            alt="The Ruxxells crew, in the arcade"
            width={1500}
            height={500}
            className="pixelated h-auto w-full"
            sizes="(max-width: 640px) 100vw, 36rem"
            priority
          />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-lime" aria-hidden />
            <p className="eyebrow text-lime">Door control</p>
          </div>
          <h1 className="wordmark mt-3 text-[clamp(1.8rem,7vw,2.8rem)] text-chalk">
            Four channels
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ash">
            The door reads each one in turn. Clear all four and the wallet
            field unseals. Supply is still being decided, so the list is the
            only way to be sure of a spot.
          </p>
        </div>

        {signupsOpen() ? (
          <ClearanceForm
            account={{
              configured,
              connected: Boolean(account),
              username: account?.username,
              name: account?.name,
            }}
            oauthStatus={oauthStatus}
          />
        ) : (
          <div className="panel ticked p-8 text-center">
            <p className="eyebrow text-ash">Door closed</p>
            <p className="wordmark mt-3 text-3xl text-chalk">
              The list is full
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ash">
              Every spot is spoken for. Watch X for what happens next.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

import { Checkpoint } from "@/components/checkpoint/Checkpoint";
import { signupsOpen } from "@/lib/allowlist-status";
import { SHARE_TEXT } from "@/lib/ruxlisted";
import { currentAccount } from "@/lib/x-session";

const DESCRIPTION =
  "Connect your X and knock. The door knows whether you are RUXLISTED.";

export const metadata = {
  title: "Checkpoint",
  description: DESCRIPTION,
  openGraph: {
    title: "Checkpoint · RUXXELLS",
    description: DESCRIPTION,
    url: "/checkpoint",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Checkpoint · RUXXELLS",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * Am I RUXLISTED.
 *
 * The session is read here so the door paints already lit for someone who
 * has just come back from X, with no connecting flash. The verdict itself is
 * fetched client-side: it can be slow (the sheet is a network hop), and the
 * room should be standing while it arrives.
 */
export default async function CheckpointPage({
  searchParams,
}: PageProps<"/checkpoint">) {
  const [account, params] = await Promise.all([currentAccount(), searchParams]);

  return (
    <Checkpoint
      account={{
        configured: Boolean(
          process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET,
        ),
        connected: Boolean(account),
        username: account?.username,
        name: account?.name,
      }}
      oauthStatus={typeof params.x === "string" ? params.x : null}
      shareText={SHARE_TEXT}
      signupsOpen={signupsOpen()}
    />
  );
}

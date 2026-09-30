import { hasXUser } from "./allowlist-store";
import {
  PINNED_POST_ID,
  X_ACCOUNT,
  parsePostIds,
  pinnedPostUrl,
} from "./quests";
import { DROP } from "./sectors";
import type { XAccount } from "./x-session";

/**
 * Who the checkpoint door lets through.
 *
 * Server-only: the answer is read from the session, never from anything the
 * visitor sends, so nobody can ask the door about an account they have not
 * connected.
 */

/**
 * Always through, whatever the list says. The team's own accounts, by X user
 * id rather than handle: an id survives a rename, a handle does not.
 */
const ALWAYS = new Set(["1587534379496214533"]); // @Dextervqsm

/**
 * The final list, when one has been picked.
 *
 * `RUXLISTED` is a comma-separated mix of X user ids and handles, set on
 * Vercel so the list can change without a commit. Unset, the door falls back
 * to the clearance sheet: everyone who finished the four steps is through.
 * Set, only the accounts named here are — which is what a curated selection
 * needs, since being on the sheet no longer means being picked.
 */
function curated(): Set<string> | null {
  const raw = process.env.RUXLISTED?.trim();
  if (!raw) return null;
  return new Set(
    raw
      .split(/[\s,]+/)
      .map((v) => v.replace(/^@/, "").toLowerCase())
      .filter(Boolean),
  );
}

export async function isRuxlisted(account: XAccount): Promise<boolean> {
  if (ALWAYS.has(account.id)) return true;

  const list = curated();
  if (list) {
    return list.has(account.id) || list.has(account.username.toLowerCase());
  }

  return hasXUser(account.id);
}

/** What the card is posted with, word for word as the team wrote it. */
export const SHARE_TEXT = `I’ve been RUXLISTED.

A Ruxxell has been reserved for me.

1 of ${DROP.supply} worlds. I secured mine.

@${X_ACCOUNT}`;

/**
 * The composer, opened as a quote of the team's post with the caption in.
 *
 * `RUXLISTED_POST` (a URL or bare id) names the post to quote — the
 * RUXLISTED announcement, once there is one. Unset, it falls back to the
 * pinned post the clearance quest quotes. Server-only: the page reads it at
 * request time, so changing it on the host needs no rebuild of the client.
 */
export function shareUrl(): string {
  const postId = parsePostIds(process.env.RUXLISTED_POST)[0] ?? PINNED_POST_ID;
  return `https://x.com/intent/post?text=${encodeURIComponent(SHARE_TEXT)}${
    postId ? `&url=${encodeURIComponent(pinnedPostUrl(postId))}` : ""
  }`;
}

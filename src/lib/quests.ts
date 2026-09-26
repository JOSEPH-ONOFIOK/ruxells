/** Shared by the client checklist and the server-side submit guard. */

/**
 * The account every quest points at.
 *
 * One constant rather than a handle written into each link: the follow
 * intent, the quote intent, the pinned-post URL and the server-side check
 * that a quote really quotes us all read it, so a change of account is one
 * edit and cannot leave a stale link behind.
 *
 * Case is preserved for display but never compared — the verifier
 * lowercases both sides, because X reports the handle in whatever case the
 * owner set it and a case-sensitive check would reject honest entries.
 */
export const X_ACCOUNT = "ruxxellsHQ";

/**
 * The founder's account.
 *
 * A separate constant rather than a second entry hard-coded into the quest
 * list, for the same reason X_ACCOUNT is one: the follow intent and the
 * quest title both read it, so changing who this is cannot leave one of
 * them pointing at the old handle.
 */
export const FOUNDER_ACCOUNT = "buncobuddylj";

/**
 * The exact text a quote post has to contain.
 *
 * The server checks for it after normalising case, whitespace and emoji
 * variation selectors, so a quote that picked up different spacing on its
 * way through a client still passes — but the words themselves have to be
 * there, contiguously.
 *
 * That last part decides where the referral link goes. The check is a
 * substring match on the whole phrase, so anything inserted into the middle
 * of it fails for everyone; the phrase ends on "Join →" precisely so the
 * link can follow it and still leave the required text intact.
 */
export const QUOTE_PHRASE = `One WORLD → One OWNER.

I just filled my application to grab a Ruxxell Onchain!

Only 1970 ITEMS coming on Robin-hood.

Join →`;

/**
 * The posts a quote may point at, newest first.
 *
 * Set as NEXT_PUBLIC_ACCEPTED_POSTS on the host — comma-separated, and
 * either full URLs or bare ids, because a URL is what anybody actually has
 * to hand:
 *
 *   NEXT_PUBLIC_ACCEPTED_POSTS=https://x.com/ruxxellsHQ/status/1234…,1233…
 *
 * A list rather than one id, because the announcement can be replaced
 * mid-drop. Rotating a single id would reject everyone who had already
 * quoted the previous one, stranding entries that were honestly earned;
 * keeping the old id costs nothing and keeps those people valid.
 *
 * NEXT_PUBLIC_ because this file is imported by the clearance form, which
 * is a client component — a bare env var would be undefined in the browser
 * and the quote button would link at the profile instead of the post. The
 * value is a post id, which is public the moment it is posted, so there is
 * nothing here that should not reach the browser.
 */
function parsePostIds(raw: string | undefined): readonly string[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      // Accept a whole URL and take the id out of it, so nobody has to
      // hand-extract the number from something they just copied.
      const fromUrl = /\/status\/(\d{5,25})/.exec(trimmed);
      return fromUrl ? fromUrl[1] : trimmed;
    })
    // Anything that is not a plausible id is dropped rather than kept: a
    // typo that reached the list would silently reject every real quote.
    .filter((id) => /^\d{5,25}$/.test(id));
}

export const ACCEPTED_POST_IDS: readonly string[] = parsePostIds(
  process.env.NEXT_PUBLIC_ACCEPTED_POSTS,
);

/** The post the quest links to and asks people to quote. */
export const PINNED_POST_ID: string | undefined = ACCEPTED_POST_IDS[0];

/**
 * True when a quote points at a post we still accept.
 *
 * With nothing configured every post passes this check — the verifier still
 * enforces authorship and the phrase, so the gate holds, just more loosely.
 * That is what lets the flow be tested before the announcement exists, and
 * it is the one thing to set before the list opens.
 */
export function isAcceptedPost(id: string): boolean {
  if (ACCEPTED_POST_IDS.length === 0) return true;
  return ACCEPTED_POST_IDS.includes(id);
}

export type QuestId = "follow" | "founder" | "boost" | "quote" | "tag";

export type Quest = {
  id: QuestId;
  n: string;
  title: string;
  /** Line breaks are deliberate — rendered with `whitespace-pre-line`. */
  detail: string;
  cta: string;
  /** Rendered as a quotable block rather than buried in the prose. */
  phrase?: string;
  /** Quests that need the guest to paste back a link to their own post. */
  needsLink: boolean;
  /**
   * A frame from the collection, shown beside the step.
   *
   * Each one is picked to match what the step is asking for — a gate for the
   * follow, a crowd for the tag — so the panel reads as a place rather than a
   * form. They are decorative: the step is fully usable with the image
   * missing, and it carries no caption of its own.
   */
  still: string;
};

export const QUESTS: Quest[] = [
  {
    id: "follow",
    n: "01",
    title: `Follow @${X_ACCOUNT}`,
    detail: "Nobody gets through the door unannounced.\nStart here.",
    cta: "Open X",
    needsLink: false,
    still: "/recon/17.jpeg",
  },
  {
    id: "founder",
    n: "02",
    title: `Follow @${FOUNDER_ACCOUNT}`,
    detail: "The one who started it.\nWorth knowing who let you in.",
    cta: "Open X",
    needsLink: false,
    still: "/recon/09.jpeg",
  },
  {
    id: "boost",
    n: "03",
    title: "Like + repost the pinned post",
    detail: "Signal doesn't carry on its own.\nPush it.",
    cta: "Open post",
    needsLink: false,
    still: "/recon/09.jpeg",
  },
  {
    id: "quote",
    n: "04",
    title: "Quote the pinned post",
    detail: "Say it in your own words, with this in it:",
    phrase: QUOTE_PHRASE,
    cta: "Open post",
    needsLink: true,
    still: "/recon/13.jpeg",
  },
  {
    id: "tag",
    n: "05",
    title: "Tag 3 friends in the comments",
    detail:
      "Nobody clears this place alone.\n\nThree names.\nNo alts. No strays.",
    cta: "Open post",
    needsLink: false,
    still: "/recon/03.jpeg",
  },
];

export const QUEST_IDS = QUESTS.map((q) => q.id);

/**
 * A post link is only accepted if it points at a status on the connected
 * account — that is the one part of these quests the server can actually
 * check without paid X API access.
 */
const STATUS_URL_RE =
  /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:[/?#].*)?$/;

export type ParsedPostLink = { username: string; statusId: string };

export function parsePostLink(input: string): ParsedPostLink | null {
  const match = STATUS_URL_RE.exec(input.trim());
  if (!match) return null;
  return { username: match[1], statusId: match[2] };
}

export function linkBelongsTo(input: string, username: string): boolean {
  const parsed = parsePostLink(input);
  return (
    parsed !== null && parsed.username.toLowerCase() === username.toLowerCase()
  );
}

// --- Outbound X links -------------------------------------------------

export const pinnedPostUrl = (postId?: string) =>
  postId
    ? `https://x.com/${X_ACCOUNT}/status/${postId}`
    : `https://x.com/${X_ACCOUNT}`;

export const followUrl = (account: string = X_ACCOUNT) =>
  `https://x.com/intent/follow?screen_name=${account}`;

/**
 * The quote intent, carrying the poster's own referral link.
 *
 * X's `url` parameter is what makes a post a quote, so the pinned post has
 * to go there. The referral link rides in the text instead — which is also
 * where it is visible to whoever reads the post, rather than folded into a
 * card.
 *
 * Without a handle there is no code to attach and the text is the phrase
 * alone: the link is a bonus on a step that has to work regardless.
 */
export const quoteIntentUrl = (postId?: string, referral?: string) => {
  const text = referral ? `${QUOTE_PHRASE}\n\n${referral}` : QUOTE_PHRASE;

  return `https://x.com/intent/post?text=${encodeURIComponent(text)}${
    postId ? `&url=${encodeURIComponent(pinnedPostUrl(postId))}` : ""
  }`;
};

/**
 * What someone posts once they're cleared, and the link that opens X with it
 * ready to send.
 *
 * Offered the moment the spot is theirs, because that is when they are most
 * willing to say so — a share asked for later is a share that doesn't happen.
 */
export const CLAIM_SHARE_TEXT = `Cleared for @${X_ACCOUNT}`;

export const claimShareUrl = (siteUrl?: string) =>
  `https://x.com/intent/post?text=${encodeURIComponent(CLAIM_SHARE_TEXT)}${
    siteUrl ? `&url=${encodeURIComponent(siteUrl)}` : ""
  }`;

export function questLinkFor(
  id: QuestId,
  postId?: string,
  referral?: string,
) {
  if (id === "follow") return followUrl();
  if (id === "founder") return followUrl(FOUNDER_ACCOUNT);
  if (id === "quote") return quoteIntentUrl(postId, referral);
  return pinnedPostUrl(postId);
}

// --- Quest progress ---------------------------------------------------

export type QuestState = Record<QuestId, boolean | string>;

export const EMPTY_QUESTS: QuestState = {
  follow: false,
  founder: false,
  boost: false,
  quote: "",
  tag: false,
};

/**
 * Mirrors the server-side guard in the allowlist route so the submit button
 * never claims to be ready when the API would reject the payload.
 */
export function isQuestDone(
  id: QuestId,
  state: QuestState,
  username?: string,
): boolean {
  const quest = QUESTS.find((q) => q.id === id);
  if (!quest) return false;
  if (!quest.needsLink) return state[id] === true;

  const parsed = parsePostLink(String(state[id] ?? ""));
  if (!parsed) return false;
  return !username || parsed.username.toLowerCase() === username.toLowerCase();
}

export function allQuestsDone(state: QuestState, username?: string): boolean {
  return QUESTS.every((q) => isQuestDone(q.id, state, username));
}

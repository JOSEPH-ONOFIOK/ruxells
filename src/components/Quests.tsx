"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowUpRight, FiCheck, FiLoader, FiLock } from "react-icons/fi";
import {
  PINNED_POST_ID,
  QUESTS,
  isQuestDone,
  parsePostLink,
  questLinkFor,
  type QuestId,
  type QuestState,
} from "@/lib/quests";

/**
 * The four steps.
 *
 * An earlier version dressed each step as a "channel" the door was testing,
 * with codenames, signal meters and a running log. People had to learn a
 * private vocabulary — that ESCORT meant tag three friends — before they
 * could do anything, so the theme became a barrier rather than flavour. The
 * steps now say what they are and the styling carries the brand.
 *
 * The quote step is still the real gate: it is the only one X lets us check,
 * so it is verified against the live post and every step after it stays
 * locked until it passes. The steps before it are declared by the guest —
 * there is no way to read a follow or a like on the free tier — but they
 * can't be used to skip the part that is enforced.
 */

/** Index of the step that must verify before the rest unlock. */
const GATE_INDEX = QUESTS.findIndex((q) => q.needsLink);

export type QuoteCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "bad"; reason: string };

export function Quests({
  state,
  onChange,
  username,
  check,
  onCheckChange,
  account,
  count,
  clock,
  locked,
  referral,
}: {
  state: QuestState;
  onChange: (next: QuestState) => void;
  username?: string;
  check: QuoteCheck;
  onCheckChange: (next: QuoteCheck) => void;
  /** The connect-X control, rendered into the header rather than above it. */
  account?: React.ReactNode;
  /** How many are already through, for the header's right column. */
  count?: number | null;
  /** The countdown, already formatted. */
  clock?: string;
  /** Dims the channels until X is connected; the header stays lit. */
  locked?: boolean;
  /** The poster's own referral link, for the quote step to carry. */
  referral?: string;
}) {
  const gateCleared = check.state === "ok";
  /**
   * How many steps are actually finished.
   *
   * The quote only counts once X has confirmed it: isQuestDone accepts it
   * on the shape of the link alone, so without this the bar would read
   * full while the submit button stayed disabled, which is a worse thing to
   * look at than an honest four of five.
   */
  const done = QUESTS.filter(
    (q) =>
      isQuestDone(q.id, state, username) &&
      (!q.needsLink || check.state === "ok"),
  ).length;

  return (
    <div className="panel ticked overflow-hidden">
      <Header
        done={done}
        total={QUESTS.length}
        username={username}
        account={account}
        count={count}
        clock={clock}
      />

      <ol
        // Inert rather than faded out: the reason they are unavailable is
        // stated in the header, so hiding the steps only makes the page
        // harder to read while someone decides whether to connect.
        className={locked ? "pointer-events-none opacity-70" : undefined}
      >
        {QUESTS.map((quest, i) => (
          <Channel
            key={quest.id}
            quest={quest}
            index={i}
            state={state}
            onChange={onChange}
            username={username}
            check={check}
            onCheckChange={onCheckChange}
            sealed={i > GATE_INDEX && !gateCleared}
            referral={referral}
          />
        ))}
      </ol>
    </div>
  );
}

/**
 * One band instead of four.
 *
 * The status strip, the connect control and the progress bar each used to
 * own a horizontal band, which put several of them between the top of the
 * page and the first thing anyone could actually do. They are all the same
 * thing — how far along you are — so they read as one line with the bar
 * under it.
 */
function Header({
  done,
  total,
  username,
  account,
  count,
  clock,
}: {
  done: number;
  total: number;
  username?: string;
  account?: React.ReactNode;
  count?: number | null;
  clock?: string;
}) {
  return (
    <div className="border-b border-line bg-raised">
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <p className="eyebrow truncate text-ash">
          {username ? (
            <span className="text-lime">@{username}</span>
          ) : (
            "Authorisation"
          )}
        </p>

        <div className="flex shrink-0 items-center gap-3">
          {typeof count === "number" && (
            <p className="eyebrow text-ash tabular-nums">
              {count.toLocaleString()} through
            </p>
          )}
          {clock && <p className="eyebrow text-chalk tabular-nums">{clock}</p>}
        </div>
      </div>

      {/* The bar carries the count, so the "2 of 4" text it used to sit
          under is gone: the shape says it faster than the words did. */}
      <div className="mt-2.5 flex gap-1 px-4" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden bg-line">
            <motion.div
              className="h-full bg-lime"
              initial={false}
              animate={{ scaleX: i < done ? 1 : 0 }}
              style={{ originX: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>

      {account && (
        <div className="border-t border-line/60 px-4 py-2.5">{account}</div>
      )}
    </div>
  );
}

function Channel({
  quest,
  index,
  state,
  onChange,
  username,
  check,
  onCheckChange,
  sealed,
  referral,
}: {
  quest: (typeof QUESTS)[number];
  index: number;
  state: QuestState;
  onChange: (next: QuestState) => void;
  username?: string;
  check: QuoteCheck;
  onCheckChange: (next: QuoteCheck) => void;
  sealed: boolean;
  /** The poster's own referral link, folded into the quote text. */
  referral?: string;
}) {
  const done = isQuestDone(quest.id, state, username);
  const link = questLinkFor(quest.id, PINNED_POST_ID, referral);

  /**
   * Whether this step counts as finished for the purpose of collapsing.
   *
   * The quote step is the exception: `isQuestDone` accepts it on the shape
   * of the link alone, so a well-formed URL that X has not confirmed — or
   * has outright rejected — would close the panel and hide the error
   * explaining why. It has to have actually verified.
   */
  const settled = quest.needsLink ? done && check.state === "ok" : done;

  // A step opens when it is reached and closes once it is settled, so the
  // panel only ever shows the one being worked on. Overridable — clicking
  // the header reopens a finished one.
  const [open, setOpen] = useState(index === 0);
  const wasSettled = useRef(settled);

  useEffect(() => {
    if (settled && !wasSettled.current) setOpen(false);
    if (!settled && wasSettled.current) setOpen(true);
    wasSettled.current = settled;
  }, [settled]);

  /**
   * A rejection is worth interrupting for.
   *
   * The reason already prints under the field, but somebody who has just
   * pasted a link and looked away misses it and waits for a step that is
   * never going to clear. The modal says so once, and only for a verdict X
   * actually returned — not for a half-typed URL.
   */
  const [alerted, setAlerted] = useState<string | null>(null);
  const lastReason = useRef<string | null>(null);

  useEffect(() => {
    if (check.state !== "bad") {
      lastReason.current = null;
      return;
    }

    // Only when the reason changes, so correcting one mistake into another
    // prompts again but a re-render does not.
    if (lastReason.current === check.reason) return;
    lastReason.current = check.reason;
    setAlerted(check.reason);
  }, [check]);

  return (
    <li
      className={`relative border-b border-line last:border-b-0 transition-colors ${
        sealed ? "bg-void" : settled ? "bg-lime/[0.04]" : ""
      }`}
    >
      <button
        type="button"
        disabled={sealed}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed enabled:hover:bg-raised/60"
      >
        {/* One mark carrying the whole state: numbered, ticked, or locked.
            It replaces a number, a codename, a signal meter and a status
            word that between them said the same thing four times. */}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center border text-[10px] font-bold tabular-nums transition-colors ${
            settled && !sealed
              ? "border-lime bg-lime text-void"
              : sealed
                ? "border-line text-ash"
                : "border-line text-ash"
          }`}
        >
          {sealed ? (
            <FiLock className="h-3 w-3" />
          ) : settled ? (
            <FiCheck className="h-3.5 w-3.5" />
          ) : (
            index + 1
          )}
        </span>

        <span
          className={`flex-1 truncate text-sm font-bold ${
            sealed ? "text-ash" : settled ? "text-lime" : "text-chalk"
          }`}
        >
          {quest.title}
        </span>

        {check.state === "checking" && quest.needsLink && (
          <FiLoader className="h-3.5 w-3.5 shrink-0 animate-spin text-ash" />
        )}
      </button>

      {/* --- the instruction ------------------------------------------- */}
      <AnimatePresence initial={false}>
        {open && !sealed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line/60 px-4 pt-3 pb-4 sm:pl-[2.1rem]">
              <div className="flex gap-3">
                {/* A frame from the collection, cropped square and held at
                    low contrast until the channel clears — so the panel has
                    a picture in it without the picture shouting over the
                    instruction. */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-line sm:h-24 sm:w-24">
                  <Image
                    src={quest.still}
                    alt=""
                    aria-hidden
                    width={1600}
                    height={1600}
                    sizes="96px"
                    className={`pixelated h-full w-full object-cover transition-all duration-500 ${
                      done
                        ? "saturate-100 opacity-100"
                        : "opacity-70 saturate-0"
                    }`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                    style={{
                      boxShadow: done
                        ? "inset 0 0 0 1px var(--color-lime)"
                        : "inset 0 0 24px rgba(0,0,0,0.5)",
                    }}
                  />
                </div>

                <p className="min-w-0 flex-1 text-xs leading-relaxed whitespace-pre-line text-ash">
                  {quest.detail}
                </p>
              </div>

              {quest.phrase && <Phrase text={quest.phrase} />}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-1 border-2 border-line px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors hover:border-lime hover:text-lime"
                >
                  {quest.cta}
                  <FiArrowUpRight className="h-3 w-3" />
                </a>

                {!quest.needsLink && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, [quest.id]: !done })}
                    aria-pressed={done}
                    className={`pressable border-2 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors ${
                      done
                        ? "border-lime bg-lime text-void"
                        : "border-line text-ash hover:border-lime hover:text-lime"
                    }`}
                  >
                    {done ? "Confirmed" : "Confirm"}
                  </button>
                )}
              </div>

              {quest.needsLink && (
                <QuoteField
                  questId={quest.id}
                  value={String(state[quest.id] ?? "")}
                  onChange={(v) => onChange({ ...state, [quest.id]: v })}
                  username={username}
                  check={check}
                  onCheckChange={onCheckChange}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sealed && (
        <p className="px-4 pb-3 text-[11px] text-ash sm:pl-[2.1rem]">
          Unlocks once step {GATE_INDEX + 1} is verified.
        </p>
      )}

      <Rejected
        reason={alerted}
        onClose={() => setAlerted(null)}
        postUrl={link}
      />
    </li>
  );
}

/**
 * What X said, when it said no.
 *
 * A dialog rather than a toast: the step cannot proceed until this is
 * fixed, and the reason is usually something specific to correct — the
 * wrong account, a missing line, a post that is not a quote. It carries a
 * way back to the post so the fix is one click from the explanation.
 */
function Rejected({
  reason,
  onClose,
  postUrl,
}: {
  reason: string | null;
  onClose: () => void;
  postUrl: string;
}) {
  useEffect(() => {
    if (!reason) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reason, onClose]);

  return (
    <AnimatePresence>
      {reason && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="alertdialog"
          aria-modal="true"
          aria-label="That post did not check out"
        >
          <div aria-hidden className="absolute inset-0 bg-void/80 backdrop-blur-sm" />

          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="panel ticked relative w-full max-w-sm p-6"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="eyebrow text-red-400">Not accepted</p>
            <h3 className="wordmark mt-2.5 text-xl text-chalk">
              That post didn&rsquo;t check out
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ash">{reason}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="pressable inline-flex items-center gap-1.5 border-2 border-lime bg-lime px-4 py-2.5 text-[11px] font-bold tracking-wider text-void uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
              >
                Post again
                <FiArrowUpRight className="h-3 w-3" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="pressable border-2 border-line px-4 py-2.5 text-[11px] font-bold tracking-wider text-ash uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-colors hover:border-lime hover:text-lime"
              >
                Fix the link
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The required phrase, with a copy button — people paste this, not retype it. */
function Phrase({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="mt-2 border border-dashed border-line bg-void">
      <p className="px-3 py-2 text-xs leading-relaxed font-semibold whitespace-pre-line text-lime">
        {text}
      </p>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(
            () => setCopied(true),
            // A refused clipboard is not worth an error state; the text is
            // right there to select by hand.
            () => {},
          );
        }}
        className="w-full border-t border-line/60 py-1.5 text-[10px] font-bold tracking-widest text-ash uppercase transition-colors hover:text-lime"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/**
 * The quote link input. Shape is checked as you type; the real check runs
 * against X — debounced — because that is what actually decides whether the
 * gate opens.
 */
function QuoteField({
  questId,
  value,
  onChange,
  username,
  check,
  onCheckChange,
}: {
  questId: QuestId;
  value: string;
  onChange: (v: string) => void;
  username?: string;
  check: QuoteCheck;
  onCheckChange: (next: QuoteCheck) => void;
}) {
  const trimmed = value.trim();
  const parsed = parsePostLink(trimmed);
  // The post this link points at, or "" when the link isn't usable yet. A
  // plain string keeps the check effect's dependencies statically checkable.
  const postAuthor = parsed?.username ?? "";
  const wrongAccount =
    postAuthor !== "" &&
    Boolean(username) &&
    postAuthor.toLowerCase() !== username!.toLowerCase();
  const malformed = trimmed.length > 0 && parsed === null;
  const checkable = postAuthor !== "" && !wrongAccount;

  // Only the newest check may settle the state, so a slow early request can't
  // overwrite the verdict for a link the guest has since corrected.
  const runId = useRef(0);

  const verify = useCallback(
    async (link: string) => {
      const id = ++runId.current;
      onCheckChange({ state: "checking" });

      try {
        const res = await fetch("/api/quests/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link }),
        });
        const data = await res.json();
        if (id !== runId.current) return;

        onCheckChange(
          data.ok
            ? { state: "ok" }
            : {
                state: "bad",
                reason: String(data.reason ?? "That post didn't check out."),
              },
        );
      } catch {
        if (id !== runId.current) return;
        onCheckChange({
          state: "bad",
          reason: "Couldn't reach the checker. Try again in a sec.",
        });
      }
    },
    [onCheckChange],
  );

  // Re-check shortly after typing stops, so a pasted link verifies itself.
  useEffect(() => {
    if (!checkable) {
      // Abandon any check in flight: its verdict is about an older link.
      runId.current++;
      onCheckChange({ state: "idle" });
      return;
    }

    const t = setTimeout(() => verify(trimmed), 600);
    return () => clearTimeout(t);
  }, [trimmed, checkable, verify, onCheckChange]);

  const error = malformed
    ? "That doesn't look like a post link."
    : wrongAccount
      ? `That post is on @${postAuthor}, not @${username}.`
      : check.state === "bad"
        ? check.reason
        : null;

  return (
    <div className="mt-3">
      <label htmlFor={questId} className="eyebrow text-lime-dim">
        Paste your post
      </label>

      <div
        className="mt-1.5 flex items-center gap-2 border bg-void px-3 transition-colors focus-within:border-lime"
        style={{
          borderColor:
            check.state === "ok"
              ? "var(--color-lime)"
              : error
                ? "rgb(248 113 113 / 0.6)"
                : "var(--color-line)",
        }}
      >
        <span aria-hidden className="font-mono text-xs text-lime">
          &gt;
        </span>
        <input
          id={questId}
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://x.com/you/status/…"
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent py-2.5 font-mono text-xs text-chalk outline-none placeholder:text-ash"
        />
        {check.state === "checking" && (
          <FiLoader className="h-3.5 w-3.5 shrink-0 animate-spin text-ash" />
        )}
      </div>

      {/* One line of log output, in the terminal's voice. */}
      <AnimatePresence mode="wait">
        {(error || check.state === "ok" || check.state === "checking") && (
          <motion.p
            key={error ?? check.state}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`mt-2 font-mono text-[11px] leading-relaxed ${
              error ? "text-red-400" : "text-lime"
            }`}
          >
            {check.state === "checking"
              ? "Reading post…"
              : error
                ? `Rejected. ${error}`
                : "Verified. Quote found."}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

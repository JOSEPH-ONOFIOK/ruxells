"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowUpRight, FiLoader } from "react-icons/fi";
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
 * The four steps, as a security terminal running an authorisation sequence.
 *
 * Not a checklist. Each step is a channel the door is testing, and the panel
 * reports on them the way a machine would: a status word, a signal bar, and a
 * line of log output that accumulates as things happen. What a guest does is
 * identical to ticking boxes — the difference is that the page behaves like
 * something being convinced rather than a form being filled.
 *
 * The quote step is still the real gate: it is the only one X lets us check,
 * so it is verified against the live post and every step after it stays sealed
 * until it passes. The attestation steps before it are declared by the guest —
 * there is no way to read a follow or a like on the free tier — but they can't
 * be used to skip the part that is enforced.
 */

/** Index of the step that must verify before the rest unlock. */
const GATE_INDEX = QUESTS.findIndex((q) => q.needsLink);

export type QuoteCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "bad"; reason: string };

/** The channel each step is testing, in the terminal's own vocabulary. */
const CHANNEL: Record<QuestId, string> = {
  follow: "IDENT",
  boost: "SIGNAL",
  quote: "BROADCAST",
  tag: "ESCORT",
};

export function Quests({
  state,
  onChange,
  username,
  check,
  onCheckChange,
}: {
  state: QuestState;
  onChange: (next: QuestState) => void;
  username?: string;
  check: QuoteCheck;
  onCheckChange: (next: QuoteCheck) => void;
}) {
  const gateCleared = check.state === "ok";
  const done = QUESTS.filter((q) => isQuestDone(q.id, state, username)).length;

  return (
    <div className="panel ticked overflow-hidden">
      <Readout done={done} total={QUESTS.length} />

      <Log state={state} username={username} check={check} />

      <ol>
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
          />
        ))}
      </ol>
    </div>
  );
}

/**
 * The door's log.
 *
 * Lines are derived from the current state rather than appended as events
 * happen — so the log is correct after a reload, after the OAuth round trip,
 * and after a step is un-ticked, none of which an append-only list survives.
 * It reads as a machine talking to itself, which is the whole point: the page
 * should feel like something responding rather than a form being filled.
 */
function Log({
  state,
  username,
  check,
}: {
  state: QuestState;
  username?: string;
  check: QuoteCheck;
}) {
  const lines: string[] = ["door: awaiting authorisation"];

  if (username) lines.push(`ident: @${username} confirmed`);

  for (const quest of QUESTS) {
    if (isQuestDone(quest.id, state, username)) {
      lines.push(`${CHANNEL[quest.id].toLowerCase()}: clear`);
    }
  }

  if (check.state === "checking") lines.push("broadcast: reading post…");
  if (check.state === "bad") lines.push(`broadcast: rejected`);

  const all = QUESTS.every((q) => isQuestDone(q.id, state, username));
  if (all && check.state === "ok") lines.push("door: seal released");

  // Only the tail is shown — this is a status strip, not a transcript, and a
  // panel that grows as you work pushes the wallet field off the screen.
  const tail = lines.slice(-3);

  return (
    <div className="border-b border-line bg-void px-4 py-2.5">
      {tail.map((line, i) => (
        <p
          key={line}
          className={`font-mono text-[10px] leading-relaxed ${
            i === tail.length - 1 ? "text-ash" : "text-ash/35"
          }`}
        >
          <span className="text-lime/50">&gt;</span> {line}
          {i === tail.length - 1 && (
            <span className="caret ml-1 text-lime">▌</span>
          )}
        </p>
      ))}
    </div>
  );
}

/**
 * The header: four bars, one per channel, and a status word.
 *
 * The bars are the progress indicator — a count of four is small enough that
 * a number would be less legible than the shape of it.
 */
function Readout({ done, total }: { done: number; total: number }) {
  const all = done === total;

  return (
    <div className="border-b border-line bg-raised px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-ash">Authorisation</p>
        <p
          className={`eyebrow transition-colors ${
            all ? "text-lime" : "text-ash/60"
          }`}
        >
          {all ? "All channels clear" : `${done} of ${total} clear`}
        </p>
      </div>

      <div className="mt-2.5 flex gap-1" aria-hidden>
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
}: {
  quest: (typeof QUESTS)[number];
  index: number;
  state: QuestState;
  onChange: (next: QuestState) => void;
  username?: string;
  check: QuoteCheck;
  onCheckChange: (next: QuoteCheck) => void;
  sealed: boolean;
}) {
  const done = isQuestDone(quest.id, state, username);
  const link = questLinkFor(quest.id, PINNED_POST_ID);
  const reduced = useReducedMotion();

  // A channel opens when it is reached and closes once it is clear, so the
  // panel only ever shows the step actually being worked on. Overridable —
  // clicking the header reopens a finished one.
  const [open, setOpen] = useState(index === 0);
  const wasDone = useRef(done);

  useEffect(() => {
    if (done && !wasDone.current) setOpen(false);
    if (!done && wasDone.current) setOpen(true);
    wasDone.current = done;
  }, [done]);

  const status = sealed
    ? "SEALED"
    : done
      ? "CLEAR"
      : check.state === "checking" && quest.needsLink
        ? "READING"
        : "OPEN";

  return (
    <li
      className={`relative border-b border-line last:border-b-0 transition-colors ${
        sealed ? "bg-void" : done ? "bg-lime/[0.04]" : ""
      }`}
    >
      {/* The lime spine marks a cleared channel down the left edge. */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 bg-lime"
        initial={false}
        animate={{ scaleY: done && !sealed ? 1 : 0 }}
        style={{ originY: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* --- the channel line ----------------------------------------- */}
      <button
        type="button"
        disabled={sealed}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed enabled:hover:bg-raised/60"
      >
        <span
          className={`font-mono text-[10px] tabular-nums ${
            sealed ? "text-ash/25" : done ? "text-lime" : "text-ash/50"
          }`}
        >
          {quest.n}
        </span>

        <span
          className={`eyebrow flex-1 truncate ${
            sealed ? "text-ash/30" : done ? "text-lime" : "text-chalk"
          }`}
        >
          {CHANNEL[quest.id as QuestId]}
        </span>

        {/* Four ticks that fill as the channel resolves — the signal-strength
            read, and the one piece of motion that marks a step landing. */}
        <span aria-hidden className="flex items-end gap-0.5">
          {[3, 5, 7, 9].map((h, i) => (
            <motion.span
              key={h}
              className={done && !sealed ? "bg-lime" : "bg-line"}
              style={{ width: 2, height: h }}
              initial={false}
              animate={
                status === "READING" && !reduced
                  ? { opacity: [0.25, 1, 0.25] }
                  : { opacity: done && !sealed ? 1 : 0.35 }
              }
              transition={
                status === "READING"
                  ? { duration: 0.9, repeat: Infinity, delay: i * 0.12 }
                  : { duration: 0.3 }
              }
            />
          ))}
        </span>

        <span
          className={`eyebrow w-[4.5rem] text-right ${
            sealed
              ? "text-ash/30"
              : done
                ? "text-lime"
                : status === "READING"
                  ? "text-chalk"
                  : "text-ash/60"
          }`}
        >
          {status}
        </span>
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

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-chalk">{quest.title}</p>
                  <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-ash">
                    {quest.detail}
                  </p>
                </div>
              </div>

              {quest.phrase && <Phrase text={quest.phrase} />}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-line px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors hover:border-lime hover:text-lime"
                >
                  {quest.cta}
                  <FiArrowUpRight className="h-3 w-3" />
                </a>

                {!quest.needsLink && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...state, [quest.id]: !done })}
                    aria-pressed={done}
                    className={`border px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors ${
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
        <p className="px-4 pb-3 pl-[2.1rem] text-[11px] text-ash/50">
          Opens once {CHANNEL[QUESTS[GATE_INDEX].id as QuestId]} reads clear.
        </p>
      )}
    </li>
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
      <label htmlFor={questId} className="eyebrow text-ash/60">
        Paste your post
      </label>

      <div className="mt-1.5 flex items-center gap-2 border bg-void px-3 transition-colors focus-within:border-lime"
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
          className="w-full bg-transparent py-2.5 font-mono text-xs text-chalk outline-none placeholder:text-ash/25"
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowUpRight, FiDownload, FiX } from "react-icons/fi";
import {
  OAUTH_MESSAGES,
  useScrubOAuthParam,
  useXAccount,
  type XAccountState,
} from "../use-x-account";

/**
 * The checkpoint: one room, one door, one question.
 *
 * Connect X and the door lights. Knock and it either opens on the RUXLISTED
 * card or stays shut. The verdict is asked for as soon as an account is
 * connected rather than on the knock, so the knock answers instantly and the
 * card is already downloading by the time anyone reaches for it.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const CARD = "/brand/ruxlisted.webp";
/** The GIF is what gets posted: X takes it animated, up to 15 MB. */
const CARD_GIF = "/brand/ruxlisted.gif";

type Verdict = "unknown" | "listed" | "not-listed" | "error";
type Stage = "idle" | "knocking" | "open" | "shut";

export function Checkpoint({
  account,
  oauthStatus,
  shareText,
  signupsOpen,
}: {
  account: XAccountState;
  oauthStatus: string | null;
  shareText: string;
  signupsOpen: boolean;
}) {
  const x = useXAccount(account);
  useScrubOAuthParam(oauthStatus);
  const reduced = useReducedMotion();

  const [verdict, setVerdict] = useState<Verdict>("unknown");
  const [stage, setStage] = useState<Stage>("idle");
  const [nudge, setNudge] = useState(0);
  const pending = useRef<Promise<Verdict> | null>(null);

  const ask = useCallback(() => {
    pending.current ??= fetch("/api/ruxlisted", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return "error" as const;
        const data = await res.json();
        return data.listed ? ("listed" as const) : ("not-listed" as const);
      })
      .catch(() => "error" as const)
      .then((v) => {
        setVerdict(v);
        // A failure is not cached, so knocking again actually retries.
        if (v === "error") pending.current = null;
        return v;
      });
    return pending.current;
  }, []);

  useEffect(() => {
    if (x.connected) void ask();
  }, [x.connected, ask]);

  // Warm the card for anyone who is going to see it.
  useEffect(() => {
    if (verdict !== "listed") return;
    const img = new window.Image();
    img.src = CARD;
  }, [verdict]);

  const knock = async () => {
    if (!x.connected) {
      setNudge((n) => n + 1);
      return;
    }
    setStage("knocking");
    // A beat before the answer even when it is already here: a door that
    // opens the instant it is touched does not feel like it checked anything.
    const [v] = await Promise.all([
      ask(),
      new Promise((r) => setTimeout(r, reduced ? 0 : 900)),
    ]);
    setStage(v === "listed" ? "open" : v === "not-listed" ? "shut" : "idle");
  };

  const lit = x.connected && stage !== "shut";

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-void">
      {/* --- the room ------------------------------------------------- */}
      <Image
        src="/scene/bay.jpg"
        alt="The Holding Bay"
        fill
        priority
        sizes="100vw"
        quality={100}
        className={`pixelated object-cover object-center transition-[filter] duration-700 ${
          stage === "shut" ? "brightness-[0.45] saturate-50" : ""
        }`}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_55%,transparent_25%,rgba(5,6,7,0.85)_100%)]"
      />

      {/* A red wash when the door stays shut: the room says no before the
          panel does. */}
      <AnimatePresence>
        {stage === "shut" && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#ff2d2d]"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0.06 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
          />
        )}
      </AnimatePresence>

      {/* --- the door ------------------------------------------------- */}
      <motion.div
        className="absolute bottom-[10%] left-1/2 w-[min(46vw,17rem)] -translate-x-1/2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
      >
        <motion.button
          type="button"
          onClick={knock}
          disabled={stage === "knocking"}
          aria-label={
            x.connected
              ? "Knock on the door"
              : "The door is locked. Connect X first."
          }
          className="group relative block w-full cursor-pointer disabled:cursor-wait"
          // Refused: a small shake, the way a locked handle rattles. Keyed on
          // the attempt count so every rattle plays, not just the first.
          key={`${nudge}-${stage === "shut"}`}
          animate={
            reduced
              ? undefined
              : nudge > 0 && !x.connected
                ? { x: [0, -9, 8, -6, 4, 0] }
                : stage === "shut"
                  ? { x: [0, -14, 12, -8, 5, 0] }
                  : stage === "knocking"
                    ? { scale: [1, 0.98, 1, 0.98, 1] }
                    : undefined
          }
          transition={{ duration: stage === "knocking" ? 0.9 : 0.45 }}
        >
          {/* The light behind the frame. Green and breathing once someone is
              connected; dead before; red on a no. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-[6%] top-[0%] bottom-[4%] -z-10 blur-2xl transition-colors duration-500 ${
              stage === "shut"
                ? "bg-[#ff2d2d]/40"
                : lit
                  ? `bg-lime/60 ${stage === "knocking" ? "opacity-100" : "door-pulse"}`
                  : "bg-transparent"
            }`}
          />
          <Image
            src="/scene/clerk.gif"
            alt="A Ruxxell holding the door"
            width={300}
            height={520}
            unoptimized
            priority
            className={`pixelated h-auto w-full transition-[filter] duration-500 ${
              lit
                ? "group-hover:brightness-115"
                : "brightness-75 grayscale-[35%]"
            }`}
          />
          {/* A frame drawn around the doorway, pulsing with the light. */}
          {lit && (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 border-2 border-lime ${
                stage === "knocking" ? "opacity-100" : "door-pulse"
              }`}
            />
          )}
        </motion.button>

        <p
          className={`eyebrow mt-4 text-center ${
            stage === "shut" ? "text-[#ff6b6b]" : lit ? "text-lime" : "text-ash"
          }`}
          aria-live="polite"
        >
          {stage === "knocking"
            ? "Checking your papers…"
            : stage === "shut"
              ? "The door stays shut"
              : x.connected
                ? verdict === "error"
                  ? "No answer. Knock again"
                  : "Knock"
                : "Locked"}
        </p>
      </motion.div>

      {/* --- chrome --------------------------------------------------- */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
        <Link href="/">
          <Image
            src="/brand/wordmark-lime.png"
            alt="RUXXELLS"
            width={866}
            height={245}
            className="pixelated h-4 w-auto"
            priority
          />
        </Link>

        {x.connected && (
          <div className="panel-sm flex items-center gap-2.5 px-3 py-2">
            <span className="h-1.5 w-1.5 bg-lime" aria-hidden />
            <span className="text-xs text-chalk">@{x.username}</span>
            <button
              type="button"
              onClick={() => {
                pending.current = null;
                setVerdict("unknown");
                setStage("idle");
                void x.disconnect();
              }}
              className="eyebrow text-ash transition-colors hover:text-lime"
            >
              Switch
            </button>
          </div>
        )}
      </header>

      {/* --- the ask, before anyone is connected ----------------------- */}
      <AnimatePresence>
        {!x.connected && (
          <motion.div
            className="absolute inset-x-0 top-[14%] z-10 flex justify-center px-4"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          >
            <div className="panel ticked w-full max-w-sm p-5 text-center">
              <p className="eyebrow text-lime-dim">Checkpoint</p>
              <h1 className="wordmark mt-2 text-2xl text-chalk">
                Are you RUXLISTED?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                The door only answers to a connected X account. Connect, then
                knock.
              </p>
              {oauthStatus && OAUTH_MESSAGES[oauthStatus] && (
                <p className="mt-3 text-xs text-[#ff6b6b]">
                  {OAUTH_MESSAGES[oauthStatus]}
                </p>
              )}
              {x.configured ? (
                <a
                  href="/api/x/login?next=/checkpoint"
                  className="pressable mt-5 inline-flex items-center gap-2 border-2 border-lime bg-lime px-5 py-3 text-[11px] font-bold tracking-widest text-void uppercase shadow-[3px_3px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
                >
                  Connect X
                </a>
              ) : (
                <p className="mt-5 text-xs text-ash">
                  X login is not configured on this deployment yet.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Shut
        open={stage === "shut"}
        username={x.username}
        signupsOpen={signupsOpen}
        onClose={() => setStage("idle")}
      />
      <Reveal
        open={stage === "open"}
        shareText={shareText}
        onClose={() => setStage("idle")}
      />
    </main>
  );
}

// --- verdicts ---------------------------------------------------------

function Overlay({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
      />
      {children}
    </motion.div>
  );
}

function Shut({
  open,
  username,
  signupsOpen,
  onClose,
}: {
  open: boolean;
  username?: string;
  signupsOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <Overlay label="Not RUXLISTED" onClose={onClose}>
          <motion.div
            className="panel relative w-full max-w-sm border-[#ff2d2d]/60 p-6"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, delay: 0.35, ease: EASE }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center text-ash transition-colors hover:text-chalk"
            >
              <FiX className="h-4 w-4" />
            </button>

            {/* The stamp: lands hard, slightly crooked, like it was done by
                hand at a desk. */}
            <motion.p
              className="wordmark inline-block -rotate-6 border-4 border-[#ff2d2d] px-3 py-1 text-2xl text-[#ff2d2d]"
              initial={{ opacity: 0, scale: 2.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 500, damping: 22 }}
            >
              Not yet
            </motion.p>

            <h2 className="wordmark mt-5 text-2xl text-chalk">
              Your name is not on her sheet
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              She checked twice.{" "}
              {username ? <span className="text-chalk">@{username}</span> : "This account"}{" "}
              is not RUXLISTED.
              {signupsOpen
                ? " The list is still open, and four steps is all it takes."
                : " The list has closed. Keep an eye on the account for what comes next."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {signupsOpen ? (
                <Link
                  href="/clearance"
                  className="pressable inline-flex items-center gap-2 border-2 border-lime bg-lime px-5 py-3 text-[11px] font-bold tracking-widest text-void uppercase shadow-[3px_3px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime"
                >
                  Get cleared
                  <FiArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              <a
                href="https://x.com/ruxxellsHQ"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border-2 border-line px-5 py-3 text-[11px] font-bold tracking-widest text-ash uppercase transition-colors hover:border-lime hover:text-lime"
              >
                @ruxxellsHQ
              </a>
            </div>
          </motion.div>
        </Overlay>
      )}
    </AnimatePresence>
  );
}

function Reveal({
  open,
  shareText,
  onClose,
}: {
  open: boolean;
  shareText: string;
  onClose: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  const download = () => {
    const a = document.createElement("a");
    a.href = CARD_GIF;
    a.download = "ruxlisted.gif";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /**
   * Posting with the card attached.
   *
   * X's intent link takes text only, never an image. Where the share sheet
   * accepts files — phones, mostly — the card goes in with the caption and
   * lands in the X app attached. Everywhere else the card is saved and the
   * composer opens with the caption, so attaching it is one drag.
   */
  const post = async () => {
    setSharing(true);
    try {
      if (typeof navigator.canShare === "function") {
        const blob = await fetch(CARD_GIF).then((r) => r.blob());
        const file = new File([blob], "ruxlisted.gif", { type: "image/gif" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], text: shareText });
          } catch {
            // Cancelled from the sheet: nothing to fall back to.
          }
          return;
        }
      }
      download();
      window.open(
        `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Overlay label="RUXLISTED" onClose={onClose}>
          <motion.div
            className="relative flex w-full max-w-md flex-col items-center"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {/* The door's light, carried through into the card. */}
            <span
              aria-hidden
              className="door-pulse pointer-events-none absolute inset-[8%] -z-10 bg-lime/40 blur-3xl"
            />
            <div className="panel ticked w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- an
                  animated WebP: the image optimiser would flatten it. */}
              <img
                src={CARD}
                alt="The RUXLISTED card"
                width={1080}
                height={1350}
                className="block h-auto max-h-[62svh] w-full object-contain"
              />
            </div>

            <p className="eyebrow mt-5 text-lime">You are through</p>
            <h2 className="wordmark mt-2 text-center text-2xl text-chalk">
              A Ruxxell is reserved for you
            </h2>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={post}
                disabled={sharing}
                className="pressable inline-flex items-center gap-2 border-2 border-lime bg-lime px-5 py-3 text-[11px] font-bold tracking-widest text-void uppercase shadow-[3px_3px_0_0_rgba(0,0,0,0.55)] transition-colors hover:bg-transparent hover:text-lime disabled:opacity-60"
              >
                {sharing ? "Preparing…" : "Post it on X"}
                <FiArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 border-2 border-line px-5 py-3 text-[11px] font-bold tracking-widest text-ash uppercase transition-colors hover:border-lime hover:text-lime"
              >
                Save the card
                <FiDownload className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="eyebrow mt-5 text-ash transition-colors hover:text-lime"
            >
              Back to the room
            </button>
          </motion.div>
        </Overlay>
      )}
    </AnimatePresence>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowUpRight, FiCheck, FiLock } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import {
  OAUTH_MESSAGES,
  useScrubOAuthParam,
  useXAccount,
  type XAccountState,
} from "./use-x-account";
import { Quests, type QuoteCheck } from "./Quests";
import { clearQuestState, useQuestState } from "@/lib/quest-store";
import { allQuestsDone, claimShareUrl } from "@/lib/quests";
import { DROP } from "@/lib/sectors";
import { pad, useCountdown } from "./use-countdown";

type Status = "idle" | "submitting" | "success" | "error";

const EASE = [0.16, 1, 0.3, 1] as const;

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function ClearanceForm({
  account,
  oauthStatus,
}: {
  account: XAccountState;
  oauthStatus: string | null;
}) {
  const x = useXAccount(account);
  const [quests, setQuests] = useQuestState();
  useScrubOAuthParam(oauthStatus);

  // The quote gate's verdict, owned here because it also blocks submit.
  const [quoteCheck, setQuoteCheck] = useState<QuoteCheck>({ state: "idle" });

  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    position: number | null;
    clearanceCode: string;
    handle: string;
  } | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const { left, closed } = useCountdown(DROP.closesAt);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/allowlist")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const needsConnect = x.configured && !x.connected;
  // Shape check and the live verdict both have to pass: the first keeps the
  // button honest as you type, the second is the part X actually confirmed.
  const questsReady =
    allQuestsDone(quests, x.username) && quoteCheck.state === "ok";
  const walletValid = ETH_ADDRESS_RE.test(wallet.trim());
  const canSubmit =
    !needsConnect && questsReady && walletValid && status !== "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: wallet.trim(),
          quests,
          handle: x.username,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setResult({
        position: typeof data.position === "number" ? data.position : null,
        clearanceCode: String(data.clearanceCode ?? ""),
        handle: String(data.handle ?? `@${x.username ?? ""}`),
      });
      // The spot is recorded server-side now; keeping the local copy would
      // only let a refresh look like unfinished work.
      clearQuestState();
    } catch {
      setStatus("error");
      setMessage("Couldn't reach the server. Try again in a sec.");
    }
  }

  // --- cleared ---------------------------------------------------------

  if (status === "success" && result) {
    return <Receipt result={result} />;
  }

  return (
    <div className="space-y-4">
      {/* --- status strip -------------------------------------------- */}
      <div className="flex items-stretch gap-px bg-line">
        <div className="flex-1 bg-panel px-4 py-3">
          <p className="eyebrow text-ash/60">Through the door</p>
          <p className="wordmark mt-1 text-xl text-lime tabular-nums">
            {count === null ? "..." : count.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 bg-panel px-4 py-3 text-right">
          <p className="eyebrow text-ash/60">
            {closed ? "Door" : "Closes in"}
          </p>
          <p className="wordmark mt-1 text-xl tabular-nums text-chalk">
            {closed ? (
              <span className="text-ash">Shut</span>
            ) : left ? (
              `${pad(left.hours)}:${pad(left.minutes)}:${pad(left.seconds)}`
            ) : (
              <span className="text-ash/40">--:--:--</span>
            )}
          </p>
        </div>
      </div>

      {/* --- connect X ------------------------------------------------ */}
      {x.configured && (
        <div className="panel flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FaXTwitter className="h-4 w-4 shrink-0 text-chalk" />
            {x.connected ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-chalk">
                  @{x.username}
                </p>
                <p className="eyebrow mt-0.5 text-lime">Identity confirmed</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-chalk">
                  Connect X to unlock the steps
                </p>
                <p className="mt-0.5 text-[11px] text-ash">
                  Read-only. We never post for you.
                </p>
              </div>
            )}
          </div>

          {x.connected ? (
            <button
              type="button"
              onClick={x.disconnect}
              className="shrink-0 border border-line px-3 py-1.5 text-[11px] font-bold tracking-wider text-ash uppercase transition-colors hover:border-lime hover:text-lime"
            >
              Disconnect
            </button>
          ) : (
            <a
              href="/api/x/login"
              className="shrink-0 border border-lime bg-lime px-4 py-2 text-[11px] font-bold tracking-wider text-void uppercase transition-colors hover:bg-transparent hover:text-lime"
            >
              Connect X
            </a>
          )}
        </div>
      )}

      {oauthStatus && OAUTH_MESSAGES[oauthStatus] && (
        <p className="border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
          {OAUTH_MESSAGES[oauthStatus]}
        </p>
      )}

      {/* --- the steps ------------------------------------------------ */}
      <div className={needsConnect ? "pointer-events-none opacity-40" : ""}>
        <Quests
          state={quests}
          onChange={setQuests}
          username={x.username}
          check={quoteCheck}
          onCheckChange={setQuoteCheck}
        />
      </div>

      {/* --- the seal ------------------------------------------------- */}
      <form onSubmit={handleSubmit} className="panel ticked relative p-4">
        {/* Two shutters that part down the middle when the four channels
            clear. They cover the field rather than replacing it, so the
            unseal is one movement instead of a layout jump — and they open
            outward, which reads as a door rather than a fade. */}
        <AnimatePresence initial={false}>
          {!questsReady && (
            <>
              {[-1, 1].map((dir) => (
                <motion.div
                  key={dir}
                  aria-hidden
                  className="absolute inset-y-0 z-10 w-1/2 border-line bg-raised"
                  style={{
                    [dir === -1 ? "left" : "right"]: 0,
                    borderRightWidth: dir === -1 ? 1 : 0,
                  }}
                  initial={false}
                  exit={{
                    x: dir * 40,
                    opacity: 0,
                    transition: { duration: 0.45, ease: EASE },
                  }}
                />
              ))}
              <motion.div
                key="seal-label"
                className="absolute inset-0 z-20 flex items-center justify-center gap-2"
                initial={false}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <FiLock className="h-3.5 w-3.5 text-ash/60" />
                <p className="eyebrow text-ash/60">Sealed</p>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <label htmlFor="wallet" className="eyebrow text-lime">
          Destination wallet
        </label>
        <input
          id="wallet"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x…"
          disabled={!questsReady}
          aria-invalid={wallet.length > 0 && !walletValid}
          className={`mt-2 w-full border bg-void px-3 py-3 font-mono text-sm text-chalk outline-none placeholder:text-ash/30 disabled:cursor-not-allowed ${
            wallet.length > 0 && !walletValid
              ? "border-red-500/60"
              : walletValid
                ? "border-lime"
                : "border-line focus:border-lime"
          }`}
        />

        {wallet.length > 0 && !walletValid && (
          <p className="mt-1.5 text-[11px] font-semibold text-red-400">
            That isn&rsquo;t a valid EVM address.
          </p>
        )}

        <p className="mt-2 text-[11px] leading-relaxed text-ash">
          EVM address. Check it twice. The mint goes here and nowhere else.
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 w-full border border-lime bg-lime py-3 text-xs font-bold tracking-widest text-void uppercase transition-colors enabled:hover:bg-transparent enabled:hover:text-lime disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ash/40"
        >
          {status === "submitting" ? "Submitting…" : "Submit for clearance"}
        </button>

        {status === "error" && message && (
          <p className="mt-3 border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

/**
 * The receipt.
 *
 * Built to be screenshotted: the code is the biggest thing on it, and the
 * share link is offered right here, because this is the moment someone is
 * most willing to say they got in.
 */
function Receipt({
  result,
}: {
  result: { position: number | null; clearanceCode: string; handle: string };
}) {
  return (
    <motion.div
      className="panel ticked sweep relative overflow-hidden text-center"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* The soldier, at the top of the card. This is the thing people
          screenshot and post, so the collection has to be in the picture —
          a code on a blank panel says nothing about what was joined. */}
      <div className="relative h-32 overflow-hidden border-b border-line bg-raised sm:h-40">
        <Image
          src="/brand/soldier.gif"
          alt=""
          aria-hidden
          width={1453}
          height={1455}
          className="pixelated h-full w-full object-cover object-top opacity-60"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />

        <motion.div
          className="absolute bottom-3 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center border border-lime bg-lime"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: EASE }}
        >
          <FiCheck className="h-5 w-5 text-void" />
        </motion.div>
      </div>

      <div className="p-6 sm:p-8">
      <p className="eyebrow text-lime">Clearance granted</p>
      <p className="wordmark mt-3 text-[clamp(1.8rem,7vw,2.8rem)] text-chalk">
        You&rsquo;re in
      </p>

      <div className="mt-6 border border-dashed border-line bg-void p-4">
        <p className="eyebrow text-ash">Clearance code</p>
        <p className="wordmark mt-2 text-2xl tracking-widest text-lime">
          {result.clearanceCode}
        </p>
      </div>

      <dl className="mt-4 space-y-1 text-[11px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ash uppercase tracking-wider">Operative</dt>
          <dd className="font-bold text-chalk">{result.handle}</dd>
        </div>
        {result.position !== null && (
          <div className="flex justify-between gap-3">
            <dt className="text-ash uppercase tracking-wider">Position</dt>
            <dd className="font-bold text-chalk tabular-nums">
              #{result.position.toLocaleString()}
            </dd>
          </div>
        )}
      </dl>

      <a
        href={claimShareUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-lime bg-lime py-3 text-xs font-bold tracking-widest text-void uppercase transition-colors hover:bg-transparent hover:text-lime"
      >
        Post it
        <FiArrowUpRight className="h-3.5 w-3.5" />
      </a>

        <p className="mt-4 text-[11px] leading-relaxed text-ash">
          Screenshot this. Mint details go out on X.
        </p>
      </div>
    </motion.div>
  );
}

import { FiArrowUpRight } from "react-icons/fi";
import {
  fetchQuotes,
  formatPrice,
  formatUsd,
  type Quote,
} from "@/lib/tokens";

/**
 * The trade board.
 *
 * Live prices for the tokens the project watches, read on the server so the
 * page arrives with real figures rather than a row of dashes that fill in
 * afterwards.
 *
 * A server component on purpose: the alternative is shipping a fetch, a
 * loading state and a polling timer to render four numbers that change
 * slowly. Next revalidates the data every sixty seconds, which is live
 * enough for a board nobody is scalping off.
 */

export async function Trade() {
  const quotes = await fetchQuotes();

  // A board with nothing on it is worse than no board: it reads as broken
  // rather than as a section that has not loaded.
  if (quotes.length === 0) return null;

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2 text-lime">
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse bg-lime" />
              Live
            </p>
            <h2 className="wordmark mt-2 text-[clamp(1.6rem,6vw,2.6rem)] text-chalk">
              The board
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ash">
              What the crew is watching. Prices are live from the open market
              and refresh on their own.
            </p>
          </div>
        </div>

        <ul className="mt-8 grid gap-px border-2 border-line bg-line">
          {quotes.map((q) => (
            <Row key={q.symbol} quote={q} />
          ))}
        </ul>

        {/* Not financial advice, and it should not need saying — but a page
            carrying live prices next to a mint is exactly where it does. */}
        <p className="mt-4 text-[11px] leading-relaxed text-ash">
          Prices are indicative and come from the open market. Nothing here is
          advice, an offer, or connected to the mint.
        </p>
      </div>
    </section>
  );
}

function Row({ quote }: { quote: Quote }) {
  const up = quote.change24h >= 0;

  return (
    <li className="bg-panel">
      <a
        href={quote.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-raised sm:gap-6 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <p className="wordmark truncate text-base text-chalk">
            {quote.symbol}
          </p>
          <p className="mt-1 truncate text-[11px] text-ash">{quote.name}</p>
        </div>

        {/* Volume and liquidity are the two figures that say whether a price
            means anything, so they sit beside it rather than behind a
            disclosure — but they are the first to go on a narrow screen. */}
        <div className="hidden text-right sm:block">
          <p className="eyebrow text-ash">24h vol</p>
          <p className="mt-1 text-xs tabular-nums text-chalk">
            {formatUsd(quote.volume24h)}
          </p>
        </div>

        <div className="hidden text-right md:block">
          <p className="eyebrow text-ash">Liquidity</p>
          <p className="mt-1 text-xs tabular-nums text-chalk">
            {formatUsd(quote.liquidity)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="wordmark text-base tabular-nums text-chalk">
            {formatPrice(quote.price)}
          </p>
          <p
            className={`mt-1 text-[11px] font-bold tabular-nums ${
              up ? "text-lime" : "text-red-400"
            }`}
          >
            {up ? "+" : ""}
            {quote.change24h.toFixed(2)}%
          </p>
        </div>

        <FiArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ash transition-colors group-hover:text-lime" />
      </a>
    </li>
  );
}

/**
 * The tokens the trade board watches.
 *
 * PLACEHOLDERS. These are three well-known Solana meme coins standing in so
 * the board can be built and seen working; swap the pairs for whatever this
 * project actually wants to track. Nothing else has to change — the board
 * reads this list and nothing else.
 *
 * Identified by DexScreener pair address rather than ticker, because tickers
 * are not unique: several tokens call themselves BONK and a name lookup
 * would eventually surface the wrong one on a page people may act on.
 */

export type Watched = {
  /** DexScreener's chain slug. */
  chain: string;
  /** The pair address, from the DexScreener URL for that market. */
  pair: string;
};

export const WATCHED: Watched[] = [
  // dogwifhat / SOL
  { chain: "solana", pair: "EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx" },
  // BONK / SOL
  { chain: "solana", pair: "HVNwzt7Pxfu76KHCMQPTLuTCLTm6WnQ1esLv4eizseSv" },
  // POPCAT / SOL
  { chain: "solana", pair: "FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo" },
];

/** What the board renders for each token. */
export type Quote = {
  symbol: string;
  name: string;
  /** In USD. */
  price: number;
  /** Percent, can be negative. */
  change24h: number;
  /** Already formatted by the API as a number of USD. */
  volume24h: number;
  liquidity: number;
  /** Where someone goes to actually trade it. */
  url: string;
};

/** One pair, as DexScreener returns it. Only the fields the board reads. */
type Pair = {
  baseToken?: { symbol?: string; name?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  url?: string;
};

/**
 * Reads the watched pairs.
 *
 * One request for all of them rather than one each: DexScreener takes a
 * comma-separated list, and three round trips to render three rows would be
 * three chances to rate-limit.
 *
 * Returns an empty list rather than throwing. A board that cannot reach its
 * feed should render as unavailable, not take the page down with it.
 */
export async function fetchQuotes(): Promise<Quote[]> {
  const byChain = new Map<string, string[]>();
  for (const w of WATCHED) {
    byChain.set(w.chain, [...(byChain.get(w.chain) ?? []), w.pair]);
  }

  const out: Quote[] = [];

  for (const [chain, pairs] of byChain) {
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairs.join(",")}`,
        {
          // Prices move; a cached one is worse than a slow one. Sixty seconds
          // is often enough to read as live without asking on every render.
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(6000),
        },
      );

      if (!res.ok) continue;

      const data = (await res.json()) as { pairs?: Pair[] | null };

      for (const p of data.pairs ?? []) {
        const price = Number(p.priceUsd);
        if (!p.baseToken?.symbol || !Number.isFinite(price)) continue;

        out.push({
          symbol: p.baseToken.symbol,
          name: p.baseToken.name ?? p.baseToken.symbol,
          price,
          change24h: p.priceChange?.h24 ?? 0,
          volume24h: p.volume?.h24 ?? 0,
          liquidity: p.liquidity?.usd ?? 0,
          url: p.url ?? `https://dexscreener.com/${chain}/${p}`,
        });
      }
    } catch {
      // A timeout or a network error leaves this chain out and the rest in.
    }
  }

  return out;
}

/**
 * Prices here span cents to millionths of a cent, so a fixed number of
 * decimals either rounds a meme coin to zero or gives a dollar token six
 * meaningless places.
 */
export function formatPrice(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}

/** Compact, because these run to nine figures and the column is narrow. */
export function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

import { defineChain } from "viem";

/**
 * Robinhood Chain.
 *
 * PLACEHOLDER VALUES. The chain id and RPC below are guesses and must be
 * replaced with the real ones before this is deployed — a wrong chain id
 * means wallets are asked to switch to a network that does not exist, and a
 * wrong RPC means every read fails.
 *
 * Nothing on the site reads the chain today: wallet connection proves
 * ownership of an address, and the address is all grid activation records.
 * So a wrong value here is inert until the first on-chain read is added,
 * which is why it ships as a marked placeholder rather than blocking the
 * flow that does not need it.
 */
export const robinhood = defineChain({
  id: 1_000_000_000,
  name: "Robinhood",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.robinhood.example"] },
  },
  testnet: false,
});

/**
 * True once the chain is really configured.
 *
 * The UI uses this to avoid claiming a network it cannot actually reach, so
 * that the connect button can work — an address is an address on any EVM
 * chain — without the page asserting something untrue about where the mint
 * happens.
 */
export const CHAIN_CONFIGURED = false;

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { robinhood } from "@/lib/chain";
import "@rainbow-me/rainbowkit/styles.css";

/**
 * Wallet connection for grid activation.
 *
 * The wallet is the account here: X is optional decoration on a profile,
 * and an address is what a Ruxxell is actually held by. That is the opposite
 * of the allowlist at /clearance, where X is the gate and the wallet is a
 * destination someone types in — the two flows answer different questions
 * and deliberately do not share an identity model.
 *
 * Mainnet is listed alongside Robinhood so the modal still works while the
 * chain config is a placeholder; connecting proves control of an address,
 * and the address is the same on every EVM chain.
 */

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID ?? "";

const config = getDefaultConfig({
  appName: "RUXXELLS",
  // WalletConnect refuses an empty id, so without one the modal falls back
  // to injected wallets only. That is a worse experience on mobile, not a
  // broken one, and it keeps a fresh checkout runnable with no secrets.
  projectId: projectId || "00000000000000000000000000000000",
  chains: [robinhood, mainnet],
  ssr: true,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Created once per mount rather than at module scope: a shared client
  // would leak one visitor's cached reads into the next request on the
  // server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#ccff00",
            accentColorForeground: "#050607",
            borderRadius: "none",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

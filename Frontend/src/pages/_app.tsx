import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
import { Network } from "@aptos-labs/ts-sdk";

import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";

// 创建全局的 QueryClient 实例
const queryClient = new QueryClient();

const wallets = [
  new OKXWallet(),
];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={true}
        dappConfig={{ network: Network.MAINNET }}
        onError={(error) => {
          console.log("error", error);
        }}
      >
        <Component {...pageProps} />
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}

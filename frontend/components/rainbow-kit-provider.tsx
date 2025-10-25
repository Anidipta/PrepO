"use client"

import React from "react"
import {  getDefaultConfig,  RainbowKitProvider} from "@rainbow-me/rainbowkit"
import { WagmiConfig } from "wagmi"
import { celo, celoSepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@rainbow-me/rainbowkit/styles.css"

const config = getDefaultConfig({
  appName: "PrepO",
  projectId: "119442ff43869e1b4441f834e616d62d",
  chains: [celo, celoSepolia],
  ssr: true,
})

const queryClient = new QueryClient()

export default function RainbowKitProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
}

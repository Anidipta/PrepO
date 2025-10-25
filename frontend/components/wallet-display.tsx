"use client"

import { useWallet } from "@/components/wallet-provider"
import { Button } from "@/components/ui/button"

export default function WalletDisplay() {
  const { address, balance, isConnected, connectWallet, disconnectWallet } = useWallet()

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-2 rounded-lg"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Wallet</p>
        <p className="text-sm font-mono font-semibold text-foreground">{address}</p>
        <p className="text-sm font-bold text-secondary">{balance.toFixed(2)} CELO</p>
      </div>
      <Button
        onClick={disconnectWallet}
        variant="outline"
        className="border-secondary text-secondary hover:bg-secondary/10 px-4 py-2 rounded-lg bg-transparent"
      >
        Disconnect
      </Button>
    </div>
  )
}

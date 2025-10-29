"use client"

import { useWallet } from "@/components/wallet-provider"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface Earnings {
  total: number
  summary?: Record<string, number>
}

export default function WalletDisplay() {
  const { address, balance, isConnected, connectWallet, disconnectWallet } = useWallet()
  const [earnings, setEarnings] = useState<Earnings | null>(null)

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!address) return
      try {
        const res = await fetch(`/api/user/${encodeURIComponent(address)}`)
        if (!res.ok) return
        const j = await res.json()
        if (j?.earnings) setEarnings(j.earnings)
      } catch (e) {
        console.warn('Failed to fetch earnings', e)
      }
    }
    fetchEarnings()
  }, [address])

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
        {earnings && (
          <p className={`text-sm font-semibold ${earnings.total < 0 ? 'text-red-500' : 'text-green-600'}`}>
            Earned: {earnings.total.toFixed(4)} CELO
          </p>
        )}
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

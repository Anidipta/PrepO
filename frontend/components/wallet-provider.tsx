"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface WalletContextType {
  address: string | null
  balance: number
  isConnected: boolean
  userName: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  setUserName: (name: string) => void
  addCELO: (amount: number) => void
  subtractCELO: (amount: number) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState(156.8)
  const [isConnected, setIsConnected] = useState(false)
  const [userName, setUserNameState] = useState<string | null>(null)

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        })
        const mockAddress = accounts[0] || "0xAb12...Ff34"
        setAddress(mockAddress)
        setIsConnected(true)
        localStorage.setItem("walletAddress", mockAddress)
      } else {
        // Fallback for development
        const mockAddress = "0xAb12...Ff34"
        setAddress(mockAddress)
        setIsConnected(true)
        localStorage.setItem("walletAddress", mockAddress)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setIsConnected(false)
    setUserNameState(null)
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("userName")
    router.push("/")
  }

  const setUserName = (name: string) => {
    setUserNameState(name)
    localStorage.setItem("userName", name)
  }

  const addCELO = (amount: number) => {
    setBalance((prev) => prev + amount)
  }

  const subtractCELO = (amount: number) => {
    setBalance((prev) => Math.max(0, prev - amount))
  }

  // Check for existing wallet connection on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress")
    const savedName = localStorage.getItem("userName")
    if (savedAddress) {
      setAddress(savedAddress)
      setIsConnected(true)
    }
    if (savedName) {
      setUserNameState(savedName)
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected,
        userName,
        connectWallet,
        disconnectWallet,
        setUserName,
        addCELO,
        subtractCELO,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

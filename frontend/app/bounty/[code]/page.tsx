"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ethers } from "ethers"
import { registerForBountyOnChain } from "@/lib/smart-contracts"
import { useAccount } from "wagmi"

export default function BountyPage() {
  const params = useParams()
  const router = useRouter()
  const [bounty, setBounty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const { address } = useAccount()

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        const response = await fetch(`/api/bounties/${params.code}`)
        if (response.ok) {
          const data = await response.json()
          setBounty(data.data)
          // load bounty-specific leaderboard
          try {
            const lb = await fetch(`/api/leaderboards?bounty=${data.data.code}`)
            if (lb.ok) {
              const lbj = await lb.json()
              setLeaderboard(lbj?.[0]?.entries || [])
            }
          } catch (e) {
            console.warn("Failed to load bounty leaderboard", e)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching bounty:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.code) fetchBounty()
  }, [params.code])


  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!bounty) return <div className="min-h-screen flex items-center justify-center">Bounty not found</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        Back
      </Button>

      <Card className="glass-effect border-primary/20 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">{bounty.title}</CardTitle>
          <p className="text-muted-foreground mt-2">Code: {bounty.code}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-muted-foreground">{bounty.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Prize Pool</p>
              <p className="text-lg font-semibold text-primary">{bounty.prizePool} CELO</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Entry Fee</p>
              <p className="text-lg font-semibold text-secondary">{bounty.entryFee} CELO</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <p className="text-lg font-semibold text-foreground">{bounty.difficulty}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="text-lg font-semibold text-foreground">{bounty.deadline}</p>
            </div>
          </div>

          {bounty.requirements && bounty.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Requirements</h3>
              <ul className="space-y-2">
                {bounty.requirements.map((req: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bounty Leaderboard */}
          {leaderboard && leaderboard.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Leaderboard</h3>
              <ul className="space-y-2">
                {leaderboard.map((entry: any) => (
                  <li key={entry.rank} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <p className="font-mono text-sm">{entry.address}</p>
                      <p className="text-xs text-muted-foreground">{entry.discount}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{entry.score}</p>
                      <p className="text-sm text-secondary">{entry.celo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={async () => {
              try {
                if (!(window as any).ethereum) return alert("Please connect your wallet to enter the bounty")
                await (window as any).ethereum.request?.({ method: "eth_requestAccounts" })
                const provider = new ethers.BrowserProvider((window as any).ethereum)
                const signer = await provider.getSigner()

                const entryFee = Number(bounty.entryFee || 0)
                const result = await registerForBountyOnChain(signer, bounty.code, bounty.linkedCourse || "", entryFee)

                // persist registration to server
                const body = {
                  txHash: result.txHash,
                  studentAddress: await signer.getAddress(),
                  amountPaid: result.amountPaid,
                  isEnrolled: result.isEnrolled,
                }

                const res = await fetch(`/api/bounties/${bounty.code}/register`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                })
                if (!res.ok) throw new Error("Server failed to save registration")

                alert("Successfully entered bounty — good luck!")

                // refresh bounty details
                const updated = await fetch(`/api/bounties/${bounty.code}`)
                if (updated.ok) {
                  const jd = await updated.json()
                  setBounty(jd.data)
                }
              } catch (err) {
                console.error("Error entering bounty:", err)
                alert("Failed to enter bounty: " + String(err))
              }
            }}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
          >
            Enter Bounty - {bounty.entryFee} CELO
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

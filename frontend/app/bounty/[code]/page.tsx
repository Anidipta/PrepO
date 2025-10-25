"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BountyPage() {
  const params = useParams()
  const router = useRouter()
  const [bounty, setBounty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        const response = await fetch(`/api/bounties/${params.code}`)
        if (response.ok) {
          const data = await response.json()
          setBounty(data.data)
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

          <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold">
            Enter Bounty - {bounty.entryFee} CELO
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

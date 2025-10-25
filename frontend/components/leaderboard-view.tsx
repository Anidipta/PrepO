"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LeaderboardEntry {
  rank: number
  address: string
  score: string
  celo: string
  discount: string
}

interface Leaderboard {
  title: string
  category: string
  entries: LeaderboardEntry[]
}

export default function LeaderboardView() {
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const response = await fetch("/api/leaderboards")
        if (!response.ok) throw new Error("Failed to fetch leaderboards")
        const data = await response.json()
        setLeaderboards(data)
      } catch (error) {
        console.error("[v0] Error fetching leaderboards:", error)
        setLeaderboards([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [])

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading leaderboards...</div>
  }

  return (
    <div className="space-y-6">
      {leaderboards.map((lb, idx) => (
        <Card key={idx} className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle>{lb.title}</CardTitle>
            <CardDescription>Top performers in {lb.category}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lb.entries.map((entry, entryIdx) => (
                <div
                  key={entryIdx}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-primary-foreground">
                      {entry.rank}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-foreground">{entry.address}</p>
                      <p className="text-xs text-muted-foreground">{entry.discount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{entry.score}</p>
                    <p className="text-sm text-secondary font-semibold">{entry.celo}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Leaderboard Info */}
      <Card className="glass-effect border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📊</div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">How Leaderboards Work</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Top 3 performers in each course automatically qualify for 50% bounty entry fee discount</li>
                <li>• Leaderboards are updated in real-time as quizzes are completed</li>
                <li>• Scores are calculated based on accuracy and completion time</li>
                <li>• Discounts apply to all active bounties linked to that course</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

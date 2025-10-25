"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Bounty {
  id: number
  title: string
  description: string
  mentor: string
  category: string
  difficulty: string
  status: string
  prizePool: number
  entryFee: number
  entries: number
  maxEntries: number
  topWinners: number
  deadline: string
  linkedCourse: string
  requirements: string[]
  image: string
}

interface BountyCardProps {
  bounty: Bounty
}

export default function BountyCard({ bounty }: BountyCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const difficultyColor = {
    Easy: "bg-green-500/20 text-green-400",
    Medium: "bg-yellow-500/20 text-yellow-400",
    Hard: "bg-red-500/20 text-red-400",
  }

  return (
    <>
      <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all overflow-hidden group cursor-pointer flex flex-col h-full">
        {/* Image */}
        <div className="relative h-40 overflow-hidden bg-muted">
          <img
            src={bounty.image || "/placeholder.svg"}
            alt={bounty.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${difficultyColor[bounty.difficulty as keyof typeof difficultyColor]}`}
            >
              {bounty.difficulty}
            </span>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-primary/80 text-primary-foreground ml-auto">
              {bounty.status}
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="pt-6 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">{bounty.title}</h3>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{bounty.description}</p>

          <p className="text-sm text-muted-foreground mb-4">by {bounty.mentor}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>💰</span>
              <span>{bounty.prizePool} CELO</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>📝</span>
              <span>
                {bounty.entries}/{bounty.maxEntries}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>🏆</span>
              <span>Top {bounty.topWinners}</span>
            </div>
            <div className="flex items-center gap-1 text-primary font-semibold">
              <span>⏰</span>
              <span>{bounty.deadline}</span>
            </div>
          </div>

          {/* Entry Fee */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Entry Fee</p>
            <p className="text-lg font-bold text-secondary">{bounty.entryFee} CELO</p>
          </div>

          {/* Button */}
          <Button
            onClick={() => setShowDetails(true)}
            className="w-full mt-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
          >
            View Details
          </Button>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-effect border-primary/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-foreground">{bounty.title}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground">{bounty.description}</p>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="text-2xl font-bold text-primary">{bounty.prizePool} CELO</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Fee</p>
                    <p className="text-2xl font-bold text-secondary">{bounty.entryFee} CELO</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="text-lg font-semibold text-foreground">{bounty.deadline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entries</p>
                    <p className="text-lg font-semibold text-foreground">
                      {bounty.entries}/{bounty.maxEntries}
                    </p>
                  </div>
                </div>

                {/* Linked Course */}
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-1">Linked Course</p>
                  <p className="font-semibold text-foreground">{bounty.linkedCourse}</p>
                  <p className="text-xs text-muted-foreground mt-2">Enrolled students get 50% discount on entry fee</p>
                </div>

                {/* Requirements */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Requirements</p>
                  <ul className="space-y-2">
                    {bounty.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground">
                        <span className="text-primary mt-1">✓</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Smart Contract Info */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔒</div>
                    <div>
                      <h4 className="font-semibold text-foreground">Smart Contract Escrow</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your prize pool will be secured in a smart contract escrow. Funds are automatically distributed
                        to winners when the bounty ends.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDetails(false)}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
                  >
                    Enter Bounty - {bounty.entryFee} CELO
                  </Button>
                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="outline"
                    className="border-secondary text-secondary hover:bg-secondary/10 py-6 text-base font-semibold bg-transparent"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Bounty {
  _id: string
  code: string
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
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)

  const difficultyColor = {
    Easy: "bg-green-500/20 text-green-400",
    Medium: "bg-yellow-500/20 text-yellow-400",
    Hard: "bg-red-500/20 text-red-400",
  }

  const handleViewDetails = () => {
    router.push(`/bounty/${bounty.code}`)
  }

  return (
    <>
      <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all overflow-hidden group cursor-pointer flex flex-col h-full">
        {/* Image */}
        <div className="relative h-40 overflow-hidden bg-muted">
          <img
            src={bounty.image || "/placeholder.svg?height=160&width=400&query=bounty"}
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
            onClick={handleViewDetails}
            className="w-full mt-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

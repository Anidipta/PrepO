"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BountyCard from "@/components/bounty-card"
import LeaderboardView from "@/components/leaderboard-view"

export default function BountyHub() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("Active")
  const [categoryFilter, setCategoryFilter] = useState("All")

  const stats = [
    { label: "Active Bounties", value: "4", icon: "🏆" },
    { label: "Total CELO Pool", value: "4,450", icon: "💰" },
    { label: "Active Participants", value: "183", icon: "👥" },
    { label: "My Entries", value: "1", icon: "📝" },
    { label: "Avg Days Left", value: "2.4", icon: "⏰" },
  ]

  const bounties = [
    {
      id: 1,
      title: "DeFi Protocol Analysis Challenge",
      description:
        "Analyze and present a comprehensive report on an emerging DeFi protocol. Focus on tokenomics, security, and market potential.",
      mentor: "Dr. Sarah Chen",
      category: "DeFi",
      difficulty: "Medium",
      status: "Active",
      prizePool: 500,
      entryFee: 0.5,
      entries: 23,
      maxEntries: 50,
      topWinners: 3,
      deadline: "2 days, 14 hours",
      linkedCourse: "DeFi Fundamentals on CELO",
      requirements: ["Complete DeFi Fundamentals course", "Submit detailed analysis report"],
      image: "https://images.unsplash.com/photo-1639762681033-6461efb0efa8?w=600&h=400&fit=crop",
    },
    {
      id: 2,
      title: "Smart Contract Audit Competition",
      description:
        "Find vulnerabilities in a deliberately flawed smart contract. Submit detailed audit report with recommendations.",
      mentor: "Alex Rodriguez",
      category: "Security",
      difficulty: "Hard",
      status: "Active",
      prizePool: 750,
      entryFee: 5.0,
      entries: 18,
      maxEntries: 30,
      topWinners: 5,
      deadline: "5 days, 8 hours",
      linkedCourse: "Smart Contract Security Auditing",
      requirements: ["Advanced Solidity knowledge", "Security audit experience"],
      image: "https://images.unsplash.com/photo-1526374965328-7f5ae4e8a83f?w=600&h=400&fit=crop",
    },
    {
      id: 3,
      title: "CELO dApp Building Contest",
      description:
        "Build an innovative dApp on CELO that solves a real-world problem. Judged on functionality, UX, and innovation.",
      mentor: "Jordan Lee",
      category: "Development",
      difficulty: "Hard",
      status: "Active",
      prizePool: 1000,
      entryFee: 10.0,
      entries: 41,
      maxEntries: 50,
      topWinners: 3,
      deadline: "8 days, 12 hours",
      linkedCourse: "CELO Ecosystem Deep Dive",
      requirements: ["Solidity/Web3 development skills", "Working dApp submission"],
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    },
    {
      id: 4,
      title: "Blockchain Research Paper",
      description:
        "Write an original research paper on blockchain scalability solutions. Must be 10+ pages with citations.",
      mentor: "Dr. James Park",
      category: "Research",
      difficulty: "Medium",
      status: "Upcoming",
      prizePool: 600,
      entryFee: 2.0,
      entries: 0,
      maxEntries: 25,
      topWinners: 2,
      deadline: "Starts in 3 days",
      linkedCourse: "Advanced Blockchain Architecture",
      requirements: ["Research writing skills", "Blockchain knowledge"],
      image: "https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=600&h=400&fit=crop",
    },
  ]

  const filteredBounties = bounties.filter((bounty) => {
    const statusMatch = statusFilter === "All" || bounty.status === statusFilter
    const categoryMatch = categoryFilter === "All" || bounty.category === categoryFilter
    return statusMatch && categoryMatch
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  <span className="gradient-text">Bounty</span> Hub
                </h1>
                <p className="text-muted-foreground mt-1">Compete for CELO rewards in skill-based challenges</p>
              </div>
              <Button
                onClick={() => router.push("/mentee-dashboard")}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10 px-6 py-2 rounded-lg bg-transparent"
              >
                ← Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="glass-effect border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <div className="text-3xl">{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="glass-effect border-primary/20 mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Status</label>
                  <div className="flex gap-2">
                    {["Active", "Upcoming", "Completed", "All"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          statusFilter === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="All">All Categories</option>
                    <option value="DeFi">DeFi</option>
                    <option value="Security">Security</option>
                    <option value="Development">Development</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search bounties..."
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="bounties" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/50">
              <TabsTrigger value="bounties">Active Bounties</TabsTrigger>
              <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
            </TabsList>

            {/* Bounties Tab */}
            <TabsContent value="bounties" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredBounties.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>

              {filteredBounties.length === 0 && (
                <Card className="glass-effect border-primary/20 text-center py-12">
                  <CardContent>
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No bounties found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Leaderboards Tab */}
            <TabsContent value="leaderboards" className="mt-6">
              <LeaderboardView />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

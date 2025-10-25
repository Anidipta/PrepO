"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BountyCard from "@/components/bounty-card"
import LeaderboardView from "@/components/leaderboard-view"

export default function BountyHub() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [bounties, setBounties] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/bounties`)
        const json = await res.json()
        if (json?.success) {
          setBounties(json.data || [])
          const activeBounties = (json.data || []).filter((b: any) => b.status === "Active")
          const totalPool = (json.data || []).reduce((sum: number, b: any) => sum + (b.prizePool || 0), 0)
          setStats([
            { label: "Active Bounties", value: activeBounties.length, icon: "🏆" },
            { label: "Total CELO Pool", value: totalPool.toLocaleString(), icon: "💰" },
            {
              label: "Active Participants",
              value: (json.data || []).reduce((sum: number, b: any) => sum + (b.entries || 0), 0),
              icon: "👥",
            },
            { label: "My Entries", value: "0", icon: "📝" },
          ])
        }
      } catch (err) {
        console.error("Failed to fetch bounties", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredBounties = bounties.filter((bounty) => {
    const statusMatch = statusFilter === "All" || bounty.status === statusFilter
    const categoryMatch = categoryFilter === "All" || bounty.category === categoryFilter
    const searchMatch =
      searchQuery === "" ||
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchQuery.toLowerCase())
    return statusMatch && categoryMatch && searchMatch
  })

  return (
     <div className="min-h-screen relative bg-background overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50 animate-[loop_60s_linear_infinite]"
        style={{
          backgroundImage: "url('/s0.gif')",
          backgroundRepeat: "repeat",
          zIndex: 0,
        }}
      ></div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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
          <Card className="glass-effect border-primary/20 mb-5">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  <BountyCard key={bounty.code || bounty._id} bounty={bounty} />
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useBalance, useDisconnect } from "wagmi"
import { celoSepolia } from "wagmi/chains"
import CreateCourseModal from "@/components/create-course-modal"
import CreateBountyModal from "@/components/create-bounty-modal"
import LeaderboardView from "@/components/leaderboard-view"
import TargetCursor from "@/components/TargetCursor"

export default function MentorDashboard() {
  const router = useRouter()
  const { address } = useAccount()
  const { data: balanceData } = useBalance({ address: (address as `0x${string}`) || undefined, chainId: celoSepolia.id, watch: true })
  const { disconnect } = useDisconnect()
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showCreateBounty, setShowCreateBounty] = useState(false)
  const [userName, setUserName] = useState<string | null>(typeof window !== "undefined" ? localStorage.getItem("userName") : null)
  const [coursesCount, setCoursesCount] = useState<number>(0)
  const [bountiesCount, setBountiesCount] = useState<number>(0)

  const stats = [
    { label: "Courses Created", value: String(coursesCount || 0), icon: "📚" },
    { label: "Bounties Active", value: String(bountiesCount || 0), icon: "🏆" },
    { label: "Total CELO Earned", value: balanceData?.formatted ? parseFloat(balanceData.formatted).toFixed(3) : "0.000", icon: "💰" },
    { label: "Top Mentees", value: "--", icon: "👥" },
  ]

  const recentCourses = [
    {
      title: "DeFi Fundamentals",
      enrollments: 89,
      avgScore: "87.5%",
      reward: "5.0 CELO",
    },
    {
      title: "Smart Contract Security",
      enrollments: 67,
      avgScore: "92.3%",
      reward: "12.5 CELO",
    },
    {
      title: "CELO Ecosystem Deep Dive",
      enrollments: 134,
      avgScore: "85.7%",
      reward: "25.0 CELO",
    },
  ]

  const activeBounties = [
    {
      title: "DeFi Protocol Analysis Challenge",
      entries: 23,
      prizePool: 500,
      status: "Active",
      endsIn: "2 days",
    },
    {
      title: "Smart Contract Audit Competition",
      entries: 18,
      prizePool: 750,
      status: "Active",
      endsIn: "5 days",
    },
    {
      title: "CELO dApp Building Contest",
      entries: 41,
      prizePool: 1000,
      status: "Active",
      endsIn: "8 days",
    },
  ]

  useEffect(() => {
    if (!address) return
    ;(async () => {
      try {
        // save wallet address for faster access
        try {
          localStorage.setItem("walletAddress", address)
        } catch (e) {
          /* ignore storage errors */
        }

        const res = await fetch(`/api/user/${address}`)
        const json = await res.json()
        if (json?.found && json.user?.name) {
          setUserName(json.user.name)
          try { localStorage.setItem("userName", json.user.name) } catch (e) {}
        }

        try {
          const coursesRes = await fetch(`/api/courses`)
          if (coursesRes.ok) {
            const coursesJson = await coursesRes.json()
            setCoursesCount(Array.isArray(coursesJson) ? coursesJson.length : (coursesJson.count ?? 0))
          }
        } catch (e) {
          console.warn("Failed to fetch courses count", e)
        }

        try {
          const bountiesRes = await fetch(`/api/bounties`)
          if (bountiesRes.ok) {
            const bountiesJson = await bountiesRes.json()
            setBountiesCount(Array.isArray(bountiesJson) ? bountiesJson.length : (bountiesJson.count ?? 0))
          }
        } catch (e) {
          console.warn("Failed to fetch bounties count", e)
        }
      } catch (err) {
        console.error("Failed to fetch user", err)
      }
    })()
  }, [address])

  return (
  <div className="min-h-screen">
    <div
      style={{
        background: "linear-gradient(135deg, #faccbc 0%, #2b2f21ff 100%)",
        borderRadius: 12,
        position: "relative", 
        overflow: "hidden",
      }}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: "url('/s0.gif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
          zIndex: 0,
        }}
      ></div>

      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1, // keep content above the gif
          
        }}
        className="min-h-screen-full"
      >

          <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="/placeholder-user.jpg" alt="avatar" className="w-20 h-20 rounded-md" />
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      Mentor <span className="gradient-text">Dashboard</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Welcome back, {userName || "Mentor"}</p>
                  </div>
                </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Wallet</div>
                  <div className="text-2xl font-bold text-primary">
                    {address ? `${address.slice(0, 5)}...${address.slice(-2)}` : "-"}
                  </div>
                  <div className="text-lg font-semibold text-secondary">
                    {balanceData?.formatted ? `${parseFloat(balanceData.formatted).toFixed(3)}` : "0.000"} CELO
                  </div>
                </div>
                <Button
                  onClick={() => {
                    disconnect()
                    router.push("/")
                  }}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-2 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="glass-effect border-primary/20 hover:border-primary/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <div className="text-4xl">{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="glass-effect border-primary/20 mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowCreateCourse(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold rounded-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Course
                </Button>

                <Button
                  onClick={() => setShowCreateBounty(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold rounded-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Create Bounty
                </Button>

                <Button
                  onClick={() => router.push("/bounty-hub")}
                  variant="outline"
                  className="border-secondary text-secondary hover:bg-secondary/10 py-6 text-base font-semibold rounded-lg bg-transparent"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  View Leaderboards
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border/50">
              <TabsTrigger value="courses">Recent Course Activity</TabsTrigger>
              <TabsTrigger value="bounties">Active Bounties</TabsTrigger>
              <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="mt-6">
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle>Recent Course Activity</CardTitle>
                  <CardDescription>Your most active courses and their performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentCourses.map((course, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-semibold text-foreground">{course.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.enrollments} enrollments • Avg: {course.avgScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{course.reward}</p>
                          <p className="text-xs text-muted-foreground">per completion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bounties Tab */}
            <TabsContent value="bounties" className="mt-6">
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle>Active Bounties</CardTitle>
                  <CardDescription>Your currently running bounty competitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeBounties.map((bounty, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-semibold text-foreground">{bounty.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bounty.entries} entries • Prize Pool: {bounty.prizePool} CELO
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-secondary">{bounty.status}</p>
                          <p className="text-xs text-muted-foreground">Ends in {bounty.endsIn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboards" className="mt-6">
              <LeaderboardView />
            </TabsContent>
          </Tabs>
          <TargetCursor />
        </main>
          </div>
        </div>

      {/* Modals */}
      {showCreateCourse && <CreateCourseModal onClose={() => setShowCreateCourse(false)} />}
      {showCreateBounty && <CreateBountyModal onClose={() => setShowCreateBounty(false)} />}
    </div>

  </div>
  )
}

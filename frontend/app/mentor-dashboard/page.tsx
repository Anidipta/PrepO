"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/components/wallet-provider"
import CreateCourseModal from "@/components/create-course-modal"
import CreateBountyModal from "@/components/create-bounty-modal"
import LeaderboardView from "@/components/leaderboard-view"

export default function MentorDashboard() {
  const router = useRouter()
  const { disconnectWallet } = useWallet()
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showCreateBounty, setShowCreateBounty] = useState(false)

  const stats = [
    { label: "Courses Created", value: "12", icon: "📚" },
    { label: "Bounties Active", value: "8", icon: "🏆" },
    { label: "Total CELO Earned", value: "2,847.50", icon: "💰" },
    { label: "Top Mentees", value: "156", icon: "👥" },
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
                  Mentor <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground mt-1">Welcome back, Dr. Sarah Chen</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Wallet Balance</div>
                  <div className="text-2xl font-bold text-primary">0xAb12...Ff34</div>
                  <div className="text-lg font-semibold text-secondary">2,847.50 CELO</div>
                </div>
                <Button
                  onClick={() => disconnectWallet()}
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
        </main>
      </div>

      {/* Modals */}
      {showCreateCourse && <CreateCourseModal onClose={() => setShowCreateCourse(false)} />}
      {showCreateBounty && <CreateBountyModal onClose={() => setShowCreateBounty(false)} />}
    </div>
  )
}

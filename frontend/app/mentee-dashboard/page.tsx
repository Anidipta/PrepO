"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useBalance, useDisconnect } from "wagmi"
import { celoSepolia } from "wagmi/chains"
import QuizInterface from "@/components/quiz-interface"
import RecentActivities from "@/components/recent-activities"

export default function MenteeDashboard() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { data: balanceData } = useBalance({ address: (address as `0x${string}`) || undefined, chainId: celoSepolia.id })
  const { disconnect } = useDisconnect()
  const [showQuizUpload, setShowQuizUpload] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [userName, setUserName] = useState<string | null>(null)
  const [coursesCount, setCoursesCount] = useState<number>(0)
  const [bountiesCount, setBountiesCount] = useState<number>(0)
  const [quizzesCompleted, setQuizzesCompleted] = useState<number>(0)

  const stats = [
    { label: "Courses Joined", value: `${coursesCount}`, icon: "📚" },
    { label: "Quizzes Completed", value: `${quizzesCompleted}`, icon: "✓" },
    { label: "CELO Earned", value: balanceData?.formatted ? parseFloat(balanceData.formatted).toFixed(3) : "0.000", icon: "💰" },
    { label: "Available Bounties", value: `${bountiesCount}`, icon: "🏆" },
  ]

  useEffect(() => {
    if (!address) return
    (async () => {
      try {
        const res = await fetch(`/api/user/${address}`)
        const json = await res.json()
        if (json?.found && json.user?.name) {
          setUserName(json.user.name)
          localStorage.setItem("userName", json.user.name)
        }
      } catch (err) {
        console.error("Failed to fetch user", err)
      }
    })()
  }, [address])

  useEffect(() => {
    // fetch counts for courses and bounties
    const run = async () => {
      try {
        const [cRes, bRes] = await Promise.all([fetch(`/api/courses`), fetch(`/api/bounties`)])
        const cJson = await cRes.json()
        const bJson = await bRes.json()
        const courses = Array.isArray(cJson?.data) ? cJson.data : []
        const bounties = Array.isArray(bJson?.data) ? bJson.data : []
        setCoursesCount(courses.length)
        setBountiesCount(bounties.length)
      } catch (e) {
        console.error("Failed to fetch counts", e)
      }
    }

    run()
  }, [])

  return (
  <div className="min-h-screen">
    <div
      style={{
        background: "linear-gradient(135deg, #faccbc 0%, #fec1cf 100%)",
        borderRadius: 12,
        position: "relative", // enable positioning for child layers
        overflow: "hidden",
      }}
    >
      {/* 🔥 Infinite background GIF layer */}
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
        className="min-h-screen"
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
                        Hi <span className="gradient-text">{userName || "Learner"}</span>
                      </h1>
                      <p className="text-muted-foreground mt-1">Ready to learn and earn today?</p>
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
                      onClick={() => setShowQuizUpload(true)}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold rounded-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload PDF
                    </Button>

                    <Button
                      onClick={() => router.push("/explore-courses")}
                      variant="outline"
                      className="border-secondary text-secondary hover:bg-secondary/10 py-6 text-base font-semibold rounded-lg bg-transparent"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Explore Courses
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      View Bounties
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs Section */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/50">
                  <TabsTrigger value="overview">Recent Activities</TabsTrigger>
                  <TabsTrigger value="progress">Learning Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <RecentActivities />
                </TabsContent>

                <TabsContent value="progress" className="mt-6">
                  <Card className="glass-effect border-primary/20">
                    <CardHeader>
                      <CardTitle>Learning Progress</CardTitle>
                      <CardDescription>Your overall learning metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">Overall Progress</span>
                          <span className="text-sm font-bold text-primary">67%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: "67%" }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">Quiz Accuracy</span>
                          <span className="text-sm font-bold text-secondary">87.5%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: "87.5%" }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">Course Completion</span>
                          <span className="text-sm font-bold text-primary">5/8</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: "62.5%" }}></div>
                        </div>
                      </div>

                      <Card className="glass-effect border-primary/20 bg-primary/5 mt-6">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="text-3xl">🎯</div>
                            <div>
                              <h4 className="font-semibold text-foreground">Next Milestone</h4>
                              <p className="text-sm text-muted-foreground mt-1">Complete 2 more courses to unlock Premium Bounties</p>
                              <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: "60%" }}></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Quiz Upload Modal */}
              {showQuizUpload && (
                <QuizInterface
                  onClose={() => setShowQuizUpload(false)}
                  onComplete={() => setQuizzesCompleted((n) => n + 1)}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
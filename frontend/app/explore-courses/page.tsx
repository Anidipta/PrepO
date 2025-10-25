"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import CourseCard from "@/components/course-card"

export default function ExploreCourses() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [sortBy, setSortBy] = useState("Popular")
  const [viewMode, setViewMode] = useState<"all" | "enrolled">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const categories = ["All", "DeFi", "Smart Contracts", "Blockchain", "Web3"]
  const levels = ["All", "Beginner", "Intermediate", "Advanced"]
  const sortOptions = ["Popular", "Newest", "Highest Rated", "Most Enrolled"]

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/courses`)
        const json = await res.json()
        if (json?.success) {
          setCourses(json.data || [])
          const enrolledCount = (json.data || []).filter((c: any) => c.enrolled).length
          const avgRating =
            (json.data || []).length > 0
              ? (
                  (json.data || []).reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / (json.data || []).length
                ).toFixed(1)
              : "0"
          setStats([
            { label: "Total Courses", value: (json.data || []).length, icon: "📚" },
            { label: "My Enrollments", value: enrolledCount, icon: "👤" },
            {
              label: "Total XP Available",
              value: (json.data || []).reduce((sum: number, c: any) => sum + (c.xpReward || 0), 0),
              icon: "🏆",
            },
            { label: "Avg Course Rating", value: avgRating, icon: "⭐" },
          ])
        }
      } catch (err) {
        console.error("Failed to fetch courses", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredCourses = courses
    .filter((course) => {
      const categoryMatch = selectedCategory === "All" || course.category === selectedCategory
      const levelMatch = selectedLevel === "All" || course.level === selectedLevel
      const viewMatch = viewMode === "all" || course.enrolled
      const searchMatch = searchQuery === "" || course.title.toLowerCase().includes(searchQuery.toLowerCase())
      return categoryMatch && levelMatch && viewMatch && searchMatch
    })
    .sort((a, b) => {
      if (sortBy === "Newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      if (sortBy === "Highest Rated") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "Most Enrolled") return (b.enrolled ? 1 : 0) - (a.enrolled ? 1 : 0)
      return 0 // Popular (default)
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
                  <span className="gradient-text">Explore</span> Courses
                </h1>
                <p className="text-muted-foreground mt-1">Discover AI-powered learning experiences on CELO</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="glass-effect border-primary/20">
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

          {/* Filters */}
          <Card className="glass-effect border-primary/20 mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">View</label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as "all" | "enrolled")}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Courses</option>
                    <option value="enrolled">My Enrolled Courses</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.code || course._id}
                course={{ ...course, image: course.image || "/placeholder-logo.png" }}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card className="glass-effect border-primary/20 text-center py-12">
              <CardContent>
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No courses found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to find more courses</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
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

  const categories = ["All", "DeFi", "Smart Contracts", "Blockchain", "Web3"]
  const levels = ["All", "Beginner", "Intermediate", "Advanced"]
  const sortOptions = ["Popular", "Newest", "Highest Rated", "Most Enrolled"]

  const courses = [
    {
      id: 1,
      title: "DeFi Fundamentals on CELO",
      mentor: "Dr. Sarah Chen",
      category: "DeFi",
      level: "Beginner",
      duration: "5 days",
      lessons: 18,
      xpReward: 650,
      fee: 5.0,
      rating: 4.7,
      enrolled: true,
      progress: 75,
      image: "https://images.unsplash.com/photo-1639762681033-6461efb0efa8?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "CELO Ecosystem Deep Dive",
      mentor: "Maria Santos",
      category: "Blockchain",
      level: "Intermediate",
      duration: "10 days",
      lessons: 30,
      xpReward: 1200,
      fee: 8.0,
      rating: 4.5,
      enrolled: true,
      progress: 45,
      image: "https://images.unsplash.com/photo-1526374965328-7f5ae4e8a83f?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Solidity Development Masterclass",
      mentor: "Alex Rodriguez",
      category: "Smart Contracts",
      level: "Intermediate",
      duration: "10 days",
      lessons: 18,
      xpReward: 1500,
      fee: 12.0,
      rating: 4.8,
      enrolled: false,
      progress: 0,
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      title: "Mobile DeFi UX Design",
      mentor: "Jordan Lee",
      category: "Web3",
      level: "Beginner",
      duration: "5 days",
      lessons: 10,
      xpReward: 800,
      fee: 6.0,
      rating: 4.6,
      enrolled: false,
      progress: 0,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    },
    {
      id: 5,
      title: "Advanced Smart Contract Security",
      mentor: "Dr. James Park",
      category: "Smart Contracts",
      level: "Advanced",
      duration: "10 days",
      lessons: 25,
      xpReward: 2000,
      fee: 15.0,
      rating: 4.9,
      enrolled: false,
      progress: 0,
      image: "https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=400&h=300&fit=crop",
    },
    {
      id: 6,
      title: "Blockchain Basics for Beginners",
      mentor: "Emma Wilson",
      category: "Blockchain",
      level: "Beginner",
      duration: "1 day",
      lessons: 8,
      xpReward: 400,
      fee: 2.5,
      rating: 4.4,
      enrolled: false,
      progress: 0,
      image: "https://images.unsplash.com/photo-1518611505868-48510c2e2b3d?w=400&h=300&fit=crop",
    },
  ]

  const filteredCourses = courses.filter((course) => {
    const categoryMatch = selectedCategory === "All" || course.category === selectedCategory
    const levelMatch = selectedLevel === "All" || course.level === selectedLevel
    const viewMatch = viewMode === "all" || course.enrolled
    return categoryMatch && levelMatch && viewMatch
  })

  const stats = [
    { label: "Total Courses", value: "8", icon: "📚" },
    { label: "My Enrollments", value: "2", icon: "👤" },
    { label: "Total XP Available", value: "650", icon: "🏆" },
    { label: "Avg Course Rating", value: "4.7", icon: "⭐" },
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
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
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

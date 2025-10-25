"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Circle, Lock } from "lucide-react"

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [mentor, setMentor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState<any>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.code}`)
        if (response.ok) {
          const data = await response.json()
          setCourse(data.data)
          // fetch mentor/user info if available
          const mentorAddr = data.data?.mentorAddress
          if (mentorAddr) {
            try {
              const mres = await fetch(`/api/user/${mentorAddr}`)
              if (mres.ok) {
                const mjson = await mres.json()
                if (mjson?.found && mjson.user) setMentor(mjson.user)
              }
            } catch (e) {
              console.warn("Failed to fetch mentor info", e)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching course:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.code) fetchCourse()
  }, [params.code])

  const modules = course?.modules || [
    {
      id: 1,
      title: "Introduction & Fundamentals",
      lessons: [
        { id: "L1", title: "Course Overview", duration: "15 min", status: "completed" },
        { id: "L2", title: "Getting Started", duration: "20 min", status: "in-progress" },
        { id: "L3", title: "Basic Concepts", duration: "25 min", status: "pending" },
      ],
    },
    {
      id: 2,
      title: "Core Concepts",
      lessons: [
        { id: "L4", title: "Deep Dive Part 1", duration: "30 min", status: "pending" },
        { id: "L5", title: "Deep Dive Part 2", duration: "35 min", status: "pending" },
        { id: "L6", title: "Practice Exercises", duration: "40 min", status: "pending" },
      ],
    },
    {
      id: 3,
      title: "Advanced Topics",
      lessons: [
        { id: "L7", title: "Advanced Techniques", duration: "45 min", status: "pending" },
        { id: "L8", title: "Real-world Applications", duration: "50 min", status: "pending" },
        { id: "L9", title: "Final Project", duration: "60 min", status: "pending" },
      ],
    },
  ]

  const completedLessons = modules.flatMap((m: any) => m.lessons.filter((l: any) => l.status === "completed")).length
  const totalLessons = modules.flatMap((m: any) => m.lessons).length
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        Back
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Course Header */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{course.title}</CardTitle>
                <p className="text-muted-foreground mt-2">Code: {course.code}</p>
                {mentor ? (
                  <p className="text-sm text-muted-foreground mt-1">Owner: {mentor.name || mentor.address}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Owner: {course.mentorAddress || "—"}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold text-primary">{progressPercentage}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{course.description}</p>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-semibold text-foreground">{course.category}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="font-semibold text-foreground">{course.level}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">{course.duration}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Fee</p>
                <p className="font-semibold text-primary">{course.fee} CELO</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Enrollments</p>
                <p className="font-semibold text-foreground">{course.enrollments || 0}</p>
              </div>
            </div>
            {course.files && course.files.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-foreground mb-2">Course Files</h4>
                <ul className="space-y-2">
                  {course.files.map((f: string, idx: number) => (
                    <li key={idx}>
                      <a href={f} target="_blank" rel="noreferrer" className="text-primary underline">
                        Download {f.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Content Tabs */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="modules">Course Content</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            {modules.map((module: any, idx: number) => (
              <Card key={module.id} className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Module {idx + 1}: {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {module.lessons.map((lesson: any) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      {lesson.status === "completed" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {lesson.status === "in-progress" && (
                        <Circle className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                      )}
                      {lesson.status === "pending" && <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary capitalize">
                        {lesson.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card className="glass-effect border-primary/20">
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">About This Course</h4>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What You'll Learn</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Master the fundamentals and core concepts</li>
                    <li>✓ Apply advanced techniques in real-world scenarios</li>
                    <li>✓ Complete hands-on projects and exercises</li>
                    <li>✓ Earn a certificate upon completion</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enroll Button */}
        {!enrolled && (
          <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold">
            Enroll Now - {course.fee} CELO
          </Button>
        )}
      </div>
    </div>
  )
}

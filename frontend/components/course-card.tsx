"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Course {
  _id: string
  code: string
  title: string
  mentor: string
  category: string
  level: string
  duration: string
  lessons: number
  xpReward: number
  fee: number
  rating: number
  enrolled: boolean
  progress: number
  image: string
}

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)

  const handleViewDetails = () => {
    router.push(`/course/${course.code}`)
  }

  return (
    <>
      <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all overflow-hidden group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={course.image || "/placeholder.svg?height=192&width=400&query=course"}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>

          {/* Badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/80 text-primary-foreground">
              {course.level}
            </span>
          </div>

          {/* Progress Bar (if enrolled) */}
          {course.enrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="pt-6 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">{course.title}</h3>

          <p className="text-sm text-muted-foreground mb-4">by {course.mentor}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>📚</span>
              <span>{course.lessons} lessons</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>⏱️</span>
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>⭐</span>
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-primary font-semibold">
              <span>🏆</span>
              <span>{course.xpReward} XP</span>
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {course.enrolled && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-foreground">Progress</span>
                <span className="text-xs text-primary font-bold">{course.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Button */}
          <Button
            onClick={handleViewDetails}
            className={`w-full mt-auto ${
              course.enrolled
                ? "bg-secondary/20 text-secondary hover:bg-secondary/30"
                : "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
            }`}
          >
            {course.enrolled ? "Continue Learning" : `Enroll - ${course.fee} CELO`}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

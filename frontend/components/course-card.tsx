"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Course {
  id: number
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
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all overflow-hidden group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={course.image || "/placeholder.svg"}
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
            onClick={() => setShowDetails(true)}
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

      {/* Course Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-effect border-primary/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-foreground">{course.title}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Mentor</p>
                  <p className="text-lg font-semibold text-foreground">{course.mentor}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="text-lg font-semibold text-foreground">{course.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold text-foreground">{course.duration}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Course Description</p>
                  <p className="text-foreground">
                    Learn the fundamentals of {course.category} with hands-on projects and real-world examples. This
                    comprehensive course covers everything you need to know to get started.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{course.lessons}</p>
                    <p className="text-xs text-muted-foreground">Lessons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">{course.xpReward}</p>
                    <p className="text-xs text-muted-foreground">XP Reward</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{course.rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowDetails(false)}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
              >
                {course.enrolled ? "Continue Learning" : `Enroll Now - ${course.fee} CELO`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

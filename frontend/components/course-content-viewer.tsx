"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight } from "lucide-react"

interface Lesson {
  id: string
  title: string
  duration: string
  status: "completed" | "in-progress" | "pending"
  content?: string
}

interface Module {
  id: number
  title: string
  lessons: Lesson[]
}

interface CourseContentViewerProps {
  modules: Module[]
  onLessonComplete?: (lessonId: string) => void
}

export default function CourseContentViewer({ modules, onLessonComplete }: CourseContentViewerProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Modules List */}
      <div className="lg:col-span-1 space-y-3">
        {modules.map((module) => (
          <Card key={module.id} className="glass-effect border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    selectedLesson?.id === lesson.id ? "bg-primary/20 border border-primary" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {lesson.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <span className="text-xs font-medium truncate">{lesson.title}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lesson Viewer */}
      <div className="lg:col-span-2">
        {selectedLesson ? (
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle>{selectedLesson.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{selectedLesson.duration}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Lesson content will be displayed here</p>
              </div>
              {selectedLesson.status !== "completed" && (
                <Button
                  onClick={() => onLessonComplete?.(selectedLesson.id)}
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                >
                  Mark as Complete <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-effect border-primary/20">
            <CardContent className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QuizInterfaceProps {
  onClose: () => void
}

export default function QuizInterface({ onClose }: QuizInterfaceProps) {
  const [stage, setStage] = useState<"upload" | "preview" | "confirmation">("upload")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{ summary?: string; bullets?: string[]; quiz?: any } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // store file in state for upload
      ;(window as any)._queuedQuizFile = file
    }
  }

  const handleGenerateQuiz = async () => {
    if (!fileName) return

    setLoading(true)
    try {
      const file = (window as any)._queuedQuizFile as File | undefined
      if (!file) throw new Error("No file queued")

      const form = new FormData()
      form.append("file", file)
      // include address if available
      const savedAddress = localStorage.getItem("walletAddress") || ""
      form.append("address", savedAddress)

      const res = await fetch(`/api/ai/process-pdf`, {
        method: "POST",
        body: form,
      })

      const json = await res.json()
      if (!res.ok) {
        console.error("AI process failed:", json)
        throw new Error(json.error || "AI failed")
      }

      setAnalysis(json.data || null)
      setStage("preview")
    } catch (error) {
      console.error("[v1] Error generating quiz:", error)
      alert("Failed to generate quiz - ensure AI_API_URL and AI_API_KEY are configured on the server.")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      // Simulate publishing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStage("confirmation")
    } catch (error) {
      console.error("[v0] Error publishing quiz:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload PDF & Generate Quiz</DialogTitle>
        </DialogHeader>

        {stage === "upload" && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-4">Upload Course PDF</label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="pdf-upload" />
                <label htmlFor="pdf-upload" className="cursor-pointer block">
                  <div className="text-5xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Click to upload PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    {fileName
                      ? `Selected: ${fileName}`
                      : "AI will analyze your content and generate quiz questions automatically"}
                  </p>
                </label>
              </div>
            </div>

            <Card className="glass-effect border-primary/20 bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">AI-Assisted Quiz Creation</h4>
                    <p className="text-sm text-muted-foreground">
                      After uploading your PDF, our AI will automatically generate quiz questions. You can review, edit,
                      and add your own questions before publishing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10 py-6 text-base font-semibold bg-transparent flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateQuiz}
                disabled={!fileName || loading}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
              >
                {loading ? "Generating..." : "Generate Quiz"}
              </Button>
            </div>
          </div>
        )}

        {stage === "preview" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Quiz Preview</h3>
            <Card className="glass-effect border-primary/20">
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
                <CardDescription>Short notes generated from the uploaded PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis ? (
                  <div>
                    <div className="prose max-w-none text-foreground">
                      <p>{analysis.summary}</p>
                    </div>
                    <ul className="list-disc ml-6 mt-4 text-foreground">
                      {(analysis.bullets || []).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No analysis available</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-effect border-primary/20">
              <CardHeader>
                <CardTitle>Generated Quiz</CardTitle>
                <CardDescription>Review and edit before publishing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis && analysis.quiz ? (
                  <div>
                    {(analysis.quiz.questions || []).map((q: any, idx: number) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg mb-3">
                        <p className="font-semibold text-foreground mb-2">{q.prompt}</p>
                        <div className="space-y-2">
                          {(q.options || []).map((opt: string, oi: number) => (
                            <label key={oi} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                              <input type="radio" name={`q${idx}`} className="w-4 h-4" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No quiz generated</p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => setStage("upload")}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10 py-6 text-base font-semibold bg-transparent flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
              >
                {loading ? "Publishing..." : "Publish Quiz"}
              </Button>
            </div>
          </div>
        )}

        {stage === "confirmation" && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold gradient-text">Quiz Published!</h3>
            <p className="text-muted-foreground">
              Your quiz has been successfully created and published. Students can now take it and earn XP rewards.
            </p>

            <Card className="glass-effect border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="text-2xl font-bold text-primary">3</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">XP Reward</p>
                    <p className="text-2xl font-bold text-secondary">50 XP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

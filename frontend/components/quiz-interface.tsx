"use client"

import type React from "react"

import { useState } from "react"
import { ethers } from "ethers"
import { PLATFORM_OWNER } from "@/lib/smart-contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QuizInterfaceProps {
  onClose: () => void
  onComplete?: (result: { correct: number; incorrect: number; total: number }) => void
}

export default function QuizInterface({ onClose }: QuizInterfaceProps) {
  const [stage, setStage] = useState<"upload" | "preview" | "confirmation">("upload")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{ summary?: string; bullets?: string[]; quiz?: any } | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<{ correct: number; incorrect: number; total: number } | null>(null)

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
      // initialize answers array for interactivity
      const qcount = (json.data?.quiz?.questions || []).length
      setAnswers(new Array(qcount).fill(-1))
      setStage("preview")
    } catch (error) {
      console.error("[v1] Error generating quiz:", error)
      console.error("AI generation failed, falling back to sample quiz")
      // If AI fails, load a fallback quiz (provided by user) so mentee can still take the quiz
      const fallback = [
        {
          question: "What is the name of the company that presented Drivelink?",
          options: ["A) Drivelink Ltd.", "B) ApnaDriver", "C) InstaDrive Secure", "D) Kolkata Cabs"],
          answer: "B) ApnaDriver",
        },
        {
          question: "In which city is Drivelink launching its service first?",
          options: ["A) Mumbai", "B) Delhi", "C) Bangalore", "D) Kolkata"],
          answer: "D) Kolkata",
        },
        {
          question: "What is the primary problem Drivelink aims to solve?",
          options: [
            "A) The high cost of buying a new car.",
            "B) The frustration of finding a verified driver for one's *own* car.",
            "C) The lack of ride-hailing apps like Uber.",
            "D) The high commission rates for taxi drivers.",
          ],
          answer: "B) The frustration of finding a verified driver for one's *own* car.",
        },
        {
          question: "How can users book a driver through Drivelink?",
          options: ["A) Only via a mobile app", "B) Only by calling a hotline", "C) Through the app or by sending a WhatsApp message", "D) By visiting an offline agency"],
          answer: "C) Through the app or by sending a WhatsApp message",
        },
        {
          question: "According to the business model, what is the planned monthly subscription fee for high-volume drivers?",
          options: ["A) ₹199/month", "B) ₹299/month", "C) ₹499/month", "D) ₹799/month"],
          answer: "C) ₹499/month",
        },
        {
          question: "What is Drivelink's funding ask?",
          options: ["A) ₹20 Lakhs for 35% equity", "B) ₹35 Lakhs for 20% equity", "C) ₹50 Lakhs for 10% equity", "D) ₹1 Crore for 15% equity"],
          answer: "B) ₹35 Lakhs for 20% equity",
        },
        {
          question: "What is a key unique feature Drivelink offers compared to Ola/Uber?",
          options: ["A) It allows users to hire a driver for their *own* vehicle.", "B) It has a mobile app.", "C) It offers instant booking.", "D) It is available in Kolkata."],
          answer: "A) It allows users to hire a driver for their *own* vehicle.",
        },
        {
          question: "What goal does Drivelink aim to achieve in Phase 2 (6-18 months) of its GTM strategy?",
          options: ["A) Launch the app beta", "B) Achieve 100+ daily bookings in Kolkata", "C) Expand to all major Indian cities", "D) Achieve profitability"],
          answer: "B) Achieve 100+ daily bookings in Kolkata",
        },
        {
          question: "How many freelance drivers were onboarded for the MVP pilot as part of 'Key Early Wins'?",
          options: ["A) 10", "B) 20", "C) 50", "D) 100"],
          answer: "B) 20",
        },
        {
          question: "What is the projected timeframe to reach profitability?",
          options: ["A) 6-12 months", "B) 12-18 months", "C) 18-24 months post-launch", "D) 36 months"],
          answer: "C) 18-24 months post-launch",
        },
      ]

      // normalize fallback into analysis format
      const normalized = {
        summary: "Fallback quiz loaded — AI analysis not available.",
        bullets: [],
        quiz: { questions: fallback.map((q: any) => ({ prompt: q.question, options: q.options, correct: q.answer })) },
      }

      setAnalysis(normalized)
      setAnswers(new Array(normalized.quiz.questions.length).fill(-1))
      setStage("preview")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      const questions = (analysis?.quiz?.questions || []) as any[]
      let correct = 0
      let incorrect = 0
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const selected = answers[i]
        if (selected == null || selected < 0) {
          incorrect++
          continue
        }

        // Determine correct index
        let correctIndex = -1
        if (typeof q.correct === "number") correctIndex = q.correct
        else if (typeof q.correct === "string") correctIndex = (q.options || []).findIndex((o: string) => o.trim() === q.correct.trim())
        else if (typeof q.correct_answer === "number") correctIndex = q.correct_answer
        else if (typeof q.correct_answer === "string") correctIndex = (q.options || []).findIndex((o: string) => o.trim() === q.correct_answer.trim())

        if (selected === correctIndex) correct++
        else incorrect++
      }

      const rewardPer = 0.02
      const total = Number(((correct - incorrect) * rewardPer).toFixed(6))

      const savedAddress = localStorage.getItem("walletAddress") || ""
      const proceed = window.confirm(
        `You answered ${questions.length} questions. Correct: ${correct}, Incorrect: ${incorrect}.\nTotal change: ${total} CELO (each correct +0.02, wrong -0.02).\nClick OK to proceed.`
      )
      if (!proceed) return

      // If total < 0: mentee must pay owner -> open MetaMask to send CELO to owner
      if (total < 0) {
        try {
          if (!(window as any).ethereum) throw new Error("No web3 wallet detected")
          const provider = new ethers.BrowserProvider((window as any).ethereum)
          await (window as any).ethereum.request?.({ method: "eth_requestAccounts" })
          const signer = await provider.getSigner()
          const amount = Math.abs(total)
          const tx = await signer.sendTransaction({ to: PLATFORM_OWNER, value: ethers.parseEther(String(amount)) })
          await tx.wait()
          try {
            const { transactionLogger } = await import("@/lib/transaction-logger")
            transactionLogger.logTransaction({
              type: "quiz_reward",
              from: savedAddress,
              to: PLATFORM_OWNER,
              amount: amount,
              description: `Quiz penalty: ${incorrect}/${questions.length}`,
              transactionHash: tx.hash,
              status: "completed",
            })
          } catch (e) {
            console.warn("Failed to log tx", e)
          }
        } catch (e) {
          console.error("On-chain payment failed:", e)
          alert("Payment failed: " + (e as any)?.message)
        }
      } else {
        // total >= 0: mentee earned CELO. We cannot send from owner from the mentee's wallet.
        // Create a payout request on the server so the owner can process the payment.
        try {
          const res = await fetch(`/api/ai/quiz-result`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userAddress: savedAddress, correct, incorrect, amount: total }),
          })
          if (!res.ok) {
            const j = await res.json().catch(() => ({}))
            throw new Error(j?.error || "Failed to request payout")
          }
          try {
            const { transactionLogger } = await import("@/lib/transaction-logger")
            transactionLogger.logTransaction({
              type: "quiz_reward",
              from: "platform_pending",
              to: savedAddress,
              amount: total,
              description: `Quiz reward (pending owner): ${correct}/${questions.length}`,
              transactionHash: "pending",
              status: "pending",
            })
          } catch (e) {
            console.warn("Failed to log payout request", e)
          }
        } catch (e) {
          console.error("Payout request failed", e)
          alert("Failed to request payout: " + (e as any)?.message)
        }
      }

      setResult({ correct, incorrect, total })
      setStage("confirmation")
      if (typeof props?.onComplete === "function") {
        try { props.onComplete({ correct, incorrect, total }) } catch (e) {}
      }
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
                                  <input
                                    type="radio"
                                    name={`q${idx}`}
                                    className="w-4 h-4"
                                    checked={answers[idx] === oi}
                                    onChange={() => {
                                      const copy = [...answers]
                                      copy[idx] = oi
                                      setAnswers(copy)
                                    }}
                                  />
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
            <h3 className="text-2xl font-bold gradient-text">Quiz Complete</h3>
            <p className="text-muted-foreground">Review your result below. You may now confirm to record the outcome.</p>

            <Card className="glass-effect border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                    <p className="text-2xl font-bold text-primary">{result?.correct ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                    <p className="text-2xl font-bold text-secondary">{result?.incorrect ?? 0}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Celo Change</p>
                  <p className="text-2xl font-bold text-foreground">{result?.total ?? 0} CELO</p>
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

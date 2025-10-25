"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QuizInterfaceProps {
  onClose: () => void
}

export default function QuizInterface({ onClose }: QuizInterfaceProps) {
  const [stage, setStage] = useState<"upload" | "generating" | "quiz" | "results">("upload")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)

  const questions = [
    {
      question: "What is the primary purpose of smart contracts?",
      options: [
        "To store cryptocurrency",
        "To automate and enforce agreements on the blockchain",
        "To replace traditional banks",
        "To increase transaction fees",
      ],
      correct: 1,
    },
    {
      question: "Which blockchain is CELO built on?",
      options: ["Ethereum", "Bitcoin", "Proof of Stake consensus", "Its own independent blockchain"],
      correct: 3,
    },
    {
      question: "What does DeFi stand for?",
      options: [
        "Decentralized Finance",
        "Digital Financial Infrastructure",
        "Distributed Financial Index",
        "Decentralized Funding Initiative",
      ],
      correct: 0,
    },
  ]

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: optionIndex })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate score
      let correctCount = 0
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correct) {
          correctCount++
        }
      })
      setScore((correctCount / questions.length) * 100)
      setStage("results")
    }
  }

  const handleFileUpload = () => {
    setStage("generating")
    setTimeout(() => {
      setStage("quiz")
    }, 2000)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        {stage === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Upload PDF → Generate Quiz</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="text-5xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Click to upload PDF</h3>
                <p className="text-sm text-muted-foreground">
                  AI will analyze your content and generate quiz questions
                </p>
              </div>
              <Button
                onClick={handleFileUpload}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
              >
                Upload & Generate Quiz
              </Button>
            </div>
          </>
        )}

        {stage === "generating" && (
          <>
            <DialogHeader>
              <DialogTitle>Generating Quiz...</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-6"></div>
              <p className="text-lg text-muted-foreground">AI is analyzing your PDF and creating questions...</p>
              <p className="text-sm text-muted-foreground mt-2">This usually takes 30-60 seconds</p>
            </div>
          </>
        )}

        {stage === "quiz" && (
          <>
            <DialogHeader>
              <DialogTitle>
                Quiz Question {currentQuestion + 1} of {questions.length}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">{questions[currentQuestion].question}</h3>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                        selectedAnswers[currentQuestion] === idx
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswers[currentQuestion] === idx ? "border-primary bg-primary" : "border-border/50"
                          }`}
                        >
                          {selectedAnswers[currentQuestion] === idx && (
                            <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                          )}
                        </div>
                        {option}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <Button
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestion] === undefined}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold disabled:opacity-50"
              >
                {currentQuestion === questions.length - 1 ? "Submit Quiz" : "Next Question"}
              </Button>
            </div>
          </>
        )}

        {stage === "results" && (
          <>
            <DialogHeader>
              <DialogTitle>Quiz Results</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Score Card */}
              <Card className="glass-effect border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="pt-8 text-center">
                  <div className="text-6xl font-bold gradient-text mb-2">{Math.round(score)}%</div>
                  <p className="text-lg text-muted-foreground">Quiz Accuracy</p>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-effect border-primary/20">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-secondary">
                      {Object.values(selectedAnswers).filter((ans, idx) => ans === questions[idx].correct).length}/
                      {questions.length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Correct Answers</p>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-primary/20">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">+1.80 CELO</div>
                    <p className="text-sm text-muted-foreground mt-2">Earned</p>
                  </CardContent>
                </Card>
              </div>

              {/* Reward Animation */}
              <div className="text-center py-6">
                <div className="text-5xl mb-3 animate-bounce">💰</div>
                <p className="text-lg font-semibold text-foreground">Congratulations!</p>
                <p className="text-sm text-muted-foreground mt-2">Your CELO rewards have been added to your wallet</p>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
              >
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

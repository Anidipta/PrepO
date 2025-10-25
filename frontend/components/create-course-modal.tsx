"use client"

import type React from "react"

import { useState } from "react"
import { useWallet } from "@/components/wallet-provider"
import { useAccount } from "wagmi"
import { ethers } from "ethers"
import { sendMentorStake } from "@/lib/smart-contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CreateCourseModalProps {
  onClose: () => void
}

export default function CreateCourseModal({ onClose }: CreateCourseModalProps) {
  const [stage, setStage] = useState<"details" | "content" | "confirmation">("details")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "DeFi",
    level: "Beginner",
    duration: "GO",
    fee: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const wallet = useWallet()
  const { address } = useAccount()

  const getSigner = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        // request accounts from injected provider
        await (window as any).ethereum.request?.({ method: "eth_requestAccounts" })
      } catch (e) {
        // ignore
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      return provider.getSigner()
    }
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (stage === "details") {
      setStage("content")
    } else if (stage === "content") {
      // submit course with optional file; charge mentor fee of 0.001 CELO (mocked via WalletProvider)
      ;(async () => {
        try {
          const form = new FormData()
          form.append("title", formData.name)
          form.append("description", formData.description)
          form.append("category", formData.category)
          form.append("level", formData.level)
          form.append("duration", formData.duration)
          form.append("fee", formData.fee)

          const mentorAddress = wallet?.address || (typeof window !== "undefined" ? localStorage.getItem("walletAddress") || "" : "")
          form.append("mentorAddress", mentorAddress)

          // Try performing an on-chain mentor stake: take 80% of the course fee from the mentor
          const feeNumber = Number(formData.fee || 0)
          const mentorStake = Number((feeNumber * 0.8).toFixed(6))
          // try to get signer from injected provider
          const signer = await getSigner()
          if (signer) {
            try {
              const stakeResult = await sendMentorStake(signer, mentorStake)
              console.log("Mentor stake tx:", stakeResult)
              form.append("mentorFeePaid", String(mentorStake))
              form.append("mentorStakeTx", stakeResult.txHash)
            } catch (txErr) {
              console.error("Failed to send mentor stake on-chain:", txErr)
              alert("On-chain mentor payment failed. Please try again or connect your wallet.")
              return
            }
          } else {
            // fallback: record the intended mentorFeePaid so server can process off-chain
            const fallbackFee = Number((feeNumber * 0.001).toFixed(6))
            form.append("mentorFeePaid", String(fallbackFee))
          }

          if (selectedFile) form.append("file", selectedFile)

          const res = await fetch("/api/courses", { method: "POST", body: form })
          if (!res.ok) throw new Error("Failed to create course")
          const json = await res.json()
          console.log("Course created:", json)
          setStage("confirmation")
        } catch (e) {
          console.error("Error creating course", e)
          alert("Failed to create course")
        }
      })()
    }
  }

  const durationOptions = [
    { value: "GO", label: "GO (1 day) - Quick intensive course" },
    { value: "GOA", label: "GOA (5 days) - Comprehensive learning" },
    { value: "GONE", label: "GONE (10 days) - Deep dive mastery" },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-primary/30 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
        </DialogHeader>

        {stage === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Course Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Course Details</h3>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Course Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Advanced DeFi Strategies"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe what students will learn..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="DeFi">DeFi</option>
                  <option value="Smart Contracts">Smart Contracts</option>
                  <option value="Blockchain">Blockchain</option>
                  <option value="Web3">Web3</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Right Column - Duration & Fee */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Course Settings</h3>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Duration *</label>
                <div className="space-y-2">
                  {durationOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={option.value}
                        checked={formData.duration === option.value}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{option.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Course Fee (CELO) *</label>
                <input
                  type="number"
                  name="fee"
                  placeholder="e.g., 5.0"
                  value={formData.fee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <Card className="glass-effect border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Students enrolled in your course get 80% discount on bounty entry fees for linked bounties.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {stage === "content" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Course Content</h3>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Upload Course PDF *</label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input id="course-file" type="file" accept=".pdf" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                <label htmlFor="course-file" className="cursor-pointer block">
                  <div className="text-5xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Click to upload PDF</h3>
                  <p className="text-sm text-muted-foreground">{selectedFile ? `Selected: ${selectedFile.name}` : "AI will analyze your content and generate quiz questions automatically"}</p>
                </label>
              </div>
            </div>

            <Card className="glass-effect border-primary/20 bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">AI-Assisted Mega Quiz Creation</h4>
                    <p className="text-sm text-muted-foreground">
                      After uploading your PDF, our AI will automatically generate quiz questions. You can review, edit,
                      and add your own questions before publishing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stage === "confirmation" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Course Created Successfully!</h3>

            <Card className="glass-effect border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="pt-8 text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h4 className="text-2xl font-bold gradient-text mb-2">{formData.name}</h4>
                <p className="text-muted-foreground mb-6">Your course is now live and ready for students!</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Fee</p>
                    <p className="text-2xl font-bold text-primary">{formData.fee} CELO</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold text-secondary">{formData.duration}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  You can now create bounties linked to this course to engage your students further.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {stage !== "details" && (
            <Button
              onClick={() => setStage(stage === "content" ? "details" : "content")}
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 py-6 text-base font-semibold bg-transparent"
            >
              Back
            </Button>
          )}

          {stage !== "confirmation" && (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
            >
              {stage === "content" ? "Create Course" : "Next"}
            </Button>
          )}

          {stage === "confirmation" && (
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
            >
              Back to Dashboard
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

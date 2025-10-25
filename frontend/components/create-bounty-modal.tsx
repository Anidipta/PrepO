"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/components/wallet-provider"
import { ethers } from "ethers"
import { createBountyOnChain } from "@/lib/smart-contracts"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

interface CreateBountyModalProps {
  onClose: () => void
}

export default function CreateBountyModal({ onClose }: CreateBountyModalProps) {
  const { address } = useWallet()
  const [mentorCourses, setMentorCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState("details")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prizePool: "",
    entryFee: "",
    topWinners: "",
    maxEntries: "",
    deadline: "",
    linkedCourse: "",
  })
  const [requirements, setRequirements] = useState<string[]>([])
  const [newRequirement, setNewRequirement] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements((prev) => [...prev, newRequirement.trim()])
      setNewRequirement("")
    }
  }

  const removeRequirement = (idx: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleNext = async () => {
    if (stage === "details") {
      setStage("requirements")
    } else if (stage === "requirements") {
      setStage("confirmation")
      if (address) {
        setLoading(true)
        try {
          // try to get signer from injected provider (mentor will fund the prize pool)
          let signer: any = null
          if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
              await (window as any).ethereum.request?.({ method: "eth_requestAccounts" })
            } catch (e) {
              // ignore
            }
            const provider = new ethers.BrowserProvider((window as any).ethereum)
            signer = await provider.getSigner()
          }

          // generate a client-side bounty code so we can use the same id on-chain and in DB
          const code = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()

          // If signer is available, create bounty on-chain (fund prize pool)
          let txHash: string | null = null
          let funded = false
          const prizePoolNum = Number.parseFloat(formData.prizePool || "0") || 0
          const entryFeeNum = Number.parseFloat(formData.entryFee || "0") || 0
          const topWinnersNum = Number.parseInt(formData.topWinners || "1") || 1
          if (signer && prizePoolNum > 0) {
            try {
              const onchain = await createBountyOnChain(signer, code, formData.linkedCourse || "", entryFeeNum, topWinnersNum, prizePoolNum)
              txHash = onchain.txHash
              funded = true
              console.log("Bounty funded on-chain tx:", txHash)
            } catch (txErr) {
              console.error("On-chain bounty create failed:", txErr)
              // continue to save to DB but mark as not funded
            }
          }

          // Support optional file upload via FormData
          let response: Response
          if (selectedFile) {
            const form = new FormData()
            form.append("title", formData.title)
            form.append("description", formData.description)
            form.append("prizePool", formData.prizePool)
            form.append("entryFee", formData.entryFee)
            form.append("topWinners", formData.topWinners)
            form.append("maxEntries", formData.maxEntries)
            form.append("deadline", formData.deadline)
            form.append("linkedCourse", formData.linkedCourse)
            form.append("requirements", requirements.join("\n") || "")
            form.append("mentorAddress", address)
            form.append("file", selectedFile)
            form.append("code", code)
            form.append("funded", String(funded))
            if (txHash) form.append("txHash", txHash)
            response = await fetch("/api/bounties", { method: "POST", body: form })
          } else {
            response = await fetch("/api/bounties", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: formData.title,
                description: formData.description,
                category: "General",
                difficulty: "Medium",
                prizePool: prizePoolNum,
                entryFee: entryFeeNum,
                topWinners: topWinnersNum,
                maxEntries: Number.parseInt(formData.maxEntries || "0"),
                deadline: formData.deadline,
                mentorAddress: address,
                linkedCourse: formData.linkedCourse,
                requirements: requirements.filter((r) => r.trim()),
                code,
                funded,
                txHash,
              }),
            })
          }
          if (!response.ok) throw new Error("Failed to create bounty")
          const data = await response.json()
          console.log("[v0] Bounty created with code:", data.data?.code || data.code || code)
        } catch (error) {
          console.error("[v0] Error creating bounty:", error)
        } finally {
          setLoading(false)
        }
      }
    }
  }

  // load mentor's courses for the linkedCourse select
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!address) return
        const res = await fetch(`/api/courses?mentor=${address}`)
  if (!res.ok) return
  const json = await res.json()
  if (mounted) setMentorCourses((json && (json.data || json)) || [])
      } catch (e) {
        console.warn("Failed to load mentor courses", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [address])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-primary/30 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bounty</DialogTitle>
        </DialogHeader>

        {stage === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Bounty Details</h3>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Bounty Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., DeFi Protocol Analysis Challenge"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe the challenge and what participants need to do..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Attach File (optional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                {selectedFile && <p className="text-sm text-muted-foreground mt-2">Selected: {selectedFile.name}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Linked Course *</label>
                <select
                  name="linkedCourse"
                  value={formData.linkedCourse}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select a course you created --</option>
                  {mentorCourses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Prize & Entry</h3>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Prize Pool (CELO) *</label>
                <input
                  type="number"
                  name="prizePool"
                  placeholder="e.g., 500"
                  value={formData.prizePool}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Entry Fee (CELO) *</label>
                <input
                  type="number"
                  name="entryFee"
                  placeholder="e.g., 0.5"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Top Winners *</label>
                  <select
                    name="topWinners"
                    value={formData.topWinners}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="1">Top 1</option>
                    <option value="3">Top 3</option>
                    <option value="5">Top 5</option>
                    <option value="10">Top 10</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Max Entries *</label>
                  <input
                    type="number"
                    name="maxEntries"
                    placeholder="e.g., 50"
                    value={formData.maxEntries}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Deadline *</label>
                <input
                  type="text"
                  name="deadline"
                  placeholder="dd-mm-yyyy"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <Card className="glass-effect border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Enrolled students get 50% discount on entry fee. Non-enrolled pay full price.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {stage === "requirements" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Requirements</h3>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Add Requirement</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Submit detailed analysis report"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
                <Button
                  onClick={addRequirement}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6"
                >
                  Add
                </Button>
              </div>
            </div>

            {requirements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Requirements List</h4>
                <div className="space-y-2">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span className="text-foreground">{req}</span>
                      </div>
                      <button
                        onClick={() => removeRequirement(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Card className="glass-effect border-primary/20 bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Smart Contract Escrow</h4>
                    <p className="text-sm text-muted-foreground">
                      Your prize pool will be secured in a smart contract escrow. Funds are automatically distributed to
                      winners when the bounty ends.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stage === "confirmation" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Bounty Live!</h3>

            <Card className="glass-effect border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="pt-8 text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h4 className="text-2xl font-bold gradient-text mb-2">{formData.title}</h4>
                <p className="text-muted-foreground mb-6">Linked to {formData.linkedCourse}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="text-2xl font-bold text-primary">{formData.prizePool} CELO</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Entry Fee</p>
                    <p className="text-2xl font-bold text-secondary">{formData.entryFee} CELO</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Your bounty is now live and students can start entering. Prize pool is secured in smart contract
                  escrow.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {stage !== "details" && (
            <Button
              onClick={() => setStage(stage === "requirements" ? "details" : "requirements")}
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
              {stage === "requirements" ? "Launch Bounty" : "Next"}
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

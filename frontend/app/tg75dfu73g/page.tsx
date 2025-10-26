"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function ContractDashboard() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tg75dfu73g/pending`)
      const j = await res.json()
      if (res.ok && j.success) {
        setPending(j.data || [])
      } else {
        console.warn("Failed to fetch pending", j)
      }
    } catch (e) {
      console.error("Failed to fetch pending regs", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this pending enrollment and release funds to mentor?")) return
    try {
      const res = await fetch(`/api/tg75dfu73g/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: id }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || "Failed")
      alert("Approved — enrollment confirmed on-chain")
      setPending((p) => p.filter((x) => String(x._id) !== String(id)))
    } catch (e) {
      console.error("Approve failed", e)
      alert("Approve failed: " + (e as any)?.message)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-2xl font-bold mb-4">Platform Contract Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Pending enrollments submitted to contract; approve to release mentor payout.</p>

      {loading && <div>Loading…</div>}

      <div className="space-y-4">
        {pending.length === 0 && <div className="text-sm text-muted-foreground">No pending enrollments.</div>}
        {pending.map((p) => (
          <div key={String(p._id)} className="p-4 rounded bg-muted/30 flex items-start justify-between">
            <div>
              <div className="font-semibold">Course: {p.courseCode} (mentor: {p.mentorAddress})</div>
              <div className="text-sm text-muted-foreground">Student: {p.userAddress}</div>
              <div className="text-sm text-muted-foreground">Amount: {p.amountPaid} CELO</div>
              <div className="text-sm text-muted-foreground">Tx: <a href={`https://explorer.celo.org/tx/${p.txHash}`} target="_blank" rel="noreferrer" className="underline">{p.txHash}</a></div>
            </div>
            <div>
              <Button onClick={() => handleApprove(String(p._id))} className="bg-gradient-to-r from-primary to-secondary">Approve</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

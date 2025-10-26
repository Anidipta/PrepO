"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"

export default function ContractDashboard() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tg75dfu73g/pending`)
      const j = await res.json()
      if (res.ok && j.success) {
        setPending(j.data || [])
      } else {
        console.warn("Failed to fetch pending", j)
        setError(j?.error || "Failed to fetch pending")
      }
    } catch (e: any) {
      console.error("Failed to fetch pending regs", e)
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (id: string, amountPaid: number, mentorAddress: string | null) => {
    if (!mentorAddress) { console.warn('Cannot approve: missing mentor address'); return }
    if (!confirm(`Approve and release ${ (amountPaid * 0.8).toFixed(6) } CELO to ${mentorAddress}?`)) return
    try {
      setProcessingId(id)
      // Owner will send payout via their wallet in the browser and then notify the server
      const mentorShare = Number((amountPaid * 0.8).toFixed(6))
      const eth = (window as any).ethereum
      if (!eth) {
        alert('No wallet available in browser to send payout from owner account')
        setProcessingId(null)
        return
      }

      // Require MetaMask specifically (do not auto-select other injected providers)
      let metamaskProvider: any = null
      try {
        if (Array.isArray(eth.providers) && eth.providers.length > 0) {
          metamaskProvider = eth.providers.find((p: any) => p.isMetaMask) || null
        }
        if (!metamaskProvider && eth.isMetaMask) metamaskProvider = eth
      } catch (e) {
        console.warn('Error while checking injected providers for MetaMask', e)
      }

      if (!metamaskProvider) {
        alert('MetaMask not detected. Please install/enable MetaMask and try again.')
        setProcessingId(null)
        return
      }

      try {
        await metamaskProvider.request?.({ method: 'eth_requestAccounts' })
      } catch (e: any) {
        console.warn('MetaMask connect rejected or blocked', e)
        alert('MetaMask connection was rejected or blocked. Please allow the connection and try again.')
        setProcessingId(null)
        return
      }

      let provider: any
      try {
        provider = new ethers.BrowserProvider(metamaskProvider)
        const signer = await provider.getSigner()
        // attach signer to outer scope
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.__ownerSigner = signer
      } catch (e) {
        console.error('Failed to initialize MetaMask provider or signer', e)
        alert('Failed to initialize MetaMask. Make sure MetaMask is unlocked and try again.')
        setProcessingId(null)
        return
      }

      // retrieve signer from window where we stored it
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const signer = window.__ownerSigner

      try {
        const tx = await signer.sendTransaction({ to: mentorAddress, value: ethers.parseEther(String(mentorShare)) })
        // show processing and wait
        setProcessingId(id)
        await tx.wait()

        // Notify server that payout was made
        const res = await fetch(`/api/tg75dfu73g/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: id, payoutTxHash: tx.hash }),
        })
        const j = await res.json().catch(() => ({}))
          if (!res.ok) {
            const errMsg = j?.error || j?.message || 'Server failed to record payout'
            console.warn('Server approve responded with error:', errMsg)
            // If server failed due to on-chain create errors, attempt offline approval fallback
            if (/create|on-?chain|createCourse/i.test(errMsg)) {
              try {
                const fallbackRes = await fetch(`/api/tg75dfu73g/approve`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ registrationId: id }),
                })
                const fj = await fallbackRes.json().catch(() => ({}))
                if (fallbackRes.ok) {
                  setPending((p) => p.filter((x) => String(x._id) !== String(id)))
                  alert('Server-side on-chain create failed; registration approved off-chain and manual payout queued')
                  return
                }
                console.error('Fallback offline approval also failed', fj)
              } catch (fbErr) {
                console.error('Fallback offline approval request error', fbErr)
              }
            }
            throw new Error(errMsg)
          }

          // remove from UI
          setPending((p) => p.filter((x) => String(x._id) !== String(id)))
      } catch (sendErr) {
        console.error('Failed to send payout from owner wallet', sendErr)
        console.error('Attempting offline approval fallback for registration', id)
        try {
          const fallbackRes = await fetch(`/api/tg75dfu73g/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationId: id }),
          })
          const fj = await fallbackRes.json().catch(() => ({}))
          if (fallbackRes.ok) {
            // Mark removed from UI
            setPending((p) => p.filter((x) => String(x._id) !== String(id)))
            alert('Payout could not be sent from owner wallet; registration approved off-chain and manual payout queued')
          } else {
            console.error('Offline approval fallback failed', fj)
            alert('Payout failed: ' + ((sendErr as any)?.message || 'Unknown error') + '. Also failed to record offline approval.')
          }
        } catch (fbErr) {
          console.error('Offline approval fallback request failed', fbErr)
          alert('Payout failed: ' + ((sendErr as any)?.message || 'Unknown error') + '. Offline approval attempt failed.')
        }
      }
    } catch (e: any) {
      console.error("Approve failed", e)
      alert("Approve failed: " + (e?.message || String(e)))
    } finally {
      setProcessingId((prev) => (prev === id ? null : prev))
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-2xl font-bold mb-4">Platform Contract Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Pending enrollments submitted to contract; approve to release mentor payout.</p>

      {loading && <div>Loading…</div>}
      {error && <div className="text-destructive mb-4">{error}</div>}

      <div className="overflow-x-auto bg-card p-4 rounded-lg border border-border">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Amount (CELO)</th>
              <th className="px-3 py-2">Mentor (pending 80%)</th>
              <th className="px-3 py-2">Tx</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-sm text-muted-foreground">No pending enrollments.</td>
              </tr>
            )}
            {pending.map((p) => {
              const amt = Number(p.amountPaid || 0)
              const mentorShare = Number((amt * 0.8).toFixed(6))
              return (
                <tr key={String(p._id)} className="align-top border-t border-border">
                  <td className="px-3 py-3 font-semibold">{p.courseCode}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{p.userAddress}</td>
                  <td className="px-3 py-3">{amt.toFixed(6)}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{mentorShare.toFixed(6)}<div className="text-xs text-muted-foreground">to {p.mentorAddress || '—'}</div></td>
                  <td className="px-3 py-3 text-sm"><a className="underline" href={`https://explorer.celo.org/tx/${p.txHash}`} target="_blank" rel="noreferrer">{(p.txHash || '').slice(0, 12)}...</a></td>
                  <td className="px-3 py-3"><span className={p.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}>{p.status || 'pending'}</span></td>
                  <td className="px-3 py-3">
                    {processingId === String(p._id) ? (
                      <Button disabled className="bg-gradient-to-r from-primary to-secondary opacity-80">
                        Processing...
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleApprove(String(p._id), amt, p.mentorAddress || null)}
                        disabled={p.status === 'confirmed'}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        {p.status === 'confirmed' ? 'Confirmed' : 'Approve'}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

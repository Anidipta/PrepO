"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { CONTRACT_ADDRESS, enrollInCourseOnChain } from "@/lib/smart-contracts"
import { ethers } from "ethers"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Circle, Lock } from "lucide-react"

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [mentor, setMentor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [pendingTx, setPendingTx] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [shownCongrats, setShownCongrats] = useState(false)
  const { address: connectedAddress } = useAccount()

  // Poll registration status when there's a pending tx
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    const poll = async () => {
      try {
        if (!pendingTx || !connectedAddress) return
        const res = await fetch(`/api/courses/${course.code}/status?address=${connectedAddress}`)
        if (res.ok) {
          const j = await res.json()
          const reg = j.data
          if (reg && reg.status === "confirmed") {
            setPendingStatus("confirmed")
            setPendingTx(reg.txHash || pendingTx)
            setEnrolled(true)
            if (timer) clearInterval(timer)
          }
        }
      } catch (e) {
        console.warn("Polling enrollment status failed", e)
      }
    }

    if (pendingTx) {
      timer = setInterval(poll, 8000)
      // run immediately
      poll()
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [pendingTx, connectedAddress, course?.code])

  // Show a one-time congratulations popup when enrollment becomes confirmed
  useEffect(() => {
    if (pendingStatus === 'confirmed' && !shownCongrats) {
      try {
        // lightweight celebratory message (keeps UX minimal)
        alert("Congratulations — you're enrolled in this course!")
      } catch (e) {
        console.info('Enrollment confirmed')
      }
      setShownCongrats(true)
    }
  }, [pendingStatus, shownCongrats])
  const { address } = useAccount()

  // Display fee breakdown to the user: course fee + transfer fee (estimated)
  const DISPLAY_BASE_FEE = Number(course?.fee || 0)
  const DISPLAY_TRANSFER_FEE = 0.05
  const DISPLAY_TOTAL = Number((DISPLAY_BASE_FEE + DISPLAY_TRANSFER_FEE).toFixed(6))

  const getSigner = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request?.({ method: "eth_requestAccounts" })
      } catch (e) {
        // ignore
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      return provider.getSigner()
    }
    return null
  }

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.code}`)
        if (response.ok) {
          const data = await response.json()
          setCourse(data.data)
          // fetch mentor/user info if available
          const mentorAddr = data.data?.mentorAddress
          if (mentorAddr) {
            try {
              const mres = await fetch(`/api/user/${mentorAddr}`)
              if (mres.ok) {
                const mjson = await mres.json()
                if (mjson?.found && mjson.user) setMentor(mjson.user)
              }
            } catch (e) {
              console.warn("Failed to fetch mentor info", e)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching course:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.code) fetchCourse()
  }, [params.code])

  const modules = course?.modules || [
    {
      id: 1,
      title: "Introduction & Fundamentals",
      lessons: [
        { id: "L1", title: "Course Overview", duration: "15 min", status: "completed" },
        { id: "L2", title: "Getting Started", duration: "20 min", status: "in-progress" },
        { id: "L3", title: "Basic Concepts", duration: "25 min", status: "pending" },
      ],
    },
    {
      id: 2,
      title: "Core Concepts",
      lessons: [
        { id: "L4", title: "Deep Dive Part 1", duration: "30 min", status: "pending" },
        { id: "L5", title: "Deep Dive Part 2", duration: "35 min", status: "pending" },
        { id: "L6", title: "Practice Exercises", duration: "40 min", status: "pending" },
      ],
    },
    {
      id: 3,
      title: "Advanced Topics",
      lessons: [
        { id: "L7", title: "Advanced Techniques", duration: "45 min", status: "pending" },
        { id: "L8", title: "Real-world Applications", duration: "50 min", status: "pending" },
        { id: "L9", title: "Final Project", duration: "60 min", status: "pending" },
      ],
    },
  ]

  const completedLessons = modules.flatMap((m: any) => m.lessons.filter((l: any) => l.status === "completed")).length
  const totalLessons = modules.flatMap((m: any) => m.lessons).length
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>

  return (
    <div className="min-h-screen bg-background p-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        Back
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Course Header */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{course.title}</CardTitle>
                <p className="text-muted-foreground mt-2">Code: {course.code}</p>
                {mentor ? (
                  <p className="text-sm text-muted-foreground mt-1">Owner: {mentor.name || mentor.address}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Owner: {course.mentorAddress || "—"}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold text-primary">{progressPercentage}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{course.description}</p>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-semibold text-foreground">{course.category}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="font-semibold text-foreground">{course.level}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">{course.duration}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Fee</p>
                <p className="font-semibold text-primary">{course.fee} CELO</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Enrollments</p>
                <p className="font-semibold text-foreground">{course.enrollments || 0}</p>
              </div>
            </div>
            {course.files && course.files.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-foreground mb-2">Course Files</h4>
                <ul className="space-y-2">
                  {course.files.map((f: string, idx: number) => (
                    <li key={idx}>
                      <a href={f} target="_blank" rel="noreferrer" className="text-primary underline">
                        Download {f.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Content Tabs */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="modules">Course Content</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            {modules.map((module: any, idx: number) => (
              <Card key={module.id} className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Module {idx + 1}: {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {module.lessons.map((lesson: any) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      {lesson.status === "completed" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {lesson.status === "in-progress" && (
                        <Circle className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                      )}
                      {lesson.status === "pending" && <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary capitalize">
                        {lesson.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card className="glass-effect border-primary/20">
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">About This Course</h4>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What You'll Learn</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Master the fundamentals and core concepts</li>
                    <li>✓ Apply advanced techniques in real-world scenarios</li>
                    <li>✓ Complete hands-on projects and exercises</li>
                    <li>✓ Earn a certificate upon completion</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enroll Button */}
        {!enrolled && (
          <Button
            disabled={isProcessing || enrolled}
            onClick={async () => {
              // Clear previous state
              try {
                const baseFee = Number(course.fee || 0)
                const TRANSFER_FEE = 0.05 // estimated transfer / platform fee shown to user
                const totalAmount = Number((baseFee + TRANSFER_FEE).toFixed(6))

                const proceed = window.confirm(
                  `You will be charged ${baseFee.toFixed(6)} CELO (course fee) + ${TRANSFER_FEE.toFixed(6)} CELO (transfer fees) = ${totalAmount.toFixed(6)} CELO total. Proceed to wallet confirmation?`
                )
                if (!proceed) return

                if (!(window as any).ethereum) {
                  alert("No web3 wallet detected in the browser. Please install MetaMask or a compatible wallet.")
                  return
                }

                setIsProcessing(true)

                // Prompt wallet to connect accounts (this will open MetaMask/account selector)
                const eth = (window as any).ethereum
                if (!eth) {
                  alert("No web3 wallet detected in the browser. Please install MetaMask or a compatible wallet.")
                  setIsProcessing(false)
                  return
                }

                try {
                  // Try common wallet connection methods in order
                  if (typeof eth.request === "function") {
                    await eth.request({ method: "eth_requestAccounts" })
                  } else if (typeof eth.send === "function") {
                    // some providers implement send
                    await eth.send("eth_requestAccounts", [])
                  } else if (typeof eth.enable === "function") {
                    // legacy
                    await eth.enable()
                  } else {
                    // last resort: use ethers provider send
                    const tmpProvider = new ethers.BrowserProvider(eth)
                    await tmpProvider.send("eth_requestAccounts", [])
                  }
                } catch (e: any) {
                  console.error("Wallet connection failed:", e)
                  // Show a helpful message and stop processing instead of letting extension error bubble up
                  const msg = e?.message || String(e)
                  alert("Wallet connection failed: " + msg + ". Please retry or try a different wallet extension.")
                  setIsProcessing(false)
                  return
                }

                // Create signer and call contract which will open the tx confirmation (value shown in wallet)
                const provider = new ethers.BrowserProvider((window as any).ethereum)
                const signer = await provider.getSigner()

                try {
                  // The contract maps courses by the MongoDB course ID (insertedId),
                  // not the user-facing short `code`. Prefer `_id` when available.
                  const courseIdForChain = course?._id
                    ? (typeof course._id === "string" ? course._id : course._id.toString())
                    : (course?.id || course?.code)

                  // Debug: log the identifiers we will use on-chain so we can inspect mismatches
                  console.log("Enroll attempt — course identifiers:", {
                    courseCode: course?.code,
                    courseId: course?._id,
                    courseIdForChain,
                  })

                  // Pre-flight read: check whether the contract actually has this course registered
                  // get the student address early so we can include it in any server request
                  const studentAddress = await signer.getAddress()
                  try {
                    const readProvider = new ethers.BrowserProvider((window as any).ethereum)
                    const readContract = new ethers.Contract(CONTRACT_ADDRESS, [
                      "function courses(string) view returns (address mentor, string courseId, uint256 price, bool exists)",
                    ], readProvider)

                    const onChain = await readContract.courses(courseIdForChain)
                    const exists = onChain && (onChain.exists === true || onChain[3] === true)
                    console.log("on-chain course lookup result:", onChain)
                    if (!exists) {
                      // Course not registered on-chain.
                      // Offer the mentee a choice: either notify owner (no on-chain payment),
                      // or send the enrollment amount directly to the contract address as a deposit
                      // which will be recorded as a pending enrollment for owner confirmation.
                      try {
                        const depositChoice = window.confirm(
                          `This course is not registered on-chain yet.\n\nYou can notify the platform owner so they can register it, or you can send ${totalAmount} CELO to the contract address now to reserve enrollment (owner will still need to confirm).\n\nClick OK to send ${totalAmount} CELO to the contract address now, or Cancel to only notify the owner.`
                        )

                        if (depositChoice) {
                          // Send native CELO to the contract address from the mentee's wallet
                          try {
                            const amountToSend = totalAmount
                            const tx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, value: ethers.parseEther(String(amountToSend)) })

                            // show tx hash and wait for confirmation before recording in DB
                            setPendingTx(tx.hash)
                            setIsProcessing(true)
                            try {
                              await tx.wait()
                              // After on-chain confirmation, record pending enrollment server-side
                              try {
                                const res = await fetch(`/api/courses/${encodeURIComponent(course.code)}`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userAddress: studentAddress, amountPaid: amountToSend, txHash: tx.hash }),
                                })
                                const jr = await res.json().catch(() => ({}))
                                if (!res.ok) {
                                  console.warn("Failed to record pending enrollment after deposit:", jr)
                                  console.info("Payment confirmed on-chain but server failed to record pending enrollment. Please provide tx to owner:", tx.hash)
                                  setPendingStatus("pending")
                                  setEnrolled(true)
                                } else {
                                  setPendingStatus("pending")
                                  setEnrolled(true)
                                  console.info("Pending enrollment recorded", jr)
                                }
                              } catch (recErr) {
                                console.warn("Failed to POST pending enrollment:", recErr)
                                setPendingStatus("pending")
                                setEnrolled(true)
                              }
                            } catch (wErr) {
                              console.error("Transaction confirmation failed:", wErr)
                              alert("Transaction was sent but confirmation failed: " + ((wErr as any)?.message || String(wErr)))
                            } finally {
                              setIsProcessing(false)
                            }
                            return
                          } catch (sendErr) {
                            console.error("Deposit transfer failed:", sendErr)
                            alert("Sending payment to contract failed: " + (sendErr as any)?.message)
                            // fallthrough to notify owner path
                          }
                        }

                        // If mentee chose not to deposit or deposit failed, still notify owner by queuing a registration request
                        const body = {
                          courseCode: course?.code,
                          courseId: courseIdForChain,
                          mentorAddress: course?.mentorAddress || course?.mentor,
                          fee: course?.fee,
                          requestedBy: studentAddress,
                        }

                        const requestPathId = courseIdForChain || course?.code || ''
                        const rr = await fetch(`/api/courses/${encodeURIComponent(requestPathId)}/request-register`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        })

                        if (rr.ok) {
                          console.info("Registration request queued for owner (course not on-chain)")
                        } else {
                          const jr = await rr.json().catch(() => ({}))
                          console.warn("Unable to notify owner automatically:", jr)
                        }
                      } catch (postErr) {
                        console.warn("Failed to POST registration request:", postErr)
                        console.warn("This course is not registered on-chain. Please contact the platform owner and provide this course id:", courseIdForChain)
                      }

                      setIsProcessing(false)
                      return
                    }
                  } catch (readErr) {
                    console.warn("Pre-flight on-chain course check failed (continuing to attempt enroll):", readErr)
                    // fallthrough — we'll still attempt the enroll which may revert, but we logged the read error
                  }

                  // Instead of calling the contract method directly, send the full payment
                  // as a native transfer to the contract address. The owner/admin will later
                  // confirm the enrollment and release the mentor share.
                  try {
                    const tx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, value: ethers.parseEther(String(totalAmount)) })
                    setPendingTx(tx.hash)
                    setIsProcessing(true)
                    try {
                      await tx.wait()
                      // After on-chain confirmation, post to server as pending
                      try {
                        const res = await fetch(`/api/courses/${encodeURIComponent(course.code)}`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userAddress: studentAddress, amountPaid: totalAmount, txHash: tx.hash }),
                        })
                        const j = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          console.warn("Failed to record pending enrollment on server:", j)
                          console.info("Payment confirmed on-chain but server failed to record pending enrollment. Please provide tx to owner:", tx.hash)
                          setPendingStatus("pending")
                          setEnrolled(true)
                        } else {
                          setPendingStatus("pending")
                          setEnrolled(true)
                          console.info("Pending enrollment recorded", j)
                        }
                      } catch (recErr) {
                        console.warn("Failed to POST pending enrollment:", recErr)
                        setPendingStatus("pending")
                        setEnrolled(true)
                      }
                    } catch (wErr) {
                      console.error("Transaction confirm failed:", wErr)
                      alert("Transaction was sent but failed during confirmation: " + ((wErr as any)?.message || String(wErr)))
                    } finally {
                      setIsProcessing(false)
                    }
                  } catch (errTx) {
                    console.error("Direct transfer to contract failed:", errTx)
                    alert("Payment failed: " + (errTx as any)?.message)
                  }
                } catch (err) {
                  console.error("Enroll/payment error:", err)
                  alert("Enrollment failed: " + (err as any)?.message)
                } finally {
                  setIsProcessing(false)
                }
              } catch (err) {
                console.error("Enroll error:", err)
                alert("Enrollment failed: " + (err as any)?.message)
                setIsProcessing(false)
              }
            }}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-6 text-base font-semibold"
          >
            {isProcessing ? `Processing — confirm in wallet` : `Enroll Now - ${DISPLAY_TOTAL} CELO (includes ${DISPLAY_TRANSFER_FEE} CELO transfer fee)`}
          </Button>
        )}
        {/* Pending enrollment banner */}
        {pendingTx && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="font-medium">Enrollment pending confirmation</p>
            <p className="text-sm text-muted-foreground">Transaction: <a href={`https://explorer.celo.org/tx/${pendingTx}`} target="_blank" rel="noreferrer" className="underline">{pendingTx}</a></p>
            <p className="text-sm text-muted-foreground">Status: {pendingStatus}</p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import RoleSelectionModal from "@/components/role-selection-modal"
import NameInputModal from "@/components/name-input-modal"
import { useRouter } from "next/navigation"
import TargetCursor from "@/components/TargetCursor"
import { initDB, getUser, saveUser, logActivity } from "@/lib/client-db"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

export default function Home() {
  const [showNameModal, setShowNameModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [pendingName, setPendingName] = useState<string | null>(null)

  const router = useRouter()
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()

  const handleNameSubmit = (name: string) => {
    setPendingName(name)
    setShowNameModal(false)
    setShowRoleModal(true)
  }

  const handleLaunch = async () => {
    if (openConnectModal && !isConnected) {
      openConnectModal()
      return
    }

    const addr = address

    if (!addr) return

    try {
      await initDB()
      const user = await getUser(addr)
      if (user) {
        if (user.role === "mentor") {
          window.location.href = "/mentor-dashboard"
        } else {
          window.location.href = "/mentee-dashboard"
        }
      } else {
        setShowNameModal(true)
      }
    } catch (e) {
      console.error("DB error", e)
      setShowNameModal(true)
    }
  }

  // 🎥 Reverse + Forward video playback logic
  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const playForward = async () => {
      try {
        // keep the video looping and playing forward
        v.loop = true
        v.playbackRate = 1
        v.currentTime = 0
        await v.play()
      } catch (e) {
        // ignore play errors (autoplay restrictions, etc.)
      }
    }

    v.muted = true
    v.playsInline = true
    playForward()

    return () => {
      // pause on cleanup
      v.pause()
    }
  }, [])

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* 🎬 Background video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none bg-video"
          src="/earth.mp4"
          poster="/placeholder.jpg"
          autoPlay
          muted
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60 pointer-events-none" />
      </div>

      {/* 🧠 Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">PrepO</span>
            <br />
          </h1>

          <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
            Your AI-powered learning + Earning
          </h3>

          <p className="text-xl text-muted-foreground mb-4">
            On the <span className="text-primary font-bold">CELO</span> Blockchain
          </p>

          {/* 🚀 Launch App Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleLaunch}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full glow-pulse"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isConnected ? "Enter App" : "Launch App"}
            </Button>
          </div>
        </div>

        {/* 💎 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full">
          {[
            {
              icon: "⚙️",
              title: "AI-Powered Quizzes",
              description: "Upload PDFs and get instant AI-generated quizzes. Earn CELO for correct answers!",
            },
            {
              icon: "🏆",
              title: "Bounty Competitions",
              description: "Compete in course bounties, climb leaderboards, and win CELO prize pools!",
            },
            {
              icon: "💰",
              title: "Earn CELO Rewards",
              description: "Get rewarded for learning! Earn CELO tokens for quiz completions and bounty wins.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="glass-effect p-6 rounded-xl border border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 Custom cursor */}
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      {/* 🧾 Modals */}
      <NameInputModal open={showNameModal} onOpenChange={setShowNameModal} onNameSubmit={handleNameSubmit} />
      <RoleSelectionModal
        open={showRoleModal}
        onOpenChange={setShowRoleModal}
        onRoleSelect={async (role) => {
          try {
            const addr = address || ""
            if (!addr) return
            const name = pendingName || localStorage.getItem("userName") || ""
            await saveUser({ address: addr, name: name || "Unknown", role })
            await logActivity(addr, { type: "role_selected", payload: { role } })
          } catch (e) {
            console.error("Failed to save user", e)
          }
        }}
      />
    </main>
  )
}

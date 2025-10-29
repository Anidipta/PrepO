import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import RainbowKitProvider from "@/components/rainbow-kit-provider"
import WalletProvider from "@/components/wallet-provider"
import { ThemeProvider } from "@/components/theme-provider"
import TargetCursor from "@/components/TargetCursor"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PrepO",
  description: "AI-powered learning on CELO",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {/* Global background GIF (falls back to earth.mp4 if not present) */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <video className="hidden md:block absolute inset-0 w-full h-full object-cover mix-blend-overlay" src="/earth.mp4" autoPlay muted loop playsInline aria-hidden="true" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <RainbowKitProvider>
            <WalletProvider>{children}</WalletProvider>
          </RainbowKitProvider>
        </ThemeProvider>
        
        {/* Global custom cursor */}
        <TargetCursor spinDuration={2} hideDefaultCursor={true} />

        <Analytics />
      </body>
    </html>
  )
}

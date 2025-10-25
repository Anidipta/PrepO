import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import RainbowKitProvider from "@/components/rainbow-kit-provider"
import WalletProvider from "@/components/wallet-provider"
import { ThemeProvider } from "@/components/theme-provider"

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <RainbowKitProvider>
            <WalletProvider>{children}</WalletProvider>
          </RainbowKitProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

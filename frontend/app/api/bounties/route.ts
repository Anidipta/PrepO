import { getBountiesFromMongo, saveBountyToMongo } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS } from "@/lib/smart-contracts"
import { connectToDatabase } from "@/lib/mongodb"

const RPC_URL = process.env.CELO_RPC_URL || process.env.RPC_URL || "https://forno.celo.org"

export async function GET(request: NextRequest) {
  try {
    const mentorAddress = request.nextUrl.searchParams.get("mentor")
    const bounties = await getBountiesFromMongo(mentorAddress || undefined)
    return NextResponse.json({ success: true, data: bounties })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to fetch bounties" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let bountyBody: any
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file") as File | null
      const title = form.get("title") as string
      const description = form.get("description") as string
      const prizePool = parseFloat((form.get("prizePool") as string) || "0")
      const entryFee = parseFloat((form.get("entryFee") as string) || "0")
      const topWinners = parseInt((form.get("topWinners") as string) || "1")
      const maxEntries = parseInt((form.get("maxEntries") as string) || "0")
      const deadline = (form.get("deadline") as string) || ""
      const mentorAddress = (form.get("mentorAddress") as string) || ""
      const linkedCourse = (form.get("linkedCourse") as string) || undefined
  const txHash = (form.get("txHash") as string) || null
  const feeTxHash = (form.get("feeTxHash") as string) || null
  const funded = (form.get("funded") as string) === "true" || false
      const requirementsRaw = (form.get("requirements") as string) || ""

      const files: string[] = []
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filesDir = path.join(process.cwd(), "frontend", "public", "files")
        await fs.mkdir(filesDir, { recursive: true })
        const safeName = `${Date.now()}-${(file as any).name || "bounty.pdf"}`.replace(/[^a-zA-Z0-9.\-_/]/g, "-")
        await fs.writeFile(path.join(filesDir, safeName), buffer)
        files.push(`/files/${safeName}`)
      }

      bountyBody = {
        title,
        description,
        category: "General",
        difficulty: "Medium",
        prizePool,
        entryFee,
        topWinners,
        maxEntries,
        deadline,
        mentorAddress,
        linkedCourse,
        requirements: requirementsRaw.split("\n").filter((r) => r.trim()),
        files,
        txHash,
        feeTxHash,
        funded,
      }
    } else {
      bountyBody = await request.json()
    }

    // If a txHash was supplied, verify the on-chain funding transaction before marking funded
    if (bountyBody.txHash) {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL)
        const tx = await provider.getTransaction(bountyBody.txHash)
        if (!tx) {
          console.warn("Bounty funding tx not found on-chain:", bountyBody.txHash)
          // leave funded as provided (likely false)
        } else {
          // Ensure tx sent to our contract
          if (tx.to && tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
            // Compare value with expected prizePool (allow small tolerance)
            const prizePoolWei = ethers.parseEther(String(bountyBody.prizePool || 0))
            const sentWei = tx.value as bigint
            // Accept if sentWei >= prizePoolWei (mentor may overfund slightly)
            if (sentWei >= prizePoolWei) {
              bountyBody.funded = true
            } else {
              console.warn("Bounty funding tx value mismatch", { sentWei: sentWei.toString(), prizePoolWei: prizePoolWei.toString() })
              // keep funded false
            }
          } else {
            console.warn("Bounty funding tx not sent to contract address", tx.to)
          }
        }
      } catch (verErr) {
        console.warn("Failed to verify bounty funding tx:", verErr)
      }
    }

    const bounty = await saveBountyToMongo(bountyBody)
    // If bounty wasn't funded on-chain, queue a registration request for mentor/owner to process
    try {
      const { db } = await connectToDatabase()
      const reqs = db.collection("onchain_bounty_registration_requests")
      const doc = {
        bountyCode: bounty.code,
        bountyId: String(bounty._id),
        mentorAddress: bounty.mentorAddress || null,
        prizePool: Number(bounty.prizePool || 0),
        entryFee: Number(bounty.entryFee || 0),
        linkedCourse: bounty.linkedCourse || null,
        funded: !!bounty.funded,
        status: bounty.funded ? "completed" : "pending",
        createdAt: new Date(),
      }
      await reqs.insertOne(doc)
    } catch (e) {
      console.warn("Failed to queue bounty registration request:", e)
    }

    return NextResponse.json({ success: true, data: bounty })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create bounty" }, { status: 500 })
  }
}

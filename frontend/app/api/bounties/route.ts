import { getBountiesFromMongo, saveBountyToMongo } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

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
      }
    } else {
      bountyBody = await request.json()
    }

    const bounty = await saveBountyToMongo(bountyBody)
    return NextResponse.json({ success: true, data: bounty })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create bounty" }, { status: 500 })
  }
}

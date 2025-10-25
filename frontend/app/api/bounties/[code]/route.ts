import { getBountyByCodeFromMongo, deleteBountyFromMongo } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const bounty = await getBountyByCodeFromMongo(params.code)
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: bounty })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to fetch bounty" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const result = await deleteBountyFromMongo(params.code)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to delete bounty" }, { status: 500 })
  }
}

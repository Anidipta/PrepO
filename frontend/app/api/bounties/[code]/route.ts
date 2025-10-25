import { getBountyByCodeFromMongo, deleteBountyFromMongo } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, context: { params: any }) {
  try {
    // `params` can be a Promise in Next.js dynamic route handlers — unwrap it.
    const { params } = context
    const { code } = await params
    const bounty = await getBountyByCodeFromMongo(code)
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: bounty })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to fetch bounty" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  try {
    const { params } = context
    const { code } = await params
    const result = await deleteBountyFromMongo(code)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to delete bounty" }, { status: 500 })
  }
}

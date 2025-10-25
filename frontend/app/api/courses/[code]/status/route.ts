import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request, context: { params: any }) {
  try {
    const { params } = context
    const { code } = await params
    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })

    const url = new URL(request.url)
    const addr = url.searchParams.get("address")
    if (!addr) return NextResponse.json({ error: "Missing address" }, { status: 400 })

    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")
    const reg = await regs.findOne({ courseCode: code, userAddress: addr })
    return NextResponse.json({ success: true, data: reg || null })
  } catch (err) {
    console.error("Failed to fetch registration status", err)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}

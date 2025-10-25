import { saveUserToMongo } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, name, role } = body

    if (!address || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await saveUserToMongo({
      address,
      name,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 })
  }
}

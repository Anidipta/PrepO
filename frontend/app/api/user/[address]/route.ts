import { NextResponse } from "next/server"
import { getUserFromMongo, getUserEarningsSummary } from "@/lib/mongodb"

export async function GET(request: Request, context: any) {
  try {
    // In Next.js route handlers params may be a promise — await it
    const params = await context.params
    const address = params?.address
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 })
    }

    const user = await getUserFromMongo(address)
    if (!user) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    // also fetch earnings summary
    try {
      const earnings = await getUserEarningsSummary(address)
      return NextResponse.json({ found: true, user, earnings }, { status: 200 })
    } catch (e) {
      console.warn('Failed to fetch user earnings summary', e)
      return NextResponse.json({ found: true, user }, { status: 200 })
    }
  } catch (error) {
    console.error("API GET user error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

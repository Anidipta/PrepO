import { NextResponse } from "next/server"
import { saveBountyRegistrationToMongo, getBountyByCodeFromMongo } from "@/lib/mongodb"
import { ethers } from "ethers"

export async function POST(request: Request, context: { params: any }) {
  try {
    const { params } = context
    const { code } = await params
    if (!code) return NextResponse.json({ error: "Missing bounty code" }, { status: 400 })

    const body = await request.json()
    const txHash = body.txHash
    const student = body.studentAddress || body.userAddress
    const amountPaid = Number(body.amountPaid) || 0
    const isEnrolled = !!body.isEnrolled

    if (!txHash || !student) return NextResponse.json({ error: "Missing txHash or student address" }, { status: 400 })

    // Save registration
  await saveBountyRegistrationToMongo({ bountyCode: code, userAddress: student, amountPaid, txHash, isEnrolled })

    // Optionally: return updated bounty
    const bounty = await getBountyByCodeFromMongo(code)
    return NextResponse.json({ success: true, data: { bounty } })
  } catch (err) {
    console.error("Error registering bounty:", err)
    return NextResponse.json({ error: "Failed to register bounty" }, { status: 500 })
  }
}

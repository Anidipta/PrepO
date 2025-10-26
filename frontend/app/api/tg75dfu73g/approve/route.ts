import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
// ethers and contract are not required for server-side DB-only approve
import { ObjectId } from "mongodb"

const RPC_URL = process.env.CELO_RPC_URL || process.env.RPC_URL || "https://forno.celo.org"
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || process.env.CONTRACT_OWNER_PRIVATE_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const registrationId = body.registrationId
    if (!registrationId) return NextResponse.json({ error: "Missing registrationId" }, { status: 400 })

    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")
    const courses = db.collection("courses")

    const oid = typeof registrationId === 'string' ? new ObjectId(registrationId) : registrationId
    const reg = await regs.findOne({ _id: oid })
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 })

    if (reg.status === 'confirmed') return NextResponse.json({ success: true, message: 'Already confirmed' })

    const course = await courses.findOne({ code: reg.courseCode })
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    // New simplified flow: owner will send payout via wallet (client). Server simply records approval/payout.
    // Expect the client to call this endpoint with { registrationId, payoutTxHash }
    const payoutTx = body.payoutTxHash || body.txHash || null

    // Calculate mentor share (80%) and validate amount
    const totalPaid = Number(reg.amountPaid || reg.amount || 0)
    if (isNaN(totalPaid) || totalPaid <= 0) return NextResponse.json({ error: "Invalid paid amount on registration" }, { status: 400 })
    const mentorShare = Number((totalPaid * 0.8).toFixed(6))

    // Mark registration as confirmed and record payout doc
    await regs.updateOne({ _id: reg._id }, { $set: { status: 'confirmed', confirmedAt: new Date(), mentorShare, confirmTxHash: payoutTx } })

    const payouts = db.collection('onchain_payouts')
    await payouts.insertOne({ registrationId: reg._id, mentorAddress: course.mentorAddress, amount: mentorShare, txHash: payoutTx, createdAt: new Date(), status: payoutTx ? 'completed' : 'pending_manual', note: 'Paid via owner wallet' })

    return NextResponse.json({ success: true, payoutTx: payoutTx || null })
  } catch (err) {
    console.error("tg75dfu73g approve error:", err)
    return NextResponse.json({ error: "Failed to approve registration" }, { status: 500 })
  }
}

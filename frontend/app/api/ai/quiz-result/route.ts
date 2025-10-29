import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { saveEarningToMongo } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userAddress, correct, incorrect, amount } = body
    if (!userAddress) return NextResponse.json({ error: "Missing userAddress" }, { status: 400 })

    const { db } = await connectToDatabase()
    const coll = db.collection("quiz_payout_requests")

    const doc = {
      userAddress,
      correct: Number(correct || 0),
      incorrect: Number(incorrect || 0),
      amount: Number(amount || 0),
      status: "pending",
      createdAt: new Date(),
    }

    const res = await coll.insertOne(doc)
    // Also persist an earning record so user's earned CELO can be displayed
    try {
      if (Number(doc.amount || 0) !== 0) {
        await saveEarningToMongo({ userAddress: doc.userAddress, source: 'quiz', amount: Number(doc.amount || 0), metadata: { correct: doc.correct, incorrect: doc.incorrect } })
      }
    } catch (earnErr) {
      console.warn('Failed to save quiz earning record:', earnErr)
    }
    return NextResponse.json({ success: true, data: { ...doc, _id: res.insertedId } })
  } catch (err) {
    console.error("Failed to save quiz payout request", err)
    return NextResponse.json({ error: "Failed to save payout request" }, { status: 500 })
  }
}

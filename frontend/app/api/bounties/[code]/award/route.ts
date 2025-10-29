import { NextResponse } from 'next/server'
import { connectToDatabase, saveEarningToMongo } from '@/lib/mongodb'

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const code = params?.code
    if (!code) return NextResponse.json({ error: 'Missing bounty code' }, { status: 400 })

    const body = await request.json()
    const { userAddress, amount, reason } = body
    if (!userAddress || typeof amount === 'undefined') return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { db } = await connectToDatabase()
    const coll = db.collection('bounty_prizes')

    const doc = {
      bountyCode: code,
      userAddress: userAddress.toLowerCase(),
      amount: Number(amount),
      reason: reason || null,
      createdAt: new Date(),
    }

    const r = await coll.insertOne(doc)

    // Also save as a user earning
    try {
      await saveEarningToMongo({ userAddress: doc.userAddress, source: 'bounty', amount: doc.amount, metadata: { bountyCode: code, reason: doc.reason } })
    } catch (err) {
      console.warn('Failed to save bounty earning record:', err)
    }

    return NextResponse.json({ success: true, data: { ...doc, _id: r.insertedId } })
  } catch (err) {
    console.error('Failed to award bounty prize:', err)
    return NextResponse.json({ error: 'Failed to award bounty prize' }, { status: 500 })
  }
}

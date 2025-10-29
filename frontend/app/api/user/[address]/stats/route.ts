import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params
    const address = params?.address
    if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 })

    const addr = String(address).toLowerCase()
    const { db } = await connectToDatabase()

    const regs = db.collection('course_registrations')
    const quizColl = db.collection('quiz_payout_requests')

    const coursesJoined = await regs.countDocuments({ userAddress: addr })
    const quizzesCompleted = await quizColl.countDocuments({ userAddress: addr })

    return NextResponse.json({ success: true, data: { coursesJoined, quizzesCompleted } })
  } catch (err) {
    console.error('Failed to fetch user stats', err)
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
  }
}

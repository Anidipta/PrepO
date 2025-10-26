import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const mentor = url.searchParams.get('mentor')
    const status = url.searchParams.get('status') // optional: pending|confirmed
    if (!mentor) return NextResponse.json({ error: 'Missing mentor address' }, { status: 400 })

    const { db } = await connectToDatabase()
    const coursesColl = db.collection('courses')
    const regs = db.collection('course_registrations')

    const mentorLower = mentor.toLowerCase()
    const mentorCourses = await coursesColl.find({ mentorAddress: mentorLower }).project({ code: 1 }).toArray()
    const codes = mentorCourses.map((c: any) => c.code)
    if (codes.length === 0) return NextResponse.json({ success: true, data: [] })

    const query: any = { courseCode: { $in: codes } }
    if (status) query.status = status

    const found = await regs.find(query).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: found })
  } catch (err) {
    console.error('Failed to fetch registrations', err)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const mentor = url.searchParams.get("mentor")
    if (!mentor) return NextResponse.json({ error: "Missing mentor address" }, { status: 400 })
    const mentorLower = mentor.toLowerCase()

    const { db } = await connectToDatabase()
    const coursesColl = db.collection("courses")
    const regs = db.collection("course_registrations")

  // Find courses by this mentor (addresses normalized to lowercase)
  const mentorCourses = await coursesColl.find({ mentorAddress: mentorLower }).project({ code: 1 }).toArray()
    const codes = mentorCourses.map((c: any) => c.code)
    if (codes.length === 0) return NextResponse.json({ success: true, data: [] })

    // Find pending registrations for those codes
    const pending = await regs.find({ courseCode: { $in: codes }, status: "pending" }).toArray()
    return NextResponse.json({ success: true, data: pending })
  } catch (err) {
    console.error("Failed to fetch pending enrollments", err)
    return NextResponse.json({ error: "Failed to fetch pending enrollments" }, { status: 500 })
  }
}

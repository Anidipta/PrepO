import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")
    // return pending registrations
    const pending = await regs.find({ status: "pending" }).sort({ createdAt: -1 }).toArray()

    // attach course info (mentorAddress) when possible
    const courses = db.collection("courses")
    const enriched = await Promise.all(pending.map(async (r: any) => {
      const course = await courses.findOne({ code: r.courseCode })
      return { ...r, mentorAddress: course?.mentorAddress || null }
    }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (err) {
    console.error("tg75dfu73g pending error:", err)
    return NextResponse.json({ error: "Failed to fetch pending registrations" }, { status: 500 })
  }
}

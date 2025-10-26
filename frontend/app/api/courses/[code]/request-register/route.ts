import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request, { params }: { params?: { code?: string } }) {
  try {
    // Accept code either from the URL params or from the request body (fallback)
    const paramsSafe = params || {}
    let code = paramsSafe.code

    const body = await request.json().catch(() => ({}))
    // If URL param is missing or is the string 'undefined' use the body value
    if (!code || String(code).toLowerCase() === 'undefined') {
      code = body.courseCode || body.courseId || body.courseIdForChain || null
    }

    const courseId = body.courseId || body.courseIdForChain || body.courseCode || null
    const mentorAddress = body.mentorAddress || null
    const fee = Number(body.fee || 0)
    const requestedBy = body.requestedBy || null

    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })
    if (!courseId) return NextResponse.json({ error: "Missing courseId (Mongo _id)" }, { status: 400 })

    const { db } = await connectToDatabase()

    const collection = db.collection("onchain_course_registration_requests")
    const doc = {
      courseCode: code,
      courseId: String(courseId),
      mentorAddress: mentorAddress || null,
      fee,
      requestedBy,
      status: "pending",
      createdAt: new Date(),
    }

    const result = await collection.insertOne(doc)

    return NextResponse.json({ success: true, requestId: result.insertedId })
  } catch (err) {
    console.error("request-register error:", err)
    return NextResponse.json({ error: "Failed to create registration request" }, { status: 500 })
  }
}

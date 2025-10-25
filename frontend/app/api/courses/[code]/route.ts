import { type NextRequest, NextResponse } from "next/server"
import { getCourseByCodeFromMongo, savePendingCourseEnrollmentToMongo, deleteCourseFromMongo } from "@/lib/mongodb"

// Handler for fetching, enrolling, and deleting a course by its code
export async function GET(request: NextRequest, context: any) {
  try {
    // In Next.js dynamic route handlers, params may be a Promise — await it
    const params = await context.params
    const code = params?.code
    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })

    const course = await getCourseByCodeFromMongo(code)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("GET course error:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: any) {
  try {
    const params = await context.params
    const code = params?.code
    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })

    const body = await request.json()
    const userAddress = body.address || body.userAddress
    const amountPaid = Number(body.amountPaid || body.amount || 0)
    const txHash = body.txHash || body.transactionHash || null
    if (!userAddress) return NextResponse.json({ error: "Missing address" }, { status: 400 })

    // Save as pending enrollment; owner will confirm on-chain later which will mark confirmed
    await savePendingCourseEnrollmentToMongo({ userAddress, courseCode: code, amountPaid, txHash, status: "pending" })

    return NextResponse.json({ success: true, pending: true })
  } catch (error) {
    console.error("POST course enroll error:", error)
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const params = await context.params
    const code = params?.code
    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })
    const result = await deleteCourseFromMongo(code)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("DELETE course error:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}

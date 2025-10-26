import { getCoursesFromMongo, saveCourseToMongo } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { connectToDatabase } from "@/lib/mongodb"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS } from "@/lib/smart-contracts"

export async function GET(request: NextRequest) {
  try {
    const mentorAddress = request.nextUrl.searchParams.get("mentor")
    const courses = await getCoursesFromMongo(mentorAddress || undefined)
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let courseBody: any
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file") as File | null
      const title = form.get("title") as string
      const description = form.get("description") as string
      const category = (form.get("category") as string) || "General"
      const level = (form.get("level") as string) || "Beginner"
      const duration = (form.get("duration") as string) || "GO"
      const fee = parseFloat((form.get("fee") as string) || "0")
      const mentorAddress = (form.get("mentorAddress") as string) || ""

      const files: string[] = []
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filesDir = path.join(process.cwd(), "frontend", "public", "files")
        await fs.mkdir(filesDir, { recursive: true })
        const safeName = `${Date.now()}-${(file as any).name || "course.pdf"}`.replace(/[^a-zA-Z0-9.\-_/]/g, "-")
        await fs.writeFile(path.join(filesDir, safeName), buffer)
        files.push(`/files/${safeName}`)
      }

      courseBody = {
        title,
        description,
        category,
        level,
        duration,
        fee,
        mentorAddress,
        files,
      }
    } else {
      courseBody = await request.json()
    }

    const course = await saveCourseToMongo(courseBody)
    // After saving to Mongo, create or queue an on-chain registration request so the owner can register the course
    try {
      const { db } = await connectToDatabase()
      const reqs = db.collection("onchain_course_registration_requests")
      const doc = {
        courseCode: course.code,
        courseId: String(course._id),
        mentorAddress: course.mentorAddress || null,
        fee: Number(course.fee || 0),
        status: "pending",
        createdAt: new Date(),
      }
      const inserted = await reqs.insertOne(doc)

      // We queue an on-chain registration request so the owner can register the course
      // Server-side automatic on-chain registration is intentionally disabled to keep the flow simple
      // and ensure the owner performs on-chain registration/approvals via MetaMask when needed.
    } catch (reqErr) {
      console.warn("Failed to queue on-chain registration request:", reqErr)
    }
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}

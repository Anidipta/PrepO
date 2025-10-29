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
        // Use the application's `public/files` directory if available. On many
        // deployment platforms the filesystem is read-only or the process cwd
        // differs; try to write to `process.cwd()/public/files` and fall back
        // to skipping file writes when it's not possible.
        const filesDir = path.join(process.cwd(), "public", "files")
        await fs.mkdir(filesDir, { recursive: true })
        const safeName = `${Date.now()}-${(file as any).name || "course.pdf"}`.replace(/[^a-zA-Z0-9.\-_/]/g, "-")
        try {
          await fs.writeFile(path.join(filesDir, safeName), buffer)
          files.push(`/files/${safeName}`)
        } catch (fsErr) {
          // Filesystem may be readonly in production (serverless). Log a warning
          // and continue without failing the whole request. The course will be
          // created but without the uploaded file saved to disk.
          console.warn('Failed to save uploaded file to disk, continuing without file:', fsErr)
        }
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
      // Return a little more information so deployments surface the root cause
      // (but avoid leaking secrets). The message and stack (first line) are
      // helpful for debugging.
      const message = (error as any)?.message || 'Unknown error'
      const stack = (error as any)?.stack ? String(error).split('\n')[0] : undefined
      return NextResponse.json({ error: "Failed to create course", message, stack }, { status: 500 })
    }
}

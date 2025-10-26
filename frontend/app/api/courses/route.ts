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

      // If server has owner credentials, attempt to register immediately on-chain
      const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY
      const RPC_URL = process.env.CELO_RPC_URL || process.env.RPC_URL || "https://forno.celo.org"
      if (OWNER_PRIVATE_KEY) {
        try {
          const provider = new ethers.JsonRpcProvider(RPC_URL)
          const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider)
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ["function createCourse(string,address,uint256) external"], ownerWallet)
          const priceWei = ethers.parseEther(String(course.fee || 0))
          const tx = await contract.createCourse(String(course._id), course.mentorAddress || ownerWallet.address, priceWei)
          const receipt = await tx.wait()
          // mark request completed
          await reqs.updateOne({ _id: inserted.insertedId }, { $set: { status: "completed", txHash: tx.hash, completedAt: new Date() } })
          // update course record to note on-chain registration
          const coursesColl = db.collection("courses")
          await coursesColl.updateOne({ _id: course._id }, { $set: { onchain: true, onchainTxHash: tx.hash, updatedAt: new Date() } })
        } catch (onchainErr) {
          console.warn("Automatic on-chain course registration failed, left queued:", onchainErr)
          // leave the request pending for manual owner processing
        }
      }
    } catch (reqErr) {
      console.warn("Failed to queue on-chain registration request:", reqErr)
    }
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}

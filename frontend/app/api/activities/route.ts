import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const url = new URL(request.url)
    const addr = url.searchParams.get("address")

    const items: any[] = []

    if (addr) {
      // Fetch activities related to this address: pdf analyses, generated quizzes, course registrations, bounty registrations
      const analyses = await db.collection("pdf_analyses").find({ userAddress: addr }).toArray()
      const quizzes = await db.collection("generated_quizzes").find({ userAddress: addr }).toArray()
      const courseRegs = await db.collection("course_registrations").find({ userAddress: addr }).toArray()
      const bountyRegs = await db.collection("bounty_registrations").find({ userAddress: addr }).toArray()

      analyses.forEach((a: any) => {
        items.push({ type: "analysis", title: a.fileName, description: a.summary?.split("\n").slice(0, 2).join(" ") || "PDF analysis", time: a.createdAt, userAddress: a.userAddress, reward: "" })
      })

      quizzes.forEach((q: any) => {
        items.push({ type: "quiz", title: q.fileName || "Generated Quiz", description: `Questions: ${q.quiz?.questions?.length || 0}`, time: q.createdAt, userAddress: q.userAddress, reward: "" })
      })

      courseRegs.forEach((r: any) => {
        items.push({ type: "course_registration", title: `Enrolled in ${r.courseCode}`, description: `Status: ${r.status || "pending"}`, time: r.createdAt, userAddress: r.userAddress, reward: "" })
      })

      bountyRegs.forEach((r: any) => {
        items.push({ type: "bounty_registration", title: `Entered ${r.bountyCode}`, description: `Paid ${r.amountPaid} CELO`, time: r.createdAt, userAddress: r.userAddress, reward: "" })
      })
    } else {
      // Global recent activities (legacy)
      const analyses = await db.collection("pdf_analyses").find({}).toArray()
      const quizzes = await db.collection("generated_quizzes").find({}).toArray()
      const courses = await db.collection("courses").find({}).toArray()
      const bounties = await db.collection("bounties").find({}).toArray()

      analyses.forEach((a: any) => {
        items.push({ type: "analysis", title: a.fileName, description: a.summary?.split("\n").slice(0, 2).join(" ") || "PDF analysis", time: a.createdAt, userAddress: a.userAddress, reward: "" })
      })

      quizzes.forEach((q: any) => {
        items.push({ type: "quiz", title: q.fileName || "Generated Quiz", description: `Questions: ${q.quiz?.questions?.length || 0}`, time: q.createdAt, userAddress: q.userAddress, reward: "" })
      })

      courses.forEach((c: any) => {
        items.push({ type: "course", title: c.title, description: c.description, time: c.createdAt, userAddress: c.mentorAddress, reward: "" })
      })

      bounties.forEach((b: any) => {
        items.push({ type: "bounty", title: b.title, description: b.description, time: b.createdAt, userAddress: b.mentorAddress, reward: `${b.prizePool || 0} CELO` })
      })
    }

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json({ success: true, data: items.slice(0, 50) })
  } catch (err) {
    console.error("Failed to fetch activities", err)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

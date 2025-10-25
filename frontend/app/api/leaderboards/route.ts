import { getCoursesFromMongo, connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const bountyCode = url.searchParams.get("bounty")

    // If a bounty code is provided, return leaderboard for that bounty from registrations
    if (bountyCode) {
      const { db } = await connectToDatabase()
      const regs = db.collection("bounty_registrations")
      const rows = await regs.find({ bountyCode }).sort({ createdAt: -1 }).limit(50).toArray()

      const entries = rows.map((r: any, idx: number) => ({
        rank: idx + 1,
        address: r.userAddress,
        score: "-",
        celo: `+${Number(r.amountPaid || 0).toFixed(3)} CELO`,
        discount: r.isEnrolled ? "50% discount" : "No discount",
      }))

      return Response.json([
        {
          title: `Bounty ${bountyCode} Leaderboard`,
          category: "Bounty",
          entries,
        },
      ])
    }

    // fallback: course leaderboards as before
    const courses = await getCoursesFromMongo()

  const leaderboards = courses.map((course: any) => ({
      title: `${course.title} Leaderboard`,
      category: course.category,
      entries: [
        { rank: 1, address: "0xAb12...Ff34", score: "95.0%", celo: "+50.0 CELO", discount: "50% bounty discount" },
        { rank: 2, address: "0xCd56...Gh78", score: "92.0%", celo: "+45.0 CELO", discount: "50% bounty discount" },
        { rank: 3, address: "0xEf90...Ij12", score: "89.0%", celo: "+40.0 CELO", discount: "50% bounty discount" },
      ],
    }))

    return Response.json(leaderboards)
  } catch (error) {
    console.error("[v0] Error fetching leaderboards:", error)
    return Response.json({ error: "Failed to fetch leaderboards" }, { status: 500 })
  }
}

import { getCoursesFromMongo } from "@/lib/mongodb"

export async function GET() {
  try {
    const courses = await getCoursesFromMongo()

    const leaderboards = courses.map((course) => ({
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

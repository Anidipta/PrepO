// Leaderboard calculation and management utilities

export interface LeaderboardEntry {
  rank: number
  address: string
  score: number
  accuracy: number
  completionTime: number
  celoEarned: number
  isTopPerformer: boolean
}

export interface CourseLeaderboard {
  courseId: string
  courseName: string
  entries: LeaderboardEntry[]
  topPerformers: LeaderboardEntry[]
}

// Calculate leaderboard rankings based on score and completion time
export const calculateLeaderboardRanking = (
  entries: Array<{
    address: string
    score: number
    accuracy: number
    completionTime: number
    celoEarned: number
  }>,
): LeaderboardEntry[] => {
  // Sort by score (primary) and completion time (secondary)
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.completionTime - b.completionTime
  })

  return sorted.map((entry, index) => ({
    rank: index + 1,
    address: entry.address,
    score: entry.score,
    accuracy: entry.accuracy,
    completionTime: entry.completionTime,
    celoEarned: entry.celoEarned,
    isTopPerformer: index < 3, // Top 3 are performers
  }))
}

// Get top performers for bounty discount eligibility
export const getTopPerformers = (leaderboard: LeaderboardEntry[]): LeaderboardEntry[] => {
  return leaderboard.filter((entry) => entry.isTopPerformer)
}

// Check if student qualifies for bounty discount
export const qualifiesForBountyDiscount = (studentAddress: string, courseLeaderboard: LeaderboardEntry[]): boolean => {
  const entry = courseLeaderboard.find((e) => e.address === studentAddress)
  return entry ? entry.isTopPerformer : false
}

// Calculate CELO rewards based on quiz performance
export const calculateQuizReward = (accuracy: number, baseReward = 1.0): number => {
  // Reward scales with accuracy
  // 100% accuracy = full reward
  // 50% accuracy = 0.5x reward
  // Below 50% = no reward
  if (accuracy < 0.5) return 0
  return baseReward * accuracy
}

// Format leaderboard for display
export const formatLeaderboardEntry = (entry: LeaderboardEntry): string => {
  return `#${entry.rank} - ${entry.address} (Score: ${entry.score}%, Accuracy: ${entry.accuracy}%)`
}

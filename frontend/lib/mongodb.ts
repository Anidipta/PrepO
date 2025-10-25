import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/prepo"
const DB_NAME = "prepo"
const USERS_COLLECTION = "users"
const COURSES_COLLECTION = "courses"
const BOUNTIES_COLLECTION = "bounties"

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(DB_NAME)

    // Ensure collections and indexes exist
    await ensureCollectionsAndIndexes(db)

    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

async function ensureCollectionsAndIndexes(db: any) {
  try {
    const existing = await db.listCollections().toArray()
    const names = existing.map((c: any) => c.name)

    if (!names.includes(USERS_COLLECTION)) {
      await db.createCollection(USERS_COLLECTION)
    }
    if (!names.includes(COURSES_COLLECTION)) {
      await db.createCollection(COURSES_COLLECTION)
    }
    if (!names.includes(BOUNTIES_COLLECTION)) {
      await db.createCollection(BOUNTIES_COLLECTION)
    }

    // Ensure unique index on address for users
    const usersColl = db.collection(USERS_COLLECTION)
    await usersColl.createIndex({ address: 1 }, { unique: true })

    // Additional helpful indexes
    const activities = await db.listCollections({ name: "progress" }).toArray()
    if (activities.length === 0) {
      await db.createCollection("progress")
    }
      const reg = await db.listCollections({ name: "course_registrations" }).toArray()
      if (reg.length === 0) {
        await db.createCollection("course_registrations")
      }
  } catch (err) {
    console.warn("ensureCollectionsAndIndexes warning:", err)
  }
}

export async function saveUserToMongo(userData: {
  address: string
  name: string
  role: "mentor" | "mentee"
  createdAt?: Date
  updatedAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(USERS_COLLECTION)

    const result = await collection.updateOne(
      { address: userData.address },
      {
        $set: {
          ...userData,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return result
  } catch (error) {
    console.error("Error saving user to MongoDB:", error)
    throw error
  }
}

export async function getUserFromMongo(address: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(USERS_COLLECTION)

    // find all users with this address (cleanup duplicates if present)
    const users = await collection.find({ address }).toArray()
    if (!users || users.length === 0) return null
    // keep the first, delete the rest
    if (users.length > 1) {
      const keep = users[0]
      const removeIds = users.slice(1).map((u: any) => u._id)
      try {
        await collection.deleteMany({ _id: { $in: removeIds } })
        console.info(`Removed ${removeIds.length} duplicate user records for ${address}`)
      } catch (e) {
        console.warn("Failed to remove duplicate users", e)
      }
      return keep
    }

    return users[0]
  } catch (error) {
    console.error("Error fetching user from MongoDB:", error)
    throw error
  }
}

// Generate unique 5-digit + 2-character code
function generateUniqueCode(): string {
  const digits = Math.floor(Math.random() * 90000) + 10000
  const chars = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `${digits}${chars}`
}

export async function saveCourseToMongo(courseData: {
  title: string
  description: string
  category: string
  level: string
  duration: string
  fee: number
  mentorAddress: string
  files?: string[]
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(COURSES_COLLECTION)

    const courseWithCode = {
      ...courseData,
      code: generateUniqueCode(),
      createdAt: courseData.createdAt || new Date(),
      enrollments: 0,
      avgScore: 0,
    }

    const result = await collection.insertOne(courseWithCode)
    return { ...courseWithCode, _id: result.insertedId }
  } catch (error) {
    console.error("Error saving course to MongoDB:", error)
    throw error
  }
}

export async function getCoursesFromMongo(mentorAddress?: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(COURSES_COLLECTION)

    const query = mentorAddress ? { mentorAddress } : {}
    const courses = await collection.find(query).toArray()
    return courses
  } catch (error) {
    console.error("Error fetching courses from MongoDB:", error)
    throw error
  }
}

export async function getCourseByCodeFromMongo(code: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(COURSES_COLLECTION)

    const course = await collection.findOne({ code })
    return course
  } catch (error) {
    console.error("Error fetching course by code:", error)
    throw error
  }
}

// Record a course enrollment server-side (used when a mentee enrolls via the app)
export async function saveCourseEnrollmentToMongo(data: {
  userAddress: string
  courseCode: string
  amountPaid: number
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")
    const courses = db.collection(COURSES_COLLECTION)

    const doc = {
      ...data,
      createdAt: data.createdAt || new Date(),
    }

    await regs.insertOne(doc)
    // increment enrollments count on course
    await courses.updateOne({ code: data.courseCode }, { $inc: { enrollments: 1 }, $set: { updatedAt: new Date() } })
    return { ...doc }
  } catch (err) {
    console.error("Error saving course enrollment:", err)
    throw err
  }
}

// Save a pending enrollment (student paid on-chain, awaiting owner confirmation)
export async function savePendingCourseEnrollmentToMongo(data: {
  userAddress: string
  courseCode: string
  amountPaid: number
  txHash?: string
  status?: "pending" | "confirmed"
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")

    const doc = {
      ...data,
      status: data.status || "pending",
      createdAt: data.createdAt || new Date(),
    }

    const result = await regs.insertOne(doc)
    return { ...doc, _id: result.insertedId }
  } catch (err) {
    console.error("Error saving pending course enrollment:", err)
    throw err
  }
}

// Confirm a pending enrollment (called after owner on-chain confirmation)
export async function confirmCourseEnrollmentInMongo(data: {
  userAddress: string
  courseCode: string
  amountPaid: number
  txHash?: string
}) {
  try {
    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")
    const courses = db.collection(COURSES_COLLECTION)

    // Find a pending registration for this user/course
    const existing = await regs.findOne({ userAddress: data.userAddress, courseCode: data.courseCode, status: "pending" })
    if (existing) {
      await regs.updateOne({ _id: existing._id }, { $set: { status: "confirmed", txHash: data.txHash || existing.txHash, amountPaid: data.amountPaid, confirmedAt: new Date() } })
    } else {
      // Insert a confirmed record if none existed
      await regs.insertOne({ ...data, status: "confirmed", createdAt: new Date(), confirmedAt: new Date() })
    }

    // increment enrollments count on course
    await courses.updateOne({ code: data.courseCode }, { $inc: { enrollments: 1 }, $set: { updatedAt: new Date() } })

    return { success: true }
  } catch (err) {
    console.error("Error confirming course enrollment:", err)
    throw err
  }
}

export async function deleteCourseFromMongo(code: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(COURSES_COLLECTION)

    const result = await collection.deleteOne({ code })
    return result
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

export async function updateCourseWithModules(code: string, modules: any[]) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(COURSES_COLLECTION)

    const result = await collection.updateOne(
      { code },
      {
        $set: {
          modules,
          updatedAt: new Date(),
        },
      },
    )

    return result
  } catch (error) {
    console.error("Error updating course modules:", error)
    throw error
  }
}

export async function saveUserProgressToMongo(progressData: {
  userAddress: string
  courseCode: string
  completedLessons: string[]
  currentModule: number
  progressPercentage: number
  enrolledAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection("progress")

    const result = await collection.updateOne(
      { userAddress: progressData.userAddress, courseCode: progressData.courseCode },
      {
        $set: {
          ...progressData,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return result
  } catch (error) {
    console.error("Error saving progress:", error)
    throw error
  }
}

export async function getUserProgressFromMongo(userAddress: string, courseCode: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection("progress")

    const progress = await collection.findOne({ userAddress, courseCode })
    return progress
  } catch (error) {
    console.error("Error fetching progress:", error)
    throw error
  }
}

export async function saveBountyToMongo(bountyData: {
  title: string
  description: string
  category: string
  difficulty: string
  prizePool: number
  entryFee: number
  topWinners: number
  maxEntries: number
  deadline: string
  mentorAddress: string
  linkedCourse?: string
  requirements?: string[]
  files?: string[]
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(BOUNTIES_COLLECTION)

    // Allow caller to provide a code (client-generated) or create one server-side
    const code = (bountyData as any).code || generateUniqueCode()

    const bountyWithCode = {
      ...bountyData,
      code,
      createdAt: bountyData.createdAt || new Date(),
      entries: 0,
      status: "Active",
      // mark whether the bounty prizePool has been funded on-chain
      funded: !!(bountyData as any).funded || false,
      txHash: (bountyData as any).txHash || null,
    }

    const result = await collection.insertOne(bountyWithCode)
    return { ...bountyWithCode, _id: result.insertedId }
  } catch (error) {
    console.error("Error saving bounty to MongoDB:", error)
    throw error
  }
}

/**
 * Save a bounty registration (participant entering a bounty)
 */
export async function saveBountyRegistrationToMongo(data: {
  bountyCode: string
  userAddress: string
  amountPaid: number
  txHash?: string
  isEnrolled?: boolean
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const regs = db.collection("bounty_registrations")
    const bounties = db.collection(BOUNTIES_COLLECTION)

    const doc = {
      ...data,
      createdAt: data.createdAt || new Date(),
    }

    await regs.insertOne(doc)

    // Update bounty entries count
    await bounties.updateOne({ code: data.bountyCode }, { $inc: { entries: 1 }, $set: { updatedAt: new Date() } })

    // Update prizePool locally: approximate 90% of the entry fee goes to prize pool
    const entryFee = data.amountPaid - 0.005 // subtract platform fee (approx)
    const toPrize = Math.max(0, entryFee * 0.9)
    await bounties.updateOne({ code: data.bountyCode }, { $inc: { prizePool: toPrize } })

    return { ...doc }
  } catch (err) {
    console.error("Error saving bounty registration:", err)
    throw err
  }
}

export async function getBountiesFromMongo(mentorAddress?: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(BOUNTIES_COLLECTION)

    const query = mentorAddress ? { mentorAddress } : {}
    const bounties = await collection.find(query).toArray()
    return bounties
  } catch (error) {
    console.error("Error fetching bounties from MongoDB:", error)
    throw error
  }
}

export async function getBountyByCodeFromMongo(code: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(BOUNTIES_COLLECTION)

    const bounty = await collection.findOne({ code })
    return bounty
  } catch (error) {
    console.error("Error fetching bounty by code:", error)
    throw error
  }
}

export async function deleteBountyFromMongo(code: string) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection(BOUNTIES_COLLECTION)

    const result = await collection.deleteOne({ code })
    return result
  } catch (error) {
    console.error("Error deleting bounty:", error)
    throw error
  }
}

// Save AI PDF analysis (summary + bullets + generated quiz)
export async function savePdfAnalysisToMongo(data: {
  userAddress: string
  fileName: string
  fileUrl?: string
  summary: string
  bullets: string[]
  quiz: any
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection("pdf_analyses")

    const doc = {
      ...data,
      createdAt: data.createdAt || new Date(),
    }

    const result = await collection.insertOne(doc)
    return { ...doc, _id: result.insertedId }
  } catch (error) {
    console.error("Error saving PDF analysis to MongoDB:", error)
    throw error
  }
}

export async function saveGeneratedQuizToMongo(data: {
  userAddress: string
  fileName?: string
  fileUrl?: string
  quiz: any
  createdAt?: Date
}) {
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection("generated_quizzes")

    const doc = {
      ...data,
      createdAt: data.createdAt || new Date(),
    }

    const result = await collection.insertOne(doc)
    return { ...doc, _id: result.insertedId }
  } catch (error) {
    console.error("Error saving generated quiz to MongoDB:", error)
    throw error
  }
}

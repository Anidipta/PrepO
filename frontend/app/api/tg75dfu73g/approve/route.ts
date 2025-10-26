import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS } from "@/lib/smart-contracts"

const RPC_URL = process.env.CELO_RPC_URL || process.env.RPC_URL || "https://forno.celo.org"
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || process.env.CONTRACT_OWNER_PRIVATE_KEY

export async function POST(request: Request) {
  try {
    if (!OWNER_PRIVATE_KEY) return NextResponse.json({ error: "Server not configured with OWNER_PRIVATE_KEY" }, { status: 500 })

    const body = await request.json()
    const registrationId = body.registrationId
    if (!registrationId) return NextResponse.json({ error: "Missing registrationId" }, { status: 400 })

    const { db } = await connectToDatabase()
    const regs = db.collection("course_registrations")
    const courses = db.collection("courses")

    const reg = await regs.findOne({ _id: typeof registrationId === 'string' ? new (require('mongodb').ObjectId)(registrationId) : registrationId })
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 })

    const course = await courses.findOne({ code: reg.courseCode })
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider)

    const COURSE_ABI = ["function courses(string) view returns (address mentor, string courseId, uint256 price, bool exists)", "function createCourse(string,address,uint256) external", "function confirmEnrollment(string _courseId, address _student)" ]
    const contract = new ethers.Contract(CONTRACT_ADDRESS, COURSE_ABI, ownerWallet)

    // Ensure course exists on-chain; if not, create it first
    const courseIdForChain = course._id ? (typeof course._id === 'string' ? course._id : String(course._id)) : (course.code || '')
    let onChainExists = false
    try {
      const onchain = await contract.courses(courseIdForChain)
      onChainExists = !!(onchain && (onchain.exists === true || onchain[3] === true))
    } catch (e) {
      onChainExists = false
    }

    if (!onChainExists) {
      // createCourse
      const priceWei = ethers.parseEther(String(course.fee || 0))
      const tx = await contract.createCourse(String(courseIdForChain), course.mentorAddress || ownerWallet.address, priceWei)
      await tx.wait()
      // update course record
      await courses.updateOne({ _id: course._id }, { $set: { onchain: true, onchainTxHash: tx.hash, updatedAt: new Date() } })
    }

    // Now confirm enrollment (this should trigger contract's internal payout logic)
    const confirmTx = await contract.confirmEnrollment(String(courseIdForChain), reg.userAddress)
    const receipt = await confirmTx.wait()

    // mark registration as confirmed
    await regs.updateOne({ _id: reg._id }, { $set: { status: "confirmed", confirmTxHash: confirmTx.hash, confirmedAt: new Date() } })

    return NextResponse.json({ success: true, confirmTx: confirmTx.hash, receipt })
  } catch (err) {
    console.error("tg75dfu73g approve error:", err)
    return NextResponse.json({ error: "Failed to approve registration" }, { status: 500 })
  }
}

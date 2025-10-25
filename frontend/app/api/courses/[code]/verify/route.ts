import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS } from "@/lib/smart-contracts"
import { getCourseByCodeFromMongo, confirmCourseEnrollmentInMongo } from "@/lib/mongodb"

const RPC_URL = process.env.CELO_RPC_URL || process.env.RPC_URL || "https://forno.celo.org"
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || process.env.CONTRACT_OWNER_PRIVATE_KEY

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const code = params?.code
    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })

    const body = await request.json()
    const txHash = body.txHash
    if (!txHash) return NextResponse.json({ error: "Missing txHash in body" }, { status: 400 })

    if (!OWNER_PRIVATE_KEY) {
      console.error("OWNER_PRIVATE_KEY not set in env")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    // Connect to RPC
    const provider = new ethers.JsonRpcProvider(RPC_URL)

    // Fetch transaction
    const tx = await provider.getTransaction(txHash)
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

    // Ensure transaction went to the contract address
    if (!tx.to || tx.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: "Transaction not sent to contract address" }, { status: 400 })
    }

    // Fetch course to verify expected amount (optional)
    const course = await getCourseByCodeFromMongo(code)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    // tx.value is a bigint in wei
    const paidWei = tx.value as bigint
    const paidCELO = Number(ethers.formatEther(paidWei))

    // Compute mentor share (80%) in wei
    const mentorShareWei = (paidWei * 80n) / 100n

  // Create owner signer
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider)

  // Student address that sent the enrollment transaction
  const studentAddress = (tx.from || body.fromAddress) as string
  if (!studentAddress) return NextResponse.json({ error: "Student address not found" }, { status: 400 })

  // Call contract to confirm enrollment (owner releases funds to mentor/platform)
  const CONFIRM_ABI = ["function confirmEnrollment(string _courseId, address _student)"]
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONFIRM_ABI, ownerWallet)
  const confirmTx = await contract.confirmEnrollment(code, studentAddress)
  const confirmReceipt = await confirmTx.wait()

  // Save enrollment record in MongoDB (mark as enrolled/confirmed)
  await confirmCourseEnrollmentInMongo({ userAddress: studentAddress, courseCode: code, amountPaid: paidCELO, txHash: confirmTx.hash })

  return NextResponse.json({ success: true, paid: paidCELO, confirmTx: confirmTx.hash, receipt: confirmReceipt })
  } catch (err) {
    console.error("verify-enrollment error:", err)
    return NextResponse.json({ error: "Failed to verify enrollment" }, { status: 500 })
  }
}

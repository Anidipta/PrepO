import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS } from "@/lib/smart-contracts"
import { getCourseByCodeFromMongo, confirmCourseEnrollmentInMongo } from "@/lib/mongodb"

const RPC_URL = process.env.CELO_RPC_URL || process.env.RPC_URL || "https://forno.celo.org"

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params
    const code = params?.code
    if (!code) return NextResponse.json({ error: "Missing course code" }, { status: 400 })

    const body = await request.json()
    const txHash = body.txHash
    if (!txHash) return NextResponse.json({ error: "Missing txHash in body" }, { status: 400 })


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

  // Student address that sent the enrollment transaction
  const studentAddress = (tx.from || body.fromAddress) as string
  if (!studentAddress) return NextResponse.json({ error: "Student address not found" }, { status: 400 })

  // Instead of doing an on-chain confirm here, mark the enrollment as confirmed in MongoDB
  await confirmCourseEnrollmentInMongo({ userAddress: studentAddress, courseCode: code, amountPaid: paidCELO, txHash })
  return NextResponse.json({ success: true, paid: paidCELO, recordedTx: txHash })
  } catch (err) {
    console.error("verify-enrollment error:", err)
    return NextResponse.json({ error: "Failed to verify enrollment" }, { status: 500 })
  }
}

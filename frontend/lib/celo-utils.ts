import { createPublicClient, http } from "viem"
import { celoSepolia } from "viem/chains"

const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http("https://forno.celo-sepolia.celo-testnet.org"),
})

export async function getCeloBalance(address: string): Promise<string> {
  try {
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    })
    // Convert from wei to CELO (18 decimals)
    const celoAmount = Number(balance) / 1e18
    return celoAmount.toFixed(2)
  } catch (error) {
    console.error("Error fetching CELO balance:", error)
    return "0.00"
  }
}

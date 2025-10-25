const hre = require("hardhat");

async function main() {
  console.log("Deploying PrepO contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "CELO");

  // Deploy contract
  const PrepO = await hre.ethers.getContractFactory("PrepO");
  const contract = await PrepO.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ PrepO deployed to:", contractAddress);
  console.log("Platform Owner:", deployer.address);
  
  console.log("\n🔍 Verify on Blockscout:");
  console.log(`https://celo-sepolia.blockscout.com/address/${contractAddress}`);
  
  console.log("\n📋 Save this address for your backend:");
  console.log("CONTRACT_ADDRESS=" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
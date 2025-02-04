import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying GoldPeggedStablecoin...");

  // ✅ Explicitly set provider (Fix for HardhatEthersProvider issue)
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  console.log(`📜 Deploying with account: ${await wallet.getAddress()}`);

  // ✅ Deploy contract using explicitly connected wallet
  const GoldStablecoin = await ethers.getContractFactory("GoldPeggedStablecoin", wallet);
  const goldStablecoin = await GoldStablecoin.deploy("0xYourChainlinkPriceFeedAddress");

  console.log("⏳ Waiting for deployment confirmation...");
  await goldStablecoin.waitForDeployment();

  console.log(`✅ GoldPeggedStablecoin deployed to: ${await goldStablecoin.getAddress()}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
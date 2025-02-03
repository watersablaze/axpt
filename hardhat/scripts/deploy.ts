import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GoldPeggedStablecoin...");

  // ✅ Get signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // ✅ Deploy contract
  const GoldStablecoin = await ethers.getContractFactory("GoldPeggedStablecoin");
  const goldStablecoin = await GoldStablecoin.deploy("0xYourChainlinkPriceFeedAddress");

  await goldStablecoin.waitForDeployment(); // 🔹 Ensure deployment completes

  // ✅ Use `.address` instead of `getAddress()`
  console.log(`GoldPeggedStablecoin deployed to: ${goldStablecoin.address}`);
}

// ✅ Handle errors properly
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
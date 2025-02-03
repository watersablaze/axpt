import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GoldPeggedStablecoin...");

  // 🔹 Deploy contract
  const GoldStablecoin = await ethers.getContractFactory("GoldPeggedStablecoin");
  const goldStablecoin = await GoldStablecoin.deploy("0xYourChainlinkPriceFeedAddress");

  await goldStablecoin.waitForDeployment(); // 🔹 Ensure deployment is complete

  // ✅ Use `.address` instead of `getAddress()`
  console.log(`GoldPeggedStablecoin deployed to: ${goldStablecoin.address}`);
}

// ✅ Handle errors properly
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
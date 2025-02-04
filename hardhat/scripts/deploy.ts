import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GoldPeggedStablecoin...");

  // ✅ Correctly get deployer for Ethers v6
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${await deployer.getAddress()}`);

  // ✅ Deploy contract
  const GoldStablecoin = await ethers.getContractFactory("GoldPeggedStablecoin", deployer);
  const goldStablecoin = await GoldStablecoin.deploy("0xYourChainlinkPriceFeedAddress");

  await goldStablecoin.waitForDeployment(); // ✅ Correct method for Ethers v6

  console.log(`GoldPeggedStablecoin deployed to: ${await goldStablecoin.getAddress()}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
import hre from "hardhat";

async function main() {
  console.log("Deploying GoldPeggedStablecoin...");

  // ✅ Fix signer retrieval for Ethers v6
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${await deployer.getAddress()}`);

  // ✅ Deploy contract
  const GoldStablecoin = await hre.ethers.getContractFactory("GoldPeggedStablecoin", deployer);
  const goldStablecoin = await GoldStablecoin.deploy("0xYourChainlinkPriceFeedAddress");

  await goldStablecoin.waitForDeployment(); // ✅ Ethers v6 deployment method

  console.log(`GoldPeggedStablecoin deployed to: ${await goldStablecoin.getAddress()}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying GoldPeggedStablecoin...");

  const deployer = (await ethers.getSigners())[0];
  console.log(`Deploying with account: ${await deployer.getAddress()}`);

  const GoldStablecoin = await ethers.getContractFactory("GoldPeggedStablecoin");
  const goldStablecoin = await GoldStablecoin.deploy("0xYourChainlinkPriceFeedAddress");

  await goldStablecoin.waitForDeployment();
  console.log(`GoldPeggedStablecoin deployed to: ${await goldStablecoin.getAddress()}`);

  // ✅ Verify contract on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    await run("verify:verify", {
      address: await goldStablecoin.getAddress(),
      constructorArguments: ["0xYourChainlinkPriceFeedAddress"],
    });
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
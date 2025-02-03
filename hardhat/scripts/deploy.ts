import { ethers } from "hardhat";

async function main() {
  const goldPriceFeed = "0xYOUR_CHAINLINK_GOLD_PRICE_FEED"; // Replace with Sepolia Chainlink oracle address

  console.log("Deploying GoldPeggedStablecoin...");

  const Stablecoin = await ethers.getContractFactory("GoldPeggedStablecoin");
  const stablecoin = await Stablecoin.deploy(goldPriceFeed);

  await stablecoin.waitForDeployment();

  console.log("GoldPeggedStablecoin deployed to:", await stablecoin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
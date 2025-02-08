// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const GoldPeggedStablecoin = await ethers.getContractFactory("GoldPeggedStablecoin");
  console.log("🚀 Deploying GoldPeggedStablecoin...");

  const contract = await GoldPeggedStablecoin.deploy("<CHAINLINK_PRICE_FEED_ADDRESS>");
  await contract.deployed();

  console.log(`✅ Contract deployed at: ${contract.address}`);

  // Save deployed address for frontend
  const addresses = { GoldPeggedStablecoin: contract.address };
  fs.writeFileSync("./deployments/addresses.json", JSON.stringify(addresses, null, 2));

  console.log("✅ Address saved to deployments/addresses.json");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
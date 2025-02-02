const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Replace with actual Chainlink Gold Price Feed
  const goldPriceFeedAddress = "0x214C2d62016B1C8bE01c7AeA1f9f495313B90999"; 

  const Stablecoin = await hre.ethers.getContractFactory("GoldPeggedStablecoin");
  const stablecoin = await Stablecoin.deploy(goldPriceFeedAddress);

  console.log("Stablecoin deployed to:", stablecoin.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
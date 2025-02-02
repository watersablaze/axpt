const hre = require("hardhat");

async function main() {
  const priceFeedAddress = "0x2149f3b20Fb5cFbC17c9FC9A150543f5f9dA4C11"; // 🔹 Chainlink Sepolia Gold Price Feed
  const GoldStablecoin = await hre.ethers.getContractFactory("GoldPeggedStablecoin");
  const stablecoin = await GoldStablecoin.deploy(priceFeedAddress);

  await stablecoin.deployed();
  console.log(`✅ GoldPeggedStablecoin deployed at: ${stablecoin.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
import { ethers } from "hardhat";

async function main() {
  const Contract = await ethers.getContractFactory(“Gold”PeggedStablecoin); // Replace with actual contract name
  const contract = await Contract.deploy();

  await contract.deployed();
  console.log("✅ Contract deployed at:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

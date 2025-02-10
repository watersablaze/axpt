import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// ✅ Fix: Use `ethers.providers.JsonRpcProvider` (Ethers v6 uses `new ethers.JsonRpcProvider`)
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contractABI = [
  "constructor(address _goldPriceFeed)",
];
const contractBytecode = "0x..."; // ✅ Replace with actual contract bytecode

async function deployContract() {
  console.log("🚀 Deploying GoldPeggedStablecoin...");

  const ContractFactory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);
  const contract = await ContractFactory.deploy(process.env.CHAINLINK_PRICE_FEED);

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  console.log(`✅ Contract deployed at: ${await contract.getAddress()}`);
}

deployContract().catch(console.error);
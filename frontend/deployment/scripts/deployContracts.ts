import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// ✅ Ethers v6: Use `JsonRpcProvider`
const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

const contractABI = [
  "constructor(address _goldPriceFeed)",
];
const contractBytecode = "0x..."; // ✅ Replace with actual contract bytecode

async function deployContract() {
  console.log("🚀 Deploying GoldPeggedStablecoin...");

  const contractFactory = new ContractFactory(contractABI, contractBytecode, wallet);
  const contract = await contractFactory.deploy(process.env.CHAINLINK_PRICE_FEED);

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  console.log(`✅ Contract deployed at: ${await contract.getAddress()}`);
}

deployContract().catch(console.error);
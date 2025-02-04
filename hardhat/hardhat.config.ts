import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify"; // ✅ Ensure verification works
import "dotenv/config";

const config = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
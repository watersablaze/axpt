import "@nomicfoundation/hardhat-toolbox"

export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.RPC_URL!,
      accounts: [process.env.EXECUTION_PRIVATE_KEY!],
    },
  },
}
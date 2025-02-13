import { ethers } from "ethers";
import contractAbi from "../../frontend/abi/GoldPeggedStablecoin.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;

// Function to get the contract instance
export const getContract = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer); // ✅ Access `.abi`
  } else {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider); // ✅ Access `.abi`
  }
};
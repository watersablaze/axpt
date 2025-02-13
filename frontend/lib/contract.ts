import { ethers } from "ethers";
import contractAbi from "@/frontend/abi/GoldPeggedStablecoin.json";

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

// ✅ Ensure these functions are exported properly

export const getGoldPrice = async () => {
  const contract = await getContract();
  const price = await contract.getGoldPrice();
  return ethers.formatUnits(price, 8); // Adjust decimals if needed
};

export const mintStablecoin = async (ethAmount: string) => {
  const contract = await getContract();
  const tx = await contract.mintStablecoin({ value: ethers.parseEther(ethAmount) });
  await tx.wait();
  return tx;
};

export const redeemStablecoin = async (stablecoinAmount: string) => {
  const contract = await getContract();
  const tx = await contract.redeemStablecoin(ethers.parseUnits(stablecoinAmount, 18));
  await tx.wait();
  return tx;
};
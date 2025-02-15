import { ethers } from "ethers";
import contractAbi from "@/abi/GoldPeggedStablecoin.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;

// Function to get the contract instance with error handling
export const getContract = async () => {
  try {
    if (typeof window !== "undefined" && window.ethereum) {
      console.log("Ethereum provider detected:", window.ethereum);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
    } else {
      console.warn("No Ethereum provider detected, using RPC provider");
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      return new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, provider);
    }
  } catch (error) {
    console.error("Error initializing contract:", error);
    throw error;
  }
};

export const getGoldPrice = async () => {
  try {
    const contract = await getContract();
    const price = await contract.getGoldPrice();
    console.log("Fetched Gold Price:", ethers.formatUnits(price, 8));
    return ethers.formatUnits(price, 8); // Adjust decimals if needed
  } catch (error) {
    console.error("Error fetching gold price:", error);
    throw error;
  }
};

export const mintStablecoin = async (ethAmount: string) => {
  try {
    const contract = await getContract();
    console.log("Minting stablecoin with ETH amount:", ethAmount);
    const tx = await contract.mintStablecoin({ value: ethers.parseEther(ethAmount) });
    await tx.wait();
    console.log("Stablecoin minted successfully:", tx);
    return tx;
  } catch (error) {
    console.error("Error minting stablecoin:", error);
    throw error;
  }
};

export const redeemStablecoin = async (stablecoinAmount: string) => {
  try {
    const contract = await getContract();
    console.log("Redeeming stablecoin with amount:", stablecoinAmount);
    const tx = await contract.redeemStablecoin(ethers.parseUnits(stablecoinAmount, 18));
    await tx.wait();
    console.log("Stablecoin redeemed successfully:", tx);
    return tx;
  } catch (error) {
    console.error("Error redeeming stablecoin:", error);
    throw error;
  }
};

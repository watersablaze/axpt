import { ethers } from "ethers";
import contractAbi from "../abi/GoldPeggedStablecoin.json"; // Make sure ABI is present!

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

// Function to get the contract instance
export const getContract = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
  } else {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);
  }
};

// Fetch Gold Price
export const getGoldPrice = async () => {
  const contract = await getContract();
  const price = await contract.getGoldPrice();
  return ethers.formatUnits(price, 8); // Adjust decimals
};

// Mint Stablecoin (User deposits ETH)
export const mintStablecoin = async (ethAmount) => {
  const contract = await getContract();
  const tx = await contract.mintStablecoin({ value: ethers.parseEther(ethAmount) });
  await tx.wait();
  return tx;
};

// Redeem Stablecoin (User burns stablecoin for ETH)
export const redeemStablecoin = async (stablecoinAmount) => {
  const contract = await getContract();
  const tx = await contract.redeemStablecoin(ethers.parseUnits(stablecoinAmount, 18));
  await tx.wait();
  return tx;
};
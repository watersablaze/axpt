import { ethers } from "ethers";

// ✅ Ensure provider URL exists
const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL;
if (!providerUrl) {
  throw new Error("Provider URL is missing in environment variables.");
}

// ✅ Create a single provider instance
const provider = new ethers.JsonRpcProvider(providerUrl);

// ✅ Ensure contract address exists
const contractAddress = process.env.NEXT_PUBLIC_STABLECOIN_CONTRACT;
if (!contractAddress) {
  throw new Error("Stablecoin contract address is missing in environment variables.");
}

// ✅ Define the contract ABI
const contractABI = [
  "function mintStablecoin() external payable",
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

// ✅ Get the signer from MetaMask (if available)
export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (typeof window !== "undefined" && window.ethereum) {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    return browserProvider.getSigner();
  }
  throw new Error("MetaMask not found. Please install MetaMask.");
}

// ✅ Return the contract instance with the correct signer
export async function getStablecoinContract(): Promise<ethers.Contract> {
  const signer = await getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
}

// ✅ Export provider for other usages
export { provider };
import { ethers, BrowserProvider, JsonRpcSigner, Eip1193Provider } from "ethers";

// ✅ Ensure provider URL is defined
const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL;
if (!providerUrl) {
  throw new Error("NEXT_PUBLIC_PROVIDER_URL is missing.");
}

const provider = new ethers.JsonRpcProvider(providerUrl);

// ✅ Ensure contract address is defined
const contractAddress = process.env.NEXT_PUBLIC_STABLECOIN_CONTRACT;
if (!contractAddress) {
  throw new Error("Stablecoin contract address is missing.");
}

// ✅ Stablecoin Contract ABI
const stablecoinAbi: string[] = [
  "function transfer(address recipient, uint256 amount) external returns (bool)",
];

// ✅ Initialize Stablecoin Contract
export const stablecoinContract = new ethers.Contract(
  contractAddress,
  stablecoinAbi,
  provider
);

// ✅ Get signer from MetaMask (for browser)
export async function getSigner(): Promise<JsonRpcSigner> {
  if (typeof window !== "undefined" && (window as { ethereum?: unknown }).ethereum) {
    const ethereum = (window as { ethereum?: unknown }).ethereum as Eip1193Provider;
    const browserProvider = new BrowserProvider(ethereum);
    return browserProvider.getSigner();
  } else {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }
}

// ✅ Export provider
export { provider };
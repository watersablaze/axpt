import { ethers } from "ethers";

// ✅ Initialize provider from environment variables
const provider = new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_PROVIDER_URL || ""
);

// ✅ Ensure contract address is defined
const contractAddress = process.env.NEXT_PUBLIC_STABLECOIN_CONTRACT;
if (!contractAddress) {
  throw new Error("Stablecoin contract address is missing in environment variables.");
}

// ✅ Stablecoin Contract
export const stablecoinContract = new ethers.Contract(
  contractAddress,
  [
    "function transfer(address recipient, uint256 amount) external returns (bool)",
  ],
  provider // ✅ Use the already defined provider
);

// ✅ Get signer from MetaMask (for browser)
export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    return browserProvider.getSigner();
  } else {
    throw new Error("MetaMask not found");
  }
}

// ✅ Export provider (avoiding redeclaration)
export { provider };
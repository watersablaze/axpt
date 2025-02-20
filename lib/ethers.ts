import { ethers } from "ethers";

// Load from environment variables
const provider = new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_PROVIDER_URL || ""
);

// MetaMask connection
export function getSigner() {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  } else {
    throw new Error("MetaMask not found");
  }
}

export { provider };
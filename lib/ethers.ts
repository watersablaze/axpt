import { ethers } from "ethers";

// Load from environment variables
const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_PROVIDER_URL);

// MetaMask connection
export function getSigner() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    return provider.getSigner();
  } else {
    throw new Error("MetaMask not found");
  }
}

export { provider };
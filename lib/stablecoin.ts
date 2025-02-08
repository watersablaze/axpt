import { ethers } from "ethers";
import { provider, getSigner } from "./ethers";

const contractAddress = process.env.NEXT_PUBLIC_STABLECOIN_CONTRACT as string;

const contractABI = [
  "function mintStablecoin() external payable",
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

export function getStablecoinContract() {
  return new ethers.Contract(contractAddress, contractABI, getSigner());
}
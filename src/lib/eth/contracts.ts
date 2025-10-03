import { ethers } from 'ethers';
import AXG_ABI from './abis/GoldPeggedStablecoin.json';

const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
const AXG_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_AXG_TOKEN_ADDRESS!;

export function getAxgContract() {
  return new ethers.Contract(AXG_TOKEN_ADDRESS, AXG_ABI, provider);
}
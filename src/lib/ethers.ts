import { ethers } from "ethers";
import stablecoinABI from "@/contracts/GoldPeggedStablecoin.json";

const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_PROVIDER_URL);
const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY, provider);
const stablecoinContract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, stablecoinABI, wallet);

export { provider, wallet, stablecoinContract };
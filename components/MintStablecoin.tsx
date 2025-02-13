import { useState } from "react";
import { mintStablecoin } from "../lib/contract";

export default function MintStablecoin() {
  const [amount, setAmount] = useState("");

  const handleMint = async () => {
    if (!amount) return;
    try {
      const tx = await mintStablecoin(amount);
      alert(`Transaction successful: ${tx.hash}`);
    } catch (error) {
      console.error(error);
      alert("Transaction failed");
    }
  };

  return (
    <div>
      <h2>Mint Stablecoin</h2>
      <input
        type="number"
        placeholder="ETH Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleMint}>Mint</button>
    </div>
  );
}
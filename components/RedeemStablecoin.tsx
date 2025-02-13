import { useState } from "react";
import { redeemStablecoin } from "../lib/contract";

export default function RedeemStablecoin() {
  const [amount, setAmount] = useState("");

  const handleRedeem = async () => {
    if (!amount) return;
    try {
      const tx = await redeemStablecoin(amount);
      alert(`Transaction successful: ${tx.hash}`);
    } catch (error) {
      console.error(error);
      alert("Transaction failed");
    }
  };

  return (
    <div>
      <h2>Redeem Stablecoin</h2>
      <input
        type="number"
        placeholder="Stablecoin Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleRedeem}>Redeem</button>
    </div>
  );
}